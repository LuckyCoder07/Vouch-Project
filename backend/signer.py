import os
import hashlib
import base64
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("VouchSigner")

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).resolve().parent / '.env')

class CertificateSigner:
    def __init__(self):
        private_key_pem = os.getenv('VOUCH_PRIVATE_KEY')
        public_key_pem = os.getenv('VOUCH_PUBLIC_KEY')
        
        # Try loading private key from environment first, then fallback to file
        if private_key_pem:
            try:
                # Clean up any escaped newlines if passed in single-line env formats
                key_data = private_key_pem.replace("\\n", "\n").encode('utf-8')
                self.private_key = serialization.load_pem_private_key(
                    key_data, 
                    password=None, 
                    backend=default_backend()
                )
                logger.info("Loaded private key from environment variable.")
            except Exception as e:
                logger.error(f"Failed to load private key from environment variable: {str(e)}")
                raise e
        else:
            private_key_path = os.getenv('PRIVATE_KEY_PATH', 'vouch_private.pem')
            if not os.path.isabs(private_key_path):
                private_key_path = str(Path(__file__).resolve().parent / private_key_path)
            if not os.path.exists(private_key_path):
                raise FileNotFoundError(f"Private key not found at {private_key_path} and VOUCH_PRIVATE_KEY env is empty")
            try:
                with open(private_key_path, 'rb') as f:
                    self.private_key = serialization.load_pem_private_key(
                        f.read(), 
                        password=None, 
                        backend=default_backend()
                    )
                logger.info(f"Loaded private key from file: {private_key_path}")
            except Exception as e:
                logger.error(f"Failed to load private key from file: {str(e)}")
                raise e

        # Try loading public key from environment first, then fallback to file
        if public_key_pem:
            try:
                key_data = public_key_pem.replace("\\n", "\n").encode('utf-8')
                self.public_key = serialization.load_pem_public_key(
                    key_data, 
                    backend=default_backend()
                )
                logger.info("Loaded public key from environment variable.")
            except Exception as e:
                logger.error(f"Failed to load public key from environment variable: {str(e)}")
                raise e
        else:
            public_key_path = os.getenv('PUBLIC_KEY_PATH', 'vouch_public.pem')
            if not os.path.isabs(public_key_path):
                public_key_path = str(Path(__file__).resolve().parent / public_key_path)
            if not os.path.exists(public_key_path):
                raise FileNotFoundError(f"Public key not found at {public_key_path} and VOUCH_PUBLIC_KEY env is empty")
            try:
                with open(public_key_path, 'rb') as f:
                    self.public_key = serialization.load_pem_public_key(
                        f.read(), 
                        backend=default_backend()
                    )
                logger.info(f"Loaded public key from file: {public_key_path}")
            except Exception as e:
                logger.error(f"Failed to load public key from file: {str(e)}")
                raise e

    def sign_certificate(
        self,
        student_name: str,
        file_name: str,
        structural_hash: str,
        verification_code: str,
        submitted_at: str
    ) -> dict:
        # Create a canonical JSON payload
        payload_data = {
            'student_name': student_name,
            'file_name': file_name,
            'structural_hash': structural_hash,
            'verification_code': verification_code,
            'submitted_at': submitted_at,
            'issuer': 'Vouch Code Notary'
        }
        
        # sort_keys=True and separators ensure the JSON string is deterministic
        payload = json.dumps(payload_data, sort_keys=True, separators=(',', ':'))

        payload_bytes = payload.encode('utf-8')
        payload_hash = hashlib.sha3_256(payload_bytes).hexdigest()

        # Sign using RSA-PSS
        signature_bytes = self.private_key.sign(
            payload_bytes,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )

        return {
            'payload': payload,
            'payload_hash': payload_hash,
            'signature': base64.b64encode(signature_bytes).decode('utf-8'),
            'signed_at': datetime.now(timezone.utc).isoformat(),
            'algorithm': 'RSA-PSS-SHA256'
        }

    def verify_signature(self, payload: str, signature_b64: str) -> bool:
        try:
            self.public_key.verify(
                base64.b64decode(signature_b64),
                payload.encode('utf-8'),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except Exception as e:
            logger.debug(f"Signature verification failed: {str(e)}")
            return False

    def get_public_key_fingerprint(self) -> str:
        pub_bytes = self.public_key.public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo
        )
        return hashlib.sha256(pub_bytes).hexdigest()[:16].upper()

if __name__ == '__main__':
    try:
        signer = CertificateSigner()
        logger.info(f"Fingerprint: {signer.get_public_key_fingerprint()}")
        
        result = signer.sign_certificate(
            student_name='Jane Doe',
            file_name='assignment.py',
            structural_hash='abc123',
            verification_code='VCH-TEST-1234',
            submitted_at='2025-01-01T00:00:00Z'
        )
        
        valid = signer.verify_signature(result['payload'], result['signature'])
        print('Valid:', valid)
        assert valid == True
        print('Signer test PASSED')
    except Exception as e:
        print(f"Signer test FAILED: {str(e)}")
