# Inventory Dashboard — Project Overview

> **For:** Todd (the client), Oliver (data owner), and any developer who
> picks up this project later. Written so the top sections are readable
> without a technical background, and the lower sections give a developer
> enough detail to make changes confidently.
>
> **Last updated:** 2026-05-23

---

## TL;DR — What this is

This project replaces the old Looker Studio dashboard with a private web app
that pulls fresh inventory, GMROI, freight, and line-counts data out of an
ERP every day (and monthly for some reports), cleans it, stores it in a
database, and renders it as four dashboard pages. Two small AI features sit
on top: a daily executive brief and an alert explainer, both powered by
Claude Haiku.

The whole thing runs on three services Todd already owns or can access:

- **n8n.cloud** — moves data from Google Drive into the database on a
  schedule. The "pipeline."
- **Supabase** — the database. Stores every row from every report,
  permanently.
- **Vercel** — hosts the dashboard. The URL Todd bookmarks.

Day-to-day, nothing needs to be touched. The pipeline runs itself. The only
manual moments are: when Oliver changes the source file format (rename
columns, add columns), when a new buyer joins, or when something visibly
breaks on the dashboard.

---

## How to use this document

- **Reading top-to-bottom** gives a complete picture.
- **Looking for one specific thing?** Use the table of contents below.
- **About to make a change?** Skip to **"How to make common changes"**.
- **Something broken?** Skip to **"Troubleshooting"**.
- **Returning after 6+ months?** Read sections 1–4, then dive into whichever
  page you're working on.

### Table of contents

