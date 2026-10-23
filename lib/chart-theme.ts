/**
 * Chart colours and mark specs, in one place (spec:
 * docs/superpowers/specs/2026-10-21-dashboard-visual-refresh-design.md §6).
 * SERIES was validated with the dataviz validator (light mode, surface #ffffff, adjacent
 * pairs) in this order. Re-run the validator before reordering or adding a colour.
 */
import type { LineCountRow } from "./line-counts-types";

/** Categorical slots, fixed order. Slot 1 is the brand blue. */
export const SERIES = ["#1D8ACB", "#eb6834", "#1baf7a", "#eda100"] as const;

/** Line types keep their colour whatever the filter: colour follows the entity, never its rank. */
export const LINE_TYPE_COLORS: Record<LineCountRow["line_type"], string> = {
  PO: SERIES[0],
  SO: SERIES[1],
  DIR: SERIES[2],
  TR: SERIES[3],
};

export const SURFACE = "#ffffff";

/** Unselected bars while one is emphasised by a cross-filter. */
export const DIMMED_BAR = "#cbd5e1";

/** <CartesianGrid {...gridProps} />: solid horizontal hairlines only. */
export const gridProps = { stroke: "#e5e7eb", vertical: false };

/** <XAxis {...axisProps} /> and <YAxis {...axisProps} />: muted 12px ticks, no axis or tick lines. */
export const axisProps = {
  tick: { fontSize: 12, fill: "#6b7280" },
  axisLine: false,
  tickLine: false,
};

/** Tooltip hover band on bar charts (the --brand-subtle tint). */
export const BAR_CURSOR = { fill: "#E8F3FA" };

/** Tooltip crosshair on line and area charts. */
export const LINE_CURSOR = { stroke: "#d1d5db", strokeWidth: 1 };

/** Single-series bars: at most 24px thick, 4px rounded data-end, square at the baseline. */
export const barProps = {
  maxBarSize: 24,
  radius: [4, 4, 0, 0] as [number, number, number, number],
};

/** Stacked bar segments: square, separated by a 2px surface gap (Bar legend colour comes from fill). */
export const stackedBarProps = { maxBarSize: 24, stroke: SURFACE, strokeWidth: 2 };

/** Legends — only on charts with two or more series. */
export const legendProps = {
  iconType: "circle" as const,
  iconSize: 8,
  wrapperStyle: { fontSize: 12 },
  // Recharts sorts legend items by value (alphabetical) unless told not to: keep render order.
  itemSorter: null,
};

/** Lines: 2px, round caps, no resting dots; the hover dot is r=4 with a 2px surface ring. */
export function lineProps(color: string) {
  return {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    dot: false as const,
    activeDot: { r: 4, fill: color, stroke: SURFACE, strokeWidth: 2 },
  };
}

/**
 * Stacked areas: 2px edge in the series colour over an 85% fill. The edge must be the
 * series colour — Recharts takes an Area's legend and tooltip colour from `stroke`.
 */
export function stackedAreaProps(color: string) {
  return { stroke: color, strokeWidth: 2, fill: color, fillOpacity: 0.85 };
}
