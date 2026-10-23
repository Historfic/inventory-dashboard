// Run Config — normalises trigger input (webhook body or manual run) into one
// config item. Only PlumbersStock URLs are accepted so the webhook can't be
// used to make n8n fetch arbitrary hosts.
const DEFAULTS = {
  category_url: 'https://www.plumbersstock.com/bathroom/faucets.html',
  max_products: 10,   // keep small: Keepa plan refills 1 token/min, ~3 tokens per product
  min_roi_pct: 30,
  min_profit: 3,
  prep_cost: 0,       // inbound shipping / prep per unit
  default_fba_fee: 6.5,
  default_referral_pct: 15,
  max_data_age_days: 7, // older Keepa snapshots are flagged stale, never profitable
};
const MAX_PRODUCTS_CAP = 20;
const ALLOWED_HOST = 'www.plumbersstock.com';

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

try {
  const input = $input.first()?.json ?? {};
  const fromWebhook = input.body !== undefined || input.headers !== undefined;
  const body = (fromWebhook ? input.body : input) || {};

  // The Code-node sandbox has no global URL class, so parse by hand.
  const raw = String(body.category_url || DEFAULTS.category_url).trim();
  const match = /^https:\/\/([^/?#:@]+)(\/[^?#]*)?/i.exec(raw);
  if (!match || match[1].toLowerCase() !== ALLOWED_HOST) {
    throw new Error(`category_url must be an https://${ALLOWED_HOST} page`);
  }
  const categoryUrl = `https://${ALLOWED_HOST}${match[2] || '/'}`;

  return [{
    json: {
      trigger: fromWebhook ? (body.trigger || 'dashboard') : 'manual',
      category_url: categoryUrl,
      max_products: Math.min(Math.max(Math.round(num(body.max_products, DEFAULTS.max_products)), 1), MAX_PRODUCTS_CAP),
      min_roi_pct: num(body.min_roi_pct, DEFAULTS.min_roi_pct),
      min_profit: num(body.min_profit, DEFAULTS.min_profit),
      prep_cost: num(body.prep_cost, DEFAULTS.prep_cost),
      default_fba_fee: DEFAULTS.default_fba_fee,
      default_referral_pct: DEFAULTS.default_referral_pct,
      max_data_age_days: num(body.max_data_age_days, DEFAULTS.max_data_age_days),
      started_at: new Date().toISOString(),
      config_error: null,
    },
  }];
} catch (error) {
  // Fall back to defaults but record why, so the run log shows the problem.
  return [{
    json: {
      ...DEFAULTS,
      trigger: 'invalid',
      started_at: new Date().toISOString(),
      config_error: error.message,
    },
  }];
}
