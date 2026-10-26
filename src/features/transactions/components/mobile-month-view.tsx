"use client";

import {
  FinancialValue,
  ValuesVisibilityToggle,
} from "@/shared/components/financial-values";
import { BalanceChangeIndicator } from "@/shared/components/balance-change-indicator";
import { AnimatedNumber } from "@/shared/components/animated-number";
import { MonthSelector } from "@/features/transactions/components/month-selector";
import {
  BalanceChangeSkeleton,
  BalanceValueSkeleton,
} from "@/features/transactions/components/month-view-skeleton";

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
  return (
    <section className="mx-auto max-w-xl space-y-3">
      <MonthSelector month={month} onMonthSelect={onMonthSelect} />
      <article className="min-h-40 max-h-40 h-40 rounded-3xl border-t border-white bg-moon-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">Saldo</p>
          <ValuesVisibilityToggle
            iconOnly
            className="min-h-8 size-8 rounded-full bg-transparent p-0 text-muted hover:bg-black/5 hover:text-black"
          />
        </div>
        <div className="mt-8 flex items-end justify-between gap-3">
          <p
            className="text-3xl font-semibold tracking-tight text-black tabular-nums"
            aria-busy={isBalancePending}
          >
            {isBalancePending ? (
              <BalanceValueSkeleton />
            ) : (
              <FinancialValue>
                <AnimatedNumber
                  value={currentBalance}
                  locale="pt-BR"
                  format={{ style: "currency", currency: "BRL" }}
                />
              </FinancialValue>
            )}
          </p>
          {isPreviousBalancePending ? (
            <BalanceChangeSkeleton />
          ) : previousBalance !== undefined ? (
            <div className="mb-1">
              <BalanceChangeIndicator
                currentBalance={currentBalance}
                previousBalance={previousBalance}
              />
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}
