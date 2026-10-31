"use client";
import { useEffect, useState } from "react";
import { STATES } from "@/lib/constants";
const HINTS = ["iPhone 13 in Lagos", "Toyota Camry 2012", "3 bedroom flat to let", "Plumber in Abuja", "Laptop under 300k", "Generator 3.5kVA", "Ankara gown"];
export default function HeroSearch({ q, state }: { q?: string; state?: string }) {
  const [ph, setPh] = useState("");
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setPh(HINTS[0]); return; }
    let i = 0, j = 0, del = false, t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const word = HINTS[i % HINTS.length];
      if (!del) { j++; setPh(word.slice(0, j)); if (j === word.length) { del = true; t = setTimeout(tick, 1400); return; } }
      else { j--; setPh(word.slice(0, j)); if (j === 0) { del = false; i++; } }
      t = setTimeout(tick, del ? 28 : 65);
    };
    tick(); return () => clearTimeout(t);
  }, []);
  return (<form className="searchwrap" action="/"><div className="search big">
    <input name="q" defaultValue={q} placeholder={ph ? `Search “${ph}”` : "Search Mifask"} aria-label="Search" autoComplete="off" />
    <select name="state" defaultValue={state || ""} aria-label="Location"><option value="">All Nigeria</option>{STATES.map((x) => <option key={x}>{x}</option>)}</select>
    <button className="btn">Search</button></div></form>);
}
