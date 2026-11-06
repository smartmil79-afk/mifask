import type { MetadataRoute } from "next";
import { supabaseAnon } from "@/lib/supabase/anon";
import { CATS, STATES } from "@/lib/constants";
import { siteUrl, slug } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { data } = await supabaseAnon().from("ads").select("id, category, state, created_at").eq("sold", false).order("created_at", { ascending: false }).limit(5000);
  const ads = (data ?? []) as any[]; const combos = new Set<string>(); const cats = new Set<string>();
  for (const a of ads) { cats.add(a.category); combos.add(`${a.category}|${a.state}`); }
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...["help", "safety", "terms", "privacy"].map((p) => ({ url: `${base}/${p}`, changeFrequency: "monthly" as const, priority: 0.3 })),
    ...CATS.filter((c) => cats.has(c)).map((c) => ({ url: `${base}/category/${slug(c)}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9 })),
    ...Array.from(combos).filter((k) => STATES.includes(k.split("|")[1])).map((k) => { const [c, st] = k.split("|"); return { url: `${base}/category/${slug(c)}/${slug(st)}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 }; }),
    ...ads.map((a) => ({ url: `${base}/ads/${a.id}`, lastModified: new Date(a.created_at), changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
