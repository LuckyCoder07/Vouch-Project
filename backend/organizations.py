import os
import random
import string
import logging
import hashlib
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client

# Load .env
load_dotenv()

# Initialize logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Initialize Supabase
supabase_url = os.environ.get("SUPABASE_URL", "")
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY", "")
supabase = create_client(supabase_url, supabase_key)

def generate_invite_code() -> str:
    """
    Returns a short readable invite code.
    Format: VOUCH-XXXXX (5 uppercase alphanumeric chars)
    """
    chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"VOUCH-{chars}"

def generate_api_key() -> tuple[str, str, str]:
    """
    Returns (full_key, key_hash, key_preview).
    """
    full_key = f"vk_live_{''.join(random.choices(string.ascii_letters + string.digits, k=40))}"
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()
    key_preview = full_key[:12] + "..." + full_key[-4:]
    return full_key, key_hash, key_preview

class OrgManager:

    def create_org(
        self,
        name:       str,
        owner_id:   str,
        org_type:   str = 'classroom',
        description:str = ''
    ) -> dict:
        invite_code = generate_invite_code()
        result = supabase.table('organizations').insert({
            'name':        name,
            'description': description,
            'owner_id':    owner_id,
            'org_type':    org_type,
            'invite_code': invite_code
        }).execute()
        org = result.data[0]
        
        # Auto-add owner as admin member
        supabase.table('org_members').insert({
            'org_id':  org['id'],
            'user_id': owner_id,
            'role':    'admin'
        }).execute()
        
        return org

    def join_org(
        self, 
        invite_code: str, 
        user_id:     str
    ) -> dict:
        # Find org by invite code
        result = (supabase.table('organizations')
                  .select('*')
                  .eq('invite_code', invite_code.upper())
                  .execute())
        if not result.data:
            raise ValueError('Invalid invite code.')
        org = result.data[0]
        
        # Check not already a member
        existing = (supabase.table('org_members')
                    .select('id')
                    .eq('org_id',  org['id'])
                    .eq('user_id', user_id)
                    .execute())
        if existing.data:
            raise ValueError('Already a member of this organization.')
        
        supabase.table('org_members').insert({
            'org_id':  org['id'],
            'user_id': user_id,
            'role':    'member'
        }).execute()
        return org

    def get_user_orgs(self, user_id: str) -> list:
        result = (supabase.table('org_members')
                  .select('role, organizations(*)')
                  .eq('user_id', user_id)
                  .execute())
        return result.data

    def get_org_members(self, org_id: str) -> list:
        result = (supabase.table('org_members')
                  .select('role, joined_at, profiles(id, name, institution)')
                  .eq('org_id', org_id)
                  .execute())
        return result.data

    def get_org_submissions(
        self, 
        org_id:        str,
        assignment_id: str | None = None
    ) -> list:
        query = (supabase.table('submissions')
                 .select('*')
                 .eq('org_id', org_id)
                 .order('submitted_at', desc=True))
        if assignment_id:
            query = query.eq('assignment_id', assignment_id)
        return query.execute().data

    def remove_member(
        self, 
        org_id:  str, 
        user_id: str
    ) -> bool:
        supabase.table('org_members').delete()\
            .eq('org_id',  org_id)\
            .eq('user_id', user_id)\
            .execute()
        return True

    def generate_org_report(self, org_id: str) -> dict:
        """
        Generates a full org report dict for visualization.
        """
        import traceback
        try:
            print(f"DEBUG: Generating report for org_id: {org_id}")
            org_res = (supabase.table('organizations')
                       .select('*')
                       .eq('id', org_id)
                       .execute())
            
            if not org_res.data:
                print(f"DEBUG: Org not found: {org_id}")
                return {'error': 'Organization not found'}
            
            org = org_res.data[0]

            members = self.get_org_members(org_id)
            submissions = self.get_org_submissions(org_id)
            
            # Get raw flags
            flags = (supabase.table('plagiarism_flags')
                     .select('*')
                     .eq('org_id', org_id)
                     .order('flagged_at', desc=True)
                     .execute()).data
            
            # Hydrate flags with student names manually
            if flags:
                sub_ids = set()
                for f in flags:
                    if f.get('submission_id_1'): sub_ids.add(f['submission_id_1'])
                    if f.get('submission_id_2'): sub_ids.add(f['submission_id_2'])
                
                sub_map = {}
                if sub_ids:
                    involved_subs = (supabase.table('submissions')
                                     .select('id, student_name')
                                     .in_('id', list(sub_ids))
                                     .execute()).data
                    sub_map = {s['id']: s['student_name'] for s in involved_subs}
                
                # Fetch assignments for flags
                assign_ids = list(set(f['assignment_id'] for f in flags if f.get('assignment_id')))
                assign_map = {}
                if assign_ids:
                    involved_assigns = (supabase.table('assignments')
                                        .select('id, title')
                                        .in_('id', assign_ids)
                                        .execute()).data
                    assign_map = {a['id']: a['title'] for a in involved_assigns}

                for f in flags:
                    f['submission_id_1'] = {'student_name': sub_map.get(f['submission_id_1'], 'Unknown')}
                    f['submission_id_2'] = {'student_name': sub_map.get(f['submission_id_2'], 'Unknown')}
                    if f.get('assignment_id'):
                        f['assignment_id'] = {'title': assign_map.get(f['assignment_id'], 'None')}
            
            # Get assignments and manually count submissions
            assignments = (supabase.table('assignments')
                           .select('*')
                           .eq('org_id', org_id)
                           .execute()).data
                           
            for a in assignments:
                assign_subs = (supabase.table('assignment_submissions')
                               .select('is_late')
                               .eq('assignment_id', a['id'])
                               .execute()).data
                a['late_count'] = sum(1 for s in assign_subs if s.get('is_late'))
                a['on_time_count'] = len(assign_subs) - a['late_count']

            return {
                'org': org,
                'report': {
                    'generated_at': datetime.now(timezone.utc).isoformat(),
                    'members_count': len(members),
                    'submissions_count': len(submissions),
                    'assignments_count': len(assignments),
                    'flags_count': len(flags),
                    'assignments': assignments,
                    'flags': flags,
                    'submissions': submissions
                }
            }
        except Exception as e:
            print("ERROR in generate_org_report:")
            traceback.print_exc()
            raise e

    def create_api_key(
        self, 
        org_id:     str, 
        label:      str,
        created_by: str
    ) -> dict:
        full_key, key_hash, key_preview = generate_api_key()
        supabase.table('api_keys').insert({
            'org_id':      org_id,
            'key_hash':    key_hash,
            'key_preview': key_preview,
            'label':       label,
            'created_by':  created_by
        }).execute()
        # Return full key ONLY on creation — never stored
        return {
            'key':         full_key,
            'key_preview': key_preview,
            'label':       label,
            'warning':     'Save this key now. It will not be shown again.'
        }

    def validate_api_key(self, raw_key: str) -> dict | None:
        """
        Hashes the provided key and checks against api_keys.
        Returns the api_key row if valid and active, else None.
        Updates last_used timestamp on success.
        """
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        result = (supabase.table('api_keys')
                  .select('*, organizations(id, name)')
                  .eq('key_hash',   key_hash)
                  .eq('is_active',  True)
                  .execute())
        if not result.data:
            return None
        key_row = result.data[0]
        # Update last_used
        supabase.table('api_keys').update({
            'last_used': datetime.now(timezone.utc).isoformat()
        }).eq('id', key_row['id']).execute()
        return key_row

    def revoke_api_key(self, key_id: str) -> bool:
        supabase.table('api_keys').update({
            'is_active': False
        }).eq('id', key_id).execute()
        return True

    def delete_org(self, org_id: str) -> bool:
        """
        Deletes an organization and all associated data.
        Handles manual deletion of related data to avoid Foreign Key violations.
        """
        try:
            # 1. Delete plagiarism flags linked to this org
            supabase.table('plagiarism_flags').delete().eq('org_id', org_id).execute()

            # 2. Delete assignment submissions (linked via assignments)
            # First get assignment IDs
            assign_res = supabase.table('assignments').select('id').eq('org_id', org_id).execute()
            assign_ids = [a['id'] for a in assign_res.data]
            if assign_ids:
                supabase.table('assignment_submissions').delete().in_('assignment_id', assign_ids).execute()
            
            # 3. Delete assignments
            supabase.table('assignments').delete().eq('org_id', org_id).execute()
            
            # 4. Handle submissions linked to this org
            # Usually we don't want to delete global submissions, but if they belong to this org, we should.
            # However, if submissions are shared, we might just nullify the org_id.
            # Given the request to "delete organization", we'll nullify org_id to keep the ledger record 
            # but detach it from the deleted org, OR delete them if they are org-specific.
            # For Vouch, submissions are often linked to a user.
            supabase.table('submissions').update({'org_id': None}).eq('org_id', org_id).execute()

            # 5. Delete memberships
            supabase.table('org_members').delete().eq('org_id', org_id).execute()
            
            # 6. Delete API keys
            supabase.table('api_keys').delete().eq('org_id', org_id).execute()
            
            # 7. Finally delete the org
            supabase.table('organizations').delete().eq('id', org_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting organization {org_id}: {e}")
            raise e
