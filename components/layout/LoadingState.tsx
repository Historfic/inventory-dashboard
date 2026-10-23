import { Skeleton } from "@/components/layout/Skeleton";

/** First-load placeholder in the page's card shapes: optional stat-tile row, a chart, a table. */
export function LoadingState({ tiles = 0 }: { tiles?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      {tiles > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: tiles }, (_, i) => (
            <Skeleton key={i} className="h-[104px]" />
          ))}
        </div>
      )}
      <Skeleton className="h-[340px]" label="Loading chart" />
      <Skeleton className="h-[420px]" label="Loading table" />
    </div>
  );
}
