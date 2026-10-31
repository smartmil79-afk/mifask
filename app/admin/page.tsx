import Link from "next/link";
import { adminGuard } from "@/lib/admin";
import { naira } from "@/lib/constants";
import Flash from "@/components/Flash";
export const dynamic = "force-dynamic";
export default async function Overview({ searchParams }: { searchParams: { e?: string; m?: string } }) {
  const { s, isSuper } = await adminGuard();
  const count = async (t: string, f?: (q: any) => any) => { let q: any = s.from(t).select("*", { count: "exact", head: true }); if (f) q = f(q); return (await q).count ?? 0; };
  const now = new Date().toISOString();
  const [users, ads, reports, active, receipts, wds, held] = await Promise.all([
    count("profiles"), count("ads"), count("reports"), count("promotions", (q) => q.eq("status", "paid").gt("ends_at", now)),
    isSuper ? count("manual_payments", (q) => q.eq("status", "pending")) : 0, isSuper ? count("withdrawals", (q) => q.eq("status", "pending")) : 0, isSuper ? count("orders", (q) => q.eq("status", "held")) : 0]);
  const { data: paid } = isSuper ? await s.from("promotions").select("amount").eq("status", "paid") : { data: [] as any[] };
  const revenue = (paid ?? []).reduce((n: number, p: any) => n + Number(p.amount), 0);
  const { data: fac } = await s.auth.mfa.listFactors(); const hasMfa = !!fac?.totp?.length;
  const cards: [string, string | number, string][] = [["Registered users", users, "/admin/users"], ["Ads", ads, "/admin/ads"], ["Open reports", reports, "/admin/reports"], ["Active promotions", active, "/admin/promotions"]];
  if (isSuper) cards.push(["Receipts to confirm", receipts, "/admin/payments"], ["Pending withdrawals", wds, "/admin/withdrawals"], ["Held payments", held, "/admin/payments"], ["Promotion revenue", naira(revenue), "/admin/promotions"]);
  return (<>
    <Flash e={searchParams.e} m={searchParams.m} />
    {!hasMfa && <div className="note">🔐 Protect this account: <Link href="/security" style={{ textDecoration: "underline" }}>turn on two-step login</Link>.</div>}
    <p className="meta">Tap a card to open that list.</p>
    <div className="sgrid">{cards.map(([l, v, h]) => <Link key={l} href={h} className="card info statlink"><div className="price" style={{ fontSize: "1.7rem" }}>{v}</div>{l} →</Link>)}</div>
  </>);
}
