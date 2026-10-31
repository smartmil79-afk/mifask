import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { adminGuard, superGuard, flash } from "@/lib/admin";
import { naira } from "@/lib/constants";
import Flash from "@/components/Flash";
export const dynamic = "force-dynamic";
const back = (id: string) => `/admin/users/${id}`;
async function rename(fd: FormData) { "use server"; const { s } = await adminGuard(); const id = String(fd.get("id")); const { error } = await s.rpc("admin_rename_user", { p_user: id, p_name: String(fd.get("name")) }); flash(back(id), error?.message, "Name updated"); }
async function resetPw(fd: FormData) { "use server"; const { s } = await adminGuard(); const id = String(fd.get("id")); const { error } = await s.auth.resetPasswordForEmail(String(fd.get("email")), { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset` }); flash(back(id), error?.message, "Password reset link sent"); }
async function adjust(fd: FormData) { "use server"; const { s } = await superGuard(); const id = String(fd.get("id")); const { error } = await s.rpc("admin_adjust_wallet", { p_user: id, p_amount: Math.round(Number(fd.get("amount") || 0)), p_tokens: Math.round(Number(fd.get("tokens") || 0)), p_note: String(fd.get("note") || "") }); flash(back(id), error?.message, "Wallet updated"); }
async function message(fd: FormData) { "use server"; const { s } = await adminGuard(); const id = String(fd.get("id")); const { data, error } = await s.rpc("admin_message_user", { p_user: id, p_body: String(fd.get("body")) }); if (error || !data) flash(back(id), error?.message ?? "Could not send"); redirect(`/messages/${data}`); }
async function suspend(fd: FormData) { "use server"; const { s } = await adminGuard(); const id = String(fd.get("id")); const on = fd.get("suspend") === "1"; const { error } = await s.rpc("admin_set_suspended", { p_user: id, p_suspend: on, p_reason: String(fd.get("reason") || "") }); flash(back(id), error?.message, on ? "User suspended" : "User reactivated"); }
async function role(fd: FormData) { "use server"; const { s } = await superGuard(); const id = String(fd.get("id")); const { error } = await s.rpc("set_admin", { p_email: String(fd.get("email")), p_make: fd.get("make") === "1" }); flash(back(id), error?.message, "Role updated"); }
async function del(fd: FormData) { "use server"; const { s } = await superGuard(); const id = String(fd.get("id")); if (String(fd.get("confirm")).trim() !== "DELETE") flash(back(id), "Type DELETE to confirm"); const { error } = await s.rpc("admin_delete_user", { p_user: id }); if (error) flash(back(id), error.message); flash("/admin/users", null, "User deleted"); }
export default async function UserPage({ params, searchParams }: { params: { id: string }; searchParams: { e?: string; m?: string } }) {
  const { s, isSuper } = await adminGuard();
  const { data } = await s.rpc("admin_get_user", { p_id: params.id }); const u = ((data ?? []) as any[])[0]; if (!u) notFound();
  const { data: ads } = await s.from("ads").select("id, title, price, state, sold, created_at").eq("seller_id", params.id).order("created_at", { ascending: false }).limit(10);
  const d = (x: string | null) => (x ? new Date(x).toLocaleString("en-NG") : "never");
  const H = ({ id }: { id: string }) => <input type="hidden" name="id" value={id} />;
  return (<>
    <Link href="/admin/users" className="btn sm alt">← All users</Link>
    <Flash e={searchParams.e} m={searchParams.m} />
    <div className="li" style={{ marginTop: 12 }}><div className="av">{(u.display_name || u.email || "?")[0].toUpperCase()}</div>
      <div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: "1.1rem" }}>{u.display_name || "No name"}</b> {u.super_flag ? <span className="badge">SUPER ADMIN</span> : u.admin_flag ? <span className="badge n">ADMIN</span> : null}{u.suspended && <span className="badge" style={{ background: "#d64545" }}>SUSPENDED</span>}
        <div className="meta">{u.email}</div><div className="meta">Joined {d(u.joined_at)} · Last sign-in {d(u.last_sign_in)}</div>
        {u.suspended && u.suspended_reason && <div className="meta">Reason: {u.suspended_reason}</div>}</div></div>
    <div className="sgrid"><div className="stat"><b>{u.ad_count}</b>Ads</div>{isSuper && <><div className="stat"><b>{naira(u.balance)}</b>Wallet</div><div className="stat"><b>🪙 {u.tokens}</b>Coins</div></>}</div>

    <div className="box" style={{ maxWidth: "none" }}><h3 style={{ marginTop: 0 }}>Edit user</h3>
      <form action={rename} className="arow"><H id={u.user_id} /><input className="f" style={{ flex: 1, minWidth: 200, margin: 0 }} name="name" defaultValue={u.display_name ?? ""} maxLength={60} required /><button className="btn">Save name</button></form>
      <form action={resetPw} style={{ marginTop: 10 }}><H id={u.user_id} /><input type="hidden" name="email" value={u.email} /><button className="btn alt">Send password reset link</button></form></div>

    {isSuper && (<div className="box" style={{ maxWidth: "none" }}><h3 style={{ marginTop: 0 }}>Add or remove funds and coins</h3>
      <p className="meta">Use a minus sign to remove, for example -500. The user sees the note in their wallet history.</p>
      <form action={adjust} className="form2"><H id={u.user_id} /><input className="f" style={{ margin: 0 }} type="number" name="amount" placeholder="Funds in naira (e.g. 2000 or -500)" /><input className="f" style={{ margin: 0 }} type="number" name="tokens" placeholder="Coins (e.g. 10 or -5)" /><input className="f" style={{ margin: 0 }} name="note" placeholder="Note, e.g. Promotion bonus" maxLength={100} /><button className="btn">Apply</button></form></div>)}

    <div className="box" style={{ maxWidth: "none" }}><h3 style={{ marginTop: 0 }}>Message user</h3>
      <form action={message} className="form2"><H id={u.user_id} /><textarea className="f" style={{ margin: 0 }} name="body" rows={3} maxLength={1000} required placeholder="Write a message. It appears in the user's Messages as “Mifask Support”." /><button className="btn">Send message</button></form></div>

    <div className="box" style={{ maxWidth: "none" }}><h3 style={{ marginTop: 0 }}>{u.suspended ? "Reactivate account" : "Suspend account"}</h3>
      <p className="meta">{u.suspended ? "The user will be able to sign in again and their ads will show." : "The user cannot sign in, and their ads are hidden. You can reactivate them at any time."}</p>
      <form action={suspend} className="form2"><H id={u.user_id} /><input type="hidden" name="suspend" value={u.suspended ? "0" : "1"} />{!u.suspended && <input className="f" style={{ margin: 0 }} name="reason" placeholder="Reason (shown to admins only)" maxLength={300} required />}<button className="btn alt">{u.suspended ? "Reactivate" : "Suspend user"}</button></form></div>

    {isSuper && !u.super_flag && (<div className="box" style={{ maxWidth: "none" }}><h3 style={{ marginTop: 0 }}>Role</h3>
      <form action={role}><H id={u.user_id} /><input type="hidden" name="email" value={u.email} /><input type="hidden" name="make" value={u.admin_flag ? "0" : "1"} /><button className="btn alt">{u.admin_flag ? "Remove admin role" : "Make admin"}</button></form></div>)}

    {isSuper && !u.super_flag && (<div className="box danger" style={{ maxWidth: "none" }}><h3 style={{ marginTop: 0 }}>Delete user</h3>
      <p className="meta">Deletes the account and all of its ads and chats for good. Accounts with payment records or wallet money cannot be deleted; suspend them instead.</p>
      <form action={del} className="arow"><H id={u.user_id} /><input className="f" style={{ flex: 1, minWidth: 180, margin: 0 }} name="confirm" placeholder="Type DELETE to confirm" /><button className="btn alt">Delete user</button></form></div>)}

    <h3>Latest ads</h3>
    {ads?.length ? ads.map((a: any) => <div key={a.id} className="li"><div style={{ flex: 1 }}><b>{a.title}</b><div className="meta">{naira(a.price)} · {a.state}{a.sold ? " · sold" : ""}</div></div><Link className="btn sm alt" href={`/ads/${a.id}`}>View</Link></div>) : <p className="meta">No ads.</p>}
  </>);
}
