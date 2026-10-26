"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef } from "react";

type NumberToken =
  | { kind: "digit"; key: string; value: string }
  | { kind: "static"; key: string; value: string };

const DIGIT_STAGGER_SECONDS = 0.1;
const DIGIT_EASE = [0.77, 0, 0.175, 1] as const;

export function AnimatedNumber({
  value,
  locale = "pt-BR",
  format = {},
}: {
  value: number;
  locale?: Intl.LocalesArgument;
  format?: Intl.NumberFormatOptions;
}) {
  const shouldReduceMotion = useReducedMotion();
  const formatter = new Intl.NumberFormat(locale, format);
  const parts = formatter.formatToParts(value);
  const formattedValue = parts.map((part) => part.value).join("");
  const tokens = tokenizeParts(parts);
  const previousDigits = useRef(new Map<string, string>());
  const changedDigitOrder = new Map<string, number>();

  for (const token of tokens) {
    if (
      token.kind === "digit" &&
      previousDigits.current.has(token.key) &&
      previousDigits.current.get(token.key) !== token.value
    ) {
      changedDigitOrder.set(token.key, changedDigitOrder.size);
    }
  }

  useLayoutEffect(() => {
    previousDigits.current = new Map(
      tokens.flatMap((token) =>
        token.kind === "digit" ? [[token.key, token.value] as const] : [],
      ),
    );
  }, [tokens]);

  return (
    <span className="inline-flex items-baseline whitespace-pre">
      <span className="sr-only">{formattedValue}</span>
      <span
        aria-hidden="true"
        className="inline-flex items-baseline whitespace-pre tabular-nums"
      >
        {tokens.map((token) =>
          token.kind === "digit" ? (
            <AnimatedDigit
              digit={token.value}
              key={token.key}
              reduceMotion={Boolean(shouldReduceMotion)}
              staggerIndex={changedDigitOrder.get(token.key) ?? 0}
            />
          ) : (
            <span key={token.key}>{token.value}</span>
          ),
        )}
      </span>
    </span>
  );
}

function AnimatedDigit({
  digit,
  reduceMotion,
  staggerIndex,
}: {
  digit: string;
  reduceMotion: boolean;
  staggerIndex: number;
}) {
  const duration = reduceMotion ? 0.15 : 0.6;
  const custom = {
    delay: reduceMotion ? 0 : staggerIndex * DIGIT_STAGGER_SECONDS,
    duration,
    enteringY: reduceMotion ? 0 : -12,
    exitingY: reduceMotion ? 0 : 12,
    blur: reduceMotion ? 0 : 4,
  };
  const digitVariants = {
    enter: (options: typeof custom) => ({
      y: options.enteringY,
      opacity: 0,
      filter: `blur(${options.blur}px)`,
    }),
    current: (options: typeof custom) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        duration: options.duration,
        delay: options.delay,
        ease: DIGIT_EASE,
      },
    }),
    exit: (options: typeof custom) => ({
      y: options.exitingY,
      opacity: 0,
      filter: `blur(${options.blur}px)`,
      transition: {
        duration: options.duration,
        delay: options.delay,
        ease: DIGIT_EASE,
      },
    }),
  };

  return (
    <span className="relative inline-grid align-baseline">
      <span className="invisible col-start-1 row-start-1">{digit}</span>
      <AnimatePresence custom={custom} initial={false} mode="sync">
        <motion.span
          animate="current"
          className="col-start-1 row-start-1"
          custom={custom}
          exit="exit"
          initial="enter"
          key={digit}
          variants={digitVariants}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function tokenizeParts(parts: Intl.NumberFormatPart[]): NumberToken[] {
  const integerDigitCount = parts
    .filter((part) => part.type === "integer")
    .reduce((count, part) => count + Array.from(part.value).length, 0);
  let integerIndex = 0;
  let fractionIndex = 0;
  let staticIndex = 0;

  const tokens: NumberToken[] = [];

  for (const part of parts) {
    if (part.type === "integer") {
      for (const digit of Array.from(part.value)) {
        const position = integerDigitCount - integerIndex - 1;
        integerIndex += 1;
        tokens.push({
          kind: "digit",
          key: `integer-${position}`,
          value: digit,
        });
      }
      continue;
    }

    if (part.type === "fraction") {
      for (const digit of Array.from(part.value)) {
        tokens.push({
          kind: "digit",
          key: `fraction-${fractionIndex++}`,
          value: digit,
        });
      }
      continue;
    }

    tokens.push({
      kind: "static",
      key: `static-${staticIndex++}`,
      value: part.value,
    });
  }

  return tokens;
}
