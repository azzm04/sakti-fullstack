"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { motion } from "motion/react";
import {
  FileText,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  Calendar,
  HardDrive,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { JALUR_OPTIONS } from "@/lib/jalur";
import type { SKDokumen } from "./SectionImportSK";

export const SK_ENDPOINT = "/api/admin/hasil-akhir/sk-dokumen";

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => (json.data ?? []) as SKDokumen[]);

interface Props {
  onDelete: (sk: SKDokumen) => void;
  deletingId: string | null;
}

export default function SKTersimpanCard({ onDelete, deletingId }: Props) {
  const {
    data: skList = [],
    isLoading: loading,
    isValidating: refreshing,
    mutate,
  } = useSWR<SKDokumen[]>(SK_ENDPOINT, fetcher, { revalidateOnFocus: true });

  useEffect(() => {
    const channel = supabaseBrowser
      .channel("sk_dokumen_changes_sidebar")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sk_dokumen" },
        () => mutate(),
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [mutate]);

  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-admin-heading font-bold text-admin-text text-sm">SK Tersimpan</h3>
          {!loading && (
            <span className="text-[11px] font-semibold text-admin-text-3 bg-admin-surface-soft px-2 py-0.5 rounded-full">
              {skList.length} file
            </span>
          )}
        </div>
        <button
          onClick={() => mutate()}
          className="w-7 h-7 rounded-lg hover:bg-admin-surface-soft flex items-center justify-center text-admin-text-3 transition-colors"
          title="Sinkronkan ulang"
        >
          <RefreshCw size={13} className={loading || refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-admin-text-3 text-sm">
          <Loader2 size={14} className="animate-spin" /> Memuat...
        </div>
      ) : skList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
          <FileText size={24} className="text-admin-text-5" />
          <p className="text-xs text-admin-text-3">Belum ada SK diupload</p>
        </div>
      ) : (
        <div className="space-y-3">
          {skList.map((sk) => (
            <motion.div
              key={sk.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border border-admin-border rounded-xl p-3.5"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-admin-danger-bg text-admin-danger-bar flex items-center justify-center shrink-0">
                  <FileText size={15} />
                </div>
                <p className="text-[12.5px] font-bold text-admin-text leading-snug break-all">
                  {sk.nama_file}
                </p>
              </div>

              <div className="flex flex-wrap gap-1 mt-2.5">
                {sk.jalur_masuk.map((j) => (
                  <span
                    key={j}
                    className="text-[10px] font-bold px-2 py-0.5 bg-admin-accent/8 text-admin-accent rounded-full"
                  >
                    {JALUR_OPTIONS.find((o) => o.key === j)?.label ?? j}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-admin-surface-soft rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[13px] font-bold text-admin-text tabular-nums">{sk.tahun}</p>
                  <p className="text-[9px] font-semibold text-admin-text-4 uppercase tracking-wide mt-0.5">
                    Tahun
                  </p>
                </div>
                <div className="bg-admin-surface-soft rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[13px] font-bold text-admin-text flex items-center justify-center gap-1">
                    <Calendar size={10} className="text-admin-text-4" />
                    {new Date(sk.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </p>
                  <p className="text-[9px] font-semibold text-admin-text-4 uppercase tracking-wide mt-0.5">
                    Diunggah
                  </p>
                </div>
                <div className="bg-admin-surface-soft rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[13px] font-bold text-admin-text tabular-nums flex items-center justify-center gap-1">
                    <HardDrive size={10} className="text-admin-text-4" />
                    {sk.ukuran_kb}
                  </p>
                  <p className="text-[9px] font-semibold text-admin-text-4 uppercase tracking-wide mt-0.5">
                    KB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <a
                  href={`/api/admin/hasil-akhir/sk-dokumen/preview?id=${sk.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-admin-border text-xs font-semibold text-admin-text-2 hover:bg-admin-surface-soft transition-colors"
                >
                  <Eye size={13} /> Lihat
                </a>
                <button
                  onClick={() => onDelete(sk)}
                  disabled={deletingId === sk.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-admin-danger-border text-xs font-semibold text-admin-danger-bar hover:bg-admin-danger-bg disabled:opacity-40 transition-colors"
                >
                  {deletingId === sk.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  Hapus
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
