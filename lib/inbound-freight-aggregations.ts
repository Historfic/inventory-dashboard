import type { InboundFreightRow } from "./inbound-freight-types";

export type FreightByVendor = {
  vendor_name: string;
  total_gen_total: number;
  total_freight: number;
  avg_inbound_pct: number | null;
  line_count: number;
};

export type FreightByWriter = {
  writer: string;
  total_gen_total: number;
  total_freight: number;
  avg_inbound_pct: number | null;
  line_count: number;
};

export type FreightTotals = {
  total_gen_total: number;
  total_freight: number;
  avg_inbound_pct: number | null;
  line_count: number;
  vendor_count: number;
  writer_count: number;
};

function average(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function sum(values: Array<number | null | undefined>): number {
  return values.reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0);
}

export function freightTotals(rows: InboundFreightRow[]): FreightTotals {
  const vendors = new Set<string>();
  const writers = new Set<string>();
  for (const r of rows) {
    if (r.vendor_name) vendors.add(r.vendor_name);
    if (r.writer) writers.add(r.writer);
  }
  return {
    total_gen_total: sum(rows.map((r) => r.gen_total_dollars)),
    total_freight: sum(rows.map((r) => r.freight_dollars)),
    avg_inbound_pct: average(rows.map((r) => r.inbound_pct)),
    line_count: rows.length,
    vendor_count: vendors.size,
    writer_count: writers.size,
  };
}

export function aggregateFreightByVendor(rows: InboundFreightRow[]): FreightByVendor[] {
  const groups = new Map<string, InboundFreightRow[]>();
  for (const r of rows) {
    if (!r.vendor_name) continue;
    if (!groups.has(r.vendor_name)) groups.set(r.vendor_name, []);
    groups.get(r.vendor_name)!.push(r);
  }
  return Array.from(groups.entries()).map(([vendor_name, group]) => ({
    vendor_name,
    total_gen_total: sum(group.map((r) => r.gen_total_dollars)),
    total_freight: sum(group.map((r) => r.freight_dollars)),
    avg_inbound_pct: average(group.map((r) => r.inbound_pct)),
    line_count: group.length,
  }));
}

export function aggregateFreightByWriter(rows: InboundFreightRow[]): FreightByWriter[] {
  const groups = new Map<string, InboundFreightRow[]>();
  for (const r of rows) {
    if (!r.writer) continue;
    if (!groups.has(r.writer)) groups.set(r.writer, []);
    groups.get(r.writer)!.push(r);
  }
  return Array.from(groups.entries()).map(([writer, group]) => ({
    writer,
    total_gen_total: sum(group.map((r) => r.gen_total_dollars)),
    total_freight: sum(group.map((r) => r.freight_dollars)),
    avg_inbound_pct: average(group.map((r) => r.inbound_pct)),
    line_count: group.length,
  }));
}
