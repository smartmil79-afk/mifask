"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function UnreadBadge() {
  const [n, setN] = useState(0); const path = usePathname();
  const load = useCallback(async () => { const { data } = await supabaseBrowser().rpc("unread_count"); setN(Number(data) || 0); }, []);
  useEffect(() => { load(); }, [load, path]);
  useEffect(() => {
    const sb = supabaseBrowser(); const id = setInterval(load, 15000); const on = () => { load(); };
    window.addEventListener("focus", on); window.addEventListener("unread-refresh", on);
    const ch = sb.channel("unread-badge").on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, on).subscribe();
    return () => { clearInterval(id); window.removeEventListener("focus", on); window.removeEventListener("unread-refresh", on); sb.removeChannel(ch); };
  }, [load]);
  return n > 0 ? <span className="dot">{n}</span> : null;
}
