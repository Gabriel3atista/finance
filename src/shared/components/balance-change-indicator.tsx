import { useEffect, useRef } from "react";
import { compareBalances } from "@/shared/lib/balance-comparison";
import { AnimatedNumber } from "@/shared/components/animated-number";

export function BalanceChangeIndicator({
  currentBalance,
  previousBalance,
  loading = false,
}: {
  currentBalance: number;
  previousBalance: number;
  loading?: boolean;
}) {
  const comparison = compareBalances(currentBalance, previousBalance);
  const lastAvailablePercentage = useRef<number | null>(0);
  const percentageChange = loading
    ? lastAvailablePercentage.current
    : comparison.percentageChange;

  useEffect(() => {
    if (!loading) lastAvailablePercentage.current = comparison.percentageChange;
  }, [comparison.percentageChange, loading]);
  const percentageLabel =
    percentageChange === null
      ? "—"
      : `${new Intl.NumberFormat("pt-BR", {
          maximumFractionDigits: 1,
          signDisplay: "always",
        }).format(percentageChange)}%`;
  const description = loading
    ? "Carregando comparação com o mês anterior"
    : percentageChange === null
      ? "Sem saldo para comparar no mês anterior"
      : `${percentageLabel} em relação ao mês anterior`;

  return (
    <span
      aria-busy={loading}
      className={`inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums transition-colors duration-300 ${loading ? "text-muted" : comparison.direction === "up" ? "text-mint-400" : "text-rose-600"}`}
      aria-label={description}
      title={description}
    >
      <svg
        viewBox="0 0 20 20"
        className={`size-4 transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
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
      {percentageChange === null ? (
        <span aria-hidden="true">{percentageLabel}</span>
      ) : (
        <span aria-hidden="true" className="inline-flex items-baseline">
          <span>{percentageChange < 0 ? "−" : "+"}</span>
          <AnimatedNumber
            value={Math.abs(percentageChange)}
            locale="pt-BR"
            format={{ maximumFractionDigits: 1 }}
          />
          <span>%</span>
        </span>
      )}
    </span>
  );
}
