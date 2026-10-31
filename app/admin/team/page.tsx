import Link from "next/link";
import { superGuard, flash } from "@/lib/admin";
import Flash from "@/components/Flash";
export const dynamic = "force-dynamic";
async function addAdmin(fd: FormData) { "use server"; const { s } = await superGuard(); const { error } = await s.rpc("set_admin", { p_email: String(fd.get("email")), p_make: true }); flash("/admin/team", error?.message, "Admin added"); }
async function removeAdmin(fd: FormData) { "use server"; const { s } = await superGuard(); const { error } = await s.rpc("set_admin", { p_email: String(fd.get("email")), p_make: false }); flash("/admin/team", error?.message, "Admin removed"); }
export default async function Team({ searchParams }: { searchParams: { e?: string; m?: string } }) {
  const { s } = await superGuard(); const { data } = await s.rpc("list_admins");
  return (<><Flash e={searchParams.e} m={searchParams.m} /><h3 style={{ margin: "6px 0 10px" }}>Admins</h3>
    <form action={addAdmin} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}><input className="f" style={{ flex: 1, minWidth: 220, margin: 0 }} type="email" name="email" required placeholder="Email of an existing user" /><button className="btn">Make admin</button></form>
    {(data as any[] | null)?.map((x) => (<div key={x.id} className="li"><div style={{ flex: 1 }}><Link href={`/admin/users/${x.id}`} style={{ textDecoration: "underline" }}><b>{x.email}</b></Link> {x.is_super ? <span className="badge">SUPER ADMIN</span> : <span className="badge n">ADMIN</span>}</div>
      {!x.is_super && <form action={removeAdmin}><input type="hidden" name="email" value={x.email} /><button className="btn sm alt">Remove admin</button></form>}</div>))}</>);
}
