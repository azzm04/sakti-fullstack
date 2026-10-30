import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { BUKTI_CONFIG } from "@/lib/aduan/bukti-config";
import { requireAdminRole } from "@/lib/auth-server";
import LembarKendali from "./LembarKendali";

const TINGKAT_VALID = ["operator", "spv", "manajer", "direktur"] as const;
type Tingkat = (typeof TINGKAT_VALID)[number];

const STATUS_LABEL: Record<string, string> = {
    MENUNGGU: "Menunggu",
    DIPROSES: "Diproses",
    SELESAI: "Selesai",
    DITOLAK: "Ditolak",
};

const KATEGORI_LABEL: Record<string, string> = {
    KETIDAKTEPATAN: "Ketidaktepatan Sasaran",
    PENYALAHGUNAAN: "Penyalahgunaan Dana",
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

export default async function LembarKendaliPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tingkat?: string }>;
}) {
    // Lembar memuat tautan bukti yang sensitif, jadi sesi admin diperiksa di sini
    const admin = await requireAdminRole();

    const { id } = await params;
    const { tingkat: t } = await searchParams;
    const tingkat: Tingkat = (TINGKAT_VALID as readonly string[]).includes(t ?? "")
        ? (t as Tingkat)
        : "direktur";

    const aduan = await prisma.aduan.findUnique({
        where: { id },
        include: { bukti: { orderBy: { created_at: "asc" } } },
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

    // Hanya data yang dibutuhkan lembar. Identitas pelapor sengaja tidak dikirim.
    const data = {
        idAduan: aduan.id,
        kode: aduan.kode_laporan,
        tanggalMasuk: tgl(aduan.created_at),
        kategori: KATEGORI_LABEL[aduan.jenis_aduan] ?? aduan.jenis_aduan,
        status: STATUS_LABEL[aduan.status] ?? aduan.status,
        namaTerlapor: aduan.nama_terlapor,
        nim: aduan.nim_terlapor || "-",
        angkatan: aduan.angkatan || "-",
        prodi: aduan.fakultas_prodi || "-",
        uraian: aduan.uraian_kronologi,
        bukti: aduan.bukti.map((b) => ({
            id: b.id,
            nama: b.nama_file,
            mime: b.mime_type,
            ukuran: b.ukuran,
            url: urlByPath.get(b.path_file) ?? null,
        })),
        dicetakOleh: admin.nama || "-",
        dicetakPada: tgl(new Date()),
    };

    return <LembarKendali data={data} tingkat={tingkat} />;
}