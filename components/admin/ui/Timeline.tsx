import type { ReactNode } from "react";

export interface TimelineItem {
  id?: string | number;
  text: ReactNode;
  when: string;
  who?: string;
}

/** Left-rail dot-and-line activity timeline used on Dashboard/Import/Evaluasi/Hasil Akhir. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="flex flex-col">
      {items.map((item, i) => (
        <div
          key={item.id ?? i}
          className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 pb-3.5"
        >
          <div className="flex flex-col items-center gap-1 pt-1">
            <span className="w-2 h-2 rounded-full bg-admin-accent/55 shrink-0" />
            {i < items.length - 1 && <span className="flex-1 w-px bg-admin-grid" />}
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] leading-[1.45] text-admin-text break-words">
              {item.text}
            </div>
            <div className="text-[11px] text-admin-text-4 mt-[3px]">
              {item.when}
              {item.who ? ` · ${item.who}` : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
