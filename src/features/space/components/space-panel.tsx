"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/features/auth/lib/supabase/client";
import { Eyebrow } from "@/shared/components/eyebrow";
import { fetchSpacePage } from "@/features/space/lib/queries";
import { queryKeys } from "@/shared/lib/query-keys";
import { formatDate } from "@/shared/lib/date";

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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteState, setInviteState] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteError, setInviteError] = useState("");
  const space = spaceQuery.data?.space ?? null;
  const invitations = spaceQuery.data?.invitations ?? [];
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.space(userId) }),
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
      setInviteEmail("");
      setInviteUrl(url);
      setInviteState(
        "Link criado. Compartilhe com a pessoa convidada; ele expira em sete dias.",
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.space(userId),
      });
    },
  });

  if (spaceQuery.isPending) {
    return (
      <div
        className="grid gap-8 lg:grid-cols-[1fr_0.9fr]"
        aria-live="polite"
        aria-busy="true"
      >
        <Skeleton className="rounded-[18px] border border-line bg-graphite-900 shadow-card h-64" />
        <Skeleton className="rounded-[18px] border border-line bg-graphite-900 shadow-card h-64" />
      </div>
    );
  }
  if (spaceQuery.isError) {
    return (
      <div
        role="alert"
        className="rounded-[18px] border border-line bg-graphite-900 shadow-card p-6 text-sm text-rose-500"
      >
        Não foi possível carregar as informações do espaço. Tente novamente.
      </div>
    );
  }

  async function sendInvitation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteError("");
    setInviteState("");
    setInviteUrl("");

    try {
      await invitationMutation.mutateAsync(inviteEmail.trim().toLowerCase());
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      setInviteError(
        message.includes("already exists")
          ? "Já existe um convite ativo para esse e-mail."
          : message.includes("send invitation email")
            ? "Não foi possível enviar o e-mail. Verifique a configuração de SMTP no Supabase."
            : "Não foi possível enviar. Confira o e-mail e tente novamente.",
      );
    }
  }

  if (!space) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-2xl border border-line bg-graphite-900 p-5 sm:p-7">
          <Eyebrow tone="accent">Comece por aqui</Eyebrow>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink">
            Crie seu espaço
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted">
            Você poderá organizar suas finanças e convidar outras pessoas para
            compartilhar os mesmos dados.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setCreateError("");
              const name = String(
                new FormData(event.currentTarget).get("name") ?? "",
              ).trim();
              if (!name || name.length > 100) {
                setCreateError("Informe um nome de até 100 caracteres.");
                return;
              }
              createMutation.mutate(name);
            }}
            className="mt-6 space-y-4"
          >
            <Input
              label="Nome do espaço"
              containerClassName="gap-2"
              className="min-h-11 px-3.5 focus:border-accent mobile-app:focus:!border-line"
              name="name"
              maxLength={100}
              placeholder="Ex.: Pessoal"
              required
            />
            {createError && (
              <p role="alert" className="text-sm text-rose-500">
                {createError}
              </p>
            )}
            <Button disabled={createMutation.isPending} type="submit">
              {createMutation.isPending ? "Criando…" : "Criar espaço"}
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-line bg-graphite-900 p-5 sm:p-7">
          <Eyebrow tone="accent">Convites recebidos</Eyebrow>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink">
            Acesse um espaço existente
          </h2>
          {invitations.length ? (
            <div className="mt-5 space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-canvas p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      Convite para compartilhar finanças
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Expira em {formatDate(invitation.expires_at)}
                    </p>
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      setAcceptError("");
                      acceptMutation.mutate(invitation.id);
                    }}
                  >
                    <Button
                      disabled={acceptMutation.isPending}
                      size="sm"
                      type="submit"
                    >
                      {requestedInvitationId === invitation.id
                        ? "Aceitar este convite"
                        : "Aceitar convite"}
                    </Button>
                  </form>
                </div>
              ))}
              {acceptError && (
                <p role="alert" className="text-sm text-rose-500">
                  {acceptError}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">
              {requestedInvitationId
                ? "Este convite não está disponível para a conta conectada. Entre com o e-mail confirmado que recebeu o convite."
                : acceptError ||
                  "Quando alguém convidar seu e-mail, o convite aparecerá aqui."}
            </p>
          )}
          {requestedInvitationId &&
            !invitations.some(
              (invitation) => invitation.id === requestedInvitationId,
            ) &&
            invitations.length > 0 && (
              <p role="alert" className="mt-3 text-sm leading-6 text-rose-500">
                O link não está disponível para a conta conectada. Entre com o
                e-mail confirmado que recebeu o convite.
              </p>
            )}
          {requestedInvitationId &&
            invitations.some(
              (invitation) => invitation.id === requestedInvitationId,
            ) && (
              <p className="mt-3 text-sm leading-6 text-muted">
                Você está conectado como {email}. O convite só pode ser aceito
                por esta conta se o e-mail confirmado corresponder ao endereço
                convidado.
              </p>
            )}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] rounded-2xl border border-line bg-graphite-900 p-5 sm:p-8">
      <Eyebrow tone="accent">Espaço financeiro</Eyebrow>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        {space.name}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Convide outras pessoas para acompanhar e atualizar as finanças junto com
        você.
      </p>

      {space.member_role === "owner" ? (
        <form onSubmit={sendInvitation} className="mt-6 space-y-4">
          <Input
            label="E-mail da pessoa convidada"
            containerClassName="gap-2"
            className="min-h-11 px-3.5 focus:border-accent mobile-app:focus:!border-line"
            autoComplete="email"
            type="email"
            required
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="nome@exemplo.com"
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
            <div className="space-y-2 rounded-xl bg-canvas p-4">
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
          <Button disabled={invitationMutation.isPending} type="submit">
            {invitationMutation.isPending
              ? "Gerando link…"
              : "Gerar link de convite"}
          </Button>
        </form>
      ) : (
        <p className="mt-5 rounded-xl bg-canvas px-4 py-3 text-sm text-muted">
          Você já participa deste espaço.
        </p>
      )}
      <Button
        className="mt-7 w-full"
        onClick={() => router.push("/dashboard")}
        type="button"
        variant="secondary"
      >
        Ir para o Finance
      </Button>
    </div>
  );
}
