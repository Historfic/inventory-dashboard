export function formatDaysOut(value: number | null | undefined): string {
  if (value == null) return "";
  return String(Math.round(value));
}

export function formatStockoutPct(value: number | null | undefined): string {
  if (value == null) return "";
  return `${Math.round(value * 100)}%`;
}

export function formatInteger(value: number | null | undefined): string {
  if (value == null) return "";
  return Math.round(value).toLocaleString();
}

export function formatDollars(value: number | null | undefined): string {
  if (value == null) return "";
  return `$${Math.round(value).toLocaleString()}`;
}

export function formatDecimal(value: number | null | undefined, places = 2): string {
  if (value == null) return "";
  return value.toFixed(places);
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-07-01" -> "July 2026", for trend-chart axis/tooltip labels. */
export function formatMonthLabel(reportDate: string | null | undefined): string {
  if (!reportDate) return "";
  const match = String(reportDate).match(/^(\d{4})-(\d{2})/);
  if (!match) return String(reportDate);
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const name = MONTH_NAMES[monthIdx];
  return name ? `${name} ${year}` : String(reportDate);
}
