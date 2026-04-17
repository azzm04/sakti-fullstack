"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Mail, User, CheckCircle2, AlertCircle, Trash2, Users } from "lucide-react";

interface WhitelistEntry {
  id: string;
  nama: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

type Mode = "single" | "bulk";
type Status = "idle" | "loading" | "success" | "error";

const BULK_SIZE = 20;
const emptyRow = () => ({ nama: "", email: "" });
const isUndipEmail = (e: string) =>
  e.endsWith("@students.undip.ac.id") 

export default function WhitelistPage() {
  const [mode, setMode]     = useState<Mode>("single");
  const [form, setForm]     = useState({ nama: "", email: "" });
  const [rows, setRows]     = useState(() => Array.from({ length: BULK_SIZE }, emptyRow));
  const [list, setList]     = useState<WhitelistEntry[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // ── Single submit ──────────────────────────────────────
  async function handleSingle(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!form.nama.trim() || !form.email.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: form.nama.trim(), email: form.email.trim().toLowerCase(), role: "PEWAWANCARA" }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? "Gagal menambahkan."); setStatus("error"); setTimeout(() => setStatus("idle"), 3000); return; }
      setList((p) => [data, ...p]);
      setForm({ nama: "", email: "" });
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  // ── Bulk submit ────────────────────────────────────────
  async function handleBulk(e: React.SyntheticEvent) {
    e.preventDefault();
    const valid = rows.filter((r) => r.nama.trim() && r.email.trim());
    if (valid.length === 0) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/whitelist/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: valid.map((r) => ({ nama: r.nama.trim(), email: r.email.trim().toLowerCase(), role: "PEWAWANCARA" })) }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? "Gagal menyimpan."); setStatus("error"); setTimeout(() => setStatus("idle"), 3000); return; }
      const added: WhitelistEntry[] = data.created ?? valid.map((r, i) => ({ id: `tmp-${i}`, ...r, isActive: true, createdAt: new Date().toISOString() }));
      setList((p) => [...added, ...p]);
      setRows(Array.from({ length: BULK_SIZE }, emptyRow));
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  async function handleRemove(id: string) {
    setList((p) => p.filter((e) => e.id !== id));
    await fetch(`/api/admin/whitelist/${id}`, { method: "DELETE" }).catch(() => {});
  }

  const filledBulk = rows.filter((r) => r.nama.trim() || r.email.trim()).length;

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10">

      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-1.5 mb-3 text-[11px] uppercase tracking-wider font-semibold">
          <span className="text-muted-foreground">Admin</span>
          <span className="text-muted-foreground">›</span>
          <span className="text-primary">Whitelist Pewawancara</span>
        </nav>
        <h2 className="text-3xl font-extrabold text-primary tracking-tight font-headline">
          Whitelist Pewawancara
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Tambahkan email SSO mahasiswa yang berhak mengakses fitur wawancara.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── Left panel ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6">

            {/* Mode toggle */}
            <div className="flex gap-1 p-1 bg-muted rounded-xl mb-5">
              {([["single", UserPlus, "Satu Orang"], ["bulk", Users, `Hingga ${BULK_SIZE} Orang`]] as const).map(([m, Icon, label]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    mode === m ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* ── Single form ── */}
              {mode === "single" && (
                <motion.form
                  key="single"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  onSubmit={handleSingle}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nama Lengkap</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text" value={form.nama} required
                        onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                        placeholder="Dr. Budi Santoso, M.Kom."
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-slate-50 placeholder:text-slate-400 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email SSO Undip</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email" value={form.email} required
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="nama@lecturer.undip.ac.id"
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-slate-50 placeholder:text-slate-400 transition-all"
                      />
                    </div>
                    {form.email && !isUndipEmail(form.email) && (
                      <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> Gunakan email domain @students.undip.ac.id
                      </p>
                    )}
                  </div>
                  <RoleBadge />
                  <Feedback status={status} errorMsg={errorMsg} bulkCount={0} />
                  <SubmitBtn status={status} disabled={!form.nama || !form.email} label="Tambahkan Akses" />
                </motion.form>
              )}

              {/* ── Bulk form ── */}
              {mode === "bulk" && (
                <motion.form
                  key="bulk"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  onSubmit={handleBulk}
                  className="space-y-3"
                >
                  <p className="text-xs text-muted-foreground">
                    Isi baris yang diperlukan saja. Baris kosong akan diabaikan.
                  </p>

                  {/* Table header */}
                  <div className="grid grid-cols-[24px_1fr_1fr] gap-1.5 px-1">
                    <span />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nama Lengkap</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email SSO</span>
                  </div>

                  {/* Scrollable rows */}
                  <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {rows.map((row, i) => (
                      <div key={i} className="grid grid-cols-[24px_1fr_1fr] gap-1.5 items-center">
                        <span className="text-[10px] text-muted-foreground text-right font-mono">{i + 1}</span>
                        <input
                          type="text"
                          value={row.nama}
                          onChange={(e) => setRows((r) => r.map((x, j) => j === i ? { ...x, nama: e.target.value } : x))}
                          placeholder="Nama lengkap"
                          className="w-full px-2.5 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:border-primary bg-slate-50 placeholder:text-slate-300 transition-all"
                        />
                        <input
                          type="email"
                          value={row.email}
                          onChange={(e) => setRows((r) => r.map((x, j) => j === i ? { ...x, email: e.target.value } : x))}
                          placeholder="email@undip.ac.id"
                          className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:border-primary bg-slate-50 placeholder:text-slate-300 transition-all ${
                            row.email && !isUndipEmail(row.email) ? "border-amber-400" : "border-border"
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  <RoleBadge />
                  <Feedback status={status} errorMsg={errorMsg} bulkCount={filledBulk} />
                  <SubmitBtn
                    status={status}
                    disabled={filledBulk === 0}
                    label={`Tambahkan ${filledBulk > 0 ? filledBulk : ""} Akses Sekaligus`}
                  />
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Right: list ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-on-surface text-sm">Daftar Pewawancara</h3>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {list.length} entri (sesi ini)
              </span>
            </div>

            {list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <UserPlus size={32} className="text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Belum ada data</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Tambahkan pewawancara menggunakan form di sebelah kiri.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border max-h-[520px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {list.map((entry) => (
                    <motion.li
                      key={entry.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{entry.nama.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{entry.nama}</p>
                        <p className="text-xs text-muted-foreground truncate">{entry.email}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full shrink-0">
                        PEWAWANCARA
                      </span>
                      <button
                        onClick={() => handleRemove(entry.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        title="Hapus akses"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 px-1">
            Data di atas hanya menampilkan entri yang ditambahkan pada sesi ini. Integrasi database akan dilakukan pada tahap berikutnya.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────

function RoleBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
      <span className="w-2 h-2 rounded-full bg-blue-500" />
      <span className="text-xs font-semibold text-blue-700">Role: PEWAWANCARA</span>
    </div>
  );
}

function Feedback({ status, errorMsg, bulkCount }: { status: Status; errorMsg: string; bulkCount: number }) {
  return (
    <AnimatePresence mode="wait">
      {status === "success" && (
        <motion.div key="ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
          <CheckCircle2 size={13} />
          {bulkCount > 0 ? `${bulkCount} akses berhasil ditambahkan.` : "Akses berhasil ditambahkan."}
        </motion.div>
      )}
      {status === "error" && (
        <motion.div key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
          <AlertCircle size={13} /> {errorMsg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SubmitBtn({ status, disabled, label }: { status: Status; disabled: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={status === "loading" || disabled}
      className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {status === "loading"
        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : <UserPlus size={15} />}
      {status === "loading" ? "Menyimpan..." : label}
    </button>
  );
}
