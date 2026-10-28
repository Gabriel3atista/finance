"use client";

import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type {
  ButtonHTMLAttributes,
  MouseEvent,
  MouseEventHandler,
  ReactNode,
} from "react";
import { cn } from "@/shared/lib/utils";

export const buttonTempVariants = cva(
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-moon-600 inline-flex items-center justify-center font-medium transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:duration-150 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-moon-200 text-graphite-900 hover:bg-moon-100",
        secondary: "bg-graphite-700 text-ink hover:bg-graphite-700",
        outline:
          "border border-line bg-graphite-900 text-muted hover:bg-graphite-800 hover:text-moon-200",
        ghost: "text-muted hover:bg-graphite-800 hover:text-ink",
      },
      size: {
        sm: "min-h-8 gap-1.5 rounded-lg px-3 text-xs [&_[data-button-icon]]:size-3",
        default:
          "min-h-10 gap-2 rounded-xl px-4 text-sm [&_[data-button-icon]]:size-4",
        lg: "min-h-12 gap-2.5 rounded-xl px-5 text-base [&_[data-button-icon]]:size-5",
        "icon-sm":
          "size-8 rounded-lg p-0 text-xs [&_[data-button-icon]]:size-3",
        icon: "size-10 rounded-xl p-0 text-sm [&_[data-button-icon]]:size-4",
        "icon-lg":
          "size-12 rounded-xl p-0 text-base [&_[data-button-icon]]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonTempVariant =
  NonNullable<VariantProps<typeof buttonTempVariants>["variant"]> | "unstyled";
type TextSize = "sm" | "default" | "lg";
type IconSize = "icon-sm" | "icon" | "icon-lg";

type ButtonTempBaseProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children"
> & {
  asChild?: boolean;
  loading?: boolean;
  variant?: ButtonTempVariant;
};

type ButtonTempProps = ButtonTempBaseProps &
  (
    | {
        "aria-label"?: string;
        children: ReactNode;
        icon?: never;
        leadingIcon?: ReactNode;
        size?: TextSize;
        trailingIcon?: ReactNode;
      }
    | {
        "aria-label": string;
        children?: never;
        icon: ReactNode;
        leadingIcon?: never;
        size?: IconSize;
        trailingIcon?: never;
      }
  );

function IconSlot({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center [&_svg]:size-full"
      data-button-icon
    >
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="animate-spin motion-reduce:animate-none"
      fill="none"
      viewBox="0 0 16 16"
    >
      <circle
        className="opacity-25"
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        className="opacity-90"
        d="M14 8a6 6 0 0 0-6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function ButtonTemp({
  asChild = false,
  className,
  children,
  disabled = false,
  icon,
  leadingIcon,
  loading = false,
  onClick,
  size,
  tabIndex,
  trailingIcon,
  variant,
  ...props
}: ButtonTempProps) {
  const Component = asChild ? Slot : "button";
  const unstyled = variant === "unstyled";
  const unavailable = disabled || loading;
  const isIconOnly = icon !== undefined;
  const classNames = unstyled
    ? className
    : cn(
        buttonTempVariants({ variant, size }),
        asChild && unavailable && "pointer-events-none opacity-50",
        className,
      );

  const handleClick: MouseEventHandler<HTMLButtonElement> = (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    if (unavailable && asChild) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event);
  };

  return (
    <Component
      aria-busy={loading || undefined}
      aria-disabled={asChild && unavailable ? true : undefined}
      aria-label={props["aria-label"]}
      className={classNames}
      disabled={asChild ? undefined : unavailable}
      onClick={handleClick}
      tabIndex={asChild && unavailable ? -1 : tabIndex}
      {...props}
    >
      {isIconOnly ? (
        <IconSlot>{loading ? <Spinner /> : icon}</IconSlot>
      ) : (
        <>
          {(loading || leadingIcon) && (
            <IconSlot>{loading ? <Spinner /> : leadingIcon}</IconSlot>
          )}
          <Slottable>{children}</Slottable>
          {!loading && trailingIcon && <IconSlot>{trailingIcon}</IconSlot>}
        </>
      )}
    </Component>
  );
}
