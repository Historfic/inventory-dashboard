import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = { label: string; value: ReactNode; sublabel?: ReactNode; className?: string };

/**
 * Headline number. Proportional figures on purpose: tabular-nums makes big numbers look loose.
 * Phones show tiles two-up, so the value steps down to fit a half-width tile: text-xl from 360px,
 * text-base below that ("$13,053,352" needs ~116px at text-xl, a 320px phone's tile has ~97–104px).
 */
export function StatTile({ label, value, sublabel, className }: Props) {
  return (
    <Card className={cn("min-w-0 shadow-sm", className)}>
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-base font-semibold tracking-tight whitespace-nowrap text-foreground min-[360px]:text-xl sm:text-3xl">
          {value}
        </p>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </CardContent>
    </Card>
  );
}
