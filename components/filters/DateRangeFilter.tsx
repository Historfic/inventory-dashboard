"use client";

import { Button } from "@/components/ui/button";
import { toISODate } from "@/lib/filters";

// Phones: 40px tall and allowed to shrink to its flex basis. From sm up: the usual 32px control.
const inputClass =
  "h-10 min-w-0 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-8";

const presetClass = "h-10 flex-1 sm:h-8 sm:flex-none";

type Props = {
  dateStart: string;
  dateEnd: string;
  onChange: (start: string, end: string) => void;
};

export function DateRangeFilter({ dateStart, dateEnd, onChange }: Props) {
  function preset(daysBack: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysBack);
    onChange(toISODate(start), toISODate(end));
  }

  function thisMonth() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    onChange(toISODate(start), toISODate(now));
  }

  // Phones: full width — the dates share a row (each needs ~8.25rem to show the whole date; on
  // screens too narrow for both, "to <end>" drops to a second line), the presets spread across the next.
  // From sm up: one row as before, wrapping only if the bar is too narrow.
  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <input
          type="date"
          value={dateStart}
          onChange={(e) => onChange(e.target.value, dateEnd)}
          className={`${inputClass} flex-[1_1_8.25rem] sm:flex-none`}
        />
        <span className="flex min-w-0 flex-[1_1_9.75rem] items-center gap-2 sm:flex-none">
          <span className="text-sm text-muted-foreground">to</span>
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => onChange(dateStart, e.target.value)}
            className={`${inputClass} flex-1 sm:flex-none`}
          />
        </span>
      </div>
      <div className="flex w-full flex-wrap gap-1 sm:ml-2 sm:w-auto">
        <Button variant="outline" className={presetClass} onClick={() => preset(0)}>
          Today
        </Button>
        <Button variant="outline" className={presetClass} onClick={() => preset(1)}>
          Yesterday
        </Button>
        <Button variant="outline" className={presetClass} onClick={() => preset(7)}>
          Last 7
        </Button>
        <Button variant="outline" className={presetClass} onClick={thisMonth}>
          Month
        </Button>
      </div>
    </div>
  );
}
