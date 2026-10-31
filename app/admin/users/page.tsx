import Link from "next/link";
import { adminGuard } from "@/lib/admin";
import { naira } from "@/lib/constants";
import Flash from "@/components/Flash";
export const dynamic = "force-dynamic";
export default async function Users({ searchParams }: { searchParams: { q?: string; page?: string; e?: string; m?: string } }) {
  const { s, isSuper } = await adminGuard();
  const q = (searchParams.q ?? "").trim(), pg = Math.max(1, Number(searchParams.page) || 1), per = 20;
  const { data, error } = await s.rpc("admin_list_users", { p_q: q, p_limit: per, p_offset: (pg - 1) * per });
  const rows = (data ?? []) as any[]; const total = Number(rows[0]?.total_count ?? 0);
  const href = (p: number) => `/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;
  const d = (x: string | null) => (x ? new Date(x).toLocaleDateString("en-NG") : "never");
  return (<>
    <Flash e={searchParams.e ?? error?.message} m={searchParams.m} />
    <h3 style={{ margin: "6px 0 10px" }}>Registered users · {total}</h3>
    <form style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}><input className="f" style={{ flex: 1, minWidth: 220, margin: 0 }} name="q" defaultValue={q} placeholder="Search by email or name" /><button className="btn">Search</button></form>
    {rows.map((u) => (<Link key={u.user_id} href={`/admin/users/${u.user_id}`} className="li conv">
      <div className="av">{(u.display_name || u.email || "?")[0].toUpperCase()}</div>
      <div style={{ flex: 1, minWidth: 0 }}><b>{u.display_name || "No name"}</b> {u.super_flag ? <span className="badge">SUPER ADMIN</span> : u.admin_flag ? <span className="badge n">ADMIN</span> : null}{u.suspended && <span className="badge" style={{ background: "#d64545" }}>SUSPENDED</span>}
        <div className="meta clip">{u.email}</div><div className="meta">Joined {d(u.joined_at)} · Last sign-in {d(u.last_sign_in)} · {u.ad_count} ads{isSuper ? ` · ${naira(u.balance)} · 🪙 ${u.tokens}` : ""}</div></div>
      <span className="btn sm alt">Manage →</span></Link>))}
    {!rows.length && <p className="meta">No users found.</p>}
    <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "16px 0" }}>{pg > 1 && <Link className="btn alt" href={href(pg - 1)}>← Previous</Link>}{pg * per < total && <Link className="btn alt" href={href(pg + 1)}>Next →</Link>}</div>
  </>);
}
