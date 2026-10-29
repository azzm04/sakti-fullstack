import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth-server";
import { getPeriodeRuangKerja } from "@/lib/monev/ruang-kerja-data";
import { getContohRuangKerja } from "@/lib/monev/contoh-ruang-kerja";
import { urlPeriode } from "@/lib/monev/ruang-kerja";
import DaftarPeriode from "@/components/admin/monev/DaftarPeriode";

export default async function AdminMonevPage({ searchParams }: {
  searchParams: Promise<{ tab?: string; periode?: string; buat?: string; demo?: string; tampilan?: string }>;
}) {
  await requireAdminRole();
  const params = await searchParams;
  const contoh = process.env.NODE_ENV !== "production" && params.demo === "1";
  if (params.tab === "hasil" && params.periode) redirect(urlPeriode(params.periode, "pemeriksaan", contoh));
  if (params.tab) redirect(`/admin/monev${contoh ? "?demo=1" : ""}`);
  if (params.buat === "1") return <DaftarPeriode periods={[]} buat />;
  const periods = contoh ? getContohRuangKerja().periods : await getPeriodeRuangKerja();
  return <DaftarPeriode periods={periods} buat={false} contoh={contoh} />;
}
