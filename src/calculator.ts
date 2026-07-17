import { CashRunwayInputs, CashRunwayResults, CashRunwayMonth } from "./types";

// Projection horizon. Five years is enough to show runway, break-even,
// and the effect of a planned raise without pretending to forecast further.
const HORIZON_MONTHS = 60;

/**
 * Project cash month-by-month and derive runway, break-even, and burn.
 *
 * Cash-basis model: the user's "monthly operating spend" is TOTAL cash out
 * today, including delivery costs (COGS) — the number they read off the bank
 * statement. We split it internally: COGS = revenue x (1 - gross margin)
 * scales with revenue, and the fixed remainder compounds at the opex growth
 * rate. So today's net burn = spend - revenue collected (matching the bank
 * account exactly), while gross margin governs how delivery costs grow with
 * revenue. The planned raise lands in its month; cash is tracked to the
 * dollar; runway is interpolated where cash crosses zero between two months.
 */
export function calculateCashRunwayResults(
  inputs: CashRunwayInputs
): CashRunwayResults {
  const revGrowth = inputs.monthlyRevenueGrowthPct / 100;
  const opexGrowth = inputs.monthlyOpexGrowthPct / 100;
  const grossMargin = Math.min(Math.max(inputs.grossMarginPct, 0), 100) / 100;

  // Split today's total spend into variable delivery cost and fixed opex.
  // COGS is capped at the stated spend: the user's total-spend number is
  // authoritative, so when the margin implies more COGS than the org spends
  // at all, all spend is treated as variable at an effective rate - never
  // recomputed above what the user stated (that would silently override
  // their bank-statement number).
  const cogsNow = Math.min(
    inputs.monthlyOpex,
    inputs.monthlyRevenue * (1 - grossMargin)
  );
  const fixedOpexNow = inputs.monthlyOpex - cogsNow;
  const variableRate =
    inputs.monthlyRevenue > 0 ? cogsNow / inputs.monthlyRevenue : 0;

  const projection: CashRunwayMonth[] = [];

  let cash = inputs.startingCash;
  let prevCash = inputs.startingCash;
  let cashOutMonth: number | null = null;
  let runwayMonths: number | null = null;
  let breakEvenMonth: number | null = null;
  let lowestCash = inputs.startingCash;

  for (let m = 1; m <= HORIZON_MONTHS; m++) {
    const revenue = inputs.monthlyRevenue * Math.pow(1 + revGrowth, m - 1);
    const fixedOpex = fixedOpexNow * Math.pow(1 + opexGrowth, m - 1);
    const cogs = revenue * variableRate;
    const opex = fixedOpex + cogs; // total cash out this month
    const grossProfit = revenue - cogs;
    const netBurn = opex - revenue; // = fixedOpex - grossProfit; positive = burning
    const financingIn =
      inputs.plannedRaise > 0 && m === inputs.raiseMonth
        ? inputs.plannedRaise
        : 0;

    prevCash = cash;
    cash = cash - netBurn + financingIn;

    if (breakEvenMonth === null && revenue >= opex) {
      breakEvenMonth = m;
    }

    if (cashOutMonth === null && cash < 0) {
      cashOutMonth = m;
      // Interpolate the crossing point within the month for a precise runway.
      const drawdownThisMonth = prevCash - cash;
      const fraction = drawdownThisMonth > 0 ? prevCash / drawdownThisMonth : 0;
      runwayMonths = Math.max(0, Math.round((m - 1 + fraction) * 10) / 10);
    }

    if (cash < lowestCash) {
      lowestCash = cash;
    }

    projection.push({
      month: m,
      revenue: Math.round(revenue),
      grossProfit: Math.round(grossProfit),
      opex: Math.round(opex),
      netBurn: Math.round(netBurn),
      financingIn,
      endingCash: Math.round(cash),
    });
  }

  // Month-1 figures for the headline metrics.
  const firstMonth = projection[0];
  const netBurnNow = firstMonth.netBurn;

  // Burn multiple = net burn / net new ARR (only meaningful when both are positive).
  const netNewARRMonthly =
    projection.length > 1
      ? (projection[1].revenue - projection[0].revenue) * 12
      : 0;
  const burnMultipleNow =
    netBurnNow > 0 && netNewARRMonthly > 0
      ? Math.round((netBurnNow / netNewARRMonthly) * 100) / 100
      : null;

  return {
    runwayMonths,
    cashOutMonth,
    netBurnNow,
    breakEvenMonth,
    burnMultipleNow,
    lowestCash: Math.round(lowestCash),
    endingCashAtHorizon: projection[projection.length - 1].endingCash,
    projection,
  };
}
