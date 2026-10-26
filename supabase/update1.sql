-- Run ONCE in the Supabase SQL Editor (safe to run again).
-- 1) Give every existing user a profile and wallet (fixes ads that cannot be published by older accounts).
insert into profiles(id, name) select id, split_part(email,'@',1) from auth.users on conflict do nothing;
insert into wallets(user_id) select id from profiles on conflict do nothing;
-- 2) New token prices: Basic 35, Pro 55, Premium 65.
create or replace function buy_promo(p_ad uuid, p_plan text, p_method text) returns void language plpgsql security definer set search_path = public as $$
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
