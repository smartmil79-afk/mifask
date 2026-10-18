-- Run once after schema.sql
alter table profiles add column if not exists is_admin boolean not null default false;

create function is_admin() returns boolean language sql security definer stable as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false) $$;

create policy "admin delete any ad" on ads for delete using (is_admin());
create policy "admin read all promos" on promotions for select using (is_admin());

create table reports(id uuid primary key default gen_random_uuid(), ad_id uuid not null references ads(id) on delete cascade,
  reporter_id uuid not null references profiles(id) on delete cascade, reason text not null, created_at timestamptz default now(),
  unique (ad_id, reporter_id));
alter table reports enable row level security;
create policy "report insert" on reports for insert with check (auth.uid() = reporter_id);
create policy "admin read reports" on reports for select using (is_admin());
create policy "admin delete reports" on reports for delete using (is_admin());

-- Make yourself admin (replace the email):
-- update profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');
