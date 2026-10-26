"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { CATS, STATES, CAT_FIELD } from "@/lib/constants";
async function shrink(f: File): Promise<Blob> {
  const b = await createImageBitmap(f), W = 1200, H = 900, k = Math.max(W / b.width, H / b.height);
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  c.getContext("2d")!.drawImage(b, (W - b.width * k) / 2, (H - b.height * k) / 2, b.width * k, b.height * k);
  return new Promise((r, j) => c.toBlob((x) => (x ? r(x) : j(new Error("blob"))), "image/jpeg", 0.82));
}
const timeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<T>((_, j) => setTimeout(() => j(new Error("This is taking too long. Check your internet and try again.")), ms))]);
export default function Post() {
  const [cat, setCat] = useState<string>(CATS[0]); const [busy, setBusy] = useState(false); const [step, setStep] = useState(""); const [err, setErr] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; setErr(""); setBusy(true);
    try {
      setStep("Checking your account…");
      const sb = supabaseBrowser(); const { data: { user } } = await sb.auth.getUser();
      if (!user) { location.href = "/login"; return; }
      const fd = new FormData(form);
      const files = (fd.getAll("photos") as File[]).filter((f) => f.size).slice(0, 3);
      setStep(files.length ? "Uploading photos…" : "Publishing…");
      const images = await timeout(Promise.all(files.map(async (f) => {
        let blob: Blob; try { blob = await shrink(f); } catch { throw new Error("One of your photos could not be read. Please use a JPG or PNG photo."); }
        const path = `${user.id}/${crypto.randomUUID()}.jpg`;
        const up = await sb.storage.from("ad-images").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw new Error(up.error.message);
        return sb.storage.from("ad-images").getPublicUrl(path).data.publicUrl;
      })), 60000);
      setStep("Publishing…");
      const { data, error } = await timeout(Promise.resolve(sb.from("ads").insert({ seller_id: user.id, title: fd.get("title"), category: fd.get("category"), state: fd.get("state"),
        price: Number(fd.get("price")), condition: fd.get("condition"), description: fd.get("description"), phone: fd.get("phone"), images }).select("id").single()), 20000);
      if (error) throw new Error(/foreign key/i.test(error.message) ? "Your profile is not ready. Sign out, sign in again, or contact support." : error.message);
      setStep("Published! Opening your ad…");
      location.href = `/ads/${data.id}?posted=1`;
    } catch (x) { setErr(x instanceof Error ? x.message : "Could not publish. Please try again."); setBusy(false); setStep(""); }
  }
  return (<form className="box" onSubmit={submit}><h2 style={{ marginTop: 0 }}>Post a free ad</h2>
    <input className="f" name="title" required maxLength={70} placeholder="Title" />
    <select className="f" name="category" value={cat} onChange={(e) => setCat(e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
    <select className="f" name="state">{STATES.map((c) => <option key={c}>{c}</option>)}</select>
    <input className="f" name="price" type="number" min={0} required placeholder="Price (₦)" />
    {CAT_FIELD[cat]?.options ? (<><label className="meta">{CAT_FIELD[cat].label}</label><select className="f" key={cat} name="condition">{CAT_FIELD[cat].options!.map((o) => <option key={o}>{o}</option>)}</select></>)
      : CAT_FIELD[cat] ? (<><label className="meta">{CAT_FIELD[cat].label}</label><input className="f" key={cat} name="condition" required maxLength={80} placeholder={CAT_FIELD[cat].placeholder} /></>)
      : <select className="f" key={cat} name="condition"><option>Brand new</option><option>Used</option></select>}
    <textarea className="f" name="description" rows={3} required placeholder="Description" />
    <input className="f" name="phone" type="tel" required placeholder="Phone number" />
    <label className="meta">Photos (up to 3)</label><input className="f" name="photos" type="file" accept="image/*" multiple />
    <button className="btn" disabled={busy}>{busy ? step || "Publishing…" : "Publish ad"}</button>
    {err && <p className="err" role="alert">{err}</p>}</form>);
}
