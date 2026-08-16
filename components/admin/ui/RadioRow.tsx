import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RadioRowProps {
  label: ReactNode;
  count?: ReactNode;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  className?: string;
}

/** Custom radio "row" — bordered pill with a filled-dot indicator, used for jalur pickers etc. */
export function RadioRow({ label, count, selected, onSelect, disabled, className }: RadioRowProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-[11px] w-full px-[15px] py-3 rounded-[11px] border text-[13.5px] font-semibold cursor-pointer text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        selected
          ? "border-admin-accent bg-admin-accent/[0.08] text-admin-accent-active"
          : "border-admin-border bg-admin-surface-soft text-admin-text-2 hover:border-admin-accent/50",
        className
      )}
    >
      <span
        className={cn(
          "w-[15px] h-[15px] rounded-full shrink-0 bg-white block",
          selected ? "border-[4.5px] border-admin-accent" : "border-[1.5px] border-admin-text-5"
        )}
      />
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "text-[11.5px] tabular-nums",
            selected ? "text-admin-accent-ink" : "text-admin-placeholder"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
