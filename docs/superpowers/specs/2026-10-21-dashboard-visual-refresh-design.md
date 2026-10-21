# Dashboard visual refresh — design

**Date:** 2026-10-21 · **Status:** approved direction (A, "brand-led enterprise"), awaiting spec review
**Scope:** the four dashboard pages (`/`, `/gmroi`, `/line-counts`, `/freight`) and the shared navigation.

## Goal

Make the dashboard look like a finished enterprise product instead of a default template. The owner's
complaint is specifically "looks plain / dated" — colour, typography, spacing and cards. Readability,
charts-as-content and filter behaviour were explicitly *not* named as problems.

**Hard constraint: no number on screen changes.** This is a presentation-layer change only.

## Non-goals

- No layout or information-architecture changes: every page keeps its sections, order and content.
- No data, query, hook, aggregation or filter-logic changes (CLAUDE.md §4 traps stay untouched).
- No re-enabling of the six components no page renders today: `ai/ExecutiveBriefCard`,
  `alerts/AlertCard`, `alerts/AlertsPanel`, `alerts/BottlenecksPanel`, `kpi/CriticalFiresCard`,
  `kpi/RevenueAtRiskCard`. They are left as they are.
- No dark mode, no mobile layout (CLAUDE.md §11). The existing `.dark` token block is left untouched.
- No library changes (CLAUDE.md §1). Icons come from `lucide-react`, already a dependency.
- `app/test/page.tsx` (diagnostics page) is not restyled.
- The n8n pipeline — that is a separate spec, after this one ships.

## What is wrong today (evidence)

| Problem | Where |
|---|---|
| Font never applies: `--font-sans: var(--font-sans)` refers to itself, so the browser falls back to its default font | `app/globals.css` `@theme inline` |
| Theme tokens are stock shadcn greys; nothing uses the brand | `app/globals.css` `:root` |
| Sky-blue canvas hardcoded instead of the light-grey canvas CLAUDE.md §5 asks for | `bg-sky-100` in `app/layout.tsx` + all 4 pages |
| Card styling copy-pasted ~40 times (`bg-white rounded-lg border border-sky-200 shadow-md`) | every card, table and chart component |
| 11 unrelated hex colours across 7 charts, grey `--chart-*` tokens unused | `components/*/*Chart*.tsx` |
| Loading is a bare "Loading…" box that replaces the whole page on every filter change, even though the hook keeps the previous rows | `app/page.tsx` and the other pages |
| Sort direction shown as text arrows `↑`/`↓` | every sortable table |

## Brand

From `public/PSLogo-dark.svg`: brand blue `#1D8ACB`, near-black `#231F20`.

Measured WCAG contrast (white surface): brand blue 3.78:1 — fine for marks, indicators and large text
(≥3:1), **not** for small text or as a background under white text. A darker step of the same hue,
`#1872A8`, measures 5.24:1 and is used wherever text sits on or in the brand colour.

## 1. Tokens (`app/globals.css`)

Fix the font: `--font-sans: var(--font-geist-sans), system-ui, sans-serif;` and
`--font-mono: var(--font-geist-mono), ui-monospace, monospace;`.

Light-mode `:root` values (existing token names keep working; new ones are added to `@theme inline`
so Tailwind exposes them as `bg-brand`, `text-status-critical`, etc.):

| Token | Value | Use |
|---|---|---|
| `--background` | `#f9fafb` | page canvas (gray-50) |
| `--foreground` | `#231F20` | body text, headings |
| `--card` / `--popover` | `#ffffff` | cards, popovers, tooltips |
| `--primary` | `#1872A8` | buttons, links, active-nav text (5.24:1) |
| `--primary-foreground` | `#ffffff` | text on primary |
| `--brand` *(new)* | `#1D8ACB` | indicators, focus ring, chart slot 1 |
| `--brand-subtle` *(new)* | `#E8F3FA` | selected table row, active filter chip |
| `--muted-foreground` | `#6b7280` | secondary text (4.83:1) |
| `--border` / `--input` | `#e5e7eb` | hairlines |
| `--ring` | `#1D8ACB` | focus ring |
| `--chart-1`…`--chart-4` | `#1D8ACB` `#eb6834` `#1baf7a` `#eda100` | categorical series, fixed order |
| `--status-good` *(new)* | `#0ca30c` | |
| `--status-warning` *(new)* | `#fab219` | |
| `--status-serious` *(new)* | `#ec835a` | |
| `--status-critical` *(new)* | `#d03b3b` | |

