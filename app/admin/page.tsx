import AdminDashboardContent from "@/components/admin/AdminDashboardContent";
import { getSelectionDashboard } from "@/lib/admin-dashboard-data";
import { getMonevDashboard } from "@/lib/dashboard-monev/data";
import { getMonevDummy } from "@/lib/dashboard-monev/dummy";
import { requireAdminRole } from "@/lib/auth-server";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; periode?: string; demo?: string }> }) {
  const admin = await requireAdminRole();
  const params = await searchParams;
  // Di luar production, dashboard Monev memakai data contoh kecuali diminta `?demo=0`.
  // Production selalu memakai data asli.
  const demo = process.env.NODE_ENV !== "production" && params.demo !== "0";
  const [selection, monev] = await Promise.allSettled([
    getSelectionDashboard(), demo ? Promise.resolve(getMonevDummy(params.periode)) : getMonevDashboard(params.periode),
  ]);
  if (selection.status === "rejected") console.error("Selection dashboard unavailable", selection.reason);
  if (monev.status === "rejected") console.error("Monev dashboard unavailable", monev.reason);
  return <AdminDashboardContent
    initialTab={params.tab === "monev" ? "monev" : "seleksi"}
    namaAdmin={admin.nama || undefined}
    selection={selection.status === "fulfilled" ? selection.value : null}
    monev={monev.status === "fulfilled" ? monev.value : null}
  />;
}
