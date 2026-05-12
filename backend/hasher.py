import ast
import hashlib
import os
import re
from pathlib import Path

try:
    from .config import SUPPORTED_EXTS
    from .exceptions import VouchHashError
except ImportError:
    from config import SUPPORTED_EXTS
    from exceptions import VouchHashError


class CodeHasher:
    """Computes both raw and structural hashes for source files."""

    def __init__(self, file_path: str) -> None:
        self.file_path = file_path
        self._canonical_string: str | None = None
        self._validate_input()

    def _validate_input(self) -> None:
        if not self.file_path:
            raise VouchHashError("file_path is required.")
        if not os.path.exists(self.file_path):
            raise VouchHashError(f"File does not exist: {self.file_path}")
        if not os.path.isfile(self.file_path):
            raise VouchHashError(f"Path is not a file: {self.file_path}")

        ext = Path(self.file_path).suffix.lower()
        if ext not in SUPPORTED_EXTS:
            raise VouchHashError(
                f"Unsupported file extension '{ext}'. Supported: {sorted(SUPPORTED_EXTS)}"
            )

    def _read_bytes(self) -> bytes:
        try:
            with open(self.file_path, "rb") as f:
                return f.read()
        except OSError as exc:
            raise VouchHashError(f"Unable to read file bytes: {exc}") from exc

    def _read_text(self) -> str:
        try:
            with open(self.file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except OSError as exc:
            raise VouchHashError(f"Unable to read file text: {exc}") from exc

    def _canonicalize_python(self, source: str) -> str:
        try:
            tree = ast.parse(source)
            return ast.dump(tree, annotate_fields=True, include_attributes=False)
        except SyntaxError:
            # If parsing fails, still produce deterministic canonical text.
            return " ".join(source.split())

    @staticmethod
    def _strip_block_and_line_comments(source: str) -> str:
        source = re.sub(r"/\*.*?\*/", "", source, flags=re.S)
        source = re.sub(r"//.*?$", "", source, flags=re.M)
        source = re.sub(r"#.*?$", "", source, flags=re.M)
        return source

    def _build_canonical_string(self) -> str:
        ext = Path(self.file_path).suffix.lower()
        source = self._read_text()

        if ext == ".py":
            return self._canonicalize_python(source)

        cleaned = self._strip_block_and_line_comments(source)
        return " ".join(cleaned.split())

    def get_canonical_string(self) -> str:
        if self._canonical_string is None:
            self._canonical_string = self._build_canonical_string()
        return self._canonical_string

    def compute_structural_hash(self) -> str:
        canonical = self.get_canonical_string()
        return hashlib.sha3_256(canonical.encode("utf-8")).hexdigest()

    def compute_hash(self) -> str:
        raw_bytes = self._read_bytes()
        return hashlib.sha256(raw_bytes).hexdigest()
