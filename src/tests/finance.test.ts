import { describe, expect, it } from "vitest";

import { applyPayment, calculateLoanSchedule } from "../lib/finance";

describe("calculateLoanSchedule", () => {
  it("preserves the observed PrestaBIT minimum gain by default", () => {
    const schedule = calculateLoanSchedule({
      principal: 100000,
      interestRate: 0,
      installmentCount: 1,
      startDate: new Date("2026-07-31T12:00:00.000Z"),
      modality: "DAILY",
    });

    expect(schedule.totalAmount).toBe(100001);
    expect(schedule.interestAmount).toBe(1);
    expect(schedule.installmentAmount).toBe(100001);
    expect(schedule.installments).toHaveLength(1);
  });

  it("can disable the observed minimum gain", () => {
    const schedule = calculateLoanSchedule({
      principal: 100000,
      interestRate: 0,
      installmentCount: 1,
      startDate: new Date("2026-07-31T12:00:00.000Z"),
      modality: "DAILY",
      preservePrestabitMinimumGain: false,
    });

    expect(schedule.totalAmount).toBe(100000);
    expect(schedule.interestAmount).toBe(0);
  });

  it("skips Sundays when requested", () => {
    const schedule = calculateLoanSchedule({
      principal: 300,
      interestRate: 0,
      installmentCount: 2,
      startDate: new Date("2026-08-01T12:00:00.000Z"),
      modality: "DAILY",
      noChargeSunday: true,
    });

    expect(schedule.installments[0].dueDate.getDay()).toBe(1);
  });
});

describe("applyPayment", () => {
  it("allocates automatic payments to mora, charges, interest and principal", () => {
    const allocation = applyPayment({
      amount: 150,
      principalBalance: 100,
      interestBalance: 25,
      moraBalance: 10,
      chargesBalance: 15,
    });

    expect(allocation).toMatchObject({
      moraPaid: 10,
      chargesPaid: 15,
      interestPaid: 25,
      principalPaid: 100,
      unappliedAmount: 0,
    });
  });
});
