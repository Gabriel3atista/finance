"use client";

import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/shared/components/eyebrow";

export default function WorkspaceError({ reset }: { reset: () => void }) {
  return (
    <section
      aria-labelledby="workspace-error-title"
      className="mx-auto max-w-2xl rounded-2xl border border-rose-800 bg-rose-900 p-6 sm:p-8"
      role="alert"
    >
      <Eyebrow tone="danger">Não foi possível carregar esta tela</Eyebrow>
      <h1
        className="mt-2 text-xl font-semibold tracking-tight text-rose-100"
        id="workspace-error-title"
      >
        Seus dados continuam protegidos
      </h1>
      <p className="mt-2 text-sm leading-6 text-rose-200">
        Confira sua conexão e tente carregar a página novamente. Se o problema
        continuar, tente mais tarde.
      </p>
      <Button className="mt-5" onClick={reset} type="button" variant="outline">
        Tentar novamente
      </Button>
    </section>
  );
}
