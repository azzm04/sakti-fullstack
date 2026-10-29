"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  Search,
  ScanSearch,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FILTER_LAPORAN,
  cocokFilter,
  type LaporanEkonomi as Baris,
} from "@/lib/monev/laporan-ekonomi";
import { LABEL_HASIL } from "@/lib/monev/evaluasi";
import { kolom, panel, tombol, utama } from "./tampilan";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);
function Status({ row, final }: { row: Baris; final: boolean }) {
  const label =
    !row.laporanId && row.hasil !== "TIDAK_LOLOS"
      ? "Belum mengisi"
      : row.perluDitinjau
        ? "Perlu ditinjau"
        : row.hasil === "LOLOS" && !final
          ? "Memenuhi syarat"
          : LABEL_HASIL[row.hasil];
  const warna = row.perluDitinjau
    ? "bg-[#64748B] text-white"
    : row.hasil === "TIDAK_LOLOS"
      ? "bg-[#B91C1C] text-white"
      : row.hasil === "LOLOS"
        ? "bg-[#15803D] text-white"
        : "bg-[#F1F5F9] text-[#475569]";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded px-2.5 py-1 text-[12px] font-medium leading-4 ${warna}`}
    >
      {label}
    </span>
  );
}

export default function LaporanEkonomi({
  rows: roster,
  contoh,
  final,
}: {
  rows: Baris[];
  contoh: boolean;
  final: boolean;
}) {
  const rows = roster.filter((row) => !!row.laporanId);
  const filters = FILTER_LAPORAN.filter(
    (f) => f.id !== "belum-mengisi" && f.id !== "sudah-mengisi",
  );
  const router = useRouter(),
    params = useSearchParams(),
    path = usePathname();
  const query = params.get("q") ?? "";
  const filter = filters.some((f) => f.id === params.get("filter"))
    ? params.get("filter")!
    : "semua";
  const cari = (params.get("q") ?? "").trim().toLowerCase();
  const filtered = rows.filter(
    (r) =>
      cocokFilter(r, filter) &&
      `${r.nama} ${r.nim} ${r.prodi}`.toLowerCase().includes(cari),
  );
  const size = [10, 25, 50].includes(Number(params.get("jumlah")))
    ? Number(params.get("jumlah"))
    : 10;
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const page = Math.max(
    1,
    Math.min(pages, Math.floor(Number(params.get("halaman"))) || 1),
  );
  const visible = filtered.slice((page - 1) * size, page * size);
  const selected = rows.find((r) => r.id === params.get("laporan"));
  const [preview, setPreview] = useState<{
    url: string;
    label: string;
    rowId: string;
  } | null>(null);
  const [fileBusy, setFileBusy] = useState(false);
  const [error, setError] = useState("");
  const [scan, setScan] = useState<{
    done: number;
    total: number;
    failed: number;
    rowId: string | null;
    stopping: boolean;
  } | null>(null);
  const [scanning, setScanning] = useState(false);
  const stop = useRef(false);
  useEffect(
    () => () => {
      stop.current = true;
    },
    [],
  );
  const belum = rows.filter((r) => r.laporanId && !r.dipindai);
  function cariMahasiswa(value: string) {
    const q = new URLSearchParams(window.location.search);
    if (value) q.set("q", value);
    else q.delete("q");
    q.delete("halaman");
    q.delete("laporan");
    // Filter data lokal; sinkronkan URL tanpa permintaan server setiap ketikan.
    window.history.replaceState(null, "", `${path}${q.size ? `?${q}` : ""}`);
  }
  function navigate(values: Record<string, string | null>) {
    const q = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(values)) {
      if (value) q.set(key, value);
      else q.delete(key);
    }
    router.replace(`${path}?${q}`, { scroll: false });
  }
  async function pindai(items: Baris[], rowId: string | null = null) {
    if (contoh || final || scanning || !items.length) return;
    stop.current = false;
    setScanning(true);
    setError("");
    let done = 0,
      failed = 0;
    setScan({ done, failed, total: items.length, rowId, stopping: false });
    for (const row of items) {
      if (stop.current) break;
      try {
        const res = await fetch("/api/admin/monev/run-ai-single", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: row.laporanId }),
        });
        if (!res.ok) failed++;
      } catch {
        failed++;
      }
      done++;
      setScan({
        done,
        failed,
        total: items.length,
        rowId,
        stopping: stop.current,
      });
    }
    setScanning(false);
    router.refresh();
  }
  async function bukaDokumen(file: Baris["dokumen"][number]) {
    setFileBusy(true);
    setError("");
    setPreview(null);
    try {
      const res = await fetch(
        `/api/admin/monev/file-preview?path=${encodeURIComponent(file.path)}`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!data.url) throw new Error();
      setPreview({
        label: file.label,
        url: data.url,
        rowId: selected?.id ?? "",
      });
    } catch {
      setError("Dokumen belum dapat dibuka. Coba lagi.");
    } finally {
      setFileBusy(false);
    }
  }
  function infoPemindaian(rowId: string | null) {
    if (!scan || scan.rowId !== rowId) return null;
    const pesan = scanning
      ? scan.stopping
        ? "Menghentikan setelah laporan ini selesai…"
        : `Memindai ${Math.min(scan.done + 1, scan.total)} dari ${scan.total} laporan…`
      : scan.done < scan.total
        ? `Pemindaian dihentikan. ${scan.done} dari ${scan.total} laporan telah diproses.${scan.failed ? ` ${scan.failed} gagal.` : ""}`
        : scan.failed
          ? `${scan.done - scan.failed} laporan berhasil dipindai, ${scan.failed} gagal.`
          : `${scan.done} laporan berhasil dipindai.`;
    return (
      <div className="space-y-1 text-[12px] leading-5 text-[#64748B]">
        <p role="status" aria-live="polite">
          {pesan}
        </p>
        {scanning && scan.rowId === null && scan.done < scan.total && (
          <button
            disabled={scan.stopping}
            onClick={() => {
              stop.current = true;
              setScan({ ...scan, stopping: true });
            }}
            className="text-[#000352] underline disabled:cursor-default disabled:text-[#94A3B8]"
          >
            Hentikan setelah laporan ini
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className={`${panel} overflow-hidden`}>
        <div className="grid items-end gap-4 border-b border-[#E2E8F0] p-5 md:grid-cols-[minmax(0,1fr)_240px]">
          <div className="flex min-w-0 items-end gap-2">
            <label className="min-w-0 flex-1 text-[12px] text-[#64748B]">
              Cari mahasiswa
              <span className="relative mt-1.5 block">
                <Search
                  size={15}
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-3.5 text-[#94A3B8]"
                />
                <input
                  value={query}
                  onChange={(e) => cariMahasiswa(e.target.value)}
                  placeholder="Nama, NIM, atau program studi"
                  className={`${kolom} !pl-9 !text-base sm:!text-sm`}
                />
              </span>
            </label>
          </div>
          <label className="min-w-0 text-[12px] text-[#64748B]">
            Status laporan
            <select
              aria-label="Filter laporan ekonomi"
              value={filter}
              onChange={(e) =>
                navigate({
                  filter: e.target.value,
                  halaman: null,
                  laporan: null,
                })
              }
              className={`${kolom} mt-1.5 !text-base sm:!text-sm`}
            >
              {filters.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id === "semua" ? "Semua laporan masuk" : f.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
          <label className="flex items-center gap-2 text-[12px] text-[#64748B]">
            Tampilkan
            <select
              aria-label="Jumlah laporan per halaman"
              value={size}
              onChange={(e) =>
                navigate({
                  jumlah: e.target.value,
                  halaman: null,
                  laporan: null,
                })
              }
              className="min-h-11 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#000352]/20"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            laporan
          </label>
          <div className="flex max-w-full flex-col items-start gap-2 sm:items-end sm:text-right">
            {!final && (
              <button
                disabled={contoh || scanning || !belum.length}
                onClick={() => void pindai(belum)}
                className={utama}
              >
                {scanning && scan?.rowId === null ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <ScanSearch size={15} />
                )}
                Pindai yang belum ({belum.length})
              </button>
            )}
            {infoPemindaian(null)}
          </div>
        </div>
        <div
          className="relative overflow-x-auto border-t border-[#E2E8F0]"
          tabIndex={0}
          role="region"
          aria-label="Tabel laporan ekonomi, geser untuk kolom lainnya"
        >
          <table className="w-full min-w-[2230px] table-fixed text-left text-[13px] [&_th]:px-5 [&_td]:px-5 [&_td]:py-5 [&_tr]:align-top">
            <caption className="sr-only">
              Laporan ekonomi mahasiswa. Semua pendapatan dalam rupiah.
            </caption>
            <colgroup>
              {[
                65, 170, 210, 150, 180, 145, 150, 145, 150, 130, 120, 160, 150,
                150, 150,
              ].map((width, i) => (
                <col key={i} style={{ width }} />
              ))}
            </colgroup>
            <thead className="border-b border-[#E2E8F0] bg-[#FAFBFD] text-[12px] text-[#64748B]">
              <tr>
                {[
                  "No",
                  "NIM",
                  "Nama",
                  "Prodi",
                  "Fakultas",
                  "Pendapatan ayah",
                  "Pekerjaan ayah",
                  "Pendapatan ibu",
                  "Pekerjaan ibu",
                  "Pendapatan lain",
                  "Jumlah tanggungan",
                  "Rupiah per tanggungan",
                  "Total pendapatan",
                  "Lampiran",
                  "Hasil evaluasi",
                ].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF0F4]">
              {visible.map((r, index) => (
                <tr key={r.id} className="hover:bg-[#FAFBFD]">
                  <td className="px-4 py-4 tabular-nums text-[#64748B]">
                    {(page - 1) * size + index + 1}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                    {r.nim}
                  </td>
                  <td className="px-4 py-4 font-semibold text-[#0F172A]">
                    {r.nama}
                  </td>
                  <td className="px-4 py-4 text-[#64748B]">{r.prodi}</td>
                  <td className="px-4 py-4 text-[#64748B]">{r.fakultas}</td>
                  <td className="px-4 py-4 tabular-nums">{rupiah(r.ayah)}</td>
                  <td className="px-4 py-4 text-[#64748B]">
                    {r.pekerjaanAyah}
                  </td>
                  <td className="px-4 py-4 tabular-nums">{rupiah(r.ibu)}</td>
                  <td className="px-4 py-4 text-[#64748B]">{r.pekerjaanIbu}</td>
                  <td className="px-4 py-4 tabular-nums">
                    {r.laporanId ? rupiah(r.lain) : "—"}
                  </td>
                  <td className="px-4 py-4">{r.laporanId ? r.anggota : "—"}</td>
                  <td className="px-4 py-4 tabular-nums">
                    {r.laporanId && r.perOrang !== null
                      ? rupiah(r.perOrang)
                      : "—"}
                  </td>
                  <td className="px-4 py-4 tabular-nums">
                    <span className="font-medium text-[#0F172A]">
                      {r.laporanId ? rupiah(r.total) : "—"}
                    </span>
                    {r.dikoreksi && (
                      <p className="mt-1 text-[11px] text-[#64748B]">
                        Koreksi admin
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-[12px] text-[#64748B]">
                    {r.laporanId ? (
                      <>
                        <button
                          onClick={() => navigate({ laporan: r.id })}
                          className="inline-flex min-h-9 items-center gap-1.5 text-[#000352] hover:underline"
                          aria-label={`Lihat lampiran ${r.nama}`}
                        >
                          <FileText size={14} aria-hidden />
                          {contoh
                            ? "Lihat contoh"
                            : `${r.dokumen.length} lampiran`}
                        </button>
                        <p>
                          {r.dipindai ? "Sudah dipindai" : "Belum dipindai"}
                        </p>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <Status row={r} final={final} />
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr>
                  <td colSpan={15} className="p-12 text-center text-[#64748B]">
                    {rows.length
                      ? "Tidak ada laporan yang sesuai dengan filter."
                      : "Belum ada laporan Monev yang masuk pada periode ini."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-[#E2E8F0] px-5 py-4">
          <nav
            aria-label="Halaman laporan ekonomi"
            className="flex items-center gap-3"
          >
            <button
              aria-label="Halaman sebelumnya"
              disabled={page <= 1}
              onClick={() =>
                navigate({ halaman: String(page - 1), laporan: null })
              }
              className={tombol}
            >
              <ChevronLeft size={15} aria-hidden />
            </button>
            <span className="text-[12px] tabular-nums text-[#64748B]">
              {page} / {pages}
            </span>
            <button
              aria-label="Halaman berikutnya"
              disabled={page >= pages}
              onClick={() =>
                navigate({ halaman: String(page + 1), laporan: null })
              }
              className={tombol}
            >
              <ChevronRight size={15} aria-hidden />
            </button>
          </nav>
        </div>
      </div>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            navigate({ laporan: null });
            setPreview(null);
            setError("");
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-[8px] bg-white sm:max-w-4xl">
          <DialogTitle className="text-[#0F172A]">Lampiran Monev</DialogTitle>
          <DialogDescription>
            {selected?.nama} · {selected?.nim} · {selected?.prodi}
          </DialogDescription>
          {selected && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Status row={selected} final={final} />
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  {selected.laporanId && !final && (
                    <button
                      disabled={contoh || scanning}
                      onClick={() => void pindai([selected], selected.id)}
                      className={tombol}
                    >
                      {scanning && scan?.rowId === selected.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <ScanSearch size={15} />
                      )}
                      {selected.dipindai ? "Pindai ulang" : "Pindai dokumen"}
                    </button>
                  )}
                  {infoPemindaian(selected.id)}
                </div>
              </div>
              {!selected.laporanId ? (
                <p className="rounded-lg bg-[#F8FAFC] p-5 text-[13px] text-[#64748B]">
                  Mahasiswa belum mengirim laporan ekonomi pada periode ini.
                </p>
              ) : (
                <>
                  {selected.keterangan && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] leading-5 text-amber-900">
                      {selected.perluDitinjau
                        ? "Indikasi awal: "
                        : "Keterangan: "}
                      {selected.keterangan}
                    </p>
                  )}
                  <section>
                    <h3 className="text-[13px] font-semibold">
                      Dokumen pendukung
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selected.dokumen.map((file) => (
                        <button
                          key={file.label}
                          disabled={fileBusy}
                          onClick={() => void bukaDokumen(file)}
                          className={tombol}
                        >
                          <FileText size={14} />
                          {file.label}
                        </button>
                      ))}
                      {!selected.dokumen.length && (
                        <p className="text-[12px] text-[#64748B]">
                          {contoh
                            ? "Dokumen pribadi tidak disertakan dalam data contoh."
                            : "Belum ada lampiran yang tercatat."}
                        </p>
                      )}
                    </div>
                  </section>
                  {fileBusy && (
                    <p role="status" className="text-[12px] text-[#64748B]">
                      Memuat dokumen…
                    </p>
                  )}
                  {preview && preview.rowId === selected.id && (
                    <section className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[13px] font-medium">
                          {preview.label}
                        </h3>
                        <a
                          href={preview.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[12px] text-[#000352]"
                        >
                          Buka tab baru
                          <ExternalLink size={12} />
                        </a>
                      </div>
                      <iframe
                        title={preview.label}
                        src={preview.url}
                        className="h-[440px] w-full rounded-lg border border-[#E2E8F0]"
                      />
                    </section>
                  )}
                </>
              )}
              {error && (
                <p role="alert" className="text-[12px] text-red-700">
                  {error}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
