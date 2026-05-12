"""
Vouch – Streamlit UI  (API-backed edition)
==========================================
All hashing / ledger / verification calls go to the FastAPI backend
(api.py) over HTTP.  This process never imports hasher, ledger, or
verifier — and therefore never touches credentials.json.

Run order
---------
  Terminal 1:  uvicorn api:app --reload
  Terminal 2:  streamlit run app.py
"""

import io
import logging
import os
import tempfile

import requests
import streamlit as st

from .certificate import Certificate
from .config import SUPPORTED_EXTS
from .exceptions import VouchCertError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

API_BASE   = os.getenv("VOUCH_API_URL", "http://127.0.0.1:8000")
API_TIMEOUT = 30  # seconds

# ---------------------------------------------------------------------------
# Page config (must be first Streamlit call)
# ---------------------------------------------------------------------------

st.set_page_config(page_title="Vouch Project", layout="wide", page_icon="🛡️")

# ---------------------------------------------------------------------------
# API connection check (cached per session)
# ---------------------------------------------------------------------------

@st.cache_data(ttl=10)
def _api_status() -> bool:
    """Return True if the API backend is reachable and ledger connected."""
    try:
        r = requests.get(f"{API_BASE}/health", timeout=5)
        if r.ok:
            return r.json().get("connected", False)
    except requests.exceptions.ConnectionError:
        pass
    return False


certificate = Certificate()

# ---------------------------------------------------------------------------
# Sidebar navigation
# ---------------------------------------------------------------------------

st.sidebar.title("📌 Vouch Navigation")
page = st.sidebar.selectbox(
    "Choose Function",
    ["Upload & Hash", "Store in Ledger", "Verify File",
     "Generate Certificate", "Verify Chain Integrity"],
)

api_ok = _api_status()
if api_ok:
    st.sidebar.success("✅ API server connected.")
else:
    st.sidebar.error(
        "⚠️ API server not reachable.  \n"
        "Start it with:  \n"
        "`uvicorn api:app --reload`"
    )

st.sidebar.markdown("---")
st.sidebar.markdown(
    "**How it works**\n"
    "1. Upload & hash your file\n"
    "2. Store the record in the ledger\n"
    "3. Verify a file anytime\n"
    "4. Download a PDF certificate"
)

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _ext_list() -> list[str]:
    return [e.lstrip(".") for e in sorted(SUPPORTED_EXTS)]

def _show_hash(label: str, file_hash: str) -> None:
    st.markdown(f"**{label}**")
    col1, col2 = st.columns([4, 1])
    with col1:
        st.code(file_hash, language=None)
    with col2:
        st.caption(f"`{file_hash[:12]}...`")

def _api_error(resp: requests.Response) -> str:
    """Return a user-facing message from an API error response."""
    try:
        detail = resp.json().get("detail", resp.text)
        if isinstance(detail, dict):
            kind = detail.get("type", "")
            if kind == "ownership":
                return (
                    f"🔒 This code was already registered by "
                    f"**{detail['owner']}** on **{detail['timestamp']}**."
                )
            if kind == "validation":
                return f"⚠️ **{detail['field']}**: {detail['reason']}"
            return str(detail)
        return str(detail)
    except Exception:
        return f"HTTP {resp.status_code}: {resp.text[:200]}"

# ---------------------------------------------------------------------------
# Page: Upload & Hash
# ---------------------------------------------------------------------------

if page == "Upload & Hash":
    st.title("📤 Upload File & Generate Hash")
    st.markdown("Upload a source code file to compute its tamper-evident SHA-256 hash.")

    uploaded = st.file_uploader(
        "Choose a code file",
        type=_ext_list(),
        help="Comments and blank lines are stripped before hashing (AST-normalised for .py).",
    )

    if uploaded:
        if not api_ok:
            st.error("Cannot hash — API server is not running.")
        else:
            file_bytes = uploaded.getbuffer().tobytes()
            suffix     = os.path.splitext(uploaded.name)[1] or ".py"

            with st.spinner("Sending file to API for hashing…"):
                try:
                    resp = requests.post(
                        f"{API_BASE}/hash",
                        files={"file": (uploaded.name, io.BytesIO(file_bytes), "application/octet-stream")},
                        timeout=API_TIMEOUT,
                    )
                except requests.exceptions.ConnectionError:
                    st.error("API server is not reachable.")
                    resp = None

            if resp is not None:
                if resp.ok:
                    data      = resp.json()
                    file_hash = data["structural_hash"]

                    st.success("File hashed successfully!")
                    _show_hash("Structural Hash (SHA3-256)", file_hash)

                    st.info(f"Detected language: **{data.get('language', 'unknown')}**")

                    # Persist for other pages — raw bytes kept so /store can
                    # re-hash server-side (Change 2 / double-verification).
                    st.session_state["file_hash"]   = file_hash   # display only
                    st.session_state["file_name"]   = uploaded.name
                    st.session_state["file_bytes"]  = file_bytes
                    st.session_state["file_suffix"] = suffix
                    st.info("Hash saved — go to **Store in Ledger** to record it.")
                else:
                    st.error(_api_error(resp))

