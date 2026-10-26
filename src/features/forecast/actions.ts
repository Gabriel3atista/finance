"use server";

import { redirect } from "next/navigation";
import {
  addMonths,
  localDateString,
  moneyInputToNumber,
  monthDate,
} from "@/features/transactions/lib/data";
import { getSignedInContext } from "@/features/transactions/lib/server-context";

type MutationResult = { error?: string; success?: string };

async function getUserContext() {
  const context = await getSignedInContext();
  if (!context) redirect("/login");
  return context;
}

function parseIsoDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== value
    ? null
    : value;
}

export async function saveOpeningBalance(
  formData: FormData,
): Promise<MutationResult> {
  const openingBalance = moneyInputToNumber(formData.get("opening_balance"));
  const balanceAsOf = parseIsoDate(formData.get("balance_as_of"));
  if (
    !Number.isFinite(openingBalance) ||
    Math.abs(openingBalance) > 999999999999.99 ||
    !balanceAsOf ||
    balanceAsOf > localDateString()
  ) {
    return { error: "invalid-balance" };
  }

  const context = await getUserContext();
  const { error } = await context.supabase
    .from("household_finance_settings")
    .upsert(
      {
        household_id: context.householdId,
        opening_balance: openingBalance,
        balance_as_of: balanceAsOf,
        updated_by: context.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "household_id" },
    );
  if (error) return { error: "save-balance" };
  return { success: "balance" };
}

export async function clearOpeningBalance(): Promise<MutationResult> {
  const context = await getUserContext();
  const { error } = await context.supabase
    .from("household_finance_settings")
    .update({
      opening_balance: null,
      balance_as_of: null,
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("household_id", context.householdId);
  if (error) return { error: "save-balance" };
  return { success: "balance-cleared" };
}

export async function saveForecastOverride(
  formData: FormData,
): Promise<MutationResult> {
  const entryId = String(formData.get("entry_id") ?? "");
  const overrideAmount = moneyInputToNumber(formData.get("override_amount"));
  const noteValue = String(formData.get("note") ?? "").trim();
  if (
    !entryId ||
    !Number.isFinite(overrideAmount) ||
    overrideAmount <= 0 ||
    overrideAmount > 999999999999.99 ||
    noteValue.length > 160
  ) {
    return { error: "invalid-override" };
  }

  const context = await getUserContext();
  const { data: entry, error: entryError } = await context.supabase
    .from("financial_entries")
    .select("id, status")
    .eq("id", entryId)
    .eq("household_id", context.householdId)
    .maybeSingle();
  if (entryError || !entry || entry.status !== "planned") {
    return { error: "entry-unavailable" };
  }

  const { error } = await context.supabase
    .from("financial_forecast_overrides")
    .upsert(
      {
        household_id: context.householdId,
        entry_id: entryId,
        override_amount: overrideAmount,
        note: noteValue || null,
        updated_by: context.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "household_id,entry_id" },
    );
  if (error) return { error: "save-override" };
  return { success: "override" };
}

export async function clearForecastOverride(
  formData: FormData,
): Promise<MutationResult> {
  const entryId = String(formData.get("entry_id") ?? "");
  const context = await getUserContext();
  const { error } = await context.supabase
    .from("financial_forecast_overrides")
    .delete()
    .eq("household_id", context.householdId)
    .eq("entry_id", entryId);
  if (error) return { error: "clear-override" };
  return { success: "override-cleared" };
}

export async function saveCategoryForecastOverride(
  formData: FormData,
): Promise<MutationResult> {
  const category = String(formData.get("category") ?? "").trim();
  const competenceMonth = String(formData.get("competence_month") ?? "");
  const overrideAmount = moneyInputToNumber(formData.get("override_amount"));
  const noteValue = String(formData.get("note") ?? "").trim();
  if (
    !category ||
    category.length > 80 ||
    !/^\d{4}-\d{2}-01$/.test(competenceMonth) ||
    !Number.isFinite(overrideAmount) ||
    overrideAmount <= 0 ||
    overrideAmount > 999999999999.99 ||
    noteValue.length > 160
  ) {
    return { error: "invalid-override" };
  }
  const current = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const lastForecastMonth = monthDate(addMonths(current, 3));
  if (
    competenceMonth < monthDate(current) ||
    competenceMonth > lastForecastMonth
  ) {
    return { error: "invalid-override" };
  }

  const context = await getUserContext();
  const { error } = await context.supabase
    .from("financial_forecast_category_overrides")
    .upsert(
      {
        household_id: context.householdId,
        competence_month: competenceMonth,
        category,
        override_amount: overrideAmount,
        note: noteValue || null,
        updated_by: context.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "household_id,competence_month,category" },
    );
  if (error) return { error: "save-override" };
  return { success: "override" };
}

export async function clearCategoryForecastOverride(
  formData: FormData,
): Promise<MutationResult> {
  const category = String(formData.get("category") ?? "").trim();
  const competenceMonth = String(formData.get("competence_month") ?? "");
  const context = await getUserContext();
  const { error } = await context.supabase
    .from("financial_forecast_category_overrides")
    .delete()
    .eq("household_id", context.householdId)
    .eq("competence_month", competenceMonth)
    .eq("category", category);
  if (error) return { error: "clear-override" };
  return { success: "override-cleared" };
}
