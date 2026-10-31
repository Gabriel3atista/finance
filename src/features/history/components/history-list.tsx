"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FinancialValue } from "@/shared/components/financial-values";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeFinancialCategory } from "@/features/transactions/lib/categories";
import { Eyebrow } from "@/shared/components/eyebrow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getHistoricalData } from "@/features/history/lib/data";
import { queryKeys } from "@/shared/lib/query-keys";
import { formatCurrency } from "@/shared/lib/currency";
import { formatDate } from "@/shared/lib/date";

export function HistoryList({ spaceId }: { spaceId: string }) {
  const historyQuery = useQuery({
    queryKey: queryKeys.history(spaceId),
    queryFn: () => getHistoricalData(spaceId),
  });
  const [year, setYear] = useState("all");
  const batches = historyQuery.data?.batches ?? [];
  const entries = historyQuery.data?.entries ?? [];
  if (historyQuery.isPending) {
    return (
      <Skeleton
        className="rounded-[18px] border border-line bg-graphite-900 shadow-card min-h-64 p-6"
        aria-live="polite"
        aria-busy="true"
      >
        Carregando histórico…
      </Skeleton>
    );
  }
  if (historyQuery.isError) {
    return (
      <div
        className="rounded-[18px] border border-line bg-graphite-900 shadow-card p-6 text-sm text-rose-200"
        role="alert"
      >
        Não foi possível carregar o histórico financeiro. Tente novamente.
      </div>
    );
  }
  const years = Array.from(
    new Set(entries.map((entry) => entry.competence_month.slice(0, 4))),
  )
    .sort()
    .reverse();
  const filteredEntries =
    year === "all"
      ? entries
      : entries.filter((entry) =>
          entry.competence_month.startsWith(`${year}-`),
        );
  const fileNames = new Map(
    batches.map((batch) => [batch.id, batch.source_file_name]),
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[18px] border border-line bg-graphite-900 shadow-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Histórico preservado</Eyebrow>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
              Lançamentos desde 2024
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              Os lançamentos importados e sua origem permanecem registrados. O
              app não aceita novos uploads de planilhas.
            </p>
          </div>
          {years.length > 0 && (
            <Select
              label="Filtrar por ano"
              containerClassName="sm:w-40"
              onValueChange={setYear}
              value={year}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {years.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </section>

      {entries.length === 0 ? (
        <div className="rounded-[18px] border border-line bg-graphite-900 shadow-card px-5 py-8 text-center text-sm text-muted">
          Nenhum lançamento histórico foi encontrado.
        </div>
      ) : (
        <section
          className="rounded-[18px] border border-line bg-graphite-900 shadow-card overflow-hidden"
          aria-label="Lançamentos históricos"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-xs">
              <thead className="bg-graphite-800 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Competência</th>
                  <th className="px-4 py-3 font-medium">Lançamento</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {entry.competence_month.slice(0, 7)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block font-medium text-ink">
                        {entry.title}
                      </span>
                      <Badge
                        className="mt-1 w-fit"
                        size="sm"
                        variant="secondary"
                      >
                        {normalizeFinancialCategory(
                          entry.category,
                          entry.entry_type,
                        )}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {entry.entry_type === "income" ? "Receita" : "Despesa"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {entry.status === "settled"
                        ? "Realizado"
                        : entry.status === "planned"
                          ? "Previsto"
                          : "Cancelado"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-ink">
                      <FinancialValue>
                        {formatCurrency(Number(entry.amount))}
                      </FinancialValue>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted">
                      <span className="block">
                        {fileNames.get(entry.import_batch_id) ??
                          "Arquivo histórico"}
                      </span>
                      <span>
                        {entry.source_sheet}!{entry.source_cell} (linha{" "}
                        {entry.source_row})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-4 py-3 text-[10px] text-muted">
            Exibindo {filteredEntries.length} de {entries.length} lançamento(s)
            {year !== "all" ? ` de ${year}` : ""}.
            {entries.length >= 1000
              ? " O limite desta lista foi atingido; use o filtro anual para consultar um período."
              : ""}
          </p>
        </section>
      )}

      {batches.length > 0 && (
        <details className="rounded-[18px] border border-line bg-graphite-900 shadow-card p-5 sm:p-6">
          <summary className="[&::-webkit-details-marker]:hidden cursor-pointer text-sm font-semibold text-ink">
            Fontes preservadas ({batches.length})
          </summary>
          <ul className="mt-4 divide-y divide-line">
            {batches.map((batch) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                key={batch.id}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">
                    {batch.source_file_name}
                  </span>
                  <span className="mt-1 block text-[10px] text-muted">
                    SHA-256 {batch.source_file_sha256.slice(0, 16)}…
                  </span>
                </span>
                <time
                  className="text-xs text-muted"
                  dateTime={batch.created_at}
                >
                  {formatDate(batch.created_at)}
                </time>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
