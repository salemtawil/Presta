export type LoanModality = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

export type PaymentType =
  | "AUTOMATIC"
  | "MIXED"
  | "MORA"
  | "CHARGES"
  | "DISCOUNT";

export type PaymentMethod = "CASH" | "TRANSFER" | "CARD" | "OFFICE";

export type LoanScheduleInput = {
  principal: number;
  interestRate: number;
  installmentCount: number;
  startDate: Date;
  modality: LoanModality;
  noChargeSaturday?: boolean;
  noChargeSunday?: boolean;
  preservePrestabitMinimumGain?: boolean;
};

export type InstallmentPlan = {
  number: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: "PENDING" | "PAID" | "PARTIAL" | "OVERDUE";
};

export type LoanSchedule = {
  principal: number;
  interestAmount: number;
  totalAmount: number;
  installmentAmount: number;
  startDate: Date;
  endDate: Date;
  installments: InstallmentPlan[];
};

export type PaymentAllocationInput = {
  amount: number;
  principalBalance: number;
  interestBalance: number;
  moraBalance?: number;
  chargesBalance?: number;
  paymentType?: PaymentType;
};

export type PaymentAllocation = {
  principalPaid: number;
  interestPaid: number;
  moraPaid: number;
  chargesPaid: number;
  discountAmount: number;
  unappliedAmount: number;
};

const modalityDays: Record<LoanModality, number> = {
  DAILY: 1,
  WEEKLY: 7,
  BIWEEKLY: 15,
  MONTHLY: 30,
};

export function calculateLoanSchedule(input: LoanScheduleInput): LoanSchedule {
  assertPositive(input.principal, "principal");
  assertPositive(input.installmentCount, "installmentCount");

  const principal = roundMoney(input.principal);
  let interestAmount = roundMoney(principal * (input.interestRate / 100));

  if (
    input.preservePrestabitMinimumGain !== false &&
    interestAmount === 0 &&
    principal > 0
  ) {
    interestAmount = 1;
  }

  const totalAmount = roundMoney(principal + interestAmount);
  const installmentAmount = roundMoney(totalAmount / input.installmentCount);
  const installments: InstallmentPlan[] = [];
  let remainingBalance = totalAmount;
  let cursor = new Date(input.startDate);

  for (let index = 1; index <= input.installmentCount; index += 1) {
    cursor = nextDueDate(cursor, input.modality, {
      noChargeSaturday: input.noChargeSaturday,
      noChargeSunday: input.noChargeSunday,
    });

    const isLast = index === input.installmentCount;
    const totalForInstallment = isLast
      ? remainingBalance
      : Math.min(installmentAmount, remainingBalance);
    const principalPart = roundMoney(principal / input.installmentCount);
    const interestPart = roundMoney(totalForInstallment - principalPart);

    remainingBalance = roundMoney(remainingBalance - totalForInstallment);

    installments.push({
      number: index,
      dueDate: new Date(cursor),
      principalAmount: isLast
        ? roundMoney(principal - sum(installments.map((item) => item.principalAmount)))
        : principalPart,
      interestAmount: Math.max(0, interestPart),
      totalAmount: totalForInstallment,
      paidAmount: 0,
      balance: remainingBalance,
      status: "PENDING",
    });
  }

  return {
    principal,
    interestAmount,
    totalAmount,
    installmentAmount,
    startDate: new Date(input.startDate),
    endDate: installments[installments.length - 1]?.dueDate ?? new Date(input.startDate),
    installments,
  };
}

export function applyPayment(input: PaymentAllocationInput): PaymentAllocation {
  assertPositive(input.amount, "amount");

  let remaining = roundMoney(input.amount);
  const allocation: PaymentAllocation = {
    principalPaid: 0,
    interestPaid: 0,
    moraPaid: 0,
    chargesPaid: 0,
    discountAmount: 0,
    unappliedAmount: 0,
  };

  if (input.paymentType === "DISCOUNT") {
    allocation.discountAmount = remaining;
    return allocation;
  }

  if (input.paymentType === "MORA") {
    allocation.moraPaid = take(remaining, input.moraBalance ?? 0);
    allocation.unappliedAmount = roundMoney(remaining - allocation.moraPaid);
    return allocation;
  }

  if (input.paymentType === "CHARGES") {
    allocation.chargesPaid = take(remaining, input.chargesBalance ?? 0);
    allocation.unappliedAmount = roundMoney(remaining - allocation.chargesPaid);
    return allocation;
  }

  allocation.moraPaid = take(remaining, input.moraBalance ?? 0);
  remaining = roundMoney(remaining - allocation.moraPaid);

  allocation.chargesPaid = take(remaining, input.chargesBalance ?? 0);
  remaining = roundMoney(remaining - allocation.chargesPaid);

  allocation.interestPaid = take(remaining, input.interestBalance);
  remaining = roundMoney(remaining - allocation.interestPaid);

  allocation.principalPaid = take(remaining, input.principalBalance);
  remaining = roundMoney(remaining - allocation.principalPaid);

  allocation.unappliedAmount = remaining;
  return allocation;
}

export function roundMoney(value: number): number {
  return Math.round(value + Number.EPSILON);
}

function nextDueDate(
  date: Date,
  modality: LoanModality,
  options: Pick<LoanScheduleInput, "noChargeSaturday" | "noChargeSunday">,
): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + modalityDays[modality]);

  while (
    (options.noChargeSaturday && next.getDay() === 6) ||
    (options.noChargeSunday && next.getDay() === 0)
  ) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function take(available: number, balance: number): number {
  return roundMoney(Math.min(Math.max(balance, 0), Math.max(available, 0)));
}

function sum(values: number[]): number {
  return roundMoney(values.reduce((total, value) => total + value, 0));
}

function assertPositive(value: number, field: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be greater than zero`);
  }
}
