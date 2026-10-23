# Arbitrage pipeline (scripts/arbitrage)

Source of truth for the n8n **Arbitrage Sourcing Pipeline** behind the
`/arbitrage` page, plus its Supabase schema. Rules and data flow: `CLAUDE.md` §19.

| Path | What |
|---|---|
| `n8n/code/*.js` | Every Code node in the workflow. Edit here, not in the n8n editor. |
| `n8n/deploy.mjs` | Builds the workflow from `code/`, creates/updates it via the n8n API, activates it. |
| `n8n/deploy-state.json` | n8n credential IDs + workflow ID (no secrets). |
| `n8n/arbitrage-sourcing.workflow.json` | Last built workflow (written by `--dry-run`), for review/diffs. |
| `n8n/test/code-nodes.test.mjs` | Code-node tests with a mocked n8n runtime (`--live` scrapes 3 real products). |
| `supabase/migrations/*.sql` | `arbitrage_leads`, `sourcing_runs`, the `is_stale` column, anon read policy. Applied to project `mvsjswojnwhokqpkgxfq`. |

```bash
# from the repo root
node scripts/arbitrage/n8n/test/code-nodes.test.mjs
node scripts/arbitrage/n8n/deploy.mjs --dry-run   # build only
node scripts/arbitrage/n8n/deploy.mjs             # push to n8n (reads ARBITRAGE_* from .env.local)
```

Trigger a run without the dashboard:

```bash
curl -X POST "$ARBITRAGE_N8N_WEBHOOK_URL" -H "x-arbitrage-secret: $ARBITRAGE_N8N_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"category_url":"https://www.plumbersstock.com/clearance-deals.html","max_products":8}'
```

Optional body fields: `min_roi_pct` (30), `min_profit` (3), `prep_cost` (0), `max_data_age_days` (7).
