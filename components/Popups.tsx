import { supabaseServer } from "@/lib/supabase/server";
import LoginPopups from "./LoginPopups";
export default async function Popups() {
  const s = supabaseServer(); const { data: { user } } = await s.auth.getUser();
  if (!user) return null;
  const { data: w } = await s.from("wallets").select("last_claim").eq("user_id", user.id).maybeSingle();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
  const canClaim = w?.last_claim !== today;
  const { data: promos } = await s.from("promotions").select("rank, plan, ads(id, title, price, images, category, state, sold)")
    .eq("status", "paid").gt("ends_at", new Date().toISOString()).order("rank", { ascending: false }).limit(12);
  const live = ((promos ?? []) as any[]).filter((p) => p.ads && !p.ads.sold);
  const best = live[0]?.rank;
  const ads = live.filter((p) => p.rank === best).map((p) => ({ id: p.ads.id, title: p.ads.title, price: Number(p.ads.price), plan: p.plan, images: p.ads.images ?? [], category: p.ads.category, state: p.ads.state }));
  return <LoginPopups userId={user.id} canClaim={canClaim} ads={ads} />;
}
