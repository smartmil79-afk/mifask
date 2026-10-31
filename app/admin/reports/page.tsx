import Link from "next/link";
import { revalidatePath } from "next/cache";
import { adminGuard } from "@/lib/admin";
export const dynamic = "force-dynamic";
async function removeAd(fd: FormData) { "use server"; const { s } = await adminGuard(); await s.from("ads").delete().eq("id", String(fd.get("id"))); revalidatePath("/admin/reports"); }
async function dismiss(fd: FormData) { "use server"; const { s } = await adminGuard(); await s.from("reports").delete().eq("id", String(fd.get("id"))); revalidatePath("/admin/reports"); }
export default async function Reports() {
  const { s } = await adminGuard();
  const { data } = await s.from("reports").select("id, reason, created_at, ads(id, title, seller_id, profiles(name))").order("created_at", { ascending: false });
  return (<><h3 style={{ margin: "6px 0 10px" }}>Reported ads</h3>
    {data?.length ? data.map((x: any) => (<div key={x.id} className="li"><div style={{ flex: 1, minWidth: 180 }}><b>{x.ads?.title ?? "(ad removed)"}</b><div className="meta">{x.reason} · {new Date(x.created_at).toLocaleDateString("en-NG")}{x.ads?.seller_id && <> · seller <Link href={`/admin/users/${x.ads.seller_id}`} style={{ textDecoration: "underline" }}>{x.ads.profiles?.name ?? "user"}</Link></>}</div></div>
      {x.ads && <Link className="btn sm alt" href={`/ads/${x.ads.id}`}>View</Link>}
      {x.ads && <form action={removeAd}><input type="hidden" name="id" value={x.ads.id} /><button className="btn sm">Remove ad</button></form>}
      <form action={dismiss}><input type="hidden" name="id" value={x.id} /><button className="btn sm alt">Dismiss</button></form></div>)) : <p className="meta">No reports. All clear.</p>}</>);
}
