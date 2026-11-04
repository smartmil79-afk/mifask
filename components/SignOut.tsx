"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function SignOut() {
  return <button className="btn nav" onClick={async () => {
    await supabaseBrowser().auth.signOut();
    try { sessionStorage.removeItem("mf_pop"); sessionStorage.removeItem("mf_chat"); } catch {}
    location.href = "/";
  }}>Sign out</button>;
}
