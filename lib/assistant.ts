import { FAQ } from "./faq";
const STOP = new Set("a an the i to of for in on my me is are do does how can what where when who with and or it this that you your some any there have has at from".split(" "));
const INTENT = new Set("find looking buy search show need want cheap under available get please help".split(" "));
const stem = (w: string) => (w.length > 4 ? w.replace(/(ing|es|s)$/, "") : w);
const raw = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
export const toks = (t: string) => raw(t).map(stem);
export const prodTerms = (t: string) => raw(t).filter((w) => !INTENT.has(w)).map(stem);
export const wantsProd = (q: string) => /\b(find|looking|buy|search|show|need|want|cheap|under|available)\b/i.test(q);
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
