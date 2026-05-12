export type InventoryRow = {
  report_date: string;
  branch_id: string | number;
  buyer: string;
  buy_line: string | null;
  ecl_id: string | number;
  desc_1: string | null;
  desc_2: string | null;
  rank4: string | null;
  op: number | null;
  period: number | null;
  hits: number | null;
  days_out: number | null;
  on_po: number | null;
  trans: number | null;
  stockout_pct: number | null;
};
