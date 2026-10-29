"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Mahasiswa } from "@/lib/dashboard-monev/data";
import { angka } from "./ui";

export interface BarisDaftar extends Mahasiswa {
  /** Keterangan singkat mengapa mahasiswa ada di daftar ini. */
  detail?: string;
  /** Kolom tambahan yang ikut disalin, misalnya email. */
  salinan?: string[];
}

export interface IsiDaftar {
  judul: string;
  keterangan?: string;
  baris: BarisDaftar[];
  /** Judul kolom tambahan saat disalin, sejajar dengan `salinan`. */
  kolomSalinan?: string[];
}

/** Daftar mahasiswa di balik sebuah angka dashboard, dengan pencarian dan salin ke spreadsheet. */
export default function DaftarDialog({
  isi,
  onClose,
}: {
  isi: IsiDaftar | null;
  onClose: () => void;
}) {
  const [cari, setCari] = useState("");
  const [tersalin, setTersalin] = useState(false);

  const baris = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!isi || !q) return isi?.baris ?? [];
    return isi.baris.filter((b) =>
      `${b.nama} ${b.nim} ${b.prodi} ${b.detail ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [isi, cari]);

  const salin = async () => {
    if (!isi) return;
    const kepala = [
      "NIM",
      "Nama",
      "Program studi",
      "Keterangan",
      ...(isi.kolomSalinan ?? []),
    ];
    const teks = [
      kepala,
      ...baris.map((b) => [
        b.nim,
        b.nama,
        b.prodi,
        b.detail ?? "",
        ...(b.salinan ?? []),
      ]),
    ]
      .map((r) => r.join("\t"))
      .join("\n");
    try {
      await navigator.clipboard.writeText(teks);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 2000);
    } catch {
      setTersalin(false);
    }
  };

  const tutup = (open: boolean) => {
    if (open) return;
    setCari("");
    onClose();
  };

  return (
    <Dialog open={isi !== null} onOpenChange={tutup}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-[8px] border-[#E2E8F0] bg-white p-0">
        <div className="shrink-0 border-b border-[#E2E8F0] px-5 py-5 pr-12 sm:px-7 sm:pr-12">
          <DialogTitle className="text-[20px] font-semibold leading-7 text-[#000352]">
            {isi?.judul}
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] leading-5 text-[#64748B]">
            {isi?.keterangan ? `${isi.keterangan} · ` : ""}
            {angka(isi?.baris.length ?? 0)} mahasiswa
          </DialogDescription>
          {(isi?.baris.length ?? 0) > 8 && (
            <label className="relative mt-4 block">
              <span className="sr-only">Cari nama, NIM, atau prodi</span>
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                aria-hidden
              />
              <input
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Cari nama, NIM, atau prodi"
                className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 pl-9 pr-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#000352]"
              />
            </label>
          )}
        </div>

        <div className="min-h-0 overflow-y-auto">
          {baris.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-[#64748B] sm:px-7">
              {cari
                ? "Tidak ada yang cocok dengan pencarian."
                : "Tidak ada mahasiswa di daftar ini."}
            </p>
          ) : (
            <ul className="divide-y divide-[#E2E8F0]">
              {baris.map((b) => (
                <li
                  key={`${b.nim}-${b.detail ?? ""}`}
                  className="px-5 py-3.5 sm:px-7"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                    <p className="text-[14px] font-medium leading-6 text-[#0F172A]">
                      {b.nama}
                    </p>
                    <p className="text-[12px] tabular-nums text-[#64748B]">
                      {b.nim}
                    </p>
                  </div>
                  <p className="text-[13px] leading-5 text-[#475569]">
                    {b.prodi}
                  </p>
                  {b.detail && (
                    <p className="mt-1 text-[13px] leading-5 text-[#0F172A]">
                      {b.detail}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 sm:px-7">
          <p
            className="text-[12px] leading-5 text-[#64748B]"
            aria-live="polite"
          >
            {tersalin
              ? "Daftar tersalin. Tempel ke spreadsheet."
              : cari
                ? `${angka(baris.length)} hasil pencarian`
                : "Salin untuk ditempel ke spreadsheet."}
          </p>
          <button
            type="button"
            onClick={salin}
            disabled={baris.length === 0}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 text-[13px] font-medium text-[#000352] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {tersalin ? (
              <Check size={16} aria-hidden />
            ) : (
              <Copy size={16} aria-hidden />
            )}
            Salin {cari ? "hasil" : "daftar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
