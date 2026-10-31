"use client";

import { useEffect, useRef } from "react";
import { NextIcon } from "@/components/atoms/next-icon";
import { Card, CardSection } from "@/components/ui/card";
import {
  FinancialValue,
  ValuesVisibilityToggle,
} from "@/shared/components/financial-values";
import { BalanceChangeIndicator } from "@/shared/components/balance-change-indicator";
import { AnimatedNumber } from "@/shared/components/animated-number";
import { MonthSelector } from "@/features/transactions/components/month-selector";
import { MonthlyEntryList } from "@/features/transactions/components/monthly-entry-list";
import type { FinancialEntry } from "@/features/transactions/lib/data";
import { formatCurrency } from "@/shared/lib/currency";

export function MobileMonthView({
  currentBalance,
  previousBalance,
  isBalancePending,
  isEntriesError,
  isPreviousBalancePending,
  entries,
  monthValue,
  onSetEntryStatus,
  statusPendingId,
  onUpdateEntry,
  onDeleteEntry,
  onCopyPreviousMonth,
  onDeleteMonth,
  monthActionsPending,
  onCreateEntry,
  rowMutationPending,
  month,
  onMonthSelect,
  onMonthPreview,
}: {
  currentBalance: number;
  previousBalance?: number;
  isBalancePending: boolean;
  isEntriesError: boolean;
  isPreviousBalancePending: boolean;
  entries: FinancialEntry[];
  monthValue: string;
  onSetEntryStatus: (
    id: string,
    nextStatus: "planned" | "settled",
  ) => Promise<void>;
  statusPendingId?: string;
  onUpdateEntry: (form: FormData) => Promise<void>;
  onDeleteEntry: (form: FormData) => Promise<void>;
  onCopyPreviousMonth: () => Promise<void>;
  onDeleteMonth: () => Promise<void>;
  monthActionsPending: boolean;
  onCreateEntry: () => void;
  rowMutationPending: boolean;
  month: Date;
  onMonthSelect: (month: Date) => void;
  onMonthPreview: (month: Date | null) => void;
}) {
  const lastAvailableBalance = useRef(currentBalance);
  const displayedBalance = isBalancePending
    ? lastAvailableBalance.current
    : currentBalance;

  useEffect(() => {
    if (!isBalancePending) lastAvailableBalance.current = currentBalance;
  }, [currentBalance, isBalancePending]);

  const activeEntries = entries.filter((entry) => entry.status !== "cancelled");
  const income = activeEntries
    .filter((entry) => entry.entry_type === "income")
    .reduce((total, entry) => total + entry.amount, 0);
  const settledIncome = activeEntries
    .filter(
      (entry) => entry.entry_type === "income" && entry.status === "settled",
    )
    .reduce((total, entry) => total + entry.amount, 0);
  const expenses = activeEntries
    .filter((entry) => entry.entry_type === "expense")
    .reduce((total, entry) => total + entry.amount, 0);
  const settledExpenses = activeEntries
    .filter(
      (entry) => entry.entry_type === "expense" && entry.status === "settled",
    )
    .reduce((total, entry) => total + entry.amount, 0);
  return (
    <section className="mx-auto flex min-h-[calc(100dvh_-_12rem_-_env(safe-area-inset-top))] max-w-xl flex-col gap-3 sm:min-h-[calc(100dvh_-_13.75rem_-_env(safe-area-inset-top))] lg:min-h-[calc(100dvh_-_9.75rem)]">
      <MonthSelector
        month={month}
        onMonthPreview={onMonthPreview}
        onMonthSelect={onMonthSelect}
      />
      <article className="relative isolate flex h-40 max-h-40 min-h-40 flex-col justify-between overflow-hidden rounded-3xl bg-[url('/current-balance-card-background.png')] bg-cover bg-center px-6 pb-6 pt-3">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] border-[1px] border-white/50 mix-blend-overlay"
        />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <p className="text-sm text-ink">Saldo previsto</p>
          <ValuesVisibilityToggle
            iconOnly
            className="min-h-8 size-8 rounded-full bg-transparent p-0 text-ink"
            loading={isBalancePending || isPreviousBalancePending}
          />
        </div>
        <div className="relative z-10 flex items-end justify-between gap-3">
          <p
            className="text-3xl font-semibold tracking-tight text-white tabular-nums"
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
      <Card asChild sections className="overflow-hidden">
        <article aria-busy={isBalancePending}>
          <CardSection>
            <dl>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-sm text-muted">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full bg-mint-300"
                  />
                  <span className="text-moon-100">Receitas</span>
                </dt>
                <dd className="flex min-w-0 items-center gap-2 text-sm font-semibold tabular-nums text-ink">
                  <span className="min-w-0 truncate">
                    <FinancialValue size="sm">
                      {formatCurrency(income)}
                    </FinancialValue>
                  </span>
                  <CircularProgress
                    label="das receitas recebidas"
                    total={income}
                    value={settledIncome}
                  />
                </dd>
              </div>
            </dl>
          </CardSection>
          <CardSection>
            <dl>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-sm text-muted">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full bg-rose-500"
                  />
                  <span className="text-moon-100">Despesas</span>
                </dt>
                <dd className="flex min-w-0 items-center gap-2 text-sm font-semibold tabular-nums text-ink">
                  <span className="min-w-0 truncate">
                    <FinancialValue size="sm">
                      {formatCurrency(expenses)}
                    </FinancialValue>
                  </span>
                  <CircularProgress
                    label="das despesas pagas"
                    total={expenses}
                    value={settledExpenses}
                  />
                </dd>
              </div>
            </dl>
          </CardSection>
        </article>
      </Card>
      <section className="mt-6 flex min-h-0 flex-1 flex-col">
        <MonthlyEntryList
          entries={entries}
          month={monthValue}
          onSetStatus={onSetEntryStatus}
          statusPendingId={statusPendingId}
          onUpdate={onUpdateEntry}
          onDelete={onDeleteEntry}
          onCopyPreviousMonth={onCopyPreviousMonth}
          onDeleteMonth={onDeleteMonth}
          monthActionsPending={monthActionsPending}
          onCreateEntry={onCreateEntry}
          rowMutationPending={rowMutationPending}
          isLoading={isBalancePending}
          loadError={isEntriesError}
        />
      </section>
    </section>
  );
}

function CircularProgress({
  label,
  total,
  value,
}: {
  label: string;
  total: number;
  value: number;
}) {
  const progressPercent = Math.round(
    Math.min(100, Math.max(0, total > 0 ? (value / total) * 100 : 0)),
  );

  return (
    <span
      aria-label={`${progressPercent}% ${label}`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={progressPercent}
      className="size-5 shrink-0"
      role="progressbar"
    >
      {progressPercent === 100 ? (
        <NextIcon
          aria-hidden="true"
          className="text-mint-300"
          name="CheckRoundedFilled"
          size={20}
        />
      ) : (
        <svg
          aria-hidden="true"
          className="size-full -rotate-90"
          viewBox="0 0 24 24"
        >
          <circle
            className="text-graphite-500"
            cx="12"
            cy="12"
            fill="none"
            r="9"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <circle
            className="text-blue-500"
            cx="12"
            cy="12"
            fill="none"
            r="9"
            stroke="currentColor"
            strokeDasharray={2 * Math.PI * 9}
            strokeDashoffset={2 * Math.PI * 9 * (1 - progressPercent / 100)}
            strokeLinecap="round"
            strokeWidth="2.5"
          />
        </svg>
      )}
    </span>
  );
}
