"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NextIcon } from "@/components/atoms/next-icon";
import { cn } from "@/shared/lib/utils";

const items = [
  { href: "/dashboard", label: "Painel", icon: "DashboardOutline" },
  { href: "/mes", label: "Meu mês", icon: "CalendarOutline" },
  { href: "/projecao", label: "Projeção", icon: "ForecastOutline" },
  { href: "/historico", label: "Histórico", icon: "HistoryOutline" },
  { href: "/cadastros", label: "Cadastros", icon: "RecordsOutline" },
] as const;

export function AppNav({ variant }: { variant: "sidebar" | "mobile" }) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        variant === "sidebar" ? "flex flex-col" : "mx-auto flex max-w-lg",
      )}
    >
      {variant === "sidebar" && (
        <Link
          href="/dashboard"
          className="focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-moon-600 mobile-app:focus:!outline-none mb-10 flex h-[68px] items-center gap-3 border-b border-line px-6"
          aria-label="Finance, página inicial"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-moon-200 text-graphite-900">
            <NextIcon name="BrandMarkOutline" size={24} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Finance
          </span>
        </Link>
      )}
      <div
        className={cn(
          variant === "sidebar" ? "space-y-1 px-3" : "flex w-full gap-1",
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
                "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-moon-600 mobile-app:focus:!outline-none flex items-center",
                variant === "sidebar" && "gap-3 rounded-xl px-3 py-3 text-sm",
                variant === "mobile" &&
                  "size-[48px] shrink-0 justify-center rounded-full",
                active
                  ? variant === "mobile"
                    ? "border border-white/10 bg-gradient-to-b from-white/20 to-white/10 text-white shadow-[inset_0_1px_0_hsl(0_0%_100%/25%),0_2px_8px_hsl(0_0%_0%/20%)]"
                    : "bg-white font-semibold text-black"
                  : variant === "mobile"
                    ? "text-muted hover:bg-white/10 hover:text-ink"
                    : "text-muted hover:bg-canvas hover:text-ink",
              )}
              aria-label={variant === "mobile" ? item.label : undefined}
              title={variant === "mobile" ? item.label : undefined}
            >
              <NextIcon name={item.icon} size={24} />
              {variant === "sidebar" && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
