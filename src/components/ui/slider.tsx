"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";

export function Slider({
  "aria-label": ariaLabel,
  className,
  step = 1,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex w-full touch-none select-none items-center py-2",
        className,
      )}
      step={step}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-4 w-full grow overflow-hidden rounded-lg bg-graphite-600">
        <SliderPrimitive.Range className="absolute h-full rounded-lg bg-accent" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={ariaLabel}
        className="block h-3 w-0.5 rounded-full bg-moon-100 outline-none transition-[box-shadow,transform] duration-150 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite-800 active:scale-110"
      />
    </SliderPrimitive.Root>
  );
}
