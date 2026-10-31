import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import AdForm from "@/components/AdForm";
export const metadata = { title: "Post a free ad" };
export const dynamic = "force-dynamic";
export default async function Post() {
  const { data: { user } } = await supabaseServer().auth.getUser(); if (!user) redirect("/login");
  return <AdForm />;
}
