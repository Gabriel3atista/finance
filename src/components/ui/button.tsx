import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "sm";
};

export function Button({
  className = "",
  variant = "primary",
  size = "default",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-accent text-white hover:bg-[#274b39]",
    secondary: "border border-line bg-white text-ink hover:bg-canvas",
    ghost: "text-muted hover:bg-canvas hover:text-ink",
  };
  const sizes = {
    default: "min-h-10 rounded-xl px-4 text-sm",
    sm: "min-h-9 rounded-lg px-3 text-xs",
  };

  return (
    <button
      className={`focus-ring inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
