import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { CATS, STATES } from "@/lib/constants";
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
  return (<>
    <div className="hero"><h1>Buy and sell anything, close to you.</h1>
      <form className="search"><input name="q" defaultValue={q} placeholder="Search phones, cars, flats, jobs…" />
        <select name="state" defaultValue={state || ""}><option value="">All Nigeria</option>{STATES.map((x) => <option key={x}>{x}</option>)}</select>
        <button className="btn">Search</button></form></div>
    {!user && <p className="meta">Showing trending ads. <Link href="/login" style={{ color: "var(--ink)", fontWeight: 700 }}>Sign in</Link> to post, save and promote ads.</p>}
    <div className="split"><div className="main">
      <div className="cats"><Link href="/" className={!cat ? "on" : ""}>🛍️ All</Link>{CATS.map((c) => <Link key={c} href={`/?cat=${encodeURIComponent(c)}`} className={cat === c ? "on" : ""}>{c}</Link>)}</div>
      <h2>{user ? "Fresh listings" : "Latest ads"}</h2>
      <div className="grid">{ads?.length ? ads.map((a) => <AdCard key={a.id} ad={a} />) : <p className="meta">No ads found.</p>}</div>
      {!!ads && ads.length >= size && <p style={{ textAlign: "center" }}><Link className="btn alt" href={`/?${new URLSearchParams({ ...(q ? { q } : {}), ...(cat ? { cat } : {}), ...(state ? { state } : {}), page: String(pg + 1) })}`}>Load more</Link></p>}
    </div>
    {!!feat.length && (<aside className="rail"><div className="tools"><h2>{sp ? "★ Top sponsored ads" : user ? "Just listed" : "🔥 Trending now"}</h2></div>
      <Carousel>{feat.map((f) => <AdCard key={f.ad.id} ad={f.ad} sponsored={f.sp} />)}</Carousel></aside>)}
    </div>
  </>);
}
