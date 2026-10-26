export function BalanceValueSkeleton() {
  return (
    <span
      aria-label="Carregando saldo"
      className="inline-block h-8 w-36 animate-pulse rounded bg-black/10 align-middle"
      role="status"
    />
  );
}

export function BalanceChangeSkeleton() {
  return (
    <span
      aria-label="Carregando comparação com o mês anterior"
      className="mb-1 inline-block h-5 w-14 animate-pulse rounded bg-black/10"
      role="status"
    />
  );
}
