import { redirect, notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import ChatRoom from "@/components/ChatRoom";
export const metadata = { title: "Chat" };
export const dynamic = "force-dynamic";
export default async function Room({ params }: { params: { id: string } }) {
  const s = supabaseServer(); const { data: { user } } = await s.auth.getUser(); if (!user) redirect("/login");
  const { data: c } = await s.from("conversations")
    .select("*, buyer:profiles!conversations_buyer_id_fkey(name), seller:profiles!conversations_seller_id_fkey(name)").eq("id", params.id).maybeSingle();
  if (!c || (c.buyer_id !== user.id && c.seller_id !== user.id)) notFound();
  const { data: msgs } = await s.from("messages").select("*").eq("conversation_id", c.id).order("created_at").limit(200);
  await s.rpc("mark_read", { p_conv: c.id });
  const isBuyer = c.buyer_id === user.id;
  return <ChatRoom convId={c.id} userId={user.id} other={(isBuyer ? c.seller?.name : c.buyer?.name) || "Member"} adId={c.ad_id} adTitle={c.ad_title} isBuyer={isBuyer} initial={msgs ?? []} />;
}
