import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { CATS, CAT_ICONS, POPULAR } from "@/lib/constants";
import AdCard from "@/components/AdCard";
import Carousel from "@/components/Carousel";
import HeroSearch from "@/components/HeroSearch";
import FilterForm from "@/components/FilterForm";
import JsonLd from "@/components/JsonLd";
import SeoLinks from "@/components/SeoLinks";
import { smartSearch, headline } from "@/lib/search";
import { siteUrl, slug } from "@/lib/seo";
export const dynamic = "force-dynamic";
type SP = { q?: string; cat?: string; state?: string; page?: string; sort?: string; min?: string; max?: string };
export async function generateMetadata({ searchParams }: { searchParams: SP }) {
  const filtered = !!(searchParams.q || searchParams.cat || searchParams.state || searchParams.min || searchParams.max || searchParams.sort || searchParams.page);
  const title = "Mifask - Buy and sell vehicles, phones, property and more in Nigeria";
  const description = "Nigeria's friendly marketplace. Find cars, phones, houses, laptops, jobs and services near you, chat with sellers and pay safely with the Mifask wallet. Post your ad for free.";
  if (!filtered) return { title: { absolute: title }, description, alternates: { canonical: "/" }, openGraph: { title, description, type: "website", url: "/" } };
  const cat = CATS.find((c) => c === searchParams.cat);
  return { title: searchParams.q ? `Search: ${searchParams.q}` : cat ? `${cat} for sale in Nigeria` : "Search results", description, robots: { index: false, follow: true }, alternates: { canonical: cat && !searchParams.q ? `/category/${slug(cat)}` : "/" } };
}
export default async function Home({ searchParams }: { searchParams: SP }) {
  const s = supabaseServer();
  const { data: { user } } = await s.auth.getUser();
  const { q, cat, state } = searchParams;
  const min = Number(searchParams.min) || 0, max = Number(searchParams.max) || 0;
  const nowIso = new Date().toISOString();
  const { data: active } = await s.from("promotions").select("ad_id, plan, rank").eq("status", "paid").gt("ends_at", nowIso).order("rank", { ascending: false }).limit(300);
  const pmap = new Map<string, { plan: string; rank: number }>();
  for (const p of (active ?? []) as any[]) if (!pmap.has(p.ad_id)) pmap.set(p.ad_id, { plan: p.plan, rank: p.rank });
  const apply = (qq: any) => {
    if (cat) qq = qq.eq("category", cat);
    if (state) qq = qq.eq("state", state);
    if (min) qq = qq.gte("price", min);
    if (max) qq = qq.lte("price", max);
    if (q) { const t = q.replace(/[%,]/g, ""); qq = qq.or(`title.ilike.%${t}%,description.ilike.%${t}%`); }
    return qq;
  };
  const pg = Math.max(1, Number(searchParams.page) || 1), size = 24 * pg;
  const sort = searchParams.sort === "low" || searchParams.sort === "high" ? searchParams.sort : "";
  let rest: any[] = []; let adsError: { message: string } | null = null; let smart: { notes: string[]; parsed: any } | null = null;
  if (q) {
    const r = await smartSearch(s, q, { state, cat, min, max, sort: sort || undefined }, size);
    rest = r.ads; smart = { notes: r.notes, parsed: r.parsed };
  } else {
    let query = apply(s.from("ads").select("*")).order("sold", { ascending: true });
    query = sort === "low" ? query.order("price", { ascending: true }) : sort === "high" ? query.order("price", { ascending: false }) : query.order(user ? "created_at" : "views", { ascending: false });
    const res = await query.limit(size); rest = (res.data ?? []) as any[]; adsError = res.error;
  }
  let promoted: any[] = [];
  const intent = !!(q && (sort || smart?.parsed?.sort));
  if (pmap.size && !intent) {
    let pq = apply(s.from("ads").select("*")).in("id", Array.from(pmap.keys())).eq("sold", false);
    if (q) { const terms = smart?.parsed?.terms ?? []; for (const t of terms) pq = pq.or(`title.ilike.%${t}%,description.ilike.%${t}%`); }
    const { data } = await pq;
    promoted = ((data ?? []) as any[]).sort((a, b) => (pmap.get(b.id)?.rank ?? 0) - (pmap.get(a.id)?.rank ?? 0));
  }
  const pids = new Set(promoted.map((a) => a.id));
  const list = [...promoted, ...rest.filter((a) => !pids.has(a.id))];
  const { data: railData } = await s.from("promotions").select("rank, plan, ads(*)").eq("status", "paid").gt("ends_at", nowIso).order("rank", { ascending: false }).order("ends_at", { ascending: false }).limit(8);
  const rail = ((railData ?? []) as any[]).filter((p) => p.ads && !p.ads.sold).slice(0, 5);
  const { data: counts } = await s.rpc("category_counts");
  const cmap = new Map<string, number>(((counts ?? []) as any[]).map((c) => [c.category, Number(c.n)]));
  const total = Array.from(cmap.values()).reduce((a, b) => a + b, 0);
  const link = (o: Record<string, string>) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries({ q, cat, state, sort, min: searchParams.min, max: searchParams.max, ...o })) if (v) p.set(k, v); return "/?" + p.toString(); };
  const feat = rail.length ? rail.map((p) => ({ ad: p.ads, plan: p.plan, sp: true })) : list.filter((a) => !a.sold).slice(0, 5).map((a) => ({ ad: a, plan: "", sp: false }));
  const filtered = !!(q || cat || state || min || max);
  const fp = { q, cat, sort, state, min: searchParams.min, max: searchParams.max };
  const base = siteUrl();
  return (<>
    {!filtered && <JsonLd data={[{ "@context": "https://schema.org", "@type": "WebSite", name: "Mifask", url: base, potentialAction: { "@type": "SearchAction", target: `${base}/?q={search_term_string}`, "query-input": "required name=search_term_string" } },
      { "@context": "https://schema.org", "@type": "Organization", name: "Mifask", url: base, logo: `${base}/icon.png`, email: "mifask@proton.me" }]} />}
    {!filtered ? (<section className="hero2"><div className="orb o1" /><div className="orb o2" />
      <span className="eyebrow">🇳🇬 Nigeria’s friendly marketplace</span>
      <h1>Buy and sell <span className="grad">anything</span>,<br />close to you.</h1>
      <HeroSearch q={q} state={state} />
      <p className="seolead" style={{ margin: "14px auto 0", maxWidth: 640 }}>Buy and sell cars, phones, houses, laptops, jobs and services across Nigeria. Search in plain words, like “cheapest iPhone in Lagos”.</p>
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
        <div className="listhead"><h2>{q && smart ? headline(smart.parsed, q) : cat ? cat : user ? "Fresh listings" : "Latest ads"}<span className="meta" style={{ fontWeight: 400, fontSize: ".85rem" }}> · {list.length}{rest.length >= size ? "+" : ""} ads</span></h2>
          <div className="sorts">{([["", user ? "Newest" : "Trending"], ["low", "Price: low to high"], ["high", "Price: high to low"]] as [string, string][]).map(([v, l]) => <Link key={v} href={link({ sort: v })} className={sort === v ? "on" : ""}>{l}</Link>)}</div></div>
        {adsError && <div className="note err">Could not load ads: {adsError.message}</div>}
        {smart?.notes.map((n) => <div key={n} className="note">ℹ️ {n}</div>)}
        {smart && !list.length && <div className="empty">Nothing matched “{q}”. Try fewer words, for example “iphone”, or <Link href="/" style={{ textDecoration: "underline" }}>browse all ads</Link>.</div>}
        <div className="grid">{list.length ? list.map((a) => <AdCard key={a.id} ad={a} sponsored={pmap.has(a.id)} plan={pmap.get(a.id)?.plan} />) : <p className="meta">No ads found. Try another search or clear the filters.</p>}</div>
        {rest.length >= size && !q && <p style={{ textAlign: "center" }}><Link className="btn alt" href={link({ page: String(pg + 1) })}>Load more</Link></p>}
      </div>
      {!!feat.length && (<aside className="rail"><div className="tools"><h2>{rail.length ? "★ Top sponsored ads" : user ? "Just listed" : "🔥 Trending now"}</h2></div>
        <Carousel>{feat.map((f) => <AdCard key={f.ad.id} ad={f.ad} sponsored={f.sp} plan={f.plan} compact />)}</Carousel></aside>)}
    </div>
    {!filtered && <SeoLinks />}
    {!filtered && (<section className="how"><div><div className="n">1</div><b>Post for free</b><p>Add photos, a price and your details in under a minute.</p></div>
      <div><div className="n">2</div><b>Chat with buyers</b><p>Buyers reach you by chat, phone or WhatsApp. Meet in a public place.</p></div>
      <div><div className="n">3</div><b>Get paid safely</b><p>Use the wallet so money is held until the buyer confirms.</p></div></section>)}
  </>);
}
