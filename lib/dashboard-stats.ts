import { supabaseAdmin } from "@/lib/supabase";
import type {
  DashboardActivityItem,
  DashboardStats,
  DashboardTrendPoint,
} from "@/schemas";

interface KandidatRow {
  jalur_masuk: string | null;
  impor_data: { tahun_seleksi: number | null } | null;
  hasil_wawancara: { hasil_akhir: string | null; is_draft: boolean | null }[] | null;
}

const SUPABASE_MAX_ROWS = 1000;

/**
 * Supabase membatasi setiap response ke SUPABASE_MAX_ROWS baris di sisi
 * server (db.max_rows) — `.limit()` di client TIDAK bisa melewati batas ini,
 * jadi query dengan banyak baris (seperti seluruh tabel kandidat) harus
 * di-paginate manual via `.range()`.
 */
async function fetchAllKandidat(): Promise<KandidatRow[]> {
  const rows: KandidatRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabaseAdmin
      .from("kandidat")
      .select(
        "jalur_masuk, impor_data:impor_data_id(tahun_seleksi), hasil_wawancara(hasil_akhir, is_draft)",
      )
      .range(from, from + SUPABASE_MAX_ROWS - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as unknown as KandidatRow[]));
    if (!data || data.length < SUPABASE_MAX_ROWS) break;
    from += SUPABASE_MAX_ROWS;
  }
  return rows;
}

