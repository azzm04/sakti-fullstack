"use client";

import { useState } from "react";

export default function FormPengaduan() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pesanSukses, setPesanSukses] = useState("");
  const [pesanError, setPesanError] = useState("");

  const [formData, setFormData] = useState({
    jenis_aduan: "",
    nama_terlapor: "",
    nim_terlapor: "",
    fakultas_prodi: "",
    angkatan: "",
    uraian_kronologi: "",
    url_bukti: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPesanSukses("");
    setPesanError("");

    try {
      const response = await fetch("/api/aduan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error && typeof result.error === "object") {
          const firstError = Object.values(result.error)[0] as string[];
          throw new Error(firstError[0] || "Terjadi kesalahan pada data yang dikirim.");
        }
        throw new Error(result.error || "Gagal mengirim laporan.");
      }

      setPesanSukses(`Berhasil! Kode resi Anda: ${result.data.kode_laporan}`);
      setFormData({
        jenis_aduan: "",
        nama_terlapor: "",
        nim_terlapor: "",
        fakultas_prodi: "",
        angkatan: "",
        uraian_kronologi: "",
        url_bukti: "",
      });
    } catch (error: any) {
      setPesanError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="-mt-20 relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 sm:p-10">
          
          {/* Status Messages */}
          {pesanSukses && (
            <div className="mb-8 p-5 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-r-lg shadow-sm flex items-center">
              <svg className="w-6 h-6 mr-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              <div className="font-medium">{pesanSukses}</div>
            </div>
          )}
          {pesanError && (
            <div className="mb-8 p-5 bg-rose-50 border-l-4 border-rose-500 text-rose-800 rounded-r-lg shadow-sm flex items-center">
              <svg className="w-6 h-6 mr-3 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div className="font-medium">{pesanError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section: Jenis Laporan */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <label className="block text-base font-bold text-slate-800 mb-4">
                Kategori Pengaduan <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none transition-all ${formData.jenis_aduan === 'KETIDAKTEPATAN' ? 'border-[#0b1727] ring-1 ring-[#0b1727]' : 'border-slate-300 hover:border-slate-400'}`}>
                  <input type="radio" name="jenis_aduan" value="KETIDAKTEPATAN" onChange={handleChange} checked={formData.jenis_aduan === "KETIDAKTEPATAN"} className="sr-only" required />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-semibold text-slate-900">Ketidaktepatan Sasaran</span>
                      <span className="mt-1 flex items-center text-xs text-slate-500">Penerima dinilai mampu secara ekonomi.</span>
                    </span>
                  </span>
                  <svg className={`h-5 w-5 ${formData.jenis_aduan === 'KETIDAKTEPATAN' ? 'text-[#0b1727]' : 'text-transparent'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                </label>

                <label className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none transition-all ${formData.jenis_aduan === 'PENYALAHGUNAAN' ? 'border-[#0b1727] ring-1 ring-[#0b1727]' : 'border-slate-300 hover:border-slate-400'}`}>
                  <input type="radio" name="jenis_aduan" value="PENYALAHGUNAAN" onChange={handleChange} checked={formData.jenis_aduan === "PENYALAHGUNAAN"} className="sr-only" required />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-semibold text-slate-900">Penyalahgunaan Dana</span>
                      <span className="mt-1 flex items-center text-xs text-slate-500">Dana tidak digunakan untuk pendidikan.</span>
                    </span>
                  </span>
                  <svg className={`h-5 w-5 ${formData.jenis_aduan === 'PENYALAHGUNAAN' ? 'text-[#0b1727]' : 'text-transparent'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                </label>
              </div>
            </div>

            {/* Section: Identitas Terlapor */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Informasi Terlapor</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label htmlFor="nama_terlapor" className="block text-sm font-semibold text-slate-700 mb-1">
                    Nama Mahasiswa Terlapor <span className="text-rose-500">*</span>
                  </label>
                  <input type="text" name="nama_terlapor" id="nama_terlapor" value={formData.nama_terlapor} onChange={handleChange} required placeholder="Contoh: Budi Santoso"
                    className="mt-1 block w-full rounded-lg border-slate-300 py-3 px-4 text-slate-900 shadow-sm focus:border-[#0b1727] focus:ring-[#0b1727] sm:text-sm bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="nim_terlapor" className="block text-sm font-semibold text-slate-700 mb-1">
                    NIM Terlapor <span className="text-slate-400 font-normal">(Jika diketahui)</span>
                  </label>
                  <input type="text" name="nim_terlapor" id="nim_terlapor" value={formData.nim_terlapor} onChange={handleChange} placeholder="Contoh: 21120120140xxx"
                    className="mt-1 block w-full rounded-lg border-slate-300 py-3 px-4 text-slate-900 shadow-sm focus:border-[#0b1727] focus:ring-[#0b1727] sm:text-sm bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="angkatan" className="block text-sm font-semibold text-slate-700 mb-1">
                    Tahun Angkatan <span className="text-rose-500">*</span>
                  </label>
                  <select name="angkatan" id="angkatan" value={formData.angkatan} onChange={handleChange} required
                    className="mt-1 block w-full rounded-lg border-slate-300 py-3 px-4 text-slate-900 shadow-sm focus:border-[#0b1727] focus:ring-[#0b1727] sm:text-sm bg-slate-50 focus:bg-white transition-colors">
                    <option value="" disabled>Pilih Angkatan...</option>
                    <option value="2022">2022</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="fakultas_prodi" className="block text-sm font-semibold text-slate-700 mb-1">
                    Fakultas / Program Studi <span className="text-rose-500">*</span>
                  </label>
                  <input type="text" name="fakultas_prodi" id="fakultas_prodi" value={formData.fakultas_prodi} onChange={handleChange} required placeholder="Contoh: Teknik Komputer - Fakultas Teknik"
                    className="mt-1 block w-full rounded-lg border-slate-300 py-3 px-4 text-slate-900 shadow-sm focus:border-[#0b1727] focus:ring-[#0b1727] sm:text-sm bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Section: Detail Pengaduan */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Detail Kronologi</h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="uraian_kronologi" className="block text-sm font-semibold text-slate-700 mb-1">
                    Uraian Pelanggaran <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Uraikan dengan detail mengapa terlapor tidak tepat sasaran. (Minimal 150 karakter, idealnya 3 paragraf).
                  </p>
                  <textarea name="uraian_kronologi" id="uraian_kronologi" rows={5} value={formData.uraian_kronologi} onChange={handleChange} required minLength={150} placeholder="Tuliskan uraian detailnya di sini..."
                    className="mt-1 block w-full rounded-lg border-slate-300 py-3 px-4 text-slate-900 shadow-sm focus:border-[#0b1727] focus:ring-[#0b1727] sm:text-sm bg-slate-50 focus:bg-white transition-colors"
                  />
                  <div className={`text-right text-xs mt-2 font-medium ${formData.uraian_kronologi.length < 150 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {formData.uraian_kronologi.length < 150 
                      ? `Karakter: ${formData.uraian_kronologi.length} (Kurang ${150 - formData.uraian_kronologi.length} karakter lagi)` 
                      : `Karakter: ${formData.uraian_kronologi.length} (Memenuhi batas minimal)`}
                  </div>
                </div>

                <div>
                  <label htmlFor="url_bukti" className="block text-sm font-semibold text-slate-700 mb-1">
                    Tautan Bukti Pendukung <span className="text-slate-400 font-normal">(Google Drive / Lainnya)</span>
                  </label>
                  <input type="url" name="url_bukti" id="url_bukti" value={formData.url_bukti} onChange={handleChange} placeholder="https://drive.google.com/drive/folders/..."
                    className="mt-1 block w-full rounded-lg border-slate-300 py-3 px-4 text-slate-900 shadow-sm focus:border-[#0b1727] focus:ring-[#0b1727] sm:text-sm bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Persetujuan & Tombol Submit */}
            <div className="pt-6 border-t border-slate-200">
              <div className="flex items-start mb-6">
                <div className="flex items-center h-5">
                  <input id="persetujuan" name="persetujuan" type="checkbox" required className="h-5 w-5 rounded border-slate-300 text-[#0b1727] focus:ring-[#0b1727]" />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="persetujuan" className="font-medium text-slate-700">Pernyataan Keabsahan Informasi <span className="text-rose-500">*</span></label>
                  <p className="text-slate-500 mt-1">Saya menyatakan bahwa informasi yang saya sampaikan dapat dipertanggungjawabkan dan bukan merupakan fitnah.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto sm:min-w-[250px] flex justify-center items-center py-3.5 px-6 border border-transparent rounded-full shadow-md text-sm font-bold text-white bg-[#0b1727] hover:bg-[#152740] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0b1727] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Memproses Laporan...
                  </>
                ) : (
                  "Kirim Laporan Pengaduan"
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}