"use client";
import { useRef, useState } from "react";
export default function Gallery({ images }: { images: string[] }) {
  const ref = useRef<HTMLDivElement>(null); const [k, setK] = useState(0);
  const go = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth, behavior: "smooth" });
  return (
    <div className="gw">
      <div className="gal" ref={ref} onScroll={(e) => setK(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
        {images.length ? images.map((u) => <div key={u}><img src={u} alt="" /></div>) : <div>📦</div>}
      </div>
      {images.length > 1 && (<>
        <button className="arr l" onClick={() => go(-1)} aria-label="Previous">‹</button>
        <button className="arr r" onClick={() => go(1)} aria-label="Next">›</button>
        <div className="gd">{images.map((_, i) => <i key={i} className={i === k ? "on" : ""} />)}</div></>)}
    </div>
  );
}
