"use server";

import { redirect } from "next/navigation";
import { parseCurrencyInput } from "@/shared/lib/currency";
import {
  dateForDay,
  isValidDateString,
  parseMonth,
  parseMonthInput,
} from "@/shared/lib/date";
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
  if (typeof value !== "string" || !isValidDateString(value)) return undefined;
  return value;
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
  const amount = parseCurrencyInput(formData.get("amount"));
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
    space_id: context.spaceId,
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

const seriesTypes = {
  salary: { entryType: "income", category: "Salário" },
  service: { entryType: "expense", category: "Fixos" },
  financing: { entryType: "expense", category: "Dívidas e parcelas" },
  purchase: { entryType: "expense", category: "Dívidas e parcelas" },
  other_income: { entryType: "income", category: "Outras entradas" },
  other_expense: { entryType: "expense", category: "Fixos" },
} as const;

export async function createFinancialSeries(
  formData: FormData,
): Promise<MutationResult> {
  const title = textValue(formData, "title", 160);
  const seriesTypeKey = String(formData.get("series_type"));
  const seriesType =
    seriesTypes[seriesTypeKey as keyof typeof seriesTypes] ?? null;
  const amount = parseCurrencyInput(formData.get("amount"));
  const startsOn = parseMonthInput(formData.get("starts_on"));
  const endsOnValue = String(formData.get("ends_on") ?? "");
  const endsOn = endsOnValue ? parseMonthInput(endsOnValue) : null;
  const hasInstallments = formData.get("has_installments") === "true";
  const indefinite = formData.get("indefinite") === "true";
  const dueDayValue = String(formData.get("due_day") ?? "");
  const dueDay = dueDayValue ? Number(dueDayValue) : null;
  const invalidEnd =
    (hasInstallments || !indefinite) &&
    (!endsOn || (startsOn !== null && endsOn < startsOn));

  if (
    !title ||
    title.length < 1 ||
    !seriesType ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 999999999999.99 ||
    !startsOn ||
    invalidEnd ||
    (dueDay !== null &&
      (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) ||
    (hasInstallments && (indefinite || seriesType.entryType !== "expense"))
  ) {
    return { error: "invalid-series" };
  }

  const context = await getUserContext();
  if (hasInstallments) {
    const first = new Date(`${startsOn}T00:00:00`);
    const last = new Date(`${endsOn}T00:00:00`);
    const installmentCount =
      (last.getFullYear() - first.getFullYear()) * 12 +
      last.getMonth() -
      first.getMonth() +
      1;
    if (installmentCount < 1 || installmentCount > 600) {
      return { error: "invalid-series" };
    }

    const { error } = await context.supabase.from("installment_plans").insert({
      space_id: context.spaceId,
      title,
      total_amount: amount,
      installment_count: installmentCount,
      first_month: startsOn,
      due_day: dueDay,
      category: seriesType.category,
      created_by: context.user.id,
    });
    if (error) return { error: "save-series" };
    return { success: "series" };
  }

  const { error } = await context.supabase.from("recurring_items").insert({
    space_id: context.spaceId,
    title,
    entry_type: seriesType.entryType,
    planned_amount: amount,
    category: seriesType.category,
    due_day: dueDay,
    starts_on: startsOn,
    ends_on: indefinite ? null : endsOn,
    created_by: context.user.id,
  });
  if (error) return { error: "save-series" };
  return { success: "series" };
}

export async function updateFinancialEntry(
  formData: FormData,
): Promise<MutationResult> {
  const id = String(formData.get("id") ?? "");
  const title = textValue(formData, "title", 160);
  const category = categoryValue(formData);
  const amount = parseCurrencyInput(formData.get("amount"));
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
    .select(
      "id, source_kind, recurring_item_id, installment_plan_id, installment_number, competence_month",
    )
    .eq("id", id)
    .eq("space_id", context.spaceId)
    .maybeSingle();
  if (!entry) return { error: "entry-unavailable" };

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
      .eq("space_id", context.spaceId)
      .eq("recurring_item_id", entry.recurring_item_id)
      .gte("competence_month", entry.competence_month);
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
          .eq("space_id", context.spaceId),
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
      .eq("space_id", context.spaceId);
    if (definitionError) return { error: "update-series" };
  } else {
    const { error } = await context.supabase
      .from("financial_entries")
      .update(values)
      .eq("id", id)
      .eq("space_id", context.spaceId);
    if (error) return { error: "update-entry" };
  }
  return { success: entry.competence_month.slice(0, 7) };
}

export async function deleteFinancialEntry(
  formData: FormData,
): Promise<MutationResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "invalid-entry" };
  const context = await getUserContext();
  const { data, error } = await context.supabase.rpc("delete_financial_entry", {
    p_entry_id: id,
  });
  if (error || !data) return { error: "delete-entry" };
  return { success: "deleted" };
}

export async function copyPreviousMonthEntries(targetMonthValue: string) {
  const targetMonth = parseMonthInput(targetMonthValue);
  if (!targetMonth) return { error: "invalid-month" };

  const context = await getUserContext();
  const { data, error } = await context.supabase.rpc(
    "copy_financial_entries_to_month",
    {
      p_household_id: context.spaceId,
      p_target_month: targetMonth,
    },
  );
  if (error) return { error: "copy-month" };
  return { success: "month-copied", count: Number(data ?? 0) };
}

export async function deleteMonthEntries(monthValue: string) {
  const month = parseMonthInput(monthValue);
  if (!month) return { error: "invalid-month" };

  const context = await getUserContext();
  const { data, error } = await context.supabase.rpc(
    "delete_financial_entries_for_month",
    {
      p_household_id: context.spaceId,
      p_month: month,
    },
  );
  if (error) return { error: "delete-month" };
  return { success: "month-deleted", count: Number(data ?? 0) };
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
    .eq("space_id", context.spaceId);
  if (error) return { error: "deactivate-series" };
  return { success: "deactivated" };
}

export async function deleteFinancialSeries(
  id: string,
  kind: string,
): Promise<MutationResult> {
  if (!id || (kind !== "recurrence" && kind !== "installment")) {
    return { error: "invalid-series" };
  }

  const context = await getUserContext();
  const { data, error } = await context.supabase.rpc(
    "delete_financial_series",
    {
      p_household_id: context.spaceId,
      p_series_id: id,
      p_kind: kind,
    },
  );
  if (error || !data) return { error: "delete-series" };
  return { success: "series-deleted" };
}
