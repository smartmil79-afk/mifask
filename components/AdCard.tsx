import Link from "next/link";
import { naira, CAT_FIELD, condText, imgFor } from "@/lib/constants";
const ago = (t: string) => {
  const m = Math.max(1, Math.round((Date.now() - new Date(t).getTime()) / 60000));
  if (m < 60) return `${m}m ago`; const h = Math.round(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24); return d < 30 ? `${d}d ago` : new Date(t).toLocaleDateString("en-NG");
};
export default function AdCard({ ad, sponsored, compact }: { ad: any; sponsored?: boolean; compact?: boolean }) {
  const ct = CAT_FIELD[ad.category] ? condText(ad.category, ad.condition) : "";
  if (compact) return (
    <Link href={`/ads/${ad.id}`} className={`card compact ${sponsored ? "sp" : ""}`}>
      <div className="th"><img src={imgFor(ad)} alt="" loading="lazy" /></div>
      <div className="cinfo"><div className="t">{ad.title}</div><div className="cprice">{naira(ad.price)}</div>
        <div className="meta">{sponsored && <span className="badge">★ Sponsored</span>}{ad.state}</div></div>
    </Link>
  );
  return (
    <Link href={`/ads/${ad.id}`} className={`card lcard ${sponsored ? "sp" : ""}`}>
      <div className="pic"><img src={imgFor(ad)} alt={ad.title} loading="lazy" />{sponsored && <span className="ribbon">★ Sponsored</span>}{ad.sold && <span className="ribbon sold">SOLD</span>}</div>
      <div className="info"><div className="cprice">{naira(ad.price)}</div><div className="t">{ad.title}</div>
        <div className="meta">{ct && <span className="badge n">{ct.slice(0, 26)}</span>}<span className="loc">📍 {ad.state}</span> · {ago(ad.created_at)}</div></div>
    </Link>
  );
}