"use client";

import { useEffect, useMemo, useState } from "react";
import { useLineCountsData } from "@/hooks/useLineCountsData";
import { latestByMonthTypeSystem } from "@/lib/line-counts-aggregations";
import { LineCountScorecards } from "@/components/line-counts/LineCountScorecards";
import { LineCountsByWriterChart } from "@/components/line-counts/LineCountsByWriterChart";
import { LineCountsPivotTable } from "@/components/line-counts/LineCountsPivotTable";
import { LineCountsTrendChart } from "@/components/line-counts/LineCountsTrendChart";

const MONTH_ORDER = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
// All 12 calendar months in display (title) case — shown in the selector even
// when a month has no data, so the year reads as a complete set.
const ALL_MONTHS = MONTH_ORDER.map((m) => m[0].toUpperCase() + m.slice(1));
const monthRank = (m: string | null) =>
  m ? MONTH_ORDER.indexOf(m.toLowerCase()) : -1;

export default function LineCountsPage() {
  const { data, loading, error, refreshedAt } = useLineCountsData();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Collapse to the latest export per (month, system, line_type) so a corrected
  // re-export supersedes the stale one it fixes (no more coexisting bad data).
  const latestRows = useMemo(
    () => (data ? latestByMonthTypeSystem(data) : []),
    [data]
  );

  // Months that actually have data, in calendar order.
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (const r of latestRows) if (r.month) set.add(r.month);
    return Array.from(set).sort((a, b) => monthRank(a) - monthRank(b));
  }, [latestRows]);

  // Default to the latest month that has data.
  useEffect(() => {
    if (selectedMonth === null && availableMonths.length) {
      setSelectedMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths, selectedMonth]);

  const filteredRows = useMemo(
    () => latestRows.filter((r) => !selectedMonth || r.month === selectedMonth),
    [latestRows, selectedMonth]
  );

  const refreshedLabel = refreshedAt
    ? `Data refreshed ${new Date(refreshedAt).toLocaleString()}`
    : "";

  return (
    <main className="min-h-screen bg-sky-100 p-8">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Line Counts</h1>
        <p className="text-sm text-gray-500">
          {loading ? "Loading…" : refreshedLabel}
          {!loading && data && ` · ${filteredRows.length.toLocaleString()} rows in view`}
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-white p-6 text-sm text-red-700 shadow-md">
          Error loading data: {error}
        </div>
      ) : loading ? (
        <div className="rounded-lg bg-white p-12 text-center text-sm text-gray-500 border border-sky-200 shadow-md">
          Loading…
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center text-sm text-gray-500 border border-sky-200 shadow-md">
          No line count data available.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-sky-200 bg-white p-3 shadow-md">
            <span className="text-sm font-medium text-gray-700">Month:</span>
            {ALL_MONTHS.map((m) => {
              const hasData = availableMonths.includes(m);
              const selected = selectedMonth === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMonth(m)}
                  title={hasData ? undefined : "No data for this month yet"}
                  className={`rounded-md px-3 py-1 text-sm ${
                    selected
                      ? "bg-sky-600 text-white"
                      : hasData
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
          <LineCountScorecards rows={filteredRows} />
          <LineCountsTrendChart rows={latestRows} />
          <LineCountsByWriterChart rows={filteredRows} />
          <LineCountsPivotTable rows={filteredRows} />
        </div>
      )}
    </main>
  );
}
