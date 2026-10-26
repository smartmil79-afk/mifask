import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { CATS, STATES, CAT_ICONS, POPULAR } from "@/lib/constants";
import AdCard from "@/components/AdCard";
import Carousel from "@/components/Carousel";
export const dynamic = "force-dynamic";
export default async function Home({ searchParams }: { searchParams: { q?: string; cat?: string; state?: string; page?: string } }) {
  const s = supabaseServer();
  const { data: { user } } = await s.auth.getUser();
  const { q, cat, state } = searchParams;
  const { data: promos } = await s.from("promotions").select("rank, ads(*)").eq("status", "paid").gt("ends_at", new Date().toISOString())
    .order("rank", { ascending: false }).order("ends_at", { ascending: false }).limit(5);
  const pg = Math.max(1, Number(searchParams.page) || 1), size = 24 * pg;
  let query = s.from("ads").select("*").eq("sold", false).order(user ? "created_at" : "views", { ascending: false }).limit(size);
  if (cat) query = query.eq("category", cat);
  if (state) query = query.eq("state", state);
  if (q) { const t = q.replace(/[%,]/g, ""); query = query.or(`title.ilike.%${t}%,description.ilike.%${t}%`); }
  const { data: ads } = await query;
  const sp = !!promos?.length;
  const feat = sp ? promos!.map((p: any) => ({ ad: p.ads, sp: true })) : (ads ?? []).slice(0, 5).map((a) => ({ ad: a, sp: false }));
  const filtered = !!(q || cat || state);
  return (<>
    {!filtered && (<section className="hero2"><div className="orb o1" /><div className="orb o2" />
      <span className="eyebrow">🇳🇬 Nigeria’s friendly marketplace</span>
      <h1>Buy and sell <span className="grad">anything</span>,<br />close to you.</h1>
      <form className="search big"><input name="q" defaultValue={q} placeholder="What are you looking for?" />
        <select name="state" defaultValue={state || ""}><option value="">All Nigeria</option>{STATES.map((x) => <option key={x}>{x}</option>)}</select>
        <button className="btn">Search</button></form>
      <div className="pops">Popular:{POPULAR.map((p) => <Link key={p} href={`/?q=${encodeURIComponent(p)}`}>{p}</Link>)}</div>
      <div className="trust">
        <div><span className="ic">🛡️</span><div><b>Protected payments</b><span>Money is held until you confirm</span></div></div>
        <div><span className="ic">🪙</span><div><b>Free daily tokens</b><span>Spend them on sponsored ads</span></div></div>
        <div><span className="ic">💬</span><div><b>Help in minutes</b><span>Chat assistant and WhatsApp</span></div></div></div>
    </section>)}
    {filtered && (<form className="search big" style={{ margin: "18px 0" }}><input name="q" defaultValue={q} placeholder="What are you looking for?" />
      <select name="state" defaultValue={state || ""}><option value="">All Nigeria</option>{STATES.map((x) => <option key={x}>{x}</option>)}</select><button className="btn">Search</button></form>)}
    <div className="tiles"><Link href="/" className={"tile" + (!cat ? " on" : "")}><span className="ic">🛍️</span>All</Link>
      {CATS.map((c, i) => <Link key={c} href={`/?cat=${encodeURIComponent(c)}`} style={{ animationDelay: `${i * 40}ms` }} className={"tile" + (cat === c ? " on" : "")}><span className="ic">{CAT_ICONS[c]}</span>{c}</Link>)}</div>
    {!user && !filtered && <p className="meta">Showing trending ads. <Link href="/login" style={{ color: "var(--ink)", fontWeight: 700, textDecoration: "underline" }}>Sign in</Link> to post, save and promote ads.</p>}
    <div className="split"><div className="main">
      <h2>{q ? `Results for “${q}”` : cat ? cat : user ? "Fresh listings" : "Latest ads"}</h2>
      <div className="grid">{ads?.length ? ads.map((a) => <AdCard key={a.id} ad={a} />) : <p className="meta">No ads found. Try another search or category.</p>}</div>
      {!!ads && ads.length >= size && <p style={{ textAlign: "center" }}><Link className="btn alt" href={`/?${new URLSearchParams({ ...(q ? { q } : {}), ...(cat ? { cat } : {}), ...(state ? { state } : {}), page: String(pg + 1) })}`}>Load more</Link></p>}
    </div>
    {!!feat.length && (<aside className="rail"><div className="tools"><h2>{sp ? "★ Top sponsored ads" : user ? "Just listed" : "🔥 Trending now"}</h2></div>
      <Carousel>{feat.map((f) => <AdCard key={f.ad.id} ad={f.ad} sponsored={f.sp} />)}</Carousel></aside>)}
    </div>
    {!filtered && (<section className="how"><div><div className="n">1</div><b>Post for free</b><p>Add photos, a price and your details in under a minute.</p></div>
      <div><div className="n">2</div><b>Chat with buyers</b><p>Buyers reach you by phone or WhatsApp. Meet in a public place.</p></div>
      <div><div className="n">3</div><b>Get paid safely</b><p>Use the wallet so money is held until the buyer confirms.</p></div></section>)}
  </>);
}
