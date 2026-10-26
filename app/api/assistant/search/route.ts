import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { parseQuery } from "@/lib/assistant";
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") || "";
  const { max, state, cat, terms } = parseQuery(q);
  const t = terms.map((x) => x.replace(/[^a-z0-9]/g, "")).filter(Boolean).slice(0, 5);
  if (!t.length && !cat) return NextResponse.json({ ads: [] });
  let query = supabaseServer().from("ads").select("id, title, price, state, images").eq("sold", false).order("created_at", { ascending: false }).limit(4);
  if (t.length) query = query.or(t.map((x) => `title.ilike.%${x}%,description.ilike.%${x}%,category.ilike.%${x}%`).join(","));
  else if (cat) query = query.eq("category", cat);
  if (state) query = query.eq("state", state);
  if (max) query = query.lte("price", max);
  const { data } = await query;
  return NextResponse.json({ ads: data ?? [] });
}
