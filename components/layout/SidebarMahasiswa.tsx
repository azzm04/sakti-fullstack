"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  Award,
  BookMarked,
  Bot,
  ChevronUp,
  DoorOpen,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useCurrentUser } from "@/hook/useCurrentUser";

const EXPANDED_WIDTH = 264;
const COLLAPSED_WIDTH = 72;

const EASE: [number, number, number, number] = [
  0.4, 0, 0.2, 1,
];

const FOCUS_STYLE =
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-inset focus-visible:ring-[#818CF8]";

const menuItems = [
  {
    href: "/mahasiswa/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/mahasiswa/chatbot",
    icon: Bot,
    label: "SAKABOT",
  },
  {
    href: "/mahasiswa/monev",
    icon: BookMarked,
    label: "Laporan Monev",
  },
  {
    href: "/mahasiswa/prestasi",
    icon: Award,
    label: "Pendataan Prestasi",
  },
  {
    href: "/mahasiswa/pengunduran-diri",
    icon: DoorOpen,
    label: "Pengunduran Diri",
  },
];

type PopupPosition = {
  left: number;
  bottom: number;
  width: number;
  maxHeight: number;
};

export default function SidebarMahasiswa() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { user, loading } = useCurrentUser();

  const [expanded, setExpanded] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [popupPosition, setPopupPosition] =
    useState<PopupPosition | null>(null);

  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profilePopupRef = useRef<HTMLDivElement>(null);
  const logoutButtonRef = useRef<HTMLButtonElement>(null);
  const logoutPendingRef = useRef(false);

  const displayName = user?.nama?.trim() || "Mahasiswa";

  const displayInitials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  const sidebarTransition = {
    duration: reduceMotion ? 0 : 0.22,
    ease: EASE,
  };

  const popupTransition = {
    duration: reduceMotion ? 0 : 0.14,
    ease: EASE,
  };

  const updatePopupPosition = useCallback(() => {
    const button = profileButtonRef.current;

    if (!button) return;

    const rect = button.getBoundingClientRect();
    const margin = 12;
    const gap = 8;
    const width = Math.min(
      240,
      window.innerWidth - margin * 2,
    );

    const preferredLeft = expanded
      ? rect.left
      : rect.right + gap;

    const left = Math.max(
      margin,
      Math.min(
        preferredLeft,
        window.innerWidth - width - margin,
      ),
    );

    const bottom = Math.max(
      margin,
      window.innerHeight - rect.top + gap,
    );

    setPopupPosition({
      left,
      bottom,
      width,
      maxHeight: Math.max(
        0,
        window.innerHeight - bottom - margin,
      ),
    });
  }, [expanded]);

  function toggleSidebar() {
    setProfileOpen(false);
    setExpanded((current) => !current);
  }

  function toggleProfile() {
    if (!profileOpen) {
      updatePopupPosition();
    }

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

      if (!response.ok) {
        throw new Error("Logout gagal");
      }

      window.location.assign("/login");
    } catch {
      logoutPendingRef.current = false;
      setIsLoggingOut(false);
      setLogoutError(
        "Belum berhasil keluar. Silakan coba lagi.",
      );
    }
  }

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return;

    updatePopupPosition();

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
      if (!isInsideProfile(event.target)) {
        setProfileOpen(false);
      }
    }

    function handleFocusIn(event: FocusEvent) {
      if (!isInsideProfile(event.target)) {
        setProfileOpen(false);
      }
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

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    window.addEventListener(
      "scroll",
      updatePopupPosition,
      true,
    );

    return () => {
      window.cancelAnimationFrame(focusFrame);

      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
      document.removeEventListener(
        "focusin",
        handleFocusIn,
      );
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
      window.removeEventListener("resize", handleResize);
      window.removeEventListener(
        "scroll",
        updatePopupPosition,
        true,
      );
    };
  }, [profileOpen, updatePopupPosition]);

  return (
    <>
      <motion.aside
        initial={false}
        animate={{
          width: expanded
            ? EXPANDED_WIDTH
            : COLLAPSED_WIDTH,
        }}
        transition={sidebarTransition}
        aria-label="Sidebar mahasiswa"
        className="sticky top-0 z-40 hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#000352] md:flex"
        style={{ fontFamily: "Roboto, sans-serif" }}
      >
        {/* Identitas */}
        <header
          className={[
            "flex h-24 shrink-0 items-center border-b border-white/10",
            expanded ? "px-5" : "justify-center px-3",
          ].join(" ")}
        >
          <Link
            href="/mahasiswa/dashboard"
            aria-label="SAKTI — Dashboard mahasiswa"
            title={!expanded ? "SAKTI" : undefined}
            className={[
              "flex min-h-12 items-center rounded-[4px]",
              expanded ? "w-full gap-3" : "w-12 justify-center",
              FOCUS_STYLE,
            ].join(" ")}
          >
            <Image
              src="/Logo SAKTI.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 object-contain"
            />

            {expanded && (
              <div className="min-w-0 whitespace-nowrap">
                <span className="block text-[22px] font-bold leading-7 tracking-[-0.02em] text-white">
                  SAKTI
                </span>

                <span className="mt-0.5 block text-[12px] leading-5 text-[#EEF2FF]/70">
                  Portal mahasiswa
                </span>
              </div>
            )}
          </Link>
        </header>

        {/* Navigasi */}
        <nav
          id="mahasiswa-sidebar-nav"
          aria-label="Navigasi mahasiswa"
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-6 pt-6 [scrollbar-width:thin] [scrollbar-color:#3730A3_#000352]"
        >
          <div className="mb-3 flex h-4 items-center px-3">
            {expanded ? (
              <span className="whitespace-nowrap text-[10px] font-medium uppercase leading-4 tracking-[0.12em] text-[#EEF2FF]/60">
                Menu utama
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="mx-auto h-px w-5 bg-white/15"
              />
            )}
          </div>

          <ul className="space-y-1">
            {menuItems.map(({ href, icon: Icon, label }) => {
              const isActive =
                pathname === href ||
                pathname?.startsWith(`${href}/`);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-label={label}
                    aria-current={
                      isActive ? "page" : undefined
                    }
                    title={!expanded ? label : undefined}
                    className={[
                      "group flex h-11 items-center overflow-hidden rounded-[4px]",
                      "transition-colors duration-150 motion-reduce:transition-none",
                      expanded
                        ? "gap-3 px-3"
                        : "justify-center",
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
                          isActive
                            ? "font-semibold"
                            : "font-medium",
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

        {/* Kontrol sidebar */}
        <div className="shrink-0 px-3 pb-3">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={
              expanded ? "Tutup sidebar" : "Buka sidebar"
            }
            aria-expanded={expanded}
            aria-controls="mahasiswa-sidebar-nav"
            title={
              expanded ? "Tutup sidebar" : "Buka sidebar"
            }
            className={[
              "flex h-11 w-full items-center rounded-[4px]",
              "text-[#EEF2FF]/65 transition-colors",
              "hover:bg-[#818CF8]/10 hover:text-white",
              expanded
                ? "gap-3 px-3"
                : "justify-center",
              FOCUS_STYLE,
            ].join(" ")}
          >
            {expanded ? (
              <PanelLeftClose
                aria-hidden="true"
                size={18}
                strokeWidth={1.7}
                className="shrink-0"
              />
            ) : (
              <PanelLeftOpen
                aria-hidden="true"
                size={18}
                strokeWidth={1.7}
                className="shrink-0"
              />
            )}

            {expanded && (
              <span className="whitespace-nowrap text-[12px] font-medium">
                Tutup sidebar
              </span>
            )}
          </button>
        </div>

        {/* Akun mahasiswa */}
        <footer className="shrink-0 border-t border-white/10 p-3">
          <button
            ref={profileButtonRef}
            type="button"
            onClick={toggleProfile}
            aria-label={`Opsi akun ${displayName}`}
            aria-expanded={profileOpen}
            aria-controls={
              profileOpen
                ? "mahasiswa-profile-popup"
                : undefined
            }
            title={!expanded ? displayName : undefined}
            className={[
              "flex min-h-14 w-full items-center rounded-[4px] text-left",
              "transition-colors duration-150",
              expanded
                ? "gap-3 px-2 py-2"
                : "justify-center py-2",
              profileOpen
                ? "bg-[#818CF8]/15"
                : "hover:bg-[#818CF8]/10",
              FOCUS_STYLE,
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-[#818CF8]/25 bg-[#EEF2FF]/10 text-[12px] font-semibold text-[#EEF2FF]"
            >
              {loading ? "–" : displayInitials}
            </span>

            {expanded && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold leading-5 text-white">
                    {loading
                      ? "Memuat profil…"
                      : displayName}
                  </p>

                  <p className="mt-0.5 whitespace-nowrap text-[11px] leading-4 text-[#EEF2FF]/65">
                    Mahasiswa KIP Kuliah
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

      {/* Popup akun berada di luar area sidebar */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {profileOpen && popupPosition && (
              <motion.div
                key="mahasiswa-profile-popup"
                ref={profilePopupRef}
                id="mahasiswa-profile-popup"
                role="region"
                aria-label="Opsi akun mahasiswa"
                initial={{
                  opacity: 0,
                  y: reduceMotion ? 0 : 4,
                }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: reduceMotion ? 0 : 4,
                }}
                transition={popupTransition}
                style={{
                  position: "fixed",
                  left: popupPosition.left,
                  bottom: popupPosition.bottom,
                  width: popupPosition.width,
                  maxHeight: popupPosition.maxHeight,
                  fontFamily: "Roboto, sans-serif",
                }}
                className="z-[100] overflow-y-auto rounded-[6px] border border-slate-200 bg-white p-1.5 shadow-[0_8px_24px_rgba(0,3,82,0.12)]"
              >
                <div className="border-b border-slate-200 px-3 pb-3 pt-2">
                  <p className="break-words text-[13px] font-semibold leading-5 text-[#000352]">
                    {displayName}
                  </p>

                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    Mahasiswa KIP Kuliah
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

                  <span>
                    {isLoggingOut
                      ? "Sedang keluar…"
                      : "Keluar"}
                  </span>
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
    </>
  );
}