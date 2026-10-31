import Link from "next/link";
import { revalidatePath } from "next/cache";
import { adminGuard } from "@/lib/admin";
import { naira } from "@/lib/constants";
import Flash from "@/components/Flash";
export const dynamic = "force-dynamic";
async function removeAd(fd: FormData) { "use server"; const { s } = await adminGuard(); await s.from("ads").delete().eq("id", String(fd.get("id"))); revalidatePath("/admin/ads"); }
export default async function AdsPage({ searchParams }: { searchParams: { q?: string; e?: string; m?: string } }) {
  const { s } = await adminGuard(); const q = (searchParams.q ?? "").trim().replace(/[%,]/g, "");
  let query = s.from("ads").select("id, title, price, state, sold, created_at, seller_id, profiles(name)").order("created_at", { ascending: false }).limit(60);
  if (q) query = query.ilike("title", `%${q}%`);
  const { data } = await query;
  return (<>
    <Flash e={searchParams.e} m={searchParams.m} />
    <h3 style={{ margin: "6px 0 10px" }}>Ads</h3>
    <form style={{ display: "flex", gap: 8, marginBottom: 12 }}><input className="f" style={{ flex: 1, margin: 0 }} name="q" defaultValue={q} placeholder="Search ads by title" /><button className="btn">Search</button></form>
    {data?.map((a: any) => (<div key={a.id} className="li"><div style={{ flex: 1, minWidth: 180 }}><b>{a.title}</b>{a.sold && <span className="badge n"> sold</span>}<div className="meta">{naira(a.price)} · {a.state} · by <Link href={`/admin/users/${a.seller_id}`} style={{ textDecoration: "underline" }}>{a.profiles?.name ?? "user"}</Link></div></div>
      <Link className="btn sm alt" href={`/ads/${a.id}`}>View</Link><form action={removeAd}><input type="hidden" name="id" value={a.id} /><button className="btn sm">Remove</button></form></div>))}
    {!data?.length && <p className="meta">No ads found.</p>}
  </>);
}
