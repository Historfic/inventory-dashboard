"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { DashboardCard } from "@/components/layout/DashboardCard";
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

// Phones: at least 40×40 (py-3, min-w-10) for a comfortable tap; from sm up the compact 24px pill.
const pill = (active: boolean) =>
  `min-w-10 rounded-full px-3 py-3 text-xs font-medium transition-colors sm:min-w-0 sm:py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
    active ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-foreground hover:bg-muted/80"
  }`;

function Notice({ tone, children }: { tone: "info" | "success" | "warn" | "error"; children: React.ReactNode }) {
  const styles = {
    info: { icon: "text-primary", Icon: Loader2, spin: true },
    success: { icon: "text-status-good", Icon: CheckCircle2, spin: false },
    warn: { icon: "text-status-warning", Icon: AlertTriangle, spin: false },
    error: { icon: "text-status-critical", Icon: XCircle, spin: false },
  }[tone];
  const { Icon } = styles;
  return (
    <p role="status" className={`flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-sm text-foreground`}>
      <Icon className={`mt-0.5 size-4 flex-none ${styles.icon} ${styles.spin ? "animate-spin" : ""}`} aria-hidden />
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
    <DashboardCard
      title="Run sourcing"
      description="Scrapes a PlumbersStock category, looks every UPC up on Amazon through Keepa, and scores it. Re-running a category refreshes prices for leads already found."
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-full text-xs uppercase tracking-wide text-muted-foreground sm:w-20">Category</span>
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
          <span className="w-full text-xs uppercase tracking-wide text-muted-foreground sm:w-20">Products</span>
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
          <Button size="lg" className="h-10 sm:h-9" onClick={start} disabled={busy || shortOnTokens}>
            {busy ? (
              <>
                <Loader2 className="animate-spin" aria-hidden /> Running…
              </>
            ) : (
              "Run sourcing"
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            Keepa tokens <strong className="tabular-nums text-foreground">{keepa ? keepa.tokensLeft : "—"}</strong>
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
      </div>
    </DashboardCard>
  );
}
