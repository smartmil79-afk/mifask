"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function Forgot() {
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [done, setDone] = useState(false); const [expired, setExpired] = useState(false);
  useEffect(() => { setExpired(location.search.includes("expired")); }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/auth/reset` });
    setBusy(false); if (error) setErr(error.message); else setDone(true);
  }
  return (<>
    <form className="box" onSubmit={submit}><h2 style={{ marginTop: 0 }}>Forgot your password?</h2>
      <p className="meta">Enter your email and we will send you a link to choose a new password.</p>
      {expired && <p className="err">That link has expired or was already used. Request a new one.</p>}
      <input className="f" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="btn" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
      {err && <p className="err" role="alert">{err}</p>}
      <p><Link href="/login" style={{ color: "var(--mut)", textDecoration: "underline" }}>Back to sign in</Link></p></form>
    {done && (<div className="ovl" role="dialog" aria-modal="true"><div className="pop">
      <svg className="check" viewBox="0 0 52 52"><circle cx="26" cy="26" r="25" /><path d="M14 27l8 8 16-17" /></svg>
      <h2 style={{ margin: "0 0 6px" }}>Check your email</h2>
      <p className="meta" style={{ fontSize: ".95rem" }}>If <b>{email}</b> has a Mifask account, we sent a link to reset the password. Check your spam folder too.</p>
      <button className="btn" style={{ marginTop: 14 }} onClick={() => setDone(false)}>OK</button></div></div>)}
  </>);
}
