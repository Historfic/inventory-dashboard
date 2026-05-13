import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getAnthropicClient, HAIKU_MODEL, extractText } from "@/lib/ai-client";
import { explainCache } from "@/lib/ai-cache";

export const runtime = "nodejs";

export type ExplainRequest = {
  reportDate: string;
  alertId: string;
  alertLabel: string;
  severity: "warning" | "critical";
  itemCount: number;
  topBuyers: { buyer: string; count: number }[];
  topBuyLines: { buy_line: string; count: number }[];
  sample: { ecl_id: string | number; desc_1: string | null; days_out: number | null; stockout_pct: number | null }[];
};

const SYSTEM_PROMPT = `You explain inventory alerts to a busy executive (Todd) in plain English.

Output rules:
- Exactly 2 short paragraphs, plain text, no markdown.
- Paragraph 1: what this alert means in business terms (1-2 sentences).
- Paragraph 2: the suggested next action — concrete, who should do it (buyer name if obvious), and why it matters (1-2 sentences).
- No greetings, no sign-off, no "let me know if you need more".
- Use specific buyer/buy_line names from the data when relevant.
- Never invent items or numbers not in the data.

Severity meanings:
- critical = items fully out of stock with no replenishment in motion. Real revenue loss happening now.
- warning = items trending toward a stockout or aging in partial-stockout. Recoverable if acted on.`;

function cacheKey(req: ExplainRequest): string {
  return [
    req.reportDate,
    req.alertId,
    req.itemCount,
    req.topBuyers.map((b) => `${b.buyer}:${b.count}`).join(","),
    req.topBuyLines.map((b) => `${b.buy_line}:${b.count}`).join(","),
  ].join("|");
}

function buildUserMessage(req: ExplainRequest): string {
  const buyers = req.topBuyers.map((b) => `- ${b.buyer}: ${b.count} items`).join("\n");
  const buyLines = req.topBuyLines.map((b) => `- ${b.buy_line}: ${b.count} items`).join("\n");
  const sample = req.sample
    .map(
      (s) =>
        `- ${s.ecl_id} ${s.desc_1 ?? ""} — ${s.days_out ?? 0} days out, ${Math.round(
          (s.stockout_pct ?? 0) * 100
        )}% stockout`
    )
    .join("\n");

  return `Alert: ${req.alertLabel}
Severity: ${req.severity}
Items affected: ${req.itemCount.toLocaleString()}

Concentration by buyer:
${buyers || "- (none)"}

Concentration by buy line:
${buyLines || "- (none)"}

Representative items:
${sample || "- (none)"}

Write the explanation now.`;
}

export async function POST(request: Request) {
  let body: ExplainRequest;
  try {
    body = (await request.json()) as ExplainRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.reportDate || !body.alertId) {
    return NextResponse.json({ error: "reportDate and alertId are required" }, { status: 400 });
  }

  const key = cacheKey(body);
  const hit = explainCache.get(key);
  if (hit) {
    return NextResponse.json({ text: hit, cached: true });
  }

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 350,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(body) }],
    });
    const text = extractText(response);
    explainCache.set(key, text);
    return NextResponse.json({ text, cached: false });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Anthropic authentication failed. Check ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited by Anthropic. Try again shortly." },
        { status: 429 }
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Anthropic API error: ${err.message}` }, { status: 502 });
    }
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
