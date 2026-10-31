"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BalanceCard } from "@/features/transactions/components/balance-card";

const INITIAL_BALANCE = 4820.75;
const PREVIOUS_BALANCE = 4390.2;

export default function BalanceCardPlaygroundPage() {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [valuesVisible, setValuesVisible] = useState(true);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-10 max-w-2xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-graphite-800 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-moon-300">
          <span className="size-1.5 rounded-full bg-mint-400" />
          Design system · playground
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
          Card de saldo
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
          Ambiente isolado para experimentar efeitos visuais e animações. Os
          valores são fictícios e não alteram os lançamentos.
        </p>
      </header>

      <section
        aria-label="Playground do card de saldo"
        className="grid max-w-xl gap-4"
      >
        <BalanceCard
          balance={balance}
          previousBalance={PREVIOUS_BALANCE}
          valuesHidden={!valuesVisible}
          onToggleValues={() => setValuesVisible((visible) => !visible)}
        />

        <div className="rounded-2xl border border-line bg-graphite-800/70 p-4">
          <h2 className="text-sm font-semibold text-ink">Simular saldo</h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            Altere o valor para visualizar a animação dos números e a comparação
            com o mês anterior.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={() => setBalance((value) => value + 250)}
              size="sm"
              variant="secondary"
            >
              + R$ 250
            </Button>
            <Button
              onClick={() => setBalance((value) => value - 180)}
              size="sm"
              variant="secondary"
            >
              − R$ 180
            </Button>
            <Button
              onClick={() => setBalance(-350.4)}
              size="sm"
              variant="secondary"
            >
              Saldo negativo
            </Button>
            <Button
              leadingIcon="HistoryOutline"
              onClick={() => setBalance(INITIAL_BALANCE)}
              size="sm"
              variant="ghost"
            >
              Restaurar
            </Button>
          </div>
        </div>
      </section>

      <footer className="mt-10 border-t border-line pt-5 text-[11px] text-muted">
        Rota interna de exploração · /design-system/balance-card
      </footer>
    </main>
  );
}
