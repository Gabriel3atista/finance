import type { ComponentType, SVGProps } from "react";
import { iconsMap, type Icons } from "@/components/icons";
import { cn } from "@/shared/lib/utils";

export type NextIconSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface NextIconProps extends SVGProps<SVGSVGElement> {
  name: Icons;
  size?: NextIconSize | number;
}

const sizes: Record<NextIconSize, number> = {
  xs: 16,
  sm: 18,
  md: 20,
  lg: 26,
  xl: 34,
};

export function NextIcon({
  name,
  size = "md",
  className,
  ...props
}: NextIconProps) {
  const Icon = iconsMap[name] as ComponentType<SVGProps<SVGSVGElement>>;
  if (!Icon) return null;

  const iconSize = typeof size === "number" ? size : sizes[size];
  const isLabeled = Boolean(props["aria-label"]) || props.role === "img";

  return (
    <Icon
      {...props}
      aria-hidden={props["aria-hidden"] ?? !isLabeled}
      className={cn("block shrink-0", className)}
      height={iconSize}
      width={iconSize}
    />
  );
}
