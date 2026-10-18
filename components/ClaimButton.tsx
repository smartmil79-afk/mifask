"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function ClaimButton({ claimed }: { claimed: boolean }) {
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(""); const router = useRouter();
  async function claim() {
    setBusy(true); const { data, error } = await supabaseBrowser().rpc("claim_daily_tokens"); setBusy(false);
    if (error) setMsg(error.message); else { setMsg(`+${data} tokens!`); router.refresh(); }
  }
  return (<div><button className="btn" disabled={busy || claimed} onClick={claim}>{claimed ? "Come back tomorrow" : "Claim today’s tokens"}</button>{msg && <span className="meta"> {msg}</span>}</div>);
}
