"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createInstallmentPlan,
  createRecurringItem,
  deactivateSeries,
} from "@/features/transactions/actions";
import { SeriesFields } from "@/features/transactions/components/entry-fields";
import { FinancialValue } from "@/shared/components/financial-values";
import { Eyebrow } from "@/shared/components/eyebrow";
import { cn } from "@/shared/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCurrency,
  installmentAmount,
} from "@/shared/lib/currency";
import { monthString } from "@/shared/lib/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { queryKeys } from "@/shared/lib/query-keys";
import {
  fetchInstallmentPlans,
  fetchRecurringItems,
} from "@/features/transactions/lib/queries";
import { invalidateFinanceQueries } from "@/features/transactions/lib/invalidate-finance-queries";

const errors: Record<string, string> = {
  "invalid-recurrence": "Confira os dados da recorrência.",
  "save-recurrence": "Não foi possível salvar a recorrência.",
  "invalid-installment": "Confira os dados do parcelamento.",
  "save-installment": "Não foi possível salvar o parcelamento.",
  "deactivate-series": "Não foi possível encerrar este cadastro.",
};

export function RecordsScreen({ spaceId }: { spaceId: string }) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const saved = searchParams.get("saved");
  const deactivated = searchParams.get("deactivated");
  const recurringQuery = useQuery({
    queryKey: queryKeys.recurringItems(spaceId),
    queryFn: () => fetchRecurringItems(spaceId),
  });
  const plansQuery = useQuery({
    queryKey: queryKeys.installmentPlans(spaceId),
    queryFn: () => fetchInstallmentPlans(spaceId),
  });
  const recurring = recurringQuery.data ?? [];
  const plans = plansQuery.data ?? [];
  const currentMonth = monthString(new Date());
  const queryClient = useQueryClient();
  const [mutationMessage, setMutationMessage] = useState("");
  const invalidateRecords = async () => {
    await Promise.all([
      invalidateFinanceQueries(queryClient, spaceId, {
        revalidateOccurrences: true,
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.recurringItems(spaceId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.installmentPlans(spaceId),
      }),
    ]);
  };
  const createRecurring = useMutation({
    mutationFn: async (form: FormData) => {
      const result = await createRecurringItem(form);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: async () => {
      setMutationMessage("saved");
      await invalidateRecords();
    },
    onError: (caught) =>
      setMutationMessage(
        caught instanceof Error ? caught.message : "save-recurrence",
      ),
  });
  const createInstallment = useMutation({
    mutationFn: async (form: FormData) => {
      const result = await createInstallmentPlan(form);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: async () => {
      setMutationMessage("saved");
      await invalidateRecords();
    },
    onError: (caught) =>
      setMutationMessage(
        caught instanceof Error ? caught.message : "save-installment",
      ),
  });
  const deactivate = useMutation({
    mutationFn: async (form: FormData) => {
      const result = await deactivateSeries(form);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: async () => {
      setMutationMessage("deactivated");
      await invalidateRecords();
    },
    onError: () => setMutationMessage("deactivate-series"),
  });

  if (recurringQuery.isPending || plansQuery.isPending) {
    return (
      <section
        className="mx-auto max-w-5xl"
        aria-live="polite"
        aria-busy="true"
      >
        <Eyebrow>Organização</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Cadastros</h1>
        <p className="mt-2 text-sm text-muted">Carregando seus cadastros…</p>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {[0, 1].map((item) => (
            <Skeleton
              key={item}
              className="rounded-[18px] border border-line bg-graphite-900 shadow-card h-56"
            />
          ))}
        </div>
      </section>
    );
  }
  if (recurringQuery.isError || plansQuery.isError) {
    return (
      <div
        role="alert"
        className="rounded-[18px] border border-line bg-graphite-900 shadow-card p-6 text-sm text-rose-200"
      >
        Não foi possível carregar seus cadastros. Tente novamente.
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-5xl">
      <header className="mb-7">
        <Eyebrow>Organização</Eyebrow>
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
          className="mb-5 rounded-xl border border-rose-800 bg-rose-900 px-4 py-3 text-sm text-rose-100"
        >
          {errors[error] ?? "Não foi possível concluir a ação."}
        </p>
      )}
      {saved && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-mint-800 bg-mint-900 px-4 py-3 text-sm text-mint-100"
        >
          Cadastro salvo. As ocorrências serão criadas quando cada mês for
          aberto.
        </p>
      )}
      {deactivated && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-mint-800 bg-mint-900 px-4 py-3 text-sm text-mint-100"
        >
          Cadastro encerrado. Lançamentos já criados continuam no histórico.
        </p>
      )}
      {mutationMessage && (
        <p
          role={
            mutationMessage === "saved" || mutationMessage === "deactivated"
              ? "status"
              : "alert"
          }
          className={`mb-5 rounded-xl px-4 py-3 text-sm ${mutationMessage === "saved" || mutationMessage === "deactivated" ? "border border-mint-800 bg-mint-900 text-mint-100" : "border border-rose-800 bg-rose-900 text-rose-100"}`}
        >
          {mutationMessage === "saved"
            ? "Cadastro salvo. As ocorrências serão criadas quando cada mês for aberto."
            : mutationMessage === "deactivated"
              ? "Cadastro encerrado. Lançamentos já criados continuam no histórico."
              : (errors[mutationMessage] ??
                "Não foi possível concluir a ação.")}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <details className="rounded-[18px] border border-line bg-graphite-900 shadow-card h-fit p-5 sm:p-6">
          <summary className="[&::-webkit-details-marker]:hidden cursor-pointer list-none text-[15px] font-semibold text-ink">
            Nova recorrência <span className="ml-1 text-accent">＋</span>
            <span className="mt-1 block text-sm font-normal text-muted">
              Salário, financiamento, serviços e outros valores mensais
            </span>
          </summary>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setMutationMessage("");
              createRecurring.mutate(new FormData(event.currentTarget));
            }}
            className="mt-5 space-y-4"
          >
            <Select label="Tipo" name="entry_type" defaultValue="expense">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
              </SelectContent>
            </Select>
            <SeriesFields month={currentMonth} />
            <Input
              label="Última competência (opcional)"
              type="month"
              name="ends_on"
            />
            <Button
              className="w-full"
              disabled={createRecurring.isPending}
              type="submit"
            >
              Salvar recorrência
            </Button>
          </form>
        </details>

        <details className="rounded-[18px] border border-line bg-graphite-900 shadow-card h-fit p-5 sm:p-6">
          <summary className="[&::-webkit-details-marker]:hidden cursor-pointer list-none text-[15px] font-semibold text-ink">
            Novo parcelamento <span className="ml-1 text-accent">＋</span>
            <span className="mt-1 block text-sm font-normal text-muted">
              Uma obrigação total distribuída em parcelas mensais
            </span>
          </summary>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setMutationMessage("");
              createInstallment.mutate(new FormData(event.currentTarget));
            }}
            className="mt-5 space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Descrição"
                containerClassName="sm:col-span-2"
                name="title"
                maxLength={160}
                required
                placeholder="Ex.: Móveis da sala"
              />
              <Input
                label="Valor total (R$)"
                name="total_amount"
                inputMode="decimal"
                placeholder="0,00"
                required
              />
              <Input
                label="Número de parcelas"
                name="installment_count"
                type="number"
                min={1}
                max={600}
                step={1}
                required
              />
              <Input
                label="Primeira competência"
                name="first_month"
                type="month"
                defaultValue={currentMonth}
                required
              />
              <Input
                label="Dia de vencimento"
                name="due_day"
                type="number"
                min={1}
                max={31}
                placeholder="Opcional"
              />
              <div className="flex flex-col gap-1.5 text-xs font-medium text-muted">
                <span>Categoria</span>
                <Input
                  type="hidden"
                  name="category"
                  value="Dívidas e parcelas"
                />
                <Badge className="w-fit" size="sm" variant="secondary">
                  Dívidas e parcelas
                </Badge>
              </div>
            </div>
            <p className="text-xs leading-5 text-muted">
              Os centavos restantes são distribuídos entre as primeiras parcelas
              para que a soma feche exatamente com o total.
            </p>
            <Button
              className="w-full"
              disabled={createInstallment.isPending}
              type="submit"
            >
              Salvar parcelamento
            </Button>
          </form>
        </details>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <SeriesList
          title="Recorrências"
          empty="Nenhuma recorrência cadastrada."
          kind="recurrence"
          onDeactivate={(form) => {
            setMutationMessage("");
            deactivate.mutate(form);
          }}
          deactivatePending={deactivate.isPending}
          items={recurring.map((item) => ({
            id: item.id,
            title: item.title,
            detail: `${item.entry_type === "income" ? "Receita" : "Despesa"} · ${item.due_day ? `dia ${item.due_day}` : "sem vencimento"}${item.ends_on ? ` · até ${item.ends_on.slice(0, 7)}` : " · sem data final"}`,
            amount: formatCurrency(Number(item.planned_amount)),
            active: item.is_active,
          }))}
        />
        <SeriesList
          title="Parcelamentos"
          empty="Nenhum parcelamento cadastrado."
          kind="installment"
          onDeactivate={(form) => {
            setMutationMessage("");
            deactivate.mutate(form);
          }}
          deactivatePending={deactivate.isPending}
          items={plans.map((plan) => ({
            id: plan.id,
            title: plan.title,
            detail: `${plan.installment_count} parcelas · início ${plan.first_month.slice(0, 7)}${plan.due_day ? ` · vence dia ${plan.due_day}` : ""}`,
            amount: `${formatCurrency(installmentAmount(Number(plan.total_amount), plan.installment_count, 1))} / parcela`,
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
  onDeactivate,
  deactivatePending,
  items,
}: {
  title: string;
  empty: string;
  kind: "recurrence" | "installment";
  onDeactivate: (form: FormData) => void;
  deactivatePending: boolean;
  items: Array<{
    id: string;
    title: string;
    detail: string;
    amount: string;
    active: boolean;
  }>;
}) {
  return (
    <section className="rounded-[18px] border border-line bg-graphite-900 shadow-card p-5 sm:p-6">
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
                  className={cn(
                    "truncate text-sm font-medium",
                    item.active ? "text-ink" : "text-muted",
                  )}
                >
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-muted">{item.detail}</p>
                <p className="mt-1 text-xs font-medium text-ink">
                  <FinancialValue>{item.amount}</FinancialValue>
                </p>
              </div>
              {item.active ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    onDeactivate(new FormData(event.currentTarget));
                  }}
                >
                  <Input type="hidden" name="id" value={item.id} />
                  <Input type="hidden" name="kind" value={kind} />
                  <Button
                    disabled={deactivatePending}
                    size="sm"
                    type="submit"
                    variant="outline"
                  >
                    {deactivatePending ? "Encerrando…" : "Encerrar"}
                  </Button>
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
