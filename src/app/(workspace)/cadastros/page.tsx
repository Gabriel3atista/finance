import { redirect } from "next/navigation";
import {
  createInstallmentPlan,
  createRecurringItem,
  deactivateSeries,
} from "@/features/transactions/actions";
import { SeriesFields } from "@/features/transactions/components/entry-fields";
import {
  formatMoney,
  getHouseholdMembers,
  getSignedInContext,
  installmentAmount,
  monthString,
  type InstallmentPlan,
  type RecurringItem,
} from "@/features/transactions/lib/data";

const errors: Record<string, string> = {
  "invalid-recurrence": "Confira os dados da recorrência.",
  "save-recurrence": "Não foi possível salvar a recorrência.",
  "invalid-installment": "Confira os dados do parcelamento.",
  "save-installment": "Não foi possível salvar o parcelamento.",
  "deactivate-series": "Não foi possível encerrar este cadastro.",
};

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    saved?: string;
    deactivated?: string;
  }>;
}) {
  const [{ error, saved, deactivated }, context] = await Promise.all([
    searchParams,
    getSignedInContext(),
  ]);
  if (!context) redirect("/household");
  const [{ data: recurringData }, { data: plansData }, members] =
    await Promise.all([
      context.supabase
        .from("recurring_items")
        .select(
          "id, household_id, title, entry_type, planned_amount, category, due_day, starts_on, ends_on, is_active, responsible_user_id",
        )
        .eq("household_id", context.householdId)
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false }),
      context.supabase
        .from("installment_plans")
        .select(
          "id, household_id, title, total_amount, installment_count, first_month, due_day, category, is_active, responsible_user_id",
        )
        .eq("household_id", context.householdId)
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false }),
      getHouseholdMembers(context.householdId),
    ]);
  const recurring = (recurringData ?? []) as RecurringItem[];
  const plans = (plansData ?? []) as InstallmentPlan[];
  const currentMonth = monthString(new Date());

  return (
    <section className="mx-auto max-w-5xl">
      <header className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Organização
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">
          Cadastros
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted sm:text-[15px]">
          Configure entradas e compromissos que se repetem. Cada ocorrência
          mensal pode ser ajustada sem alterar o histórico.
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-danger-800 bg-danger-900 px-4 py-3 text-sm text-danger-100"
        >
          {errors[error] ?? "Não foi possível concluir a ação."}
        </p>
      )}
      {saved && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-success-800 bg-success-900 px-4 py-3 text-sm text-success-100"
        >
          Cadastro salvo. As ocorrências serão criadas quando cada mês for
          aberto.
        </p>
      )}
      {deactivated && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-success-800 bg-success-900 px-4 py-3 text-sm text-success-100"
        >
          Cadastro encerrado. Lançamentos já criados continuam no histórico.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <details className="surface h-fit p-5 sm:p-6">
          <summary className="cursor-pointer list-none text-[15px] font-semibold text-ink">
            Nova recorrência <span className="ml-1 text-accent">＋</span>
            <span className="mt-1 block text-sm font-normal text-muted">
              Salário, financiamento, serviços e outros valores mensais
            </span>
          </summary>
          <form action={createRecurringItem} className="mt-5 space-y-4">
            <label className="field-label">
              Tipo
              <select
                className="field-control"
                name="entry_type"
                defaultValue="expense"
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </label>
            <SeriesFields
              members={members}
              currentUserId={context.user.id}
              month={currentMonth}
            />
            <label className="field-label">
              Última competência{" "}
              <span className="font-normal text-muted">(opcional)</span>
              <input className="field-control" type="month" name="ends_on" />
            </label>
            <button className="primary-button w-full" type="submit">
              Salvar recorrência
            </button>
          </form>
        </details>

        <details className="surface h-fit p-5 sm:p-6">
          <summary className="cursor-pointer list-none text-[15px] font-semibold text-ink">
            Novo parcelamento <span className="ml-1 text-accent">＋</span>
            <span className="mt-1 block text-sm font-normal text-muted">
              Uma obrigação total distribuída em parcelas mensais
            </span>
          </summary>
          <form action={createInstallmentPlan} className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field-label sm:col-span-2">
                Descrição
                <input
                  className="field-control"
                  name="title"
                  maxLength={160}
                  required
                  placeholder="Ex.: Móveis da sala"
                />
              </label>
              <label className="field-label">
                Valor total (R$)
                <input
                  className="field-control"
                  name="total_amount"
                  inputMode="decimal"
                  placeholder="0,00"
                  required
                />
              </label>
              <label className="field-label">
                Número de parcelas
                <input
                  className="field-control"
                  name="installment_count"
                  type="number"
                  min={1}
                  max={600}
                  step={1}
                  required
                />
              </label>
              <label className="field-label">
                Primeira competência
                <input
                  className="field-control"
                  name="first_month"
                  type="month"
                  defaultValue={currentMonth}
                  required
                />
              </label>
              <label className="field-label">
                Dia de vencimento
                <input
                  className="field-control"
                  name="due_day"
                  type="number"
                  min={1}
                  max={31}
                  placeholder="Opcional"
                />
              </label>
              <label className="field-label">
                Categoria
                <input
                  className="field-control"
                  name="category"
                  maxLength={80}
                  placeholder="Opcional"
                />
              </label>
              <label className="field-label">
                Responsável
                <select
                  className="field-control"
                  name="responsible_user_id"
                  defaultValue=""
                >
                  <option value="">Sem responsável</option>
                  {members.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.user_id === context.user.id
                        ? "Eu"
                        : "Outro membro"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-xs leading-5 text-muted">
              Os centavos restantes são distribuídos entre as primeiras parcelas
              para que a soma feche exatamente com o total.
            </p>
            <button className="primary-button w-full" type="submit">
              Salvar parcelamento
            </button>
          </form>
        </details>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <SeriesList
          title="Recorrências"
          empty="Nenhuma recorrência cadastrada."
          kind="recurrence"
          items={recurring.map((item) => ({
            id: item.id,
            title: item.title,
            detail: `${item.entry_type === "income" ? "Receita" : "Despesa"} · ${item.due_day ? `dia ${item.due_day}` : "sem vencimento"}${item.ends_on ? ` · até ${item.ends_on.slice(0, 7)}` : " · sem data final"}`,
            amount: formatMoney(Number(item.planned_amount)),
            active: item.is_active,
          }))}
        />
        <SeriesList
          title="Parcelamentos"
          empty="Nenhum parcelamento cadastrado."
          kind="installment"
          items={plans.map((plan) => ({
            id: plan.id,
            title: plan.title,
            detail: `${plan.installment_count} parcelas · início ${plan.first_month.slice(0, 7)}${plan.due_day ? ` · vence dia ${plan.due_day}` : ""}`,
            amount: `${formatMoney(installmentAmount(Number(plan.total_amount), plan.installment_count, 1))} / parcela`,
            active: plan.is_active,
          }))}
        />
      </div>
    </section>
  );
}

