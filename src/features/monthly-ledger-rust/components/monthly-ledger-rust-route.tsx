"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMonthData } from "@/features/transactions/hooks/use-month-data";
import type { FinancialEntry } from "@/features/transactions/lib/data";
import { useWorkspaceContext } from "@/shared/components/workspace-context";
import { useValuesVisibility } from "@/shared/components/financial-values";
import { formatMonth, monthString, parseMonth } from "@/shared/lib/date";
import "./monthly-ledger-rust.css";

type RustLedgerExports = {
  memory: WebAssembly.Memory;
  reset: () => void;
  set_month: (year: number, month: number) => void;
  set_hidden: (hidden: number) => void;
  alloc: (length: number) => number;
  push_entry: (
    titlePointer: number,
    titleLength: number,
    categoryPointer: number,
    categoryLength: number,
    amountCents: bigint,
    day: number,
    entryType: number,
    status: number,
  ) => void;
  render: () => number;
  render_loading: () => number;
  output_len: () => number;
};

export function MonthlyLedgerRustRoute() {
  const searchParams = useSearchParams();
  const month = useMemo(
    () => parseMonth(searchParams.get("month") ?? undefined),
    [searchParams],
  );
  const monthValue = monthString(month);
  const { spaceId, userId } = useWorkspaceContext();
  const { hidden } = useValuesVisibility();
  const { entries, ensureEntries } = useMonthData({
    spaceId,
    userId,
    month: monthValue,
  });
  const mountRef = useRef<HTMLDivElement>(null);
  const [failure, setFailure] = useState<"data" | "module" | null>(null);

  useEffect(() => {
    let disposed = false;
    async function renderLedger() {
      const host = mountRef.current;
      if (!host) return;

      if (ensureEntries.isError || entries.isError) {
        console.error(
          "Falha ao carregar lançamentos para a tela Rust/WASM:",
          ensureEntries.error ?? entries.error,
        );
        setFailure("data");
        return;
      }

      try {
        const response = await fetch("/wasm/monthly-ledger-rust.wasm");
        if (!response.ok) throw new Error("WebAssembly indisponível");
        const { instance } = await WebAssembly.instantiate(
          await response.arrayBuffer(),
        );
        if (disposed) return;

        const rust = instance.exports as unknown as RustLedgerExports;
        const encoder = new TextEncoder();
        rust.reset();
        rust.set_month(month.getFullYear(), month.getMonth() + 1);
        rust.set_hidden(hidden ? 1 : 0);

        if (!ensureEntries.isReady || entries.isPending || !entries.data) {
          const pointer = rust.render_loading();
          const length = rust.output_len();
          host.innerHTML = new TextDecoder().decode(
            new Uint8Array(rust.memory.buffer, pointer, length),
          );
          return;
        }

        for (const entry of entries.data) {
          pushEntry(rust, encoder, entry);
        }

        const pointer = rust.render();
        const length = rust.output_len();
        const html = new TextDecoder().decode(
          new Uint8Array(rust.memory.buffer, pointer, length),
        );
        if (disposed || !mountRef.current) return;
        mountRef.current.innerHTML = html;
        setFailure(null);
      } catch (error) {
        if (!disposed) {
          console.error(
            "Falha ao iniciar o módulo Rust/WASM da página:",
            error,
          );
          setFailure("module");
        }
      }
    }

    void renderLedger();
    return () => {
      disposed = true;
    };
  }, [
    entries.data,
    entries.isError,
    entries.isPending,
    entries.error,
    ensureEntries.isError,
    ensureEntries.isPending,
    ensureEntries.isReady,
    ensureEntries.error,
    hidden,
    month,
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      {failure ? (
        <p
          className="rounded-xl border border-rose-500/30 bg-graphite-800 p-5 text-sm text-rose-300"
          role="alert"
        >
          {failure === "data" ? (
            <>
              Não foi possível carregar os lançamentos do mês. Verifique sua
              conexão e tente novamente.
            </>
          ) : (
            <>
              Não foi possível iniciar o módulo Rust/WASM. Gere o arquivo com{" "}
              <code className="mx-1 rounded bg-graphite-700 px-1.5 py-0.5">
                npm run wasm:build
              </code>{" "}
              e atualize a página.
            </>
          )}
        </p>
      ) : (
        <div
          aria-busy={ensureEntries.isPending || entries.isPending}
          aria-label={`Lançamentos de ${formatMonth(month)}`}
          className="monthly-ledger-rust"
          ref={mountRef}
        />
      )}
    </div>
  );
}

function pushEntry(
  rust: RustLedgerExports,
  encoder: TextEncoder,
  entry: FinancialEntry,
) {
  const title = encoder.encode(entry.title);
  const category = encoder.encode(entry.category ?? "Sem categoria");
  const titlePointer = rust.alloc(title.length);
  const categoryPointer = rust.alloc(category.length);
  const memory = new Uint8Array(rust.memory.buffer);
  memory.set(title, titlePointer);
  memory.set(category, categoryPointer);
  const amountCents = BigInt(Math.round(Number(entry.amount) * 100));
  const day = entry.due_date ? Number(entry.due_date.slice(-2)) : 0;

  rust.push_entry(
    titlePointer,
    title.length,
    categoryPointer,
    category.length,
    amountCents,
    day,
    entry.entry_type === "income" ? 1 : 0,
    entry.status === "settled" ? 1 : 0,
  );
}
