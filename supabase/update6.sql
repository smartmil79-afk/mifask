-- Run ONCE in the Supabase SQL Editor. Adds typo-tolerant search ("iphon" finds iPhone).
create extension if not exists pg_trgm with schema extensions;
create index if not exists ads_title_trgm on ads using gin (title extensions.gin_trgm_ops);
create or replace function fuzzy_ads(p_term text, p_state text default null, p_limit int default 24)
returns setof ads language sql stable as $$
  select a.* from ads a
  where not a.sold and (p_state is null or a.state = p_state) and extensions.word_similarity(p_term, a.title) > 0.45
  order by extensions.word_similarity(p_term, a.title) desc, a.price asc
  limit greatest(p_limit, 1)
$$;
