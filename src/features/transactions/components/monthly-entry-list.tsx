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
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { EntryFields } from "@/features/transactions/components/entry-fields";
import {
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

type EntryStatus = "planned" | "settled";
type CategoryFilterValue = "all" | FinancialCategory;

export function MonthlyEntryList({
  entries,
  month,
  onSetStatus,
  statusPendingId,
  onUpdate,
  onCancel,
  onCreateEntry,
  rowMutationPending,
  showHeader = true,
  isLoading = false,
  loadError = false,
}: {
  entries: FinancialEntry[];
  month: string;
  onSetStatus: (id: string, nextStatus: EntryStatus) => Promise<void>;
  statusPendingId?: string;
  onUpdate: (form: FormData) => Promise<void>;
  onCancel: (form: FormData) => Promise<void>;
  onCreateEntry: () => void;
  rowMutationPending: boolean;
  showHeader?: boolean;
  isLoading?: boolean;
  loadError?: boolean;
}) {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilterValue>("all");
  const reducedMotion = useReducedMotion() === true;
  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId);
  const filteredEntries = entries.filter(
    (entry) =>
      categoryFilter === "all" ||
      normalizeFinancialCategory(
        entry.category,
        entry.entry_type,
        entry.source_kind,
      ) === categoryFilter,
  );
  const today = localDateString();

  function handleCategoryChange(value: string) {
    if (value === "all" || isFinancialCategory(value)) {
      setCategoryFilter(value);
    }
  }

  useEffect(() => {
    setSelectedEntryId(null);
    setActionError("");
  }, [month]);

  async function runAction(action: () => Promise<void>) {
    setActionError("");
    try {
      await action();
      setSelectedEntryId(null);
    } catch {
      setActionError("Não foi possível concluir. Tente novamente.");
    }
  }

  function closeDrawer(open: boolean) {
    if (open) return;
    setSelectedEntryId(null);
    setActionError("");
  }

  const returnTo = `/mes?month=${month}`;

  return (
    <Drawer
      open={Boolean(selectedEntry)}
      onOpenChange={closeDrawer}
      shouldScaleBackground={false}
    >
      <section className="flex flex-col gap-3">
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
              <CategoryFilter
                value={categoryFilter}
                onValueChange={handleCategoryChange}
              />
              <Button
                aria-label="Novo lançamento"
                icon="Plus"
                onClick={onCreateEntry}
                size="icon-sm"
                type="button"
                variant="primary"
              />
            </div>
          </header>
        )}
        {!showHeader && (
          <div className="mb-3 flex justify-end">
            <CategoryFilter
              value={categoryFilter}
              onValueChange={handleCategoryChange}
            />
          </div>
        )}
        <div>
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
                  onOpen={() => {
                    setActionError("");
                    setSelectedEntryId(entry.id);
                  }}
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
                        <Badge size="sm" variant="secondary">
                          Vence {formatDate(entry.due_date)}
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
            <div className="flex min-h-44 flex-col items-center justify-center px-4 text-center">
              {entries.length === 0 && (
                <span
                  className="grid size-11 place-items-center rounded-full bg-accent-soft text-lg text-accent"
                  aria-hidden="true"
                >
                  +
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

      {selectedEntry && (
        <DrawerContent className="max-h-[90dvh] overflow-hidden border-line bg-graphite-900 text-ink">
          <DrawerHeader className="shrink-0 px-5 pb-3 pt-4 text-left sm:px-6">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <DrawerTitle className="truncate text-base">
                {selectedEntry.title}
              </DrawerTitle>
              {selectedEntry.status === "planned" && (
                <Button
                  aria-label="Cancelar lançamento"
                  className="shrink-0 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                  disabled={rowMutationPending}
                  icon="Trash"
                  onClick={() => {
                    const form = new FormData();
                    form.set("id", selectedEntry.id);
                    form.set("return_to", returnTo);
                    void runAction(() => onCancel(form));
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                />
              )}
            </div>
            <DrawerDescription className="text-muted">
              {selectedEntry.entry_type === "income" ? "Receita" : "Despesa"}
              {` · ${normalizeFinancialCategory(selectedEntry.category, selectedEntry.entry_type, selectedEntry.source_kind)}`}
              {` · ${statusLabel(selectedEntry, today)}`}
            </DrawerDescription>
          </DrawerHeader>

          {selectedEntry.status === "planned" ? (
            <form
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                void runAction(() => onUpdate(form));
              }}
            >
              <Input name="id" type="hidden" value={selectedEntry.id} />
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
                {actionError && (
                  <p
                    className="rounded-xl border border-rose-800 bg-rose-900 px-3 py-2 text-sm text-rose-100"
                    role="alert"
                  >
                    {actionError}
                  </p>
                )}
                <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
                  Tipo
                  <Select
                    name="entry_type"
                    defaultValue={selectedEntry.entry_type}
                    variant="secondary"
                    size="sm"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                <EntryFields month={month} entry={selectedEntry} />
                {selectedEntry.source_kind === "recurrence" && (
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
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
              </div>
              <DrawerFooter className="shrink-0 border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    className="w-full"
                    disabled={rowMutationPending}
                    type="submit"
                    variant="primary"
                    rounded="full"
                  >
                    {rowMutationPending ? "Salvando…" : "Salvar"}
                  </Button>
                  <Button
                    className="w-full"
                    disabled={rowMutationPending}
                    onClick={() => closeDrawer(false)}
                    type="button"
                    variant="secondary"
                    rounded="full"
                  >
                    Fechar
                  </Button>
                </div>
              </DrawerFooter>
            </form>
          ) : (
            <>
              <div className="space-y-3 overflow-y-auto px-5 pb-5 text-sm sm:px-6">
                <Detail label="Valor">
                  <FinancialValue>
                    {formatMoney(Number(selectedEntry.amount))}
                  </FinancialValue>
                </Detail>
                <Detail label="Vencimento">
                  {selectedEntry.due_date
                    ? formatDate(selectedEntry.due_date)
                    : "Sem vencimento"}
                </Detail>
                <Detail label="Origem">{sourceLabel(selectedEntry)}</Detail>
                <p className="rounded-xl bg-canvas p-3 text-xs leading-5 text-muted">
                  Para alterar este lançamento, desfaça a baixa primeiro.
                </p>
              </div>
              <DrawerFooter className="shrink-0 border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
                {actionError && (
                  <p className="text-sm text-rose-200" role="alert">
                    {actionError}
                  </p>
                )}
                <Button
                  onClick={() => closeDrawer(false)}
                  type="button"
                  variant="outline"
                >
                  Fechar
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      )}
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
    ) {
      return;
    }

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
        88,
        Math.max(64, activeGesture.width * 0.22),
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
          Desfazer
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

function CategoryFilter({
  value,
  onValueChange,
}: {
  value: CategoryFilterValue;
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="w-[124px] shrink-0 sm:w-[160px]">
      <Select
        name="filter_category"
        onValueChange={onValueChange}
        value={value}
        variant="secondary"
        size="sm"
      >
        <SelectTrigger className="min-w-0 truncate">
          <SelectValue className="max-w-[84px] truncate sm:max-w-[120px]" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as categorias</SelectItem>
          <SelectItem value="Despesas">Despesas</SelectItem>
          <SelectItem value="Dívidas e parcelas">Dívidas e parcelas</SelectItem>
          <SelectItem value="Outras entradas">Outras entradas</SelectItem>
          <SelectItem value="Salário">Salário</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{children}</span>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`));
}

function statusLabel(entry: FinancialEntry, today: string) {
  if (entry.status === "settled")
    return entry.entry_type === "income" ? "Recebida" : "Paga";
  if (entry.due_date && entry.due_date < today) return "Vencida";
  return "Prevista";
}

function sourceLabel(entry: FinancialEntry) {
  if (entry.source_kind === "recurrence") return "Recorrente";
  if (entry.source_kind === "installment" && entry.installment_number)
    return `Parcela ${entry.installment_number}`;
  if (entry.source_kind === "card_statement") return "Fatura do cartão";
  if (entry.source_kind === "historical_import") return "Importado";
  return "Avulso";
}
