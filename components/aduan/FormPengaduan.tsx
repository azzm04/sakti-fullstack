"use client";

import { useState } from "react";

export default function FormPengaduan() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pesanSukses, setPesanSukses] = useState("");
  const [pesanError, setPesanError] = useState("");
  const [isAnonim, setIsAnonim] = useState(true);

  const [formData, setFormData] = useState({
    jenis_aduan: "",
    nama_pelapor: "",
    whatsapp_pelapor: "",
    nama_terlapor: "",
    nim_terlapor: "",
    fakultas_prodi: "",
    angkatan: "",
    uraian_kronologi: "",
    url_bukti: "",
  });

  // FUNGSI VALIDASI REAL-TIME
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let newValue = value;

    // Blokir angka dan simbol untuk NAMA
    if (name === "nama_pelapor" || name === "nama_terlapor") {
      newValue = newValue.replace(/[^a-zA-Z\s]/g, ""); 
    }
    // Blokir huruf dan simbol untuk WA dan NIM
    else if (name === "whatsapp_pelapor" || name === "nim_terlapor") {
      newValue = newValue.replace(/[^0-9]/g, "");
    }

    setFormData({ ...formData, [name]: newValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPesanSukses("");
    setPesanError("");

    try {
      const payload = { ...formData, is_anonim: isAnonim };
      const response = await fetch("/api/aduan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        jenis_aduan: "", nama_pelapor: "", whatsapp_pelapor: "", nama_terlapor: "",
        nim_terlapor: "", fakultas_prodi: "", angkatan: "", uraian_kronologi: "", url_bukti: "",
      });
      setIsAnonim(true);
      
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
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <label className="block text-base font-bold text-slate-800 mb-4">
                Kategori Pengaduan <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none transition-all ${formData.jenis_aduan === 'KETIDAKTEPATAN' ? 'border-[#001349] ring-1 ring-[#001349]' : 'border-slate-300 hover:border-slate-400'}`}>
                  <input type="radio" name="jenis_aduan" value="KETIDAKTEPATAN" onChange={handleChange} checked={formData.jenis_aduan === "KETIDAKTEPATAN"} className="sr-only" required />
                  <span className="flex flex-1 flex-col">
                    <span className="block text-sm font-semibold text-slate-900">Ketidaktepatan Sasaran</span>
                    <span className="mt-1 text-xs text-slate-500">Penerima dinilai mampu secara ekonomi.</span>
                  </span>
                </label>

                <label className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none transition-all ${formData.jenis_aduan === 'PENYALAHGUNAAN' ? 'border-[#001349] ring-1 ring-[#001349]' : 'border-slate-300 hover:border-slate-400'}`}>
                  <input type="radio" name="jenis_aduan" value="PENYALAHGUNAAN" onChange={handleChange} checked={formData.jenis_aduan === "PENYALAHGUNAAN"} className="sr-only" required />
                  <span className="flex flex-1 flex-col">
                    <span className="block text-sm font-semibold text-slate-900">Penyalahgunaan Dana</span>
                    <span className="mt-1 text-xs text-slate-500">Dana tidak digunakan untuk pendidikan.</span>
                  </span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Identitas Pelapor</h3>
              <div className="mb-6 flex items-center">
                <input 
                  type="checkbox" id="is_anonim" checked={isAnonim} 
                  onChange={(e) => {
                    setIsAnonim(e.target.checked);
                    if(e.target.checked) setFormData({...formData, nama_pelapor: "", whatsapp_pelapor: ""});
                  }}
                  className="w-5 h-5 text-[#001349] border-slate-300 rounded focus:ring-[#001349]"
                />
                <label htmlFor="is_anonim" className="ml-3 text-sm font-semibold text-slate-700 cursor-pointer">
                  Rahasiakan identitas saya (Anonim)
                </label>
              </div>

              {!isAnonim && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap <span className="text-rose-500">*</span></label>
                    <input type="text" name="nama_pelapor" value={formData.nama_pelapor} onChange={handleChange} required={!isAnonim} placeholder="Nama Lengkap Anda"
                      className="mt-1 block w-full rounded-lg border-slate-300 py-3 px-4 text-slate-900 shadow-sm focus:border-[#001349] sm:text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nomor WhatsApp <span className="text-rose-500">*</span></label>
                    <input type="text" name="whatsapp_pelapor" value={formData.whatsapp_pelapor} onChange={handleChange} required={!isAnonim} placeholder="Contoh: 08123456789"
                      className="mt-1 block w-full rounded-lg border-slate-300 py-3 px-4 text-slate-900 shadow-sm focus:border-[#001349] sm:text-sm bg-white" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Informasi Terlapor</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Mahasiswa Terlapor <span className="text-rose-500">*</span></label>
                  <input type="text" name="nama_terlapor" value={formData.nama_terlapor} onChange={handleChange} required placeholder="Contoh: Budi Santoso"
                    className="mt-1 block w-full rounded-lg border-slate-300 py-3 px-4 text-slate-900 shadow-sm focus:border-[#001349] sm:text-sm bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">NIM Terlapor</label>
                  <input type="text" name="nim_terlapor" value={formData.nim_terlapor} onChange={handleChange} placeholder="Contoh: 21120120140xxx"
                    className="mt-1 block w-full rounded-lg border-slate-300 py-3 px-4 text-slate-900 shadow-sm focus:border-[#001349] sm:text-sm bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tahun Angkatan <span className="text-rose-500">*</span></label>
                  <select name="angkatan" value={formData.angkatan} onChange={handleChange} required
                    className="mt-1 block w-full rounded-lg border-slate-300 py-3 px-4 text-slate-900 shadow-sm focus:border-[#001349] sm:text-sm bg-slate-50">
                    <option value="" disabled>Pilih Angkatan...</option>
                    <option value="2022">2022</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Fakultas / Program Studi <span className="text-rose-500">*</span></label>
                  <input type="text" name="fakultas_prodi" value={formData.fakultas_prodi} onChange={handleChange} required placeholder="Contoh: Teknik Komputer - Fakultas Teknik"
                    className="mt-1 block w-full rounded-lg border-slate-300 py-3 px-4 text-slate-900 shadow-sm focus:border-[#001349] sm:text-sm bg-slate-50" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Detail Kronologi</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Uraian Pelanggaran <span className="text-rose-500">*</span></label>
                  <textarea name="uraian_kronologi" rows={5} value={formData.uraian_kronologi} onChange={handleChange} required minLength={50} placeholder="Tuliskan uraian detail..."
                    className="mt-1 block w-full rounded-lg border-slate-300 py-3 px-4 text-slate-900 shadow-sm focus:border-[#001349] sm:text-sm bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tautan Bukti Pendukung <span className="text-slate-400 font-normal">(Google Drive)</span></label>
                  <input type="url" name="url_bukti" value={formData.url_bukti} onChange={handleChange} placeholder="https://..."
                    className="mt-1 block w-full rounded-lg border-slate-300 py-3 px-4 text-slate-900 shadow-sm focus:border-[#001349] sm:text-sm bg-slate-50" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200">
              <div className="flex items-start mb-6">
                <input id="persetujuan" type="checkbox" required className="h-5 w-5 rounded border-slate-300 text-[#001349] mt-0.5" />
                <label htmlFor="persetujuan" className="ml-3 text-sm text-slate-700">Saya menyatakan bahwa informasi yang saya sampaikan dapat dipertanggungjawabkan dan bukan merupakan fitnah. <span className="text-rose-500">*</span></label>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-8 py-3.5 rounded-full shadow-md text-sm font-bold text-white bg-[#001349] hover:bg-[#001f70] disabled:opacity-50">
                {isSubmitting ? "Memproses..." : "Kirim Laporan Pengaduan"}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}