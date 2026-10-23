"use client";

import { useState } from "react";
import { FinancialValue } from "@/shared/components/financial-values";
import { Eyebrow } from "@/shared/components/eyebrow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type HistoricalBatch,
  type HistoricalEntry,
} from "@/features/history/lib/data";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function HistoryList({
  batches,
  entries,
}: {
  batches: HistoricalBatch[];
  entries: HistoricalEntry[];
}) {
  const [year, setYear] = useState("all");
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
      <section className="surface p-5 sm:p-6">
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
            <label className="field-label sm:w-40">
              Filtrar por ano
              <Select onValueChange={setYear} value={year}>
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
            </label>
          )}
        </div>
      </section>

      {entries.length === 0 ? (
        <div className="surface px-5 py-8 text-center text-sm text-muted">
          Nenhum lançamento histórico foi encontrado.
        </div>
      ) : (
        <section
          className="surface overflow-hidden"
          aria-label="Lançamentos históricos"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-xs">
              <thead className="bg-secondary-800 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Competência</th>
                  <th className="px-4 py-3 font-medium">Lançamento</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
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
                      {entry.category && (
                        <span className="mt-0.5 block text-[10px] text-muted">
                          {entry.category}
                        </span>
                      )}
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
                        {currency.format(Number(entry.amount))}
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
        <details className="surface p-5 sm:p-6">
          <summary className="cursor-pointer text-sm font-semibold text-ink">
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
                  {new Date(batch.created_at).toLocaleDateString("pt-BR")}
                </time>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
