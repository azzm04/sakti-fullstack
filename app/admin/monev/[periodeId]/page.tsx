import { notFound, redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth-server";
import { getPeriodeRuangKerja } from "@/lib/monev/ruang-kerja-data";
import { getMonevDashboard } from "@/lib/dashboard-monev/data";
import { getContohRuangKerja } from "@/lib/monev/contoh-ruang-kerja";
import { getLaporanEkonomi } from "@/lib/monev/laporan-ekonomi-data";
import RuangKerja from "@/components/admin/monev/ruang-kerja/RuangKerja";

export default async function PeriodePage({ params, searchParams }: {
  params: Promise<{ periodeId: string }>; searchParams: Promise<{ demo?: string; langkah?: string }>;
}) {
  await requireAdminRole();
  const [{ periodeId }, query] = await Promise.all([params, searchParams]);
  const contoh = process.env.NODE_ENV !== "production" && query.demo === "1";
  if (query.langkah === "pengisian") redirect(`/admin?tab=monev&demo=${contoh ? 1 : 0}&periode=${encodeURIComponent(periodeId)}`);
  const data = contoh ? getContohRuangKerja(periodeId) : null;
  const periods = data?.periods ?? await getPeriodeRuangKerja();
  const periode = periods.find((p) => p.id === periodeId);
  if (!periode) notFound();
  const [dashboard, laporan] = data ? [data.dashboard, data.laporan] : await Promise.all([
    getMonevDashboard(periodeId), getLaporanEkonomi(periodeId),
  ]);
  return <RuangKerja periode={periode} periods={periods.map(({ id, label }) => ({ id, label }))} dashboard={dashboard} laporan={laporan} />;
}
