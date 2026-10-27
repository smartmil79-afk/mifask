"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function AutoRefresh({ every = 15000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const on = () => router.refresh();
    on(); const id = setInterval(on, every);
    window.addEventListener("focus", on); window.addEventListener("unread-refresh", on);
    return () => { clearInterval(id); window.removeEventListener("focus", on); window.removeEventListener("unread-refresh", on); };
  }, [router, every]);
  return null;
}
