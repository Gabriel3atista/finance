"use server";

import { redirect } from "next/navigation";
import {
  monthDate,
  dateForDay,
  moneyInputToNumber,
  parseMonth,
  parseMonthInput,
} from "@/features/transactions/lib/data";
import { isFinancialCategory } from "@/features/transactions/lib/categories";
import { getSignedInContext } from "@/features/transactions/lib/server-context";

function textValue(formData: FormData, key: string, maxLength: number) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length <= maxLength ? value : null;
}

function categoryValue(formData: FormData) {
  const value = String(formData.get("category") ?? "").trim();
  return isFinancialCategory(value) ? value : null;
}

function validDueDate(value: FormDataEntryValue | null) {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== value
    ? undefined
    : value;
}

async function getUserContext() {
  const context = await getSignedInContext();
  if (!context) redirect("/login");
  return context;
}

type MutationResult = { error?: string; success?: string };

export async function createFinancialEntry(
  formData: FormData,
): Promise<MutationResult> {
  const title = textValue(formData, "title", 160);
  const category = categoryValue(formData);
  const amount = moneyInputToNumber(formData.get("amount"));
  const competenceMonth = parseMonthInput(formData.get("competence_month"));
  const dueDate = validDueDate(formData.get("due_date"));
  const entryType = String(formData.get("entry_type"));
  if (
    !title ||
    title.length < 1 ||
    category === null ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 999999999999.99 ||
    !competenceMonth ||
    dueDate === undefined ||
    (entryType !== "income" && entryType !== "expense")
  )
    return { error: "invalid-entry" };

  const context = await getUserContext();
  const { error } = await context.supabase.from("financial_entries").insert({
    household_id: context.householdId,
    title,
    entry_type: entryType,
    amount,
    category,
    competence_month: competenceMonth,
    due_date: dueDate,
    status: "planned",
    source_kind: "manual",
    created_by: context.user.id,
  });
  if (error) return { error: "save-entry" };
  return { success: "created" };
}

