"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  addMonths,
  formatMoney,
  localDateString,
  monthString,
  parseMonth,
  type FinancialEntry,
} from "@/features/transactions/lib/data";
import { useMonthData } from "@/features/transactions/hooks/use-month-data";
import { fetchMonthEntries } from "@/features/transactions/lib/queries";
import { invalidateFinanceQueries } from "@/features/transactions/lib/invalidate-finance-queries";
import { queryKeys } from "@/shared/lib/query-keys";
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
import { MobileMonthView } from "@/features/transactions/components/mobile-month-view";
import { MonthlyEntryList } from "@/features/transactions/components/monthly-entry-list";
import { useMobileApp } from "@/shared/hooks/use-mobile-app";
import { useAppShellHeaderContent } from "@/shared/components/app-shell-header-slot";
import { ResponsivePageSkeleton } from "@/shared/components/responsive-page-skeleton";
import {
  copyPreviousMonthEntries,
  deleteFinancialEntry,
  deleteMonthEntries as deleteMonthEntriesAction,
  createFinancialEntry,
  updateFinancialEntry,
} from "@/features/transactions/actions";

const errorMessages: Record<string, string> = {
  "invalid-entry":
    "Confira a descrição, o valor, a competência e o vencimento.",
  "save-entry": "Não foi possível salvar o lançamento. Tente novamente.",
  "entry-unavailable": "Esse lançamento não está mais disponível para edição.",
  "update-series": "Não foi possível atualizar os próximos meses.",
  "update-entry": "Não foi possível atualizar o lançamento.",
  "delete-entry": "Falha ao excluir o lançamento.",
  "copy-month": "Não foi possível copiar os dados do mês anterior.",
  "delete-month": "Não foi possível apagar os dados deste mês.",
};

const successMessages: Record<string, string> = {
  "month-copied": "Dados do mês anterior copiados.",
  "month-copy-empty": "Não havia novos lançamentos para copiar.",
  "month-deleted": "Todos os lançamentos deste mês foram apagados.",
};

function isSuccessMutationMessage(message: string) {
  return message === "saved" || message in successMessages;
}

