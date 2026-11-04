"use client";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { saveProfile } from "@/lib/profile-actions";
import Avatar from "@/components/Avatar";
type Init = { type: string; first: string; last: string; business: string; address: string; description: string; avatar: string };
async function crop(f: File): Promise<Blob> {
  const b = await createImageBitmap(f), S = 400, k = Math.max(S / b.width, S / b.height);
  const c = document.createElement("canvas"); c.width = S; c.height = S;
  c.getContext("2d")!.drawImage(b, (S - b.width * k) / 2, (S - b.height * k) / 2, b.width * k, b.height * k);
  return new Promise((r, j) => c.toBlob((x) => (x ? r(x) : j(new Error("blob"))), "image/jpeg", 0.85));
}
export default function ProfileForm({ init, userId }: { init: Init; userId: string }) {
  const [type, setType] = useState(init.type === "business" ? "business" : "personal"); const [first, setFirst] = useState(init.first); const [last, setLast] = useState(init.last);
  const [business, setBusiness] = useState(init.business); const [address, setAddress] = useState(init.address); const [description, setDescription] = useState(init.description);
  const [avatar, setAvatar] = useState(init.avatar); const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const shown = type === "business" && business ? business : first || "Me";
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      let url = avatar;
      if (file) {
        let blob: Blob; try { blob = await crop(file); } catch { throw new Error("That picture could not be read. Please use a JPG or PNG."); }
        const sb = supabaseBrowser(); const path = `${userId}/${crypto.randomUUID()}.jpg`;
        const up = await sb.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw new Error(up.error.message);
        url = sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }
      const res = await saveProfile({ type, first, last, business, address, description, avatar: url });
      if (res.error) throw new Error(res.error);
      location.href = "/dashboard?profile=1";
    } catch (x) { setErr(x instanceof Error ? x.message : "Could not save. Please try again."); setBusy(false); }
  }
  return (<form className="box" style={{ maxWidth: 640 }} onSubmit={submit}>
    <h2 style={{ marginTop: 0 }}>Your profile</h2>
    <div className="arow" style={{ marginBottom: 12 }}><Avatar url={preview || avatar} name={shown} size={84} />
      <div><label className="btn alt sm" style={{ cursor: "pointer" }}>{type === "business" ? "Upload logo" : "Upload picture"}<input type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
        {(avatar || file) && <button type="button" className="btn sm alt" style={{ marginLeft: 8 }} onClick={() => { setFile(null); setAvatar(""); }}>Remove</button>}
        <div className="meta" style={{ marginTop: 6 }}>Shown next to your name on every page.</div></div></div>
    <label className="meta">Account type</label>
    <div className="typepick"><button type="button" className={type === "personal" ? "on" : ""} onClick={() => setType("personal")}><b>Personal</b><span>Your first name is shown</span></button>
      <button type="button" className={type === "business" ? "on" : ""} onClick={() => setType("business")}><b>Business owner</b><span>Your company name is shown</span></button></div>
    <div className="row2"><input className="f" required placeholder="First name" value={first} onChange={(e) => setFirst(e.target.value)} maxLength={40} /><input className="f" placeholder="Last name" value={last} onChange={(e) => setLast(e.target.value)} maxLength={40} /></div>
    {type === "business" && (<><input className="f" required placeholder="Business / company name" value={business} onChange={(e) => setBusiness(e.target.value)} maxLength={80} />
      <input className="f" placeholder="Business address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} />
      <textarea className="f" rows={3} placeholder="What does your business sell or do?" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} /></>)}
    <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>{err && <p className="err" role="alert">{err}</p>}
  </form>);
}