`--chart-5` keeps its current value (unused). Status colours are reserved for meaning (alert severity,
the Line Counts ⚠ anomaly flag) and always ship with an icon + label, never colour alone.

Elevation: cards are white, `rounded-xl`, hairline ring (the `Card` primitive's default) plus `shadow-sm`.
No `shadow-md`, no coloured borders.

## 2. Shared building blocks (new, in `components/layout/`)

Each is small, presentational, and has no data dependencies.

- **`PageShell`** — `{ title, subtitle?, actions?, children }`. Renders the page `<main>` with
  consistent padding (`px-8 py-6`, full width as today) and the header row: title (`text-2xl
  font-semibold`), subtitle in muted text, actions slot on the right (e.g. the UNASSIGNED toggle).
  Replaces the per-page `<main className="min-h-screen bg-sky-100 p-8">` + header markup.
- **`DashboardCard`** — `{ title, description?, action?, children, className? }`. Wraps the `Card`
  primitive with the standard header (title `text-base font-semibold`, optional muted description, optional
  right-aligned action). Replaces every hand-styled card wrapper.
- **`StatTile`** — `{ label, value, sublabel? }`. Label in sentence case, muted, `text-sm`; value
  `text-3xl font-semibold` with **proportional** figures (no `tabular-nums` on big numbers); optional
  muted sublabel. Used by `GmroiOverviewCards`, `FreightOverviewCards`, `LineCountScorecards`. The
  values and their formatting functions are unchanged.
- **`EmptyState`** — `{ message }` with a muted lucide icon. Replaces the repeated
  "No data matches the current filters." blocks; the wording stays the same.
- **`LoadingState`** — skeleton blocks in the page's card shapes (stat-tile row, chart card, table
  card) with a soft pulse. Used on **first load only**.

**Loading rule (every page):** `loading && !data` → `LoadingState`. `loading && data` → render the
previous content at reduced opacity (`opacity-60`, `aria-busy="true"`, `transition-opacity`) instead of
swapping it for a loader. `useInventoryData` already keeps the old rows during a refetch, so the main page
gets the dim; any hook that clears `data` simply lands in the first branch. No hook is modified.

## 3. Navigation (`components/Navigation.tsx`)

White bar, 64px tall, bottom hairline, logo on the left as today. Links become tabs: ink text, and the
active page gets a 2px `--brand` bottom indicator plus `--primary` text instead of the black pill; hover
darkens the text. Labels and routes unchanged ("Days Out", "Turns", "Line Counts", "Inbound Freight").
Visible focus ring on every link.

## 4. Filters (`components/filters/*`, `components/line-counts/UploadPicker.tsx`)

Behaviour unchanged. Visual only: filter triggers use the shadcn `Button` outline variant at one
height; the filter row sits in a `DashboardCard`-style white bar; active-filter chips use
`--brand-subtle` background with `--primary` text and a lucide `X` to remove; "Clear all" is a
`--primary` text button. The UNASSIGNED toggle uses the brand colour when on.

## 5. Tables (`components/ui/table.tsx` + every table component)

Base styles move into the `table.tsx` primitive so table components stop restyling it:

- Header: `text-xs font-medium uppercase tracking-wide text-muted-foreground`, sticky on a white
  background with a hairline bottom border.
- Rows: hairline separators, `hover:bg-muted/60`, numeric cells right-aligned with `tabular-nums`.
- Selected row (cross-filter): `--brand-subtle` background plus a 2px inset left bar in `--brand`.
- Sorting: a new tiny `SortIcon` (lucide `ChevronUp` / `ChevronDown`, `ChevronsUpDown` when unsorted,
  muted until active) replaces the `↑`/`↓` text.

Column definitions, sorting state, and click-to-filter handlers do not change.

## 6. Charts (`lib/chart-theme.ts` + the 7 chart components)

One theme module exports the colours and mark specs; chart components import it instead of hardcoding hex.

