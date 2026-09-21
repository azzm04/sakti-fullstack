"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

interface ServiceItem {
  title: string;
  description: string;
  image: string;
  href: string;
}

const SERVICES: ServiceItem[] = [
  {
    title: "Pengingat Telegram",
    description: "Terima pengingat batas pengumpulan laporan melalui akun Telegram Anda.",
    image: "/illustrations/telegram-animated.svg",
    href: "/mahasiswa/monev",
  },
  {
    title: "SAKABOT",
    description: "Tanyakan informasi KIP Kuliah, persyaratan dokumen, atau cara mengisi laporan.",
    image: "/illustrations/sakabot-animated.svg",
    href: "/mahasiswa/chatbot",
  },
  {
    title: "Pendataan Prestasi",
    description: "Catat prestasi akademik dan nonakademik selama menjadi penerima KIP Kuliah.",
    image: "/illustrations/prestasi-animated.svg",
    href: "/mahasiswa/prestasi",
  },
  {
    title: "Pengunduran Diri",
    description: "Kelola pengajuan pengunduran diri beserta dokumen pendukungnya.",
    image: "/illustrations/pengunduran-diri-animated.svg",
    href: "/mahasiswa/pengunduran-diri",
  },
];

export default function ServiceGrid() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section
      aria-labelledby="services-heading"
      className="pt-4 sm:pt-6 pb-12 sm:pb-16"
    >
      <div className="mb-6 sm:mb-8">
        <h2
          id="services-heading"
          className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-[#000352]"
        >
          Layanan Mahasiswa
        </h2>

        <p className="mt-2 max-w-xl text-[16px] leading-6 text-[#64748B]">
          Akses layanan pendukung dan administrasi KIP Kuliah.
        </p>
      </div>

      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {SERVICES.map((service) => (
              <div
                key={service.title}
                className="min-w-0 shrink-0 grow-0 basis-full pr-6 sm:basis-1/2 lg:basis-1/3"
              >
                <ServiceCard {...service} />
              </div>
            ))}
          </div>
        </div>

        {/* Panah kiri */}
        <button
          type="button"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          aria-label="Sebelumnya"
          className="absolute left-1 sm:left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#3730A3] shadow-sm transition hover:bg-[#EEF2FF] disabled:pointer-events-none disabled:opacity-40 sm:h-10 sm:w-10"
        >
          <ArrowLeft size={16} strokeWidth={2} className="shrink-0" />
        </button>

        {/* Panah kanan */}
        <button
          type="button"
          onClick={scrollNext}
          disabled={!canScrollNext}
          aria-label="Selanjutnya"
          className="absolute right-1 sm:right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#3730A3] shadow-sm transition hover:bg-[#EEF2FF] disabled:pointer-events-none disabled:opacity-40 sm:h-10 sm:w-10"
        >
          <ArrowRight size={16} strokeWidth={2} className="shrink-0" />
        </button>
      </div>
    </section>
  );
}

function ServiceCard({ title, description, image, href }: ServiceItem) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Ilustrasi */}
      <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-gradient-to-b from-[#EEF2FF] to-white">
        <Image
          src={image}
          alt=""
          fill
          unoptimized
          className="object-contain"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
      <h3 className="text-[20px] font-semibold leading-7 text-[#000352]">
        {title}
      </h3>

      <p className="mt-2 text-[15px] leading-[23px] text-[#64748B]">
        {description}
      </p>

      <div className="mt-auto pt-6">
        <Link
          href={href}
          className="inline-flex min-h-11 items-center gap-2 rounded-md text-[14px] font-medium text-[#3730A3] transition-colors hover:text-[#000352] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] focus-visible:ring-offset-4"
        >
          <span>Selengkapnya</span>
          <ArrowRight
            aria-hidden="true"
            size={16}
            strokeWidth={2}
            className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
          />
        </Link>
      </div>
      </div>
    </article>
  );
}