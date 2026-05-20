import os

# Supported source file extensions for hashing
SUPPORTED_EXTS = {
    ".py",
    ".java",
    ".cpp", ".c", ".h",          # C / C++
    ".js", ".jsx", ".ts", ".tsx",  # JavaScript / TypeScript
    ".json",
    ".txt",
}

OUTPUT_DIR = os.getenv("VOUCH_OUTPUT_DIR", ".")
LOG_LEVEL  = os.getenv("VOUCH_LOG_LEVEL",  "INFO")