"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { NextIcon } from "@/components/atoms/next-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  DrawerNested,
  DrawerTitle,
  useDrawer,
} from "@/components/ui/drawer";
import { EntryFields } from "@/features/transactions/components/entry-fields";
import {
  FINANCIAL_CATEGORIES,
  isFinancialCategory,
  normalizeFinancialCategory,
  type FinancialCategory,
} from "@/features/transactions/lib/categories";
import {
  formatMoney,
  localDateString,
  type FinancialEntry,
} from "@/features/transactions/lib/data";
import { FinancialValue } from "@/shared/components/financial-values";
import { cn } from "@/shared/lib/utils";

type CategoryFilterValue = "all" | FinancialCategory;
type EntryStatus = "planned" | "settled";
type MonthAction = "copy" | "delete";

export function MonthlyEntryList({
  entries,
  month,
  onSetStatus,
  statusPendingId,
  onUpdate,
  onDelete,
  onCopyPreviousMonth,
  onDeleteMonth,
  monthActionsPending,
  onCreateEntry,
  rowMutationPending,
  headerContent,
  showHeader = true,
  isLoading = false,
  loadError = false,
}: {
  entries: FinancialEntry[];
  month: string;
  onSetStatus: (id: string, nextStatus: EntryStatus) => Promise<void>;
  statusPendingId?: string;
  onUpdate: (form: FormData) => Promise<void>;
  onDelete: (form: FormData) => Promise<void>;
  onCopyPreviousMonth: () => Promise<void>;
  onDeleteMonth: () => Promise<void>;
  monthActionsPending: boolean;
  onCreateEntry: () => void;
  rowMutationPending: boolean;
  headerContent?: ReactNode;
  showHeader?: boolean;
  isLoading?: boolean;
  loadError?: boolean;
}) {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedEntrySnapshot, setSelectedEntrySnapshot] =
    useState<FinancialEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<FinancialEntry | null>(
    null,
  );
  const closeEntryAfterDeleteRef = useRef(false);
  const [deleteError, setDeleteError] = useState("");
  const [monthAction, setMonthAction] = useState<MonthAction | null>(null);
  const [monthActionError, setMonthActionError] = useState("");
  const [actionError, setActionError] = useState("");
  const entryDrawer = useDrawer({
    onOpenChange: (open) => {
      if (!open) setActionError("");
    },
    onCloseComplete: () => {
      setSelectedEntryId(null);
      setSelectedEntrySnapshot(null);
    },
  });
  const deleteDrawer = useDrawer({
    canClose: () => !rowMutationPending,
    onOpenChange: (open) => {
      if (!open && !rowMutationPending) setDeleteError("");
    },
    onCloseComplete: () => {
      setEntryToDelete(null);
      if (closeEntryAfterDeleteRef.current) {
        closeEntryAfterDeleteRef.current = false;
        entryDrawer.closeDrawer();
      }
    },
  });
  const monthActionDrawer = useDrawer({
    canClose: () => !monthActionsPending,
    onOpenChange: (open) => {
      if (!open && !monthActionsPending) setMonthActionError("");
    },
    onCloseComplete: () => setMonthAction(null),
  });
  const closeEntryDrawer = entryDrawer.closeDrawer;
  const closeDeleteDrawer = deleteDrawer.closeDrawer;
  const closeMonthActionDrawer = monthActionDrawer.closeDrawer;
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilterValue>("all");
  const reducedMotion = useReducedMotion() === true;
  const today = localDateString();
  const selectedEntry =
    entries.find((entry) => entry.id === selectedEntryId) ??
    selectedEntrySnapshot ??
    undefined;
  const filteredEntries = entries.filter(
    (entry) =>
      categoryFilter === "all" ||
      normalizeFinancialCategory(
        entry.category,
        entry.entry_type,
        entry.source_kind,
      ) === categoryFilter,
  );

  function handleCategoryChange(value: string) {
    if (value === "all" || isFinancialCategory(value)) {
      setCategoryFilter(value);
    }
  }

  useEffect(() => {
    closeEntryDrawer();
    closeDeleteDrawer();
    closeMonthActionDrawer();
    closeEntryAfterDeleteRef.current = false;
    setActionError("");
    setDeleteError("");
    setMonthActionError("");
  }, [closeDeleteDrawer, closeEntryDrawer, closeMonthActionDrawer, month]);

  function openEntryDrawer(entry: FinancialEntry) {
    setActionError("");
    setSelectedEntryId(entry.id);
    setSelectedEntrySnapshot(entry);
    entryDrawer.openDrawer();
  }

  async function runAction(action: () => Promise<void>) {
    setActionError("");
    try {
      await action();
      entryDrawer.closeDrawer();
    } catch {
      setActionError("Não foi possível concluir. Tente novamente.");
    }
  }

  async function confirmDelete() {
    if (!entryToDelete) return;

    setDeleteError("");
    const form = new FormData();
    form.set("id", entryToDelete.id);

    try {
      await onDelete(form);
      closeEntryAfterDeleteRef.current = true;
      deleteDrawer.closeDrawer();
    } catch {
      setDeleteError("Falha ao excluir. Tente novamente.");
    }
  }

  async function confirmMonthAction() {
    if (!monthAction) return;
    setMonthActionError("");
    try {
      if (monthAction === "copy") await onCopyPreviousMonth();
      else await onDeleteMonth();
      monthActionDrawer.closeDrawer();
    } catch {
      setMonthActionError(
        monthAction === "copy"
          ? "Não foi possível copiar os dados do mês anterior."
          : "Não foi possível apagar os dados deste mês.",
      );
    }
  }

  return (
    <Drawer {...entryDrawer.props}>
      <section className="flex min-h-0 flex-1 flex-col gap-3">
        {showHeader && (
          <header className="flex flex-nowrap items-center justify-between gap-3 pl-3 py-2">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-moon-100">
                Lançamentos
              </h2>
              <span className="rounded-full bg-graphite-600 p-1 px-2 text-xs text-moon-100">
                {entries.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                aria-label="Novo lançamento"
                leadingIcon="PlusOutline"
                onClick={onCreateEntry}
                type="button"
                variant="primary"
              >
                Novo
              </Button>
              <EntryOptionsMenu
                onActionSelect={(action) => {
                  setMonthAction(action);
                  setMonthActionError("");
                  monthActionDrawer.openDrawer();
                }}
                actionsPending={monthActionsPending}
              />
            </div>
          </header>
        )}
        {headerContent}
        {!showHeader && (
          <div className="mb-3 flex justify-end">
            <EntryOptionsMenu
              onActionSelect={(action) => {
                setMonthAction(action);
                setMonthActionError("");
                monthActionDrawer.openDrawer();
              }}
              actionsPending={monthActionsPending}
            />
          </div>
        )}
        <CategoryFilter
          value={categoryFilter}
          onValueChange={handleCategoryChange}
        />
        <div className="min-h-0 flex-1">
          {isLoading ? (
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
          ) : filteredEntries.length ? (
            <div className="flex flex-col gap-3">
              {filteredEntries.map((entry) => (
                <SwipeableEntry
                  ariaLabel={`${entry.title}, ${entry.entry_type === "income" ? "Receita" : "Despesa"}, ${normalizeFinancialCategory(entry.category, entry.entry_type, entry.source_kind)}, ${formatMoney(Number(entry.amount))}, ${statusLabel(entry, today)}. Abrir detalhes`}
                  entry={entry}
                  key={entry.id}
                  onOpen={() => openEntryDrawer(entry)}
                  onSetStatus={onSetStatus}
                  reducedMotion={reducedMotion}
                  statusPending={statusPendingId === entry.id}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="flex min-w-0 items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <NextIcon
                          className={
                            entry.status === "settled"
                              ? "text-mint-300"
                              : "text-muted"
                          }
                          name={
                            entry.status === "settled"
                              ? "CheckRoundedFilled"
                              : "ClockRoundedFilled"
                          }
                          size="md"
                        />
                        <span className="truncate text-sm font-medium text-ink">
                          {entry.title}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-semibold tabular-nums",
                          entry.entry_type === "income"
                            ? "text-mint-300"
                            : "text-ink",
                        )}
                      >
                        <FinancialValue>
                          {entry.entry_type === "income" ? "+" : "−"}
                          {formatMoney(Number(entry.amount))}
                        </FinancialValue>
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      {entry.due_date ? (
                        <Badge
                          size="sm"
                          variant={
                            entry.status === "planned" && entry.due_date < today
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {entry.status === "planned" && entry.due_date < today
                            ? "Vencido"
                            : "Vence"}{" "}
                          {formatDate(entry.due_date)}
                        </Badge>
                      ) : (
                        <Badge size="sm" variant="secondary">
                          Sem vencimento
                        </Badge>
                      )}
                      <Badge
                        className="max-w-[140px] truncate sm:max-w-[180px]"
                        size="sm"
                        title={normalizeFinancialCategory(
                          entry.category,
                          entry.entry_type,
                          entry.source_kind,
                        )}
                        variant="secondary"
                      >
                        {normalizeFinancialCategory(
                          entry.category,
                          entry.entry_type,
                          entry.source_kind,
                        )}
                      </Badge>
                    </span>
                  </span>
                </SwipeableEntry>
              ))}
            </div>
          ) : loadError ? (
            <p
              className="rounded-xl border border-rose-800 bg-rose-900 px-4 py-3 text-sm text-rose-100"
              role="alert"
            >
              Não foi possível carregar os lançamentos. Confira a conexão e
              tente novamente.
            </p>
          ) : (
            <div
              className={cn(
                "flex min-h-44 flex-col items-center justify-center px-4 text-center",
                entries.length === 0 &&
                  "h-full rounded-xl border border-dashed border-line bg-graphite-800",
              )}
            >
              {entries.length === 0 && (
                <span
                  className="grid size-11 place-items-center rounded-full bg-accent-soft text-lg text-accent"
                  aria-hidden="true"
                >
                  <NextIcon name="CalendarOutline" />
                </span>
              )}
              <h3
                className={cn(
                  "text-sm font-semibold text-ink",
                  entries.length === 0 && "mt-4",
                )}
              >
                {entries.length
                  ? "Nenhum lançamento nesta categoria"
                  : "Nenhum lançamento neste mês"}
              </h3>
              <p className="mt-1 max-w-xs text-xs leading-5 text-muted">
                {entries.length
                  ? "Selecione outra categoria para ver mais lançamentos."
                  : "Cadastre uma receita ou despesa. Recorrências e parcelas aparecem automaticamente."}
              </p>
            </div>
          )}
        </div>
      </section>

      <DrawerContent>
        {selectedEntry && (
          <>
            <DrawerHeader className="shrink-0 px-3 pb-3 pt-4 text-left">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <DrawerTitle className="truncate text-base text-moon-100">
                  {selectedEntry.title}
                </DrawerTitle>
                <Button
                  aria-label="Excluir lançamento"
                  disabled={rowMutationPending}
                  icon="TrashOutline"
                  onClick={() => {
                    setDeleteError("");
                    setEntryToDelete(selectedEntry);
                    deleteDrawer.openDrawer();
                  }}
                  size="icon"
                  type="button"
                  variant="destructive-subtle"
                  rounded
                />
              </div>
            </DrawerHeader>

            <form
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                void runAction(() => onUpdate(form));
              }}
            >
              <Input name="id" type="hidden" value={selectedEntry.id} />
              <DrawerBody className="space-y-4 px-3 pb-5">
                {actionError && (
                  <p
                    className="rounded-xl border border-rose-800 bg-rose-900 px-3 py-2 text-sm text-rose-100"
                    role="alert"
                  >
                    {actionError}
                  </p>
                )}
                <Select
                  label="Tipo"
                  name="entry_type"
                  defaultValue={selectedEntry.entry_type}
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
                <EntryFields month={month} entry={selectedEntry} />
                {selectedEntry.source_kind === "recurrence" && (
                  <Select
                    label="Aplicar alteração"
                    name="scope"
                    defaultValue="single"
                  >
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
                )}
              </DrawerBody>
              <DrawerFooter className="shrink-0 border-t border-line/30 px-3 pb-3 pt-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    className="w-full"
                    disabled={rowMutationPending}
                    type="submit"
                    variant="primary"
                    rounded
                  >
                    {rowMutationPending ? "Salvando…" : "Salvar"}
                  </Button>
                  <Button
                    className="w-full"
                    disabled={rowMutationPending}
                    onClick={entryDrawer.closeDrawer}
                    type="button"
                    variant="secondary"
                    rounded
                  >
                    Fechar
                  </Button>
                </div>
              </DrawerFooter>
            </form>
          </>
        )}
      </DrawerContent>
      <DrawerNested {...deleteDrawer.props}>
        <DrawerContent>
          {entryToDelete && (
            <>
              <DrawerHeader className="px-3 pb-3 pt-4 text-left">
                <DrawerTitle className="text-base">
                  Excluir lançamento?
                </DrawerTitle>
                <DrawerDescription className="text-muted">
                  Este lançamento será removido permanentemente.
                </DrawerDescription>
              </DrawerHeader>
              <DrawerBody className="px-3 pb-5">
                {deleteError && (
                  <p
                    className="rounded-xl border border-rose-800 bg-rose-900 px-3 py-2 text-sm text-rose-100"
                    role="alert"
                  >
                    {deleteError}
                  </p>
                )}
              </DrawerBody>
              <DrawerFooter className="border-t border-line px-3 pb-3 pt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    disabled={rowMutationPending}
                    onClick={deleteDrawer.closeDrawer}
                    type="button"
                    variant="secondary"
                    rounded
                  >
                    Voltar
                  </Button>
                  <Button
                    className="bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700"
                    disabled={rowMutationPending}
                    leadingIcon="TrashOutline"
                    loading={rowMutationPending}
                    onClick={() => void confirmDelete()}
                    type="button"
                    variant="primary"
                    rounded
                  >
                    Excluir
                  </Button>
                </div>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </DrawerNested>
      <DrawerNested {...monthActionDrawer.props}>
        <DrawerContent>
          {monthAction && (
            <>
              <DrawerHeader className="px-3 pb-3 pt-4 text-left">
                <DrawerTitle className="text-base">
                  {monthAction === "copy"
                    ? "Copiar dados do mês anterior?"
                    : "Apagar todos os dados do mês?"}
                </DrawerTitle>
                <DrawerDescription className="text-muted">
                  {monthAction === "copy"
                    ? "Todos os lançamentos ativos do mês anterior serão copiados como pendentes."
                    : "Todos os lançamentos desta competência serão removidos, inclusive os realizados e importados. Esta ação não pode ser desfeita."}
                </DrawerDescription>
              </DrawerHeader>
              <DrawerBody className="px-3 pb-5">
                {monthActionError && (
                  <p
                    className="rounded-xl border border-rose-800 bg-rose-900 px-3 py-2 text-sm text-rose-100"
                    role="alert"
                  >
                    {monthActionError}
                  </p>
                )}
              </DrawerBody>
              <DrawerFooter className="border-t border-line px-3 pb-3 pt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    disabled={monthActionsPending}
                    onClick={monthActionDrawer.closeDrawer}
                    rounded
                    type="button"
                    variant="secondary"
                  >
                    Cancelar
                  </Button>
                  <Button
                    className={
                      monthAction === "delete"
                        ? "bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700"
                        : ""
                    }
                    disabled={monthActionsPending}
                    loading={monthActionsPending}
                    onClick={() => void confirmMonthAction()}
                    rounded
                    type="button"
                    variant="primary"
                  >
                    {monthAction === "copy" ? "Copiar" : "Apagar mês"}
                  </Button>
                </div>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </DrawerNested>
    </Drawer>
  );
}

function SwipeableEntry({
  ariaLabel,
  children,
  entry,
  onOpen,
  onSetStatus,
  reducedMotion,
  statusPending,
}: {
  ariaLabel: string;
  children: ReactNode;
  entry: FinancialEntry;
  onOpen: () => void;
  onSetStatus: (id: string, nextStatus: EntryStatus) => Promise<void>;
  reducedMotion: boolean;
  statusPending: boolean;
}) {
  const x = useMotionValue(0);
  const transform = useTransform(x, (value) => `translate3d(${value}px, 0, 0)`);
  const gesture = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    lastX: number;
    lastTime: number;
    velocity: number;
    width: number;
    dragging: boolean;
  } | null>(null);
  const returnAnimation = useRef<{ stop: () => void } | null>(null);
  const suppressClick = useRef(false);

  function returnToStart() {
    returnAnimation.current?.stop();
    if (reducedMotion) {
      x.set(0);
      return;
    }
    returnAnimation.current = animate(x, 0, {
      type: "spring",
      duration: 0.5,
      bounce: 0.2,
    });
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (
      statusPending ||
      gesture.current ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;

    returnAnimation.current?.stop();
    const now = performance.now();
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX - x.get(),
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: now,
      velocity: 0,
      width: event.currentTarget.getBoundingClientRect().width,
      dragging: false,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const activeGesture = gesture.current;
    if (!activeGesture || activeGesture.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - activeGesture.startX;
    const deltaY = event.clientY - activeGesture.startY;
    if (!activeGesture.dragging) {
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 8) return;
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        gesture.current = null;
        return;
      }
      activeGesture.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
    const now = performance.now();
    const elapsed = Math.max(1, now - activeGesture.lastTime);
    activeGesture.velocity = (event.clientX - activeGesture.lastX) / elapsed;
    activeGesture.lastX = event.clientX;
    activeGesture.lastTime = now;

    const limit = Math.min(120, activeGesture.width * 0.34);
    const bounded = Math.max(-limit, Math.min(limit, deltaX));
    const overshoot = deltaX - bounded;
    x.set(
      bounded + Math.sign(overshoot) * Math.min(12, Math.abs(overshoot) * 0.18),
    );
  }

  function finishGesture(
    event: PointerEvent<HTMLDivElement>,
    cancelled = false,
  ) {
    const activeGesture = gesture.current;
    if (!activeGesture || activeGesture.pointerId !== event.pointerId) return;

    gesture.current = null;
    if (!activeGesture.dragging) return;

    suppressClick.current = true;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);

    if (!cancelled) {
      const deltaX = event.clientX - activeGesture.startX;
      const distanceThreshold = Math.min(
        64,
        Math.max(48, activeGesture.width * 0.16),
      );
      const quickFlick = Math.abs(activeGesture.velocity) >= 0.55;
      if (
        Math.abs(deltaX) >= distanceThreshold ||
        (quickFlick && Math.abs(deltaX) >= 24)
      ) {
        const direction = quickFlick
          ? Math.sign(activeGesture.velocity)
          : Math.sign(deltaX);
        const nextStatus = direction > 0 ? "settled" : "planned";
        if (nextStatus !== entry.status) {
          void onSetStatus(entry.id, nextStatus).catch(() => undefined);
        }
      }
    }

    returnToStart();
  }

  return (
    <div
      className="relative w-full touch-pan-y select-none overflow-hidden rounded-xl"
      onPointerCancel={(event) => finishGesture(event, true)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishGesture}
    >
      <div
        aria-hidden="true"
        className="absolute bottom-px left-0 right-px top-0 grid grid-cols-2 overflow-hidden rounded-xl"
      >
        <span className="flex items-center justify-start bg-mint-900/30 pl-5 text-sm font-semibold text-mint-300">
          {entry.entry_type === "income" ? "Receber" : "Pagar"}
        </span>
        <span className="flex items-center justify-end bg-amber-900/30 pr-5 text-sm font-semibold text-amber-500">
          Reabrir
        </span>
      </div>
      <motion.div className="relative z-10 w-full" style={{ transform }}>
        <Button
          aria-busy={statusPending || undefined}
          aria-label={ariaLabel}
          className="flex w-full rounded-xl border border-graphite-600 bg-graphite-700 p-3"
          onClick={() => {
            if (suppressClick.current) {
              suppressClick.current = false;
              return;
            }
            onOpen();
          }}
          type="button"
          variant="unstyled"
        >
          {children}
        </Button>
      </motion.div>
    </div>
  );
}

function statusLabel(entry: FinancialEntry, today: string) {
  if (entry.status === "settled")
    return entry.entry_type === "income" ? "Recebida" : "Paga";
  if (entry.due_date && entry.due_date < today) return "Vencida";
  return "Prevista";
}

function EntryOptionsMenu({
  onActionSelect,
  actionsPending,
}: {
  onActionSelect: (action: MonthAction) => void;
  actionsPending: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Opções dos lançamentos"
          icon="VerticalDots"
          size="icon"
          type="button"
          variant="secondary"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col gap-1">
          <DropdownMenuItem
            className="focus:bg-graphite-600 text-ink"
            disabled={actionsPending}
            onSelect={() => onActionSelect("copy")}
            leadingIcon="CopyOutline"
          >
            Copiar mês anterior
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-rose-500 focus:bg-rose-500/10"
            disabled={actionsPending}
            onSelect={() => onActionSelect("delete")}
            leadingIcon="TrashOutline"
          >
            Apagar tudo
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CategoryFilter({
  value,
  onValueChange,
}: {
  value: CategoryFilterValue;
  onValueChange: (value: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fadeEdges, setFadeEdges] = useState({ left: 0, right: 0 });

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    function updateFadeEdges() {
      const element = scrollRef.current;
      if (!element) return;
      const maxScroll = element.scrollWidth - element.clientWidth;
      const fadeDistance = 48;
      setFadeEdges({
        left: Math.min(1, Math.max(0, element.scrollLeft / fadeDistance)),
        right: Math.min(
          1,
          Math.max(0, (maxScroll - element.scrollLeft) / fadeDistance),
        ),
      });
    }

    updateFadeEdges();
    container.addEventListener("scroll", updateFadeEdges, { passive: true });
    const resizeObserver = new ResizeObserver(updateFadeEdges);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", updateFadeEdges);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative min-w-0">
      <div
        aria-label="Filtrar lançamentos por categoria"
        className="scrollbar-hidden flex min-w-0 gap-2 overflow-x-auto touch-pan-x"
        ref={scrollRef}
        role="group"
      >
        {[
          { label: "Todas", value: "all" as const },
          ...FINANCIAL_CATEGORIES.map((category) => ({
            label: category,
            value: category,
          })),
        ].map((category) => (
          <button
            aria-pressed={value === category.value}
            className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 focus-visible:ring-offset-graphite-900"
            key={category.value}
            onClick={() => onValueChange(category.value)}
            type="button"
          >
            <Badge
              className="pointer-events-none"
              variant={value === category.value ? "white" : "secondary"}
            >
              {category.label}
            </Badge>
          </button>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-graphite-900 to-transparent transition-opacity duration-100"
        style={{ opacity: fadeEdges.left }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-graphite-900 to-transparent transition-opacity duration-100"
        style={{ opacity: fadeEdges.right }}
      />
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`));
}
