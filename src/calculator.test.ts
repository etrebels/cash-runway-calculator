import { describe, it, expect } from "vitest";
import { calculateCashRunwayResults } from "./calculator";
import { DEFAULT_CASH_RUNWAY_INPUTS } from "./types";
import type { CashRunwayInputs } from "./types";

describe("calculateCashRunwayResults", () => {
  it("returns a full 60-month projection", () => {
    const r = calculateCashRunwayResults(DEFAULT_CASH_RUNWAY_INPUTS);
    expect(r.projection).toHaveLength(60);
    expect(r.projection[0].month).toBe(1);
    expect(r.projection[59].month).toBe(60);
  });

  it("net burn now = total spend minus revenue collected (cash basis)", () => {
    const r = calculateCashRunwayResults(DEFAULT_CASH_RUNWAY_INPUTS);
    const m1 = r.projection[0];
    expect(r.netBurnNow).toBe(m1.opex - m1.revenue);
    // 150k total spend - 80k collected = 70k, exactly what the bank sees
    expect(r.netBurnNow).toBe(70000);
  });

  it("revenue equal to total spend means break-even, zero burn", () => {
    const breakeven: CashRunwayInputs = {
      startingCash: 600000,
      monthlyRevenue: 100000,
      monthlyRevenueGrowthPct: 0,
      grossMarginPct: 75,
      monthlyOpex: 100000,
      monthlyOpexGrowthPct: 0,
      plannedRaise: 0,
      raiseMonth: 6,
    };
    const r = calculateCashRunwayResults(breakeven);
    expect(r.netBurnNow).toBe(0);
    expect(r.runwayMonths).toBeNull();
    expect(r.breakEvenMonth).toBe(1);
  });

  it("a dollar of extra revenue improves burn by a dollar today", () => {
    const base = calculateCashRunwayResults({
      ...DEFAULT_CASH_RUNWAY_INPUTS,
      monthlyRevenueGrowthPct: 0,
      monthlyOpexGrowthPct: 0,
    });
    const moreRevenue = calculateCashRunwayResults({
      ...DEFAULT_CASH_RUNWAY_INPUTS,
      monthlyRevenue: DEFAULT_CASH_RUNWAY_INPUTS.monthlyRevenue + 100000,
      monthlyRevenueGrowthPct: 0,
      monthlyOpexGrowthPct: 0,
    });
    expect(base.netBurnNow - moreRevenue.netBurnNow).toBe(100000);
  });

  it("gross margin scales delivery costs with revenue growth", () => {
    // Same today; with growth, a lower margin means COGS eats more of the
    // added revenue, so cash at the horizon must be lower.
    const highMargin = calculateCashRunwayResults({
      ...DEFAULT_CASH_RUNWAY_INPUTS,
      grossMarginPct: 90,
    });
    const lowMargin = calculateCashRunwayResults({
      ...DEFAULT_CASH_RUNWAY_INPUTS,
      grossMarginPct: 40,
    });
    expect(highMargin.netBurnNow).toBe(lowMargin.netBurnNow); // identical today
    expect(highMargin.endingCashAtHorizon).toBeGreaterThan(
      lowMargin.endingCashAtHorizon,
    );
  });

  it("runs out of cash with flat revenue and a steady burn", () => {
    const flat: CashRunwayInputs = {
      startingCash: 300000,
      monthlyRevenue: 0,
      monthlyRevenueGrowthPct: 0,
      grossMarginPct: 100,
      monthlyOpex: 50000,
      monthlyOpexGrowthPct: 0,
      plannedRaise: 0,
      raiseMonth: 6,
    };
    const r = calculateCashRunwayResults(flat);
    // 300k / 50k = 6 months of runway; cash goes negative the next month
    expect(r.runwayMonths).toBe(6);
    expect(r.cashOutMonth).toBe(7);
    expect(r.breakEvenMonth).toBeNull();
  });

  it("never runs out when cash-flow positive from day one", () => {
    const profitable: CashRunwayInputs = {
      startingCash: 100000,
      monthlyRevenue: 200000,
      monthlyRevenueGrowthPct: 1,
      grossMarginPct: 80,
      monthlyOpex: 100000,
      monthlyOpexGrowthPct: 1,
      plannedRaise: 0,
      raiseMonth: 6,
    };
    const r = calculateCashRunwayResults(profitable);
    expect(r.runwayMonths).toBeNull();
    expect(r.cashOutMonth).toBeNull();
    expect(r.breakEvenMonth).toBe(1);
    expect(r.netBurnNow).toBeLessThan(0); // generating cash
  });

  it("a planned raise extends runway", () => {
    const base: CashRunwayInputs = {
      startingCash: 200000,
      monthlyRevenue: 0,
      monthlyRevenueGrowthPct: 0,
      grossMarginPct: 100,
      monthlyOpex: 50000,
      monthlyOpexGrowthPct: 0,
      plannedRaise: 0,
      raiseMonth: 3,
    };
    const withRaise = { ...base, plannedRaise: 500000 };
    const a = calculateCashRunwayResults(base).runwayMonths;
    const b = calculateCashRunwayResults(withRaise).runwayMonths;
    expect(a).toBe(4);
    // 500k raise at month 3 pushes cash-out well past the no-raise case
    expect(b === null || (b as number) > (a as number)).toBe(true);
  });

  it("burn multiple is null when there is no revenue growth", () => {
    const r = calculateCashRunwayResults({
      ...DEFAULT_CASH_RUNWAY_INPUTS,
      monthlyRevenueGrowthPct: 0,
    });
    expect(r.burnMultipleNow).toBeNull();
  });
});
