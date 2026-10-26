"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  formatMoney,
  localDateString,
  monthString,
} from "@/features/transactions/lib/data";
import { formatMonth } from "@/shared/lib/date";
import { FinancialValue } from "@/shared/components/financial-values";
import { Eyebrow } from "@/shared/components/eyebrow";
import type { DashboardDueEntry } from "@/features/dashboard/lib/data";
import { MonthlyHistoryCharts } from "@/features/dashboard/components/monthly-history-charts";
import { cn } from "@/shared/lib/utils";
import { getDashboardData } from "@/features/dashboard/lib/data";
import { queryKeys } from "@/shared/lib/query-keys";
import { useEnsurePeriodEntries } from "@/features/transactions/hooks/use-ensure-period-entries";

export function Dashboard({
  householdId,
  userId,
}: {
  householdId: string;
  userId: string;
}) {
  const ensureMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  const ensureEntries = useEnsurePeriodEntries(householdId, userId, [
    monthString(ensureMonth),
  ]);
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.dashboard(householdId),
    queryFn: () => getDashboardData(householdId),
    enabled: ensureEntries.isReady,
  });
  if (isPending && !ensureEntries.isError) {
    return (
      <section
        className="mx-auto max-w-6xl"
        aria-live="polite"
        aria-busy="true"
      >
        <header className="mb-7">
          <Eyebrow>Visão geral da família</Eyebrow>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-ink">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted">Carregando seu resumo…</p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-[18px] border border-line bg-secondary-900 shadow-card h-28 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }
  if (isError || ensureEntries.isError || !data) {
    return (
      <div
        role="alert"
        className="rounded-[18px] border border-line bg-secondary-900 shadow-card p-6 text-sm text-rose-200"
      >
        Não foi possível carregar o painel financeiro. Tente novamente.
      </div>
    );
  }
  const {
    currentMonth,
    history,
    upcoming,
    settledIncome,
    settledExpenses,
    realizedBalance,
    plannedExpenses,
  } = data;
  const monthTitle = formatMonth(currentMonth);

  return (
    <section className="mx-auto max-w-6xl">
      <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Eyebrow>Visão geral da família</Eyebrow>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-[15px]">
            Receitas e despesas realizadas ao longo do tempo, com um resumo de{" "}
            {monthTitle}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href={`/mes?month=${monthString(currentMonth)}`}>
              Abrir meu mês
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/projecao">Ver projeção</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Receita do mês"
          value={settledIncome}
          month={monthTitle}
          tone="normal"
        />
        <SummaryCard
          label="Despesas do mês"
          value={settledExpenses}
          month={monthTitle}
          tone="normal"
        />
        <SummaryCard
          label="Saldo"
          value={realizedBalance}
          month={monthTitle}
          tone={realizedBalance < 0 ? "negative" : "positive"}
        />
        <SummaryCard
          label="A pagar neste mês"
          value={plannedExpenses}
          month={monthTitle}
          tone="normal"
        />
      </div>

      <section className="mt-8" aria-labelledby="history-title">
        <header className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <Eyebrow>Histórico realizado</Eyebrow>
            <h2
              className="mt-1 text-xl font-semibold tracking-tight text-ink"
              id="history-title"
            >
              Evolução financeira
            </h2>
          </div>
        </header>
        <MonthlyHistoryCharts data={history} />
        <p className="mt-3 text-xs leading-5 text-muted">
          Os gráficos mostram somente lançamentos realizados. Valores previstos
          ficam fora do histórico.
        </p>
      </section>

      <section
        className="rounded-[18px] border border-line bg-secondary-900 shadow-card mt-8 p-5 sm:p-6"
        aria-labelledby="due-title"
      >
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>Para acompanhar</Eyebrow>
            <h2
              className="mt-1 text-lg font-semibold tracking-tight text-ink"
              id="due-title"
            >
              Próximos vencimentos
            </h2>
            <p className="mt-1 text-sm text-muted">
              Pendências vencidas e previstas para os próximos 30 dias.
            </p>
          </div>
          <Link
            className="text-sm font-medium text-accent underline-offset-4 hover:underline"
            href="/projecao"
          >
            Abrir projeção
          </Link>
        </header>

        {upcoming.length ? (
          <div className="mt-4 divide-y divide-line">
            {upcoming.slice(0, 6).map((entry) => (
              <DueRow entry={entry} key={entry.id} />
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-canvas px-4 py-6 text-center text-sm text-muted">
            Nenhuma pendência com vencimento nos próximos 30 dias.
          </p>
        )}
      </section>

      {!history.some((month) => month.income > 0 || month.expenses > 0) && (
        <p className="mt-5 rounded-xl border border-dashed border-line px-4 py-4 text-center text-sm leading-6 text-muted">
          Ainda não há valores realizados para os gráficos. Cadastre pagamentos
          e recebimentos ou consulte os lançamentos históricos na página de{" "}
          <Link
            className="font-medium text-accent underline underline-offset-4"
            href="/historico"
          >
            histórico
          </Link>
          .
        </p>
      )}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  month,
  tone,
}: {
  label: string;
  value: number;
  month: string;
  tone: "normal" | "positive" | "negative";
}) {
  return (
    <article className="rounded-[18px] border border-line bg-secondary-900 shadow-card min-w-0 p-4 sm:p-5">
      <h2 className="text-sm text-muted">{label}</h2>
      <p
        className={cn(
          "mt-3 truncate text-[22px] font-semibold tracking-tight tabular-nums",
          tone === "negative" && "text-rose-200",
          tone === "positive" && "text-mint-200",
          tone === "normal" && "text-ink",
        )}
      >
        <FinancialValue>{formatMoney(value)}</FinancialValue>
      </p>
      <p className="mt-1 text-xs text-muted">{month}</p>
    </article>
  );
}

function DueRow({ entry }: { entry: DashboardDueEntry }) {
  const today = localDateString();
  const overdue = entry.due_date !== null && entry.due_date < today;
  const month = entry.competence_month.slice(0, 7);
  const href = `/mes?month=${month}`;

  return (
    <Link
      className="flex items-center justify-between gap-3 py-3 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-moon-600"
      href={href}
    >
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium text-ink">
            {entry.title}
          </span>
          <span className="shrink-0 rounded-full bg-canvas px-2 py-0.5 text-[10px] text-muted">
            {entry.entry_type === "income" ? "Receita" : "Despesa"}
          </span>
        </span>
        <span
          className={cn(
            "mt-1 block text-xs",
            overdue ? "text-rose-300" : "text-muted",
          )}
        >
          {overdue ? "Vencida · " : "Vence · "}
          {formatDate(entry.due_date!)}
        </span>
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
        <FinancialValue>{formatMoney(entry.amount)}</FinancialValue>
      </span>
    </Link>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`));
}
