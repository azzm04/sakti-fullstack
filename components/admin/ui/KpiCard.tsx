import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  code?: string;
  value: ReactNode;
  delta?: ReactNode;
  note?: string;
  pct?: string;
  barColor?: string;
  valueColor?: string;
  className?: string;
}

/** The 4-across KPI card used at the top of every admin page. */
export function KpiCard({
  label,
  code,
  value,
  delta,
  note,
  pct = "0%",
  barColor = "var(--color-admin-accent)",
  valueColor,
  className,
}: KpiCardProps) {
  return (
    <article
      className={cn(
        "bg-admin-surface border border-admin-border rounded-2xl p-[17px_18px_15px] flex flex-col gap-[11px] shadow-[0_1px_2px_rgba(20,40,70,0.05)]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] tracking-[0.14em] uppercase text-admin-text-4">
          {label}
        </span>
        {code && (
          <span className="text-[10px] tracking-[0.1em] text-admin-text-5">{code}</span>
        )}
      </div>
      <div className="flex items-baseline gap-[9px] flex-wrap">
        <span
          className="font-admin-heading text-[38px] font-semibold leading-[0.95] tracking-[-0.02em] tabular-nums"
          style={valueColor ? { color: valueColor } : undefined}
        >
          {value}
        </span>
        {delta}
      </div>
      <div className="h-[6px] rounded-full bg-admin-grid overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ background: barColor, width: pct }}
        />
      </div>
      {note && <div className="text-[12px] text-admin-text-3">{note}</div>}
    </article>
  );
}
