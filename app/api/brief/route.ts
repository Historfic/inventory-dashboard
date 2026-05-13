import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getAnthropicClient, HAIKU_MODEL, extractText } from "@/lib/ai-client";
import { briefCache } from "@/lib/ai-cache";

export const runtime = "nodejs";

export type BriefRequest = {
  reportDate: string;
  itemsShown: number;
  revenueAtRisk: number;
  criticalFires: number;
  topBuyersByStockout: { buyer: string; avg_stockout_pct: number; item_count: number }[];
  topBuyLinesNoPo: { buy_line: string; count: number }[];
  alertCounts: { critical: number; warning: number };
};

const SYSTEM_PROMPT = `You are an operations analyst writing a short executive brief for a wholesale inventory dashboard.

Audience: a single executive (Todd) reviewing today's snapshot. He is busy and skims.

Style rules:
- Plain text only. No markdown, no bullets, no headings, no asterisks.
- 2 short paragraphs maximum. ~3-4 sentences each.
- Lead with what changed or what matters most today, not boilerplate restatement of the numbers.
- Use concrete numbers from the data the user provides. Never invent figures.
- Reference specific buyers and buy lines by name when they are the story.
- No greetings, no sign-off, no "in summary", no advice to "monitor" or "investigate further".
- Tone: calm, direct, factual. Like a senior analyst dropping a note in Slack.

Vocabulary cheat sheet:
- "stockout %" = share of the period the item was out of stock (0-100%).
- "days out" = consecutive days an item has been out of stock.
- "no PO" = there is no purchase order placed yet for that item.
- "buyer" = the team member responsible for ordering that product line.
- "UNASSIGNED" = items with no buyer owner.`;

function cacheKey(req: BriefRequest): string {
  return [
    req.reportDate,
    req.itemsShown,
    req.revenueAtRisk,
    req.criticalFires,
    req.alertCounts.critical,
    req.alertCounts.warning,
    req.topBuyersByStockout.map((b) => `${b.buyer}:${b.avg_stockout_pct.toFixed(3)}`).join(","),
    req.topBuyLinesNoPo.map((b) => `${b.buy_line}:${b.count}`).join(","),
  ].join("|");
}

function buildUserMessage(req: BriefRequest): string {
  const buyers = req.topBuyersByStockout
    .map(
      (b) =>
        `- ${b.buyer}: avg stockout ${Math.round(b.avg_stockout_pct * 100)}% across ${b.item_count} items`
    )
    .join("\n");
  const buyLines = req.topBuyLinesNoPo
    .map((b) => `- ${b.buy_line}: ${b.count} items fully out with no PO`)
    .join("\n");

  return `Snapshot date: ${req.reportDate}
Items in view: ${req.itemsShown.toLocaleString()}
Revenue at risk (sum of hits across visible items): ${req.revenueAtRisk.toLocaleString()}
Critical fires (visible item count): ${req.criticalFires.toLocaleString()}
Active alerts firing: ${req.alertCounts.critical} critical, ${req.alertCounts.warning} warning

Top buyers by avg stockout %:
${buyers || "- (none)"}

Top buy lines fully out with no PO:
${buyLines || "- (none)"}

Write the executive brief now.`;
}

export async function POST(request: Request) {
  let body: BriefRequest;
  try {
    body = (await request.json()) as BriefRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.reportDate) {
    return NextResponse.json({ error: "reportDate is required" }, { status: 400 });
  }

  const key = cacheKey(body);
  const hit = briefCache.get(key);
  if (hit) {
    return NextResponse.json({ text: hit, cached: true });
  }

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(body) }],
    });
    const text = extractText(response);
    briefCache.set(key, text);
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
