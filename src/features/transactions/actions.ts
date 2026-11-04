"use server";

import { redirect } from "next/navigation";
import { parseCurrencyInput } from "@/shared/lib/currency";
import {
  addMonths,
  dateForDay,
  isValidDateString,
  monthString,
  parseMonth,
  parseMonthInput,
} from "@/shared/lib/date";
import {
  getSeriesTypeOption,
  isCategoryAllowedForEntryType,
} from "@/features/transactions/lib/categories";
import { getSignedInContext } from "@/features/transactions/lib/server-context";

function textValue(formData: FormData, key: string, maxLength: number) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length <= maxLength ? value : null;
}

function categoryValue(formData: FormData, entryType: string) {
  const value = String(formData.get("category") ?? "").trim();
  return isCategoryAllowedForEntryType(value, entryType) ? value : null;
}

async function creditCardIdValue(
  formData: FormData,
  context: Awaited<ReturnType<typeof getUserContext>>,
) {
  const value = String(formData.get("credit_card_id") ?? "").trim();
  if (!value) return null;
  if (!/^[0-9a-f-]{36}$/i.test(value)) return undefined;
  const { data, error } = await context.supabase
    .from("credit_cards")
    .select("id")
    .eq("id", value)
    .eq("space_id", context.spaceId)
    .maybeSingle();
  return error || !data ? undefined : data.id;
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
  const entryType = String(formData.get("entry_type"));
  const category = categoryValue(formData, entryType);
  const amount = parseCurrencyInput(formData.get("amount"));
  const competenceMonth = parseMonthInput(formData.get("competence_month"));
  const dueDate = validDueDate(formData.get("due_date"));
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
  const creditCardId =
    entryType === "expense" ? await creditCardIdValue(formData, context) : null;
  if (creditCardId === undefined) return { error: "invalid-entry" };
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
    credit_card_id: creditCardId,
  });
  if (error) return { error: "save-entry" };
  return { success: "created" };
}

type FinancialSeriesValues = {
  title: string;
  seriesType: NonNullable<ReturnType<typeof getSeriesTypeOption>>;
  amount: number;
  startsOn: string;
  endsOn: string | null;
  hasInstallments: boolean;
  installmentCount: number;
  indefinite: boolean;
  dueDay: number | null;
  creditCardId: string | null;
};

