import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
export async function adminGuard() {
  const s = supabaseServer(); const { data: { user } } = await s.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await s.from("profiles").select("is_admin, is_super").eq("id", user.id).single();
  if (!me?.is_admin && !me?.is_super) redirect("/");
  const { data: aal } = await s.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") redirect("/login");
  return { s, user, isSuper: !!me.is_super };
}
export async function superGuard() { const g = await adminGuard(); if (!g.isSuper) redirect("/admin"); return g; }
export function flash(path: string, error?: string | null, ok?: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(path + (error ? `${sep}e=${encodeURIComponent(error)}` : ok ? `${sep}m=${encodeURIComponent(ok)}` : ""));
}
