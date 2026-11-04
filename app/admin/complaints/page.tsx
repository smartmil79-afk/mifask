import { revalidatePath } from "next/cache";
import { adminGuard } from "@/lib/admin";
export const dynamic = "force-dynamic";
async function reply(fd: FormData) {
  "use server"; const { s } = await adminGuard();
  await s.rpc("respond_complaint", { p_id: String(fd.get("id")), p_response: String(fd.get("response") || ""), p_resolve: fd.get("resolve") === "1" });
  revalidatePath("/admin/complaints");
}
export default async function Complaints() {
  const { s } = await adminGuard();
  const { data } = await s.from("complaints").select("*, profiles(name)").order("created_at", { ascending: false }).limit(100);
  return (<><h3 style={{ margin: "6px 0 10px" }}>Complaints and support requests · {(data ?? []).filter((c: any) => c.status === "open").length} open</h3>
    {data?.map((c: any) => (<div key={c.id} className="box" style={{ maxWidth: "none", margin: "0 0 10px" }}>
      <b>{c.subject}</b> <span className={c.status === "open" ? "badge" : "badge n"}>{c.status}</span>
      <div className="meta">From {c.profiles?.name ?? "user"} · {new Date(c.created_at).toLocaleString("en-NG")}</div>
      <p style={{ whiteSpace: "pre-wrap" }}>{c.message}</p>
      {c.response && <p className="note">Your reply: {c.response}</p>}
      <form action={reply} className="form2"><input type="hidden" name="id" value={c.id} />
        <textarea className="f" style={{ margin: 0 }} name="response" rows={2} maxLength={1000} required placeholder="Write a reply. The user sees it on their dashboard." defaultValue={c.response ?? ""} />
        <div className="arow"><button className="btn sm" name="resolve" value="0">Reply</button><button className="btn sm alt" name="resolve" value="1">Reply and resolve</button></div></form></div>))}
    {!data?.length && <p className="meta">No complaints yet.</p>}</>);
}
