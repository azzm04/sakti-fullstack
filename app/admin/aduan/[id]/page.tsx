import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { BUKTI_CONFIG } from "@/lib/aduan/bukti-config";
import { requireAdminRole } from "@/lib/auth-server";
import UbahStatus from "./UbahStatus";

const STATUS: Record<string, { label: string; dot: string }> = {
  MENUNGGU: { label: "Menunggu", dot: "bg-amber-400" },
  DIPROSES: { label: "Diproses", dot: "bg-sky-400" },
  SELESAI: { label: "Selesai", dot: "bg-emerald-400" },
  DITOLAK: { label: "Ditolak", dot: "bg-rose-400" },
};

const KATEGORI: Record<string, { label: string; desc: string; warna: string }> = {
  KETIDAKTEPATAN: {
    label: "Ketidaktepatan Sasaran",
    desc: "Penerima dinilai mampu secara ekonomi",
    warna: "text-amber-700",
  },
  PENYALAHGUNAAN: {
    label: "Penyalahgunaan Dana",
    desc: "Dana tidak digunakan untuk pendidikan",
    warna: "text-rose-700",
  },
};

const tgl = (d: Date) =>
  d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// wa.me memerlukan kode negara, sehingga 08xx diubah menjadi 628xx
const waLink = (no: string) => {
  const n = no.replace(/\D/g, "");
  return `https://wa.me/${n.startsWith("0") ? "62" + n.slice(1) : n}`;
};

const ukuran = (b: number) =>
  b >= 1024 * 1024
    ? `${(b / 1024 / 1024).toFixed(2)} MB`
    : `${Math.max(1, Math.round(b / 1024))} KB`;

function Bagian({ judul, children }: { judul: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {judul}
      </h2>
      {children}
    </section>
  );
}

function Baris({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export default async function DetailAduanAdmin({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Halaman ini membuat tautan bukti yang sensitif, jadi sesi admin diperiksa di sini juga
  await requireAdminRole();

  const { id } = await params;

  const aduan = await prisma.aduan.findUnique({
    where: { id },
    include: {
      bukti: { orderBy: { created_at: "asc" } },
      admin: { select: { nama: true } },
    },
  });

  if (!aduan) notFound();

  // Tautan sementara (berlaku 1 jam) karena bucket bersifat privat
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

  const status = STATUS[aduan.status] ?? STATUS.MENUNGGU;
  const kategori = KATEGORI[aduan.jenis_aduan] ?? KATEGORI.KETIDAKTEPATAN;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 pb-20 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/admin/aduan"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke daftar laporan
        </Link>

        {/* Header: datar, satu warna */}
        <header className="rounded-xl bg-[#001349] px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-medium uppercase tracking-wider text-blue-200">
                  Kode resi
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium">
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>
              <h1 className="mt-1.5 break-all text-2xl font-bold tracking-tight sm:text-3xl">
                {aduan.kode_laporan}
              </h1>
              <p className="mt-3 text-sm text-blue-100">
                {tgl(aduan.created_at)} · Ditangani oleh {aduan.admin?.nama ?? "belum ada"}
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-xs text-blue-200">Ubah status laporan</p>
              <UbahStatus id={aduan.id} currentStatus={aduan.status} />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Kolom kiri */}
          <div className="space-y-6 lg:col-span-2">
            <Bagian judul="Kronologi laporan">
              <p className={`text-sm font-semibold ${kategori.warna}`}>{kategori.label}</p>
              <p className="mb-4 mt-0.5 text-xs text-slate-500">{kategori.desc}</p>
              <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                {aduan.uraian_kronologi}
              </p>
            </Bagian>

            <Bagian judul={`Bukti pendukung (${aduan.bukti.length})`}>
              {aduan.bukti.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {aduan.bukti.map((b) => {
                    const url = urlByPath.get(b.path_file);
                    const isGambar = b.mime_type.startsWith("image/");

                    const isi = (
                      <>
                        <div className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                          {isGambar && url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={url}
                              alt={b.nama_file}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400">
                              <FileText className="h-8 w-8" />
                              <span className="text-[11px] font-semibold">
                                {isGambar ? "Gambar" : "PDF"}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="mt-2 truncate text-xs font-medium text-slate-800">
                          {b.nama_file}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {url ? ukuran(b.ukuran) : "Tautan tidak tersedia"}
                        </p>
                      </>
                    );

                    return (
                      <li key={b.id}>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block transition-opacity hover:opacity-80"
                          >
                            {isi}
                          </a>
                        ) : (
                          <div>{isi}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm italic text-slate-500">Tidak ada bukti terlampir.</p>
              )}
            </Bagian>
          </div>

          {/* Kolom kanan */}
          <div className="space-y-6">
            <Bagian judul="Pelapor">
              <dl className="divide-y divide-slate-100">
                <Baris label="Nama">
                  {aduan.is_anonim ? (
                    <span className="italic text-slate-500">Dirahasiakan dari terlapor</span>
                  ) : (
                    aduan.nama_pelapor
                  )}
                </Baris>
                <Baris label="WhatsApp">
                  {aduan.whatsapp_pelapor ? (
                    <a
                      href={waLink(aduan.whatsapp_pelapor)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-700 hover:underline"
                    >
                      {aduan.whatsapp_pelapor}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    "-"
                  )}
                </Baris>
                <Baris label="Email">
                  {aduan.email_pelapor ? (
                    <a
                      href={`mailto:${aduan.email_pelapor}`}
                      className="text-blue-700 hover:underline"
                    >
                      {aduan.email_pelapor}
                    </a>
                  ) : (
                    "-"
                  )}
                </Baris>
                <Baris label="Pernyataan keabsahan">
                  {aduan.pernyataan_setuju && aduan.disetujui_pada
                    ? `Disetujui, ${tgl(aduan.disetujui_pada)}`
                    : "Belum tercatat"}
                </Baris>
              </dl>
              <p className="mt-4 text-[11px] text-slate-400">
                Kontak pelapor hanya terlihat oleh admin.
              </p>
            </Bagian>

            <Bagian judul="Terlapor">
              <dl className="divide-y divide-slate-100">
                <Baris label="Nama">{aduan.nama_terlapor}</Baris>
                <Baris label="NIM">{aduan.nim_terlapor || "-"}</Baris>
                <Baris label="Angkatan">{aduan.angkatan || "-"}</Baris>
                <Baris label="Fakultas / Program studi">{aduan.fakultas_prodi || "-"}</Baris>
              </dl>
            </Bagian>
          </div>
        </div>
      </div>
    </div>
  );
}