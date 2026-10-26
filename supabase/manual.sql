-- Run after schema.sql, admin.sql, wallet.sql, extras.sql
-- Manual bank-transfer payments: users upload a receipt, an admin confirms the money, then the ad is sponsored or the wallet is credited.
create table manual_payments(id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id),
  kind text not null check (kind in ('promo','topup')), ad_id uuid references ads(id) on delete set null, ad_title text,
  plan text check (plan in ('basic','pro','premium')), amount bigint not null check (amount > 0), reference text not null, receipt_path text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')), note text, created_at timestamptz default now(), closed_at timestamptz);
-- The same transaction ID cannot be used twice (rejected ones can be resubmitted).
create unique index manual_ref_unique on manual_payments (lower(reference)) where status <> 'rejected';
alter table manual_payments enable row level security;
create policy "manual read" on manual_payments for select using (user_id = auth.uid() or is_admin());

insert into storage.buckets(id, name, public) values ('receipts','receipts',false) on conflict do nothing;
create policy "receipt upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "receipt read" on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

create function submit_manual_payment(p_kind text, p_ad uuid, p_plan text, p_amount bigint, p_reference text, p_receipt text)
returns uuid language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); v_amt bigint; v_title text; pid uuid;
begin
  if u is null then raise exception 'not signed in'; end if;
  if length(trim(p_reference)) < 4 then raise exception 'enter the transaction or session ID from your receipt'; end if;
  if p_receipt not like u::text || '/%' then raise exception 'invalid receipt'; end if;
  if (select count(*) from manual_payments where user_id = u and status = 'pending') >= 5 then raise exception 'you already have 5 payments waiting for review'; end if;
  if p_kind = 'promo' then
    select title into v_title from ads where id = p_ad and seller_id = u;
    if not found then raise exception 'not your ad'; end if;
    v_amt := case p_plan when 'basic' then 1000 when 'pro' then 3000 when 'premium' then 5000 end;
    if v_amt is null then raise exception 'invalid plan'; end if;
  elsif p_kind = 'topup' then
    if p_amount < 100 or p_amount > 500000 then raise exception 'amount must be between 100 and 500,000 naira'; end if;
    v_amt := p_amount; p_plan := null; p_ad := null;
  else raise exception 'invalid payment type'; end if;
  insert into manual_payments(user_id, kind, ad_id, ad_title, plan, amount, reference, receipt_path)
    values (u, p_kind, p_ad, v_title, p_plan, v_amt, trim(p_reference), p_receipt) returning id into pid;
  return pid;
exception when unique_violation then raise exception 'this transaction ID was already submitted';
end $$;

-- Admin: approve ONLY after you see the money in your bank account.
create function review_manual_payment(p_id uuid, p_ok boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare m manual_payments; v_days int; v_rank int; v_start timestamptz;
begin
  if not is_admin() then raise exception 'admins only'; end if;
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
