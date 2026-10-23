// Arbitrage Sanitizer — joins supplier products with the bulk Keepa response,
// cleans Keepa sentinel values (-1 = no data, -2 = not applicable) to null,
// and computes fees, net profit, ROI and margin per (UPC, ASIN).
// Output: one item { rows: [...upsert rows], run: {...run log} }.
const KEEPA_TIME_OFFSET_MIN = 21564000; // Keepa minutes -> unix minutes
const IDX = { AMAZON: 0, NEW: 1, SALES_RANK: 3, COUNT_NEW: 11, BUY_BOX_SHIPPING: 18 };
const MIN_REFERRAL_FEE = 0.30;

const round2 = (n) => Math.round(n * 100) / 100;
const clean = (v) => {
  if (v === undefined || v === null || v === -1 || v === -2 || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const cents = (v) => { const c = clean(v); return c === null ? null : round2(c / 100); };
const at = (arr, i) => (Array.isArray(arr) ? arr[i] : undefined);
const bool = (v) => (typeof v === 'boolean' ? v : null);
const stripZeros = (code) => String(code).replace(/^0+/, '');

// Accepts nested Keepa JSON or flat-mapped keys like json["0.stats.current"].
const unflatten = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  if (!Object.keys(obj).some((k) => k.includes('.'))) return obj;
  const root = {};
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('.');
    let node = root;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) node[part] = value;
      else node = node[part] = node[part] && typeof node[part] === 'object' ? node[part] : {};
    });
  }
  const toArrays = (n) => {
    if (!n || typeof n !== 'object') return n;
    if (Array.isArray(n)) return n.map(toArrays);
    const keys = Object.keys(n);
    for (const k of keys) n[k] = toArrays(n[k]);
    return keys.length && keys.every((k) => /^\d+$/.test(k)) ? keys.sort((a, b) => a - b).map((k) => n[k]) : n;
  };
  return toArrays(root);
};

const keepaProductsFrom = (payload) => {
  let data = payload;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch (_) { return []; } }
  data = unflatten(data);
  if (Array.isArray(data?.products)) return data.products.map(unflatten);
  if (Array.isArray(data)) return data.map(unflatten);
  return [];
};

const cfg = $('Run Config').first().json;
const scrape = $('Scrape Supplier Catalog').first().json;
const errors = [...(scrape.scrape_errors || [])];
const now = new Date().toISOString();

// ---- Keepa response -------------------------------------------------------
let keepaProducts = [];
let tokensLeft = null;
let tokensConsumed = null;
try {
  let keepaNode = null;
  try { keepaNode = $('Keepa Product Lookup'); } catch (_) { keepaNode = null; }
  const executed = keepaNode && keepaNode.isExecuted !== false;
  if (scrape.upc_count > 0 && executed) {
    const res = keepaNode.first().json || {};
    const status = Number(res.statusCode ?? 200);
    let body = res.body !== undefined ? res.body : res;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { /* keep string */ } }
    tokensLeft = Number.isFinite(body?.tokensLeft) ? body.tokensLeft : null; // can legitimately be negative
    tokensConsumed = Number.isFinite(body?.tokensConsumed) ? body.tokensConsumed : null;

    if (res.error) {
      const msg = res.error.message || JSON.stringify(res.error);
      errors.push(/credential|auth|key/i.test(msg) ? `Keepa API key missing or invalid: ${msg}` : `Keepa request failed: ${msg}`);
    } else if (status === 429) {
      errors.push(`Keepa out of tokens (tokensLeft ${body?.tokensLeft}, refill in ${Math.round((body?.refillIn || 0) / 1000)}s)`);
    } else if (status >= 400 || body?.error) {
      errors.push(`Keepa HTTP ${status}: ${JSON.stringify(body?.error || body).slice(0, 300)}`);
    } else {
      keepaProducts = keepaProductsFrom(body);
    }
  }
} catch (error) {
  errors.push(`Keepa parse error: ${error.message}`);
}

// ---- Join + economics -----------------------------------------------------
const supplierByUpc = new Map(
  (scrape.products || []).filter((p) => p.upc && p.cost_price).map((p) => [stripZeros(p.upc), p]),
);
const queried = (scrape.upc_csv || '').split(',').filter(Boolean);

