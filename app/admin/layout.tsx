import { adminGuard } from "@/lib/admin";
import AdminTabs from "@/components/AdminTabs";
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isSuper } = await adminGuard();
  return (<><h2 style={{ marginTop: 18, marginBottom: 0 }}>{isSuper ? "Super admin" : "Admin"}</h2><AdminTabs isSuper={isSuper} />{children}</>);
}
