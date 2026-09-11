"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Loader2, FileText, X, UploadCloud, ExternalLink, AlertCircle } from "lucide-react";
import { useCurrentUser } from "@/hook/useCurrentUser";

interface PrestasiItem {
  id: string;
  jenis_prestasi: string;
  tingkat: string;
  nama_kegiatan: string;
  prestasi_dicapai: string;
  penyelenggara: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  url_bukti: string;
  status_verifikasi: string;
}

const TINGKAT_LABEL: Record<string, string> = {
  INTERNASIONAL: "Internasional",
  NASIONAL:      "Nasional",
  PROVINSI:      "Provinsi",
  KAB_KOTA:      "Kab/Kota",
  UNIVERSITAS:   "Universitas",
  FAKULTAS:      "Fakultas",
  PROGRAM_STUDI: "Program Studi",
};

const JENIS_LABEL: Record<string, string> = {
  AKADEMIK:              "Akademik",
  NON_AKADEMIK:          "Non-Akademik",
  ORGANISASI:            "Organisasi",
  KEPANITIAAN:           "Kepanitiaan",
  PENGABDIAN_MASYARAKAT: "Pengabdian Masyarakat",
};

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "TERVERIFIKASI") {
    return (
      <span className="inline-block px-2.5 py-0.5 font-roboto text-[11px] font-semibold rounded-[4px] bg-emerald-50 text-emerald-700 border border-emerald-200">
        Terverifikasi
      </span>
    );
  }
  return (
    <span className="inline-block px-2.5 py-0.5 font-roboto text-[11px] font-medium rounded-[4px] bg-slate-100 text-slate-500 border border-slate-200">
      Tercatat
    </span>
  );
}

