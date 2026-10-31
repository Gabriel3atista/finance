"use client";

import { createClient } from "@/features/auth/lib/supabase/client";
import type { FinancialEntry } from "@/features/transactions/lib/data";
import { addDays, addMonths, localDateString, monthDate } from "@/shared/lib/date";
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

  const [currentEntries, historyResult, dueResult] = await Promise.all([
    fetchMonthEntries(spaceId, currentMonth),
    getSettledHistory(
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

  if (historyResult.error || dueResult.error) {
    throw new Error("Não foi possível carregar o painel financeiro.");
  }

  const historyByMonth = new Map<
    string,
    { income: number; expenses: number }
  >();
  for (const entry of historyResult.data ?? []) {
    const totals = historyByMonth.get(entry.competence_month) ?? {
      income: 0,
      expenses: 0,
    };
    if (entry.entry_type === "income") totals.income += Number(entry.amount);
    else totals.expenses += Number(entry.amount);
    historyByMonth.set(entry.competence_month, totals);
  }

  const history: DashboardMonth[] = Array.from({ length: 60 }, (_, index) => {
    const month = addMonths(firstMonth, index);
    const totals = historyByMonth.get(monthDate(month));
    return {
      month,
      income: totals?.income ?? 0,
      expenses: totals?.expenses ?? 0,
    };
  });

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

async function getSettledHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  spaceId: string,
  firstMonth: string,
  nextMonth: string,
) {
  const pageSize = 1000;
  const entries: {
    entry_type: "income" | "expense";
    amount: number;
    competence_month: string;
  }[] = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("financial_entries")
      .select("entry_type, amount, competence_month")
      .eq("space_id", spaceId)
      .eq("status", "settled")
      .gte("competence_month", firstMonth)
      .lt("competence_month", nextMonth)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) return { data: null, error };
    entries.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  return { data: entries, error: null };
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

