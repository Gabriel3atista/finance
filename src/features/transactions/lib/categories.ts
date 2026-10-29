export const FINANCIAL_CATEGORIES = [
  "Despesas",
  "Dívidas e parcelas",
  "Outras entradas",
  "Salário",
] as const;

export type FinancialCategory = (typeof FINANCIAL_CATEGORIES)[number];

export function isFinancialCategory(value: string): value is FinancialCategory {
  return FINANCIAL_CATEGORIES.some((category) => category === value);
}

export function normalizeFinancialCategory(
  category: string | null,
  entryType: "income" | "expense",
  sourceKind?: string,
): FinancialCategory {
  if (category && isFinancialCategory(category)) return category;

  const normalized = (category ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

  if (entryType === "income") {
    return normalized.includes("salario") ? "Salário" : "Outras entradas";
  }

  if (
    sourceKind === "installment" ||
    normalized.includes("divida") ||
    normalized.includes("parcela")
  ) {
    return "Dívidas e parcelas";
  }

  return "Despesas";
}
