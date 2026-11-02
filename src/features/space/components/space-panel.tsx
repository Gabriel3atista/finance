"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
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
import { Eyebrow } from "@/shared/components/eyebrow";
import { fetchSpacePage } from "@/features/space/lib/queries";
import { queryKeys } from "@/shared/lib/query-keys";
import { formatDate } from "@/shared/lib/date";
import {
  createSpaceSchema,
  invitationEmailSchema,
} from "@/features/space/lib/form-schemas";

export function SpacePanel({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedInvitationId = searchParams.get("invite");
  const queryClient = useQueryClient();
  const spaceQuery = useQuery({
    queryKey: queryKeys.space(userId),
    queryFn: () => fetchSpacePage(userId, email),
  });
  const [createError, setCreateError] = useState("");
  const [acceptError, setAcceptError] = useState("");
  const [inviteState, setInviteState] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteError, setInviteError] = useState("");
  const createSpaceForm = useForm<{ name: string }>({
    resolver: zodResolver(createSpaceSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { name: "" },
  });
  const inviteForm = useForm<{ email: string }>({
    resolver: zodResolver(invitationEmailSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "" },
  });
  const space = spaceQuery.data?.space ?? null;
  const invitations = spaceQuery.data?.invitations ?? [];
  const requestedInvitation = invitations.find(
    (invitation) => invitation.id === requestedInvitationId,
  );
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("login");
      const { error } = await supabase
        .from("spaces")
        .insert({ name, created_by: user.id });
      if (error) throw error;
    },
    onSuccess: async () => {
      createSpaceForm.reset();
      await queryClient.invalidateQueries({
        queryKey: queryKeys.space(userId),
      });
    },
    onError: () =>
      setCreateError("Não foi possível criar o espaço. Tente novamente."),
  });
  const acceptMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const supabase = createClient();
      const { data: invitation, error: invitationError } = await supabase
        .from("space_invitations")
        .select("space_id")
        .eq("id", invitationId)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (invitationError || !invitation)
        throw new Error("invitation-unavailable");
      const { error } = await supabase.from("space_members").insert({
        space_id: invitation.space_id,
        user_id: userId,
        member_role: "member",
      });
      if (error) throw error;
    },
    onSuccess: () => router.push("/dashboard"),
    onError: () =>
      setAcceptError(
        "Este convite não está mais disponível. Atualize a página e tente novamente.",
      ),
  });
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
      <div
        className="grid gap-3 lg:grid-cols-2"
        aria-live="polite"
        aria-busy="true"
      >
        {[0, 1].map((item) => (
          <Card className="flex min-h-64 flex-col gap-3 p-5 sm:p-6" key={item}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="mt-auto h-11 w-full" />
          </Card>
        ))}
      </div>
    );
  }
  if (spaceQuery.isError) {
    return (
      <Card role="alert" className="flex flex-col items-start gap-3 p-5 sm:p-6">
        <p className="text-sm text-rose-500">
          Não foi possível carregar as informações do espaço.
        </p>
        <Button
          onClick={() => {
            void spaceQuery.refetch();
          }}
          type="button"
          variant="secondary"
        >
          Tentar novamente
        </Button>
      </Card>
    );
  }

  if (!space) {
    return (
      <div className="grid items-start gap-3 lg:grid-cols-2">
        <Card sections className="overflow-hidden">
          <CardHeader className="flex flex-col gap-2 bg-graphite-600 p-5 sm:p-6">
            <Eyebrow tone="accent">Comece por aqui</Eyebrow>
            <CardTitle className="text-xl tracking-tight">
              Crie seu espaço
            </CardTitle>
            <CardDescription className="max-w-md leading-6">
              Você poderá organizar suas finanças e convidar outras pessoas para
              compartilhar os mesmos dados.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <form
              onSubmit={createSpaceForm.handleSubmit(({ name }) => {
                setCreateError("");
                createMutation.mutate(name.trim());
              })}
              className="flex flex-col gap-3"
              noValidate
            >
              <Input
                label="Nome do espaço"
                containerClassName="gap-2"
                className="min-h-11 px-3.5 focus:border-accent mobile-app:focus:!border-line"
                error={createSpaceForm.formState.errors.name?.message}
                maxLength={100}
                placeholder="Ex.: Pessoal"
                {...createSpaceForm.register("name")}
              />
              {createError && (
                <p role="alert" className="text-sm text-rose-500">
                  {createError}
                </p>
              )}
              <Button
                className="w-full sm:w-auto sm:self-start"
                disabled={createMutation.isPending}
                type="submit"
              >
                {createMutation.isPending ? "Criando…" : "Criar espaço"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card sections className="overflow-hidden">
          <CardHeader className="flex flex-col gap-2 bg-graphite-600 p-5 sm:p-6">
            <Eyebrow tone="accent">Convites recebidos</Eyebrow>
            <CardTitle className="text-xl tracking-tight">
              Acesse um espaço existente
            </CardTitle>
            <CardDescription className="leading-6">
              Convites enviados ao seu e-mail aparecem aqui.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-5 sm:p-6">
            {invitations.length ? (
              <div className="flex flex-col gap-3">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex flex-col items-start gap-3 rounded-xl border border-line/50 bg-graphite-800 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">
                        Convite para compartilhar finanças
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Expira em {formatDate(invitation.expires_at)}
                      </p>
                    </div>
                    <Button
                      className="w-full sm:w-auto"
                      disabled={acceptMutation.isPending}
                      onClick={() => {
                        setAcceptError("");
                        acceptMutation.mutate(invitation.id);
                      }}
                      size="sm"
                      type="button"
                    >
                      {requestedInvitationId === invitation.id
                        ? "Aceitar este convite"
                        : "Aceitar convite"}
                    </Button>
                  </div>
                ))}
                {acceptError && (
                  <p role="alert" className="text-sm text-rose-500">
                    {acceptError}
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm leading-6 text-muted">
                {requestedInvitationId
                  ? "Este convite não está disponível para a conta conectada. Entre com o e-mail confirmado que recebeu o convite."
                  : acceptError ||
                    "Quando alguém convidar seu e-mail, o convite aparecerá aqui."}
              </p>
            )}
            {requestedInvitationId &&
              !requestedInvitation &&
              invitations.length > 0 && (
                <p
                  role="alert"
                  className="mt-3 text-sm leading-6 text-rose-500"
                >
                  O link não está disponível para a conta conectada. Entre com o
                  e-mail confirmado que recebeu o convite.
                </p>
              )}
            {requestedInvitationId && requestedInvitation && (
              <p className="mt-3 text-sm leading-6 text-muted">
                Você está conectado como {email}. O convite só pode ser aceito
                por esta conta se o e-mail confirmado corresponder ao endereço
                convidado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card sections className="mx-auto max-w-[640px] overflow-hidden">
      <CardHeader className="flex flex-col gap-3 bg-graphite-600 p-5 sm:p-6">
        <Eyebrow tone="accent">Seu espaço</Eyebrow>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="min-w-0 break-words text-2xl tracking-tight">
            {space.name}
          </CardTitle>
          <Badge variant="secondary">
            {space.member_role === "owner" ? "Proprietário" : "Membro"}
          </Badge>
        </div>
        <CardDescription className="leading-6">
          {space.member_role === "owner"
            ? "Gerencie o acesso e compartilhe suas finanças com pessoas de confiança."
            : "Acompanhe as finanças compartilhadas neste espaço."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-5 sm:p-6">
        {space.member_role === "owner" ? (
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
        ) : (
          <p className="rounded-xl border border-line/50 bg-graphite-800 px-4 py-3 text-sm text-muted">
            Você já participa deste espaço.
          </p>
        )}
        <Button
          className="w-full"
          onClick={() => router.push("/dashboard")}
          type="button"
          variant="secondary"
        >
          Ir para o Finance
        </Button>
      </CardContent>
    </Card>
  );
}
