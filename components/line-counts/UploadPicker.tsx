"use client";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { cn } from "@/lib/utils";

type Props = {
  availableDates: string[];
  selectedDates: string[];
  onChange: (dates: string[]) => void;
};

export function UploadPicker({ availableDates, selectedDates, onChange }: Props) {
  const selectedSet = new Set(selectedDates);

  const toggle = (date: string) => {
    const next = new Set(selectedSet);
    if (next.has(date)) {
      next.delete(date);
    } else {
      next.add(date);
    }
    // Don't allow an empty selection — fall back to the latest if user deselects everything.
    if (next.size === 0 && availableDates.length > 0) {
      next.add(availableDates[0]);
    }
    onChange(Array.from(next).sort().reverse());
  };

  const selectLatest = () => {
    if (availableDates.length > 0) onChange([availableDates[0]]);
  };

  const selectAll = () => {
    onChange([...availableDates]);
  };

  // Only hide if there's literally nothing to show. (Picker still useful even
  // with a single upload — keeps the affordance visible so users know more
  // pills will appear as more uploads land.)
  if (availableDates.length === 0) {
    return null;
  }

  return (
    <DashboardCard
      title="Uploads"
      description="Pick one upload, or select multiple to combine totals across reports."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="h-10 sm:h-7" onClick={selectLatest}>
          Latest only
        </Button>
        <Button variant="outline" size="sm" className="h-10 sm:h-7" onClick={selectAll}>
          Select all ({availableDates.length})
        </Button>
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        {availableDates.map((date) => {
          const selected = selectedSet.has(date);
          return (
            <button
              key={date}
              type="button"
              onClick={() => toggle(date)}
              aria-pressed={selected}
              className={cn(
                "rounded-full px-3 py-3 text-xs font-medium transition-colors sm:py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-foreground hover:bg-brand-subtle"
              )}
            >
              {date}
            </button>
          );
        })}
      </div>
    </DashboardCard>
  );
}
