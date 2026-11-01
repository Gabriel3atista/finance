"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NextIcon } from "@/components/atoms/next-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardSection } from "@/components/ui/card";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  useDrawer,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createFinancialSeries,
  deactivateSeries,
  deleteFinancialSeries,
  updateFinancialSeries,
} from "@/features/transactions/actions";
import {
  SeriesFormDrawer,
  type SeriesFormInitialData,
} from "@/features/transactions/components/series-form";
import type {
  InstallmentPlan,
  RecurringItem,
} from "@/features/transactions/lib/data";
import {
  fetchInstallmentPlans,
  fetchRecurringItems,
} from "@/features/transactions/lib/queries";
import { invalidateFinanceQueries } from "@/features/transactions/lib/invalidate-finance-queries";
import { formatCurrency, installmentAmount } from "@/shared/lib/currency";
import { FinancialValue } from "@/shared/components/financial-values";
import {
  formatDate,
  localDateString,
} from "@/shared/lib/date";
import { queryKeys } from "@/shared/lib/query-keys";
import { cn } from "@/shared/lib/utils";

const errors: Record<string, string> = {
  "invalid-series": "Confira a descrição, o valor e o período do cadastro.",
  "save-series": "Não foi possível salvar o cadastro.",
  "update-series": "Não foi possível atualizar o cadastro.",
  "deactivate-series": "Não foi possível encerrar este cadastro.",
  "delete-series": "Não foi possível excluir este cadastro.",
};

type SeriesListItem = {
  id: string;
  kind: "recurrence" | "installment";
  title: string;
  detail: string;
  amount: string;
  active: boolean;
  initialData: SeriesFormInitialData;
};

