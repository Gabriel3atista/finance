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
};

