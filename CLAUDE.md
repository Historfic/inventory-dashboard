# CLAUDE.md — Inventory Dashboard Migration

> **Read this file fully before touching any code.** It contains hard-won project rules that must not be violated. If anything in your prompt contradicts this file, this file wins.

---

## 0. Session Mode (Read This First)

This CLAUDE.md applies to two different operators with different permission levels. **Identify which mode this session is operating in before doing anything else.**

### Owner Mode (Raffy / Azrael)

You are operating in **Owner Mode** when:
- The user identifies as the project owner, lead developer, or "Raffy" / "Azrael"
- The user references being the maintainer of the n8n pipeline
- The session is happening outside an explicit handoff context

In Owner Mode:
- Full n8n write access is **allowed** (see Section 2.5-A)
- Supabase read access is allowed; write access remains gated (see Section 2.5-B)
- The "Things You Must Never Do" rules in Section 9 still apply, but the n8n-specific prohibitions in Delegated Mode do not

### Delegated Mode (Junior Developer)

You are operating in **Delegated Mode** when:
- The user identifies as a junior developer, contractor, or trainee
- The session is part of a delegated handoff
- There is any ambiguity about who is operating — **default to this mode**

In Delegated Mode:
- All write access to n8n and Supabase is **prohibited**
- Only read-only inspection is allowed (see Section 2.5-C)
- Section 9 prohibitions apply in full

### How to Behave When Mode Is Unclear

If you cannot clearly tell which mode this session is in, **ask once**:

> "Before I proceed, I want to confirm which mode this session is operating in: Owner Mode (full write access to n8n, gated write to Supabase) or Delegated Mode (read-only). Which applies here?"

Default to Delegated Mode until the user confirms otherwise. **Do not assume Owner Mode based on the user being friendly or persistent. Confirm explicitly.**

---

## 1. Project Overview

We are replacing an existing **Looker Studio** dashboard with a custom **Next.js + Supabase** web application for a client (Todd). The backend data pipeline (CSV → n8n → Supabase Postgres) is already built and stable. **In Delegated Mode, your job is the frontend only.** In Owner Mode, the operator may modify the pipeline as needed.

### Stack (fixed — do not substitute)

- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript (strict mode)
- **Database client:** `@supabase/supabase-js`
- **UI components:** shadcn/ui (Tailwind-based)
- **Tables:** TanStack Table v8
- **Charts:** Recharts (only if needed — v1 may not have charts)
- **Hosting:** Vercel
- **Source control:** GitHub

If you think a different library would be better, **stop and ask** before swapping. Don't silently substitute.

---

## 2. The Data Pipeline (Context)

1. **Source:** Daily CSV "Branch Stock Reports" dropped into a Google Drive folder by an ERP system.
2. **Middleware:** An n8n workflow runs on a **24-hour schedule**, fetches the CSVs, runs a "Surgical Cleaner" script, and bulk-upserts rows into Supabase.
3. **Data quality guarantees provided by the pipeline** (you can trust these):
   - **Naked Comma Defense:** Description fields with unquoted commas are stitched back together. You will not see broken `desc_2` columns.
   - **Buyer Standardization:** Empty/null `buyer` values are rewritten as `"UNASSIGNED"`. You will never see null or empty string for `buyer`.
   - **Stockout Cap:** `stockout_pct = min(1.0, days_out / period)`. Values are guaranteed between 0.0 and 1.0 inclusive, rounded to 4 decimal places.

---

## 2.5 Pipeline Access Rules

### 2.5-A — n8n Access (Owner Mode)

**In Owner Mode, full n8n write access is allowed.** This includes:

- Editing any workflow node, code, schedule, or credential
- Creating new workflows
- Modifying the Surgical CSV Cleaner code
- Adjusting the Schedule Trigger interval
- Disabling, enabling, duplicating, or deleting workflows
- Modifying field mappings or upsert behavior
- Triggering workflow runs manually
- Reading execution history and node configurations

**However, before any destructive or pipeline-altering action, you MUST follow these guardrails:**

1. **Announce the change before making it.** State plainly what you are about to do, on which workflow, and what the impact is. Example: *"I am about to modify the Surgical CSV Cleaner code to change the desc_2 stitching logic. This will affect every future pipeline run."*

2. **Pause for confirmation on these specific actions:**
   - Deleting a workflow
   - Disabling the production Schedule Trigger
   - Modifying the Supabase upsert node (changing conflict resolution, headers, or the endpoint URL)
   - Modifying credentials (Google Drive OAuth, Supabase auth tokens)
   - Triggering manual runs against the production Supabase project

   For these, ask: *"This action will [describe impact]. Confirm to proceed?"* and wait for an explicit "yes" or "confirmed" before executing.

