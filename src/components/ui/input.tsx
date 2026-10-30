import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  containerClassName?: string;
  label?: string;
};

export function Input({
  className = "",
  containerClassName,
  id,
  label,
  type,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const input = (
    <input
      className={cn(
        "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-moon-100 mobile-app:focus:!outline-none mobile-app:focus:!border-graphite-300 min-h-10 w-full shrink-0 rounded-xl border border-line/30 bg-graphite-700 px-3 text-sm font-normal text-ink outline-none placeholder:text-muted transition-[color,background-color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:duration-100 [@media(pointer:coarse)]:text-base focus:border-graphite-300",
        className,
        "shrink-0",
        type === "date" &&
          "h-10 min-w-0 max-w-full appearance-none py-0 leading-normal [@media(pointer:coarse)]:text-base",
      )}
      id={inputId}
      type={type}
      {...props}
    />
  );

  if (type === "hidden") return input;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 shrink-0 flex-col gap-1.5",
        containerClassName,
      )}
    >
      <label
        className={cn("text-xs font-medium text-muted", !label && "sr-only")}
        htmlFor={inputId}
      >
        {label || "Campo de entrada"}
      </label>
      {input}
    </div>
  );
}
