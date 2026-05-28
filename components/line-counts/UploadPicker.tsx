"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="bg-white rounded-lg border border-sky-200 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Uploads</CardTitle>
        <p className="text-xs text-muted-foreground">
          Pick one upload, or select multiple to combine totals across reports.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={selectLatest}
            className="rounded-md border border-sky-300 bg-white px-2.5 py-1 text-xs font-medium text-sky-800 hover:bg-sky-50"
          >
            Latest only
          </button>
          <button
            type="button"
            onClick={selectAll}
            className="rounded-md border border-sky-300 bg-white px-2.5 py-1 text-xs font-medium text-sky-800 hover:bg-sky-50"
          >
            Select all ({availableDates.length})
          </button>
          <span className="mx-1 h-4 w-px bg-sky-200" aria-hidden />
          {availableDates.map((date) => {
            const selected = selectedSet.has(date);
            return (
              <button
                key={date}
                type="button"
                onClick={() => toggle(date)}
                aria-pressed={selected}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selected
                    ? "bg-sky-700 text-white hover:bg-sky-800"
                    : "bg-sky-100 text-sky-900 hover:bg-sky-200"
                }`}
              >
                {date}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
