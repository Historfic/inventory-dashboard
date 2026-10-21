# Dashboard Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the four dashboard pages with a brand-led enterprise look (tokens, shared building blocks, nav, tables, charts) without changing any number on screen.

**Architecture:** Theme tokens move into `app/globals.css`; chart colours and mark specs live in `lib/chart-theme.ts`; ~40 copy-pasted card/table/chart wrappers are replaced by a few shared presentational components (`components/layout/`, `components/table/`, `components/charts/`, `components/filters/`). Data hooks, queries, aggregations and filter logic are not touched. A before/after capture of every number rendered on the four pages proves nothing moved.

**Tech Stack:** Next.js 16.2 (App Router, Turbopack), React 19, TypeScript strict, Tailwind CSS 4 (`@theme inline`), shadcn/ui on `@base-ui/react`, TanStack Table 8, Recharts 3.8, lucide-react 1.14. Tests are tsx-runnable scripts (`npx --yes tsx lib/<name>.test.ts`) using `node:assert/strict` — there is no test runner. Visual checks use the `agent-browser` CLI (0.32).

**Spec:** `docs/superpowers/specs/2026-10-21-dashboard-visual-refresh-design.md`

## Global Constraints

- **No number on screen changes.** `bash scripts/_visual/compare.sh <label>` must print `NUMBERS MATCH` after every task from Task 2 on.
- Presentation only: do not modify anything in `hooks/`, any query, `lib/aggregations.ts`, `lib/*-aggregations.ts`, `lib/filters.ts`, or `lib/alerts.ts` (CLAUDE.md §4 traps).
- No new dependencies and no library swaps (CLAUDE.md §1). Icons come from `lucide-react` (already installed).
- Light mode only; leave the `.dark { … }` block in `app/globals.css` untouched. Desktop only. Page layout and section order stay as they are.
- Do not touch the six components no page renders: `components/ai/ExecutiveBriefCard.tsx`, `components/alerts/AlertCard.tsx`, `components/alerts/AlertsPanel.tsx`, `components/alerts/BottlenecksPanel.tsx`, `components/kpi/CriticalFiresCard.tsx`, `components/kpi/RevenueAtRiskCard.tsx`. Do not touch `app/test/page.tsx`.
- Colours, exactly: brand `#1D8ACB`; `--primary` (text/buttons on brand) `#1872A8`; `--brand-subtle` `#E8F3FA`; canvas `#f9fafb`; ink `#231F20`; muted text `#6b7280`; hairline `#e5e7eb`; chart series in this fixed order `#1D8ACB` `#eb6834` `#1baf7a` `#eda100`; status good `#0ca30c`, warning `#fab219`, serious `#ec835a`, critical `#d03b3b`.
- Big numbers (stat tiles) use proportional figures — never `tabular-nums`. Table number cells use `tabular-nums`.
- Chart text never wears the series colour (legend labels, tooltip text and values are ink/muted).
- Lint: **no new problems** versus the baseline captured in Task 1 (19 pre-existing). Check with `bash scripts/_visual/lint-check.sh`.
- `CLAUDE.md` has uncommitted edits by the owner: **never edit, stage or commit it.** Stage files by explicit path only — never `git add -A` / `git add .`.
- `scripts/_visual/` is git-ignored (`scripts/_*` in `.gitignore`); never force-add it.
- Work on branch `dashboard-visual-refresh`. Do not merge to `main` (that deploys production on Vercel).
- Every commit message ends with a blank line then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- All commands run from `inventory-dashboard/` in Git Bash.

## File map

| File | Status | Responsibility |
|---|---|---|
| `app/globals.css` | modify | Brand tokens, status tokens, font-stack fix |
| `app/layout.tsx` | modify | Body drops `bg-sky-100` |
| `lib/format.ts` | modify | + `formatCompact()` for chart axis ticks |
| `lib/format.test.ts` | create | Tests `formatCompact` |
| `lib/page-state.ts` | create | `pageView()`: which body a page renders for its hook state |
| `lib/page-state.test.ts` | create | Tests `pageView` |
| `lib/chart-theme.ts` | create | Series palette, line-type colours, mark/axis/grid/tooltip specs |
| `lib/chart-theme.test.ts` | create | Guards the validated palette order and the stacked-area stroke rule |
| `components/layout/DashboardCard.tsx` | create | The one card wrapper (title, description, action) |
| `components/layout/EmptyState.tsx` | create | In-card empty message (+ `EmptyCard` for page-level, Task 8) |
| `components/layout/Skeleton.tsx` | create | Pulsing placeholder block |
| `components/layout/StatTile.tsx` | create | Headline-number tile |
| `components/layout/PageShell.tsx` | create | Page `<main>` + header; `PageContent` (refetch dim) |
| `components/layout/LoadingState.tsx` | create | First-load skeleton in card shapes |
| `components/layout/ErrorState.tsx` | create | Error message card with status icon |
| `components/table/SortIcon.tsx` | create | Sort chevrons |
| `components/table/DataTable.tsx` | create | Shared sticky-header sortable table body |
| `components/ui/table.tsx` | modify | Header/row/cell base styles, selected-row style |
| `components/charts/ChartTooltip.tsx` | create | Shared tooltip body + ink legend labels |
| `components/filters/FilterChip.tsx` | create | Active-filter chip + "Clear all" button |
| `components/filters/FilterBar.tsx` | create | White bar for filter controls / chips |
| 10 table components | modify | Use `DashboardCard` + `DataTable` |
| 7 chart components | modify | Use `DashboardCard` + chart theme + `ChartTooltip` |
| 3 overview components | modify | Use `StatTile` |
| `components/Navigation.tsx`, 4 filter components | modify | Brand tabs, chips, one control height |
| 4 pages | modify | `PageShell`, loading rule, shared states |

---

### Task 1: Baseline capture and check scripts

Nothing in the app changes in this task. It produces the "before" evidence every later task is compared against.

**Files:**
- Create (git-ignored): `scripts/_visual/numbers.js`, `scripts/_visual/capture.sh`, `scripts/_visual/compare.sh`, `scripts/_visual/lint-summary.mjs`, `scripts/_visual/lint-check.sh`
- Output (git-ignored): `scripts/_visual/before/`, `scripts/_visual/lint-before.txt`

**Interfaces:**
- Produces: `bash scripts/_visual/capture.sh <label>` → `scripts/_visual/<label>/{days-out,gmroi,line-counts,freight}.png`, `…/<page>.numbers.txt` (one rendered number per line, chart SVG excluded), `…/font.txt`. `bash scripts/_visual/compare.sh <label>` → prints `NUMBERS MATCH` and exits 0, or prints the diff and exits 1. `bash scripts/_visual/lint-check.sh` → prints `NO NEW LINT PROBLEMS` and exits 0, or lists new problems and exits 1.

- [ ] **Step 1: Confirm branch and install dependencies**

