"use client";

import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type {
  ButtonHTMLAttributes,
  MouseEvent,
  MouseEventHandler,
  ReactNode,
} from "react";
import { NextIcon } from "@/components/atoms/next-icon";
import type { Icons } from "@/components/icons";
import { cn } from "@/shared/lib/utils";

export const buttonVariants = cva(
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-moon-200 mobile-app:focus:!outline-none inline-flex shrink-0 items-center justify-center font-medium transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:duration-150 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-yellow-500 text-graphite-900 hover:bg-yellow-500/90 active:bg-yellow-500/80",
        default:
          "bg-moon-200 text-graphite-900 hover:bg-moon-200/90 active:bg-moon-200/80",
        destructive:
          "bg-rose-500 text-moon-100 hover:bg-rose-500/90 active:bg-rose-500/80",
        "destructive-subtle":
          "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 active:bg-rose-500/30",
        secondary:
          "bg-graphite-700 text-ink hover:bg-graphite-600  active:bg-graphite-600/90",
        outline:
          "border border-line bg-graphite-900 text-moon-100 hover:bg-graphite-800 hover:text-moon-200",
        ghost: "text-muted hover:bg-graphite-800 hover:text-ink",
      },
      size: {
        sm: "min-h-8 gap-1.5 rounded-lg px-2 text-sm [&_[data-button-icon]]:size-[14px]",
        default:
          "min-h-10 gap-2 rounded-xl px-3 text-sm [&_[data-button-icon]]:size-4",
        lg: "min-h-12 gap-2.5 rounded-xl px-3 text-base [&_[data-button-icon]]:size-5",
        "icon-sm":
          "size-8 rounded-lg p-0 text-xs [&_[data-button-icon]]:size-[14px]",
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

export type ButtonVariant =
  NonNullable<VariantProps<typeof buttonVariants>["variant"]> | "unstyled";
export type ButtonTextSize = "sm" | "default" | "lg";
export type ButtonRounded = boolean;
type IconSize = "icon-sm" | "icon" | "icon-lg";
export type ButtonIcon = Icons;

type ButtonBaseProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children"
> & {
  asChild?: boolean;
  loading?: boolean;
  rounded?: ButtonRounded;
  variant?: ButtonVariant;
};

type ButtonProps = ButtonBaseProps &
  (
    | {
        "aria-label"?: string;
        children: ReactNode;
        icon?: never;
        leadingIcon?: ButtonIcon;
        size?: ButtonTextSize;
        trailingIcon?: ButtonIcon;
      }
    | {
        "aria-label": string;
        children?: never;
        icon: ButtonIcon;
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
    <NextIcon
      className="animate-spin motion-reduce:animate-none"
      name="Loading"
      size={16}
    />
  );
}

function getContentPadding(
  size: ButtonTextSize | IconSize | undefined,
  hasLeadingIcon: boolean,
  hasTrailingIcon: boolean,
) {
  if (hasLeadingIcon && hasTrailingIcon) return undefined;

  const paddingClasses =
    size === "sm"
      ? { both: "px-2.5", left: "pl-2.5", right: "pr-2.5" }
      : { both: "px-3.5", left: "pl-3.5", right: "pr-3.5" };

  if (hasLeadingIcon) return paddingClasses.right;
  if (hasTrailingIcon) return paddingClasses.left;
  return paddingClasses.both;
}

export function Button({
  asChild = false,
  className,
  children,
  disabled = false,
  icon,
  leadingIcon,
  loading = false,
  onClick,
  rounded,
  size,
  tabIndex,
  trailingIcon,
  variant,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  const unstyled = variant === "unstyled";
  const unavailable = disabled || loading;
  const isIconOnly = icon !== undefined;
  const contentPadding = isIconOnly
    ? undefined
    : getContentPadding(
        size,
        loading || Boolean(leadingIcon),
        !loading && Boolean(trailingIcon),
      );
  const classNames = unstyled
    ? cn(className, rounded && "rounded-full", "shrink-0")
    : cn(
        buttonVariants({ variant, size }),
        contentPadding,
        asChild && unavailable && "pointer-events-none opacity-50",
        className,
        rounded && "rounded-full",
        "shrink-0",
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
        <IconSlot>{loading ? <Spinner /> : <NextIcon name={icon} />}</IconSlot>
      ) : (
        <>
          {(loading || leadingIcon) && (
            <IconSlot>
              {loading ? (
                <Spinner />
              ) : leadingIcon ? (
                <NextIcon name={leadingIcon} />
              ) : null}
            </IconSlot>
          )}
          <Slottable>{children}</Slottable>
          {!loading && trailingIcon && (
            <IconSlot>
              <NextIcon name={trailingIcon} />
            </IconSlot>
          )}
        </>
      )}
    </Component>
  );
}
