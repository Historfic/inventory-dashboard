import { aggregateByBuyer, aggregateByBuyLine } from "./aggregations";
import type { InventoryRow } from "./types";

const sample = [
  { buyer: "CATHLYNS", buy_line: "FASTENERS", days_out: 10, stockout_pct: 0.5 },
  { buyer: "CATHLYNS", buy_line: "FASTENERS", days_out: 20, stockout_pct: 1.0 },
  { buyer: "JEFFC", buy_line: "TOOLS", days_out: 5, stockout_pct: 0.25 },
  { buyer: "UNASSIGNED", buy_line: "TOOLS", days_out: 30, stockout_pct: 1.0 },
] as unknown as InventoryRow[];

console.log("=== aggregateByBuyer ===");
console.table(aggregateByBuyer(sample));

console.log("\n=== aggregateByBuyLine ===");
console.table(aggregateByBuyLine(sample));
