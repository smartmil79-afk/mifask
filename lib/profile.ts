export type Prof = { account_type?: string | null; first_name?: string | null; business_name?: string | null; name?: string | null; avatar_url?: string | null } | null | undefined;
export function displayName(p: Prof, email?: string | null) {
  if (p?.account_type === "business" && p.business_name) return p.business_name;
  return p?.first_name || p?.name || (email ? email.split("@")[0] : "Member");
}
