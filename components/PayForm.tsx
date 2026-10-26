"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { BANK_DETAILS, naira } from "@/lib/constants";
type Props = { kind: "promo" | "topup"; adId?: string; adTitle?: string; plan?: string; planLabel?: string; amount?: number };
export default function PayForm({ kind, adId, adTitle, plan, planLabel, amount }: Props) {
  const [amt, setAmt] = useState(amount ?? 5000); const [ref, setRef] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr("");
    const file = (e.currentTarget.elements.namedItem("receipt") as HTMLInputElement).files?.[0];
    if (!file) return setErr("Please attach your payment receipt.");
    if (file.size > 5 * 1024 * 1024) return setErr("The receipt must be smaller than 5 MB.");
    setBusy(true);
    const sb = supabaseBrowser(); const { data: { user } } = await sb.auth.getUser();
    if (!user) { location.href = "/login"; return; }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const up = await sb.storage.from("receipts").upload(path, file, { contentType: file.type });
    if (up.error) { setErr(up.error.message); setBusy(false); return; }
    const { error } = await sb.rpc("submit_manual_payment", { p_kind: kind, p_ad: adId ?? null, p_plan: plan ?? null, p_amount: amt, p_reference: ref, p_receipt: path });
    if (error) { setErr(error.message); setBusy(false); return; }
    location.href = "/wallet?m=" + encodeURIComponent("Receipt received. We will confirm your payment within 24 hours.");
  }
  return (<form className="box" onSubmit={submit}>
    <h2 style={{ marginTop: 0 }}>{kind === "promo" ? "Pay for your sponsored ad" : "Add money to your wallet"}</h2>
    {kind === "promo" && <p className="meta">Ad: <b>{adTitle}</b> · Plan: <b>{planLabel}</b></p>}
    <p><b>Step 1.</b> Transfer {kind === "promo" ? <b>{naira(amount ?? 0)}</b> : "the amount you want (₦100 to ₦500,000)"} to:</p>
    <div className="note"><b>{BANK_DETAILS.bank}</b><br />{BANK_DETAILS.number}<br />{BANK_DETAILS.name}</div>
    {kind === "topup" && <><label className="meta">Amount you sent (₦)</label><input className="f" type="number" min={100} max={500000} required value={amt} onChange={(e) => setAmt(+e.target.value)} /></>}
    <p><b>Step 2.</b> Upload your receipt and enter its transaction or session ID.</p>
    <input className="f" name="receipt" type="file" accept="image/*,application/pdf" required />
    <input className="f" required minLength={4} maxLength={80} placeholder="Transaction or session ID on the receipt" value={ref} onChange={(e) => setRef(e.target.value)} />
    <p className="meta">{kind === "promo" ? "Your ad moves into the top 5 once we see the money in our account, usually within 24 hours." : "We credit your wallet once we see the money in our account, usually within 24 hours."}</p>
    <button className="btn" disabled={busy}>{busy ? "Sending…" : "Send receipt"}</button>{err && <p style={{ color: "crimson" }}>{err}</p>}
  </form>);
}
