import Link from "next/link";
export default function BottomNav() {
  return (
    <nav className="bnav" aria-label="Main">
      <Link href="/" aria-label="Home"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg></Link>
      <Link href="/post" className="plus" aria-label="Sell">+</Link>
      <Link href="/dashboard" aria-label="Account"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/></svg></Link>
    </nav>
  );
}
