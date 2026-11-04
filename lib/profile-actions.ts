"use server";
import { supabaseServer } from "@/lib/supabase/server";
type Input = { type: string; first: string; last: string; business: string; address: string; description: string; avatar: string };
export async function saveProfile(i: Input): Promise<{ error?: string }> {
  const s = supabaseServer(); const { data: { user } } = await s.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  if (!String(i.first ?? "").trim()) return { error: "Please enter your first name." };
  const { error } = await s.rpc("update_my_profile", { p_type: i.type, p_first: i.first, p_last: i.last, p_business: i.business, p_address: i.address, p_description: i.description, p_avatar: i.avatar });
  return error ? { error: error.message } : {};
}
