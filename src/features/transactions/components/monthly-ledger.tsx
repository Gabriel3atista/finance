"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
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
  type HouseholdMember,
} from "@/features/transactions/lib/data";
import { useMonthData } from "@/features/transactions/hooks/use-month-data";
import { fetchMonthEntries } from "@/features/transactions/lib/queries";
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
  cancelFinancialEntry,
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
  "cancel-entry": "Não foi possível cancelar o lançamento.",
};

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
    members: membersQuery,
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
  const invalidateFinance = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.householdMonthEntries(householdId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard(householdId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.forecast(householdId),
    });
  };
  const createEntry = useMutation({
    mutationFn: async (form: FormData) => {
      const result = await createFinancialEntry(form);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      setCreateDrawerOpen(false);
      setMutationMessage("saved");
      invalidateFinance();
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
    onSuccess: () => {
      setMutationMessage("saved");
      invalidateFinance();
    },
    onError: (caught) =>
      setMutationMessage(
        caught instanceof Error ? caught.message : "update-entry",
      ),
  });
  const cancelEntry = useMutation({
    mutationFn: async (form: FormData) => {
      const result = await cancelFinancialEntry(form);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      setMutationMessage("saved");
      invalidateFinance();
    },
    onError: (caught) =>
      setMutationMessage(
        caught instanceof Error ? caught.message : "cancel-entry",
      ),
  });
  const entries = entriesQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const loadFailed =
    entriesQuery.isError || membersQuery.isError || ensureEntries.isError;
  const income = sum(entries, "income");
  const expenses = sum(entries, "expense");
  const settledIncome = sum(entries, "income", "settled");
  const settledExpenses = sum(entries, "expense", "settled");
  const previousMonthBalance = previousMonthQuery.data
    ? sum(previousMonthQuery.data, "income", "settled") -
      sum(previousMonthQuery.data, "expense", "settled")
    : undefined;
  const pendingCount = entries.filter(
    (entry) => entry.status === "planned",
  ).length;
  const today = localDateString();
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
  const cancelEntryFromForm = async (form: FormData) => {
    setMutationMessage("");
    await cancelEntry.mutateAsync(form);
  };
  const openCreateDrawer = () => {
    setMutationMessage("");
    createEntry.reset();
    setCreateDrawerOpen(true);
  };
  const newEntryDrawer = (
    <NewEntryDrawer
      open={createDrawerOpen}
      onOpenChange={setCreateDrawerOpen}
      members={members}
      currentUserId={userId}
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
              <div
                aria-hidden="true"
                className="w-8 size-4 animate-pulse rounded-xl bg-graphite-800"
                key={index}
              />
            ))}
          </div>
          <div
            aria-hidden="true"
            className="h-40 animate-pulse rounded-3xl bg-graphite-800"
          />
        </div>
      </ResponsivePageSkeleton>
    );
  }

  if (!isMobileApp && (isLoading || membersQuery.isPending)) {
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
              <div
                key={item}
                className="rounded-[18px] border border-line bg-graphite-900 shadow-card h-28 animate-pulse"
              />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (isMobileApp) {
    return (
      <>
        <MobileMonthView
          currentBalance={settledIncome - settledExpenses}
          previousBalance={previousMonthBalance}
          isBalancePending={isLoading}
          isPreviousBalancePending={previousMonthQuery.isPending}
          entries={entries}
          members={members}
          currentUserId={userId}
          monthValue={monthValue}
          onSetEntryStatus={setEntryStatus}
          statusPendingId={
            setStatus.isPending ? setStatus.variables?.id : undefined
          }
          onUpdateEntry={updateEntryFromForm}
          onCancelEntry={cancelEntryFromForm}
          onCreateEntry={openCreateDrawer}
          rowMutationPending={updateEntry.isPending || cancelEntry.isPending}
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
            className="mb-5 rounded-xl border border-rose-800 bg-rose-900 px-4 py-3 text-sm text-rose-100"
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
        {setStatus.isError && (
          <p
            className="mb-5 rounded-xl border border-rose-800 bg-rose-900 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            NÃ£o foi possÃ­vel atualizar o lanÃ§amento. Tente novamente.
          </p>
        )}
        {mutationMessage && (
          <p
            className={`mb-5 rounded-xl px-4 py-3 text-sm ${mutationMessage === "saved" ? "border border-success-800 bg-success-900 text-success-100" : "border border-rose-800 bg-rose-900 text-rose-100"}`}
            role={mutationMessage === "saved" ? "status" : "alert"}
          >
            {mutationMessage === "saved"
              ? "Alterações salvas."
              : (errorMessages[mutationMessage] ??
                "Não foi possível salvar. Tente novamente.")}
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

        <div className="mt-5">
          <div className="rounded-[18px] border border-line bg-graphite-900 p-5 shadow-card sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-ink">
                  Lançamentos
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Valores previstos e realizados deste mês.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-full bg-canvas px-3 py-1 text-xs text-muted">
                  {entries.length}
                </span>
                <Button
                  onClick={openCreateDrawer}
                  size="sm"
                  type="button"
                  variant="primary"
                >
                  Novo
                </Button>
              </div>
            </div>
            {entries.length ? (
              <MonthlyEntryList
                entries={entries}
                members={members}
                currentUserId={userId}
                month={monthValue}
                onCreateEntry={openCreateDrawer}
                onSetStatus={setEntryStatus}
                statusPendingId={
                  setStatus.isPending ? setStatus.variables?.id : undefined
                }
                onUpdate={updateEntryFromForm}
                onCancel={cancelEntryFromForm}
                rowMutationPending={
                  updateEntry.isPending || cancelEntry.isPending
                }
                showHeader={false}
              />
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
        </div>
      </section>
      {newEntryDrawer}
    </>
  );
}

function NewEntryDrawer({
  open,
  onOpenChange,
  members,
  currentUserId,
  month,
  pending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: HouseholdMember[];
  currentUserId: string;
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
        <DrawerContent className="max-h-[90dvh] overflow-hidden border-line bg-graphite-900 text-ink">
          <DrawerHeader className="shrink-0 px-5 pb-3 pt-4 text-left sm:px-6">
            <DrawerTitle className="text-base">Novo lançamento</DrawerTitle>
            <DrawerDescription className="text-muted">
              Cadastre uma receita ou despesa avulsa para este mês.
            </DrawerDescription>
          </DrawerHeader>
          <form
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(new FormData(event.currentTarget));
            }}
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
              {error && (
                <p
                  className="rounded-xl border border-rose-800 bg-rose-900 px-3 py-2 text-sm text-rose-100"
                  role="alert"
                >
                  {errorMessages[error] ??
                    "Não foi possível salvar o lançamento. Tente novamente."}
                </p>
              )}
              <p className="text-xs leading-5 text-muted">
                Para cartão, registre a fatura como uma única despesa. Não some
                as compras individuais junto com o pagamento da fatura.
              </p>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
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
                currentUserId={currentUserId}
                month={month}
              />
            </div>
            <DrawerFooter className="shrink-0 border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
              <Button
                className="w-full"
                disabled={pending}
                type="submit"
                variant="primary"
              >
                {pending ? "Salvando…" : "Salvar lançamento"}
              </Button>
              <Button
                className="w-full"
                disabled={pending}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
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
