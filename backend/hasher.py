import ast
import builtins
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


class ASTAnonymizer(ast.NodeTransformer):
    """AST Transformer to anonymize Python code by renaming identifiers and stripping docstrings."""

    def __init__(self) -> None:
        self.func_map = {}
        self.arg_map = {}
        self.var_map = {}
        self.class_map = {}

        self.func_counter = 0
        self.arg_counter = 0
        self.var_counter = 0
        self.class_counter = 0

        self.builtins = set(dir(builtins))

    def _get_mapped_name(self, name: str, category: str) -> str:
        if name in self.builtins:
            return name
        if name in self.func_map:
            return self.func_map[name]
        if name in self.arg_map:
            return self.arg_map[name]
        if name in self.class_map:
            return self.class_map[name]
        if name in self.var_map:
            return self.var_map[name]

        if category == "function":
            mapped = f"f{self.func_counter}"
            self.func_counter += 1
            self.func_map[name] = mapped
            return mapped
        elif category == "argument":
            mapped = f"a{self.arg_counter}"
            self.arg_counter += 1
            self.arg_map[name] = mapped
            return mapped
        elif category == "class":
            mapped = f"c{self.class_counter}"
            self.class_counter += 1
            self.class_map[name] = mapped
            return mapped
        else:
            mapped = f"v{self.var_counter}"
            self.var_counter += 1
            self.var_map[name] = mapped
            return mapped

    def _remove_docstring(self, body: list) -> list:
        if not body:
            return body
        first = body[0]
        if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant) and isinstance(first.value.value, str):
            return body[1:]
        # Backward compatibility for python < 3.8
        if isinstance(first, ast.Expr) and isinstance(first.value, ast.Str):
            return body[1:]
        return body

    def visit_Module(self, node: ast.Module) -> ast.Module:
        node.body = self._remove_docstring(node.body)
        return self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> ast.FunctionDef:
        node.name = self._get_mapped_name(node.name, "function")
        node.body = self._remove_docstring(node.body)
        self.generic_visit(node.args)
        node.body = [self.visit(stmt) for stmt in node.body]
        return node

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> ast.AsyncFunctionDef:
        node.name = self._get_mapped_name(node.name, "function")
        node.body = self._remove_docstring(node.body)
        self.generic_visit(node.args)
        node.body = [self.visit(stmt) for stmt in node.body]
        return node

    def visit_ClassDef(self, node: ast.ClassDef) -> ast.ClassDef:
        node.name = self._get_mapped_name(node.name, "class")
        node.body = self._remove_docstring(node.body)
        node.decorator_list = [self.visit(d) for d in node.decorator_list]
        node.bases = [self.visit(b) for b in node.bases]
        node.body = [self.visit(stmt) for stmt in node.body]
        return node

    def visit_arg(self, node: ast.arg) -> ast.arg:
        node.arg = self._get_mapped_name(node.arg, "argument")
        if node.annotation:
            node.annotation = self.visit(node.annotation)
        return node

    def visit_Name(self, node: ast.Name) -> ast.Name:
        node.id = self._get_mapped_name(node.id, "variable")
        return node

    def visit_alias(self, node: ast.alias) -> ast.alias:
        local_name = node.asname if node.asname else node.name
        if "." in local_name:
            local_name = local_name.split(".")[0]
        mapped_local = self._get_mapped_name(local_name, "variable")
        node.asname = mapped_local
        return node


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
            transformer = ASTAnonymizer()
            new_tree = transformer.visit(tree)
            ast.fix_missing_locations(new_tree)
            return ast.unparse(new_tree)
        except Exception:
            # Fall back to stripping comments and whitespace if parsing fails
            cleaned = self._strip_block_and_line_comments(source)
            return " ".join(cleaned.split())

    @staticmethod
    def _strip_block_and_line_comments(source: str) -> str:
        source = re.sub(r"/\*.*?\*/", "", source, flags=re.S)
        source = re.sub(r"//.*?$", "", source, flags=re.M)
        source = re.sub(r"#.*?$", "", source, flags=re.M)
        return source

    def _canonicalize_regex(self, source: str) -> str:
        # 1. Strip comments
        source = self._strip_block_and_line_comments(source)

        # 2. Extract mappings
        class_map = {}
        func_map = {}
        var_map = {}

        class_counter = 0
        func_counter = 0
        var_counter = 0

        KEYWORDS = {
            "if", "else", "while", "for", "return", "class", "public", "private",
            "protected", "static", "const", "void", "int", "double", "float",
            "char", "bool", "boolean", "long", "short", "byte", "import", "package",
            "new", "this", "true", "false", "null", "main"
        }

        # Find classes
        for m in re.finditer(r"\bclass\s+([a-zA-Z_][a-zA-Z0-9_]*)\b", source):
            name = m.group(1)
            if name not in KEYWORDS and name not in class_map:
                class_map[name] = f"c{class_counter}"
                class_counter += 1

        # Find variables and functions
        decl_pattern = r"\b(?:const\s+)?(?:int|String|double|float|char|bool|boolean|long|short|byte|void|auto)\s*[\*&]?\s*([a-zA-Z_][a-zA-Z0-9_]*)\b"
        for m in re.finditer(decl_pattern, source):
            name = m.group(1)
            if name in KEYWORDS:
                continue

            end_idx = m.end()
            # Find next non-whitespace char
            remaining = source[end_idx:].lstrip()
            is_func = remaining.startswith("(")

            if is_func:
                if name not in func_map:
                    func_map[name] = f"f{func_counter}"
                    func_counter += 1
            else:
                if name not in var_map:
                    var_map[name] = f"v{var_counter}"
                    var_counter += 1

        # 3. Replace mappings (order by length descending to avoid prefix replacement issues)
        all_mappings = {}
        all_mappings.update(class_map)
        all_mappings.update(func_map)
        all_mappings.update(var_map)

        sorted_names = sorted(all_mappings.keys(), key=len, reverse=True)
        for name in sorted_names:
            mapped = all_mappings[name]
            source = re.sub(r"\b" + re.escape(name) + r"\b", mapped, source)

        # 4. Standardize whitespace
        return " ".join(source.split())

    def _build_canonical_string(self) -> str:
        ext = Path(self.file_path).suffix.lower()
        source = self._read_text()

        if ext == ".py":
            return self._canonicalize_python(source)
        elif ext in (".java", ".cpp"):
            return self._canonicalize_regex(source)

        # For .txt (or unknown supported ext), perform comment stripping only
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
