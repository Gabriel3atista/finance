import { compareBalances } from "@/shared/lib/balance-comparison";

export function BalanceChangeIndicator({
  currentBalance,
  previousBalance,
}: {
  currentBalance: number;
  previousBalance: number;
}) {
  const comparison = compareBalances(currentBalance, previousBalance);
  const percentageLabel =
    comparison.percentageChange === null
      ? "—"
      : `${new Intl.NumberFormat("pt-BR", {
          maximumFractionDigits: 1,
          signDisplay: "always",
        }).format(comparison.percentageChange)}%`;
  const description =
    comparison.percentageChange === null
      ? "Sem saldo para comparar no mês anterior"
      : `${percentageLabel} em relação ao mês anterior`;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums ${comparison.direction === "up" ? "text-mint-400" : "text-rose-600"}`}
      aria-label={description}
      title={description}
    >
      <svg
        viewBox="0 0 20 20"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {comparison.direction === "up" ? (
          <path d="M4 13.5 8 9.5l2.5 2.5L16 6.5m-4 0h4v4" />
        ) : (
          <path d="m4 6.5 4 4 2.5-2.5 5.5 5.5m-4 0h4v-4" />
        )}
      </svg>
      <span>{percentageLabel}</span>
    </span>
  );
}
