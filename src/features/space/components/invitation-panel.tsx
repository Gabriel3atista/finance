"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NextIcon } from "@/components/atoms/next-icon";
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
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [copied, setCopied] = useState(false);
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
      setCopied(false);
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
      <div
        className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-3 pt-8"
        aria-busy="true"
      >
        <Skeleton className="mx-auto h-8 w-2/3" />
        <Skeleton className="mx-auto h-4 w-4/5" />
        <Skeleton className="my-auto h-56 w-full max-w-[420px] self-center" />
        <Skeleton className="mt-auto h-11 w-full" />
      </div>
    );
  }

  if (spaceQuery.isError) {
    return (
      <div
        role="alert"
        className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center gap-3 text-center"
      >
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
      </div>
    );
  }

  if (!space || space.member_role !== "owner") {
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm leading-6 text-muted">
          Apenas a pessoa proprietária do espaço pode enviar convites.
        </p>
        <Button asChild className="self-center" variant="secondary">
          <Link href="/space">Voltar ao espaço</Link>
        </Button>
      </div>
    );
  }

  if (inviteUrl) {
    return (
      <section className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-mint-900 text-mint-400">
          <NextIcon name="CheckRoundedFilled" size={32} aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">
            Convite criado com sucesso!
          </h1>
          <p className="text-sm leading-6 text-muted">
            Compartilhe o link abaixo. Ele fica válido por sete dias.
          </p>
        </div>
        <div className="w-full rounded-2xl border border-dashed border-line bg-graphite-800/60 p-4 text-left">
          <p className="mb-2 text-xs font-medium text-muted">Link do convite</p>
          <p className="break-all text-sm leading-6 text-ink">{inviteUrl}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Button
            className="w-full sm:flex-1"
            onClick={async () => {
              await navigator.clipboard.writeText(inviteUrl);
              setCopied(true);
            }}
            leadingIcon={copied ? "CheckOutline" : "CopyOutline"}
            type="button"
            variant="secondary"
          >
            {copied ? "Link copiado" : "Copiar link"}
          </Button>
          <Button asChild className="w-full sm:flex-1">
            <Link href="/dashboard">Voltar para o dashboard</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-[560px] flex-1 flex-col">
      <header className="pt-7 text-center sm:pt-9">
        <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">
          Convide alguém para seu espaço
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Gere um link individual para compartilhar o acesso às finanças.
        </p>
      </header>

      <figure className="flex min-h-0 flex-1 items-center justify-center py-4">
        <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-card">
          <Image
            src="/space-invitation.jpg"
            alt="Dois cartões de perfil conectados, representando o convite para compartilhar o espaço"
            width={1280}
            height={800}
            sizes="(min-width: 640px) 420px, 100vw"
            className="h-auto max-h-[38dvh] w-full object-contain"
            priority
          />
        </div>
      </figure>

      <div className="mt-auto pb-2">
        <form
          onSubmit={inviteForm.handleSubmit(({ email: targetEmail }) => {
            setInviteError("");
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
          <Button
            className="w-full"
            disabled={invitationMutation.isPending}
            type="submit"
          >
            {invitationMutation.isPending
              ? "Gerando link…"
              : "Gerar link de convite"}
          </Button>
        </form>
      </div>
    </section>
  );
}
