"use client";

import { createClient } from "@/features/auth/lib/supabase/client";

export type HistoricalBatch = {
  id: string;
  source_file_name: string;
  source_file_sha256: string;
  status: "preview" | "committed" | "cancelled";
  created_at: string;
};

export type HistoricalEntry = {
  id: string;
  title: string;
  entry_type: "income" | "expense";
  amount: number;
  category: string | null;
  competence_month: string;
  due_date: string | null;
  status: "planned" | "settled" | "cancelled";
  settled_at: string | null;
  import_batch_id: string;
  source_sheet: string;
  source_row: number;
  source_cell: string;
};

export async function getHistoricalData(householdId: string) {
  const supabase = createClient();

  const [batchesResult, entriesResult] = await Promise.all([
    supabase
      .from("import_batches")
      .select("id, source_file_name, source_file_sha256, status, created_at")
      .eq("household_id", householdId)
      .eq("status", "committed")
      .order("created_at", { ascending: false }),
    supabase
      .from("financial_entries")
      .select(
        "id, title, entry_type, amount, category, competence_month, due_date, status, settled_at, import_batch_id, source_sheet, source_row, source_cell",
      )
      .eq("household_id", householdId)
      .eq("source_kind", "historical_import")
      .order("competence_month", { ascending: false })
      .order("source_sheet", { ascending: true })
      .order("source_row", { ascending: true })
      .limit(1000),
  ]);

  if (batchesResult.error || entriesResult.error) {
    throw new Error("Não foi possível carregar o histórico financeiro.");
  }

  return {
    batches: (batchesResult.data ?? []) as HistoricalBatch[],
    entries: (entriesResult.data ?? []) as HistoricalEntry[],
  };
}
