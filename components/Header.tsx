import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import Logo from "./Logo";
import SignOut from "./SignOut";
export default async function Header() {
  const s = supabaseServer();
  const { data: { user } } = await s.auth.getUser();
  const { data: w } = user ? await s.from("wallets").select("balance, tokens").eq("user_id", user.id).single() : { data: null };
  const { data: unread } = user ? await s.rpc("unread_count") : { data: 0 };
  const isAdmin = user ? !!(await s.from("profiles").select("is_admin").eq("id", user.id).single()).data?.is_admin : false;
  return (
    <header><div className="wrap bar">
      <Link href="/" className="logo"><Logo /><span>Mifask</span></Link><span className="sp" />
      {user ? (<><Link className="btn nav" href="/wallet">🪙 {w?.tokens ?? 0} · ₦{Number(w?.balance ?? 0).toLocaleString("en-NG")}</Link><Link className="btn nav" href="/messages">💬{Number(unread) > 0 && <span className="dot">{Number(unread)}</span>}</Link>{isAdmin && <Link className="btn nav" href="/admin">Admin</Link>}<Link className="btn nav" href="/dashboard">Dashboard</Link><SignOut /></>) : <Link className="btn nav" href="/login">Sign in</Link>}
      <Link className="btn" href="/post">+ Sell</Link>
    </div></header>
  );
}
