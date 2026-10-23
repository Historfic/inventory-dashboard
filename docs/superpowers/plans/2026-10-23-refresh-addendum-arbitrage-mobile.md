# Dashboard Visual Refresh — Addendum (2026-10-23): Arbitrage page + mobile

Extends `2026-10-21-dashboard-visual-refresh.md`. Run **Task 8b after Task 8** and **Task 10 after Task 8b**,
then the original Task 9 (final verification) covers all five pages and adds the mobile check.

**Why:** after the original plan was written, the Arbitrage page (`/arbitrage`) was merged into `main`, and the
owner asked for the dashboard to be mobile-friendly. That overrides the "no mobile layout" non-goal in the
spec and CLAUDE.md §11 for this work (owner request, 2026-10-23).

All Global Constraints of the original plan still apply (no number changes, no new dependencies, no hook /
query / aggregation changes, never edit CLAUDE.md, explicit `git add` paths, commit trailer). Additions:
- The dev server runs on `http://localhost:3300`; the `scripts/_visual/*` scripts default to it.
- Five pages: `days-out`, `gmroi`, `line-counts`, `freight`, `arbitrage`. `compare.sh` checks all five
  (Arbitrage: table numbers only, relative times stripped). Lint baseline is 20.
- `bash scripts/_visual/mobile.sh <label>` screenshots every page at 390×844 into
  `scripts/_visual/<label>-mobile/` and prints `MOBILE OK` only if no page is wider than the viewport.
  Baseline (`before-mobile`): every page overflows — Days Out 608px, the others 393px, in a 375px viewport.

---

### Task 8b: Arbitrage page joins the design system

Presentation only. `hooks/useArbitrageData.ts`, `hooks/useArbitrageStatus.ts`, `lib/arbitrage-*.ts`, the API
routes, column definitions, sorting state, the run/poll logic in `RunSourcingPanel` and every formatter stay
exactly as they are.

**Files:**
- Modify: `app/arbitrage/page.tsx`
- Modify: `components/arbitrage/ArbitrageOverviewCards.tsx`, `ArbitrageLeadsTable.tsx`, `SourcingRunsTable.tsx`, `RunSourcingPanel.tsx`

**Interfaces:**
- Consumes: `PageShell`, `PageContent` (Task 8); `LoadingState`, `ErrorState` (Task 8); `DashboardCard`,
  `EmptyState`, `DataTable` (Task 4); `StatTile` (Task 6); tokens from Task 2.

- [ ] **Step 1: Page shell.** In `app/arbitrage/page.tsx` replace the hand-built `<main className="min-h-screen bg-sky-100 p-8">` + header with
  `<PageShell title="Arbitrage Leads" subtitle={…same subtitle text and values as today…}>`. Body: `error` → `<ErrorState message={error} />`;
  first load (`loading || !leads || !runs`) → `<LoadingState tiles={4} />`; otherwise
  `<PageContent refreshing={false}>` containing, in today's order: `RunSourcingPanel`, overview tiles, leads table, runs table, footnote
  (footnote text unchanged, `text-xs text-muted-foreground`). `RunSourcingPanel` renders above the error/loading branch exactly as today.
- [ ] **Step 2: Overview tiles.** `ArbitrageOverviewCards` renders the four values with `StatTile` (`label`, `value`, `sublabel`) in the
  same grid the GMROI overview uses after Task 6. Labels/values/sublabels unchanged.
