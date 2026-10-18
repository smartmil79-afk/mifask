"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function SignOut() {
  return <button className="btn nav" onClick={async () => { await supabaseBrowser().auth.signOut(); location.href = "/"; }}>Sign out</button>;
}
