export type BalanceComparison = {
  difference: number;
  percentageChange: number | null;
  direction: "up" | "down";
};

export function compareBalances(
  currentBalance: number,
  previousBalance: number,
): BalanceComparison {
  const difference = currentBalance - previousBalance;

  return {
    difference,
    percentageChange:
      previousBalance === 0
        ? null
        : (difference / Math.abs(previousBalance)) * 100,
    direction: difference > 0 ? "up" : "down",
  };
}
