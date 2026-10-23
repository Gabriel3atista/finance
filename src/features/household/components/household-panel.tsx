"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  acceptHouseholdInvitation,
  createHousehold,
} from "@/features/household/actions";
import { createClient } from "@/features/auth/lib/supabase/client";

type Invitation = { id: string; household_id: string; expires_at: string };
type Household = { id: string; name: string; member_role: string };

export function HouseholdPanel({
  household,
  invitations,
  invitationError,
}: {
  household: Household | null;
  invitations: Invitation[];
  invitationError: string;
}) {
  const router = useRouter();
  const [createState, createAction, creating] = useActionState(
    createHousehold,
    { error: "" },
  );
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteState, setInviteState] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [sending, setSending] = useState(false);

  async function sendInvitation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setInviteError("");
    setInviteState("");

    try {
      const supabase = createClient();
      const { error } = await supabase.functions.invoke("household-invite", {
        body: {
          householdId: household?.id,
          email: inviteEmail.trim().toLowerCase(),
        },
      });
      if (error) {
        const context = (error as { context?: Response }).context;
        const payload = (await context
          ?.clone()
          .json()
          .catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? error.message);
      }
      setInviteEmail("");
      setInviteState("Convite enviado. Ele expira em sete dias.");
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      setInviteError(
        message.includes("already exists")
          ? "Já existe um convite ativo para esse e-mail."
          : message.includes("send invitation email")
            ? "Não foi possível enviar o e-mail. Verifique a configuração de SMTP no Supabase."
            : "Não foi possível enviar. Confira o e-mail e tente novamente.",
      );
    } finally {
      setSending(false);
    }
  }

  if (!household) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-2xl border border-line bg-card-900 p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-accent">
            Comece por aqui
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink">
            Crie o núcleo da família
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted">
            Você será a pessoa responsável e poderá convidar sua esposa para
            compartilhar os mesmos dados.
          </p>
          <form action={createAction} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-ink">
              Nome do núcleo
              <input
                className="focus-ring mt-2 min-h-11 w-full rounded-xl border border-line px-3.5 text-sm font-normal outline-none focus:border-accent"
                name="name"
                maxLength={100}
                placeholder="Ex.: Família Silva"
                required
              />
            </label>
            {createState.error && (
              <p role="alert" className="text-sm text-danger-300">
                {createState.error}
              </p>
            )}
            <Button
              disabled={creating}
              type="submit"
              className="active:scale-[0.98]"
            >
              {creating ? "Criando…" : "Criar núcleo familiar"}
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-line bg-card-900 p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-accent">
            Convites recebidos
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink">
            Acesse um núcleo existente
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
                      Expira em{" "}
                      {new Date(invitation.expires_at).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                  </div>
                  <form
                    action={acceptHouseholdInvitation.bind(null, invitation.id)}
                  >
                    <Button size="sm" type="submit">
                      Aceitar convite
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">
              {invitationError ||
                "Quando alguém convidar seu e-mail, o convite aparecerá aqui."}
            </p>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] rounded-2xl border border-line bg-card-900 p-5 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-accent">
        Núcleo familiar
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        {household.name}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Convide sua esposa para ver e atualizar as finanças junto com você.
      </p>

      {household.member_role === "owner" ? (
        <form onSubmit={sendInvitation} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-ink">
            E-mail da pessoa convidada
            <input
              className="focus-ring mt-2 min-h-11 w-full rounded-xl border border-line px-3.5 text-sm font-normal outline-none focus:border-accent"
              autoComplete="email"
              type="email"
              required
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="nome@exemplo.com"
            />
          </label>
          {inviteError && (
            <p role="alert" className="text-sm text-danger-300">
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
          <Button
            className="active:scale-[0.98]"
            disabled={sending}
            type="submit"
          >
            {sending ? "Enviando…" : "Enviar convite por e-mail"}
          </Button>
        </form>
      ) : (
        <p className="mt-5 rounded-xl bg-canvas px-4 py-3 text-sm text-muted">
          Você já participa deste núcleo familiar.
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