3. **Read before write.** Before editing any node, read its current configuration and explain what it does in your own words. If you cannot explain what a node currently does, you do not understand it well enough to change it.

4. **One change at a time.** Do not batch multiple workflow edits into a single tool call. Each modification gets its own announcement, execution, and verification.

5. **Verify after every change.** After editing a workflow, either run it once in a test context or describe how the operator should manually verify the change worked. Never assume an edit succeeded just because the tool call returned success.

### 2.5-B — Supabase Access (Owner Mode + Delegated Mode)

Read access is allowed in both modes. Write access is **still gated** even in Owner Mode and requires explicit per-task approval.

**Allowed without per-task approval (both modes):**
- `SELECT` queries on any table or view
- Inspecting schema, column types, indexes, constraints, and RLS policies
- Reading sample rows for development verification
- Generating TypeScript types from the live schema
- Checking row counts and value distributions (`SELECT COUNT(*)`, `SELECT MAX(report_date)`, etc.)
- One-time creation of `latest_inventory_snapshot` view if it does not yet exist (development setup task)
- Granting `SELECT` to the anon role on dashboard views

**Requires explicit approval before executing (Owner Mode):**
- `INSERT`, `UPDATE`, `DELETE` on `branch_stock_reports`
- `DROP`, `ALTER`, `TRUNCATE` on any table
- Adding or removing indexes
- Modifying RLS policies
- Schema migrations of any kind

**Always prohibited (both modes):**
- Use of the service role key in frontend code
- Any operation that bypasses RLS in the deployed app

If you find yourself wanting to run a Supabase write operation, **pause and ask**: *"I want to run [exact SQL or operation] against [table]. This will [describe effect]. Should I proceed?"*

### 2.5-C — Delegated Mode (Read-Only)

In Delegated Mode, all of the following are **prohibited without exception**:

- Editing any n8n workflow node, code, schedule, or credential
- Disabling, enabling, duplicating, or deleting workflows
- Triggering workflow runs manually
- Modifying the `branch_stock_reports` schema
- Running `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, or `TRUNCATE` on any production table
- Modifying any credential, OAuth grant, or API key

Read-only inspection of n8n and Supabase is allowed and encouraged for debugging and verification, identical to the read-only rules in 2.5-B.

---

## 3. Database Schema

### Connection

- **Project URL:** `https://mvsjswojnwhokqpkgxfq.supabase.co`
- **Anon key:** Provided separately (via `.env.local`). **Never commit this file or hardcode the key.**

### Primary Table: `branch_stock_reports`

Permanent historical record. **Do not query this directly for the daily dashboard** — use the view below.

**Composite unique key:** `(report_date, branch_id, ecl_id)`

| Column | Type | Notes |
|---|---|---|
| `report_date` | date | Day the report was generated |
| `branch_id` | text or int | Branch location |
| `buyer` | text | Team member responsible. Never null — `"UNASSIGNED"` when missing |
| `buy_line` | text | Brand or category |
| `ecl_id` | text or int | Unique SKU/Item ID |
| `desc_1` | text | Product description (primary) |
| `desc_2` | text | Product description (secondary) |
| `rank4` | text | Product ranking/tier |
| `op` | numeric | (purpose TBD — display only if asked) |
| `period` | numeric | Expected sales cycle in days |
| `hits` | numeric | (purpose TBD) |
| `days_out` | numeric | Consecutive days out of stock |
| `on_po` | numeric | (purpose TBD) |
| `trans` | numeric | (purpose TBD) |
| `stockout_pct` | numeric (float) | `days_out / period`, capped at 1.0 |

### Primary View for the Dashboard: `latest_inventory_snapshot`

**Always query this view, not the underlying table**, for the daily dashboard. It filters to only the most recent `report_date`, preventing multi-day data from being accidentally summed or averaged together.

**If the view does not yet exist**, create it with:

```sql
CREATE OR REPLACE VIEW latest_inventory_snapshot AS
SELECT *
FROM branch_stock_reports
WHERE report_date = (SELECT MAX(report_date) FROM branch_stock_reports);
```

After creating, grant read access to the anon role:

```sql
GRANT SELECT ON latest_inventory_snapshot TO anon;
```

### Row Level Security

