"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import {
  getSeriesTypeOption,
  SERIES_TYPE_OPTIONS,
  type SeriesFormType,
} from "@/features/transactions/lib/categories";
import {
  seriesFormSchema,
  type SeriesFormValues,
} from "@/features/transactions/lib/form-schemas";
import { formDataFromValues } from "@/shared/lib/forms";
import { CreditCardSelect } from "@/features/credit-cards/components/credit-card-select";

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
  creditCardId?: string | null;
};

function inputAmount(value: number) {
  return value.toFixed(2);
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
  const form = useForm<SeriesFormValues>({
    resolver: zodResolver(seriesFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      id: initialData?.id ?? "",
      kind: initialData?.kind ?? "recurrence",
      series_type: initialData?.seriesType ?? "service",
      title: initialData?.title ?? "",
      amount:
        initialData && initialData.kind !== "installment"
          ? inputAmount(initialData.amount)
          : "",
      installment_amount:
        initialData?.kind === "installment" && initialData.installmentCount
          ? inputAmount(
              installmentAmount(
                initialData.amount,
                initialData.installmentCount,
                1,
              ),
            )
          : "",
      installment_count: String(initialData?.installmentCount ?? 1),
      has_installments: String(initialData?.kind === "installment") as
        "true" | "false",
      indefinite: String(
        initialData
          ? initialData.kind === "recurrence" && !initialData.endsOn
          : true,
      ) as "true" | "false",
      starts_on: initialData?.startsOn ?? currentDate,
      ends_on: initialData?.endsOn ?? initialData?.startsOn ?? currentDate,
      due_day: initialData?.dueDay ? String(initialData.dueDay) : "",
      credit_card_id: initialData?.creditCardId ?? "",
    },
  });
  const { control, formState, getValues, register, setValue, watch } = form;
  const seriesType = watch("series_type") as SeriesFormType;
  const hasInstallments = watch("has_installments") === "true";
  const indefinite = watch("indefinite") === "true";
  const startsOn = watch("starts_on");
  const endsOn = watch("ends_on");
  const installmentCount = watch("installment_count");
  const installmentValue = watch("installment_amount") ?? "";
  const selectedType = getSeriesTypeOption(seriesType);
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

  useEffect(() => {
    if (!drawer.props.open) return;
    form.reset({
      id: initialData?.id ?? "",
      kind: initialData?.kind ?? "recurrence",
      series_type: initialData?.seriesType ?? "service",
      title: initialData?.title ?? "",
      amount:
        initialData && initialData.kind !== "installment"
          ? inputAmount(initialData.amount)
          : "",
      installment_amount:
        initialData?.kind === "installment" && initialData.installmentCount
          ? inputAmount(
              installmentAmount(
                initialData.amount,
                initialData.installmentCount,
                1,
              ),
            )
          : "",
      installment_count: String(initialData?.installmentCount ?? 1),
      has_installments: String(initialData?.kind === "installment") as
        "true" | "false",
      indefinite: String(
        initialData
          ? initialData.kind === "recurrence" && !initialData.endsOn
          : true,
      ) as "true" | "false",
      starts_on: initialData?.startsOn ?? currentDate,
      ends_on: initialData?.endsOn ?? initialData?.startsOn ?? currentDate,
      due_day: initialData?.dueDay ? String(initialData.dueDay) : "",
      credit_card_id: initialData?.creditCardId ?? "",
    });
  }, [drawer.props.open, form, initialData, currentDate]);

  function changeSeriesType(value: string) {
    const nextType = getSeriesTypeOption(value);
    if (!nextType) return;

    setValue("series_type", nextType.value, { shouldValidate: true });
    if (nextType.entryType === "income" && hasInstallments) {
      toggleInstallments(false);
    }
  }

  function changeStartsOn(value: string) {
    setValue("starts_on", value, { shouldValidate: true });
    if (hasInstallments) {
      setValue(
        "ends_on",
        addMonthsToDate(value, Math.max(parsedInstallmentCount, 1) - 1),
        { shouldValidate: true },
      );
    } else if (value > endsOn) {
      setValue("ends_on", value, { shouldValidate: true });
    }
  }

  function changeInstallmentCount(value: string) {
    setValue("installment_count", value, { shouldValidate: true });
    const count = Number(value);
    if (!Number.isInteger(count) || count < 1 || count > 600) return;

    setValue("ends_on", addMonthsToDate(startsOn, count - 1), {
      shouldValidate: true,
    });
  }

  function changeInstallmentEnd(value: string) {
    setValue("ends_on", value, { shouldValidate: true });
    const first = parseMonth(startsOn.slice(0, 7));
    const last = parseMonth(value.slice(0, 7));
    const count =
      (last.getFullYear() - first.getFullYear()) * 12 +
      last.getMonth() -
      first.getMonth() +
      1;
    if (count > 0) {
      setValue("installment_count", String(count), { shouldValidate: true });
    }
  }

  function toggleInstallments(nextValue: boolean) {
    if (nextValue === hasInstallments) return;

    if (nextValue) {
      const currentAmount = getValues("amount");
      if (currentAmount) {
        setValue("installment_amount", currentAmount, {
          shouldValidate: true,
        });
      }
    } else {
      const currentInstallmentAmount = getValues("installment_amount");
      if (currentInstallmentAmount) {
        setValue("amount", currentInstallmentAmount, {
          shouldValidate: true,
        });
      }
    }

    setValue("has_installments", String(nextValue) as "true" | "false", {
      shouldValidate: true,
    });
    setValue("indefinite", String(!nextValue) as "true" | "false", {
      shouldValidate: true,
    });
    if (nextValue) {
      const count = Math.max(parsedInstallmentCount, 1);
      setValue("ends_on", addMonthsToDate(startsOn, count - 1), {
        shouldValidate: true,
      });
    }
  }

  return (
    <Drawer {...drawer.props}>
      <DrawerContent>
        <DrawerHeader className="shrink-0 px-3 pb-3 pt-4 text-left">
          <DrawerTitle className="text-base">
            {initialData ? "Editar programação" : "Nova programação"}
          </DrawerTitle>
          <DrawerDescription>
            {initialData
              ? "Atualize esta programação. Os lançamentos já gerados permanecem como foram registrados."
              : "Programe uma receita ou despesa mensal, com ou sem parcelas."}
          </DrawerDescription>
        </DrawerHeader>
        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={form.handleSubmit((values) =>
            onSubmit(formDataFromValues(values)),
          )}
          noValidate
        >
          <input type="hidden" {...register("id")} />
          <input type="hidden" {...register("kind")} />
          <DrawerBody className="flex flex-col gap-3 pb-5">
            {error && (
              <p
                className="rounded-xl border border-rose-800 bg-rose-900 px-3 py-2 text-sm text-rose-100"
                role="alert"
              >
                {error}
              </p>
            )}
            <Controller
              control={control}
              name="series_type"
              render={({ field }) => (
                <Select
                  label="O que deseja programar?"
                  name={field.name}
                  onValueChange={changeSeriesType}
                  value={field.value}
                  variant="secondary"
                  error={formState.errors.series_type?.message}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERIES_TYPE_OPTIONS.filter(
                      (option) =>
                        !hasInstallments || option.entryType === "expense",
                    ).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Descrição"
                containerClassName="sm:col-span-2"
                maxLength={160}
                error={formState.errors.title?.message}
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
                {...register("title")}
              />
              {hasInstallments ? (
                <>
                  <Controller
                    control={control}
                    name="installment_amount"
                    render={({ field }) => (
                      <CurrencyInput
                        name={field.name}
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        onValueChange={field.onChange}
                        inputRef={field.ref}
                        label="Valor por parcela (R$)"
                        placeholder="0,00"
                        error={formState.errors.installment_amount?.message}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="installment_count"
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Número de parcelas"
                        type="number"
                        min={1}
                        max={600}
                        step={1}
                        onChange={(event) =>
                          changeInstallmentCount(event.currentTarget.value)
                        }
                        error={formState.errors.installment_count?.message}
                      />
                    )}
                  />
                </>
              ) : (
                <Controller
                  control={control}
                  name="amount"
                  render={({ field }) => (
                    <CurrencyInput
                      name={field.name}
                      value={field.value ?? ""}
                      onBlur={field.onBlur}
                      onValueChange={field.onChange}
                      inputRef={field.ref}
                      label="Valor mensal (R$)"
                      placeholder="0,00"
                      error={formState.errors.amount?.message}
                    />
                  )}
                />
              )}
              {!isIncome && (
                <Input
                  label="Dia de vencimento (opcional)"
                  type="number"
                  min={1}
                  max={31}
                  placeholder="Sem vencimento"
                  error={formState.errors.due_day?.message}
                  {...register("due_day")}
                />
              )}
              {!isIncome && (
                <Controller
                  control={control}
                  name="credit_card_id"
                  render={({ field }) => (
                    <CreditCardSelect
                      name={field.name}
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    />
                  )}
                />
              )}
            </div>

            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-medium text-muted mb-2">
                Como esse valor será programado?
              </legend>
              <div
                aria-label="Tipo de duração"
                className="grid grid-cols-2 gap-3"
                role="group"
              >
                <Button
                  aria-pressed={!hasInstallments}
                  className="w-full"
                  onClick={() => toggleInstallments(false)}
                  type="button"
                  variant={!hasInstallments ? "primary-subtle" : "secondary"}
                >
                  Mensal
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
            <input type="hidden" {...register("has_installments")} />

            {!hasInstallments && (
              <div className="flex flex-col gap-2 my-3">
                <Switch
                  checked={!indefinite}
                  label="Definir data de término"
                  onCheckedChange={(checked) =>
                    setValue(
                      "indefinite",
                      String(!checked) as "true" | "false",
                      {
                        shouldValidate: true,
                      },
                    )
                  }
                />
                <input type="hidden" {...register("indefinite")} />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                {...register("starts_on")}
                label="Data de início"
                type="date"
                value={startsOn}
                onChange={(event) => changeStartsOn(event.currentTarget.value)}
                error={formState.errors.starts_on?.message}
              />
              {hasInstallments || !indefinite ? (
                <Input
                  {...register("ends_on")}
                  label={
                    hasInstallments
                      ? "Data da última parcela"
                      : "Data de término"
                  }
                  type="date"
                  min={startsOn}
                  value={endsOn}
                  onChange={(event) =>
                    hasInstallments
                      ? changeInstallmentEnd(event.currentTarget.value)
                      : setValue("ends_on", event.currentTarget.value, {
                          shouldValidate: true,
                        })
                  }
                  error={formState.errors.ends_on?.message}
                />
              ) : null}
            </div>

            {hasInstallments && (
              <div className="flex flex-col gap-3 rounded-xl border border-line/50 bg-graphite-800 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-sm font-medium text-ink">
                      Total do parcelamento
                    </p>
                    <p className="text-xs leading-5 text-muted">
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
                <div className="flex items-start gap-3">
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
          <DrawerFooter className="flex flex-col gap-3 shrink-0 border-t border-line/30 px-3 pb-3 pt-4">
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
