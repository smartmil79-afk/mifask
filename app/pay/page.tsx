import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { PLANS, PlanKey } from "@/lib/constants";
import PayForm from "@/components/PayForm";
export const metadata = { title: "Pay by bank transfer" };
export const dynamic = "force-dynamic";
export default async function Pay({ searchParams }: { searchParams: { kind?: string; ad?: string; plan?: string } }) {
  const s = supabaseServer(); const { data: { user } } = await s.auth.getUser(); if (!user) redirect("/login");
  if (searchParams.kind !== "promo") return <PayForm kind="topup" />;
  const p = PLANS[searchParams.plan as PlanKey];
  const { data: ad } = await s.from("ads").select("id, title").eq("id", searchParams.ad ?? "").eq("seller_id", user.id).maybeSingle();
  if (!p || !ad) redirect("/dashboard");
  return <PayForm kind="promo" adId={ad.id} adTitle={ad.title} plan={searchParams.plan} planLabel={`${p.name} (${p.label})`} amount={p.price} />;
}
