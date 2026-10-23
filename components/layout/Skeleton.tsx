import { cn } from "@/lib/utils";

/**
 * Pulsing placeholder block; `label` is announced to screen readers as visually
 * hidden text (an aria-label on an empty div is often not read out).
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
  const classes = cn("animate-pulse rounded-lg bg-muted", className);
  if (decorative) return <div aria-hidden className={classes} />;
  return (
    <div role="status" className={classes}>
      <span className="sr-only">{label}</span>
    </div>
  );
}
