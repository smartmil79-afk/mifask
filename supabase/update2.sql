-- Super-admin, safer money permissions, and live chat alerts. Run ONCE in the Supabase SQL Editor.
-- Super admin = full admin powers + manages other admins + is the only one who can see receipts, bank details,
-- withdrawals, held payments and chats. Regular admins can still moderate ads and reports.
alter table profiles add column if not exists is_super boolean not null default false;

create or replace function is_admin() returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin or is_super from profiles where id = auth.uid()), false) and (coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2' or not exists (select 1 from auth.mfa_factors where user_id = auth.uid() and status = 'verified'))
$$;
create or replace function is_super_admin() returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_super from profiles where id = auth.uid()), false) and (coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2' or not exists (select 1 from auth.mfa_factors where user_id = auth.uid() and status = 'verified'))
$$;

-- Make smartmil79@gmail.com the super admin.
update profiles set is_super = true, is_admin = true where id = (select id from auth.users where lower(email) = 'smartmil79@gmail.com');

-- Money actions: super admin only.
create or replace function review_manual_payment(p_id uuid, p_ok boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare m manual_payments; v_days int; v_rank int; v_start timestamptz;
begin
  if not is_super_admin() then raise exception 'admins only'; end if;
  select * into m from manual_payments where id = p_id for update;
  if not found or m.status <> 'pending' then raise exception 'payment is not pending'; end if;
  if p_ok then
    if m.kind = 'topup' then
      perform fund_wallet(m.user_id, m.amount, 'mp_' || m.id);
    else
      if m.ad_id is null then raise exception 'the ad no longer exists'; end if;
      select case m.plan when 'basic' then 7 when 'pro' then 30 when 'premium' then 60 end,
             case m.plan when 'basic' then 1 when 'pro' then 2 when 'premium' then 3 end into v_days, v_rank;
      select greatest(now(), coalesce(max(ends_at), now())) into v_start from promotions where ad_id = m.ad_id and status = 'paid';
      insert into promotions(ad_id, plan, rank, amount, reference, status, starts_at, ends_at)
        values (m.ad_id, m.plan, v_rank, m.amount, 'mp_' || m.id, 'paid', v_start, v_start + make_interval(days => v_days));
    end if;
    update manual_payments set status = 'approved', closed_at = now(), note = p_note where id = p_id;
  else
    update manual_payments set status = 'rejected', closed_at = now(), note = p_note where id = p_id;
  end if;
end $$;

create or replace function settle_withdrawal(p_id uuid, p_paid boolean, p_note text default null) returns void language plpgsql security definer set search_path = public as $$
declare wd withdrawals;
begin
  if not is_super_admin() then raise exception 'admins only'; end if;
  select * into wd from withdrawals where id = p_id for update;
  if not found or wd.status <> 'pending' then raise exception 'withdrawal is not pending'; end if;
  if p_paid then
    update withdrawals set status = 'paid', closed_at = now(), note = p_note where id = p_id;
  else
    update wallets set balance = balance + wd.amount where user_id = wd.user_id;
    insert into wallet_tx(user_id, kind, amount, ref, note) values (wd.user_id, 'withdraw_refund', wd.amount, wd.id::text, 'Withdrawal rejected');
    update withdrawals set status = 'rejected', closed_at = now(), note = p_note where id = p_id;
  end if;
end $$;

create or replace function close_order(p_order uuid, p_release boolean) returns void language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); o orders;
begin
  select * into o from orders where id = p_order for update;
  if not found or o.status <> 'held' then raise exception 'order is not open'; end if;
  if p_release then
    if not (o.buyer_id = u or is_super_admin()) then raise exception 'only the buyer can release payment'; end if;
    insert into wallets(user_id) values (o.seller_id) on conflict do nothing;
    update wallets set balance = balance + o.amount where user_id = o.seller_id;
    insert into wallet_tx(user_id, kind, amount, ref, note) values (o.seller_id, 'sale', o.amount, o.id::text, 'Sale: ' || o.ad_title);
    update orders set status = 'released', closed_at = now() where id = o.id;
  else
    if not (o.seller_id = u or is_super_admin()) then raise exception 'only the seller or an admin can refund'; end if;
    update wallets set balance = balance + o.amount where user_id = o.buyer_id;
    insert into wallet_tx(user_id, kind, amount, ref, note) values (o.buyer_id, 'escrow_refund', o.amount, o.id::text, 'Refund: ' || o.ad_title);
    update orders set status = 'refunded', closed_at = now() where id = o.id;
  end if;
end $$;

-- Sensitive data: visible to the owner of the data and the super admin only.
drop policy if exists "bank read" on bank_accounts;
create policy "bank read" on bank_accounts for select using (user_id = auth.uid() or is_super_admin());
drop policy if exists "withdrawals read" on withdrawals;
create policy "withdrawals read" on withdrawals for select using (user_id = auth.uid() or is_super_admin());
drop policy if exists "manual read" on manual_payments;
create policy "manual read" on manual_payments for select using (user_id = auth.uid() or is_super_admin());
drop policy if exists "receipt read" on storage.objects;
create policy "receipt read" on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or is_super_admin()));
drop policy if exists "order parties" on orders;
create policy "order parties" on orders for select using (buyer_id = auth.uid() or seller_id = auth.uid() or is_super_admin());
drop policy if exists "conv read" on conversations;
create policy "conv read" on conversations for select using (buyer_id = auth.uid() or seller_id = auth.uid() or is_super_admin());
drop policy if exists "msg read" on messages;
create policy "msg read" on messages for select using (is_super_admin() or exists (select 1 from conversations c where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())));

-- Only a super admin can add or remove admins.
create or replace function set_admin(p_email text, p_make boolean) returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not is_super_admin() then raise exception 'super admins only'; end if;
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then raise exception 'no account with that email'; end if;
  if exists (select 1 from profiles where id = v_id and is_super) then raise exception 'a super admin cannot be changed'; end if;
  update profiles set is_admin = p_make where id = v_id;
end $$;
create or replace function list_admins() returns table(id uuid, email text, is_super boolean) language plpgsql security definer stable set search_path = public as $$
begin
  if not is_super_admin() then return; end if;
  return query select p.id, u.email::text, p.is_super from profiles p join auth.users u on u.id = p.id where p.is_admin or p.is_super order by p.is_super desc, u.email;
end $$;

-- Live chat alerts (the page also checks every 15 seconds as a backup).
do $$ begin alter publication supabase_realtime add table conversations; exception when others then null; end $$;

-- Check: this should list smartmil79@gmail.com with is_super = true.
select u.email, p.is_super, p.is_admin from profiles p join auth.users u on u.id = p.id where p.is_super;
