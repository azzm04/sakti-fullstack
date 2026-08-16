import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckRowProps {
  label: ReactNode;
  count?: ReactNode;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

/** Custom checkbox "row" — bordered pill with a filled checkbox, used for multi-select jalur pickers. */
export function CheckRow({ label, count, checked, onToggle, disabled, className }: CheckRowProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "flex items-center gap-[11px] w-full px-[15px] py-3 rounded-[11px] border text-[13px] font-semibold cursor-pointer text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        checked
          ? "border-admin-accent bg-admin-accent/[0.08] text-admin-accent-active"
          : "border-admin-border bg-admin-surface-soft text-admin-text-2 hover:border-admin-accent/50",
        className
      )}
    >
      <span
        className={cn(
          "w-[17px] h-[17px] rounded-[5px] shrink-0 flex items-center justify-center",
          checked ? "bg-admin-accent border border-admin-accent" : "bg-white border-[1.5px] border-admin-text-5"
        )}
      >
        {checked && <Check className="w-[11px] h-[11px] text-white" strokeWidth={3.2} />}
      </span>
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "text-[11.5px] tabular-nums",
            checked ? "text-admin-accent-ink" : "text-admin-placeholder"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
