import { FAQ } from "./faq";
import { STATES } from "./constants";
const STOP = new Set("a an the i to of for in on my me is are do does how can what where when who with and or it this that you your some any there have has at from than".split(" "));
const INTENT = new Set("find looking buy search show need want cheap under below less max within budget available get please help around near".split(" "));
const stem = (w: string) => (w.length > 4 ? w.replace(/(ing|es|s)$/, "") : w);
const raw = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
export const toks = (t: string) => raw(t).map(stem);
export const wantsProd = (q: string) => /\b(find|looking|buy|search|show|need|want|cheap|under|below|available|price|how much)\b/i.test(q);
const CAT_WORDS: Record<string, string> = {
  phone: "Phones & Tablets", iphone: "Phones & Tablets", samsung: "Phones & Tablets", tecno: "Phones & Tablets", infinix: "Phones & Tablets", tablet: "Phones & Tablets",
  car: "Vehicles", vehicle: "Vehicles", toyota: "Vehicles", honda: "Vehicles", lexus: "Vehicles", bike: "Vehicles", motorcycle: "Vehicles", truck: "Vehicles",
  house: "Property", flat: "Property", apartment: "Property", land: "Property", plot: "Property", rent: "Property", bedroom: "Property", duplex: "Property",
  laptop: "Electronics", tv: "Electronics", television: "Electronics", camera: "Electronics", playstation: "Electronics", console: "Electronics",
  shoe: "Fashion", dress: "Fashion", gown: "Fashion", bag: "Fashion", shirt: "Fashion",
  sofa: "Home & Garden", bed: "Home & Garden", generator: "Home & Garden", fridge: "Home & Garden", furniture: "Home & Garden",
  plumber: "Services", electrician: "Services", cleaner: "Services", tutor: "Services", mechanic: "Services",
  dog: "Animals", puppy: "Animals", cat: "Animals", goat: "Animals", job: "Jobs", vacancy: "Jobs",
};
export function parseQuery(q: string) {
  const l = q.toLowerCase();
  let max: number | undefined;
  const m = l.match(/(?:under|below|less than|max|within|budget(?: of)?)\s*₦?\s*([\d,.]+)\s*(k|m|million|thousand)?/);
  if (m) { let n = parseFloat(m[1].replace(/,/g, "")); const u = m[2]; if (u === "k" || u === "thousand") n *= 1e3; else if (u === "m" || u === "million") n *= 1e6; if (n > 0) max = n; }
  const state = STATES.find((s) => l.includes(s.split(" ")[0].toLowerCase()));
  const cat = Object.entries(CAT_WORDS).find(([k]) => new RegExp(`\\b${k}s?\\b`).test(l))?.[1];
  const terms = raw(q).filter((w) => !INTENT.has(w) && !/^[0-9][0-9,.]*(k|m)?$/.test(w) && !STATES.some((s) => s.toLowerCase().includes(w))).map(stem);
  return { max, state, cat, terms };
}
export function faqMatch(q: string) {
  const t = toks(q); if (!t.length) return null;
  let best: (typeof FAQ)[number] | null = null, bs = 0;
  for (const f of FAQ) {
    const keys = f.k.split(" ").map(stem), ql = f.q.toLowerCase(), hay = (f.q + " " + f.a).toLowerCase(); let s = 0;
    for (const w of t) { if (keys.includes(w)) s += 3; else if (ql.includes(w)) s += 2; else if (hay.includes(w)) s += 0.5; }
    if (s > bs) { bs = s; best = f; }
  }
  return bs >= 3 ? best : null;
}
