"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import MfaPrompt from "@/components/MfaPrompt";
import Logo from "@/components/Logo";
const finish = () => { try { sessionStorage.removeItem("mf_pop"); } catch {} location.href = "/dashboard"; };
export default function Login() {
  const [mode, setMode] = useState<"in" | "up">("in"); const [type, setType] = useState<"personal" | "business">("personal");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [first, setFirst] = useState(""); const [last, setLast] = useState(""); const [business, setBusiness] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [done, setDone] = useState(false); const [note, setNote] = useState(""); const [needMfa, setNeedMfa] = useState(false);
  useEffect(() => { (async () => {
    if (location.search.includes("mode=up")) setMode("up");
    const sb = supabaseBrowser(); const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data: a } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (a && a.nextLevel === "aal2" && a.currentLevel !== "aal2") setNeedMfa(true); else finish();
  })(); }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (mode === "up") {
      if (!first.trim()) { setErr("Please enter your first name."); return; }
      if (type === "business" && !business.trim()) { setErr("Please enter your business name."); return; }
      if (password.length < 8) { setErr("Use a password with at least 8 characters."); return; }
    }
    setBusy(true); const sb = supabaseBrowser();
    try {
      if (mode === "in") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) { setErr(/banned/i.test(error.message) ? "Your account has been suspended. Please contact mifask@proton.me." : /confirm/i.test(error.message) ? "Please verify your email first. Check your inbox and spam folder." : error.message); return; }
        const { data: a } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
        if (a && a.nextLevel === "aal2" && a.currentLevel !== "aal2") { setNeedMfa(true); return; }
        finish(); return;
      }
      const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback`, data: { account_type: type, first_name: first.trim(), last_name: last.trim(), business_name: business.trim() } } });
      if (error) { setErr(error.message); return; }
      if (data.user && data.user.identities?.length === 0) { setErr("This email is already registered. Please sign in instead."); return; }
      if (data.session) { finish(); return; }
      setDone(true);
    } catch { setErr("Something went wrong. Check your internet and try again."); } finally { setBusy(false); }
  }
  async function resend() {
    const { error } = await supabaseBrowser().auth.resend({ type: "signup", email, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
    setNote(error ? error.message : "Verification email sent again.");
  }
  async function switchAccount() { await supabaseBrowser().auth.signOut(); try { sessionStorage.removeItem("mf_pop"); } catch {} location.href = "/login"; }
  const brand = <div className="authlogo"><Logo /><span>Mifask</span></div>;
  if (needMfa) return (<div className="authcard">{brand}<h2 style={{ margin: "0 0 4px" }}>Two-step check</h2>
    <p className="meta">Open your authenticator app and enter the 6-digit code for Mifask.</p>
    <MfaPrompt onDone={finish} />
    <p style={{ marginTop: 14 }}><button type="button" className="linkbtn" onClick={switchAccount}>Use a different account</button></p></div>);
  return (<>
    <form className="authcard" onSubmit={submit}>{brand}
      <div className="seg"><button type="button" className={mode === "in" ? "on" : ""} onClick={() => { setMode("in"); setErr(""); }}>Sign in</button><button type="button" className={mode === "up" ? "on" : ""} onClick={() => { setMode("up"); setErr(""); }}>Create account</button></div>
      {mode === "up" && (<>
        <label className="meta">I am registering as</label>
        <div className="typepick"><button type="button" className={type === "personal" ? "on" : ""} onClick={() => setType("personal")}><b>Personal</b><span>Buy and sell as an individual</span></button>
          <button type="button" className={type === "business" ? "on" : ""} onClick={() => setType("business")}><b>Business owner</b><span>Sell under your company name</span></button></div>
        {type === "business" && <input className="f" required placeholder="Business / company name" value={business} onChange={(e) => setBusiness(e.target.value)} maxLength={80} />}
        <div className="row2"><input className="f" required placeholder="First name" value={first} onChange={(e) => setFirst(e.target.value)} maxLength={40} /><input className="f" placeholder="Last name" value={last} onChange={(e) => setLast(e.target.value)} maxLength={40} /></div></>)}
      <input className="f" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <input className="f" type="password" required minLength={mode === "up" ? 8 : 1} placeholder={mode === "up" ? "Password (8+ characters)" : "Password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "up" ? "new-password" : "current-password"} />
      <button className="btn" style={{ width: "100%" }} disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</button>
      {err && <p className="err" role="alert">{err}</p>}
      {mode === "in" && <p style={{ margin: "12px 0 0", textAlign: "center" }}><Link href="/forgot" className="linkbtn">Forgot password?</Link></p>}
    </form>
    {done && (<div className="ovl" role="dialog" aria-modal="true"><div className="pop">
      <svg className="check" viewBox="0 0 52 52"><circle cx="26" cy="26" r="25" /><path d="M14 27l8 8 16-17" /></svg>
      <h2 style={{ margin: "0 0 6px" }}>Account created!</h2>
      <p className="meta" style={{ fontSize: ".95rem" }}>We sent a verification link to <b>{email}</b>. Open it to activate your account, then sign in. Check your spam folder if you do not see it.</p>
      <div className="arow" style={{ justifyContent: "center", marginTop: 14 }}><button className="btn" onClick={() => { setDone(false); setMode("in"); setPassword(""); }}>Go to sign in</button><button className="btn alt" onClick={resend}>Resend email</button></div>
      {note && <p className="meta" style={{ marginTop: 10 }}>{note}</p>}</div></div>)}
  </>);
}
