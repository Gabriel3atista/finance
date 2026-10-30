import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { NextIcon } from "@/components/atoms/next-icon";
import type { Icons } from "@/components/icons";
import { cn } from "@/shared/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium leading-none transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-yellow-500 text-graphite-900",
        default: "bg-moon-200 text-graphite-900",
        white: "bg-white text-graphite-900",
        secondary: "bg-graphite-600 text-ink",
        outline: "border border-line bg-graphite-900 text-moon-100",
        ghost: "text-muted",
        destructive: "bg-rose-500 text-white",
      },
      size: {
        sm: "min-h-5 px-2 py-0.5 text-[10px]",
        default: "min-h-6 px-2.5 py-1 text-xs",
        lg: "min-h-7 px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type BadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>["variant"]
>;
export type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>["size"]>;

export type BadgeProps = ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    leadingIcon?: Icons;
    trailingIcon?: Icons;
  };

const badgeIconSizes: Record<BadgeSize, number> = {
  sm: 12,
  default: 14,
  lg: 16,
};

export function Badge({
  children,
  className,
  leadingIcon,
  size = "default",
  trailingIcon,
  variant,
  ...props
}: BadgeProps) {
  const iconSize = badgeIconSizes[size ?? "default"];

  return (
    <span
      className={cn(
        badgeVariants({ size, variant }),
        (leadingIcon || trailingIcon) && "gap-1.5",
        className,
      )}
      {...props}
    >
      {leadingIcon && <NextIcon name={leadingIcon} size={iconSize} />}
      {children}
      {trailingIcon && <NextIcon name={trailingIcon} size={iconSize} />}
    </span>
  );
}
