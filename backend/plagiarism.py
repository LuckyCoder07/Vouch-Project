import os
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client
from mailer import Mailer

# Load environment variables
load_dotenv()

# Initialize Logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Initialize Supabase
supabase_url = os.environ.get("SUPABASE_URL", "")
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY", "")

class SupabaseDelegate:
    def __getattr__(self, name):
        client = create_client(supabase_url, supabase_key)
        return getattr(client, name)

supabase = SupabaseDelegate()

# Initialize Mailer
mailer = Mailer()

class PlagiarismDetector:

    def check_submission(
        self,
        structural_hash: str,
        student_name:    str,
        submission_id:   str,
        user_id:         str | None,
        org_id:          str | None,
        assignment_id:   str | None = None
    ) -> dict:
        """
        Checks if the structural_hash exists from a 
        different user. Returns a result dict:
        {
          plagiarism_detected: bool,
          flags: list of flag dicts
        }
        """
        # Find all other submissions with same structural hash
        query = (supabase.table('submissions')
                 .select('id, student_name, user_id, '
                         'file_name, submitted_at, '
                         'verification_code')
                 .eq('structural_hash', structural_hash)
                 .neq('id', submission_id))

        # Filter to same org if provided
        if org_id:
            query = query.eq('org_id', org_id)

        matches = query.execute().data

        if not matches:
            return {'plagiarism_detected': False, 'flags': []}

        flags = []
        for match in matches:
            # Don't flag if same user submitted same file again
            if match.get('user_id') == user_id:
                continue

            # Create a plagiarism flag
            flag = supabase.table('plagiarism_flags').insert({
                'structural_hash': structural_hash,
                'submission_id_1': match['id'],
                'submission_id_2': submission_id,
                'org_id':          org_id,
                'assignment_id':   assignment_id,
                'status':          'pending'
            }).execute().data[0]

            flags.append({
                'flag_id':           flag['id'],
                'matching_student':  match['student_name'],
                'matching_file':     match['file_name'],
                'original_submitted':match['submitted_at'],
                'original_code':     match['verification_code']
            })

            logger.warning(
                'Plagiarism flag: %s matches %s (hash: %s)',
                student_name, match['student_name'],
                structural_hash[:16])

            # Notify org admin if in an org
            if org_id:
                self._notify_admin(org_id, student_name,
                                   match['student_name'],
                                   structural_hash, assignment_id)

        return {
            'plagiarism_detected': len(flags) > 0,
            'flags':               flags
        }

    def _notify_admin(
        self,
        org_id:          str,
        student_1:       str,
        student_2:       str,
        structural_hash: str,
        assignment_id:   str | None
    ) -> None:
        """
        Fetches the org owner's email and sends a 
        plagiarism alert notification.
        """
        try:
            org = (supabase.table('organizations')
                   .select('name, owner_id')
                   .eq('id', org_id)
                   .execute()).data[0]

            owner = (supabase.table('profiles')
                     .select('email, name')
                     .eq('id', org['owner_id'])
                     .execute()).data[0]

            if not owner.get('email'):
                return

            assignment_text = ''
            if assignment_id:
                assignment = (supabase.table('assignments')
                              .select('title')
                              .eq('id', assignment_id)
                              .execute()).data
                if assignment:
                    assignment_text = (f" in assignment "
                                       f"'{assignment[0]['title']}'")

            html = f"""
            <div style="font-family:Arial,sans-serif;
                        max-width:560px;margin:0 auto;
                        padding:24px">
              <div style="background:#fef2f2;border:1px solid 
                          #fecaca;border-radius:12px;padding:24px">
                <h2 style="color:#dc2626;margin-top:0">
                  ⚠️ Potential Plagiarism Detected</h2>
                <p style="color:#374151">
                  A structural hash collision was detected
                  {assignment_text} in 
                  <strong>{org['name']}</strong>.</p>
                <table style="width:100%;border-collapse:collapse;
                              margin:16px 0">
                  <tr style="background:#fee2e2">
                    <td style="padding:10px;font-weight:bold;
                               color:#991b1b">Student 1</td>
                    <td style="padding:10px;color:#374151">
                      {student_1}</td>
                  </tr>
                  <tr style="background:#fff7f7">
                    <td style="padding:10px;font-weight:bold;
                               color:#991b1b">Student 2</td>
                    <td style="padding:10px;color:#374151">
                      {student_2}</td>
                  </tr>
                  <tr style="background:#fee2e2">
                    <td style="padding:10px;font-weight:bold;
                               color:#991b1b">Hash</td>
                    <td style="padding:10px;color:#374151;
                               font-family:monospace;font-size:12px">
                      {structural_hash[:32]}...</td>
                  </tr>
                </table>
                <p style="color:#6b7280;font-size:13px">
                  This means both students submitted code with 
                  identical logical structure after ABT 
                  normalization. Please review both submissions 
                  in your Vouch admin dashboard.</p>
              </div>
            </div>
            """

            mailer.send_raw_email(
                to_email = owner['email'],
                subject  = (f'⚠️ Plagiarism Alert — '
                            f'{org["name"]}: {student_1} & '
                            f'{student_2}'),
                html     = html
            )
        except Exception as e:
            logger.error('Failed to notify admin: %s', e)

    def get_org_flags(
        self, 
        org_id:        str,
        assignment_id: str | None = None
    ) -> list:
        query = (supabase.table('plagiarism_flags')
                 .select('*, '
                         'submission_id_1(student_name, file_name, submitted_at, verification_code), '
                         'submission_id_2(student_name, file_name, submitted_at, verification_code)')
                 .eq('org_id', org_id)
                 .order('flagged_at', desc=True))
        if assignment_id:
            query = query.eq('assignment_id', assignment_id)
        return query.execute().data

    def resolve_flag(
        self,
        flag_id:     str,
        reviewer_id: str,
        status:      str
    ) -> dict:
        """status should be 'cleared' or 'confirmed'"""
        result = (supabase.table('plagiarism_flags')
                  .update({
                    'status':      status,
                    'reviewed_by': reviewer_id,
                    'reviewed_at': datetime.now(
                                     timezone.utc).isoformat()
                  })
                  .eq('id', flag_id)
                  .execute())
        return result.data[0]
