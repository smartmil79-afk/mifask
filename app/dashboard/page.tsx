import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { naira } from "@/lib/constants";
import PromoteButton from "@/components/PromoteButton";
import Link from "next/link";
export const dynamic = "force-dynamic";
async function del(fd: FormData) { "use server"; await supabaseServer().from("ads").delete().eq("id", fd.get("id") as string); redirect("/dashboard"); }
async function toggleSold(fd: FormData) { "use server"; await supabaseServer().from("ads").update({ sold: fd.get("v") === "1" }).eq("id", fd.get("id") as string); redirect("/dashboard"); }
export default async function Dashboard({ searchParams }: { searchParams: { verified?: string } }) {
  const s = supabaseServer(); const { data: { user } } = await s.auth.getUser(); if (!user) redirect("/login");
  const { data: ads } = await s.from("ads").select("*, promotions(plan, status, ends_at)").eq("seller_id", user.id).order("created_at", { ascending: false });
  const now = Date.now();
  const { data: pm } = await s.from("manual_payments").select("ad_id").eq("user_id", user.id).eq("status", "pending").eq("kind", "promo");
  const pending = new Set((pm ?? []).map((x) => x.ad_id));
  const active = (a: any) => a.promotions?.filter((p: any) => p.status === "paid" && new Date(p.ends_at).getTime() > now).sort((x: any, y: any) => +new Date(y.ends_at) - +new Date(x.ends_at))[0];
  const nActive = ads?.filter(active).length ?? 0, views = ads?.reduce((n, a) => n + a.views, 0) ?? 0;
  return (<>
    {searchParams.verified && <div className="note okbar" style={{ marginTop: 18 }}>✓ Email verified. Welcome to Mifask!</div>}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "18px 0" }}><h2 style={{ margin: 0 }}>My dashboard</h2><span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Link className="btn alt" href="/security">🔐 Security</Link><Link className="btn" href="/post">+ Post new ad</Link></span></div>
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))" }}>
      {[["My ads", ads?.length ?? 0], ["Sponsored now", nActive], ["Total views", views]].map(([l, v]) => <div key={l as string} className="card info"><div className="price" style={{ fontSize: "1.6rem" }}>{v}</div>{l}</div>)}</div>
    {ads?.length ? ads.map((a) => { const p = active(a); return (<div key={a.id} className="li">
      <div className="pic" style={{ width: 64, height: 64, fontSize: "1.5rem", borderRadius: 12, overflow: "hidden" }}>{a.images?.[0] ? <img src={a.images[0]} alt="" /> : "📦"}</div>
      <div style={{ flex: 1, minWidth: 160 }}><b>{a.title}</b><div className="meta">{naira(a.price)} · {a.views} views</div>
        <div className="meta">{p ? <><span className="badge">★ {p.plan}</span>until {new Date(p.ends_at).toLocaleDateString("en-NG")}</> : pending.has(a.id) ? "⏳ Payment being checked" : "Not promoted"}</div></div>
      <PromoteButton adId={a.id} /><Link className="btn sm alt" href={`/ads/${a.id}`}>View</Link>
      <form action={toggleSold}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="v" value={a.sold ? "0" : "1"} /><button className="btn sm alt">{a.sold ? "Relist" : "Mark sold"}</button></form>
      <form action={del}><input type="hidden" name="id" value={a.id} /><button className="btn sm alt">Delete</button></form></div>); }) : <p className="meta">No ads yet. Post your first one, it’s free.</p>}
  </>);
}