function SeriesList({
  title,
  empty,
  kind,
  items,
}: {
  title: string;
  empty: string;
  kind: "recurrence" | "installment";
  items: Array<{
    id: string;
    title: string;
    detail: string;
    amount: string;
    active: boolean;
  }>;
}) {
  return (
    <section className="surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        <span className="text-xs text-muted">
          {items.filter((item) => item.active).length} ativos
        </span>
      </div>
      {!items.length ? (
        <p className="mt-5 text-sm text-muted">{empty}</p>
      ) : (
        <div className="mt-4 divide-y divide-line">
          {items.map((item) => (
            <article
              className="flex items-start justify-between gap-4 py-4 first:pt-1 last:pb-1"
              key={item.id}
            >
              <div className="min-w-0">
                <h3
                  className={`truncate text-sm font-medium ${item.active ? "text-ink" : "text-muted"}`}
                >
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-muted">{item.detail}</p>
                <p className="mt-1 text-xs font-medium text-ink">
                  {item.amount}
                </p>
              </div>
              {item.active ? (
                <form action={deactivateSeries}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="kind" value={kind} />
                  <button className="quiet-button text-xs" type="submit">
                    Encerrar
                  </button>
                </form>
              ) : (
                <span className="rounded-full bg-canvas px-2.5 py-1 text-[10px] text-muted">
                  Encerrado
                </span>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
