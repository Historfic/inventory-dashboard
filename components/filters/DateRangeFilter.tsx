"use client";

import { Button } from "@/components/ui/button";
import { toISODate } from "@/lib/filters";

const inputClass =
  "h-8 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={dateStart}
        onChange={(e) => onChange(e.target.value, dateEnd)}
        className={inputClass}
      />
      <span className="text-sm text-muted-foreground">to</span>
      <input
        type="date"
        value={dateEnd}
        onChange={(e) => onChange(dateStart, e.target.value)}
        className={inputClass}
      />
      <div className="ml-2 flex gap-1">
        <Button variant="outline" onClick={() => preset(0)}>
          Today
        </Button>
        <Button variant="outline" onClick={() => preset(1)}>
          Yesterday
        </Button>
        <Button variant="outline" onClick={() => preset(7)}>
          Last 7
        </Button>
        <Button variant="outline" onClick={thisMonth}>
          Month
        </Button>
      </div>
    </div>
  );
}
