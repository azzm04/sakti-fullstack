"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Mail,
  Phone,
} from "lucide-react";
import { useCurrentUser } from "@/hook/useCurrentUser";
import ServiceGrid from "@/components/mahasiswa/ServiceGrid";

interface MonevSchedule {
  id: string;
  tipe_monev: string;
  label: string;
  waktu_mulai: string | null;
  deadline: string;
  is_active: boolean;
  created_at: string;
}

// Informasi kontak pengelola
const SUPPORT = {
  unitName: "Pengelola Beasiswa KIP Kuliah Universitas Diponegoro",
  email: "beasiswa@live.undip.ac.id",
  whatsappNumber: "6281234567890",
  serviceHours: "Senin - Jumat, 08.00 - 16.00 WIB",
};

const FOOTER = {
  guideHref: "",
  privacyHref: "",
};

const FOCUS_STYLE =
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-[#818CF8] focus-visible:ring-offset-2";

const OUTLINE_BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 " +
  "rounded-lg border border-slate-300 bg-white px-4 py-2.5 " +
  "text-[13px] font-medium leading-5 text-[#000352] " +
  "transition-colors hover:border-[#3730A3] hover:bg-[#EEF2FF] " +
  FOCUS_STYLE;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  })
    .format(new Date(value))
    .replace(":", ".");
}

function DashboardFooter() {
  const hasLinks = Boolean(
    FOOTER.guideHref || FOOTER.privacyHref,
  );

  return (
    <footer className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <p className="text-[12px] leading-5 text-[#64748B]">
        <span className="font-medium text-[#000352]">
          SAKTI
        </span>

        <span className="mx-2" aria-hidden="true">
          ·
        </span>

        Universitas Diponegoro
      </p>

      {hasLinks && (
        <nav
          aria-label="Informasi pendukung"
          className="flex items-center gap-5"
        >
          {FOOTER.guideHref && (
            <Link
              href={FOOTER.guideHref}
              className={`inline-flex min-h-11 items-center rounded-lg text-[12px] leading-5 text-[#64748B] underline-offset-4 transition-colors hover:text-[#3730A3] hover:underline ${FOCUS_STYLE}`}
            >
              Panduan
            </Link>
          )}

          {FOOTER.privacyHref && (
            <Link
              href={FOOTER.privacyHref}
              className={`inline-flex min-h-11 items-center rounded-lg text-[12px] leading-5 text-[#64748B] underline-offset-4 transition-colors hover:text-[#3730A3] hover:underline ${FOCUS_STYLE}`}
            >
              Privasi
            </Link>
          )}
        </nav>
      )}
    </footer>
  );
}

export default function DashboardMahasiswa() {
  const { user, loading } = useCurrentUser();

  // State dinamis dari API monev
  const [statusMonev, setStatusMonev] = useState("Belum ada jadwal");
  const [batasText, setBatasText] = useState("Belum ada jadwal aktif");

  const namaDepan =
    user?.nama?.trim().split(/\s+/)[0] || "Mahasiswa";

  // Ambil jadwal & status Monev aktual
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const schedRes = await fetch("/api/monev/schedule");
        if (!schedRes.ok) return;
        const schedJson = await schedRes.json();
        const schedules: MonevSchedule[] = schedJson.data || [];

        // Prioritaskan periode aktif yang belum lewat deadline, atau periode terbaru
        const now = Date.now();
        const active =
          schedules.find(
            (s) => s.is_active && new Date(s.deadline).getTime() > now
          ) ||
          schedules.find((s) => s.is_active) ||
          schedules[0] ||
          null;

        let submitted = false;
        if (active) {
          const subRes = await fetch(
            `/api/monev/check-submission?periode_id=${encodeURIComponent(active.id)}`
          );
          if (subRes.ok) {
            const subJson = await subRes.json();
            submitted = subJson.submitted === true;
          }
        }

        if (!isMounted) return;

        if (active) {
          const deadlinePassed =
            new Date(active.deadline).getTime() < Date.now();
          setStatusMonev(
            submitted
              ? "Monev terkirim"
              : deadlinePassed
                ? "Monev ditutup"
                : "Monev berlangsung"
          );
          setBatasText(
            `Batas: ${formatDate(active.deadline)}, ${formatTime(active.deadline)} WIB`
          );
        } else {
          setStatusMonev("Belum ada jadwal");
          setBatasText("Belum ada jadwal aktif");
        }
      } catch (err) {
        console.error("Gagal mengambil data monev dashboard:", err);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      className="min-h-full bg-[#F8FAFC] text-[#000352]"
      style={{ fontFamily: "Roboto, sans-serif" }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hero: Sapaan + Info Monev */}
        <section
          aria-labelledby="welcome-heading"
          className="pt-8 pb-10 sm:pt-10 sm:pb-12"
        >
          <article className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
            {/* Area Welcome */}
            <div className="relative isolate flex min-h-[180px] items-center overflow-hidden px-5 py-8 sm:min-h-[220px] sm:px-8 lg:min-h-[240px]">
              {/* Teks sapaan */}
              <div className="relative z-10 min-w-0 lg:max-w-[68%]">
                <h1
                  id="welcome-heading"
                  className="text-[24px] font-semibold leading-[32px] text-[#000352] lg:text-[32px] lg:leading-[40px]"
                >
                  {loading ? (
                    <span
                      aria-hidden="true"
                      className="inline-block h-10 w-64 max-w-full animate-pulse rounded-lg bg-slate-200"
                    />
                  ) : (
                    <>
                      Selamat datang,{" "}
                      <span className="[overflow-wrap:anywhere]">
                        {namaDepan}.
                      </span>
                    </>
                  )}
                </h1>

                <p className="mt-3 text-[16px] leading-6 text-[#64748B]">
                  Kelola pelaporan dan layanan KIP Kuliah Anda.
                </p>
              </div>

              {/* Siluet logo SAKTI — hanya di area welcome */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] max-w-[440px] overflow-hidden sm:block"
                 style={{
    maskImage:
      "linear-gradient(to right, transparent 0%, black 24%, black 100%)",
    WebkitMaskImage:
      "linear-gradient(to right, transparent 0%, black 24%, black 100%)",
  }}
              >
                <Image
                  src="/background/card%20background%20sakti.png"
                  alt=""
                  fill
                  unoptimized
                  className="origin-top-right scale-[1.15] object-cover object-right-top"
                />
              </div>
            </div>

            {/* Area Monev */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 bg-[#EEF2FF] px-5 py-4 sm:px-8 lg:min-h-[84px]">
              <span className="text-[14px] font-medium text-[#000352]">
                {statusMonev}
              </span>

              <span
                aria-hidden="true"
                className="hidden h-5 w-px bg-[#000352]/20 sm:block"
              />

              <span className="text-[14px] leading-6 text-[#64748B]">
                {batasText}
              </span>

              <Link
                href="/mahasiswa/monev"
                className="ml-auto inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#000352] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#23155c]"
              >
                Lihat jadwal
                <ArrowRight
                  aria-hidden="true"
                  size={16}
                  strokeWidth={2}
                  className="shrink-0"
                />
              </Link>
            </div>
          </article>
        </section>

        {/* Layanan mahasiswa */}
        <ServiceGrid />
        <DashboardFooter />
      </div>
    </div>
  );
}