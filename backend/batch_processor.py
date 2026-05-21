import os
import zipfile
import tempfile
import logging
import random
import string
from datetime import datetime, timezone

from hasher import CodeHasher
from exceptions import VouchHashError
from supabase import create_client
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).resolve().parent / '.env')

class SupabaseDelegate:
    _client = None
    
    def __getattr__(self, name):
        if SupabaseDelegate._client is None:
            url = os.environ.get("SUPABASE_URL", "")
            key = os.environ.get("SUPABASE_SERVICE_KEY", "")
            SupabaseDelegate._client = create_client(url, key)
        return getattr(SupabaseDelegate._client, name)

supabase = SupabaseDelegate()

# Initialize logger
logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {'.py', '.java', '.cpp', '.txt'}

def generate_batch_code() -> str:
    prefix = 'BCH'
    parts = [''.join(random.choices(
                string.ascii_uppercase + string.digits, 
                k=4)) for _ in range(2)]
    return f"{prefix}-{'-'.join(parts)}"

class BatchProcessor:

    def process_zip(
        self,
        zip_path: str,
        student_name: str,
        user_id: str | None = None,
        user_email: str | None = None
    ) -> dict:
        """
        Extracts a ZIP, hashes every supported code file,
        stores each in the ledger, returns batch report.
        
        Returns: {
            batch_code: str,
            total_files: int,
            successful: int,
            failed: int,
            results: list of per-file result dicts,
            submitted_at: str
        }
        """
        if not zipfile.is_zipfile(zip_path):
            raise ValueError('Uploaded file is not a valid ZIP.')

        batch_code = generate_batch_code()
        results = []
        successful = 0
        failed = 0
        zip_filename = os.path.basename(zip_path)

        with tempfile.TemporaryDirectory() as extract_dir:
            with zipfile.ZipFile(zip_path, 'r') as zf:
                # Security check: prevent zip slip attacks
                for member in zf.namelist():
                    member_path = os.path.realpath(
                        os.path.join(extract_dir, member))
                    if not member_path.startswith(
                        os.path.realpath(extract_dir)):
                        raise ValueError(f'Unsafe path in ZIP: {member}')
                zf.extractall(extract_dir)

            # Walk all extracted files
            for root, dirs, files in os.walk(extract_dir):
                # Skip hidden directories like __pycache__, .git
                dirs[:] = [d for d in dirs 
                           if not d.startswith('.') 
                           and d != '__pycache__']
                
                for filename in files:
                    # Skip macOS metadata files and hidden files
                    if filename.startswith('._') or filename.startswith('.'):
                        continue

                    ext = os.path.splitext(filename)[1].lower()
                    if ext not in SUPPORTED_EXTENSIONS:
                        results.append({
                            'file_name': filename,
                            'status': 'skipped',
                            'reason': f'Unsupported extension {ext}'
                        })
                        continue

                    file_path = os.path.join(root, filename)
                    
                    try:
                        hasher = CodeHasher(file_path)
                        structural_hash = hasher.compute_structural_hash()
                        raw_hash = hasher.compute_hash()
                        canonical_string = hasher.get_canonical_string()

                        # Check for duplicate
                        existing = (supabase.table('submissions')
                                    .select('id, verification_code')
                                    .eq('raw_hash', raw_hash)
                                    .execute())

                        if existing.data:
                            results.append({
                                'file_name': filename,
                                'status': 'duplicate',
                                'raw_hash': raw_hash,
                                'verification_code': existing.data[0]['verification_code'],
                                'reason': 'Exact file already in ledger'
                            })
                            successful += 1
                            continue

                        # Generate verification code
                        vc_parts = [''.join(random.choices(
                                      string.ascii_uppercase + string.digits, k=4))
                                    for _ in range(2)]
                        verification_code = f'VCH-{"-".join(vc_parts)}'

                        timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

                        # Map extension to language name
                        lang_map = {'.py': 'python', '.java': 'java', '.cpp': 'cpp', '.txt': 'text'}
                        language = lang_map.get(ext, ext.lstrip('.'))

                        # Insert into submissions
                        supabase.table('submissions').insert({
                            'student_name': student_name,
                            'file_name': filename,
                            'structural_hash': structural_hash,
                            'raw_hash': raw_hash,
                            'canonical_string': canonical_string,
                            'language': language,
                            'user_id': user_id,
                            'verification_code': verification_code,
                            'submitted_at': timestamp,
                            'batch_code': batch_code,
                            'anchored': False
                        }).execute()

                        results.append({
                            'file_name': filename,
                            'status': 'success',
                            'structural_hash': structural_hash,
                            'verification_code': verification_code,
                            'submitted_at': timestamp
                        })
                        successful += 1

                    except VouchHashError as e:
                        results.append({
                            'file_name': filename,
                            'status': 'error',
                            'reason': str(e)
                        })
                        failed += 1

                    except Exception as e:
                        logger.error('Error processing %s: %s', filename, e)
                        results.append({
                            'file_name': filename,
                            'status': 'error',
                            'reason': 'Unexpected error'
                        })
                        failed += 1

        submitted_at = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

        # Store batch record
        supabase.table('batch_submissions').insert({
            'student_name': student_name,
            'zip_file_name': zip_filename,
            'total_files': len(results),
            'successful': successful,
            'failed': failed,
            'batch_code': batch_code,
            'user_id': user_id
        }).execute()

        return {
            'batch_code': batch_code,
            'total_files': len(results),
            'successful': successful,
            'failed': failed,
            'results': results,
            'submitted_at': submitted_at
        }
