import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PillTone = "accent" | "warn" | "danger" | "neutral" | "solid";

const TONE_CLASSES: Record<PillTone, string> = {
  accent:
    "bg-admin-accent/10 text-admin-accent-ink border-admin-accent/25",
  warn: "bg-admin-warn-bg-2 text-admin-warn-text border-admin-warn-border",
  danger: "bg-admin-danger-bg text-admin-danger-text border-admin-danger-border",
  neutral: "bg-admin-neutral-bg text-admin-neutral-text border-admin-neutral-border",
  solid: "bg-admin-accent text-white border-admin-accent",
};

interface PillProps {
  tone?: PillTone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

/** Small rounded status/label chip — the `.Pill` primitive used across every admin page. */
export function Pill({ tone = "neutral", children, className, dot = false }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-[11px] py-[6px] text-[11.5px] font-semibold leading-none whitespace-nowrap w-fit",
        TONE_CLASSES[tone],
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
      {children}
    </span>
  );
}
