-- Buyer-seller chat. Run once in the Supabase SQL Editor after the other files.
create table conversations(id uuid primary key default gen_random_uuid(), ad_id uuid references ads(id) on delete set null, ad_title text not null,
  buyer_id uuid not null references profiles(id) on delete cascade, seller_id uuid not null references profiles(id) on delete cascade,
  last_message text, last_sender uuid, last_at timestamptz not null default now(),
  buyer_read_at timestamptz not null default now(), seller_read_at timestamptz not null default now(), created_at timestamptz not null default now(),
  unique (ad_id, buyer_id));
create table messages(id uuid primary key default gen_random_uuid(), conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade, body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now());
create index on messages(conversation_id, created_at);
alter table conversations enable row level security; alter table messages enable row level security;
-- Only the two people in a chat can read it. Admins can read chats too, for abuse reports.
create policy "conv read" on conversations for select using (buyer_id = auth.uid() or seller_id = auth.uid() or is_admin());
create policy "msg read" on messages for select using (is_admin() or exists (select 1 from conversations c where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())));
-- No insert/update policies on purpose: everything goes through the functions below.

create function start_conversation(p_ad uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); a ads; cid uuid;
begin
  if u is null then raise exception 'not signed in'; end if;
  select * into a from ads where id = p_ad;
  if not found then raise exception 'ad not found'; end if;
  if a.seller_id = u then raise exception 'this is your own ad'; end if;
  insert into conversations(ad_id, ad_title, buyer_id, seller_id) values (a.id, a.title, u, a.seller_id)
    on conflict (ad_id, buyer_id) do update set ad_title = excluded.ad_title returning id into cid;
  return cid;
end $$;

create function send_message(p_conv uuid, p_body text) returns void language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); c conversations; b text := trim(p_body);
begin
  if u is null then raise exception 'not signed in'; end if;
  select * into c from conversations where id = p_conv;
  if not found or (c.buyer_id <> u and c.seller_id <> u) then raise exception 'conversation not found'; end if;
  if b = '' or char_length(b) > 1000 then raise exception 'message must be 1 to 1000 characters'; end if;
  if (select count(*) from messages where sender_id = u and created_at > now() - interval '1 minute') >= 20 then raise exception 'you are sending too fast, please wait a moment'; end if;
  insert into messages(conversation_id, sender_id, body) values (p_conv, u, b);
  update conversations set last_message = left(b, 120), last_sender = u, last_at = now(),
    buyer_read_at = case when u = buyer_id then now() else buyer_read_at end,
    seller_read_at = case when u = seller_id then now() else seller_read_at end where id = p_conv;
end $$;

create function mark_read(p_conv uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  update conversations set buyer_read_at = case when buyer_id = auth.uid() then now() else buyer_read_at end,
    seller_read_at = case when seller_id = auth.uid() then now() else seller_read_at end
  where id = p_conv and (buyer_id = auth.uid() or seller_id = auth.uid());
end $$;

create function unread_count() returns int language sql security definer stable set search_path = public as $$
  select count(*)::int from conversations where last_sender is not null and last_sender <> auth.uid()
    and ((buyer_id = auth.uid() and last_at > buyer_read_at) or (seller_id = auth.uid() and last_at > seller_read_at))
$$;

-- Live updates (the page also checks every few seconds as a backup).
do $$ begin alter publication supabase_realtime add table messages; exception when others then null; end $$;
