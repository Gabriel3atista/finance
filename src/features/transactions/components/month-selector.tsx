"use client";

import { motion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { addMonths, formatDate, monthString } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";

const monthOffsets = Array.from({ length: 9 }, (_, index) => index - 4);
const dragThreshold = 8;
const maskImage =
  "linear-gradient(to right, transparent 39%, black 47%, black 53%, transparent 61%)";

type MonthDrag = {
  pointerId: number;
  startX: number;
  startOffset: number;
  cellWidth: number;
  startMonth: Date;
  didDrag: boolean;
};

export function MonthSelector({
  month,
  onMonthSelect,
  onMonthPreview,
}: {
  month: Date;
  onMonthSelect: (month: Date) => void;
  onMonthPreview?: (month: Date | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<MonthDrag | null>(null);
  const previewRef = useRef<Date | null>(null);
  const suppressClickRef = useRef(false);
  const clickTimerRef = useRef<number | null>(null);
  const [previewMonth, setPreviewMonth] = useState<Date | null>(null);
  const [translateRemainder, setTranslateRemainder] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const displayedMonth = previewMonth ?? month;
  const monthKey = monthString(month);

  function setPreview(nextMonth: Date | null) {
    const previousKey = previewRef.current
      ? monthString(previewRef.current)
      : null;
    const nextKey = nextMonth ? monthString(nextMonth) : null;
    if (previousKey === nextKey) return;

    previewRef.current = nextMonth;
    setPreviewMonth(nextMonth);
    onMonthPreview?.(nextMonth);
  }

  function selectMonth(nextMonth: Date) {
    if (monthString(nextMonth) !== monthKey) onMonthSelect(nextMonth);
  }

  function animateToMonth(nextMonth: Date, relativeMonth: number) {
    if (monthString(nextMonth) === monthKey) return;

    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      selectMonth(nextMonth);
      setTranslateRemainder(0);
      setIsAnimating(false);
      return;
    }

    const width = containerRef.current?.getBoundingClientRect().width ?? 0;
    setContainerWidth(width);
    setIsBouncing(false);
    setIsAnimating(true);
    setTranslateRemainder((-relativeMonth * width) / 7);
    clickTimerRef.current = window.setTimeout(() => {
      selectMonth(nextMonth);
      setTranslateRemainder(0);
      setIsAnimating(false);
      clickTimerRef.current = null;
    }, 180);
  }

  useEffect(
    () => () => {
      if (clickTimerRef.current !== null) {
        window.clearTimeout(clickTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      setContainerWidth(container.getBoundingClientRect().width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest("button");
    if (!(button instanceof HTMLButtonElement)) return;

    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) return;

    const matrix = trackRef.current
      ? new DOMMatrixReadOnly(getComputedStyle(trackRef.current).transform)
      : new DOMMatrixReadOnly();
    const cellWidth = bounds.width / 7;
    setContainerWidth(bounds.width);

    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      setIsAnimating(false);
    }
    setIsBouncing(false);
    setTranslateRemainder(matrix.m41 + cellWidth);

    button.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset: matrix.m41 + cellWidth,
      cellWidth,
      startMonth: displayedMonth,
      didDrag: false,
    };
    setIsDragging(true);
  }

  function updateFromPointer(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return null;

    const totalOffset = drag.startOffset + event.clientX - drag.startX;
    const monthStep = Math.round(-totalOffset / drag.cellWidth);
    const remainder = totalOffset + monthStep * drag.cellWidth;
    const nextMonth = addMonths(drag.startMonth, monthStep);

    setTranslateRemainder(remainder);
    setPreview(nextMonth);
    return { month: nextMonth, remainder };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (!drag.didDrag && Math.abs(event.clientX - drag.startX) < dragThreshold) {
      return;
    }

    drag.didDrag = true;
    suppressClickRef.current = true;
    updateFromPointer(event);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const selection = drag.didDrag ? updateFromPointer(event) : null;
    dragRef.current = null;
    setIsDragging(false);

    if (drag.didDrag) {
      if (selection) selectMonth(selection.month);
      setTranslateRemainder(0);
      setIsAnimating(false);
      setIsBouncing(
        Boolean(
          selection &&
            Math.abs(selection.remainder) > 1 &&
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        ),
      );
      suppressClickRef.current = true;
      window.requestAnimationFrame(() => {
        suppressClickRef.current = false;
      });
    } else {
      setTranslateRemainder(0);
    }

    setPreview(null);
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
    setTranslateRemainder(0);
    setIsBouncing(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsAnimating(false);
    } else {
      setIsAnimating(true);
      clickTimerRef.current = window.setTimeout(() => {
        setIsAnimating(false);
        clickTimerRef.current = null;
      }, 180);
    }
    setPreview(null);
    window.requestAnimationFrame(() => {
      suppressClickRef.current = false;
    });
  }

  const trackTransform =
    containerWidth > 0
      ? `translate3d(${(-containerWidth / 7 + translateRemainder).toFixed(2)}px, 0, 0)`
      : `translate3d(calc(-11.111111% + ${translateRemainder}px), 0, 0)`;
  const trackTransition = isDragging
    ? { duration: 0 }
    : isBouncing
      ? { type: "spring" as const, bounce: 0.12, duration: 0.4 }
      : isAnimating
        ? {
            type: "tween" as const,
            duration: 0.18,
            ease: [0.23, 1, 0.32, 1] as const,
          }
        : { duration: 0 };
  const trackStyle = {
    width: "128.5714%",
  };

  function renderTrack(masked: boolean) {
    return (
      <motion.div
        aria-hidden={masked || undefined}
        animate={{ transform: trackTransform }}
        className={cn("grid grid-cols-9", masked && "pointer-events-none")}
        initial={false}
        onAnimationComplete={
          !masked && isBouncing ? () => setIsBouncing(false) : undefined
        }
        ref={masked ? undefined : trackRef}
        transition={trackTransition}
        style={trackStyle}
      >
        {monthOffsets.map((relativeMonth) => {
          const date = addMonths(displayedMonth, relativeMonth);
          const label = formatDate(date, { month: "long" }).slice(0, 3);
          const key = monthString(date);

          if (masked) {
            return (
              <span
                className="font-kantumruy-pro flex h-10 items-center justify-center text-sm font-medium uppercase text-black"
                key={key}
              >
                {label}
              </span>
            );
          }

          return (
            <Button
              aria-current={relativeMonth === 0 ? "date" : undefined}
              aria-label={formatDate(date, {
                month: "long",
                year: "numeric",
              })}
              className={cn(
                "font-kantumruy-pro h-10 w-full min-w-0 rounded-full px-2 text-sm font-medium uppercase",
                relativeMonth === 0
                  ? "bg-transparent text-muted hover:bg-transparent hover:text-muted"
                  : "bg-transparent text-muted hover:bg-transparent hover:text-ink",
              )}
              key={key}
              onClick={() => {
                if (suppressClickRef.current) return;
                animateToMonth(date, relativeMonth);
              }}
              type="button"
              variant="ghost"
            >
              {label}
            </Button>
          );
        })}
      </motion.div>
    );
  }

  return (
    <nav aria-label="Selecionar mês" className="mx-auto max-w-xl">
      <div
        className="relative isolate min-h-10 cursor-grab overflow-hidden touch-pan-y select-none active:cursor-grabbing"
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={containerRef}
      >
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
