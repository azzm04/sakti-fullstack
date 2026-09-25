/**
 * Satu-satunya tempat definisi menu navigasi admin (sidebar + breadcrumb).
 * Sebelumnya label "Import Data", "Evaluasi", dll ditulis ulang manual di
 * setiap halaman (lewat prop `breadcrumb` PageHeader) sehingga gampang
 * kelewat sinkron kalau nama menu berubah. Sekarang breadcrumb default
 * di PageHeader diturunkan otomatis dari daftar ini berdasarkan pathname
 * aktif — import dari sini saja, jangan didefinisikan ulang di file lain.
 */

import {
  LayoutDashboard,
  Upload,
  Zap,
  ClipboardCheck,
  BookMarked,
  BarChart3,
  Award,
  ListFilter,
  UserMinus,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin",                    label: "Dashboard",        icon: LayoutDashboard },
  { href: "/admin/import",             label: "Import Data",      icon: Upload          },
  { href: "/admin/wawancara",          label: "Wawancara",        icon: Zap             },
  { href: "/admin/evaluasi",           label: "Evaluasi",         icon: ClipboardCheck  },
  { href: "/admin/filtering",          label: "Filtering Kuota",  icon: ListFilter      },
  { href: "/admin/hasil-akhir",        label: "Hasil Akhir",      icon: Award           },
  { href: "/admin/monev",              label: "Monev",            icon: BookMarked      },
  { href: "/admin/analitik",           label: "Analitik",         icon: BarChart3       },
  { href: "/admin/prestasi",           label: "Prestasi",         icon: Award           },
  { href: "/admin/pengunduran-diri",   label: "Undur Diri",       icon: UserMinus       },
  { href: "/admin/aduan",              label: "Aduan",            icon: UserMinus       },
];

/** Cari item nav yang paling cocok dengan pathname aktif (mis. /admin/evaluasi/123 → "Evaluasi"). */
export function findActiveAdminNavItem(pathname: string): AdminNavItem | null {
  const matches = ADMIN_NAV_ITEMS.filter((item) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href + "/") || pathname === item.href,
  );
  if (matches.length === 0) return null;
  // Ambil href terpanjang supaya sub-route (mis. /admin/evaluasi/[id]) tidak
  // ketiban match "/admin" yang lebih pendek.
  return matches.sort((a, b) => b.href.length - a.href.length)[0];
}
