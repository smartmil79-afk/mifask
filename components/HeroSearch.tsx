"use client";
import { useEffect, useRef, useState } from "react";
import { STATES } from "@/lib/constants";
const HINTS = ["cheapest iPhone in Lagos", "Toyota Camry under 3m", "3 bedroom flat to let", "Plumber in Abuja", "Laptop under 300k", "Generator 3.5kVA", "Ankara gown"];
export default function HeroSearch({ q, state }: { q?: string; state?: string }) {
  const [ph, setPh] = useState(""); const [val, setVal] = useState(q ?? ""); const [items, setItems] = useState<string[]>([]); const [open, setOpen] = useState(false);
  const form = useRef<HTMLFormElement>(null);
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
  useEffect(() => {
    if (val.trim().length < 2) { setItems([]); return; }
    const t = setTimeout(async () => { try { const r = await (await fetch("/api/suggest?q=" + encodeURIComponent(val))).json(); setItems(r.items ?? []); } catch { setItems([]); } }, 220);
    return () => clearTimeout(t);
  }, [val]);
  function pick(x: string) { setVal(x); setOpen(false); setTimeout(() => form.current?.requestSubmit(), 0); }
  return (<div className="sugwrap"><form className="searchwrap" action="/" ref={form}><div className="search big">
    <input name="q" value={val} onChange={(e) => { setVal(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} placeholder={ph ? `Search “${ph}”` : "Search Mifask"} aria-label="Search" autoComplete="off" />
    <select name="state" defaultValue={state || ""} aria-label="Location"><option value="">All Nigeria</option>{STATES.map((x) => <option key={x}>{x}</option>)}</select>
    <button className="btn">Search</button></div></form>
    {open && items.length > 0 && <ul className="sug" role="listbox">{items.map((x) => <li key={x}><button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(x)}>🔎 {x}</button></li>)}</ul>}</div>);
}
