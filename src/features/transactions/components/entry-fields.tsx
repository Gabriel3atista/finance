import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FINANCIAL_CATEGORIES,
  normalizeFinancialCategory,
} from "@/features/transactions/lib/categories";

export function EntryFields({
  month,
  entry,
}: {
  month: string;
  entry?: {
    title: string;
    amount: number;
    category: string | null;
    entry_type?: "income" | "expense";
    source_kind?: string;
    due_date: string | null;
  };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input
        label="Descrição"
        containerClassName="sm:col-span-2"
        name="title"
        maxLength={160}
        required
        defaultValue={entry?.title}
        placeholder="Ex.: Salário, energia, mercado"
      />
      <Input
        label="Valor (R$)"
        name="amount"
        inputMode="decimal"
        required
        defaultValue={
          entry ? entry.amount.toFixed(2).replace(".", ",") : undefined
        }
        placeholder="0,00"
      />
      <CategorySelect
        label="Categoria"
        defaultValue={
          entry
            ? normalizeFinancialCategory(
                entry.category,
                entry.entry_type ?? "expense",
                entry.source_kind,
              )
            : undefined
        }
      />
      <Input
        label="Vencimento"
        containerClassName="min-w-0"
        type="date"
        name="due_date"
        defaultValue={entry?.due_date ?? ""}
      />
      <Input type="hidden" name="competence_month" value={month} />
    </div>
  );
}

export function SeriesFields({ month }: { month: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input
        label="Descrição"
        containerClassName="sm:col-span-2"
        name="title"
        maxLength={160}
        required
      />
      <Input
        label="Valor (R$)"
        name="amount"
        inputMode="decimal"
        placeholder="0,00"
        required
      />
      <CategorySelect label="Categoria" />
      <Input
        label="Dia de vencimento"
        name="due_day"
        type="number"
        min={1}
        max={31}
        placeholder="Opcional"
      />
      <Input type="hidden" name="starts_on" value={month} />
    </div>
  );
}

export function CategorySelect({
  defaultValue,
  label,
}: {
  defaultValue?: string;
  label?: string;
}) {
  return (
    <Select
      label={label}
      name="category"
      defaultValue={defaultValue}
      variant="secondary"
      required
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecione uma categoria" />
      </SelectTrigger>
      <SelectContent>
        {FINANCIAL_CATEGORIES.map((category) => (
          <SelectItem key={category} value={category}>
            {category}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
