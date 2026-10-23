import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import type { SortDirection } from "@tanstack/react-table";

/** Column sort state: up / down when active, a muted double chevron when not. */
export function SortIcon({ direction }: { direction: false | SortDirection }) {
  if (direction === "asc") return <ChevronUp className="size-3.5 text-foreground" aria-hidden />;
  if (direction === "desc") return <ChevronDown className="size-3.5 text-foreground" aria-hidden />;
  return <ChevronsUpDown className="size-3.5 opacity-40" aria-hidden />;
}
