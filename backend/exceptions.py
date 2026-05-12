class VouchError(Exception):
    """Base exception for Vouch backend errors."""


class VouchHashError(VouchError):
    """Raised when hashing/canonicalization fails."""


class VouchCertError(VouchError):
    """Raised when certificate generation fails."""


class VouchLedgerError(VouchError):
    """Raised when ledger operations fail."""


class VouchValidationError(VouchError):
    """Raised when input validation fails."""


class VouchOwnershipError(VouchLedgerError):
    """Raised when ownership checks fail for existing records."""

    def __init__(self, owner: str, timestamp: str, is_same_user: bool = False) -> None:
        self.owner = owner
        self.timestamp = timestamp
        self.is_same_user = is_same_user
        if is_same_user:
            msg = (
                f"This file was already vouched by you on {timestamp}. "
                "Duplicate submissions are not allowed."
            )
        else:
            msg = f"This file is already vouched by {owner} on {timestamp}."
        super().__init__(msg)
# ---------------------------------------------------------------------------
# Vouch – Custom Exception Hierarchy
# ---------------------------------------------------------------------------

class VouchError(Exception):
    """Base exception for all Vouch errors."""

class VouchHashError(VouchError):
    """Raised when hashing or sanitizing a file fails."""

class VouchLedgerError(VouchError):
    """Raised when a ledger read/write operation fails."""

class VouchVerifyError(VouchError):
    """Raised when verification encounters an unrecoverable error."""

class VouchCertError(VouchError):
    """Raised when PDF certificate generation fails."""

class VouchOwnershipError(VouchError):
    """
    Raised when a hash is already registered to a different (or same) owner.

    Attributes:
        owner        -- Student_Name of the original registrant.
        timestamp    -- Timestamp string from the original ledger row.
        is_same_user -- True if the existing record belongs to the same user.
    """
    def __init__(self, owner: str, timestamp: str, is_same_user: bool = False) -> None:
        self.owner        = owner
        self.timestamp    = timestamp
        self.is_same_user = is_same_user
        if is_same_user:
            super().__init__(f"Hash already registered to your profile on {timestamp}.")
        else:
            super().__init__(f"Hash already registered by '{owner}' on {timestamp}.")

class VouchValidationError(VouchError):
    """
    Raised when an input field fails validation before a ledger write.

    Attributes:
        field  -- Name of the offending field (e.g. 'student_name').
        reason -- Human-readable explanation of the rule that was broken.
    """
    def __init__(self, field: str, reason: str) -> None:
        self.field  = field
        self.reason = reason
        super().__init__(f"Validation failed for '{field}': {reason}")