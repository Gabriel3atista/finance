import { createClient } from "@/features/auth/lib/supabase/server";

export type HouseholdMember = {
  user_id: string;
  member_role: "owner" | "member";
};

export type FinancialEntry = {
  id: string;
  household_id: string;
  title: string;
  entry_type: "income" | "expense";
  amount: number;
  category: string | null;
  competence_month: string;
  due_date: string | null;
  status: "planned" | "settled" | "cancelled";
  settled_at: string | null;
  source_kind:
    | "manual"
    | "recurrence"
    | "installment"
    | "card_statement"
    | "historical_import";
  recurring_item_id: string | null;
  installment_plan_id: string | null;
  installment_number: number | null;
  responsible_user_id: string | null;
};

export type RecurringItem = {
  id: string;
  household_id: string;
  title: string;
  entry_type: "income" | "expense";
  planned_amount: number;
  category: string | null;
  due_day: number | null;
  starts_on: string;
  ends_on: string | null;
  is_active: boolean;
  responsible_user_id: string | null;
};

export type InstallmentPlan = {
  id: string;
  household_id: string;
  title: string;
  total_amount: number;
  installment_count: number;
  first_month: string;
  due_day: number | null;
  category: string | null;
  is_active: boolean;
  responsible_user_id: string | null;
};

export async function getSignedInContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!member) return null;
  return { supabase, user, householdId: member.household_id };
}

export function parseMonth(value: string | undefined) {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (!match)
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return new Date();
  return new Date(year, month - 1, 1);
}

export function monthString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthDate(date: Date) {
  return `${monthString(date)}-01`;
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function dateForDay(month: Date, day: number | null) {
  if (!day) return null;
  const bounded = Math.min(
    day,
    daysInMonth(month.getFullYear(), month.getMonth()),
  );
  return `${monthString(month)}-${String(bounded).padStart(2, "0")}`;
}

export function installmentAmount(
  total: number,
  count: number,
  number: number,
) {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const remainder = cents - base * count;
  return (base + (number <= remainder ? 1 : 0)) / 100;
}

export async function ensureMonthEntries(householdId: string, month: Date) {
  const context = await getSignedInContext();
  if (!context || context.householdId !== householdId) return;
  const { supabase, user } = context;
  const monthValue = monthDate(month);

  const [recurringResult, plansResult, existingResult] = await Promise.all([
    supabase
      .from("recurring_items")
      .select(
        "id, household_id, title, entry_type, planned_amount, category, due_day, starts_on, ends_on, is_active, responsible_user_id",
      )
      .eq("household_id", householdId)
      .eq("is_active", true)
      .lte("starts_on", monthValue)
      .or(`ends_on.is.null,ends_on.gte.${monthValue}`),
    supabase
      .from("installment_plans")
      .select(
        "id, household_id, title, total_amount, installment_count, first_month, due_day, category, is_active, responsible_user_id",
      )
      .eq("household_id", householdId)
      .eq("is_active", true)
      .lte("first_month", monthValue),
    supabase
      .from("financial_entries")
      .select("recurring_item_id, installment_plan_id, installment_number")
      .eq("household_id", householdId)
      .eq("competence_month", monthValue),
  ]);
  if (recurringResult.error || plansResult.error || existingResult.error) {
    throw new Error("Não foi possível carregar os cadastros deste mês.");
  }
  const recurring = recurringResult.data ?? [];
  const plans = plansResult.data ?? [];
  const existing = existingResult.data ?? [];

  const knownRecurrences = new Set(
    existing.map((entry) => entry.recurring_item_id).filter(Boolean),
  );
  const knownInstallments = new Set(
    existing
      .filter((entry) => entry.installment_plan_id)
      .map(
        (entry) => `${entry.installment_plan_id}:${entry.installment_number}`,
      ),
  );
  const entriesToCreate: Array<Record<string, unknown>> = [];

  for (const item of (recurring ?? []) as RecurringItem[]) {
    if (knownRecurrences.has(item.id)) continue;
    entriesToCreate.push({
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
      responsible_user_id: item.responsible_user_id,
      created_by: user.id,
    });
  }

  for (const plan of (plans ?? []) as InstallmentPlan[]) {
    const first = new Date(`${plan.first_month}T00:00:00`);
    const diff =
      (month.getFullYear() - first.getFullYear()) * 12 +
      (month.getMonth() - first.getMonth());
    const installmentNumber = diff + 1;
    if (installmentNumber < 1 || installmentNumber > plan.installment_count)
      continue;
    if (knownInstallments.has(`${plan.id}:${installmentNumber}`)) continue;
    entriesToCreate.push({
      household_id: householdId,
      title: `${plan.title} (${installmentNumber}/${plan.installment_count})`,
      entry_type: "expense",
      amount: installmentAmount(
        Number(plan.total_amount),
        plan.installment_count,
        installmentNumber,
      ),
      category: plan.category,
      competence_month: monthValue,
      due_date: dateForDay(month, plan.due_day),
      status: "planned",
      source_kind: "installment",
      installment_plan_id: plan.id,
      installment_number: installmentNumber,
      responsible_user_id: plan.responsible_user_id,
      created_by: user.id,
    });
  }

  if (entriesToCreate.length) {
    const { error } = await supabase
      .from("financial_entries")
      .insert(entriesToCreate);
    if (error && error.code !== "23505") {
      throw new Error("Falha ao gerar os lançamentos previstos do mês.");
    }
  }
}

export async function getHouseholdMembers(householdId: string) {
  const context = await getSignedInContext();
  if (!context || context.householdId !== householdId) return [];
  const { data } = await context.supabase
    .from("household_members")
    .select("user_id, member_role")
    .eq("household_id", householdId);
  return (data ?? []) as HouseholdMember[];
}

export async function getMonthEntries(householdId: string, month: Date) {
  await ensureMonthEntries(householdId, month);
  const context = await getSignedInContext();
  if (!context || context.householdId !== householdId) return [];
  const start = monthDate(month);
  const end = monthDate(addMonths(month, 1));
  const { data, error } = await context.supabase
    .from("financial_entries")
    .select(
      "id, household_id, title, entry_type, amount, category, competence_month, due_date, status, settled_at, source_kind, recurring_item_id, installment_plan_id, installment_number, responsible_user_id",
    )
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

export function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function moneyInputToNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return NaN;
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : NaN;
}

export function parseMonthInput(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) return null;
  const [year, month] = value.split("-").map(Number);
  if (month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, "0")}-01`;
}
