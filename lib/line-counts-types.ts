export type LineCountRow = {
  id: number;
  report_date: string;
  writer: string;
  line_type: "PO" | "SO" | "DIR" | "TR";
  line_count: number;
};

export const LINE_TYPES = ["PO", "SO", "DIR", "TR"] as const;

export const LINE_TYPE_LABELS: Record<LineCountRow["line_type"], string> = {
  PO: "PO Lines",
  SO: "SO Lines",
  DIR: "Direct Lines",
  TR: "Transfer Lines",
};
