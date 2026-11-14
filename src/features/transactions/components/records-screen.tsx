"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NextIcon } from "@/components/atoms/next-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  CreditCard,
  InstallmentPlan,
  RecurringItem,
} from "@/features/transactions/lib/data";
import { creditCardLabel } from "@/features/credit-cards/components/credit-card-select";
import {
  fetchInstallmentPlans,
  fetchRecurringItems,
  fetchCreditCards,
} from "@/features/transactions/lib/queries";
import { getDefaultSeriesType } from "@/features/transactions/lib/categories";
import { invalidateFinanceQueries } from "@/features/transactions/lib/invalidate-finance-queries";
import { formatCurrency, installmentAmount } from "@/shared/lib/currency";
import { FinancialValue } from "@/shared/components/financial-values";
import { formatDate, localDateString } from "@/shared/lib/date";
import { queryKeys } from "@/shared/lib/query-keys";
import { cn } from "@/shared/lib/utils";

const errors: Record<string, string> = {
  "save-series": "Não foi possível salvar a programação.",
  "update-series": "Não foi possível atualizar a programação.",
  "deactivate-series": "Não foi possível encerrar esta programação.",
  "delete-series": "Não foi possível excluir esta programação.",
};

type SeriesListItem = {
  id: string;
  kind: "recurrence" | "installment";
  entryType: "income" | "expense";
  category: string;
  creditCardId: string | null;
  title: string;
  details: { label: string; value: string }[];
  amount: number;
  amountCaption: string;
  active: boolean;
  initialData: SeriesFormInitialData;
};

type SeriesFilters = {
  entryType: "all" | "income" | "expense";
  kind: "all" | "recurrence" | "installment";
  status: "all" | "active" | "inactive";
  card: string;
  category: string;
};

