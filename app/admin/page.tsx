import AdminDashboardContent from "@/components/admin/AdminDashboardContent";
import { getSelectionDashboard, getMonevDashboard } from "@/lib/admin-dashboard-data";
import { requireAdminRole } from "@/lib/auth-server";

export default async function AdminPage() {
  await requireAdminRole();
  const [selection, monev] = await Promise.allSettled([
    getSelectionDashboard(), getMonevDashboard(),
  ]);
  if (selection.status === "rejected") console.error("Selection dashboard unavailable", selection.reason);
  if (monev.status === "rejected") console.error("Monev dashboard unavailable", monev.reason);
  return <AdminDashboardContent
    selection={selection.status === "fulfilled" ? selection.value : null}
    monev={monev.status === "fulfilled" ? monev.value : null}
  />;
}
