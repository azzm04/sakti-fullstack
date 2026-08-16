interface BarChartDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDatum[];
  max?: number;
  yTicks?: number[];
  height?: number;
  barColor?: string;
  formatValue?: (n: number) => string;
}

/** Simple CSS/div vertical bar chart with a Y axis + gridlines — no chart library. */
export function BarChart({
  data,
  max,
  yTicks,
  height = 198,
  barColor = "var(--color-admin-accent)",
  formatValue = (n) => n.toLocaleString("id-ID"),
}: BarChartProps) {
  const computedMax = max ?? Math.max(1, ...data.map((d) => d.value));
  const ticks = yTicks ?? Array.from({ length: 5 }, (_, i) => Math.round((computedMax / 4) * (4 - i)));

  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2.5 mt-5">
      <div
        className="flex flex-col justify-between items-end text-[10px] text-admin-text-5 tabular-nums pb-6"
        style={{ height }}
      >
        {ticks.map((t, i) => (
          <span key={i}>{t.toLocaleString("id-ID")}</span>
        ))}
      </div>
      <div className="relative">
        <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
          {ticks.map((_, i) => (
            <span
              key={i}
              className={i === ticks.length - 1 ? "h-px bg-admin-border" : "h-px bg-admin-grid"}
            />
          ))}
        </div>
        <div
          className="relative grid gap-[9px]"
          style={{ height, gridTemplateColumns: `repeat(${data.length}, minmax(0,1fr))` }}
        >
          {data.map((d) => (
            <div key={d.label} className="flex flex-col justify-end items-center">
              <div className="flex flex-col justify-end items-center w-full" style={{ height: height - 24 }}>
                <span className="text-[11px] font-bold text-admin-text-2 tabular-nums mb-[5px]">
                  {formatValue(d.value)}
                </span>
                <div
                  className="w-full rounded-t-[6px]"
                  style={{
                    background: barColor,
                    height: `${Math.max(2, (d.value / computedMax) * 100)}%`,
                  }}
                />
              </div>
              <div className="h-6 flex items-center">
                <span className="text-[11px] text-admin-text-4">{d.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
