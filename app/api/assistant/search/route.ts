import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { prodTerms } from "@/lib/assistant";
import { STATES } from "@/lib/constants";
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") || "";
  const state = STATES.find((s) => q.toLowerCase().includes(s.split(" ")[0].toLowerCase()));
  const t = prodTerms(q).filter((w) => !STATES.some((s) => s.toLowerCase().includes(w))).map((w) => w.replace(/[^a-z0-9]/g, "")).filter(Boolean).slice(0, 5);
  if (!t.length) return NextResponse.json({ ads: [] });
  let query = supabaseServer().from("ads").select("id, title, price, state").eq("sold", false)
    .or(t.map((w) => `title.ilike.%${w}%,description.ilike.%${w}%,category.ilike.%${w}%`).join(",")).order("created_at", { ascending: false }).limit(4);
  if (state) query = query.eq("state", state);
  const { data } = await query;
  return NextResponse.json({ ads: data ?? [] });
}
