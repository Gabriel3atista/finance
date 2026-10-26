"use client";

import { useEffect, useRef } from "react";
import {
  FinancialValue,
  ValuesVisibilityToggle,
} from "@/shared/components/financial-values";
import { BalanceChangeIndicator } from "@/shared/components/balance-change-indicator";
import { AnimatedNumber } from "@/shared/components/animated-number";
import { MonthSelector } from "@/features/transactions/components/month-selector";

export function MobileMonthView({
  currentBalance,
  previousBalance,
  isBalancePending,
  isPreviousBalancePending,
  month,
  onMonthSelect,
}: {
  currentBalance: number;
  previousBalance?: number;
  isBalancePending: boolean;
  isPreviousBalancePending: boolean;
  month: Date;
  onMonthSelect: (month: Date) => void;
}) {
  const lastAvailableBalance = useRef(currentBalance);
  const displayedBalance = isBalancePending
    ? lastAvailableBalance.current
    : currentBalance;

  useEffect(() => {
    if (!isBalancePending) lastAvailableBalance.current = currentBalance;
  }, [currentBalance, isBalancePending]);

  return (
    <section className="mx-auto max-w-xl space-y-3">
      <MonthSelector month={month} onMonthSelect={onMonthSelect} />
      <article className="flex flex-col justify-between max-h-36 min-h-36 h-36 rounded-3xl border-t border-white bg-moon-200 px-6 pb-6 pt-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">Saldo</p>
          <ValuesVisibilityToggle
            iconOnly
            className="min-h-8 size-8 rounded-full bg-transparent p-0 text-muted hover:bg-black/5 hover:text-black"
            loading={isBalancePending || isPreviousBalancePending}
          />
        </div>
        <div className="flex items-end justify-between gap-3">
          <p
            className="text-3xl font-semibold tracking-tight text-black tabular-nums"
            aria-busy={isBalancePending}
          >
            <FinancialValue>
              <AnimatedNumber
                value={displayedBalance}
                locale="pt-BR"
                format={{ style: "currency", currency: "BRL" }}
              />
            </FinancialValue>
          </p>
          {previousBalance !== undefined || isPreviousBalancePending ? (
            <div className="mb-1">
              <BalanceChangeIndicator
                currentBalance={displayedBalance}
                previousBalance={previousBalance ?? 0}
                loading={isBalancePending || isPreviousBalancePending}
              />
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}