async function getActivityFeed(): Promise<DashboardActivityItem[]> {
  const items: (DashboardActivityItem & { at: string })[] = [];

  const [imports, sesi, interviews, monev, dtRuns] = await Promise.allSettled([
    supabaseAdmin
      .from("impor_data")
      .select("file_name, jenis_impor, created_at, admin:admin_id(nama)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("sesi_wawancara")
      .select("tanggal, war_dibuka_at")
      .not("war_dibuka_at", "is", null)
      .order("war_dibuka_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("hasil_wawancara")
      .select("interviewed_at, kandidat:kandidat_id(nama_pendaftar)")
      .eq("is_draft", false)
      .not("interviewed_at", "is", null)
      .order("interviewed_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("monev_schedules")
      .select("label, createdAt")
      .order("createdAt", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("hasil_analitik_dt")
      .select("akurasi_model, analyzed_at")
      .order("analyzed_at", { ascending: false })
      .limit(3),
  ]);

  if (imports.status === "fulfilled" && imports.value.data) {
    for (const row of imports.value.data) {
      const admin = Array.isArray(row.admin) ? row.admin[0] : row.admin;
      items.push({
        at: row.created_at,
        time: row.created_at,
        title: `Berkas ${row.file_name ?? "pendaftar"} diimpor (${row.jenis_impor})`,
        by: admin?.nama ?? "Admin Dirmawa",
      });
    }
  }

  if (sesi.status === "fulfilled" && sesi.value.data) {
    for (const row of sesi.value.data) {
      items.push({
        at: row.war_dibuka_at,
        time: row.war_dibuka_at,
        title: `Sesi WAR ${row.tanggal} dibuka`,
        by: "Sistem",
      });
    }
  }

  if (interviews.status === "fulfilled" && interviews.value.data) {
    for (const row of interviews.value.data) {
      const kandidat = Array.isArray(row.kandidat) ? row.kandidat[0] : row.kandidat;
      items.push({
        at: row.interviewed_at,
        time: row.interviewed_at,
        title: `Hasil wawancara ${kandidat?.nama_pendaftar ?? "kandidat"} difinalisasi`,
        by: "Pewawancara",
      });
    }
  }

  if (monev.status === "fulfilled" && monev.value.data) {
    for (const row of monev.value.data) {
      items.push({
        at: row.createdAt,
        time: row.createdAt,
        title: `Jadwal Monev "${row.label}" dipublikasikan`,
        by: "Admin",
      });
    }
  }

  if (dtRuns.status === "fulfilled" && dtRuns.value.data) {
    for (const row of dtRuns.value.data) {
      items.push({
        at: row.analyzed_at,
        time: row.analyzed_at,
        title: `Model decision tree dilatih ulang · akurasi ${(row.akurasi_model * 100).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
        by: "Sistem",
      });
    }
  }

  return items
    .filter((i) => !!i.at)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 7)
    .map(({ time, title, by }) => ({ time, title, by }));
}

/** Agregasi semua data yang dibutuhkan dashboard admin dalam satu panggilan. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    batchesRes,
    rows,
    dtRes,
    activity,
    recentInterviewsRes,
    pewawancaraAktifRes,
    sesiAktifRes,
  ] = await Promise.all([
    supabaseAdmin.from("impor_data").select("valid_rows, error_rows"),
    fetchAllKandidat(),
    supabaseAdmin
      .from("hasil_analitik_dt")
      .select("akurasi_model, jumlah_fitur, tahun_seleksi, jalur_masuk, analyzed_at")
      .order("analyzed_at", { ascending: false })
      .limit(1),
    getActivityFeed(),
    supabaseAdmin
      .from("hasil_wawancara")
      .select(
        "id, hasil_akhir, rekomendasi, interviewed_at, kandidat:kandidat_id(nama_pendaftar, prodi_pendaftar, no_pendaftaran_kipk), pewawancara:pewawancara_id(nama)",
      )
      .eq("is_draft", false)
      .not("interviewed_at", "is", null)
      .order("interviewed_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("pewawancara")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabaseAdmin
      .from("sesi_wawancara")
      .select("id", { count: "exact", head: true })
      .eq("war_aktif", true),
  ]);

  const batches = batchesRes.data ?? [];
  const valid = batches.reduce((sum, b) => sum + (b.valid_rows ?? 0), 0);
  const incomplete = batches.reduce((sum, b) => sum + (b.error_rows ?? 0), 0);

  const total = rows.length;

  let wawancaraSelesai = 0;
  const trendMap = new Map<number, { pendaftar: number; penerima: number }>();

  for (const row of rows) {
    const hasilList = row.hasil_wawancara ?? [];
    const finalized = hasilList.find((h) => h.is_draft === false);
    if (finalized) wawancaraSelesai += 1;

    const tahun = row.impor_data?.tahun_seleksi;
    if (tahun) {
      const entry = trendMap.get(tahun) ?? { pendaftar: 0, penerima: 0 };
      entry.pendaftar += 1;
      if (finalized?.hasil_akhir === "Diusulkan") entry.penerima += 1;
      trendMap.set(tahun, entry);
    }
  }

  // 5 siklus seleksi terakhir yang benar-benar ada datanya — tidak diisi-isi
  // supaya tetap 5 tahun; grafik akan terisi penuh secara alami seiring
  // bertambahnya siklus penerimaan di tahun-tahun berikutnya.
  const pendaftarPenerimaTrend: DashboardTrendPoint[] = Array.from(
    trendMap.entries(),
  )
    .map(([tahun, v]) => ({ tahun, pendaftar: v.pendaftar, penerima: v.penerima }))
    .sort((a, b) => a.tahun - b.tahun)
    .slice(-5);

  const dtRow = dtRes.data?.[0] ?? null;

  const recentInterviews = (recentInterviewsRes.data ?? []).map((row) => {
    const kandidat = Array.isArray(row.kandidat) ? row.kandidat[0] : row.kandidat;
    const pewawancara = Array.isArray(row.pewawancara)
      ? row.pewawancara[0]
      : row.pewawancara;
    return {
      id: String(row.id),
      nama: kandidat?.nama_pendaftar ?? null,
      prodi: kandidat?.prodi_pendaftar ?? null,
      noPendaftaran: kandidat?.no_pendaftaran_kipk ?? null,
      pewawancara: pewawancara?.nama ?? null,
      rekomendasi: row.rekomendasi ?? null,
      hasilAkhir: row.hasil_akhir ?? null,
      interviewedAt: row.interviewed_at ?? null,
    };
  });

  return {
    total,
    valid,
    incomplete,
    wawancaraSelesai,
    wawancaraTotal: total,
    pewawancaraAktif: pewawancaraAktifRes.count ?? 0,
    sesiAktif: sesiAktifRes.count ?? 0,
    recentInterviews,
    pendaftarPenerimaTrend,
    dtAccuracy: dtRow
      ? {
          akurasi: dtRow.akurasi_model,
          tahun: dtRow.tahun_seleksi,
          jalur: dtRow.jalur_masuk,
          jumlahFitur: dtRow.jumlah_fitur,
          analyzedAt: dtRow.analyzed_at,
        }
      : null,
    recentActivity: activity,
  };
}
