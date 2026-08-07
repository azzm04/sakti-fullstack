"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  FileText,
  RefreshCw,
  Clock,
  XCircle,
} from "lucide-react";
import type { SKDokumen } from "./SectionImportSK";

const JALUR_OPTIONS = [
  { key: "SNBP_ELIGIBLE", label: "SNBP Eligible" },
  { key: "SNBP_NON_ELIGIBLE", label: "SNBP Non-Eligible" },
  { key: "SNBT_ELIGIBLE", label: "SNBT Eligible" },
  { key: "SNBT_NON_ELIGIBLE", label: "SNBT Non-Eligible" },
  { key: "UM", label: "Ujian Mandiri (UM)" },
  { key: "SBUB", label: "SBUB" },
] as const;

type JalurKey = (typeof JALUR_OPTIONS)[number]["key"];

type PreviewItem = {
  nama: string;
  email: string;
  prodi: string;
  lolos: boolean;
};

type QueueStats = {
  total: number;
  queued: number;
  sent: number;
  failed: number;
};

const ease = [0.25, 0, 0, 1] as [number, number, number, number];

export default function SectionKirimEmail() {
  // Form state
  const [jalurTerpilih, setJalurTerpilih] = useState<Set<JalurKey>>(new Set());
  const [skList, setSkList] = useState<SKDokumen[]>([]);
  const [skTerpilih, setSkTerpilih] = useState<string>("");
  const [subject, setSubject] = useState(
    "Selamat! Anda Diterima sebagai Penerima KIP-K UNDIP 2025",
  );
  const [confirmed, setConfirmed] = useState(false);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Queue state
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Send state
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Load SK list on mount
  const fetchSK = useCallback(async () => {
    const res = await fetch("/api/admin/hasil-akhir/sk-dokumen");
    const json = await res.json();
    setSkList(json.data ?? []);
  }, []);

  const fetchQueueStats = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const res = await fetch("/api/admin/hasil-akhir/email-queue/stats");
      const json = await res.json();
      if (res.ok) setQueueStats(json);
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    fetchSK();
    fetchQueueStats();
  }, [fetchSK, fetchQueueStats]);

  function toggleJalur(key: JalurKey) {
    setJalurTerpilih((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setShowPreview(false);
    setPreview([]);
    setStatus("idle");
    setConfirmed(false);
  }

  function toggleAll() {
    if (jalurTerpilih.size === JALUR_OPTIONS.length)
      setJalurTerpilih(new Set());
    else setJalurTerpilih(new Set(JALUR_OPTIONS.map((j) => j.key)));
    setShowPreview(false);
    setConfirmed(false);
  }

  async function handleLoadPreview() {
    if (jalurTerpilih.size === 0) return;
    setLoadingPreview(true);
    setPreview([]);
    try {
      const jalurParam = Array.from(jalurTerpilih).join(",");
      const res = await fetch(
        `/api/admin/hasil-akhir/preview-email?jalur=${encodeURIComponent(jalurParam)}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal memuat preview");
      setPreview(json.data ?? []);
      setShowPreview(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal memuat preview");
      setStatus("error");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleEnqueue() {
    if (!confirmed || jalurTerpilih.size === 0 || !skTerpilih) return;

    setSending(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/admin/hasil-akhir/email-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jalur: Array.from(jalurTerpilih),
          sk_dokumen_id: skTerpilih,
          subject,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal membuat antrian");

      setStatus("success");
      setConfirmed(false);
      fetchQueueStats(); // refresh stats
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
      setStatus("error");
    } finally {
      setSending(false);
    }
  }

  async function handleProcessQueue() {
    try {
      await fetch("/api/admin/hasil-akhir/email-queue/process", {
        method: "POST",
      });
      setTimeout(fetchQueueStats, 2000);
    } catch {
      /* silent */
    }
  }

  const selectedSK = skList.find((s) => s.id === skTerpilih);
  const canSend =
    confirmed && jalurTerpilih.size > 0 && !!skTerpilih && !sending;

  return (
    <div className="space-y-5">
      {/* ── Queue Status Card ── */}
      {queueStats && queueStats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease }}
          className="bg-white rounded-2xl border border-border shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Status Antrian Email
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={fetchQueueStats}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                <RefreshCw
                  size={13}
                  className={loadingQueue ? "animate-spin" : ""}
                />
              </motion.button>
              {queueStats.queued > 0 && (
                <button
                  onClick={handleProcessQueue}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Send size={12} /> Proses Antrian
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "Total",
                value: queueStats.total,
                color: "text-foreground",
                bg: "bg-muted",
              },
              {
                label: "Antrian",
                value: queueStats.queued,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
              {
                label: "Terkirim",
                value: queueStats.sent,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                label: "Gagal",
                value: queueStats.failed,
                color: "text-red-600",
                bg: "bg-red-50",
              },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                <p className={`text-xl font-extrabold font-headline ${color}`}>
                  {value}
                </p>
                <p className="text-[10px] font-semibold text-muted-foreground mt-0.5 uppercase tracking-wider">
                  {label}
                </p>
              </div>
            ))}
          </div>
          {queueStats.failed > 0 && (
            <p className="mt-3 text-xs text-red-600 flex items-center gap-1.5">
              <XCircle size={12} />
              {queueStats.failed} email gagal — cek log server untuk detail,
              lalu proses antrian ulang.
            </p>
          )}
        </motion.div>
      )}

      {/* ── Form Card ── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <Mail size={17} />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base">
              Kirim Email SK ke Kandidat
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pilih jalur, pilih file SK, lalu masukkan ke antrian pengiriman
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Pilih Jalur — multi select */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Jalur Masuk
              </label>
              <button
                onClick={toggleAll}
                className="text-xs font-semibold text-primary hover:underline underline-offset-2"
              >
                {jalurTerpilih.size === JALUR_OPTIONS.length
                  ? "Batal Semua"
                  : "Pilih Semua"}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {JALUR_OPTIONS.map(({ key, label }) => {
                const sel = jalurTerpilih.has(key);
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleJalur(key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      sel
                        ? "bg-primary/8 border-primary text-primary"
                        : "bg-muted border-border text-muted-foreground hover:border-slate-300"
                    }`}
                  >
                    {sel ? <CheckSquare size={13} /> : <Square size={13} />}
                    {label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Pilih SK Dokumen */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              File SK yang akan dilampirkan
            </label>
            {skList.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <AlertCircle size={14} />
                Belum ada SK diupload. Pergi ke tab{" "}
                <strong>Import SK PDF</strong> untuk upload dulu.
              </div>
            ) : (
              <div className="space-y-2">
                {skList.map((sk) => (
                  <motion.button
                    key={sk.id}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setSkTerpilih(sk.id);
                      setStatus("idle");
                      setConfirmed(false);
                    }}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      skTerpilih === sk.id
                        ? "bg-primary/8 border-primary"
                        : "bg-muted border-border hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        skTerpilih === sk.id
                          ? "bg-primary text-white"
                          : "bg-red-50 text-red-400"
                      }`}
                    >
                      <FileText size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold truncate ${skTerpilih === sk.id ? "text-primary" : "text-foreground"}`}
                      >
                        {sk.nama_file}
                      </p>
                      {sk.catatan && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {sk.catatan}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sk.jalur_masuk.map((j) => (
                          <span
                            key={j}
                            className="text-[10px] font-bold px-1.5 py-0.5 bg-white border border-border rounded-full text-muted-foreground"
                          >
                            {JALUR_OPTIONS.find((o) => o.key === j)?.label ?? j}
                          </span>
                        ))}
                      </div>
                    </div>
                    {skTerpilih === sk.id && (
                      <CheckCircle2
                        size={15}
                        className="text-primary shrink-0 mt-0.5"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Subjek Email */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Subjek Email
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-border rounded-xl bg-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>
              Sistem akan mengirim <strong>email dinamis</strong> ke{" "}
              <strong>semua kandidat</strong> (Lolos & Belum Lolos) pada jalur
              yang dipilih. Kandidat yang Lolos akan mendapat ucapan selamat
              beserta lampiran PDF SK.
            </span>
          </div>

          {/* Preview penerima */}
          <div>
            <button
              onClick={
                showPreview ? () => setShowPreview(false) : handleLoadPreview
              }
              disabled={loadingPreview || jalurTerpilih.size === 0}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-2 disabled:opacity-40 transition-all"
            >
              {loadingPreview ? (
                <Loader2 size={14} className="animate-spin" />
              ) : showPreview ? (
                <EyeOff size={14} />
              ) : (
                <Eye size={14} />
              )}
              {loadingPreview
                ? "Memuat..."
                : showPreview
                  ? `Sembunyikan (${preview.length} penerima)`
                  : "Lihat daftar penerima"}
            </button>

            <AnimatePresence>
              {showPreview && preview.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-muted flex items-center gap-2 border-b border-border">
                      <Users size={12} className="text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground">
                        {preview.length} kandidat akan menerima email
                      </span>
                    </div>
                    <div className="max-h-52 overflow-y-auto divide-y divide-border">
                      {preview.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-4 py-2.5"
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              p.lolos
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500" // 👈 Beda warna inisial
                            }`}
                          >
                            {p.nama.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {p.nama}
                              </p>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                  p.lolos
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                }`}
                              >
                                {p.lolos ? "Lolos" : "Belum Lolos"}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {p.email}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground hidden md:block shrink-0 max-w-[140px] truncate text-right">
                            {p.prodi}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Konfirmasi */}
          <label className="flex items-start gap-3 cursor-pointer select-none group">
            <div
              onClick={() => setConfirmed((v) => !v)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                confirmed
                  ? "bg-primary border-primary"
                  : "border-border group-hover:border-primary/50"
              }`}
            >
              {confirmed && <CheckCircle2 size={12} className="text-white" />}
            </div>
            <span className="text-sm text-foreground leading-relaxed">
              Saya konfirmasi data penerima sudah final. Email + SK PDF akan
              diantrekan untuk dikirim ke{" "}
              <strong>
                {jalurTerpilih.size > 0
                  ? Array.from(jalurTerpilih)
                      .map((k) => JALUR_OPTIONS.find((j) => j.key === k)?.label)
                      .join(", ")
                  : "jalur yang dipilih"}
              </strong>
              {selectedSK && (
                <>
                  , melampirkan <strong>{selectedSK.nama_file}</strong>
                </>
              )}
              .
            </span>
          </label>

          {/* Status feedback */}
          <AnimatePresence>
            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl"
              >
                <CheckCircle2
                  size={15}
                  className="text-emerald-600 shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    Email berhasil diantrekan!
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Klik <strong>Proses Antrian</strong> di atas untuk mulai
                    pengiriman. Progress dapat dipantau di kartu status antrian.
                  </p>
                </div>
              </motion.div>
            )}
            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600"
              >
                <AlertCircle size={15} /> {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: canSend ? 0.98 : 1 }}
            onClick={handleEnqueue}
            disabled={!canSend}
            className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {sending ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Membuat
                antrian...
              </>
            ) : (
              <>
                <Send size={15} /> Antrekan Pengiriman
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
