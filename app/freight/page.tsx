"use client";

import { useInboundFreightData } from "@/hooks/useInboundFreightData";
import { FreightOverviewCards } from "@/components/freight/FreightOverviewCards";
import { FreightPctByWriterChart } from "@/components/freight/FreightPctByWriterChart";
import { FreightByVendorTable } from "@/components/freight/FreightByVendorTable";
import { FreightByWriterTable } from "@/components/freight/FreightByWriterTable";
import { HighInboundTable } from "@/components/freight/HighInboundTable";

export default function FreightPage() {
  const { data, loading, error, reportDate } = useInboundFreightData();

  return (
    <main className="min-h-screen bg-sky-100 p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Inbound Freight</h1>
        <p className="text-sm text-gray-500">
          {reportDate ? `Snapshot: ${reportDate}` : "Loading…"}
          {data && ` · ${data.length.toLocaleString()} line items`}
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
          No inbound freight data available.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <FreightOverviewCards rows={data} />
          <FreightPctByWriterChart rows={data} />
          <FreightByWriterTable rows={data} />
          <FreightByVendorTable rows={data} />
          <HighInboundTable rows={data} />
        </div>
      )}
    </main>
  );
}
