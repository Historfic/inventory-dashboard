"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { evaluateBottlenecks } from "@/lib/alerts";
import { useFilterState } from "@/hooks/useFilterState";
import { formatStockoutPct } from "@/lib/format";
import type { InventoryRow } from "@/lib/types";

export function BottlenecksPanel({ rows }: { rows: InventoryRow[] }) {
  const { filters, toggleBuyer, toggleBuyLine } = useFilterState();
  const bottlenecks = useMemo(() => evaluateBottlenecks(rows), [rows]);

  const buyLineGroup = bottlenecks.filter((b) => b.dimension === "buy_line");
  const buyerGroup = bottlenecks.filter((b) => b.dimension === "buyer");

  return (
    <Card className="bg-white rounded-lg border border-sky-200 shadow-md">
      <CardHeader>
        <CardTitle>Bottlenecks</CardTitle>
        <p className="text-xs text-muted-foreground">
          Highest-pressure buy lines and buyers in the current view. Click to filter.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Buy lines to watch
            </h3>
            {buyLineGroup.length === 0 ? (
              <div className="text-sm text-gray-500">No buy-line bottlenecks.</div>
            ) : (
              <ul className="space-y-1">
                {buyLineGroup.map((b) => {
                  const selected = filters.buyLineSelection === b.key;
                  return (
                    <li key={b.id}>
                      <button
                        onClick={() => toggleBuyLine(b.key)}
                        className={`flex w-full items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted ${
                          selected ? "bg-muted" : ""
                        }`}
                      >
                        <span>{b.label}</span>
                        <span className="tabular-nums text-gray-600">{b.count} items</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Buyers under pressure
            </h3>
            {buyerGroup.length === 0 ? (
              <div className="text-sm text-gray-500">No buyer bottlenecks.</div>
            ) : (
              <ul className="space-y-1">
                {buyerGroup.map((b) => {
                  const selected = filters.buyerSelection === b.key;
                  return (
                    <li key={b.id}>
                      <button
                        onClick={() => toggleBuyer(b.key)}
                        className={`flex w-full items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted ${
                          selected ? "bg-muted" : ""
                        }`}
                      >
                        <span>{b.label}</span>
                        <span className="tabular-nums text-gray-600">
                          {formatStockoutPct(b.metric)} avg
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
