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
