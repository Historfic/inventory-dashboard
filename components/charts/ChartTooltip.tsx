"use client";

type TooltipEntry = {
  name?: unknown;
  dataKey?: unknown;
  value?: unknown;
  color?: string;
};

type Props = {
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
  label?: unknown;
  /** Formats each value exactly as the chart did before, e.g. (v) => `${v}%`. */
  formatValue?: (value: number, name: string) => string;
  /** Formats the category / x label, e.g. formatMonthLabel. */
  formatLabel?: (label: unknown) => string;
  /** Display name for a series; defaults to its name / dataKey. */
  seriesName?: (name: string) => string;
};

/**
 * Shared Recharts tooltip body: white card, hairline ring, ink text, a colour swatch per
 * series (text never wears the series colour). Use as
 * <Tooltip content={({ active, payload, label }) => <ChartTooltip active={active} payload={payload} label={label} />} />
 */
export function ChartTooltip({ active, payload, label, formatValue, formatLabel, seriesName }: Props) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="min-w-36 rounded-lg bg-card px-3 py-2 text-xs shadow-sm ring-1 ring-foreground/10">
      {label != null && label !== "" && (
        <p className="mb-1 font-medium text-foreground">
          {formatLabel ? formatLabel(label) : String(label)}
        </p>
      )}
      <ul className="flex flex-col gap-1">
        {payload.map((entry, index) => {
          const name = String(entry.name ?? entry.dataKey ?? "");
          const value = entry.value == null ? NaN : Number(entry.value);
          return (
            <li key={`${String(entry.dataKey ?? name)}-${index}`} className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              <span className="text-muted-foreground">{seriesName ? seriesName(name) : name}</span>
              <span className="ml-auto pl-3 font-medium text-foreground tabular-nums">
                {!Number.isFinite(value) ? "—" : formatValue ? formatValue(value, name) : value.toLocaleString()}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Legend label in ink; the legend icon beside it carries the series colour. */
export function renderLegendLabel(value: string) {
  return <span className="text-foreground">{value}</span>;
}
