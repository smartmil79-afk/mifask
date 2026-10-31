import { revalidatePath } from "next/cache";
import { superGuard } from "@/lib/admin";
import { naira } from "@/lib/constants";
export const dynamic = "force-dynamic";
async function reviewPay(fd: FormData) { "use server"; const { s } = await superGuard(); await s.rpc("review_manual_payment", { p_id: String(fd.get("id")), p_ok: fd.get("ok") === "1" }); revalidatePath("/admin/payments"); }
async function settle(fd: FormData) { "use server"; const { s } = await superGuard(); await s.rpc("close_order", { p_order: String(fd.get("id")), p_release: fd.get("release") === "1" }); revalidatePath("/admin/payments"); }
export default async function Payments() {
  const { s } = await superGuard();
  const { data: mps } = await s.from("manual_payments").select("*").eq("status", "pending").order("created_at");
  const receipts = await Promise.all((mps ?? []).map(async (m: any) => ({ ...m, url: (await s.storage.from("receipts").createSignedUrl(m.receipt_path, 3600)).data?.signedUrl })));
  const { data: held } = await s.from("orders").select("*").eq("status", "held").order("created_at");
  return (<>
    <h3 style={{ margin: "6px 0 10px" }}>Payment receipts to confirm · {receipts.length}</h3>
    <p className="meta">Approve ONLY after you see the money in your bank account. A receipt image alone can be faked. Check the amount and the transaction ID.</p>
    {receipts.map((m: any) => (<div key={m.id} className="li"><div style={{ flex: 1, minWidth: 220 }}><b>{naira(m.amount)}</b> · {m.kind === "promo" ? `Sponsor "${m.ad_title ?? "ad"}" (${m.plan})` : "Wallet top-up"}
      <div className="meta">Transaction ID: <b>{m.reference}</b> · {new Date(m.created_at).toLocaleString("en-NG")}</div></div>
      {m.url && <a className="btn sm alt" href={m.url} target="_blank" rel="noreferrer">View receipt</a>}
      <form action={reviewPay}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="ok" value="1" /><button className="btn sm">Money received, approve</button></form>
      <form action={reviewPay}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="ok" value="0" /><button className="btn sm alt">Reject</button></form></div>))}
    {!receipts.length && <p className="meta">No receipts waiting.</p>}
    <h3 id="held">Held payments (disputes) · {held?.length ?? 0}</h3>
    {held?.map((o: any) => (<div key={o.id} className="li"><div style={{ flex: 1, minWidth: 180 }}><b>{o.ad_title}</b><div className="meta">{naira(o.amount)} · {new Date(o.created_at).toLocaleDateString("en-NG")}</div></div>
      <form action={settle}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="release" value="1" /><button className="btn sm">Pay seller</button></form>
      <form action={settle}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="release" value="0" /><button className="btn sm alt">Refund buyer</button></form></div>))}
    {!held?.length && <p className="meta">No held payments.</p>}</>);
}
