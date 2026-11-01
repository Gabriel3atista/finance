"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { DrawerController } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FinancialValue } from "@/shared/components/financial-values";
import {
  formatCurrency,
  installmentAmount,
  parseCurrencyInput,
} from "@/shared/lib/currency";
import { addMonthsToDate, parseMonth } from "@/shared/lib/date";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const seriesTypeOptions = [
  { value: "salary", label: "Salário", entryType: "income" },
  { value: "service", label: "Serviço ou conta fixa", entryType: "expense" },
  { value: "financing", label: "Financiamento", entryType: "expense" },
  { value: "purchase", label: "Compra", entryType: "expense" },
  { value: "other_income", label: "Outra receita", entryType: "income" },
  { value: "other_expense", label: "Outra despesa", entryType: "expense" },
] as const;

export type SeriesFormType = (typeof seriesTypeOptions)[number]["value"];

export type SeriesFormInitialData = {
  id: string;
  kind: "recurrence" | "installment";
  title: string;
  seriesType: SeriesFormType;
  amount: number;
  dueDay: number | null;
  startsOn: string;
  endsOn: string | null;
  installmentCount?: number;
};

function inputAmount(value: number) {
  return value.toFixed(2).replace(".", ",");
}

export function SeriesFormDrawer({
  drawer,
  currentDate,
  initialData,
  error,
  pending,
  onSubmit,
}: {
  drawer: DrawerController;
  currentDate: string;
  initialData?: SeriesFormInitialData;
  error?: string;
  pending: boolean;
  onSubmit: (form: FormData) => void;
}) {
  const [seriesType, setSeriesType] =
    useState<SeriesFormType>(initialData?.seriesType ?? "service");
  const [hasInstallments, setHasInstallments] = useState(
    initialData?.kind === "installment",
  );
  const [indefinite, setIndefinite] = useState(
    initialData ? initialData.kind === "recurrence" && !initialData.endsOn : true,
  );
  const [startsOn, setStartsOn] = useState(
    initialData?.startsOn ?? currentDate,
  );
  const [endsOn, setEndsOn] = useState(
    initialData?.endsOn ?? initialData?.startsOn ?? currentDate,
  );
  const [installmentCount, setInstallmentCount] = useState(
    String(initialData?.installmentCount ?? 1),
  );
  const [installmentValue, setInstallmentValue] = useState(() =>
    initialData?.kind === "installment" && initialData.installmentCount
      ? inputAmount(
          installmentAmount(
            initialData.amount,
            initialData.installmentCount,
            1,
          ),
        )
      : "",
  );
  const selectedType = seriesTypeOptions.find(
    (option) => option.value === seriesType,
  );
  const isIncome = selectedType?.entryType === "income";
  const parsedInstallmentValue = parseCurrencyInput(installmentValue);
  const parsedInstallmentCount = Number(installmentCount);
  const installmentTotal =
    Number.isFinite(parsedInstallmentValue) &&
    parsedInstallmentValue > 0 &&
    Number.isInteger(parsedInstallmentCount) &&
    parsedInstallmentCount > 0
      ? (Math.round(parsedInstallmentValue * 100) * parsedInstallmentCount) /
        100
      : 0;

  function changeSeriesType(value: string) {
    const nextType = seriesTypeOptions.find((option) => option.value === value);
    if (!nextType) return;

    setSeriesType(nextType.value);
    if (nextType.entryType === "income") setHasInstallments(false);
  }

  function changeStartsOn(value: string) {
    setStartsOn(value);
    if (hasInstallments) {
      setEndsOn(
        addMonthsToDate(value, Math.max(parsedInstallmentCount, 1) - 1),
      );
    } else if (value > endsOn) {
      setEndsOn(value);
    }
  }

  function changeInstallmentCount(value: string) {
    setInstallmentCount(value);
    const count = Number(value);
    if (!Number.isInteger(count) || count < 1 || count > 600) return;

    setEndsOn(addMonthsToDate(startsOn, count - 1));
  }

  function changeInstallmentEnd(value: string) {
    setEndsOn(value);
    const first = parseMonth(startsOn.slice(0, 7));
    const last = parseMonth(value.slice(0, 7));
    const count =
      (last.getFullYear() - first.getFullYear()) * 12 +
      last.getMonth() -
      first.getMonth() +
      1;
    if (count > 0) setInstallmentCount(String(count));
  }

  function toggleInstallments(nextValue: boolean) {
    setHasInstallments(nextValue);
    setIndefinite(!nextValue);
    if (nextValue) {
      const count = Math.max(parsedInstallmentCount, 1);
      setEndsOn(addMonthsToDate(startsOn, count - 1));
    }
  }

  return (
    <Drawer {...drawer.props}>
      <DrawerContent>
        <DrawerHeader className="shrink-0 px-3 pb-3 pt-4 text-left">
          <DrawerTitle className="text-base">
            {initialData ? "Editar cadastro" : "Novo cadastro"}
          </DrawerTitle>
          <DrawerDescription>
            {initialData
              ? "Atualize os dados do cadastro. Lançamentos já gerados permanecem como foram registrados."
              : "Configure uma receita ou despesa mensal, com ou sem parcelas."}
          </DrawerDescription>
        </DrawerHeader>
        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(new FormData(event.currentTarget));
          }}
        >
          {initialData && (
            <>
              <Input type="hidden" name="id" value={initialData.id} />
              <Input type="hidden" name="kind" value={initialData.kind} />
            </>
          )}
          <DrawerBody className="space-y-4 px-3 pb-5">
            {error && (
              <p
                className="rounded-xl border border-rose-800 bg-rose-900 px-3 py-2 text-sm text-rose-100"
                role="alert"
              >
                {error}
              </p>
            )}
            <Select
              label="O que deseja cadastrar?"
              name="series_type"
              onValueChange={changeSeriesType}
              value={seriesType}
              variant="secondary"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seriesTypeOptions
                  .filter(
                    (option) =>
                      !initialData ||
                      initialData.kind !== "installment" ||
                      option.entryType === "expense",
                  )
                  .map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Descrição"
                containerClassName="sm:col-span-2"
                name="title"
                maxLength={160}
                required
                defaultValue={initialData?.title}
                placeholder={
                  seriesType === "salary"
                    ? "Ex.: Salário mensal"
                    : seriesType === "service"
                      ? "Ex.: Internet, energia, academia"
                      : seriesType === "financing"
                        ? "Ex.: Financiamento do carro"
                        : seriesType === "purchase"
                          ? "Ex.: Móveis da sala"
                          : "Ex.: Outra receita ou despesa"
                }
              />
              {hasInstallments ? (
                <>
                  <Input
                    label="Valor por parcela (R$)"
                    name="installment_amount"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={installmentValue}
                    onChange={(event) =>
                      setInstallmentValue(event.currentTarget.value)
                    }
                    required
                  />
                  <Input
                    label="Número de parcelas"
                    name="installment_count"
                    type="number"
                    min={1}
                    max={600}
                    step={1}
                    value={installmentCount}
                    onChange={(event) =>
                      changeInstallmentCount(event.currentTarget.value)
                    }
                    required
                  />
                </>
              ) : (
                <Input
                  label="Valor mensal (R$)"
                  name="amount"
                  inputMode="decimal"
                  placeholder="0,00"
                  defaultValue={
                    initialData ? inputAmount(initialData.amount) : undefined
                  }
                  required
                />
              )}
              {!isIncome && (
                <Input
                  label="Dia de vencimento (opcional)"
                  name="due_day"
                  type="number"
                  min={1}
                  max={31}
                  placeholder="Sem vencimento"
                  defaultValue={initialData?.dueDay ?? ""}
                />
              )}
            </div>

            {initialData ? (
              <Badge size="sm" variant="secondary">
                {hasInstallments ? "Parcelamento" : "Recorrência"}
              </Badge>
            ) : (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-muted">
                  Como esse valor se repete?
                </legend>
                <div
                  aria-label="Tipo de duração"
                  className="grid grid-cols-2 gap-2"
                  role="group"
                >
                  <Button
                    aria-pressed={!hasInstallments}
                    className="w-full"
                    onClick={() => toggleInstallments(false)}
                    type="button"
                    variant={!hasInstallments ? "primary-subtle" : "secondary"}
                  >
                    Recorrência
                  </Button>
                  <Button
                    aria-pressed={hasInstallments}
                    className="w-full"
                    disabled={isIncome}
                    onClick={() => toggleInstallments(true)}
                    type="button"
                    variant={hasInstallments ? "primary-subtle" : "secondary"}
                  >
                    Parcelado
                  </Button>
                </div>
              </fieldset>
            )}
            <input
              name="has_installments"
              type="hidden"
              value={String(hasInstallments)}
            />

            {!hasInstallments && (
              <div className="space-y-2">
                <Switch
                  checked={!indefinite}
                  label="Definir data de término"
                  onCheckedChange={(checked) => setIndefinite(!checked)}
                />
                <input
                  name="indefinite"
                  type="hidden"
                  value={String(indefinite)}
                />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Data de início"
                name="starts_on"
                type="date"
                value={startsOn}
                onChange={(event) => changeStartsOn(event.currentTarget.value)}
                required
              />
              {hasInstallments || !indefinite ? (
                <Input
                  label={
                    hasInstallments
                      ? "Data da última parcela"
                      : "Data de término"
                  }
                  name="ends_on"
                  type="date"
                  min={startsOn}
                  value={endsOn}
                  onChange={(event) =>
                    hasInstallments
                      ? changeInstallmentEnd(event.currentTarget.value)
                      : setEndsOn(event.currentTarget.value)
                  }
                  required
                />
              ) : null}
            </div>

            {hasInstallments && (
              <div className="rounded-xl border border-line/50 bg-graphite-800 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      Total do parcelamento
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      Soma do valor de cada parcela.
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">
                    <FinancialValue>
                      {installmentTotal > 0
                        ? formatCurrency(installmentTotal)
                        : "—"}
                    </FinancialValue>
                  </p>
                </div>
                <div className="mt-3 flex items-start gap-2">
                  <Badge size="sm" variant="secondary">
                    {parsedInstallmentCount > 0
                      ? `${installmentCount} parcelas`
                      : "Informe a quantidade"}
                  </Badge>
                  <p className="text-xs leading-5 text-muted">
                    O mês final acompanha a quantidade e pode ser ajustado.
                  </p>
                </div>
              </div>
            )}
          </DrawerBody>
          <DrawerFooter className="shrink-0 border-t border-line/30 px-3 pb-3 pt-4">
            <Button
              className="w-full"
              disabled={pending}
              loading={pending}
              rounded
              type="submit"
              variant="primary"
            >
              {initialData ? "Salvar alterações" : "Salvar"}
            </Button>
            <Button
              className="w-full"
              disabled={pending}
              onClick={drawer.closeDrawer}
              rounded
              type="button"
              variant="secondary"
            >
              Cancelar
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
