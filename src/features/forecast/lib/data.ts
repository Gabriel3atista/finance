import { createClient } from "@/features/auth/lib/supabase/server";
import { formatMonth } from "@/shared/lib/date";
import {
  addMonths,
  getMonthEntries,
  localDateString,
  monthDate,
  monthString,
  type FinancialEntry,
} from "@/features/transactions/lib/data";

export type ForecastOverride = {
  entry_id: string;
  override_amount: number;
  note: string | null;
};

export type ForecastMonth = {
  month: Date;
  entries: FinancialEntry[];
  estimates: CategoryEstimate[];
};

export type CategoryEstimate = {
  key: string;
  competenceMonth: string;
  category: string;
  baseAmount: number;
  amount: number;
  note: string | null;
  monthsUsed: number;
};

export type HistoryMonth = {
  month: Date;
  income: number;
  expenses: number;
};

export async function getForecastData(householdId: string) {
  const supabase = await createClient();
  const current = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const months = Array.from({ length: 4 }, (_, index) =>
    addMonths(current, index),
  );
  const forecast: ForecastMonth[] = await Promise.all(
    months.map(async (month) => ({
      month,
      entries: await getMonthEntries(householdId, month),
      estimates: [],
    })),
  );
  const ids = forecast.flatMap((item) => item.entries.map((entry) => entry.id));
  const [settingsResult, overridesResult, categoryOverridesResult] =
    await Promise.all([
      supabase
        .from("household_finance_settings")
        .select("opening_balance, balance_as_of")
        .eq("household_id", householdId)
        .maybeSingle(),
      ids.length
        ? supabase
            .from("financial_forecast_overrides")
            .select("entry_id, override_amount, note")
            .eq("household_id", householdId)
            .in("entry_id", ids)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("financial_forecast_category_overrides")
        .select("competence_month, category, override_amount, note")
        .eq("household_id", householdId)
        .gte("competence_month", monthDate(current))
        .lt("competence_month", monthDate(addMonths(current, 4))),
    ]);
  if (
    settingsResult.error ||
    overridesResult.error ||
    categoryOverridesResult.error
  ) {
    throw new Error("Não foi possível carregar as configurações da projeção.");
  }
  const overrides = new Map(
    (overridesResult.data ?? []).map((item) => [
      item.entry_id,
      {
        ...item,
        override_amount: Number(item.override_amount),
      },
    ]),
  );

  const firstHistoryMonth = addMonths(current, -5);
  const estimateHistoryStart = addMonths(current, -6);
  const endHistoryMonth = addMonths(current, 1);
  const [historyResult, overdueResult] = await Promise.all([
    supabase
      .from("financial_entries")
      .select("entry_type, amount, competence_month, category")
      .eq("household_id", householdId)
      .eq("status", "settled")
      .gte("competence_month", monthDate(estimateHistoryStart))
      .lt("competence_month", monthDate(endHistoryMonth)),
    supabase
      .from("financial_entries")
      .select(
        "id, household_id, title, entry_type, amount, category, competence_month, due_date, status, settled_at, source_kind, recurring_item_id, installment_plan_id, installment_number, responsible_user_id",
      )
      .eq("household_id", householdId)
      .eq("status", "planned")
      .lt("due_date", localDateString())
      .lt("competence_month", monthDate(current)),
  ]);
  if (historyResult.error || overdueResult.error) {
    throw new Error("Não foi possível carregar o histórico financeiro.");
  }

  const history: HistoryMonth[] = Array.from({ length: 6 }, (_, index) => {
    const month = addMonths(firstHistoryMonth, index);
    const monthValue = monthDate(month);
    const entries = (historyResult.data ?? []).filter(
      (entry) => entry.competence_month === monthValue,
    );
    return {
      month,
      income: sum(entries, "income"),
      expenses: sum(entries, "expense"),
    };
  });

  const historyByCategory = new Map<string, Map<string, number>>();
  for (const entry of historyResult.data ?? []) {
    const category = entry.category?.trim();
    if (entry.entry_type !== "expense" || !category) continue;
    const categoryKey = category.toLocaleLowerCase("pt-BR");
    const monthlyTotals = historyByCategory.get(categoryKey) ?? new Map();
    monthlyTotals.set(
      entry.competence_month,
      (monthlyTotals.get(entry.competence_month) ?? 0) + Number(entry.amount),
    );
    historyByCategory.set(categoryKey, monthlyTotals);
  }
  const categoryOverrides = new Map(
    (categoryOverridesResult.data ?? []).map((item) => [
      `${item.competence_month}:${item.category.toLocaleLowerCase("pt-BR")}`,
      { amount: Number(item.override_amount), note: item.note },
    ]),
  );
  const forecastWithEstimates = forecast.map((item) => {
    const monthValue = monthDate(item.month);
    const monthCutoff = monthDate(addMonths(item.month, -6));
    const existingCategories = new Set(
      item.entries
        .filter((entry) => entry.entry_type === "expense" && entry.category)
        .map((entry) => entry.category!.trim().toLocaleLowerCase("pt-BR")),
    );
    const estimates: CategoryEstimate[] = [];
    for (const [categoryKey, monthlyTotals] of historyByCategory) {
      if (existingCategories.has(categoryKey)) continue;
      const samples = [...monthlyTotals.entries()].filter(
        ([month]) => month < monthValue && month >= monthCutoff,
      );
      if (samples.length < 2) continue;
      const baseAmount =
        Math.round(
          (samples.reduce((total, [, value]) => total + value, 0) /
            samples.length) *
            100,
        ) / 100;
      if (baseAmount <= 0) continue;
      const category =
        [...monthlyTotals.keys()]
          .map((month) =>
            (historyResult.data ?? [])
              .find(
                (entry) =>
                  entry.competence_month === month &&
                  entry.category?.trim().toLocaleLowerCase("pt-BR") ===
                    categoryKey,
              )
              ?.category?.trim(),
          )
          .find(Boolean) ?? categoryKey;
      const key = `${monthValue}:${categoryKey}`;
      const override = categoryOverrides.get(key);
      estimates.push({
        key,
        competenceMonth: monthValue,
        category,
        baseAmount,
        amount: override?.amount ?? baseAmount,
        note: override?.note ?? null,
        monthsUsed: samples.length,
      });
    }
    return { ...item, estimates };
  });

  return {
    forecast: forecastWithEstimates,
    overdue: (overdueResult.data ?? []) as FinancialEntry[],
    overrides,
    settings: settingsResult.data
      ? {
          openingBalance:
            settingsResult.data.opening_balance === null
              ? null
              : Number(settingsResult.data.opening_balance),
          balanceAsOf: settingsResult.data.balance_as_of,
        }
      : null,
    history,
  };
}

