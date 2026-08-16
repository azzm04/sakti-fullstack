import type { ReactNode } from "react";

interface PageHeaderProps {
  breadcrumb?: string;
  title: string;
  right?: ReactNode;
}

/** Sticky top header shared by every admin page: breadcrumb + H1 + right-side actions. */
export function PageHeader({ breadcrumb, title, right }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-x-[18px] gap-y-3 px-4 sm:px-[30px] py-4 border-b border-admin-border bg-admin-surface sticky top-0 z-20">
      <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
        {breadcrumb && (
          <div className="text-[11px] text-admin-text-4 tracking-[0.04em] truncate">{breadcrumb}</div>
        )}
        <h1 className="font-admin-heading text-[20px] sm:text-[23px] font-semibold mt-[3px] tracking-[-0.01em] text-admin-text truncate">
          {title}
        </h1>
      </div>
      {right && (
        <div className="flex items-center gap-[9px] basis-full sm:basis-auto sm:w-auto sm:ml-auto">
          {right}
        </div>
      )}
    </header>
  );
}
