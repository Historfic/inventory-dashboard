"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useArbitrageStatus } from "@/hooks/useArbitrageStatus";
import {
  ARBITRAGE_CATEGORIES,
  DEFAULT_PRODUCT_COUNT,
  KEEPA_TOKENS_PER_PRODUCT,
  PRODUCT_COUNT_OPTIONS,
} from "@/lib/arbitrage-config";

type Phase = "idle" | "starting" | "running" | "done" | "error";
const RUN_TIMEOUT_MS = 4 * 60_000;

const pill = (active: boolean) =>
  `rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    active ? "bg-sky-700 text-white hover:bg-sky-800" : "bg-sky-100 text-sky-900 hover:bg-sky-200"
  }`;

function Notice({ tone, children }: { tone: "info" | "success" | "warn" | "error"; children: React.ReactNode }) {
  const styles = {
    info: { cls: "bg-sky-50 text-sky-900", Icon: Loader2, spin: true },
    success: { cls: "bg-emerald-50 text-emerald-800", Icon: CheckCircle2, spin: false },
    warn: { cls: "bg-amber-50 text-amber-900", Icon: AlertTriangle, spin: false },
    error: { cls: "bg-red-50 text-red-800", Icon: XCircle, spin: false },
  }[tone];
  const { Icon } = styles;
  return (
    <p role="status" className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm ${styles.cls}`}>
      <Icon className={`mt-0.5 size-4 flex-none ${styles.spin ? "animate-spin" : ""}`} aria-hidden />
      <span>{children}</span>
    </p>
  );
}

type Props = {
  lastRunId: number | null; // newest run already on screen
  onRunFinished: () => void; // reload leads + runs
};

export function RunSourcingPanel({ lastRunId, onRunFinished }: Props) {
  const { status, refresh } = useArbitrageStatus();
  const [category, setCategory] = useState<string>(ARBITRAGE_CATEGORIES[0].url);
  const [count, setCount] = useState<number>(DEFAULT_PRODUCT_COUNT);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const baselineRunId = useRef<number | null>(null);
  const startedAt = useRef(0);

  // While a run is in flight, poll until a new row appears in sourcing_runs.
  useEffect(() => {
    if (phase !== "running") return;
    const timer = setInterval(async () => {
      const next = await refresh();
      const run = next?.latestRun;
      if (run && run.id !== baselineRunId.current) {
        baselineRunId.current = run.id;
        if (run.status === "error") {
          setPhase("error");
          setMessage(`Run failed: ${run.error ?? "unknown error"}`);
        } else {
          setPhase("done");
          setMessage(`Done: ${run.asins_matched ?? 0} Amazon matches, ${run.profitable ?? 0} profitable.`);
        }
        onRunFinished();
      } else if (Date.now() - startedAt.current > RUN_TIMEOUT_MS) {
        setPhase("error");
        setMessage("No result after 4 minutes. Check the execution log in n8n.");
      }
    }, 4_000);
    return () => clearInterval(timer);
  }, [phase, refresh, onRunFinished]);

  const needed = count * KEEPA_TOKENS_PER_PRODUCT;
  const keepa = status?.keepa ?? null;
  const shortOnTokens = keepa !== null && keepa.tokensLeft < needed;
  const minutesToReady =
    keepa && shortOnTokens ? Math.ceil((needed - keepa.tokensLeft) / Math.max(keepa.refillRate, 1)) : 0;
  const busy = phase === "starting" || phase === "running" || status?.n8n?.status === "running";
  const n8nLabel =
    status?.n8n == null ? "unknown" : status.n8n.status === "running" ? "running now" : `last run ${status.n8n.status}`;

  async function start() {
    setPhase("starting");
    setMessage("");
    baselineRunId.current = status?.latestRun?.id ?? lastRunId;
    try {
      const res = await fetch("/api/arbitrage/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_url: category, max_products: count }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || `HTTP ${res.status}`);
      startedAt.current = Date.now();
      setPhase("running");
      setMessage(`${data.message}. This usually takes 20–40 seconds.`);
    } catch (error) {
      setPhase("error");
      setMessage(error instanceof Error ? error.message : "Could not start the run.");
    }
  }

  return (
    <Card className="bg-white rounded-lg border border-sky-200 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Run sourcing</CardTitle>
        <p className="text-xs text-muted-foreground">
          Scrapes a PlumbersStock category, looks every UPC up on Amazon through Keepa, and scores it. Re-running a
          category refreshes prices for leads already found.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 text-xs uppercase tracking-wide text-muted-foreground">Category</span>
          {ARBITRAGE_CATEGORIES.map((c) => (
            <button
              key={c.url}
              type="button"
              disabled={busy}
              aria-pressed={category === c.url}
              onClick={() => setCategory(c.url)}
              className={pill(category === c.url)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 text-xs uppercase tracking-wide text-muted-foreground">Products</span>
          {PRODUCT_COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              disabled={busy}
              aria-pressed={count === n}
              onClick={() => setCount(n)}
              className={pill(count === n)}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button size="lg" onClick={start} disabled={busy || shortOnTokens}>
            {busy ? (
              <>
                <Loader2 className="animate-spin" aria-hidden /> Running…
              </>
            ) : (
              "Run sourcing"
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            Keepa tokens <strong className="tabular-nums text-gray-900">{keepa ? keepa.tokensLeft : "—"}</strong>
            {keepa ? ` · refills ${keepa.refillRate}/min` : ""} · this run needs ≈ {needed} · n8n: {n8nLabel}
          </span>
        </div>
        {shortOnTokens && phase !== "running" && (
          <Notice tone="warn">
            Not enough Keepa tokens for {count} products. Ready in about {minutesToReady} min, or pick fewer products.
          </Notice>
        )}
        {message && (
          <Notice tone={phase === "error" ? "error" : phase === "done" ? "success" : "info"}>{message}</Notice>
        )}
      </CardContent>
    </Card>
  );
}