Run:
```bash
git branch --show-current
git status --short
[ -d node_modules ] || npm ci --no-audit --no-fund
```
Expected: `dashboard-visual-refresh`; status shows only ` M CLAUDE.md` (the owner's edit — leave it). `npm ci` may print `allow-scripts` warnings for `sharp`, `msw`, `unrs-resolver`; that is fine — do not approve them.

- [ ] **Step 2: Create the number extractor**

Create `scripts/_visual/numbers.js`:
```js
// Every number rendered as text inside <main>, one per line, in DOM order.
// Chart SVG and tooltip wrappers are excluded: axis ticks are reformatted on purpose.
(() => {
  const main = document.querySelector("main");
  if (!main) return "NO <main> FOUND";
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.parentElement && n.parentElement.closest("svg, .recharts-tooltip-wrapper")
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  const nums = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    for (const m of n.nodeValue.matchAll(/-?\$?\d[\d,]*(?:\.\d+)?%?/g)) nums.push(m[0]);
  }
  return nums.join("\n");
})()
```

- [ ] **Step 3: Create the capture and compare scripts**

Create `scripts/_visual/capture.sh`:
```bash
#!/usr/bin/env bash
# Full-page screenshots + every on-screen number for the four pages.
# Needs `npm run dev` serving http://localhost:3000. Usage: bash scripts/_visual/capture.sh <label>
set -euo pipefail
label="${1:?usage: capture.sh <label>}"
out="scripts/_visual/$label"
rm -rf "$out" && mkdir -p "$out"
unquote() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(JSON.parse(s)+"\n"))'; }
agent-browser open about:blank >/dev/null
agent-browser set viewport 1440 900 >/dev/null
for page in days-out gmroi line-counts freight; do
  path="/$page"; [ "$page" = "days-out" ] && path="/"
  agent-browser open "http://localhost:3000$path" >/dev/null
  agent-browser wait "[data-slot=table]" >/dev/null
  agent-browser wait 3000 >/dev/null
  agent-browser screenshot --full "$out/$page.png" >/dev/null
  agent-browser eval --stdin < scripts/_visual/numbers.js | unquote > "$out/$page.numbers.txt"
done
agent-browser eval "getComputedStyle(document.body).fontFamily" | unquote > "$out/font.txt"
agent-browser close >/dev/null
echo "captured $out — $(cat "$out"/*.numbers.txt | wc -l) numbers; body font: $(cat "$out/font.txt")"
```

Create `scripts/_visual/compare.sh`:
```bash
#!/usr/bin/env bash
# Compares every page's rendered numbers against the baseline. Usage: bash scripts/_visual/compare.sh <label>
set -uo pipefail
label="${1:?usage: compare.sh <label>}"
status=0
for page in days-out gmroi line-counts freight; do
  if ! diff -u "scripts/_visual/before/$page.numbers.txt" "scripts/_visual/$label/$page.numbers.txt"; then
    echo "MISMATCH on $page"; status=1
  fi
done
[ $status -eq 0 ] && echo "NUMBERS MATCH"
exit $status
```

- [ ] **Step 4: Create the lint scripts**

Create `scripts/_visual/lint-summary.mjs`:
```js
// One line per ESLint problem — "E|W <file> <rule>" — without line numbers, so edits that
// shift lines don't count as new problems. Usage: node lint-summary.mjs <eslint-output.json>
import { readFileSync } from "fs";
const results = JSON.parse(readFileSync(process.argv[2], "utf8"));
const lines = [];
for (const f of results) {
  const file = f.filePath.split(/inventory-dashboard[\\/]/).pop().split("\\").join("/");
  for (const m of f.messages) lines.push(`${m.severity === 2 ? "E" : "W"} ${file} ${m.ruleId}`);
}
console.log(lines.sort().join("\n"));
```

Create `scripts/_visual/lint-check.sh`:
```bash
#!/usr/bin/env bash
# Fails only on lint problems that were not in the baseline. Usage: bash scripts/_visual/lint-check.sh
set -uo pipefail
npx eslint . -f json > scripts/_visual/lint-now.json 2>/dev/null
node scripts/_visual/lint-summary.mjs scripts/_visual/lint-now.json > scripts/_visual/lint-now.txt
new=$(comm -13 scripts/_visual/lint-before.txt scripts/_visual/lint-now.txt)
if [ -n "$new" ]; then echo "NEW LINT PROBLEMS:"; echo "$new"; exit 1; fi
echo "NO NEW LINT PROBLEMS ($(wc -l < scripts/_visual/lint-now.txt) total, baseline $(wc -l < scripts/_visual/lint-before.txt))"
```

- [ ] **Step 5: Record the lint baseline**

Run:
```bash
npx eslint . -f json > scripts/_visual/lint-before.json 2>/dev/null
node scripts/_visual/lint-summary.mjs scripts/_visual/lint-before.json > scripts/_visual/lint-before.txt
wc -l < scripts/_visual/lint-before.txt
bash scripts/_visual/lint-check.sh
```
Expected: `19`, then `NO NEW LINT PROBLEMS (19 total, baseline 19)`.

- [ ] **Step 6: Start the dev server and capture the baseline**

Start `npm run dev` in a separate terminal (or as a background process) and leave it running for the rest of the plan; wait until it prints `Ready`. Then run:
```bash
bash scripts/_visual/capture.sh before
bash scripts/_visual/compare.sh before
```
Expected: `captured scripts/_visual/before — N numbers; body font: …` with N in the thousands (the Purchase Days Out table renders every filtered item), then `NUMBERS MATCH`. Note the body font: it should **not** contain `Geist` (that is the font bug Task 2 fixes). Open the four PNGs and confirm each shows a fully loaded page (no "Loading…").

No commit — everything in this task is git-ignored.

---

### Task 2: Theme tokens, font fix, canvas

**Files:**
- Modify: `app/globals.css` (`@theme inline` block and `:root` block)
- Modify: `app/layout.tsx:29`

**Interfaces:**
- Produces Tailwind utilities used by every later task: `bg-brand` / `text-brand` / `ring-brand` / `after:bg-brand`, `bg-brand-subtle`, `text-status-good|warning|serious|critical`; CSS variables `--brand`, `--brand-subtle`, `--border`, `--status-*`; `text-primary` / `bg-primary` now mean `#1872A8`.

- [ ] **Step 1: Write the failing check**

Run:
```bash
cat scripts/_visual/before/font.txt
```
Expected: a font list **without** `Geist`. This is the failing check — Step 5 must show `Geist`. (If the baseline already contains `Geist`, the font bug is not what the spec describes: stop and report it before changing the font lines.)

- [ ] **Step 2: Fix the font stack and register the new tokens**

In `app/globals.css`, inside `@theme inline { … }`, replace these three lines:
```css
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);
  --font-heading: var(--font-sans);
```
with:
```css
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
  --font-heading: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --color-brand: var(--brand);
  --color-brand-subtle: var(--brand-subtle);
  --color-status-good: var(--status-good);
  --color-status-warning: var(--status-warning);
  --color-status-serious: var(--status-serious);
  --color-status-critical: var(--status-critical);
```

- [ ] **Step 3: Point the light-mode tokens at the brand**

In `app/globals.css`, replace the whole `:root { … }` block (leave `.dark { … }` untouched) with:
```css
:root {
  --background: #f9fafb;
  --foreground: #231f20;
  --card: #ffffff;
  --card-foreground: #231f20;
  --popover: #ffffff;
  --popover-foreground: #231f20;
  --primary: #1872a8;
  --primary-foreground: #ffffff;
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: #6b7280;
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: #e5e7eb;
  --input: #e5e7eb;
  --ring: #1d8acb;
  --chart-1: #1d8acb;
  --chart-2: #eb6834;
  --chart-3: #1baf7a;
  --chart-4: #eda100;
  --chart-5: oklch(0.269 0 0);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
  /* Brand (from public/PSLogo-dark.svg). #1D8ACB is 3.78:1 on white: marks, indicators, focus only.
     Text or white-on-brand uses --primary (#1872A8, 5.24:1). */
  --brand: #1d8acb;
  --brand-subtle: #e8f3fa;
  /* Reserved for meaning (alerts, anomaly flags); always paired with an icon + label. */
  --status-good: #0ca30c;
  --status-warning: #fab219;
  --status-serious: #ec835a;
  --status-critical: #d03b3b;
}
```

- [ ] **Step 4: Drop the hardcoded sky canvas from the body**

In `app/layout.tsx`, replace:
```tsx
      <body className="min-h-full flex flex-col bg-sky-100">
```
with:
```tsx
      <body className="min-h-full flex flex-col">
```
(`body` already gets `bg-background` from the `@layer base` rule in `globals.css`.)

- [ ] **Step 5: Run the checks**

Run:
```bash
npx tsc --noEmit
bash scripts/_visual/lint-check.sh
bash scripts/_visual/capture.sh after-task2
bash scripts/_visual/compare.sh after-task2
```
Expected: tsc prints nothing; `NO NEW LINT PROBLEMS`; the capture line now shows a body font containing `Geist`; `NUMBERS MATCH`. Open `scripts/_visual/after-task2/days-out.png` next to `before/days-out.png`: the text is now in Geist (a clean sans-serif). Little else changes yet — the pages still paint their own sky-blue `<main>` until Task 8, and the selected nav pill is still black until Task 7.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -F - <<'EOF'
style: brand tokens, status tokens, and fix the self-referencing font stack

--font-sans pointed at itself, so Geist never applied. Primary is now the
text-safe brand step #1872A8; #1D8ACB is the accent.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 3: Pure helpers — compact ticks, page state, chart theme (TDD)

**Files:**
- Create: `lib/format.test.ts`, `lib/page-state.ts`, `lib/page-state.test.ts`, `lib/chart-theme.ts`, `lib/chart-theme.test.ts`
- Modify: `lib/format.ts` (append)

**Interfaces:**
- Produces:
  - `formatCompact(value: number): string` in `@/lib/format` — `1500 → "1.5K"`, `150000 → "150K"`. For chart axis ticks only.
  - `type PageView = "error" | "loading" | "refreshing" | "empty" | "ready"` and `pageView(state: { loading: boolean; error: string | null; data: readonly unknown[] | null }): PageView` in `@/lib/page-state`.
  - In `@/lib/chart-theme`: `SERIES` (readonly tuple of 4 hex), `LINE_TYPE_COLORS: Record<"PO"|"SO"|"DIR"|"TR", string>`, `SURFACE`, `DIMMED_BAR`, `gridProps`, `axisProps`, `BAR_CURSOR`, `LINE_CURSOR`, `barProps`, `stackedBarProps`, `legendProps`, `lineProps(color: string)`, `stackedAreaProps(color: string)`.

- [ ] **Step 1: Write the failing tests**

Create `lib/format.test.ts`:
```ts
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
```

Create `lib/page-state.test.ts`:
```ts
import assert from "node:assert/strict";
import { pageView } from "./page-state";

assert.equal(pageView({ loading: true, error: null, data: null }), "loading");
// A refetch while previous rows are held: keep showing them (dimmed), don't flash a loader.
assert.equal(pageView({ loading: true, error: null, data: [1] }), "refreshing");
assert.equal(pageView({ loading: true, error: null, data: [] }), "refreshing");
assert.equal(pageView({ loading: false, error: "boom", data: null }), "error");
assert.equal(pageView({ loading: true, error: "boom", data: [1] }), "error");
assert.equal(pageView({ loading: false, error: null, data: null }), "empty");
assert.equal(pageView({ loading: false, error: null, data: [] }), "empty");
assert.equal(pageView({ loading: false, error: null, data: [1, 2] }), "ready");
console.log("page-state: all assertions passed");
```

Create `lib/chart-theme.test.ts`:
```ts
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
```

- [ ] **Step 2: Run them to see them fail**

Run:
```bash
npx --yes tsx lib/format.test.ts
npx --yes tsx lib/page-state.test.ts
npx --yes tsx lib/chart-theme.test.ts
```
Expected: the first fails with an error that `formatCompact` is not exported / not a function; the other two fail with `Cannot find module './page-state'` and `'./chart-theme'`.

- [ ] **Step 3: Implement `formatCompact`**

Append to `lib/format.ts`:
```ts

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 1500 -> "1.5K", 150000 -> "150K". Chart axis ticks only — table values keep their exact formatters. */
export function formatCompact(value: number): string {
  return compactFormatter.format(value);
}
```

- [ ] **Step 4: Implement `pageView`**

Create `lib/page-state.ts`:
```ts
export type PageView = "error" | "loading" | "refreshing" | "empty" | "ready";

type PageState = {
  loading: boolean;
  error: string | null;
  data: readonly unknown[] | null;
};

/**
 * Which body a page renders for its data hook's state. "refreshing" means a refetch is
 * running while the previous rows are still held: render them dimmed instead of swapping
 * in a loader, so a filter change never blanks the page.
 */
export function pageView({ loading, error, data }: PageState): PageView {
  if (error) return "error";
  if (loading) return data ? "refreshing" : "loading";
  if (!data || data.length === 0) return "empty";
  return "ready";
}
```

- [ ] **Step 5: Implement the chart theme**

Create `lib/chart-theme.ts`:
```ts
/**
 * Chart colours and mark specs, in one place (spec:
 * docs/superpowers/specs/2026-10-21-dashboard-visual-refresh-design.md §6).
 * SERIES was validated with the dataviz validator (light mode, surface #ffffff, adjacent
 * pairs) in this order. Re-run the validator before reordering or adding a colour.
 */
import type { LineCountRow } from "./line-counts-types";

/** Categorical slots, fixed order. Slot 1 is the brand blue. */
export const SERIES = ["#1D8ACB", "#eb6834", "#1baf7a", "#eda100"] as const;

/** Line types keep their colour whatever the filter: colour follows the entity, never its rank. */
export const LINE_TYPE_COLORS: Record<LineCountRow["line_type"], string> = {
  PO: SERIES[0],
  SO: SERIES[1],
  DIR: SERIES[2],
  TR: SERIES[3],
};

export const SURFACE = "#ffffff";

/** Unselected bars while one is emphasised by a cross-filter. */
export const DIMMED_BAR = "#cbd5e1";

/** <CartesianGrid {...gridProps} />: solid horizontal hairlines only. */
export const gridProps = { stroke: "#e5e7eb", vertical: false };

/** <XAxis {...axisProps} /> and <YAxis {...axisProps} />: muted 12px ticks, no axis or tick lines. */
export const axisProps = {
  tick: { fontSize: 12, fill: "#6b7280" },
  axisLine: false,
  tickLine: false,
};

/** Tooltip hover band on bar charts (the --brand-subtle tint). */
export const BAR_CURSOR = { fill: "#E8F3FA" };

/** Tooltip crosshair on line and area charts. */
export const LINE_CURSOR = { stroke: "#d1d5db", strokeWidth: 1 };

/** Single-series bars: at most 24px thick, 4px rounded data-end, square at the baseline. */
export const barProps = {
  maxBarSize: 24,
  radius: [4, 4, 0, 0] as [number, number, number, number],
};

/** Stacked bar segments: square, separated by a 2px surface gap (Bar legend colour comes from fill). */
export const stackedBarProps = { maxBarSize: 24, stroke: SURFACE, strokeWidth: 2 };

/** Legends — only on charts with two or more series. */
export const legendProps = {
  iconType: "circle" as const,
  iconSize: 8,
  wrapperStyle: { fontSize: 12 },
};

/** Lines: 2px, round caps, no resting dots; the hover dot is r=4 with a 2px surface ring. */
export function lineProps(color: string) {
  return {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    dot: false as const,
    activeDot: { r: 4, fill: color, stroke: SURFACE, strokeWidth: 2 },
  };
}

/**
 * Stacked areas: 2px edge in the series colour over an 85% fill. The edge must be the
 * series colour — Recharts takes an Area's legend and tooltip colour from `stroke`.
 */
export function stackedAreaProps(color: string) {
  return { stroke: color, strokeWidth: 2, fill: color, fillOpacity: 0.85 };
}
```

- [ ] **Step 6: Run the tests to see them pass**

Run:
```bash
npx --yes tsx lib/format.test.ts
npx --yes tsx lib/page-state.test.ts
npx --yes tsx lib/chart-theme.test.ts
npx tsc --noEmit
bash scripts/_visual/lint-check.sh
```
Expected: `format: all assertions passed`, `page-state: all assertions passed`, `chart-theme: all assertions passed`; tsc silent; `NO NEW LINT PROBLEMS`.

- [ ] **Step 7: Commit**

```bash
git add lib/format.ts lib/format.test.ts lib/page-state.ts lib/page-state.test.ts lib/chart-theme.ts lib/chart-theme.test.ts
git commit -F - <<'EOF'
feat: compact axis ticks, page-state rule, and a validated chart theme

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 4: Card, empty state, shared table — migrate the 10 tables

**Files:**
- Create: `components/layout/DashboardCard.tsx`, `components/layout/EmptyState.tsx`, `components/layout/Skeleton.tsx`, `components/table/SortIcon.tsx`, `components/table/DataTable.tsx`
- Modify: `components/ui/table.tsx` (`TableHeader`, `TableRow`, `TableHead`, `TableCell`)
- Modify: `components/kpi/BuyerSummaryTable.tsx`, `components/kpi/BuyerBuyLineTable.tsx`, `components/kpi/PurchaseDaysOutTable.tsx`, `components/gmroi/GmroiByBranchTable.tsx`, `components/gmroi/GmroiByBuyerTable.tsx`, `components/gmroi/GmroiByBuyLineTable.tsx`, `components/freight/FreightByVendorTable.tsx`, `components/freight/FreightByWriterTable.tsx`, `components/freight/HighInboundTable.tsx`, `components/line-counts/LineCountsPivotTable.tsx`

**Interfaces:**
- Consumes: tokens from Task 2 (`bg-brand-subtle`, `--brand`, `--border`, `text-status-warning`).
- Produces:
  - `DashboardCard({ title: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string })` from `@/components/layout/DashboardCard`
  - `EmptyState({ message: string })` from `@/components/layout/EmptyState`
  - `Skeleton({ className?: string; label?: string })` from `@/components/layout/Skeleton`
  - `DataTable<T>({ table: Table<T>; maxHeightClass: string; onRowClick?: (row: T) => void; isRowSelected?: (row: T) => boolean })` from `@/components/table/DataTable`
  - `SortIcon({ direction: false | SortDirection })` from `@/components/table/SortIcon`

In every table migration below, **column definitions, `useState` sorting, `useReactTable(...)` and click handlers stay exactly as they are** — only the import block and the returned JSX change.

- [ ] **Step 1: Create `DashboardCard`, `EmptyState`, `Skeleton`**

Create `components/layout/DashboardCard.tsx`:
```tsx
import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** The one card style for every dashboard section: white, hairline ring, soft shadow (CLAUDE.md §5). */
export function DashboardCard({ title, description, action, children, className }: Props) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
```

Create `components/layout/EmptyState.tsx`:
```tsx
import { Inbox } from "lucide-react";

/** Muted "nothing to show" block inside a card. The wording is passed in unchanged. */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
      <Inbox className="size-5 opacity-60" aria-hidden />
      <p>{message}</p>
    </div>
  );
}
```

Create `components/layout/Skeleton.tsx`:
```tsx
import { cn } from "@/lib/utils";

