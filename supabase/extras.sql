-- Run last (after schema.sql, admin.sql, wallet.sql)
alter table ads add column if not exists sold boolean not null default false;

create table bank_accounts(user_id uuid primary key references profiles(id) on delete cascade, bank text not null,
  account_number text not null check (account_number ~ '^[0-9]{10}$'), account_name text not null, updated_at timestamptz default now());
alter table bank_accounts enable row level security;
create policy "bank read" on bank_accounts for select using (user_id = auth.uid() or is_admin());
create policy "bank insert" on bank_accounts for insert with check (user_id = auth.uid());
create policy "bank update" on bank_accounts for update using (user_id = auth.uid());

create table withdrawals(id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id),
  amount bigint not null check (amount >= 1000), fee bigint not null default 0, bank text not null, account_number text not null, account_name text not null,
  status text not null default 'pending' check (status in ('pending','paid','rejected')), note text, created_at timestamptz default now(), closed_at timestamptz);
alter table withdrawals enable row level security;
create policy "withdrawals read" on withdrawals for select using (user_id = auth.uid() or is_admin());

-- Withdrawal fee (what the user loses from the payout) is v_fee below. Change it here.
create function request_withdrawal(p_amount bigint) returns uuid language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); w wallets; b bank_accounts; wid uuid; v_fee bigint := 50;
begin
  if u is null then raise exception 'not signed in'; end if;
  if p_amount < 1000 then raise exception 'minimum withdrawal is 1,000 naira'; end if;
  select * into b from bank_accounts where user_id = u;
  if not found then raise exception 'add your bank details first'; end if;
  select * into w from wallets where user_id = u for update;
  if w.balance < p_amount then raise exception 'insufficient wallet balance'; end if;
  update wallets set balance = balance - p_amount where user_id = u;
  insert into withdrawals(user_id, amount, fee, bank, account_number, account_name) values (u, p_amount, v_fee, b.bank, b.account_number, b.account_name) returning id into wid;
  insert into wallet_tx(user_id, kind, amount, ref, note) values (u, 'withdraw', -p_amount, wid::text, 'Withdrawal to ' || b.bank);
  return wid;
end $$;

-- Admin marks a withdrawal paid (after sending the money) or rejects it (money returns to the wallet).
create function settle_withdrawal(p_id uuid, p_paid boolean, p_note text default null) returns void language plpgsql security definer set search_path = public as $$
declare wd withdrawals;
begin
  if not is_admin() then raise exception 'admins only'; end if;
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
