// ─── Cash Runway Calculator Types ───────────────────────────
// A founder-facing operating model: how many months of cash are left,
// when the company runs out, and what extends it. USD. Deterministic
// month-by-month projection (no LLM math, see hybrid-architecture.md).

export interface CashRunwayInputs {
  /** Cash in the bank today ($). */
  startingCash: number;
  /** Current monthly revenue collected ($), cash basis, not invoiced. */
  monthlyRevenue: number;
  /** Month-over-month revenue growth (%, e.g. 8 = 8%). */
  monthlyRevenueGrowthPct: number;
  /** Gross margin (%), share of revenue left after variable cost (COGS). */
  grossMarginPct: number;
  /** Total monthly cash out ($) incl. payroll AND delivery costs (COGS). */
  monthlyOpex: number;
  /** Month-over-month opex creep (%, e.g. 3 = 3%). */
  monthlyOpexGrowthPct: number;
  /** Planned financing event ($). 0 = none. */
  plannedRaise: number;
  /** Month the raise lands (1-24). Ignored when plannedRaise is 0. */
  raiseMonth: number;
}

export interface CashRunwayMonth {
  month: number;
  revenue: number;
  grossProfit: number;
  /** Total cash out this month: fixed opex + delivery costs (COGS). */
  opex: number;
  /** Positive = cash burned this month; negative = cash generated. */
  netBurn: number;
  financingIn: number;
  endingCash: number;
}

export interface CashRunwayResults {
  /** Months until cash hits zero (interpolated). null = survives the horizon. */
  runwayMonths: number | null;
  /** First month the ending cash goes negative. null = never within horizon. */
  cashOutMonth: number | null;
  /** Month-1 net burn ($). Positive = burning, negative = cash-flow positive. */
  netBurnNow: number;
  /** First month revenue collected covers total spend. null = not reached within horizon. */
  breakEvenMonth: number | null;
  /** Net burn / net new ARR (this month). null when not meaningful. */
  burnMultipleNow: number | null;
  /** Lowest ending-cash point across the horizon ($). */
  lowestCash: number;
  /** Ending cash at the end of the horizon ($). */
  endingCashAtHorizon: number;
  /** Full month-by-month projection. */
  projection: CashRunwayMonth[];
}

export const DEFAULT_CASH_RUNWAY_INPUTS: CashRunwayInputs = {
  startingCash: 600000,
  monthlyRevenue: 80000,
  monthlyRevenueGrowthPct: 8,
  grossMarginPct: 75,
  monthlyOpex: 150000,
  monthlyOpexGrowthPct: 3,
  plannedRaise: 0,
  raiseMonth: 6,
};
