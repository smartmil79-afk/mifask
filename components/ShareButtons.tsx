"use client";
import { useEffect, useState } from "react";
export default function ShareButtons({ path, title, price }: { path: string; title: string; price: string }) {
  const [copied, setCopied] = useState(false); const [canShare, setCanShare] = useState(false); const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"); }, []);
  const url = origin + path;
  const text = `${title} - ${price} on Mifask`;
  const u = encodeURIComponent(url), t = encodeURIComponent(text);
  const links: [string, string, string][] = [
    ["WhatsApp", `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "#1fa855"],
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`, "#1877f2"],
    ["Telegram", `https://t.me/share/url?url=${u}&text=${t}`, "#229ed9"],
    ["X", `https://twitter.com/intent/tweet?text=${t}&url=${u}`, "#14141a"],
    ["Email", `mailto:?subject=${t}&body=${encodeURIComponent(text + "\n" + url)}`, "#6b7a70"],
  ];
  async function copy() {
    try { await navigator.clipboard.writeText(url); }
    catch { const i = document.createElement("input"); i.value = url; document.body.appendChild(i); i.select(); document.execCommand("copy"); i.remove(); }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  async function more() { try { await navigator.share({ title, text, url }); } catch {} }
  return (
    <div className="pass">
      <b>Share this ad</b>
      <div className="passrow">
        {links.map(([n, h, c]) => <a key={n} href={h} target="_blank" rel="noopener noreferrer" className="pbtn" style={{ background: c }}>{n}</a>)}
        {canShare && <button type="button" className="pbtn" style={{ background: "#7a4fd1" }} onClick={more}>Instagram, TikTok, Snapchat…</button>}
        <button type="button" className="pbtn" style={{ background: "#244b37" }} onClick={copy}>{copied ? "Link copied ✓" : "Copy link"}</button>
      </div>
      <p className="meta" style={{ margin: "8px 0 0" }}>Instagram, TikTok and Snapchat do not let websites post links for you. On your phone, tap the purple button and choose the app. On a computer, copy the link and paste it into your post or story.</p>
    </div>
  );
}
