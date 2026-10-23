"use client";

export default function WorkspaceError({ reset }: { reset: () => void }) {
  return (
    <section
      aria-labelledby="workspace-error-title"
      className="mx-auto max-w-2xl rounded-2xl border border-danger-800 bg-danger-900 p-6 sm:p-8"
      role="alert"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-danger-200">
        Não foi possível carregar esta tela
      </p>
      <h1
        className="mt-2 text-xl font-semibold tracking-tight text-danger-100"
        id="workspace-error-title"
      >
        Seus dados continuam protegidos
      </h1>
      <p className="mt-2 text-sm leading-6 text-danger-200">
        Confira sua conexão e tente carregar a página novamente. Se o problema
        continuar, tente mais tarde.
      </p>
      <button className="quiet-button mt-5" onClick={reset} type="button">
        Tentar novamente
      </button>
    </section>
  );
}
