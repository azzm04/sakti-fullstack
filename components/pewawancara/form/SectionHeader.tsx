"use client";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * Header section untuk memisahkan bagian form.
 */
export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="pb-3 border-b border-border mb-6">
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}
