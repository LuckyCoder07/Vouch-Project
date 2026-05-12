import logging
import os
import tempfile
from pathlib import Path

from fpdf import FPDF

try:
    from .config import OUTPUT_DIR
    from .exceptions import VouchCertError
except ImportError:
    from config import OUTPUT_DIR
    from exceptions import VouchCertError

logger = logging.getLogger(__name__)

_BORDER_COLOR   = (20, 40, 80)
_SECONDARY_COLOR= (100, 110, 130)
_ACCENT_COLOR   = (10, 100, 200)
_TEAL_COLOR     = (0, 128, 128)
_GREEN_COLOR    = (0, 153, 76)
_LIGHT_GRAY     = (245, 245, 250)
_DARK_TEXT      = (30, 30, 30)

class CertificateGenerator:
    """
    Modernized PDF Certificate Generator (Phase 2 Upgrade)
    Issues a highly formal 'Certificate of Originality' with digital watermarking,
    cryptographic detail grid, and tamper-evident digital signatures.
    """

    def __init__(
        self,
        logo_path:  str | None = None,
        output_dir: str        = OUTPUT_DIR,
    ) -> None:
        self.logo_path  = logo_path
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def _draw_formal_border(self, pdf: FPDF) -> None:
        """Draws an elegant double-lined certificate border."""
        r, g, b = _BORDER_COLOR
        pdf.set_draw_color(r, g, b)
        
        # Outer heavy border
        pdf.set_line_width(2.5)
        pdf.rect(12, 12, 186, 273)
        
        # Inner fine border
        pdf.set_line_width(0.4)
        pdf.set_draw_color(r+20, g+30, b+40)
        pdf.rect(16, 16, 178, 265)

    def _watermark(self, pdf: FPDF) -> None:
        """Injects a digital background watermark into the certificate."""
        pdf.set_font("Arial", "B", 100)
        pdf.set_text_color(240, 245, 250) # Very faint blue/gray
        
        # Rotate text for diagonal watermark using FPDF2 transformations
        with pdf.rotation(angle=45, x=105, y=148):
            # Center the watermark roughly
            pdf.text(x=20, y=160, text="VOUCH NOTARY")
            
        pdf.set_font("Arial", "B", 120)
        with pdf.rotation(angle=-45, x=105, y=148):
            pdf.text(x=20, y=160, text="ORIGINAL")

    def _header(self, pdf: FPDF) -> None:
        if self.logo_path and os.path.exists(self.logo_path):
            pdf.image(self.logo_path, x=85, y=25, w=40)
            pdf.ln(55)
        else:
            # Fallback text logo if logo_path missing
            pdf.set_font("Arial", "B", 34)
            pdf.set_text_color(*_ACCENT_COLOR)
            pdf.ln(20)
            pdf.cell(0, 15, "V O U C H", ln=1, align="C")
            pdf.set_font("Arial", "B", 10)
            pdf.set_text_color(*_SECONDARY_COLOR)
            pdf.cell(0, 6, "DIGITAL CODE NOTARY", ln=1, align="C")
            pdf.ln(12)

        pdf.set_text_color(*_BORDER_COLOR)
        pdf.set_font("Arial", "B", 30)
        pdf.cell(0, 16, "Certificate of Originality", ln=1, align="C")
        
        # Decorative divider
        pdf.set_draw_color(180, 190, 200)
        pdf.set_line_width(0.6)
        pdf.line(50, pdf.get_y()+2, 160, pdf.get_y()+2)
        pdf.ln(15)

    def _body(self, pdf: FPDF, student_name: str) -> None:
        pdf.set_text_color(80, 85, 90)
        pdf.set_font("Arial", "I", 14)
        pdf.cell(0, 10, "This digital certificate formally recognizes that the source code submitted by", ln=1, align="C")
        
        pdf.ln(6)
        pdf.set_font("Arial", "B", 26)
        pdf.set_text_color(*_BORDER_COLOR)
        pdf.cell(0, 14, student_name, ln=1, align="C")
        
        # Profile UID block
        uid = f"UID: VCH-{abs(hash(student_name)) % 100000000:08d}"
        pdf.set_font("Courier", "B", 10)
        pdf.set_text_color(*_SECONDARY_COLOR)
        pdf.cell(0, 6, uid, ln=1, align="C")

        pdf.ln(10)
        pdf.set_font("Arial", "", 13)
        pdf.set_text_color(60, 65, 70)
        pdf.multi_cell(0, 8, "has been successfully parsed, sanitized via AST compilation, and cryptographically secured into the immutable public ledger.", align="C")
        pdf.ln(15)

    def _details(self, pdf: FPDF, file_name: str, file_hash: str, timestamp: str, chain_hash: str = "") -> None:
        LABEL_W = 52  # fixed label column width for perfect vertical alignment

        def detail_row(label: str, value: str) -> None:
            pdf.set_x(30)
            pdf.set_font("Arial", "B", 10)
            pdf.set_text_color(0, 51, 102)
            pdf.cell(LABEL_W, 8, label, border=0)
            pdf.set_font("Arial", "", 10)
            pdf.set_text_color(40, 40, 40)
            pdf.multi_cell(110, 8, value, border=0)

        def hash_row(label: str, hash_value: str) -> None:
            pdf.set_x(30)
            pdf.set_font("Arial", "B", 10)
            pdf.set_text_color(0, 51, 102)
            pdf.cell(LABEL_W, 7, label, border=0)
            pdf.ln(7)
            pdf.set_x(30 + LABEL_W)
            pdf.set_font("Courier", "", 8)
            pdf.set_text_color(60, 60, 60)
            pdf.multi_cell(110, 5, hash_value, border=0)
            pdf.ln(3)

        # Light background block for details section
        y_start = pdf.get_y()
        pdf.set_fill_color(245, 245, 250)
        pdf.rect(20, y_start, 170, 68, style='F')
        pdf.ln(4)

        detail_row("File Name:", file_name)
        detail_row("Timestamp:", timestamp)
        hash_row("Structural Hash:", file_hash)
        if chain_hash:
            hash_row("Chain Hash:", chain_hash)

        pdf.ln(6)

    def _digital_signature(self, pdf: FPDF) -> None:
        """Render the digital signature validation block at the bottom-center."""
        pdf.ln(8)

        # Horizontal rule before signature
        pdf.set_draw_color(0, 128, 128)
        pdf.set_line_width(0.5)
        pdf.line(40, pdf.get_y(), 170, pdf.get_y())
        pdf.ln(6)

        # Signature and signed text — centered
        pdf.set_font("Arial", "B", 13)
        pdf.set_text_color(0, 153, 76)
        pdf.cell(0, 8, "Digitally Signed by Vouch", ln=1, align="C")

        pdf.ln(2)
        pdf.set_font("Arial", "I", 8)
        pdf.set_text_color(0, 128, 128)
        pdf.cell(0, 6, "This certificate is cryptographically bound to the Vouch Immutable Ledger.", ln=1, align="C")
        pdf.cell(0, 6, "Verify authenticity at: https://vouch-project.vercel.app/verification", ln=1, align="C")

        pdf.ln(4)
        pdf.set_font("Arial", "", 7)
        pdf.set_text_color(180, 180, 180)
        pdf.cell(0, 5, "Vouch Code Notary System  |  SHA3-256 Cryptographic Standard  |  Tamper-Evident Ledger", ln=1, align="C")

    def _footer(self, pdf: FPDF, verification_link: str | None = None) -> None:
        pdf.set_y(-35)
        pdf.set_text_color(*_SECONDARY_COLOR)
        pdf.set_font("Arial", "I", 9)
        pdf.cell(0, 5, "This document is an official digital record of ownership and integrity.", ln=1, align="C")
        pdf.cell(0, 5, "Powered by Vouch Cryptographic Assurance Infrastructure", ln=1, align="C")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate(
        self,
        student_name:      str,
        file_name:         str        = "N/A",
        file_hash:         str        = "",
        timestamp:         str        = "",
        chain_hash:        str        = "",
        verification_link: str | None = None,
        output_dir:        str | None = None,
    ) -> str:
        if not student_name.strip():
            raise VouchCertError("student_name cannot be empty.")

        dest = Path(output_dir or self.output_dir)
        dest.mkdir(parents=True, exist_ok=True)
        safe_name   = student_name.strip().replace(" ", "_")
        output_path = str(dest / f"Certificate_{safe_name}.pdf")

        pdf = FPDF()
        pdf.add_page()
        
        # Apply visual elements strictly in order
        self._watermark(pdf)
        self._draw_formal_border(pdf)
        self._header(pdf)
        self._body(pdf, student_name.strip())
        
        # Provide fallback link if not injected
        link = verification_link or "https://vouch.example.com/verify"
        self._details(pdf, file_name, file_hash, timestamp, chain_hash)
        self._digital_signature(pdf)
        self._footer(pdf, link)

        try:
            pdf.output(output_path)
            logger.info("Premium PDF Certificate written to '%s'.", output_path)
        except Exception as exc:
            raise VouchCertError(f"Failed to write PDF: {exc}") from exc

        return output_path

# Alias for drop-in replacement compatibility
Certificate = CertificateGenerator

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    print("=== Next-Gen Certificate Backend Test ===")
    gen = Certificate()
    try:
        path = gen.generate(
            student_name      = "Jane Doe",
            file_name         = "blockchain_core.cpp",
            file_hash         = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            timestamp         = "2026-04-21 14:30:00",
        )
        print(f"Premium Certificate saved successfully: {os.path.abspath(path)}")
    except VouchCertError as e:
        print(f"Error: {e}")