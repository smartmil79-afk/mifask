import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
export const metadata = { title: "Your profile" };
export const dynamic = "force-dynamic";
export default async function Profile() {
  const s = supabaseServer(); const { data: { user } } = await s.auth.getUser(); if (!user) redirect("/login");
  const { data: p } = await s.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return <ProfileForm userId={user.id} init={{ type: p?.account_type ?? "personal", first: p?.first_name ?? "", last: p?.last_name ?? "", business: p?.business_name ?? "", address: p?.business_address ?? "", description: p?.business_description ?? "", avatar: p?.avatar_url ?? "" }} />;
}
