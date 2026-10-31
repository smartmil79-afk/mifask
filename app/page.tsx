import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { CATS, CAT_ICONS, POPULAR } from "@/lib/constants";
import AdCard from "@/components/AdCard";
import Carousel from "@/components/Carousel";
import HeroSearch from "@/components/HeroSearch";
import FilterForm from "@/components/FilterForm";
export const dynamic = "force-dynamic";
type SP = { q?: string; cat?: string; state?: string; page?: string; sort?: string; min?: string; max?: string };
export default async function Home({ searchParams }: { searchParams: SP }) {
  const s = supabaseServer();
  const { data: { user } } = await s.auth.getUser();
  const { q, cat, state } = searchParams;
  const min = Number(searchParams.min) || 0, max = Number(searchParams.max) || 0;
  const { data: promos } = await s.from("promotions").select("rank, ads(*)").eq("status", "paid").gt("ends_at", new Date().toISOString())
    .order("rank", { ascending: false }).order("ends_at", { ascending: false }).limit(5);
  const pg = Math.max(1, Number(searchParams.page) || 1), size = 24 * pg;
  const sort = searchParams.sort === "low" || searchParams.sort === "high" ? searchParams.sort : "";
  let query = s.from("ads").select("*").eq("sold", false);
  if (cat) query = query.eq("category", cat);
  if (state) query = query.eq("state", state);
  if (min) query = query.gte("price", min);
  if (max) query = query.lte("price", max);
  if (q) { const t = q.replace(/[%,]/g, ""); query = query.or(`title.ilike.%${t}%,description.ilike.%${t}%`); }
  query = sort === "low" ? query.order("price", { ascending: true }) : sort === "high" ? query.order("price", { ascending: false }) : query.order(user ? "created_at" : "views", { ascending: false });
  const { data: ads } = await query.limit(size);
  const { data: counts } = await s.rpc("category_counts");
  const cmap = new Map<string, number>(((counts ?? []) as any[]).map((c) => [c.category, Number(c.n)]));
  const total = Array.from(cmap.values()).reduce((a, b) => a + b, 0);
  const link = (o: Record<string, string>) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries({ q, cat, state, sort, min: searchParams.min, max: searchParams.max, ...o })) if (v) p.set(k, v); return "/?" + p.toString(); };
  const sp = !!promos?.length;
  const feat = sp ? promos!.map((p: any) => ({ ad: p.ads, sp: true })) : (ads ?? []).slice(0, 5).map((a) => ({ ad: a, sp: false }));
  const filtered = !!(q || cat || state || min || max);
  const fp = { q, cat, sort, state, min: searchParams.min, max: searchParams.max };
  return (<>
    {!filtered ? (<section className="hero2"><div className="orb o1" /><div className="orb o2" />
      <span className="eyebrow">🇳🇬 Nigeria’s friendly marketplace</span>
      <h1>Buy and sell <span className="grad">anything</span>,<br />close to you.</h1>
      <HeroSearch q={q} state={state} />
      <div className="pops">Popular:{POPULAR.map((p) => <Link key={p} href={`/?q=${encodeURIComponent(p)}`}>{p}</Link>)}</div>
    </section>) : <div className="slimsearch"><HeroSearch q={q} state={state} /></div>}
    <nav className="mchips" aria-label="Categories"><Link href={link({ cat: "", page: "" })} className={!cat ? "on" : ""}>All</Link>
      {CATS.map((c) => <Link key={c} href={link({ cat: c, page: "" })} className={cat === c ? "on" : ""}><span>{CAT_ICONS[c]}</span>{c}</Link>)}</nav>
    <div className="shell">
      <aside className="side">
        <div className="sidecard"><h3>Categories</h3>
          <Link href={link({ cat: "", page: "" })} className={"sitem" + (!cat ? " on" : "")}><span className="ic">🛍️</span><span>All ads</span><span className="ct">{total}</span></Link>
          {CATS.map((c) => <Link key={c} href={link({ cat: c, page: "" })} className={"sitem" + (cat === c ? " on" : "")}><span className="ic">{CAT_ICONS[c]}</span><span>{c}</span><span className="ct">{cmap.get(c) ?? 0}</span></Link>)}</div>
        <div className="sidecard"><h3>Filters</h3><FilterForm {...fp} /></div>
      </aside>
      <div className="main">
        <details className="mfilters"><summary className="btn alt sm">⚙ Filters{(state || min || max) ? " · on" : ""}</summary><div style={{ paddingTop: 10 }}><FilterForm {...fp} /></div></details>
        <div className="listhead"><h2>{q ? `Results for “${q}”` : cat ? cat : user ? "Fresh listings" : "Latest ads"}{ads ? <span className="meta" style={{ fontWeight: 400, fontSize: ".85rem" }}> · {ads.length}{ads.length >= size ? "+" : ""} ads</span> : null}</h2>
          <div className="sorts">{([["", user ? "Newest" : "Trending"], ["low", "Price: low to high"], ["high", "Price: high to low"]] as [string, string][]).map(([v, l]) => <Link key={v} href={link({ sort: v })} className={sort === v ? "on" : ""}>{l}</Link>)}</div></div>
        <div className="grid">{ads?.length ? ads.map((a) => <AdCard key={a.id} ad={a} />) : <p className="meta">No ads found. Try another search or clear the filters.</p>}</div>
        {!!ads && ads.length >= size && <p style={{ textAlign: "center" }}><Link className="btn alt" href={link({ page: String(pg + 1) })}>Load more</Link></p>}
      </div>
      {!!feat.length && (<aside className="rail"><div className="tools"><h2>{sp ? "★ Top sponsored ads" : user ? "Just listed" : "🔥 Trending now"}</h2></div>
        <Carousel>{feat.map((f) => <AdCard key={f.ad.id} ad={f.ad} sponsored={f.sp} compact />)}</Carousel></aside>)}
    </div>
    {!filtered && (<section className="how"><div><div className="n">1</div><b>Post for free</b><p>Add photos, a price and your details in under a minute.</p></div>
      <div><div className="n">2</div><b>Chat with buyers</b><p>Buyers reach you by chat, phone or WhatsApp. Meet in a public place.</p></div>
      <div><div className="n">3</div><b>Get paid safely</b><p>Use the wallet so money is held until the buyer confirms.</p></div></section>)}
  </>);
}
