"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDollars } from "@/lib/format";
import type { InventoryRow } from "@/lib/types";

export function RevenueAtRiskCard({ rows }: { rows: InventoryRow[] }) {
  const total = rows.reduce((sum, r) => sum + (r.hits ?? 0), 0);
  return (
    <Card className="bg-white shadow-sm rounded-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Revenue at Risk
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tabular-nums">
          {formatDollars(total)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          SUM of hits across {rows.length.toLocaleString()} filtered items
        </div>
      </CardContent>
    </Card>
  );
}
