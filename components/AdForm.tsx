"use client";
import { saveListing } from "@/lib/listing-actions";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { CATS, STATES, CAT_FIELD } from "@/lib/constants";
type Initial = { id: string; title: string; category: string; state: string; price: number; condition: string; description: string; phone: string; images: string[] };
const MAX = 3;
const defaultCond = (c: string) => CAT_FIELD[c]?.options?.[0] ?? (CAT_FIELD[c] ? "" : "Brand new");
const photoOptional = (c: string) => c === "Jobs" || c === "Services";
async function shrink(f: File): Promise<Blob> {
  const b = await createImageBitmap(f), W = 1200, H = 900, k = Math.max(W / b.width, H / b.height);
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  c.getContext("2d")!.drawImage(b, (W - b.width * k) / 2, (H - b.height * k) / 2, b.width * k, b.height * k);
  return new Promise((r, j) => c.toBlob((x) => (x ? r(x) : j(new Error("blob"))), "image/jpeg", 0.82));
}
const timeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<T>((_, j) => setTimeout(() => j(new Error("This is taking too long. Check your internet and try again.")), ms))]);
export default function AdForm({ ad }: { ad?: Initial }) {
  const editing = !!ad;
  const [cat, setCat] = useState(ad?.category ?? CATS[0]); const [title, setTitle] = useState(ad?.title ?? ""); const [state, setState] = useState(ad?.state ?? STATES[0]);
  const [price, setPrice] = useState(ad ? String(ad.price) : ""); const [cond, setCond] = useState(ad?.condition ?? defaultCond(CATS[0]));
  const [desc, setDesc] = useState(ad?.description ?? ""); const [phone, setPhone] = useState(ad?.phone ?? "");
  const [existing, setExisting] = useState<string[]>(ad?.images ?? []); const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false); const [step, setStep] = useState(""); const [err, setErr] = useState("");
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);
  const field = CAT_FIELD[cat];
  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/")); e.target.value = "";
    setFiles((cur) => [...cur, ...list].slice(0, MAX - existing.length));
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      if (!photoOptional(cat) && existing.length + files.length === 0) throw new Error("Please add at least one photo of your item. Real photos sell faster.");
      setStep("Checking your account…");
      const sb = supabaseBrowser(); const { data: { user } } = await sb.auth.getUser();
      if (!user) { location.href = "/login"; return; }
      setStep(files.length ? "Uploading photos…" : "Saving…");
      const uploaded = await timeout(Promise.all(files.map(async (f) => {
        let blob: Blob; try { blob = await shrink(f); } catch { throw new Error("One of your photos could not be read. Please use a JPG or PNG photo."); }
        const path = `${user.id}/${crypto.randomUUID()}.jpg`;
        const up = await sb.storage.from("listing-photos").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw new Error(up.error.message);
        return sb.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
      })), 60000);
      setStep("Saving…");
      const row = { title: title.trim(), category: cat, state, price: Number(price), condition: cond, description: desc.trim(), phone: phone.trim(), images: [...existing, ...uploaded] };
   const res = await timeout(saveListing({ id: ad?.id, ...row }), 30000);
     if (res.error || !res.id) throw new Error(res.error ?? "Could not save.");
     location.href = `/ads/${res.id}?${editing ? "updated" : "posted"}=1`;
    } 
catch (x) { setErr(x instanceof Error ? x.message : "Could not save. Please try again."); setBusy(false); setStep(""); }
  }
  return (<form className="box" style={{ maxWidth: 640 }} onSubmit={submit}><h2 style={{ marginTop: 0 }}>{editing ? "Edit your ad" : "Post a free ad"}</h2>
    <label className="meta">Photos ({existing.length + files.length}/{MAX}){photoOptional(cat) ? " · optional" : " · at least 1"}</label>
    <div className="thumbs">
      {existing.map((u) => <div key={u} className="thumb"><img src={u} alt="" /><button type="button" aria-label="Remove photo" onClick={() => setExisting(existing.filter((x) => x !== u))}>✕</button></div>)}
      {previews.map((u, i) => <div key={u} className="thumb"><img src={u} alt="" /><button type="button" aria-label="Remove photo" onClick={() => setFiles(files.filter((_, j) => j !== i))}>✕</button></div>)}
      {existing.length + files.length < MAX && <label className="thumb add">＋<br />Add photo<input type="file" accept="image/*" multiple hidden onChange={pick} /></label>}
    </div>
    <input className="f" required maxLength={70} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
    <select className="f" value={cat} onChange={(e) => { setCat(e.target.value); setCond(defaultCond(e.target.value)); }}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
    <select className="f" value={state} onChange={(e) => setState(e.target.value)}>{STATES.map((c) => <option key={c}>{c}</option>)}</select>
    <input className="f" type="number" min={0} required placeholder="Price (₦)" value={price} onChange={(e) => setPrice(e.target.value)} />
    {field?.options ? (<><label className="meta">{field.label}</label><select className="f" value={cond} onChange={(e) => setCond(e.target.value)}>{field.options.map((o) => <option key={o}>{o}</option>)}</select></>)
      : field ? (<><label className="meta">{field.label}</label><input className="f" required maxLength={80} placeholder={field.placeholder} value={cond} onChange={(e) => setCond(e.target.value)} /></>)
      : <select className="f" value={cond} onChange={(e) => setCond(e.target.value)}><option>Brand new</option><option>Used</option></select>}
    <textarea className="f" rows={4} required placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
    <input className="f" type="tel" required placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
    <button className="btn" disabled={busy}>{busy ? step || "Saving…" : editing ? "Save changes" : "Publish ad"}</button>
    {err && <p className="err" role="alert">{err}</p>}</form>);
}
