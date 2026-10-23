import { Skeleton } from "@/components/layout/Skeleton";
import { cn } from "@/lib/utils";

/**
 * First-load placeholder in the page's card shapes: optional stat-tile row, a chart, a table.
 * One live region announces "Loading…" once; the blocks inside are decorative.
 * 3 tiles use Freight's 3-column grid; any other count uses the 2/4 grid.
 */
export function LoadingState({ tiles = 0 }: { tiles?: number }) {
  return (
    <div className="flex flex-col gap-4" role="status">
      <span className="sr-only">Loading…</span>
      {tiles > 0 && (
        <div
          className={cn(
            "grid grid-cols-1 gap-4",
            tiles === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"
          )}
        >
          {Array.from({ length: tiles }, (_, i) => (
            <Skeleton key={i} decorative className="h-[112px]" />
          ))}
        </div>
      )}
      <Skeleton decorative className="h-[340px]" />
      <Skeleton decorative className="h-[420px]" />
    </div>
  );
}
