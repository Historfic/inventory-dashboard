// Display formatters for the Arbitrage page. Kept separate from lib/format.ts
// because prices need cents and ROI/margin need one decimal (round only here,
// never before calculating — CLAUDE.md §4.3).

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export const formatMoney = (n: number | null | undefined) =>
  n == null ? "—" : usd.format(n).replace("-", "−");

export const formatPct1 = (n: number | null | undefined) =>
  n == null ? "—" : `${n.toFixed(1).replace("-", "−")}%`;

export const formatCount = (n: number | null | undefined) =>
  n == null ? "—" : Math.round(n).toLocaleString("en-US");

export const formatCompact = (n: number | null | undefined) =>
  n == null ? "—" : compact.format(n);

export function formatTimeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "—";
  const secs = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}