export function MonthlyLedger({
  month: initialMonth,
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
  const [month, setMonth] = useState(initialMonth);
  const [previewMonth, setPreviewMonth] = useState<Date | null>(null);
  const initialMonthValue = monthString(initialMonth);

  useEffect(() => {
    setMonth(parseMonth(initialMonthValue));
  }, [initialMonthValue]);

  useEffect(() => {
    const syncMonthFromUrl = () => {
      const monthQuery = new URLSearchParams(window.location.search).get(
        "month",
      );
      setMonth(parseMonth(monthQuery ?? undefined));
    };

    window.addEventListener("popstate", syncMonthFromUrl);
    return () => window.removeEventListener("popstate", syncMonthFromUrl);
  }, []);

  const selectMonth = (nextMonth: Date) => {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("month", monthString(nextMonth));
    nextUrl.searchParams.delete("error");
    nextUrl.searchParams.delete("saved");
    window.history.pushState(null, "", nextUrl.toString());
    setMonth(nextMonth);
  };

  useAppShellHeaderContent(String((previewMonth ?? month).getFullYear()));
  const isMobileApp = useMobileApp();
  const monthValue = monthString(month);
  const previousMonth = addMonths(month, -1);
  const previousMonthValue = monthString(previousMonth);
  const previousMonthQuery = useQuery({
    queryKey: queryKeys.monthEntries(householdId, previousMonthValue),
    queryFn: () => fetchMonthEntries(householdId, previousMonth),
    enabled: Boolean(isMobileApp && householdId),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
  const {
    entries: entriesQuery,
    setStatus,
    ensureEntries,
  } = useMonthData({
    householdId,
    userId,
    month: monthValue,
  });
  const queryClient = useQueryClient();
  const [mutationMessage, setMutationMessage] = useState("");
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const invalidateFinance = () =>
    invalidateFinanceQueries(queryClient, householdId, {
      revalidateOccurrences: true,
    });
  const createEntry = useMutation({
    mutationFn: async (form: FormData) => {
      const result = await createFinancialEntry(form);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: async () => {
      setCreateDrawerOpen(false);
      setMutationMessage("saved");
      await invalidateFinance();
    },
    onError: (caught) =>
      setMutationMessage(
        caught instanceof Error ? caught.message : "save-entry",
      ),
  });
  const updateEntry = useMutation({
    mutationFn: async (form: FormData) => {
      const result = await updateFinancialEntry(form);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: async () => {
      setMutationMessage("saved");
      await invalidateFinance();
    },
    onError: (caught) =>
      setMutationMessage(
        caught instanceof Error ? caught.message : "update-entry",
      ),
  });
  const deleteEntry = useMutation({
    mutationFn: async (form: FormData) => {
      const result = await deleteFinancialEntry(form);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: async () => {
      setMutationMessage("saved");
      await invalidateFinance();
    },
    onError: (caught) =>
      setMutationMessage(
        caught instanceof Error ? caught.message : "delete-entry",
      ),
  });
  const copyMonthEntries = useMutation({
    mutationFn: async () => {
      const result = await copyPreviousMonthEntries(monthValue);
      if (result.error) throw new Error(result.error);
      return result.count;
    },
    onSuccess: async (count) => {
      setMutationMessage(
        (count ?? 0) > 0 ? "month-copied" : "month-copy-empty",
      );
      await invalidateFinance();
      await entriesQuery.refetch();
    },
    onError: (caught) =>
      setMutationMessage(
        caught instanceof Error ? caught.message : "copy-month",
      ),
  });
  const deleteMonthEntries = useMutation({
    mutationFn: async () => {
      const result = await deleteMonthEntriesAction(monthValue);
      if (result.error) throw new Error(result.error);
      return result.count;
    },
    onSuccess: async () => {
      setMutationMessage("month-deleted");
      await invalidateFinance();
    },
    onError: (caught) =>
      setMutationMessage(
        caught instanceof Error ? caught.message : "delete-month",
      ),
  });
  const entries = entriesQuery.data ?? [];
  const entryLoadFailed = entriesQuery.isError || ensureEntries.isError;
  const loadFailed = entryLoadFailed;
  const income = sum(entries, "income");
  const expenses = sum(entries, "expense");
  const settledIncome = sum(entries, "income", "settled");
  const settledExpenses = sum(entries, "expense", "settled");
  const previousMonthBalance = previousMonthQuery.data
    ? sum(previousMonthQuery.data, "income") -
      sum(previousMonthQuery.data, "expense")
    : undefined;
  const today = localDateString();
  const pendingCount = entries.filter(
    (entry) => entry.status === "planned",
  ).length;
  const overdueCount = entries.filter(
    (entry) =>
      entry.status === "planned" && entry.due_date && entry.due_date < today,
  ).length;
  const entriesNeedInitialLoad =
    entriesQuery.isPending && entriesQuery.data === undefined;
  const isLoading = entriesNeedInitialLoad && !ensureEntries.isError;

  const setEntryStatus = async (
    id: string,
    nextStatus: "planned" | "settled",
  ) => {
    setMutationMessage("");
    await setStatus.mutateAsync({ id, nextStatus });
  };
  const updateEntryFromForm = async (form: FormData) => {
    setMutationMessage("");
    await updateEntry.mutateAsync(form);
  };
  const deleteEntryFromForm = async (form: FormData) => {
    setMutationMessage("");
    await deleteEntry.mutateAsync(form);
  };
  const copyPreviousMonth = async () => {
    setMutationMessage("");
    const ensured = await ensureEntries.refetch();
    if (ensured.isError) throw ensured.error;
    await copyMonthEntries.mutateAsync();
  };
  const clearMonth = async () => {
    setMutationMessage("");
    await deleteMonthEntries.mutateAsync();
  };
  const monthActionsPending =
    copyMonthEntries.isPending || deleteMonthEntries.isPending;
  const openCreateDrawer = () => {
    setMutationMessage("");
    createEntry.reset();
    setCreateDrawerOpen(true);
  };
  const newEntryDrawer = (
    <NewEntryDrawer
      open={createDrawerOpen}
      onOpenChange={setCreateDrawerOpen}
      month={monthValue}
      pending={createEntry.isPending}
      error={
        createEntry.isError
          ? createEntry.error instanceof Error
            ? createEntry.error.message
            : "save-entry"
          : ""
      }
      onSubmit={(form) => {
        setMutationMessage("");
        createEntry.mutate(form);
      }}
    />
  );

  if (isMobileApp === null) {
    return (
      <ResponsivePageSkeleton>
        <div className="mx-auto max-w-xl space-y-3">
          <div className="flex h-10 items-center justify-between gap-2 px-3">
            {Array.from({ length: 7 }, (_, index) => (
              <Skeleton
                aria-hidden="true"
                className="w-8 size-4 rounded-xl"
                key={index}
              />
            ))}
          </div>
          <Skeleton aria-hidden="true" className="h-40 rounded-3xl" />
        </div>
      </ResponsivePageSkeleton>
    );
  }

  if (!isMobileApp && isLoading) {
    return (
      <div aria-live="polite" aria-busy="true">
        <section className="mx-auto max-w-5xl">
          <header className="mb-7">
            <Eyebrow>Resumo mensal</Eyebrow>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">
              {formatMonth(month)}
            </h1>
            <p className="mt-2 text-sm text-muted">Carregando saldo...</p>
          </header>
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <Skeleton
                key={item}
                className="rounded-[18px] border border-line bg-graphite-900 shadow-card h-28"
              />
            ))}
          </div>
          <div className="mt-5 rounded-[18px] border border-line bg-graphite-900 p-5 shadow-card sm:p-7">
            <div
              aria-label="Carregando lançamentos"
              aria-live="polite"
              aria-busy="true"
              role="status"
            >
              <div aria-hidden="true" className="flex flex-col gap-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton
                    className="h-[72px] w-full rounded-xl border border-graphite-600 bg-graphite-700"
                    key={index}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (isMobileApp) {
    return (
      <>
        {setStatus.isError && (
          <p
            className="mx-auto mb-3 max-w-xl rounded-xl border border-rose-800 bg-rose-900 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            Não foi possível atualizar o lançamento. Tente novamente.
          </p>
        )}
        <MobileMonthView
          currentBalance={income - expenses}
          previousBalance={previousMonthBalance}
          isBalancePending={isLoading}
          isEntriesError={entryLoadFailed}
          isPreviousBalancePending={previousMonthQuery.isPending}
          entries={entries}
          monthValue={monthValue}
          onSetEntryStatus={setEntryStatus}
          statusPendingId={
            setStatus.isPending ? setStatus.variables?.id : undefined
          }
          onUpdateEntry={updateEntryFromForm}
          onDeleteEntry={deleteEntryFromForm}
          onCopyPreviousMonth={copyPreviousMonth}
          onDeleteMonth={clearMonth}
          monthActionsPending={monthActionsPending}
          onCreateEntry={openCreateDrawer}
          rowMutationPending={updateEntry.isPending || deleteEntry.isPending}
          month={month}
          onMonthPreview={setPreviewMonth}
          onMonthSelect={selectMonth}
        />
        {newEntryDrawer}
      </>
    );
  }

  return (
    <>
      <section className="mx-auto flex min-h-[calc(100dvh_-_12rem_-_env(safe-area-inset-top))] max-w-5xl flex-col sm:min-h-[calc(100dvh_-_13.75rem_-_env(safe-area-inset-top))] lg:min-h-[calc(100dvh_-_9.75rem)]">
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
            className="mb-5 rounded-xl border border-rose-800 bg-rose-900 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            {errorMessages[error] ?? "Não foi possível concluir a ação."}
          </p>
        )}
        {saved && (
          <p
            className="mb-5 rounded-xl border border-mint-800 bg-mint-900 px-4 py-3 text-sm text-mint-100"
            role="status"
          >
            Alterações salvas.
          </p>
        )}
        {mutationMessage && (
          <p
            className={`mb-5 rounded-xl px-4 py-3 text-sm ${isSuccessMutationMessage(mutationMessage) ? "border border-mint-800 bg-mint-900 text-mint-100" : "border border-rose-800 bg-rose-900 text-rose-100"}`}
            role={
              isSuccessMutationMessage(mutationMessage) ? "status" : "alert"
            }
          >
            {successMessages[mutationMessage] ??
              (mutationMessage === "saved"
                ? "Alterações salvas."
                : (errorMessages[mutationMessage] ??
                  "Não foi possível salvar. Tente novamente."))}
          </p>
        )}
        {setStatus.isError && (
          <p
            className="mb-5 rounded-xl border border-rose-800 bg-rose-900 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            Não foi possível atualizar o lançamento. Tente novamente.
          </p>
        )}
        {loadFailed && (
          <p
            className="mb-5 rounded-xl border border-rose-800 bg-rose-900 px-4 py-3 text-sm text-rose-100"
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

        <div className="mt-5 flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col rounded-[18px] border border-line bg-graphite-900 p-5 shadow-card sm:p-7">
            <MonthlyEntryList
              entries={entries}
              month={monthValue}
              onCreateEntry={openCreateDrawer}
              onSetStatus={setEntryStatus}
              statusPendingId={
                setStatus.isPending ? setStatus.variables?.id : undefined
              }
              onUpdate={updateEntryFromForm}
              onDelete={deleteEntryFromForm}
              onCopyPreviousMonth={copyPreviousMonth}
              onDeleteMonth={clearMonth}
              monthActionsPending={monthActionsPending}
              rowMutationPending={
                updateEntry.isPending || deleteEntry.isPending
              }
              headerContent={
                <p className="px-3 text-sm text-muted">
                  Valores cadastrados neste mês.
                </p>
              }
              isLoading={isLoading}
              loadError={entryLoadFailed}
            />
          </div>
        </div>
      </section>
      {newEntryDrawer}
    </>
  );
}

function NewEntryDrawer({
  open,
  onOpenChange,
  month,
  pending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  pending: boolean;
  error: string;
  onSubmit: (form: FormData) => void;
}) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      shouldScaleBackground={false}
    >
      {open && (
        <DrawerContent>
          <DrawerHeader className="shrink-0 px-3 pb-3 pt-4 text-left">
            <DrawerTitle className="text-base">Novo lançamento</DrawerTitle>
          </DrawerHeader>
          <form
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(new FormData(event.currentTarget));
            }}
          >
            <DrawerBody className="space-y-4 px-3 pb-5">
              {error && (
                <p
                  className="rounded-xl border border-rose-800 bg-rose-900 px-3 py-2 text-sm text-rose-100"
                  role="alert"
                >
                  {errorMessages[error] ??
                    "Não foi possível salvar o lançamento. Tente novamente."}
                </p>
              )}
              <Select
                label="Tipo"
                name="entry_type"
                defaultValue="expense"
                variant="secondary"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                </SelectContent>
              </Select>
              <EntryFields month={month} />
            </DrawerBody>
            <DrawerFooter className="shrink-0 border-t border-line px-3 pb-3 pt-4">
              <Button
                className="w-full"
                disabled={pending}
                type="submit"
                variant="primary"
                loading={pending}
                rounded
              >
                {pending ? "Salvando…" : "Salvar lançamento"}
              </Button>
              <Button
                className="w-full"
                disabled={pending}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="secondary"
                rounded
              >
                Cancelar
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      )}
    </Drawer>
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
    <div className="rounded-[18px] border border-line bg-graphite-900 shadow-card min-h-[112px] p-4 sm:p-5">
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
    <Button asChild className="size-9 min-h-9 p-0" size="sm" variant="outline">
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
