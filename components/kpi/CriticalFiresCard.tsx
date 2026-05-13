"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInteger } from "@/lib/format";
import type { InventoryRow } from "@/lib/types";

export function CriticalFiresCard({ rows }: { rows: InventoryRow[] }) {
  return (
    <Card className="bg-white shadow-sm rounded-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Critical Fires
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tabular-nums">
          {formatInteger(rows.length)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Record count of filtered items
        </div>
      </CardContent>
    </Card>
  );
}
