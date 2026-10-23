import { cn } from "@/lib/utils";

/**
 * Pulsing placeholder block; `label` is announced to screen readers.
 * `decorative` hides it from assistive tech (use inside a parent live region).
 */
export function Skeleton({
  className,
  label = "Loading",
  decorative = false,
}: {
  className?: string;
  label?: string;
  decorative?: boolean;
}) {
  const a11y = decorative ? { "aria-hidden": true as const } : { role: "status", "aria-label": label };
  return <div {...a11y} className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}
