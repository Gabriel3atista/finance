import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
};

const variants = {
  default: "bg-primary-200 text-background-900 hover:bg-primary-100",
  secondary: "bg-secondary-800 text-ink hover:bg-secondary-700",
  outline:
    "border border-line bg-secondary-900 text-foreground-400 hover:bg-secondary-800 hover:text-primary-200",
  ghost: "text-muted hover:bg-secondary-800 hover:text-ink",
};

const sizes = {
  default: "min-h-10 rounded-xl px-4 text-sm",
  sm: "min-h-9 rounded-lg px-3 text-xs",
  icon: "size-9 rounded-lg p-0",
};

export function Button({
  asChild = false,
  className = "",
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      className={`focus-ring inline-flex items-center justify-center gap-2 font-medium transition-colors active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
