"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ClipboardCheck, Eye, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { judulPeriode, urlPeriode, type PeriodeRuangKerja } from "@/lib/monev/ruang-kerja";
import { tombol } from "./ruang-kerja/tampilan";

export default function AksiPeriode({ periode: p, contoh }: { periode: PeriodeRuangKerja; contoh: boolean }) {
  const router = useRouter();
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  const terkunci = p.fase === "FINAL" || p.fase === "DITUTUP";
  const alasan = contoh ? "Penghapusan tidak tersedia pada data contoh."
    : terkunci ? "Periode yang sudah ditutup atau final tidak dapat dihapus."
    : p.jumlah_laporan > 0 ? "Tidak dapat dihapus karena sudah ada laporan masuk." : "";
  const sekunder = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  const ikon = "inline-flex size-9 pointer-coarse:size-11 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2";

  async function hapus() {
    if (alasan || sibuk) return;
    setSibuk(true);
    setGalat("");
    try {
      const response = await fetch(`/api/admin/monev/schedule/${encodeURIComponent(p.id)}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Periode gagal dihapus. Silakan coba lagi.");
      setKonfirmasi(false);
      router.refresh();
    } catch (error) {
      setGalat(error instanceof Error ? error.message : "Koneksi bermasalah. Silakan coba lagi.");
    } finally {
      setSibuk(false);
    }
  }

  return <>
    <div className="flex w-max items-center gap-1">
      {p.fase === "FINAL" && <span className="inline-flex size-7 items-center justify-center text-emerald-700" title="Sudah final"><Check size={17} strokeWidth={2} aria-hidden /><span className="sr-only">Sudah final</span></span>}
      <Link href={urlPeriode(p.id, p.fase === "FINAL" ? "finalisasi" : "pemeriksaan", contoh)} className={`${ikon} text-[#000352] hover:bg-[#EEF0F8]`} title={p.fase === "FINAL" ? "Lihat hasil" : "Proses evaluasi"} aria-label={`${p.fase === "FINAL" ? "Lihat hasil" : "Proses evaluasi"} ${judulPeriode(p)}`}>
        {p.fase === "FINAL" ? <Eye size={16} aria-hidden /> : <ClipboardCheck size={16} aria-hidden />}
      </Link>
      {!contoh && !terkunci && <Link href={urlPeriode(p.id, "jadwal", contoh)} className={`${ikon} text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#000352]`} title="Ubah jadwal" aria-label={`Ubah jadwal ${judulPeriode(p)}`}><Pencil size={16} aria-hidden /></Link>}
      {!alasan && <button type="button" title="Hapus periode" aria-label={`Hapus periode ${judulPeriode(p)}`} onClick={() => { setGalat(""); setKonfirmasi(true); }} className={`${ikon} text-red-600 hover:bg-red-50`}><Trash2 size={16} aria-hidden /></button>}
    </div>
    <Dialog open={konfirmasi} onOpenChange={(open) => { if (!sibuk) setKonfirmasi(open); }}>
      <DialogContent onEscapeKeyDown={(event) => { if (sibuk) event.preventDefault(); }} onPointerDownOutside={(event) => { if (sibuk) event.preventDefault(); }}>
        <DialogTitle>Hapus periode evaluasi?</DialogTitle>
        <DialogDescription>Periode {judulPeriode(p)} beserta riwayat jadwal dan log pengingatnya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</DialogDescription>
        {galat && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">{galat}</p>}
        <div className="mt-4 flex justify-end gap-3">
          <button type="button" disabled={sibuk} onClick={() => setKonfirmasi(false)} className={tombol}>Batal</button>
          <button type="button" disabled={sibuk} onClick={() => void hapus()} className={`${sekunder} border-red-700 bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-600`}><Trash2 size={15} aria-hidden />{sibuk ? "Menghapus…" : "Hapus periode"}</button>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
