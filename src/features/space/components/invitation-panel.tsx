"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/features/auth/lib/supabase/client";
import { fetchSpacePage } from "@/features/space/lib/queries";
import { invitationEmailSchema } from "@/features/space/lib/form-schemas";
import { queryKeys } from "@/shared/lib/query-keys";

export function InvitationPanel({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const queryClient = useQueryClient();
  const spaceQuery = useQuery({
    queryKey: queryKeys.space(userId),
    queryFn: () => fetchSpacePage(userId, email),
  });
  const [inviteState, setInviteState] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteError, setInviteError] = useState("");
  const inviteForm = useForm<{ email: string }>({
    resolver: zodResolver(invitationEmailSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "" },
  });
  const space = spaceQuery.data?.space ?? null;
  const invitationMutation = useMutation({
    mutationFn: async (targetEmail: string) => {
      const { data, error } = await createClient().functions.invoke(
        "household-invite",
        {
          body: {
            spaceId: space?.id,
            householdId: space?.id,
            email: targetEmail,
          },
        },
      );
      if (error) {
        const context = (error as { context?: Response }).context;
        const payload = (await context
          ?.clone()
          .json()
          .catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? error.message);
      }
      if (typeof data?.invitationUrl !== "string") {
        throw new Error("invitation-link-unavailable");
      }
      return data.invitationUrl as string;
    },
    onSuccess: async (url) => {
      inviteForm.reset();
      setInviteUrl(url);
      setInviteState(
        "Link criado. Compartilhe com a pessoa convidada; ele expira em sete dias.",
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.space(userId),
      });
    },
    onError: (caught) => {
      const message = caught instanceof Error ? caught.message : "";
      setInviteError(
        message.includes("already exists")
          ? "Já existe um convite ativo para esse e-mail."
          : "Não foi possível gerar o convite. Confira o e-mail e tente novamente.",
      );
    },
  });

  if (spaceQuery.isPending) {
    return (
      <Card className="flex flex-col gap-3 p-5 sm:p-6" aria-busy="true">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-11 w-full" />
      </Card>
    );
  }

  if (spaceQuery.isError) {
    return (
      <Card role="alert" className="flex flex-col items-start gap-3 p-5 sm:p-6">
        <p className="text-sm text-rose-500">
          Não foi possível carregar as informações do espaço.
        </p>
        <Button
          onClick={() => void spaceQuery.refetch()}
          type="button"
          variant="secondary"
        >
          Tentar novamente
        </Button>
      </Card>
    );
  }

  if (!space || space.member_role !== "owner") {
    return (
      <Card sections className="overflow-hidden">
        <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
          <p className="text-sm leading-6 text-muted">
            Apenas a pessoa proprietária do espaço pode enviar convites.
          </p>
          <Button asChild className="self-start" variant="secondary">
            <Link href="/space">Voltar ao espaço</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sections className="mx-auto max-w-[640px] overflow-hidden">
      <CardHeader className="flex flex-col gap-3 bg-graphite-600 p-5 sm:p-6">
        <CardTitle className="text-xl tracking-tight">
          Compartilhe {space.name}
        </CardTitle>
        <CardDescription className="leading-6">
          O convite dá acesso às finanças deste espaço e expira em sete dias.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
        <form
          onSubmit={inviteForm.handleSubmit(({ email: targetEmail }) => {
            setInviteError("");
            setInviteState("");
            setInviteUrl("");
            invitationMutation.mutate(targetEmail.trim().toLowerCase());
          })}
          className="flex flex-col gap-3"
          noValidate
        >
          <Input
            label="E-mail da pessoa convidada"
            containerClassName="gap-2"
            className="min-h-11 px-3.5 focus:border-accent mobile-app:focus:!border-line"
            autoComplete="email"
            type="email"
            placeholder="nome@exemplo.com"
            error={inviteForm.formState.errors.email?.message}
            {...inviteForm.register("email")}
          />
          {inviteError && (
            <p role="alert" className="text-sm text-rose-500">
              {inviteError}
            </p>
          )}
          {inviteState && (
            <p
              role="status"
              className="rounded-xl bg-accent-soft px-3.5 py-3 text-sm text-accent"
            >
              {inviteState}
            </p>
          )}
          {inviteUrl && (
            <div className="flex flex-col gap-3 rounded-xl border border-line/50 bg-graphite-800 p-4">
              <label
                htmlFor="invitation-link"
                className="text-sm font-medium text-ink"
              >
                Link do convite
              </label>
              <Input
                id="invitation-link"
                readOnly
                value={inviteUrl}
                className="min-h-11 px-3.5"
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button
                className="self-start"
                type="button"
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteUrl);
                  setInviteState(
                    "Link copiado. Compartilhe com a pessoa convidada; ele expira em sete dias.",
                  );
                }}
              >
                Copiar link
              </Button>
            </div>
          )}
          <Button
            className="w-full sm:w-auto sm:self-start"
            disabled={invitationMutation.isPending}
            type="submit"
          >
            {invitationMutation.isPending
              ? "Gerando link…"
              : "Gerar link de convite"}
          </Button>
        </form>
        <Button asChild className="self-start" variant="ghost">
          <Link href="/space">Voltar ao espaço</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
