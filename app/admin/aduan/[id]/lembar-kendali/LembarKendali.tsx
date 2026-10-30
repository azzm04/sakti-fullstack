"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

type Bukti = {
    id: string;
    nama: string;
    mime: string;
    ukuran: number;
    url: string | null;
};

type DataLembar = {
    idAduan: string;
    kode: string;
    tanggalMasuk: string;
    kategori: string;
    status: string;
    namaTerlapor: string;
    nim: string;
    angkatan: string;
    prodi: string;
    uraian: string;
    bukti: Bukti[];
    dicetakOleh: string;
    dicetakPada: string;
};

type Tingkat = "operator" | "spv" | "manajer" | "direktur";

const PILIHAN: { key: Tingkat; label: string; baris: string[] }[] = [
    { key: "operator", label: "Operator", baris: ["Operator"] },
    { key: "spv", label: "Supervisor", baris: ["Operator", "Supervisor"] },
    { key: "manajer", label: "Manajer", baris: ["Operator", "Supervisor", "Manajer"] },
    {
        key: "direktur",
        label: "Direktur",
        baris: ["Operator", "Supervisor", "Manajer", "Direktur"],
    },
];

const REKOMENDASI = [
    "Diarsipkan",
    "Klarifikasi / permintaan keterangan",
    "Pemanggilan terlapor",
];

