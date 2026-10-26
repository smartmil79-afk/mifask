"use client";
import { useEffect, useRef, useState } from "react";
import { FAQ, START } from "@/lib/faq";
import { faqMatch, wantsProd } from "@/lib/assistant";
import { naira } from "@/lib/constants";
type Ad = { id: string; title: string; price: number; state: string; images?: string[] };
type Msg = { who: "b" | "u"; text?: string; faq?: (typeof FAQ)[number]; ads?: Ad[]; chips?: string[]; contact?: boolean; typing?: boolean; anim?: boolean; fb?: "up" | "down" };
const QUICK: [string, string][] = [["Find something", START[0]], ["Sell faster", "How do I sell faster with a sponsored ad?"], ["Safety tips", "Safety tips for buyers"], ["Wallet help", "What is the Mifask wallet?"], ["Talk to a person", "Talk to a person"]];
const HELLO: Msg = { who: "b", anim: true, text: "Hi! I’m the Mifask assistant 👋\nI can find products and services for you, explain how things work, and share safety tips." };
function Typed({ text, anim, open }: { text: string; anim?: boolean; open: boolean }) {
  const words = text.split(" "); const [n, setN] = useState(anim ? 0 : words.length);
  useEffect(() => { if (!anim || !open || n >= words.length) return; const t = setTimeout(() => setN(n + 1), 22); return () => clearTimeout(t); }, [n, anim, open, words.length]);
  return <>{words.slice(0, n).join(" ")}</>;
}
export default function ChatWidget() {
  const [open, setOpen] = useState(false); const [input, setInput] = useState(""); const [msgs, setMsgs] = useState<Msg[]>([HELLO]);
  const [teaser, setTeaser] = useState(false); const box = useRef<HTMLDivElement>(null); const ready = useRef(false);
  useEffect(() => {
    try { const s = sessionStorage.getItem("mf_chat"); if (s) setMsgs(JSON.parse(s)); } catch {}
    ready.current = true;
    const t = setTimeout(() => { try { if (!sessionStorage.getItem("mf_teased")) setTeaser(true); } catch {} }, 5000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => { if (!ready.current) return; try { sessionStorage.setItem("mf_chat", JSON.stringify(msgs.filter((m) => !m.typing).map((m) => ({ ...m, anim: false })))); } catch {} }, [msgs]);
  useEffect(() => { const id = setInterval(() => box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }), 250); return () => clearInterval(id); }, [open]);
  function toggle(v: boolean) { setOpen(v); setTeaser(false); try { sessionStorage.setItem("mf_teased", "1"); } catch {} }
  async function search(q: string): Promise<Ad[]> { try { return (await (await fetch("/api/assistant/search?q=" + encodeURIComponent(q))).json()).ads ?? []; } catch { return []; } }
  async function ask(raw: string) {
    const q = raw.trim(); if (!q) return; setInput("");
    setMsgs((m) => [...m, { who: "u", text: q }, { who: "b", typing: true }]);
    const ql = q.toLowerCase(), hit = faqMatch(q), prod = wantsProd(q);
    const [ads] = await Promise.all([prod || !hit ? search(q) : Promise.resolve([] as Ad[]), new Promise((r) => setTimeout(r, 650))]);
    let reply: Msg = { who: "b", anim: true };
    if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(ql)) reply = { ...reply, text: "Hi! What can I help you with today?", chips: START };
    else if (/\b(thanks|thank you|thx)\b/.test(ql)) reply = { ...reply, text: "You’re welcome! Anything else I can help with?", chips: [START[0], "Safety tips for buyers"] };
    else if (/\b(human|agent|person|speak to)\b/.test(ql)) reply = { ...reply, text: "Of course. Our team is happy to help:", contact: true };
    else if (q === START[0]) reply = { ...reply, text: "Tell me what you’re looking for. You can add a place and a budget, for example “iPhone 13 in Lagos under 500k” or “plumber in Abuja”." };
    else if (ads.length && (prod || !hit)) reply = { ...reply, text: `I found ${ads.length} match${ads.length > 1 ? "es" : ""}:`, ads, chips: ["Safety tips for buyers"] };
    else if (hit) reply = { ...reply, faq: hit, chips: FAQ.filter((f) => f.s === hit.s && f.id !== hit.id).slice(0, 2).map((f) => f.q) };
    else reply = { ...reply, text: "I couldn’t find that. Try different words, add a place or a budget, or pick a topic:", chips: START.slice(1, 4), contact: true };
    setMsgs((m) => [...m.filter((x) => !x.typing), reply]);
  }
  function rate(i: number, v: "up" | "down") {
    setMsgs((m) => { const n = m.map((x, j) => (j === i ? { ...x, fb: v } : x)); return v === "down" ? [...n, { who: "b" as const, anim: true, text: "Sorry about that. Our team can help:", contact: true }] : n; });
  }
  return (<>
    {teaser && !open && <button className="teaser" onClick={() => toggle(true)}>👋 Need help finding something?</button>}
    <button id="chatbtn" onClick={() => toggle(!open)} aria-label="Open help assistant">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>Ask Mifask</button>
    <section id="chat" className={open ? "open" : ""} role="dialog" aria-label="Mifask assistant">
      <div className="ch"><div className="who"><div className="av2">M<i /></div><div><b>Mifask Assistant</b><small>Online · replies instantly</small></div></div>
        <span><a className="btn sm alt" href="/help">FAQ</a> <button className="btn sm alt" onClick={() => toggle(false)} aria-label="Close">✕</button></span></div>
      <div className="msgs" ref={box}>{msgs.map((m, i) => (
        <div key={i} className={"m " + m.who}>{m.typing ? <span className="typing"><i /><i /><i /></span> : (<>
          {m.faq && <><b>{m.faq.q}</b>{"\n"}<Typed text={m.faq.a} anim={m.anim} open={open} /></>}
          {m.text && (m.who === "b" ? <Typed text={m.text} anim={m.anim} open={open} /> : m.text)}
          {m.ads?.map((a, k) => <a key={a.id} className="prod" style={{ animationDelay: `${300 + k * 110}ms` }} href={`/ads/${a.id}`}>
            {a.images?.[0] ? <img src={a.images[0]} alt="" /> : <span className="th">📦</span>}<span className="pt"><b>{a.title}</b><small>{a.state}</small></span><b>{naira(a.price)}</b></a>)}
          {m.faq && <div className="fb">{m.fb ? (m.fb === "up" ? "Glad that helped!" : "Thanks for telling us.") : <>Was this helpful?<button onClick={() => rate(i, "up")} aria-label="Helpful">👍</button><button onClick={() => rate(i, "down")} aria-label="Not helpful">👎</button></>}</div>}
          {(m.faq || m.chips || m.contact) && <div className="chips">
            {m.faq && <a href={`/help#${m.faq.id}`}>Open in FAQ</a>}
            {m.chips?.map((c) => <button key={c} onClick={() => ask(c)}>{c}</button>)}
            {m.contact && <><a href="mailto:mifask@proton.me">Email support</a><a href="https://wa.me/2348121483131" target="_blank" rel="noreferrer">WhatsApp 0812 148 3131</a></>}</div>}</>)}</div>))}</div>
      <div className="qr">{QUICK.map(([l, q]) => <button key={l} onClick={() => ask(q)}>{l}</button>)}</div>
      <form className="cin" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Try: iPhone under 300k in Lagos" autoComplete="off" aria-label="Message" /><button className="btn sm">Send</button></form>
    </section></>);
}
