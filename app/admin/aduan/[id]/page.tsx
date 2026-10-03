import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import UbahStatus from "./UbahStatus";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { BUKTI_CONFIG } from "@/lib/aduan/bukti-config";

export default async function DetailAduanAdmin({ params }: { params: Promise<{ id: string }> }) {
  // 1. Ambil ID dari URL (wajib di-await di Next.js terbaru)
  const { id } = await params;

  // 2. Cari data aduan beserta buktinya
  const aduan = await prisma.aduan.findUnique({
    where: { id },
    include: {
      bukti: { orderBy: { created_at: "asc" } },
      admin: { select: { nama: true } },
    },
  });

  // 3. Jika ID ngawur/tidak ada, tampilkan halaman 404 Not Found
  if (!aduan) {
    notFound();
  }

  // 4. Tautan sementara (berlaku 1 jam) karena bucket bersifat privat
  let urlByPath = new Map<string, string>();
  const paths = aduan.bukti.map((b) => b.path_file);
  if (paths.length > 0) {
    const { data } = await supabaseAdmin.storage
      .from(BUKTI_CONFIG.BUCKET)
      .createSignedUrls(paths, 60 * 60);
    urlByPath = new Map(
      (data ?? []).flatMap((s) =>
        s.path && s.signedUrl ? [[s.path, s.signedUrl] as [string, string]] : []
      )
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans pb-20">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Navigasi Kembali */}
        <Link href="/admin/aduan" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          &larr; Kembali ke Daftar Laporan
        </Link>

        {/* Header Kartu */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-[#001349] text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Kode Resi Laporan</p>
              <h1 className="text-2xl font-black">{aduan.kode_laporan}</h1>
              <p className="mt-1 text-xs text-blue-200">
                Ditangani oleh: {aduan.admin?.nama ?? "Belum ditangani"}
              </p>
            </div>

            {/* Memanggil Komponen Ubah Status */}
            <div className="flex flex-col items-start md:items-end gap-1">
              <span className="text-xs text-blue-200 font-medium">Ubah Status Laporan:</span>
              <UbahStatus id={aduan.id} currentStatus={aduan.status} />
            </div>
          </div>

          <div className="p-8 space-y-10">

            {/* Bagian 1: Identitas Pelapor */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">1. Identitas Pelapor</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Nama Pelapor</p>
                  <p className={`font-semibold mt-1 ${aduan.is_anonim ? 'text-slate-500 italic' : 'text-slate-900'}`}>
                    {aduan.is_anonim ? '🕵️ Dirahasiakan (Anonim)' : aduan.nama_pelapor}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Nomor WhatsApp</p>
                  <p className="font-semibold text-slate-900 mt-1">
                    <a href={`https://wa.me/${aduan.whatsapp_pelapor}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline">
                      {aduan.whatsapp_pelapor}
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase no-underline">
                        Hubungi
                      </span>
                    </a>
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Email</p>
                  <p className="font-semibold text-slate-900 mt-1">
                    {aduan.email_pelapor ? (
                      <a href={`mailto:${aduan.email_pelapor}`} className="text-blue-600 hover:underline">
                        {aduan.email_pelapor}
                      </a>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* Bagian 2: Terlapor & Kategori */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">2. Informasi Terlapor</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Nama Terlapor</p>
                  <p className="font-semibold text-slate-900 mt-1">{aduan.nama_terlapor}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">NIM / Angkatan</p>
                  <p className="font-semibold text-slate-900 mt-1">{aduan.nim_terlapor || '-'} / {aduan.angkatan}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Fakultas / Program Studi</p>
                  <p className="font-semibold text-slate-900 mt-1">{aduan.fakultas_prodi}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Kategori Pelanggaran</p>
                  <p className="font-bold text-rose-600 mt-1">
                    {aduan.jenis_aduan === 'KETIDAKTEPATAN' ? 'Ketidaktepatan Sasaran (Mampu Secara Ekonomi)' : 'Penyalahgunaan Dana (Tidak untuk Pendidikan)'}
                  </p>
                </div>
              </div>
            </section>

            {/* Bagian 3: Kronologi & Bukti */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">3. Detail Kronologi & Bukti</h2>

              <div className="bg-white border border-slate-300 p-5 rounded-xl text-slate-700 leading-relaxed whitespace-pre-wrap text-sm shadow-inner mb-6">
                {aduan.uraian_kronologi}
              </div>

              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2">
                  Bukti Pendukung ({aduan.bukti.length} file)
                </p>
                {aduan.bukti.length > 0 ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {aduan.bukti.map((b) => {
                      const url = urlByPath.get(b.path_file);
                      const isGambar = b.mime_type.startsWith("image/");
                      return (
                        <li key={b.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                          {isGambar && url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt={b.nama_file} className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-rose-100 text-xs font-black text-rose-600">
                              PDF
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">{b.nama_file}</p>
                            <p className="text-xs text-slate-500">{(b.ukuran / 1024 / 1024).toFixed(2)} MB</p>
                            {url && (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline">
                                Buka file &rarr;
                              </a>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="inline-block rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm italic text-slate-500">
                    Tidak ada bukti terlampir.
                  </p>
                )}
              </div>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
}