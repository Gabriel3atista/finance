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
import type {
  FinancialEntry,
  HouseholdMember,
} from "@/features/transactions/lib/data";

export function MobileMonthView({
  currentBalance,
  previousBalance,
  isBalancePending,
  isPreviousBalancePending,
  entries,
  members,
  currentUserId,
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
  isPreviousBalancePending: boolean;
  entries: FinancialEntry[];
  members: HouseholdMember[];
  currentUserId: string;
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
      <section>
        <MonthlyEntryList
          entries={entries}
          members={members}
          currentUserId={currentUserId}
          month={monthValue}
          onSetStatus={onSetEntryStatus}
          statusPendingId={statusPendingId}
          onUpdate={onUpdateEntry}
          onCancel={onCancelEntry}
          onCreateEntry={onCreateEntry}
          rowMutationPending={rowMutationPending}
        />
      </section>
    </section>
  );
}
