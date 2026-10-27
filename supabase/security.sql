-- Two-step login protection for admins. Run ONCE in the Supabase SQL Editor, after admin.sql.
-- If an admin has turned on an authenticator app, admin powers only work in a session that passed the 6-digit code check.
-- Admins who have NOT turned on two-step login keep working as before.
create or replace function is_admin() returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false)
    and (coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
         or not exists (select 1 from auth.mfa_factors where user_id = auth.uid() and status = 'verified'))
$$;
