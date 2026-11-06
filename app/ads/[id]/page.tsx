import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { naira, condText, PLACEHOLDER } from "@/lib/constants";
import Gallery from "@/components/Gallery";
import ReportButton from "@/components/ReportButton";
import ShareButtons from "@/components/ShareButtons";
import Avatar from "@/components/Avatar";
import JsonLd from "@/components/JsonLd";
import { siteUrl } from "@/lib/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data: ad } = await supabaseServer().from("ads").select("title, description, price, images").eq("id", params.id).single();
  if (!ad) return { title: "Ad not found" };
  return { title: ad.title, description: `${naira(ad.price)} - ${String(ad.description).slice(0, 140)}`, alternates: { canonical: `/ads/${params.id}` }, openGraph: { title: ad.title, url: `/ads/${params.id}`, type: "website", images: [ad.images?.[0] || "/og-default.png"] }, twitter: { card: "summary_large_image" } };
}
async function chat(fd: FormData) {
  "use server";
  const { data, error } = await supabaseServer().rpc("start_conversation", { p_ad: fd.get("id") as string });
  redirect(error || !data ? "/messages?e=" + encodeURIComponent(error?.message ?? "Could not start the chat") : `/messages/${data}`);
}
async function pay(fd: FormData) {
  "use server";
  const { error } = await supabaseServer().rpc("pay_for_ad", { p_ad: fd.get("id") as string });
  redirect(error ? "/wallet?e=" + encodeURIComponent(error.message) : "/wallet?paid=1");
}
export default async function AdPage({ params, searchParams }: { params: { id: string }; searchParams: { posted?: string; updated?: string } }) {
  const s = supabaseServer();
  const { data: ad } = await s.from("ads").select("*, profiles(name, first_name, business_name, avatar_url, account_type)").eq("id", params.id).single();
  if (!ad) notFound();
  await s.rpc("increment_views", { p_id: ad.id });
  const { data: { user } } = await s.auth.getUser();
  const { data: pr } = await s.from("promotions").select("plan").eq("ad_id", ad.id).eq("status", "paid").gt("ends_at", new Date().toISOString()).order("rank", { ascending: false }).limit(1);
  const plan = (pr ?? [])[0]?.plan as string | undefined;
  const sp = ad.profiles; const biz = sp?.account_type === "business" && sp?.business_name;
  const sname = biz ? sp.business_name : sp?.first_name || sp?.name || "Member";
  const wa = "https://wa.me/" + ad.phone.replace(/\D/g, "").replace(/^0/, "234") + "?text=" + encodeURIComponent(`Hi, is “${ad.title}” still available?`);
  const base = siteUrl();
  const product = { "@context": "https://schema.org", "@type": "Product", name: ad.title, description: String(ad.description).slice(0, 500), category: ad.category,
    image: ad.images?.length ? ad.images : [`${base}/og-default.png`], brand: { "@type": "Brand", name: sname },
    offers: { "@type": "Offer", url: `${base}/ads/${ad.id}`, priceCurrency: "NGN", price: Number(ad.price), availability: ad.sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      itemCondition: ad.condition === "Brand new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition", areaServed: ad.state, seller: { "@type": "Person", name: sname } } };
  return (<div className="box" style={{ maxWidth: 700 }}>
    <JsonLd data={product} />
    {searchParams.posted && <div className="note okbar">✓ Your ad is live! Buyers can now see it.</div>}
    {searchParams.updated && <div className="note okbar">✓ Your ad was updated.</div>}
    {ad.sold && <div className="soldbar">SOLD · This item is no longer available</div>}
    {user && user.id === ad.seller_id && <div style={{ marginBottom: 10 }}><a className="btn" href={`/ads/${ad.id}/edit`}>✏️ Edit this ad</a></div>}
    <Gallery images={ad.images || []} fallback={PLACEHOLDER[ad.category]} />
    {plan && <div style={{ marginTop: 10 }}><span className={`ribbon promo inline p-${plan}`}>★ {plan.toUpperCase()} SPONSORED AD</span></div>}
    <div className="price" style={{ fontSize: "1.6rem" }}>{naira(ad.price)}</div><h2 style={{ margin: "4px 0" }}>{ad.title}</h2>
    <div className="meta">{[ad.category, condText(ad.category, ad.condition), ad.state].filter(Boolean).join(" · ")} · {ad.views} views</div><p>{ad.description}</p>
    <div className="seller"><Avatar url={sp?.avatar_url} name={sname} size={42} /><div><b>{sname}</b> {biz && <span className="badge n">Business</span>}<div className="meta">Seller on Mifask</div></div></div>
    {!ad.sold && user && user.id !== ad.seller_id && (<form action={chat} style={{ margin: "10px 0 8px" }}><input type="hidden" name="id" value={ad.id} /><button className="btn">💬 Chat with seller</button></form>)}
    {!ad.sold && (user ? <div style={{ display: "flex", gap: 8 }}><span className="btn alt">{ad.phone}</span><a className="btn" href={wa}>WhatsApp</a></div> : <a className="btn" href="/login">Sign in to contact seller</a>)}
    {!ad.sold && user && user.id !== ad.seller_id && (<form action={pay} style={{ marginTop: 12 }}><input type="hidden" name="id" value={ad.id} />
      <button className="btn">Pay {naira(ad.price)} with wallet</button><p className="meta">Protected: your money is held until you confirm you received the item.</p></form>)}
    <ShareButtons path={`/ads/${ad.id}`} title={ad.title} price={naira(ad.price)} />
    {user && user.id !== ad.seller_id && <ReportButton adId={ad.id} userId={user.id} />}
  </div>);
}
