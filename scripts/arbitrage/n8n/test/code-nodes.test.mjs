// Runs the n8n Code-node sources locally with a mocked n8n runtime.
// Usage: node n8n/test/code-nodes.test.mjs [--live]   (--live scrapes 3 real products)
import { readFileSync } from 'node:fs';
import https from 'node:https';
import assert from 'node:assert/strict';

const code = (name) => readFileSync(new URL(`../code/${name}.js`, import.meta.url), 'utf8');
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

// Executes a Code node body with $input / $ / $helpers mocked.
async function runNode(name, { input = [], nodes = {}, helpers } = {}) {
  const $input = { all: () => input, first: () => input[0] };
  const $ = (nodeName) => {
    if (!(nodeName in nodes)) throw new Error(`Referenced node is unexecuted: ${nodeName}`);
    const items = nodes[nodeName];
    return { isExecuted: true, first: () => items[0], all: () => items };
  };
  // URL is shadowed because the n8n Code-node sandbox doesn't provide it.
  const fn = new AsyncFunction('$input', '$', '$helpers', 'URL', code(name));
  return fn.call({ helpers }, $input, $, helpers, undefined);
}

// n8n's helpers.httpRequest is axios over node:https, so mimic that (undici
// fetch adds sec-fetch-* headers that Cloudflare treats differently).
const fetchHelper = {
  httpRequest: ({ url, headers }) => new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return fetchHelper.httpRequest({ url: new URL(res.headers.location, url).href, headers }).then(resolve, reject);
      }
      if (res.statusCode >= 400) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve(body));
    }).on('error', reject);
  }),
};

let passed = 0;
const test = async (label, fn) => { await fn(); passed++; console.log(`  ok  ${label}`); };

// ---------------------------------------------------------------- Run Config
const cfgDefault = (await runNode('run-config', { input: [{ json: {} }] }))[0].json;
await test('run-config: manual run uses defaults', () => {
  assert.equal(cfgDefault.trigger, 'manual');
  assert.equal(cfgDefault.max_products, 10);
  assert.equal(cfgDefault.config_error, null);
});
await test('run-config: webhook body + cap on max_products', async () => {
  const [{ json }] = await runNode('run-config', { input: [{ json: { headers: {}, body: { category_url: 'https://www.plumbersstock.com/kitchen/faucets.html?x=1', max_products: 500 } } }] });
  assert.equal(json.trigger, 'dashboard');
  assert.equal(json.category_url, 'https://www.plumbersstock.com/kitchen/faucets.html');
  assert.equal(json.max_products, 20);
});
await test('run-config: rejects non-supplier hosts', async () => {
  const [{ json }] = await runNode('run-config', { input: [{ json: { headers: {}, body: { category_url: 'http://169.254.169.254/latest' } } }] });
  assert.match(json.config_error, /plumbersstock/);
});

// ------------------------------------------------------- Scrape (live, opt-in)
if (process.argv.includes('--live')) {
  await test('scrape-supplier: live category + 3 products', async () => {
    const [{ json }] = await runNode('scrape-supplier', { input: [{ json: { ...cfgDefault, max_products: 3 } }], helpers: fetchHelper });
    console.log('      ', JSON.stringify(json.products.map((p) => [p.upc, p.cost_price, p.stock_status, p.supplier_mpn])), json.scrape_errors);
    assert.equal(json.products_scraped, 3);
    assert.ok(json.upc_count >= 1);
  });
}

// ------------------------------------------------------------------ Sanitizer
const supplierItem = {
  products: [
    { upc: '026508404911', cost_price: 50, supplier_title: 'Moen 6706BN', supplier_url: 'u1', supplier_sku: '1', supplier_mpn: '6706BN', in_stock: true, stock_status: 'InStock', image_url: null },
    { upc: '034449000000', cost_price: 100, supplier_title: 'Delta X', supplier_url: 'u2', supplier_sku: '2', supplier_mpn: 'X', in_stock: false, stock_status: 'OutOfStock', image_url: null },
  ],
  products_scraped: 2, products_with_upc: 2, upc_count: 2, upc_csv: '026508404911,034449000000', scrape_errors: [],
};
const keepaNow = Math.floor(Date.now() / 60000) - 21564000; // "now" in Keepa minutes
const statsCurrent = Array(20).fill(-1);
statsCurrent[3] = 12000; statsCurrent[11] = 7; statsCurrent[1] = 11000;
const keepaBody = {
  tokensLeft: 30, tokensConsumed: 6,
  products: [
    { asin: 'B000TEST01', title: 'Moen Genta', brand: 'Moen', upcList: ['026508404911'], eanList: ['0026508404911'],
      referralFeePercentage: 15, fbaFees: { pickAndPackFee: 750 }, lastUpdate: keepaNow - 30, categoryTree: [{ name: 'Tools & Home Improvement' }],
      stats: { buyBoxPrice: 11999, buyBoxShipping: 0, buyBoxIsFBA: true, buyBoxIsAmazon: false, current: statsCurrent, avg30: [ -1, -1, -1, 15000 ], avg90: [ -1, -1, -1, -2 ] } },
    { asin: 'B000TEST02', title: 'Delta X', upcList: ['034449000000'], fbaFees: null,
      stats: { buyBoxPrice: -1, current: [ -1, 10500, -1, -1 ], avg30: [], avg90: [] } },
    { asin: 'B000NOMATCH', upcList: ['999'], stats: {} },
  ],
};
const cfg = { ...cfgDefault };
const sanitize = (keepaJson, scrape = supplierItem) => runNode('arbitrage-sanitizer', {
  nodes: { 'Run Config': [{ json: cfg }], 'Scrape Supplier Catalog': [{ json: scrape }], ...(keepaJson ? { 'Keepa Product Lookup': [{ json: keepaJson }] } : {}) },
});

