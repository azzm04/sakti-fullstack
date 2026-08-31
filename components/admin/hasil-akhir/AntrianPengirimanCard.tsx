"use client";

import useSWR from "swr";
import { Clock, FileUp, AlertTriangle } from "lucide-react";
import type { SKDokumen } from "./SectionImportSK";
import { SK_ENDPOINT } from "./SKTersimpanCard";
import type { HasilAkhirSummary } from "./HasilAkhirSummary";

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => (json.data ?? []) as SKDokumen[]);

type QueueStats = { total: number; queued: number; sent: number; failed: number };

interface Props {
  queueStats: QueueStats | null;
  summary: HasilAkhirSummary | null;
  onProcessQueue: () => void;
  processing: boolean;
}

function relativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function AntrianPengirimanCard({ queueStats, summary, onProcessQueue, processing }: Props) {
  const { data: skList = [] } = useSWR<SKDokumen[]>(SK_ENDPOINT, fetcher);

  const queued = queueStats?.queued ?? 0;
  const total = queueStats?.total ?? 0;
  const pct = total > 0 ? Math.min(100, (queued / total) * 100) : 0;

  const activity = [...skList]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-admin-heading font-bold text-admin-text text-sm">
            Antrian Pengiriman
          </h3>
          {queued > 0 && (
            <button
              onClick={onProcessQueue}
              disabled={processing}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-admin-accent text-white rounded-lg text-[11px] font-semibold hover:bg-admin-accent/90 disabled:opacity-50 transition-colors"
            >
              {processing ? "Memproses..." : "Proses Antrian"}
            </button>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-admin-heading text-4xl font-extrabold text-admin-text tabular-nums">
            {queued}
          </span>
          <span className="text-xs text-admin-text-3">email dalam antrian</span>
        </div>
        <div className="h-1.5 rounded-full bg-admin-grid overflow-hidden mt-3.5 mb-4">
          <div
            className="h-full rounded-full bg-admin-warn-bar"
            style={{ width: `${Math.max(pct > 0 ? 3 : 0, pct)}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-admin-accent/8 rounded-xl p-2.5 text-center">
            <p className="text-base font-extrabold font-admin-heading text-admin-accent-ink tabular-nums">
              {summary?.totalDitetapkanSk ?? "—"}
            </p>
            <p className="text-[9px] font-semibold text-admin-text-4 uppercase tracking-wide mt-0.5">
              Ditetapkan SK
            </p>
          </div>
          <div className="bg-admin-surface-soft rounded-xl p-2.5 text-center">
            <p className="text-base font-extrabold font-admin-heading text-admin-text tabular-nums">
              {summary?.totalBelumLolos ?? "—"}
            </p>
            <p className="text-[9px] font-semibold text-admin-text-4 uppercase tracking-wide mt-0.5">
              Belum Lolos
            </p>
          </div>
          <div className="bg-admin-surface-soft rounded-xl p-2.5 text-center">
            <p className="text-base font-extrabold font-admin-heading text-admin-text tabular-nums">
              {skList.length}
            </p>
            <p className="text-[9px] font-semibold text-admin-text-4 uppercase tracking-wide mt-0.5">
              Lampiran
            </p>
          </div>
        </div>

        {(summary?.totalBelumDiprosesSk ?? 0) > 0 && (
          <div className="flex items-start gap-2 mt-3 px-3 py-2.5 bg-admin-warn-bg-2 border border-admin-warn-border rounded-xl">
            <AlertTriangle size={13} className="text-admin-warn-text shrink-0 mt-0.5" />
            <p className="text-[11px] text-admin-warn-text leading-relaxed">
              <strong>{summary?.totalBelumDiprosesSk}</strong> kandidat &quot;Diusulkan&quot; belum
              diproses di tab <strong>Penetapan SK</strong> — kalau email dikirim sekarang, mereka
              akan menerima email &quot;Belum Lolos&quot; walau sebenarnya diusulkan.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={14} className="text-admin-text-3" />
          <h3 className="font-admin-heading font-bold text-admin-text text-sm">
            Aktivitas Pengumuman
          </h3>
        </div>

        {activity.length === 0 ? (
          <p className="text-xs text-admin-text-3">Belum ada aktivitas tercatat.</p>
        ) : (
          <ul className="space-y-3.5">
            {activity.map((sk) => (
              <li key={sk.id} className="flex items-start gap-2.5">
                <FileUp size={13} className="text-admin-text-4 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[12.5px] text-admin-text-2 leading-snug">
                    Dokumen SK{" "}
                    <span className="font-semibold text-admin-text">
                      {sk.catatan || sk.nama_file}
                    </span>{" "}
                    diunggah
                  </p>
                  <p className="text-[11px] text-admin-text-4 mt-0.5">
                    {relativeDate(sk.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
