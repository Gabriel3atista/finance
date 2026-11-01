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

export function SeriesFormDrawer({
  drawer,
  currentMonth,
  error,
  pending,
  onSubmit,
}: {
  drawer: DrawerController;
  currentMonth: string;
  error?: string;
  pending: boolean;
  onSubmit: (form: FormData) => void;
}) {
  const [seriesType, setSeriesType] =
    useState<(typeof seriesTypeOptions)[number]["value"]>("service");
  const [hasInstallments, setHasInstallments] = useState(false);
  const [indefinite, setIndefinite] = useState(true);
  const [startsOn, setStartsOn] = useState(currentMonth);
  const [endsOn, setEndsOn] = useState(currentMonth);
  const selectedType = seriesTypeOptions.find(
    (option) => option.value === seriesType,
  );
  const isIncome = selectedType?.entryType === "income";

  function changeSeriesType(value: string) {
    const nextType = seriesTypeOptions.find((option) => option.value === value);
    if (!nextType) return;

    setSeriesType(nextType.value);
    if (nextType.entryType === "income") setHasInstallments(false);
  }

  function changeStartsOn(value: string) {
    setStartsOn(value);
    if (value > endsOn) setEndsOn(value);
  }

  function toggleInstallments(nextValue: boolean) {
    setHasInstallments(nextValue);
    setIndefinite(!nextValue);
  }

  return (
    <Drawer {...drawer.props}>
      <DrawerContent>
        <DrawerHeader className="shrink-0 px-3 pb-3 pt-4 text-left">
          <DrawerTitle className="text-base">Novo cadastro</DrawerTitle>
          <DrawerDescription>
            Configure uma receita ou despesa mensal, com ou sem parcelas.
          </DrawerDescription>
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
                {seriesTypeOptions.map((option) => (
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
              <Input
                label={
                  hasInstallments ? "Valor total (R$)" : "Valor mensal (R$)"
                }
                name="amount"
                inputMode="decimal"
                placeholder="0,00"
                required
              />
              {(hasInstallments || (!isIncome && !indefinite)) && (
                <Input
                  label="Dia de vencimento (opcional)"
                  name="due_day"
                  type="number"
                  min={1}
                  max={31}
                  placeholder="Sem vencimento"
                />
              )}
            </div>

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
              <input
                name="has_installments"
                type="hidden"
                value={String(hasInstallments)}
              />
            </fieldset>

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
                label="Mês de início"
                name="starts_on"
                type="month"
                value={startsOn}
                onChange={(event) => changeStartsOn(event.currentTarget.value)}
                required
              />
              {hasInstallments || !indefinite ? (
                <Input
                  label={
                    hasInstallments ? "Mês da última parcela" : "Mês de término"
                  }
                  name="ends_on"
                  type="month"
                  min={startsOn}
                  value={endsOn}
                  onChange={(event) => setEndsOn(event.currentTarget.value)}
                  required
                />
              ) : null}
            </div>

            {hasInstallments && (
              <div className="rounded-xl border border-line/50 bg-graphite-800 p-3">
                <Badge size="sm" variant="secondary">
                  Valor por parcela calculado automaticamente
                </Badge>
                <p className="mt-2 text-xs leading-5 text-muted">
                  O número de parcelas será definido pelo intervalo entre o mês
                  inicial e o último mês.
                </p>
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
              Salvar
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
