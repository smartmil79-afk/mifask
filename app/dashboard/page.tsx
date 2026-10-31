import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { naira, imgFor } from "@/lib/constants";
import PromoteButton from "@/components/PromoteButton";
import HeroSearch from "@/components/HeroSearch";
export const dynamic = "force-dynamic";
async function del(fd: FormData) { "use server"; await supabaseServer().from("ads").delete().eq("id", fd.get("id") as string); redirect("/dashboard"); }
async function toggleSold(fd: FormData) { "use server"; await supabaseServer().from("ads").update({ sold: fd.get("v") === "1" }).eq("id", fd.get("id") as string); redirect("/dashboard"); }
export default async function Dashboard({ searchParams }: { searchParams: { verified?: string } }) {
  const s = supabaseServer(); const { data: { user } } = await s.auth.getUser(); if (!user) redirect("/login");
  const { data: ads } = await s.from("ads").select("*, promotions(plan, status, ends_at)").eq("seller_id", user.id).order("created_at", { ascending: false });
  const { data: pm } = await s.from("manual_payments").select("ad_id").eq("user_id", user.id).eq("status", "pending").eq("kind", "promo");
  const pending = new Set((pm ?? []).map((x: any) => x.ad_id)); const now = Date.now();
  const active = (a: any) => a.promotions?.filter((p: any) => p.status === "paid" && new Date(p.ends_at).getTime() > now).sort((x: any, y: any) => +new Date(y.ends_at) - +new Date(x.ends_at))[0];
  const list = ads ?? [];
  const stats: [string, string | number][] = [["My ads", list.length], ["Live now", list.filter((a: any) => !a.sold).length], ["Sponsored", list.filter(active).length], ["Total views", list.reduce((n: number, a: any) => n + (a.views ?? 0), 0)]];
  return (<>
    {searchParams.verified && <div className="note okbar" style={{ marginTop: 18 }}>✓ Email verified. Welcome to Mifask!</div>}
    <div className="dhead"><div><h2 style={{ margin: 0 }}>My dashboard</h2><p className="meta" style={{ margin: "2px 0 0" }}>Manage your ads, promotions and account.</p></div>
      <span className="arow"><Link className="btn alt" href="/wallet">Wallet</Link><Link className="btn alt" href="/messages">Messages</Link><Link className="btn alt" href="/security">🔐 Security</Link><Link className="btn" href="/post">+ Post new ad</Link></span></div>
    <div className="dsearch"><HeroSearch /></div>
    <div className="sgrid">{stats.map(([l, v]) => <div key={l} className="stat"><b>{v}</b>{l}</div>)}</div>
    <h3>My ads</h3>
    {list.length ? list.map((a: any) => { const p = active(a); return (<div key={a.id} className="li">
      <div className="th"><img src={imgFor(a)} alt="" /></div>
      <div className="gr"><b>{a.title}</b><div className="meta">{naira(a.price)} · {a.state} · {a.views} views</div>
        <div className="meta">{a.sold ? <span className="badge">SOLD</span> : p ? <><span className="badge">★ {p.plan}</span> until {new Date(p.ends_at).toLocaleDateString("en-NG")}</> : pending.has(a.id) ? "⏳ Payment being checked" : "Not promoted"}</div></div>
      <Link className="btn sm alt" href={`/ads/${a.id}/edit`}>✏️ Edit</Link><PromoteButton adId={a.id} /><Link className="btn sm alt" href={`/ads/${a.id}`}>View</Link>
      <form action={toggleSold}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="v" value={a.sold ? "0" : "1"} /><button className="btn sm alt">{a.sold ? "Relist" : "Mark sold"}</button></form>
      <form action={del}><input type="hidden" name="id" value={a.id} /><button className="btn sm alt">Delete</button></form></div>); })
      : <div className="empty">You have no ads yet. <Link href="/post" style={{ textDecoration: "underline" }}>Post your first ad</Link>, it’s free.</div>}
  </>);
}
