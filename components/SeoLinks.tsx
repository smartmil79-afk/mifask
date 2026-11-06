import Link from "next/link";
import { CATS, STATES } from "@/lib/constants";
import { slug } from "@/lib/seo";
export default function SeoLinks({ cat }: { cat?: string }) {
  const cats = cat ? CATS.filter((c) => c !== cat) : CATS;
  const states = STATES.slice(0, 6);
  return (<section className="seolinks" aria-label="Browse by category and location">
    <h2>Browse Mifask</h2>
    <div className="seocols">
      <div><h3>By category</h3>{cats.map((c) => <Link key={c} href={`/category/${slug(c)}`}>{c} for sale in Nigeria</Link>)}</div>
      <div><h3>Popular searches</h3>{(cat ? [cat] : CATS.slice(0, 3)).flatMap((c) => states.slice(0, 4).map((st) => <Link key={c + st} href={`/category/${slug(c)}/${slug(st)}`}>{c} for sale in {st}</Link>))}</div>
    </div></section>);
}
