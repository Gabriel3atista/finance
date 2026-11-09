"use client";

import { Controller, useFormContext } from "react-hook-form";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoriesForEntryType } from "@/features/transactions/lib/categories";
import { CreditCardSelect } from "@/features/credit-cards/components/credit-card-select";
import type { EntryFormValues } from "@/features/transactions/lib/form-schemas";

export function EntryFields() {
  const {
    control,
    formState: { errors },
    register,
    setValue,
    watch,
  } = useFormContext<EntryFormValues>();
  const entryType = watch("entry_type");

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Controller
        control={control}
        name="entry_type"
        render={({ field }) => (
          <Select
            label="Tipo"
            name={field.name}
            onValueChange={(value) => {
              field.onChange(value);
              if (value === "income") {
                setValue("credit_card_id", "", { shouldValidate: true });
              }
              setValue("category", "", { shouldValidate: true });
            }}
            value={field.value}
            variant="secondary"
            containerClassName="sm:col-span-2"
            error={errors.entry_type?.message}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Despesa</SelectItem>
              <SelectItem value="income">Receita</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
      <Input
        label="Descrição"
        containerClassName="sm:col-span-2"
        maxLength={160}
        placeholder="Ex.: Salário, energia, mercado"
        error={errors.title?.message}
        {...register("title")}
      />
      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <CurrencyInput
            name={field.name}
            value={field.value}
            onBlur={field.onBlur}
            onValueChange={field.onChange}
            inputRef={field.ref}
            label="Valor (R$)"
            placeholder="0,00"
            error={errors.amount?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <Select
            label="Categoria"
            name={field.name}
            onValueChange={field.onChange}
            value={field.value}
            variant="secondary"
            required
            error={errors.category?.message}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categoriesForEntryType(entryType).map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <Input
        label="Vencimento"
        containerClassName="min-w-0"
        type="date"
        error={errors.due_date?.message}
        {...register("due_date")}
      />
      {entryType === "expense" && (
        <Controller
          control={control}
          name="credit_card_id"
          render={({ field }) => (
            <CreditCardSelect
              name={field.name}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              error={errors.credit_card_id?.message}
            />
          )}
        />
      )}
      <Input type="hidden" {...register("competence_month")} />
    </div>
  );
}
