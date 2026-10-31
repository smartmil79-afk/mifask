import { revalidatePath } from "next/cache";
import { superGuard } from "@/lib/admin";
import { naira } from "@/lib/constants";
export const dynamic = "force-dynamic";
async function payout(fd: FormData) { "use server"; const { s } = await superGuard(); await s.rpc("settle_withdrawal", { p_id: String(fd.get("id")), p_paid: fd.get("paid") === "1" }); revalidatePath("/admin/withdrawals"); }
export default async function Withdrawals() {
  const { s } = await superGuard();
  const { data } = await s.from("withdrawals").select("*").eq("status", "pending").order("created_at");
  return (<><h3 style={{ margin: "6px 0 10px" }}>Withdrawal requests · {data?.length ?? 0}</h3>
    <p className="meta">Send the money from your bank first, then tap Mark paid.</p>
    {data?.map((x: any) => (<div key={x.id} className="li"><div style={{ flex: 1, minWidth: 220 }}><b>{naira(x.amount - x.fee)}</b> <span className="meta">(request {naira(x.amount)}, fee {naira(x.fee)})</span><div className="meta">{x.bank} · {x.account_number} · {x.account_name}</div></div>
      <form action={payout}><input type="hidden" name="id" value={x.id} /><input type="hidden" name="paid" value="1" /><button className="btn sm">Mark paid</button></form>
      <form action={payout}><input type="hidden" name="id" value={x.id} /><input type="hidden" name="paid" value="0" /><button className="btn sm alt">Reject and refund</button></form></div>))}
    {!data?.length && <p className="meta">No pending withdrawals.</p>}</>);
}
