"use client";

import { useGmroiData } from "@/hooks/useGmroiData";
import { useBuyerByBuyLine } from "@/hooks/useBuyerByBuyLine";
import {
  GmroiFilterProvider,
  useGmroiFilterState,
} from "@/hooks/useGmroiFilterState";
import { GmroiOverviewCards } from "@/components/gmroi/GmroiOverviewCards";
import { GmroiByBranchTable } from "@/components/gmroi/GmroiByBranchTable";
import { GmroiByBuyLineTable } from "@/components/gmroi/GmroiByBuyLineTable";
import { GmroiByBuyerTable } from "@/components/gmroi/GmroiByBuyerTable";
import { GmroiTrendChart } from "@/components/gmroi/GmroiTrendChart";

export default function GmroiPage() {
  return (
    <GmroiFilterProvider>
      <GmroiContents />
    </GmroiFilterProvider>
  );
}

function GmroiContents() {
  const { data, loading, error, reportDate } = useGmroiData();
  const { map: buyerByBuyLine } = useBuyerByBuyLine();
  const { filters, toggleBuyer, clearAll } = useGmroiFilterState();
  const hasFilter = filters.buyerSelection !== null;

  return (
    <main className="min-h-screen bg-sky-100 p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">GMROI Dashboard</h1>
        <p className="text-sm text-gray-500">
          {reportDate ? `Snapshot: ${reportDate}` : "Loading…"}
          {data && ` · ${data.length.toLocaleString()} rows`}
        </p>
      </header>

      {hasFilter && (
        <section className="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 border border-sky-200 shadow-md">
          <span className="text-xs uppercase tracking-wide text-muted-foreground mr-1">
            Active filters:
          </span>
          <button
            type="button"
            onClick={() => toggleBuyer(filters.buyerSelection!)}
            className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900 hover:bg-sky-200"
          >
            Buyer: {filters.buyerSelection}
            <span aria-hidden>×</span>
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto text-xs text-sky-700 hover:underline"
          >
            Clear all
          </button>
        </section>
      )}

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
          <GmroiTrendChart />
          <GmroiByBuyerTable rows={data} buyerByBuyLine={buyerByBuyLine} />
          <GmroiByBuyLineTable rows={data} buyerByBuyLine={buyerByBuyLine} />
          <GmroiByBranchTable rows={data} />
        </div>
      )}
    </main>
  );
}
