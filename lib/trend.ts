/**
 * Collapse a chronological series to one point per calendar month, keeping
 * only the row with the latest report_date within each month. Guards against
 * multiple points landing on the same month label (e.g. leftover
 * pre-normalization daily dates coexisting with the new first-of-month
 * dates) — per CLAUDE.md §4.5, don't average across snapshots, the latest
 * one wins.
 */
export function collapseToLatestPerMonth<T extends { report_date: string }>(
  points: T[]
): T[] {
  const latest = new Map<string, T>();
  for (const p of points) {
    const key = String(p.report_date).slice(0, 7); // "YYYY-MM"
    const existing = latest.get(key);
    if (!existing || p.report_date > existing.report_date) {
      latest.set(key, p);
    }
  }
  return Array.from(latest.values()).sort((a, b) =>
    a.report_date.localeCompare(b.report_date)
  );
}

const MONTH_NUMBERS: Record<string, string> = {
  january: "01", jan: "01", february: "02", feb: "02", march: "03", mar: "03",
  april: "04", apr: "04", may: "05", june: "06", jun: "06", july: "07", jul: "07",
  august: "08", aug: "08", september: "09", sep: "09", sept: "09",
  october: "10", oct: "10", november: "11", nov: "11", december: "12", dec: "12",
};

/** "APRIL" -> "04", for building a "YYYY-MM" key from a month-name column. */
export function monthNameToNumber(monthName: string): string {
  return MONTH_NUMBERS[monthName.trim().toLowerCase()] ?? "00";
}
