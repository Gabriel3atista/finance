import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
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
      className={cn(
        "ui-button focus-ring inline-flex items-center justify-center gap-2 font-medium disabled:pointer-events-none disabled:opacity-50",
        variant === "default" &&
          "bg-moon-200 text-background-900 hover:bg-moon-100",
        variant === "secondary" &&
          "bg-secondary-800 text-ink hover:bg-secondary-700",
        variant === "outline" &&
          "border border-line bg-secondary-900 text-foreground-400 hover:bg-secondary-800 hover:text-moon-200",
        variant === "ghost" && "text-muted hover:bg-secondary-800 hover:text-ink",
        size === "default" && "min-h-10 rounded-xl px-4 text-sm",
        size === "sm" && "min-h-9 rounded-lg px-3 text-xs",
        size === "icon" && "size-9 rounded-lg p-0",
        className,
      )}
      {...props}
    />
  );
}
