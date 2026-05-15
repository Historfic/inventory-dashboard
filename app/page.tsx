"use client";

import { useMemo } from "react";
import { FilterProvider, useFilterState } from "@/hooks/useFilterState";
import { useInventoryData } from "@/hooks/useInventoryData";
import { applyClientFilters, uniqueBranches } from "@/lib/filters";
import { BranchFilter } from "@/components/filters/BranchFilter";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { UnassignedToggle } from "@/components/filters/UnassignedToggle";
import { ActiveFiltersBar } from "@/components/filters/ActiveFiltersBar";
import { RevenueAtRiskCard } from "@/components/kpi/RevenueAtRiskCard";
import { CriticalFiresCard } from "@/components/kpi/CriticalFiresCard";
import { DaysOutByBuyerChart } from "@/components/kpi/DaysOutByBuyerChart";
import { BuyerSummaryTable } from "@/components/kpi/BuyerSummaryTable";
import { BuyerBuyLineTable } from "@/components/kpi/BuyerBuyLineTable";
import { PurchaseDaysOutTable } from "@/components/kpi/PurchaseDaysOutTable";
import { BottlenecksPanel } from "@/components/alerts/BottlenecksPanel";
import { ExecutiveBriefCard } from "@/components/ai/ExecutiveBriefCard";

export default function DashboardPage() {
  return (
    <FilterProvider>
      <DashboardContents />
    </FilterProvider>
  );
}

function DashboardContents() {
  const {
    filters,
    setBranches,
    setDateRange,
    setHideUnassigned,
  } = useFilterState();

  const { data, loading, error, reportDate } = useInventoryData({
    dateStart: filters.dateStart,
    dateEnd: filters.dateEnd,
    branches: filters.branches,
  });

  const filteredRows = useMemo(
    () => (data ? applyClientFilters(data, filters) : []),
    [data, filters]
  );

  const availableBranches = useMemo(
    () => (data ? uniqueBranches(data) : []),
    [data]
  );

  return (
    <main className="min-h-screen bg-sky-100 p-8">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Dashboard</h1>
          <p className="text-sm text-gray-500">
            {reportDate ? `Snapshot: ${reportDate}` : "Loading snapshot…"}
            {filters.branches.length > 0 && ` · ${filters.branches.length} branch(es)`}
            {data && ` · ${filteredRows.length.toLocaleString()} items shown`}
          </p>
        </div>
        <UnassignedToggle
          hideUnassigned={filters.hideUnassigned}
          onChange={setHideUnassigned}
        />
      </header>

      <section className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 border border-sky-200 shadow-md">
        <BranchFilter
          available={availableBranches}
          selected={filters.branches}
          onChange={setBranches}
        />
        <DateRangeFilter
          dateStart={filters.dateStart}
          dateEnd={filters.dateEnd}
          onChange={setDateRange}
        />
      </section>

      <section className="mb-4">
        <ActiveFiltersBar />
      </section>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-white p-6 text-sm text-red-700 shadow-md">
          Error loading data: {error}
        </div>
      ) : loading ? (
        <div className="rounded-lg bg-white p-12 text-center text-sm text-gray-500 border border-sky-200 shadow-md">
          Loading…
        </div>
      ) : (
        <>
          <section className="mb-4">
            <ExecutiveBriefCard rows={filteredRows} reportDate={reportDate} />
          </section>

          <section className="mb-4">
            <BottlenecksPanel rows={filteredRows} />
          </section>

          <section className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <RevenueAtRiskCard rows={filteredRows} />
            <CriticalFiresCard rows={filteredRows} />
          </section>

          <section className="mb-4">
            <DaysOutByBuyerChart rows={filteredRows} />
          </section>

          <section className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BuyerSummaryTable rows={filteredRows} />
            <BuyerBuyLineTable rows={filteredRows} />
          </section>

          <section>
            <PurchaseDaysOutTable rows={filteredRows} />
          </section>
        </>
      )}
    </main>
  );
}
