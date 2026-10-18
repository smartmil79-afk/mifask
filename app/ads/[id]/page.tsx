import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { naira, condText } from "@/lib/constants";
import Gallery from "@/components/Gallery";
import ReportButton from "@/components/ReportButton";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data: ad } = await supabaseServer().from("ads").select("title, description, price, images").eq("id", params.id).single();
  if (!ad) return { title: "Ad not found" };
  return { title: ad.title, description: `${naira(ad.price)} · ${String(ad.description).slice(0, 140)}`, openGraph: { title: ad.title, images: ad.images?.[0] ? [ad.images[0]] : [] } };
}
async function pay(fd: FormData) {
  "use server";
  const { error } = await supabaseServer().rpc("pay_for_ad", { p_ad: fd.get("id") as string });
  redirect(error ? "/wallet?e=" + encodeURIComponent(error.message) : "/wallet?paid=1");
}
export default async function AdPage({ params }: { params: { id: string } }) {
  const s = supabaseServer();
  const { data: ad } = await s.from("ads").select("*, profiles(name)").eq("id", params.id).single();
  if (!ad) notFound();
  await s.rpc("increment_views", { p_id: ad.id });
  const { data: { user } } = await s.auth.getUser();
  const wa = "https://wa.me/" + ad.phone.replace(/\D/g, "").replace(/^0/, "234") + "?text=" + encodeURIComponent(`Hi, is “${ad.title}” still available?`);
  return (<div className="box" style={{ maxWidth: 700 }}>
    <Gallery images={ad.images || []} />
    <div className="price" style={{ fontSize: "1.6rem" }}>{naira(ad.price)}</div><h2 style={{ margin: "4px 0" }}>{ad.title}</h2>
    <div className="meta">{[ad.category, condText(ad.category, ad.condition), ad.state].filter(Boolean).join(" · ")} · {ad.views} views</div><p>{ad.description}</p>
    <p className="meta">Seller: <b>{ad.profiles?.name || "Member"}</b></p>
    {user ? <div style={{ display: "flex", gap: 8 }}><span className="btn alt">{ad.phone}</span><a className="btn" href={wa}>WhatsApp</a></div> : <a className="btn" href="/login">Sign in to contact seller</a>}
    {ad.sold && <p><span className="badge">SOLD</span></p>}
    {user && user.id !== ad.seller_id && !ad.sold && (<form action={pay} style={{ marginTop: 12 }}><input type="hidden" name="id" value={ad.id} />
      <button className="btn">Pay {naira(ad.price)} with wallet</button><p className="meta">Protected: your money is held until you confirm you received the item.</p></form>)}
    {user && user.id !== ad.seller_id && <ReportButton adId={ad.id} userId={user.id} />}
  </div>);
}
