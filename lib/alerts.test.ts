import { evaluateAlerts, evaluateBottlenecks } from "./alerts";
import type { InventoryRow } from "./types";

const sample = [
  // critical-stockout-no-po
  { buyer: "ALICE", buy_line: "F-NIBCO", ecl_id: "A1", days_out: 45, stockout_pct: 1.0, on_po: 0 },
  // critical-stockout-no-po (same buy_line)
  { buyer: "ALICE", buy_line: "F-NIBCO", ecl_id: "A2", days_out: 60, stockout_pct: 1.0, on_po: 0 },
  // severe-stockout (not 100%, no PO check)
  { buyer: "BOB", buy_line: "H-DIAL", ecl_id: "B1", days_out: 20, stockout_pct: 0.85, on_po: 5 },
  // aging-stockout
  { buyer: "BOB", buy_line: "H-DIAL", ecl_id: "B2", days_out: 35, stockout_pct: 0.6, on_po: 10 },
  // no alert: healthy
  { buyer: "CAROL", buy_line: "P-PVC-S", ecl_id: "C1", days_out: 0, stockout_pct: 0.0, on_po: 0 },
] as unknown as InventoryRow[];

console.log("=== evaluateAlerts ===");
const alerts = evaluateAlerts(sample);
console.table(
  alerts.map((a) => ({
    rule_id: a.rule.id,
    severity: a.rule.severity,
    matched_rows: a.rows.length,
  }))
);

console.log("\n=== evaluateBottlenecks ===");
console.table(evaluateBottlenecks(sample));

console.log("\nExpected:");
console.log("  critical-stockout-no-po: 2 rows");
console.log("  severe-stockout: 1 row");
console.log("  aging-stockout: 1 row");
console.log("  bottleneck: F-NIBCO buy_line with count 2");
console.log("  bottleneck: ALICE buyer with metric 1.0");