# ---------------------------------------------------------------------------
# Page: Store in Ledger
# ---------------------------------------------------------------------------

elif page == "Store in Ledger":
    st.title("📊 Store Record in Ledger")
    st.markdown("Record the hashed file in the immutable Google Sheets ledger.")

    if "file_bytes" not in st.session_state:
        st.warning("No file hashed yet — go to **Upload & Hash** first.")
    elif not api_ok:
        st.error("Cannot store — API server is not running.")
    else:
        st.info(f"Ready to store: **{st.session_state['file_name']}**")
        st.caption("Hash shown below is for reference only — the API will recompute it before storing.")
        _show_hash("Hash (reference)", st.session_state["file_hash"])

        student_name = st.text_input(
            "Your name",
            placeholder="e.g. Lakshit Sharma",
        )

        if st.button("Store in Ledger", type="primary"):
            if not student_name.strip():
                st.warning("Please enter your name before storing.")
            else:
                with st.spinner("Sending file to API — re-hashing and writing to ledger…"):
                    try:
                        resp = requests.post(
                            f"{API_BASE}/store",
                            files={"file": (
                                st.session_state["file_name"],
                                io.BytesIO(st.session_state["file_bytes"]),
                                "application/octet-stream",
                            )},
                            data={"student_name": student_name.strip()},
                            timeout=API_TIMEOUT,
                        )
                    except requests.exceptions.ConnectionError:
                        st.error("API server is not reachable.")
                        resp = None

                if resp is not None:
                    if resp.ok:
                        data = resp.json()
                        st.success("✅ Stored in ledger!")
                        # Sync session state with the server-authoritative hash
                        st.session_state["student_name"] = student_name.strip()
                    elif resp.status_code == 409:
                        detail = resp.json().get("detail", {})
                        st.error(
                            f"🔒 This code was already registered by "
                            f"**{detail.get('owner', 'Unknown')}** "
                            f"on **{detail.get('timestamp', '?')}**."
                        )
                    elif resp.status_code == 422:
                        detail = resp.json().get("detail", {})
                        if isinstance(detail, dict) and detail.get("type") == "validation":
                            st.warning(f"⚠️ **{detail['field']}**: {detail['reason']}")
                        else:
                            st.warning(f"⚠️ {detail}")
                    else:
                        st.error(_api_error(resp))

# ---------------------------------------------------------------------------
# Page: Verify File
# ---------------------------------------------------------------------------

elif page == "Verify File":
    st.title("🔍 Verify File Integrity")
    st.markdown(
        "Upload a file to check whether it matches a record in the ledger. "
        "Even a single character change will produce a different hash."
    )

    uploaded = st.file_uploader("Upload file to verify", type=_ext_list())

    if uploaded:
        if not api_ok:
            st.error("Cannot verify — API server is not running.")
        else:
            file_bytes = uploaded.getbuffer().tobytes()

            with st.spinner("Checking ledger…"):
                try:
                    resp = requests.post(
                        f"{API_BASE}/verify",
                        files={"file": (uploaded.name, io.BytesIO(file_bytes), "application/octet-stream")},
                        timeout=API_TIMEOUT,
                    )
                except requests.exceptions.ConnectionError:
                    st.error("API server is not reachable.")
                    resp = None

            if resp is not None:
                if not resp.ok:
                    st.error(_api_error(resp))
                else:
                    data   = resp.json()
                    status = data.get("status")

                    if data.get("structural_hash"):
                        _show_hash("Computed hash", data["structural_hash"])

                    if status == "error":
                        st.error(f"System error: {data.get('message')}")

                    elif status == "not_found":
                        st.error("File NOT found in ledger.")
                        st.warning(
                            "If this is a new submission, go to **Upload & Hash** "
                            "then **Store in Ledger** to record it."
                        )

                    else:  # verified
                        st.success(f"✅ Verified! Uploaded by **{data['student_name']}**")
                        st.success(f"Original timestamp: **{data['timestamp']}**")

                        st.markdown("---")
                        st.markdown("#### Download Certificate")
                        cert_name = st.text_input(
                            "Name for certificate",
                            value=data["student_name"],
                            key="cert_name_verify",
                        )
                        if st.button("Generate & Download Certificate"):
                            with st.spinner("Generating PDF…"):
                                try:
                                    with tempfile.TemporaryDirectory() as tmp_dir:
                                        cert_path = certificate.generate(
                                            student_name = cert_name or data["student_name"],
                                            file_name    = data.get("file_name") or uploaded.name,
                                            file_hash    = data["structural_hash"],
                                            timestamp    = data["timestamp"],
                                            output_dir   = tmp_dir,
                                        )
                                        with open(cert_path, "rb") as pdf:
                                            pdf_bytes = pdf.read()
                                    safe = (cert_name or data["student_name"]).replace(" ", "_")
                                    st.download_button(
                                        label     = "Download Certificate (PDF)",
                                        data      = pdf_bytes,
                                        file_name = f"Certificate_{safe}.pdf",
                                        mime      = "application/pdf",
                                    )
                                except VouchCertError as exc:
                                    st.error(f"Certificate error: {exc}")

