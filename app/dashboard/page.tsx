import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { naira, imgFor, PLACEHOLDER } from "@/lib/constants";
import { displayName } from "@/lib/profile";
import PromoteButton from "@/components/PromoteButton";
import HeroSearch from "@/components/HeroSearch";
import Avatar from "@/components/Avatar";
import Img from "@/components/Img";
export const dynamic = "force-dynamic";
async function del(fd: FormData) { "use server"; await supabaseServer().from("ads").delete().eq("id", fd.get("id") as string); redirect("/dashboard"); }
async function toggleSold(fd: FormData) { "use server"; await supabaseServer().from("ads").update({ sold: fd.get("v") === "1" }).eq("id", fd.get("id") as string); redirect("/dashboard"); }
async function complain(fd: FormData) {
  "use server";
  const subject = String(fd.get("subject") || "").trim(), message = String(fd.get("message") || "").trim();
  if (subject.length < 3 || message.length < 5) redirect("/dashboard?e=" + encodeURIComponent("Please write a subject and a short message.") + "#help");
  const { error } = await supabaseServer().rpc("submit_complaint", { p_subject: subject, p_message: message });
  redirect("/dashboard?" + (error ? "e=" + encodeURIComponent(error.message) : "m=" + encodeURIComponent("Complaint sent. Our reply will appear below.")) + "#help");
}
const lagos = (t: number) => new Date(t).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
export default async function Dashboard({ searchParams }: { searchParams: { verified?: string; profile?: string; m?: string; e?: string } }) {
  const s = supabaseServer(); const { data: { user } } = await s.auth.getUser(); if (!user) redirect("/login");
  const { data: me } = await s.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const { data: ads } = await s.from("ads").select("*, promotions(plan, status, ends_at)").eq("seller_id", user.id).order("created_at", { ascending: false });
  const list = (ads ?? []) as any[]; const ids = list.map((a) => a.id); const now = Date.now();
  const days = Array.from({ length: 14 }, (_, i) => lagos(now - (13 - i) * 864e5));
  const { data: st } = ids.length ? await s.from("ad_stats").select("ad_id, day, views").in("ad_id", ids).gte("day", days[0]) : { data: [] as any[] };
  const { data: convs } = await s.from("conversations").select("ad_id").eq("seller_id", user.id).not("ad_id", "is", null);
  const { data: pays } = await s.from("manual_payments").select("*").eq("user_id", user.id).eq("kind", "promo").order("created_at", { ascending: false }).limit(20);
  const { data: paid } = ids.length ? await s.from("promotions").select("id, ad_id, plan, amount, starts_at, ends_at, reference").in("ad_id", ids).eq("status", "paid").order("starts_at", { ascending: false }) : { data: [] as any[] };
  const { data: complaints } = await s.from("complaints").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
  const { data: w } = await s.from("wallets").select("balance, tokens, streak, last_claim").eq("user_id", user.id).maybeSingle();
  const viewMap = new Map<string, number>(); for (const r of (st ?? []) as any[]) viewMap.set(`${r.ad_id}|${r.day}`, r.views);
  const chatMap = new Map<string, number>(); for (const c of (convs ?? []) as any[]) chatMap.set(c.ad_id, (chatMap.get(c.ad_id) ?? 0) + 1);
  const active = (a: any) => a.promotions?.filter((p: any) => p.status === "paid" && new Date(p.ends_at).getTime() > now).sort((x: any, y: any) => +new Date(y.ends_at) - +new Date(x.ends_at))[0];
  const pending = new Set(((pays ?? []) as any[]).filter((x) => x.status === "pending").map((x) => x.ad_id));
  const rows = list.map((a) => { const series = days.map((d) => viewMap.get(`${a.id}|${d}`) ?? 0); return { a, series, v7: series.slice(7).reduce((n, v) => n + v, 0), chats: chatMap.get(a.id) ?? 0, promo: active(a) }; });
  const adTitle = new Map<string, string>(list.map((a) => [a.id, a.title]));
  const shown = displayName(me, user.email);
  const today = lagos(now); const canClaim = w?.last_claim !== today;
  const stats: [string, string | number][] = [["My ads", list.length], ["Live now", list.filter((a) => !a.sold).length], ["Sponsored", rows.filter((r) => r.promo).length], ["Total views", list.reduce((n, a) => n + (a.views ?? 0), 0)], ["Views, 7 days", rows.reduce((n, r) => n + r.v7, 0)], ["Chats started", rows.reduce((n, r) => n + r.chats, 0)]];
  return (<>
    {searchParams.verified && <div className="note okbar" style={{ marginTop: 18 }}>✓ Email verified. Welcome to Mifask!</div>}
    {searchParams.profile && <div className="note okbar" style={{ marginTop: 18 }}>✓ Profile saved.</div>}
    {searchParams.m && <div className="note okbar" style={{ marginTop: 18 }}>{searchParams.m}</div>}
    {searchParams.e && <div className="note err" style={{ marginTop: 18 }}>{searchParams.e}</div>}
    <div className="dhead"><div className="arow"><Avatar url={me?.avatar_url} name={shown} size={64} />
      <div><h2 style={{ margin: 0 }}>{shown}</h2><div className="meta">{me?.account_type === "business" ? "Business account" : "Personal account"} · <Link href="/profile" style={{ textDecoration: "underline" }}>Edit profile</Link></div></div></div>
      <span className="arow"><Link className="btn alt" href="/wallet">Wallet</Link><Link className="btn alt" href="/messages">Messages</Link><Link className="btn alt" href="/security">🔐 Security</Link><Link className="btn" href="/post">+ Post new ad</Link></span></div>
    {!me?.first_name && <div className="note">Complete your profile so buyers can see your name or business name. <Link href="/profile" style={{ textDecoration: "underline" }}>Add it now</Link></div>}
    <div className="dsearch"><HeroSearch /></div>
    <div className="sgrid">{stats.map(([l, v]) => <div key={l} className="stat"><b>{v}</b>{l}</div>)}</div>
    <div className="li"><div className="coinbig" style={{ fontSize: "2rem" }}>🪙</div><div style={{ flex: 1 }}><b>{w?.tokens ?? 0} coins · {naira(w?.balance ?? 0)}</b><div className="meta">{canClaim ? "Your daily coins are ready to claim." : "Daily coins claimed. Come back tomorrow."}{w?.streak ? ` Streak: ${w.streak} day${w.streak === 1 ? "" : "s"}.` : ""}</div></div><Link className="btn" href="/wallet">{canClaim ? "Claim coins" : "Open wallet"}</Link></div>

    <h3 id="performance">Ad performance</h3>
    {rows.length ? rows.map(({ a, series, v7, chats, promo }) => { const max = Math.max(1, ...series); return (<div key={a.id} className="li perf">
      <div className="th"><Img src={imgFor(a)} fallback={PLACEHOLDER[a.category] || PLACEHOLDER.default} /></div>
      <div className="gr"><b>{a.title}</b><div className="meta">{naira(a.price)} · {a.state}</div>
        <div className="meta">{a.sold ? <span className="badge">SOLD</span> : promo ? <span className={`ribbon promo inline p-${promo.plan}`}>★ {String(promo.plan).toUpperCase()} until {new Date(promo.ends_at).toLocaleDateString("en-NG")}</span> : pending.has(a.id) ? "⏳ Payment being checked" : "Not promoted"}</div></div>
      <div className="pstat"><b>{a.views ?? 0}</b><span>views</span></div><div className="pstat"><b>{v7}</b><span>last 7 days</span></div><div className="pstat"><b>{chats}</b><span>chats</span></div>
      <div className="spark" title="Views per day, last 14 days">{series.map((v, i) => <i key={i} style={{ height: `${Math.max(6, (v / max) * 100)}%` }} />)}</div>
      <div className="arow"><Link className="btn sm alt" href={`/ads/${a.id}/edit`}>✏️ Edit</Link><PromoteButton adId={a.id} /><Link className="btn sm alt" href={`/ads/${a.id}`}>View</Link>
        <form action={toggleSold}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="v" value={a.sold ? "0" : "1"} /><button className="btn sm alt">{a.sold ? "Relist" : "Mark sold"}</button></form>
        <form action={del}><input type="hidden" name="id" value={a.id} /><button className="btn sm alt">Delete</button></form></div></div>); })
      : <div className="empty">You have no ads yet. <Link href="/post" style={{ textDecoration: "underline" }}>Post your first ad</Link>, it is free.</div>}

    <h3 id="payments">Packages and payments</h3>
    {(paid ?? []).length || (pays ?? []).length ? (<>
      {((paid ?? []) as any[]).map((p) => (<div key={p.id} className="li"><div style={{ flex: 1 }}><b>{adTitle.get(p.ad_id) ?? "Ad"}</b><div className="meta"><span className={`ribbon promo inline p-${p.plan}`}>★ {String(p.plan).toUpperCase()}</span> {new Date(p.starts_at).toLocaleDateString("en-NG")} to {new Date(p.ends_at).toLocaleDateString("en-NG")}</div></div>
        <div className="meta">{String(p.reference).startsWith("mp_") ? `Paid ${naira(p.amount)} by transfer` : p.amount > 0 ? `Paid ${naira(p.amount)} from wallet` : "Paid with coins"}</div></div>))}
      {((pays ?? []) as any[]).filter((x) => x.status !== "approved").map((x) => (<div key={x.id} className="li"><div style={{ flex: 1 }}><b>{x.ad_title ?? "Ad"}</b><div className="meta">{String(x.plan).toUpperCase()} · {naira(x.amount)} · {new Date(x.created_at).toLocaleDateString("en-NG")}</div></div><span className={x.status === "pending" ? "badge" : "badge n"}>{x.status === "pending" ? "waiting for confirmation" : x.status}</span></div>))}</>)
      : <p className="meta">No promotion packages bought yet. Tap Promote on an ad to get it into the top spots.</p>}

    <h3 id="help">Complaints and support</h3>
    <form action={complain} className="box form2" style={{ maxWidth: "none", margin: "0 0 12px" }}><input className="f" style={{ margin: 0 }} name="subject" placeholder="Subject, e.g. Payment not confirmed" maxLength={100} required />
      <textarea className="f" style={{ margin: 0 }} name="message" rows={3} placeholder="Tell us what happened" maxLength={2000} required /><div><button className="btn">Send complaint</button></div></form>
    {((complaints ?? []) as any[]).map((c) => (<div key={c.id} className="li" style={{ display: "block" }}><b>{c.subject}</b> <span className={c.status === "open" ? "badge" : "badge n"}>{c.status}</span>
      <div className="meta">{new Date(c.created_at).toLocaleDateString("en-NG")}</div><p style={{ margin: "6px 0", whiteSpace: "pre-wrap" }}>{c.message}</p>{c.response && <p className="note" style={{ margin: 0 }}>Reply from Mifask: {c.response}</p>}</div>))}
  </>);
}
