"use client";
import { useEffect, useRef, useState } from "react";
import { FAQ, START } from "@/lib/faq";
import { faqMatch, wantsProd } from "@/lib/assistant";
import { naira } from "@/lib/constants";
type Ad = { id: string; title: string; price: number; state: string };
type Msg = { who: "b" | "u"; text?: string; faq?: (typeof FAQ)[number]; ads?: Ad[]; chips?: string[]; fallback?: boolean; typing?: boolean };
const HELLO: Msg = { who: "b", text: "Hi, I’m the Mifask assistant. I can help you find products and services, explain how things work, and share safety tips.", chips: START };
export default function ChatWidget() {
  const [open, setOpen] = useState(false); const [input, setInput] = useState(""); const [msgs, setMsgs] = useState<Msg[]>([HELLO]); const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [msgs, open]);
  async function search(q: string): Promise<Ad[]> { try { return (await (await fetch("/api/assistant/search?q=" + encodeURIComponent(q))).json()).ads ?? []; } catch { return []; } }
  async function ask(text: string) {
    const q = text.trim(); if (!q) return; setInput("");
    setMsgs((m) => [...m, { who: "u", text: q }, { who: "b", typing: true }]);
    const hit = faqMatch(q), prod = wantsProd(q);
    const [ads] = await Promise.all([prod || !hit ? search(q) : Promise.resolve([] as Ad[]), new Promise((r) => setTimeout(r, 550))]);
    let reply: Msg;
    if (/^(hi|hello|hey)\b/i.test(q)) reply = { who: "b", text: "Hi! What can I help you with?", chips: START };
    else if (q === START[0]) reply = { who: "b", text: "Tell me what you need, for example “iPhone 13 in Lagos” or “plumber in Abuja”." };
    else if (ads.length && (prod || !hit)) reply = { who: "b", text: "Here’s what I found:", ads, chips: ["Safety tips for buyers"] };
    else if (hit) reply = { who: "b", faq: hit, chips: FAQ.filter((f) => f.s === hit.s && f.id !== hit.id).slice(0, 2).map((f) => f.q) };
    else reply = { who: "b", text: "I couldn’t find that. Try different words, or pick a topic below. You can also reach a person.", chips: START.slice(1, 4), fallback: true };
    setMsgs((m) => [...m.filter((x) => !x.typing), reply]);
  }
  return (<>
    <button id="chatbtn" onClick={() => setOpen(!open)} aria-label="Open help assistant">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>Ask Mifask</button>
    <section id="chat" className={open ? "open" : ""} role="dialog" aria-label="Mifask assistant">
      <div className="ch"><b>Mifask Assistant</b><span><a className="btn sm alt" href="/help">FAQ</a> <button className="btn sm alt" onClick={() => setOpen(false)} aria-label="Close">✕</button></span></div>
      <div className="msgs" ref={box}>{msgs.map((m, i) => (
        <div key={i} className={"m " + m.who}>{m.typing ? <span className="typing"><i /><i /><i /></span> : (<>
          {m.faq && <><b>{m.faq.q}</b>{"\n"}{m.faq.a}</>}{m.text}
          {m.ads?.map((a) => <a key={a.id} className="prod" href={`/ads/${a.id}`}><span>{a.title}</span><b>{naira(a.price)}</b></a>)}
          {(m.faq || m.chips || m.fallback) && <div className="chips">
            {m.faq && <a href={`/help#${m.faq.id}`}>Open in FAQ</a>}
            {m.chips?.map((c) => <button key={c} onClick={() => ask(c)}>{c}</button>)}
            {m.fallback && <><a href="mailto:mifask@proton.me">Email support</a><a href="https://wa.me/2348121483131" target="_blank" rel="noreferrer">WhatsApp</a></>}</div>}</>)}</div>))}</div>
      <form className="cin" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about products, safety, payments…" autoComplete="off" aria-label="Message" /><button className="btn sm">Send</button></form>
    </section></>);
}