const CSS_CETAK = `
@page { size: A4; margin: 14mm; }
@media print {
  html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
  body > *:not(#lembar-root) { display: none !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

const ukuran = (b: number) =>
    b >= 1024 * 1024
        ? `${(b / 1024 / 1024).toFixed(2)} MB`
        : `${Math.max(1, Math.round(b / 1024))} KB`;

function Judul({ huruf, children }: { huruf: string; children: React.ReactNode }) {
    return (
        <h2 className="mb-2 mt-5 border-b border-black pb-1 text-[11pt] font-bold uppercase">
            {huruf}. {children}
        </h2>
    );
}

function Baris({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <tr className="align-top">
            <td className="w-[38mm] py-0.5 pr-2">{label}</td>
            <td className="w-[4mm] py-0.5">:</td>
            <td className="py-0.5 font-medium">{children}</td>
        </tr>
    );
}

export default function LembarKendali({
    data,
    tingkat,
}: {
    data: DataLembar;
    tingkat: Tingkat;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Cegah halaman di belakang ikut bergulir saat lembar ditampilkan
        const awal = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = awal;
        };
    }, []);

    if (!mounted) return null;

    const pilihan = PILIHAN.find((p) => p.key === tingkat) ?? PILIHAN[PILIHAN.length - 1];
    const gambar = data.bukti.filter((b) => b.mime.startsWith("image/"));
    const berkasLain = data.bukti.filter((b) => !b.mime.startsWith("image/"));

    return createPortal(
        <div
            id="lembar-root"
            className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-slate-200 print:static print:overflow-visible print:bg-white"
        >
            <style>{CSS_CETAK}</style>

            {/* ===== Bilah alat (tidak ikut tercetak) ===== */}
            <div className="sticky top-0 z-10 border-b border-slate-300 bg-white print:hidden">
                <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <Link
                        href={`/admin/aduan/${data.idAduan}`}
                        className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] text-slate-500">Tingkat validasi:</span>
                        <div className="inline-flex rounded-lg border border-slate-300 p-0.5">
                            {PILIHAN.map((p) => (
                                <Link
                                    key={p.key}
                                    href={`/admin/aduan/${data.idAduan}/lembar-kendali?tingkat=${p.key}`}
                                    replace
                                    className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${p.key === tingkat
                                        ? "bg-[#003C71] text-white"
                                        : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                >
                                    {p.label}
                                </Link>
                            ))}
                        </div>

                        <button
                            onClick={() => window.print()}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#003C71] px-4 text-[13px] font-medium text-white hover:bg-[#00529B]"
                        >
                            <Printer className="h-4 w-4" />
                            Cetak / Simpan PDF
                        </button>
                    </div>

                    <p className="w-full text-[12px] text-slate-500">
                        Pada jendela cetak, pilih &quot;Simpan sebagai PDF&quot; bila ingin berkas digital, dan
                        matikan opsi &quot;Header dan footer&quot;.
                    </p>
                </div>
            </div>

            {/* ===== Kertas ===== */}
            <article
                className="mx-auto my-6 w-[210mm] max-w-full bg-white p-[14mm] text-[10.5pt] leading-snug text-black shadow-lg print:my-0 print:w-auto print:max-w-none print:p-0 print:shadow-none"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
                {/* Kop sementara: ganti dengan kop resmi bila Dirmawa sudah memberi templat */}
                <header className="border-b-2 border-black pb-3 text-center">
                    <p className="text-[11pt] font-bold uppercase">Dirmawa Universitas Diponegoro</p>
                    <p className="mt-2 text-[13pt] font-bold uppercase">
                        Lembar Kendali Penanganan Aduan KIP-Kuliah
                    </p>
                    <p className="mt-1 text-[10pt]">Nomor: LK/{data.kode}</p>
                </header>

                {/* A */}
                <section className="break-inside-avoid">
                    <Judul huruf="A">Data Aduan</Judul>
                    <table className="w-full">
                        <tbody>
                            <Baris label="Kode aduan">{data.kode}</Baris>
                            <Baris label="Tanggal masuk">{data.tanggalMasuk}</Baris>
                            <Baris label="Kategori">{data.kategori}</Baris>
                            <Baris label="Status saat ini">{data.status}</Baris>
                        </tbody>
                    </table>
                </section>

                {/* B */}
                <section className="break-inside-avoid">
                    <Judul huruf="B">Data Terlapor</Judul>
                    <table className="w-full">
                        <tbody>
                            <Baris label="Nama">{data.namaTerlapor}</Baris>
                            <Baris label="NIM">{data.nim}</Baris>
                            <Baris label="Angkatan">{data.angkatan}</Baris>
                            <Baris label="Fakultas / Prodi">{data.prodi}</Baris>
                        </tbody>
                    </table>
                </section>

                {/* C */}
                <section>
                    <Judul huruf="C">Uraian Kronologi</Judul>
                    <p className="whitespace-pre-wrap text-justify">{data.uraian}</p>
                </section>

                {/* D */}
                <section>
                    <Judul huruf="D">Bukti Pendukung ({data.bukti.length} berkas)</Judul>

                    {data.bukti.length === 0 && <p className="italic">Tidak ada bukti terlampir.</p>}

                    {gambar.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                            {gambar.map((b, i) => (
                                <figure key={b.id} className="break-inside-avoid">
                                    <div className="flex h-[62mm] items-center justify-center overflow-hidden border border-slate-400">
                                        {b.url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={b.url}
                                                alt={b.nama}
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        ) : (
                                            <span className="px-2 text-center text-[9pt] italic">
                                                Tampilan tidak tersedia, buka melalui sistem
                                            </span>
                                        )}
                                    </div>
                                    <figcaption className="mt-1 text-[9pt]">
                                        Bukti {i + 1}: {b.nama} ({ukuran(b.ukuran)})
                                    </figcaption>
                                </figure>
                            ))}
                        </div>
                    )}

                    {berkasLain.length > 0 && (
                        <div className="mt-3 break-inside-avoid">
                            <p className="font-semibold">Berkas dokumen (dilampirkan terpisah):</p>
                            <ul className="ml-5 list-disc">
                                {berkasLain.map((b) => (
                                    <li key={b.id}>
                                        {b.nama} ({ukuran(b.ukuran)})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                {/* E */}
                <section className="break-inside-avoid">
                    <Judul huruf="E">Penelaahan dan Rekomendasi</Judul>
                    <p className="mb-1 font-semibold">Penelaahan:</p>
                    {[0, 1, 2, 3].map((n) => (
                        <div key={n} className="h-6 border-b border-dotted border-black" />
                    ))}

                    <p className="mb-1 mt-4 font-semibold">Rekomendasi:</p>
                    <ul className="space-y-1">
                        {REKOMENDASI.map((r) => (
                            <li key={r}>☐ {r}</li>
                        ))}
                        <li>☐ Lainnya: ........................................................................</li>
                    </ul>
                </section>

                {/* F */}
                <section className="break-inside-avoid">
                    <Judul huruf="F">Validasi Berjenjang</Judul>
                    <table className="w-full border-collapse text-[9.5pt]">
                        <thead>
                            <tr className="bg-slate-100">
                                {["Tingkat", "Nama", "Keputusan", "Catatan", "Tanggal", "Tanda tangan"].map((h) => (
                                    <th key={h} className="border border-black px-2 py-1.5 text-left font-semibold">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {pilihan.baris.map((jabatan) => (
                                <tr key={jabatan} className="h-[20mm] align-top">
                                    <td className="w-[22mm] border border-black px-2 py-1.5 font-semibold">{jabatan}</td>
                                    <td className="border border-black px-2 py-1.5" />
                                    <td className="w-[24mm] border border-black px-2 py-1.5">
                                        ☐ Setuju
                                        <br />☐ Tolak
                                    </td>
                                    <td className="border border-black px-2 py-1.5" />
                                    <td className="w-[22mm] border border-black px-2 py-1.5" />
                                    <td className="w-[32mm] border border-black px-2 py-1.5" />
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <footer className="mt-6 border-t border-slate-400 pt-2 text-[8.5pt] text-slate-700">
                    <p>
                        Dokumen ini dibuat dari sistem SAKTI dan bersifat rahasia. Identitas pelapor tersimpan di
                        sistem dan tidak dicantumkan pada lembar ini.
                    </p>
                    <p className="mt-0.5">
                        Dicetak oleh {data.dicetakOleh} pada {data.dicetakPada}.
                    </p>
                </footer>
            </article>
        </div>,
        document.body
    );
}