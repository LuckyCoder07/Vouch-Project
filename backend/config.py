import os

# Supported source file extensions for hashing
SUPPORTED_EXTS = {".py", ".java", ".cpp", ".txt"}

OUTPUT_DIR = os.getenv("VOUCH_OUTPUT_DIR", ".")
LOG_LEVEL  = os.getenv("VOUCH_LOG_LEVEL",  "INFO")