import Image from "next/image";
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
  MENUNGGU: { label: "Menunggu", dot: "bg-amber-500" },
  DIPROSES: { label: "Diproses", dot: "bg-sky-500" },
  SELESAI: { label: "Selesai", dot: "bg-emerald-500" },
  DITOLAK: { label: "Ditolak", dot: "bg-rose-500" },
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
    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
      <h2 className="mb-4 text-[12px] font-medium uppercase tracking-wider text-[#64748B]">
        {judul}
      </h2>
      {children}
    </section>
  );
}

function Baris({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <dt className="text-[12px] text-[#64748B]">{label}</dt>
      <dd className="mt-0.5 break-words text-[14px] font-medium text-[#000352]">
        {children}
      </dd>
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
    <div
      className="min-h-full bg-[#F8FAFC] text-[#000352]"
      style={{ fontFamily: "Roboto, sans-serif" }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <Link
          href="/admin/aduan"
          className="inline-flex items-center gap-2 text-[14px] font-medium text-[#64748B] transition-colors hover:text-[#000352]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke daftar laporan
        </Link>

        {/* ===== Header: mengikuti kartu sapaan di dasbor mahasiswa ===== */}
        <section className="mt-5">
          <article className="rounded-2xl border border-[#E2E8F0] bg-white">
            {/* Area judul */}
            <div className="relative isolate flex min-h-[160px] items-center overflow-hidden rounded-t-2xl px-5 py-8 sm:min-h-[200px] sm:px-8">
              <div className="relative z-10 min-w-0 lg:max-w-[68%]">
                <p className="text-[12px] font-medium uppercase tracking-wider text-[#64748B]">
                  Kode resi laporan
                </p>
                <h1 className="mt-1 break-all text-[24px] font-semibold leading-[32px] text-[#000352] lg:text-[32px] lg:leading-[40px]">
                  {aduan.kode_laporan}
                </h1>
                <p className="mt-3 text-[16px] leading-6 text-[#64748B]">
                  Dilaporkan pada {tgl(aduan.created_at)}.
                </p>
              </div>

              {/* Siluet logo SAKTI, sama dengan dasbor mahasiswa */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] max-w-[440px] overflow-hidden sm:block"
                style={{
                  maskImage:
                    "linear-gradient(to right, transparent 0%, black 24%, black 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent 0%, black 24%, black 100%)",
                }}
              >
                <Image
                  src="/background/card%20background%20sakti.png"
                  alt=""
                  fill
                  unoptimized
                  className="origin-top-right scale-[1.15] object-cover object-right-top"
                />
              </div>
            </div>

            {/* Strip bawah: status, penangan, dan kontrol ubah status.
                Tidak memakai overflow-hidden agar notifikasi dari UbahStatus tidak terpotong */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-b-2xl bg-[#EEF2FF] px-5 py-4 sm:px-8">
              <span className="inline-flex items-center gap-2 text-[14px] font-medium text-[#000352]">
                <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                {status.label}
              </span>

              <span
                aria-hidden="true"
                className="hidden h-5 w-px bg-[#000352]/20 sm:block"
              />

              <span className="text-[14px] leading-6 text-[#64748B]">
                Ditangani oleh {aduan.admin?.nama ?? "belum ada"}
              </span>

              <div className="w-full sm:ml-auto sm:w-auto">
                <UbahStatus id={aduan.id} currentStatus={aduan.status} />
              </div>
            </div>
          </article>
        </section>

        {/* ===== Isi ===== */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Kolom kiri */}
          <div className="space-y-6 lg:col-span-2">
            <Bagian judul="Kronologi laporan">
              <p className={`text-[14px] font-semibold ${kategori.warna}`}>
                {kategori.label}
              </p>
              <p className="mb-4 mt-0.5 text-[12px] text-[#64748B]">{kategori.desc}</p>
              <p className="whitespace-pre-wrap text-[15px] leading-7 text-[#334155]">
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
                        <div className="aspect-square overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                          {isGambar && url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={url}
                              alt={b.nama_file}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#94A3B8]">
                              <FileText className="h-8 w-8" />
                              <span className="text-[11px] font-semibold">
                                {isGambar ? "Gambar" : "PDF"}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="mt-2 truncate text-[12px] font-medium text-[#000352]">
                          {b.nama_file}
                        </p>
                        <p className="text-[11px] text-[#64748B]">
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
                <p className="text-[14px] italic text-[#64748B]">
                  Tidak ada bukti terlampir.
                </p>
              )}
            </Bagian>
          </div>

          {/* Kolom kanan */}
          <div className="space-y-6">
            <Bagian judul="Pelapor">
              <dl className="divide-y divide-[#F0F4F8]">
                <Baris label="Nama">
                  {aduan.is_anonim ? (
                    <span className="italic text-[#64748B]">
                      Dirahasiakan dari terlapor
                    </span>
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
                      className="inline-flex items-center gap-1.5 text-[#00529B] hover:underline"
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
                      className="text-[#00529B] hover:underline"
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
              <p className="mt-4 text-[11px] text-[#94A3B8]">
                Kontak pelapor hanya terlihat oleh admin.
              </p>
            </Bagian>

            <Bagian judul="Terlapor">
              <dl className="divide-y divide-[#F0F4F8]">
                <Baris label="Nama">{aduan.nama_terlapor}</Baris>
                <Baris label="NIM">{aduan.nim_terlapor || "-"}</Baris>
                <Baris label="Angkatan">{aduan.angkatan || "-"}</Baris>
                <Baris label="Fakultas / Program studi">
                  {aduan.fakultas_prodi || "-"}
                </Baris>
              </dl>
            </Bagian>
          </div>
        </div>
      </div>
    </div>
  );
}