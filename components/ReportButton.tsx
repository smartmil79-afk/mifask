"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
const REASONS = ["Scam or fake item", "Prohibited item", "Wrong category", "Duplicate ad", "Other"];
export default function ReportButton({ adId, userId }: { adId: string; userId: string }) {
  const [open, setOpen] = useState(false); const [msg, setMsg] = useState("");
  async function send(reason: string) {
    const { error } = await supabaseBrowser().from("reports").insert({ ad_id: adId, reporter_id: userId, reason });
    setMsg(error ? (error.code === "23505" ? "You already reported this ad." : "Could not send report.") : "Thanks. Our team will review this ad."); setOpen(false);
  }
  return (<div style={{ marginTop: 14 }}>
    {msg ? <span className="meta">{msg}</span> : <button className="btn sm alt" onClick={() => setOpen(!open)}>⚑ Report this ad</button>}
    {open && <div style={{ marginTop: 8 }}>{REASONS.map((r) => <button key={r} className="btn sm alt" style={{ margin: 3 }} onClick={() => send(r)}>{r}</button>)}</div>}
  </div>);
}
