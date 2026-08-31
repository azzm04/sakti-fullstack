/**
 * Pencocokan nama generik — dipakai untuk mencocokkan daftar Excel SK resmi
 * (Nama, NIM, Prodi) ke pool kandidat "Diusulkan" kita. Satu-satunya kunci
 * yang tersedia di dokumen SK cuma nama, jadi pencocokan harus toleran
 * terhadap perbedaan ejaan/spasi kecil — tapi tetap butuh review manusia
 * (lihat lib/penetapan-sk-pool.ts & endpoint cocokkan) sebelum difinalisasi.
 */

export function normalizeName(s: string): string {
  return s
    .trim()
    .toUpperCase()
    .replace(/[.,'"()-]/g, "")
    .replace(/\s+/g, " ");
}

/** Jarak Levenshtein standar (edit distance) antara dua string. */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prevRow = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const currRow = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1, // hapus
        currRow[j - 1] + 1, // tambah
        prevRow[j - 1] + cost, // ganti
      );
    }
    prevRow = currRow;
  }
  return prevRow[n];
}

/** Skor kemiripan 0..1 (1 = identik) berdasarkan jarak Levenshtein ternormalisasi. */
export function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na && !nb) return 1;
  if (!na || !nb) return 0;
  const maxLen = Math.max(na.length, nb.length);
  return 1 - levenshteinDistance(na, nb) / maxLen;
}

export interface PoolItem {
  id: string;
  nama: string;
}

export interface ExcelRow {
  nama: string;
  nim: string;
  prodi: string;
}

export interface MatchedPair {
  kandidatId: string;
  namaKandidat: string;
  excelRow: ExcelRow;
  skor: number;
}

export interface MatchResult {
  matched: MatchedPair[];
  tidakDitemukanDiExcel: PoolItem[];
  barisTidakCocok: ExcelRow[];
}

const FUZZY_THRESHOLD = 0.82;

/**
 * Cocokkan pool kandidat ke baris Excel by nama: exact match dulu, sisanya
 * fuzzy match greedy (skor tertinggi duluan), 1:1 assignment.
 */
export function matchNamesToPool(pool: PoolItem[], excelRows: ExcelRow[]): MatchResult {
  const remainingPool = new Map(pool.map((p) => [p.id, p]));
  const remainingExcel = new Set(excelRows.map((_, i) => i));
  const matched: MatchedPair[] = [];

  // Pass 1 — exact match (nama ternormalisasi identik)
  for (const p of pool) {
    if (!remainingPool.has(p.id)) continue;
    const normP = normalizeName(p.nama);
    for (const i of remainingExcel) {
      if (normalizeName(excelRows[i].nama) === normP) {
        matched.push({ kandidatId: p.id, namaKandidat: p.nama, excelRow: excelRows[i], skor: 1 });
        remainingPool.delete(p.id);
        remainingExcel.delete(i);
        break;
      }
    }
  }

  // Pass 2 — fuzzy match greedy, skor tertinggi duluan
  const candidates: { kandidatId: string; namaKandidat: string; excelIdx: number; skor: number }[] = [];
  for (const p of remainingPool.values()) {
    for (const i of remainingExcel) {
      const skor = nameSimilarity(p.nama, excelRows[i].nama);
      if (skor >= FUZZY_THRESHOLD) {
        candidates.push({ kandidatId: p.id, namaKandidat: p.nama, excelIdx: i, skor });
      }
    }
  }
  candidates.sort((a, b) => b.skor - a.skor);

  for (const c of candidates) {
    if (!remainingPool.has(c.kandidatId) || !remainingExcel.has(c.excelIdx)) continue;
    matched.push({
      kandidatId: c.kandidatId,
      namaKandidat: c.namaKandidat,
      excelRow: excelRows[c.excelIdx],
      skor: c.skor,
    });
    remainingPool.delete(c.kandidatId);
    remainingExcel.delete(c.excelIdx);
  }

  return {
    matched,
    tidakDitemukanDiExcel: Array.from(remainingPool.values()),
    barisTidakCocok: Array.from(remainingExcel).map((i) => excelRows[i]),
  };
}
