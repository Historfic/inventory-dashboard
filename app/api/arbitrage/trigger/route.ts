import { NextResponse } from "next/server";
import {
  ARBITRAGE_CATEGORIES,
  DEFAULT_PRODUCT_COUNT,
  KEEPA_TOKENS_PER_PRODUCT,
  MAX_PRODUCT_COUNT,
} from "@/lib/arbitrage-config";
import { getKeepaTokens, getN8nStatus } from "@/lib/arbitrage-server";

export const runtime = "nodejs";

// Starts the n8n Arbitrage Sourcing Pipeline through its header-authenticated
// webhook. The webhook answers immediately; results land in Supabase and the
// page picks them up via /api/arbitrage/status.
export async function POST(req: Request) {
  const webhookUrl = process.env.ARBITRAGE_N8N_WEBHOOK_URL;
  const secret = process.env.ARBITRAGE_N8N_WEBHOOK_SECRET;
  if (!webhookUrl || !secret) {
    return NextResponse.json({ ok: false, message: "Arbitrage webhook is not configured." }, { status: 500 });
  }

  let body: { category_url?: string; max_products?: number } = {};
  try {
    body = await req.json();
  } catch {
    // empty body -> defaults
  }
  // Only known supplier pages, only a small batch (Keepa refills slowly).
  const category = ARBITRAGE_CATEGORIES.find((c) => c.url === body.category_url) ?? ARBITRAGE_CATEGORIES[0];
  const maxProducts = Math.min(
    Math.max(Math.round(Number(body.max_products) || DEFAULT_PRODUCT_COUNT), 1),
    MAX_PRODUCT_COUNT
  );

  // The dashboard has no login (private URL), so guard here, not only in the UI.
  const [n8n, keepa] = await Promise.all([getN8nStatus(), getKeepaTokens()]);
  if (n8n?.status === "running") {
    return NextResponse.json({ ok: false, message: "A sourcing run is already in progress." }, { status: 409 });
  }
  const needed = maxProducts * KEEPA_TOKENS_PER_PRODUCT;
  if (keepa && keepa.tokensLeft < needed) {
    return NextResponse.json(
      { ok: false, message: `Not enough Keepa tokens: ${keepa.tokensLeft} left, about ${needed} needed.` },
      { status: 409 }
    );
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-arbitrage-secret": secret },
      body: JSON.stringify({ category_url: category.url, max_products: maxProducts, trigger: "dashboard" }),
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, message: `n8n responded with HTTP ${res.status}` }, { status: 502 });
    }
    return NextResponse.json({ ok: true, message: `Sourcing ${maxProducts} products from ${category.label}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ ok: false, message: `Could not reach n8n: ${message}` }, { status: 502 });
  }
}
