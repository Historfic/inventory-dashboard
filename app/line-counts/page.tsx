"use client";

import { useLineCountsData } from "@/hooks/useLineCountsData";
import { LineCountScorecards } from "@/components/line-counts/LineCountScorecards";
import { LineCountsByWriterChart } from "@/components/line-counts/LineCountsByWriterChart";
import { LineCountsPivotTable } from "@/components/line-counts/LineCountsPivotTable";

export default function LineCountsPage() {
  const { data, loading, error, reportDate } = useLineCountsData();

  return (
    <main className="min-h-screen bg-sky-100 p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Line Counts</h1>
        <p className="text-sm text-gray-500">
          {reportDate ? `Snapshot: ${reportDate}` : "Loading…"}
          {data && ` · ${data.length.toLocaleString()} rows`}
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
          <LineCountScorecards rows={data} />
          <LineCountsByWriterChart rows={data} />
          <LineCountsPivotTable rows={data} />
        </div>
      )}
    </main>
  );
}
