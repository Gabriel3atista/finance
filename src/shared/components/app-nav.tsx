"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";

const items = [
  { href: "/dashboard", label: "Painel", icon: "dashboard" },
  { href: "/mes", label: "Meu mês", icon: "month" },
  { href: "/projecao", label: "Projeção", icon: "forecast" },
  { href: "/historico", label: "Histórico", icon: "history" },
  { href: "/cadastros", label: "Cadastros", icon: "records" },
] as const;

export function AppNav({ variant }: { variant: "sidebar" | "mobile" }) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        variant === "sidebar" ? "flex flex-col" : "mx-auto flex max-w-lg justify-around",
      )}
    >
      {variant === "sidebar" && (
        <Link
          href="/dashboard"
          className="focus-ring mb-10 flex h-[68px] items-center gap-3 border-b border-line px-6"
          aria-label="Finance, página inicial"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-moon-200 text-background-900">
            <SmallMark />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Finance
          </span>
        </Link>
      )}
      <div
        className={cn(
          variant === "sidebar" ? "space-y-1 px-3" : "flex w-full justify-around",
        )}
      >
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-ring flex items-center",
                variant === "sidebar" && "gap-3 rounded-xl px-3 py-3 text-sm",
                variant === "mobile" &&
                  "min-w-[60px] flex-col gap-1 rounded-xl px-1 py-1.5 text-[9px] sm:min-w-[68px] sm:px-2 sm:text-[10px]",
                active
                  ? "bg-white font-semibold text-black"
                  : "text-muted hover:bg-canvas hover:text-ink",
              )}
            >
              <NavIcon name={item.icon} active={active} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SmallMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[19px]"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 17.5 10 12l3.2 3.1L19 8"
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

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (name === "dashboard")
    return (
      <svg viewBox="0 0 24 24" className="size-[19px] shrink-0" {...common}>
        <rect x="3.5" y="4" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="4" width="7" height="4.5" rx="1.5" />
        <rect x="13.5" y="11.5" width="7" height="8.5" rx="1.5" />
        <rect x="3.5" y="14" width="7" height="6" rx="1.5" />
      </svg>
    );
  if (name === "month")
    return (
      <svg viewBox="0 0 24 24" className="size-[19px] shrink-0" {...common}>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
        <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17" />
        <path
          d="M8 13h3v3H8z"
          fill={active ? "currentColor" : "none"}
          stroke="none"
        />
      </svg>
    );
  if (name === "forecast")
    return (
      <svg viewBox="0 0 24 24" className="size-[19px] shrink-0" {...common}>
        <path d="M4 18.5h16M6.5 15V9.5M12 15V5.5M17.5 15v-3" />
        <path d="m5 7 5-3 5 2 4-3" />
      </svg>
    );
  if (name === "history")
    return (
      <svg viewBox="0 0 24 24" className="size-[19px] shrink-0" {...common}>
        <path d="M3.5 12a8.5 8.5 0 1 0 2.7-6.2L3.5 8.5" />
        <path d="M3.5 4.5v4h4M12 7.5V12l3 2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className="size-[19px] shrink-0" {...common}>
      <path d="M4.5 6.5h15M7 6.5v13h10v-13M9.5 6.5V4h5v2.5M10 10v6M14 10v6" />
    </svg>
  );
}
