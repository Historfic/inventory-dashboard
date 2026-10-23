// Supplier categories the Run Sourcing panel can scrape. Each page exposes a
// schema.org ItemList of 24 products on plumbersstock.com. The trigger route
// only accepts URLs from this list.
export const ARBITRAGE_CATEGORIES = [
  { label: "Clearance deals", url: "https://www.plumbersstock.com/clearance-deals.html" },
  { label: "Bathroom faucets", url: "https://www.plumbersstock.com/bathroom/faucets.html" },
  { label: "Kitchen faucets", url: "https://www.plumbersstock.com/kitchen/faucets.html" },
  { label: "Toilets", url: "https://www.plumbersstock.com/bathroom/toilets.html" },
  { label: "Garbage disposals", url: "https://www.plumbersstock.com/kitchen/garbage-disposals.html" },
  { label: "Kitchen sinks", url: "https://www.plumbersstock.com/kitchen/sinks.html" },
  { label: "Bathroom accessories", url: "https://www.plumbersstock.com/bathroom/accessories.html" },
  { label: "Pumps", url: "https://www.plumbersstock.com/plumbing/pumps.html" },
  { label: "Water heaters", url: "https://www.plumbersstock.com/plumbing/water-heaters.html" },
] as const;

// Keepa bills ~1 token per product + 2 for Buy Box data; the current plan
// refills 1 token/minute (60 max), so runs stay small.
export const KEEPA_TOKENS_PER_PRODUCT = 3;
export const PRODUCT_COUNT_OPTIONS = [3, 5, 8, 12, 15] as const;
export const DEFAULT_PRODUCT_COUNT = 8;
export const MAX_PRODUCT_COUNT = 15;

export function categoryLabel(url: string | null): string {
  return (
    ARBITRAGE_CATEGORIES.find((c) => c.url === url)?.label ??
    url?.replace("https://www.plumbersstock.com/", "") ??
    "—"
  );
}
