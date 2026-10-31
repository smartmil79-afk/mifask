-- Admin dashboard: users, wallet adjustments, support messages, suspend, delete, activity log.
-- Run ONCE in the Supabase SQL Editor, AFTER update2.sql.
alter table profiles add column if not exists suspended boolean not null default false;
alter table profiles add column if not exists suspended_reason text;
alter table profiles add column if not exists suspended_at timestamptz;

create table if not exists admin_log(id uuid primary key default gen_random_uuid(), admin_id uuid references profiles(id) on delete set null,
  action text not null, target_user uuid, details text, created_at timestamptz not null default now());
alter table admin_log enable row level security;
drop policy if exists "log read" on admin_log;
create policy "log read" on admin_log for select using (is_super_admin());

create or replace function log_admin(p_action text, p_target uuid, p_details text) returns void language sql security definer set search_path = public as $$
  insert into admin_log(admin_id, action, target_user, details) values (auth.uid(), p_action, p_target, left(coalesce(p_details, ''), 500))
$$;
revoke all on function log_admin(text, uuid, text) from public, anon, authenticated;

-- Suspended users: their ads are hidden and they cannot post new ones.
drop policy if exists "ads read" on ads;
create policy "ads read" on ads for select using (seller_id = auth.uid() or is_admin() or not exists (select 1 from profiles p where p.id = seller_id and p.suspended));
drop policy if exists "ads insert own" on ads;
create policy "ads insert own" on ads for insert with check (auth.uid() = seller_id and not exists (select 1 from profiles p where p.id = auth.uid() and p.suspended));

create or replace function admin_list_users(p_q text, p_limit int, p_offset int)
returns table(user_id uuid, email text, display_name text, joined_at timestamptz, last_sign_in timestamptz, suspended boolean, admin_flag boolean, super_flag boolean, balance bigint, tokens int, ad_count int, total_count bigint)
language plpgsql security definer stable set search_path = public as $$
declare v_super boolean := is_super_admin();
begin
  if not is_admin() then return; end if;
  return query
    select p.id, u.email::text, p.name, p.created_at, u.last_sign_in_at, p.suspended, p.is_admin, p.is_super,
      case when v_super then coalesce(w.balance, 0) else 0 end, case when v_super then coalesce(w.tokens, 0) else 0 end,
      (select count(*)::int from ads a where a.seller_id = p.id), count(*) over()
    from profiles p join auth.users u on u.id = p.id left join wallets w on w.user_id = p.id
    where coalesce(p_q, '') = '' or u.email ilike '%' || p_q || '%' or p.name ilike '%' || p_q || '%'
    order by p.created_at desc limit greatest(p_limit, 1) offset greatest(p_offset, 0);
end $$;

create or replace function admin_get_user(p_id uuid)
returns table(user_id uuid, email text, display_name text, joined_at timestamptz, last_sign_in timestamptz, suspended boolean, suspended_reason text, admin_flag boolean, super_flag boolean, balance bigint, tokens int, ad_count int)
language plpgsql security definer stable set search_path = public as $$
declare v_super boolean := is_super_admin();
begin
  if not is_admin() then return; end if;
  return query
    select p.id, u.email::text, p.name, p.created_at, u.last_sign_in_at, p.suspended, p.suspended_reason, p.is_admin, p.is_super,
      case when v_super then coalesce(w.balance, 0) else 0 end, case when v_super then coalesce(w.tokens, 0) else 0 end,
      (select count(*)::int from ads a where a.seller_id = p.id)
    from profiles p join auth.users u on u.id = p.id left join wallets w on w.user_id = p.id where p.id = p_id;
end $$;

create or replace function admin_rename_user(p_user uuid, p_name text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if char_length(trim(p_name)) < 1 then raise exception 'name cannot be empty'; end if;
  update profiles set name = left(trim(p_name), 60) where id = p_user;
  perform log_admin('rename', p_user, trim(p_name));
end $$;

create or replace function admin_set_suspended(p_user uuid, p_suspend boolean, p_reason text) returns void language plpgsql security definer set search_path = public as $$
declare t profiles;
begin
  if not is_admin() then raise exception 'admins only'; end if;
  select * into t from profiles where id = p_user;
  if not found then raise exception 'user not found'; end if;
  if p_user = auth.uid() then raise exception 'you cannot suspend yourself'; end if;
  if t.is_super then raise exception 'a super admin cannot be suspended'; end if;
  if t.is_admin and not is_super_admin() then raise exception 'only a super admin can suspend an admin'; end if;
  update profiles set suspended = p_suspend, suspended_reason = case when p_suspend then left(p_reason, 300) else null end,
    suspended_at = case when p_suspend then now() else null end where id = p_user;
  update auth.users set banned_until = case when p_suspend then now() + interval '100 years' else null end where id = p_user;
  perform log_admin(case when p_suspend then 'suspend' else 'unsuspend' end, p_user, p_reason);
end $$;

create or replace function admin_adjust_wallet(p_user uuid, p_amount bigint, p_tokens int, p_note text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_super_admin() then raise exception 'super admins only'; end if;
  if p_amount = 0 and p_tokens = 0 then raise exception 'enter an amount or coins'; end if;
  if abs(p_amount) > 5000000 or abs(p_tokens) > 100000 then raise exception 'amount is too large'; end if;
  insert into wallets(user_id) values (p_user) on conflict do nothing;
  update wallets set balance = balance + p_amount, tokens = tokens + p_tokens where user_id = p_user;
  insert into wallet_tx(user_id, kind, amount, tokens, note) values (p_user, 'admin_adjust', p_amount, p_tokens, coalesce(nullif(trim(p_note), ''), 'Adjustment by Mifask'));
  perform log_admin('wallet', p_user, 'naira ' || p_amount || ', coins ' || p_tokens || ', ' || coalesce(p_note, ''));
end $$;

create or replace function admin_message_user(p_user uuid, p_body text) returns uuid language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); b text := trim(p_body); cid uuid;
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if p_user = u then raise exception 'you cannot message yourself'; end if;
  if b = '' or char_length(b) > 1000 then raise exception 'message must be 1 to 1000 characters'; end if;
  select id into cid from conversations where ad_id is null and buyer_id = p_user and seller_id = u limit 1;
  if cid is null then
    insert into conversations(ad_id, ad_title, buyer_id, seller_id) values (null, 'Mifask Support', p_user, u) returning id into cid;
  end if;
  insert into messages(conversation_id, sender_id, body) values (cid, u, b);
  update conversations set last_message = left(b, 120), last_sender = u, last_at = now(), seller_read_at = now() where id = cid;
  perform log_admin('message', p_user, left(b, 120));
  return cid;
end $$;

create or replace function admin_delete_user(p_user uuid) returns void language plpgsql security definer set search_path = public as $$
declare t profiles; v_bal bigint;
begin
  if not is_super_admin() then raise exception 'super admins only'; end if;
  select * into t from profiles where id = p_user;
  if not found then raise exception 'user not found'; end if;
  if p_user = auth.uid() or t.is_super then raise exception 'this account cannot be deleted'; end if;
  select coalesce(balance, 0) into v_bal from wallets where user_id = p_user;
  if coalesce(v_bal, 0) > 0 or exists (select 1 from orders where buyer_id = p_user or seller_id = p_user)
     or exists (select 1 from withdrawals where user_id = p_user) or exists (select 1 from manual_payments where user_id = p_user) then
    raise exception 'This user has payment records or money in the wallet, so the account cannot be deleted. Suspend it instead.';
  end if;
  perform log_admin('delete', p_user, t.name);
  delete from auth.users where id = p_user;
end $$;