export function RecordsScreen({ spaceId }: { spaceId: string }) {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
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
  const isLoading = recurringQuery.isPending || plansQuery.isPending;
  const currentDate = localDateString();
  const queryClient = useQueryClient();
  const [mutationMessage, setMutationMessage] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [seriesToEdit, setSeriesToEdit] = useState<SeriesListItem | null>(null);
  const [seriesToDelete, setSeriesToDelete] = useState<SeriesListItem | null>(
    null,
  );

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

  const saveSeries = useMutation({
    mutationFn: async (form: FormData) => {
      const isEditing = form.has("id");
      const result = isEditing
        ? await updateFinancialSeries(form)
        : await createFinancialSeries(form);
      if (result.error) throw new Error(result.error);
      return isEditing;
    },
    onSuccess: (isEditing) => {
      setMutationMessage(isEditing ? "updated" : "saved");
      void invalidateRecords();
    },
    onError: (caught) =>
      setMutationMessage(caught instanceof Error ? caught.message : "save-series"),
  });
  const seriesDrawer = useDrawer({
    canClose: () => !saveSeries.isPending,
    onOpenChange: (open) => {
      if (open) {
        saveSeries.reset();
        setMutationMessage("");
      }
    },
    onCloseComplete: () => {
      setSeriesToEdit(null);
      setFormKey((key) => key + 1);
    },
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
  const deleteSeries = useMutation({
    mutationFn: async () => {
      if (!seriesToDelete) throw new Error("delete-series");
      const result = await deleteFinancialSeries(
        seriesToDelete.id,
        seriesToDelete.kind,
      );
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      setMutationMessage("series-deleted");
      void invalidateRecords();
    },
  });
  const deleteDrawer = useDrawer({
    canClose: () => !deleteSeries.isPending,
    onOpenChange: (open) => {
      if (open) deleteSeries.reset();
    },
    onCloseComplete: () => setSeriesToDelete(null),
  });

  function submitSeries(form: FormData) {
    setMutationMessage("");
    saveSeries.mutate(form, {
      onSuccess: () => seriesDrawer.forceCloseDrawer(),
    });
  }

  function openNewSeries() {
    setSeriesToEdit(null);
    setFormKey((key) => key + 1);
    seriesDrawer.openDrawer();
  }

  function editSeries(item: SeriesListItem) {
    setSeriesToEdit(item);
    setFormKey((key) => key + 1);
    seriesDrawer.openDrawer();
  }

  function requestDeleteSeries(item: SeriesListItem) {
    setSeriesToDelete(item);
    setMutationMessage("");
    deleteDrawer.openDrawer();
  }

  function confirmDeleteSeries() {
    deleteSeries.mutate(undefined, {
      onSuccess: () => deleteDrawer.forceCloseDrawer(),
    });
  }

  const series: SeriesListItem[] = [
    ...recurring.map((item) => toRecurringListItem(item)),
    ...plans.map((plan) => toInstallmentListItem(plan)),
  ].sort((left, right) => Number(right.active) - Number(left.active));

  if (recurringQuery.isError || plansQuery.isError) {
    return (
      <div
        role="alert"
        className="mx-auto max-w-5xl rounded-2xl border border-rose-500/30 bg-graphite-800 p-6 text-sm text-rose-500"
      >
        Não foi possível carregar seus cadastros. Tente novamente.
      </div>
    );
  }

  const messages: Record<string, string> = {
    saved: "Cadastro salvo. As ocorrências serão criadas ao abrir cada mês.",
    updated:
      "Cadastro atualizado. Novas ocorrências usarão esses dados; lançamentos já gerados permanecem iguais.",
    deactivated: "Cadastro encerrado. Os lançamentos já criados continuam no mês.",
    "series-deleted": "Cadastro excluído. Os lançamentos já criados foram mantidos.",
  };
  const message = mutationMessage
    ? (messages[mutationMessage] ??
      errors[mutationMessage] ??
      "Não foi possível concluir a ação.")
    : urlError
      ? (errors[urlError] ?? "Não foi possível concluir a ação.")
      : saved
        ? messages.saved
        : deactivated
          ? messages.deactivated
          : "";
  const messageIsError = Boolean(
    (mutationMessage &&
      !["saved", "deactivated", "updated", "series-deleted"].includes(mutationMessage)) ||
    urlError,
  );

  return (
    <section
      className="mx-auto max-w-5xl"
      aria-busy={isLoading || undefined}
    >
      <header className="mb-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">
            Recorrências
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted sm:text-[15px]">
            Organize receitas e despesas que se repetem ou têm parcelas.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          leadingIcon="PlusOutline"
          onClick={openNewSeries}
          rounded
          size="sm"
          type="button"
          variant="primary"
        >
          Nova recorrência
        </Button>
      </header>

      {message && (
        <p
          className={cn(
            "mb-5 rounded-xl px-4 py-3 text-sm",
            messageIsError
              ? "border border-rose-500/30 bg-graphite-800 text-rose-500"
              : "border border-mint-500/30 bg-graphite-800 text-mint-300",
          )}
          role={messageIsError ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      <SeriesList
        items={series}
        loading={isLoading}
        onEdit={editSeries}
        onDeactivate={(form) => {
          setMutationMessage("");
          deactivate.mutate(form);
        }}
        deactivatePending={deactivate.isPending}
        onDelete={requestDeleteSeries}
        deletePending={deleteSeries.isPending}
      />

      <SeriesFormDrawer
        key={formKey}
        drawer={seriesDrawer}
        currentDate={currentDate}
        initialData={seriesToEdit?.initialData}
        error={
          saveSeries.isError
            ? (errors[saveSeries.error.message] ?? errors["save-series"])
            : undefined
        }
        pending={saveSeries.isPending}
        onSubmit={submitSeries}
      />

      <Drawer {...deleteDrawer.props}>
        <DrawerContent>
          {seriesToDelete && (
            <>
              <DrawerHeader className="px-3 pb-3 pt-4 text-left">
                <DrawerTitle className="text-base">
                  Excluir cadastro?
                </DrawerTitle>
                <DrawerDescription>
                  “{seriesToDelete.title}” será removido. Os lançamentos já
                  criados serão mantidos como avulsos e deixarão de ser
                  atualizados por este cadastro.
                </DrawerDescription>
              </DrawerHeader>
              <DrawerBody className="px-3 pb-5">
                {deleteSeries.isError && (
                  <p
                    className="rounded-xl border border-rose-800 bg-rose-900 px-3 py-2 text-sm text-rose-100"
                    role="alert"
                  >
                    {errors[deleteSeries.error.message] ??
                      errors["delete-series"]}
                  </p>
                )}
              </DrawerBody>
              <DrawerFooter className="border-t border-line/30 px-3 pb-3 pt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    disabled={deleteSeries.isPending}
                    onClick={deleteDrawer.closeDrawer}
                    rounded
                    type="button"
                    variant="secondary"
                  >
                    Cancelar
                  </Button>
                  <Button
                    disabled={deleteSeries.isPending}
                    leadingIcon="TrashOutline"
                    loading={deleteSeries.isPending}
                    onClick={confirmDeleteSeries}
                    rounded
                    type="button"
                    variant="destructive"
                  >
                    Excluir
                  </Button>
                </div>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </section>
  );
}

function toRecurringListItem(item: RecurringItem): SeriesListItem {
  const seriesType =
    item.entry_type === "income"
      ? item.category === "Salário"
        ? "salary"
        : "other_income"
      : item.category === "Dívidas e parcelas"
        ? "purchase"
        : item.category === "Fixos"
          ? "service"
          : "other_expense";

  return {
    id: item.id,
    kind: "recurrence",
    title: item.title,
    detail: `${item.entry_type === "income" ? "Receita" : "Despesa"} · ${item.due_day ? `vence dia ${item.due_day}` : "sem vencimento"} · desde ${formatDate(item.starts_on)}${item.ends_on ? ` · até ${formatDate(item.ends_on)}` : " · sem data final"}`,
    amount: `${formatCurrency(Number(item.planned_amount))} / mês`,
    active: item.is_active,
    initialData: {
      id: item.id,
      kind: "recurrence",
      title: item.title,
      seriesType,
      amount: Number(item.planned_amount),
      dueDay: item.due_day,
      startsOn: item.starts_on,
      endsOn: item.ends_on,
    },
  };
}

function toInstallmentListItem(plan: InstallmentPlan): SeriesListItem {
  const seriesType =
    plan.category === "Fixos" ? "service" : "purchase";

  return {
    id: plan.id,
    kind: "installment",
    title: plan.title,
    detail: `${plan.installment_count} parcelas · ${formatDate(plan.starts_on)} a ${formatDate(plan.ends_on)}${plan.due_day ? ` · vence dia ${plan.due_day}` : ""}`,
    amount: `${formatCurrency(installmentAmount(Number(plan.total_amount), plan.installment_count, 1))} / parcela`,
    active: plan.is_active,
    initialData: {
      id: plan.id,
      kind: "installment",
      title: plan.title,
      seriesType,
      amount: Number(plan.total_amount),
      dueDay: plan.due_day,
      startsOn: plan.starts_on,
      endsOn: plan.ends_on,
      installmentCount: plan.installment_count,
    },
  };
}

function SeriesList({
  items,
  loading,
  onEdit,
  onDeactivate,
  deactivatePending,
  onDelete,
  deletePending,
}: {
  items: SeriesListItem[];
  loading: boolean;
  onEdit: (item: SeriesListItem) => void;
  onDeactivate: (form: FormData) => void;
  deactivatePending: boolean;
  onDelete: (item: SeriesListItem) => void;
  deletePending: boolean;
}) {
  const activeCount = items.filter((item) => item.active).length;

  if (!loading && items.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-line bg-graphite-800 px-4 text-center">
        <span
          className="grid size-11 place-items-center rounded-full bg-accent-soft text-accent"
          aria-hidden="true"
        >
          <NextIcon name="RecordsOutline" />
        </span>
        <h3 className="mt-3 font-semibold text-ink">
          Nenhuma recorrência ainda
        </h3>
        <p className="mt-3 max-w-xs text-sm leading-5 text-muted">
          Cadastre salários, serviços, financiamentos ou compras parceladas.
        </p>
      </div>
    );
  }

  return (
    <Card asChild sections className="overflow-hidden">
      <section aria-label="Cadastros automáticos">
        <CardSection className="flex items-center justify-between gap-3 bg-graphite-600">
          <div className="w-full">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-[15px] font-semibold text-ink">
                Cadastros automáticos
              </h2>
              {loading ? (
                <Skeleton className="h-5 w-16 rounded-full" />
              ) : (
                <Badge size="sm" variant="secondary">
                  {activeCount} ativos
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">
              Recorrências e parcelamentos em um só lugar.
            </p>
          </div>
        </CardSection>
        {loading ? (
          <div aria-label="Carregando cadastros" className="divide-y divide-line">
            {Array.from({ length: 6 }, (_, index) => (
              <CardSection
                className="flex items-center justify-between gap-4"
                key={index}
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/5 rounded-md" />
                  <Skeleton className="h-3 w-3/5 rounded-md" />
                  <Skeleton className="h-3 w-1/4 rounded-md" />
                </div>
                <Skeleton className="h-8 w-20 shrink-0 rounded-full" />
              </CardSection>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-line">
            {items.map((item) => (
              <CardSection
                className="flex items-start justify-between gap-4"
                key={`${item.kind}-${item.id}`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={cn(
                        "truncate text-sm font-medium",
                        item.active ? "text-ink" : "text-muted",
                      )}
                    >
                      {item.title}
                    </h3>
                    <Badge size="sm" variant="outline">
                      {item.kind === "recurrence" ? "Recorrência" : "Parcelado"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">{item.detail}</p>
                  <p className="mt-1 text-xs font-medium text-ink">
                    <FinancialValue>{item.amount}</FinancialValue>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    disabled={deletePending || deactivatePending}
                    onClick={() => onEdit(item)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Editar
                  </Button>
                  {item.active ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        onDeactivate(new FormData(event.currentTarget));
                      }}
                    >
                      <Input type="hidden" name="id" value={item.id} />
                      <Input type="hidden" name="kind" value={item.kind} />
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
                    <Badge size="sm" variant="ghost">
                      Encerrado
                    </Badge>
                  )}
                  <Button
                    aria-label={`Excluir cadastro ${item.title}`}
                    disabled={deletePending}
                    icon="TrashOutline"
                    onClick={() => onDelete(item)}
                    size="icon-sm"
                    type="button"
                    variant="destructive-ghost"
                  />
                </div>
              </CardSection>
            ))}
          </div>
        )}
      </section>
    </Card>
  );
}
