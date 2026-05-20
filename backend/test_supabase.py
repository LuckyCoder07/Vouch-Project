import os
import sys
import traceback
from dotenv import load_dotenv
from supabase import create_client

print("Importing dependencies EXCEPT Sentry...", flush=True)
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, RedirectResponse
from pydantic import BaseModel
import atexit
import secrets
import time
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from payments import PaymentManager
from github_auth import GitHubOAuth
from batch_processor import BatchProcessor
from organizations import OrgManager
from assignments import AssignmentManager
from plagiarism import PlagiarismDetector

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

try:
    print("Running query...", flush=True)
    client = create_client(url, key)
    res = client.table("submissions").select("*").eq("user_id", "04defb5e-5d44-4c3a-88e7-9fdd3358a3ea").order("submitted_at", desc=True).execute()
    print(f"SUCCESS! Fetched {len(res.data)} records.", flush=True)
except Exception as e:
    traceback.print_exc()
