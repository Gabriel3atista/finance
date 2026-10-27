"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/features/auth/lib/supabase/client";
import { safeInternalPath } from "@/features/auth/lib/safe-redirect";

type AuthMode = "login" | "signup" | "forgot" | "update-password";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const callbackError = searchParams.get("error");

  const titles: Record<AuthMode, string> = {
    login: "Acesse suas finanças",
    signup: "Crie sua conta",
    forgot: "Recupere sua senha",
    "update-password": "Defina uma nova senha",
  };
  const descriptions: Record<AuthMode, string> = {
    login: "Entre para acompanhar as finanças da família.",
    signup:
      "Depois de confirmar o e-mail, você poderá criar ou acessar um núcleo familiar.",
    forgot:
      "Enviaremos um link para o e-mail informado, se houver uma conta associada.",
    "update-password": "Escolha uma senha nova para sua conta.",
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") ?? "");

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
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/household`,
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
        router.replace("/household");
        router.refresh();
      }, 700);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setBusy(true);
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
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-8">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-3"
          aria-label="Finance"
        >
          <span className="grid size-10 place-items-center rounded-[14px] bg-moon-200 text-background-900">
            <BrandMark />
          </span>
          <span className="text-base font-semibold tracking-tight text-ink">
            Finance
          </span>
        </Link>
        <h1 className="mt-8 text-[28px] font-semibold tracking-[-0.04em] text-ink">
          {titles[mode]}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {descriptions[mode]}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode !== "update-password" && (
          <label className="block text-sm font-medium text-ink">
            E-mail
            <Input
              autoComplete="email"
              className="mt-2 min-h-11 px-3.5"
              name="email"
              placeholder="voce@exemplo.com"
              required
              type="email"
            />
          </label>
        )}

        {mode !== "forgot" && (
          <label className="block text-sm font-medium text-ink">
            {mode === "update-password" ? "Nova senha" : "Senha"}
            <Input
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              className="mt-2 min-h-11 px-3.5"
              name="password"
              placeholder={
                mode === "login" ? "Sua senha" : "Pelo menos 8 caracteres"
              }
              minLength={8}
              required
              type="password"
            />
          </label>
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
            onClick={signInWithGoogle}
            type="button"
            variant="secondary"
          >
            <GoogleMark />
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

function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
      <path
        d="m5 17.5 5-5.5 3.2 3.1L19 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 8H19v4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
      <path
        fill="hsl(217.42 89% 60.78%)"
        d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.4h3.14c1.84-1.7 2.91-4.2 2.91-7.17Z"
      />
      <path
        fill="hsl(136.03 52.73% 43.14%)"
        d="M12 21.6c2.63 0 4.84-.87 6.45-2.35l-3.14-2.4c-.87.58-1.98.93-3.31.93-2.54 0-4.7-1.72-5.47-4.04H3.28v2.47A9.73 9.73 0 0 0 12 21.6Z"
      />
      <path
        fill="hsl(44.63 96.85% 50.2%)"
        d="M6.53 13.74a5.85 5.85 0 0 1 0-3.48V7.8H3.28a9.73 9.73 0 0 0 0 8.4l3.25-2.46Z"
      />
      <path
        fill="hsl(4.64 81.17% 56.27%)"
        d="M12 6.22c1.43 0 2.72.5 3.73 1.48l2.8-2.8A9.37 9.37 0 0 0 12 2.4a9.73 9.73 0 0 0-8.72 5.4l3.25 2.46C7.3 7.94 9.46 6.22 12 6.22Z"
      />
    </svg>
  );
}
