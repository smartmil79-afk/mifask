-- Run ONCE in the Supabase SQL Editor, BEFORE you deploy the new site files.
-- Needs update2.sql and admin2.sql to have been run already.

-- 1) Business and personal accounts, names and logo/picture
alter table profiles add column if not exists account_type text not null default 'personal' check (account_type in ('personal','business'));
alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists last_name text;
alter table profiles add column if not exists business_name text;
alter table profiles add column if not exists business_address text;
alter table profiles add column if not exists business_description text;
alter table profiles add column if not exists avatar_url text;

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
        t text := case when m->>'account_type' = 'business' then 'business' else 'personal' end;
begin
  insert into profiles(id, name, account_type, first_name, last_name, business_name)
  values (new.id,
    coalesce(nullif(trim(case when t = 'business' then m->>'business_name' else m->>'first_name' end), ''), split_part(new.email, '@', 1)),
    t, nullif(left(trim(coalesce(m->>'first_name', '')), 40), ''), nullif(left(trim(coalesce(m->>'last_name', '')), 40), ''),
    case when t = 'business' then nullif(left(trim(coalesce(m->>'business_name', '')), 80), '') end);
  insert into wallets(user_id) values (new.id);
  return new;
end $$;

-- Users edit their own profile ONLY through this function (they can never change admin or suspended flags).
create or replace function update_my_profile(p_type text, p_first text, p_last text, p_business text, p_address text, p_description text, p_avatar text)
returns void language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); t text := case when p_type = 'business' then 'business' else 'personal' end;
        f text := nullif(left(trim(coalesce(p_first, '')), 40), ''); b text := nullif(left(trim(coalesce(p_business, '')), 80), '');
begin
  if u is null then raise exception 'not signed in'; end if;
  if t = 'business' and b is null then raise exception 'enter your business name'; end if;
  if coalesce(p_avatar, '') <> '' and p_avatar not like 'https://%' then raise exception 'invalid picture address'; end if;
  update profiles set account_type = t, first_name = f, last_name = nullif(left(trim(coalesce(p_last, '')), 40), ''),
    business_name = case when t = 'business' then b end,
    business_address = case when t = 'business' then nullif(left(trim(coalesce(p_address, '')), 200), '') end,
    business_description = case when t = 'business' then nullif(left(trim(coalesce(p_description, '')), 500), '') end,
    avatar_url = nullif(p_avatar, ''), name = coalesce(case when t = 'business' then b else f end, name)
  where id = u;
end $$;

insert into storage.buckets(id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars upload own" on storage.objects;
create policy "avatars upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 2) Daily views per ad (your own visits are not counted)
create table if not exists ad_stats(ad_id uuid not null references ads(id) on delete cascade, day date not null, views int not null default 0, primary key (ad_id, day));
alter table ad_stats enable row level security;
drop policy if exists "stats owner" on ad_stats;
create policy "stats owner" on ad_stats for select using (exists (select 1 from ads a where a.id = ad_id and a.seller_id = auth.uid()) or is_admin());
create or replace function increment_views(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare v_seller uuid;
begin
  select seller_id into v_seller from ads where id = p_id;
  if v_seller is null or v_seller = auth.uid() then return; end if;
  update ads set views = views + 1 where id = p_id;
  insert into ad_stats(ad_id, day, views) values (p_id, (now() at time zone 'Africa/Lagos')::date, 1)
    on conflict (ad_id, day) do update set views = ad_stats.views + 1;
end $$;

-- 3) Complaints and support requests
create table if not exists complaints(id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 100), message text not null check (char_length(message) between 5 and 2000),
  status text not null default 'open' check (status in ('open', 'resolved')), response text, responded_at timestamptz, created_at timestamptz not null default now());
alter table complaints enable row level security;
drop policy if exists "complaints read" on complaints;
create policy "complaints read" on complaints for select using (user_id = auth.uid() or is_admin());
create or replace function submit_complaint(p_subject text, p_message text) returns void language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'not signed in'; end if;
  if (select count(*) from complaints where user_id = u and created_at > now() - interval '1 day') >= 5 then raise exception 'you can send up to 5 complaints a day'; end if;
  insert into complaints(user_id, subject, message) values (u, trim(p_subject), trim(p_message));
end $$;
create or replace function respond_complaint(p_id uuid, p_response text, p_resolve boolean) returns void language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  if not is_admin() then raise exception 'admins only'; end if;
  update complaints set response = left(trim(p_response), 1000), responded_at = now(), status = case when p_resolve then 'resolved' else status end where id = p_id returning user_id into t;
  perform log_admin('complaint', t, left(trim(p_response), 200));
end $$;

-- 4) 20,000 coins for smartmil79@gmail.com (added once only)
do $$
declare v uuid;
begin
  select id into v from auth.users where lower(email) = 'smartmil79@gmail.com';
  if v is not null and not exists (select 1 from wallet_tx where user_id = v and note = 'Admin starter coins') then
    insert into wallets(user_id) values (v) on conflict do nothing;
    update wallets set tokens = tokens + 20000 where user_id = v;
    insert into wallet_tx(user_id, kind, tokens, note) values (v, 'admin_adjust', 20000, 'Admin starter coins');
  end if;
end $$;
select u.email, w.tokens from wallets w join auth.users u on u.id = w.user_id where lower(u.email) = 'smartmil79@gmail.com';
