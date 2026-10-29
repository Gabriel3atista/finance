"use client";

import { createClient } from "@/features/auth/lib/supabase/client";
import {
  addMonths,
  dateForDay,
  installmentAmount,
  monthDate,
  type FinancialEntry,
  type InstallmentPlan,
  type RecurringItem,
} from "@/features/transactions/lib/data";

const entryColumns =
  "id, household_id, title, entry_type, amount, category, competence_month, due_date, status, settled_at, source_kind, recurring_item_id, installment_plan_id, installment_number";
const recurringColumns =
  "id, household_id, title, entry_type, planned_amount, category, due_day, starts_on, ends_on, is_active";
const installmentColumns =
  "id, household_id, title, total_amount, installment_count, first_month, due_day, category, is_active";

export async function fetchRecurringItems(householdId: string) {
  const { data, error } = await createClient()
    .from("recurring_items")
    .select(recurringColumns)
    .eq("household_id", householdId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RecurringItem[];
}

export async function fetchInstallmentPlans(householdId: string) {
  const { data, error } = await createClient()
    .from("installment_plans")
    .select(installmentColumns)
    .eq("household_id", householdId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as InstallmentPlan[];
}

export async function ensureMonthEntries(
  householdId: string,
  userId: string,
  month: Date,
) {
  const supabase = createClient();
  const monthValue = monthDate(month);
  const [recurringResult, plansResult, existingResult, exclusionsResult] =
    await Promise.all([
      supabase
        .from("recurring_items")
        .select(recurringColumns)
        .eq("household_id", householdId)
        .eq("is_active", true)
        .lte("starts_on", monthValue)
        .or(`ends_on.is.null,ends_on.gte.${monthValue}`),
      supabase
        .from("installment_plans")
        .select(installmentColumns)
        .eq("household_id", householdId)
        .eq("is_active", true)
        .lte("first_month", monthValue),
      supabase
        .from("financial_entries")
        .select("recurring_item_id, installment_plan_id, installment_number")
        .eq("household_id", householdId)
        .eq("competence_month", monthValue),
      supabase
        .from("financial_entry_exclusions")
        .select("recurring_item_id, installment_plan_id, installment_number")
        .eq("household_id", householdId)
        .eq("competence_month", monthValue),
    ]);
  if (
    recurringResult.error ||
    plansResult.error ||
    existingResult.error ||
    exclusionsResult.error
  ) {
    throw new Error("Não foi possível carregar os cadastros deste mês.");
  }

  const existing = existingResult.data ?? [];
  const exclusions = exclusionsResult.data ?? [];
  const recurringIds = new Set(
    [...existing, ...exclusions]
      .map((entry) => entry.recurring_item_id)
      .filter(Boolean),
  );
  const installmentIds = new Set(
    [...existing, ...exclusions]
      .filter((entry) => entry.installment_plan_id)
      .map(
        (entry) => `${entry.installment_plan_id}:${entry.installment_number}`,
      ),
  );
  const rows: Array<Record<string, unknown>> = [];

  for (const item of (recurringResult.data ?? []) as RecurringItem[]) {
    if (recurringIds.has(item.id)) continue;
    rows.push({
      household_id: householdId,
      title: item.title,
      entry_type: item.entry_type,
      amount: item.planned_amount,
      category: item.category,
      competence_month: monthValue,
      due_date: dateForDay(month, item.due_day),
      status: "planned",
      source_kind: "recurrence",
      recurring_item_id: item.id,
      created_by: userId,
    });
  }

  for (const plan of (plansResult.data ?? []) as InstallmentPlan[]) {
    const first = new Date(`${plan.first_month}T00:00:00`);
    const number =
      (month.getFullYear() - first.getFullYear()) * 12 +
      (month.getMonth() - first.getMonth()) +
      1;
    if (
      number < 1 ||
      number > plan.installment_count ||
      installmentIds.has(`${plan.id}:${number}`)
    )
      continue;
    rows.push({
      household_id: householdId,
      title: `${plan.title} (${number}/${plan.installment_count})`,
      entry_type: "expense",
      amount: installmentAmount(
        Number(plan.total_amount),
        plan.installment_count,
        number,
      ),
      category: plan.category,
      competence_month: monthValue,
      due_date: dateForDay(month, plan.due_day),
      status: "planned",
      source_kind: "installment",
      installment_plan_id: plan.id,
      installment_number: number,
      created_by: userId,
    });
  }

  if (rows.length) {
    const { error } = await supabase.from("financial_entries").insert(rows);
    if (error && error.code !== "23505") {
      throw new Error("Falha ao gerar os lançamentos previstos do mês.");
    }
  }
}

export async function fetchMonthEntries(householdId: string, month: Date) {
  const start = monthDate(month);
  const end = monthDate(addMonths(month, 1));
  const { data, error } = await createClient()
    .from("financial_entries")
    .select(entryColumns)
    .eq("household_id", householdId)
    .gte("competence_month", start)
    .lt("competence_month", end)
    .neq("status", "cancelled")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error)
    throw new Error("Não foi possível carregar os lançamentos do mês.");
  return (data ?? []) as FinancialEntry[];
}
