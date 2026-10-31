"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { useId, type ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";

type SwitchProps = ComponentProps<typeof SwitchPrimitive.Root> & {
  label?: string;
};

export function Switch({
  className,
  id,
  label,
  ...props
}: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  return (
    <div className="flex w-full min-w-0 shrink-0 items-center justify-between gap-3">
      <label
        className={cn("text-sm font-medium text-muted", !label && "sr-only")}
        htmlFor={switchId}
      >
        {label || "Opção"}
      </label>
      <SwitchPrimitive.Root
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-graphite-600 transition-colors data-[state=checked]:bg-accent focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-moon-200 mobile-app:focus-visible:!outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        id={switchId}
        {...props}
      >
        <SwitchPrimitive.Thumb className="pointer-events-none block size-5 translate-x-0.5 rounded-full bg-moon-100 shadow-sm transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] data-[state=checked]:translate-x-[22px] motion-reduce:transition-none" />
      </SwitchPrimitive.Root>
    </div>
  );
}
