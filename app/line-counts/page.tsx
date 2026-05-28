"use client";

import { useEffect, useMemo, useState } from "react";
import { useLineCountsData } from "@/hooks/useLineCountsData";
import { LineCountScorecards } from "@/components/line-counts/LineCountScorecards";
import { LineCountsByWriterChart } from "@/components/line-counts/LineCountsByWriterChart";
import { LineCountsPivotTable } from "@/components/line-counts/LineCountsPivotTable";
import { LineCountsTrendChart } from "@/components/line-counts/LineCountsTrendChart";
import { UploadPicker } from "@/components/line-counts/UploadPicker";

export default function LineCountsPage() {
  const { data, loading, error, availableDates, latestDate } = useLineCountsData();
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // Default to latest upload once data lands; do not stomp a user choice after that.
  useEffect(() => {
    if (selectedDates.length === 0 && latestDate) {
      setSelectedDates([latestDate]);
    }
  }, [latestDate, selectedDates.length]);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    if (selectedDates.length === 0) return [];
    const set = new Set(selectedDates);
    return data.filter((r) => set.has(String(r.report_date)));
  }, [data, selectedDates]);

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
          <LineCountScorecards rows={filteredRows} />
          <LineCountsTrendChart rows={data} />
          <LineCountsByWriterChart rows={filteredRows} />
          <LineCountsPivotTable rows={filteredRows} />
        </div>
      )}
    </main>
  );
}
