"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { addMonths, monthString } from "@/features/transactions/lib/data";
import { cn } from "@/shared/lib/utils";

const transition = "transform 260ms cubic-bezier(0.77, 0, 0.175, 1)";
const maskImage =
  "linear-gradient(to right, transparent 39%, black 47%, black 53%, transparent 61%)";

export function MonthSelector({
  month,
  onMonthSelect,
}: {
  month: Date;
  onMonthSelect: (month: Date) => void;
}) {
  const monthKey = monthString(month);
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setOffset(0);
    setIsAnimating(false);
    setIsNavigating(false);
  }, [monthKey]);

  const months = Array.from({ length: 9 }, (_, index) => {
    const relativeMonth = index - 4;
    const date = addMonths(month, relativeMonth);
    return {
      date,
      key: monthString(date),
      label: date.toLocaleDateString("pt-BR", { month: "long" }).slice(0, 3),
      relativeMonth,
    };
  });
  const transform = `translate3d(${((-1 - offset) * 100) / 9}%, 0, 0)`;
  const trackStyle = {
    transform,
    transition: isAnimating ? transition : "none",
    width: "128.5714%",
  };

  function selectMonth(relativeMonth: number) {
    if (isNavigating || relativeMonth === 0) return;
    const nextMonth = addMonths(month, relativeMonth);
    setIsNavigating(true);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      onMonthSelect(nextMonth);
      return;
    }

    setIsAnimating(true);
    requestAnimationFrame(() => {
      setOffset(relativeMonth);
      window.setTimeout(() => {
        onMonthSelect(nextMonth);
      }, 280);
    });
  }

  function renderTrack(masked: boolean) {
    return (
      <div
        aria-hidden={masked || undefined}
        className={cn("grid grid-cols-9", masked && "pointer-events-none")}
        style={trackStyle}
      >
        {months.map(({ key, label, relativeMonth }) =>
          masked ? (
            <span
              className="font-kantumruy-pro flex h-10 items-center justify-center text-sm font-medium uppercase text-black"
              key={key}
            >
              {label}
            </span>
          ) : (
            <Button
              aria-current={relativeMonth === 0 ? "date" : undefined}
              className={cn(
                "font-kantumruy-pro h-10 w-full min-w-0 rounded-full px-2 text-sm font-medium uppercase",
                relativeMonth === 0
                  ? "bg-transparent text-muted hover:bg-transparent hover:text-muted"
                  : "bg-transparent text-muted hover:bg-transparent hover:text-ink",
              )}
              disabled={isNavigating}
              key={key}
              onClick={() => selectMonth(relativeMonth)}
              type="button"
              variant="ghost"
            >
              {label}
            </Button>
          ),
        )}
      </div>
    );
  }

  return (
    <nav aria-label="Selecionar mês" className="mx-auto max-w-xl">
      <div className="relative isolate min-h-10 overflow-hidden">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
          style={{ width: "14.2857%" }}
        />
        {renderTrack(false)}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
          style={{
            maskImage,
            WebkitMaskImage: maskImage,
          }}
        >
          {renderTrack(true)}
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-30 w-12 bg-gradient-to-r from-graphite-900 via-graphite-900/80 to-transparent"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-30 w-12 bg-gradient-to-l from-graphite-900 via-graphite-900/80 to-transparent"
        />
      </div>
    </nav>
  );
}
