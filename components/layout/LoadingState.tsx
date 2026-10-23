import { Skeleton } from "@/components/layout/Skeleton";
import { cn } from "@/lib/utils";

/**
 * First-load placeholder in the page's card shapes: optional stat-tile row, a chart, a table.
 * One live region announces "Loading…" once; the blocks inside are decorative.
 * The tile grid matches the real ones: two-up on phones; 3 tiles use Freight's grid (first tile full
 * width on phones, three across from sm), any other count goes four across from lg.
 */
export function LoadingState({ tiles = 0 }: { tiles?: number }) {
  return (
    <div className="flex flex-col gap-4" role="status">
      <span className="sr-only">Loading…</span>
      {tiles > 0 && (
        <div className={cn("grid grid-cols-2 gap-4", tiles === 3 ? "sm:grid-cols-3" : "lg:grid-cols-4")}>
          {Array.from({ length: tiles }, (_, i) => (
            <Skeleton
              key={i}
              decorative
              className={cn("h-[112px]", tiles === 3 && i === 0 && "col-span-2 sm:col-span-1")}
            />
          ))}
        </div>
      )}
      <Skeleton decorative className="h-[340px]" />
      <Skeleton decorative className="h-[420px]" />
    </div>
  );
}
