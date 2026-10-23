import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** White bar holding a page's filter controls or its active-filter chips. */
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl bg-card p-3 shadow-sm ring-1 ring-foreground/10",
        className
      )}
    >
      {children}
    </div>
  );
}
