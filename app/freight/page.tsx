"use client";

import { useMemo } from "react";
import { useInboundFreightData } from "@/hooks/useInboundFreightData";
import {
  FreightFilterProvider,
  useFreightFilterState,
} from "@/hooks/useFreightFilterState";
import { FreightOverviewCards } from "@/components/freight/FreightOverviewCards";
import { FreightPctByWriterChart } from "@/components/freight/FreightPctByWriterChart";
import { FreightByVendorTable } from "@/components/freight/FreightByVendorTable";
import { FreightByWriterTable } from "@/components/freight/FreightByWriterTable";
import { HighInboundTable } from "@/components/freight/HighInboundTable";
import { FreightTrendChart } from "@/components/freight/FreightTrendChart";
import type { InboundFreightRow } from "@/lib/inbound-freight-types";

export default function FreightPage() {
  return (
    <FreightFilterProvider>
      <FreightContents />
    </FreightFilterProvider>
  );
}

function FreightContents() {
  const { data, loading, error, reportDate } = useInboundFreightData();
  const { filters, toggleWriter, toggleVendor, clearAll } = useFreightFilterState();

  // The bar chart always sees the full set so the user can compare/un-select.
  // The two lower tables narrow by writer; High Inbound additionally narrows by vendor.
  const writerFilteredRows = useMemo<InboundFreightRow[]>(() => {
    if (!data) return [];
    if (!filters.writerSelection) return data;
    return data.filter((r) => r.writer === filters.writerSelection);
  }, [data, filters.writerSelection]);

  const vendorFilteredRows = useMemo<InboundFreightRow[]>(() => {
    if (!filters.vendorSelection) return writerFilteredRows;
    return writerFilteredRows.filter((r) => r.vendor_name === filters.vendorSelection);
  }, [writerFilteredRows, filters.vendorSelection]);

  const hasFilter = filters.writerSelection !== null || filters.vendorSelection !== null;

  return (
    <main className="min-h-screen bg-sky-100 p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Inbound Freight</h1>
        <p className="text-sm text-gray-500">
          {reportDate ? `Snapshot: ${reportDate}` : "Loading…"}
          {data && ` · ${data.length.toLocaleString()} line items`}
          {hasFilter && data && ` · ${vendorFilteredRows.length.toLocaleString()} shown`}
        </p>
      </header>

      {hasFilter && (
        <section className="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 border border-sky-200 shadow-md">
          <span className="text-xs uppercase tracking-wide text-muted-foreground mr-1">
            Active filters:
          </span>
          {filters.writerSelection && (
            <button
              type="button"
              onClick={() => toggleWriter(filters.writerSelection!)}
              className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900 hover:bg-sky-200"
            >
              Writer: {filters.writerSelection}
              <span aria-hidden>×</span>
            </button>
          )}
          {filters.vendorSelection && (
            <button
              type="button"
              onClick={() => toggleVendor(filters.vendorSelection!)}
              className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900 hover:bg-sky-200"
            >
              Vendor: {filters.vendorSelection}
              <span aria-hidden>×</span>
            </button>
          )}
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
          No inbound freight data available.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <FreightOverviewCards rows={vendorFilteredRows} />
          <FreightTrendChart />
          <FreightPctByWriterChart rows={data} />
          <FreightByWriterTable rows={data} />
          <FreightByVendorTable rows={writerFilteredRows} />
          <HighInboundTable rows={vendorFilteredRows} />
        </div>
      )}
    </main>
  );
}
