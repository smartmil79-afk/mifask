import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase/anon";
import { parseSearch } from "@/lib/search";
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ items: [] });
  const p = parseSearch(q); const safe = (p.terms.join(" ") || q.toLowerCase()).replace(/[^a-z0-9 ]/gi, "").trim();
  const items: string[] = [];
  if (safe.length >= 2) {
    const { data } = await supabaseAnon().from("ads").select("title").eq("sold", false).ilike("title", `%${safe}%`).limit(25);
    const seen = new Set<string>();
    for (const r of data ?? []) { const t = String(r.title).trim(), k = t.toLowerCase(); if (!seen.has(k)) { seen.add(k); items.push(t); } if (items.length >= 4) break; }
    for (const x of [`cheapest ${safe}`, `${safe} in Lagos`, `${safe} in Abuja`]) if (!items.includes(x)) items.push(x);
  }
  return NextResponse.json({ items: items.slice(0, 7) });
}
