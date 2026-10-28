"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  formatMoney,
  localDateString,
  type FinancialEntry,
  type HouseholdMember,
} from "@/features/transactions/lib/data";
import { FinancialValue } from "@/shared/components/financial-values";
import { cn } from "@/shared/lib/utils";

type EntryStatus = "planned" | "settled";

export function MonthlyEntryList({
  entries,
  members,
  currentUserId,
  month,
  onSetStatus,
  statusPendingId,
  onUpdate,
  onCancel,
  rowMutationPending,
  showHeader = true,
}: {
  entries: FinancialEntry[];
  members: HouseholdMember[];
  currentUserId: string;
  month: string;
  onSetStatus: (id: string, nextStatus: EntryStatus) => Promise<void>;
  statusPendingId?: string;
  onUpdate: (form: FormData) => Promise<void>;
  onCancel: (form: FormData) => Promise<void>;
  rowMutationPending: boolean;
  showHeader?: boolean;
}) {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId);
  const today = localDateString();

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
      <section className="flex flex-col gap-2 bg-graphite-800 border border-graphite-700 rounded-xl overflow-hidden">
        {showHeader && (
          <header className="flex items-center justify-between gap-3 px-3 py-2 border-b border-line bg-graphite-700">
            <h2 className="text-[15px] font-semibold text-ink">
              Lançamentos
            </h2>
            <span className="rounded-full bg-canvas px-3 py-1 text-xs text-muted">
              {entries.length}
            </span>
          </header>
        )}
        <div>
          {entries.length ? (
            <div className="divide-y divide-line">
              {entries.map((entry) => (
                <Button
                  aria-label={`${entry.title}, ${formatMoney(Number(entry.amount))}, ${statusLabel(entry, today)}. Abrir detalhes`}
                  className="flex w-full p-3"
                  key={entry.id}
                  onClick={() => {
                    setActionError("");
                    setSelectedEntryId(entry.id);
                  }}
                  type="button"
                  variant="unstyled"
                >
                  <span className="flex flex-col gap-2 items-start min-w-0 flex-1">
                    <span className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink">
                        {entry.title}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          entry.entry_type === "income"
                            ? "bg-success-900 text-success-100"
                            : "bg-canvas text-muted",
                        )}
                      >
                        {entry.entry_type === "income" ? "Receita" : "Despesa"}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {entry.category ?? "Sem categoria"}
                      {entry.due_date
                        ? ` · Vence ${formatDate(entry.due_date)}`
                        : " · Sem vencimento"}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
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
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        statusClass(entry, today),
                      )}
                    >
                      {statusLabel(entry, today)}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex min-h-44 flex-col items-center justify-center px-4 text-center">
              <span
                className="grid size-11 place-items-center rounded-full bg-accent-soft text-lg text-accent"
                aria-hidden="true"
              >
                +
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink">
                Nenhum lançamento neste mês
              </h3>
              <p className="mt-1 max-w-xs text-xs leading-5 text-muted">
                Cadastre uma receita ou despesa. Recorrências e parcelas aparecem
                automaticamente.
              </p>
            </div>
          )}
        </div>
      </section>

      {selectedEntry && (
        <DrawerContent className="max-h-[90dvh] overflow-hidden border-line bg-graphite-900 text-ink">
          <DrawerHeader className="shrink-0 px-5 pb-3 pt-4 text-left sm:px-6">
            <DrawerTitle className="truncate text-base">
              {selectedEntry.title}
            </DrawerTitle>
            <DrawerDescription className="text-muted">
              {selectedEntry.entry_type === "income" ? "Receita" : "Despesa"}
              {selectedEntry.category ? ` · ${selectedEntry.category}` : ""}
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
                <EntryFields
                  members={members}
                  currentUserId={currentUserId}
                  month={month}
                  entry={selectedEntry}
                />
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
                <Button className="w-full" disabled={rowMutationPending} type="submit">
                  {rowMutationPending ? "Salvando…" : "Salvar alterações"}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    disabled={rowMutationPending || statusPendingId === selectedEntry.id}
                    onClick={() =>
                      void runAction(() =>
                        onSetStatus(selectedEntry.id, "settled"),
                      )
                    }
                    type="button"
                    variant="outline"
                  >
                    {statusPendingId === selectedEntry.id
                      ? "Atualizando…"
                      : selectedEntry.entry_type === "income"
                        ? "Marcar recebida"
                        : "Marcar paga"}
                  </Button>
                  <Button
                    className="text-rose-300 hover:text-rose-200"
                    disabled={rowMutationPending}
                    onClick={() => {
                      const form = new FormData();
                      form.set("id", selectedEntry.id);
                      form.set("return_to", returnTo);
                      void runAction(() => onCancel(form));
                    }}
                    type="button"
                    variant="outline"
                  >
                    Cancelar lançamento
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
                <Detail label="Responsável">
                  {selectedEntry.responsible_user_id
                    ? responsibleLabel(
                      selectedEntry.responsible_user_id,
                      members,
                      currentUserId,
                    )
                    : "Sem responsável"}
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
                  disabled={statusPendingId === selectedEntry.id}
                  onClick={() =>
                    void runAction(() =>
                      onSetStatus(selectedEntry.id, "planned"),
                    )
                  }
                  type="button"
                  variant="outline"
                >
                  {statusPendingId === selectedEntry.id
                    ? "Atualizando…"
                    : selectedEntry.entry_type === "income"
                      ? "Desfazer recebimento"
                      : "Desfazer pagamento"}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      )}
    </Drawer>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{children}</span>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${value}T12:00:00`),
  );
}

function statusLabel(entry: FinancialEntry, today: string) {
  if (entry.status === "settled")
    return entry.entry_type === "income" ? "Recebida" : "Paga";
  if (entry.due_date && entry.due_date < today) return "Vencida";
  return "Prevista";
}

function statusClass(entry: FinancialEntry, today: string) {
  if (entry.status === "settled") return "bg-success-900 text-success-100";
  if (entry.due_date && entry.due_date < today)
    return "bg-rose-900 text-rose-100";
  return "bg-canvas text-muted";
}

function sourceLabel(entry: FinancialEntry) {
  if (entry.source_kind === "recurrence") return "Recorrente";
  if (entry.source_kind === "installment" && entry.installment_number)
    return `Parcela ${entry.installment_number}`;
  if (entry.source_kind === "card_statement") return "Fatura do cartão";
  if (entry.source_kind === "historical_import") return "Importado";
  return "Avulso";
}

function responsibleLabel(
  userId: string,
  members: HouseholdMember[],
  currentUserId: string,
) {
  if (userId === currentUserId) return "Você";
  const member = members.find((item) => item.user_id === userId);
  if (!member) return "Outro membro";
  return member.member_role === "owner" ? "Responsável do núcleo" : "Outro membro";
}
