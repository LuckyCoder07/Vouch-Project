import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_KEY"))

# 1. Fetch a real user ID from the profiles table
profiles_response = supabase.table('profiles').select('id').limit(1).execute()
if not profiles_response.data:
    print("No users found in the profiles table. Please sign up a user in the frontend first.")
    exit(1)

real_uuid = profiles_response.data[0]['id']
print(f"Found real UUID: {real_uuid}")

# 2. Create the organization using this UUID
org_response = supabase.table('organizations').insert({
    'name': 'Test Classroom',
    'org_type': 'classroom'
}).execute()

org_id = org_response.data[0]['id']

# 3. Add the user as an owner (admin) in org_members
member_response = supabase.table('org_members').insert({
    'org_id': org_id,
    'user_id': real_uuid,
    'role': 'admin'
}).execute()

print("Successfully created organization and added the user as an admin!")
