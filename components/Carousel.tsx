"use client";
import { useEffect, useRef, useState } from "react";
const stepW = (el: HTMLDivElement) => ((el.firstElementChild as HTMLElement)?.offsetWidth ?? 260) + 16;
export default function Carousel({ children }: { children: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null); const pause = useRef(false); const [k, setK] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      const el = ref.current; if (!el || pause.current || document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) el.scrollTo({ left: 0, behavior: "smooth" }); else el.scrollBy({ left: stepW(el), behavior: "smooth" });
    }, 3200);
    return () => clearInterval(t);
  }, []);
  const go = (d: number) => ref.current?.scrollBy({ left: d * stepW(ref.current), behavior: "smooth" });
  return (
    <div className="carw" onMouseEnter={() => (pause.current = true)} onMouseLeave={() => (pause.current = false)} onTouchStart={() => (pause.current = true)}>
      <div className="car" ref={ref} onScroll={(e) => setK(Math.round(e.currentTarget.scrollLeft / stepW(e.currentTarget)))}>
        {children.map((c, i) => <div className="slide" key={i}>{c}</div>)}
      </div>
      <button className="arr l" onClick={() => go(-1)} aria-label="Previous">‹</button>
      <button className="arr r" onClick={() => go(1)} aria-label="Next">›</button>
      <div className="dots">{children.map((_, i) => <i key={i} className={i === k ? "on" : ""} />)}</div>
    </div>
  );
}