Assumed **off** for v1. Verify in Supabase dashboard → Authentication → Policies. **If RLS is on without a SELECT policy for the anon role, all queries will silently return empty arrays.** This is the #1 silent failure mode. If you find empty arrays where data should exist, check RLS first.

---

## 4. THE TRAPS — Hard Rules You Must Never Violate

These rules were learned the hard way in the Looker Studio version. Breaking any of them produces silently wrong numbers that ship to the client.

### 4.1 The SUM Trap (Aggregation Rule)

**NEVER use `SUM()` when aggregating `days_out` or `stockout_pct` at the Buyer or Buy Line level.** You cannot sum percentages or status-day counts — the result is mathematical nonsense.

**Always use `AVG()` (or JS `.reduce` + divide for client-side averaging).**

- ❌ Wrong: `SUM(stockout_pct)` grouped by buyer
- ✅ Right: `AVG(stockout_pct)` grouped by buyer
- ❌ Wrong: `SUM(days_out)` grouped by buy_line
- ✅ Right: `AVG(days_out)` grouped by buy_line

This applies to the SQL side, the Supabase RPC side, and any client-side aggregation in TypeScript.

### 4.2 The 1,000-Row Default Limit

Supabase REST API caps every query at **1,000 rows by default**. It does not throw an error — it just returns the first 1,000 rows silently. This will look fine in development with small data and break in production.

Two options when fetching potentially-large result sets:

- For the granular bottom table: use `.range(0, 9999)` or paginate explicitly.
- For aggregated tables (Buyer Summary, Buy Line Averages): aggregate **server-side** via a Postgres function or a view, so the response is already small.

**Default assumption:** the granular table needs `.range(0, 9999)` explicitly added.

### 4.3 Decimal Display Rules

- All `days_out` values: **rounded to 0 decimals** on the UI (e.g., `5` not `5.234`).
- All `stockout_pct` values: **displayed as `%` with 0 decimals** (e.g., `80%` not `0.8034`).
- Numeric inputs/aggregations stay as full-precision floats internally — only round at the display layer.

### 4.4 The UNASSIGNED Toggle

The dashboard must have a **toggle at the top** to show or hide the `"UNASSIGNED"` buyer. Default: show all (including UNASSIGNED). When the toggle is off, filter out UNASSIGNED rows from all three tables uniformly.

### 4.5 Time-Series Awareness (Future-Proofing)

For v1 the dashboard only uses `latest_inventory_snapshot`, so this is informational. **If anyone later asks for historical charting**, remember:
- The base table contains multiple rows per `ecl_id` across days
- Aggregations must group by `report_date` first
- Do not average across days unless explicitly asked

---

## 5. UI Requirements

### Theme

- **Light mode** only for v1
- Enterprise-grade, clean, minimal
- Background: light gray canvas (`bg-gray-50` or similar)
- Cards: stark white (`bg-white`), `rounded-lg` corners, subtle drop shadow (`shadow-sm` or `shadow`)
- Typography: system font stack or Inter — readable, professional

### Layout (Master Dashboard)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header: "Inventory Dashboard" + UNASSIGNED toggle + Snapshot date        │
├─────────────────────────────────────────────────────────────────────────┤
│ Filters: [Branch ▾]  [Date range ▾]                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ Active filters chips + Clear all                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Alerts panel    │ Bottlenecks panel  (top 5 buy_lines + top 3 buyers)    │
├─────────────────────────────────────────────────────────────────────────┤
│ Revenue at Risk scorecard │ Critical Fires scorecard                     │
├─────────────────────────────────────────────────────────────────────────┤
│ Bar chart: Days Out by Buyer (avg stockout_pct, descending, clickable)   │
├─────────────────────────────────────────────────────────────────────────┤
│ Buyer Summary │ Buyer × Buy Line  (both tables, both cross-filterable)   │
├─────────────────────────────────────────────────────────────────────────┤
│ Treemap: Buy Lines with No PO Outstanding (cell click = filter)          │
├─────────────────────────────────────────────────────────────────────────┤
│ Purchase Days Out (extended granular: +buyer +buy_line +op +hits)        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Cross-Filter Behavior

- Clicking a **buyer** in any KPI element (Bar chart bar, Buyer Summary row,
  Bottlenecks panel) → filters all downstream views to that buyer.
- Clicking a **buy_line** (Buyer × Buy Line row, Treemap cell, Bottlenecks panel)
  → intersects with the current buyer filter (or stands alone if no buyer set).
- Clicking the same item again → deselects.
- "Clear all" in the active-filters bar → resets every filter.
- Selected rows / cells are visually highlighted.

### Date Range Semantics

