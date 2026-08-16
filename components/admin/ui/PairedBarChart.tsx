interface PairedBarGroup {
  label: string;
  a: number;
  b: number;
}

interface PairedBarChartProps {
  groups: PairedBarGroup[];
  colorA?: string;
  colorB?: string;
  height?: number;
}

/** Two-series grouped bar chart (e.g. "Diusulkan" vs "Tidak") built from plain divs. */
export function PairedBarChart({
  groups,
  colorA = "var(--color-admin-accent)",
  colorB = "var(--color-admin-danger-bar)",
  height = 158,
}: PairedBarChartProps) {
  const max = Math.max(1, ...groups.flatMap((g) => [g.a, g.b]));
  return (
    <div>
      <div
        className="flex items-end gap-3.5 border-b border-admin-border"
        style={{ height }}
      >
        {groups.map((g) => (
          <div key={g.label} className="flex-1 min-w-0 flex items-end justify-center gap-[5px] h-full">
            <div
              className="w-6 rounded-t-[5px]"
              style={{ background: colorA, height: `${Math.max(2, (g.a / max) * 100)}%` }}
              title={`${g.label}: ${g.a}`}
            />
            <div
              className="w-6 rounded-t-[5px]"
              style={{ background: colorB, height: `${Math.max(2, (g.b / max) * 100)}%` }}
              title={`${g.label}: ${g.b}`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3.5 mt-2">
        {groups.map((g) => (
          <span
            key={g.label}
            className="flex-1 min-w-0 text-[11px] text-admin-text-4 text-center whitespace-nowrap overflow-hidden text-ellipsis"
          >
            {g.label}
          </span>
        ))}
      </div>
    </div>
  );
}
