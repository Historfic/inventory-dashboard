import type { LineCountRow } from "./line-counts-types";

export type LineCountTotals = {
  PO: { total: number; writer_count: number };
  SO: { total: number; writer_count: number };
  DIR: { total: number; writer_count: number };
  TR: { total: number; writer_count: number };
  grand_total: number;
};

export type LineCountByWriter = {
  writer: string;
  PO: number;
  SO: number;
  DIR: number;
  TR: number;
  total: number;
};

export function lineCountTotals(rows: LineCountRow[]): LineCountTotals {
  const empty = { total: 0, writer_count: 0 };
  const acc: LineCountTotals = {
    PO: { ...empty },
    SO: { ...empty },
    DIR: { ...empty },
    TR: { ...empty },
    grand_total: 0,
  };
  const writers: Record<string, Set<string>> = { PO: new Set(), SO: new Set(), DIR: new Set(), TR: new Set() };
  for (const r of rows) {
    acc[r.line_type].total += r.line_count;
    acc.grand_total += r.line_count;
    if (r.writer) writers[r.line_type].add(r.writer);
  }
  acc.PO.writer_count = writers.PO.size;
  acc.SO.writer_count = writers.SO.size;
  acc.DIR.writer_count = writers.DIR.size;
  acc.TR.writer_count = writers.TR.size;
  return acc;
}

export function aggregateLineCountsByWriter(rows: LineCountRow[]): LineCountByWriter[] {
  const groups = new Map<string, LineCountByWriter>();
  for (const r of rows) {
    if (!r.writer) continue;
    let row = groups.get(r.writer);
    if (!row) {
      row = { writer: r.writer, PO: 0, SO: 0, DIR: 0, TR: 0, total: 0 };
      groups.set(r.writer, row);
    }
    row[r.line_type] += r.line_count;
    row.total += r.line_count;
  }
  return Array.from(groups.values()).sort((a, b) => b.total - a.total);
}