**Palette** — validated with the dataviz validator (`validate_palette.js`, light mode, surface
`#ffffff`, adjacent pairs): lightness band PASS, chroma PASS, CVD worst adjacent ΔE 9.1 PASS,
normal-vision worst adjacent ΔE 22.9 PASS. Contrast WARN for slots 3 and 4 (aqua 2.82:1, yellow
2.17:1) → relief is required and is already present: every multi-series chart (Line Counts) sits above
`LineCountsPivotTable`, which shows the same values, and has a legend.

- Single-series charts (Days Out by Buyer, Freight % by Writer, the GMROI / Freight / Inventory trends):
  every mark is slot 1 `#1D8ACB`. No legend box — the card title names the series.
- Line types are fixed by entity, never by rank: `PO → #1D8ACB`, `SO → #eb6834`, `DIR → #1baf7a`,
  `TR → #eda100`, exported as `LINE_TYPE_COLORS`. Used by both Line Counts charts; both show a legend.
- No dual-axis charts (none exist today; keep it that way).

**Mark specs** (exported constants, applied to every chart):

- Bars: `maxBarSize={24}`, `radius={[4, 4, 0, 0]}` on single-series bars; stacked bars keep square
  segments separated by a 2px white surface gap (`stroke="#ffffff" strokeWidth={2}`).
- Lines: `strokeWidth={2}`, round caps/joins, no dots except the active (hover) dot: r=4, series fill,
  2px white ring.
- The three single-series trends (Inventory, GMROI, Freight) stay `<Line>` charts. The only area chart,
  the Line Counts trend, is a stacked `<Area>`: series fills at 85% opacity with a 2px edge in the series
  colour. (Not a white edge: Recharts takes an Area's legend and tooltip colour from its `stroke`, so a white
  stroke would blank both. Stacked *bars* take theirs from `fill`, so they keep the 2px white gap.)
- Grid: horizontal only, solid 1px `#e5e7eb`. Axis ticks 12px `#6b7280`, no axis lines. The two Line
  Counts charts' y-axes (currently unformatted, values reach six figures) get compact ticks from 1,000
  (1K, 2K, 500K); every other axis keeps its existing `%` / ratio formatter.
- Tooltip: one shared `ChartTooltip` content component — white, hairline border, `shadow-sm`,
  `rounded-lg`, 12px ink text, a colour swatch beside each series name (text never wears the series
  colour). Value formatting is passed in by each chart and stays exactly as today.
- Hover cursor on bars: `--brand-subtle` band.

Chart containers keep their current heights; each height must include the x-axis label band so no card
gets a nested scrollbar.

## 7. Pages

`app/layout.tsx` drops `bg-sky-100` (the body takes `bg-background`). Each of `app/page.tsx`,
`app/gmroi/page.tsx`, `app/line-counts/page.tsx`, `app/freight/page.tsx` wraps its existing sections in
`PageShell`, keeps every section in its current order, swaps hand-styled wrappers for `DashboardCard` /
`StatTile`, and uses `LoadingState` / `EmptyState` / the refetch dim as above. Error boxes use a
`--status-critical` icon + text inside a white card; the error message text is unchanged.

## 8. Docs

CLAUDE.md §5 should point at the token block in `app/globals.css`, `lib/chart-theme.ts`, and
`components/layout/`, so future work uses them instead of hardcoding styles. CLAUDE.md currently has
uncommitted edits by the owner, so this work does **not** edit or commit it: the hand-off message gives
the exact lines for the owner to add.

## Verification

1. **Baseline first:** before any change, run `npm run dev` and capture full-page screenshots of the four
   pages at 1440×900, and record the visible headline figures (stat-tile values, snapshot date, item
   counts, first rows of each table).
2. After the change: `npm run build` (zero errors); lint introduces **no new problems** compared with the
   2026-10-21 baseline (19 pre-existing: 8 errors, 11 warnings, none in this work's scope except the two
   `react/no-unescaped-entities` errors in `GmroiTrendChart.tsx`, which this work removes);
   `npx tsx lib/aggregations.test.ts`, `npx tsx lib/alerts.test.ts`.
3. Re-capture the same screenshots and figures. **Every recorded figure must match the baseline
   exactly**; any difference is a bug in this work.
4. Look at each "after" screenshot for clipped labels, nested scrollbars, and overflow; check keyboard
   focus is visible on nav links, filters and table headers.
5. Click-through check: cross-filter a buyer from the bar chart and from a table row, change branch and
   date filters, switch the Line Counts month — selections highlight in brand colours and the refetch dims
   instead of flashing.