# ---------------------------------------------------------------------------
# Page: Generate Certificate
# ---------------------------------------------------------------------------

elif page == "Generate Certificate":
    st.title("📜 Generate Certificate")
    st.markdown("Create a standalone PDF certificate of submission.")

    student_name = st.text_input(
        "Student name",
        value=st.session_state.get("student_name", ""),
        placeholder="e.g. Lakshit Sharma",
    )
    file_name = st.text_input(
        "File name",
        value=st.session_state.get("file_name", ""),
        placeholder="e.g. assignment1.py",
    )
    file_hash = st.text_input(
        "SHA-256 Hash",
        value=st.session_state.get("file_hash", ""),
        placeholder="Paste hash or go to Upload & Hash first",
    )
    timestamp = st.text_input(
        "Timestamp",
        placeholder="e.g. 2025-04-18 14:30:00",
    )
    verification_link = st.text_input(
        "Verification link (optional)",
        placeholder="https://vouch.example.com",
    )

    if st.button("Generate Certificate", type="primary"):
        if not student_name.strip():
            st.warning("Please enter a student name.")
        elif not file_hash.strip():
            st.warning("Please provide a hash (upload a file first, or paste one).")
        else:
            with st.spinner("Generating PDF…"):
                try:
                    with tempfile.TemporaryDirectory() as tmp_dir:
                        cert_path = certificate.generate(
                            student_name      = student_name.strip(),
                            file_name         = file_name.strip() or "N/A",
                            file_hash         = file_hash.strip(),
                            timestamp         = timestamp.strip() or "N/A",
                            verification_link = verification_link.strip() or None,
                            output_dir        = tmp_dir,
                        )
                        with open(cert_path, "rb") as pdf:
                            pdf_bytes = pdf.read()

                    safe = student_name.strip().replace(" ", "_")
                    st.success("Certificate generated!")
                    st.download_button(
                        label     = "Download Certificate (PDF)",
                        data      = pdf_bytes,
                        file_name = f"Certificate_{safe}.pdf",
                        mime      = "application/pdf",
                    )
                except VouchCertError as exc:
                    st.error(f"Certificate error: {exc}")

# ---------------------------------------------------------------------------
# Page: Verify Chain Integrity
# ---------------------------------------------------------------------------

elif page == "Verify Chain Integrity":
    st.title("🔗 Verify Chain Integrity")
    st.markdown(
        "Walks every row in the ledger and recomputes the Chain_Hash to detect "
        "any rows that were silently edited in Google Sheets."
    )

    if not api_ok:
        st.error("Cannot verify chain — API server is not running.")
    elif st.button("Run Chain Verification", type="primary"):
        with st.spinner("Fetching ledger and verifying chain…"):
            try:
                resp = requests.get(f"{API_BASE}/chain", timeout=API_TIMEOUT)
            except requests.exceptions.ConnectionError:
                st.error("API server is not reachable.")
                resp = None

        if resp is not None:
            if not resp.ok:
                st.error(_api_error(resp))
            else:
                result = resp.json()
                st.markdown(f"**Rows checked:** {result['total']}")
                if result["ok"]:
                    st.success(f"✅ All {result['total']} rows are intact — no tampering detected.")
                else:
                    st.error(f"❌ Tampering detected in **{len(result['broken'])}** row(s):")
                    for b in result["broken"]:
                        with st.expander(f"Row {b['row']} — {b['student']}"):
                            st.code(
                                f"Stored  : {b['stored']}\nExpected: {b['expected']}",
                                language=None,
                            )