/** Pulsing placeholder block; `label` is announced to screen readers. */
export function Skeleton({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("animate-pulse rounded-lg bg-muted", className)}
    />
  );
}
```

- [ ] **Step 2: Move base table styles into the primitive**

In `components/ui/table.tsx`, replace the four functions `TableHeader`, `TableRow`, `TableHead`, `TableCell` with:
```tsx
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "sticky top-0 z-10 bg-card shadow-[0_1px_0_0_var(--border)] [&_tr]:border-b-0 [&_tr]:hover:bg-transparent",
        className
      )}
      {...props}
    />
  )
}
```
```tsx
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/60 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-brand-subtle data-[state=selected]:[&>td:first-child]:shadow-[inset_2px_0_0_0_var(--brand)]",
        className
      )}
      {...props}
    />
  )
}
```
```tsx
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-3 text-left align-middle text-xs font-medium tracking-wide whitespace-nowrap text-muted-foreground uppercase [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}
```
```tsx
function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 3: Create `SortIcon` and `DataTable`**

Create `components/table/SortIcon.tsx`:
```tsx
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import type { SortDirection } from "@tanstack/react-table";

/** Column sort state: up / down when active, a muted double chevron when not. */
export function SortIcon({ direction }: { direction: false | SortDirection }) {
  if (direction === "asc") return <ChevronUp className="size-3.5 text-foreground" aria-hidden />;
  if (direction === "desc") return <ChevronDown className="size-3.5 text-foreground" aria-hidden />;
  return <ChevronsUpDown className="size-3.5 opacity-40" aria-hidden />;
}
```

