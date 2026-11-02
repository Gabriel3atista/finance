"use client";

import { createClient } from "@/features/auth/lib/supabase/client";
import type { FinancialEntry } from "@/features/transactions/lib/data";
import { installmentAmount } from "@/shared/lib/currency";
import {
  addDays,
  addMonths,
  localDateString,
  monthDate,
} from "@/shared/lib/date";
import { fetchMonthEntries } from "@/features/transactions/lib/queries";

export type DashboardMonth = {
  month: Date;
  income: number;
  expenses: number;
};

export type DashboardDueEntry = Pick<
  FinancialEntry,
  "id" | "title" | "entry_type" | "amount" | "due_date" | "competence_month"
>;

export async function getDashboardData(spaceId: string) {
  const supabase = createClient();
  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstMonth = addMonths(currentMonth, -59);
  const nextMonth = addMonths(currentMonth, 1);
  const dueLimit = localDateString(addDays(today, 30));

  const [currentEntries, history, dueResult] = await Promise.all([
    fetchMonthEntries(spaceId, currentMonth),
    getMonthlyHistory(
      supabase,
      spaceId,
      monthDate(firstMonth),
      monthDate(nextMonth),
    ),
    supabase
      .from("financial_entries")
      .select("id, title, entry_type, amount, due_date, competence_month")
      .eq("space_id", spaceId)
      .eq("status", "planned")
      .not("due_date", "is", null)
      .lte("due_date", dueLimit)
      .order("due_date", { ascending: true })
      .limit(100),
  ]);

  if (!history || dueResult.error) {
    throw new Error("Não foi possível carregar o painel financeiro.");
  }

  const settledIncome = sum(currentEntries, "income", "settled");
  const settledExpenses = sum(currentEntries, "expense", "settled");
  const plannedExpenses = sum(currentEntries, "expense", "planned");

  return {
    currentMonth,
    history,
    upcoming: (dueResult.data ?? []).map((entry) => ({
      ...entry,
      amount: Number(entry.amount),
    })) as DashboardDueEntry[],
    settledIncome,
    settledExpenses,
    realizedBalance: settledIncome - settledExpenses,
    plannedExpenses,
  };
}

async function getMonthlyHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  spaceId: string,
  firstMonth: string,
  nextMonth: string,
): Promise<DashboardMonth[] | null> {
  const entries: {
    entry_type: "income" | "expense";
    amount: number;
    competence_month: string;
    status: "planned" | "settled" | "cancelled";
    recurring_item_id: string | null;
    installment_plan_id: string | null;
    installment_number: number | null;
  }[] = [];
  const pageSize = 1000;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("financial_entries")
      .select(
        "entry_type, amount, competence_month, status, recurring_item_id, installment_plan_id, installment_number",
      )
      .eq("space_id", spaceId)
      .gte("competence_month", firstMonth)
      .lt("competence_month", nextMonth)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) return null;
    entries.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  const [recurringResult, installmentResult, exclusionResult] =
    await Promise.all([
      supabase
        .from("recurring_items")
        .select("id, entry_type, planned_amount, starts_on, ends_on")
        .eq("space_id", spaceId)
        .eq("is_active", true)
        .lt("starts_on", nextMonth)
        .or(`ends_on.is.null,ends_on.gte.${firstMonth}`),
      supabase
        .from("installment_plans")
        .select("id, total_amount, installment_count, starts_on, ends_on")
        .eq("space_id", spaceId)
        .eq("is_active", true)
        .lt("starts_on", nextMonth)
        .gte("ends_on", firstMonth),
      supabase
        .from("financial_entry_exclusions")
        .select(
          "competence_month, recurring_item_id, installment_plan_id, installment_number",
        )
        .eq("space_id", spaceId)
        .gte("competence_month", firstMonth)
        .lt("competence_month", nextMonth),
    ]);

  if (recurringResult.error || installmentResult.error || exclusionResult.error)
    return null;

  const totals = new Map<string, { income: number; expenses: number }>();
  const occurrences = new Set<string>();
  const exclusions = new Set<string>();

  for (const entry of entries) {
    if (entry.recurring_item_id) {
      occurrences.add(`${entry.recurring_item_id}:${entry.competence_month}`);
    }
    if (entry.installment_plan_id && entry.installment_number) {
      occurrences.add(
        `${entry.installment_plan_id}:${entry.installment_number}:${entry.competence_month}`,
      );
    }
    if (entry.status !== "cancelled") {
      addToTotals(
        totals,
        entry.competence_month,
        entry.entry_type,
        Number(entry.amount),
      );
    }
  }

  for (const exclusion of exclusionResult.data ?? []) {
    if (exclusion.recurring_item_id) {
      exclusions.add(
        `${exclusion.recurring_item_id}:${exclusion.competence_month}`,
      );
    }
    if (exclusion.installment_plan_id && exclusion.installment_number) {
      exclusions.add(
        `${exclusion.installment_plan_id}:${exclusion.installment_number}:${exclusion.competence_month}`,
      );
    }
  }

  const months = Array.from({ length: 60 }, (_, index) =>
    addMonths(new Date(`${firstMonth}T00:00:00`), index),
  );

  for (const item of recurringResult.data ?? []) {
    for (const month of months) {
      const monthValue = monthDate(month);
      const occurrenceKey = `${item.id}:${monthValue}`;
      if (
        item.starts_on >= monthDate(addMonths(month, 1)) ||
        (item.ends_on && item.ends_on < monthValue) ||
        occurrences.has(occurrenceKey) ||
        exclusions.has(occurrenceKey)
      ) {
        continue;
      }
      addToTotals(
        totals,
        monthValue,
        item.entry_type,
        Number(item.planned_amount),
      );
    }
  }

  for (const plan of installmentResult.data ?? []) {
    const first = new Date(`${plan.starts_on}T00:00:00`);
    for (const month of months) {
      const monthValue = monthDate(month);
      const installmentNumber =
        (month.getFullYear() - first.getFullYear()) * 12 +
        (month.getMonth() - first.getMonth()) +
        1;
      const occurrenceKey = `${plan.id}:${installmentNumber}:${monthValue}`;
      if (
        installmentNumber < 1 ||
        installmentNumber > plan.installment_count ||
        occurrences.has(occurrenceKey) ||
        exclusions.has(occurrenceKey)
      ) {
        continue;
      }
      addToTotals(
        totals,
        monthValue,
        "expense",
        installmentAmount(
          Number(plan.total_amount),
          plan.installment_count,
          installmentNumber,
        ),
      );
    }
  }

  return months.map((month) => {
    const monthTotals = totals.get(monthDate(month));
    return {
      month,
      income: monthTotals?.income ?? 0,
      expenses: monthTotals?.expenses ?? 0,
    };
  });
}

function addToTotals(
  totals: Map<string, { income: number; expenses: number }>,
  month: string,
  type: "income" | "expense",
  amount: number,
) {
  const monthTotals = totals.get(month) ?? { income: 0, expenses: 0 };
  if (type === "income") monthTotals.income += amount;
  else monthTotals.expenses += amount;
  totals.set(month, monthTotals);
}

function sum(
  entries: FinancialEntry[],
  type: FinancialEntry["entry_type"],
  status: FinancialEntry["status"],
) {
  return entries
    .filter((entry) => entry.entry_type === type && entry.status === status)
    .reduce((total, entry) => total + Number(entry.amount), 0);
}
