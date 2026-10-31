import { cva, type VariantProps } from "class-variance-authority";

export const menuContentVariants = cva(
  "rounded-xl border outline-none backdrop-blur-lg",
  {
    variants: {
      variant: {
        default:
          "border-line/30 bg-graphite-800/60 p-1 text-ink shadow-[0_8px_32px_hsl(0_0%_0%/45%)]",
        solid: "border-line bg-graphite-800 p-1 text-ink shadow-xl",
        unstyled:
          "border-transparent bg-transparent p-0 text-inherit shadow-none backdrop-blur-none",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type MenuContentVariant = NonNullable<
  VariantProps<typeof menuContentVariants>["variant"]
>;