Create `components/table/DataTable.tsx`:
```tsx
"use client";

import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortIcon } from "@/components/table/SortIcon";
import { cn } from "@/lib/utils";

type Props<T> = {
  table: TanstackTable<T>;
  /** Literal Tailwind class for the scroll area, e.g. "max-h-[480px]" (literal so Tailwind sees it). */
  maxHeightClass: string;
  /** Cross-filter click. Omit for read-only tables. */
  onRowClick?: (row: T) => void;
  /** Highlights the row(s) matching the current cross-filter. */
  isRowSelected?: (row: T) => boolean;
};

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const;

function isNumeric(meta: unknown): boolean {
  return (meta as { numeric?: boolean } | undefined)?.numeric === true;
}

/** Sticky-header, sortable body shared by every dashboard table. Columns and sorting stay with the caller. */
export function DataTable<T>({ table, maxHeightClass, onRowClick, isRowSelected }: Props<T>) {
  return (
    <Table containerClassName={maxHeightClass}>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id}>
            {hg.headers.map((h) => {
              const numeric = isNumeric(h.column.columnDef.meta);
              const dir = h.column.getIsSorted();
              return (
                <TableHead
                  key={h.id}
                  aria-sort={dir ? ARIA_SORT[dir] : "none"}
                  className={cn(numeric && "text-right")}
                >
                  <button
                    type="button"
                    onClick={h.column.getToggleSortingHandler()}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-sm uppercase tracking-wide transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      numeric && "flex-row-reverse",
                      dir && "text-foreground"
                    )}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    <SortIcon direction={dir} />
                  </button>
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            data-state={isRowSelected?.(row.original) ? "selected" : undefined}
            onClick={onRowClick ? () => onRowClick(row.original) : undefined}
            className={cn(onRowClick && "cursor-pointer")}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                className={cn(isNumeric(cell.column.columnDef.meta) && "text-right tabular-nums")}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 4: Migrate `components/kpi/BuyerSummaryTable.tsx`**

Replace everything from the first `import` down to (and including) `import type { InventoryRow } from "@/lib/types";` with:
```tsx
import { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { DataTable } from "@/components/table/DataTable";
import { aggregateByBuyer, type BuyerAggregate } from "@/lib/aggregations";
import { useFilterState } from "@/hooks/useFilterState";
import { formatStockoutPct } from "@/lib/format";
import type { InventoryRow } from "@/lib/types";
```
(keep `"use client";` as line 1). Replace the component's `return ( … );` with:
```tsx
  return (
    <DashboardCard title="Buyer Summary">
      {data.length === 0 ? (
        <EmptyState message="No data matches the current filters." />
      ) : (
        <DataTable
          table={table}
          maxHeightClass="max-h-[480px]"
          onRowClick={(r) => toggleBuyer(r.buyer)}
          isRowSelected={(r) => filters.buyerSelection === r.buyer}
        />
      )}
    </DashboardCard>
  );
```

- [ ] **Step 5: Migrate `components/kpi/BuyerBuyLineTable.tsx`**

Imports (after `"use client";`):
```tsx
import { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { DataTable } from "@/components/table/DataTable";
import {
  aggregateByBuyerBuyLine,
  type BuyerBuyLineAggregate,
} from "@/lib/aggregations";
import { useFilterState } from "@/hooks/useFilterState";
import { formatDaysOut, formatStockoutPct } from "@/lib/format";
import type { InventoryRow } from "@/lib/types";
```
Keep `handleRowClick` as is. Replace the `return ( … );` with:
```tsx
  return (
    <DashboardCard title="Buyer × Buy Line">
      {data.length === 0 ? (
        <EmptyState message="No data matches the current filters." />
      ) : (
        <DataTable
          table={table}
          maxHeightClass="max-h-[480px]"
          onRowClick={handleRowClick}
          isRowSelected={(r) =>
            filters.buyerSelection === r.buyer && filters.buyLineSelection === r.buy_line
          }
        />
      )}
    </DashboardCard>
  );
```

- [ ] **Step 6: Migrate `components/kpi/PurchaseDaysOutTable.tsx`**

Imports:
```tsx
import { useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { DataTable } from "@/components/table/DataTable";
import { formatDaysOut, formatInteger } from "@/lib/format";
import type { InventoryRow } from "@/lib/types";
```
Return:
```tsx
  return (
    <DashboardCard title="Purchase Days Out">
      {rows.length === 0 ? (
        <EmptyState message="No data matches the current filters." />
      ) : (
        <DataTable table={table} maxHeightClass="max-h-[640px]" />
      )}
    </DashboardCard>
  );
```

- [ ] **Step 7: Migrate `components/gmroi/GmroiByBranchTable.tsx`**

Imports:
```tsx
import { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { DataTable } from "@/components/table/DataTable";
import { aggregateGmroiByBranch, type GmroiByBranch } from "@/lib/gmroi-aggregations";
import { formatDecimal, formatDollars } from "@/lib/format";
import type { GmroiRow } from "@/lib/gmroi-types";
```
Return:
```tsx
  return (
    <DashboardCard
      title="GMROI by Branch"
      description={'Excludes the "All Branches" rollup row.'}
    >
      {data.length === 0 ? (
        <EmptyState message="No data." />
      ) : (
        <DataTable table={table} maxHeightClass="max-h-[480px]" />
      )}
    </DashboardCard>
  );
```

- [ ] **Step 8: Migrate `components/gmroi/GmroiByBuyerTable.tsx`**

Imports:
```tsx
import { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { Skeleton } from "@/components/layout/Skeleton";
import { DataTable } from "@/components/table/DataTable";
import { aggregateGmroiByBuyer, type GmroiByBuyer } from "@/lib/gmroi-aggregations";
import { formatDecimal, formatDollars, formatInteger } from "@/lib/format";
import { useGmroiFilterState } from "@/hooks/useGmroiFilterState";
import type { GmroiRow } from "@/lib/gmroi-types";
```
Return:
```tsx
  return (
    <DashboardCard
      title="GMROI by Buyer"
      description="Buyer from the monthly buyer-assignment report (most-common buyer per buy_line)."
    >
      {!buyerByBuyLine ? (
        <Skeleton className="h-[240px]" label="Loading buyer mapping…" />
      ) : data.length === 0 ? (
        <EmptyState message="No data." />
      ) : (
        <DataTable
          table={table}
          maxHeightClass="max-h-[480px]"
          onRowClick={(r) => toggleBuyer(r.buyer)}
          isRowSelected={(r) => filters.buyerSelection === r.buyer}
        />
      )}
    </DashboardCard>
  );
```

- [ ] **Step 9: Migrate `components/gmroi/GmroiByBuyLineTable.tsx`**

Imports:
```tsx
import { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { Skeleton } from "@/components/layout/Skeleton";
import { DataTable } from "@/components/table/DataTable";
import { aggregateGmroiByBuyLine, type GmroiByBuyLine } from "@/lib/gmroi-aggregations";
import { formatDecimal, formatDollars } from "@/lib/format";
import { useGmroiFilterState } from "@/hooks/useGmroiFilterState";
import type { GmroiRow } from "@/lib/gmroi-types";
```
Return:
```tsx
  return (
    <DashboardCard
      title={
        <>
          GMROI by Buy Line
          {filters.buyerSelection && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              — filtered to {filters.buyerSelection}
            </span>
          )}
        </>
      }
    >
      {!buyerByBuyLine ? (
        <Skeleton className="h-[240px]" label="Loading buyer mapping…" />
      ) : data.length === 0 ? (
        <EmptyState message="No data." />
      ) : (
        <DataTable table={table} maxHeightClass="max-h-[560px]" />
      )}
    </DashboardCard>
  );
```

- [ ] **Step 10: Migrate `components/freight/FreightByVendorTable.tsx`**

Imports:
```tsx
import { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { DataTable } from "@/components/table/DataTable";
import {
  aggregateFreightByVendor,
  type FreightByVendor,
} from "@/lib/inbound-freight-aggregations";
import { formatDollars, formatInteger } from "@/lib/format";
import { useFreightFilterState } from "@/hooks/useFreightFilterState";
import type { InboundFreightRow } from "@/lib/inbound-freight-types";
```
Return:
```tsx
  return (
    <DashboardCard
      title="By Vendor"
      description="Sort by any column. Default: highest freight $ first."
    >
      {data.length === 0 ? (
        <EmptyState message="No data." />
      ) : (
        <DataTable
          table={table}
          maxHeightClass="max-h-[560px]"
          onRowClick={(r) => toggleVendor(r.vendor_name)}
          isRowSelected={(r) => filters.vendorSelection === r.vendor_name}
        />
      )}
    </DashboardCard>
  );
```

- [ ] **Step 11: Migrate `components/freight/FreightByWriterTable.tsx`**

Imports:
```tsx
import { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { DataTable } from "@/components/table/DataTable";
import {
  aggregateFreightByWriter,
  type FreightByWriter,
} from "@/lib/inbound-freight-aggregations";
import { formatDollars, formatInteger } from "@/lib/format";
import { useFreightFilterState } from "@/hooks/useFreightFilterState";
import type { InboundFreightRow } from "@/lib/inbound-freight-types";
```
Return:
```tsx
  return (
    <DashboardCard title="By Writer">
      {data.length === 0 ? (
        <EmptyState message="No data." />
      ) : (
        <DataTable
          table={table}
          maxHeightClass="max-h-[480px]"
          onRowClick={(r) => toggleWriter(r.writer)}
          isRowSelected={(r) => filters.writerSelection === r.writer}
        />
      )}
    </DashboardCard>
  );
```

- [ ] **Step 12: Migrate `components/freight/HighInboundTable.tsx`**

Imports:
```tsx
import { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { DataTable } from "@/components/table/DataTable";
import { formatDollars } from "@/lib/format";
import { useFreightFilterState } from "@/hooks/useFreightFilterState";
import type { InboundFreightRow } from "@/lib/inbound-freight-types";
```
Return:
```tsx
  return (
    <DashboardCard
      title={
        vendorFocused
          ? `POs with freight — ${filters.vendorSelection}`
          : `High Inbound % Orders (≥ ${THRESHOLD}%)`
      }
      description={
        vendorFocused
          ? "All line items from the selected vendor that incurred freight cost."
          : `Line items where freight is at least ${THRESHOLD}% of the order — worth reviewing for cost.`
      }
    >
      {data.length === 0 ? (
        <EmptyState
          message={
            vendorFocused
              ? "No freight-bearing POs for this vendor in the current view."
              : `No orders cross the ${THRESHOLD}% threshold.`
          }
        />
      ) : (
        <DataTable table={table} maxHeightClass="max-h-[480px]" />
      )}
    </DashboardCard>
  );
```

- [ ] **Step 13: Migrate `components/line-counts/LineCountsPivotTable.tsx` (and its anomaly flag)**

Imports:
```tsx
import { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { TriangleAlert } from "lucide-react";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { DataTable } from "@/components/table/DataTable";
import {
  aggregateLineCountsByWriter,
  type LineCountByWriter,
} from "@/lib/line-counts-aggregations";
import { formatInteger } from "@/lib/format";
import { ANOMALY_THRESHOLD, type LineCountRow } from "@/lib/line-counts-types";
```
Replace the `flagCell` constant (keep its comment) with:
```tsx
const flagCell = (value: unknown) => {
  const n = value as number;
  const flagged = typeof n === "number" && n > ANOMALY_THRESHOLD;
  return (
    <span
      className={`${numericClass} inline-flex items-center justify-end gap-1 ${flagged ? "font-semibold text-foreground" : ""}`}
      title={flagged ? "Unusually high value — please verify with Todd before reporting" : undefined}
    >
      {flagged && (
        <TriangleAlert className="size-3.5 text-status-warning" role="img" aria-label="Needs verification" />
      )}
      {formatInteger(n)}
    </span>
  );
};
```
Return:
```tsx
  return (
    <DashboardCard title="Lines by Writer">
      {data.length === 0 ? (
        <EmptyState message="No data." />
      ) : (
        <DataTable table={table} maxHeightClass="max-h-[480px]" />
      )}
    </DashboardCard>
  );
```

- [ ] **Step 14: Run the checks**

Run:
```bash
npx tsc --noEmit
bash scripts/_visual/lint-check.sh
grep -rn "↑\|↓\|border-sky-200" components/kpi/BuyerSummaryTable.tsx components/kpi/BuyerBuyLineTable.tsx components/kpi/PurchaseDaysOutTable.tsx components/gmroi/*Table.tsx components/freight/*Table.tsx components/line-counts/LineCountsPivotTable.tsx
bash scripts/_visual/capture.sh after-task4
bash scripts/_visual/compare.sh after-task4
```
Expected: tsc silent; `NO NEW LINT PROBLEMS` (the 10 `react-hooks/incompatible-library` warnings on `useReactTable` are baseline); grep prints nothing; `NUMBERS MATCH`. In the browser: click a buyer row on `/` — the row gets the light-blue tint with a blue left bar and the page cross-filters as before; click a column header — chevron flips and order changes; Tab onto a header — a focus ring shows.

- [ ] **Step 15: Commit**

```bash
git add components/layout/DashboardCard.tsx components/layout/EmptyState.tsx components/layout/Skeleton.tsx components/table/SortIcon.tsx components/table/DataTable.tsx components/ui/table.tsx components/kpi/BuyerSummaryTable.tsx components/kpi/BuyerBuyLineTable.tsx components/kpi/PurchaseDaysOutTable.tsx components/gmroi/GmroiByBranchTable.tsx components/gmroi/GmroiByBuyerTable.tsx components/gmroi/GmroiByBuyLineTable.tsx components/freight/FreightByVendorTable.tsx components/freight/FreightByWriterTable.tsx components/freight/HighInboundTable.tsx components/line-counts/LineCountsPivotTable.tsx
git commit -F - <<'EOF'
style: shared card and DataTable for all ten tables

One sticky-header table body replaces ten copies; sort chevrons, brand
selected-row tint, keyboard-focusable headers. Columns and sorting unchanged.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 5: Chart tooltip — migrate the 7 charts

**Files:**
- Create: `components/charts/ChartTooltip.tsx`
- Modify: `components/kpi/DaysOutByBuyerChart.tsx`, `components/kpi/InventoryTrendChart.tsx`, `components/gmroi/GmroiTrendChart.tsx`, `components/freight/FreightTrendChart.tsx`, `components/freight/FreightPctByWriterChart.tsx`, `components/line-counts/LineCountsByWriterChart.tsx`, `components/line-counts/LineCountsTrendChart.tsx`

**Interfaces:**
- Consumes: `DashboardCard`, `EmptyState`, `Skeleton` (Task 4); everything in `@/lib/chart-theme` and `formatCompact` (Task 3); `formatInteger`, `formatMonthLabel` from `@/lib/format`; `LINE_TYPES` from `@/lib/line-counts-types`.
- Produces: `ChartTooltip({ active?: boolean; payload?: ReadonlyArray<{ name?: unknown; dataKey?: unknown; value?: unknown; color?: string }>; label?: unknown; formatValue?: (value: number, name: string) => string; formatLabel?: (label: unknown) => string; seriesName?: (name: string) => string })` and `renderLegendLabel(value: string)` from `@/components/charts/ChartTooltip`.

Every chart keeps its data `useMemo`, height, margins and value formatting exactly as today.

- [ ] **Step 1: Create the shared tooltip**

Create `components/charts/ChartTooltip.tsx`:
```tsx
"use client";

type TooltipEntry = {
  name?: unknown;
  dataKey?: unknown;
  value?: unknown;
  color?: string;
};

type Props = {
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
  label?: unknown;
  /** Formats each value exactly as the chart did before, e.g. (v) => `${v}%`. */
  formatValue?: (value: number, name: string) => string;
  /** Formats the category / x label, e.g. formatMonthLabel. */
  formatLabel?: (label: unknown) => string;
  /** Display name for a series; defaults to its name / dataKey. */
  seriesName?: (name: string) => string;
};

/**
 * Shared Recharts tooltip body: white card, hairline ring, ink text, a colour swatch per
 * series (text never wears the series colour). Use as
 * <Tooltip content={({ active, payload, label }) => <ChartTooltip active={active} payload={payload} label={label} />} />
 */
export function ChartTooltip({ active, payload, label, formatValue, formatLabel, seriesName }: Props) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="min-w-36 rounded-lg bg-card px-3 py-2 text-xs shadow-sm ring-1 ring-foreground/10">
      {label != null && label !== "" && (
        <p className="mb-1 font-medium text-foreground">
          {formatLabel ? formatLabel(label) : String(label)}
        </p>
      )}
      <ul className="flex flex-col gap-1">
        {payload.map((entry) => {
          const name = String(entry.name ?? entry.dataKey ?? "");
          const value = typeof entry.value === "number" ? entry.value : Number(entry.value);
          return (
            <li key={name} className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              <span className="text-muted-foreground">{seriesName ? seriesName(name) : name}</span>
              <span className="ml-auto pl-3 font-medium text-foreground tabular-nums">
                {formatValue ? formatValue(value, name) : value.toLocaleString()}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Legend label in ink; the legend icon beside it carries the series colour. */
export function renderLegendLabel(value: string) {
  return <span className="text-foreground">{value}</span>;
}
```

- [ ] **Step 2: Migrate `components/kpi/DaysOutByBuyerChart.tsx`**

Replace the whole file with:
```tsx
"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { aggregateByBuyer } from "@/lib/aggregations";
import { axisProps, BAR_CURSOR, barProps, gridProps, SERIES } from "@/lib/chart-theme";
import { useFilterState } from "@/hooks/useFilterState";
import type { InventoryRow } from "@/lib/types";

export function DaysOutByBuyerChart({ rows }: { rows: InventoryRow[] }) {
  const { filters, toggleBuyer } = useFilterState();

  const data = useMemo(() => {
    return aggregateByBuyer(rows)
      .map((b) => ({
        buyer: b.buyer,
        avg_pct: Math.round(b.avg_stockout_pct * 100),
      }))
      .sort((a, b) => b.avg_pct - a.avg_pct);
  }, [rows]);

  return (
    <DashboardCard title="Days Out by Buyer (avg stockout %)">
      {data.length === 0 ? (
        <EmptyState message="No data matches the current filters." />
      ) : (
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 48 }}>
              <CartesianGrid {...gridProps} />
              <XAxis {...axisProps} dataKey="buyer" angle={-40} textAnchor="end" height={60} />
              <YAxis {...axisProps} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
              <Tooltip
                cursor={BAR_CURSOR}
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    label={label}
                    formatValue={(v) => `${v}%`}
                    seriesName={() => "Avg stockout"}
                  />
                )}
              />
              <Bar
                {...barProps}
                dataKey="avg_pct"
                fill={SERIES[0]}
                cursor="pointer"
                onClick={(payload: unknown) => {
                  const buyer = (payload as { buyer?: unknown } | null)?.buyer;
                  if (typeof buyer === "string") toggleBuyer(buyer);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {filters.buyerSelection && (
        <p className="mt-2 text-xs text-muted-foreground">
          Selected: <strong className="text-foreground">{filters.buyerSelection}</strong> (click bar
          again to clear)
        </p>
      )}
    </DashboardCard>
  );
}
```

- [ ] **Step 3: Migrate `components/kpi/InventoryTrendChart.tsx`**

Replace the whole file with:
```tsx
"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { Skeleton } from "@/components/layout/Skeleton";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { useInventoryTrend } from "@/hooks/useInventoryTrend";
import { useFilterState } from "@/hooks/useFilterState";
import { axisProps, gridProps, LINE_CURSOR, lineProps, SERIES } from "@/lib/chart-theme";
import { formatMonthLabel } from "@/lib/format";

export function InventoryTrendChart() {
  const { filters } = useFilterState();
  const buyer = filters.buyerSelection;
  const { data, loading, error } = useInventoryTrend(buyer);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((p) => ({
      report_date: p.report_date,
      stockout_pct: p.avg_stockout_pct == null ? null : p.avg_stockout_pct * 100,
    }));
  }, [data]);

  const body = (() => {
    if (loading) {
      return <Skeleton className="h-[280px] w-full" label="Loading trend…" />;
    }
    if (error || chartData.length < 2) {
      return (
        <EmptyState
          message={
            buyer
              ? `No trend yet for ${buyer} — need at least two snapshots.`
              : "Trend will appear after the next snapshot lands."
          }
        />
      );
    }
    return (
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid {...gridProps} />
            <XAxis {...axisProps} dataKey="report_date" tickFormatter={formatMonthLabel} />
            <YAxis {...axisProps} tickFormatter={(v: number) => `${Math.round(v)}%`} />
            <Tooltip
              cursor={LINE_CURSOR}
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  label={label}
                  formatLabel={formatMonthLabel}
                  formatValue={(v) => `${v.toFixed(1)}%`}
                  seriesName={() => "Avg stockout"}
                />
              )}
            />
            <Line type="monotone" dataKey="stockout_pct" {...lineProps(SERIES[0])} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  })();

  return (
    <DashboardCard
      title={buyer ? `Trend — ${buyer}` : "Trend — Company stockout, all snapshots"}
      description={
        buyer
          ? `Avg stockout % per snapshot for ${buyer}. Click ${buyer} again or "Clear all" to reset to company-wide.`
          : "Company-wide avg stockout % per snapshot. Click any buyer below to drill in."
      }
    >
      {body}
    </DashboardCard>
  );
}
```

- [ ] **Step 4: Migrate `components/gmroi/GmroiTrendChart.tsx`**

Replace the whole file with:
```tsx
"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { Skeleton } from "@/components/layout/Skeleton";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { useGmroiTrend } from "@/hooks/useGmroiTrend";
import { axisProps, gridProps, LINE_CURSOR, lineProps, SERIES } from "@/lib/chart-theme";
import { formatMonthLabel } from "@/lib/format";

export function GmroiTrendChart() {
  const { data, loading, error } = useGmroiTrend();

  const body = (() => {
    if (loading) {
      return <Skeleton className="h-[280px] w-full" label="Loading trend…" />;
    }
    // Treat any fetch failure (e.g. view not yet created) the same as "no data yet".
    if (error || !data || data.length < 2) {
      return <EmptyState message="Trend will appear after the next upload lands." />;
    }
    return (
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid {...gridProps} />
            <XAxis {...axisProps} dataKey="report_date" tickFormatter={formatMonthLabel} />
            <YAxis {...axisProps} tickFormatter={(v: number) => v.toFixed(2)} />
            <Tooltip
              cursor={LINE_CURSOR}
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  label={label}
                  formatLabel={formatMonthLabel}
                  formatValue={(v) => v.toFixed(3)}
                  seriesName={() => "GMROI"}
                />
              )}
            />
            <Line type="monotone" dataKey="gmroi" {...lineProps(SERIES[0])} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  })();

  return (
    <DashboardCard
      title="Trend — Company GMROI by upload"
      description={'Company-wide "Grand Totals / All Branches" GMROI per snapshot, oldest → newest.'}
    >
      {body}
    </DashboardCard>
  );
}
```

- [ ] **Step 5: Migrate `components/freight/FreightTrendChart.tsx`**

Replace the whole file with:
```tsx
"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { Skeleton } from "@/components/layout/Skeleton";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { useFreightTrend } from "@/hooks/useFreightTrend";
import { axisProps, gridProps, LINE_CURSOR, lineProps, SERIES } from "@/lib/chart-theme";
import { formatMonthLabel } from "@/lib/format";

export function FreightTrendChart() {
  const { data, loading, error } = useFreightTrend();

  const body = (() => {
    if (loading) {
      return <Skeleton className="h-[280px] w-full" label="Loading trend…" />;
    }
    // Treat any fetch failure (e.g. view not yet created) the same as "no data yet".
    if (error || !data || data.length < 2) {
      return <EmptyState message="Trend will appear after the next upload lands." />;
    }
    return (
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid {...gridProps} />
            <XAxis {...axisProps} dataKey="report_date" tickFormatter={formatMonthLabel} />
            <YAxis {...axisProps} tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
            <Tooltip
              cursor={LINE_CURSOR}
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  label={label}
                  formatLabel={formatMonthLabel}
                  formatValue={(v) => `${v.toFixed(2)}%`}
                  seriesName={() => "Freight % of Order"}
                />
              )}
            />
            <Line type="monotone" dataKey="freight_pct" {...lineProps(SERIES[0])} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  })();

  return (
    <DashboardCard
      title="Trend — Freight % of Order, all uploads"
      description="Weighted: SUM(freight $) / SUM(order $) per snapshot, company-wide. Not filtered by writer/vendor selection."
    >
      {body}
    </DashboardCard>
  );
}
```

- [ ] **Step 6: Migrate `components/freight/FreightPctByWriterChart.tsx`**

Replace the whole file with:
```tsx
"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { aggregateFreightByWriter } from "@/lib/inbound-freight-aggregations";
import {
  axisProps,
  BAR_CURSOR,
  barProps,
  DIMMED_BAR,
  gridProps,
  SERIES,
} from "@/lib/chart-theme";
import { useFreightFilterState } from "@/hooks/useFreightFilterState";
import type { InboundFreightRow } from "@/lib/inbound-freight-types";

export function FreightPctByWriterChart({ rows }: { rows: InboundFreightRow[] }) {
  const { filters, toggleWriter } = useFreightFilterState();
  const selected = filters.writerSelection;
  const data = useMemo(() => {
    return aggregateFreightByWriter(rows)
      .map((b) => ({
        writer: b.writer,
        freight_pct: b.freight_pct_of_order ?? 0,
      }))
      .filter((d) => d.freight_pct > 0)
      .sort((a, b) => b.freight_pct - a.freight_pct);
  }, [rows]);

  return (
    <DashboardCard
      title="Freight % of Order — by Writer"
      description="Weighted: total freight $ / total order $. Sorted descending."
    >
      {data.length === 0 ? (
        <EmptyState message="No writers with non-zero freight ratio." />
      ) : (
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid {...gridProps} />
              <XAxis {...axisProps} dataKey="writer" angle={-30} textAnchor="end" height={60} />
              <YAxis {...axisProps} tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
              <Tooltip
                cursor={BAR_CURSOR}
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    label={label}
                    formatValue={(v) => `${v.toFixed(2)}%`}
                    seriesName={() => "Freight % of Order"}
                  />
                )}
              />
              <Bar {...barProps} dataKey="freight_pct" fill={SERIES[0]} cursor="pointer">
                {data.map((entry) => (
                  <Cell
                    key={entry.writer}
                    fill={selected === null || selected === entry.writer ? SERIES[0] : DIMMED_BAR}
                    onClick={() => toggleWriter(entry.writer)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
}
```

- [ ] **Step 7: Migrate `components/line-counts/LineCountsByWriterChart.tsx`**

Replace the whole file with:
```tsx
"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { ChartTooltip, renderLegendLabel } from "@/components/charts/ChartTooltip";
import { aggregateLineCountsByWriter } from "@/lib/line-counts-aggregations";
import {
  axisProps,
  BAR_CURSOR,
  gridProps,
  legendProps,
  LINE_TYPE_COLORS,
  stackedBarProps,
} from "@/lib/chart-theme";
import { formatCompact, formatInteger } from "@/lib/format";
import { LINE_TYPES, type LineCountRow } from "@/lib/line-counts-types";

export function LineCountsByWriterChart({ rows }: { rows: LineCountRow[] }) {
  const data = useMemo(() => aggregateLineCountsByWriter(rows), [rows]);

  return (
    <DashboardCard
      title="Lines by Writer"
      description="Stacked by line type. Sorted descending by total."
    >
      {data.length === 0 ? (
        <EmptyState message="No data." />
      ) : (
        <div style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid {...gridProps} />
              <XAxis {...axisProps} dataKey="writer" angle={-30} textAnchor="end" height={60} />
              <YAxis {...axisProps} tickFormatter={formatCompact} />
              <Tooltip
                cursor={BAR_CURSOR}
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    label={label}
                    formatValue={(v) => formatInteger(v)}
                  />
                )}
              />
              <Legend {...legendProps} formatter={renderLegendLabel} />
              {LINE_TYPES.map((type) => (
                <Bar
                  key={type}
                  {...stackedBarProps}
                  dataKey={type}
                  stackId="lines"
                  fill={LINE_TYPE_COLORS[type]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
}
```

- [ ] **Step 8: Migrate `components/line-counts/LineCountsTrendChart.tsx`**

Replace the imports and the `COLORS` constant (everything above `type TrendPoint`) with:
```tsx
"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { ChartTooltip, renderLegendLabel } from "@/components/charts/ChartTooltip";
import { LINE_TYPES, type LineCountRow } from "@/lib/line-counts-types";
import {
  axisProps,
  gridProps,
  legendProps,
  LINE_CURSOR,
  LINE_TYPE_COLORS,
  stackedAreaProps,
} from "@/lib/chart-theme";
import { formatCompact, formatInteger, formatMonthLabel } from "@/lib/format";
import { monthNameToNumber } from "@/lib/trend";
```
Keep `type TrendPoint` and the `data` `useMemo` unchanged. Replace the `return ( … );` with:
```tsx
  return (
    <DashboardCard
      title="Trend — Lines by Type, all uploads"
      description="Stacked totals per upload, company-wide (not filtered by the picker above)."
    >
      {data.length < 2 ? (
        <EmptyState message="Trend will appear after the next upload lands." />
      ) : (
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid {...gridProps} />
              <XAxis {...axisProps} dataKey="report_date" tickFormatter={formatMonthLabel} />
              <YAxis {...axisProps} tickFormatter={formatCompact} />
              <Tooltip
                cursor={LINE_CURSOR}
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    label={label}
                    formatLabel={formatMonthLabel}
                    formatValue={(v) => formatInteger(v)}
                  />
                )}
              />
              <Legend {...legendProps} formatter={renderLegendLabel} />
              {LINE_TYPES.map((type) => (
                <Area
                  key={type}
                  type="monotone"
                  dataKey={type}
                  stackId="1"
                  {...stackedAreaProps(LINE_TYPE_COLORS[type])}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
```

- [ ] **Step 9: Run the checks**

Run:
```bash
npx tsc --noEmit
bash scripts/_visual/lint-check.sh
grep -rn '#1d4ed8\|#0f172a\|#4f46e5\|#7c3aed\|#0891b2\|#0ea5e9\|#10b981\|#f59e0b\|#94a3b8' components/kpi components/gmroi components/freight components/line-counts
bash scripts/_visual/capture.sh after-task5
bash scripts/_visual/compare.sh after-task5
```
Expected: tsc silent; `NO NEW LINT PROBLEMS` and the total is now **17** (the two `react/no-unescaped-entities` errors in `GmroiTrendChart.tsx` are gone); grep prints nothing; `NUMBERS MATCH`. In the browser: hover a bar and a trend point — the white tooltip shows a coloured dot, ink text and the same value format as before; on `/line-counts` both charts show PO blue, SO orange, DIR green, TR yellow with ink legend labels and y-ticks like `150K`.

- [ ] **Step 10: Commit**

```bash
git add components/charts/ChartTooltip.tsx components/kpi/DaysOutByBuyerChart.tsx components/kpi/InventoryTrendChart.tsx components/gmroi/GmroiTrendChart.tsx components/freight/FreightTrendChart.tsx components/freight/FreightPctByWriterChart.tsx components/line-counts/LineCountsByWriterChart.tsx components/line-counts/LineCountsTrendChart.tsx
git commit -F - <<'EOF'
style: chart theme and shared tooltip across all seven charts

Brand blue for single series; PO/SO/DIR/TR fixed to the validated palette;
thin bars, hairline grid, ink legends; compact Line Counts y-ticks.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 6: Stat tiles

**Files:**
- Create: `components/layout/StatTile.tsx`
- Modify: `components/gmroi/GmroiOverviewCards.tsx`, `components/freight/FreightOverviewCards.tsx`, `components/line-counts/LineCountScorecards.tsx`

**Interfaces:**
- Produces: `StatTile({ label: string; value: ReactNode; sublabel?: ReactNode })` from `@/components/layout/StatTile`.

- [ ] **Step 1: Create `StatTile`**

Create `components/layout/StatTile.tsx`:
```tsx
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type Props = { label: string; value: ReactNode; sublabel?: ReactNode };

/** Headline number. Proportional figures on purpose: tabular-nums makes big numbers look loose. */
export function StatTile({ label, value, sublabel }: Props) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Migrate `components/gmroi/GmroiOverviewCards.tsx`**

Replace line 3 (`import { Card, … } from "@/components/ui/card";`) with:
```tsx
import { StatTile } from "@/components/layout/StatTile";
```
Replace the `return ( … );` with:
```tsx
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatTile key={card.label} label={card.label} value={card.value} />
      ))}
    </div>
  );
```

- [ ] **Step 3: Migrate `components/freight/FreightOverviewCards.tsx`**

Replace line 3 with:
```tsx
import { StatTile } from "@/components/layout/StatTile";
```
Replace the `return ( … );` with:
```tsx
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <StatTile key={card.label} label={card.label} value={card.value} sublabel={card.sub} />
      ))}
    </div>
  );
```

- [ ] **Step 4: Migrate `components/line-counts/LineCountScorecards.tsx`**

Replace line 3 with:
```tsx
import { StatTile } from "@/components/layout/StatTile";
```
Replace the `return ( … );` with:
```tsx
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatTile key={card.label} label={card.label} value={card.value} sublabel={card.sub} />
      ))}
    </div>
  );
```

- [ ] **Step 5: Run the checks**

Run:
```bash
npx tsc --noEmit
bash scripts/_visual/lint-check.sh
bash scripts/_visual/capture.sh after-task6
bash scripts/_visual/compare.sh after-task6
```
Expected: tsc silent; `NO NEW LINT PROBLEMS`; `NUMBERS MATCH`. Tiles on `/gmroi`, `/freight`, `/line-counts` show sentence-case labels (no longer uppercased) above a larger value.

- [ ] **Step 6: Commit**

```bash
git add components/layout/StatTile.tsx components/gmroi/GmroiOverviewCards.tsx components/freight/FreightOverviewCards.tsx components/line-counts/LineCountScorecards.tsx
git commit -F - <<'EOF'
style: shared StatTile for the overview scorecards

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 7: Navigation and filter controls

**Files:**
- Create: `components/filters/FilterChip.tsx`
- Modify: `components/Navigation.tsx`, `components/filters/ActiveFiltersBar.tsx`, `components/filters/BranchFilter.tsx`, `components/filters/DateRangeFilter.tsx`, `components/line-counts/UploadPicker.tsx`

**Interfaces:**
- Consumes: `DashboardCard` (Task 4); `Button`, `buttonVariants` from `@/components/ui/button`.
- Produces: `FilterChip({ label: string; onRemove: () => void })` and `ClearFiltersButton({ onClick: () => void; className?: string })` from `@/components/filters/FilterChip`.

- [ ] **Step 1: Create `FilterChip` and `ClearFiltersButton`**

Create `components/filters/FilterChip.tsx`:
```tsx
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** One active cross-filter; clicking it removes that filter. */
export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      title={`Remove ${label}`}
      className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-3 py-1 text-xs font-medium text-primary transition-shadow hover:ring-1 hover:ring-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span>{label}</span>
      <X className="size-3" aria-hidden />
    </button>
  );
}

export function ClearFiltersButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-sm text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      Clear all
    </button>
  );
}
```

- [ ] **Step 2: Restyle `components/Navigation.tsx`**

Replace the whole file with:
```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Days Out" },
  { href: "/gmroi", label: "Turns" },
  { href: "/line-counts", label: "Line Counts" },
  { href: "/freight", label: "Inbound Freight" },
];

const focusRing =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-border bg-card">
      <div className="flex h-16 items-center gap-10 px-8">
        <Link href="/" aria-label="Home" className={focusRing}>
          <Image
            src="/PSLogo-dark.svg"
            alt="Plumbing Supply"
            width={220}
            height={40}
            priority
          />
        </Link>
        <div className="flex h-full items-stretch gap-6">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center text-sm font-medium transition-colors",
                  focusRing,
                  active
                    ? "text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Restyle `components/filters/ActiveFiltersBar.tsx`**

Replace line 3 (`import { Button } from "@/components/ui/button";`) with:
```tsx
import { ClearFiltersButton, FilterChip } from "@/components/filters/FilterChip";
```
Replace the `return ( … );` at the end with:
```tsx
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Active filters:
      </span>
      {chips.map((chip) => (
        <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
      ))}
      <ClearFiltersButton onClick={clearAll} className="ml-1" />
    </div>
  );
```

- [ ] **Step 4: Restyle `components/filters/BranchFilter.tsx`**

Add after line 3 (`import { useState } from "react";`):
```tsx
import { ChevronDown } from "lucide-react";
```
Replace the `<PopoverTrigger …>…</PopoverTrigger>` element with:
```tsx
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "min-w-[160px] justify-between"
        )}
      >
        <span>{label}</span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </PopoverTrigger>
```

- [ ] **Step 5: Restyle `components/filters/DateRangeFilter.tsx`**

Add after the imports:
```tsx

const inputClass =
  "h-8 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
```
Replace the `return ( … );` with:
```tsx
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={dateStart}
        onChange={(e) => onChange(e.target.value, dateEnd)}
        className={inputClass}
      />
      <span className="text-sm text-muted-foreground">to</span>
      <input
        type="date"
        value={dateEnd}
        onChange={(e) => onChange(dateStart, e.target.value)}
        className={inputClass}
      />
      <div className="ml-2 flex gap-1">
        <Button variant="outline" onClick={() => preset(0)}>
          Today
        </Button>
        <Button variant="outline" onClick={() => preset(1)}>
          Yesterday
        </Button>
        <Button variant="outline" onClick={() => preset(7)}>
          Last 7
        </Button>
        <Button variant="outline" onClick={thisMonth}>
          Month
        </Button>
      </div>
    </div>
  );
```

- [ ] **Step 6: Restyle `components/line-counts/UploadPicker.tsx`**

Replace line 3 (`import { Card, … } from "@/components/ui/card";`) with:
```tsx
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/layout/DashboardCard";
import { cn } from "@/lib/utils";
```
Replace the final `return ( … );` (the one after the `availableDates.length === 0` guard) with:
```tsx
  return (
    <DashboardCard
      title="Uploads"
      description="Pick one upload, or select multiple to combine totals across reports."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={selectLatest}>
          Latest only
        </Button>
        <Button variant="outline" size="sm" onClick={selectAll}>
          Select all ({availableDates.length})
        </Button>
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        {availableDates.map((date) => {
          const selected = selectedSet.has(date);
          return (
            <button
              key={date}
              type="button"
              onClick={() => toggle(date)}
              aria-pressed={selected}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-foreground hover:bg-brand-subtle"
              )}
            >
              {date}
            </button>
          );
        })}
      </div>
    </DashboardCard>
  );
```

- [ ] **Step 7: Run the checks**

Run:
```bash
npx tsc --noEmit
bash scripts/_visual/lint-check.sh
bash scripts/_visual/capture.sh after-task7
bash scripts/_visual/compare.sh after-task7
```
Expected: tsc silent; `NO NEW LINT PROBLEMS`; `NUMBERS MATCH`. In the browser: the active nav tab is blue text with a blue underline; Tab through the nav — each link shows a focus ring; on `/` pick a branch and a buyer — chips appear light-blue with an ×, clicking one removes it, "Clear all" resets; branch trigger, date inputs and preset buttons are one height; on `/freight` the upload pills toggle as before.

- [ ] **Step 8: Commit**

```bash
git add components/filters/FilterChip.tsx components/Navigation.tsx components/filters/ActiveFiltersBar.tsx components/filters/BranchFilter.tsx components/filters/DateRangeFilter.tsx components/line-counts/UploadPicker.tsx
git commit -F - <<'EOF'
style: brand nav tabs, filter chips, and one control height

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 8: Page shells and the loading rule

**Files:**
- Create: `components/layout/PageShell.tsx`, `components/layout/LoadingState.tsx`, `components/layout/ErrorState.tsx`, `components/filters/FilterBar.tsx`
- Modify: `components/layout/EmptyState.tsx` (append `EmptyCard`)
- Modify: `app/page.tsx`, `app/gmroi/page.tsx`, `app/freight/page.tsx`, `app/line-counts/page.tsx`

**Interfaces:**
- Consumes: `pageView` (Task 3); `Skeleton`, `EmptyState` (Task 4); `FilterChip`, `ClearFiltersButton` (Task 7).
- Produces: `PageShell({ title: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode })`, `PageContent({ refreshing: boolean; children: ReactNode })` from `@/components/layout/PageShell`; `LoadingState({ tiles?: number })`; `ErrorState({ message: string })`; `EmptyCard({ message: string })` from `@/components/layout/EmptyState`; `FilterBar({ children: ReactNode; className?: string })` from `@/components/filters/FilterBar`.

- [ ] **Step 1: Create the page building blocks**

Create `components/layout/PageShell.tsx`:
```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

/** Page <main> with the standard header row: title, muted subtitle, actions on the right. */
export function PageShell({ title, subtitle, actions, children }: Props) {
  return (
    <main className="px-8 py-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </header>
      {children}
    </main>
  );
}

/** Stacks a page's sections. While a refetch runs, the previous content stays, dimmed. */
export function PageContent({ refreshing, children }: { refreshing: boolean; children: ReactNode }) {
  return (
    <div
      aria-busy={refreshing}
      className={cn("flex flex-col gap-4 transition-opacity duration-200", refreshing && "opacity-60")}
    >
      {children}
    </div>
  );
}
```

Create `components/layout/LoadingState.tsx`:
```tsx
import { Skeleton } from "@/components/layout/Skeleton";

/** First-load placeholder in the page's card shapes: optional stat-tile row, a chart, a table. */
export function LoadingState({ tiles = 0 }: { tiles?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      {tiles > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: tiles }, (_, i) => (
            <Skeleton key={i} className="h-[104px]" />
          ))}
        </div>
      )}
      <Skeleton className="h-[340px]" label="Loading chart" />
      <Skeleton className="h-[420px]" label="Loading table" />
    </div>
  );
}
```

Create `components/layout/ErrorState.tsx`:
```tsx
import { TriangleAlert } from "lucide-react";

/** Data failed to load. The message text is unchanged from the old error box. */
export function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl bg-card p-6 text-sm shadow-sm ring-1 ring-foreground/10"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-critical" aria-hidden />
      <p className="text-foreground">Error loading data: {message}</p>
    </div>
  );
}
```

Append to `components/layout/EmptyState.tsx`:
```tsx

/** Page-level empty state: the same message in a white card. */
export function EmptyCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <EmptyState message={message} />
    </div>
  );
}
```

Create `components/filters/FilterBar.tsx`:
```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** White bar holding a page's filter controls or its active-filter chips. */
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl bg-card p-3 shadow-sm ring-1 ring-foreground/10",
        className
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `app/page.tsx`**

Replace the whole file with:
```tsx
"use client";

import { useMemo } from "react";
import { FilterProvider, useFilterState } from "@/hooks/useFilterState";
import { useInventoryData } from "@/hooks/useInventoryData";
import { applyClientFilters, uniqueBranches } from "@/lib/filters";
import { pageView } from "@/lib/page-state";
import { PageContent, PageShell } from "@/components/layout/PageShell";
import { LoadingState } from "@/components/layout/LoadingState";
import { ErrorState } from "@/components/layout/ErrorState";
import { FilterBar } from "@/components/filters/FilterBar";
import { BranchFilter } from "@/components/filters/BranchFilter";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { UnassignedToggle } from "@/components/filters/UnassignedToggle";
import { ActiveFiltersBar } from "@/components/filters/ActiveFiltersBar";
import { DaysOutByBuyerChart } from "@/components/kpi/DaysOutByBuyerChart";
import { BuyerSummaryTable } from "@/components/kpi/BuyerSummaryTable";
import { BuyerBuyLineTable } from "@/components/kpi/BuyerBuyLineTable";
import { PurchaseDaysOutTable } from "@/components/kpi/PurchaseDaysOutTable";
import { InventoryTrendChart } from "@/components/kpi/InventoryTrendChart";

export default function DashboardPage() {
  return (
    <FilterProvider>
      <DashboardContents />
    </FilterProvider>
  );
}

function DashboardContents() {
  const {
    filters,
    setBranches,
    setDateRange,
    setHideUnassigned,
  } = useFilterState();

  const { data, loading, error, reportDate } = useInventoryData({
    dateStart: filters.dateStart,
    dateEnd: filters.dateEnd,
    branches: filters.branches,
  });

  const filteredRows = useMemo(
    () => (data ? applyClientFilters(data, filters) : []),
    [data, filters]
  );

  const availableBranches = useMemo(
    () => (data ? uniqueBranches(data) : []),
    [data]
  );

  // "empty" renders the sections as before: each table shows its own empty message.
  const view = pageView({ loading, error, data });

  return (
    <PageShell
      title="Inventory Dashboard"
      subtitle={
        <>
          {reportDate ? `Snapshot: ${reportDate}` : "Loading snapshot…"}
          {filters.branches.length > 0 && ` · ${filters.branches.length} branch(es)`}
          {data && ` · ${filteredRows.length.toLocaleString()} items shown`}
        </>
      }
      actions={
        <UnassignedToggle
          hideUnassigned={filters.hideUnassigned}
          onChange={setHideUnassigned}
        />
      }
    >
      <FilterBar className="mb-4">
        <BranchFilter
          available={availableBranches}
          selected={filters.branches}
          onChange={setBranches}
        />
        <DateRangeFilter
          dateStart={filters.dateStart}
          dateEnd={filters.dateEnd}
          onChange={setDateRange}
        />
      </FilterBar>

      <section className="mb-4">
        <ActiveFiltersBar />
      </section>

      {view === "error" ? (
        <ErrorState message={error ?? ""} />
      ) : view === "loading" ? (
        <LoadingState />
      ) : (
        <PageContent refreshing={view === "refreshing"}>
          <InventoryTrendChart />
          <DaysOutByBuyerChart rows={filteredRows} />
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BuyerSummaryTable rows={filteredRows} />
            <BuyerBuyLineTable rows={filteredRows} />
          </section>
          <PurchaseDaysOutTable rows={filteredRows} />
        </PageContent>
      )}
    </PageShell>
  );
}
```

- [ ] **Step 3: Rewrite `app/gmroi/page.tsx`**

Replace the whole file with:
```tsx
"use client";

import { useGmroiData } from "@/hooks/useGmroiData";
import { useBuyerByBuyLine } from "@/hooks/useBuyerByBuyLine";
import {
  GmroiFilterProvider,
  useGmroiFilterState,
} from "@/hooks/useGmroiFilterState";
import { pageView } from "@/lib/page-state";
import { PageContent, PageShell } from "@/components/layout/PageShell";
import { LoadingState } from "@/components/layout/LoadingState";
import { ErrorState } from "@/components/layout/ErrorState";
import { EmptyCard } from "@/components/layout/EmptyState";
import { FilterBar } from "@/components/filters/FilterBar";
import { ClearFiltersButton, FilterChip } from "@/components/filters/FilterChip";
import { GmroiOverviewCards } from "@/components/gmroi/GmroiOverviewCards";
import { GmroiByBranchTable } from "@/components/gmroi/GmroiByBranchTable";
import { GmroiByBuyLineTable } from "@/components/gmroi/GmroiByBuyLineTable";
import { GmroiByBuyerTable } from "@/components/gmroi/GmroiByBuyerTable";
import { GmroiTrendChart } from "@/components/gmroi/GmroiTrendChart";

export default function GmroiPage() {
  return (
    <GmroiFilterProvider>
      <GmroiContents />
    </GmroiFilterProvider>
  );
}

function GmroiContents() {
  const { data, loading, error, reportDate } = useGmroiData();
  const { map: buyerByBuyLine } = useBuyerByBuyLine();
  const { filters, toggleBuyer, clearAll } = useGmroiFilterState();
  const hasFilter = filters.buyerSelection !== null;
  const view = pageView({ loading, error, data });

  return (
    <PageShell
      title="GMROI Dashboard"
      subtitle={
        <>
          {reportDate ? `Snapshot: ${reportDate}` : "Loading…"}
          {data && ` · ${data.length.toLocaleString()} rows`}
        </>
      }
    >
      {hasFilter && (
        <FilterBar className="mb-4 gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Active filters:
          </span>
          <FilterChip
            label={`Buyer: ${filters.buyerSelection}`}
            onRemove={() => toggleBuyer(filters.buyerSelection!)}
          />
          <ClearFiltersButton onClick={clearAll} className="ml-auto" />
        </FilterBar>
      )}

      {view === "error" ? (
        <ErrorState message={error ?? ""} />
      ) : view === "loading" ? (
        <LoadingState tiles={4} />
      ) : view === "empty" || !data ? (
        <EmptyCard message="No GMROI data available." />
      ) : (
        <PageContent refreshing={view === "refreshing"}>
          <GmroiOverviewCards rows={data} />
          <GmroiTrendChart />
          <GmroiByBuyerTable rows={data} buyerByBuyLine={buyerByBuyLine} />
          <GmroiByBuyLineTable rows={data} buyerByBuyLine={buyerByBuyLine} />
          <GmroiByBranchTable rows={data} />
        </PageContent>
      )}
    </PageShell>
  );
}
```

- [ ] **Step 4: Rewrite the render part of `app/freight/page.tsx`**

Replace the import block (everything above `export default function FreightPage`) with:
```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useInboundFreightData } from "@/hooks/useInboundFreightData";
import {
  FreightFilterProvider,
  useFreightFilterState,
} from "@/hooks/useFreightFilterState";
import { pageView } from "@/lib/page-state";
import { PageContent, PageShell } from "@/components/layout/PageShell";
import { LoadingState } from "@/components/layout/LoadingState";
import { ErrorState } from "@/components/layout/ErrorState";
import { EmptyCard } from "@/components/layout/EmptyState";
import { FilterBar } from "@/components/filters/FilterBar";
import { ClearFiltersButton, FilterChip } from "@/components/filters/FilterChip";
import { FreightOverviewCards } from "@/components/freight/FreightOverviewCards";
import { FreightPctByWriterChart } from "@/components/freight/FreightPctByWriterChart";
import { FreightByVendorTable } from "@/components/freight/FreightByVendorTable";
import { FreightByWriterTable } from "@/components/freight/FreightByWriterTable";
import { HighInboundTable } from "@/components/freight/HighInboundTable";
import { FreightTrendChart } from "@/components/freight/FreightTrendChart";
import { UploadPicker } from "@/components/line-counts/UploadPicker";
import type { InboundFreightRow } from "@/lib/inbound-freight-types";
```
Keep everything in `FreightContents` from `const { data, … } = useInboundFreightData();` through `const hasFilter = …;` exactly as it is. Directly after the `hasFilter` line, add:
```tsx
  const view = pageView({ loading, error, data });
```
Replace the `return ( … );` of `FreightContents` with:
```tsx
  return (
    <PageShell
      title="Inbound Freight"
      subtitle={
        <>
          {headerLabel}
          {data && ` · ${dateFilteredRows.length.toLocaleString()} line items`}
          {hasFilter && data && ` · ${vendorFilteredRows.length.toLocaleString()} shown`}
        </>
      }
    >
      {hasFilter && (
        <FilterBar className="mb-4 gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Active filters:
          </span>
          {filters.writerSelection && (
            <FilterChip
              label={`Writer: ${filters.writerSelection}`}
              onRemove={() => toggleWriter(filters.writerSelection!)}
            />
          )}
          {filters.vendorSelection && (
            <FilterChip
              label={`Vendor: ${filters.vendorSelection}`}
              onRemove={() => toggleVendor(filters.vendorSelection!)}
            />
          )}
          <ClearFiltersButton onClick={clearAll} className="ml-auto" />
        </FilterBar>
      )}

      {view === "error" ? (
        <ErrorState message={error ?? ""} />
      ) : view === "loading" ? (
        <LoadingState tiles={3} />
      ) : view === "empty" || !data ? (
        <EmptyCard message="No inbound freight data available." />
      ) : (
        <PageContent refreshing={view === "refreshing"}>
          <UploadPicker
            availableDates={availableDates}
            selectedDates={selectedDates}
            onChange={setSelectedDates}
          />
          <FreightOverviewCards rows={vendorFilteredRows} />
          <FreightTrendChart />
          <FreightPctByWriterChart rows={dateFilteredRows} />
          <FreightByWriterTable rows={dateFilteredRows} />
          <FreightByVendorTable rows={writerFilteredRows} />
          <HighInboundTable rows={vendorFilteredRows} />
        </PageContent>
      )}
    </PageShell>
  );
```

- [ ] **Step 5: Rewrite the render part of `app/line-counts/page.tsx`**

Replace the import block (everything above `const MONTH_ORDER`) with:
```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useLineCountsData } from "@/hooks/useLineCountsData";
import { latestByMonthTypeSystem } from "@/lib/line-counts-aggregations";
import { pageView } from "@/lib/page-state";
import { cn } from "@/lib/utils";
import { PageContent, PageShell } from "@/components/layout/PageShell";
import { LoadingState } from "@/components/layout/LoadingState";
import { ErrorState } from "@/components/layout/ErrorState";
import { EmptyCard } from "@/components/layout/EmptyState";
import { FilterBar } from "@/components/filters/FilterBar";
import { LineCountScorecards } from "@/components/line-counts/LineCountScorecards";
import { LineCountsByWriterChart } from "@/components/line-counts/LineCountsByWriterChart";
import { LineCountsPivotTable } from "@/components/line-counts/LineCountsPivotTable";
import { LineCountsTrendChart } from "@/components/line-counts/LineCountsTrendChart";
```
Keep everything in `LineCountsPage` from `const { data, … } = useLineCountsData();` through the `refreshedLabel` constant exactly as it is. Directly after `refreshedLabel`, add:
```tsx
  const view = pageView({ loading, error, data });
```
Replace the `return ( … );` with:
```tsx
  return (
    <PageShell
      title="Line Counts"
      subtitle={
        <>
          {loading ? "Loading…" : refreshedLabel}
          {!loading && data && ` · ${filteredRows.length.toLocaleString()} rows in view`}
        </>
      }
    >
      {view === "error" ? (
        <ErrorState message={error ?? ""} />
      ) : view === "loading" ? (
        <LoadingState tiles={4} />
      ) : view === "empty" || !data ? (
        <EmptyCard message="No line count data available." />
      ) : (
        <PageContent refreshing={view === "refreshing"}>
          <FilterBar className="gap-2">
            <span className="text-sm font-medium text-foreground">Month:</span>
            {ALL_MONTHS.map((m) => {
              const hasData = availableMonths.includes(m);
              const selected = selectedMonth === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMonth(m)}
                  aria-pressed={selected}
                  title={hasData ? undefined : "No data for this month yet"}
                  className={cn(
                    "rounded-lg px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : hasData
                      ? "bg-muted text-foreground hover:bg-brand-subtle"
                      : "text-muted-foreground/70 hover:bg-muted"
                  )}
                >
                  {m}
                </button>
              );
            })}
          </FilterBar>
          <LineCountScorecards rows={filteredRows} />
          <LineCountsTrendChart rows={latestRows} />
          <LineCountsByWriterChart rows={filteredRows} />
          <LineCountsPivotTable rows={filteredRows} />
        </PageContent>
      )}
    </PageShell>
  );