await test('sanitizer: economics + -1/-2 cleaning (nested Keepa JSON)', async () => {
  const [{ json }] = await sanitize({ statusCode: 200, body: keepaBody });
  const [moen, delta] = json.rows;
  assert.equal(json.rows.length, 2);
  // 119.99 - (18.00 referral + 7.50 FBA + 0 prep) - 50 cost = 44.49
  assert.equal(moen.buy_box_price, 119.99);
  assert.equal(moen.referral_fee, 18);
  assert.equal(moen.fba_fee, 7.5);
  assert.equal(moen.net_profit, 44.49);
  assert.equal(moen.roi_pct, 88.98);
  assert.equal(moen.net_margin_pct, 37.08);
  assert.equal(moen.is_profitable, true);
  assert.equal(moen.bsr_current, 12000);
  assert.equal(moen.bsr_avg_30, 15000);
  assert.equal(moen.bsr_avg_90, null); // -2 -> null
  assert.equal(moen.new_offer_count, 7);
  assert.equal(moen.fba_fee_estimated, false);
  assert.equal(moen.is_stale, false);
  assert.equal(delta.is_stale, true); // no lastUpdate -> can't trust it
  // Delta: no buy box -> falls back to lowest NEW price, default fees, unprofitable
  assert.equal(delta.price_source, 'new');
  assert.equal(delta.buy_box_price, 105);
  assert.equal(delta.fba_fee_estimated, true);
  assert.equal(delta.is_profitable, false);
  assert.equal(delta.bsr_current, null);
  // PostgREST bulk upsert needs identical keys on every row
  assert.deepEqual(Object.keys(moen), Object.keys(delta));
  assert.equal(json.run.status, 'success');
  assert.equal(json.run.profitable, 1);
  assert.equal(json.run.keepa_tokens_left, 30);
});

await test('sanitizer: flat-mapped Keepa JSON gives identical rows', async () => {
  const flat = {};
  const walk = (obj, prefix) => {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object') walk(v, key); else flat[key] = v;
    }
  };
  walk(keepaBody, '');
  assert.ok('products.0.stats.current.3' in flat);
  const [{ json: nested }] = await sanitize({ statusCode: 200, body: keepaBody });
  const [{ json: flattened }] = await sanitize({ statusCode: 200, body: flat });
  // updated_at is a wall-clock timestamp, so drop it before comparing.
  const strip = (rows) => rows.map((r) => { const copy = { ...r }; delete copy.updated_at; return copy; });
  assert.deepEqual(strip(flattened.rows), strip(nested.rows));
});

await test('sanitizer: stale Keepa snapshot is never profitable', async () => {
  const fiveMonthsAgo = keepaNow - 150 * 24 * 60;
  const staleBody = { ...keepaBody, products: [{ ...keepaBody.products[0], lastUpdate: fiveMonthsAgo }] };
  const [{ json }] = await sanitize({ statusCode: 200, body: staleBody });
  const [row] = json.rows;
  assert.equal(row.roi_pct, 88.98); // economics still shown
  assert.equal(row.is_stale, true);
  assert.equal(row.is_profitable, false);
  assert.equal(json.run.profitable, 0);
});

await test('sanitizer: Keepa 429 -> error run, no rows', async () => {
  const [{ json }] = await sanitize({ statusCode: 429, body: { tokensLeft: -12, refillIn: 30000 } });
  assert.equal(json.rows.length, 0);
  assert.equal(json.run.status, 'error');
  assert.match(json.run.error, /out of tokens/);
  assert.equal(json.run.keepa_tokens_left, -12);
});

await test('sanitizer: missing credential error is reported clearly', async () => {
  const [{ json }] = await sanitize({ error: { message: 'Credentials not found' } });
  assert.match(json.run.error, /API key missing or invalid/);
});

await test('sanitizer: no UPCs -> Keepa skipped, run still logged', async () => {
  const [{ json }] = await sanitize(null, { ...supplierItem, products: [], upc_count: 0, upc_csv: '', scrape_errors: ['No product list found on category page'] });
  assert.equal(json.rows.length, 0);
  assert.equal(json.run.status, 'error');
});

// --------------------------------------------------------------- Finalize Run
await test('finalize-run: upsert failure marks run as error', async () => {
  const [{ json }] = await runNode('finalize-run', {
    input: [{ json: { statusCode: 400, body: { message: 'bad' } } }],
    nodes: { 'Arbitrage Sanitizer': [{ json: { run: { status: 'success', error: null } } }] },
  });
  assert.equal(json.run.status, 'error');
  assert.match(json.run.error, /upsert failed \(400\)/);
  assert.ok(json.run.finished_at);
});

console.log(`\n${passed} passed`);
