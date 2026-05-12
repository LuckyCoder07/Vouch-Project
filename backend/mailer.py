import os
import logging
import base64
try:
    import resend
except ModuleNotFoundError:
    resend = None
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("VouchMailer")

# Load environment variables
load_dotenv()

class Mailer:
    def __init__(self):
        self.api_key = os.getenv('RESEND_API_KEY')
        self.from_addr = os.getenv('RESEND_FROM_EMAIL', 'noreply@getvouch.dev')
        
        if resend is None:
            logger.warning('resend package is not installed. Emails will be skipped in mock mode.')
            self.api_key = None
        elif not self.api_key:
            logger.warning('RESEND_API_KEY not set. Emails will be skipped in mock mode.')
        else:
            resend.api_key = self.api_key

    def send_submission_confirmation(
        self,
        to_email: str,
        student_name: str,
        file_name: str,
        verification_code: str,
        submitted_at: str,
        structural_hash: str,
        pdf_path: str = None
    ) -> bool:
        if not self.api_key:
            logger.info(f"MOCK EMAIL to {to_email}: File {file_name} vouched. Code: {verification_code}")
            return False

        short_hash = structural_hash[:16] + '...' if structural_hash else "N/A"
        # We use FRONTEND_URL for public links, defaulting to localhost:5173
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        verify_url = f"{frontend_url}/verify/{verification_code}"
        display_url = frontend_url.replace("https://", "").replace("http://", "") + "/verify"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Inter', -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }}
                .card {{ background: white; border-radius: 20px; padding: 40px; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }}
                .badge {{ background: #eff6ff; color: #1d4ed8; border-radius: 30px; padding: 8px 20px; font-size: 13px; font-weight: 800; display: inline-block; text-transform: uppercase; letter-spacing: 1px; }}
                .code {{ background: #f3f4f6; border-radius: 12px; padding: 24px; font-family: 'Courier New', monospace; font-size: 24px; text-align: center; letter-spacing: 4px; color: #1e40af; font-weight: 900; margin: 24px 0; border: 2px dashed #d1d5db; }}
                .row {{ display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }}
                .label {{ color: #6b7280; font-weight: 600; }}
                .value {{ color: #111827; font-weight: 700; }}
                .btn {{ display: block; text-align: center; background: #2563eb; color: white !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; margin: 32px 0; font-size: 16px; transition: background 0.2s; }}
                .footer {{ text-align: center; font-size: 12px; color: #9ca3af; margin-top: 32px; line-height: 1.6; font-weight: 500; }}
            </style>
        </head>
        <body>
            <div class="card">
                <div style="text-align: center; margin-bottom: 32px;">
                    <span class="badge">Successfully Notarized</span>
                    <h2 style="color: #111827; margin-top: 20px; font-size: 24px; font-weight: 900;">Your code has been vouched.</h2>
                    <p style="color: #6b7280; font-size: 15px; line-height: 1.5;">Hi {student_name}, your file has been permanently recorded in the Vouch immutable ledger.</p>
                </div>

                <p style="font-size: 12px; color: #6b7280; text-align: center; margin-bottom: 4px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                <div class="code">{verification_code}</div>

                <div class="row">
                    <span class="label">File Name</span>
                    <span class="value">{file_name}</span>
                </div>
                <div class="row">
                    <span class="label">Recorded At</span>
                    <span class="value">{submitted_at} UTC</span>
                </div>
                <div class="row">
                    <span class="label">Structural Hash</span>
                    <span class="value" style="font-family: monospace; font-size: 12px;">{short_hash}</span>
                </div>

                <a href="{verify_url}" class="btn">View Public Certificate</a>

                <p style="font-size: 14px; color: #6b7280; text-align: center; line-height: 1.5;">
                    Share this code with professors, employers, or collaborators at <strong>{display_url}</strong> to prove the integrity of your work.
                </p>

                <div class="footer">
                    Vouch — Immutable Code Notary<br>
                    Official digital certificate is attached to this email.
                </div>
            </div>
        </body>
        </html>
        """

        params = {
            'from': f'Vouch <{self.from_addr}>',
            'to': [to_email],
            'subject': f'Your Vouch Certificate — {file_name} ({verification_code})',
            'html': html_body
        }

        if pdf_path and os.path.exists(pdf_path):
            try:
                with open(pdf_path, 'rb') as f:
                    pdf_b64 = base64.b64encode(f.read()).decode()
                params['attachments'] = [{
                    'filename': f'Certificate_{student_name.replace(" ","_")}.pdf',
                    'content': pdf_b64
                }]
            except Exception as e:
                logger.error(f"Failed to attach PDF: {str(e)}")

        try:
            resend.Emails.send(params)
            logger.info(f"Confirmation email successfully sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Resend API error for {to_email}: {str(e)}")
            return False

if __name__ == '__main__':
    mailer = Mailer()
    # Test call using your verified Resend email address
    ok = mailer.send_submission_confirmation(
        to_email='lakshit0507@gmail.com',
        student_name='Jane Doe',
        file_name='assignment.py',
        verification_code='VCH-TEST-1234',
        submitted_at='2025-05-06 10:00:00',
        structural_hash='abc123def456' * 4,
    )
    print('Email test result:', ok)
