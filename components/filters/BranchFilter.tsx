"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  available: string[];
  selected: string[];
  onChange: (next: string[]) => void;
};

export function BranchFilter({ available, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const allSelected = selected.length === 0 || selected.length === available.length;
  const label =
    selected.length === 0 || selected.length === available.length
      ? "All branches"
      : selected.length === 1
      ? selected[0]
      : `${selected.length} branches`;

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  function clear() {
    onChange([]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "min-w-[160px] justify-between"
        )}
      >
        <span>{label}</span>
        <span className="text-muted-foreground text-xs">▾</span>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="max-h-72 overflow-y-auto py-2">
          <button
            type="button"
            onClick={clear}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent"
          >
            <span
              className={`inline-block h-4 w-4 rounded border ${
                allSelected ? "bg-primary border-primary" : "border-border"
              }`}
            />
            <span className="font-medium">All branches</span>
          </button>
          <div className="my-1 border-t" />
          {available.map((b) => {
            const checked = selected.includes(b);
            return (
              <button
                key={b}
                type="button"
                onClick={() => toggle(b)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent"
              >
                <span
                  className={`inline-block h-4 w-4 rounded border ${
                    checked ? "bg-primary border-primary" : "border-border"
                  }`}
                />
                <span>{b}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
