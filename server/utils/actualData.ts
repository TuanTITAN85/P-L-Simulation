// Direct Cost component columns — single source of truth for the formula.
// When this list changes, all existing entries are automatically recalculated
// because mapActualEntry computes from raw rows rather than the stored column.
export const DIRECT_COST_COLS = [
  "Direct Cost - Salary Expense",
  "Direct Cost - Manpower Hiring (POI)",
  "Direct Cost - Manpower Hiring (APP)",
  "Direct Cost - Other Direct Expense",
  "Direct Cost - General Expense Per Norm",
];

function parseNum(s: string | undefined): number {
  return parseFloat((s ?? "").replace(/,/g, "").trim()) || 0;
}

export function calcDirectCostFromRows(rows: Record<string, string>[]): number {
  return rows.reduce(
    (total, row) =>
      total + DIRECT_COST_COLS.reduce((sum, col) => sum + parseNum(row[col]), 0),
    0,
  );
}
