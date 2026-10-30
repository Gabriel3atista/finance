"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { NextIcon } from "@/components/atoms/next-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

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

export type FinancialValueSize = "xs" | "sm" | "md" | "lg" | "xl";

const financialValueSizes: Record<FinancialValueSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

export function FinancialValue({
  children,
  size,
}: {
  children: ReactNode;
  size?: FinancialValueSize;
}) {
  const { hidden } = useValuesVisibility();

  return (
    <span
      aria-label={hidden ? "Valor oculto" : undefined}
      className={cn(size && financialValueSizes[size])}
    >
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
        <NextIcon
          className="animate-spin motion-reduce:animate-none"
          name="LoadingOutline"
          size={20}
        />
      ) : (
        <NextIcon name={hidden ? "EyeOffOutline" : "EyeOutline"} size={20} />
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