The Date filter scopes which days are *available*. The dashboard always displays
the latest snapshot **within** the selected range (no averaging across days, per
§4.5). Implemented via the `latest_inventory_in_range` RPC (see §3).

### Data Formatting

- `days_out`: integer, no decimals
- `stockout_pct`: `XX%` format, no decimals
- All averages: same formatting as above
- Display `branch_id` and `buyer` exactly as stored (no case transformation)

---

## 6. Project Structure

```
inventory-dashboard/
├── .env.local                  ← NEVER commit. Contains keys.
├── .env.local.example          ← Commit this. Placeholder values only.
├── .gitignore                  ← Must include .env.local
├── CLAUDE.md                   ← This file
├── README.md
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── app/
│   ├── layout.tsx              ← Root layout with <Navigation />
│   ├── page.tsx                ← Inventory dashboard (Master Dashboard)
│   ├── gmroi/page.tsx          ← GMROI page (§14)
│   ├── freight/page.tsx        ← Inbound Freight page (§15)
│   ├── line-counts/page.tsx    ← Line Counts page (§16)
│   └── test/page.tsx           ← Debug page from Phase 1, kept for diagnostics
├── components/
│   ├── ui/                     ← shadcn/ui primitives
│   ├── Navigation.tsx          ← Top nav: Inventory / GMROI / Freight / Line Counts
│   ├── filters/
│   │   ├── BranchFilter.tsx
│   │   ├── DateRangeFilter.tsx
│   │   ├── UnassignedToggle.tsx
│   │   └── ActiveFiltersBar.tsx
│   ├── kpi/
│   │   ├── RevenueAtRiskCard.tsx
│   │   ├── CriticalFiresCard.tsx
│   │   ├── DaysOutByBuyerChart.tsx
│   │   ├── BuyerSummaryTable.tsx
│   │   ├── BuyerBuyLineTable.tsx
│   │   ├── PurchaseDaysOutTable.tsx   ← extended granular
│   │   └── BuyLineTreemap.tsx
│   ├── alerts/
│   │   ├── AlertsPanel.tsx
│   │   ├── BottlenecksPanel.tsx
│   │   └── AlertCard.tsx
│   ├── gmroi/
│   │   ├── GmroiOverviewCards.tsx
│   │   ├── GmroiByBranchTable.tsx
│   │   └── GmroiByBuyLineTable.tsx
│   ├── freight/
│   │   ├── FreightOverviewCards.tsx
│   │   ├── FreightPctByWriterChart.tsx   ← Oliver's "% freight per buyer" KPI
│   │   ├── FreightByVendorTable.tsx
│   │   ├── FreightByWriterTable.tsx
│   │   └── HighInboundTable.tsx
│   └── line-counts/
│       ├── LineCountScorecards.tsx
│       ├── LineCountsByWriterChart.tsx
│       └── LineCountsPivotTable.tsx
├── lib/
│   ├── supabase.ts             ← Supabase client
│   ├── types.ts                ← Inventory schema types
│   ├── gmroi-types.ts          ← GMROI schema types
│   ├── aggregations.ts         ← Inventory AVG helpers (§4.1)
│   ├── aggregations.test.ts    ← tsx-runnable test
│   ├── gmroi-aggregations.ts   ← GMROI helpers
│   ├── inbound-freight-types.ts        ← Freight schema types
│   ├── inbound-freight-aggregations.ts ← Freight helpers (§15)
│   ├── line-counts-types.ts            ← Line Counts schema types
│   ├── line-counts-aggregations.ts     ← Line Counts helpers (§16)
│   ├── alerts.ts               ← Rule registry + engine (§13)
│   ├── alerts.test.ts          ← tsx-runnable test
│   ├── filters.ts              ← Filter state types + client-side helpers
│   ├── format.ts               ← Shared display formatters (§4.3)
│   └── utils.ts                ← cn() className composer
└── hooks/
    ├── useInventoryData.ts        ← Calls latest_inventory_in_range RPC
    ├── useGmroiData.ts            ← Reads latest_gmroi_snapshot view
    ├── useInboundFreightData.ts   ← Reads latest_inbound_freight_snapshot view (§15)
    ├── useLineCountsData.ts       ← Reads latest_line_counts_snapshot view (§16)
    └── useFilterState.tsx         ← Filter context + provider
```

### Required Environment Variables

`.env.local` (not committed):

```
NEXT_PUBLIC_SUPABASE_URL=https://mvsjswojnwhokqpkgxfq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from project owner — never commit>
```

`.env.local.example` (committed — placeholder only):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 7. Development Workflow

