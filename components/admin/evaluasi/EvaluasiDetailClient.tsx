"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Trash2,
  Home,
  ClipboardList,
  CheckCircle2,
  UserCheck,
  Eye,
  Bell,
  Search,
  UserPlus,
  ClipboardCheck,
  X,
  Loader2,
  History,
} from "lucide-react";
import { toast } from "sonner";

import type { Kandidat } from "@/schemas";
import { isPerluReview, autoHasilAkhir } from "@/schemas";
import type { EvaluasiInsight } from "@/lib/evaluasi-insight";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Pill } from "@/components/admin/ui/Pill";
import { Timeline, type TimelineItem } from "@/components/admin/ui/Timeline";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const REKOMENDASI_OPTIONS = [
  {
    label: "Layak",
    value: "Layak",
    active: "bg-admin-accent text-white border-admin-accent",
    inactive:
      "bg-white text-admin-text-3 border-admin-border hover:border-admin-accent",
  },
  {
    label: "Layak Dipertimbangkan",
    value: "Layak Dipertimbangkan",
    active: "bg-admin-accent text-white border-admin-accent",
    inactive:
      "bg-white text-admin-text-3 border-admin-border hover:border-admin-accent",
  },
  {
    label: "Tidak Layak Dipertimbangkan",
    value: "Tidak Layak Dipertimbangkan",
    active: "bg-admin-warn-bar text-white border-admin-warn-bar",
    inactive:
      "bg-white text-admin-text-3 border-admin-border hover:border-admin-warn-bar",
  },
  {
    label: "Tidak Layak",
    value: "Tidak Layak",
    active: "bg-admin-danger-bar text-white border-admin-danger-bar",
    inactive:
      "bg-white text-admin-text-3 border-admin-border hover:border-admin-danger-bar",
  },
];

const HASIL_AKHIR_OPTIONS = [
  {
    label: "Diusulkan",
    value: "Diusulkan",
    active: "bg-admin-accent text-white border-admin-accent",
    inactive:
      "bg-white text-admin-text-3 border-admin-border hover:border-admin-accent",
  },
  {
    label: "Tidak Diusulkan",
    value: "Tidak Diusulkan",
    active: "bg-admin-danger-bar text-white border-admin-danger-bar",
    inactive:
      "bg-white text-admin-text-3 border-admin-border hover:border-admin-danger-bar",
  },
];

const fmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

const KEPEMILIKAN_LABEL: Record<number, string> = {
  1: "Milik Sendiri",
  2: "Sewa",
  3: "Tidak Memiliki",
  4: "Menumpang",
};
const SUMBER_AIR_LABEL: Record<number, string> = {
  1: "Sumur",
  2: "PDAM",
  3: "Sungai/Mata Air",
};
const MCK_LABEL: Record<number, string> = {
  1: "Berbagi Pakai",
  2: "Milik Sendiri",
};

function ReadField({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const display =
    value !== undefined && value !== null && value !== 0 && value !== ""
      ? String(value)
      : "—";
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-admin-text-3 mb-0.5">
        {label}
      </p>
      <p className="text-sm text-admin-text font-medium">{display}</p>
    </div>
  );
}

function SectionHeader({
  title,
  icon: Icon,
}: {
  title: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-admin-border mb-4">
      {Icon && <Icon size={14} className="text-admin-text-3" />}
      <h3 className="font-admin-heading text-sm font-bold text-admin-text">
        {title}
      </h3>
    </div>
  );
}

