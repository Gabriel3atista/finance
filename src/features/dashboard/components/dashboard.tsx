import Link from "next/link";
import {
  formatMoney,
  localDateString,
  monthString,
} from "@/features/transactions/lib/data";
import type {
  DashboardDueEntry,
  DashboardMonth,
} from "@/features/dashboard/lib/data";
import { MonthlyHistoryCharts } from "@/features/dashboard/components/monthly-history-charts";

export function Dashboard({
  currentMonth,
  history,
  upcoming,
  settledIncome,
  settledExpenses,
  realizedBalance,
  plannedExpenses,
}: {
  currentMonth: Date;
  history: DashboardMonth[];
  upcoming: DashboardDueEntry[];
  settledIncome: number;
  settledExpenses: number;
  realizedBalance: number;
  plannedExpenses: number;
}) {
  const monthTitle = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  return (
    <section className="mx-auto max-w-6xl">
      <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Visão geral da família
          </p>
          <h1 className="mt-2 text-[28px] font-semibold capitalize tracking-[-0.04em] text-ink sm:text-[34px]">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-[15px]">
            Receitas e despesas realizadas ao longo do tempo, com um resumo de{" "}
            {monthTitle}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="quiet-button"
            href={`/mes?month=${monthString(currentMonth)}`}
          >
            Abrir meu mês
          </Link>
          <Link className="quiet-button" href="/projecao">
            Ver projeção
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Recebido no mês"
          value={settledIncome}
          month={monthTitle}
          tone="normal"
        />
        <SummaryCard
          label="Pago no mês"
          value={settledExpenses}
          month={monthTitle}
          tone="normal"
        />
        <SummaryCard
          label="Saldo realizado"
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
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Histórico realizado
            </p>
            <h2
              className="mt-1 text-xl font-semibold tracking-tight text-ink"
              id="history-title"
            >
              Evolução financeira
            </h2>
          </div>
          <p className="text-xs text-muted">
            Últimos 12 meses · valores por competência
          </p>
        </header>
        <MonthlyHistoryCharts data={history} />
        <p className="mt-3 text-xs leading-5 text-muted">
          Os gráficos mostram somente lançamentos realizados. Valores previstos
          ficam fora do histórico.
        </p>
      </section>

      <section className="surface mt-8 p-5 sm:p-6" aria-labelledby="due-title">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Para acompanhar
            </p>
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
  const valueColor =
    tone === "negative"
      ? "text-danger-200"
      : tone === "positive"
        ? "text-success-200"
        : "text-ink";

  return (
    <article className="surface min-w-0 p-4 sm:p-5">
      <h2 className="text-sm text-muted">{label}</h2>
      <p
        className={`mt-3 truncate text-[22px] font-semibold tracking-tight tabular-nums ${valueColor}`}
      >
        {formatMoney(value)}
      </p>
      <p className="mt-1 text-xs capitalize text-muted">{month}</p>
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
      className="flex items-center justify-between gap-3 py-3 focus-ring"
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
          className={`mt-1 block text-xs ${overdue ? "text-danger-300" : "text-muted"}`}
        >
          {overdue ? "Vencida · " : "Vence · "}
          {formatDate(entry.due_date!)}
        </span>
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
        {formatMoney(entry.amount)}
      </span>
    </Link>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`));
}
