export type InstallmentBalance = {
  id: string;
  totalAmount: number;
  paidAmount: number;
  number: number;
};

export type InstallmentPaymentUpdate = {
  id: string;
  paidAmount: number;
  balance: number;
  status: "PENDING" | "PARTIAL" | "PAID";
};

export function allocateAmountToInstallments(
  installments: InstallmentBalance[],
  amount: number,
): InstallmentPaymentUpdate[] {
  let remaining = Math.max(0, Math.round(amount));
  const updates: InstallmentPaymentUpdate[] = [];

  for (const installment of [...installments].sort((a, b) => a.number - b.number)) {
    if (remaining <= 0) {
      break;
    }

    const currentBalance = Math.max(
      0,
      installment.totalAmount - installment.paidAmount,
    );

    if (currentBalance <= 0) {
      continue;
    }

    const applied = Math.min(currentBalance, remaining);
    const paidAmount = installment.paidAmount + applied;
    const balance = Math.max(0, installment.totalAmount - paidAmount);

    updates.push({
      id: installment.id,
      paidAmount,
      balance,
      status: balance === 0 ? "PAID" : "PARTIAL",
    });

    remaining -= applied;
  }

  return updates;
}

export function reverseAmountFromInstallments(
  installments: InstallmentBalance[],
  amount: number,
): InstallmentPaymentUpdate[] {
  let remaining = Math.max(0, Math.round(amount));
  const updates: InstallmentPaymentUpdate[] = [];

  for (const installment of [...installments].sort((a, b) => b.number - a.number)) {
    if (remaining <= 0) {
      break;
    }

    const reversible = Math.max(0, installment.paidAmount);

    if (reversible <= 0) {
      continue;
    }

    const reversed = Math.min(reversible, remaining);
    const paidAmount = Math.max(0, installment.paidAmount - reversed);
    const balance = Math.max(0, installment.totalAmount - paidAmount);

    updates.push({
      id: installment.id,
      paidAmount,
      balance,
      status: paidAmount === 0 ? "PENDING" : paidAmount < installment.totalAmount ? "PARTIAL" : "PAID",
    });

    remaining -= reversed;
  }

  return updates;
}

export function loanBalance(totalAmount: number, paidAmounts: number[]) {
  return Math.max(
    0,
    totalAmount - paidAmounts.reduce((total, value) => total + value, 0),
  );
}
