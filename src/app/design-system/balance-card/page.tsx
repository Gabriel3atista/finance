"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { BalanceCard } from "@/features/transactions/components/balance-card";
import {
  DEFAULT_BALANCE_CARD_SHADER_CONFIG,
  type BalanceCardShaderConfig,
  type BalanceCardShaderShape,
} from "@/features/transactions/components/balance-card-shader";

const INITIAL_BALANCE = 4820.75;
const PREVIOUS_BALANCE = 4390.2;

const routes = [
  { href: "/dashboard", label: "Painel", icon: "DashboardOutline" },
  { href: "/mes", label: "Meu mês", icon: "CalendarOutline" },
  { href: "/historico", label: "Histórico", icon: "HistoryOutline" },
  { href: "/cadastros", label: "Cadastros", icon: "RecordsOutline" },
  {
    href: "/design-system/balance-card",
    label: "Playground do saldo",
    icon: "DashboardOutline",
  },
  {
    href: "/design-system/buttons",
    label: "Playground de botões",
    icon: "DashboardOutline",
  },
] as const;

type SliderControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
};

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: SliderControlProps) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-ink">{label}</span>
        <output className="shrink-0 text-xs tabular-nums text-muted">
          {format(value)}
        </output>
      </div>
      <Slider
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([nextValue]) => {
          if (nextValue !== undefined) onChange(nextValue);
        }}
      />
    </div>
  );
}

function formatMultiplier(value: number) {
  return value.toFixed(2) + "×";
}

export default function BalanceCardPlaygroundPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [valuesVisible, setValuesVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [shaderConfig, setShaderConfig] = useState<BalanceCardShaderConfig>(
    DEFAULT_BALANCE_CARD_SHADER_CONFIG,
  );

  function updateConfig<Key extends keyof BalanceCardShaderConfig>(
    key: Key,
    value: BalanceCardShaderConfig[Key],
  ) {
    setShaderConfig((current) => ({ ...current, [key]: value }));
    setCopied(false);
    setCopyError(false);
  }

  async function copyConfig() {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(shaderConfig, null, 2),
      );
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-7xl px-4 pb-6 pt-0 sm:px-8 sm:pb-10">
      <div className="sticky top-0 z-40 -mx-4 mb-6 flex min-h-[var(--app-header-height)] items-center justify-between gap-4 border-b border-line bg-graphite-900/95 px-4 pb-2 pt-[env(safe-area-inset-top)] sm:-mx-8 sm:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-graphite-800 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-moon-300">
          <span className="size-1.5 rounded-full bg-mint-400" />
          Design system · playground
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Navegar pelas rotas"
              trailingIcon="ChevronDownOutline"
              variant="outline"
              size="sm"
            >
              Rotas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuLabel>Navegar para</DropdownMenuLabel>
            {routes.map((route, index) => (
              <div key={route.href}>
                {index === 4 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  leadingIcon={route.icon}
                  onSelect={() => router.push(route.href)}
                >
                  {route.label}
                </DropdownMenuItem>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
          Card de saldo
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
          Modele a refração ao vivo. Ajustes feitos aqui ficam no playground até
          você copiá-los para a configuração do card.
        </p>
      </header>

      <div className="flex flex-col items-stretch gap-5 xl:grid xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="sticky top-[var(--app-sticky-content-top)] z-30 w-full self-start overflow-hidden border-line bg-graphite-900">
          <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 p-5 sm:px-6">
            <div>
              <CardTitle>Prévia ao vivo</CardTitle>
              <CardDescription className="mt-1">
                A renderização usa os mesmos parâmetros do card real.
              </CardDescription>
            </div>
            <Button
              leadingIcon={copied ? "CheckOutline" : "CopyOutline"}
              onClick={copyConfig}
              size="sm"
              variant={copied ? "secondary" : "outline"}
            >
              {copied ? "Copiado" : "Copiar valores"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-5 sm:p-6">
            <BalanceCard
              balance={balance}
              previousBalance={PREVIOUS_BALANCE}
              valuesHidden={!valuesVisible}
              onToggleValues={() => setValuesVisible((visible) => !visible)}
              shaderConfig={shaderConfig}
            />
            <p
              aria-live="polite"
              className="min-h-5 text-xs text-muted"
              role="status"
            >
              {copied
                ? "Configuração JSON copiada para a área de transferência."
                : copyError
                  ? "Não foi possível copiar. Use o playground em uma conexão segura."
                  : "Copie o objeto e passe-o à prop shaderConfig do BalanceCard."}
            </p>
          </CardContent>
        </Card>

        <Card className="w-full overflow-hidden">
          <CardHeader className="border-b border-line/70 px-5 py-4 sm:px-6">
            <CardTitle>Configuração do shader</CardTitle>
            <CardDescription className="mt-1">
              Os valores mudam o efeito em tempo real.
            </CardDescription>
          </CardHeader>

          <section className="space-y-4 border-b border-line/70 p-5 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                Forma e movimento
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                Escolha a geometria da lente e o ritmo das ondas.
              </p>
            </div>
            <Select
              label="Geometria da refração"
              value={shaderConfig.shape}
              onValueChange={(shape) =>
                updateConfig("shape", shape as BalanceCardShaderShape)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma forma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wave">Onda direcional</SelectItem>
                <SelectItem value="ripple">Ondulação circular</SelectItem>
                <SelectItem value="diamond">Diamante facetado</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <SliderControl
                label="Rotação"
                value={shaderConfig.rotation}
                min={-180}
                max={180}
                step={1}
                format={(value) => value + "°"}
                onChange={(value) => updateConfig("rotation", value)}
              />
              <SliderControl
                label="Velocidade"
                value={shaderConfig.speed}
                min={0.2}
                max={2.5}
                step={0.05}
                format={formatMultiplier}
                onChange={(value) => updateConfig("speed", value)}
              />
              <SliderControl
                label="Frequência das ondas"
                value={shaderConfig.frequency}
                min={2}
                max={16}
                step={0.1}
                format={(value) => value.toFixed(1)}
                onChange={(value) => updateConfig("frequency", value)}
              />
              <SliderControl
                label="Espessura da lente"
                value={shaderConfig.thickness}
                min={1.5}
                max={12}
                step={0.1}
                format={(value) => value.toFixed(1)}
                onChange={(value) => updateConfig("thickness", value)}
              />
            </div>
          </section>

          <section className="space-y-4 border-b border-line/70 p-5 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                Posição e refração
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                Desloque o efeito no cartão e controle a força da lente.
              </p>
            </div>
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <SliderControl
                label="Posição horizontal"
                value={shaderConfig.offsetX}
                min={-180}
                max={180}
                step={1}
                format={(value) => (value > 0 ? "+" : "") + value + " px"}
                onChange={(value) => updateConfig("offsetX", value)}
              />
              <SliderControl
                label="Posição vertical"
                value={shaderConfig.offsetY}
                min={-90}
                max={90}
                step={1}
                format={(value) => (value > 0 ? "+" : "") + value + " px"}
                onChange={(value) => updateConfig("offsetY", value)}
              />
              <SliderControl
                label="Intensidade"
                value={shaderConfig.intensity}
                min={0}
                max={0.2}
                step={0.001}
                format={(value) => value.toFixed(3)}
                onChange={(value) => updateConfig("intensity", value)}
              />
              <SliderControl
                label="Refração"
                value={shaderConfig.refraction}
                min={0}
                max={2}
                step={0.01}
                format={formatMultiplier}
                onChange={(value) => updateConfig("refraction", value)}
              />
            </div>
          </section>

          <section className="space-y-4 p-5 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-ink">Luz e cor</h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                Afine a separação cromática e os reflexos capturados do fundo.
              </p>
            </div>
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <SliderControl
                label="Dispersão cromática"
                value={shaderConfig.dispersion}
                min={0}
                max={0.4}
                step={0.005}
                format={formatMultiplier}
                onChange={(value) => updateConfig("dispersion", value)}
              />
              <SliderControl
                label="Resposta à luz"
                value={shaderConfig.lightResponse}
                min={0}
                max={2}
                step={0.05}
                format={formatMultiplier}
                onChange={(value) => updateConfig("lightResponse", value)}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4">
              <p className="text-xs text-muted">
                Configuração tipada em{" "}
                <code className="text-ink">BalanceCardShaderConfig</code>
              </p>
              <Button
                leadingIcon="HistoryOutline"
                onClick={() => {
                  setShaderConfig(DEFAULT_BALANCE_CARD_SHADER_CONFIG);
                  setCopied(false);
                  setCopyError(false);
                }}
                size="sm"
                variant="ghost"
              >
                Restaurar padrão
              </Button>
            </div>
          </section>
        </Card>

        <Card className="w-full xl:col-start-1">
          <CardHeader>
            <CardTitle>Simular saldo</CardTitle>
            <CardDescription className="mt-1">
              Dados fictícios para visualizar o card sem alterar lançamentos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0">
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
          </CardContent>
        </Card>
      </div>

      <footer className="mt-8 border-t border-line pt-5 text-[11px] text-muted">
        Rota interna de exploração · /design-system/balance-card
      </footer>
    </main>
  );
}
