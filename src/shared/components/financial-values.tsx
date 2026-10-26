"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "finance-values-hidden";

const ValuesVisibilityContext = createContext<{
  hidden: boolean;
  toggle: () => void;
} | null>(null);

export function ValuesVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(window.localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  function toggle() {
    const next = !hidden;
    window.localStorage.setItem(STORAGE_KEY, String(next));
    setHidden(next);
  }

  return (
    <ValuesVisibilityContext.Provider value={{ hidden, toggle }}>
      {children}
    </ValuesVisibilityContext.Provider>
  );
}

export function FinancialValue({ children }: { children: ReactNode }) {
  const { hidden } = useValuesVisibility();

  return (
    <span aria-label={hidden ? "Valor oculto" : undefined}>
      {hidden ? "•••••••" : children}
    </span>
  );
}

export function ValuesVisibilityToggle({
  className = "",
  iconOnly = false,
  loading = false,
}: {
  className?: string;
  iconOnly?: boolean;
  loading?: boolean;
}) {
  const { hidden, toggle } = useValuesVisibility();
  const label = hidden ? "Mostrar valores" : "Ocultar valores";

  return (
    <Button
      aria-busy={loading}
      aria-label={loading ? "Carregando valores" : label}
      aria-pressed={hidden}
      className={`gap-2 px-2.5 ${className}`}
      disabled={loading}
      onClick={toggle}
      size="sm"
      title={label}
      type="button"
      variant="ghost"
    >
      {loading ? (
        <svg
          aria-hidden="true"
          className="size-5 shrink-0 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            d="M21 12a9 9 0 00-9-9"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
      ) : (
        <VisibilityIcon hidden={hidden} />
      )}
      <span className={iconOnly ? "sr-only" : "hidden text-xs sm:inline"}>
        {label}
      </span>
    </Button>
  );
}

export function useValuesVisibility() {
  const context = useContext(ValuesVisibilityContext);
  if (!context) {
    throw new Error(
      "Financial values must be rendered inside ValuesVisibilityProvider.",
    );
  }
  return context;
}

function VisibilityIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="size-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      {hidden ? (
        <>
          <path
            d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
          <path
            d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.3 4.1 9 7-.3 1.2-1.1 2.5-2.3 3.7M6.2 6.2C4.4 7.5 3.3 9.4 3 12c.7 2.9 4 7 9 7 1.1 0 2.1-.2 3-.6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </>
      ) : (
        <>
          <path
            d="M3 12c.7-2.9 4-7 9-7s8.3 4.1 9 7c-.7 2.9-4 7-9 7s-8.3-4.1-9-7z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
          <circle
            cx="12"
            cy="12"
            r="2.5"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </>
      )}
    </svg>
  );
}
