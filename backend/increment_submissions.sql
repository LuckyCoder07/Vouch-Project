create or replace function increment_submissions(
  user_id_param uuid
)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set monthly_submissions = coalesce(monthly_submissions, 0) + 1
  where id = user_id_param;
end;
$$;
