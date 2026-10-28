import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export const buttonVariants = cva(
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-moon-600 inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:duration-150 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-yellow-500 text-graphite-900 hover:bg-yellow-500/90",
        default: "bg-moon-200 text-graphite-900 hover:bg-moon-100",
        secondary: "bg-graphite-700 text-ink hover:bg-graphite-700",
        outline:
          "border border-line bg-graphite-900 text-muted hover:bg-graphite-800 hover:text-moon-200",
        ghost: "text-muted hover:bg-graphite-800 hover:text-ink",
      },
      size: {
        default: "min-h-10 rounded-xl px-4 text-sm",
        sm: "min-h-9 rounded-lg px-3 text-xs",
        icon: "size-9 rounded-lg p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonVariant =
  NonNullable<VariantProps<typeof buttonVariants>["variant"]> | "unstyled";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<VariantProps<typeof buttonVariants>, "variant"> & {
    asChild?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    variant?: ButtonVariant;
  };

export function Button({
  asChild = false,
  className,
  children,
  leftIcon,
  rightIcon,
  variant,
  size,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  const unstyled = variant === "unstyled";

  return (
    <Component
      className={
        unstyled ? className : cn(buttonVariants({ variant, size }), className)
      }
      {...props}
    >
      {leftIcon && (
        <span
          aria-hidden="true"
          className={
            unstyled
              ? undefined
              : "inline-flex size-4 shrink-0 items-center justify-center [&_svg]:size-full"
          }
          data-icon="left"
        >
          {leftIcon}
        </span>
      )}
      {asChild ? <Slottable>{children}</Slottable> : children}
      {rightIcon && (
        <span
          aria-hidden="true"
          className={
            unstyled
              ? undefined
              : "inline-flex size-4 shrink-0 items-center justify-center [&_svg]:size-full"
          }
          data-icon="right"
        >
          {rightIcon}
        </span>
      )}
    </Component>
  );
}
