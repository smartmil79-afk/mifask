import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { naira, TOKEN_COST, PLANS, BANKS } from "@/lib/constants";
import ClaimButton from "@/components/ClaimButton";
export const dynamic = "force-dynamic";
async function close(fd: FormData) {
  "use server";
  const { error } = await supabaseServer().rpc("close_order", { p_order: fd.get("id") as string, p_release: fd.get("release") === "1" });
  redirect(error ? "/wallet?e=" + encodeURIComponent(error.message) : "/wallet");
}
async function saveBank(fd: FormData) {
  "use server";
  const s = supabaseServer(); const { data: { user } } = await s.auth.getUser(); if (!user) redirect("/login");
  const { error } = await s.from("bank_accounts").upsert({ user_id: user.id, bank: String(fd.get("bank")), account_number: String(fd.get("acct")).trim(), account_name: String(fd.get("name")).trim(), updated_at: new Date().toISOString() });
  redirect(error ? "/wallet?e=" + encodeURIComponent("Could not save. Account number must be 10 digits.") : "/wallet?m=" + encodeURIComponent("Bank details saved"));
}
async function withdraw(fd: FormData) {
  "use server";
  const { error } = await supabaseServer().rpc("request_withdrawal", { p_amount: Number(fd.get("amount")) });
  redirect(error ? "/wallet?e=" + encodeURIComponent(error.message) : "/wallet?m=" + encodeURIComponent("Withdrawal requested. We will pay within 24 hours."));
}
export default async function Wallet({ searchParams }: { searchParams: { e?: string; paid?: string; m?: string } }) {
  const s = supabaseServer(); const { data: { user } } = await s.auth.getUser(); if (!user) redirect("/login");
  const { data: w } = await s.from("wallets").select("*").eq("user_id", user.id).single();
  const { data: tx } = await s.from("wallet_tx").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
  const { data: orders } = await s.from("orders").select("*").order("created_at", { ascending: false }).limit(20);
  const { data: bank } = await s.from("bank_accounts").select("*").eq("user_id", user.id).maybeSingle();
  const { data: wd } = await s.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
  const { data: mp } = await s.from("manual_payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
  const claimed = w?.last_claim === today, streak = w?.streak ?? 0;
  const nextDay = claimed ? streak + 1 : (w?.last_claim && new Date(w.last_claim).getTime() >= Date.now() - 2 * 864e5 ? streak + 1 : 1);
  return (<>
    <h2 style={{ marginTop: 18 }}>My wallet</h2>
    {searchParams.e && <div className="note" style={{ color: "crimson" }}>{searchParams.e}</div>}
    {searchParams.m && <div className="note">{searchParams.m}</div>}
    {searchParams.paid && <div className="note">Payment held safely. Confirm below once you receive the item.</div>}
    <div className="wal">
      <div className="card dark"><div className="meta" style={{ color: "#d6dbee" }}>Wallet balance</div><div className="big">{naira(w?.balance ?? 0)}</div></div>
      <div className="card"><div className="meta">Tokens</div><div className="big">🪙 {w?.tokens ?? 0}</div><div className="meta">Streak: {streak} day{streak === 1 ? "" : "s"} · every 7th day gives +3 bonus</div></div>
    </div>
    <div className="box" style={{ maxWidth: "none" }}><h3 style={{ marginTop: 0 }}>Daily tokens</h3>
      <p className="meta">Claim 1 token every day (day {nextDay % 7 === 0 ? `${nextDay} pays 4` : `${nextDay} pays 1`}). Spend tokens on sponsored ads: {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((k) => `${PLANS[k].name} ${TOKEN_COST[k]}`).join(" · ")}.</p>
      <ClaimButton claimed={claimed} /></div>
    <div className="box" style={{ maxWidth: "none" }}><h3 style={{ marginTop: 0 }}>Add money</h3>
      <p className="meta">Send a bank transfer, upload your receipt, and we credit your wallet after we confirm the money.</p>
      <Link className="btn" href="/pay?kind=topup">Add money by bank transfer</Link>
      {mp?.map((x) => <div key={x.id} className="meta" style={{ marginTop: 8 }}>{new Date(x.created_at).toLocaleDateString("en-NG")} · {x.kind === "promo" ? `Promotion: ${x.ad_title ?? ""}` : "Wallet top-up"} · {naira(x.amount)} · <b>{x.status === "pending" ? "waiting for confirmation" : x.status}</b>{x.note ? ` (${x.note})` : ""}</div>)}
    </div>
    <div className="box" style={{ maxWidth: "none" }}><h3 style={{ marginTop: 0 }}>Withdraw to bank</h3>
      <form action={saveBank}>
        <input className="f" list="banks" name="bank" required placeholder="Bank" defaultValue={bank?.bank} />
        <datalist id="banks">{BANKS.map((b) => <option key={b} value={b} />)}</datalist>
        <input className="f" name="acct" required pattern="[0-9]{10}" placeholder="10-digit account number" defaultValue={bank?.account_number} />
        <input className="f" name="name" required placeholder="Account name" defaultValue={bank?.account_name} />
        <button className="btn alt">Save bank details</button></form>
      {bank && (<form action={withdraw} style={{ marginTop: 16 }}>
        <input className="f" name="amount" type="number" min={1000} max={w?.balance ?? 0} required placeholder="Amount (minimum ₦1,000)" />
        <button className="btn">Withdraw</button>
        <p className="meta">₦50 fee per withdrawal. Paid to {bank.account_name} within 24 hours.</p></form>)}
      {wd?.map((x) => <div key={x.id} className="meta" style={{ marginTop: 8 }}>{new Date(x.created_at).toLocaleDateString("en-NG")} · {naira(x.amount)} · <b>{x.status}</b>{x.note ? ` (${x.note})` : ""}</div>)}
    </div>
    <h3>Orders (payments held until confirmed)</h3>
    {orders?.length ? orders.map((o) => { const buyer = o.buyer_id === user.id; return (<div key={o.id} className="li">
      <div style={{ flex: 1, minWidth: 180 }}><b>{o.ad_title}</b><div className="meta">{naira(o.amount)} · {buyer ? "You paid" : "You sell"} · <b>{o.status}</b></div></div>
      {o.status === "held" && buyer && <form action={close}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="release" value="1" /><button className="btn sm">I received it, pay seller</button></form>}
      {o.status === "held" && !buyer && <form action={close}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="release" value="0" /><button className="btn sm alt">Refund buyer</button></form>}
    </div>); }) : <p className="meta">No orders yet. Open an ad and tap “Pay with wallet”.</p>}
    <h3>History</h3>
    {tx?.length ? tx.map((t) => (<div key={t.id} className="li"><div style={{ flex: 1 }}>{t.note}<div className="meta">{new Date(t.created_at).toLocaleString("en-NG")}</div></div>
      <b>{t.amount ? (t.amount > 0 ? "+" : "") + naira(t.amount) : ""}{t.tokens ? ` ${t.tokens > 0 ? "+" : ""}${t.tokens} 🪙` : ""}</b></div>)) : <p className="meta">Nothing yet.</p>}
    <p><Link href="/dashboard" className="meta">← Back to dashboard</Link></p>
  </>);
}
