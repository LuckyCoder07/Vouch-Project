import hashlib
import logging
import os
import time
from datetime import datetime

import gspread
from oauth2client.service_account import ServiceAccountCredentials

from .exceptions import VouchLedgerError, VouchOwnershipError, VouchValidationError

logger = logging.getLogger(__name__)

_SCOPE = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
]
_RETRY_ATTEMPTS = 3
_RETRY_DELAY    = 2  # seconds between retries


# Column order expected in the Google Sheet header row
_HEADERS = ["Student_Name", "File_Name", "Hash", "Timestamp", "Chain_Hash", "User_ID"]


class Ledger:
    """
    Immutable Ledger – connects to a Google Sheet and appends/fetches records.
    """

    def __init__(self, credentials_file: str, sheet_name: str) -> None:
        """
        :param credentials_file: Path to the Google Service Account JSON key.
        :param sheet_name:       Name of the Google Sheet document.
        """
        self.credentials_file = credentials_file
        self.sheet_name       = sheet_name
        self.client           = self._authenticate()
        self.sheet            = self._get_sheet() if self.client else None

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _authenticate(self):
        if not os.path.exists(self.credentials_file):
            logger.warning(
                "Credentials file '%s' not found. Running in offline mode.",
                self.credentials_file,
            )
            return None
        try:
            creds  = ServiceAccountCredentials.from_json_keyfile_name(
                self.credentials_file, _SCOPE
            )
            client = gspread.authorize(creds)
            logger.info("Authenticated with Google Sheets API.")
            return client
        except Exception as exc:
            logger.error("Google Sheets authentication failed: %s", exc)
            return None

    def _get_sheet(self):
        try:
            sheet = self.client.open(self.sheet_name).sheet1
            logger.info("Opened sheet '%s'.", self.sheet_name)
            return sheet
        except gspread.exceptions.SpreadsheetNotFound:
            logger.error(
                "Spreadsheet '%s' not found. Share it with the service account.",
                self.sheet_name,
            )
            return None
        except Exception as exc:
            logger.error("Failed to open sheet: %s", exc)
            return None

    def _retry(self, fn, *args, **kwargs):
        """Call fn with automatic retries on transient API errors."""
        last_exc = None
        for attempt in range(1, _RETRY_ATTEMPTS + 1):
            try:
                return fn(*args, **kwargs)
            except Exception as exc:
                last_exc = exc
                logger.warning(
                    "API call failed (attempt %d/%d): %s",
                    attempt, _RETRY_ATTEMPTS, exc,
                )
                if attempt < _RETRY_ATTEMPTS:
                    time.sleep(_RETRY_DELAY)
        raise VouchLedgerError(
            f"API call failed after {attempt} retries. Last error: {last_exc}"
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @property
    def is_connected(self) -> bool:
        """True if the ledger has an active Google Sheets connection."""
        return self.sheet is not None

    def find_record_by_hash(self, file_hash: str) -> dict | None:
        """
        Return the first ledger record whose Hash matches *file_hash*,
        or ``None`` if no such record exists.
        """
        if not self.is_connected:
            return None

        try:
            # in_column=3 because Hash is the 3rd column: ["Student_Name", "File_Name", "Hash", ...]
            cell = self._retry(self.sheet.find, file_hash, in_column=3)
            if cell is None:
                return None
                
            row_values = self._retry(self.sheet.row_values, cell.row)

            # Zip the global _HEADERS with the found row values
            return dict(zip(_HEADERS, row_values))
        except Exception as exc:
            logger.error("Error finding hash in Google Sheet: %s", exc)
            return None

    def _compute_row_hash(self, student_name: str, file_name: str, file_hash: str, timestamp: str, user_id: str) -> str:
        """
        Compute a digest of ALL fields in this row.
        If ANY field changes, this hash changes, making tampering detectable.
        """
        raw = f"{student_name}|{file_name}|{file_hash}|{timestamp}|{user_id}"
        return hashlib.sha3_256(raw.encode("utf-8")).hexdigest()

    def _compute_chain_hash(self, row_hash: str, prev_chain_hash: str) -> str:
        """
        Chain this row to the previous one.
        chain_hash = SHA3-256(current_row_hash + previous_chain_hash)
        This means editing ANY previous row breaks ALL subsequent chain hashes.
        """
        raw = f"{row_hash}|{prev_chain_hash}"
        return hashlib.sha3_256(raw.encode("utf-8")).hexdigest()

    def get_last_chain_hash(self) -> str:
        """Retrieves the last record's chain hash or 'GENESIS'."""
        try:
            records = self.fetch_all_records()
            if not records:
                return "GENESIS"
            return str(records[-1].get("Chain_Hash", "GENESIS")).strip() or "GENESIS"
        except Exception:
            return "GENESIS"

    def append_record(
        self, student_name: str, file_name: str, file_hash: str, user_id: str
    ) -> bool:
        """
        Append a new verification record with ownership locking and blockchain chaining.
        """
        if not self.is_connected:
            raise VouchLedgerError("Ledger is not connected to Google Sheets.")

        existing = self.find_record_by_hash(file_hash)
        if existing is not None:
            existing_user_id = str(existing.get("User_ID", "")).strip()
            owner     = str(existing.get("Student_Name", "Unknown")).strip()
            timestamp = str(existing.get("Timestamp",    "Unknown")).strip()
            is_same_user = bool(user_id and existing_user_id == user_id)
            logger.warning(
                "Ownership conflict: hash already registered by '%s' on %s. Same user: %s",
                owner, timestamp, is_same_user
            )
            raise VouchOwnershipError(owner, timestamp, is_same_user=is_same_user)

        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        prev_chain_hash = self.get_last_chain_hash()
        row_hash = self._compute_row_hash(student_name, file_name, file_hash, timestamp, user_id)
        chain_hash = self._compute_chain_hash(row_hash, prev_chain_hash)
        row = [student_name, file_name, file_hash, timestamp, chain_hash, user_id]
        self._retry(self.sheet.append_row, row)
        logger.info(
            "Record appended — chain_hash='%s...' prev='%s...'",
            chain_hash[:12], prev_chain_hash[:12]
        )
        return chain_hash

    def verify_chain(self) -> dict:
        """
        Re-verify every row by recomputing row_hash and chain_hash from scratch.
        Returns integrity report. Any mismatch means the ledger was tampered with.
        """
        try:
            records = self.fetch_all_records()
        except VouchLedgerError as exc:
            return {"intact": False, "broken_at_row": None, "total_rows": 0, "error": str(exc)}

        if not records:
            return {"intact": True, "broken_at_row": None, "total_rows": 0, "integrity_score": 100}

        prev_chain_hash = "GENESIS"
        verified_rows = 0

        for i, record in enumerate(records, start=1):
            stored_chain = str(record.get("Chain_Hash", "")).strip()

            # Skip legacy rows with no chain hash
            if not stored_chain:
                prev_chain_hash = "GENESIS"
                continue

            # Recompute from all fields
            row_hash = self._compute_row_hash(
                str(record.get("Student_Name", "")),
                str(record.get("File_Name", "")),
                str(record.get("Hash", "")),
                str(record.get("Timestamp", "")),
                str(record.get("User_ID", ""))
            )
            expected_chain = self._compute_chain_hash(row_hash, prev_chain_hash)

            if stored_chain != expected_chain:
                logger.warning("Chain integrity broken at row %d", i)
                return {
                    "intact": False,
                    "broken_at_row": i,
                    "total_rows": len(records),
                    "verified_rows": verified_rows,
                    "integrity_score": round((verified_rows / len(records)) * 100, 1)
                }

            prev_chain_hash = stored_chain
            verified_rows += 1

        return {
            "intact": True,
            "broken_at_row": None,
            "total_rows": len(records),
            "verified_rows": verified_rows,
            "integrity_score": 100.0
        }

    def fetch_all_records(self) -> list[dict]:
        """
        Fetch all rows as a list of dicts (keys = header row values).
        """
        if not self.is_connected:
            raise VouchLedgerError("Ledger is not connected to Google Sheets.")
        records = self._retry(self.sheet.get_all_records)
        logger.debug("Fetched %d records.", len(records))
        return records