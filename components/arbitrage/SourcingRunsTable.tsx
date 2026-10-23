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
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { categoryLabel } from "@/lib/arbitrage-config";
import { formatCount, formatTimeAgo } from "@/lib/arbitrage-format";
import type { SourcingRun } from "@/lib/arbitrage-types";

const STATUS = {
  success: { label: "Success", Icon: CheckCircle2, icon: "text-status-good" },
  partial: { label: "Partial", Icon: AlertTriangle, icon: "text-status-warning" },
  error: { label: "Failed", Icon: XCircle, icon: "text-status-critical" },
} as const;

export function SourcingRunsTable({ runs, now }: { runs: SourcingRun[]; now: number }) {
  return (
    <DashboardCard title="Recent runs" description="Last 10 sourcing runs, newest first.">
      {runs.length === 0 ? (
        <EmptyState message="No runs yet." />
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
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground"
                      title={run.error ?? undefined}
                    >
                      <Icon className={`size-3.5 ${s?.icon ?? "text-muted-foreground"}`} aria-hidden /> {s?.label ?? run.status ?? "Unknown"}
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
    </DashboardCard>
  );
}
