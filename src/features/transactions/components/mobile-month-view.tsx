"use client";

import {
  FinancialValue,
  ValuesVisibilityToggle,
} from "@/shared/components/financial-values";
import { formatMoney } from "@/features/transactions/lib/data";

export function MobileMonthView({
  currentBalance,
}: {
  currentBalance: number;
}) {
  return (
    <section className="mx-auto max-w-xl">
      <article className="bg-moon-100 border border-white rounded-3xl p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">Saldo</p>
          <ValuesVisibilityToggle
            iconOnly
            className="min-h-8 size-8 rounded-full bg-transparent p-0 text-black hover:bg-black/5 hover:text-black"
          />
        </div>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-black tabular-nums">
          <FinancialValue>{formatMoney(currentBalance)}</FinancialValue>
        </p>
      </article>
    </section>
  );
}
