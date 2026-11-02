"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { NextIcon } from "@/components/atoms/next-icon";
import { cn } from "@/shared/lib/utils";

const items = [
  { href: "/dashboard", label: "Painel", icon: "DashboardOutline" },
  { href: "/mes", label: "Meu mês", icon: "CalendarOutline" },
  { href: "/cadastros", label: "Programações", icon: "BillListOutline" },
] as const;

export function AppNav({ variant }: { variant: "sidebar" | "mobile" }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const activeIndex = items.findIndex((item) => pathname === item.href);
  const [optimisticActiveIndex, setOptimisticActiveIndex] = useState<
    number | null
  >(null);
  const selectedIndex = optimisticActiveIndex ?? activeIndex;

  useEffect(() => {
    setOptimisticActiveIndex(null);
  }, [pathname]);

  return (
    <div
      className={cn(
        variant === "sidebar" ? "flex flex-col" : "mx-auto flex max-w-lg",
      )}
    >
      {variant === "sidebar" && (
        <Link
          href="/dashboard"
          className="focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-moon-600 mobile-app:focus:!outline-none mb-10 flex h-[68px] items-center gap-3 border-b border-line/30 px-6"
          aria-label="pinutie, página inicial"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-moon-200 text-graphite-900">
            <NextIcon name="BrandMarkOutline" size={24} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            pinutie
          </span>
        </Link>
      )}
      <div
        className={cn(
          variant === "sidebar"
            ? "space-y-1 px-3"
            : "relative flex w-fit gap-1",
        )}
      >
        {variant === "mobile" && selectedIndex >= 0 && (
          <motion.span
            aria-hidden="true"
            animate={{
              transform: `translate3d(${selectedIndex * 52}px, 0, 0)`,
            }}
            className="pointer-events-none absolute left-0 top-0 size-[48px] rounded-full border border-line/30 bg-gradient-to-b from-white/20 to-white/10 shadow-[inset_0_1px_0_hsl(0_0%_100%/25%),0_2px_8px_hsl(0_0%_0%/20%)]"
            initial={false}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: "spring", duration: 0.4, bounce: 0.12 }
            }
          />
        )}
        {items.map((item, index) => {
          const active =
            variant === "mobile"
              ? selectedIndex === index
              : pathname === item.href;
          const current = pathname === item.href;
          return (
            <Link
              key={item.href}
              onClick={
                variant === "mobile"
                  ? () => setOptimisticActiveIndex(index)
                  : undefined
              }
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-moon-600 mobile-app:focus:!outline-none flex items-center",
                variant === "sidebar" && "gap-3 rounded-xl px-3 py-3 text-sm",
                variant === "mobile" &&
                  "relative z-10 size-[48px] shrink-0 justify-center rounded-full",
                active
                  ? variant === "mobile"
                    ? "text-white"
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
