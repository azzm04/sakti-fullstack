import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth-server";
import { urlPeriode } from "@/lib/monev/ruang-kerja";

export default async function PemeriksaanLama({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  await requireAdminRole();
  const { periode } = await searchParams;
  redirect(periode ? urlPeriode(periode, "pemeriksaan") : "/admin/monev");
}