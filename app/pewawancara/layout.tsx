"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList } from "lucide-react";

const navItems = [
  { href: "/pewawancara",            label: "Dashboard",  icon: LayoutDashboard },
  { href: "/pewawancara/mahasiswa",  label: "Mahasiswa",  icon: ClipboardList   },
];

export default function PewawancaraLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50 font-body">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-border sticky top-0 h-screen py-6">
        <div className="px-5 mb-6">
          <p className="text-xl font-extrabold font-headline text-primary">SAKTI</p>
          <p className="text-xs text-muted-foreground mt-0.5">Portal Pewawancara</p>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/pewawancara"
              ? pathname === "/pewawancara"
              : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}>
                <Icon size={16} /> {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
