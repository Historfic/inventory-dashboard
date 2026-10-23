import { cn } from "@/lib/utils";

/** Pulsing placeholder block; `label` is announced to screen readers. */
export function Skeleton({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("animate-pulse rounded-lg bg-muted", className)}
    />
  );
}
