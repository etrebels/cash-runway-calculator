# Cash Runway Calculator

**Open-source model for how many months of runway you have — and how hiring, spend, and revenue changes move the date.** For founders and CFOs planning burn, a raise, or a hiring decision.

▶ **Use the live tool:** [tools.langoptima.com/cash-runway](https://tools.langoptima.com/cash-runway)

The live version saves and shares the projection. This repo is the open calculation engine — the model is transparent and yours to adapt.

## What it models

- Month-by-month cash position from starting balance, burn, revenue, and planned changes.
- The runway-out date, and how a new hire or a revenue change shifts it.

## Install & use

```bash
npm install
npm run typecheck && npm test
```

```ts
import { calculateCashRunwayResults, DEFAULT_CASH_RUNWAY_INPUTS } from "@langoptima/cash-runway-calculator";

const result = calculateCashRunwayResults(DEFAULT_CASH_RUNWAY_INPUTS);
// → month-by-month schedule + runway in months
```

Framework-agnostic TypeScript, zero runtime dependencies.

## Built by LangOptima

LangOptima offers [growth services](https://www.langoptima.com/growth-offers/diagnostic) for B2B companies — diagnostics, growth sprints, and fractional growth leadership across the full growth surface, from demand to referral. This calculator is one of our open-source [free tools](https://tools.langoptima.com) — [langoptima.com](https://www.langoptima.com).

## License

[Apache-2.0](./LICENSE). Free to use, modify, and redistribute. The **LangOptima name and marks are not licensed** — a fork may not imply endorsement (see [`NOTICE`](./NOTICE)). Contributions: [`CONTRIBUTING.md`](./CONTRIBUTING.md) · Support: [`SUPPORT.md`](./SUPPORT.md).