function Badge({
  value,
  type,
}: {
  value: boolean | string | null | undefined;
  type: "validasi" | "rekomendasi";
}) {
  if (value === null || value === undefined || value === "")
    return <span className="text-admin-text-6 text-xs">—</span>;

  if (type === "validasi") {
    const isValid = value === true || value === "Ada" || value === "true";
    return (
      <span
        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
          isValid
            ? "bg-admin-accent/10 text-admin-accent-ink border-admin-accent/25"
            : "bg-admin-danger-bg text-admin-danger-text border-admin-danger-border"
        }`}
      >
        {isValid ? "Ada" : "Tidak ada"}
      </span>
    );
  }

  if (type === "rekomendasi") {
    const lower = String(value).toLowerCase();
    if (
      lower.includes("layak") &&
      !lower.includes("tidak") &&
      !lower.includes("pertimbang")
    ) {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-admin-accent/10 text-admin-accent-ink border-admin-accent/25">
          {String(value)}
        </span>
      );
    }
    if (lower.includes("pertimbang")) {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-admin-warn-bg-2 text-admin-warn-text border-admin-warn-border">
          {String(value)}
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-admin-danger-bg text-admin-danger-text border-admin-danger-border">
        {String(value)}
      </span>
    );
  }

  return <span className="text-xs text-admin-text">{String(value)}</span>;
}

interface PewawancaraOption {
  id: string;
  nama: string;
  total_assigned?: number;
  users?: { status_akun?: string } | null;
}

interface EvaluasiDetailClientProps {
  kandidat: Kandidat;
  id: string;
  insight: EvaluasiInsight;
  polaSerupaCount: number;
}

export default function EvaluasiDetailClient({
  kandidat,
  id,
  insight,
  polaSerupaCount,
}: EvaluasiDetailClientProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    rekomendasi: kandidat.rekomendasi || "",
    hasil_akhir: (kandidat.hasil_akhir as string) || "",
    catatan_admin: kandidat.catatan_admin || "",
    alasan: kandidat.alasan || "",
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [showDelete, setShowDelete] = useState(false);

  const [showTugaskan, setShowTugaskan] = useState(false);
  const [pewawancaraOptions, setPewawancaraOptions] = useState<
    PewawancaraOption[]
  >([]);
  const [loadingPewawancara, setLoadingPewawancara] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const perluReview = isPerluReview(form.rekomendasi);
  const autoHasil = autoHasilAkhir(form.rekomendasi);

  useEffect(() => {
    if (!showTugaskan) return;
    setLoadingPewawancara(true);
    fetch("/api/admin/pewawancara")
      .then((r) => r.json())
      .then((res) => setPewawancaraOptions(res.data ?? []))
      .catch(() => setPewawancaraOptions([]))
      .finally(() => setLoadingPewawancara(false));
  }, [showTugaskan]);

  async function handleTugaskan(pewawancaraId: string) {
    setAssigningId(pewawancaraId);
    try {
      const res = await fetch(`/api/admin/evaluasi/${id}/tugaskan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pewawancara_id: pewawancaraId }),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Gagal menugaskan", {
          description: resData.error || "Terjadi kesalahan.",
        });
        return;
      }
      toast.success("Pewawancara ditugaskan", {
        description: `${resData.data?.pewawancara?.nama ?? "Pewawancara"} kini bertugas untuk kandidat ini.`,
      });
      setShowTugaskan(false);
      router.refresh();
    } catch {
      toast.error("Gagal menugaskan", {
        description: "Terjadi kesalahan jaringan.",
      });
    } finally {
      setAssigningId(null);
    }
  }

  async function handleSave() {
    if (!form.rekomendasi) {
      toast.error("Data belum lengkap", {
        description: "Pilih rekomendasi terlebih dahulu sebelum menyimpan.",
      });
      return;
    }

    // Jika "Dipertimbangkan", admin harus memilih hasil akhir dulu
    if (perluReview && !form.hasil_akhir) {
      toast.error("Hasil Akhir belum dipilih", {
        description:
          "Karena rekomendasi ini perlu ditinjau, Admin harus menentukan Hasil Akhir.",
      });
      return;
    }

    setSaveStatus("saving");

    try {
      const res = await fetch(`/api/admin/evaluasi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rekomendasi: form.rekomendasi,
          hasil_akhir: autoHasil ?? form.hasil_akhir,
          catatan_admin: form.catatan_admin,
          alasan: form.alasan,
          is_draft: false,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error("Data belum lengkap", {
          description:
            errData.error ||
            "Gagal menyimpan perubahan. Pastikan semua data sudah terisi.",
        });
        throw new Error(errData.error || "Gagal menyimpan");
      }

      setSaveStatus("saved");
      toast.success("Berhasil disimpan", {
        description: "Rekomendasi evaluasi telah diperbarui.",
      });
      router.refresh();
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  async function handleDelete() {
    await fetch(`/api/admin/evaluasi/${id}`, { method: "DELETE" }).catch(
      () => {},
    );
    router.push("/admin/evaluasi");
  }

  const hasWawancaraData = !!(
    kandidat.hasil_wawancara_id || kandidat.rekomendasi
  );

  const initials = (kandidat.nama_pendaftar || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const detailChips: { label: string; value: string }[] = [
    { label: "Status DTSEN", value: kandidat.aktif_dtsen || "—" },
    { label: "Desil", value: kandidat.desil_dtsen || "—" },
    {
      label: "Tanggungan",
      value: kandidat.jumlah_tanggungan
        ? `${kandidat.jumlah_tanggungan} orang`
        : "—",
    },
    {
      label: "Pewawancara",
      value: kandidat.pewawancara_data?.nama || "Belum ditugaskan",
    },
  ];

  const riwayatItems: TimelineItem[] = (kandidat.riwayat ?? []).map((r) => ({
    id: r.id,
    text: r.deskripsi,
    when: new Date(r.created_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    who: r.aktor ?? undefined,
  }));

  return (
    <div className="min-h-screen bg-admin-bg font-admin-body text-admin-text flex flex-col">
      <PageHeader
        breadcrumb="Admin / Seleksi KIP-K / Evaluasi"
        title="Evaluasi Wawancara"
        right={
          <>
            <label className="flex items-center gap-[9px] bg-admin-bg border border-admin-border rounded-[11px] px-[13px] py-[9px] flex-1 sm:flex-none sm:w-70 text-admin-text-3 focus-within:border-admin-accent transition-colors">
              <Search size={15} strokeWidth={1.6} className="shrink-0" />
              <input
                type="text"
                placeholder="Cari kandidat, NIM, prodi…"
                className="border-0 bg-transparent outline-none text-[13px] text-admin-text w-full placeholder:text-admin-placeholder"
              />
            </label>
            <button
              type="button"
              className="border border-admin-border bg-transparent rounded-[11px] w-[38px] h-[38px] shrink-0 flex items-center justify-center text-admin-text-2 hover:bg-admin-surface-soft transition-colors"
            >
              <Bell size={17} strokeWidth={1.6} />
            </button>
          </>
        }
      />

      <div className="px-[30px] pt-[22px] pb-[34px] flex flex-col gap-[16px]">
        {/* Profil kandidat */}
        <section className="bg-white rounded-2xl border border-admin-border p-5 flex items-start gap-5 flex-wrap shadow-sm">
          <div className="flex-1 min-w-[260px]">
            <button
              type="button"
              onClick={() => {
                if (
                  typeof window !== "undefined" &&
                  window.history.length > 1
                ) {
                  router.back();
                } else {
                  router.push("/admin/evaluasi");
                }
              }}
              className="inline-flex items-center gap-[7px] text-[12.5px] font-semibold text-admin-accent hover:text-admin-accent-ink transition-colors"
            >
              <ArrowLeft size={14} /> Kembali ke daftar
            </button>
            <h2 className="font-admin-heading text-[26px] font-semibold mt-2 tracking-[-0.015em] text-admin-text">
              {kandidat.nama_pendaftar}
            </h2>
            <div className="flex flex-wrap items-center gap-[14px] mt-[7px] text-[12.5px] text-admin-text-3">
              <span className="tabular-nums text-[13px]">
                {kandidat.no_pendaftaran_kipk}
              </span>
              <span className="text-[13px]">{kandidat.prodi_pendaftar}</span>
              {kandidat.jalur_masuk && (
                <Pill tone="neutral">{kandidat.jalur_masuk}</Pill>
              )}
            </div>
          </div>

          <div className="flex items-center gap-[10px]">
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 px-4 py-[10px] text-[13px] font-semibold text-admin-danger-text border border-admin-danger-border bg-admin-danger-bg-2 rounded-[11px] hover:bg-admin-danger-border transition-colors"
            >
              <Trash2 size={15} /> Hapus Evaluasi
            </button>
            <button
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className={`flex items-center gap-2 px-[18px] py-[10px] text-[13px] font-bold rounded-[11px] transition-colors disabled:opacity-60 ${
                saveStatus === "error"
                  ? "bg-admin-danger-bar text-white"
                  : "bg-admin-accent text-white hover:bg-admin-accent-hover"
              }`}
            >
              {saveStatus === "saving" ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : saveStatus === "saved" ? (
                <CheckCircle2 size={15} />
              ) : (
                <Save size={15} />
              )}
              {saveStatus === "saving"
                ? "Menyimpan..."
                : saveStatus === "saved"
                  ? "Tersimpan"
                  : "Simpan Perubahan"}
            </button>
          </div>
        </section>

        {/* Ringkasan cepat */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-[14px]">
          {detailChips.map((c) => (
            <article
              key={c.label}
              className="bg-white border border-admin-border rounded-2xl p-[15px_17px]"
            >
              <div className="text-[12px] tracking-[0.14em] uppercase text-admin-text-4">
                {c.label}
              </div>
              <div className="font-admin-heading text-[22px] font-semibold mt-[7px] text-admin-accent-ink truncate">
                {c.value}
              </div>
            </article>
          ))}
        </section>

        {/* Pewawancara Bertugas — bar lebar penuh */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-5 shadow-sm flex items-center justify-between gap-4 flex-wrap ${
            kandidat.pewawancara_data || kandidat.pewawancara_id
              ? "bg-white border-admin-border"
              : "bg-admin-surface-soft border-dashed border-admin-border"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-admin-accent/8 flex items-center justify-center shrink-0">
              <UserCheck size={16} className="text-admin-accent" />
            </div>
            <div>
              <h3 className="font-admin-heading font-bold text-admin-text text-sm">
                Pewawancara Bertugas
              </h3>
              {kandidat.pewawancara_data || kandidat.pewawancara_id ? (
                <p className="text-[12.5px] text-admin-text-3 mt-0.5">
                  {kandidat.pewawancara_data?.nama ||
                    `Pewawancara ID: ${kandidat.pewawancara_id}`}
                  {kandidat.interviewed_at && (
                    <>
                      {" "}
                      · Diwawancara{" "}
                      {new Date(kandidat.interviewed_at).toLocaleDateString(
                        "id-ID",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                    </>
                  )}
                </p>
              ) : (
                <p className="text-[12.5px] text-admin-text-3 italic mt-0.5">
                  Belum ada pewawancara yang ditugaskan
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowTugaskan(true)}
            className="flex items-center gap-1.5 px-3 py-1.75 text-[12px] font-semibold text-admin-accent-ink border border-admin-accent/30 bg-admin-accent/7 rounded-[10px] hover:bg-admin-accent/13 transition-colors shrink-0"
          >
            <UserPlus size={13} />{" "}
            {kandidat.pewawancara_data?.nama ? "Ganti" : "Tugaskan"}
          </button>
        </motion.div>

        {/* Data Mahasiswa | Data Hasil Wawancara Lapangan — sejajar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Data mahasiswa — lengkap, read-only */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-admin-surface-soft rounded-2xl border border-admin-border p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Eye size={14} className="text-admin-text-3" />
              <p className="text-xs font-bold text-admin-text-3 uppercase tracking-wider">
                Data Mahasiswa — Hanya Baca
              </p>
            </div>

            <div className="space-y-5">
              {/* Identitas */}
              <div>
                <SectionHeader title="Identitas" />
                <div className="grid grid-cols-2 gap-3">
                  <ReadField
                    label="No. Pendaftaran KIPK"
                    value={kandidat.no_pendaftaran_kipk}
                  />
                  <ReadField label="No. KIP" value={kandidat.no_kip} />
                  <ReadField label="No. KKS" value={kandidat.no_kks} />
                  <ReadField label="NIK" value={kandidat.nik} />
                  <ReadField
                    label="No. Kartu Keluarga"
                    value={kandidat.no_kartu_keluarga}
                  />
                  <ReadField label="NISN" value={kandidat.nisn} />
                  <ReadField
                    label="Kota/Kabupaten Asal"
                    value={kandidat.kab_kota}
                  />
                  <ReadField label="No. HP Aktif" value={kandidat.no_hp} />
                </div>
              </div>

              {/* Status Sosial */}
              <div>
                <SectionHeader title="Status Sosial Ekonomi" />
                <div className="grid grid-cols-2 gap-3">
                  <ReadField label="Status DTSEN" value={kandidat.aktif_dtsen} />
                  <ReadField
                    label="Jumlah Tanggungan"
                    value={kandidat.jumlah_tanggungan}
                  />
                  <ReadField
                    label="Orang Tinggal di Rumah"
                    value={kandidat.jumlah_orang_rumah}
                  />
                  <ReadField
                    label="Kondisi Rumah"
                    value={kandidat.kondisi_rumah}
                  />
                </div>
              </div>

              {/* Pekerjaan & Penghasilan */}
              <div>
                <SectionHeader title="Pekerjaan & Penghasilan (Awal)" />
                <div className="grid grid-cols-2 gap-3">
                  <ReadField
                    label="Pekerjaan Bapak/Wali"
                    value={kandidat.pekerjaan_ayah}
                  />
                  <ReadField
                    label="Penghasilan Bapak/Wali"
                    value={
                      kandidat.penghasilan_ayah
                        ? fmt.format(Number(kandidat.penghasilan_ayah))
                        : "—"
                    }
                  />
                  <ReadField
                    label="Pekerjaan Ibu"
                    value={kandidat.pekerjaan_ibu}
                  />
                  <ReadField
                    label="Penghasilan Ibu"
                    value={
                      kandidat.penghasilan_ibu
                        ? fmt.format(Number(kandidat.penghasilan_ibu))
                        : "—"
                    }
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Data yang diisi pewawancara — READ ONLY untuk admin */}
          {hasWawancaraData ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-admin-surface-soft rounded-2xl border border-admin-border p-5"
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-admin-text-3" />
                  <p className="text-xs font-bold text-admin-text-3 uppercase tracking-wider">
                    Data Hasil Wawancara Lapangan
                  </p>
                </div>
                <Pill tone="accent">Diisi pewawancara</Pill>
              </div>

              <div className="space-y-5">
                {/* Validasi Dokumen */}
                <div>
                  <SectionHeader title="Validasi Kepemilikan Dokumen" />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-admin-text-3 mb-1">
                        KKS
                      </p>
                      <Badge value={kandidat.validasi_kks} type="validasi" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-admin-text-3 mb-1">
                        KIP
                      </p>
                      <Badge value={kandidat.validasi_kip} type="validasi" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-admin-text-3 mb-1">
                        SKTM
                      </p>
                      <Badge value={kandidat.validasi_sktm} type="validasi" />
                    </div>
                  </div>
                </div>

                {/* Validasi Penghasilan Riil */}
                <div>
                  <SectionHeader title="Validasi Penghasilan Riil" />
                  <div className="grid grid-cols-2 gap-4">
                    <ReadField
                      label="Ket. Pekerjaan Ayah"
                      value={kandidat.ket_pekerjaan_ayah}
                    />
                    <ReadField
                      label="Penghasilan Ayah/bln"
                      value={
                        kandidat.ket_penghasilan_ayah
                          ? fmt.format(kandidat.ket_penghasilan_ayah)
                          : null
                      }
                    />
                    <ReadField
                      label="Ket. Pekerjaan Ibu"
                      value={kandidat.ket_pekerjaan_ibu}
                    />
                    <ReadField
                      label="Penghasilan Ibu/bln"
                      value={
                        kandidat.ket_penghasilan_ibu
                          ? fmt.format(kandidat.ket_penghasilan_ibu)
                          : null
                      }
                    />
                    <ReadField
                      label="Penghasilan Lain/bln"
                      value={
                        kandidat.penghasilan_lain
                          ? fmt.format(kandidat.penghasilan_lain)
                          : "Rp 0"
                      }
                    />
                    <ReadField
                      label="Tanggungan Sebenarnya"
                      value={kandidat.jml_tanggungan_sebenarnya}
                    />
                    <ReadField
                      label="Orang Tinggal di Rumah"
                      value={kandidat.validasi_orang_rumah}
                    />
                    <ReadField
                      label="Sosial Media"
                      value={kandidat.sosial_media}
                    />
                  </div>
                </div>

                {/* Kondisi Tempat Tinggal Riil */}
                <div>
                  <SectionHeader title="Kondisi Tempat Tinggal Riil" icon={Home} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <ReadField
                      label="Kepemilikan Rumah"
                      value={
                        kandidat.kepemilikan_rumah
                          ? (KEPEMILIKAN_LABEL[
                              Number(kandidat.kepemilikan_rumah)
                            ] ?? kandidat.kepemilikan_rumah)
                          : null
                      }
                    />
                    <ReadField
                      label="Tahun Perolehan"
                      value={kandidat.tahun_perolehan}
                    />
                    <ReadField
                      label="Luas Tanah (m²)"
                      value={kandidat.luas_tanah}
                    />
                    <ReadField
                      label="Luas Bangunan (m²)"
                      value={kandidat.luas_bangunan}
                    />
                    <ReadField
                      label="Sumber Air"
                      value={
                        kandidat.sumber_air
                          ? (SUMBER_AIR_LABEL[Number(kandidat.sumber_air)] ??
                            kandidat.sumber_air)
                          : null
                      }
                    />
                    <ReadField
                      label="MCK"
                      value={
                        kandidat.mck
                          ? (MCK_LABEL[Number(kandidat.mck)] ?? kandidat.mck)
                          : null
                      }
                    />
                    <ReadField
                      label="Jarak Pusat Kota"
                      value={
                        kandidat.jarak_pusat_kota
                          ? `${kandidat.jarak_pusat_kota} km`
                          : null
                      }
                    />
                    <ReadField
                      label="Kondisi Rumah"
                      value={kandidat.kondisi_rumah}
                    />
                  </div>
                  {kandidat.aset && (
                    <div className="mt-3">
                      <ReadField label="Aset yang Dimiliki" value={kandidat.aset} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-admin-surface-soft rounded-2xl border border-dashed border-admin-border p-10 text-center flex flex-col items-center justify-center"
            >
              <ClipboardList size={32} className="text-admin-text-6 mb-3" />
              <p className="text-admin-text-4 font-medium">
                Pewawancara belum mengisi data lapangan.
              </p>
            </motion.div>
          )}
        </div>

        {/* Rekomendasi Wawancara | Ringkasan Keputusan + Riwayat Kandidat — sejajar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Form admin — rekomendasi & hasil akhir */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-admin-border shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-admin-accent/8 flex items-center justify-center">
                <ClipboardList size={16} className="text-admin-accent" />
              </div>
              <div>
                <h3 className="font-admin-heading font-bold text-admin-text text-sm">
                  Rekomendasi Wawancara
                </h3>
                <p className="text-[11px] text-admin-text-3">
                  Rekomendasi pewawancara berdasarkan keputusan panitia.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Pilih Rekomendasi (4 opsi) */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-3 mb-1.5">
                  Rekomendasi <span className="text-admin-danger-bar">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {REKOMENDASI_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          rekomendasi: opt.value,
                          // Reset hasil_akhir saat rekomendasi berubah
                          hasil_akhir: autoHasilAkhir(opt.value) ?? "",
                        }))
                      }
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        form.rekomendasi === opt.value
                          ? opt.active
                          : opt.inactive
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {form.rekomendasi && (
                  <p className="text-[11px] text-admin-text-3 mt-1.5">
                    Dipilih:{" "}
                    <span className="font-semibold">{form.rekomendasi}</span>
                  </p>
                )}
              </div>

              {/* Hasil Akhir — auto jika Layak/Tidak Layak, manual jika Dipertimbangkan */}
              <div
                className={`rounded-xl p-4 border ${perluReview ? "border-admin-warn-border bg-admin-warn-bg-2" : "border-admin-border-soft bg-admin-surface-soft"}`}
              >
                <label className="block text-xs font-semibold text-admin-text-3 mb-1.5">
                  Hasil Akhir
                  {perluReview && (
                    <span className="text-admin-warn-text ml-1">
                      — Perlu Keputusan Admin
                    </span>
                  )}
                </label>
                {perluReview ? (
                  <>
                    <p className="text-xs text-admin-warn-text mb-3">
                      Rekomendasi <strong>{form.rekomendasi}</strong> memerlukan
                      tinjauan langsung. Pilih hasil akhir setelah meninjau data
                      wawancara.
                    </p>
                    <div className="flex gap-2">
                      {HASIL_AKHIR_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, hasil_akhir: opt.value }))
                          }
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            form.hasil_akhir === opt.value
                              ? opt.active
                              : opt.inactive
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {form.hasil_akhir && (
                      <p className="text-[11px] text-admin-text-3 mt-1.5">
                        Hasil Akhir:{" "}
                        <span className="font-semibold">{form.hasil_akhir}</span>
                      </p>
                    )}
                  </>
                ) : (
                  <div
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${
                      autoHasil === "Diusulkan"
                        ? "bg-admin-accent/20 text-admin-accent-ink"
                        : autoHasil === "Tidak Diusulkan"
                          ? "bg-admin-danger-border text-admin-danger-text"
                          : "bg-admin-border-soft text-admin-text-4"
                    }`}
                  >
                    {autoHasil ?? "Pilih rekomendasi dulu"}
                  </div>
                )}
              </div>

              {/* Catatan Admin */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-3 mb-1.5">
                  Catatan Admin
                </label>
                <textarea
                  value={form.catatan_admin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, catatan_admin: e.target.value }))
                  }
                  placeholder="Catatan tambahan untuk keputusan ini..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-xl focus:outline-none focus:border-admin-accent focus:ring-1 focus:ring-admin-accent/20 bg-admin-surface-soft resize-none transition-all"
                />
              </div>

              {/* Alasan (dari pewawancara) */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-3 mb-1.5">
                  Alasan Pewawancara
                </label>
                <textarea
                  value={form.alasan}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, alasan: e.target.value }))
                  }
                  placeholder="Alasan dari pewawancara..."
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-xl focus:outline-none focus:border-admin-accent focus:ring-1 focus:ring-admin-accent/20 bg-admin-surface-soft resize-none transition-all"
                />
              </div>
            </div>
          </motion.div>

          <div className="space-y-4">
            {/* Ringkasan Keputusan — insight heuristik */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl border border-admin-border shadow-sm p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-xl bg-admin-accent/8 flex items-center justify-center">
                  <ClipboardCheck size={16} className="text-admin-accent" />
                </div>
                <div>
                  <h3 className="font-admin-heading font-bold text-admin-text text-sm">
                    Ringkasan Keputusan
                  </h3>
                  <p className="text-[11px] text-admin-text-3">
                    Ringkasan dari data kandidat dan hasil wawancara.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl border border-admin-border-soft bg-admin-surface-soft p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-admin-text-4 mb-1">
                    Per Kapita
                  </p>
                  <p className="text-[15px] font-bold text-admin-text leading-snug">
                    {insight.perKapitaLabel.replace(" / bulan", "")}
                  </p>
                  <p className="text-[10.5px] text-admin-text-4 mt-0.5">
                    {insight.perKapitaFormula}
                  </p>
                </div>
                <div className="rounded-xl border border-admin-border-soft bg-admin-surface-soft p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-admin-text-4 mb-1">
                    Desil DTSEN
                  </p>
                  <p className="text-[15px] font-bold text-admin-text leading-snug">
                    {insight.desilAngka !== null
                      ? `Desil ${insight.desilAngka}`
                      : "Tidak diketahui"}
                  </p>
                  <p className="text-[10.5px] text-admin-text-4 mt-0.5">
                    {insight.desilCaption}
                  </p>
                </div>
                <div className="rounded-xl border border-admin-border-soft bg-admin-surface-soft p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-admin-text-4 mb-1">
                    Jarak Pusat Kota
                  </p>
                  <p className="text-[15px] font-bold text-admin-text leading-snug">
                    {insight.jarakKm !== null ? `${insight.jarakKm} km` : "—"}
                  </p>
                  <p className="text-[10.5px] text-admin-text-4 mt-0.5">
                    {insight.jarakCaption}
                  </p>
                </div>
              </div>

              <p className="text-[11.5px] text-admin-text-4">
                {polaSerupaCount > 0
                  ? `Ditemukan ${polaSerupaCount} kandidat lain dengan jalur, desil DTSEN, dan kepemilikan rumah yang sama.`
                  : "Belum ada kandidat lain dengan karakteristik yang sama pada data saat ini."}
              </p>
            </motion.div>

            {/* Riwayat Kandidat */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-admin-border shadow-sm p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <History size={14} className="text-admin-text-3" />
                <p className="text-xs font-bold text-admin-text-3 uppercase tracking-wider">
                  Riwayat Kandidat
                </p>
              </div>
              {riwayatItems.length > 0 ? (
                <Timeline items={riwayatItems} />
              ) : (
                <p className="text-xs text-admin-text-4 italic">
                  Belum ada aktivitas tercatat untuk kandidat ini.
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-admin-border shadow-xl p-6 max-w-sm w-full mx-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-admin-danger-bg flex items-center justify-center">
                <Trash2 size={18} className="text-admin-danger-bar" />
              </div>
              <h3 className="font-admin-heading font-bold text-admin-text">
                Hapus Hasil Wawancara?
              </h3>
            </div>
            <p className="text-sm text-admin-text-3 mb-5">
              Data laporan lapangan untuk{" "}
              <span className="font-semibold text-admin-text">
                {kandidat.nama_pendaftar}
              </span>{" "}
              akan dihapus permanen.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2.5 text-sm font-semibold border border-admin-border rounded-xl hover:bg-admin-surface-soft transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 text-sm font-semibold bg-admin-danger-bar text-white rounded-xl hover:bg-admin-danger-text transition-all"
              >
                Hapus
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tugaskan pewawancara modal */}
      <AnimatePresence>
        {showTugaskan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-admin-border shadow-xl w-full max-w-md"
            >
              <div className="flex items-center justify-between p-5 border-b border-admin-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-admin-accent/8 flex items-center justify-center">
                    <UserPlus size={16} className="text-admin-accent" />
                  </div>
                  <h3 className="font-admin-heading font-bold text-admin-text text-sm">
                    Tugaskan Pewawancara
                  </h3>
                </div>
                <button
                  onClick={() => setShowTugaskan(false)}
                  className="text-admin-text-3 hover:text-admin-text transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 max-h-[60vh] overflow-y-auto">
                {loadingPewawancara ? (
                  <div className="flex items-center justify-center py-8 text-admin-text-3">
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                ) : pewawancaraOptions.length === 0 ? (
                  <p className="text-xs text-admin-text-4 italic text-center py-8">
                    Belum ada pewawancara terdaftar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pewawancaraOptions.map((pw) => {
                      const isCurrent = kandidat.pewawancara_id === pw.id;
                      return (
                        <button
                          key={pw.id}
                          onClick={() => handleTugaskan(pw.id)}
                          disabled={assigningId !== null || isCurrent}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all disabled:cursor-default ${
                            isCurrent
                              ? "border-admin-accent/30 bg-admin-accent/[0.06]"
                              : "border-admin-border hover:border-admin-accent hover:bg-admin-surface-soft"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-admin-text">
                              {pw.nama}
                            </p>
                            <p className="text-[11px] text-admin-text-4">
                              {pw.total_assigned ?? 0} kandidat ditugaskan
                            </p>
                          </div>
                          {isCurrent ? (
                            <Pill tone="accent">Bertugas</Pill>
                          ) : assigningId === pw.id ? (
                            <Loader2
                              size={16}
                              className="animate-spin text-admin-accent"
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