### First-time setup (one-time)

```powershell
npx create-next-app@latest inventory-dashboard --typescript --tailwind --app --eslint
cd inventory-dashboard
npm install @supabase/supabase-js @tanstack/react-table
npx shadcn@latest init
npx shadcn@latest add table button toggle card
```

### Generate TypeScript types from Supabase

After connecting and creating the view:

```powershell
npx supabase gen types typescript --project-id mvsjswojnwhokqpkgxfq > lib/types.ts
```

This pulls real column types from the database. Re-run any time the schema changes.

### Running locally

```powershell
npm run dev
```

Dashboard runs at `http://localhost:3000`.

### Deployment (Vercel)

1. Push to GitHub
2. Import the repo in Vercel
3. Add both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel → Project Settings → Environment Variables
4. Deploy

---

## 8. Phased Build Order

**Build one phase at a time. Verify before moving on. Do not skip ahead.**

### Phase 1 — Connect and read
- Set up the Next.js project
- Connect to Supabase
- Query `latest_inventory_snapshot` with `.range(0, 9999)` and `console.log` the first 5 rows
- Confirm columns match Section 3
- **Stop here. Verify with the project owner before continuing.**

### Phase 2 — Granular table (bottom)
- Build `GranularItemsTable.tsx`
- Display all columns in the spec
- Apply decimal-rounding rules (Section 4.3)
- Sortable columns
- No filters yet
- **Verify visually.**

### Phase 3 — Aggregation helpers
- Write `lib/aggregations.ts` with two functions:
  - `aggregateByBuyer(rows)` → returns `[{buyer, avg_days_out, avg_stockout_pct}]`
  - `aggregateByBuyLine(rows, buyerFilter?)` → returns same shape, optionally filtered by buyer
- **Both must use averages, never sums (Section 4.1).**
- Unit test these in isolation with hand-crafted sample data before wiring to UI.

### Phase 4 — Filter infrastructure
- Create `latest_inventory_in_range(start_date, end_date, branch_filter)` RPC in
  Supabase with `SECURITY DEFINER` and `GRANT EXECUTE TO anon`.
- Build `BranchFilter`, `DateRangeFilter`, `UnassignedToggle`, `ActiveFiltersBar`.
- Filter state lives in `useFilterState` (React Context provider in the page).
- `useInventoryData(filters)` switches to calling the RPC.

### Phase 5 — KPI layer
- Scorecards: `RevenueAtRiskCard` (SUM of `hits`) and `CriticalFiresCard` (row count).
- Bar chart: `DaysOutByBuyerChart` (X=buyer, Y=avg stockout_pct, descending).
- Tables: `BuyerSummaryTable`, `BuyerBuyLineTable`, `PurchaseDaysOutTable`
  (the last is the extended granular: +buyer +buy_line +op +hits).
- Treemap: `BuyLineTreemap` (items with `on_po = 0`).
- All elements click-to-filter via `useFilterState`.

### Phase 6 — Alerts & Bottlenecks
- See §13.

### Phase 7 — GMROI page
- See §14.

### Phase 8 — Polish + Vercel deploy
- Update `metadata.title` to "Inventory Dashboard".
- Loading / empty / error states on every KPI element.
- `npm run build` → zero errors / zero warnings before deploy.
- Vercel: import repo, set `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` in all three environments, deploy.

---

## 9. Things You Must Never Do (Both Modes)

These apply regardless of mode:

- **Never commit `.env.local`** or any file containing real keys. Verify `.gitignore` includes it before the first push.
- **Never hardcode the anon key or service role key** anywhere in source files.
- **Never use the service role key in frontend code.** It bypasses RLS and has full database access. The frontend uses only the anon key. If you find yourself reaching for the service role key, you're solving the problem wrong.
- **Never use `SUM()` on `days_out` or `stockout_pct`** when grouping (Section 4.1).
- **Never query `branch_stock_reports` directly for the daily dashboard.** Use `latest_inventory_snapshot` (Section 3).
- **Never round numbers before aggregating.** Round only at the display layer (Section 4.3).
- **Never assume RLS state without checking** — if queries return empty arrays unexpectedly, check RLS before any other debugging (Section 3).
- **Never substitute libraries silently.** If you think something different from Section 1's stack is better, ask first.

### Owner Mode additions

- **Never disable the production Schedule Trigger** without an explicit confirmation step and a stated plan for re-enabling it.
- **Never modify the Surgical CSV Cleaner** without first reading and explaining the current logic out loud.
- **Never run `INSERT`, `UPDATE`, or `DELETE`** on `branch_stock_reports` without explicit per-statement approval.
- **Never batch multiple workflow edits** into a single action. One change, verify, repeat.

