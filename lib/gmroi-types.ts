export type GmroiRow = {
  id: number;
  report_date: string;
  branch_id: string;
  buy_line: string;
  gp_dollars: number | null;
  cogs_dollars: number | null;
  gp_dollars_adjusted: number | null;
  cogs_dollars_adjusted: number | null;
  on_hand_dollars: number | null;
  turns: number | null;
  markup_pct: number | null;
  gmroi: number | null;
  adjusted_margin_pct: number | null;
};

export const ALL_BRANCHES = "All Branches";