```

- [ ] **Step 6: Run the checks**

Run:
```bash
npx tsc --noEmit
bash scripts/_visual/lint-check.sh
grep -rn "bg-sky-\|border-sky-\|text-sky-" app components --include=*.tsx | grep -v "components/ai/\|components/alerts/\|CriticalFiresCard\|RevenueAtRiskCard"
bash scripts/_visual/capture.sh after-task8
bash scripts/_visual/compare.sh after-task8
```
Expected: tsc silent; `NO NEW LINT PROBLEMS` (17 total; the `react-hooks/set-state-in-effect` errors in `app/freight/page.tsx` and `app/line-counts/page.tsx` are baseline, from the untouched `useEffect`s); grep prints nothing; `NUMBERS MATCH`.

Then check the loading rule in the browser on `/`: reload — skeleton cards show, then content; change the date range with a preset button — the content dims for a moment and then updates; it is **not** replaced by a "Loading…" box.

- [ ] **Step 7: Commit**

```bash
git add components/layout/PageShell.tsx components/layout/LoadingState.tsx components/layout/ErrorState.tsx components/layout/EmptyState.tsx components/filters/FilterBar.tsx app/page.tsx app/gmroi/page.tsx app/freight/page.tsx app/line-counts/page.tsx
git commit -F - <<'EOF'
style: page shells, skeleton first-load, and dim-on-refetch

