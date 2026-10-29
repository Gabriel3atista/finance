import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium leading-none transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-yellow-500 text-graphite-900",
        default: "bg-moon-200 text-graphite-900",
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
  VariantProps<typeof badgeVariants>;

export function Badge({ className, size, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ size, variant }), className)}
      {...props}
    />
  );
}
