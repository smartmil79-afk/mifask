"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function SecurityPanel() {
  const [on, setOn] = useState<boolean | null>(null); const [fid, setFid] = useState("");
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState(""); const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function load() { const { data } = await supabaseBrowser().auth.mfa.listFactors(); const f = data?.totp?.[0]; setOn(!!f); setFid(f?.id ?? ""); }
  useEffect(() => { load(); }, []);
  async function start() {
    setBusy(true); setErr(""); setMsg(""); const sb = supabaseBrowser();
    const { data: all } = await sb.auth.mfa.listFactors();
    for (const f of ((all?.all ?? []) as any[]).filter((x) => x.status === "unverified")) await sb.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "Mifask " + Date.now() });
    setBusy(false);
    if (error || !data) { setErr(error?.message ?? "Could not start setup."); return; }
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }
  async function verifySetup(e: React.FormEvent) {
    e.preventDefault(); if (!enroll) return; setBusy(true); setErr(""); const sb = supabaseBrowser();
    const { data: ch, error: e1 } = await sb.auth.mfa.challenge({ factorId: enroll.id });
    if (e1 || !ch) { setErr(e1?.message ?? "Could not check the code."); setBusy(false); return; }
    const { error } = await sb.auth.mfa.verify({ factorId: enroll.id, challengeId: ch.id, code: code.trim() });
    setBusy(false);
    if (error) { setErr("That code is not correct. Wait for a new code and try again."); return; }
    setEnroll(null); setCode(""); setMsg("Two-step login is now ON. From now on, signing in asks for a code from your phone."); load();
  }
  async function turnOff() {
    if (!window.confirm("Turn off two-step login?")) return; setErr("");
    const { error } = await supabaseBrowser().auth.mfa.unenroll({ factorId: fid });
    if (error) { setErr("Please sign out, sign in again with your code, then try again."); return; }
    setMsg("Two-step login is now OFF."); load();
  }
  return (<div className="box"><h2 style={{ marginTop: 0 }}>🔐 Two-step login</h2>
    <p className="meta">Adds a second lock: after your password, you enter a 6-digit code from an app on your phone (Google Authenticator, Microsoft Authenticator or Authy). It is free, and safer than text messages.</p>
    {msg && <div className="note okbar">{msg}</div>}
    {on === null && <p className="meta">Loading…</p>}
    {on === true && !enroll && <><p><b>Status: ON ✓</b></p><button className="btn alt" onClick={turnOff}>Turn off</button></>}
    {on === false && !enroll && <button className="btn" onClick={start} disabled={busy}>{busy ? "Please wait…" : "Set up authenticator app"}</button>}
    {enroll && (<form onSubmit={verifySetup}>
      <p><b>1.</b> Open your authenticator app and scan this code:</p>
      <img src={enroll.qr} alt="QR code to scan" width={190} height={190} style={{ background: "#fff", padding: 8, borderRadius: 14 }} />
      <p className="meta">Cannot scan? Type this key into the app: <b style={{ wordBreak: "break-all", color: "var(--ink)" }}>{enroll.secret}</b></p>
      <p><b>2.</b> Enter the 6-digit code the app shows:</p>
      <input className="f" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required />
      <button className="btn" disabled={busy || code.length < 6}>{busy ? "Checking…" : "Turn on"}</button></form>)}
    {err && <p className="err" role="alert">{err}</p>}</div>);
}
