"use client";

import { Button } from "@/components/ui/button";
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
      <span className="text-xs uppercase text-muted-foreground">Active filters:</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground hover:bg-secondary/80"
        >
          <span>{chip.label}</span>
          <span aria-hidden>×</span>
        </button>
      ))}
      <Button size="sm" variant="ghost" onClick={clearAll}>
        Clear all
      </Button>
    </div>
  );
}
