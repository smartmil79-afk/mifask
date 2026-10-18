"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function Login() {
  const [mode, setMode] = useState<"in" | "up">("in"); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); const sb = supabaseBrowser();
    const { error } = mode === "in" ? await sb.auth.signInWithPassword({ email, password }) : await sb.auth.signUp({ email, password });
    if (error) return setMsg(error.message);
    if (mode === "up") return setMsg("Check your email to confirm your account, then sign in.");
    location.href = "/dashboard";
  }
  return (<form className="box" onSubmit={submit}><h2>{mode === "in" ? "Sign in" : "Create your account"}</h2>
    <input className="f" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
    <input className="f" type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
    <button className="btn">{mode === "in" ? "Sign in" : "Sign up"}</button>
    <p><a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === "in" ? "up" : "in"); setMsg(""); }} style={{ color: "var(--brand)" }}>{mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}</a></p>
    {msg && <p className="meta">{msg}</p>}</form>);
}
