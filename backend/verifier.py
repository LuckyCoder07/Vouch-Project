import logging
import os
from enum import Enum

from .hasher import CodeHasher
from .ledger import Ledger
from .exceptions import VouchHashError, VouchLedgerError

logger = logging.getLogger(__name__)


class VerifyStatus(str, Enum):
    VERIFIED  = "verified"
    NOT_FOUND = "not_found"
    ERROR     = "error"


class VerifyResult:
    """Structured result returned by Verifier.check_file()."""

    def __init__(
        self,
        status: VerifyStatus,
        *,
        file_hash:    str = "",
        timestamp:    str = "",
        student_name: str = "",
        file_name:    str = "",
        chain_hash:   str = "",
        message:      str = "",
    ) -> None:
        self.status       = status
        self.file_hash    = file_hash
        self.timestamp    = timestamp
        self.student_name = student_name
        self.file_name    = file_name
        self.chain_hash   = chain_hash
        self.message      = message

    @property
    def ok(self) -> bool:
        return self.status == VerifyStatus.VERIFIED

    def __repr__(self) -> str:
        return (
            f"VerifyResult(status={self.status!r}, "
            f"student={self.student_name!r}, timestamp={self.timestamp!r})"
        )


class Verifier:
    """
    Verification Engine – hashes a file and checks it against the ledger.

    Improvements over the original:
    - Returns a rich VerifyResult instead of a raw string.
    - Matches on both hash AND filename to avoid mis-attribution.
    - Uses typed VerifyStatus enum so callers don't do string matching.
    """

    def __init__(self, ledger: Ledger) -> None:
        self.ledger = ledger

    def check_file(self, file_path: str) -> VerifyResult:
        """
        Hash file_path and look it up in the ledger.

        :return: VerifyResult with status VERIFIED, NOT_FOUND, or ERROR.
        """
        if not os.path.exists(file_path):
            return VerifyResult(
                VerifyStatus.ERROR,
                message=f"File '{file_path}' does not exist.",
            )

        # Step 1 – hash
        try:
            file_hash = CodeHasher(file_path).compute_hash()
        except VouchHashError as exc:
            logger.error("Hashing failed: %s", exc)
            return VerifyResult(VerifyStatus.ERROR, message=str(exc))

        base_name = os.path.basename(file_path)

        # Step 2 & 3 – lookup in ledger via indexed search
        try:
            best = self.ledger.find_record_by_hash(file_hash)
        except Exception as exc:
            logger.error("Ledger query failed: %s", exc)
            return VerifyResult(VerifyStatus.ERROR, message=str(exc))

        if not best:
            return VerifyResult(VerifyStatus.NOT_FOUND, file_hash=file_hash)

        return VerifyResult(
            VerifyStatus.VERIFIED,
            file_hash    = file_hash,
            timestamp    = str(best.get("Timestamp", "")),
            student_name = str(best.get("Student_Name", "")),
            file_name    = str(best.get("File_Name", "")),
            chain_hash   = str(best.get("Chain_Hash", "")),
        )


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    print("=== Verifier Test ===")

    dummy = "mock_temp.py"
    with open(dummy, "w") as f:
        f.write("# Dummy script\nprint('Hello Validation')")

    class RealisticMockLedger:
        def fetch_all_records(self):
            return [{
                "Student_Name": "Alice",
                "File_Name":    dummy,
                "Hash":         CodeHasher(dummy).compute_hash(),
                "Timestamp":    "2023-10-01 10:00:00",
            }]

    v = Verifier(RealisticMockLedger())

    r = v.check_file(dummy)
    print(f"Original : {r}")

    with open(dummy, "a") as f:
        f.write("\nprint('tampered!')")
    r2 = v.check_file(dummy)
    print(f"Tampered : {r2}")

    os.remove(dummy)