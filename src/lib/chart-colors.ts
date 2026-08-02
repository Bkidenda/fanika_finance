// Single source of truth for chart colours across Fanika.
// Charts must sort their series by value (largest first) and consume these in order,
// so the same visual weight always means the same relative importance.

export const CHART_COLORS = [
  "var(--chart-1)", // deep emerald
  "var(--chart-2)", // royal blue
  "var(--chart-3)", // amber
  "var(--chart-4)", // purple
  "var(--chart-5)", // teal
  "var(--chart-6)", // orange
  "var(--chart-7)", // pink
  "var(--chart-8)", // slate
] as const;

/** Colour for a series ranked by size — index 0 is the largest slice. */
export function chartColorByRank(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/** Semantic series colours for time-series charts. */
export const SERIES_COLORS = {
  income: "var(--chart-1)",
  spending: "var(--chart-6)",
  savings: "var(--chart-2)",
  netWorth: "var(--chart-4)",
  debt: "var(--destructive)",
} as const;

export const CHART_GRID_STROKE = "var(--color-border)";
export const CHART_AXIS_TICK = { fontSize: 11, fill: "var(--color-muted-foreground)" } as const;

/** Sort any {value} series descending so rank-based colours stay meaningful. */
export function rankByValue<T extends { value: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.value - a.value);
}
