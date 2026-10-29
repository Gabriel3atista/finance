"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FinancialValue,
  useValuesVisibility,
} from "@/shared/components/financial-values";
import { Eyebrow } from "@/shared/components/eyebrow";
import { cn } from "@/shared/lib/utils";
import {
  formatMoney,
  localDateString,
  type FinancialEntry,
} from "@/features/transactions/lib/data";
import {
  effectiveAmount,
  historyCommitment,
  labelMonth,
  monthKey,
  monthTitle,
  monthTotals,
  type CategoryEstimate,
  type ForecastOverride,
  type HistoryMonth,
} from "@/features/forecast/lib/data";
import { getForecastData } from "@/features/forecast/lib/data";
import { queryKeys } from "@/shared/lib/query-keys";
import { useForecastMutations } from "@/features/forecast/hooks/use-forecast-mutations";
import { useEnsurePeriodEntries } from "@/features/transactions/hooks/use-ensure-period-entries";
import { addMonths, monthString } from "@/features/transactions/lib/data";

export function ForecastDashboard({
  householdId,
  userId,
}: {
  householdId: string;
  userId: string;
}) {
  const currentMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  const forecastMonths = Array.from({ length: 4 }, (_, index) =>
    monthString(addMonths(currentMonth, index)),
  );
  const ensureEntries = useEnsurePeriodEntries(
    householdId,
    userId,
    forecastMonths,
  );
  const forecastQuery = useQuery({
    queryKey: queryKeys.forecast(householdId),
    queryFn: () => getForecastData(householdId),
    enabled: ensureEntries.isReady,
  });
  const mutations = useForecastMutations(householdId);
  if (forecastQuery.isPending && !ensureEntries.isError) {
    return (
      <section
        className="mx-auto max-w-5xl"
        aria-live="polite"
        aria-busy="true"
      >
        <Eyebrow>Planejamento</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Projeção</h1>
        <p className="mt-2 text-sm text-muted">Carregando sua projeção…</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton
              key={item}
              className="rounded-[18px] border border-line bg-graphite-900 shadow-card h-52"
            />
          ))}
        </div>
      </section>
    );
  }
  if (forecastQuery.isError || ensureEntries.isError || !forecastQuery.data) {
    return (
      <section
        role="alert"
        className="mx-auto max-w-3xl rounded-2xl border border-rose-800 bg-rose-900 p-6 text-rose-100"
      >
        <h1 className="text-lg font-semibold">
          Não foi possível carregar a projeção
        </h1>
        <p className="mt-2 text-sm leading-6">
          Confira sua conexão e tente novamente.
        </p>
      </section>
    );
  }
  const { forecast, overrides, settings, history, overdue } =
    forecastQuery.data;
  const mutationError = Object.values(mutations).find(
    (mutation) => mutation.isError,
  )?.error;
  const savedMessage = Object.values(mutations).some(
    (mutation) => mutation.isSuccess,
  )
    ? "Alteração salva e projeção atualizada."
    : null;
  const openingBalance = settings?.openingBalance ?? null;
  const balanceAsOf = settings?.balanceAsOf ?? null;
  let runningBalance = openingBalance;
  const monthCards = forecast.map(({ month, entries, estimates }, index) => {
    const totals = monthTotals(entries, overrides);
    const estimateTotal = estimates.reduce(
      (total, estimate) => total + estimate.amount,
      0,
    );
    let balanceContribution = 0;
    if (balanceAsOf) {
      for (const entry of entries) {
        if (entry.status === "cancelled") continue;
        const settledAfterSnapshot =
          entry.status === "settled" &&
          Boolean(
            entry.settled_at && entry.settled_at.slice(0, 10) > balanceAsOf,
          );
        if (entry.status !== "planned" && !settledAfterSnapshot) continue;
        const amount = effectiveAmount(entry, overrides);
        balanceContribution += entry.entry_type === "income" ? amount : -amount;
      }
      balanceContribution -= estimateTotal;
      if (runningBalance !== null) runningBalance += balanceContribution;
    }
    return {
      month,
      entries,
      estimates,
      totals,
      estimateTotal,
      commitment:
        totals.income > 0
          ? ((totals.expenses + estimateTotal) / totals.income) * 100
          : null,
      accumulated: runningBalance,
      index,
    };
  });
  const highestCommitment = Math.max(
    0,
    ...monthCards.map((item) => item.commitment ?? 0),
  );

  const today = localDateString();
  const dueLimit = localDateString(addDays(new Date(`${today}T12:00:00`), 30));
  const dueEntries = [...overdue, ...forecast.flatMap(({ entries }) => entries)]
    .filter(
      (entry) =>
        entry.status === "planned" &&
        entry.due_date &&
        entry.due_date <= dueLimit,
    )
    .filter(
      (entry, index, rows) =>
        rows.findIndex((item) => item.id === entry.id) === index,
    )
    .sort((left, right) =>
      (left.due_date ?? "").localeCompare(right.due_date ?? ""),
    )
    .slice(0, 8);
  const errorMessages: Record<string, string> = {
    "invalid-balance":
      "Informe um valor válido e uma data de hoje ou anterior.",
    "save-balance": "Não foi possível salvar o saldo inicial.",
    "invalid-override": "Informe uma hipótese válida, maior que zero.",
    "entry-unavailable": "Este lançamento não está disponível para projeção.",
    "save-override": "Não foi possível salvar a hipótese.",
    "clear-override": "Não foi possível remover a hipótese.",
  };
  const mutationErrorCode =
    mutationError instanceof Error ? mutationError.message : "";

  return (
    <section className="mx-auto max-w-6xl">
      <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Eyebrow>Planejamento familiar</Eyebrow>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">
            Projeção financeira
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-[15px]">
            {monthTitle(forecast[0].month)} e os três meses seguintes. Valores
            previstos permanecem separados dos pagamentos realizados.
          </p>
        </div>
        <Button asChild className="self-start sm:self-auto" variant="outline">
          <Link href="/cadastros">Gerenciar recorrências</Link>
        </Button>
      </header>
      {forecast.some((item) => item.estimates.length > 0) && (
        <p className="mb-4 max-w-3xl rounded-xl bg-warning-900 px-4 py-3 text-xs leading-5 text-warning-100">
          Despesas por categoria sem valor previsto usam a média dos valores
          realizados nos últimos seis meses disponíveis, quando há pelo menos
          duas competências com dados. Ajustes ficam limitados ao mês
          selecionado.
        </p>
      )}

      {mutationError && (
        <p
          className="mb-4 rounded-xl border border-rose-800 bg-rose-900 px-4 py-3 text-sm text-rose-100"
          role="alert"
        >
          {errorMessages[mutationErrorCode] ??
            "Não foi possível concluir a ação."}
        </p>
      )}
      {savedMessage && (
        <p
          className="mb-4 rounded-xl border border-success-800 bg-success-900 px-4 py-3 text-sm text-success-100"
          role="status"
        >
          {savedMessage}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {monthCards.map((item) => (
          <MonthForecastCard
            key={monthKey(item.month)}
            {...item}
            mutations={mutations}
            overrides={overrides}
            highCommitment={
              item.commitment !== null &&
              item.commitment > 0 &&
              item.commitment === highestCommitment
            }
          />
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(290px,0.65fr)]">
        <section className="rounded-[18px] border border-line bg-graphite-900 shadow-card p-5 sm:p-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-semibold text-ink">
                Próximos vencimentos
              </h2>
              <p className="mt-1 text-sm text-muted">
                Em atraso ou previstos para os próximos 30 dias.
              </p>
            </div>
            <span className="rounded-full bg-canvas px-3 py-1 text-xs text-muted">
              {dueEntries.length}
            </span>
          </header>
          {dueEntries.length ? (
            <div className="mt-4 divide-y divide-line">
              {dueEntries.map((entry) => (
                <div
                  className="flex items-center justify-between gap-3 py-3"
                  key={entry.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {entry.title}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        entry.due_date! < today
                          ? "text-rose-300"
                          : "text-muted",
                      )}
                    >
                      {entry.due_date! < today ? "Vencida · " : "Vence · "}
                      {formatDate(entry.due_date!)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                    <FinancialValue>
                      {formatMoney(effectiveAmount(entry, overrides))}
                    </FinancialValue>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-xl bg-canvas px-4 py-6 text-center text-sm text-muted">
              Nenhuma pendência com vencimento nos próximos 30 dias.
            </p>
          )}
        </section>

        <section className="rounded-[18px] border border-line bg-graphite-900 shadow-card p-5 sm:p-6">
          <Eyebrow>Saldo de partida</Eyebrow>
          <h2 className="mt-2 text-[15px] font-semibold text-ink">
            Saldo inicial da família
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted">
            Informe o saldo disponível e a data em que conferiu. Sem esse dado,
            mostramos apenas o saldo mensal projetado.
          </p>
          {settings && openingBalance !== null && balanceAsOf ? (
            <div className="mt-4 rounded-xl bg-accent-soft px-4 py-3">
              <p className="text-xs text-muted">
                Informado em {formatDate(balanceAsOf)}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-ink">
                <FinancialValue>{formatMoney(openingBalance)}</FinancialValue>
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">
              Saldo acumulado oculto até informar um saldo inicial.
            </div>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              mutations.saveOpeningBalance.mutate(
                new FormData(event.currentTarget),
              );
            }}
            className="mt-4 space-y-3"
          >
            <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
              Saldo disponível (R$)
              <Input
                name="opening_balance"
                inputMode="decimal"
                defaultValue={
                  openingBalance === null
                    ? ""
                    : openingBalance.toFixed(2).replace(".", ",")
                }
                placeholder="Ex.: 12500,00 ou -350,00"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
              Data da conferência
              <Input
                type="date"
                name="balance_as_of"
                max={today}
                defaultValue={balanceAsOf ?? today}
                required
              />
            </label>
            <Button
              className="w-full"
              disabled={mutations.saveOpeningBalance.isPending}
              type="submit"
            >
              {mutations.saveOpeningBalance.isPending
                ? "Salvando…"
                : "Salvar saldo inicial"}
            </Button>
          </form>
          {settings && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                mutations.clearOpeningBalance.mutate();
              }}
              className="mt-2"
            >
              <Button
                className="w-full"
                size="sm"
                type="submit"
                variant="outline"
                disabled={mutations.clearOpeningBalance.isPending}
              >
                Remover saldo e acumulado
              </Button>
            </form>
          )}
        </section>
      </div>

      <section className="mt-7">
        <header className="mb-4">
          <Eyebrow>Histórico realizado</Eyebrow>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">
            Evolução financeira
          </h2>
          <p className="mt-1 text-sm text-muted">
            Últimos seis meses com pagamentos e recebimentos marcados como
            realizados.
          </p>
        </header>
        <div className="grid gap-5 lg:grid-cols-2">
          <MoneyBarChart title="Evolução da renda familiar" data={history} />
          <ExpenseCommitmentChart data={history} />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          O histórico mostra apenas lançamentos realizados já registrados no
          Finance. Os lançamentos históricos importados permanecem disponíveis
          para consulta na página de histórico.
        </p>
      </section>
    </section>
  );
}

function MonthForecastCard({
  month,
  entries,
  estimates,
  totals,
  estimateTotal,
  commitment,
  accumulated,
  index,
  overrides,
  highCommitment,
  mutations,
}: {
  month: Date;
  entries: FinancialEntry[];
  estimates: CategoryEstimate[];
  totals: ReturnType<typeof monthTotals>;
  estimateTotal: number;
  commitment: number | null;
  accumulated: number | null;
  index: number;
  overrides: Map<string, ForecastOverride>;
  highCommitment: boolean;
  mutations: ReturnType<typeof useForecastMutations>;
}) {
  const totalExpenses = totals.expenses + estimateTotal;
  const balance = totals.income - totalExpenses;
  return (
    <article
      className={cn(
        "rounded-[18px] border border-line bg-graphite-900 shadow-card overflow-hidden p-4 sm:p-5",
        balance < 0 && "border-rose-800",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <Eyebrow>
            {index === 0 ? "Mês atual" : `${index}º mês à frente`}
          </Eyebrow>
          <h2 className="mt-1 text-base font-semibold text-ink">
            {monthTitle(month)}
          </h2>
        </div>
        <span
          className={cn(
            "mt-1 size-2 rounded-full",
            balance < 0 ? "bg-rose-400" : "bg-success-400",
          )}
          aria-hidden="true"
        />
      </header>
      <dl className="mt-4 space-y-2.5 text-sm">
        <AmountLine label="Receitas esperadas" value={totals.income} positive />
        <AmountLine label="Despesas previstas" value={totalExpenses} />
      </dl>
      <div className="mt-4 border-t border-line pt-3">
        <p className="text-xs text-muted">Saldo mensal estimado</p>
        <p
          className={cn(
            "mt-1 text-xl font-semibold tabular-nums",
            balance < 0 ? "text-rose-300" : "text-ink",
          )}
        >
          <FinancialValue>{formatMoney(balance)}</FinancialValue>
        </p>
      </div>
      <div
        className={cn(
          "mt-3 flex items-center justify-between rounded-lg px-3 py-2",
          highCommitment ? "bg-warning-900" : "bg-graphite-800",
        )}
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
          Comprometimento da renda
        </p>
        <p
          className={cn(
            "text-xs font-semibold tabular-nums",
            highCommitment ? "text-warning-100" : "text-ink",
          )}
        >
          {commitment === null ? "—" : `${commitment.toFixed(0)}%`}
          {highCommitment && (
            <span className="ml-1.5 text-[9px] font-medium">maior</span>
          )}
        </p>
      </div>
      {accumulated !== null ? (
        <div className="mt-3 rounded-lg bg-canvas px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
            Saldo acumulado
          </p>
          <p
            className={cn(
              "mt-0.5 text-sm font-semibold tabular-nums",
              accumulated < 0 ? "text-rose-300" : "text-ink",
            )}
          >
            <FinancialValue>{formatMoney(accumulated)}</FinancialValue>
          </p>
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-xs text-muted">
          Saldo acumulado depende do saldo inicial.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted">
        <span>
          <FinancialValue>
            {formatMoney(totals.settledIncome + totals.settledExpenses)}
          </FinancialValue>{" "}
          realizados
        </span>
        <span>{totals.plannedCount} previstos</span>
        {totals.editedCount > 0 && (
          <span>{totals.editedCount} hipóteses editadas</span>
        )}
      </div>
      <details className="mt-4 border-t border-line pt-3">
        <summary className="[&::-webkit-details-marker]:hidden cursor-pointer text-xs font-medium text-accent">
          Lançamentos ({entries.length + estimates.length})
        </summary>
        {entries.length || estimates.length ? (
          <div className="mt-3 divide-y divide-line">
            {entries.map((entry) => (
              <ForecastEntry
                key={entry.id}
                entry={entry}
                override={overrides.get(entry.id)}
                mutations={mutations}
              />
            ))}
            {estimates.map((estimate) => (
              <ForecastEstimate
                key={estimate.key}
                estimate={estimate}
                mutations={mutations}
              />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs leading-5 text-muted">
            Sem lançamentos neste mês. Cadastre receitas e despesas em{" "}
            <Link
              className="text-accent underline underline-offset-2"
              href="/cadastros"
            >
              Cadastros
            </Link>
            .
          </p>
        )}
      </details>
    </article>
  );
}

function ForecastEntry({
  entry,
  override,
  mutations,
}: {
  entry: FinancialEntry;
  override?: ForecastOverride;
  mutations: ReturnType<typeof useForecastMutations>;
}) {
  const effective = override?.override_amount ?? Number(entry.amount);
  const badge =
    entry.status === "settled"
      ? "Confirmado"
      : override
        ? "Hipótese editada"
        : "Previsto";
  return (
    <div className="py-3 first:pt-1 last:pb-1">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-ink">{entry.title}</p>
          <p className="mt-1 text-[10px] text-muted">
            {entry.entry_type === "income" ? "Receita" : "Despesa"}
            {entry.due_date ? ` · ${formatDate(entry.due_date)}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-semibold tabular-nums text-ink">
            <FinancialValue>{formatMoney(effective)}</FinancialValue>
          </p>
          <p
            className={cn(
              "mt-0.5 text-[9px]",
              override
                ? "text-warning-200"
                : entry.status === "settled"
                  ? "text-success-200"
                  : "text-muted",
            )}
          >
            {badge}
          </p>
        </div>
      </div>
      {entry.status === "planned" && (
        <details className="mt-2">
          <summary className="[&::-webkit-details-marker]:hidden cursor-pointer text-[10px] font-medium text-muted">
            {override ? "Editar hipótese" : "Ajustar estimativa"}
          </summary>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              mutations.saveForecastOverride.mutate(
                new FormData(event.currentTarget),
              );
            }}
            className="mt-2 space-y-2 rounded-lg bg-canvas p-2.5"
          >
            <Input type="hidden" name="entry_id" value={entry.id} />
            <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
              Valor hipotético (R$)
              <Input
                className="min-h-9"
                name="override_amount"
                inputMode="decimal"
                defaultValue={effective.toFixed(2).replace(".", ",")}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
              Observação <span className="font-normal">(opcional)</span>
              <Input
                className="min-h-9"
                name="note"
                maxLength={160}
                defaultValue={override?.note ?? ""}
                placeholder="Ex.: conta de luz mais alta"
              />
            </label>
            <p className="text-[10px] leading-4 text-muted">
              A hipótese altera somente esta projeção; não muda o lançamento nem
              registra pagamento.
            </p>
            <Button
              className="w-full"
              size="sm"
              type="submit"
              variant="outline"
              disabled={mutations.saveForecastOverride.isPending}
            >
              Aplicar hipótese
            </Button>
          </form>
          {override && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                mutations.clearForecastOverride.mutate(
                  new FormData(event.currentTarget),
                );
              }}
              className="mt-1.5"
            >
              <Input type="hidden" name="entry_id" value={entry.id} />
              <Button
                className="text-[10px] underline underline-offset-2"
                size="sm"
                type="submit"
                variant="ghost"
                disabled={mutations.clearForecastOverride.isPending}
              >
                Voltar ao valor previsto
              </Button>
            </form>
          )}
        </details>
      )}
    </div>
  );
}

function ForecastEstimate({
  estimate,
  mutations,
}: {
  estimate: CategoryEstimate;
  mutations: ReturnType<typeof useForecastMutations>;
}) {
  const isEdited =
    estimate.amount !== estimate.baseAmount || Boolean(estimate.note);
  return (
    <div className="py-3 first:pt-1 last:pb-1">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-ink">
            {estimate.category}
          </p>
          <p className="mt-1 text-[10px] text-muted">
            Média de {estimate.monthsUsed} competências com valor realizado
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-semibold tabular-nums text-ink">
            <FinancialValue>{formatMoney(estimate.amount)}</FinancialValue>
          </p>
          <p
            className={cn(
              "mt-0.5 text-[9px]",
              isEdited ? "text-warning-200" : "text-muted",
            )}
          >
            {isEdited ? "Hipótese editada" : "Estimativa histórica"}
          </p>
        </div>
      </div>
      <details className="mt-2">
        <summary className="[&::-webkit-details-marker]:hidden cursor-pointer text-[10px] font-medium text-muted">
          {isEdited ? "Editar hipótese" : "Ajustar estimativa"}
        </summary>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            mutations.saveCategoryForecastOverride.mutate(
              new FormData(event.currentTarget),
            );
          }}
          className="mt-2 space-y-2 rounded-lg bg-canvas p-2.5"
        >
          <Input type="hidden" name="category" value={estimate.category} />
          <Input
            type="hidden"
            name="competence_month"
            value={estimate.competenceMonth}
          />
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
            Valor hipotético (R$)
            <Input
              className="min-h-9"
              name="override_amount"
              inputMode="decimal"
              defaultValue={estimate.amount.toFixed(2).replace(".", ",")}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
            Observação <span className="font-normal">(opcional)</span>
            <Input
              className="min-h-9"
              name="note"
              maxLength={160}
              defaultValue={estimate.note ?? ""}
              placeholder="Ex.: consumo maior este mês"
            />
          </label>
          <p className="text-[10px] leading-4 text-muted">
            A média vem dos valores realizados da categoria. Esta hipótese não
            cria lançamento nem registra pagamento.
          </p>
          <Button
            className="w-full"
            disabled={mutations.saveCategoryForecastOverride.isPending}
            size="sm"
            type="submit"
            variant="outline"
          >
            Aplicar hipótese
          </Button>
        </form>
        {isEdited && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              mutations.clearCategoryForecastOverride.mutate(
                new FormData(event.currentTarget),
              );
            }}
            className="mt-1.5"
          >
            <Input type="hidden" name="category" value={estimate.category} />
            <Input
              type="hidden"
              name="competence_month"
              value={estimate.competenceMonth}
            />
            <Button
              className="text-[10px] underline underline-offset-2"
              size="sm"
              type="submit"
              variant="ghost"
              disabled={mutations.clearCategoryForecastOverride.isPending}
            >
              Voltar à média histórica
            </Button>
          </form>
        )}
      </details>
    </div>
  );
}

function AmountLine({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: number;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd
        className={cn(
          "text-xs font-semibold tabular-nums",
          positive ? "text-success-200" : "text-ink",
        )}
      >
        <FinancialValue>{formatMoney(value)}</FinancialValue>
      </dd>
    </div>
  );
}

function MoneyBarChart({
  title,
  data,
}: {
  title: string;
  data: HistoryMonth[];
}) {
  const { hidden } = useValuesVisibility();
  const maxValue = Math.max(...data.map((item) => item.income), 0);
  const hasData = maxValue > 0;
  return (
    <section className="rounded-[18px] border border-line bg-graphite-900 shadow-card p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-xs text-muted">Renda recebida por competência</p>
      {hasData ? (
        <div className="mt-4 overflow-x-auto">
          <svg
            className="h-[220px] min-w-[520px] w-full"
            viewBox="0 0 640 220"
            role="img"
            aria-label={`${title}, últimos seis meses`}
          >
            <title>{title}: últimos seis meses</title>
            {[0, 1, 2, 3].map((line) => {
              const y = 174 - line * 48;
              return (
                <line
                  key={line}
                  x1="44"
                  x2="620"
                  y1={y}
                  y2={y}
                  stroke="hsl(225 7.69% 20.39%)"
                  strokeDasharray="3 5"
                />
              );
            })}
            {data.map((item, index) => {
              const x = 60 + index * 94;
              const height = Math.max(
                (item.income / maxValue) * 138,
                item.income > 0 ? 2 : 0,
              );
              return (
                <g key={monthKey(item.month)}>
                  <title>
                    {hidden
                      ? monthTitle(item.month)
                      : `${monthTitle(item.month)}: ${formatMoney(item.income)}`}
                  </title>
                  <rect
                    x={x}
                    y={174 - height}
                    width="42"
                    height={height}
                    rx="7"
                    fill="hsl(207.69 27.66% 90.78%)"
                  />
                  <text
                    x={x + 21}
                    y="199"
                    textAnchor="middle"
                    fill="hsl(227.14 5.69% 51.76%)"
                    fontSize="11"
                  >
                    {labelMonth(item.month)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <ChartEmpty />
      )}
    </section>
  );
}

function ExpenseCommitmentChart({ data }: { data: HistoryMonth[] }) {
  const { hidden } = useValuesVisibility();
  const maxExpense = Math.max(...data.map((item) => item.expenses), 0);
  const hasData = maxExpense > 0;
  const ratioPoints = data
    .map((item, index) => {
      const ratio = historyCommitment(item);
      if (ratio === null) return null;
      const x = 81 + index * 94;
      const y = 35 + (Math.max(0, 150 - Math.min(ratio, 150)) / 150) * 125;
      return { x, y, ratio, key: monthKey(item.month) };
    })
    .filter((point): point is NonNullable<typeof point> => point !== null);
  const path = ratioPoints
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  return (
    <section className="rounded-[18px] border border-line bg-graphite-900 shadow-card p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-ink">
        Despesas e comprometimento
      </h3>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2 rounded-sm bg-success-400" aria-hidden="true" />
          Despesas pagas
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i
            className="size-2 rounded-full bg-warning-400"
            aria-hidden="true"
          />
          % da renda
        </span>
      </div>
      {hasData ? (
        <div className="mt-4 overflow-x-auto">
          <svg
            className="h-[220px] min-w-[520px] w-full"
            viewBox="0 0 640 220"
            role="img"
            aria-label="Despesas realizadas e percentual da renda comprometido nos últimos seis meses"
          >
            <title>
              Despesas realizadas e comprometimento da renda: últimos seis meses
            </title>
            {[0, 1, 2, 3].map((line) => {
              const y = 174 - line * 48;
              return (
                <line
                  key={line}
                  x1="44"
                  x2="620"
                  y1={y}
                  y2={y}
                  stroke="hsl(225 7.69% 20.39%)"
                  strokeDasharray="3 5"
                />
              );
            })}
            {data.map((item, index) => {
              const x = 60 + index * 94;
              const height = Math.max(
                (item.expenses / maxExpense) * 138,
                item.expenses > 0 ? 2 : 0,
              );
              return (
                <g key={monthKey(item.month)}>
                  <title>
                    {hidden
                      ? monthTitle(item.month)
                      : `${monthTitle(item.month)}: ${formatMoney(item.expenses)} em despesas pagas`}
                  </title>
                  <rect
                    x={x}
                    y={174 - height}
                    width="42"
                    height={height}
                    rx="7"
                    fill="hsl(141.47 38.78% 51.96%)"
                  />
                  <text
                    x={x + 21}
                    y="199"
                    textAnchor="middle"
                    fill="hsl(227.14 5.69% 51.76%)"
                    fontSize="11"
                  >
                    {labelMonth(item.month)}
                  </text>
                </g>
              );
            })}
            {ratioPoints.length > 1 && (
              <path
                d={path}
                fill="none"
                stroke="hsl(40.54 64.91% 55.29%)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {ratioPoints.map((point) => (
              <g key={point.key}>
                <title>{`${point.key}: ${point.ratio.toFixed(0)}% da renda recebida comprometida`}</title>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4.5"
                  fill="hsl(40.54 64.91% 55.29%)"
                  stroke="hsl(220 7.32% 8.04%)"
                  strokeWidth="2"
                />
              </g>
            ))}
          </svg>
        </div>
      ) : (
        <ChartEmpty />
      )}
      <p className="mt-1 text-[10px] text-muted">
        Comprometimento = despesas pagas ÷ renda recebida; meses sem renda não
        recebem percentual.
      </p>
    </section>
  );
}

function ChartEmpty() {
  return (
    <div className="mt-4 grid min-h-[220px] place-items-center rounded-xl bg-canvas px-5 text-center">
      <p className="max-w-xs text-sm leading-5 text-muted">
        Ainda não há lançamentos realizados suficientes para mostrar a evolução.
      </p>
    </div>
  );
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${date}T12:00:00`));
}
