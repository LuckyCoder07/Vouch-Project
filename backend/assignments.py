import os
import logging
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).resolve().parent / '.env')

# Initialize Logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class SupabaseDelegate:
    _client = None
    
    def __getattr__(self, name):
        if SupabaseDelegate._client is None:
            url = os.environ.get("SUPABASE_URL", "")
            key = os.environ.get("SUPABASE_SERVICE_KEY", "")
            SupabaseDelegate._client = create_client(url, key)
        return getattr(SupabaseDelegate._client, name)

supabase = SupabaseDelegate()

class AssignmentManager:

    def create_assignment(
        self,
        org_id:      str,
        created_by:  str,
        title:       str,
        description: str  = '',
        deadline:    str  | None = None,
        allow_late:  bool = False
    ) -> dict:
        """
        deadline should be an ISO format UTC string or None.
        """
        result = supabase.table('assignments').insert({
            'org_id':      org_id,
            'created_by':  created_by,
            'title':       title,
            'description': description,
            'deadline':    deadline,
            'allow_late':  allow_late
        }).execute()
        return result.data[0]

    def get_org_assignments(self, org_id: str) -> list:
        result = (supabase.table('assignments')
                  .select('*')
                  .eq('org_id', org_id)
                  .order('deadline', desc=False)
                  .execute())
        now = datetime.now(timezone.utc).isoformat()
        assignments = result.data
        for a in assignments:
            if a.get('deadline'):
                a['is_overdue'] = a['deadline'] < now
                a['is_open']    = a['deadline'] >= now
            else:
                a['is_overdue'] = False
                a['is_open']    = True
        return assignments

    def submit_to_assignment(
        self,
        assignment_id: str,
        submission_id: str,
        user_id:       str
    ) -> dict:
        assignment = (supabase.table('assignments')
                      .select('*')
                      .eq('id', assignment_id)
                      .execute()).data[0]

        now = datetime.now(timezone.utc).isoformat()
        is_late = False

        if assignment.get('deadline'):
            is_late = now > assignment['deadline']
            if is_late and not assignment.get('allow_late'):
                raise ValueError(
                    f"Deadline has passed for assignment "
                    f"'{assignment['title']}'. "
                    f"Late submissions are not allowed.")

        result = supabase.table('assignment_submissions').insert({
            'assignment_id': assignment_id,
            'submission_id': submission_id,
            'user_id':       user_id,
            'is_late':       is_late
        }).execute()

        # Update the submission row with assignment_id
        supabase.table('submissions').update({
            'assignment_id': assignment_id
        }).eq('id', submission_id).execute()

        return {
            'linked':  True,
            'is_late': is_late,
            'data':    result.data[0]
        }

    def get_assignment_submissions(
        self, 
        assignment_id: str
    ) -> dict:
        assignment = (supabase.table('assignments')
                      .select('*')
                      .eq('id', assignment_id)
                      .execute()).data[0]

        submissions = (supabase.table('assignment_submissions')
                       .select(
                           'is_late, submitted_at, '
                           'submissions(*), profiles(name, email)')
                       .eq('assignment_id', assignment_id)
                       .order('submitted_at')
                       .execute()).data

        on_time   = [s for s in submissions if not s.get('is_late')]
        late      = [s for s in submissions if s.get('is_late')]

        return {
            'assignment':  assignment,
            'submissions': submissions,
            'on_time':     len(on_time),
            'late':        len(late),
            'total':       len(submissions)
        }

    def update_assignment(
        self,
        assignment_id: str,
        updates:       dict
    ) -> dict:
        result = (supabase.table('assignments')
                  .update(updates)
                  .eq('id', assignment_id)
                  .execute())
        return result.data[0]

    def delete_assignment(self, assignment_id: str) -> bool:
        supabase.table('assignments').delete()\
            .eq('id', assignment_id).execute()
        return True
