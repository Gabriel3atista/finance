import { Slot } from "@radix-ui/react-slot";
import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean;
  sections?: boolean;
};

export function Card({
  asChild = false,
  className = "",
  sections = false,
  ...props
}: CardProps) {
  const Component = asChild ? Slot : "div";

  return (
    <Component
      className={cn(
        "rounded-2xl border border-graphite-600 bg-graphite-700 shadow-card",
        sections && "divide-y divide-line",
        className,
      )}
      {...props}
    />
  );
}

export function CardSection({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-3", className)} {...props} />;
}

export function CardHeader({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <CardSection className={className} {...props} />;
}

export function CardTitle({
  className = "",
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-[15px] font-semibold text-ink", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className = "",
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted", className)} {...props} />;
}

export function CardContent({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <CardSection className={className} {...props} />;
}
