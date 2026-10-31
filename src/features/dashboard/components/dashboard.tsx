"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardSection,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FinancialValue } from "@/shared/components/financial-values";
import { formatCurrency } from "@/shared/lib/currency";
import { formatDate, localDateString, monthString } from "@/shared/lib/date";
import { MonthlyHistoryCharts } from "@/features/dashboard/components/monthly-history-charts";
import {
  YEARLY_TREND_CARD_HEIGHT,
  YearlyTrendCards,
} from "@/features/dashboard/components/yearly-trend-cards";
import {
  getDashboardData,
  type DashboardDueEntry,
} from "@/features/dashboard/lib/data";
import { queryKeys } from "@/shared/lib/query-keys";
import { useEnsurePeriodEntries } from "@/features/transactions/hooks/use-ensure-period-entries";
import { NextIcon } from "@/components/atoms/next-icon";

export function Dashboard({
  spaceId,
  userId,
}: {
  spaceId: string;
  userId: string;
}) {
  const ensureMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  const ensureEntries = useEnsurePeriodEntries(spaceId, userId, [
    monthString(ensureMonth),
  ]);
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.dashboard(spaceId),
    queryFn: () => getDashboardData(spaceId),
    enabled: ensureEntries.isReady,
  });
  const isLoading = isPending && !ensureEntries.isError;

  if (isError || ensureEntries.isError || (!isLoading && !data)) {
    return (
      <Card
        role="alert"
        className="mx-auto w-full max-w-5xl rounded-[18px] border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-500 shadow-card"
      >
        Não foi possível carregar o painel financeiro. Tente novamente.
      </Card>
    );
  }
  return (
    <section className="relative isolate mx-auto max-w-5xl">
      <div className="relative z-10">
        <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">
              Bem vindo de volta, <br /> Gabriel!
            </h1>
          </div>
        </header>

        <section
          className="mt-8"
          aria-label="Histórico de receitas e despesas"
          aria-busy={isLoading || undefined}
        >
          {isLoading ? (
            <DashboardChartsSkeletons />
          ) : data ? (
            <>
              <MonthlyHistoryCharts data={data.history} />
              <div className="mt-3">
                <YearlyTrendCards data={data.history} />
              </div>
              <UpcomingDueCard entries={data.upcoming} />
            </>
          ) : null}
        </section>
      </div>
    </section>
  );
}

function UpcomingDueCard({
  entries,
}: {
  entries: DashboardDueEntry[];
}) {
  const today = localDateString();
  const upcomingEntries = entries.slice(0, 6);

  return (
    <Card sections className="mt-3 overflow-hidden">
      <CardHeader className="flex flex-col gap-2 bg-graphite-600">
        <CardTitle
          className="flex items-center gap-2"
        >
          <div className="flex items-center justify-center p-3  rounded-lg size-4 bg-accent/10 text-accent">
            <NextIcon name="ShieldWarningOutline" size="xs" />
          </div>
          Próximos vencimentos
        </CardTitle>
        <CardDescription className="text-xs max-w-[256px]">
          Lançamentos vencidos e previstos para os próximos 30 dias,
          organizados por data.
        </CardDescription>
      </CardHeader>
      {upcomingEntries.length ? (
        upcomingEntries.map((entry) => {
          const overdue = entry.due_date !== null && entry.due_date < today;

          return (
            <Link
              className="flex min-w-0 items-center justify-between gap-3 p-3 transition-colors hover:bg-graphite-600/50"
              href={`/mes?month=${entry.competence_month.slice(0, 7)}`}
              key={entry.id}
            >
              <span className="flex min-w-0 flex-col gap-2">
                <span className="truncate text-sm font-medium text-ink">
                  {entry.title}
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <Badge
                    size="sm"
                    variant={overdue ? "destructive" : "secondary"}
                  >
                    {overdue ? "Vencido" : "Vence"} {formatDate(entry.due_date!)}
                  </Badge>
                  <Badge size="sm" variant="secondary">
                    {entry.entry_type === "income" ? "Receita" : "Despesa"}
                  </Badge>
                </span>
              </span>
              <span
                className={`shrink-0 text-sm font-semibold tabular-nums ${entry.entry_type === "income" ? "text-mint-300" : "text-ink"}`}
              >
                <FinancialValue>
                  {entry.entry_type === "income" ? "+" : "−"}
                  {formatCurrency(entry.amount)}
                </FinancialValue>
              </span>
            </Link>
          );
        })
      ) : (
        <CardSection>
          <p className="py-2 text-sm text-muted">
            Nenhum vencimento próximo.
          </p>
        </CardSection>
      )}
    </Card>
  );
}

function DashboardChartsSkeletons() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-[312px] rounded-2xl border border-graphite-600 bg-graphite-700 shadow-card" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((item) => (
          <Skeleton
            key={item}
            className={`rounded-2xl border border-graphite-600 bg-graphite-700 shadow-card ${YEARLY_TREND_CARD_HEIGHT}`}
          />
        ))}
      </div>
    </div>
  );
}