export function effectiveAmount(
  entry: FinancialEntry,
  overrides: Map<string, ForecastOverride>,
) {
  return overrides.get(entry.id)?.override_amount ?? Number(entry.amount);
}

export function monthTotals(
  entries: FinancialEntry[],
  overrides: Map<string, ForecastOverride>,
) {
  return entries.reduce(
    (totals, entry) => {
      const amount = effectiveAmount(entry, overrides);
      if (entry.entry_type === "income") totals.income += amount;
      else totals.expenses += amount;
      if (entry.status === "settled") {
        if (entry.entry_type === "income") totals.settledIncome += amount;
        else totals.settledExpenses += amount;
      } else if (entry.status === "planned") {
        if (overrides.has(entry.id)) totals.editedCount += 1;
        else totals.plannedCount += 1;
      }
      return totals;
    },
    {
      income: 0,
      expenses: 0,
      settledIncome: 0,
      settledExpenses: 0,
      plannedCount: 0,
      editedCount: 0,
    },
  );
}

export function historyCommitment(month: HistoryMonth) {
  return month.income > 0 ? (month.expenses / month.income) * 100 : null;
}

export function labelMonth(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(date)
    .replace(".", "");
}

export function monthTitle(date: Date) {
  return formatMonth(date);
}

export function monthKey(date: Date) {
  return monthString(date);
}

function sum(
  entries: Array<{ entry_type: string; amount: number | string }>,
  type: "income" | "expense",
) {
  return entries
    .filter((entry) => entry.entry_type === type)
    .reduce((total, entry) => total + Number(entry.amount), 0);
}
