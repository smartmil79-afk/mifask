"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { CATS, STATES, CAT_FIELD } from "@/lib/constants";
async function shrink(f: File): Promise<Blob> {
  const b = await createImageBitmap(f), W = 1200, H = 900, k = Math.max(W / b.width, H / b.height);
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  c.getContext("2d")!.drawImage(b, (W - b.width * k) / 2, (H - b.height * k) / 2, b.width * k, b.height * k);
  return new Promise((r) => c.toBlob((x) => r(x!), "image/jpeg", 0.82));
}
export default function Post() {
  const [cat, setCat] = useState<string>(CATS[0]); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr("");
    const sb = supabaseBrowser(); const { data: { user } } = await sb.auth.getUser();
    if (!user) { location.href = "/login"; return; }
    const fd = new FormData(e.currentTarget); const images: string[] = [];
    for (const f of (fd.getAll("photos") as File[]).filter((f) => f.size).slice(0, 3)) {
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error } = await sb.storage.from("ad-images").upload(path, await shrink(f), { contentType: "image/jpeg" });
      if (error) { setErr(error.message); setBusy(false); return; }
      images.push(sb.storage.from("ad-images").getPublicUrl(path).data.publicUrl);
    }
    const { error } = await sb.from("ads").insert({ seller_id: user.id, title: fd.get("title"), category: fd.get("category"), state: fd.get("state"),
      price: Number(fd.get("price")), condition: fd.get("condition"), description: fd.get("description"), phone: fd.get("phone"), images });
    if (error) { setErr(error.message); setBusy(false); } else location.href = "/dashboard";
  }
  return (<form className="box" onSubmit={submit}><h2>Post a free ad</h2>
    <input className="f" name="title" required maxLength={70} placeholder="Title" />
    <select className="f" name="category" value={cat} onChange={(e) => setCat(e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
    <select className="f" name="state">{STATES.map((c) => <option key={c}>{c}</option>)}</select>
    <input className="f" name="price" type="number" min={0} required placeholder="Price (₦)" />
    {CAT_FIELD[cat]?.options ? (<><label className="meta">{CAT_FIELD[cat].label}</label><select className="f" name="condition">{CAT_FIELD[cat].options!.map((o) => <option key={o}>{o}</option>)}</select></>)
      : CAT_FIELD[cat] ? (<><label className="meta">{CAT_FIELD[cat].label}</label><input className="f" name="condition" required maxLength={80} placeholder={CAT_FIELD[cat].placeholder} /></>)
      : <select className="f" name="condition"><option>Brand new</option><option>Used</option></select>}
    <textarea className="f" name="description" rows={3} required placeholder="Description" />
    <input className="f" name="phone" type="tel" required placeholder="Phone number" />
    <label className="meta">Photos (up to 3)</label><input className="f" name="photos" type="file" accept="image/*" multiple />
    <button className="btn" disabled={busy}>{busy ? "Publishing…" : "Publish ad"}</button>{err && <p style={{ color: "crimson" }}>{err}</p>}</form>);
}
