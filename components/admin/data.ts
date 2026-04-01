// ── Shared types & data for admin dashboard ───────────────────────────────────

export type SortKey = "rank" | "ipk" | "penghasilan_raw" | "skor";
export type SortDir = "asc" | "desc";
export type StatusFilter = "Semua" | "Prioritas Utama" | "Direkomendasikan" | "Cadangan";

export interface Pendaftar {
  rank: number;
  nama: string;
  nim: string;
  prodi: string;
  ipk: number;
  penghasilan: string;
  penghasilan_raw: number;
  tanggungan: number;
  jarak: string;
  prestasi: string;
  skor: number;
  status: string;
}

export const RAW_DATA: Pendaftar[] = [
  { rank: 1,  nama: "Ahmad Dani Ramadhan", nim: "2021010001", prodi: "Teknik Informatika",  ipk: 3.92, penghasilan: "Rp 1.500.000", penghasilan_raw: 1500000, tanggungan: 4, jarak: "45 km", prestasi: "Juara 1 OSN",         skor: 0.9421, status: "Prioritas Utama"   },
  { rank: 2,  nama: "Siti Putri Lestari",  nim: "2021020034", prodi: "Pend. Matematika",    ipk: 3.88, penghasilan: "Rp 2.000.000", penghasilan_raw: 2000000, tanggungan: 3, jarak: "32 km", prestasi: "Juara 2 OSN",         skor: 0.9155, status: "Prioritas Utama"   },
  { rank: 3,  nama: "Budi Santoso",        nim: "2021030012", prodi: "Agribisnis",           ipk: 3.75, penghasilan: "Rp 1.200.000", penghasilan_raw: 1200000, tanggungan: 5, jarak: "78 km", prestasi: "-",                   skor: 0.8923, status: "Direkomendasikan"  },
  { rank: 4,  nama: "Dewi Ratnasari",      nim: "2021040056", prodi: "Akuntansi",            ipk: 3.80, penghasilan: "Rp 3.500.000", penghasilan_raw: 3500000, tanggungan: 2, jarak: "12 km", prestasi: "Juara 3 Debat",       skor: 0.8641, status: "Direkomendasikan"  },
  { rank: 5,  nama: "Fajar Ardiansyah",    nim: "2021050078", prodi: "Hukum",                ipk: 3.65, penghasilan: "Rp 2.100.000", penghasilan_raw: 2100000, tanggungan: 3, jarak: "25 km", prestasi: "-",                   skor: 0.8211, status: "Cadangan"          },
  { rank: 6,  nama: "Nurul Hidayah",       nim: "2021060023", prodi: "Kedokteran",           ipk: 3.91, penghasilan: "Rp 1.800.000", penghasilan_raw: 1800000, tanggungan: 4, jarak: "60 km", prestasi: "Beasiswa Prestasi",   skor: 0.8102, status: "Cadangan"          },
  { rank: 7,  nama: "Rizky Firmansyah",    nim: "2021070045", prodi: "Teknik Sipil",         ipk: 3.55, penghasilan: "Rp 2.500.000", penghasilan_raw: 2500000, tanggungan: 2, jarak: "18 km", prestasi: "-",                   skor: 0.7834, status: "Cadangan"          },
  { rank: 8,  nama: "Anisa Maharani",      nim: "2021080067", prodi: "Psikologi",            ipk: 3.70, penghasilan: "Rp 3.000.000", penghasilan_raw: 3000000, tanggungan: 3, jarak: "22 km", prestasi: "Juara 2 Karya Tulis", skor: 0.7612, status: "Cadangan"          },
  { rank: 9,  nama: "Hendra Kusuma",       nim: "2021090011", prodi: "Teknik Elektro",       ipk: 3.60, penghasilan: "Rp 1.900.000", penghasilan_raw: 1900000, tanggungan: 4, jarak: "55 km", prestasi: "-",                   skor: 0.7401, status: "Cadangan"          },
  { rank: 10, nama: "Laila Fitriani",      nim: "2021100089", prodi: "Farmasi",              ipk: 3.78, penghasilan: "Rp 2.800.000", penghasilan_raw: 2800000, tanggungan: 3, jarak: "40 km", prestasi: "Juara 1 Karya Tulis", skor: 0.7188, status: "Cadangan"          },
];

export const CRITERIA = [
  { key: "penghasilan", label: "Penghasilan OT",    bobot: 30, type: "cost"    },
  { key: "tanggungan",  label: "Jml Tanggungan",    bobot: 20, type: "benefit" },
  { key: "ipk",         label: "IPK",               bobot: 25, type: "benefit" },
  { key: "jarak",       label: "Jarak Tempuh",      bobot: 10, type: "benefit" },
  { key: "prestasi",    label: "Prestasi Akademik", bobot: 15, type: "benefit" },
];

export const STATUS_STYLE: Record<string, { badge: string; dot: string }> = {
  "Prioritas Utama":  { badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",          dot: "bg-blue-500"    },
  "Direkomendasikan": { badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  "Cadangan":         { badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",      dot: "bg-slate-400"   },
};

export const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

export const STATUS_FILTERS: StatusFilter[] = ["Semua", "Prioritas Utama", "Direkomendasikan", "Cadangan"];
export const PAGE_SIZE = 5;

export function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}