const rowsByKey = new Map();
for (const kp of keepaProducts) {
  try {
    if (!kp?.asin) continue;
    const codes = [...(kp.upcList || []), ...(kp.eanList || [])].map(stripZeros);
    let supplier = codes.map((c) => supplierByUpc.get(c)).find(Boolean);
    if (!supplier && queried.length === 1) supplier = supplierByUpc.get(stripZeros(queried[0]));
    if (!supplier) continue;

    const stats = kp.stats || {};
    let price = null;
    let priceSource = null;
    const bb = clean(stats.buyBoxPrice);
    if (bb !== null) {
      price = round2((bb + (clean(stats.buyBoxShipping) ?? 0)) / 100);
      priceSource = 'buy_box';
    } else if (cents(at(stats.current, IDX.BUY_BOX_SHIPPING)) !== null) {
      price = cents(at(stats.current, IDX.BUY_BOX_SHIPPING));
      priceSource = 'buy_box';
    } else if (cents(at(stats.current, IDX.NEW)) !== null) {
      price = cents(at(stats.current, IDX.NEW));
      priceSource = 'new';
    } else if (cents(at(stats.current, IDX.AMAZON)) !== null) {
      price = cents(at(stats.current, IDX.AMAZON));
      priceSource = 'amazon';
    }

    const referralPct = clean(kp.referralFeePercentage) ?? clean(kp.referralFeePercent) ?? cfg.default_referral_pct;
    const keepaFbaFee = cents(kp.fbaFees?.pickAndPackFee);
    const fbaFee = keepaFbaFee ?? cfg.default_fba_fee;
    const cost = supplier.cost_price;

    let referralFee = null; let totalFees = null; let netProfit = null; let roi = null; let margin = null;
    if (price !== null) {
      referralFee = round2(Math.max((price * referralPct) / 100, MIN_REFERRAL_FEE));
      totalFees = round2(referralFee + fbaFee + cfg.prep_cost);
      netProfit = round2(price - totalFees - cost);
      roi = round2((netProfit / cost) * 100);
      margin = round2((netProfit / price) * 100);
    }

    // Keepa serves its last snapshot when it can't refresh a listing, so an
    // old lastUpdate usually means a dead ASIN with a leftover Buy Box.
    const lastUpdate = clean(kp.lastUpdate);
    const lastUpdateMs = lastUpdate !== null ? (lastUpdate + KEEPA_TIME_OFFSET_MIN) * 60000 : null;
    const maxAgeDays = cfg.max_data_age_days ?? 7;
    const isStale = lastUpdateMs === null || Date.now() - lastUpdateMs > maxAgeDays * 86400000;

    const row = {
      upc: supplier.upc,
      asin: kp.asin,
      supplier: 'plumbersstock',
      supplier_sku: supplier.supplier_sku,
      supplier_mpn: supplier.supplier_mpn,
      supplier_title: supplier.supplier_title,
      supplier_url: supplier.supplier_url,
      image_url: supplier.image_url,
      cost_price: cost,
      in_stock: supplier.in_stock,
      stock_status: supplier.stock_status,
      amazon_title: kp.title || null,
      brand: kp.brand || null,
      sales_category: kp.categoryTree?.[0]?.name ?? null,
      buy_box_price: price,
      price_source: priceSource,
      buy_box_is_fba: bool(stats.buyBoxIsFBA),
      buy_box_is_amazon: bool(stats.buyBoxIsAmazon),
      bsr_current: clean(at(stats.current, IDX.SALES_RANK)),
      bsr_avg_30: clean(at(stats.avg30, IDX.SALES_RANK)),
      bsr_avg_90: clean(at(stats.avg90, IDX.SALES_RANK)),
      new_offer_count: clean(at(stats.current, IDX.COUNT_NEW)),
      fba_offer_count: clean(stats.offerCountFBA),
      referral_fee_pct: referralPct,
      referral_fee: referralFee,
      fba_fee: fbaFee,
      fba_fee_estimated: keepaFbaFee === null,
      prep_cost: cfg.prep_cost,
      total_fees: totalFees,
      net_profit: netProfit,
      roi_pct: roi,
      net_margin_pct: margin,
      is_profitable: !isStale && roi !== null && roi >= cfg.min_roi_pct && netProfit >= cfg.min_profit,
      is_stale: isStale,
      keepa_last_update: lastUpdateMs !== null ? new Date(lastUpdateMs).toISOString() : null,
      updated_at: now,
    };
    rowsByKey.set(`${row.upc}|${row.asin}`, row);
  } catch (error) {
    errors.push(`ASIN ${kp?.asin}: ${error.message}`);
  }
}

const rows = [...rowsByKey.values()];
const profitable = rows.filter((r) => r.is_profitable).length;
const fatal = rows.length === 0 && errors.length > 0;

return [{
  json: {
    rows,
    run: {
      started_at: cfg.started_at,
      trigger: cfg.trigger,
      category_url: cfg.category_url,
      products_scraped: scrape.products_scraped ?? 0,
      products_with_upc: scrape.products_with_upc ?? 0,
      asins_matched: rows.length,
      profitable,
      keepa_tokens_consumed: tokensConsumed,
      keepa_tokens_left: tokensLeft,
      status: fatal ? 'error' : errors.length ? 'partial' : 'success',
      error: errors.length ? errors.join(' | ').slice(0, 2000) : null,
    },
  },
}];
