"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  useDrawer,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  setCreditCardActive,
  saveCreditCard,
} from "@/features/credit-cards/actions";
import { CreditCardVisual } from "@/features/credit-cards/components/credit-card-visual";
import type { CreditCard } from "@/features/transactions/lib/data";
import { fetchCreditCards } from "@/features/transactions/lib/queries";
import { useWorkspaceContext } from "@/shared/components/workspace-context";
import { queryKeys } from "@/shared/lib/query-keys";
import { cn } from "@/shared/lib/utils";

export function CreditCardsScreen() {
  const { spaceId } = useWorkspaceContext();
  const queryClient = useQueryClient();
  const cardsQuery = useQuery({
    queryKey: queryKeys.creditCards(spaceId),
    queryFn: () => fetchCreditCards(spaceId),
  });
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [notice, setNotice] = useState("");
  const drawer = useDrawer({
    onCloseComplete: () => setEditingCard(null),
    onOpenChange: (open) => {
      if (!open) return;
      setNotice("");
    },
  });
  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await saveCreditCard(formData);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.creditCards(spaceId),
      });
      setNotice("saved");
      drawer.forceCloseDrawer();
    },
    onError: () => setNotice("save-error"),
  });
  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const result = await setCreditCardActive(id, active);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.creditCards(spaceId),
      });
    },
    onError: () => setNotice("toggle-error"),
  });
  const cards = cardsQuery.data ?? [];

  function openNewCard() {
    setEditingCard(null);
    setFormKey((key) => key + 1);
    drawer.openDrawer();
  }

  function openEditCard(card: CreditCard) {
    setEditingCard(card);
    setFormKey((key) => key + 1);
    drawer.openDrawer();
  }

  const messages: Record<string, string> = {
    saved: "Cartão salvo.",
    "save-error":
      "Não foi possível salvar o cartão. Confira os dados e tente novamente.",
    "toggle-error": "Não foi possível atualizar o cartão.",
  };

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-5">
      <header className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">
            Cartões de crédito
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted sm:text-[15px]">
            Identifique em qual cartão cada despesa ou parcela foi feita.
          </p>
        </div>
        <Button
          leadingIcon="PlusOutline"
          onClick={openNewCard}
          rounded
          variant="primary"
        >
          Novo cartão
        </Button>
      </header>

      {notice && (
        <p
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            notice === "saved"
              ? "border-mint-500/30 bg-graphite-800 text-mint-300"
              : "border-rose-500/30 bg-graphite-800 text-rose-400",
          )}
          role={notice === "saved" ? "status" : "alert"}
        >
          {messages[notice] ?? notice}
        </p>
      )}

      {cardsQuery.isError ? (
        <p
          className="rounded-xl border border-rose-500/30 bg-graphite-800 p-4 text-sm text-rose-400"
          role="alert"
        >
          Não foi possível carregar seus cartões.
        </p>
      ) : cardsQuery.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton className="aspect-[1.62/1] rounded-2xl" key={item} />
          ))}
        </div>
      ) : cards.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Card
              className={cn(
                "overflow-hidden p-4 sm:p-5",
                !card.is_active && "opacity-65",
              )}
              key={card.id}
            >
              <CreditCardVisual card={card} />
              <div className="mt-4 flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "text-xs font-medium",
                    card.is_active ? "text-mint-300" : "text-muted",
                  )}
                >
                  {card.is_active ? "Ativo" : "Inativo"}
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => openEditCard(card)}
                    size="sm"
                    variant="secondary"
                  >
                    Editar
                  </Button>
                  <Button
                    disabled={toggleMutation.isPending}
                    onClick={() =>
                      toggleMutation.mutate({
                        id: card.id,
                        active: !card.is_active,
                      })
                    }
                    size="sm"
                    variant={card.is_active ? "outline" : "primary-subtle"}
                  >
                    {card.is_active ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-graphite-800 px-5 text-center">
          <span className="mb-4 w-full max-w-[250px]">
            <CreditCardVisual
              card={{ bank_name: "Seu banco", last_four: "0000" }}
            />
          </span>
          <h2 className="font-semibold text-ink">Nenhum cartão cadastrado</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
            Cadastre somente o banco e os quatro últimos números para associar
            compras e parcelas.
          </p>
          <Button className="mt-4" onClick={openNewCard} variant="secondary">
            Cadastrar cartão
          </Button>
        </div>
      )}

      <Drawer {...drawer.props}>
        <DrawerContent>
          <DrawerHeader className="shrink-0 px-3 pb-3 pt-4 text-left">
            <DrawerTitle className="text-base">
              {editingCard ? "Editar cartão" : "Novo cartão"}
            </DrawerTitle>
            <DrawerDescription>
              Cadastre apenas o banco e os quatro últimos números. Não informe o
              número completo.
            </DrawerDescription>
          </DrawerHeader>
          <form
            key={formKey}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            onSubmit={(event) => {
              event.preventDefault();
              setNotice("");
              saveMutation.mutate(new FormData(event.currentTarget));
            }}
          >
            <DrawerBody className="flex flex-col gap-4 px-3 pb-5">
              {editingCard && (
                <input name="id" type="hidden" value={editingCard.id} />
              )}
              <Input
                autoComplete="organization"
                defaultValue={editingCard?.bank_name}
                label="Banco"
                maxLength={80}
                name="bank_name"
                placeholder="Ex.: Nubank"
                required
              />
              <Input
                autoComplete="off"
                defaultValue={editingCard?.last_four}
                inputMode="numeric"
                label="4 últimos números"
                maxLength={4}
                minLength={4}
                name="last_four"
                pattern="[0-9]{4}"
                placeholder="1234"
                required
              />
              {saveMutation.isError && (
                <p className="text-sm text-rose-400" role="alert">
                  {messages["save-error"]}
                </p>
              )}
            </DrawerBody>
            <DrawerFooter className="shrink-0 border-t border-line/30 px-3 pb-3 pt-4">
              <Button
                className="w-full"
                disabled={saveMutation.isPending}
                loading={saveMutation.isPending}
                type="submit"
                variant="primary"
              >
                {editingCard ? "Salvar alterações" : "Salvar cartão"}
              </Button>
              <Button
                className="w-full"
                disabled={saveMutation.isPending}
                onClick={drawer.closeDrawer}
                type="button"
                variant="secondary"
              >
                Cancelar
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
