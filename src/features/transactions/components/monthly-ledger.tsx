import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addMonths,
  formatMoney,
  getHouseholdMembers,
  getMonthEntries,
  localDateString,
  monthString,
  type FinancialEntry,
  type HouseholdMember,
} from "@/features/transactions/lib/data";
import { formatMonth } from "@/shared/lib/date";
import { FinancialValue } from "@/shared/components/financial-values";
import { Eyebrow } from "@/shared/components/eyebrow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntryFields } from "@/features/transactions/components/entry-fields";
import {
  cancelFinancialEntry,
  createFinancialEntry,
  setEntryStatus,
  updateFinancialEntry,
} from "@/features/transactions/actions";

const errorMessages: Record<string, string> = {
  "invalid-entry":
    "Confira a descrição, o valor, a competência e o vencimento.",
  "save-entry": "Não foi possível salvar o lançamento. Tente novamente.",
  "entry-unavailable": "Esse lançamento não está mais disponível para edição.",
  "update-series": "Não foi possível atualizar os próximos meses.",
  "update-entry": "Não foi possível atualizar o lançamento.",
  "cancel-entry": "Não foi possível cancelar o lançamento.",
};

export async function MonthlyLedger({
  month,
  householdId,
  userId,
  error,
  saved,
}: {
  month: Date;
  householdId: string;
  userId: string;
  error?: string;
  saved?: string;
}) {
  let entries: FinancialEntry[] = [];
  let members: HouseholdMember[] = [];
  let loadFailed = false;
  try {
    [entries, members] = await Promise.all([
      getMonthEntries(householdId, month),
      getHouseholdMembers(householdId),
    ]);
  } catch {
    loadFailed = true;
  }
  const income = sum(entries, "income");
  const expenses = sum(entries, "expense");
  const settledIncome = sum(entries, "income", "settled");
  const settledExpenses = sum(entries, "expense", "settled");
  const pendingCount = entries.filter(
    (entry) => entry.status === "planned",
  ).length;
  const today = localDateString();
  const overdueCount = entries.filter(
    (entry) =>
      entry.status === "planned" && entry.due_date && entry.due_date < today,
  ).length;
  const monthValue = monthString(month);

  return (
    <section className="mx-auto max-w-5xl">
      <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Eyebrow>Operação mensal</Eyebrow>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">
            {formatMonth(month)}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {pendingCount} pendente{pendingCount === 1 ? "" : "s"}
            {overdueCount > 0
              ? ` · ${overdueCount} vencida${overdueCount === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <MonthLink
            month={addMonths(month, -1)}
            label="Mês anterior"
            symbol="←"
          />
          <Button asChild variant="outline">
            <Link href="/mes">Hoje</Link>
          </Button>
          <MonthLink
            month={addMonths(month, 1)}
            label="Próximo mês"
            symbol="→"
          />
        </div>
      </header>

      {error && (
        <p
          className="mb-5 rounded-xl border border-danger-800 bg-danger-900 px-4 py-3 text-sm text-danger-100"
          role="alert"
        >
          {errorMessages[error] ?? "Não foi possível concluir a ação."}
        </p>
      )}
      {saved && (
        <p
          className="mb-5 rounded-xl border border-success-800 bg-success-900 px-4 py-3 text-sm text-success-100"
          role="status"
        >
          Alterações salvas.
        </p>
      )}
      {loadFailed && (
        <p
          className="mb-5 rounded-xl border border-danger-800 bg-danger-900 px-4 py-3 text-sm text-danger-100"
          role="alert"
        >
          Não foi possível carregar os lançamentos. Confira a conexão e se as
          migrations do Supabase foram aplicadas.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary
          title="Receitas previstas"
          value={formatMoney(income)}
          detail={
            <>
              <FinancialValue>{formatMoney(settledIncome)}</FinancialValue>{" "}
              recebidas
            </>
          }
        />
        <Summary
          title="Despesas previstas"
          value={formatMoney(expenses)}
          detail={
            <>
              <FinancialValue>{formatMoney(settledExpenses)}</FinancialValue>{" "}
              pagas
            </>
          }
        />
        <Summary
          title="Saldo previsto"
          value={formatMoney(income - expenses)}
          detail={
            <>
              <FinancialValue>
                {formatMoney(settledIncome - settledExpenses)}
              </FinancialValue>{" "}
              realizado
            </>
          }
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(270px,0.8fr)]">
        <div className="surface p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-ink">
                Lançamentos
              </h2>
              <p className="mt-1 text-sm text-muted">
                Valores previstos e realizados deste mês.
              </p>
            </div>
            <span className="rounded-full bg-canvas px-3 py-1 text-xs text-muted">
              {entries.length}
            </span>
          </div>
          {entries.length ? (
            <div className="mt-5 divide-y divide-line">
              {entries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  members={members}
                  currentUserId={userId}
                  month={monthValue}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center px-4 text-center">
              <span
                className="grid size-11 place-items-center rounded-full bg-accent-soft text-lg text-accent"
                aria-hidden="true"
              >
                ＋
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink">
                Nenhum lançamento neste mês
              </h3>
              <p className="mt-1 max-w-xs text-xs leading-5 text-muted">
                Cadastre uma receita ou despesa. Recorrências e parcelas
                aparecem automaticamente.
              </p>
            </div>
          )}
        </div>

        <details
          className="surface h-fit p-5 sm:p-6"
          open={saved === "1" ? false : undefined}
        >
          <summary className="cursor-pointer list-none text-[15px] font-semibold text-ink marker:hidden">
            Novo lançamento <span className="ml-1 text-accent">＋</span>
            <span className="mt-1 block text-sm font-normal text-muted">
              Receita ou despesa avulsa
            </span>
          </summary>
          <form action={createFinancialEntry} className="mt-5 space-y-4">
            <p className="text-xs leading-5 text-muted">
              Para cartão, registre a fatura como uma única despesa. Não some as
              compras individuais junto com o pagamento da fatura.
            </p>
            <label className="field-label">
              Tipo
              <Select name="entry_type" defaultValue="expense">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <EntryFields
              members={members}
              currentUserId={userId}
              month={monthValue}
            />
            <Button className="w-full" type="submit">
              Salvar lançamento
            </Button>
          </form>
        </details>
      </div>
    </section>
  );
}

function EntryRow({
  entry,
  members,
  currentUserId,
  month,
}: {
  entry: FinancialEntry;
  members: HouseholdMember[];
  currentUserId: string;
  month: string;
}) {
  const overdue =
    entry.status === "planned" &&
    entry.due_date &&
    entry.due_date < localDateString();
  const returnTo = `/mes?month=${month}`;
  return (
    <article className="py-4 first:pt-1 last:pb-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-medium text-ink">
              {entry.title}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${entry.entry_type === "income" ? "bg-success-900 text-success-100" : "bg-canvas text-muted"}`}
            >
              {entry.entry_type === "income" ? "Receita" : "Despesa"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {entry.category ? `${entry.category} · ` : ""}
            {entry.due_date
              ? `Vencimento ${new Intl.DateTimeFormat("pt-BR").format(new Date(`${entry.due_date}T12:00:00`))}`
              : "Sem vencimento"}
            {entry.responsible_user_id
              ? ` · ${entry.responsible_user_id === currentUserId ? "Eu" : "Outro membro"}`
              : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={`text-sm font-semibold tabular-nums ${entry.entry_type === "income" ? "text-success-200" : "text-ink"}`}
          >
            <FinancialValue>
              {entry.entry_type === "income" ? "+" : "−"}
              {formatMoney(Number(entry.amount))}
            </FinancialValue>
          </p>
          <p
            className={`mt-1 text-[10px] font-medium ${overdue ? "text-danger-300" : entry.status === "settled" ? "text-success-200" : "text-muted"}`}
          >
            {overdue
              ? "Vencida"
              : entry.status === "settled"
                ? "Realizada"
                : "Prevista"}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <form action={setEntryStatus}>
          <Input type="hidden" name="id" value={entry.id} />
          <Input
            type="hidden"
            name="next_status"
            value={entry.status === "settled" ? "planned" : "settled"}
          />
          <Input type="hidden" name="return_to" value={returnTo} />
          <Button size="sm" type="submit" variant="outline">
            {entry.status === "settled"
              ? "Desfazer"
              : entry.entry_type === "income"
                ? "Marcar recebida"
                : "Marcar paga"}
          </Button>
        </form>
        {entry.status === "planned" && (
          <>
            <details className="group">
              <Button asChild size="sm" variant="outline">
                <summary className="cursor-pointer list-none">Editar</summary>
              </Button>
              <form
                action={updateFinancialEntry}
                className="mt-3 w-full space-y-3 rounded-xl border border-line bg-canvas/60 p-3 sm:min-w-[360px]"
              >
                <Input type="hidden" name="id" value={entry.id} />
                <EntryFields
                  members={members}
                  currentUserId={currentUserId}
                  month={month}
                  entry={entry}
                />
                {entry.source_kind === "recurrence" && (
                  <label className="field-label">
                    Aplicar alteração
                    <Select name="scope" defaultValue="single">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Somente este mês</SelectItem>
                        <SelectItem value="future">
                          Este e próximos meses
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                )}
                <Button className="w-full" type="submit">
                  Salvar edição
                </Button>
              </form>
            </details>
            <form action={cancelFinancialEntry}>
              <Input type="hidden" name="id" value={entry.id} />
              <Input type="hidden" name="return_to" value={returnTo} />
              <Button
                className="text-muted"
                size="sm"
                type="submit"
                variant="outline"
              >
                Cancelar
              </Button>
            </form>
          </>
        )}
        {entry.source_kind === "recurrence" && (
          <span className="text-[10px] text-muted">Recorrente</span>
        )}
        {entry.source_kind === "installment" && entry.installment_number && (
          <span className="text-[10px] text-muted">
            Parcela {entry.installment_number}
          </span>
        )}
      </div>
    </article>
  );
}

function Summary({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: ReactNode;
}) {
  return (
    <div className="surface min-h-[112px] p-4 sm:p-5">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-2 text-[21px] font-semibold tracking-tight text-ink tabular-nums">
        <FinancialValue>{value}</FinancialValue>
      </p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}

function MonthLink({
  month,
  label,
  symbol,
}: {
  month: Date;
  label: string;
  symbol: string;
}) {
  return (
    <Button asChild size="icon" variant="outline">
      <Link href={`/mes?month=${monthString(month)}`} aria-label={label}>
        {symbol}
      </Link>
    </Button>
  );
}

function sum(
  entries: FinancialEntry[],
  type: FinancialEntry["entry_type"],
  status?: FinancialEntry["status"],
) {
  return entries
    .filter(
      (entry) =>
        entry.entry_type === type && (!status || entry.status === status),
    )
    .reduce((total, entry) => total + Number(entry.amount), 0);
}
