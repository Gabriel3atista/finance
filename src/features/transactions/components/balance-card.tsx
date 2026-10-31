"use client";

import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/shared/components/animated-number";
import { BalanceChangeIndicator } from "@/shared/components/balance-change-indicator";
import {
  BalanceCardShader,
  type BalanceCardShaderConfig,
} from "@/features/transactions/components/balance-card-shader";

export function BalanceCard({
  balance,
  previousBalance,
  isBalancePending = false,
  isPreviousBalancePending = false,
  valuesHidden,
  onToggleValues,
  shaderConfig,
}: {
  balance: number;
  previousBalance?: number;
  isBalancePending?: boolean;
  isPreviousBalancePending?: boolean;
  valuesHidden: boolean;
  onToggleValues: () => void;
  shaderConfig?: BalanceCardShaderConfig;
}) {
  const isLoading = isBalancePending || isPreviousBalancePending;

  return (
    <article className="relative isolate flex h-48 max-h-48 min-h-48 flex-col justify-between overflow-hidden rounded-3xl bg-[url('/current-balance-card-background.png')] bg-cover bg-center px-6 pb-6 pt-3">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] border border-white/50 mix-blend-overlay"
      />
      <BalanceCardShader config={shaderConfig} />
      <div className="relative z-10 flex items-center justify-between gap-3">
        <p className="text-sm text-ink">Saldo previsto</p>
        <Button
          aria-label={valuesHidden ? "Mostrar valores" : "Ocultar valores"}
          aria-pressed={valuesHidden}
          className="size-8 min-h-8 rounded-full bg-transparent p-0 text-ink"
          icon={valuesHidden ? "EyeOutline" : "EyeOffOutline"}
          loading={isLoading}
          onClick={onToggleValues}
          size="icon-sm"
          type="button"
          variant="ghost"
        />
      </div>
      <div className="relative z-10 flex items-end justify-between gap-3">
        <p
          aria-busy={isBalancePending || undefined}
          className="text-3xl font-semibold tracking-tight text-white tabular-nums"
        >
          {valuesHidden ? (
            <span aria-label="Valor oculto">••••••••</span>
          ) : (
            <AnimatedNumber
              value={balance}
              locale="pt-BR"
              format={{ style: "currency", currency: "BRL" }}
            />
          )}
        </p>
        {previousBalance !== undefined || isPreviousBalancePending ? (
          <div className="mb-1">
            <BalanceChangeIndicator
              currentBalance={balance}
              previousBalance={previousBalance ?? 0}
              loading={isLoading}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
