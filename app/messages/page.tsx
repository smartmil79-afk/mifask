import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";
export default async function Messages({ searchParams }: { searchParams: { e?: string } }) {
  const s = supabaseServer(); const { data: { user } } = await s.auth.getUser(); if (!user) redirect("/login");
  const { data: convs } = await s.from("conversations")
    .select("*, buyer:profiles!conversations_buyer_id_fkey(name), seller:profiles!conversations_seller_id_fkey(name)")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order("last_at", { ascending: false });
  return (<>
    <h2 style={{ marginTop: 18 }}>Messages</h2>
    {searchParams.e && <div className="note err">{searchParams.e}</div>}
    {convs?.length ? convs.map((c: any) => {
      const mine = c.buyer_id === user.id, other = mine ? c.seller?.name : c.buyer?.name, readAt = mine ? c.buyer_read_at : c.seller_read_at;
      const unread = c.last_sender && c.last_sender !== user.id && new Date(c.last_at) > new Date(readAt);
      return (<Link key={c.id} href={`/messages/${c.id}`} className="li conv">
        <div className="av">{(other || "M")[0].toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}><b>{other || "Member"}</b> <span className="meta">· {c.ad_title}</span><div className={"meta clip" + (unread ? " strong" : "")}>{c.last_message ?? "No messages yet"}</div></div>
        {unread && <span className="dot">new</span>}</Link>);
    }) : <p className="meta">No conversations yet. Open an ad and tap “Chat with seller”.</p>}
  </>);
}
