import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { naira } from "@/lib/constants";
export const dynamic = "force-dynamic";

async function guard() {
  const s = supabaseServer(); const { data: { user } } = await s.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await s.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) redirect("/");
  return s;
}
async function removeAd(fd: FormData) { "use server"; const s = await guard(); await s.from("ads").delete().eq("id", fd.get("id") as string); revalidatePath("/admin"); }
async function dismiss(fd: FormData) { "use server"; const s = await guard(); await s.from("reports").delete().eq("id", fd.get("id") as string); revalidatePath("/admin"); }

async function settle(fd: FormData) { "use server"; const s = await guard(); await s.rpc("close_order", { p_order: fd.get("id") as string, p_release: fd.get("release") === "1" }); revalidatePath("/admin"); }

async function payout(fd: FormData) { "use server"; const s = await guard(); await s.rpc("settle_withdrawal", { p_id: fd.get("id") as string, p_paid: fd.get("paid") === "1" }); revalidatePath("/admin"); }

export default async function Admin() {
  const s = await guard();
  const count = async (t: string) => (await s.from(t).select("*", { count: "exact", head: true })).count ?? 0;
  const [nAds, nUsers, nReports] = await Promise.all([count("ads"), count("profiles"), count("reports")]);
  const { data: paid } = await s.from("promotions").select("amount, ends_at").eq("status", "paid");
  const revenue = paid?.reduce((n, p) => n + p.amount, 0) ?? 0, nActive = paid?.filter((p) => new Date(p.ends_at) > new Date()).length ?? 0;
  const { data: reports } = await s.from("reports").select("id, reason, created_at, ads(id, title, price, state, profiles(name))").order("created_at", { ascending: false });
  const { data: recent } = await s.from("ads").select("id, title, price, state, created_at, profiles(name)").order("created_at", { ascending: false }).limit(30);
  const { data: held } = await s.from("orders").select("*").eq("status", "held").order("created_at");
  const { data: wds } = await s.from("withdrawals").select("*").eq("status", "pending").order("created_at");
  const stats: [string, string | number][] = [["Ads", nAds], ["Users", nUsers], ["Open reports", nReports], ["Active promotions", nActive], ["Promo revenue", naira(revenue)]];
  return (<>
    <h2 style={{ marginTop: 18 }}>Admin</h2>
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))" }}>
      {stats.map(([l, v]) => <div key={l} className="card info"><div className="price" style={{ fontSize: "1.4rem" }}>{v}</div>{l}</div>)}</div>
    <h3>Reported ads</h3>
    {reports?.length ? reports.map((r: any) => (<div key={r.id} className="li">
      <div style={{ flex: 1, minWidth: 180 }}><b>{r.ads?.title ?? "(ad removed)"}</b><div className="meta">{r.reason} · seller {r.ads?.profiles?.name} · {new Date(r.created_at).toLocaleDateString("en-NG")}</div></div>
      {r.ads && <Link className="btn sm alt" href={`/ads/${r.ads.id}`}>View</Link>}
      {r.ads && <form action={removeAd}><input type="hidden" name="id" value={r.ads.id} /><button className="btn sm">Remove ad</button></form>}
      <form action={dismiss}><input type="hidden" name="id" value={r.id} /><button className="btn sm alt">Dismiss</button></form></div>))
      : <p className="meta">No reports. All clear.</p>}
    <h3>Withdrawal requests</h3>
    {wds?.length ? wds.map((x) => (<div key={x.id} className="li"><div style={{ flex: 1, minWidth: 220 }}><b>{naira(x.amount - x.fee)}</b> <span className="meta">(request {naira(x.amount)}, fee {naira(x.fee)})</span>
      <div className="meta">{x.bank} · {x.account_number} · {x.account_name}</div></div>
      <form action={payout}><input type="hidden" name="id" value={x.id} /><input type="hidden" name="paid" value="1" /><button className="btn sm">Mark paid</button></form>
      <form action={payout}><input type="hidden" name="id" value={x.id} /><input type="hidden" name="paid" value="0" /><button className="btn sm alt">Reject and refund</button></form></div>)) : <p className="meta">No pending withdrawals.</p>}
    <h3>Held payments (disputes)</h3>
    {held?.length ? held.map((o) => (<div key={o.id} className="li"><div style={{ flex: 1, minWidth: 180 }}><b>{o.ad_title}</b><div className="meta">{naira(o.amount)} · {new Date(o.created_at).toLocaleDateString("en-NG")}</div></div>
      <form action={settle}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="release" value="1" /><button className="btn sm">Pay seller</button></form>
      <form action={settle}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="release" value="0" /><button className="btn sm alt">Refund buyer</button></form></div>)) : <p className="meta">No held payments.</p>}
    <h3>Latest ads</h3>
    {recent?.map((a: any) => (<div key={a.id} className="li"><div style={{ flex: 1, minWidth: 180 }}><b>{a.title}</b><div className="meta">{naira(a.price)} · {a.state} · {a.profiles?.name}</div></div>
      <Link className="btn sm alt" href={`/ads/${a.id}`}>View</Link>
      <form action={removeAd}><input type="hidden" name="id" value={a.id} /><button className="btn sm">Remove</button></form></div>))}
  </>);
}
