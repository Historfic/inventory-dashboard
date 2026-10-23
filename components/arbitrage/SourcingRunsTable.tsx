"use client";

import { AlertTriangle, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryLabel } from "@/lib/arbitrage-config";
import { formatCount, formatTimeAgo } from "@/lib/arbitrage-format";
import type { SourcingRun } from "@/lib/arbitrage-types";

const STATUS = {
  success: { label: "Success", Icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700" },
  partial: { label: "Partial", Icon: AlertTriangle, cls: "bg-amber-50 text-amber-800" },
  error: { label: "Failed", Icon: XCircle, cls: "bg-red-50 text-red-700" },
} as const;

export function SourcingRunsTable({ runs, now }: { runs: SourcingRun[]; now: number }) {
  return (
    <Card className="bg-white rounded-lg border border-sky-200 shadow-md">
      <CardHeader>
        <CardTitle>Recent runs</CardTitle>
        <p className="text-xs text-muted-foreground">Last 10 sourcing runs, newest first.</p>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">No runs yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Finished</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead className="text-right">Scraped</TableHead>
                <TableHead className="text-right">Matched</TableHead>
                <TableHead className="text-right">Profitable</TableHead>
                <TableHead className="text-right">Keepa tokens</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => {
                const s = run.status ? STATUS[run.status] : null;
                const Icon = s?.Icon ?? HelpCircle;
                return (
                  <TableRow key={run.id}>
                    <TableCell title={run.finished_at}>{formatTimeAgo(run.finished_at, now)}</TableCell>
                    <TableCell>{categoryLabel(run.category_url)}</TableCell>
                    <TableCell>{run.trigger ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCount(run.products_scraped)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCount(run.asins_matched)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCount(run.profitable)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {run.keepa_tokens_consumed != null ? `${formatCount(run.keepa_tokens_consumed)} used · ` : ""}
                      {formatCount(run.keepa_tokens_left)} left
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${s?.cls ?? "bg-gray-100 text-gray-600"}`}
                        title={run.error ?? undefined}
                      >
                        <Icon className="size-3.5" aria-hidden /> {s?.label ?? run.status ?? "Unknown"}
                      </span>
                      {run.error && (
                        <span className="mt-1 block max-w-[360px] truncate text-xs text-muted-foreground" title={run.error}>
                          {run.error}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
