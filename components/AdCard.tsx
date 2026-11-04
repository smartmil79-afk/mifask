import Link from "next/link";
import { naira, CAT_FIELD, condText, imgFor, PLACEHOLDER } from "@/lib/constants";
import Img from "./Img";
const ago = (t: string) => {
  const m = Math.max(1, Math.round((Date.now() - new Date(t).getTime()) / 60000));
  if (m < 60) return `${m}m ago`; const h = Math.round(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24); return d < 30 ? `${d}d ago` : new Date(t).toLocaleDateString("en-NG");
};
const PLAN: Record<string, string> = { premium: "PREMIUM", pro: "PRO", basic: "BASIC" };
export default function AdCard({ ad, sponsored, plan, compact }: { ad: any; sponsored?: boolean; plan?: string; compact?: boolean }) {
  const ct = CAT_FIELD[ad.category] ? condText(ad.category, ad.condition) : "";
  const fb = PLACEHOLDER[ad.category] || PLACEHOLDER.default;
  const label = sponsored ? `★ ${PLAN[plan ?? ""] ?? "SPONSORED"}` : "";
  const cls = `card ${sponsored ? "sp spglow p-" + (plan ?? "basic") : ""}`;
  if (compact) return (
    <Link href={`/ads/${ad.id}`} className={`${cls} compact`}>
      <div className="th"><Img src={imgFor(ad)} fallback={fb} />{ad.sold && <span className="soldveil"><b>SOLD</b></span>}</div>
      <div className="cinfo"><div className="t">{ad.title}</div><div className="cprice">{naira(ad.price)}</div>
        <div className="meta">{sponsored && <span className={`ribbon promo inline p-${plan ?? "basic"}`}>{label}</span>}{ad.state}</div></div>
    </Link>
  );
  return (
    <Link href={`/ads/${ad.id}`} className={`${cls} lcard${ad.sold ? " soldcard" : ""}`}>
      <div className="pic"><Img src={imgFor(ad)} alt={ad.title} fallback={fb} />
        {sponsored && <span className={`ribbon promo p-${plan ?? "basic"}`}>{label}</span>}
        {ad.sold && <span className="soldveil"><b>SOLD</b></span>}</div>
      <div className="info"><div className="cprice">{naira(ad.price)}</div><div className="t">{ad.title}</div>
        <div className="meta">{ct && <span className="badge n">{ct.slice(0, 26)}</span>}<span className="loc">📍 {ad.state}</span> · {ago(ad.created_at)}</div></div>
    </Link>
  );
}
