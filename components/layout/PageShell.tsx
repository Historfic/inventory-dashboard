import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * Page <main> with the standard header: title, muted subtitle, actions.
 * Phones: the three stack. From sm up: one row, actions on the right.
 * `min-w-0` everywhere so a wide child (a table) scrolls inside its card instead of widening the page.
 */
export function PageShell({ title, subtitle, actions, children }: Props) {
  return (
    <main className="min-w-0 px-4 py-4 md:px-8 md:py-6">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 md:mb-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </header>
      {children}
    </main>
  );
}

/** Stacks a page's sections. While a refetch runs, the previous content stays, dimmed. */
export function PageContent({ refreshing, children }: { refreshing: boolean; children: ReactNode }) {
  return (
    <div
      aria-busy={refreshing}
      className={cn("flex min-w-0 flex-col gap-4 transition-opacity duration-200", refreshing && "opacity-60")}
    >
      {children}
    </div>
  );
}
