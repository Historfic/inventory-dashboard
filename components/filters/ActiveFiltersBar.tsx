"use client";

import { ClearFiltersButton, FilterChip } from "@/components/filters/FilterChip";
import { useFilterState } from "@/hooks/useFilterState";
import { hasActiveFilters } from "@/lib/filters";

export function ActiveFiltersBar() {
  const { filters, toggleBuyer, toggleBuyLine, setHideUnassigned, setBranches, clearAll } =
    useFilterState();

  if (!hasActiveFilters(filters)) {
    return null;
  }

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.branches.length > 0) {
    chips.push({
      key: "branches",
      label: `Branch: ${filters.branches.join(", ")}`,
      onRemove: () => setBranches([]),
    });
  }
  if (filters.buyerSelection) {
    chips.push({
      key: "buyer",
      label: `Buyer: ${filters.buyerSelection}`,
      onRemove: () => toggleBuyer(filters.buyerSelection!),
    });
  }
  if (filters.buyLineSelection) {
    chips.push({
      key: "buy_line",
      label: `Buy Line: ${filters.buyLineSelection}`,
      onRemove: () => toggleBuyLine(filters.buyLineSelection!),
    });
  }
  if (filters.hideUnassigned) {
    chips.push({
      key: "hide-unassigned",
      label: "Hiding UNASSIGNED",
      onRemove: () => setHideUnassigned(false),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Active filters:
      </span>
      {chips.map((chip) => (
        <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
      ))}
      <ClearFiltersButton onClick={clearAll} className="ml-1" />
    </div>
  );
}
