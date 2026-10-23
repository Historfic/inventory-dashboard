import { Inbox } from "lucide-react";

/** Muted "nothing to show" block inside a card. The wording is passed in unchanged. */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
      <Inbox className="size-5 opacity-60" aria-hidden />
      <p>{message}</p>
    </div>
  );
}
