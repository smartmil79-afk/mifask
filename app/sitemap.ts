import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await sb.from("ads").select("id, created_at").eq("sold", false).order("created_at", { ascending: false }).limit(1000);
  return [{ url: base }, ...["safety", "help", "terms", "privacy"].map((p) => ({ url: `${base}/${p}` })), ...(data ?? []).map((a) => ({ url: `${base}/ads/${a.id}`, lastModified: a.created_at }))];
}
