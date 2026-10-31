"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function AdminTabs({ isSuper }: { isSuper: boolean }) {
  const path = usePathname();
  const tabs: [string, string][] = [["Overview", "/admin"], ["Users", "/admin/users"], ["Ads", "/admin/ads"], ["Reports", "/admin/reports"], ["Promotions", "/admin/promotions"]];
  if (isSuper) tabs.push(["Payments", "/admin/payments"], ["Withdrawals", "/admin/withdrawals"], ["Team", "/admin/team"], ["Activity", "/admin/log"]);
  return (<nav className="atabs" aria-label="Admin sections">{tabs.map(([l, h]) => <Link key={h} href={h} className={(h === "/admin" ? path === h : path.startsWith(h)) ? "on" : ""}>{l}</Link>)}</nav>);
}
