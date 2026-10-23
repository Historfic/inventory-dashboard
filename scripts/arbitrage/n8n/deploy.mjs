// Builds the "Arbitrage Sourcing Pipeline" workflow from code/*.js and
// creates/updates it on the n8n instance via the public API, then activates it.
// Credentials are created once and their IDs kept in deploy-state.json.
// This is a SEPARATE workflow from the Branch Report Pipeline (tLvIuvkmtztVT9JZ);
// it never reads or edits that one.
//
// Usage (from the repo root): node scripts/arbitrage/n8n/deploy.mjs [--dry-run]
// Reads ARBITRAGE_* variables from the repo's .env.local (see CLAUDE.md §19).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const repoRoot = new URL('../../../', import.meta.url);
const statePath = new URL('deploy-state.json', import.meta.url);
const dryRun = process.argv.includes('--dry-run');

const env = Object.fromEntries(
  readFileSync(new URL('.env.local', repoRoot), 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim().replace(/^"(.*)"$/, '$1')]),
);
const need = (key) => {
  if (!env[key]) throw new Error(`Missing ${key} in .env.local`);
  return env[key];
};
const N8N_API_URL = need('ARBITRAGE_N8N_API_URL');
const N8N_API_KEY = need('ARBITRAGE_N8N_API_KEY');
const N8N_BASE_URL = N8N_API_URL.replace(/\/api\/v1\/?$/, '');
const SUPABASE_URL = need('NEXT_PUBLIC_ARBITRAGE_SUPABASE_URL');

const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : { credentials: {} };
const saveState = () => writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

