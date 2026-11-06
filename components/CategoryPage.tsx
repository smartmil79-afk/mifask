import Link from "next/link";
import type { Metadata } from "next";
import { supabaseAnon } from "@/lib/supabase/anon";
import { STATES, CAT_ICONS } from "@/lib/constants";
import { CAT_SEO, siteUrl, slug } from "@/lib/seo";
import AdCard from "./AdCard";
import JsonLd from "./JsonLd";
import SeoLinks from "./SeoLinks";
async function load(cat: string, state?: string) {
  let q = supabaseAnon().from("ads").select("*", { count: "exact" }).eq("sold", false).eq("category", cat);
  if (state) q = q.eq("state", state);
  const { data, count } = await q.order("created_at", { ascending: false }).limit(48);
  return { ads: (data ?? []) as any[], count: count ?? 0 };
}
const heading = (cat: string, state?: string) => `${cat} for sale in ${state ?? "Nigeria"}`;
export async function categoryMetadata(cat: string, state?: string): Promise<Metadata> {
  const { count } = await load(cat, state);
  const seo = CAT_SEO[cat]; const path = `/category/${slug(cat)}${state ? "/" + slug(state) : ""}`;
  const title = `${heading(cat, state)} | Buy and sell ${seo?.noun ?? cat.toLowerCase()}`;
  const description = `${count ? count + " " : ""}${cat} ads in ${state ?? "Nigeria"} on Mifask. ${seo?.intro ?? ""}`.slice(0, 300);
  return { title: { absolute: title }, description, alternates: { canonical: path }, robots: count ? { index: true, follow: true } : { index: false, follow: true }, openGraph: { title, description, url: path, type: "website" } };
}
export default async function CategoryPage({ cat, state }: { cat: string; state?: string }) {
  const { ads, count } = await load(cat, state); const seo = CAT_SEO[cat]; const base = siteUrl();
  const crumbs = [{ n: "Home", u: "/" }, { n: cat, u: `/category/${slug(cat)}` }, ...(state ? [{ n: state, u: `/category/${slug(cat)}/${slug(state)}` }] : [])];
  return (<>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.n, item: base + c.u })) }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: heading(cat, state), numberOfItems: ads.length, itemListElement: ads.slice(0, 20).map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${base}/ads/${a.id}`, name: a.title })) }} />
    <nav className="crumbs" aria-label="Breadcrumb">{crumbs.map((c, i) => <span key={c.u}>{i > 0 && " / "}{i < crumbs.length - 1 ? <Link href={c.u}>{c.n}</Link> : c.n}</span>)}</nav>
    <h1 className="seoh1">{CAT_ICONS[cat]} {heading(cat, state)}</h1>
    <p className="seolead">{seo?.intro} {count ? `There are ${count} ${cat.toLowerCase()} ads${state ? " in " + state : " across Nigeria"} right now.` : "No ads yet. Be the first to post one."}</p>
    <div className="sorts" style={{ marginBottom: 14 }}>
      <Link href={`/category/${slug(cat)}`} className={!state ? "on" : ""}>All Nigeria</Link>
      {STATES.map((st) => <Link key={st} href={`/category/${slug(cat)}/${slug(st)}`} className={state === st ? "on" : ""}>{st}</Link>)}</div>
    {ads.length ? <div className="grid">{ads.map((a) => <AdCard key={a.id} ad={a} />)}</div>
      : <div className="empty">No {cat.toLowerCase()} ads{state ? " in " + state : ""} yet. <Link href="/post" style={{ textDecoration: "underline" }}>Post a free ad</Link> and reach buyers today.</div>}
    <SeoLinks cat={cat} />
  </>);
}
