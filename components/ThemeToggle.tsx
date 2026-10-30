"use client";
import { useEffect, useState } from "react";
export default function ThemeToggle() {
  const [t, setT] = useState("light");
  useEffect(() => { setT(document.documentElement.dataset.theme || "light"); }, []);
  function flip() {
    const n = t === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = n; setT(n);
    try { localStorage.setItem("mf_theme", n); } catch {}
  }
  return <button className="btn nav icon" onClick={flip} aria-label={t === "light" ? "Switch to dark mode" : "Switch to light mode"} title={t === "light" ? "Dark mode" : "Light mode"}>{t === "light" ? "🌙" : "☀️"}</button>;
}
