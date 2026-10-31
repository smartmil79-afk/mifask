import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import Logo from "./Logo";
import SignOut from "./SignOut";
import UnreadBadge from "./UnreadBadge";
import ThemeToggle from "./ThemeToggle";
export default async function Header() {
  const s = supabaseServer();
  const { data: { user } } = await s.auth.getUser();
  const { data: w } = user ? await s.from("wallets").select("balance, tokens").eq("user_id", user.id).single() : { data: null };
  const { data: me } = user ? await s.from("profiles").select("is_admin, is_super").eq("id", user.id).single() : { data: null };
  const isAdmin = !!(me?.is_admin || me?.is_super);
  return (
    <header><div className="wrap bar">
      <Link href="/" className="logo"><Logo /><span>Mifask</span></Link>
      <nav className="navpill" aria-label="Main"><Link href="/">Home</Link>{user && <Link href="/dashboard">Dashboard</Link>}<Link href="/help">Help</Link><Link href="/safety">Safety</Link></nav>
      <span className="sp" />
      {user ? (<><Link className="btn nav" href="/wallet">🪙 {w?.tokens ?? 0} · ₦{Number(w?.balance ?? 0).toLocaleString("en-NG")}</Link><Link className="btn nav" href="/messages">💬<UnreadBadge /></Link>{isAdmin && <Link className="btn nav" href="/admin">Admin</Link>}<SignOut /></>) : <Link className="btn nav" href="/login">Sign in</Link>}
      <ThemeToggle /><Link className="btn" href="/post">+ Sell</Link>
    </div></header>
  );
}
