"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { ChevronUp, LoaderCircle, LogOut, Menu, X } from "lucide-react";
import { ADMIN_NAV_ITEMS as navItems } from "@/lib/admin-nav";

const EXPANDED_WIDTH = 264;
const COLLAPSED_WIDTH = 72;

/** Jeda sebelum melebar (ms) — mencegah buka saat kursor hanya lewat */
const OPEN_DELAY = 80;
/** Jeda sebelum menutup (ms) — mencegah kedip saat kursor keluar sebentar */
const CLOSE_DELAY = 180;

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

const FOCUS_STYLE =
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-inset focus-visible:ring-[#818CF8]";

const drawerVariants: Variants = {
  hidden: { x: "-100%" },
  visible: {
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: { x: "-100%", transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

type PopupPosition = {
  left: number;
  bottom: number;
  width: number;
  maxHeight: number;
};

function isItemActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === "/admin"
    : pathname === href || pathname.startsWith(`${href}/`);
}

function BrandLink({
  expanded,
  onNavigate,
}: {
  expanded: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      aria-label="SAKTI — Dashboard admin"
      title={!expanded ? "SAKTI" : undefined}
      className={[
        "flex min-h-12 items-center rounded-[4px]",
        expanded ? "w-full gap-3" : "w-12 justify-center",
        FOCUS_STYLE,
      ].join(" ")}
    >
      <Image
        src="/Logo Sakti.png"
        alt=""
        width={40}
        height={40}
        className="h-14 w-14 shrink-0 object-contain"
      />

      {expanded && (
        <div className="min-w-0 whitespace-nowrap">
          <span className="block text-[22px] font-bold leading-7 tracking-[-0.02em] text-white">
            SAKTI
          </span>
          <span className="mt-0.5 block text-[12px] leading-5 text-[#EEF2FF]/70">
            Dashboard admin
          </span>
        </div>
      )}
    </Link>
  );
}

function NavList({
  pathname,
  expanded,
  onNavigate,
}: {
  pathname: string;
  expanded: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav
      id="admin-sidebar-nav"
      aria-label="Navigasi admin"
      className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-6 pt-6 [scrollbar-width:thin] [scrollbar-color:#3730A3_#000352]"
    >
      <div className="mb-3 flex h-4 items-center px-3">
        {expanded ? (
          <span className="whitespace-nowrap text-[10px] font-medium uppercase leading-4 tracking-[0.12em] text-[#EEF2FF]/60">
            Alur kerja
          </span>
        ) : (
          <span aria-hidden="true" className="mx-auto h-px w-5 bg-white/15" />
        )}
      </div>

      <ul className="space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = isItemActive(pathname, href);

          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                title={!expanded ? label : undefined}
                className={[
                  "group flex h-11 items-center overflow-hidden rounded-[4px]",
                  "transition-colors duration-150 motion-reduce:transition-none",
                  expanded ? "gap-3 px-3" : "justify-center",
                  isActive
                    ? "bg-[#3730A3] text-white"
                    : "text-[#EEF2FF]/80 hover:bg-[#818CF8]/10 hover:text-white",
                  FOCUS_STYLE,
                ].join(" ")}
              >
                <Icon
                  aria-hidden="true"
                  size={18}
                  strokeWidth={1.7}
                  className={[
                    "shrink-0 transition-colors",
                    isActive
                      ? "text-white"
                      : "text-[#A5ACF9] group-hover:text-white",
                  ].join(" ")}
                />

                {expanded && (
                  <span
                    className={[
                      "min-w-0 whitespace-nowrap text-[13px] leading-5",
                      isActive ? "font-semibold" : "font-medium",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

interface AdminNavigationProps {
  adminName?: string;
}

export default function AdminNavigation({
  adminName = "Admin",
}: AdminNavigationProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(
    null,
  );

  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profilePopupRef = useRef<HTMLDivElement>(null);
  const logoutButtonRef = useRef<HTMLButtonElement>(null);
  const logoutPendingRef = useRef(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Melebar jika kursor di atas sidebar, fokus keyboard di dalamnya, atau popup akun terbuka. */
  const expanded = hovered || focusWithin || profileOpen;

  const displayName = adminName.trim() || "Admin";
  const displayInitials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  const sidebarTransition = { duration: reduceMotion ? 0 : 0.22, ease: EASE };
  const popupTransition = { duration: reduceMotion ? 0 : 0.14, ease: EASE };

  // ==========================================================
  // HOVER EXPAND / COLLAPSE
  // ==========================================================

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => setHovered(true), OPEN_DELAY);
  };

  const handleMouseLeave = () => {
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => setHovered(false), CLOSE_DELAY);
  };

  const handleFocus = () => setFocusWithin(true);

  const handleBlur = (e: ReactFocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setFocusWithin(false);
    }
  };

  useEffect(() => {
    return () => clearHoverTimer();
  }, []);

  // ==========================================================
  // POPUP AKUN
  // ==========================================================

  const updatePopupPosition = useCallback(() => {
    const button = profileButtonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const margin = 12;
    const gap = 8;
    const width = Math.min(240, window.innerWidth - margin * 2);
    const preferredLeft = expanded ? rect.left : rect.right + gap;

    const left = Math.max(
      margin,
      Math.min(preferredLeft, window.innerWidth - width - margin),
    );
    const bottom = Math.max(margin, window.innerHeight - rect.top + gap);

    setPopupPosition({
      left,
      bottom,
      width,
      maxHeight: Math.max(0, window.innerHeight - bottom - margin),
    });
  }, [expanded]);

  function toggleProfile() {
    if (!profileOpen) updatePopupPosition();
    setProfileOpen((current) => !current);
  }

  async function handleLogout() {
    if (logoutPendingRef.current) return;

    logoutPendingRef.current = true;
    setIsLoggingOut(true);
    setLogoutError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) throw new Error("Logout gagal");

      window.location.assign("/admin-login");
    } catch {
      logoutPendingRef.current = false;
      setIsLoggingOut(false);
      setLogoutError("Belum berhasil keluar. Silakan coba lagi.");
    }
  }

  // Tutup popup, sidebar & drawer saat pindah halaman
  useEffect(() => {
    setProfileOpen(false);
    setHovered(false);
    setFocusWithin(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return;

    // Tunggu animasi lebar selesai agar posisi popup akurat
    updatePopupPosition();
    const positionTimer = setTimeout(
      updatePopupPosition,
      reduceMotion ? 0 : 240,
    );
    const focusFrame = window.requestAnimationFrame(() => {
      logoutButtonRef.current?.focus();
    });

    function isInsideProfile(target: EventTarget | null) {
      if (!(target instanceof Node)) return false;
      return (
        profileButtonRef.current?.contains(target) ||
        profilePopupRef.current?.contains(target)
      );
    }

    function handlePointerDown(event: PointerEvent) {
      if (!isInsideProfile(event.target)) setProfileOpen(false);
    }

    function handleFocusIn(event: FocusEvent) {
      if (!isInsideProfile(event.target)) setProfileOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    }

    function handleResize() {
      if (window.innerWidth < 768) {
        setProfileOpen(false);
        return;
      }
      updatePopupPosition();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", updatePopupPosition, true);

    return () => {
      clearTimeout(positionTimer);
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", updatePopupPosition, true);
    };
  }, [profileOpen, updatePopupPosition, reduceMotion]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/*
       * Placeholder selebar sidebar tertutup (72px). Saat sidebar melebar
       * ia MENIMPA konten, bukan mendorongnya.
       */}
      <div
        className="sticky top-0 z-70 hidden h-dvh shrink-0 md:block"
        style={{ width: COLLAPSED_WIDTH }}
      >
        <motion.aside
          initial={false}
          animate={{ width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
          transition={sidebarTransition}
          aria-label="Sidebar admin"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={[
            "absolute inset-y-0 left-0 flex flex-col overflow-hidden",
            "border-r border-white/10 bg-[#000352]",
            "transition-shadow duration-200",
            expanded ? "shadow-[8px_0_32px_rgba(0,3,82,0.25)]" : "shadow-none",
          ].join(" ")}
        >
          <header
            className={[
              "flex h-24 shrink-0 items-center border-b border-white/10",
              expanded ? "px-5" : "justify-center px-3",
            ].join(" ")}
          >
            <BrandLink expanded={expanded} />
          </header>

          <NavList pathname={pathname} expanded={expanded} />

          <footer className="shrink-0 border-t border-white/10 p-3">
            <button
              ref={profileButtonRef}
              type="button"
              onClick={toggleProfile}
              aria-label={`Opsi akun ${displayName}`}
              aria-expanded={profileOpen}
              aria-controls={profileOpen ? "admin-profile-popup" : undefined}
              title={!expanded ? displayName : undefined}
              className={[
                "flex min-h-14 w-full items-center rounded-[4px] text-left",
                "transition-colors duration-150",
                expanded ? "gap-3 px-2 py-2" : "justify-center py-2",
                profileOpen ? "bg-[#818CF8]/15" : "hover:bg-[#818CF8]/10",
                FOCUS_STYLE,
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-[#818CF8]/25 bg-[#EEF2FF]/10 text-[12px] font-semibold text-[#EEF2FF]"
              >
                {displayInitials}
              </span>

              {expanded && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold leading-5 text-white">
                      {displayName}
                    </p>
                    <p className="mt-0.5 whitespace-nowrap text-[11px] leading-4 text-[#EEF2FF]/65">
                      Administrator
                    </p>
                  </div>

                  <ChevronUp
                    aria-hidden="true"
                    size={15}
                    strokeWidth={1.7}
                    className={[
                      "shrink-0 text-[#EEF2FF]/60",
                      "transition-transform duration-150 motion-reduce:transition-none",
                      profileOpen ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </>
              )}
            </button>
          </footer>
        </motion.aside>
      </div>

      {/* Popup akun berada di luar area sidebar */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {profileOpen && popupPosition && (
              <motion.div
                key="admin-profile-popup"
                ref={profilePopupRef}
                id="admin-profile-popup"
                role="region"
                aria-label="Opsi akun admin"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                transition={popupTransition}
                style={{
                  position: "fixed",
                  left: popupPosition.left,
                  bottom: popupPosition.bottom,
                  width: popupPosition.width,
                  maxHeight: popupPosition.maxHeight,
                }}
                className="z-[100] overflow-y-auto rounded-[6px] border border-slate-200 bg-white p-1.5 shadow-[0_8px_24px_rgba(0,3,82,0.12)]"
              >
                <div className="border-b border-slate-200 px-3 pb-3 pt-2">
                  <p className="break-words text-[13px] font-semibold leading-5 text-[#000352]">
                    {displayName}
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    Administrator
                  </p>
                </div>

                <button
                  ref={logoutButtonRef}
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-[4px] px-3 py-2.5 text-left text-[13px] font-medium text-[#000352] transition-colors hover:bg-[#EEF2FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#818CF8] disabled:cursor-wait disabled:opacity-60"
                >
                  {isLoggingOut ? (
                    <LoaderCircle
                      aria-hidden="true"
                      size={17}
                      strokeWidth={1.7}
                      className="shrink-0 animate-spin text-[#3730A3] motion-reduce:animate-none"
                    />
                  ) : (
                    <LogOut
                      aria-hidden="true"
                      size={17}
                      strokeWidth={1.7}
                      className="shrink-0 text-[#3730A3]"
                    />
                  )}
                  <span>{isLoggingOut ? "Sedang keluar…" : "Keluar"}</span>
                </button>

                {logoutError && (
                  <p
                    role="alert"
                    className="px-3 pb-2 pt-1 text-[12px] leading-5 text-red-700"
                  >
                    {logoutError}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* Mobile Topbar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#000352] px-4 py-2.5 md:hidden">
        <Link
          href="/admin"
          aria-label="SAKTI — Dashboard admin"
          className={["flex items-center gap-2 rounded-[4px]", FOCUS_STYLE].join(
            " ",
          )}
        >
          <Image
            src="/Logo Sakti.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="text-[20px] font-bold leading-none text-white">
            SAKTI
          </span>
        </Link>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setMobileOpen(true)}
          aria-label="Buka menu navigasi"
          className={[
            "grid h-11 w-11 place-items-center rounded-[4px] border border-white/15 text-white transition-colors hover:bg-[#818CF8]/10",
            FOCUS_STYLE,
          ].join(" ")}
        >
          <Menu size={20} strokeWidth={1.7} />
        </motion.button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              aria-label="Menu navigasi admin"
              className="relative flex h-full w-[270px] flex-col border-r border-white/10 bg-[#000352] shadow-xl"
            >
              <header className="flex h-24 shrink-0 items-center border-b border-white/10 px-5">
                <BrandLink expanded onNavigate={() => setMobileOpen(false)} />
              </header>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setMobileOpen(false)}
                aria-label="Tutup menu navigasi"
                className={[
                  "absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-[4px] text-white/70 transition-colors hover:bg-[#818CF8]/10 hover:text-white",
                  FOCUS_STYLE,
                ].join(" ")}
              >
                <X size={18} strokeWidth={1.7} />
              </motion.button>

              <NavList
                pathname={pathname}
                expanded
                onNavigate={() => setMobileOpen(false)}
              />

              <footer className="shrink-0 border-t border-white/10 p-3">
                <div className="flex min-h-14 items-center gap-3 px-2 py-2">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-[#818CF8]/25 bg-[#EEF2FF]/10 text-[12px] font-semibold text-[#EEF2FF]"
                  >
                    {displayInitials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold leading-5 text-white">
                      {displayName}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-4 text-[#EEF2FF]/65">
                      Administrator
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    title="Keluar"
                    aria-label="Keluar"
                    className={[
                      "grid h-10 w-10 shrink-0 place-items-center rounded-[4px] border border-white/15 text-[#A5ACF9] transition-colors hover:bg-[#818CF8]/10 hover:text-white disabled:cursor-wait disabled:opacity-60",
                      FOCUS_STYLE,
                    ].join(" ")}
                  >
                    {isLoggingOut ? (
                      <LoaderCircle
                        aria-hidden="true"
                        size={16}
                        strokeWidth={1.7}
                        className="animate-spin motion-reduce:animate-none"
                      />
                    ) : (
                      <LogOut aria-hidden="true" size={16} strokeWidth={1.7} />
                    )}
                  </button>
                </div>
                {logoutError && (
                  <p role="alert" className="px-2 pt-1 text-[12px] text-red-300">
                    {logoutError}
                  </p>
                )}
              </footer>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
