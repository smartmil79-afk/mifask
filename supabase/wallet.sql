-- Run after schema.sql and admin.sql
create table wallets(user_id uuid primary key references profiles(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0), tokens int not null default 0 check (tokens >= 0),
  streak int not null default 0, last_claim date);
create table wallet_tx(id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id) on delete cascade,
  kind text not null, amount bigint not null default 0, tokens int not null default 0, ref text, note text, created_at timestamptz default now());
create unique index wallet_tx_fund_ref on wallet_tx(ref) where kind = 'fund';
create table orders(id uuid primary key default gen_random_uuid(), ad_id uuid references ads(id) on delete set null, ad_title text not null,
  buyer_id uuid not null references profiles(id), seller_id uuid not null references profiles(id), amount bigint not null check (amount > 0),
  status text not null default 'held' check (status in ('held','released','refunded')), created_at timestamptz default now(), closed_at timestamptz);
alter table wallets enable row level security; alter table wallet_tx enable row level security; alter table orders enable row level security;
create policy "own wallet" on wallets for select using (user_id = auth.uid());
create policy "own tx" on wallet_tx for select using (user_id = auth.uid());
create policy "order parties" on orders for select using (buyer_id = auth.uid() or seller_id = auth.uid() or is_admin());
-- No insert/update policies on purpose: money only moves through the functions below.
insert into wallets(user_id) select id from profiles on conflict do nothing;

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, name) values (new.id, split_part(new.email,'@',1));
  insert into wallets(user_id) values (new.id);
  return new;
end $$;

-- Daily tokens: 1 token per day, +3 bonus on every 7th day in a row. Day = Lagos time.
create function claim_daily_tokens() returns int language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); w wallets; today date := (now() at time zone 'Africa/Lagos')::date; s int; r int;
begin
  if u is null then raise exception 'not signed in'; end if;
  insert into wallets(user_id) values (u) on conflict do nothing;
  select * into w from wallets where user_id = u for update;
  if w.last_claim = today then raise exception 'already claimed today'; end if;
  s := case when w.last_claim = today - 1 then w.streak + 1 else 1 end;
  r := 1 + case when s % 7 = 0 then 3 else 0 end;
  update wallets set tokens = tokens + r, streak = s, last_claim = today where user_id = u;
  insert into wallet_tx(user_id, kind, tokens, note) values (u, 'token_claim', r, 'Daily tokens, day ' || s);
  return r;
end $$;

-- Buy a promotion with wallet money or tokens. Prices: Basic 1000 / 35 tokens / 7 days, Pro 3000 / 55 / 30 days, Premium 5000 / 65 / 60 days.
create function buy_promo(p_ad uuid, p_plan text, p_method text) returns void language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); v_cost bigint; v_tok int; v_days int; v_rank int; w wallets; v_start timestamptz;
begin
  if u is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from ads where id = p_ad and seller_id = u) then raise exception 'not your ad'; end if;
  select case p_plan when 'basic' then 1000 when 'pro' then 3000 when 'premium' then 5000 end,
         case p_plan when 'basic' then 35 when 'pro' then 55 when 'premium' then 65 end,
         case p_plan when 'basic' then 7 when 'pro' then 30 when 'premium' then 60 end,
         case p_plan when 'basic' then 1 when 'pro' then 2 when 'premium' then 3 end
    into v_cost, v_tok, v_days, v_rank;
  if v_cost is null then raise exception 'invalid plan'; end if;
  insert into wallets(user_id) values (u) on conflict do nothing;
  select * into w from wallets where user_id = u for update;
  if p_method = 'wallet' then
    if w.balance < v_cost then raise exception 'insufficient wallet balance'; end if;
    update wallets set balance = balance - v_cost where user_id = u;
    insert into wallet_tx(user_id, kind, amount, note) values (u, 'promo', -v_cost, 'Promotion: ' || p_plan);
  elsif p_method = 'tokens' then
    if w.tokens < v_tok then raise exception 'not enough tokens'; end if;
    update wallets set tokens = tokens - v_tok where user_id = u;
    insert into wallet_tx(user_id, kind, tokens, note) values (u, 'token_spend', -v_tok, 'Promotion: ' || p_plan);
  else raise exception 'invalid method'; end if;
  select greatest(now(), coalesce(max(ends_at), now())) into v_start from promotions where ad_id = p_ad and status = 'paid';
  insert into promotions(ad_id, plan, rank, amount, reference, status, starts_at, ends_at)
    values (p_ad, p_plan, v_rank, case when p_method = 'wallet' then v_cost else 0 end, 'w_' || gen_random_uuid(), 'paid', v_start, v_start + make_interval(days => v_days));
end $$;

-- Pay a seller from the wallet. Money is HELD (escrow) until the buyer confirms, or the seller/admin refunds.
create function pay_for_ad(p_ad uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); a ads; w wallets; oid uuid; v_amt bigint;
begin
  if u is null then raise exception 'not signed in'; end if;
  select * into a from ads where id = p_ad;
  if not found then raise exception 'ad not found'; end if;
  if a.seller_id = u then raise exception 'you cannot buy your own ad'; end if;
  v_amt := a.price::bigint; if v_amt <= 0 then raise exception 'invalid price'; end if;
  insert into wallets(user_id) values (u) on conflict do nothing;
  select * into w from wallets where user_id = u for update;
  if w.balance < v_amt then raise exception 'insufficient wallet balance'; end if;
  update wallets set balance = balance - v_amt where user_id = u;
  insert into orders(ad_id, ad_title, buyer_id, seller_id, amount) values (a.id, a.title, u, a.seller_id, v_amt) returning id into oid;
  insert into wallet_tx(user_id, kind, amount, ref, note) values (u, 'escrow_hold', -v_amt, oid::text, 'Held for: ' || a.title);
  return oid;
end $$;

-- p_release = true: pay the seller (buyer or admin). false: refund the buyer (seller or admin).
create function close_order(p_order uuid, p_release boolean) returns void language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); o orders;
begin
  select * into o from orders where id = p_order for update;
  if not found or o.status <> 'held' then raise exception 'order is not open'; end if;
  if p_release then
    if not (o.buyer_id = u or is_admin()) then raise exception 'only the buyer can release payment'; end if;
    insert into wallets(user_id) values (o.seller_id) on conflict do nothing;
    update wallets set balance = balance + o.amount where user_id = o.seller_id;
    insert into wallet_tx(user_id, kind, amount, ref, note) values (o.seller_id, 'sale', o.amount, o.id::text, 'Sale: ' || o.ad_title);
    update orders set status = 'released', closed_at = now() where id = o.id;
  else
    if not (o.seller_id = u or is_admin()) then raise exception 'only the seller or an admin can refund'; end if;
    update wallets set balance = balance + o.amount where user_id = o.buyer_id;
    insert into wallet_tx(user_id, kind, amount, ref, note) values (o.buyer_id, 'escrow_refund', o.amount, o.id::text, 'Refund: ' || o.ad_title);
    update orders set status = 'refunded', closed_at = now() where id = o.id;
  end if;
end $$;

-- Called only by the server (and by review_manual_payment) and never by users.
create function fund_wallet(p_user uuid, p_amount bigint, p_ref text) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into wallet_tx(user_id, kind, amount, ref, note) values (p_user, 'fund', p_amount, p_ref, 'Wallet top-up');
  insert into wallets(user_id) values (p_user) on conflict do nothing;
  update wallets set balance = balance + p_amount where user_id = p_user;
exception when unique_violation then return;
end $$;
revoke all on function fund_wallet(uuid, bigint, text) from public, anon, authenticated;