1. [What was built](#1-what-was-built)
2. [System architecture](#2-system-architecture)
3. [Where everything lives](#3-where-everything-lives)
4. [The data pipeline (n8n)](#4-the-data-pipeline-n8n)
5. [The database (Supabase)](#5-the-database-supabase)
6. [The dashboard pages](#6-the-dashboard-pages)
7. [AI features](#7-ai-features)
8. [How to make common changes](#8-how-to-make-common-changes)
9. [Troubleshooting](#9-troubleshooting)
10. [Monthly maintenance checklist](#10-monthly-maintenance-checklist)
11. [Access, accounts, and credentials](#11-access-accounts-and-credentials)
12. [Glossary](#12-glossary)

---

## 1. What was built

Four dashboard pages, one shared navigation bar, all on the same private URL:

| Page | Purpose | Data refreshes |
|---|---|---|
| **Days Out** (`/`) | Stockout watch. Shows which items are out of stock, for how long, and which buyer owns them. Replaces the inventory side of the old Looker dashboard. | Daily |
| **Turns** (`/gmroi`) | Inventory turns and margins, broken down by branch, buy line, and buyer. | Monthly |
| **Inbound Freight** (`/freight`) | Freight-cost ratios per writer and per vendor. Surfaces high-freight orders. | Monthly |
| **Line Counts** (`/line-counts`) | PO/SO/Direct/Transfer line counts per writer. | Monthly |

Plus, layered on top:

- A **Daily Executive Brief** card on the Days Out page — Claude writes a
  2-paragraph plain-English summary of today's snapshot.
- **Alert explanations** — every alert on the Days Out page has a
  "Why this matters →" link that asks Claude to explain it.

---

## 2. System architecture

```
   ┌─────────────────────────┐
   │  ERP (Eclipse)          │  → exports CSV files
   └────────────┬────────────┘
                ▼
   ┌─────────────────────────┐
   │  Google Drive           │  ← Oliver drops/edits files here
   │  4 folders: Inventory,  │
   │  GMROI, Freight, Lines  │
   └────────────┬────────────┘
                ▼
   ┌─────────────────────────┐
   │  n8n workflow           │  ← runs on schedule, daily + monthly
   │  "Branch Report         │     cleans + upserts rows
   │   Pipeline"             │
   └────────────┬────────────┘
                ▼
   ┌─────────────────────────┐
   │  Supabase (Postgres)    │  ← permanent storage,
   │  one table per report   │     plus "latest snapshot" views
   └────────────┬────────────┘
                ▼
   ┌─────────────────────────┐
   │  Next.js dashboard      │  ← what Todd sees in his browser
   │  Vercel-hosted          │
   └────────────┬────────────┘
                ▼  (for AI features only)
   ┌─────────────────────────┐
   │  Anthropic API          │  ← Claude Haiku writes briefs/explanations
   │  (server-side only)     │
   └─────────────────────────┘
```

Each box can be debugged independently. If the dashboard shows wrong
numbers, the data is either bad in Supabase (pipeline-side issue) or being
rendered wrong (dashboard-side issue) — never both at once. The
troubleshooting section walks through both paths.

---

## 3. Where everything lives

> **Note for first time:** every URL below requires sign-in. Todd has
> access to the dashboard URL only. Other systems require the project
> owner's account.

| System | URL | Purpose |
|---|---|---|
| **Dashboard (production)** | `https://<your-vercel-url>` | The bookmarkable site. Replace `<your-vercel-url>` with the actual Vercel deployment URL. |
| **Source code** | `https://github.com/Historfic/inventory-dashboard` | Every line of the dashboard. Edit, commit, push → Vercel auto-deploys. |
| **Pipeline (n8n)** | `https://gogreen.app.n8n.cloud/workflow/tLvIuvkmtztVT9JZ` | The "Branch Report Pipeline" workflow. Imports → cleans → writes to Supabase. |
| **Database (Supabase)** | `https://supabase.com/dashboard/project/iijqoarquipovpfhkbvz` | Live data, SQL editor, table editor, logs. |
| **Drive folders** | `https://drive.google.com/drive/folders/<folder-id>` | Four sibling folders (Inventory, GMROI, Freight, Line Counts). The ERP drops CSVs here. |
| **Hosting (Vercel)** | `https://vercel.com/<account>/inventory-dashboard` | Build logs, deployment history, environment variables. |
| **AI provider (Anthropic)** | `https://console.anthropic.com` | Billing, API key management, usage. |

---

## 4. The data pipeline (n8n)

One workflow does everything: **Branch Report Pipeline**
(ID `tLvIuvkmtztVT9JZ`). It has five parallel branches, one per report
type.

### Schedule

- Triggered every month by the Schedule Trigger node (top of workflow).
- The Inventory branch effectively runs daily because the source files
  are daily, and the "Skip If Already Loaded" check inside the branch
  short-circuits when today's data is already in Supabase.
- The other branches (GMROI, Freight, Line Counts, Buy Line) run monthly
  because the files are monthly.

### What each branch does

```
Schedule Trigger
    ├── List Branch Files (Inventory)        → Split → Metadata Parser  → Cleaner → Supabase upsert
    ├── List Branch Files1 (Line Counts)     → Split → Metadata Parser1 → Cleaner → Supabase upsert
    ├── List Branch Files2 (GMROI)           → Split → Metadata Parser2 → Cleaner → Supabase upsert
    ├── List Branch Files3 (Inbound Freight) → Split → Metadata Parser3 → Cleaner → Supabase upsert
    └── List Branch Files4 (Buy Line buyers) → Split → Metadata Parser4 → Cleaner → Supabase upsert
```

Each branch:

1. **List Files** — Google Drive node that lists the CSVs in that folder.
2. **Split Files** — fan out into one item per file.
3. **Metadata Parser** — extracts the date and branch from the filename
   (filenames look like `20260508_Br1_DOC#20483964.CSV`). On the monthly
   parsers, also filters out files older than `MAX_AGE_DAYS = 35`.
4. **Surgical CSV Cleaner** — reads the CSV, sanitizes it (handles
   embedded commas, deduplicates, fills missing values per the schema),
   produces a clean array of rows.
5. **Supabase HTTP upsert** — inserts the rows. The composite key
   (`report_date`, `branch_id`, `buy_line` or similar) means re-runs
   replace existing rows safely; nothing duplicates.

### Important conventions

- **File names** must start with a month name (e.g. `July …`, `Jul …`),
  not a date. The Metadata Parser nodes tokenize the file name and take
  the first token that matches a month name/abbreviation; everything is
  normalized to the 1st of that month (`report_date = YYYY-MM-01`) so
  trend lines sort by the period the data represents, not the date it
  was uploaded. Days Out files additionally carry the branch as the
  token right after the month (`HAS_BRANCH = true` on that parser only —
  every other branch pulls its branch value from the CSV content
  instead, via its Cleaner node).
- **Year in the file name is optional but should not be.** The parser
  looks for an embedded `YYYYMMDD` date code first, then a bare 4-digit
  `20xx` year anywhere in the name, and only falls back to the current
  calendar year if neither is present. **Reminder for Oliver:** keep
  *some* year marker in every file name even under the new month-title
  convention (a bare 4-digit year is enough) — without one, files from
  different years but the same month (e.g. "July" 2026 vs "July" 2027)
  can't be told apart for chronological sorting once more than one
  year of history has accumulated.
- **Archive / Test / Bad folders are excluded twice**: once by the
  `List Branch Files` Drive query itself, and again inside each
  Metadata Parser as a belt-and-suspenders check on the file's path/
  folder metadata — so a misconfigured Drive query can't leak files
  from those folders into Supabase.
- **`MAX_AGE_DAYS = 35`** on the monthly parsers. Files older than that
  are skipped. Set to 35 to cover a one-month cadence with slack.
- **`buy_line='Grand Totals'`** is a special label the GMROI report uses
  on the per-branch and All-Branches summary rows at the bottom of the
  file. The dashboard reads these directly for the Turns scorecards and
  the by-Branch table.

---

## 5. The database (Supabase)

> Project ref: `iijqoarquipovpfhkbvz`

### Tables (permanent, append-only)

| Table | What's in it | Cadence |
|---|---|---|
| `branch_stock_reports` | Inventory: one row per (date, branch, item). | Daily |
| `branch_gmroi_reports` | GMROI: one row per (date, branch, buy_line) + Grand Totals rows. | Monthly |
| `branch_inbound_freight_reports` | Freight: one row per PO line item. | Monthly |
| `branch_line_count_reports` | Line counts: one row per (date, writer, line_type). | Monthly |
| `branch_buy_line_buyers` | The buy_line → buyer assignment from Oliver's separate Drive file. | Monthly |

### Views (always-current snapshots)

The dashboard always reads from these views, not the underlying tables.
Each one filters to the latest `report_date` in the underlying table:

- `latest_inventory_snapshot`
- `latest_gmroi_snapshot`
- `latest_inbound_freight_snapshot`
- `latest_line_counts_snapshot`
- `latest_buy_line_buyers`

This prevents the dashboard from accidentally summing data across multiple
days.

### Row Level Security

RLS is **off** for these tables; the anon (browser) key has `SELECT`
permissions on the views. This is appropriate because the data is non-PII
and the URL itself is private. If RLS gets turned on later, the dashboard
will silently return zero rows everywhere — this is the #1 silent failure
mode and is documented in `CLAUDE.md §3`.

### The "Grand Totals" pattern (GMROI specifically)

Oliver's GMROI CSV contains per-buy_line rows AND a block of "Grand
Totals" rows at the bottom (one per branch, plus one for "All Branches").
The dashboard:

- **by-Branch table** reads the 9 per-branch Grand Totals rows directly.
- **Scorecards** read the single All-Branches Grand Totals row directly.
- **by-Buy-Line and by-Buyer tables** use the per-buy_line "All Branches"
  rollup rows (one per buy_line).

This means the dashboard's numbers match Oliver's source sheet exactly,
because we're reading the ERP's own pre-computed totals instead of
re-summing in JavaScript.

---

## 6. The dashboard pages

### Days Out (`/`)

- **Filter bar**: branch multiselect, date range, "hide UNASSIGNED" toggle.
- **Executive Brief card** (top): AI-written 2-paragraph summary.
- **Alerts panel**: critical and warning rules firing on the current view.
  Each alert has a "Why this matters →" expander backed by Claude.
- **Bottlenecks panel**: top 5 buy lines / top 3 buyers under pressure.
- **Scorecards**: Revenue at Risk (`SUM(hits)`), Critical Fires
  (row count).
- **Bar chart**: Days Out by Buyer (avg stockout %, descending). Click a
  bar to filter the whole page.
- **Buyer Summary + Buyer × Buy Line tables**: clickable, cross-filtering.
- **Purchase Days Out table** (bottom): extended granular data — the
  closest thing to the raw report.

### Turns (`/gmroi`)

- **4 scorecards**: Annual COGS$, Avg $OnHand, Turns, Adjusted Margin%.
  All read from the ERP's "All Branches" Grand Totals row.
- **GMROI by Buyer table**: each buyer's portfolio summed from their
  buy_lines' All-Branches rollups.
- **GMROI by Buy Line table**: one row per buy_line (all branches).
- **GMROI by Branch table**: one row per branch, sorted numerically by
  branch ID.

### Inbound Freight (`/freight`)

- 3 overview scorecards.
- "Freight % of Order by Writer" bar chart (dollar-weighted ratio).
- By Vendor + By Writer tables (sortable).
- High Inbound % Orders (filtered to inbound_pct ≥ 20%).

### Line Counts (`/line-counts`)

- 4 scorecards (PO / SO / Direct / Transfer line totals).
- Stacked bar chart by Writer.
- Pivot table by Writer × line type.

### Navigation order

Top nav left-to-right: **Days Out | Turns | Line Counts | Inbound Freight**.

---

## 7. AI features

Both AI features live on the Days Out page only. Both call Anthropic's API
**from server-side route handlers** in Next.js — the API key never reaches
the browser. The model is `claude-haiku-4-5` (chosen for cost; each call
sends a few hundred tokens of pre-aggregated stats).

### Daily Executive Brief

- Endpoint: `/api/brief`
- Component: `components/ai/ExecutiveBriefCard.tsx`
- Caches in-memory for 24 hours per snapshot fingerprint. Repeat page
  loads don't re-hit Anthropic.

### Alert Explainer

- Endpoint: `/api/explain`
- Used inside `components/alerts/AlertCard.tsx` when the user clicks
  "Why this matters →". Lazily fetched — costs nothing if not clicked.

### Adjusting the prompts

System prompts live as `SYSTEM_PROMPT` constants at the top of each route
file. Edit there, save, hot-reload in dev. After a prompt change, restart
the server to clear the in-memory cache (or wait 24 hours).

### Cost

Daily Brief: 1 call per unique snapshot per server instance per day ≈
fewer than a dozen calls per month on Haiku 4.5. Explainer: opt-in, only
fires when clicked. Monthly cost is negligible (under $1/month at
expected usage).

---

## 8. How to make common changes

### Change a column header on a table

1. Open the table component, e.g. `components/gmroi/GmroiByBranchTable.tsx`.
2. Find the `columns` array. Each entry has a `header: "…"` field.
3. Change the string. Commit, push, Vercel deploys in ~30 seconds.

### Add a new column to an existing table

1. Make sure the underlying database column exists (or aggregate it from
   existing columns in the aggregation function under `lib/`).
2. Add it to the relevant aggregation function (e.g.,
   `lib/gmroi-aggregations.ts`).
3. Add it to the table's `columns` array.
4. Commit + push.

### Change a calculation

1. Find the aggregation function in `lib/` (e.g.
   `lib/gmroi-aggregations.ts`).
2. Update the math. Note that **ratios (Turns, Margin%) should be
   dollar-weighted, not simple averages** — see `CLAUDE.md §4.1`.
3. Spot-check by querying Supabase directly with the same logic and
   confirming the dashboard matches.

### Add a new buyer assignment

1. Oliver updates the buyer-assignment CSV in Drive.
2. Trigger the workflow manually in n8n (or wait for the monthly run).
3. New buyer mappings appear in `latest_buy_line_buyers` and propagate
   into the GMROI by-Buyer table automatically.

### Update n8n workflow code (Owner Mode only)

Per `CLAUDE.md §2.5-A`, n8n edits follow these rules:

1. **Announce** the change before making it (what you're touching, the
   impact).
2. **Read before write** — open the node, understand it before editing.
3. **One change at a time** — never batch multiple workflow edits.
4. **Verify after** — execute the workflow once to confirm the change
   worked.
5. **For high-risk actions** (deleting workflows, modifying the upsert
   node, modifying credentials, triggering production runs), pause for
   explicit confirmation first.

### Roll back a bad change

1. On GitHub: find the previous good commit. Copy its SHA.
2. Locally: `git revert <SHA>` then `git push`. Vercel auto-redeploys
   the rollback.
3. If the n8n side is involved, n8n keeps version history in its UI —
   open the workflow, click the version selector top-right, restore the
   previous version.

### Add a new dashboard page

1. Create `app/<route-name>/page.tsx`.
2. Add a hook in `hooks/` that fetches from the relevant Supabase view.
   Use `fetchAllPages` from `lib/fetchAllPages.ts` to avoid the 1,000-row
   default cap.
3. Add the new route to `components/Navigation.tsx`.
4. Commit + push.

---

## 9. Troubleshooting

### Dashboard shows old numbers / no numbers

- **Hard refresh the page**: `Ctrl+Shift+R` (Win) or `Cmd+Shift+R` (Mac).
  Browser cache is the most common cause of "old numbers."
- **Check Vercel deployment status**: the deployment for the latest
  commit should say "Ready." If it says "Building" or "Failed", check
  the build logs.
- **Check Supabase has the data**: open the SQL editor in Supabase and
  query the relevant view. If the row count is 0 or the snapshot date
  is stale, the pipeline didn't run successfully.

### Pipeline ran but no new data in Supabase

- Open the latest execution in n8n. Find which node returned empty
  output.
- **Metadata Parser returns "No items"** → most likely cause:
  - File age too old. Check `MAX_AGE_DAYS` constant in the node.
  - File name doesn't start with `YYYYMMDD_`. Rename in Drive.
  - Duplicate file (e.g. "Copy of …") that fails to parse and gets
    filtered.
- **Supabase upsert returns an error** → click the node, read the error.
  Most common: composite key conflict (means a row that should be unique
  isn't), or the column count in the upsert doesn't match the table
  schema (means the cleaner produced bad data).

### n8n cache stale after editing nodes via API

If you edit a node via API (instead of the UI), n8n sometimes keeps the
old code cached in its worker processes. Symptom: workflow runs use the
old code even though the stored definition shows the new code.

Fix: open the workflow in the n8n editor UI, click any node, make a
trivial change (extra space), and save. That triggers the cache
invalidation.

### Numbers don't match Oliver's source sheet

Two possibilities, in order of likelihood:

1. The dashboard is aggregating in JavaScript when it should be reading
   a pre-computed rollup row directly. See section 5's "Grand Totals
   pattern" — the by-Branch and scorecards views read those directly.
2. The cleaner is mapping the wrong CSV column to the wrong DB column.
   Verify with a sample row: pick one record visible in both Oliver's
   sheet and Supabase, compare field by field.

### Anthropic API errors (AI features unavailable)

- 401 Unauthorized → API key invalid or expired. Rotate in
  `console.anthropic.com`, update in Vercel project settings, redeploy.
- 429 Rate limit → wait a few minutes. The dashboard keeps working;
  only the AI cards show errors.
- 500 from Anthropic → check status page. Dashboard still works.

---

## 10. Monthly maintenance checklist

Run this at the start of each month after the new monthly reports arrive:

- [ ] Confirm the new monthly files are in Drive (GMROI, Freight, Line
      Counts, Buy Line). Look for the latest `YYYYMMDD_…CSV` files.
- [ ] Check there are no `Copy of …` duplicates in any of the four
      monthly folders.
- [ ] Open n8n and click **Execute Workflow** on the Branch Report
      Pipeline. Watch each branch reach the Supabase upsert node.
- [ ] Verify in Supabase that `latest_gmroi_snapshot`,
      `latest_inbound_freight_snapshot`, `latest_line_counts_snapshot`,
      and `latest_buy_line_buyers` all show a fresh `report_date`.
- [ ] Open the dashboard, hard-refresh each page, and confirm numbers
      changed. Spot-check 1-2 values against Oliver's source sheets.

If anything fails, see Troubleshooting above.

---

## 11. Access, accounts, and credentials

| System | Account holder | Key location |
|---|---|---|
| GitHub | Project owner | Personal GitHub account |
| Vercel | Project owner | Project Settings → Environment Variables holds the two Supabase keys and the Anthropic API key |
| Supabase | Project owner | Anon key in `.env.local` (gitignored). Service-role key never used in frontend per CLAUDE.md §9. |
| n8n.cloud | Project owner | API tokens in n8n Settings → API. Created on demand for automated edits, rotated after. |
| Google Drive | Oliver + project owner | OAuth credential stored in n8n Google Drive node config |
| Anthropic | Project owner | Console → API Keys. Used server-side only. |

### Environment variables (Vercel)

The dashboard needs three env vars in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL` — the Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the anon key (read-only on views)
- `ANTHROPIC_API_KEY` — server-side only, no `NEXT_PUBLIC_` prefix

Set them in all three environments (Production, Preview, Development).
Local development uses `.env.local` (not committed).

### Credential rotation

- **Supabase anon key**: rotate from Supabase dashboard → Settings → API.
  Update Vercel env var. Redeploy.
- **Anthropic API key**: rotate from console.anthropic.com. Update
  Vercel. Redeploy.
- **n8n temp API tokens**: created per-task, rotated immediately after
  the work that needed them.

---

## 12. Glossary

| Term | Meaning |
|---|---|
| **Buy line** | An ERP grouping of product SKUs by brand/category (e.g. X-MOEN, X-TOTO). One buyer typically owns one or more buy lines. |
| **Buyer** | A team member responsible for ordering products in their assigned buy lines. The Days Out and Turns pages group by buyer. |
| **Branch** | A physical store location. Encoded numerically (1, 2, 3, 4, 6, 7, 8, 9, 11). |
| **Annual COGS$** | Annualized cost of goods sold. From Oliver's GMROI report's "Annual COGS$" column. Stored in DB column `cogs_dollars_adjusted`. |
| **Actual COGS$** | Year-to-date cost of goods sold. Different from Annual COGS$. Stored in DB column `cogs_dollars`. |
| **Turns** | Inventory turnover — how many times a year inventory is sold and replaced. Should be dollar-weighted: SUM(Annual COGS$) / SUM(Avg $OnHand). |
| **Adjusted Margin%** | Gross margin adjusted for freight, transfers, etc. — exact formula owned by Oliver's ERP. |
| **Stockout %** | Share of the lookback period an item was out of stock (0 to 1). |
| **Days Out** | Consecutive days an item has been out of stock right now. |
| **UNASSIGNED** | A buyer label applied when no owner is assigned to a buy_line. The dashboard's UNASSIGNED toggle hides these. |
| **Grand Totals** | The summary rows at the bottom of Oliver's GMROI report — one per branch plus one for All Branches. The dashboard reads these directly for the Turns page scorecards and by-Branch table. |
| **All Branches rollup** | Per-buy_line summary rows in the GMROI report (`branch_id = "All Branches"`). Used by the by-Buy-Line and by-Buyer tables. |
| **MAX_AGE_DAYS** | The age cutoff in n8n's Metadata Parser nodes. Files older than this are filtered out. Set to 35 days for monthly pipelines. |
| **`fetchAllPages`** | Utility in `lib/fetchAllPages.ts` that paginates Supabase queries past the 1,000-row default cap. Every data hook uses this. |
| **`CLAUDE.md`** | A detailed contract document in the repo that governs how AI assistants (and developers) work in the project. Read it before non-trivial changes. |

---

## Quick reference card

| Need to… | Look here |
|---|---|
| See the live dashboard | The Vercel URL Todd has bookmarked |
| Read the code | github.com/Historfic/inventory-dashboard |
| Edit the pipeline | n8n.cloud → Branch Report Pipeline workflow |
| Query the database | Supabase → SQL Editor |
| Trigger a pipeline run | n8n → workflow → "Execute Workflow" button |
| Check why a number is wrong | Section 9 ("Troubleshooting") |
| Add a new column | Section 8 ("How to make common changes") |
| Understand a term | Section 12 ("Glossary") |
| See the technical contract | `CLAUDE.md` in the repo (more detailed than this doc) |

---

*End of document. Last reviewed: 2026-05-23. When updating this file,
also update the "Last updated" line at the top.*
