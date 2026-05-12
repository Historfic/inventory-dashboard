# CLAUDE.md — Inventory Dashboard Migration

> **Read this file fully before touching any code.** It contains hard-won project rules that must not be violated. If anything in your prompt contradicts this file, this file wins.

---

## 1. Project Overview

We are replacing an existing **Looker Studio** dashboard with a custom **Next.js + Supabase** web application for a client (Todd). The backend data pipeline (CSV → n8n → Supabase Postgres) is already built and stable. **Your job is the frontend only.** Do not touch, suggest changes to, or rebuild the data pipeline.

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

## 2. The Data Pipeline (Context Only — Do Not Modify)

You will never edit this. You need to understand it so you query the database correctly.

1. **Source:** Daily CSV "Branch Stock Reports" dropped into a Google Drive folder by an ERP system.
2. **Middleware:** An n8n workflow runs on a **24-hour schedule**, fetches the CSVs, runs a "Surgical Cleaner" script, and bulk-upserts rows into Supabase.
3. **Data quality guarantees provided by the pipeline** (you can trust these):
   - **Naked Comma Defense:** Description fields with unquoted commas are stitched back together. You will not see broken `desc_2` columns.
   - **Buyer Standardization:** Empty/null `buyer` values are rewritten as `"UNASSIGNED"`. You will never see null or empty string for `buyer`.
   - **Stockout Cap:** `stockout_pct = min(1.0, days_out / period)`. Values are guaranteed between 0.0 and 1.0 inclusive, rounded to 4 decimal places.

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

### Layout (Three-Tier Drill-Down)

```
┌────────────────────────────────────────────────────────────┐
│  Header                                                    │
│  ─ Title: "Inventory Dashboard"                            │
│  ─ Toggle: "Hide UNASSIGNED"  ─ "Last updated: <date>"     │
├────────────────────────────────────────────────────────────┤
│  Active filters bar (shows current selections + Clear)     │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │  Buyer Summary       │  │  Buy Line Averages       │    │
│  │  Grouped by buyer    │  │  Grouped by buy_line     │    │
│  │  Avg days_out        │  │  Avg days_out (sorted ↓) │    │
│  │  Avg stockout_pct    │  │  Avg stockout_pct        │    │
│  └──────────────────────┘  └──────────────────────────┘    │
├────────────────────────────────────────────────────────────┤
│  Purchase Days Out (Granular)                              │
│  Grouped by ecl_id                                         │
│  Cols: ecl_id, desc_1, desc_2, rank4, period, days_out,    │
│        stockout_pct                                        │
└────────────────────────────────────────────────────────────┘
```

### Cross-Filter Behavior

- Clicking a **buyer** row → filters Buy Line table AND granular table to that buyer's rows
- Clicking a **buy_line** row (with a buyer already selected) → narrows the granular table to **buyer AND buy_line** (intersection, not replacement)
- Clicking the same row again → deselects that filter
- "Clear filters" button → resets all selections
- Active selections must be visually obvious (highlight the selected row)

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
│   ├── layout.tsx
│   ├── page.tsx                ← Main dashboard page
│   └── globals.css
├── components/
│   ├── ui/                     ← shadcn/ui components
│   ├── BuyerSummaryTable.tsx
│   ├── BuyLineAveragesTable.tsx
│   ├── GranularItemsTable.tsx
│   ├── UnassignedToggle.tsx
│   └── ActiveFiltersBar.tsx
├── lib/
│   ├── supabase.ts             ← Supabase client
│   ├── aggregations.ts         ← Client-side AVG helpers
│   └── types.ts                ← Schema types (auto-generate from Supabase)
└── hooks/
    └── useInventoryData.ts     ← Data fetching hook
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

### Phase 4 — Top two tables
- Build `BuyerSummaryTable.tsx` and `BuyLineAveragesTable.tsx`
- Buy Line Averages: sort descending by `avg_days_out`
- No clicks yet — just display

### Phase 5 — Cross-filter wiring
- Click handlers on rows in Buyer and Buy Line tables
- Maintain selection state in the parent page
- Re-derive filtered data for the tables below the selected row
- Add Active Filters Bar with Clear button
- Highlight selected rows visually

### Phase 6 — UNASSIGNED toggle
- Add toggle in header
- When off, filter `"UNASSIGNED"` rows out of all three tables uniformly

### Phase 7 — Polish
- Last-updated timestamp (from `MAX(report_date)` in the data)
- Empty states ("No data matches the current filters")
- Loading states
- Error states (Supabase unreachable, etc.)
- Final styling pass

---

## 9. Things You Must Never Do

- **Never commit `.env.local`** or any file containing real keys. Verify `.gitignore` includes it before the first push.
- **Never hardcode the anon key or service role key** anywhere in source files.
- **Never use the service role key in frontend code.** It bypasses RLS and has full database access. The frontend uses only the anon key. If you find yourself reaching for the service role key, you're solving the problem wrong.
- **Never use `SUM()` on `days_out` or `stockout_pct`** when grouping (Section 4.1).
- **Never query `branch_stock_reports` directly for the daily dashboard.** Use `latest_inventory_snapshot` (Section 3).
- **Never round numbers before aggregating.** Round only at the display layer (Section 4.3).
- **Never modify the n8n workflow** or anything in the data pipeline.
- **Never assume RLS state without checking** — if queries return empty arrays unexpectedly, check RLS before any other debugging (Section 3).
- **Never substitute libraries silently.** If you think something different from Section 1's stack is better, ask first.

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

**End of CLAUDE.md.** When in doubt, re-read Section 4 (the Traps) before writing code that aggregates anything.
