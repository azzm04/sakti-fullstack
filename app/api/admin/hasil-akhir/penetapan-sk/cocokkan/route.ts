import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getDiusulkanPool } from "@/lib/penetapan-sk-pool";
import { matchNamesToPool, type ExcelRow } from "@/lib/name-match";
import { JALUR_KEYS, type JalurKey } from "@/lib/jalur";

const NAMA_KEYS = ["NAMA", "NAMA SISWA", "NAMA MAHASISWA", "NAMA LENGKAP"];
const NIM_KEYS = ["NIM"];
const PRODI_KEYS = ["PRODI", "PROGRAM STUDI"];

function normalizeHeader(s: unknown): string {
  return String(s ?? "").trim().toUpperCase();
}

function pickColumn(row: Record<string, unknown>, keys: string[]): string {
  const headerMap = new Map(Object.keys(row).map((h) => [normalizeHeader(h), h]));
  for (const key of keys) {
    const original = headerMap.get(key);
    if (original !== undefined && row[original] !== undefined && row[original] !== "") {
      return String(row[original]).trim();
    }
  }
  return "";
}

// POST — preview-only: cocokkan daftar Excel (Nama, NIM, Prodi) yang disiapkan
// admin dari dokumen SK resmi ke pool kandidat "Diusulkan" (tahun+jalur
// terpilih) BY NAMA. Tidak menulis apa pun ke database — hasilnya dipakai
// untuk mengisi otomatis tabel bulk-editor, admin tetap review sebelum simpan.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const tahunRaw = form.get("tahun");
    const jalurRaw = form.get("jalur");

    if (!file) {
      return NextResponse.json({ error: "File Excel wajib diunggah" }, { status: 400 });
    }
    const tahun = Number(tahunRaw);
    if (!tahunRaw || Number.isNaN(tahun)) {
      return NextResponse.json({ error: "Parameter tahun wajib diisi" }, { status: 400 });
    }
    const jalurKeys = String(jalurRaw ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter((k): k is JalurKey => (JALUR_KEYS as readonly string[]).includes(k));
    if (jalurKeys.length === 0) {
      return NextResponse.json({ error: "Parameter jalur wajib diisi" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

    if (rawRows.length === 0) {
      return NextResponse.json({ error: "File Excel kosong atau format tidak dikenali" }, { status: 400 });
    }

    const excelRows: ExcelRow[] = rawRows
      .map((row) => ({
        nama: pickColumn(row, NAMA_KEYS),
        nim: pickColumn(row, NIM_KEYS),
        prodi: pickColumn(row, PRODI_KEYS),
      }))
      .filter((r) => r.nama);

    if (excelRows.length === 0) {
      return NextResponse.json(
        { error: "Kolom Nama tidak ditemukan di file Excel. Pastikan ada kolom bernama Nama/Nama Siswa." },
        { status: 400 },
      );
    }

    const pool = await getDiusulkanPool(tahun, jalurKeys);
    const poolItems = pool
      .filter((p) => p.nama_pendaftar)
      .map((p) => ({ id: p.id, nama: p.nama_pendaftar as string }));

    const result = matchNamesToPool(poolItems, excelRows);
    const poolById = new Map(pool.map((p) => [p.id, p]));

    return NextResponse.json({
      matched: result.matched.map((m) => {
        const p = poolById.get(m.kandidatId);
        return {
          kandidat_id: m.kandidatId,
          nama_pendaftar: m.namaKandidat,
          no_pendaftaran_kipk: p?.no_pendaftaran_kipk ?? null,
          prodi_pendaftar: p?.prodi_pendaftar ?? null,
          nim_dari_excel: m.excelRow.nim,
          nama_dari_excel: m.excelRow.nama,
          skor: Math.round(m.skor * 100) / 100,
        };
      }),
      tidakDitemukanDiExcel: result.tidakDitemukanDiExcel.map((p) => {
        const full = poolById.get(p.id);
        return {
          kandidat_id: p.id,
          nama_pendaftar: p.nama,
          no_pendaftaran_kipk: full?.no_pendaftaran_kipk ?? null,
          prodi_pendaftar: full?.prodi_pendaftar ?? null,
        };
      }),
      barisTidakCocok: result.barisTidakCocok,
    });
  } catch (err) {
    console.error("[POST /api/admin/hasil-akhir/penetapan-sk/cocokkan]", err);
    return NextResponse.json(
      { error: "Gagal mencocokkan data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
