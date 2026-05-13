"use client";

import type { Alert } from "@/lib/alerts";

export function AlertCard({ alert }: { alert: Alert }) {
  const isCritical = alert.rule.severity === "critical";
  const badgeClass = isCritical
    ? "bg-red-100 text-red-800 border-red-200"
    : "bg-amber-100 text-amber-800 border-amber-200";
  const bodyClass = isCritical
    ? "border-l-4 border-red-400 bg-red-50"
    : "border-l-4 border-amber-400 bg-amber-50";

  return (
    <div className={`rounded-md ${bodyClass} px-4 py-3`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold uppercase border rounded px-2 py-0.5 ${badgeClass}`}>
            {alert.rule.severity}
          </span>
          <span className="text-sm font-medium text-gray-900">{alert.rule.label}</span>
        </div>
        <span className="text-sm tabular-nums text-gray-700">
          {alert.rows.length.toLocaleString()} items
        </span>
      </div>
    </div>
  );
}
