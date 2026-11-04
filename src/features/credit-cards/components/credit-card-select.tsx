"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCreditCards } from "@/features/transactions/lib/queries";
import { useWorkspaceContext } from "@/shared/components/workspace-context";
import { queryKeys } from "@/shared/lib/query-keys";
import type { CreditCard } from "@/features/transactions/lib/data";

export function creditCardLabel(
  card: Pick<CreditCard, "bank_name" | "last_four">,
) {
  return `${card.bank_name} ···· ${card.last_four}`;
}

export function CreditCardSelect({
  value,
  onValueChange,
  name,
  label = "Cartão de crédito (opcional)",
  error,
}: {
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
  label?: string;
  error?: string;
}) {
  const { spaceId } = useWorkspaceContext();
  const cardsQuery = useQuery({
    queryKey: queryKeys.creditCards(spaceId),
    queryFn: () => fetchCreditCards(spaceId),
  });
  const cards = cardsQuery.data ?? [];
  const visibleCards = cards.filter(
    (card) => card.is_active || card.id === value,
  );

  return (
    <Select
      label={label}
      name={name}
      onValueChange={(nextValue) =>
        onValueChange(nextValue === "__no_card__" ? "" : nextValue)
      }
      value={value || "__no_card__"}
      variant="secondary"
      error={error}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecione um cartão" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__no_card__">Sem cartão</SelectItem>
        {visibleCards.map((card) => (
          <SelectItem key={card.id} value={card.id}>
            {creditCardLabel(card)}
            {card.is_active ? "" : " (inativo)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
