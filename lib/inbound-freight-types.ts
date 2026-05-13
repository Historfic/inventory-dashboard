export type InboundFreightRow = {
  id: number;
  report_date: string;
  order_number: string;
  line_number: number;
  writer: string;
  vendor_name: string;
  gen_total_dollars: number | null;
  freight_dollars: number | null;
  inbound_pct: number | null;
};