export async function createRecurringItem(
  formData: FormData,
): Promise<MutationResult> {
  const title = textValue(formData, "title", 160);
  const category = categoryValue(formData);
  const amount = moneyInputToNumber(formData.get("amount"));
  const startsOn = parseMonthInput(formData.get("starts_on"));
  const endsOnValue = String(formData.get("ends_on") ?? "");
  const endsOn = endsOnValue ? parseMonthInput(endsOnValue) : null;
  const dueDayValue = String(formData.get("due_day") ?? "");
  const dueDay = dueDayValue ? Number(dueDayValue) : null;
  const entryType = String(formData.get("entry_type"));
  if (
    !title ||
    title.length < 1 ||
    category === null ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 999999999999.99 ||
    !startsOn ||
    (endsOnValue && !endsOn) ||
    (endsOn && endsOn < startsOn) ||
    (dueDay !== null &&
      (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) ||
    (entryType !== "income" && entryType !== "expense")
  )
    return { error: "invalid-recurrence" };

  const context = await getUserContext();
  const { error } = await context.supabase.from("recurring_items").insert({
    household_id: context.householdId,
    title,
    entry_type: entryType,
    planned_amount: amount,
    category,
    due_day: dueDay,
    starts_on: startsOn,
    ends_on: endsOn,
    created_by: context.user.id,
  });
  if (error) return { error: "save-recurrence" };
  return { success: "recurrence" };
}

export async function createInstallmentPlan(
  formData: FormData,
): Promise<MutationResult> {
  const title = textValue(formData, "title", 160);
  const category = "Dívidas e parcelas";
  const totalAmount = moneyInputToNumber(formData.get("total_amount"));
  const installmentCount = Number(formData.get("installment_count"));
  const firstMonth = parseMonthInput(formData.get("first_month"));
  const dueDayValue = String(formData.get("due_day") ?? "");
  const dueDay = dueDayValue ? Number(dueDayValue) : null;
  if (
    !title ||
    title.length < 1 ||
    !Number.isFinite(totalAmount) ||
    totalAmount <= 0 ||
    totalAmount > 999999999999.99 ||
    !Number.isInteger(installmentCount) ||
    installmentCount < 1 ||
    installmentCount > 600 ||
    !firstMonth ||
    (dueDay !== null &&
      (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31))
  )
    return { error: "invalid-installment" };

  const context = await getUserContext();
  const { error } = await context.supabase.from("installment_plans").insert({
    household_id: context.householdId,
    title,
    total_amount: totalAmount,
    installment_count: installmentCount,
    first_month: firstMonth,
    due_day: dueDay,
    category,
    created_by: context.user.id,
  });
  if (error) return { error: "save-installment" };
  return { success: "installment" };
}

export async function updateFinancialEntry(
  formData: FormData,
): Promise<MutationResult> {
  const id = String(formData.get("id") ?? "");
  const title = textValue(formData, "title", 160);
  const category = categoryValue(formData);
  const amount = moneyInputToNumber(formData.get("amount"));
  const dueDate = validDueDate(formData.get("due_date"));
  const entryType = String(formData.get("entry_type"));
  const scope = String(formData.get("scope") ?? "single");
  if (
    !id ||
    !title ||
    title.length < 1 ||
    category === null ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 999999999999.99 ||
    dueDate === undefined ||
    (entryType !== "income" && entryType !== "expense")
  )
    return { error: "invalid-entry" };

  const context = await getUserContext();
  const { data: entry } = await context.supabase
    .from("financial_entries")
    .select("id, status, source_kind, recurring_item_id, competence_month")
    .eq("id", id)
    .eq("household_id", context.householdId)
    .maybeSingle();
  if (!entry || entry.status !== "planned")
    return { error: "entry-unavailable" };

  const values = {
    title,
    entry_type: entryType,
    amount,
    category,
    due_date: dueDate,
  };
  if (
    scope === "future" &&
    entry.source_kind === "recurrence" &&
    entry.recurring_item_id
  ) {
    const { data: futureEntries, error: fetchError } = await context.supabase
      .from("financial_entries")
      .select("id, competence_month")
      .eq("household_id", context.householdId)
      .eq("recurring_item_id", entry.recurring_item_id)
      .gte("competence_month", entry.competence_month)
      .eq("status", "planned");
    if (fetchError) return { error: "update-series" };

    const dueDay = dueDate ? Number(dueDate.slice(-2)) : null;
    const updateResults = await Promise.all(
      (futureEntries ?? []).map((futureEntry) =>
        context.supabase
          .from("financial_entries")
          .update({
            ...values,
            due_date: dateForDay(
              parseMonth(futureEntry.competence_month.slice(0, 7)),
              dueDay,
            ),
          })
          .eq("id", futureEntry.id)
          .eq("household_id", context.householdId)
          .eq("status", "planned"),
      ),
    );
    if (updateResults.some((result) => result.error))
      return { error: "update-series" };

    const { error: definitionError } = await context.supabase
      .from("recurring_items")
      .update({
        title,
        entry_type: entryType,
        planned_amount: amount,
        category,
        due_day: dueDate ? Number(dueDate.slice(-2)) : null,
      })
      .eq("id", entry.recurring_item_id)
      .eq("household_id", context.householdId);
    if (definitionError) return { error: "update-series" };
  } else {
    const { error } = await context.supabase
      .from("financial_entries")
      .update(values)
      .eq("id", id)
      .eq("household_id", context.householdId)
      .eq("status", "planned");
    if (error) return { error: "update-entry" };
  }
  return { success: entry.competence_month.slice(0, 7) };
}

export async function cancelFinancialEntry(
  formData: FormData,
): Promise<MutationResult> {
  const id = String(formData.get("id") ?? "");
  const context = await getUserContext();
  const { error } = await context.supabase
    .from("financial_entries")
    .update({ status: "cancelled", settled_at: null })
    .eq("id", id)
    .eq("household_id", context.householdId)
    .eq("status", "planned");
  if (error) return { error: "cancel-entry" };
  return { success: "cancelled" };
}

export async function deactivateSeries(
  formData: FormData,
): Promise<MutationResult> {
  const kind = String(formData.get("kind") ?? "");
  const id = String(formData.get("id") ?? "");
  const context = await getUserContext();
  const table = kind === "recurrence" ? "recurring_items" : "installment_plans";
  if (!id || (kind !== "recurrence" && kind !== "installment")) {
    return { error: "invalid-series" };
  }
  const { error } = await context.supabase
    .from(table)
    .update({ is_active: false })
    .eq("id", id)
    .eq("household_id", context.householdId);
  if (error) return { error: "deactivate-series" };
  const currentMonth = monthDate(new Date());
  const entryColumn =
    kind === "recurrence" ? "recurring_item_id" : "installment_plan_id";
  const { error: cancelError } = await context.supabase
    .from("financial_entries")
    .update({ status: "cancelled", settled_at: null })
    .eq("household_id", context.householdId)
    .eq(entryColumn, id)
    .gte("competence_month", currentMonth)
    .eq("status", "planned");
  if (cancelError) return { error: "deactivate-series" };
  return { success: "deactivated" };
}
