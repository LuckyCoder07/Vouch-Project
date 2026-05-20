import os
import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict
from pathlib import Path

try:
    from web3 import Web3
except ModuleNotFoundError:
    Web3 = None
from dotenv import load_dotenv
from supabase import create_client, Client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("VouchAnchor")

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).resolve().parent / '.env')

class SupabaseDelegate:
    _client = None
    
    @property
    def client(self):
        if SupabaseDelegate._client is None:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_SERVICE_KEY")
            if url and key:
                try:
                    SupabaseDelegate._client = create_client(url, key)
                except Exception as exc:
                    logger.warning("Supabase client init failed for anchor job: %s", exc)
        return SupabaseDelegate._client

    def __getattr__(self, name):
        c = self.client
        if c is None:
            raise RuntimeError("Supabase client not initialized")
        return getattr(c, name)

supabase = SupabaseDelegate()

class MerkleTree:
    def __init__(self, leaves: List[str]):
        # Hash each leaf using SHA3-256
        self.leaves = [
            hashlib.sha3_256(l.encode()).hexdigest() 
            for l in leaves
        ]

    def _hash_pair(self, a: str, b: str) -> str:
        # Sort to ensure consistent ordering (Merkle Canonical)
        combined = a + b if a < b else b + a
        return hashlib.sha3_256(combined.encode()).hexdigest()

    def get_root(self) -> str:
        if not self.leaves:
            # Hash of 'empty' for empty trees
            return hashlib.sha3_256(b'empty').hexdigest()
            
        layer = self.leaves[:]
        while len(layer) > 1:
            # If odd number of nodes, duplicate the last one
            if len(layer) % 2 == 1:
                layer.append(layer[-1])
            
            new_layer = []
            for i in range(0, len(layer), 2):
                new_layer.append(self._hash_pair(layer[i], layer[i+1]))
            layer = new_layer
            
        return layer[0]

class BlockchainAnchor:
    def __init__(self):
        if Web3 is None:
            raise RuntimeError("web3 is not installed. Install it to enable blockchain anchoring.")
        self.rpc_url = os.getenv('POLYGON_RPC_URL')
        self.private_key = os.getenv('WALLET_PRIVATE_KEY')
        self.chain_id = int(os.getenv('CHAIN_ID', 80002))
        
        if not self.rpc_url or not self.private_key:
            raise ValueError("Missing Blockchain credentials in .env")
            
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.account = self.w3.eth.account.from_key(self.private_key)

    def is_connected(self) -> bool:
        try:
            return self.w3.is_connected()
        except Exception:
            return False

    def anchor_root(self, merkle_root: str, record_count: int) -> Dict:
        """
        Writes merkle_root to Polygon Amoy (chain ID 80002)
        as a self-transfer transaction with the merkle root
        encoded as input data.
        """
        if not self.is_connected():
            raise RuntimeError('Not connected to Polygon Amoy network')

        # Format: VOUCH:ROOT_HASH:COUNT
        data_str = f'VOUCH:{merkle_root}:{record_count}'
        data_bytes = data_str.encode()
        
        nonce = self.w3.eth.get_transaction_count(self.account.address)

        tx = {
            'nonce': nonce,
            'to': self.account.address,
            'value': 0,
            'gas': 50000,
            'gasPrice': self.w3.eth.gas_price,
            'data': data_bytes,
            'chainId': self.chain_id
        }

        signed = self.w3.eth.account.sign_transaction(tx, self.private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        
        logger.info(f"Transaction sent: {tx_hash.hex()}. Waiting for receipt...")
        
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        return {
            'tx_hash': tx_hash.hex(),
            'block_number': receipt.blockNumber,
            'merkle_root': merkle_root,
            'record_count': record_count,
            'anchored_at': datetime.now(timezone.utc).isoformat(),
            'gas_used': receipt.gasUsed,
            'explorer_url': f'https://amoy.polygonscan.com/tx/{tx_hash.hex()}'
        }

def run_anchor_job():
    try:
        if supabase.client is None:
            logger.warning("Skipping anchor job: database is not configured.")
            return
        # 1. Fetch unanchored submissions
        result = (supabase.table('submissions')
                  .select('structural_hash, submitted_at')
                  .eq('anchored', False)
                  .order('submitted_at')
                  .execute())

        records = result.data
        if not records:
            logger.info('No unanchored submissions found. Skipping job.')
            return

        logger.info(f"Found {len(records)} unanchored records. Generating Merkle Tree...")

        # 2. Build Merkle Tree
        hashes = [r['structural_hash'] for r in records]
        tree = MerkleTree(hashes)
        root = tree.get_root()
        
        logger.info(f"Merkle Root generated: {root}")

        # 3. Anchor to Blockchain
        anchor = BlockchainAnchor()
        if not anchor.is_connected():
            logger.error('Polygon Amoy network not reachable. Skipping.')
            return

        logger.info("Anchoring to Polygon Amoy...")
        anchor_result = anchor.anchor_root(root, len(hashes))

        # 4. Record the anchor in Supabase
        supabase.table('anchors').insert({
            'tx_hash': anchor_result['tx_hash'],
            'block_number': anchor_result['block_number'],
            'merkle_root': anchor_result['merkle_root'],
            'record_count': anchor_result['record_count'],
            'anchored_at': anchor_result['anchored_at'],
            'gas_used': anchor_result['gas_used'],
            'explorer_url': anchor_result['explorer_url']
        }).execute()

        # 5. Mark submissions as anchored
        # We update each hash individually to ensure consistency
        for record in records:
            (supabase.table('submissions')
             .update({'anchored': True})
             .eq('structural_hash', record['structural_hash'])
             .execute())

        logger.info(f"Anchor job complete. {len(hashes)} records successfully anchored to Polygon.")
        logger.info(f"Transaction: {anchor_result['explorer_url']}")

    except Exception as e:
        logger.error(f"Anchor job failed: {str(e)}")

if __name__ == '__main__':
    print('--- Vouch Blockchain Anchoring Service ---')
    print('Target: Polygon Amoy Testnet (Chain ID 80002)')
    run_anchor_job()
    print('Done.')
