import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** One active cross-filter; clicking it removes that filter. */
export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      title={`Remove ${label}`}
      aria-label={`Remove ${label}`}
      className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-3 py-1 text-xs font-medium text-primary transition-shadow hover:ring-1 hover:ring-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span>{label}</span>
      <X className="size-3" aria-hidden />
    </button>
  );
}

export function ClearFiltersButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-sm text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      Clear all
    </button>
  );
}
