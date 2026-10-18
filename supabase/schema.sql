create table profiles(id uuid primary key references auth.users on delete cascade, name text, created_at timestamptz default now());
create table ads(id uuid primary key default gen_random_uuid(), seller_id uuid not null references profiles(id) on delete cascade,
 title text not null, category text not null, state text not null, price numeric not null, condition text not null,
 description text not null, phone text not null, images text[] default '{}', views int default 0, created_at timestamptz default now());
create table promotions(id uuid primary key default gen_random_uuid(), ad_id uuid not null references ads(id) on delete cascade,
 plan text not null check (plan in ('basic','pro','premium')), rank int not null, amount int not null, reference text unique not null,
 status text not null default 'pending', starts_at timestamptz, ends_at timestamptz, created_at timestamptz default now());
create index on ads(views desc); create index on promotions(status, ends_at);

alter table profiles enable row level security; alter table ads enable row level security; alter table promotions enable row level security;
create policy "profiles read" on profiles for select using (true);
create policy "ads read" on ads for select using (true);
create policy "ads insert own" on ads for insert with check (auth.uid() = seller_id);
create policy "ads update own" on ads for update using (auth.uid() = seller_id);
create policy "ads delete own" on ads for delete using (auth.uid() = seller_id);
create policy "paid promos public" on promotions for select using (status = 'paid');
create policy "own promos" on promotions for select using (exists (select 1 from ads where ads.id = ad_id and ads.seller_id = auth.uid()));
-- promotions are written only by the server (service role): no insert/update policies on purpose.

create function handle_new_user() returns trigger language plpgsql security definer as $$
begin insert into profiles(id, name) values (new.id, split_part(new.email,'@',1)); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create function increment_views(p_id uuid) returns void language sql security definer as $$ update ads set views = views + 1 where id = p_id $$;

insert into storage.buckets(id, name, public) values ('ad-images','ad-images',true) on conflict do nothing;
create policy "img read" on storage.objects for select using (bucket_id = 'ad-images');
create policy "img upload own folder" on storage.objects for insert to authenticated
 with check (bucket_id = 'ad-images' and (storage.foldername(name))[1] = auth.uid()::text);
