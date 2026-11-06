import { STATES } from "./constants";
export type Sort = "low" | "high" | "new";
export type Parsed = { terms: string[]; state?: string; cat?: string; catHint?: string; min?: number; max?: number; sort?: Sort; top?: number };
const STATE_ALIASES: Record<string, string> = {
  "port harcourt": "Rivers", "victoria island": "Lagos", "abuja fct": "Abuja (FCT)",
  lagos: "Lagos", ikeja: "Lagos", lekki: "Lagos", yaba: "Lagos", surulere: "Lagos", ikorodu: "Lagos", ajah: "Lagos", abuja: "Abuja (FCT)", fct: "Abuja (FCT)", garki: "Abuja (FCT)", wuse: "Abuja (FCT)",
  rivers: "Rivers", oyo: "Oyo", ibadan: "Oyo", kano: "Kano", enugu: "Enugu", kaduna: "Kaduna", delta: "Delta", warri: "Delta", asaba: "Delta", ogun: "Ogun", abeokuta: "Ogun", anambra: "Anambra", awka: "Anambra", onitsha: "Anambra", nnewi: "Anambra",
};
const GENERIC: Record<string, string> = {};
for (const [cat, words] of Object.entries({
  Vehicles: "car cars vehicle vehicles auto automobile motorcycle motorcycles truck trucks bus buses suv",
  "Phones & Tablets": "phone phones smartphone smartphones tablet tablets mobile",
  Property: "house houses apartment apartments flat flats land plot plots property properties bungalow duplex",
  Electronics: "laptop laptops computer computers tv television electronics camera cameras",
  Fashion: "clothes clothing shoe shoes dress dresses fashion bag bags",
  "Home & Garden": "furniture sofa sofas fridge generator generators bed beds",
  Services: "service services",
  Animals: "dog dogs puppy puppies cat cats pet pets animal animals goat goats",
  Jobs: "job jobs vacancy vacancies",
})) for (const w of words.split(" ")) GENERIC[w] = cat;
const BRAND: Record<string, string> = {};
for (const [cat, words] of Object.entries({
  "Phones & Tablets": "iphone samsung tecno infinix itel pixel huawei redmi xiaomi oppo",
  Vehicles: "toyota honda lexus mercedes benz bmw camry corolla highlander venza accord hyundai kia",
  Electronics: "hp dell lenovo macbook ps5 playstation xbox",
  Services: "plumber electrician cleaner mechanic tutor tailor painter driver carpenter",
})) for (const w of words.split(" ")) BRAND[w] = cat;
const STOP = new Set("search searching for find finding show me i want to buy looking look need a an the in at near around of with and please best good price prices cost how much is are what where can get any some available nearby sale sell selling on from my".split(" "));
const num = (n: string, u?: string) => { let v = parseFloat(n.replace(/,/g, "")); if (!isFinite(v)) return 0; if (u === "k" || u === "thousand") v *= 1e3; else if (u === "m" || u === "million" || u === "mil") v *= 1e6; return Math.round(v); };
const stem = (w: string) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);
export function parseSearch(raw: string): Parsed {
  let l = ` ${String(raw ?? "").toLowerCase().replace(/₦/g, " ")} `;
  const p: Parsed = { terms: [] };
  let m = l.match(/between\s+([\d][\d.,]*)\s*(k|m|million|thousand)?\s+(?:and|to)\s+([\d][\d.,]*)\s*(k|m|million|thousand)?/);
  if (m) { const a = num(m[1], m[2] ?? m[4]), b = num(m[3], m[4]); p.min = Math.min(a, b); p.max = Math.max(a, b); l = l.replace(m[0], " "); }
  m = l.match(/(?:under|below|less than|lower than|maximum|max|within|up to|not more than|budget of|budget|cheaper than)\s*([\d][\d.,]*)\s*(k|m|million|thousand|mil)?\b/);
  if (m) { p.max = num(m[1], m[2]); l = l.replace(m[0], " "); }
  m = l.match(/(?:above|over|more than|greater than|minimum|min|at least|starting from)\s*([\d][\d.,]*)\s*(k|m|million|thousand|mil)?\b/);
  if (m) { p.min = num(m[1], m[2]); l = l.replace(m[0], " "); }
  m = l.match(/\b([\d][\d.,]*)\s*(k|m|million|thousand)\b/);
  if (m && !p.max) { p.max = num(m[1], m[2]); l = l.replace(m[0], " "); }
  m = l.match(/\btop\s+(\d{1,2})\b/) || l.match(/\b(\d{1,2})\s+(?:cheapest|best|latest|newest|most expensive)\b/);
  if (m) { p.top = Math.min(50, Math.max(1, Number(m[1]))); l = l.replace(m[0], " "); }
  if (/\b(most expensive|highest price|highest priced|expensive|luxury)\b/.test(l)) { p.sort = "high"; l = l.replace(/\b(most expensive|highest priced|highest price|expensive|luxury)\b/g, " "); }
  else if (/\b(cheapest|cheap|lowest price|lowest priced|lowest|affordable|low price|budget friendly)\b/.test(l)) { p.sort = "low"; l = l.replace(/\b(cheapest|cheap|lowest priced|lowest price|lowest|affordable|low price|budget friendly)\b/g, " "); }
  else if (/\b(latest|newest|recent|recently|just listed)\b/.test(l)) { p.sort = "new"; l = l.replace(/\b(latest|newest|recently|recent|just listed)\b/g, " "); }
  for (const k of Object.keys(STATE_ALIASES).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${k}\\b`);
    if (re.test(l)) { p.state = STATE_ALIASES[k]; l = l.replace(new RegExp(`\\b${k}\\b`, "g"), " "); break; }
  }
  const words = l.replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  for (const w0 of words) {
    if (STOP.has(w0)) continue;
    const w = stem(w0);
    if (GENERIC[w0] || GENERIC[w]) { p.cat = p.cat ?? (GENERIC[w0] || GENERIC[w]); continue; }
    if (BRAND[w0] || BRAND[w]) p.catHint = p.catHint ?? (BRAND[w0] || BRAND[w]);
    if (!p.terms.includes(w)) p.terms.push(w);
  }
  p.terms = p.terms.slice(0, 6);
  return p;
}
const rank = (rows: any[], terms: string[]) => rows.map((r) => { const h = `${r.title} ${r.description}`.toLowerCase(); const t = String(r.title).toLowerCase(); let s = 0; for (const x of terms) { if (t.includes(x)) s += 2; else if (h.includes(x)) s += 1; } return [s, r] as [number, any]; }).sort((a, b) => b[0] - a[0]).map((x) => x[1]);
export async function smartSearch(s: any, q: string, base: { state?: string; cat?: string; min?: number; max?: number; sort?: string }, size: number) {
  const p = parseSearch(q);
  const state = base.state || p.state, cat = base.cat || p.cat, min = base.min || p.min, max = base.max || p.max;
  const sort = (base.sort as Sort | undefined) || p.sort;
  p.state = state; p.cat = cat; p.min = min; p.max = max; p.sort = sort;
  const limit = p.top ?? (sort === "low" || sort === "high" ? 10 : size);
  const notes: string[] = [];
  const run = async (o: { terms: string[]; mode: "and" | "or"; state?: string; cat?: string }) => {
    let qq = s.from("ads").select("*").eq("sold", false);
    if (o.state) qq = qq.eq("state", o.state);
    if (o.cat) qq = qq.eq("category", o.cat);
    if (min) qq = qq.gte("price", min);
    if (max) qq = qq.lte("price", max);
    const ors = o.terms.map((t) => `title.ilike.%${t}%,description.ilike.%${t}%`);
    if (o.mode === "and") { for (const x of ors) qq = qq.or(x); } else if (ors.length) qq = qq.or(ors.join(","));
    qq = sort === "low" ? qq.order("price", { ascending: true }) : sort === "high" ? qq.order("price", { ascending: false }) : qq.order("created_at", { ascending: false });
    const { data } = await qq.limit(o.mode === "or" ? Math.max(limit * 3, 30) : limit);
    let rows = (data ?? []) as any[];
    if (o.mode === "or" && !sort) rows = rank(rows, o.terms);
    return rows.slice(0, limit);
  };
  const what = p.terms.join(" ") || cat || "ads";
  const done = (ads: any[]) => ({ ads, notes, parsed: p });
  let r = await run({ terms: p.terms, mode: "and", state, cat }); if (r.length) return done(r);
  if (p.terms.length > 1) { r = await run({ terms: p.terms, mode: "or", state, cat }); if (r.length) { notes.push(`No exact match for “${p.terms.join(" ")}”. Showing the closest matches.`); return done(r); } }
  if (state) {
    r = await run({ terms: p.terms, mode: p.terms.length > 1 ? "or" : "and", cat });
    if (r.length) { notes.push(`No ${what} found in ${state}. Showing ${what} from other states.`); return done(r); }
  }
  if (p.terms.length) {
    try {
      const { data } = await s.rpc("fuzzy_ads", { p_term: p.terms.join(" "), p_state: state ?? null, p_limit: limit });
      let rows = ((data ?? []) as any[]).filter((a) => (!cat || a.category === cat) && (!min || a.price >= min) && (!max || a.price <= max));
      if (!rows.length && state) { const d2 = await s.rpc("fuzzy_ads", { p_term: p.terms.join(" "), p_state: null, p_limit: limit }); rows = ((d2.data ?? []) as any[]).filter((a) => (!cat || a.category === cat) && (!min || a.price >= min) && (!max || a.price <= max)); }
      if (rows.length) { notes.push(`Showing results similar to “${p.terms.join(" ")}”.`); return done(sort === "low" ? rows.sort((a, b) => a.price - b.price) : sort === "high" ? rows.sort((a, b) => b.price - a.price) : rows); }
    } catch {}
  }
  const c = cat || p.catHint;
  if (c) {
    r = await run({ terms: [], mode: "and", state, cat: c }); if (r.length) { notes.push(`No exact match. Showing ${c}${state ? " in " + state : ""}.`); return done(r); }
    r = await run({ terms: [], mode: "and", cat: c }); if (r.length) { notes.push(`No exact match. Showing ${c} from all of Nigeria.`); return done(r); }
  }
  return done([]);
}
export function headline(p: Parsed, q: string) {
  const what = p.terms.join(" ") || p.cat || "ads";
  const adj = p.sort === "low" ? "cheapest " : p.sort === "high" ? "most expensive " : p.sort === "new" ? "latest " : "";
  const top = p.top ? `Top ${p.top} ` : p.sort === "low" || p.sort === "high" ? "Top 10 " : "";
  const where = p.state ? ` in ${p.state}` : "";
  const price = p.max && p.min ? ` between ₦${p.min.toLocaleString("en-NG")} and ₦${p.max.toLocaleString("en-NG")}` : p.max ? ` under ₦${p.max.toLocaleString("en-NG")}` : p.min ? ` above ₦${p.min.toLocaleString("en-NG")}` : "";
  const t = `${top}${adj}${what}${where}${price}`.trim();
  return t ? t[0].toUpperCase() + t.slice(1) : `Results for “${q}”`;
}
export { STATES };