All four pages share one header, canvas and loading rule; filter changes dim
the current view instead of swapping it for "Loading…".

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 9: Final verification and hand-off

**Files:** none changed (unless a check fails — then fix in the task that owns the file and re-run).

- [ ] **Step 1: Full test and build suite**

Run:
```bash
npx --yes tsx lib/format.test.ts
npx --yes tsx lib/page-state.test.ts
npx --yes tsx lib/chart-theme.test.ts
npx --yes tsx lib/aggregations.test.ts
npx --yes tsx lib/alerts.test.ts
npx tsc --noEmit
bash scripts/_visual/lint-check.sh
npm run build
```
Expected: the three new tests print `all assertions passed`; `aggregations.test.ts` and `alerts.test.ts` print their tables and `alerts.test.ts`'s output matches its own "Expected:" lines (2 / 1 / 1 rows, F-NIBCO 2, ALICE 1.0); tsc silent; `NO NEW LINT PROBLEMS (17 total, baseline 19)`; build ends with the route table and exit 0. If the build fails with `Failed to fetch 'Geist' from Google Fonts`, re-run it once — that is a transient network error, seen on this machine on 2026-10-21.

- [ ] **Step 2: Final capture and number check**

Run:
```bash
bash scripts/_visual/capture.sh after
bash scripts/_visual/compare.sh after
```
Expected: `NUMBERS MATCH`; body font contains `Geist`.

