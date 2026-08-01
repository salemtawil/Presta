import { describe, expect, it } from "vitest";

import {
  allocateAmountToInstallments,
  loanBalance,
  reverseAmountFromInstallments,
} from "../lib/payments";

describe("allocateAmountToInstallments", () => {
  it("pays installments from oldest to newest", () => {
    const updates = allocateAmountToInstallments(
      [
        { id: "2", number: 2, totalAmount: 100, paidAmount: 0 },
        { id: "1", number: 1, totalAmount: 100, paidAmount: 50 },
      ],
      120,
    );

    expect(updates).toEqual([
      { id: "1", paidAmount: 100, balance: 0, status: "PAID" },
      { id: "2", paidAmount: 70, balance: 30, status: "PARTIAL" },
    ]);
  });
});

describe("reverseAmountFromInstallments", () => {
  it("reverses from newest paid installments first", () => {
    const updates = reverseAmountFromInstallments(
      [
        { id: "1", number: 1, totalAmount: 100, paidAmount: 100 },
        { id: "2", number: 2, totalAmount: 100, paidAmount: 70 },
      ],
      120,
    );

    expect(updates).toEqual([
      { id: "2", paidAmount: 0, balance: 100, status: "PENDING" },
      { id: "1", paidAmount: 50, balance: 50, status: "PARTIAL" },
    ]);
  });
});

describe("loanBalance", () => {
  it("does not return negative balances", () => {
    expect(loanBalance(100, [90, 30])).toBe(0);
  });
});
