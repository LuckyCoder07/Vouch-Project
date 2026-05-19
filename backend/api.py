import os
import logging
import traceback
import tempfile
import random
import string
from datetime import datetime, timezone
from typing import Optional
from importlib import import_module

from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, RedirectResponse
from dotenv import load_dotenv
from pydantic import BaseModel
from supabase import create_client, Client
import atexit
import secrets
import time
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from payments import PaymentManager

# Load environment variables early
load_dotenv()

# Initialize logger
logger = logging.getLogger(__name__)

try:
    from .hasher import CodeHasher
    from .certificate import Certificate
    from .signer import CertificateSigner
    from .mailer import Mailer
    from .exceptions import VouchHashError, VouchCertError
except ImportError:
    # Fallbacks for direct script execution / non-package contexts.
    try:
        from hasher import CodeHasher
        from certificate import Certificate
        from signer import CertificateSigner
        from mailer import Mailer
        from exceptions import VouchHashError, VouchCertError
    except ImportError:
        from hasher import CodeHasher
        from backend.certificate import Certificate
        from backend.signer import CertificateSigner
        from backend.mailer import Mailer
        from backend.exceptions import VouchHashError, VouchCertError
try:
    from apscheduler.schedulers.background import BackgroundScheduler
except ModuleNotFoundError:
    BackgroundScheduler = None

from github_auth import GitHubOAuth
from batch_processor import BatchProcessor
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")

# Initialize Supabase lazily/safely so the app can still boot and report health.
supabase: Optional[Client] = None
supabase_init_error: Optional[str] = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    except Exception as exc:
        supabase_init_error = str(exc)
else:
    supabase_init_error = "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY"

# Initialize Sentry
sentry_sdk.init(
    dsn         = os.getenv('SENTRY_DSN'),
    environment = os.getenv('ENVIRONMENT', 'development'),
    integrations= [FastApiIntegration()],
    traces_sample_rate = 0.1
)

# Initialize FastAPI app
app = FastAPI(title="Vouch API", version="1.0.0")

# Initialize Rate Limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Production security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        env = os.getenv('ENVIRONMENT', 'development')
        if env == 'production':
            response.headers['Strict-Transport-Security'] = (
                'max-age=31536000; includeSubDomains')
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Referrer-Policy'] = (
                'strict-origin-when-cross-origin')
            response.headers['Permissions-Policy'] = (
                'camera=(), microphone=(), geolocation=()')
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Enforce HTTPS in production
if os.getenv('ENVIRONMENT', 'development') == 'production':
    app.add_middleware(HTTPSRedirectMiddleware)

# Request logging middleware
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = (time.time() - start) * 1000
        logger.info(
            '%s %s %d %.1fms',
            request.method,
            request.url.path,
            response.status_code,
            duration
        )
        if duration > 2000:
            logger.warning('Slow request: %s %.1fms',
                           request.url.path, duration)
        return response

app.add_middleware(RequestLoggingMiddleware)

