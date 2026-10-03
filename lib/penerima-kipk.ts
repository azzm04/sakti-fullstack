import { prisma } from "@/lib/db";

const NIM_REGEX = /^[0-9]{14}$/;

function normalize(s: string): string {
  return s.trim().toUpperCase().replace(/\s+/g, " ");
}

/** Ekstrak jenjang (S1/D4) dari teks prodi bebas, kalau ada — tidak peduli posisi ("S1 SEJARAH" atau "Sejarah S1"). */
function extractJenjang(text: string): "S1" | "D4" | null {
  const norm = normalize(text);
  if (/\bD4\b/.test(norm)) return "D4";
  if (/\bS1\b/.test(norm)) return "S1";
  return null;
}

/** Buang token jenjang dari teks supaya sisa nama prodi murni bisa dicocokkan ke `prodi.nama_prodi`. */
function stripJenjang(text: string): string {
  return normalize(text)
    .replace(/\bD4\b/g, "")
    .replace(/\bS1\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function resolveProdiId(
  prodiPendaftarText: string | null | undefined,
): Promise<string | null> {
  if (!prodiPendaftarText?.trim()) return null;

  const jenjang = extractJenjang(prodiPendaftarText);
  const namaOnly = stripJenjang(prodiPendaftarText);
  if (!namaOnly) return null;

  const candidates = await prisma.prodi.findMany({
    select: { id: true, nama_prodi: true, prodi: true },
  });

  const match = candidates.find((p) => {
    if (normalize(p.nama_prodi) !== namaOnly) return false;
    if (jenjang && p.prodi !== jenjang) return false;
    return true;
  });

  return match?.id ?? null;
}

export type BuatPenerimaKipkResult =
  | { ok: true }
  | { ok: false; error: string };

export async function buatPenerimaKipk(
  kandidatId: string,
  userId: string,
): Promise<BuatPenerimaKipkResult> {
  const existing = await prisma.penerimaKipk.findUnique({ where: { userId } });
  if (existing) return { ok: true };

  const kandidat = await prisma.kandidat.findUnique({
    where: { id: kandidatId },
    include: { impor_data: { select: { tahun_seleksi: true } } },
  });

  if (!kandidat) {
    return { ok: false, error: "Data kandidat tidak ditemukan." };
  }
  if (kandidat.status_sk !== "Ditetapkan") {
    return { ok: false, error: "Kandidat belum dinyatakan Ditetapkan SK." };
  }
  if (!kandidat.nim_resmi || !NIM_REGEX.test(kandidat.nim_resmi)) {
    return {
      ok: false,
      error: "NIM resmi kandidat belum valid (harus 14 digit angka).",
    };
  }
  if (!kandidat.nama_pendaftar) {
    return { ok: false, error: "Nama kandidat tidak lengkap." };
  }

  const prodiId = await resolveProdiId(kandidat.prodi_pendaftar);
  if (!prodiId) {
    return {
      ok: false,
      error: `Program studi "${kandidat.prodi_pendaftar}" belum terdaftar di sistem. Hubungi admin.`,
    };
  }

  const angkatan = kandidat.impor_data?.tahun_seleksi;
  if (!angkatan) {
    return {
      ok: false,
      error: "Tahun seleksi (angkatan) tidak ditemukan untuk kandidat ini.",
    };
  }

  await prisma.penerimaKipk.create({
    data: {
      userId,
      nim: kandidat.nim_resmi,
      nama: kandidat.nama_pendaftar,
      prodi_id: prodiId,
      angkatan,
    },
  });

  await prisma.kandidat.update({
    where: { id: kandidatId },
    data: { verifikasi_token_used_at: new Date() },
  });

  return { ok: true };
}
