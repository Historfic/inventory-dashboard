"use client";

import { useGmroiData } from "@/hooks/useGmroiData";
import { GmroiOverviewCards } from "@/components/gmroi/GmroiOverviewCards";
import { GmroiByBranchTable } from "@/components/gmroi/GmroiByBranchTable";
import { GmroiByBuyLineTable } from "@/components/gmroi/GmroiByBuyLineTable";

export default function GmroiPage() {
  const { data, loading, error, reportDate } = useGmroiData();

  return (
    <main className="min-h-screen bg-sky-100 p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">GMROI Dashboard</h1>
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
          No GMROI data available.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <GmroiOverviewCards rows={data} />
          <GmroiByBranchTable rows={data} />
          <GmroiByBuyLineTable rows={data} />
        </div>
      )}
    </main>
  );
}
