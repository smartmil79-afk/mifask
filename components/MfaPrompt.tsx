"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function MfaPrompt({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function verify(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const sb = supabaseBrowser();
    const { data: f } = await sb.auth.mfa.listFactors(); const factor = f?.totp?.[0];
    if (!factor) { setErr("No authenticator app is set up on this account."); setBusy(false); return; }
    const { data: ch, error: e1 } = await sb.auth.mfa.challenge({ factorId: factor.id });
    if (e1 || !ch) { setErr(e1?.message ?? "Could not start the check."); setBusy(false); return; }
    const { error } = await sb.auth.mfa.verify({ factorId: factor.id, challengeId: ch.id, code: code.trim() });
    setBusy(false);
    if (error) setErr("That code is not correct. Use the newest code in your app."); else onDone();
  }
  return (<form onSubmit={verify}>
    <input className="f" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required />
    <button className="btn" disabled={busy || code.length < 6}>{busy ? "Checking…" : "Verify"}</button>
    {err && <p className="err" role="alert">{err}</p>}</form>);
}
