import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "ui-control focus-ring min-h-10 w-full rounded-xl border border-line bg-secondary-900 px-3 text-sm font-normal text-moon-200 outline-none placeholder:text-foreground-500 focus:border-moon-600",
        className,
      )}
      {...props}
    />
  );
}
