import type {
  CreditCard,
  InstallmentPlan,
  RecurringItem,
} from "@/features/transactions/lib/data";

type RecordsFixture = {
  recurring: RecurringItem[];
  plans: InstallmentPlan[];
  cards: CreditCard[];
};

const spaceId = "00000000-0000-4000-8000-000000000001";
const cardId = "00000000-0000-4000-8000-000000000002";
const maxTitle =
  "Plano odontológico familiar com cobertura nacional e atendimento de urgência para consultas, exames, tratamentos preventivos e emergências sem carência nos fins de semana".slice(
    0,
    160,
  );

const cards: CreditCard[] = [
  {
    id: cardId,
    space_id: spaceId,
    bank_name: "Banco Digital Brasileiro de Pagamentos e Serviços Financeiros",
    last_four: "4719",
    is_active: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    space_id: spaceId,
    bank_name: "Nubank",
    last_four: "0001",
    is_active: false,
  },
];

function uuid(index: number) {
  return `00000000-0000-4000-8001-${String(index).padStart(12, "0")}`;
}

function recurringItem(
  index: number,
  overrides: Partial<RecurringItem> = {},
): RecurringItem {
  return {
    id: uuid(index),
    space_id: spaceId,
    title: `Programação mensal ${index}`,
    entry_type: index % 2 === 0 ? "income" : "expense",
    planned_amount: 89.9,
    category: index % 2 === 0 ? "Salário" : "Assinatura",
    due_day: 5,
    starts_on: "2026-11-01",
    ends_on: null,
    is_active: true,
    credit_card_id: null,
    ...overrides,
  };
}

function installmentPlan(
  index: number,
  overrides: Partial<InstallmentPlan> = {},
): InstallmentPlan {
  return {
    id: uuid(index + 2000),
    space_id: spaceId,
    title: `Compra parcelada ${index}`,
    total_amount: 1199.9,
    installment_count: 10,
    starts_on: "2026-11-01",
    ends_on: "2027-08-01",
    due_day: 12,
    category: "Casa",
    is_active: true,
    credit_card_id: null,
    ...overrides,
  };
}

const worst: RecordsFixture = {
  cards,
  recurring: [
    recurringItem(1, {
      title: maxTitle,
      planned_amount: 999999999999.99,
      due_day: 31,
      credit_card_id: cardId,
      starts_on: "1970-01-01",
      ends_on: null,
    }),
    recurringItem(2, {
      title: "J",
      entry_type: "income",
      planned_amount: 0.01,
      category: null,
      due_day: null,
      starts_on: "2026-11-14",
      ends_on: "2026-11-14",
      is_active: false,
    }),
    recurringItem(3, {
      title: "東京の歯科医療サービス — Saúde bucal 😀",
      category: "Assinatura",
      credit_card_id: "00000000-0000-4000-8000-000000000003",
    }),
    recurringItem(4, { title: "<b>Serviço & manutenção</b>" }),
  ],
  plans: [
    installmentPlan(1, {
      title: "Móveis planejados para cozinha, sala e área de serviço",
      total_amount: 999999999999.99,
      installment_count: 600,
      starts_on: "1970-01-01",
      ends_on: "2019-12-01",
      due_day: 31,
      credit_card_id: cardId,
    }),
    installmentPlan(2, {
      title: "Ó",
      total_amount: 0.01,
      installment_count: 1,
      starts_on: "2026-11-14",
      ends_on: "2026-11-14",
      due_day: null,
      category: null,
      is_active: false,
    }),
  ],
};

export const recordsFixtures = {
  worst,
  empty: { recurring: [], plans: [], cards: [] },
  one: {
    recurring: [recurringItem(1, { title: "J", planned_amount: 0.01 })],
    plans: [],
    cards: [],
  },
  many: {
    cards,
    recurring: Array.from({ length: 642 }, (_, index) =>
      recurringItem(index + 1),
    ),
    plans: Array.from({ length: 642 }, (_, index) =>
      installmentPlan(index + 1),
    ),
  },
} satisfies Record<string, RecordsFixture>;
