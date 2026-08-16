"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsePanelProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Collapsible section card: icon + title/subtitle header, chevron toggle, bordered body. */
export function CollapsePanel({
  icon,
  title,
  subtitle,
  open,
  onToggle,
  rightSlot,
  children,
  className,
}: CollapsePanelProps) {
  return (
    <section className={cn("bg-admin-surface border border-admin-border rounded-2xl", className)}>
      <div className="flex items-center gap-[14px] px-5 py-[17px]">
        {icon && (
          <div className="w-[38px] h-[38px] rounded-xl bg-admin-accent/[0.13] text-admin-accent flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-admin-heading text-[17px] font-semibold text-admin-text">{title}</div>
          {subtitle && <div className="text-[12.5px] text-admin-text-3 mt-0.5">{subtitle}</div>}
        </div>
        {rightSlot}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="border border-admin-border bg-transparent rounded-[10px] w-[34px] h-[34px] flex items-center justify-center text-admin-text-3 cursor-pointer hover:bg-admin-surface-soft transition-colors focus-visible:outline-2 focus-visible:outline-admin-accent focus-visible:outline-offset-2"
        >
          <ChevronDown
            className={cn("w-[15px] h-[15px] transition-transform", open && "rotate-180")}
            strokeWidth={1.8}
          />
        </button>
      </div>
      {open && <div className="border-t border-admin-border-soft p-5">{children}</div>}
    </section>
  );
}
