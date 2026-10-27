"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import MfaPrompt from "@/components/MfaPrompt";
export default function Reset() {
  const [state, setState] = useState<"load" | "nolink" | "mfa" | "form" | "done">("load");
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { (async () => {
    const sb = supabaseBrowser(); const { data: { user } } = await sb.auth.getUser();
    if (!user) { setState("nolink"); return; }
    const { data: a } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    setState(a && a.nextLevel === "aal2" && a.currentLevel !== "aal2" ? "mfa" : "form");
  })(); }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (pw.length < 8) { setErr("Use at least 8 characters."); return; }
    if (pw !== pw2) { setErr("The two passwords do not match."); return; }
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setState("done"); setTimeout(() => { location.href = "/dashboard"; }, 1800);
  }
  if (state === "load") return <div className="box"><p className="meta">Loading…</p></div>;
  if (state === "nolink") return (<div className="box"><h2 style={{ marginTop: 0 }}>Reset link needed</h2><p className="meta">Open the link from your reset email, or request a new one.</p><Link className="btn" href="/forgot">Request a reset link</Link></div>);
  if (state === "mfa") return (<div className="box"><h2 style={{ marginTop: 0 }}>Two-step check</h2><p className="meta">Enter the 6-digit code from your authenticator app to continue.</p><MfaPrompt onDone={() => setState("form")} /></div>);
  if (state === "done") return (<div className="ovl"><div className="pop"><svg className="check" viewBox="0 0 52 52"><circle cx="26" cy="26" r="25" /><path d="M14 27l8 8 16-17" /></svg><h2 style={{ margin: 0 }}>Password updated</h2><p className="meta">Taking you to your dashboard…</p></div></div>);
  return (<form className="box" onSubmit={submit}><h2 style={{ marginTop: 0 }}>Choose a new password</h2>
    <input className="f" type="password" required autoComplete="new-password" placeholder="New password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} />
    <input className="f" type="password" required autoComplete="new-password" placeholder="Repeat new password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
    <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save password"}</button>{err && <p className="err" role="alert">{err}</p>}</form>);
}
