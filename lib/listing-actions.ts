"use server";
import { supabaseServer } from "@/lib/supabase/server";
import { CATS, STATES } from "@/lib/constants";
type Input = { id?: string; title: string; category: string; state: string; price: number; condition: string; description: string; phone: string; images: string[] };
export async function saveListing(i: Input): Promise<{ id?: string; error?: string }> {
  const s = supabaseServer(); const { data: { user } } = await s.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  const title = String(i.title ?? "").trim(), description = String(i.description ?? "").trim(), phone = String(i.phone ?? "").trim(), condition = String(i.condition ?? "").trim();
  if (!title || title.length > 70) return { error: "The title must be 1 to 70 characters." };
  if (!CATS.includes(i.category) || !STATES.includes(i.state)) return { error: "Please choose a valid category and state." };
  if (!(Number(i.price) >= 0) || Number(i.price) > 1e10) return { error: "Please enter a valid price." };
  if (!description || description.length > 2000) return { error: "The description must be 1 to 2000 characters." };
  if (!phone || phone.length > 20) return { error: "Please enter a valid phone number." };
  if (!condition || condition.length > 80) return { error: "Please fill in the condition or details field." };
  const images = (i.images ?? []).filter((u) => typeof u === "string" && u.startsWith("https://")).slice(0, 3);
  const row = { title, category: i.category, state: i.state, price: Number(i.price), condition, description, phone, images };
  const q = i.id
    ? s.from("ads").update(row).eq("id", i.id).eq("seller_id", user.id).select("id").single()
    : s.from("ads").insert({ ...row, seller_id: user.id }).select("id").single();
  const { data, error } = await q;
  if (error) return { error: /foreign key/i.test(error.message) ? "Your profile is not ready. Sign out, sign in again, or contact support." : error.message };
  return { id: data.id };
}
