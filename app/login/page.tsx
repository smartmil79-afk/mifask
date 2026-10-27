"use client";
import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import MfaPrompt from "@/components/MfaPrompt";
export default function Login() {
  const [mode, setMode] = useState<"in" | "up">("in"); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [done, setDone] = useState(false); const [note, setNote] = useState(""); const [needMfa, setNeedMfa] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const sb = supabaseBrowser();
    try {
      if (mode === "in") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) { setErr(/confirm/i.test(error.message) ? "Please verify your email first. Check your inbox and spam folder." : error.message); return; }
        const { data: a } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
        if (a && a.nextLevel === "aal2" && a.currentLevel !== "aal2") { setNeedMfa(true); return; }
        location.href = "/dashboard"; return;
      }
      const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
      if (error) { setErr(error.message); return; }
      if (data.user && data.user.identities?.length === 0) { setErr("This email is already registered. Please sign in instead."); return; }
      if (data.session) { location.href = "/dashboard"; return; }
      setDone(true);
    } catch { setErr("Something went wrong. Check your internet and try again."); } finally { setBusy(false); }
  }
  async function resend() {
    const { error } = await supabaseBrowser().auth.resend({ type: "signup", email, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
    setNote(error ? error.message : "Verification email sent again.");
  }
  if (needMfa) return (<div className="box"><h2 style={{ marginTop: 0 }}>Two-step check</h2>
    <p className="meta">Open your authenticator app and enter the 6-digit code for Mifask.</p><MfaPrompt onDone={() => (location.href = "/dashboard")} /></div>);
  return (<>
    <form className="box" onSubmit={submit}><h2 style={{ marginTop: 0 }}>{mode === "in" ? "Welcome back" : "Create your free account"}</h2>
      <input className="f" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="f" type="password" required minLength={6} placeholder="Password (6+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="btn" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}</button>
      {err && <p className="err" role="alert">{err}</p>}
      {mode === "in" && <p style={{ margin: "10px 0 0" }}><Link href="/forgot" style={{ color: "var(--mut)", textDecoration: "underline" }}>Forgot password?</Link></p>}
      <p><a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === "in" ? "up" : "in"); setErr(""); }} style={{ color: "var(--ink)", textDecoration: "underline" }}>{mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}</a></p></form>
    {done && (<div className="ovl" role="dialog" aria-modal="true"><div className="pop">
      <svg className="check" viewBox="0 0 52 52"><circle cx="26" cy="26" r="25" /><path d="M14 27l8 8 16-17" /></svg>
      <h2 style={{ margin: "0 0 6px" }}>Account created!</h2>
      <p className="meta" style={{ fontSize: ".95rem" }}>We sent a verification link to <b>{email}</b>. Open it to activate your account, then sign in. Check your spam folder if you do not see it.</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 14 }}>
        <button className="btn" onClick={() => { setDone(false); setMode("in"); setPassword(""); }}>Go to sign in</button>
        <button className="btn alt" onClick={resend}>Resend email</button></div>
      {note && <p className="meta" style={{ marginTop: 10 }}>{note}</p>}</div></div>)}
  </>);
}
