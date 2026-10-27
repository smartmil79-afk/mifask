"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
type M = { id: string; sender_id: string; body: string; created_at: string };
type Props = { convId: string; userId: string; other: string; adId: string | null; adTitle: string; isBuyer: boolean; initial: M[] };
export default function ChatRoom({ convId, userId, other, adId, adTitle, isBuyer, initial }: Props) {
  const [msgs, setMsgs] = useState<M[]>(initial); const [text, setText] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null); const sb = useRef(supabaseBrowser());
  const add = (list: M[]) => setMsgs((cur) => {
    const ids = new Set(cur.map((m) => m.id)); const fresh = list.filter((m) => !ids.has(m.id));
    return fresh.length ? [...cur, ...fresh].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)) : cur;
  });
  async function refresh() {
    const { data } = await sb.current.from("messages").select("*").eq("conversation_id", convId).order("created_at").limit(200);
    if (data) add(data as M[]);
  }
  useEffect(() => {
    const client = sb.current;
    const ch = client.channel("conv-" + convId).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
      (p: any) => { add([p.new as M]); if (p.new.sender_id !== userId) client.rpc("mark_read", { p_conv: convId }); }).subscribe();
    const poll = setInterval(() => { refresh(); }, 6000);
    return () => { clearInterval(poll); client.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convId, userId]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs.length]);
  useEffect(() => {
    const last = msgs[msgs.length - 1];
    if (last && last.sender_id === userId) return;
    sb.current.rpc("mark_read", { p_conv: convId }).then(() => window.dispatchEvent(new Event("unread-refresh")));
  }, [msgs.length, convId, userId]);
  async function send(e: React.FormEvent) {
    e.preventDefault(); const body = text.trim(); if (!body || busy) return;
    setBusy(true); setErr("");
    const { error } = await sb.current.rpc("send_message", { p_conv: convId, p_body: body });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setText(""); await refresh();
  }
  return (<div className="room">
    <div className="rhead"><Link href="/messages" className="btn sm alt">← Inbox</Link>
      <div style={{ flex: 1, minWidth: 0 }}><b>{other}</b><div className="meta clip">{adId ? <Link href={`/ads/${adId}`} style={{ textDecoration: "underline" }}>{adTitle}</Link> : adTitle}</div></div></div>
    <div className="note">🛡️ Keep chats and payments on Mifask. Never share your password or codes.{isBuyer && adId ? " Pay from your wallet on the ad page so your money is held until you confirm." : ""}</div>
    <div className="thread">
      {msgs.length === 0 && <p className="meta" style={{ textAlign: "center" }}>Say hello and ask about the item.</p>}
      {msgs.map((m) => (<div key={m.id} className={"bub " + (m.sender_id === userId ? "me" : "them")}>{m.body}
        <small suppressHydrationWarning>{new Date(m.created_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}</small></div>))}
      <div ref={end} /></div>
    <form className="sendbar" onSubmit={send}>
      <input className="f" style={{ margin: 0 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" maxLength={1000} autoComplete="off" aria-label="Message" />
      <button className="btn" disabled={busy || !text.trim()}>Send</button></form>
    {err && <p className="err" role="alert">{err}</p>}
  </div>);
}
