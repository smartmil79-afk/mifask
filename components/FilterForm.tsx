import Link from "next/link";
import { STATES } from "@/lib/constants";
type P = { q?: string; cat?: string; sort?: string; state?: string; min?: string; max?: string };
export default function FilterForm({ q, cat, sort, state, min, max }: P) {
  const clear = "/?" + new URLSearchParams(Object.entries({ q, cat, sort }).filter(([, v]) => v) as [string, string][]).toString();
  return (<form className="fform" action="/">
    {q && <input type="hidden" name="q" value={q} />}{cat && <input type="hidden" name="cat" value={cat} />}{sort && <input type="hidden" name="sort" value={sort} />}
    <label className="meta">Location</label>
    <select className="f" style={{ margin: 0 }} name="state" defaultValue={state || ""}><option value="">All Nigeria</option>{STATES.map((x) => <option key={x}>{x}</option>)}</select>
    <label className="meta">Price (₦)</label>
    <div className="row2"><input className="f" style={{ margin: 0 }} type="number" name="min" min={0} placeholder="Min" defaultValue={min || ""} /><input className="f" style={{ margin: 0 }} type="number" name="max" min={0} placeholder="Max" defaultValue={max || ""} /></div>
    <button className="btn">Apply filters</button>
    {(state || min || max) && <Link className="btn alt" href={clear}>Clear filters</Link>}
  </form>);
}