- [ ] **Step 3: Leads table.** Wrap in `DashboardCard` (`title="Leads"`, `action` = the All / Profitable toggle). Render the body with
  `DataTable` (pass the existing `table` instance; pick a `maxHeightClass` equivalent to today's `max-h-[640px]`). Keep `ColumnMeta`;
  if `DataTable` doesn't honour a `wrap` meta, put `whitespace-normal` on the `ProductCell` wrapper div instead. Profitable rows keep a
  green tint via `isRowSelected`-style styling only if `DataTable` supports a row class; otherwise drop the tint (status badge carries it).
  Toggle buttons: active = `bg-primary text-primary-foreground`, inactive = `bg-muted text-foreground hover:bg-muted/80`, `rounded-full px-3 py-1 text-xs font-medium`, visible focus ring.
  Status badges: icon in the status colour (`text-status-good` / `text-status-critical` / `text-status-warning` / `text-muted-foreground`),
  label in `text-foreground`, background `bg-muted` — never colour alone. Net profit / ROI keep their sign colours
  (`text-emerald-700` / `text-red-700`, muted when stale) — these are delta cues and pass contrast.
- [ ] **Step 4: Runs table.** Wrap in `DashboardCard` (`title="Recent runs"`, `description="Last 10 sourcing runs, newest first."`).
  Badges follow the Step 3 rule. Keep the `Table` primitive.
- [ ] **Step 5: Run sourcing panel.** Wrap in `DashboardCard` (`title="Run sourcing"`, description = today's sentence).
  Category/product pills: same active/inactive classes as Step 3's toggle. The Run button uses the default `Button` (now brand primary).
  Notices: `bg-muted` box, icon in the status colour (`text-status-good` done, `text-status-critical` error, `text-status-warning`
  warn, `text-primary` + spin for running), text in `text-foreground`.
- [ ] **Step 6: No legacy styling left.** `grep -nE "sky-|shadow-md|border-sky" app/arbitrage components/arbitrage` prints nothing.
- [ ] **Step 7: Verify.** `npx tsc --noEmit`; `bash scripts/_visual/lint-check.sh` → `NO NEW LINT PROBLEMS`; capture `after-task8b` →
  `compare.sh after-task8b` → `NUMBERS MATCH`; look at `scripts/_visual/after-task8b/arbitrage.png`: grey canvas, white cards, same
  sections in the same order, badges legible. Do **not** press "Run sourcing" (it spends Keepa tokens and adds a run row).
- [ ] **Step 8: Commit** `style(arbitrage): move the Arbitrage page onto the shared design system`.

---

### Task 10: Mobile-friendly pass (all five pages + navigation)

Goal: every page usable on a phone (390×844) with **no sideways page scroll**, nothing clipped, comfortable tap
targets — while desktop (≥1024px) looks exactly as after Task 8b and no number changes. Mobile-first Tailwind:
today's desktop classes move behind `md:` / `lg:` where needed. No new dependencies, no hook/data changes.

**Files (expected):** `components/Navigation.tsx`, `components/layout/PageShell.tsx`, `components/layout/StatTile.tsx` (only if its
text overflows), `components/layout/DashboardCard.tsx`, `components/filters/FilterBar.tsx`, `components/filters/DateRangeFilter.tsx`,
`components/filters/BranchFilter.tsx`, the stat-tile grid wrappers (overview components / `LoadingState`), chart components only
where labels collide, `components/arbitrage/RunSourcingPanel.tsx`.

- [ ] **Step 1: Reproduce.** `bash scripts/_visual/mobile.sh before-task10` and open the five PNGs. Note what overflows on each page.
- [ ] **Step 2: Navigation.** Below `md`: logo scales down (≈150px wide) and the tabs sit in their own row under it, in a
  horizontally scrollable strip (`overflow-x-auto`, `whitespace-nowrap`, hidden scrollbar via `[scrollbar-width:none]`) so all five
  tabs stay reachable; each tab ≥40px tall. From `md` up: unchanged from Task 7.
- [ ] **Step 3: Page shell.** `PageShell` padding `px-4 py-4 md:px-8 md:py-6`; header stacks below `sm` (title, subtitle, then
  actions) and is a row from `sm` up; title `text-xl md:text-2xl`. Make sure `<main>` and every card can shrink (`min-w-0`), so a
  wide child never widens the page.
- [ ] **Step 4: Filters.** `FilterBar` children wrap. Below `sm`: the branch trigger and the date-range block go full width, the two
  date inputs share a row (or stack if they don't fit), presets wrap. Filter chips wrap. Behaviour unchanged.
- [ ] **Step 5: Stat tiles.** Tile grids are 2-up on phones (`grid-cols-2`), 4-up from `lg`. If a value overflows a half-width tile,
  step its size down on small screens only (`text-2xl md:text-3xl`). The `LoadingState` skeleton grid matches.
- [ ] **Step 6: Tables.** Wide tables keep all their columns and scroll horizontally **inside their card** (the `Table` container
  already has `overflow-auto`; ensure the card and its content have `min-w-0` / `overflow-hidden` as needed). The page itself must not
  scroll sideways.
- [ ] **Step 7: Charts.** Charts fill the card width. On a 358px-wide card, check axis labels: if they collide or clip, use the
  smallest fix (e.g. `interval="preserveStartEnd"`, a narrower y-axis width, or `minTickGap`) on the affected chart only.
  Heights stay as they are.
- [ ] **Step 8: Arbitrage.** Run panel pills wrap; the meta line wraps; the leads table scrolls inside its card.
- [ ] **Step 9: Verify mobile.** `bash scripts/_visual/mobile.sh after-task10` → `MOBILE OK`. Open all five PNGs: no clipped text,
  no overlapping labels, nav tabs reachable, tap targets ≥40px.
- [ ] **Step 10: Verify desktop.** capture `after-task10` → `compare.sh after-task10` → `NUMBERS MATCH`; open the five desktop PNGs
  next to `after-task8b` — no visible change at 1440px. `npx tsc --noEmit`; lint-check → `NO NEW LINT PROBLEMS`; `npm run build`.
- [ ] **Step 11: Commit** `style: mobile-friendly layout for all dashboard pages`.

---

### Changes to Task 9 (final verification)

- Every "four pages" check covers five pages (add `/arbitrage`).
- Add: `bash scripts/_visual/mobile.sh after` → `MOBILE OK`, and review the five mobile PNGs.
- Hand-off adds, for CLAUDE.md: §11 — remove "Mobile responsive design (desktop-only for executive use)" from out-of-scope; §5 —
  "Responsive: mobile-first Tailwind; every page must pass `scripts/_visual/mobile.sh` (no sideways scroll at 390px)."
