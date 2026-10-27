import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import SecurityPanel from "@/components/SecurityPanel";
export const metadata = { title: "Security" };
export const dynamic = "force-dynamic";
export default async function Security() {
  const { data: { user } } = await supabaseServer().auth.getUser(); if (!user) redirect("/login");
  return <SecurityPanel />;
}
