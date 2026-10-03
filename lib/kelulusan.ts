import { needsKuotaFiltering } from "@/lib/jalur";

export const LOLOS_VALUES = ["Diusulkan", "DIUSULKAN", "Lolos", "LOLOS"];

export function isLolosAkhir(
  jalurValue: string | null | undefined,
  hasilAkhir: string | null | undefined,
  statusFinal: string | null | undefined,
): boolean {
  if (!LOLOS_VALUES.includes(hasilAkhir ?? "")) return false;
  if (needsKuotaFiltering(jalurValue)) return statusFinal === "Lolos Kuota";
  return true;
}

export function isDitetapkanSk(statusSk: string | null | undefined): boolean {
  return statusSk === "Ditetapkan";
}
