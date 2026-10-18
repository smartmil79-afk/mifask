import Link from "next/link";
import { naira, CAT_FIELD, condText } from "@/lib/constants";
export default function AdCard({ ad, sponsored }: { ad: any; sponsored?: boolean }) {
  return (
    <Link href={`/ads/${ad.id}`} className={`card ${sponsored ? "sp" : ""}`}>
      <div className="pic">{ad.images?.[0] ? <img src={ad.images[0]} alt="" loading="lazy" /> : "📦"}</div>
      <div className="info">
        <div className="price">{naira(ad.price)}</div>
        <div>{ad.title}</div>
        <div className="meta">{ad.sold && <span className="badge">SOLD</span>}{sponsored && <span className="badge">★ SPONSORED</span>}{CAT_FIELD[ad.category] && condText(ad.category, ad.condition) && <span className="badge n">{condText(ad.category, ad.condition).slice(0, 24)}</span>}{ad.state} · {new Date(ad.created_at).toLocaleDateString("en-NG")}</div>
      </div>
    </Link>
  );
}
