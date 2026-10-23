// Scrape Supplier Catalog — reads the category page's schema.org ItemList,
// then each product page's schema.org Product block (UPC, MPN, price, stock).
// Requests are sequential with a pause between them to stay polite.
// Identify honestly as a bot: Cloudflare 403s a Chrome UA coming from Node's
// TLS stack, while an honest UA is allowed (robots.txt: User-agent * Allow /).
const USER_AGENT = 'ArbitrageSourcingBot/1.0 (low-volume product sourcing)';
const DELAY_MS = 800;

const cfg = $input.first().json;

const httpGet = async (url) => {
  const opts = { method: 'GET', url, headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' }, timeout: 30000, json: false };
  if (typeof this !== 'undefined' && this?.helpers?.httpRequest) return this.helpers.httpRequest(opts);
  if (typeof $helpers !== 'undefined') return $helpers.httpRequest(opts);
  throw new Error('No HTTP helper available in this Code node');
};
const sleep = (ms) => (typeof setTimeout === 'function' ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

const ldBlocks = (html) => {
  const out = [];
  const re = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const doc = JSON.parse(m[1].trim());
      const nodes = Array.isArray(doc) ? doc : (doc['@graph'] || [doc]);
      out.push(...nodes);
    } catch (_) { /* skip malformed block */ }
  }
  return out;
};

const normaliseUpc = (v) => {
  let digits = String(v ?? '').replace(/\D/g, '');
  if (digits.length === 11) digits = `0${digits}`; // site sometimes drops the UPC-A leading zero
  return digits.length >= 8 && digits.length <= 14 ? digits : null;
};

const parseProduct = (html, url) => {
  const product = ldBlocks(html).find((n) => n['@type'] === 'Product');
  if (!product) return null;
  const offers = Array.isArray(product.offers) ? product.offers[0] : (product.offers || {});
  const price = Number(offers.lowPrice ?? offers.price);
  const availability = String(offers.availability || '').split('/').pop() || null;
  const image = Array.isArray(product.image) ? product.image[0] : product.image;
  return {
    supplier_url: url,
    supplier_title: product.name || null,
    supplier_sku: product.sku ? String(product.sku) : null,
    supplier_mpn: product.mpn ? String(product.mpn) : null,
    upc: normaliseUpc(product.gtin12 || product.gtin || product.gtin13 || product.gtin14),
    cost_price: Number.isFinite(price) && price > 0 ? price : null,
    stock_status: availability,
    in_stock: availability ? /InStock|LimitedAvailability/i.test(availability) : null,
    image_url: image || null,
  };
};

const products = [];
const errors = [];

if (!cfg.config_error) {
  try {
    const categoryHtml = await httpGet(cfg.category_url);
    const list = ldBlocks(categoryHtml).find((n) => n['@type'] === 'CollectionPage')?.mainEntity
      || ldBlocks(categoryHtml).find((n) => n['@type'] === 'ItemList');
    let urls = (list?.itemListElement || []).map((el) => el.url || el.item?.url || el.item).filter(Boolean);
    urls = [...new Set(urls)].slice(0, cfg.max_products);
    if (urls.length === 0) errors.push('No product list found on category page');

    for (const url of urls) {
      try {
        await sleep(DELAY_MS);
        const parsed = parseProduct(await httpGet(url), url);
        if (parsed) products.push(parsed);
        else errors.push(`No Product data: ${url}`);
      } catch (error) {
        errors.push(`${url}: ${error.message}`);
      }
    }
  } catch (error) {
    errors.push(`Category fetch failed: ${error.message}`);
  }
}

const withUpc = products.filter((p) => p.upc && p.cost_price);
const upcs = [...new Set(withUpc.map((p) => p.upc))].slice(0, 100); // Keepa accepts up to 100 codes per call

return [{
  json: {
    products,
    products_scraped: products.length,
    products_with_upc: withUpc.length,
    upc_count: upcs.length,
    upc_csv: upcs.join(','),
    scrape_errors: cfg.config_error ? [cfg.config_error] : errors,
  },
}];
