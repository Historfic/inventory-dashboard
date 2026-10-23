import assert from "node:assert/strict";
import { LINE_TYPE_COLORS, SERIES, stackedAreaProps } from "./chart-theme";
import { LINE_TYPES } from "./line-counts-types";

// Validated with the dataviz validator in exactly this order (light, surface #ffffff,
// adjacent pairs). Reordering or adding a colour means re-running the validator.
assert.deepEqual([...SERIES], ["#1D8ACB", "#eb6834", "#1baf7a", "#eda100"]);
// Colour follows the line type, never its rank.
assert.deepEqual(LINE_TYPE_COLORS, { PO: "#1D8ACB", SO: "#eb6834", DIR: "#1baf7a", TR: "#eda100" });
for (const t of LINE_TYPES) assert.ok(LINE_TYPE_COLORS[t], `missing colour for ${t}`);
// Recharts takes an Area's legend/tooltip colour from `stroke`: it must be the series colour.
assert.equal(stackedAreaProps("#123456").stroke, "#123456");
console.log("chart-theme: all assertions passed");
