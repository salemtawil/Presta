import { describe, expect, it } from "vitest";

import { cashBalance, percent } from "../lib/summary";

describe("cashBalance", () => {
  it("subtracts outcomes and ignores neutral adjustments", () => {
    expect(
      cashBalance([
        { type: "INCOME", amount: 100 },
        { type: "OUTCOME", amount: 40 },
        { type: "ADJUSTMENT", amount: 20 },
      ]),
    ).toBe(60);
  });
});

describe("percent", () => {
  it("returns zero when total is zero", () => {
    expect(percent(10, 0)).toBe(0);
  });
});
