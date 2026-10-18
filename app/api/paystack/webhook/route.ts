import crypto from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PLANS, PlanKey } from "@/lib/constants";
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!).update(raw).digest("hex");
  if (sig !== req.headers.get("x-paystack-signature")) return NextResponse.json({ error: "bad signature" }, { status: 401 });
  const ev = JSON.parse(raw);
  if (ev.event === "charge.success" && String(ev.data.reference).startsWith("wf_")) {
    const uid = ev.data.metadata?.userId;
    if (!uid) return NextResponse.json({ error: "no user" }, { status: 400 });
    const { error } = await supabaseAdmin().rpc("fund_wallet", { p_user: uid, p_amount: Math.round(ev.data.amount / 100), p_ref: ev.data.reference });
    return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
  }
  if (ev.event !== "charge.success") return NextResponse.json({ ok: true });
  const db = supabaseAdmin();
  const { data: promo } = await db.from("promotions").select("*").eq("reference", ev.data.reference).single();
  if (!promo || promo.status === "paid") return NextResponse.json({ ok: true });
  if (ev.data.amount !== promo.amount * 100) return NextResponse.json({ error: "amount mismatch" }, { status: 400 });
  const { data: last } = await db.from("promotions").select("ends_at").eq("ad_id", promo.ad_id).eq("status", "paid").order("ends_at", { ascending: false }).limit(1);
  const start = last?.[0]?.ends_at && new Date(last[0].ends_at) > new Date() ? new Date(last[0].ends_at) : new Date();
  const end = new Date(start.getTime() + PLANS[promo.plan as PlanKey].days * 864e5);
  await db.from("promotions").update({ status: "paid", starts_at: start.toISOString(), ends_at: end.toISOString() }).eq("id", promo.id);
  return NextResponse.json({ ok: true });
}
