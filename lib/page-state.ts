export type PageView = "error" | "loading" | "refreshing" | "empty" | "ready";

type PageState = {
  loading: boolean;
  error: string | null;
  data: readonly unknown[] | null;
};

/**
 * Which body a page renders for its data hook's state. "refreshing" means a refetch is
 * running while the previous rows are still held: render them dimmed instead of swapping
 * in a loader, so a filter change never blanks the page.
 */
export function pageView({ loading, error, data }: PageState): PageView {
  if (error) return "error";
  if (loading) return data ? "refreshing" : "loading";
  if (!data || data.length === 0) return "empty";
  return "ready";
}
