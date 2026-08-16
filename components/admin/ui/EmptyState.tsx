import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  dashed?: boolean;
  className?: string;
}

/** Dashed-border empty state card used across Import/Evaluasi/Wawancara. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  dashed = true,
  className,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        "bg-admin-surface rounded-2xl min-h-[260px] flex flex-col items-center justify-center gap-3 py-9 px-5 text-center",
        dashed ? "border border-dashed border-admin-border" : "border border-admin-border",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-admin-surface-soft-2 text-admin-text-5 flex items-center justify-center">
        {icon}
      </div>
      <h2 className="font-admin-heading text-[21px] font-semibold text-admin-text">{title}</h2>
      {description && (
        <p className="text-[13.5px] text-admin-text-4 max-w-[42ch] leading-relaxed m-0">
          {description}
        </p>
      )}
      {action}
    </section>
  );
}
