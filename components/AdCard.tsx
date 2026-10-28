import Link from "next/link";
import { naira, CAT_FIELD, CAT_ICONS, condText } from "@/lib/constants";
export default function AdCard({ ad, sponsored, compact }: { ad: any; sponsored?: boolean; compact?: boolean }) {
  const ct = CAT_FIELD[ad.category] ? condText(ad.category, ad.condition) : "";
  if (compact) return (
    <Link href={`/ads/${ad.id}`} className={`card compact ${sponsored ? "sp" : ""}`}>
      <div className="th">{ad.images?.[0] ? <img src={ad.images[0]} alt="" loading="lazy" /> : (CAT_ICONS[ad.category] ?? "📦")}</div>
      <div className="cinfo"><div className="t">{ad.title}</div><div className="cprice">{naira(ad.price)}</div>
        <div className="meta">{sponsored && <span className="badge">★ Sponsored</span>}{ad.state}</div></div>
    </Link>
  );
  return (
    <Link href={`/ads/${ad.id}`} className={`card ${sponsored ? "sp" : ""}`}>
      <div className="pic">{ad.images?.[0] ? <img src={ad.images[0]} alt="" loading="lazy" /> : (CAT_ICONS[ad.category] ?? "📦")}
        <span className="pill">{naira(ad.price)}</span>{sponsored && <span className="ribbon">★ Sponsored</span>}</div>
      <div className="info"><div className="t">{ad.title}</div>
        <div className="meta">{ad.sold && <span className="badge">SOLD</span>}{ct && <span className="badge n">{ct.slice(0, 24)}</span>}{ad.state} · {new Date(ad.created_at).toLocaleDateString("en-NG")}</div></div>
    </Link>
  );
}
