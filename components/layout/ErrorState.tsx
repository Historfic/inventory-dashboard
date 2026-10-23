import { TriangleAlert } from "lucide-react";

/** Data failed to load. The message text is unchanged from the old error box. */
export function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl bg-card p-6 text-sm shadow-sm ring-1 ring-foreground/10"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-critical" aria-hidden />
      <p className="text-foreground">Error loading data: {message}</p>
    </div>
  );
}
