import os

# ---------------------------------------------------------------------------
# Vouch – Central Configuration
# Override any value by setting the corresponding environment variable,
# or by placing a .env file in the project root and loading it with
# `pip install python-dotenv` + `from dotenv import load_dotenv; load_dotenv()`.
# ---------------------------------------------------------------------------

CREDENTIALS_FILE = os.getenv("VOUCH_CREDENTIALS", "credentials.json")
SHEET_NAME       = os.getenv("VOUCH_SHEET_NAME",  "Vouch Ledger")
SUPPORTED_EXTS   = {".py", ".java", ".cpp", ".txt"}
OUTPUT_DIR       = os.getenv("VOUCH_OUTPUT_DIR",   ".")
LOG_LEVEL        = os.getenv("VOUCH_LOG_LEVEL",    "INFO")