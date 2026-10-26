import Link from "next/link";
import { naira, CAT_FIELD, CAT_ICONS, condText } from "@/lib/constants";
export default function AdCard({ ad, sponsored }: { ad: any; sponsored?: boolean }) {
  const ct = CAT_FIELD[ad.category] ? condText(ad.category, ad.condition) : "";
  return (
    <Link href={`/ads/${ad.id}`} className={`card ${sponsored ? "sp" : ""}`}>
      <div className="pic">{ad.images?.[0] ? <img src={ad.images[0]} alt="" loading="lazy" /> : (CAT_ICONS[ad.category] ?? "📦")}
        <span className="pill">{naira(ad.price)}</span>{sponsored && <span className="ribbon">★ Sponsored</span>}</div>
      <div className="info"><div className="t">{ad.title}</div>
        <div className="meta">{ad.sold && <span className="badge">SOLD</span>}{ct && <span className="badge n">{ct.slice(0, 24)}</span>}{ad.state} · {new Date(ad.created_at).toLocaleDateString("en-NG")}</div></div>
    </Link>
  );
}
