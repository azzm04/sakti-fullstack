import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { JenisAduan, Prisma, StatusAduan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSesiAdmin } from "@/lib/auth/sesi-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  MENUNGGU: "Menunggu",
  DIPROSES: "Diproses",
  SELESAI: "Selesai",
  DITOLAK: "Ditolak",
};
const JENIS_LABEL: Record<string, string> = {
  KETIDAKTEPATAN: "Ketidaktepatan Sasaran",
  PENYALAHGUNAAN: "Penyalahgunaan Dana",
};

// Teks dari masyarakat yang diawali = + - @ dapat dibaca Excel sebagai rumus.
// Diberi awalan ' agar selalu diperlakukan sebagai teks biasa.
const aman = (v: string | null | undefined) => {
  const s = v ?? "";
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
};

const tglWaktu = (d: Date) =>
  d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Kunci bulan "YYYY-MM" menurut WIB
const kunciBulan = (d: Date) =>
  new Date(d.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 7);

export async function GET(req: NextRequest) {
  try {
    const sesi = await getSesiAdmin();
    if (!sesi) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
    }

    // Filter yang sama dengan tampilan dasbor
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status");
    const jenis = sp.get("jenis");
    const q = (sp.get("q") ?? "").trim().slice(0, 100);

    const where: Prisma.AduanWhereInput = {};
    if (status && (Object.values(StatusAduan) as string[]).includes(status)) {
      where.status = status as StatusAduan;
    }
    if (jenis && (Object.values(JenisAduan) as string[]).includes(jenis)) {
      where.jenis_aduan = jenis as JenisAduan;
    }
    if (q) {
      where.OR = [
        { kode_laporan: { contains: q, mode: "insensitive" } },
        { nama_terlapor: { contains: q, mode: "insensitive" } },
        { nim_terlapor: { contains: q, mode: "insensitive" } },
      ];
    }

    const rows = await prisma.aduan.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 10000,
      select: {
        kode_laporan: true,
        jenis_aduan: true,
        status: true,
        created_at: true,
        nama_terlapor: true,
        nim_terlapor: true,
        angkatan: true,
        fakultas_prodi: true,
        admin: { select: { nama: true } },
        _count: { select: { bukti: true } },
      },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = "SAKTI";
    wb.created = new Date();

    // ---------- Lembar 1: Ringkasan ----------
    const rs = wb.addWorksheet("Ringkasan");
    rs.columns = [{ width: 34 }, { width: 22 }];

    const judul = rs.addRow(["Laporan Pengaduan KIP-Kuliah"]);
    judul.font = { bold: true, size: 14 };
    rs.addRow(["Universitas Diponegoro"]);
    rs.addRow(["Tanggal unduh", tglWaktu(new Date())]);

    const filterAktif = [
      status && `Status: ${STATUS_LABEL[status] ?? status}`,
      jenis && `Kategori: ${JENIS_LABEL[jenis] ?? jenis}`,
      q && `Kata kunci: ${aman(q)}`,
    ].filter(Boolean);
    rs.addRow(["Filter", filterAktif.length ? filterAktif.join("; ") : "Semua laporan"]);
    rs.addRow(["Total laporan", rows.length]);
    rs.addRow([]);

    const tambahBagian = (judulBagian: string, data: Record<string, number>) => {
      const h = rs.addRow([judulBagian, "Jumlah"]);
      h.font = { bold: true };
      Object.entries(data).forEach(([k, v]) => rs.addRow([k, v]));
      rs.addRow([]);
    };

    const perStatus: Record<string, number> = {};
    const perJenis: Record<string, number> = {};
    const perBulan: Record<string, number> = {};
    for (const r of rows) {
      const s = STATUS_LABEL[r.status] ?? r.status;
      const j = JENIS_LABEL[r.jenis_aduan] ?? r.jenis_aduan;
      const b = kunciBulan(r.created_at);
      perStatus[s] = (perStatus[s] ?? 0) + 1;
      perJenis[j] = (perJenis[j] ?? 0) + 1;
      perBulan[b] = (perBulan[b] ?? 0) + 1;
    }
    tambahBagian("Status", perStatus);
    tambahBagian("Kategori", perJenis);
    tambahBagian("Bulan (YYYY-MM)", Object.fromEntries(Object.entries(perBulan).sort()));

    // ---------- Lembar 2: Daftar Aduan ----------
    const ws = wb.addWorksheet("Daftar Aduan", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    ws.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Kode Laporan", key: "kode", width: 20 },
      { header: "Tanggal Masuk", key: "tgl", width: 22 },
      { header: "Kategori", key: "jenis", width: 24 },
      { header: "Status", key: "status", width: 12 },
      { header: "Nama Terlapor", key: "nama", width: 30 },
      { header: "NIM Terlapor", key: "nim", width: 20 },
      { header: "Angkatan", key: "angkatan", width: 10 },
      { header: "Fakultas / Prodi", key: "prodi", width: 34 },
      { header: "Ditangani Oleh", key: "admin", width: 22 },
      { header: "Jumlah Bukti", key: "bukti", width: 14 },
    ];

    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003C71" } };
    header.alignment = { vertical: "middle" };

    rows.forEach((r, i) => {
      ws.addRow({
        no: i + 1,
        kode: r.kode_laporan,
        tgl: tglWaktu(r.created_at),
        jenis: JENIS_LABEL[r.jenis_aduan] ?? r.jenis_aduan,
        status: STATUS_LABEL[r.status] ?? r.status,
        nama: aman(r.nama_terlapor),
        nim: aman(r.nim_terlapor),
        angkatan: aman(r.angkatan),
        prodi: aman(r.fakultas_prodi),
        admin: r.admin?.nama ? aman(r.admin.nama) : "-",
        bukti: r._count.bukti,
      });
    });

    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: ws.columns.length },
    };

    const buffer = await wb.xlsx.writeBuffer();
    const namaFile = `laporan-aduan-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${namaFile}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[ADMIN_ADUAN_EXPORT]", error);
    return NextResponse.json({ error: "Gagal membuat berkas Excel" }, { status: 500 });
  }
}