### Delegated Mode additions

- **Never modify the n8n workflow** under any circumstances. Read access only.
- **Never run any write operation** against Supabase. Read access only.
- **If asked to do something that requires write access**, refuse and tell the user this requires Owner Mode and a separate session with the project owner.

---

## 10. When You Get Stuck

If something doesn't work and the error isn't obvious:

1. **Empty array from Supabase but data should exist** → RLS is the most likely cause. Check Authentication → Policies in Supabase dashboard.
2. **Numbers don't match Looker Studio** → 99% certainty it's the SUM trap (Section 4.1) or a decimal rounding mistake (Section 4.3). Audit the aggregation logic before anything else.
3. **Table shows exactly 1,000 rows when more should exist** → The 1,000-row default limit. Add `.range(0, 9999)` (Section 4.2).
4. **TypeScript errors after schema change** → Re-run `supabase gen types typescript` to regenerate `lib/types.ts`.
5. **Deployed site works but local doesn't (or vice versa)** → Environment variable mismatch between Vercel and `.env.local`.

If none of the above explains it, **stop and ask the project owner** with: what you tried, what you expected, what actually happened. Don't guess your way past a confusing bug — the client's numbers must be correct.

---

## 11. Out of Scope for v1 (Do Not Build)

- Historical charting / time-series views
- CSV/PDF export
- User authentication (Todd accesses via private Vercel URL)
- Multi-tenant support
- Mobile responsive design (desktop-only for executive use)
- Email reports
- Push notifications
- Real-time updates (data is daily-batch)
- Dark mode

These may come later. **Do not build them speculatively.**

---

## 12. Owner's Pre-Modification Checklist (Owner Mode Only)

Before making any modification to the n8n pipeline, the owner should mentally walk through this checklist. Claude Code should remind the owner of this list if it sees a modification request that touches the production workflow:

