"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  getOperationalStatus, utcIsoToWibInput, wibInputToUtcIso,
  addDaysToWibInput, addOneMonthToWibInput,
} from "@/lib/monev-schedule";
import { CalendarDays, ArrowRight, ChevronDown, Pencil, Clock3 } from "lucide-react";
import { kolom, panel, tombol, utama } from "./tampilan";
import { tanggalWib, type PeriodeRuangKerja } from "@/lib/monev/ruang-kerja";

const input = `${kolom} mt-2 !py-3.5 !text-base sm:!text-sm`;
const button = tombol;
interface Riwayat {
  id: string; tipe_perubahan: string; created_at: string; catatan: string | null;
  waktu_mulai_lama: string | null; waktu_mulai_baru: string | null;
  deadline_lama: string | null; deadline_baru: string | null;
  is_active_lama: boolean | null; is_active_baru: boolean | null;
  admin: { nama: string } | null;
}
async function fetchRiwayat(url: string): Promise<{ data: Riwayat[] }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal mengambil riwayat perubahan jadwal");
  return res.json();
}

export default function LangkahJadwal({ periode: p, contoh = false }: { periode?: PeriodeRuangKerja; contoh?: boolean }) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const status = p ? getOperationalStatus(p) : null;
  const deadlineOnly = status === "BERLANGSUNG" || status === "BERAKHIR" || status === "NONAKTIF_BERJALAN";
  const locked = !!p?.ditutup_at || !!p?.difinalisasi_at || contoh;
  const [editing, setEditing] = useState(!p);
  const nowWib = utcIsoToWibInput(new Date());
  const tahunBerjalan = Number(nowWib.slice(0, 4)) - (Number(nowWib.slice(5, 7)) < 8 ? 1 : 0);
  const [tahun, setTahun] = useState(String(p?.tahun_akademik ?? tahunBerjalan));
  const [semester, setSemester] = useState(p?.semester ?? (Number(nowWib.slice(5, 7)) < 8 ? "Genap" : "Gasal"));
  const [mulai, setMulai] = useState(utcIsoToWibInput(p?.waktu_mulai ?? null));
  const [deadline, setDeadline] = useState(() => p
    ? deadlineOnly && !locked ? addDaysToWibInput(status === "BERAKHIR" ? nowWib : utcIsoToWibInput(p.deadline), 7) : utcIsoToWibInput(p.deadline)
    : "");
  const [deadlineTouched, setDeadlineTouched] = useState(!!p);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [confirmation, setConfirmation] = useState<"hapus" | "aktif" | null>(null);
  const busy = saving || refreshing;
  const { data: riwayat, error: riwayatError, isLoading: loadingRiwayat, mutate } = useSWR(
    p && !contoh ? `/api/admin/monev/schedule/${p.id}/riwayat` : null, fetchRiwayat,
  );
  const title = !p ? "Buat periode Monev" : locked ? "Jadwal periode" : status === "BERAKHIR" ? "Buka kembali pengisian" : deadlineOnly ? "Perpanjang pengisian" : "Ubah jadwal";
  const refresh = () => startTransition(() => router.refresh());

  async function save(action: "simpan" | "aktif" | "hapus") {
    if (busy || locked) return;
    setSaving(true);
    setError("");
    setMessage("");
    setDuplicateId(null);
    setConflict(false);
    try {
      const body: Record<string, unknown> = {};
      // Endpoint lama memperlakukan updated_at null sebagai undefined.
      if (p?.updated_at) body.updated_at = p.updated_at;
      if (action === "aktif") body.is_active = !p?.is_active;
      else if (action === "simpan") {
        body.deadline = wibInputToUtcIso(deadline);
        if (!deadlineOnly) body.waktu_mulai = mulai ? wibInputToUtcIso(mulai) : null;
        if (!p) {
          body.tahun_akademik = Number(tahun);
          body.semester = semester;
        }
      }
      const res = await fetch(p ? `/api/admin/monev/schedule/${p.id}` : "/api/admin/monev/schedule", {
        method: action === "hapus" ? "DELETE" : p ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        ...(action !== "hapus" ? { body: JSON.stringify(body) } : {}),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Perubahan jadwal gagal disimpan.");
        setDuplicateId(json.existing_id ?? null);
        setConflict(res.status === 409 && !json.existing_id);
        setConfirmation(null);
        return;
      }
      setConfirmation(null);
      if (action === "hapus") {
        router.push("/admin/monev");
        refresh();
      } else if (!p) {
        router.push("/admin/monev");
        refresh();
      } else {
        setMessage("Perubahan jadwal berhasil disimpan.");
        setEditing(false);
        void mutate();
        refresh();
      }
    } catch {
      setConfirmation(null);
      setError("Tidak dapat menyimpan jadwal. Periksa koneksi dan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!p && (!/^\d{4}$/.test(tahun) || Number(tahun) < 2000 || Number(tahun) > 2200)) {
      setError("Masukkan tahun awal antara 2000 dan 2200.");
      return;
    }
    if (!deadlineOnly && !mulai) {
      setError("Isi tanggal dan waktu mulai pengisian.");
      return;
    }
    const batasUtc = wibInputToUtcIso(deadline);
    if (!batasUtc || new Date(batasUtc).getTime() <= Date.now()) {
      setError("Batas pengisian harus setelah waktu saat ini.");
      return;
    }
    if (!deadlineOnly && mulai && new Date(wibInputToUtcIso(mulai)!).getTime() >= new Date(batasUtc).getTime()) {
      setError("Batas pengisian harus setelah waktu mulai.");
      return;
    }
    if (deadlineOnly && p && new Date(batasUtc).getTime() <= new Date(p.deadline).getTime()) {
      setError("Batas pengisian baru harus lebih akhir dari batas sebelumnya.");
      return;
    }
    void save("simpan");
  }

  const pesanError = error && <div role="alert" className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-800"><p>{error}</p>{duplicateId && <Link className="inline-block underline" href={`/admin/monev/${encodeURIComponent(duplicateId)}?langkah=jadwal`}>Buka periode yang sudah tersedia</Link>}{conflict && <button type="button" onClick={refresh} className="underline">Muat ulang data terbaru</button>}</div>;

  const riwayatLabel: Record<string, string> = {
    JADWAL_BARU: "Periode dibuat", PERPANJANGAN: "Pengisian diperpanjang", BUKA_KEMBALI: "Pengisian dibuka kembali",
    UBAH_WAKTU_MULAI: "Waktu mulai diubah", UBAH_DEADLINE: "Batas pengisian diubah",
    AKTIFKAN: "Periode diaktifkan", NONAKTIFKAN: "Periode dinonaktifkan", TUTUP: "Periode ditutup", FINALISASI: "Evaluasi difinalkan",
  };
  return <div className="w-full">
    <div className="min-w-0 space-y-5">
      {p && <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4"><h2 className="text-[16px] font-semibold text-[#0F172A]">Jadwal pengisian</h2>{!locked && !editing && <button onClick={() => setEditing(true)} className={tombol}><Pencil size={13} />{deadlineOnly ? status === "BERAKHIR" ? "Buka kembali" : "Perpanjang" : "Ubah jadwal"}</button>}</div>
        <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto_1fr]"><div><p className="mb-2 flex items-center gap-1.5 text-[11px] text-[#64748B]"><CalendarDays size={14} />Mulai pengisian</p><p className="text-[14px] font-medium text-[#0F172A]">{p.waktu_mulai ? tanggalWib(p.waktu_mulai) : "Belum ditentukan"}</p></div><ArrowRight size={17} className="hidden self-center text-[#CBD5E1] sm:block" /><div><p className="mb-2 flex items-center gap-1.5 text-[11px] text-[#64748B]"><Clock3 size={14} />Batas pengisian</p><p className="text-[14px] font-medium text-[#0F172A]">{tanggalWib(p.deadline)}</p></div></div>
        <div className="flex flex-wrap justify-between gap-2 border-t border-[#E2E8F0] bg-[#FAFBFD] px-5 py-3 text-[11px] text-[#64748B]"><span>Semua waktu dalam WIB (UTC+7)</span><span>{p.jumlah_laporan} laporan sudah masuk</span></div>
      </section>}
      {locked && <p className="rounded-lg border border-[#E2E8F0] bg-white p-4 text-[12px] leading-6 text-[#64748B]">{contoh ? "Jadwal data contoh hanya untuk pratinjau. Gunakan periode asli untuk mengubah jadwal." : p?.difinalisasi_at ? "Evaluasi sudah final. Jadwal dan hasil periode ini terkunci." : "Periode sudah ditutup. Jadwal tidak dapat diubah sebelum pengisian dibuka kembali."}</p>}
      {editing && !locked && <section className={`${panel} overflow-hidden`}>
        <form onSubmit={submit} aria-label={p ? title : "Buat periode evaluasi"}>
          <fieldset disabled={busy} className="min-w-0">
            {!p && <section className="border-b border-[#E2E8F0] p-5 md:p-9" aria-labelledby="informasi-periode">
              <h2 id="informasi-periode" className="text-[18px] font-semibold leading-7 text-[#000352]">Periode akademik</h2>
              <p className="mt-1 text-[13px] leading-6 text-[#64748B]">Pilih tahun akademik dan semester yang akan dievaluasi.</p>
              <div className="mt-5 grid gap-6 md:grid-cols-2 md:gap-8">
                <div className="min-w-0"><label htmlFor="monev-tahun" className="text-[13px] font-medium text-[#334155]">Tahun awal akademik</label><input id="monev-tahun" type="text" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required value={tahun} onChange={(e) => setTahun(e.target.value)} aria-describedby="tahun-bantuan" placeholder="Contoh: 2026" className={input} /><p id="tahun-bantuan" className="mt-2 text-[12px] leading-5 text-[#64748B]">{/^\d{4}$/.test(tahun) && Number(tahun) >= 2000 && Number(tahun) <= 2200 ? `Tahun akademik ${tahun}/${Number(tahun) + 1}` : "Masukkan tahun awal, misalnya 2026 untuk 2026/2027."}</p></div>
                <label className="min-w-0 text-[13px] font-medium text-[#334155]">Semester<select aria-label="Semester" value={semester} onChange={(e) => setSemester(e.target.value)} className={input}><option>Gasal</option><option>Genap</option></select></label>
              </div>
            </section>}
            <section className="p-5 md:p-9" aria-labelledby="atur-jadwal">
              <h2 id="atur-jadwal" className="text-[18px] font-semibold leading-7 text-[#000352]">{p ? title : "Jadwal pengisian"}</h2>
              <p className="mt-1 text-[13px] leading-6 text-[#64748B]">{deadlineOnly ? "Perpanjang batas pengisian dalam WIB." : "Isi tanggal mulai dan batas pengisian monev."}</p>
              <div className={`mt-5 grid gap-6 md:gap-8 ${!deadlineOnly ? "md:grid-cols-2" : ""}`}>
                {!deadlineOnly && <div className="min-w-0"><label htmlFor="monev-mulai" className="text-[13px] font-medium text-[#334155]">Mulai pengisian</label><input id="monev-mulai" type="datetime-local" required value={mulai} onChange={(e) => { setMulai(e.target.value); if (!deadlineTouched) setDeadline(addOneMonthToWibInput(e.target.value)); }} className={input} /></div>}
                <div className="min-w-0"><label htmlFor="monev-deadline" className="text-[13px] font-medium text-[#334155]">{deadlineOnly ? "Batas pengisian baru" : "Batas pengisian"}</label><input id="monev-deadline" aria-describedby="deadline-bantuan" type="datetime-local" required value={deadline} onChange={(e) => { setDeadline(e.target.value); setDeadlineTouched(!!e.target.value); }} className={input} />
                  <p id="deadline-bantuan" className="mt-2 text-[12px] leading-5 text-[#64748B]">{deadlineOnly ? "Pilih waktu setelah batas sebelumnya." : "Terisi otomatis satu bulan setelah mulai. Bisa diubah."}</p>
                  {deadlineOnly && <button type="button" className="mt-2 inline-flex min-h-11 items-center text-[12px] text-[#000352] underline" onClick={() => setDeadline(addDaysToWibInput(status === "BERAKHIR" ? utcIsoToWibInput(new Date()) : utcIsoToWibInput(p!.deadline), 7))}>Tambah 7 hari dari {status === "BERAKHIR" ? "hari ini" : "batas saat ini"}</button>}
                </div>
              </div>
            </section>
            <div className="space-y-4 border-t border-[#E2E8F0] p-5 md:p-9">
              {pesanError}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] leading-5 text-[#64748B]">{}</p>
                <div className="flex shrink-0 flex-wrap gap-3">
                  {p ? <button type="button" className={tombol} onClick={() => { setEditing(false); setError(""); }}>Batal</button> : busy ? <button type="button" disabled className={tombol}>Batal</button> : <Link href="/admin/monev" className={tombol}>Batal</Link>}
                  <button type="submit" className={utama}>{busy ? "Menyimpan…" : !p ? "Buat periode" : deadlineOnly ? status === "BERAKHIR" ? "Buka kembali pengisian" : "Simpan perpanjangan" : "Simpan jadwal"}</button>
                </div>
              </div>
            </div>
          </fieldset>
        </form>
      </section>}
      {!editing && pesanError}
      {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[12px] text-emerald-800">{message}</p>}
      {p && !contoh && <details className={`${panel} group`}><summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[13px] font-medium text-[#0F172A]">Riwayat perubahan<span className="flex items-center gap-2 text-[11px] text-[#94A3B8]">{riwayat?.data.length ?? 0} perubahan<ChevronDown size={15} className="transition group-open:rotate-180" /></span></summary><div className="border-t border-[#E2E8F0] px-5">
        {loadingRiwayat && <p className="py-4 text-[12px] text-[#64748B]" role="status">Memuat riwayat…</p>}
        {riwayatError && <p role="alert" className="py-4 text-[12px] text-red-700">Riwayat gagal dimuat. <button onClick={() => void mutate()} className="underline">Coba lagi</button></p>}
        {riwayat && (riwayat.data.length ? <ol className="divide-y divide-[#EDF0F4]">{riwayat.data.map((r) => <li key={r.id} className="space-y-1.5 py-4 text-[12px]"><p className="font-medium text-[#0F172A]">{riwayatLabel[r.tipe_perubahan] ?? "Jadwal diperbarui"}</p><p className="text-[11px] text-[#94A3B8]">{tanggalWib(r.created_at)} WIB · {r.admin?.nama ?? "Sistem"}</p>{r.deadline_lama !== r.deadline_baru && r.deadline_baru && <p className="text-[#64748B]">Batas pengisian: {r.deadline_lama ? tanggalWib(r.deadline_lama) + " → " : ""}{tanggalWib(r.deadline_baru)}</p>}{r.waktu_mulai_lama !== r.waktu_mulai_baru && <p className="text-[#64748B]">Waktu mulai: {r.waktu_mulai_baru ? tanggalWib(r.waktu_mulai_baru) : "Belum ditentukan"}</p>}{r.catatan && <p className="whitespace-pre-wrap leading-5 text-[#64748B]">{r.catatan}</p>}</li>)}</ol> : <p className="py-4 text-[12px] text-[#64748B]">Belum ada riwayat perubahan.</p>)}
      </div></details>}
      {p && !locked && <details className={`${panel} group`}><summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[13px] font-medium text-[#64748B]">Pengaturan lainnya<ChevronDown size={15} className="transition group-open:rotate-180" /></summary><div className="space-y-5 border-t border-[#E2E8F0] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[13px] font-medium">Visibilitas periode</p><p className="mt-1 text-[12px] text-[#64748B]">{p.is_active ? "Periode ditampilkan kepada mahasiswa." : "Periode disembunyikan dari mahasiswa."}</p></div><button disabled={busy} onClick={() => setConfirmation("aktif")} className={tombol}>{p.is_active ? "Nonaktifkan" : "Aktifkan"}</button></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-5"><div><p className="text-[13px] font-medium">Hapus periode</p><p className="mt-1 text-[12px] text-[#64748B]">{p.jumlah_laporan ? "Tidak tersedia karena sudah ada laporan masuk." : "Hanya untuk periode yang belum memiliki laporan."}</p></div><button disabled={busy || p.jumlah_laporan > 0} onClick={() => setConfirmation("hapus")} className={`${tombol} text-red-700`}>Hapus periode</button></div>
      </div></details>}
    </div>
    <Dialog open={confirmation !== null} onOpenChange={(open) => { if (!open && !busy) setConfirmation(null); }}><DialogContent><DialogTitle>{confirmation === "hapus" ? "Hapus periode?" : p?.is_active ? "Nonaktifkan periode?" : "Aktifkan periode?"}</DialogTitle><DialogDescription>{confirmation === "hapus" ? "Periode beserta riwayat jadwal dan log pengingat akan dihapus. Tindakan ini hanya tersedia untuk periode tanpa laporan." : p?.is_active ? "Periode tidak ditampilkan kepada mahasiswa dan pengisian tidak tersedia selama nonaktif." : "Periode ditampilkan kepada mahasiswa. Pengisian mengikuti jadwal yang telah ditentukan."}</DialogDescription><div className="mt-4 flex justify-end gap-3"><button disabled={busy} onClick={() => setConfirmation(null)} className={button}>Batal</button><button disabled={busy} onClick={() => void save(confirmation === "hapus" ? "hapus" : "aktif")} className={utama}>{busy ? "Memproses…" : "Ya, lanjutkan"}</button></div></DialogContent></Dialog>
  </div>;
}
