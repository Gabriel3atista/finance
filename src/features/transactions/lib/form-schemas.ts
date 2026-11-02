import { z } from "zod";
import { parseCurrencyInput } from "@/shared/lib/currency";
import { isValidDateString } from "@/shared/lib/date";
import {
  getSeriesTypeOption,
  isCategoryAllowedForEntryType,
} from "@/features/transactions/lib/categories";

export const entryFormSchema = z
  .object({
    id: z.string().optional(),
    title: z
      .string()
      .trim()
      .min(1, "Informe uma descrição.")
      .max(160, "Use até 160 caracteres."),
    amount: z.string().refine((value) => {
      const amount = parseCurrencyInput(value);
      return Number.isFinite(amount) && amount > 0;
    }, "Informe um valor maior que zero."),
    entry_type: z.enum(["income", "expense"]),
    category: z
      .string()
      .refine(
        (value) =>
          isCategoryAllowedForEntryType(value, "income") ||
          isCategoryAllowedForEntryType(value, "expense"),
        "Selecione uma categoria válida.",
      ),
    due_date: z
      .string()
      .refine(
        (value) => value === "" || isValidDateString(value),
        "Informe uma data válida.",
      ),
    competence_month: z
      .string()
      .regex(/^\d{4}-\d{2}-01$/, "Informe uma competência válida."),
    scope: z.enum(["single", "future"]).optional(),
  })
  .superRefine((values, context) => {
    if (!isCategoryAllowedForEntryType(values.category, values.entry_type)) {
      context.addIssue({
        code: "custom",
        path: ["category"],
        message: "Escolha uma categoria compatível com o tipo do lançamento.",
      });
    }
  });
export type EntryFormValues = z.infer<typeof entryFormSchema>;

const positiveAmount = (value: string) => {
  const amount = parseCurrencyInput(value);
  return Number.isFinite(amount) && amount > 0;
};

export const seriesFormSchema = z
  .object({
    id: z.string().optional(),
    kind: z.enum(["recurrence", "installment"]).optional(),
    series_type: z
      .string()
      .refine(
        (value) => getSeriesTypeOption(value) !== null,
        "Selecione uma categoria.",
      ),
    title: z
      .string()
      .trim()
      .min(1, "Informe uma descrição.")
      .max(160, "Use até 160 caracteres."),
    amount: z.string().optional(),
    installment_amount: z.string().optional(),
    installment_count: z.string(),
    has_installments: z.enum(["true", "false"]),
    indefinite: z.enum(["true", "false"]),
    starts_on: z.string(),
    ends_on: z.string(),
    due_day: z.string(),
  })
  .superRefine((values, context) => {
    const seriesType = getSeriesTypeOption(values.series_type);
    const isInstallment = values.has_installments === "true";
    const indefinite = values.indefinite === "true";

    if (!isValidDateString(values.starts_on)) {
      context.addIssue({
        code: "custom",
        path: ["starts_on"],
        message: "Informe uma data de início válida.",
      });
    }

    if (values.due_day !== "") {
      const dueDay = Number(values.due_day);
      if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
        context.addIssue({
          code: "custom",
          path: ["due_day"],
          message: "Use um dia entre 1 e 31.",
        });
      }
    }

    if (isInstallment) {
      const count = Number(values.installment_count);
      if (!positiveAmount(values.installment_amount ?? "")) {
        context.addIssue({
          code: "custom",
          path: ["installment_amount"],
          message: "Informe um valor por parcela maior que zero.",
        });
      }
      if (!Number.isInteger(count) || count < 1 || count > 600) {
        context.addIssue({
          code: "custom",
          path: ["installment_count"],
          message: "Informe entre 1 e 600 parcelas.",
        });
      }
      if (seriesType?.entryType !== "expense") {
        context.addIssue({
          code: "custom",
          path: ["series_type"],
          message: "Parcelamentos só podem ser despesas.",
        });
      }
      if (
        isValidDateString(values.starts_on) &&
        isValidDateString(values.ends_on) &&
        Number.isInteger(count) &&
        count > 0
      ) {
        const start = new Date(`${values.starts_on}T00:00:00`);
        const end = new Date(`${values.ends_on}T00:00:00`);
        const monthCount =
          (end.getFullYear() - start.getFullYear()) * 12 +
          end.getMonth() -
          start.getMonth() +
          1;
        if (monthCount !== count) {
          context.addIssue({
            code: "custom",
            path: ["ends_on"],
            message: "A data final deve corresponder à quantidade de parcelas.",
          });
        }
      } else if (!isValidDateString(values.ends_on)) {
        context.addIssue({
          code: "custom",
          path: ["ends_on"],
          message: "Informe a data da última parcela.",
        });
      }
      return;
    }

    if (!positiveAmount(values.amount ?? "")) {
      context.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Informe um valor mensal maior que zero.",
      });
    }
    if (!indefinite) {
      if (!isValidDateString(values.ends_on)) {
        context.addIssue({
          code: "custom",
          path: ["ends_on"],
          message: "Informe uma data final válida.",
        });
      } else if (
        isValidDateString(values.starts_on) &&
        values.ends_on < values.starts_on
      ) {
        context.addIssue({
          code: "custom",
          path: ["ends_on"],
          message: "A data final deve ser igual ou posterior ao início.",
        });
      }
    }
  });
export type SeriesFormValues = z.infer<typeof seriesFormSchema>;
