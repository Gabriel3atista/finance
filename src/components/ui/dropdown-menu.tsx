"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { NextIcon } from "@/components/atoms/next-icon";
import type { Icons } from "@/components/icons";
import { cn } from "@/shared/lib/utils";

const dropdownMenuContentVariants = cva(
  "dropdown-menu-content z-[110] rounded-xl border outline-none backdrop-blur-lg",
  {
    variants: {
      variant: {
        default:
          "border-line/30 bg-graphite-800/60 p-1 text-ink shadow-[0_8px_32px_hsl(0_0%_0%/45%)]",
        solid: "border-line bg-graphite-800 p-1 text-ink shadow-xl",
        unstyled:
          "border-transparent bg-transparent p-0 text-inherit shadow-none backdrop-blur-none",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const dropdownMenuItemVariants = cva(
  "flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-ink focus:bg-graphite-800",
        ghost: "text-ink focus:bg-graphite-600",
        destructive: "text-rose-500 focus:bg-rose-500/10 focus:text-rose-400",
        "destructive-ghost":
          "text-rose-500 hover:bg-rose-500/20 focus:bg-rose-500/20 focus:text-rose-500",
        "destructive-subtle":
          "bg-rose-500/20 text-rose-500 focus:bg-rose-500/30 focus:text-rose-500",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

type DropdownMenuContentVariantProps = VariantProps<
  typeof dropdownMenuContentVariants
>;

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  leadingIcon,
  trailingIcon,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
  leadingIcon?: Icons;
  trailingIcon?: Icons;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors focus:bg-graphite-800 data-[state=open]:bg-graphite-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:shrink-0",
        inset && "pl-8",
        className,
      )}
      {...props}
    >
      {leadingIcon && <NextIcon name={leadingIcon} size={16} />}
      {children}
      {trailingIcon && <NextIcon name={trailingIcon} size={16} />}
      <NextIcon name="ChevronRightOutline" size="sm" className="ml-auto" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  variant,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubContent> &
  DropdownMenuContentVariantProps) {
  return (
    <DropdownMenuPrimitive.SubContent
      className={cn(
        dropdownMenuContentVariants({ variant }),
        "min-w-40",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuContent({
  className,
  sideOffset = 6,
  variant,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content> &
  DropdownMenuContentVariantProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        className={cn(
          dropdownMenuContentVariants({ variant }),
          "min-w-48",
          className,
        )}
        sideOffset={sideOffset}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuItem({
  className,
  inset,
  leadingIcon,
  trailingIcon,
  variant = "default",
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  leadingIcon?: Icons;
  trailingIcon?: Icons;
  variant?: VariantProps<typeof dropdownMenuItemVariants>["variant"];
}) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        dropdownMenuItemVariants({ variant }),
        inset && "pl-8",
        className,
      )}
      {...props}
    >
      {leadingIcon && <NextIcon name={leadingIcon} size={16} />}
      {children}
      {trailingIcon && <NextIcon name={trailingIcon} size={16} />}
    </DropdownMenuPrimitive.Item>
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      className={cn(
        "relative flex cursor-default select-none items-center rounded-lg py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:bg-graphite-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-3 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <NextIcon name="CheckOutline" size="xs" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      className={cn(
        "relative flex cursor-default select-none items-center rounded-lg py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:bg-graphite-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="absolute left-3 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <span className="size-1.5 rounded-full bg-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn(
        "px-3 py-2 text-xs font-semibold text-muted",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-line", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-muted", className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
