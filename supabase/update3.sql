-- Run ONCE in the Supabase SQL Editor.
-- 1) Sellers can edit their own ads, but not their views, owner or creation date.
create or replace function ads_guard() returns trigger language plpgsql as $$
begin
  if current_user = 'authenticated' then
    if not is_admin() then new.views := old.views; end if;
    new.seller_id := old.seller_id;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;
drop trigger if exists ads_guard on ads;
create trigger ads_guard before update on ads for each row execute function ads_guard();

-- 2) Ad counts per category for the sidebar.
create or replace function category_counts() returns table(category text, n bigint) language sql stable as $$
  select a.category, count(*) from ads a where not a.sold group by a.category
$$;