function FormTambahPrestasi({
  userId,
  onClose,
  onSuccess,
}: {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    jenis_prestasi:   "AKADEMIK",
    tingkat:          "NASIONAL",
    nama_kegiatan:    "",
    prestasi_dicapai: "",
    penyelenggara:    "",
    tanggal_mulai:    "",
    tanggal_selesai:  "",
  });

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > 5 * 1024 * 1024) {
      setError("File terlalu besar. Maksimal 5 MB.");
      e.target.value = "";
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Dokumen bukti wajib dilampirkan."); return; }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("user_id", userId);
      fd.append("file_bukti", file);
      const res = await fetch("/api/mahasiswa/prestasi", { method: "POST", body: fd });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal menyimpan prestasi");
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const labelCls =
    "block font-roboto font-medium text-[13px] md:text-[14px] text-[#1A1A1A] mb-1.5 md:mb-2";

  const inputCls =
    "w-full px-4 py-[10px] bg-white border border-[#E0E0E0] rounded-[6px] font-roboto text-[14px] text-[#1A1A1A] placeholder-[#6B7280] focus:ring-1 focus:ring-[#003C71] focus:border-[#003C71] outline-none transition-all";

  const selectCls =
    "w-full pl-4 pr-9 py-[10px] appearance-none " +
    "bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23667085%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] " +
    "bg-[length:16px_16px] bg-[position:right_12px_center] bg-no-repeat " +
    "bg-white border border-[#E0E0E0] rounded-[6px] font-roboto text-[14px] text-[#1A1A1A] " +
    "focus:ring-1 focus:ring-[#003C71] focus:border-[#003C71] outline-none transition-all cursor-pointer";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="bg-white w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.10)] border border-[#E5EAF0]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="flex items-center justify-between px-8 py-5 border-b border-[#E5EAF0] sticky top-0 bg-white z-10">
          <div>
            <h2 id="dialog-title" className="font-roboto font-semibold text-[16px] text-[#1A1A1A]">
              Tambah Prestasi
            </h2>
            <p className="font-roboto text-[13px] text-[#6B7280] mt-0.5">
              Isi seluruh data dan lampirkan dokumen pendukung.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup dialog"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-[4px] hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-[6px] flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="font-roboto text-sm font-medium text-red-800 flex-1">{error}</p>
              <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Kategori <span className="text-red-500">*</span></label>
              <select name="jenis_prestasi" required value={form.jenis_prestasi} onChange={set} className={selectCls}>
                <option value="AKADEMIK">Akademik</option>
                <option value="NON_AKADEMIK">Non-Akademik</option>
                <option value="ORGANISASI">Organisasi</option>
                <option value="KEPANITIAAN">Kepanitiaan</option>
                <option value="PENGABDIAN_MASYARAKAT">Pengabdian Masyarakat</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Tingkat <span className="text-red-500">*</span></label>
              <select name="tingkat" required value={form.tingkat} onChange={set} className={selectCls}>
                <option value="INTERNASIONAL">Internasional</option>
                <option value="NASIONAL">Nasional</option>
                <option value="PROVINSI">Provinsi</option>
                <option value="KAB_KOTA">Kabupaten/Kota</option>
                <option value="UNIVERSITAS">Universitas</option>
                <option value="FAKULTAS">Fakultas</option>
                <option value="PROGRAM_STUDI">Program Studi</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Pencapaian <span className="text-red-500">*</span></label>
            <input type="text" name="prestasi_dicapai" required placeholder="Contoh: Juara 1, Finalis, Best Paper…" value={form.prestasi_dicapai} onChange={set} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Nama Kegiatan <span className="text-red-500">*</span></label>
            <input type="text" name="nama_kegiatan" required placeholder="Contoh: Lomba Karya Tulis Ilmiah Nasional Gemastik 2026" value={form.nama_kegiatan} onChange={set} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Penyelenggara <span className="text-red-500">*</span></label>
            <input type="text" name="penyelenggara" required placeholder="Contoh: Kemendikbudristek, Universitas Diponegoro…" value={form.penyelenggara} onChange={set} className={inputCls} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Tanggal Mulai <span className="text-red-500">*</span></label>
              <input type="date" name="tanggal_mulai" required value={form.tanggal_mulai} onChange={set} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tanggal Selesai <span className="text-red-500">*</span></label>
              <input type="date" name="tanggal_selesai" required value={form.tanggal_selesai} onChange={set} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Dokumen Bukti <span className="text-red-500">*</span></label>
            <p className="font-roboto text-[12px] text-[#6B7280] mb-3">
              Upload sertifikat, piagam, atau dokumen pendukung lainnya.
            </p>
            {file ? (
              <div className="flex items-center justify-between p-3 bg-white border border-[#E2E8F0] rounded-[8px] hover:border-[#CBD5E1] transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="text-[#64748B] shrink-0" size={18} strokeWidth={1.5} />
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <p className="font-roboto text-[13px] font-medium text-[#1E293B] truncate">{file.name}</p>
                    <p className="font-roboto text-[11px] text-[#94A3B8]">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="flex items-center justify-center w-7 h-7 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-[4px] transition-colors shrink-0 ml-2"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <label
                htmlFor="file-bukti-prestasi"
                className="flex flex-col items-center justify-center w-full py-8 px-4 bg-white border border-dashed border-[#CBD5E1] rounded-[6px] cursor-pointer hover:border-[#003C71] hover:bg-[#F8FAFC] transition-colors group"
              >
                <div className="mb-3 text-[#94A3B8] group-hover:text-[#003C71] transition-colors">
                  <UploadCloud className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <p className="mb-1 font-roboto text-[14px] font-medium text-[#1E293B]">Unggah dokumen bukti</p>
                <p className="font-roboto text-[12px] text-[#64748B]">JPG, PNG atau PDF • Maks. 5 MB</p>
                <input id="file-bukti-prestasi" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-[10px] font-roboto text-[14px] font-medium text-[#6B7280] hover:text-[#1A1A1A] hover:bg-slate-50 rounded-[6px] transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-[10px] font-roboto text-[14px] font-semibold text-white bg-[#00529B] hover:bg-[#003C71] rounded-[6px] transition-all disabled:opacity-60"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Simpan Prestasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PrestasiClient() {
  const { user } = useCurrentUser();
  const [prestasiList, setPrestasiList] = useState<PrestasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const userId = user?.id ?? null;

  const fetchPrestasi = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/mahasiswa/prestasi?userId=${userId}`);
      if (res.ok) {
        const json = await res.json();
        setPrestasiList(json.data ?? []);
      }
    } catch (err) {
      console.error("Gagal mengambil data prestasi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrestasi(); }, [userId]);

  const stats = useMemo(() => ({
    total:         prestasiList.length,
    akademik:      prestasiList.filter((p) => p.jenis_prestasi === "AKADEMIK").length,
    nonAkademik:   prestasiList.filter((p) => p.jenis_prestasi === "NON_AKADEMIK").length,
    terverifikasi: prestasiList.filter((p) => p.status_verifikasi === "TERVERIFIKASI").length,
  }), [prestasiList]);

  const handleSuccess = () => { setIsFormOpen(false); fetchPrestasi(); };

  return (
    <div className="min-h-screen bg-[#F7F9FC]" style={{ fontFamily: "Roboto, sans-serif" }}>
      <div className="max-w-4xl mx-auto pt-10 md:pt-12 pb-16 px-4 sm:px-6 space-y-6">

        <div className="pb-6 border-b border-[#E5EAF0]">
          <h1 className="font-roboto font-bold text-[28px] md:text-[30px] text-[#0F172A] leading-tight tracking-tight">
            Pendataan Prestasi
          </h1>
          <p className="font-roboto text-[14px] md:text-[15px] text-[#64748B] mt-2 leading-relaxed">
            Laporkan pencapaian akademik maupun non-akademik Anda selama menjadi penerima KIP-Kuliah.
          </p>
        </div>

        <div className="bg-white rounded-[8px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-[#E5EAF0] p-10 md:p-12">
          {!loading && (
            <p className="font-roboto text-[13px] text-[#6B7280] mb-8">
              {stats.total === 0 ? (
                "Belum ada prestasi yang tercatat."
              ) : (
                <>
                  <span className="text-[#1A1A1A] font-medium">{stats.total}</span> prestasi tercatat
                  {" · "}
                  <span className="text-[#1A1A1A] font-medium">{stats.akademik}</span> akademik
                  {" · "}
                  <span className="text-[#1A1A1A] font-medium">{stats.nonAkademik}</span> non-akademik
                  {" · "}
                  <span className="text-[#1A1A1A] font-medium">{stats.terverifikasi}</span> terverifikasi
                </>
              )}
            </p>
          )}

          <div className="flex items-center justify-between mb-5 md:mb-6">
            <div>
              <h2 className="font-roboto font-semibold text-[15px] md:text-[16px] text-[#1A1A1A]">
                Daftar Prestasi
              </h2>
              <p className="font-roboto text-[13px] text-[#6B7280] mt-0.5">
                Catat dan kelola pencapaian selama masa studi.
              </p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-[9px] font-roboto text-[14px] font-semibold text-white bg-[#00529B] hover:bg-[#003C71] rounded-[6px] transition-all"
            >
              <Plus size={16} />
              Tambah Prestasi
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-[#6B7280]">
              <Loader2 size={18} className="animate-spin text-[#00529B]" />
              <span className="font-roboto text-[14px]">Memuat data…</span>
            </div>
          ) : prestasiList.length === 0 ? (
            <div className="py-14 text-center">
              <p className="font-roboto font-medium text-[15px] text-[#1A1A1A] mb-1">
                Belum ada prestasi tercatat
              </p>
              <p className="font-roboto text-[13px] text-[#6B7280] mb-6 max-w-sm mx-auto">
                Tambahkan pencapaian Anda — akademik, lomba, organisasi, maupun pengabdian masyarakat.
              </p>
              <button
                onClick={() => setIsFormOpen(true)}
                className="font-roboto text-[14px] font-semibold text-[#00529B] hover:underline underline-offset-2"
              >
                + Tambah prestasi pertama
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-10 md:-mx-12">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-y border-[#E5EAF0] bg-[#F8FAFC]">
                    <th className="px-10 md:px-12 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider">Pencapaian</th>
                    <th className="px-5 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Tingkat</th>
                    <th className="px-5 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Tanggal</th>
                    <th className="px-5 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-5 pr-10 md:pr-12 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Bukti</th>
                  </tr>
                </thead>
                <tbody>
                  {prestasiList.map((item) => (
                    <tr key={item.id} className="border-b border-[#F0F4F8] last:border-b-0 hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-10 md:px-12 py-4 max-w-[280px]">
                        <p className="font-roboto font-semibold text-[14px] text-[#1A1A1A] leading-snug">{item.prestasi_dicapai}</p>
                        <p className="font-roboto text-[13px] text-[#6B7280] mt-0.5 truncate">{item.nama_kegiatan}</p>
                        <span className="mt-1 inline-block font-roboto text-[12px] text-[#94A3B8]">
                          {JENIS_LABEL[item.jenis_prestasi] ?? item.jenis_prestasi}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-roboto text-[13px] text-[#374151]">
                          {TINGKAT_LABEL[item.tingkat] ?? item.tingkat}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="font-roboto text-[13px] text-[#1A1A1A]">{formatTanggal(item.tanggal_mulai)}</p>
                        <p className="font-roboto text-[12px] text-[#94A3B8] mt-0.5 max-w-[160px] truncate">{item.penyelenggara}</p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status_verifikasi} />
                      </td>
                      <td className="px-5 pr-10 md:pr-12 py-4 whitespace-nowrap">
                        {item.url_bukti ? (
                          <a
                            href={item.url_bukti}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-roboto text-[13px] font-medium text-[#00529B] hover:underline underline-offset-2 transition-colors"
                          >
                            Lihat
                            <ExternalLink size={12} strokeWidth={2} />
                          </a>
                        ) : (
                          <span className="font-roboto text-[13px] text-[#CBD5E1]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isFormOpen && userId && (
        <FormTambahPrestasi
          userId={userId}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