- [ ] **Step 3: Visual review**

Open `scripts/_visual/before/<page>.png` next to `scripts/_visual/after/<page>.png` for all four pages and check each "after" image for: grey canvas and white cards everywhere (no sky blue); no clipped axis labels or legend text; no nested scrollbar inside a chart card; every table header readable; stat-tile values larger than their labels.

- [ ] **Step 4: Click-through and keyboard check**

With the dev server running, on `/`: click a bar in "Days Out by Buyer" → the buyer chip appears and tables filter; click a Buyer Summary row → row tints blue with a left bar; click a Buyer × Buy Line row; "Clear all" resets. Tab from the address bar: nav links, the UNASSIGNED switch, the branch trigger, the date inputs, presets, and table headers each show a focus ring. On `/line-counts` switch months; on `/freight` toggle uploads and click a writer bar (others dim grey); on `/gmroi` click a buyer row.

- [ ] **Step 5: Hand-off**

Do not edit `CLAUDE.md`. Report to the owner, with the commit list from `git log --oneline main..HEAD`, and give them these lines to add under CLAUDE.md §5 (Theme):
```markdown
- **Styling lives in three places — never hardcode colours or card classes:**
  - Tokens: `app/globals.css` `:root` — brand `#1D8ACB` (marks, indicators), `--primary` `#1872A8`
    (text and buttons on brand), `--brand-subtle`, `--status-*` (always with an icon + label).
  - Charts: `lib/chart-theme.ts` — validated `SERIES` order, `LINE_TYPE_COLORS`, mark specs.
    Re-run the dataviz palette validator before changing a chart colour.
  - Building blocks: `components/layout/` (`PageShell`, `DashboardCard`, `StatTile`, `EmptyState`,
    `Skeleton`, `LoadingState`, `ErrorState`), `components/table/DataTable.tsx`,
    `components/charts/ChartTooltip.tsx`, `components/filters/FilterBar.tsx` and `FilterChip.tsx`.
```
