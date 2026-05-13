type Entry<T> = { value: T; expires: number };

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export class TtlCache<T> {
  private store = new Map<string, Entry<T>>();
  constructor(private ttlMs: number = DEFAULT_TTL_MS) {}

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }
}

export const briefCache = new TtlCache<string>();
export const explainCache = new TtlCache<string>();
