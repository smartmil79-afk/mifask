"use client";
import { useState } from "react";
export default function FundForm() {
  const [amount, setAmount] = useState(5000); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const j = await (await fetch("/api/wallet/fund", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount }) })).json();
    if (j.url) location.href = j.url; else { setErr(j.error || "Could not start payment"); setBusy(false); }
  }
  return (<form onSubmit={go}>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>{[1000, 5000, 10000, 20000].map((a) => <button type="button" key={a} className="btn sm alt" onClick={() => setAmount(a)}>₦{a.toLocaleString()}</button>)}</div>
    <input className="f" type="number" min={100} max={500000} value={amount} onChange={(e) => setAmount(+e.target.value)} />
    <button className="btn" disabled={busy}>{busy ? "Opening Paystack…" : "Add money"}</button>{err && <p style={{ color: "crimson" }}>{err}</p>}
  </form>);
}
