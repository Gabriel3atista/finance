const CATEGORY_DEFINITIONS = [
  {
    value: "Salário",
    entryType: "income",
    seriesType: { value: "salary" },
  },
  {
    value: "Serviço ou conta fixa",
    entryType: "expense",
    seriesType: { value: "service" },
  },
  {
    value: "Financiamento",
    entryType: "expense",
    seriesType: { value: "financing" },
  },
  {
    value: "Compra",
    entryType: "expense",
    seriesType: { value: "purchase" },
  },
  {
    value: "Outra receita",
    entryType: "income",
    seriesType: { value: "other_income" },
  },
  {
    value: "Outra despesa",
    entryType: "expense",
    seriesType: { value: "other_expense" },
  },
] as const;

export type FinancialEntryType = "income" | "expense";
export type FinancialCategory = (typeof CATEGORY_DEFINITIONS)[number]["value"];
export type SeriesFormType =
  (typeof CATEGORY_DEFINITIONS)[number]["seriesType"]["value"];

type SeriesTypeOption = {
  value: SeriesFormType;
  label: string;
  entryType: FinancialEntryType;
  category: FinancialCategory;
};

export const FINANCIAL_CATEGORIES = CATEGORY_DEFINITIONS.map(
  ({ value }) => value,
) as FinancialCategory[];

export const SERIES_TYPE_OPTIONS = CATEGORY_DEFINITIONS.map(
  ({ value: category, entryType, seriesType }) => ({
    ...seriesType,
    label: category,
    category,
    entryType,
  }),
) as SeriesTypeOption[];

export function categoriesForEntryType(entryType: FinancialEntryType) {
  return CATEGORY_DEFINITIONS.filter(
    (category) => category.entryType === entryType,
  ).map((category) => category.value);
}

export function isFinancialCategory(value: string): value is FinancialCategory {
  return FINANCIAL_CATEGORIES.some((category) => category === value);
}

export function isCategoryAllowedForEntryType(
  category: string,
  entryType: string,
) {
  return (
    (entryType === "income" || entryType === "expense") &&
    CATEGORY_DEFINITIONS.some(
      (definition) =>
        definition.value === category && definition.entryType === entryType,
    )
  );
}

export function getSeriesTypeOption(value: string) {
  return SERIES_TYPE_OPTIONS.find((option) => option.value === value) ?? null;
}

export function getDefaultSeriesType(
  category: string | null,
  entryType: FinancialEntryType,
): SeriesFormType {
  const match = SERIES_TYPE_OPTIONS.find(
    (option) => option.category === category && option.entryType === entryType,
  );
  if (match) return match.value;

  const normalized = (category ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
  if (entryType === "income") {
    return normalized.includes("salario") ? "salary" : "other_income";
  }
  if (normalized.includes("divida") || normalized.includes("parcela")) {
    return "purchase";
  }
  return "service";
}

export function normalizeFinancialCategory(
  category: string | null,
  entryType: FinancialEntryType,
  sourceKind?: string,
): FinancialCategory {
  if (category && isFinancialCategory(category)) return category;

  const normalized = (category ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

  if (entryType === "income") {
    return normalized.includes("salario") ? "Salário" : "Outra receita";
  }

  if (normalized.includes("financiamento")) return "Financiamento";
  if (
    sourceKind === "installment" ||
    normalized.includes("divida") ||
    normalized.includes("parcela") ||
    normalized.includes("compra")
  ) {
    return "Compra";
  }
  if (normalized.includes("outra despesa")) return "Outra despesa";
  return "Serviço ou conta fixa";
}
