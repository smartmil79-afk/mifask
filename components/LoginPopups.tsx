"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { naira, PLACEHOLDER } from "@/lib/constants";
type PAd = { id: string; title: string; price: number; plan: string; images: string[]; category?: string; state?: string };
const PLAN: Record<string, string> = { premium: "PREMIUM", pro: "PRO", basic: "BASIC" };
export default function LoginPopups({ userId, canClaim, ads }: { userId: string; canClaim: boolean; ads: PAd[] }) {
  const router = useRouter();
  const [queue, setQueue] = useState<string[]>([]); const [ad, setAd] = useState<PAd | null>(null);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
    let fresh = false; try { fresh = !sessionStorage.getItem("mf_pop"); sessionStorage.setItem("mf_pop", "1"); } catch {}
    let seen = false; try { seen = localStorage.getItem("mf_remind_" + userId) === today; } catch {}
    const q: string[] = [];
    if (fresh && ads.length) { q.push("ad"); setAd(ads[Math.floor(Math.random() * ads.length)]); }
    if (canClaim && (fresh || !seen)) { q.push("claim"); try { localStorage.setItem("mf_remind_" + userId, today); } catch {} }
    setQueue(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const step = queue[0];
  const next = () => { setMsg(""); setQueue((q) => q.slice(1)); };
  useEffect(() => { if (step !== "ad") return; const t = setTimeout(next, 3000); return () => clearTimeout(t); }, [step]);
  async function claim() {
    setBusy(true); const { data, error } = await supabaseBrowser().rpc("claim_daily_tokens"); setBusy(false);
    if (error) { setMsg(error.message); return; }
    setMsg(`+${data} coins added to your wallet!`); router.refresh(); setTimeout(next, 1700);
  }
  if (!step) return null;
  if (step === "ad" && ad) return (
    <div className="ovl" role="dialog" aria-modal="true" aria-label="Sponsored ad"><div className="pop adpop">
      <span className={`ribbon promo inline p-${ad.plan}`}>★ {PLAN[ad.plan] ?? "SPONSORED"} AD</span>
      <img src={ad.images?.[0] || PLACEHOLDER[ad.category ?? ""] || PLACEHOLDER.default} alt="" />
      <h3 style={{ margin: "10px 0 2px" }}>{ad.title}</h3><div className="cprice">{naira(ad.price)}</div>{ad.state && <div className="meta">📍 {ad.state}</div>}
      <div className="arow" style={{ justifyContent: "center", marginTop: 12 }}><Link className="btn" href={`/ads/${ad.id}`} onClick={next}>View ad</Link><button className="btn alt" onClick={next}>Close</button></div>
      <div className="timer"><i /></div></div></div>);
  if (step === "claim") return (
    <div className="ovl" role="dialog" aria-modal="true" aria-label="Daily coins"><div className="pop">
      <div className="coinbig">🪙</div><h2 style={{ margin: "0 0 6px" }}>Your daily coins are waiting</h2>
      <p className="meta" style={{ fontSize: ".95rem" }}>Claim free coins every day and spend them on sponsored ads. Every 7th day in a row pays a bonus.</p>
      {msg && <p style={{ fontWeight: 700 }}>{msg}</p>}
      <div className="arow" style={{ justifyContent: "center" }}><button className="btn" onClick={claim} disabled={busy || !!msg}>{busy ? "Claiming…" : "Claim now"}</button><button className="btn alt" onClick={next}>Maybe later</button></div></div></div>);
  return null;
}
