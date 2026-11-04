"use client";
export default function Img({ src, fallback, alt = "" }: { src: string; fallback: string; alt?: string }) {
  return <img src={src} alt={alt} loading="lazy" onError={(e) => { const t = e.currentTarget; if (!t.src.endsWith(fallback)) t.src = fallback; }} />;
}
