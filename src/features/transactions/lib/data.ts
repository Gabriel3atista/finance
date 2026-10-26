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
