import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

/** Page <main> with the standard header row: title, muted subtitle, actions on the right. */
export function PageShell({ title, subtitle, actions, children }: Props) {
  return (
    <main className="px-8 py-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
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
      className={cn("flex flex-col gap-4 transition-opacity duration-200", refreshing && "opacity-60")}
    >
      {children}
    </div>
  );
}