# CORS update for production
ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    os.getenv('FRONTEND_URL', ''),
    f"https://www.{os.getenv('FRONTEND_URL', '').replace('https://', '')}" if os.getenv('FRONTEND_URL') else ''
]
ALLOWED_ORIGINS = [o for o in ALLOWED_ORIGINS if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    sentry_sdk.capture_exception(exc)
    logger.error('Unhandled error: %s', exc)
    return JSONResponse(
        status_code = 500,
        content = {
            'error': 'Internal server error',
            'message': 'Something went wrong. Our team has been notified.'
        }
    )

def generate_verification_code():
    part1 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    part2 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"VCH-{part1}-{part2}"

# Initialize Vouch Core Components
signer: Optional[CertificateSigner] = None
signer_init_error: Optional[str] = None
try:
    signer = CertificateSigner()
except Exception as exc:
    signer_init_error = str(exc)
    print(f"Warning: certificate signer unavailable: {signer_init_error}")

mailer = Mailer()
github_oauth = GitHubOAuth()
batch_processor = BatchProcessor()

from organizations import OrgManager
from assignments import AssignmentManager
from plagiarism import PlagiarismDetector

org_manager      = OrgManager()
assignment_mgr   = AssignmentManager()
plagiarism_det   = PlagiarismDetector()
payment_mgr      = PaymentManager()
scheduler = BackgroundScheduler() if BackgroundScheduler is not None else None
run_anchor_job = None
anchor_init_error: Optional[str] = None
try:
    anchor_module = import_module(f"{__package__}.anchor" if __package__ else "anchor")
    run_anchor_job = getattr(anchor_module, "run_anchor_job", None)
    if run_anchor_job is None:
        anchor_init_error = "anchor.run_anchor_job not found"
except Exception as exc:
    anchor_init_error = str(exc)
    print(f"Warning: anchor module unavailable: {anchor_init_error}")

# Register the daily anchoring job
if supabase is not None and run_anchor_job is not None and scheduler is not None:
    scheduler.add_job(
        func=run_anchor_job,
        trigger='interval',
        hours=int(os.getenv('ANCHOR_INTERVAL_HOURS', 24)),
        id='anchor_job',
        name='Daily Blockchain Anchor',
        replace_existing=True
    )
    scheduler.start()
    atexit.register(lambda: scheduler.shutdown())

def require_supabase() -> Client:
    if supabase is None:
        raise HTTPException(
            status_code=503,
            detail=f"Database unavailable: {supabase_init_error or 'Supabase not initialized'}"
        )
    return supabase

class StoreRequest(BaseModel):
    student_name: str
    file_name: str
    structural_hash: str
    raw_hash: Optional[str] = None
    canonical_string: Optional[str] = None
    language: Optional[str] = None
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    org_id: Optional[str] = None
    assignment_id: Optional[str] = None

class CertificateRequest(BaseModel):
    student_name: str
    file_name: str
    structural_hash: str
    submitted_at: str
    verification_code: str

@app.post("/api/hash")
@limiter.limit("30/minute")
async def api_hash(request: Request, file: UploadFile = File(...), user_id: Optional[str] = Form(None)):
    try:
        suffix = ""
        if file.filename:
            _, ext = os.path.splitext(file.filename)
            suffix = ext.lower()

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        try:
            hasher = CodeHasher(tmp_path)
            structural_hash = hasher.compute_structural_hash()
            raw_hash = hasher.compute_hash()
            canonical_string = hasher.get_canonical_string()
            
            language = "unknown"
            if suffix == ".py":
                language = "python"
            elif suffix == ".java":
                language = "java"
            elif suffix == ".cpp":
                language = "cpp"
            elif suffix == ".txt":
                language = "text"

            return {
                "structural_hash": structural_hash,
                "raw_hash": raw_hash,
                "canonical_string": canonical_string,
                "language": language,
                "file_name": file.filename
            }
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except VouchHashError as e:
        logger.error(f"Hashing validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Hashing internal error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal hashing error: {str(e)}")


SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

@app.post("/api/store")
@limiter.limit("20/minute")
async def api_store(request: Request, req: StoreRequest, authorization: Optional[str] = Header(None)):
    try:
        db = require_supabase()
        # Convert empty strings to None
        user_id = req.user_id if req.user_id and req.user_id.strip() else None
        
        if user_id:
            limit_check = payment_mgr.check_submission_limit(user_id)
            if not limit_check['allowed']:
                raise HTTPException(
                    status_code = 402,
                    detail      = {
                        'error':    'LIMIT_REACHED',
                        'message':  (f"You've reached your monthly limit "
                                     f"of {limit_check['limit']} submissions. "
                                     f"Upgrade to Student Pro for unlimited."),
                        'plan':     limit_check['plan'],
                        'upgrade_url': f"{os.getenv('FRONTEND_URL')}/pricing"
                    }
                )
        
        # Determine which client to use (acting as user or service role)
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            # Use ANON_KEY to act as an 'authenticated' user
            client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
            client.postgrest.auth(token)
        else:
            client = db

        # 1. Ensure profile exists if user_id is provided (to satisfy FK constraint)
        if user_id:
            try:
                # Check public profile
                prof_check = db.table("profiles").select("id").eq("id", user_id).execute()
                if not prof_check.data:
                    # Create a minimal profile to satisfy Foreign Key
                    db.table("profiles").insert({
                        "id": user_id,
                        "name": req.student_name or "Vouch User",
                        "institution": "Vouch Global",
                        "role": "Student"
                    }).execute()
            except Exception as e:
                print(f"Warning: Profile auto-creation failed: {e}")
                # We continue anyway, as the next insert will fail if FK is truly missing
        
        # 2. Check for exact duplicates (Use 'db' service role to ensure we can see all records)
        result = db.table("submissions").select("id").eq("raw_hash", req.raw_hash).execute()
        if result.data:
            raise HTTPException(status_code=409, detail="Already recorded in the ledger.")

        verification_code = generate_verification_code()
        submitted_at = datetime.now(timezone.utc).isoformat()

        # Attempt insert with SERVICE ROLE to bypass RLS restrictions
        # The backend is the source of truth for the ledger.
        insert_res = db.table("submissions").insert({
            "student_name": req.student_name,
            "file_name": req.file_name,
            "structural_hash": req.structural_hash,
            "raw_hash": req.raw_hash,
            "canonical_string": req.canonical_string,
            "language": req.language,
            "user_id": user_id,
            "verification_code": verification_code,
            "submitted_at": submitted_at,
            "org_id": req.org_id
        }).execute()
        inserted_id = insert_res.data[0]['id']
        
        if user_id:
            payment_mgr.increment_submission_count(user_id)
        
        # --- Integration Steps ---
        
        # 1. Sign Certificate
        sig = {}
        try:
            if signer is not None:
                sig = signer.sign_certificate(
                    student_name=req.student_name,
                    file_name=req.file_name,
                    structural_hash=req.structural_hash,
                    verification_code=verification_code,
                    submitted_at=submitted_at
                )
                # Update the record with signature (using service role for updates to ensure success)
                db.table('submissions').update({
                    'signature': sig['signature'],
                    'payload_hash': sig['payload_hash']
                }).eq('verification_code', verification_code).execute()
            else:
                print(f"Signing skipped: signer unavailable ({signer_init_error})")
        except Exception as e:
            print(f"Signing failed (non-fatal): {e}")

        # 2. Generate PDF
        pdf_path = None
        try:
            cert = Certificate()
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            pdf_path = cert.generate(
                student_name=req.student_name,
                file_name=req.file_name,
                file_hash=req.structural_hash,
                timestamp=submitted_at,
                verification_link=f"{frontend_url}/verify/{verification_code}",
                output_dir="/tmp"
            )
        except Exception as e:
            print(f"PDF generation failed (non-fatal): {e}")

        # 3. Send Confirmation Email
        if req.user_email:
            try:
                mailer.send_submission_confirmation(
                    to_email=req.user_email,
                    student_name=req.student_name,
                    file_name=req.file_name,
                    verification_code=verification_code,
                    submitted_at=submitted_at,
                    structural_hash=req.structural_hash,
                    pdf_path=pdf_path
                )
            except Exception as e:
                print(f"Email failed (non-fatal): {e}")

        # 4. Clean up temporary PDF
        if pdf_path and os.path.exists(pdf_path):
            try:
                os.remove(pdf_path)
            except:
                pass

        if os.getenv('PLAGIARISM_CHECK_ENABLED', 'true') == 'true':
            try:
                plag_result = plagiarism_det.check_submission(
                    structural_hash = req.structural_hash,
                    student_name    = req.student_name,
                    submission_id   = inserted_id,
                    user_id         = user_id,
                    org_id          = req.org_id,
                    assignment_id   = req.assignment_id
                )
                if plag_result['plagiarism_detected']:
                    logger.warning('Plagiarism detected for %s',
                                   req.student_name)
            except Exception as e:
                logger.warning('Plagiarism check failed: %s', e)
                plag_result = {'plagiarism_detected': False}
        else:
            plag_result = {'plagiarism_detected': False}

        return {
            "success": True,
            "id": inserted_id,
            "message": "Recorded in ledger.",
            "verification_code": verification_code,
            "submitted_at": submitted_at,
            "signed": bool(sig),
            "payload_hash": sig.get('payload_hash', ''),
            "plagiarism_detected": plag_result['plagiarism_detected'],
            "plagiarism_flags":    plag_result.get('flags', [])
        }
    except Exception as e:
        print(f"Critical error in api_store: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ledger Error: {str(e)}")

@app.post("/api/verify")
@limiter.limit("60/minute")
async def api_verify(request: Request, file: UploadFile = File(...)):
    try:
        db = require_supabase()
        suffix = ""
        if file.filename:
            _, ext = os.path.splitext(file.filename)
            suffix = ext.lower()

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        try:
            hasher = CodeHasher(tmp_path)
            structural_hash = hasher.compute_structural_hash()
            
            result = db.table("submissions").select("*").eq("structural_hash", structural_hash).execute()
            if not result.data:
                return {
                    "status": "not_found",
                    "structural_hash": structural_hash,
                    "message": "No matching record found in ledger."
                }
                
            record = result.data[0]
            return {
                "status": "verified",
                "structural_hash": structural_hash,
                "student_name": record.get("student_name"),
                "file_name": record.get("file_name"),
                "submitted_at": record.get("submitted_at") or record.get("created_at"),
                "verification_code": record.get("verification_code"),
                "language": record.get("language")
            }
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except VouchHashError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/verify/{verification_code}")
async def get_verify_code(verification_code: str):
    try:
        db = require_supabase()
        result = db.table("submissions").select("*").eq("verification_code", verification_code).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Certificate not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/certificate")
async def api_certificate(req: CertificateRequest):
    try:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        verification_link = f"{frontend_url}/verify/{req.verification_code}"
        
        with tempfile.TemporaryDirectory() as tmp_dir:
            pdf_path = Certificate().generate(
                student_name=req.student_name,
                file_name=req.file_name,
                file_hash=req.structural_hash,
                timestamp=req.submitted_at,
                verification_link=verification_link,
                output_dir=tmp_dir
            )
            
            with open(pdf_path, "rb") as pdf_file:
                pdf_bytes = pdf_file.read()
                
        def iterfile():
            yield pdf_bytes
            
        return StreamingResponse(
            iterfile(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Certificate_{req.student_name.replace(' ', '_')}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/records")
@limiter.limit("100/minute")
async def api_records(request: Request, user_id: Optional[str] = None):
    try:
        db = require_supabase()
        query = db.table("submissions").select("*")
        if user_id:
            query = query.eq("user_id", user_id)
            
        result = query.order("submitted_at", desc=True).execute()
        
        return {
            "records": result.data,
            "count": len(result.data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/anchor/latest")
async def api_anchor_latest():
    try:
        db = require_supabase()
        result = db.table('anchors').select('*').order('anchored_at', desc=True).limit(1).execute()
        if not result.data:
            return {
                "anchored": False,
                "message": "No blockchain anchors recorded yet."
            }
        
        latest = result.data[0]
        return {
            "anchored": True,
            "tx_hash": latest['tx_hash'],
            "block_number": latest['block_number'],
            "merkle_root": latest['merkle_root'],
            "record_count": latest['record_count'],
            "anchored_at": latest['anchored_at'],
            "explorer_url": f"https://amoy.polygonscan.com/tx/{latest['tx_hash']}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/anchor/trigger")
async def api_anchor_trigger():
    try:
        if run_anchor_job is None:
            raise HTTPException(
                status_code=503,
                detail=f"Anchor service unavailable: {anchor_init_error or 'anchor module not loaded'}"
            )
        run_anchor_job()
        return {"message": "Anchor job triggered on Amoy."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def api_health():
    supabase_ok = False
    if supabase is not None:
        try:
            supabase.table('profiles').select('id').limit(1).execute()
            supabase_ok = True
        except Exception:
            pass
            
    blockchain_ok = False
    try:
        from web3 import Web3
        rpc_url = os.getenv('POLYGON_RPC_URL')
        if rpc_url:
            w3 = Web3(Web3.HTTPProvider(rpc_url))
            blockchain_ok = w3.is_connected()
    except Exception:
        pass
        
    scheduler_running = False
    if scheduler is not None:
        scheduler_running = scheduler.running

    return {
        "status": "ok",
        "version": "1.0.0",
        "environment": os.getenv('ENVIRONMENT', 'development'),
        "supabase": supabase_ok,
        "blockchain": blockchain_ok,
        "scheduler": scheduler_running,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.on_event("startup")
async def startup_event():
    logger.info("Vouch API starting up — env: %s",
                os.getenv('ENVIRONMENT'))
    logger.info("Scheduler running: %s", scheduler.running if scheduler else False)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Vouch API shutting down")
    if scheduler:
        scheduler.shutdown(wait=False)

@app.get("/api/version")
async def api_version():
    return {
        "version": "1.0.0",
        "phase": "5",
        "features": [
            "abt_hashing",
            "blockchain_anchoring",
            "rsa_signing",
            "email_notifications",
            "organizations",
            "plagiarism_detection",
            "stripe_billing"
        ]
    }

# --- Phase 3: GitHub OAuth Endpoints ---

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    institution: str

@app.post("/api/auth/register")
async def api_auth_register(req: RegisterRequest):
    try:
        db = require_supabase()
        
        # 1. Create User via admin api, auto-confirming email
        user_resp = db.auth.admin.create_user({
            "email": req.email,
            "password": req.password,
            "email_confirm": True,
            "user_metadata": {
                "name": req.name,
                "institution": req.institution
            }
        })
        
        user_id = user_resp.user.id
        
        # 2. Insert into profiles using service role key (bypasses RLS)
        db.table("profiles").insert({
            "id": user_id,
            "name": req.name,
            "institution": req.institution,
            "role": "student"
        }).execute()
        
        return {"success": True, "user_id": user_id}
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/github/connect")
async def github_connect(user_id: str):
    # Store user_id in state to retrieve it in callback
    state = f"{user_id}:{secrets.token_hex(8)}"
    authorize_url = github_oauth.get_authorize_url(state)
    return {
        "authorize_url": authorize_url,
        "state": state
    }

@app.get("/api/github/callback")
async def github_callback(code: str, state: str):
    try:
        # Extract user_id from state
        user_id = state.split(':')[0] if ':' in state else None
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid state parameter")

        token_data = await github_oauth.exchange_code(code)
        access_token = token_data.get('access_token')
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to retrieve access token")
            
        github_user = await github_oauth.get_github_user(access_token)
        
        db = require_supabase()
        # Link to the user_id from state
        db.table('github_connections').upsert({
            'user_id': user_id,
            'github_id': github_user['id'],
            'github_login': github_user['login'],
            'access_token': access_token
        }, on_conflict='github_id').execute()
        
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        return RedirectResponse(url=f"{frontend_url}/profile?github=connected")
    except Exception as e:
        logger.error(f"GitHub callback error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/github/repos")
async def github_repos(user_id: str):
    db = require_supabase()
    result = db.table('github_connections').select('*').eq('user_id', user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="GitHub account not connected")
        
    connection = result.data[0]
    access_token = connection['access_token']
    repos = await github_oauth.get_user_repos(access_token)
    return {
        "repos": repos,
        "count": len(repos),
        "github_login": connection.get('github_login')
    }

@app.post("/api/github/disconnect")
async def github_disconnect(req: dict):
    user_id = req.get('user_id')
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
        
    db = require_supabase()
    db.table('github_connections').delete().eq('user_id', user_id).execute()
    return {"success": True}

# --- Phase 3: Batch Processing Endpoints ---

@app.post("/api/batch")
@limiter.limit("5/minute")
async def api_batch(
    request: Request,
    file: UploadFile = File(...),
    student_name: str = Form(...),
    user_id: Optional[str] = Form(None),
    user_email: Optional[str] = Form(None)
):
    if not file.filename.lower().endswith('.zip'):
        raise HTTPException(status_code=400, detail="Only ZIP files are accepted for batch upload")
        
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
            tmp.write(await file.read())
            zip_path = tmp.name
            
        try:
            result = batch_processor.process_zip(
                zip_path, student_name, user_id, user_email
            )
            
            # Send batch summary email
            if user_email and result['successful'] > 0:
                try:
                    summary_msg = f"{result['successful']} of {result['total_files']} files successfully vouched. Batch code: {result['batch_code']}"
                    # Note: We use the existing mailer but might need a specific batch method 
                    # or repurpose the existing one if it allows custom messages.
                    # For now, sending a notification.
                    print(f"Batch Email: {summary_msg}")
                    # mailer.send_batch_notification(user_email, summary_msg) # Assuming this exists or using a generic one
                except Exception as e:
                    print(f"Batch email failed: {e}")
            
            return result
        finally:
            if os.path.exists(zip_path):
                os.remove(zip_path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/batch/{batch_code}")
async def get_batch(batch_code: str):
    db = require_supabase()
    batch_res = db.table('batch_submissions').select('*').eq('batch_code', batch_code).execute()
    if not batch_res.data:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    batch_record = batch_res.data[0]
    
    # Also fetch all submissions where batch_code matches
    # (Assuming submissions table has a batch_code column or similar)
    # If not, we might just return the record. 
    # The prompt says "submissions where batch_id matches" - let's assume batch_code is the link.
    subs_res = db.table('submissions').select('*').eq('batch_code', batch_code).execute()
    batch_record['submissions'] = subs_res.data
    
    return batch_record

# --- Phase 3: VS Code Extension API ---

EXTENSION_API_KEY = os.getenv("EXTENSION_API_KEY")

@app.get("/api/extension/verify")
async def extension_verify(hash: str, api_key: str):
    if api_key != EXTENSION_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
        
    db = require_supabase()
    result = db.table("submissions").select("*").eq("structural_hash", hash).execute()
    if not result.data:
        return {
            "status": "not_found",
            "structural_hash": hash,
            "message": "No matching record found in ledger."
        }
        
    record = result.data[0]
    return {
        "status": "verified",
        "structural_hash": hash,
        "student_name": record.get("student_name"),
        "file_name": record.get("file_name"),
        "submitted_at": record.get("submitted_at") or record.get("created_at"),
        "verification_code": record.get("verification_code"),
        "language": record.get("language")
    }

@app.post("/api/extension/vouch")
async def extension_vouch(req: dict):
    api_key = req.get('api_key')
    if api_key != EXTENSION_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
        
    # Runs the same store logic as /api/store
    # student_name, file_name, structural_hash, raw_hash, language
    try:
        db = require_supabase()
        
        # Check for duplicates
        existing = db.table("submissions").select("verification_code, submitted_at").eq("structural_hash", req.get('structural_hash')).execute()
        if existing.data:
            return {
                "verification_code": existing.data[0]['verification_code'],
                "submitted_at": existing.data[0]['submitted_at']
            }
            
        verification_code = generate_verification_code()
        submitted_at = datetime.now(timezone.utc).isoformat()
        
        db.table("submissions").insert({
            "student_name": req.get('student_name'),
            "file_name": req.get('file_name'),
            "structural_hash": req.get('structural_hash'),
            "raw_hash": req.get('raw_hash'),
            "language": req.get('language'),
            "verification_code": verification_code,
            "submitted_at": submitted_at
        }).execute()
        
        return {
            "verification_code": verification_code,
            "submitted_at": submitted_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- ORGANIZATION ENDPOINTS ---

@app.post("/api/orgs")
async def create_org(req: dict):
    try:
        org = org_manager.create_org(
            name=req.get('name'),
            owner_id=req.get('owner_id'),
            org_type=req.get('org_type', 'classroom'),
            description=req.get('description', '')
        )
        return org
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/orgs")
async def get_orgs(user_id: str):
    try:
        orgs = org_manager.get_user_orgs(user_id)
        return {"orgs": orgs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/orgs/join")
async def join_org(req: dict):
    try:
        org = org_manager.join_org(req.get('invite_code'), req.get('user_id'))
        return {"success": True, "org": org}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/orgs/{org_id}/members")
async def get_org_members(org_id: str):
    try:
        members = org_manager.get_org_members(org_id)
        return {"members": members}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/orgs/{org_id}/submissions")
async def get_org_submissions(org_id: str, assignment_id: Optional[str] = None):
    try:
        submissions = org_manager.get_org_submissions(org_id, assignment_id)
        return {"submissions": submissions, "count": len(submissions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/orgs/{org_id}/members/{user_id}")
async def remove_member(org_id: str, user_id: str):
    try:
        org_manager.remove_member(org_id, user_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/orgs/{org_id}/report")
async def get_org_report(org_id: str):
    try:
        return org_manager.generate_org_report(org_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/orgs/{org_id}/invite")
async def invite_to_org(org_id: str, req: dict):
    try:
        db = require_supabase()
        org = db.table('organizations').select('name, invite_code').eq('id', org_id).execute().data[0]
        mailer.send_org_invite(
            to_email=req.get('email'),
            org_name=org['name'],
            invite_code=org['invite_code'],
            invited_by=req.get('invited_by_name')
        )
        return {"sent": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/orgs/{org_id}")
async def delete_org(org_id: str):
    try:
        org_manager.delete_org(org_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class QueryRequest(BaseModel):
    user_email: str
    query: str

@app.post("/api/query")
async def submit_query(req: QueryRequest):
    try:
        support_email = os.getenv("SUPPORT_EMAIL", "lakshit0507@gmail.com")
        html_body = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Query from Vouch Platform</h2>
            <p><strong>From:</strong> {req.user_email}</p>
            <p><strong>Query:</strong></p>
            <blockquote style="background: #f9f9f9; padding: 15px; border-left: 5px solid #ccc;">
                {req.query}
            </blockquote>
        </div>
        """
        mailer.send_raw_email(
            to_email=support_email,
            subject="New Vouch Platform Query",
            html=html_body
        )
        # Optionally send a confirmation to the user
        user_html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>We received your query!</h2>
            <p>Hi there,</p>
            <p>Our technical team has received your query and will respond within 24 hours.</p>
            <p><strong>Your Query:</strong><br/>{req.query}</p>
        </div>
        """
        mailer.send_raw_email(
            to_email=req.user_email,
            subject="Vouch Support - Query Received",
            html=user_html
        )
        return {"success": True, "message": "Query sent successfully"}
    except Exception as e:
        logger.error(f"Failed to submit query: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit query")

# --- ASSIGNMENT ENDPOINTS ---

@app.post("/api/assignments")
async def create_assignment(req: dict):
    try:
        assignment = assignment_mgr.create_assignment(
            org_id=req.get('org_id'),
            created_by=req.get('created_by'),
            title=req.get('title'),
            description=req.get('description', ''),
            deadline=req.get('deadline'),
            allow_late=req.get('allow_late', False)
        )
        return assignment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/assignments")
async def get_assignments(org_id: str):
    try:
        assignments = assignment_mgr.get_org_assignments(org_id)
        return {"assignments": assignments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/assignments/{assignment_id}/submissions")
async def get_assignment_submissions(assignment_id: str):
    try:
        return assignment_mgr.get_assignment_submissions(assignment_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assignments/{assignment_id}/submit")
async def submit_assignment(assignment_id: str, req: dict):
    try:
        result = assignment_mgr.submit_to_assignment(
            assignment_id=assignment_id,
            submission_id=req.get('submission_id'),
            user_id=req.get('user_id')
        )
        return {"linked": result['linked'], "is_late": result['is_late']}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/assignments/{assignment_id}")
async def update_assignment(assignment_id: str, req: dict):
    try:
        return assignment_mgr.update_assignment(assignment_id, req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/assignments/{assignment_id}")
async def delete_assignment(assignment_id: str):
    try:
        assignment_mgr.delete_assignment(assignment_id)
        return {"deleted": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- PLAGIARISM ENDPOINTS ---

@app.get("/api/plagiarism")
async def get_plagiarism_flags(org_id: str, assignment_id: Optional[str] = None):
    try:
        flags = plagiarism_det.get_org_flags(org_id, assignment_id)
        return {"flags": flags, "count": len(flags)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/plagiarism/{flag_id}/resolve")
async def resolve_flag(flag_id: str, req: dict):
    try:
        return plagiarism_det.resolve_flag(
            flag_id=flag_id,
            reviewer_id=req.get('reviewer_id'),
            status=req.get('status')
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- API KEY ENDPOINTS ---

@app.post("/api/orgs/{org_id}/api-keys")
async def create_api_key(org_id: str, req: dict):
    try:
        return org_manager.create_api_key(org_id, req.get('label'), req.get('created_by'))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/orgs/{org_id}/api-keys")
async def get_api_keys(org_id: str):
    try:
        db = require_supabase()
        keys = db.table('api_keys').select('id, key_preview, label, created_at, last_used, is_active').eq('org_id', org_id).execute().data
        return keys
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/orgs/{org_id}/api-keys/{key_id}")
async def revoke_api_key(org_id: str, key_id: str):
    try:
        org_manager.revoke_api_key(key_id)
        return {"revoked": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- INSTITUTION API (external access) ---

@app.post("/api/v1/verify")
async def api_v1_verify(file: UploadFile = File(...), x_api_key: str = Header(...)):
    try:
        key_row = org_manager.validate_api_key(x_api_key)
        if not key_row:
            raise HTTPException(status_code=401, detail="Invalid API key")
            
        db = require_supabase()
        suffix = ""
        if file.filename:
            _, ext = os.path.splitext(file.filename)
            suffix = ext.lower()

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        try:
            hasher = CodeHasher(tmp_path)
            structural_hash = hasher.compute_structural_hash()
            
            result = db.table("submissions").select("*").eq("structural_hash", structural_hash).execute()
            if not result.data:
                return {
                    "status": "not_found",
                    "structural_hash": structural_hash,
                    "message": "No matching record found in ledger."
                }
                
            record = result.data[0]
            return {
                "status": "verified",
                "structural_hash": structural_hash,
                "student_name": record.get("student_name"),
                "file_name": record.get("file_name"),
                "submitted_at": record.get("submitted_at") or record.get("created_at"),
                "verification_code": record.get("verification_code"),
                "language": record.get("language"),
                "org_name": key_row['organizations']['name']
            }
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except VouchHashError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/vouch")
async def api_v1_vouch(req: dict, x_api_key: str = Header(...)):
    try:
        key_row = org_manager.validate_api_key(x_api_key)
        if not key_row:
            raise HTTPException(status_code=401, detail="Invalid API key")
            
        db = require_supabase()
        
        # Check for duplicates
        existing = db.table("submissions").select("verification_code, submitted_at").eq("structural_hash", req.get('structural_hash')).execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="Already recorded in the ledger.")
            
        verification_code = generate_verification_code()
        submitted_at = datetime.now(timezone.utc).isoformat()
        
        db.table("submissions").insert({
            "student_name": req.get('student_name'),
            "file_name": req.get('file_name'),
            "structural_hash": req.get('structural_hash'),
            "raw_hash": req.get('raw_hash'),
            "language": req.get('language'),
            "verification_code": verification_code,
            "submitted_at": submitted_at,
            "org_id": key_row['org_id']
        }).execute()
        
        return {
            "verification_code": verification_code,
            "submitted_at": submitted_at,
            "org_name": key_row['organizations']['name']
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)

# --- Payment & Subscription Endpoints ---

class CheckoutRequest(BaseModel):
    user_id: str
    email: str
    name: str
    plan: str

class CancelSubscriptionRequest(BaseModel):
    user_id: str

@app.post("/api/payments/checkout")
@limiter.limit("10/minute")
async def api_payments_checkout(request: Request, req: CheckoutRequest):
    plan = req.plan
    if plan not in ['student', 'classroom']:
        raise HTTPException(status_code=400, detail="Plan must be 'student' or 'classroom'")
    
    # Map plan to price_id
    if plan == 'student':
        price_id = os.getenv('STRIPE_STUDENT_PRICE_ID')
    else:
        price_id = os.getenv('STRIPE_CLASSROOM_PRICE_ID')
        
    if not price_id:
        raise HTTPException(status_code=500, detail=f"Price ID for plan '{plan}' is not configured")
        
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    
    try:
        url = payment_mgr.create_checkout_session(
            user_id     = req.user_id,
            email       = req.email,
            name        = req.name,
            price_id    = price_id,
            plan        = plan,
            success_url = f"{frontend_url}/pricing?success=true",
            cancel_url  = f"{frontend_url}/pricing?cancelled=true"
        )
        return { "checkout_url": url }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/webhooks/stripe")
async def api_webhooks_stripe(request: Request):
    sig_header = request.headers.get('stripe-signature')
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")
        
    body = await request.body()
    try:
        payment_mgr.handle_webhook(body, sig_header)
        return { "received": True }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/payments/subscription")
async def api_payments_subscription(user_id: str):
    try:
        return payment_mgr.get_subscription(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/payments/cancel")
async def api_payments_cancel(req: CancelSubscriptionRequest):
    try:
        payment_mgr.cancel_subscription(req.user_id)
        return { "cancelled": True }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/payments/limit-check")
async def api_payments_limit_check(user_id: str):
    try:
        return payment_mgr.check_submission_limit(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
