import Link from "next/link";
import { adminGuard } from "@/lib/admin";
import { naira } from "@/lib/constants";
export const dynamic = "force-dynamic";
export default async function Promotions() {
  const { s, isSuper } = await adminGuard();
  const { data } = await s.from("promotions").select("id, plan, amount, ends_at, ads(id, title)").eq("status", "paid").gt("ends_at", new Date().toISOString()).order("ends_at");
  const { data: all } = isSuper ? await s.from("promotions").select("amount").eq("status", "paid") : { data: [] as any[] };
  const revenue = (all ?? []).reduce((n: number, p: any) => n + Number(p.amount), 0);
  return (<><h3 style={{ margin: "6px 0 10px" }}>Active promotions · {data?.length ?? 0}</h3>
    {isSuper && <p className="meta">Total promotion revenue so far: <b>{naira(revenue)}</b></p>}
    {data?.map((p: any) => (<div key={p.id} className="li"><div style={{ flex: 1 }}><b>{p.ads?.title ?? "(ad removed)"}</b><div className="meta"><span className="badge">★ {p.plan}</span> until {new Date(p.ends_at).toLocaleDateString("en-NG")}{isSuper ? ` · ${naira(p.amount)}` : ""}</div></div>{p.ads && <Link className="btn sm alt" href={`/ads/${p.ads.id}`}>View</Link>}</div>))}
    {!data?.length && <p className="meta">No active promotions.</p>}</>);
}
