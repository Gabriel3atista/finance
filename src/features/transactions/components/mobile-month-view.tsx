"use client";

import { useEffect, useRef } from "react";
import {
  FinancialValue,
  ValuesVisibilityToggle,
} from "@/shared/components/financial-values";
import { BalanceChangeIndicator } from "@/shared/components/balance-change-indicator";
import { AnimatedNumber } from "@/shared/components/animated-number";
import { MonthSelector } from "@/features/transactions/components/month-selector";
import { MonthlyEntryList } from "@/features/transactions/components/monthly-entry-list";
import {
  formatMoney,
  type FinancialEntry,
} from "@/features/transactions/lib/data";

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
  onCancelEntry,
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
  onCancelEntry: (form: FormData) => Promise<void>;
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
  const expenses = activeEntries
    .filter((entry) => entry.entry_type === "expense")
    .reduce((total, entry) => total + entry.amount, 0);
  const settledIncome = activeEntries
    .filter(
      (entry) => entry.entry_type === "income" && entry.status === "settled",
    )
    .reduce((total, entry) => total + entry.amount, 0);
  const settledExpenses = activeEntries
    .filter(
      (entry) => entry.entry_type === "expense" && entry.status === "settled",
    )
    .reduce((total, entry) => total + entry.amount, 0);

  return (
    <section className="flex flex-col gap-3 mx-auto max-w-xl">
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
          <p className="text-sm text-white/70">Saldo</p>
          <ValuesVisibilityToggle
            iconOnly
            className="min-h-8 size-8 rounded-full bg-transparent p-0 text-white/70 hover:bg-white/10 hover:text-white"
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
      <div className="grid grid-cols-2 gap-3" aria-busy={isBalancePending}>
        <SummaryCard
          title="Receitas"
          value={formatMoney(income)}
          detail={`${formatMoney(settledIncome)} recebidas`}
          tone="positive"
        />
        <SummaryCard
          title="Despesas"
          value={formatMoney(expenses)}
          detail={`${formatMoney(settledExpenses)} pagas`}
          tone="negative"
        />
      </div>
      <section>
        <MonthlyEntryList
          entries={entries}
          month={monthValue}
          onSetStatus={onSetEntryStatus}
          statusPendingId={statusPendingId}
          onUpdate={onUpdateEntry}
          onCancel={onCancelEntry}
          onCreateEntry={onCreateEntry}
          rowMutationPending={rowMutationPending}
          isLoading={isBalancePending}
          loadError={isEntriesError}
        />
      </section>
    </section>
  );
}

function SummaryCard({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  tone: "positive" | "negative";
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-line bg-graphite-900 p-4 shadow-card">
      <p className="text-xs text-muted">{title}</p>
      <p
        className={`mt-2 truncate text-lg font-semibold tracking-tight tabular-nums ${tone === "positive" ? "text-success-300" : "text-rose-300"}`}
      >
        <FinancialValue>{value}</FinancialValue>
      </p>
      <p className="mt-1 truncate text-[11px] text-muted">
        <FinancialValue>{detail}</FinancialValue>
      </p>
    </article>
  );
}
