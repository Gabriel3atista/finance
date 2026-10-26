"use client";

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import { useLayoutEffect, useRef } from "react";

type NumberToken =
  | { kind: "digit"; key: string; value: string; region: "number" | "affix" }
  | { kind: "static"; key: string; value: string; region: "number" | "affix" };

type LayoutTransition = {
  layout: {
    duration: number;
    ease: typeof DIGIT_EASE;
  };
};

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
  const formattedParts = formatter.formatToParts(value);
  const parts = positionSignBeforeNumber(
    ensureSignSlot(formattedParts, formatter.formatToParts(-1)),
  );
  const formattedValue = parts.map((part) => part.value).join("");
  const tokens = tokenizeParts(parts);
  const numberTokens = tokens.filter((token) => token.region === "number");
  const signToken = tokens.find((token) => token.key === "sign");
  const firstNumberToken = tokens.findIndex((token) => token.region === "number");
  const lastNumberToken = tokens.findLastIndex((token) => token.region === "number");
  const prefixTokens = tokens
    .slice(0, firstNumberToken)
    .filter((token) => token.key !== "sign");
  const suffixTokens = tokens.slice(lastNumberToken + 1);
  const previousDigits = useRef(new Map<string, string>());
  const hasRenderedValue = useRef(false);
  const changedDigitOrder = new Map<string, number>();
  const layoutTransition: LayoutTransition = {
    layout: {
      duration: shouldReduceMotion ? 0.15 : 0.3,
      ease: DIGIT_EASE,
    },
  };

  for (const token of tokens) {
    if (
      token.kind === "digit" &&
      token.region === "number" &&
      hasRenderedValue.current &&
      previousDigits.current.get(token.key) !== token.value
    ) {
      changedDigitOrder.set(token.key, changedDigitOrder.size);
    }
  }

  useLayoutEffect(() => {
    previousDigits.current = new Map(
      tokens.flatMap((token) =>
        token.kind === "digit" && token.region === "number"
          ? [[token.key, token.value] as const]
          : [],
      ),
    );
    hasRenderedValue.current = true;
  }, [tokens]);

  return (
    <span className="inline-flex items-baseline whitespace-pre">
      <span className="sr-only">{formattedValue}</span>
      <LayoutGroup>
        <span aria-hidden="true" className="inline-flex items-baseline whitespace-pre">
          {prefixTokens.map((token) => renderToken(token, layoutTransition, {
            animateOnMount: hasRenderedValue.current && token.kind === "digit" && !previousDigits.current.has(token.key),
            reduceMotion: Boolean(shouldReduceMotion),
            staggerIndex: changedDigitOrder.get(token.key) ?? 0,
          }))}
          <motion.span
            className="relative inline-flex items-baseline whitespace-pre tabular-nums"
            layout="size"
            transition={layoutTransition}
          >
            {signToken?.kind === "digit" ? (
              <AnimatedDigit
                animateOnMount={
                  hasRenderedValue.current &&
                  !previousDigits.current.has(signToken.key)
                }
                className="absolute right-full -mr-4 inline-grid align-baseline"
                digit={signToken.value}
                key={signToken.key}
                layoutTransition={layoutTransition}
                reduceMotion={Boolean(shouldReduceMotion)}
                staggerIndex={0}
              />
            ) : null}
            <motion.span
              animate={{
                transform: signToken?.value
                  ? "translateX(1rem)"
                  : "translateX(0px)",
              }}
              className="inline-flex items-baseline whitespace-pre"
              transition={{
                duration: shouldReduceMotion ? 0.15 : 0.3,
                ease: DIGIT_EASE,
              }}
            >
              {numberTokens.map((token) => renderToken(token, layoutTransition, {
                animateOnMount: hasRenderedValue.current && token.kind === "digit" && !previousDigits.current.has(token.key),
                reduceMotion: Boolean(shouldReduceMotion),
                staggerIndex: changedDigitOrder.get(token.key) ?? 0,
              }))}
            </motion.span>
          </motion.span>
          {suffixTokens.map((token) => renderToken(token, layoutTransition, {
            animateOnMount: hasRenderedValue.current && token.kind === "digit" && !previousDigits.current.has(token.key),
            reduceMotion: Boolean(shouldReduceMotion),
            staggerIndex: changedDigitOrder.get(token.key) ?? 0,
          }))}
        </span>
      </LayoutGroup>
    </span>
  );
}

function renderToken(
  token: NumberToken,
  layoutTransition: LayoutTransition,
  animation: { animateOnMount: boolean; reduceMotion: boolean; staggerIndex: number },
) {
  if (token.kind === "digit") {
    return (
      <AnimatedDigit
        animateOnMount={animation.animateOnMount}
        digit={token.value}
        key={token.key}
        layoutTransition={layoutTransition}
        reduceMotion={animation.reduceMotion}
        staggerIndex={animation.staggerIndex}
      />
    );
  }

  return token.region === "number" ? (
    <motion.span key={token.key} layout transition={layoutTransition}>
      {token.value}
    </motion.span>
  ) : (
    <span key={token.key}>{token.value}</span>
  );
}

function AnimatedDigit({
  digit,
  animateOnMount,
  className = "relative inline-grid align-baseline",
  layoutTransition,
  reduceMotion,
  staggerIndex,
}: {
  digit: string;
  animateOnMount: boolean;
  className?: string;
  layoutTransition: LayoutTransition;
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
    <motion.span
      className={className}
      layout
      transition={layoutTransition}
    >
      <span className="invisible col-start-1 row-start-1">{digit}</span>
      <AnimatePresence custom={custom} initial={animateOnMount} mode="sync">
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
    </motion.span>
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
          region: "number",
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
          region: "number",
        });
      }
      continue;
    }

    const isSign = part.type === "minusSign" || part.type === "plusSign";
    tokens.push({
      kind: isSign ? "digit" : "static",
      key: isSign ? "sign" : `static-${staticIndex++}`,
      value: part.value,
      region: isNumericPart(part.type) ? "number" : "affix",
    });
  }

  return tokens;
}

function ensureSignSlot(
  parts: Intl.NumberFormatPart[],
  negativeParts: Intl.NumberFormatPart[],
): Intl.NumberFormatPart[] {
  if (parts.some((part) => part.type === "minusSign" || part.type === "plusSign")) {
    return parts;
  }

  const minusSignIndex = negativeParts.findIndex((part) => part.type === "minusSign");
  if (minusSignIndex < 0) return parts;

  const signSlot: Intl.NumberFormatPart = { type: "minusSign", value: "" };
  return [...parts, signSlot];
}

function positionSignBeforeNumber(parts: Intl.NumberFormatPart[]) {
  const signIndex = parts.findIndex(
    (part) => part.type === "minusSign" || part.type === "plusSign",
  );
  const numberIndex = parts.findIndex((part) => isNumericPart(part.type));
  if (signIndex < 0 || numberIndex < 0) return parts;

  const result = [...parts];
  const [sign] = result.splice(signIndex, 1);
  const adjustedNumberIndex = result.findIndex((part) => isNumericPart(part.type));
  result.splice(adjustedNumberIndex, 0, sign);
  return result;
}

function isNumericPart(type: Intl.NumberFormatPartTypes): boolean {
  return ["integer", "group", "decimal", "fraction"].includes(type);
}
