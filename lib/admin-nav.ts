import {
  LayoutDashboard,
  Upload,
  ListOrdered,
  Users,
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
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/import", label: "Import Data", icon: Upload },
  { href: "/admin/wawancara/pengguna", label: "Daftar Pengguna", icon: Users },
  {
    href: "/admin/wawancara/urutan",
    label: "Urutan Pewawancara",
    icon: ListOrdered,
  },
  { href: "/admin/evaluasi", label: "Evaluasi", icon: ClipboardCheck },
  { href: "/admin/filtering", label: "Filtering Kuota", icon: ListFilter },
  { href: "/admin/hasil-akhir", label: "Hasil Akhir", icon: Award },
  { href: "/admin/monev", label: "Monev", icon: BookMarked },
  { href: "/admin/analitik", label: "Analitik", icon: BarChart3 },
  { href: "/admin/prestasi", label: "Prestasi", icon: Award },
  { href: "/admin/pengunduran-diri", label: "Undur Diri", icon: UserMinus },
  { href: "/admin/aduan", label: "Aduan", icon: UserMinus },
];

export function findActiveAdminNavItem(pathname: string): AdminNavItem | null {
  const matches = ADMIN_NAV_ITEMS.filter((item) =>
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href + "/") || pathname === item.href,
  );
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.href.length - a.href.length)[0];
}
