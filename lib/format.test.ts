import assert from "node:assert/strict";
import { formatCompact } from "./format";

// Chart y-axis ticks for the Line Counts charts (values reach six figures).
assert.equal(formatCompact(0), "0");
assert.equal(formatCompact(950), "950");
assert.equal(formatCompact(1000), "1K");
assert.equal(formatCompact(1500), "1.5K");
assert.equal(formatCompact(150000), "150K");
assert.equal(formatCompact(538537), "538.5K");
assert.equal(formatCompact(1200000), "1.2M");
assert.equal(formatCompact(-2000), "-2K");
console.log("format: all assertions passed");