const defaultSeriesFilters: SeriesFilters = {
  entryType: "all",
  kind: "all",
  status: "all",
  card: "all",
  category: "all",
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
  const cardsQuery = useQuery({
    queryKey: queryKeys.creditCards(spaceId),
    queryFn: () => fetchCreditCards(spaceId),
  });
  const cardsById = new Map(
    (cardsQuery.data ?? []).map((card) => [card.id, card]),
  );
  const recurring = recurringQuery.data ?? [];
  const plans = plansQuery.data ?? [];
  const isLoading =
    recurringQuery.isPending || plansQuery.isPending || cardsQuery.isPending;
  const currentDate = localDateString();
  const queryClient = useQueryClient();
  const [mutationMessage, setMutationMessage] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [seriesToEdit, setSeriesToEdit] = useState<SeriesListItem | null>(null);
  const [seriesToDelete, setSeriesToDelete] = useState<SeriesListItem | null>(
    null,
  );
  const [filters, setFilters] = useState(defaultSeriesFilters);

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
      const isEditing = Boolean(String(form.get("id") ?? "").trim());
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
      setMutationMessage(
        caught instanceof Error ? caught.message : "save-series",
      ),
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
    ...recurring.map((item) => toRecurringListItem(item, cardsById)),
    ...plans.map((plan) => toInstallmentListItem(plan, cardsById)),
  ].sort((left, right) => Number(right.active) - Number(left.active));
  const categories = Array.from(
    new Set(series.map((item) => item.category)),
  ).sort((left, right) => left.localeCompare(right, "pt-BR"));
  const filteredSeries = series.filter((item) => {
    if (filters.entryType !== "all" && item.entryType !== filters.entryType)
      return false;
    if (filters.kind !== "all" && item.kind !== filters.kind) return false;
    if (
      filters.status !== "all" &&
      item.active !== (filters.status === "active")
    ) {
      return false;
    }
    if (filters.card === "none" && item.creditCardId) return false;
    if (filters.card === "with_card" && !item.creditCardId) return false;
    if (
      filters.card !== "all" &&
      filters.card !== "none" &&
      filters.card !== "with_card" &&
      item.creditCardId !== filters.card
    ) {
      return false;
    }
    if (filters.category !== "all" && item.category !== filters.category)
      return false;
    return true;
  });
  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) =>
      value !== defaultSeriesFilters[key as keyof SeriesFilters],
  );

  if (recurringQuery.isError || plansQuery.isError || cardsQuery.isError) {
    return (
      <div
        role="alert"
        className="mx-auto max-w-5xl rounded-2xl border border-rose-500/30 bg-graphite-800 p-6 text-sm text-rose-500"
      >
        Não foi possível carregar suas programações. Tente novamente.
      </div>
    );
  }

  const messages: Record<string, string> = {
    saved: "Programação salva. Os lançamentos serão gerados ao abrir cada mês.",
    updated:
      "Programação atualizada. Os próximos lançamentos usarão esses dados; os já gerados permanecem iguais.",
    deactivated:
      "Programação encerrada. Os lançamentos já criados continuam no mês.",
    "series-deleted":
      "Programação excluída. Os lançamentos já criados foram mantidos.",
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
      !["saved", "deactivated", "updated", "series-deleted"].includes(
        mutationMessage,
      )) ||
    urlError,
  );

  return (
    <section
      className="mx-auto flex max-w-5xl flex-col gap-3"
      aria-busy={isLoading || undefined}
    >
      <header className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">
            Programações
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted sm:text-[15px]">
            Programe receitas e despesas mensais ou parceladas para os próximos
            meses.
          </p>
        </div>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          {series.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={
                    hasActiveFilters
                      ? "Filtros de programações ativos"
                      : "Filtros de programações"
                  }
                  className="shrink-0"
                  rounded
                  type="button"
                  variant="secondary"
                >
                  Filtros
                  {hasActiveFilters && (
                    <span
                      aria-hidden="true"
                      className="ml-1 size-1.5 rounded-full bg-accent"
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-3">
                <div className="flex flex-col gap-3">
                  <Select
                    label="Natureza"
                    containerClassName="flex-row items-center gap-3 [&>label]:w-20 [&>label]:shrink-0 [&>div]:min-w-0 [&>div]:flex-1 [&>div]:shrink"
                    onValueChange={(entryType) =>
                      setFilters((current) => ({
                        ...current,
                        entryType: entryType as SeriesFilters["entryType"],
                      }))
                    }
                    value={filters.entryType}
                    variant="secondary"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Receitas e despesas</SelectItem>
                      <SelectItem value="income">Receitas</SelectItem>
                      <SelectItem value="expense">Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    label="Formato"
                    containerClassName="flex-row items-center gap-3 [&>label]:w-20 [&>label]:shrink-0 [&>div]:min-w-0 [&>div]:flex-1 [&>div]:shrink"
                    onValueChange={(kind) =>
                      setFilters((current) => ({
                        ...current,
                        kind: kind as SeriesFilters["kind"],
                      }))
                    }
                    value={filters.kind}
                    variant="secondary"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Mensais e parceladas</SelectItem>
                      <SelectItem value="recurrence">Mensais</SelectItem>
                      <SelectItem value="installment">Parceladas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    label="Situação"
                    containerClassName="flex-row items-center gap-3 [&>label]:w-20 [&>label]:shrink-0 [&>div]:min-w-0 [&>div]:flex-1 [&>div]:shrink"
                    onValueChange={(status) =>
                      setFilters((current) => ({
                        ...current,
                        status: status as SeriesFilters["status"],
                      }))
                    }
                    value={filters.status}
                    variant="secondary"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Ativas e encerradas</SelectItem>
                      <SelectItem value="active">Ativas</SelectItem>
                      <SelectItem value="inactive">Encerradas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    label="Cartão"
                    containerClassName="flex-row items-center gap-3 [&>label]:w-20 [&>label]:shrink-0 [&>div]:min-w-0 [&>div]:flex-1 [&>div]:shrink"
                    onValueChange={(card) =>
                      setFilters((current) => ({ ...current, card }))
                    }
                    value={filters.card}
                    variant="secondary"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os cartões</SelectItem>
                      <SelectItem value="with_card">Com cartão</SelectItem>
                      <SelectItem value="none">Sem cartão</SelectItem>
                      {(cardsQuery.data ?? []).map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {creditCardLabel(card)}
                          {card.is_active ? "" : " (inativo)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    label="Categoria"
                    containerClassName="flex-row items-center gap-3 [&>label]:w-20 [&>label]:shrink-0 [&>div]:min-w-0 [&>div]:flex-1 [&>div]:shrink"
                    onValueChange={(category) =>
                      setFilters((current) => ({ ...current, category }))
                    }
                    value={filters.category}
                    variant="secondary"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {hasActiveFilters && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => setFilters(defaultSeriesFilters)}
                    >
                      Limpar filtros
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            className="min-w-0 flex-1 sm:flex-none"
            leadingIcon="PlusOutline"
            onClick={openNewSeries}
            rounded
            type="button"
            variant="primary"
          >
            Nova programação
          </Button>
        </div>
      </header>

      {message && (
        <p
          className={cn(
            "rounded-xl px-4 py-3 text-sm",
            messageIsError
              ? "border border-rose-500/30 bg-graphite-800 text-rose-500"
              : "border border-mint-500/30 bg-graphite-800 text-mint-300",
          )}
          role={messageIsError ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      {!isLoading && series.length > 0 && (
        <p className="text-xs text-muted" role="status">
          {filteredSeries.length} de {series.length} programações
        </p>
      )}

      <SeriesList
        items={filteredSeries}
        totalItems={series.length}
        onClearFilters={() => setFilters(defaultSeriesFilters)}
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
        error={saveSeries.isError ? saveSeries.error.message : undefined}
        pending={saveSeries.isPending}
        onSubmit={submitSeries}
      />

      <Drawer {...deleteDrawer.props}>
        <DrawerContent>
          {seriesToDelete && (
            <>
              <DrawerHeader className="px-3 pb-3 pt-4 text-left">
                <DrawerTitle className="text-base">
                  Excluir programação?
                </DrawerTitle>
                <DrawerDescription>
                  “{seriesToDelete.title}” será removido. Os lançamentos já
                  criados serão mantidos como avulsos e deixarão de ser
                  atualizados por esta programação.
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
                <div className="grid grid-cols-2 gap-3">
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

function toRecurringListItem(
  item: RecurringItem,
  cards: Map<string, CreditCard>,
): SeriesListItem {
  const seriesType = getDefaultSeriesType(item.category, item.entry_type);

  return {
    id: item.id,
    kind: "recurrence",
    entryType: item.entry_type,
    category: item.category ?? "Sem categoria",
    creditCardId: item.credit_card_id,
    title: item.title,
    details: [
      { label: "Tipo", value: "Mensal" },
      {
        label: "Natureza",
        value: item.entry_type === "income" ? "Receita" : "Despesa",
      },
      { label: "Categoria", value: item.category ?? "Sem categoria" },
      ...(item.credit_card_id && cards.has(item.credit_card_id)
        ? [
            {
              label: "Cartão",
              value: `${cards.get(item.credit_card_id)!.bank_name} ···· ${cards.get(item.credit_card_id)!.last_four}`,
            },
          ]
        : []),
      {
        label: "Vencimento",
        value: item.due_day ? `Dia ${item.due_day}` : "Sem vencimento",
      },
      {
        label: "Período",
        value: `${formatDate(item.starts_on)} – ${item.ends_on ? formatDate(item.ends_on) : "Sem término"}`,
      },
    ],
    amount: Number(item.planned_amount),
    amountCaption: "mês",
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
      creditCardId: item.credit_card_id,
    },
  };
}

function toInstallmentListItem(
  plan: InstallmentPlan,
  cards: Map<string, CreditCard>,
): SeriesListItem {
  const seriesType = getDefaultSeriesType(plan.category, "expense");

  return {
    id: plan.id,
    kind: "installment",
    entryType: "expense",
    category: plan.category ?? "Sem categoria",
    creditCardId: plan.credit_card_id,
    title: plan.title,
    details: [
      { label: "Tipo", value: "Parcelado" },
      { label: "Parcelas", value: `${plan.installment_count} parcelas` },
      { label: "Categoria", value: plan.category ?? "Sem categoria" },
      ...(plan.credit_card_id && cards.has(plan.credit_card_id)
        ? [
            {
              label: "Cartão",
              value: `${cards.get(plan.credit_card_id)!.bank_name} ···· ${cards.get(plan.credit_card_id)!.last_four}`,
            },
          ]
        : []),
      {
        label: "Vencimento",
        value: plan.due_day ? `Dia ${plan.due_day}` : "Sem vencimento",
      },
      {
        label: "Período",
        value: `${formatDate(plan.starts_on)} – ${formatDate(plan.ends_on)}`,
      },
    ],
    amount: installmentAmount(
      Number(plan.total_amount),
      plan.installment_count,
      1,
    ),
    amountCaption: "parcela",
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
      creditCardId: plan.credit_card_id,
    },
  };
}

function SeriesList({
  items,
  totalItems,
  onClearFilters,
  loading,
  onEdit,
  onDeactivate,
  deactivatePending,
  onDelete,
  deletePending,
}: {
  items: SeriesListItem[];
  totalItems: number;
  onClearFilters: () => void;
  loading: boolean;
  onEdit: (item: SeriesListItem) => void;
  onDeactivate: (form: FormData) => void;
  deactivatePending: boolean;
  onDelete: (item: SeriesListItem) => void;
  deletePending: boolean;
}) {
  if (!loading && totalItems === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-graphite-800 px-4 text-center">
        <span
          className="grid size-11 place-items-center rounded-full bg-accent-soft text-accent"
          aria-hidden="true"
        >
          <NextIcon name="RecordsOutline" />
        </span>
        <h3 className="font-semibold text-ink">Nenhuma programação ainda</h3>
        <p className="max-w-xs text-sm leading-5 text-muted">
          Programe salários, serviços, financiamentos ou compras parceladas.
        </p>
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-graphite-800 px-4 text-center">
        <h3 className="font-semibold text-ink">
          Nenhuma programação corresponde aos filtros
        </h3>
        <Button onClick={onClearFilters} type="button" variant="secondary">
          Limpar filtros
        </Button>
      </div>
    );
  }

  return (
    <section
      aria-label="Programações financeiras"
      className="flex flex-col gap-3"
    >
      {loading ? (
        <div
          aria-label="Carregando programações"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <Card className="overflow-hidden" key={index}>
              <div className="flex items-center justify-between gap-3 bg-graphite-600 p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-2 rounded-full" />
                  <Skeleton className="h-5 w-36 rounded-md" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end gap-2">
                    <Skeleton className="h-5 w-28 rounded-md" />
                    <Skeleton className="h-3 w-16 rounded-md" />
                  </div>
                  <Skeleton className="size-8 rounded-lg" />
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Skeleton className="h-7 w-full rounded-md" />
                  <Skeleton className="h-7 w-full rounded-md" />
                  <Skeleton className="h-7 w-full rounded-md" />
                  <Skeleton className="col-span-2 h-7 w-full rounded-md sm:col-span-1" />
                </div>
                <div className="border-t border-line/50 pt-3">
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card className="overflow-hidden" key={`${item.kind}-${item.id}`}>
              <div className="flex items-center justify-between gap-3 bg-graphite-600 p-4 sm:p-5">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    aria-label={item.active ? "Ativo" : "Encerrado"}
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      item.active ? "bg-mint-300" : "bg-graphite-500",
                    )}
                    role="img"
                  />
                  <h3
                    className={cn(
                      "min-w-0 break-words text-[15px] font-semibold leading-5",
                      item.active ? "text-ink" : "text-muted",
                    )}
                  >
                    {item.title}
                  </h3>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <p className="flex items-baseline gap-1 text-right text-sm font-semibold tabular-nums text-ink">
                    <FinancialValue>
                      {formatCurrency(item.amount)}
                    </FinancialValue>
                    <span className="text-xs font-normal text-muted">
                      / {item.amountCaption}
                    </span>
                  </p>
                  <SeriesActionsMenu
                    item={item}
                    onEdit={onEdit}
                    onDeactivate={onDeactivate}
                    onDelete={onDelete}
                    deletePending={deletePending}
                    deactivatePending={deactivatePending}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4 p-4 sm:p-5">
                <dl className="flex flex-col gap-3">
                  {item.details.map((detail) => (
                    <div
                      className="flex items-center justify-between gap-4"
                      key={detail.label}
                    >
                      <dt className="shrink-0 text-xs text-muted">
                        {detail.label}
                      </dt>
                      <dd className="min-w-0 break-words text-right text-xs font-medium text-ink">
                        {detail.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function SeriesActionsMenu({
  item,
  onEdit,
  onDeactivate,
  onDelete,
  deletePending,
  deactivatePending,
}: {
  item: SeriesListItem;
  onEdit: (item: SeriesListItem) => void;
  onDeactivate: (form: FormData) => void;
  onDelete: (item: SeriesListItem) => void;
  deletePending: boolean;
  deactivatePending: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`Mais ações para ${item.title}`}
          disabled={deletePending || deactivatePending}
          icon="VerticalDots"
          size="icon-sm"
          type="button"
          variant="ghost"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={deletePending || deactivatePending}
          onSelect={() => onEdit(item)}
          variant="ghost"
        >
          Editar programação
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {item.active && (
          <>
            <DropdownMenuItem
              disabled={deactivatePending}
              onSelect={() => {
                const form = new FormData();
                form.set("id", item.id);
                form.set("kind", item.kind);
                onDeactivate(form);
              }}
              variant="ghost"
            >
              Encerrar programação
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          disabled={deletePending}
          onSelect={() => onDelete(item)}
          variant="destructive-ghost"
        >
          Excluir programação
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
