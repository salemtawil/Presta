export type CashLikeMovement = {
  type: string;
  amount: number;
};

export function cashBalance(movements: CashLikeMovement[]) {
  return movements.reduce((total, movement) => {
    if (movement.type === "INCOME") {
      return total + movement.amount;
    }

    if (movement.type === "OUTCOME") {
      return total - movement.amount;
    }

    return total;
  }, 0);
}

export function percent(part: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((part / total) * 100));
}