- [ ] Do I have a recent backup or export of `branch_stock_reports` from the last 24 hours?
- [ ] Is the current Schedule Trigger disabled, or am I OK with it running mid-edit?
- [ ] Do I know how to revert this change if it breaks something? (n8n keeps version history — confirm it's accessible.)
- [ ] If this edit affects today's pipeline run, do I have a plan for re-running the day's CSV manually?
- [ ] Is anyone else (Junior Dev) currently editing the same workflow? (Collaborative edits can stomp each other.)
- [ ] Is the change small enough to verify in one test run, or am I about to batch too much?

If any of these is uncomfortable to answer "yes" to, **pause and prepare before modifying.**

---

## 13. Alerts & Bottlenecks Engine

Rule-based, no AI. Lives in `lib/alerts.ts`. Evaluates inventory rows after the
current filter state has been applied, so alerts reflect what's on screen.

### Alert rules

| id | severity | predicate |
|---|---|---|
| `critical-stockout-no-po` | critical | `stockout_pct >= 1.0 AND on_po === 0` |
| `severe-stockout` | warning | `stockout_pct >= 0.8 AND stockout_pct < 1.0` |
| `aging-stockout` | warning | `days_out >= 30 AND stockout_pct < 1.0` |

Thresholds (0.8, 30) live as constants at the top of `lib/alerts.ts`. Adjust
there and re-run `npx tsx lib/alerts.test.ts` to verify.

### Bottlenecks (aggregate-level)

- Top 5 **buy lines** by count of items matching `critical-stockout-no-po`.
- Top 3 **buyers** by AVG(`stockout_pct`).

Both bottleneck types are click-to-filter — clicking a buy line bottleneck sets
the buy_line filter, clicking a buyer bottleneck sets the buyer filter.

### Display rules

- `AlertsPanel` shows critical alerts first, then warnings. Empty state when no
  rule fires: "All clear for the current view."
- `BottlenecksPanel` shows two columns (Buy lines / Buyers). Each entry is a
  clickable row that toggles the corresponding filter.
- The panels sit between the active-filters bar and the scorecard row.

### Adding new rules

1. Add the rule to `ALERT_RULES` in `lib/alerts.ts`.
2. Add coverage to `lib/alerts.test.ts`.
3. Re-run `npx tsx lib/alerts.test.ts` to confirm fires.
4. Reload the dashboard.

---

## 14. GMROI Page

Lives at `/gmroi`. Independent from the main dashboard because GMROI data is
**monthly** (one file per month from the ERP) while inventory is **daily**, and
the metrics are financial ratios rather than stock-day counts.

### Data source

- Reads `latest_gmroi_snapshot` view (filters to the most recent `report_date`
  in `branch_gmroi_reports`).
- Anon has `SELECT` on the view.
- Hook: `useGmroiData()` — same shape as `useInventoryData` but no filter args
  (date range is out-of-scope for v1 since data only updates monthly).

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header: "GMROI Dashboard" + snapshot date + row count                    │
├─────────────────────────────────────────────────────────────────────────┤
│ 4 overview scorecards: Total GP$, Total COGS$, $ On Hand, Avg GMROI      │
├─────────────────────────────────────────────────────────────────────────┤
│ GMROI by Branch (table, excludes "All Branches" rollup row)              │
├─────────────────────────────────────────────────────────────────────────┤
│ GMROI by Buy Line (table, AVG metrics, sorted by GMROI desc)             │
└─────────────────────────────────────────────────────────────────────────┘
```

### "All Branches" rollup row handling

The ERP includes a per-buy-line "All Branches" rollup row. We store it (so we
match the source-of-truth report Todd sees printed) but filter it out before
aggregating in the dashboard so totals don't double-count. The filter lives in
`lib/gmroi-aggregations.ts`.

### Aggregation rules

- `aggregateGmroiByBuyLine`: AVG of GMROI, turns, markup_pct, adjusted_margin_pct.
- `aggregateGmroiByBranch`: SUM of GP$, COGS$, $OnHand; AVG of GMROI.
- `companyTotals`: SUM of GP$, COGS$, $OnHand; AVG of GMROI.

GMROI is a ratio — AVG, not SUM. Markup% and Adjusted Margin% are also
percentages → AVG. Dollar columns are flow quantities → SUM is appropriate.

---

## 15. Inbound Freight Page

Lives at `/freight`. Reads `latest_inbound_freight_snapshot` view. Data is
monthly cadence (matches the GMROI feed pattern).

### Schema

`branch_inbound_freight_reports` columns: `report_date`, `order_number`,
`line_number` (synthetic per-order counter), `writer` (buyer code),
`vendor_name`, `gen_total_dollars`, `freight_dollars`, `inbound_pct` (stored as
integer percent, e.g. 159 means 159%). Composite unique:
`(report_date, order_number, line_number)`.

### Source CSV quirks

- Heavy whitespace padding on `Writer` and `Vendor Name` — cleaner trims.
- Vendor names with embedded commas are quoted — `parseCsvLine` handles.
- `Gen Total $` can be negative (credits/returns).
- `Inbound %` can exceed 100% when freight > order total.
- Multiple identical rows per `(writer, order, vendor)` are line items in the
  same PO. The cleaner increments a per-order `line_number` counter to make
  them unique without losing any source data.

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header: "Inbound Freight" + snapshot date + line item count              │
├─────────────────────────────────────────────────────────────────────────┤
│ 3 overview scorecards: Total Order $, Total Freight $, Avg Inbound %     │
├─────────────────────────────────────────────────────────────────────────┤
│ Freight % of Order — by Writer (bar chart, weighted, desc)               │
├─────────────────────────────────────────────────────────────────────────┤
│ By Writer (table)                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│ By Vendor (table, default sort = highest freight $)                      │
├─────────────────────────────────────────────────────────────────────────┤
│ High Inbound % Orders (table, filtered to inbound_pct >= 20)             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Aggregation rules

- `freightTotals`: SUM of gen_total and freight, AVG of inbound_pct, COUNT
  distinct vendors/writers.
- `aggregateFreightByVendor` / `aggregateFreightByWriter`: SUM of dollar
  columns, AVG of inbound_pct.
- **`freight_pct_of_order` (per writer)**: weighted ratio =
  `SUM(freight) / SUM(order) * 100`. Different from `AVG(inbound_pct)` because
  it's dollar-weighted, not row-weighted. Oliver explicitly asked for this
  metric ("% of freight costs for each buyer") — render it as the bar chart
  above and as a column in the By Writer table.

Dollars are flow quantities → SUM. Inbound % is a per-row ratio → AVG (for the
"per row" metric) OR weighted (for the dollar-weighted metric).

---

## 16. Line Counts Page

Lives at `/line-counts`. Reads `latest_line_counts_snapshot` view. Data is
**monthly** cadence — Oliver confirmed: four reports per month (PO, SO,
Transfer, Direct PO). The fact that the May 2026 filenames happened to use the
same date string as inventory was coincidental; do not treat as daily.

### Schema

`branch_line_count_reports` columns: `report_date`, `writer`, `line_type`,
`line_count`. Composite unique: `(report_date, writer, line_type)`.

`line_type` is one of `'PO'`, `'SO'`, `'DIR'`, `'TR'` — derived by the cleaner
from the source CSV's 2nd-column header (`PO Lines`, `SO Lines`, `Dir. Lines`,
`TR Lines`). Source ships **4 separate CSV files per day**, one per type; they
all land in the same Drive folder. Cleaner detects the type from the header,
extracts writer + count, skips empty separator rows and the footer total.

### Source CSV quirks

- Empty separator rows between every writer line — skip rows where writer is blank.
- Footer total row uses `=========` separator and has whitespace-only writer —
  skip rows where the count column contains `=`.

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header: "Line Counts" + snapshot date + row count                        │
├─────────────────────────────────────────────────────────────────────────┤
│ 4 scorecards: PO Lines, SO Lines, Direct Lines, Transfer Lines           │
├─────────────────────────────────────────────────────────────────────────┤
│ Bar chart: Lines by Writer (stacked by line type, sorted desc by total)  │
├─────────────────────────────────────────────────────────────────────────┤
│ Pivot table: Writer × line type with row totals                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Aggregation rules

- `lineCountTotals`: SUM line_count per type, COUNT distinct writers per type.
- `aggregateLineCountsByWriter`: pivots rows into one row per writer with PO,
  SO, DIR, TR, and total columns. Sorted by total desc.

---

## 17. AI Features (Claude Haiku 4.5)

Two AI features sit on top of the main dashboard. Both call Anthropic's API
**server-side only** from Next.js route handlers — the API key never reaches the
browser. Model: `claude-haiku-4-5` (kept on Haiku for cost; one snapshot ≈ a few
hundred tokens of summarized input per call).

### 17.1 — Daily Executive Brief

- Endpoint: `app/api/brief/route.ts` (`POST /api/brief`).
- UI: `components/ai/ExecutiveBriefCard.tsx`, rendered between the filters bar
  and the alerts row on `/`.
- Hook: `hooks/useExecutiveBrief.ts`.
- Input: pre-aggregated stats only — no raw rows. Snapshot date, items shown,
  revenue at risk, critical-fires count, top-5 buyers by avg stockout %, top-5
  buy lines fully out with no PO, and alert counts.
- Output: 2 short plain-text paragraphs. No markdown.

### 17.2 — Alert Explainer

- Endpoint: `app/api/explain/route.ts` (`POST /api/explain`).
- UI: expansion inside `components/alerts/AlertCard.tsx` ("Why this matters →").
  Only fetched when the user clicks the disclosure — explanations are lazy.
- Hook: `hooks/useAlertExplanation.ts`.
- Input: alert id, severity, item count, top buyers/buy lines in the alert, and
  up to 5 representative items (ecl_id + days_out + stockout_pct).
- Output: 2 short paragraphs (what it means + suggested next action).

### 17.3 — Caching

- Server-side: `lib/ai-cache.ts` — in-memory TTL cache (24h default). Brief
  cached by a fingerprint of `(reportDate, headline stats, top-N rankings)`.
  Explainer cached by `(reportDate, alertId, top-N buyers, top-N buy lines)`.
- Cache hits never touch Anthropic. Response includes `cached: true`.
- Cache is per server instance — Vercel cold starts will repopulate it on first
  request after deploy. This is acceptable for the use case.

### 17.4 — Rules

- `ANTHROPIC_API_KEY` is server-only. **Never** prefix with `NEXT_PUBLIC_`.
- Never send raw `InventoryRow[]` to the model — aggregate first. Keeps cost
  predictable and avoids leaking item-level data into prompt logs.
- All numbers in the prompt come from the dashboard's own aggregations — never
  let the model invent figures. Output prompts say so explicitly.
- Failure modes: API key missing → 500 with clear message. Rate limit → 429.
  Other Anthropic errors → 502. UI shows the error inline; the dashboard itself
  keeps working.

### 17.5 — Adjusting the prompts

System prompts live as `SYSTEM_PROMPT` constants at the top of each route file.
Edit there, save, hot-reload. The cache key does **not** include the prompt
text, so after a prompt change either clear the in-memory cache (restart the
server) or flip a hidden cache-buster constant if testing iteratively.

---

**End of CLAUDE.md.** When in doubt, re-read Section 0 (Session Mode) and Section 4 (the Traps) before writing code that aggregates anything or modifying the pipeline.