import { createClient } from "@/features/auth/lib/supabase/server";
import {
  addMonths,
  getMonthEntries,
  localDateString,
  monthDate,
  type FinancialEntry,
} from "@/features/transactions/lib/data";

export type DashboardMonth = {
  month: Date;
  income: number;
  expenses: number;
};

export type DashboardDueEntry = Pick<
  FinancialEntry,
  "id" | "title" | "entry_type" | "amount" | "due_date" | "competence_month"
>;

export async function getDashboardData(householdId: string) {
  const supabase = await createClient();
  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstMonth = addMonths(currentMonth, -11);
  const nextMonth = addMonths(currentMonth, 1);
  const dueLimit = localDateString(addDays(today, 30));

  const [currentEntries, historyResult, dueResult] = await Promise.all([
    getMonthEntries(householdId, currentMonth),
    supabase
      .from("financial_entries")
      .select("entry_type, amount, competence_month")
      .eq("household_id", householdId)
      .eq("status", "settled")
      .gte("competence_month", monthDate(firstMonth))
      .lt("competence_month", monthDate(nextMonth)),
    supabase
      .from("financial_entries")
      .select("id, title, entry_type, amount, due_date, competence_month")
      .eq("household_id", householdId)
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

  const history: DashboardMonth[] = Array.from({ length: 12 }, (_, index) => {
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

function sum(
  entries: FinancialEntry[],
  type: FinancialEntry["entry_type"],
  status: FinancialEntry["status"],
) {
  return entries
    .filter((entry) => entry.entry_type === type && entry.status === status)
    .reduce((total, entry) => total + Number(entry.amount), 0);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}
