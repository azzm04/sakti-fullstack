/**
 * lib/monev-schedule.ts
 * Helper bersama untuk status operasional periode Monev.
 * Dipakai di server (API routes) dan bisa di-import di client jika perlu.
 */

export type OperationalStatus =
  | "BELUM_DIMULAI"      // waktu_mulai null / di masa depan, belum ada laporan
  | "BERLANGSUNG"        // form sudah buka, deadline belum lewat, is_active=true
  | "BERAKHIR"           // deadline sudah lewat (is_active tidak relevan)
  | "NONAKTIF"           // is_active=false, BELUM dimulai, belum ada laporan
  | "NONAKTIF_BERJALAN"; // is_active=false tapi sudah dimulai / sudah ada laporan

export interface PeriodeSnapshot {
  is_active: boolean;
  waktu_mulai: Date | string | null;
  deadline: Date | string;
  jumlah_laporan?: number; // opsional — jika tidak disediakan dianggap 0
}

/**
 * Tentukan status operasional periode berdasarkan data tersimpan.
 * Validasi dilakukan dengan waktu server (now), bukan waktu client.
 */
export function getOperationalStatus(
  periode: PeriodeSnapshot,
  now: Date = new Date()
): OperationalStatus {
  const deadline = new Date(periode.deadline);
  const waktuMulai = periode.waktu_mulai ? new Date(periode.waktu_mulai) : null;
  const jumlahLaporan = periode.jumlah_laporan ?? 0;

  // BERAKHIR: deadline sudah lewat, apapun is_active-nya
  if (deadline <= now) return "BERAKHIR";

  // Belum dimulai (waktu_mulai di masa depan atau null) dan belum ada laporan
  const belumDimulai =
    !waktuMulai || waktuMulai > now;

  if (belumDimulai && jumlahLaporan === 0) {
    // Nonaktif sebelum dimulai
    if (!periode.is_active) return "NONAKTIF";
    return "BELUM_DIMULAI";
  }

  // Sudah dimulai ATAU sudah ada laporan.
  // Menonaktifkan periode TIDAK mereset pembatasan edit: waktu_mulai tetap
  // terkunci dan deadline tetap hanya boleh diperpanjang.
  if (!periode.is_active) return "NONAKTIF_BERJALAN";
  return "BERLANGSUNG";
}

/**
 * Periksa apakah perubahan yang diminta diizinkan berdasarkan status.
 * Mengembalikan string pesan error jika tidak diizinkan, atau null jika OK.
 */
export function validateScheduleChange(
  status: OperationalStatus,
  change: {
    waktu_mulai?: string | null;
    deadline?: string | null;
  },
  current: {
    waktu_mulai: Date | string | null;
    deadline: Date | string;
  }
): string | null {
  const now = new Date();

  if (change.deadline !== undefined) {
    const deadlineBaru = new Date(change.deadline as string);
    const deadlineLama = new Date(current.deadline);

    // Deadline baru harus di masa depan
    if (deadlineBaru <= now) {
      return "Batas pengisian baru harus di masa depan";
    }

    if (
      status === "BERLANGSUNG" ||
      status === "BERAKHIR" ||
      status === "NONAKTIF_BERJALAN"
    ) {
      // Hanya boleh diperpanjang
      if (deadlineBaru <= deadlineLama) {
        return "Batas pengisian hanya dapat diperpanjang (harus lebih dari batas lama)";
      }
    }
  }

  if (change.waktu_mulai !== undefined) {
    if (
      status === "BERLANGSUNG" ||
      status === "BERAKHIR" ||
      status === "NONAKTIF_BERJALAN"
    ) {
      return "Waktu mulai tidak dapat diubah setelah periode berjalan atau berakhir";
    }
  }

  return null;
}

/**
 * Tentukan tipe_perubahan untuk riwayat berdasarkan apa yang berubah.
 */
