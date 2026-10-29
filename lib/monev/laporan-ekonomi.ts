import type { Masukan, LaporanRow } from "../dashboard-monev/data";
import { hasilMahasiswa, keterangan, nilaiEfektif, perluDitinjau, statusWajibIsi, sudahDipindai, tandaLaporan, type HasilEvaluasi } from "./evaluasi";

export interface DokumenEkonomi { label: string; path: string }
export interface LaporanEkonomi {
  id: string; laporanId: string | null; nim: string; nama: string; prodi: string; fakultas: string;
  ayah: number; ibu: number; lain: number; pekerjaanAyah: string; pekerjaanIbu: string;
  total: number; anggota: number; perOrang: number | null; dikoreksi: boolean;
  hasil: HasilEvaluasi; keterangan: string; perluDitinjau: boolean; dipindai: boolean;
  tanda: string[]; dokumen: DokumenEkonomi[]; anggotaAi: number | null;
}
export type LaporanDenganDokumen = LaporanRow & {
  path_scan_kk?: string | null; path_bukti_penghasilan_ayah?: string | null;
  path_bukti_penghasilan_ibu?: string | null; path_bukti_penghasilan_lain?: string | null;
  path_bukti_pekerjaan_ayah?: string | null; path_bukti_pekerjaan_ibu?: string | null;
};
/** Roster yang sama dengan dashboard, termasuk mahasiswa wajib isi tanpa akun/laporan. */
export function susunLaporanEkonomi(
  sumber: Pick<Masukan, "periode" | "mundur"> & { penerima: (Masukan["penerima"][number] & { fakultas?: string })[]; laporan: LaporanDenganDokumen[] },
  periodeId: string,
): LaporanEkonomi[] {
  const periode = sumber.periode.find((p) => p.id === periodeId);
  if (!periode) return [];
  const laporan = new Map(sumber.laporan.filter((l) => l.periode_monev_id === periodeId).map((l) => [l.user_id, l]));
  const mundur = new Map(sumber.mundur.map((m) => [m.user_id, m.diputuskan_at ?? m.updated_at]));
  return sumber.penerima.filter((m) => statusWajibIsi(periode, m.angkatan, m.userId ? mundur.get(m.userId) ?? null : null) === "WAJIB").map((m) => {
    const l = m.userId ? laporan.get(m.userId) ?? null : null;
    const nilai = l ? nilaiEfektif(l) : { penghasilan: 0, anggota: 0, dikoreksi: false };
    const hasil = hasilMahasiswa(l, !!periode.ditutup_at);
    const dokumen: DokumenEkonomi[] = [];
    if (l) {
      for (const [label, path] of [
        ["Kartu keluarga", l.path_scan_kk], ["Penghasilan ayah", l.path_bukti_penghasilan_ayah],
        ["Penghasilan ibu", l.path_bukti_penghasilan_ibu], ["Penghasilan lain", l.path_bukti_penghasilan_lain],
        ["Pekerjaan ayah", l.path_bukti_pekerjaan_ayah], ["Pekerjaan ibu", l.path_bukti_pekerjaan_ibu],
      ]) if (path) dokumen.push({ label: label!, path });
    }
    return {
      id: m.nim, laporanId: l?.id ?? null, nim: m.nim, nama: m.nama, prodi: m.prodi, fakultas: m.fakultas || "—",
      ayah: Number(l?.penghasilan_ayah ?? 0), ibu: Number(l?.penghasilan_ibu ?? 0), lain: Number(l?.penghasilan_lain ?? 0),
      pekerjaanAyah: l?.pekerjaan_ayah ?? "—", pekerjaanIbu: l?.pekerjaan_ibu ?? "—",
      total: nilai.penghasilan, anggota: nilai.anggota, perOrang: nilai.anggota > 0 ? nilai.penghasilan / nilai.anggota : null,
      dikoreksi: nilai.dikoreksi, hasil: hasil.hasil, keterangan: keterangan(hasil.alasan),
      perluDitinjau: l ? perluDitinjau(l) : false, dipindai: l ? sudahDipindai(l) : false,
      tanda: l ? tandaLaporan(l) : [], dokumen, anggotaAi: l?.hasil_deteksi_yolo ?? null,
    };
  }).sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}
export const FILTER_LAPORAN = [
  { id: "semua", label: "Semua mahasiswa" }, { id: "sudah-mengisi", label: "Sudah mengirim" }, { id: "perlu-ditinjau", label: "Perlu ditinjau" },
  { id: "belum-mengisi", label: "Belum mengisi" }, { id: "belum-dipindai", label: "Belum dipindai" },
  { id: "tidak-lolos", label: "Tidak lolos" },
] as const;
export type FilterLaporan = typeof FILTER_LAPORAN[number]["id"];
export function cocokFilter(l: LaporanEkonomi, filter: string) {
  if (filter === "sudah-mengisi") return !!l.laporanId;
  if (filter === "perlu-ditinjau") return l.perluDitinjau;
  if (filter === "belum-mengisi") return !l.laporanId;
  if (filter === "belum-dipindai") return !!l.laporanId && !l.dipindai;
  if (filter === "tidak-lolos") return l.hasil === "TIDAK_LOLOS";
  return true;
}
