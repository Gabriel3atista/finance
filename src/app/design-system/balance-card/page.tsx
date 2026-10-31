"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BalanceCardShader } from "@/app/design-system/balance-card/balance-card-shader";
import { AnimatedNumber } from "@/shared/components/animated-number";
import { BalanceChangeIndicator } from "@/shared/components/balance-change-indicator";

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
        <article className="relative isolate flex h-48 max-h-48 min-h-48 flex-col justify-between overflow-hidden rounded-3xl bg-[url('/current-balance-card-background.png')] bg-cover bg-center px-6 pb-6 pt-3">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] border border-white/50 mix-blend-overlay"
          />
          <BalanceCardShader />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <p className="text-sm text-ink">Saldo previsto</p>
            <Button
              aria-label={valuesVisible ? "Ocultar valores" : "Mostrar valores"}
              aria-pressed={!valuesVisible}
              className="size-8 min-h-8 rounded-full bg-transparent p-0 text-ink"
              icon={valuesVisible ? "EyeOutline" : "EyeOffOutline"}
              onClick={() => setValuesVisible((visible) => !visible)}
              size="icon-sm"
              type="button"
              variant="ghost"
            />
          </div>
          <div className="relative z-10 flex items-end justify-between gap-3">
            <p className="text-3xl font-semibold tracking-tight text-white tabular-nums">
              {valuesVisible ? (
                <AnimatedNumber
                  value={balance}
                  locale="pt-BR"
                  format={{ style: "currency", currency: "BRL" }}
                />
              ) : (
                <span aria-label="Valor oculto">••••••••</span>
              )}
            </p>
            <div className="mb-1">
              <BalanceChangeIndicator
                currentBalance={balance}
                previousBalance={PREVIOUS_BALANCE}
              />
            </div>
          </div>
        </article>

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
