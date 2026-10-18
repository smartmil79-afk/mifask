import { FAQ } from "@/lib/faq";
import OpenHash from "@/components/OpenHash";
export const metadata = { title: "Help and FAQ", description: "Answers about posting ads, payments, the wallet, tokens, withdrawals and staying safe on Mifask." };
export default function Help() {
  const secs = Array.from(new Set(FAQ.map((f) => f.s)));
  return (<div className="box faqp" style={{ maxWidth: 760, lineHeight: 1.6 }}><OpenHash />
    <h2 style={{ marginTop: 0 }}>Help and FAQ</h2>
    <p className="meta">Can’t find your answer? Tap “Ask Mifask” at the bottom of the page, email mifask@proton.me or WhatsApp 0812 148 3131.</p>
    {secs.map((s) => (<div key={s}><h4>{s}</h4>{FAQ.filter((f) => f.s === s).map((f) => <details key={f.id} id={f.id}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>))}
  </div>);
}