export function determineTipePerubahan(
  status: OperationalStatus,
  change: {
    waktu_mulai?: string | null;
    deadline?: string | null;
    is_active?: boolean;
  },
  current: {
    deadline: Date | string;
    is_active: boolean;
  }
): string {
  const isActivating =
    change.is_active === true && !current.is_active;
  const isDeactivating =
    change.is_active === false && current.is_active;
  const changingDeadline = change.deadline !== undefined;
  const changingWaktuMulai = change.waktu_mulai !== undefined;

  if (status === "BERAKHIR" && changingDeadline) return "BUKA_KEMBALI";
  if (
    (status === "BERLANGSUNG" || status === "NONAKTIF_BERJALAN") &&
    changingDeadline
  ) {
    return "PERPANJANGAN";
  }
  if (changingWaktuMulai && changingDeadline) return "UBAH_WAKTU_MULAI"; // ubah keduanya
  if (changingWaktuMulai) return "UBAH_WAKTU_MULAI";
  if (changingDeadline) return "UBAH_DEADLINE";
  if (isActivating) return "AKTIFKAN";
  if (isDeactivating) return "NONAKTIFKAN";
  return "UBAH_JADWAL";
}

/* ──────────────────────────────────────────────────────────────
   Konversi antara input <input type="datetime-local"> dan UTC.

   Input datetime-local tidak membawa informasi zona waktu —
   nilainya adalah "jam dinding" yang diketik admin, dan di aplikasi
   ini selalu dibaca sebagai WIB (UTC+7). Dua helper di bawah adalah
   satu-satunya tempat offset itu diterapkan.
   ────────────────────────────────────────────────────────────── */

const WIB_OFFSET = "+07:00";

/** "2026-10-01T08:00" (WIB) → "2026-10-01T01:00:00.000Z" */
export function wibInputToUtcIso(local: string): string {
  if (!local) return "";
  // datetime-local bisa menyertakan detik ("...T08:00:00") atau tidak
  const withSeconds = local.length === 16 ? `${local}:00` : local;
  return new Date(`${withSeconds}${WIB_OFFSET}`).toISOString();
}

/** "2026-10-01T01:00:00.000Z" → "2026-10-01T08:00" untuk prefill input */
export function utcIsoToWibInput(iso: string | Date | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${wib.getUTCFullYear()}-${pad(wib.getUTCMonth() + 1)}-${pad(wib.getUTCDate())}` +
    `T${pad(wib.getUTCHours())}:${pad(wib.getUTCMinutes())}`
  );
}

/**
 * Tambah 1 bulan kalender langsung pada nilai input datetime-local.
 * Bekerja pada jam dinding sehingga tidak perlu konversi zona waktu —
 * 31 Jan 08.00 → 28 Feb 08.00 (hari di-clamp ke akhir bulan tujuan).
 */
export function addOneMonthToWibInput(local: string): string {
  if (!local) return "";
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return "";
  const [, y, mo, d, h, mi] = m;

  const monthIndex = Number(mo) - 1 + 1; // bulan sekarang (0-based) + 1
  const targetYear = Number(y) + Math.floor(monthIndex / 12);
  const targetMonth = monthIndex % 12;

  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(Number(d), lastDay);

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${targetYear}-${pad(targetMonth + 1)}-${pad(targetDay)}T${h}:${mi}`;
}

/** Tambah n hari pada nilai input datetime-local (jam dinding tetap). */
export function addDaysToWibInput(local: string, days: number): string {
  if (!local) return "";
  const utc = wibInputToUtcIso(local);
  if (!utc) return "";
  return utcIsoToWibInput(new Date(new Date(utc).getTime() + days * 86400000));
}

/**
 * Sisa hari menuju deadline, dihitung dari batas tengah malam WIB.
 *
 * Menghitung langsung dari selisih milidetik (`Math.ceil`) membuat hasilnya
 * bergeser tergantung jam eksekusi cron — pukul 23.30 dan pukul 00.30 bisa
 * menghasilkan angka berbeda untuk hari yang sama. Dengan membandingkan
 * tanggal kalender WIB, H-7 selalu berarti tujuh hari kalender.
 */
export function daysLeftWIB(deadline: Date | string, now: Date = new Date()): number {
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const DAY_MS = 24 * 60 * 60 * 1000;

  // Tengah malam WIB dari sebuah instant, dinyatakan sebagai epoch ms
  const midnightWIB = (d: Date): number => {
    const wib = new Date(d.getTime() + WIB_OFFSET_MS);
    return Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()) - WIB_OFFSET_MS;
  };

  return Math.round(
    (midnightWIB(new Date(deadline)) - midnightWIB(now)) / DAY_MS
  );
}