function readFinancialSeriesValues(
  formData: FormData,
): FinancialSeriesValues | null {
  const title = textValue(formData, "title", 160);
  const seriesTypeKey = String(formData.get("series_type"));
  const seriesType = getSeriesTypeOption(seriesTypeKey);
  const hasInstallments = formData.get("has_installments") === "true";
  const installmentCount = Number(formData.get("installment_count"));
  const installmentValue = parseCurrencyInput(
    formData.get("installment_amount"),
  );
  const amount = hasInstallments
    ? (Math.round(installmentValue * 100) * installmentCount) / 100
    : parseCurrencyInput(formData.get("amount"));
  const startsOn = String(formData.get("starts_on") ?? "");
  const endsOnValue = String(formData.get("ends_on") ?? "");
  const endsOn = endsOnValue || null;
  const validStartsOn = isValidDateString(startsOn);
  const validEndsOn = endsOn !== null && isValidDateString(endsOn);
  const indefinite = formData.get("indefinite") === "true";
  const dueDayValue = String(formData.get("due_day") ?? "");
  const dueDay = dueDayValue ? Number(dueDayValue) : null;
  const creditCardIdValue = String(formData.get("credit_card_id") ?? "").trim();
  const creditCardId = creditCardIdValue || null;
  const invalidEnd =
    (hasInstallments || !indefinite) &&
    (!validEndsOn || !validStartsOn || (endsOn !== null && endsOn < startsOn));
  const invalidInstallmentRange =
    hasInstallments &&
    (!validStartsOn ||
      !validEndsOn ||
      endsOn === null ||
      !Number.isInteger(installmentCount) ||
      installmentCount < 1 ||
      installmentCount > 600 ||
      monthString(
        addMonths(parseMonth(startsOn.slice(0, 7)), installmentCount - 1),
      ) !== endsOn.slice(0, 7));

  if (
    !title ||
    title.length < 1 ||
    !seriesType ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 999999999999.99 ||
    (hasInstallments &&
      (!Number.isFinite(installmentValue) ||
        installmentValue <= 0 ||
        installmentValue > 999999999999.99)) ||
    !validStartsOn ||
    invalidEnd ||
    invalidInstallmentRange ||
    (dueDay !== null &&
      (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) ||
    (hasInstallments && (indefinite || seriesType.entryType !== "expense"))
  ) {
    return null;
  }

  return {
    title,
    seriesType,
    amount,
    startsOn,
    endsOn,
    hasInstallments,
    installmentCount,
    indefinite,
    dueDay,
    creditCardId,
  };
}

export async function createFinancialSeries(
  formData: FormData,
): Promise<MutationResult> {
  const values = readFinancialSeriesValues(formData);
  if (!values) return { error: "invalid-series" };

  const context = await getUserContext();
  const creditCardId =
    values.creditCardId && values.seriesType.entryType === "expense"
      ? await creditCardIdValue(formData, context)
      : null;
  if (creditCardId === undefined) return { error: "invalid-series" };
  if (values.hasInstallments) {
    const { error } = await context.supabase.from("installment_plans").insert({
      space_id: context.spaceId,
      title: values.title,
      total_amount: values.amount,
      installment_count: values.installmentCount,
      starts_on: values.startsOn,
      ends_on: values.endsOn,
      due_day: values.dueDay,
      category: values.seriesType.category,
      created_by: context.user.id,
      credit_card_id: creditCardId,
    });
    if (error) return { error: "save-series" };
    return { success: "series" };
  }

  const { error } = await context.supabase.from("recurring_items").insert({
    space_id: context.spaceId,
    title: values.title,
    entry_type: values.seriesType.entryType,
    planned_amount: values.amount,
    category: values.seriesType.category,
    due_day: values.dueDay,
    starts_on: values.startsOn,
    ends_on: values.indefinite ? null : values.endsOn,
    created_by: context.user.id,
    credit_card_id:
      values.seriesType.entryType === "expense" ? creditCardId : null,
  });
  if (error) return { error: "save-series" };
  return { success: "series" };
}

export async function updateFinancialSeries(
  formData: FormData,
): Promise<MutationResult> {
  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const values = readFinancialSeriesValues(formData);
  if (!id || (kind !== "recurrence" && kind !== "installment") || !values) {
    return { error: "invalid-series" };
  }

  const context = await getUserContext();
  const creditCardId =
    values.creditCardId && values.seriesType.entryType === "expense"
      ? await creditCardIdValue(formData, context)
      : null;
  if (creditCardId === undefined) return { error: "invalid-series" };
  const nextKind = values.hasInstallments ? "installment" : "recurrence";
  if (kind !== nextKind) {
    const { data, error } = await context.supabase.rpc(
      "convert_financial_series_kind",
      {
        p_space_id: context.spaceId,
        p_series_id: id,
        p_from_kind: kind,
        p_to_kind: nextKind,
        p_title: values.title,
        p_entry_type: values.seriesType.entryType,
        p_amount: values.amount,
        p_category: values.seriesType.category,
        p_due_day: values.dueDay,
        p_starts_on: values.startsOn,
        p_ends_on: values.endsOn,
        p_installment_count: values.installmentCount,
        p_indefinite: values.indefinite,
        p_credit_card_id: creditCardId,
      },
    );
    if (error || !data) return { error: "update-series" };
    return { success: "series-updated" };
  }

  const result =
    kind === "installment"
      ? await context.supabase
          .from("installment_plans")
          .update({
            title: values.title,
            total_amount: values.amount,
            installment_count: values.installmentCount,
            starts_on: values.startsOn,
            ends_on: values.endsOn,
            due_day: values.dueDay,
            category: values.seriesType.category,
            credit_card_id: creditCardId,
          })
          .eq("id", id)
          .eq("space_id", context.spaceId)
          .select("id")
          .maybeSingle()
      : await context.supabase
          .from("recurring_items")
          .update({
            title: values.title,
            entry_type: values.seriesType.entryType,
            planned_amount: values.amount,
            category: values.seriesType.category,
            credit_card_id:
              values.seriesType.entryType === "expense" ? creditCardId : null,
            due_day: values.dueDay,
            starts_on: values.startsOn,
            ends_on: values.indefinite ? null : values.endsOn,
          })
          .eq("id", id)
          .eq("space_id", context.spaceId)
          .select("id")
          .maybeSingle();

  if (result.error || !result.data) return { error: "update-series" };
  return { success: "series-updated" };
}

export async function updateFinancialEntry(
  formData: FormData,
): Promise<MutationResult> {
  const id = String(formData.get("id") ?? "");
  const title = textValue(formData, "title", 160);
  const entryType = String(formData.get("entry_type"));
  const category = categoryValue(formData, entryType);
  const amount = parseCurrencyInput(formData.get("amount"));
  const dueDate = validDueDate(formData.get("due_date"));
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
  const creditCardId =
    entryType === "expense" ? await creditCardIdValue(formData, context) : null;
  if (creditCardId === undefined) return { error: "invalid-entry" };
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
    credit_card_id: creditCardId,
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
        credit_card_id: entryType === "expense" ? creditCardId : null,
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
