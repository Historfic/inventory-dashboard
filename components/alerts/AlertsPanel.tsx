"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { evaluateAlerts } from "@/lib/alerts";
import { AlertCard } from "./AlertCard";
import type { InventoryRow } from "@/lib/types";

export function AlertsPanel({ rows }: { rows: InventoryRow[] }) {
  const alerts = useMemo(() => evaluateAlerts(rows), [rows]);

  return (
    <Card className="bg-white rounded-lg border border-sky-200 shadow-md">
      <CardHeader>
        <CardTitle>Warnings &amp; Critical Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-500">
            All clear for the current view.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {alerts
              .slice()
              .sort((a, b) =>
                a.rule.severity === b.rule.severity ? 0 : a.rule.severity === "critical" ? -1 : 1
              )
              .map((alert) => (
                <AlertCard key={alert.rule.id} alert={alert} />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
