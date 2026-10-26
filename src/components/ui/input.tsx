import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-moon-600 min-h-10 w-full rounded-xl border border-line bg-secondary-900 px-3 text-sm font-normal text-moon-200 outline-none placeholder:text-foreground-500 transition-[color,background-color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:duration-100 [@media(pointer:coarse)]:text-base focus:border-moon-600",
        className,
      )}
      {...props}
    />
  );
}
