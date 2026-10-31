import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import AdForm from "@/components/AdForm";
export const metadata = { title: "Edit ad" };
export const dynamic = "force-dynamic";
export default async function Edit({ params }: { params: { id: string } }) {
  const s = supabaseServer(); const { data: { user } } = await s.auth.getUser(); if (!user) redirect("/login");
  const { data: ad } = await s.from("ads").select("*").eq("id", params.id).maybeSingle();
  if (!ad || ad.seller_id !== user.id) notFound();
  return <AdForm ad={{ id: ad.id, title: ad.title, category: ad.category, state: ad.state, price: Number(ad.price), condition: ad.condition, description: ad.description, phone: ad.phone, images: ad.images ?? [] }} />;
}