async function n8n(method, path, body) {
  const res = await fetch(`${N8N_API_URL}${path}`, {
    method,
    headers: { 'X-N8N-API-KEY': N8N_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}

// `data` is a function so secrets are only required when a credential has to be
// created; once its ID is in deploy-state.json the secret isn't needed again.
async function ensureCredential(key, name, type, data) {
  if (state.credentials[key]) return state.credentials[key];
  if (dryRun) return { id: `dry-${key}`, name };
  const created = await n8n('POST', '/credentials', { name, type, data: data() });
  state.credentials[key] = { id: created.id, name: created.name };
  saveState();
  console.log(`created credential ${name} (${created.id})`);
  return state.credentials[key];
}

// Stable node IDs so updates don't churn the workflow.
const nodeId = (name) => {
  const h = createHash('sha1').update(`arbitrage:${name}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
};
const code = (file) => readFileSync(new URL(`code/${file}.js`, import.meta.url), 'utf8');
const fullResponse = { response: { response: { fullResponse: true, neverError: true } } };

const keepaCred = await ensureCredential('keepa', 'Keepa API - Arbitrage', 'httpQueryAuth', () => ({ name: 'key', value: need('ARBITRAGE_KEEPA_API_KEY') }));
const supabaseCred = await ensureCredential('supabase', 'Supabase - Arbitrage Engine', 'supabaseApi', () => ({ host: SUPABASE_URL, serviceRole: need('ARBITRAGE_SUPABASE_SECRET_KEY') }));
const webhookCred = await ensureCredential('webhook', 'Arbitrage Dashboard Webhook Secret', 'httpHeaderAuth', () => ({ name: 'x-arbitrage-secret', value: need('ARBITRAGE_N8N_WEBHOOK_SECRET') }));

const node = (name, type, typeVersion, position, parameters, extra = {}) => ({ id: nodeId(name), name, type, typeVersion, position, parameters, ...extra });

const nodes = [
  node('About', 'n8n-nodes-base.stickyNote', 1, [-40, -260], {
    width: 760,
    height: 200,
    content: '## Arbitrage Sourcing Pipeline\nPlumbersStock category → product UPCs → **one bulk Keepa call** → ROI / margin vs Buy Box minus fees → upsert `arbitrage_leads` → log `sourcing_runs`.\n\nTriggered by the inventory dashboard /arbitrage page (POST webhook, header `x-arbitrage-secret`) or **Manual Run**. Body: `{ category_url, max_products, min_roi_pct, min_profit, prep_cost }`.\nKeepa cost ≈ 3 tokens per matched product (1 + 2 for Buy Box). Code lives in github.com/Historfic/inventory-dashboard under `scripts/arbitrage/n8n/code/` — edit there and run `node scripts/arbitrage/n8n/deploy.mjs`.',
  }),
  node('Dashboard Webhook', 'n8n-nodes-base.webhook', 2, [0, 0], {
    httpMethod: 'POST',
    path: 'arbitrage-sourcing',
    authentication: 'headerAuth',
    responseMode: 'onReceived',
    options: {},
  }, { webhookId: nodeId('webhook-path'), credentials: { httpHeaderAuth: webhookCred } }),
  node('Manual Run', 'n8n-nodes-base.manualTrigger', 1, [0, 200], {}),
  node('Run Config', 'n8n-nodes-base.code', 2, [240, 100], { mode: 'runOnceForAllItems', jsCode: code('run-config') }),
  node('Scrape Supplier Catalog', 'n8n-nodes-base.code', 2, [480, 100], { mode: 'runOnceForAllItems', jsCode: code('scrape-supplier') }),
  node('Has UPCs?', 'n8n-nodes-base.if', 2.2, [720, 100], {
    conditions: {
      options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
      conditions: [{ id: nodeId('has-upcs-cond'), leftValue: '={{ $json.upc_count }}', rightValue: 0, operator: { type: 'number', operation: 'gt' } }],
      combinator: 'and',
    },
    looseTypeValidation: true,
    options: {},
  }),
  node('Keepa Product Lookup', 'n8n-nodes-base.httpRequest', 4.2, [960, 0], {
    url: 'https://api.keepa.com/product',
    authentication: 'genericCredentialType',
    genericAuthType: 'httpQueryAuth',
    sendQuery: true,
    queryParameters: {
      parameters: [
        { name: 'domain', value: '1' },
        { name: 'code', value: '={{ $json.upc_csv }}' },
        { name: 'stats', value: '90' },
        { name: 'buybox', value: '1' },
        { name: 'history', value: '0' },
      ],
    },
    options: { ...fullResponse, timeout: 60000 },
  }, { credentials: { httpQueryAuth: keepaCred }, onError: 'continueRegularOutput' }),
  node('Arbitrage Sanitizer', 'n8n-nodes-base.code', 2, [1200, 100], { mode: 'runOnceForAllItems', jsCode: code('arbitrage-sanitizer') }),
  node('Upsert Leads to Supabase', 'n8n-nodes-base.httpRequest', 4.2, [1440, 100], {
    method: 'POST',
    url: `${SUPABASE_URL}/rest/v1/arbitrage_leads?on_conflict=upc,asin`,
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'supabaseApi',
    sendHeaders: true,
    headerParameters: { parameters: [{ name: 'Prefer', value: 'resolution=merge-duplicates,return=minimal' }] },
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ JSON.stringify($json.rows) }}',
    options: fullResponse,
  }, { credentials: { supabaseApi: supabaseCred }, onError: 'continueRegularOutput' }),
  node('Finalize Run Log', 'n8n-nodes-base.code', 2, [1680, 100], { mode: 'runOnceForAllItems', jsCode: code('finalize-run') }),
  node('Log Run to Supabase', 'n8n-nodes-base.httpRequest', 4.2, [1920, 100], {
    method: 'POST',
    url: `${SUPABASE_URL}/rest/v1/sourcing_runs`,
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'supabaseApi',
    sendHeaders: true,
    headerParameters: { parameters: [{ name: 'Prefer', value: 'return=minimal' }] },
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ JSON.stringify($json.run) }}',
    options: fullResponse,
  }, { credentials: { supabaseApi: supabaseCred }, onError: 'continueRegularOutput' }),
];

const link = (to) => ({ node: to, type: 'main', index: 0 });
const connections = {
  'Dashboard Webhook': { main: [[link('Run Config')]] },
  'Manual Run': { main: [[link('Run Config')]] },
  'Run Config': { main: [[link('Scrape Supplier Catalog')]] },
  'Scrape Supplier Catalog': { main: [[link('Has UPCs?')]] },
  'Has UPCs?': { main: [[link('Keepa Product Lookup')], [link('Arbitrage Sanitizer')]] },
  'Keepa Product Lookup': { main: [[link('Arbitrage Sanitizer')]] },
  'Arbitrage Sanitizer': { main: [[link('Upsert Leads to Supabase')]] },
  'Upsert Leads to Supabase': { main: [[link('Finalize Run Log')]] },
  'Finalize Run Log': { main: [[link('Log Run to Supabase')]] },
};

const workflow = { name: 'Arbitrage Sourcing Pipeline', nodes, connections, settings: { executionOrder: 'v1' } };

if (dryRun) {
  writeFileSync(new URL('arbitrage-sourcing.workflow.json', import.meta.url), `${JSON.stringify(workflow, null, 2)}\n`);
  console.log('dry run: wrote n8n/arbitrage-sourcing.workflow.json');
  process.exit(0);
}

let saved;
if (state.workflowId) {
  saved = await n8n('PUT', `/workflows/${state.workflowId}`, workflow);
  console.log(`updated workflow ${saved.id}`);
} else {
  saved = await n8n('POST', '/workflows', workflow);
  state.workflowId = saved.id;
  saveState();
  console.log(`created workflow ${saved.id}`);
}
if (!saved.active) {
  await n8n('POST', `/workflows/${saved.id}/activate`);
}
console.log(`active. editor: ${N8N_BASE_URL}/workflow/${saved.id}`);
console.log(`webhook: ${N8N_BASE_URL}/webhook/arbitrage-sourcing`);
