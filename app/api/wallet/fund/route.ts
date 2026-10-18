import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
export async function POST(req: Request) {
  const { amount } = await req.json(); const n = Math.floor(Number(amount));
  if (!(n >= 100 && n <= 500000)) return NextResponse.json({ error: "Amount must be between ₦100 and ₦500,000" }, { status: 400 });
  const { data: { user } } = await supabaseServer().auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const reference = `wf_${crypto.randomUUID().replace(/-/g, "")}`;
  const r = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST", headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, amount: n * 100, reference, callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/wallet`, metadata: { type: "wallet", userId: user.id } }),
  });
  const j = await r.json();
  if (!j.status) return NextResponse.json({ error: j.message || "Paystack error" }, { status: 502 });
  return NextResponse.json({ url: j.data.authorization_url });
}
