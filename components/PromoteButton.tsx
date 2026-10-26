"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { PLANS, TOKEN_COST, naira, PlanKey } from "@/lib/constants";
export default function PromoteButton({ adId }: { adId: string }) {
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(""); const router = useRouter();
  async function rpc(plan: string, method: "wallet" | "tokens") {
    setBusy(true); setMsg("");
    const { error } = await supabaseBrowser().rpc("buy_promo", { p_ad: adId, p_plan: plan, p_method: method });
    setBusy(false);
    if (error) setMsg(error.message); else { setOpen(false); router.refresh(); }
  }
  return (<>
    <button className="btn sm" onClick={() => setOpen(!open)}>Promote</button>
    {open && <div style={{ width: "100%" }}>{(Object.keys(PLANS) as PlanKey[]).map((k) => { const p = PLANS[k]; return (
      <div key={k} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", margin: "6px 0" }}>
        <b style={{ minWidth: 120 }}>{p.name} · {p.label}</b>
        <a className="btn sm alt" href={`/pay?kind=promo&ad=${adId}&plan=${k}`}>Bank transfer {naira(p.price)}</a>
        <button className="btn sm alt" disabled={busy} onClick={() => rpc(k, "wallet")}>Wallet {naira(p.price)}</button>
        <button className="btn sm alt" disabled={busy} onClick={() => rpc(k, "tokens")}>🪙 {TOKEN_COST[k]} tokens</button>
      </div>); })}
      {msg && <div className="meta" style={{ color: "crimson" }}>{msg}</div>}</div>}
  </>);
}
