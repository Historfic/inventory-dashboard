import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type Props = { label: string; value: ReactNode; sublabel?: ReactNode };

/** Headline number. Proportional figures on purpose: tabular-nums makes big numbers look loose. */
export function StatTile({ label, value, sublabel }: Props) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </CardContent>
    </Card>
  );
}
