import type { FasePeriode } from "./evaluasi";

export const LANGKAH = [
  { id: "jadwal", label: "Jadwal" },
  { id: "pengisian", label: "Pengisian" },
  { id: "pemeriksaan", label: "Pemeriksaan" },
  { id: "penutupan", label: "Penutupan" },
  { id: "finalisasi", label: "Finalisasi & Rekap" },
] as const;
export type Langkah = typeof LANGKAH[number]["id"];
export const LABEL_FASE: Record<FasePeriode, string> = {
  NONAKTIF: "Nonaktif", BELUM_DIBUKA: "Belum dibuka", BERLANGSUNG: "Berlangsung",
  TENGGAT_LEWAT: "Tenggat lewat", DITUTUP: "Ditutup", FINAL: "Final",
};
export interface PeriodeRuangKerja {
  id: string; label: string; waktu_mulai: string | null; deadline: string;
  is_active: boolean; created_at: string; updated_at: string | null;
  tahun_akademik: number; semester: string; jumlah_laporan: number;
  ditutup_at: string | null; difinalisasi_at: string | null;
  fase: FasePeriode; sisaHari: number;
  ringkasan: { wajibIsi: number; terkirim: number; belumDipindai: number; perluDitinjau: number; tidakLolos: number };
}
export function langkahBawaan(p: Pick<PeriodeRuangKerja, "fase" | "ringkasan">): Langkah {
  if (p.fase === "BERLANGSUNG") return "pengisian";
  if (p.fase === "TENGGAT_LEWAT") return "penutupan";
  if (p.fase === "FINAL") return "finalisasi";
  if (p.fase === "DITUTUP") return p.ringkasan.perluDitinjau ? "pemeriksaan" : "finalisasi";
  return "jadwal";
}
export function pilihLangkah(value: string | undefined, p: PeriodeRuangKerja): Langkah {
  return LANGKAH.find((l) => l.id === value)?.id ?? langkahBawaan(p);
}
export function tindakanPeriode(p: PeriodeRuangKerja): string {
  if (p.fase === "BERLANGSUNG") return `${p.ringkasan.terkirim}/${p.ringkasan.wajibIsi} mengirim · sisa ${Math.max(0, p.sisaHari)} hari`;
  if (p.fase === "TENGGAT_LEWAT") return "Tenggat lewat — belum ditutup";
  if (p.fase === "DITUTUP") return p.ringkasan.perluDitinjau ? `${p.ringkasan.perluDitinjau} laporan perlu ditinjau` : "Siap difinalkan";
  if (p.fase === "FINAL") return "Evaluasi final — hasil terkunci";
  return p.fase === "NONAKTIF" ? "Periode nonaktif — periksa jadwal" : "Pengisian belum dibuka — periksa jadwal";
}
export function statusLangkah(p: PeriodeRuangKerja) {
  const r = p.ringkasan;
  return [
    { selesai: !!p.waktu_mulai, ringkas: p.waktu_mulai ? "Jadwal tersedia" : "Waktu mulai belum diatur" },
    { selesai: !!p.ditutup_at, ringkas: `${r.terkirim} / ${r.wajibIsi} mengirim` },
    { selesai: r.perluDitinjau === 0, ringkas: `${r.belumDipindai} belum dipindai · ${r.perluDitinjau} perlu ditinjau` },
    { selesai: !!p.ditutup_at, ringkas: p.ditutup_at ? "Periode ditutup" : "Terbuka setelah tenggat" },
    { selesai: !!p.difinalisasi_at, ringkas: `${r.tidakLolos} tidak lolos` },
  ];
}
export const tanggalWib = (iso: string) => new Date(iso).toLocaleString("id-ID", {
  timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
});

/** Singkatkan label lama tanpa mengubah label yang tersimpan di database. */
export function judulPeriode(p: { label: string }) {
  return p.label.replace(/^Monev KIP-K Undip Semester\s+/i, "");
}
export function urlPeriode(id: string, langkah?: Langkah, contoh = false, filter?: string) {
  const params = new URLSearchParams();
  if (langkah) params.set("langkah", langkah);
  if (contoh) params.set("demo", "1");
  if (filter) params.set("filter", filter);
  return `/admin/monev/${encodeURIComponent(id)}${params.size ? `?${params}` : ""}`;
}