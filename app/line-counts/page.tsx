"use client";

import { useEffect, useMemo, useState } from "react";
import { useLineCountsData } from "@/hooks/useLineCountsData";
import { LineCountScorecards } from "@/components/line-counts/LineCountScorecards";
import { LineCountsByWriterChart } from "@/components/line-counts/LineCountsByWriterChart";
import { LineCountsPivotTable } from "@/components/line-counts/LineCountsPivotTable";
import { LineCountsTrendChart } from "@/components/line-counts/LineCountsTrendChart";
import { UploadPicker } from "@/components/line-counts/UploadPicker";

const MONTH_ORDER = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
const monthRank = (m: string | null) =>
  m ? MONTH_ORDER.indexOf(m.toLowerCase()) : -1;

export default function LineCountsPage() {
  const { data, loading, error, availableDates, latestDate } = useLineCountsData();
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Default to latest upload once data lands; do not stomp a user choice after that.
  useEffect(() => {
    if (selectedDates.length === 0 && latestDate) {
      setSelectedDates([latestDate]);
    }
  }, [latestDate, selectedDates.length]);

  // Distinct months present, in calendar order (a single export batch can carry
  // several months since AR/OQ files share one export date).
  const availableMonths = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const r of data) if (r.month) set.add(r.month);
    return Array.from(set).sort((a, b) => monthRank(a) - monthRank(b));
  }, [data]);

  // Default to the latest month once data lands.
  useEffect(() => {
    if (selectedMonth === null && availableMonths.length) {
      setSelectedMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths, selectedMonth]);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    if (selectedDates.length === 0) return [];
    const set = new Set(selectedDates);
    return data.filter(
      (r) => set.has(String(r.report_date)) && (!selectedMonth || r.month === selectedMonth)
    );
  }, [data, selectedDates, selectedMonth]);

  const headerLabel = useMemo(() => {
    if (loading) return "Loading…";
    if (!availableDates.length) return "No uploads available";
    if (selectedDates.length === 1) return `Upload: ${selectedDates[0]}`;
    if (selectedDates.length > 1) {
      const sorted = [...selectedDates].sort();
      return `${selectedDates.length} uploads · ${sorted[0]} → ${sorted[sorted.length - 1]}`;
    }
    return "Pick an upload above";
  }, [loading, availableDates.length, selectedDates]);

  return (
    <main className="min-h-screen bg-sky-100 p-8">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Line Counts</h1>
        <p className="text-sm text-gray-500">
          {headerLabel}
          {data && ` · ${filteredRows.length.toLocaleString()} rows in view`}
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
          <UploadPicker
            availableDates={availableDates}
            selectedDates={selectedDates}
            onChange={setSelectedDates}
          />
          {availableMonths.length > 1 && (
            <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-white p-3 shadow-md">
              <span className="text-sm font-medium text-gray-700">Month:</span>
              {availableMonths.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMonth(m)}
                  className={`rounded-md px-3 py-1 text-sm ${
                    selectedMonth === m
                      ? "bg-sky-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
          <LineCountScorecards rows={filteredRows} />
          <LineCountsTrendChart rows={data} />
          <LineCountsByWriterChart rows={filteredRows} />
          <LineCountsPivotTable rows={filteredRows} />
        </div>
      )}
    </main>
  );
}
