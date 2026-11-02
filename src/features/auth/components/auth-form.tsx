"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { NextIcon } from "@/components/atoms/next-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/features/auth/lib/supabase/client";
import { safeInternalPath } from "@/features/auth/lib/safe-redirect";
import {
  createAuthFormSchema,
  type AuthFormMode,
} from "@/features/auth/lib/form-schemas";

type AuthMode = AuthFormMode;
type AuthFormValues = { email: string; password: string };

const messages: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar.",
  "User already registered":
    "Este e-mail já tem cadastro. Entre com sua conta.",
  "Password should be at least 6 characters":
    "Use uma senha com pelo menos 6 caracteres.",
  "Email rate limit exceeded":
    "Muitos e-mails foram solicitados. Aguarde um pouco e tente novamente.",
};

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.startsWith("Configure ")) {
    return error.message;
  }
  const message = error instanceof Error ? error.message : "Tente novamente.";
  return (
    messages[message] ??
    "Não foi possível concluir. Confira os dados e tente novamente."
  );
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [oauthBusy, setOauthBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const callbackError = searchParams.get("error");
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(createAuthFormSchema(mode)),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });
  const busy = form.formState.isSubmitting || oauthBusy;

  const titles: Record<AuthMode, string> = {
    login: "Acesse suas finanças",
    signup: "Crie sua conta",
    forgot: "Recupere sua senha",
    "update-password": "Defina uma nova senha",
  };
  const descriptions: Record<AuthMode, string> = {
    login: "Entre para acompanhar suas finanças.",
    signup:
      "Depois de confirmar o e-mail, você poderá criar um espaço ou aceitar um convite.",
    forgot:
      "Enviaremos um link para o e-mail informado, se houver uma conta associada.",
    "update-password": "Escolha uma senha nova para sua conta.",
  };

  async function handleSubmit(values: AuthFormValues) {
    setError("");
    setNotice("");
    const email = values.email.trim().toLowerCase();
    const password = values.password;

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        router.replace(safeInternalPath(searchParams.get("next")));
        router.refresh();
        return;
      }

      if (mode === "signup") {
        const callback = new URL("/auth/callback", window.location.origin);
        callback.searchParams.set(
          "next",
          safeInternalPath(searchParams.get("next")),
        );
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callback.toString(),
          },
        });
        if (authError) throw authError;
        setNotice(
          "Cadastro iniciado. Confira seu e-mail para confirmar a conta e continuar.",
        );
        return;
      }

      if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
          },
        );
        if (authError) throw authError;
        setNotice(
          "Se houver uma conta para esse e-mail, você receberá instruções para redefinir a senha.",
        );
        return;
      }

      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      setNotice("Senha atualizada. Você já pode continuar.");
      window.setTimeout(() => {
        router.replace("/space");
        router.refresh();
      }, 700);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function signInWithGoogle() {
    setOauthBusy(true);
    setError("");
    const isStandalonePwa =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    const authWindow = isStandalonePwa
      ? window.open("about:blank", "_blank")
      : null;

    try {
      const supabase = createClient();
      const safeNext = safeInternalPath(searchParams.get("next"));
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", safeNext);
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callback.toString(),
          ...(isStandalonePwa && { skipBrowserRedirect: true }),
        },
      });
      if (authError) throw authError;

      if (isStandalonePwa) {
        if (!data.url) throw new Error("Não foi possível iniciar o login.");

        if (authWindow) {
          authWindow.location.replace(data.url);
        } else {
          window.location.assign(data.url);
        }
      }
    } catch (caught) {
      authWindow?.close();
      setError(errorMessage(caught));
      setOauthBusy(false);
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-8">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-3"
          aria-label="pinutie"
        >
          <span className="grid size-10 place-items-center rounded-[14px] bg-moon-200 text-graphite-900">
            <NextIcon name="BrandMarkOutline" size={20} />
          </span>
          <span className="text-base font-semibold tracking-tight text-ink">
            pinutie
          </span>
        </Link>
        <h1 className="mt-8 text-[28px] font-semibold tracking-[-0.04em] text-ink">
          {titles[mode]}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {descriptions[mode]}
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
        noValidate
      >
        {mode !== "update-password" && (
          <Input
            label="E-mail"
            containerClassName="gap-2"
            autoComplete="email"
            className="min-h-11 px-3.5"
            placeholder="voce@exemplo.com"
            type="email"
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
        )}

        {mode !== "forgot" && (
          <Input
            label={mode === "update-password" ? "Nova senha" : "Senha"}
            containerClassName="gap-2"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            className="min-h-11 px-3.5"
            placeholder={
              mode === "login" ? "Sua senha" : "Pelo menos 8 caracteres"
            }
            type="password"
            error={form.formState.errors.password?.message}
            {...form.register("password")}
          />
        )}

        {(error || callbackError) && (
          <p
            role="alert"
            className="rounded-xl bg-rose-900 px-3.5 py-3 text-sm text-rose-100"
          >
            {error ||
              (callbackError === "oauth"
                ? "A entrada com Google foi cancelada ou não pôde ser concluída."
                : "Não foi possível concluir a autenticação. Tente novamente.")}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="rounded-xl bg-accent-soft px-3.5 py-3 text-sm leading-5 text-accent"
          >
            {notice}
          </p>
        )}

        <Button className="w-full min-h-11" disabled={busy} type="submit">
          {busy
            ? "Aguarde…"
            : mode === "login"
              ? "Entrar"
              : mode === "signup"
                ? "Criar conta"
                : mode === "forgot"
                  ? "Enviar instruções"
                  : "Salvar nova senha"}
        </Button>
      </form>

      {(mode === "login" || mode === "signup") && (
        <>
          <div className="my-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            <span className="h-px flex-1 bg-line" />
            ou
            <span className="h-px flex-1 bg-line" />
          </div>
          <Button
            className="w-full min-h-11"
            disabled={busy}
            leadingIcon="Google"
            onClick={signInWithGoogle}
            type="button"
            variant="secondary"
          >
            Continuar com Google
          </Button>
        </>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        {mode === "login" && (
          <Link
            className="text-muted underline-offset-4 hover:text-ink hover:underline"
            href="/forgot-password"
          >
            Esqueci minha senha
          </Link>
        )}
        {(mode === "login" || mode === "signup") && (
          <p className="text-muted">
            {mode === "login" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
            <Link
              className="font-medium text-accent underline-offset-4 hover:underline"
              href={mode === "login" ? "/signup" : "/login"}
            >
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </Link>
          </p>
        )}
        {mode === "forgot" && (
          <Link
            className="font-medium text-accent underline-offset-4 hover:underline"
            href="/login"
          >
            Voltar para entrar
          </Link>
        )}
        {mode === "update-password" && (
          <Link
            className="text-muted underline-offset-4 hover:text-ink hover:underline"
            href="/login"
          >
            Voltar para entrar
          </Link>
        )}
      </div>
    </div>
  );
}
