export type FinancialEntry = {
  id: string;
  space_id: string;
  title: string;
  entry_type: "income" | "expense";
  amount: number;
  category: string | null;
  competence_month: string;
  due_date: string | null;
  status: "planned" | "settled" | "cancelled";
  settled_at: string | null;
  source_kind: "manual" | "recurrence" | "installment" | "card_statement";
  recurring_item_id: string | null;
  installment_plan_id: string | null;
  installment_number: number | null;
  credit_card_id: string | null;
};

export type CreditCard = {
  id: string;
  space_id: string;
  bank_name: string;
  last_four: string;
  is_active: boolean;
};

export type RecurringItem = {
  id: string;
  space_id: string;
  title: string;
  entry_type: "income" | "expense";
  planned_amount: number;
  category: string | null;
  due_day: number | null;
  starts_on: string;
  ends_on: string | null;
  is_active: boolean;
  credit_card_id: string | null;
};

export type InstallmentPlan = {
  id: string;
  space_id: string;
  title: string;
  total_amount: number;
  installment_count: number;
  starts_on: string;
  ends_on: string;
  due_day: number | null;
  category: string | null;
  is_active: boolean;
  credit_card_id: string | null;
};
