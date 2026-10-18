import { NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { PLANS, PlanKey } from "@/lib/constants";
export async function POST(req: Request) {
  const { adId, plan } = await req.json();
  const p = PLANS[plan as PlanKey]; if (!p) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  const s = supabaseServer(); const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const { data: ad } = await s.from("ads").select("id").eq("id", adId).eq("seller_id", user.id).single();
  if (!ad) return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  const reference = `nm_${crypto.randomUUID().replace(/-/g, "")}`;
  const r = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST", headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, amount: p.price * 100, reference, callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`, metadata: { adId, plan } }),
  });
  const j = await r.json();
  if (!j.status) return NextResponse.json({ error: j.message || "Paystack error" }, { status: 502 });
  await supabaseAdmin().from("promotions").insert({ ad_id: adId, plan, rank: p.rank, amount: p.price, reference });
  return NextResponse.json({ url: j.data.authorization_url });
}
