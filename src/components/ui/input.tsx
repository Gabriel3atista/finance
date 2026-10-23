import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`focus-ring min-h-10 w-full rounded-xl border border-line bg-secondary-900 px-3 text-sm font-normal text-primary-200 outline-none transition-colors placeholder:text-foreground-500 focus:border-primary-600 ${className}`}
      {...props}
    />
  );
}
