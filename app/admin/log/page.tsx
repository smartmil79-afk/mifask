import Link from "next/link";
import { superGuard } from "@/lib/admin";
export const dynamic = "force-dynamic";
export default async function Log() {
  const { s } = await superGuard();
  const { data } = await s.from("admin_log").select("*, admin:profiles!admin_log_admin_id_fkey(name)").order("created_at", { ascending: false }).limit(100);
  return (<><h3 style={{ margin: "6px 0 10px" }}>Admin activity (last 100)</h3>
    {data?.map((x: any) => (<div key={x.id} className="li"><div style={{ flex: 1 }}><b>{x.action}</b> · by {x.admin?.name ?? "admin"}{x.target_user && <> · <Link href={`/admin/users/${x.target_user}`} style={{ textDecoration: "underline" }}>user</Link></>}
      <div className="meta">{x.details}</div></div><span className="meta">{new Date(x.created_at).toLocaleString("en-NG")}</span></div>))}
    {!data?.length && <p className="meta">Nothing logged yet.</p>}</>);
}
