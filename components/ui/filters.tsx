"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Check,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleX,
  GraduationCap,
  Tag,
  UserCheck,
  X,
  ShieldCheck,
  ShieldAlert,
  TriangleAlert,
  Clock,
} from "lucide-react";
import { Dispatch, SetStateAction, useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "motion/react";

// ── AnimateChangeInHeight ─────────────────────────────────────────────────────
interface AnimateChangeInHeightProps {
  children: React.ReactNode;
  className?: string;
}
export const AnimateChangeInHeight: React.FC<AnimateChangeInHeightProps> = ({
  children,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  useEffect(() => {
    if (containerRef.current) {
      const ro = new ResizeObserver((entries) =>
        setHeight(entries[0].contentRect.height),
      );
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    }
  }, []);
  return (
    <motion.div
      className={cn(className, "overflow-hidden")}
      style={{ height }}
      animate={{ height }}
      transition={{ duration: 0.1, ease: "easeIn" }}
    >
      <div ref={containerRef}>{children}</div>
    </motion.div>
  );
};

// ── Filter Types untuk SAKTI Evaluasi ─────────────────────────────────────────
export enum FilterType {
  HASIL_AKHIR = "Hasil Akhir",
  REKOMENDASI = "Rekomendasi",
  STATUS = "Status",
  JALUR_MASUK = "Jalur Masuk",
  PEWAWANCARA = "Pewawancara",
  // Monev
  VALIDASI_MONEV = "Validasi",
}

export enum FilterOperator {
  IS = "is",
  IS_NOT = "is not",
  IS_ANY_OF = "is any of",
}

export enum HasilAkhir {
  DIUSULKAN = "Diusulkan",
  TIDAK_DIUSULKAN = "Tidak Diusulkan",
  PERLU_REVIEW = "Perlu Review",
}

export enum RekomendasiWawancara {
  LAYAK = "Layak",
  LAYAK_DIPERTIMBANGKAN = "Layak Dipertimbangkan",
  TIDAK_LAYAK_DIPERTIMBANGKAN = "Tidak Layak Dipertimbangkan",
  TIDAK_LAYAK = "Tidak Layak",
}

export enum StatusEvaluasi {
  SELESAI = "Selesai",
  BELUM = "Belum",
}

export enum JalurMasuk {
  SNBP_Eligible = "SNBP Eligible",
  SNBP_Non_Eligible = "SNBP Non Eligible",
  SNBT_Eligible = "SNBT Eligible",
  SNBT_Non_Eligible = "SNBT Non Eligible",
  UM = "UM",
}

export enum ValidasiMonev {
  SESUAI = "Sesuai",
  BELUM_MENGISI = "Belum Mengisi",
  MELEBIHI_BATAS = "Melebihi Batas",
  DATA_TIDAK_SESUAI = "Data Tidak Sesuai",
}

export type FilterOption = {
  name: string;
  icon?: React.ReactNode;
  label?: string;
};
export type Filter = {
  id: string;
  type: FilterType;
  operator: FilterOperator;
  value: string[];
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const FilterIcon = ({ type }: { type: string }) => {
  switch (type) {
    case FilterType.HASIL_AKHIR:
      return <CircleDashed className="size-3.5 text-muted-foreground" />;
    case FilterType.REKOMENDASI:
      return <Circle className="size-3.5 text-muted-foreground" />;
    case FilterType.STATUS:
      return <CircleCheck className="size-3.5 text-muted-foreground" />;
    case FilterType.JALUR_MASUK:
      return <GraduationCap className="size-3.5 text-muted-foreground" />;
    case FilterType.PEWAWANCARA:
      return <UserCheck className="size-3.5 text-muted-foreground" />;
    case HasilAkhir.DIUSULKAN:
      return <CircleCheck className="size-3.5 text-emerald-500" />;
    case HasilAkhir.TIDAK_DIUSULKAN:
      return <CircleX className="size-3.5 text-red-500" />;
    case HasilAkhir.PERLU_REVIEW:
      return <TriangleAlert className="size-3.5 text-amber-500" />;
    case RekomendasiWawancara.LAYAK:
      return <CircleCheck className="size-3.5 text-emerald-500" />;
    case RekomendasiWawancara.LAYAK_DIPERTIMBANGKAN:
      return <Circle className="size-3.5 text-teal-500" />;
    case RekomendasiWawancara.TIDAK_LAYAK_DIPERTIMBANGKAN:
      return <Circle className="size-3.5 text-amber-500" />;
    case RekomendasiWawancara.TIDAK_LAYAK:
      return <CircleX className="size-3.5 text-red-500" />;
    case StatusEvaluasi.SELESAI:
      return <CircleCheck className="size-3.5 text-emerald-500" />;
    case StatusEvaluasi.BELUM:
      return <CircleDashed className="size-3.5 text-amber-500" />;
    case JalurMasuk.SNBP_Eligible:
      return (
        <span className="text-[9px] font-bold px-1 py-0.5 bg-blue-100 text-blue-700 rounded">
          SNBP Eligible
        </span>
      );
    case JalurMasuk.SNBP_Non_Eligible:
      return (
        <span className="text-[9px] font-bold px-1 py-0.5 bg-blue-100 text-blue-700 rounded">
          SNBP Non-Eligible
        </span>
      );
    case JalurMasuk.SNBT_Eligible:
      return (
        <span className="text-[9px] font-bold px-1 py-0.5 bg-purple-100 text-purple-700 rounded">
          SNBT Eligible
        </span>
      );
    case JalurMasuk.SNBT_Non_Eligible:
      return (
        <span className="text-[9px] font-bold px-1 py-0.5 bg-purple-100 text-purple-700 rounded">
          SNBT Non-Eligible
        </span>
      );
    case JalurMasuk.UM:
      return (
        <span className="text-[9px] font-bold px-1 py-0.5 bg-orange-100 text-orange-700 rounded">
          UM
        </span>
      );
    // Monev
    case FilterType.VALIDASI_MONEV:
      return <ShieldCheck className="size-3.5 text-muted-foreground" />;
    case ValidasiMonev.SESUAI:
      return <CircleCheck className="size-3.5 text-emerald-500" />;
    case ValidasiMonev.BELUM_MENGISI:
      return <Clock className="size-3.5 text-amber-500" />;
    case ValidasiMonev.MELEBIHI_BATAS:
      return <ShieldAlert className="size-3.5 text-red-500" />;
    case ValidasiMonev.DATA_TIDAK_SESUAI:
      return <TriangleAlert className="size-3.5 text-orange-500" />;
    default:
      return <Tag className="size-3.5" />;
  }
};

// ── Filter options (Evaluasi) ─────────────────────────────────────────────────
export const filterViewOptions: FilterOption[][] = [
  [
    {
      name: FilterType.HASIL_AKHIR,
      icon: <FilterIcon type={FilterType.HASIL_AKHIR} />,
    },
    {
      name: FilterType.REKOMENDASI,
      icon: <FilterIcon type={FilterType.REKOMENDASI} />,
    },
    { name: FilterType.STATUS, icon: <FilterIcon type={FilterType.STATUS} /> },
    {
      name: FilterType.JALUR_MASUK,
      icon: <FilterIcon type={FilterType.JALUR_MASUK} />,
    },
  ],
];

// ── Filter options (Monev) ────────────────────────────────────────────────────
export const monevFilterViewOptions: FilterOption[][] = [
  [
    {
      name: FilterType.VALIDASI_MONEV,
      icon: <FilterIcon type={FilterType.VALIDASI_MONEV} />,
    },
  ],
];

export const filterViewToFilterOptions: Record<FilterType, FilterOption[]> = {
  [FilterType.HASIL_AKHIR]: Object.values(HasilAkhir).map((v) => ({
    name: v,
    icon: <FilterIcon type={v} />,
  })),
  [FilterType.REKOMENDASI]: Object.values(RekomendasiWawancara).map((v) => ({
    name: v,
    icon: <FilterIcon type={v} />,
  })),
  [FilterType.STATUS]: Object.values(StatusEvaluasi).map((v) => ({
    name: v,
    icon: <FilterIcon type={v} />,
  })),
  [FilterType.JALUR_MASUK]: Object.values(JalurMasuk).map((v) => ({
    name: v,
    icon: <FilterIcon type={v} />,
  })),
  [FilterType.PEWAWANCARA]: [],
  [FilterType.VALIDASI_MONEV]: Object.values(ValidasiMonev).map((v) => ({
    name: v,
    icon: <FilterIcon type={v} />,
  })),
};

// ── Operator dropdown ─────────────────────────────────────────────────────────
const FilterOperatorDropdown = ({
  filterType,
  operator,
  filterValues,
  setOperator,
}: {
  filterType: FilterType;
  operator: FilterOperator;
  filterValues: string[];
  setOperator: (op: FilterOperator) => void;
}) => {
  const ops =
    filterValues.length > 1
      ? [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT]
      : [FilterOperator.IS, FilterOperator.IS_NOT];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="bg-muted hover:bg-muted/50 px-1.5 py-1 text-muted-foreground hover:text-primary transition shrink-0 text-xs">
        {operator}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-fit min-w-fit">
        {ops.map((op) => (
          <DropdownMenuItem key={op} onClick={() => setOperator(op)}>
            {op}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ── Value combobox ────────────────────────────────────────────────────────────
const FilterValueCombobox = ({
  filterType,
  filterValues,
  setFilterValues,
}: {
  filterType: FilterType;
  filterValues: string[];
  setFilterValues: (v: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const nonSelected = filterViewToFilterOptions[filterType]?.filter(
    (f) => !filterValues.includes(f.name),
  );

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTimeout(() => setInput(""), 200);
      }}
    >
      <PopoverTrigger className="rounded-none px-1.5 py-1 bg-muted hover:bg-muted/50 transition text-muted-foreground hover:text-primary shrink-0 text-xs">
        <div className="flex gap-1.5 items-center">
          <div className="flex items-center -space-x-1">
            <AnimatePresence mode="popLayout">
              {filterValues.slice(0, 3).map((v) => (
                <motion.div
                  key={v}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <FilterIcon type={v} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {filterValues.length === 1
            ? filterValues[0]
            : `${filterValues.length} dipilih`}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <AnimateChangeInHeight>
          <Command>
            <CommandInput
              placeholder={filterType}
              className="h-9"
              value={input}
              onInputCapture={(e) => setInput(e.currentTarget.value)}
              ref={inputRef}
            />
            <CommandList>
              <CommandEmpty>Tidak ditemukan.</CommandEmpty>
              <CommandGroup>
                {filterValues.map((v) => (
                  <CommandItem
                    key={v}
                    className="group flex gap-2 items-center"
                    onSelect={() => {
                      setFilterValues(filterValues.filter((x) => x !== v));
                      setTimeout(() => setInput(""), 200);
                      setOpen(false);
                    }}
                  >
                    <Checkbox checked={true} />
                    <FilterIcon type={v} />
                    {v}
                  </CommandItem>
                ))}
              </CommandGroup>
              {nonSelected?.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    {nonSelected.map((f) => (
                      <CommandItem
                        key={f.name}
                        value={f.name}
                        className="group flex gap-2 items-center"
                        onSelect={(val) => {
                          setFilterValues([...filterValues, val]);
                          setTimeout(() => setInput(""), 200);
                          setOpen(false);
                        }}
                      >
                        <Checkbox
                          checked={false}
                          className="opacity-0 group-data-[selected=true]:opacity-100"
                        />
                        {f.icon}
                        <span className="text-accent-foreground">{f.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </AnimateChangeInHeight>
      </PopoverContent>
    </Popover>
  );
};

// ── Main Filters component ────────────────────────────────────────────────────
export default function Filters({
  filters,
  setFilters,
}: {
  filters: Filter[];
  setFilters: Dispatch<SetStateAction<Filter[]>>;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {filters
        .filter((f) => f.value?.length > 0)
        .map((filter) => (
          <div key={filter.id} className="flex gap-[1px] items-center text-xs">
            <div className="flex gap-1.5 shrink-0 rounded-l bg-muted px-1.5 py-1 items-center">
              <FilterIcon type={filter.type} />
              {filter.type}
            </div>
            <FilterValueCombobox
              filterType={filter.type}
              filterValues={filter.value}
              setFilterValues={(vals) =>
                setFilters((prev) =>
                  prev.map((f) =>
                    f.id === filter.id ? { ...f, value: vals } : f,
                  ),
                )
              }
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setFilters((prev) => prev.filter((f) => f.id !== filter.id))
              }
              className="bg-muted rounded-l-none rounded-r-sm h-6 w-6 text-muted-foreground hover:text-primary hover:bg-muted/50 transition shrink-0"
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}
    </div>
  );
}
