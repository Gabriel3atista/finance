"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/shared/lib/utils";

const drawerMotionStyle: React.CSSProperties = {
  animationDuration: "250ms",
  animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
  transitionDuration: "250ms",
  transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
};

type DrawerAnimationConfig =
  | "autoFocus"
  | "direction"
  | "onAnimationEnd"
  | "repositionInputs"
  | "shouldScaleBackground";
type OmitDrawerAnimationConfig<T> = T extends unknown
  ? Omit<T, DrawerAnimationConfig>
  : never;
type DrawerRootProps = OmitDrawerAnimationConfig<
  React.ComponentProps<typeof DrawerPrimitive.Root>
> & { onCloseComplete?: () => void };

const Drawer = ({ onCloseComplete, ...props }: DrawerRootProps) => (
  <DrawerPrimitive.Root
    {...props}
    autoFocus={false}
    direction="bottom"
    onAnimationEnd={(open) => {
      if (!open) onCloseComplete?.();
    }}
    repositionInputs={false}
    shouldScaleBackground={false}
  />
);
Drawer.displayName = "Drawer";

const DrawerNested = ({ onCloseComplete, ...props }: DrawerRootProps) => (
  <DrawerPrimitive.NestedRoot
    {...props}
    autoFocus={false}
    direction="bottom"
    onAnimationEnd={(open) => {
      if (!open) onCloseComplete?.();
    }}
    repositionInputs={false}
    shouldScaleBackground={false}
  />
);
DrawerNested.displayName = "DrawerNested";

export type DrawerControllerOptions = {
  canClose?: () => boolean;
  onCloseComplete?: () => void;
  onOpenChange?: (open: boolean) => void;
};

export type DrawerController = ReturnType<typeof useDrawer>;

export function useDrawer(options: DrawerControllerOptions = {}) {
  const [open, setOpen] = React.useState(false);
  const openRef = React.useRef(false);
  const optionsRef = React.useRef(options);
  optionsRef.current = options;

  const onOpenChange = React.useCallback((nextOpen: boolean) => {
    if (!nextOpen && optionsRef.current.canClose?.() === false) return;

    openRef.current = nextOpen;
    setOpen(nextOpen);
    optionsRef.current.onOpenChange?.(nextOpen);
  }, []);

  const onCloseComplete = React.useCallback(() => {
    if (!openRef.current) optionsRef.current.onCloseComplete?.();
  }, []);

  const openDrawer = React.useCallback(
    () => onOpenChange(true),
    [onOpenChange],
  );
  const closeDrawer = React.useCallback(
    () => onOpenChange(false),
    [onOpenChange],
  );

  return {
    open,
    props: { open, onOpenChange, onCloseComplete },
    openDrawer,
    closeDrawer,
    toggleDrawer: open ? closeDrawer : openDrawer,
  };
}

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, style, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    data-app-drawer="true"
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    style={{ ...drawerMotionStyle, ...style }}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, onPointerDown, style, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      data-app-drawer="true"
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || !(event.target instanceof Element))
          return;

        const fieldSelector =
          "input, textarea, select, [contenteditable='true']";
        const target = event.target;
        const label = target.closest("label");
        if (
          target.closest(fieldSelector) ||
          label?.querySelector(fieldSelector)
        ) {
          return;
        }

        const activeElement = document.activeElement;
        if (
          activeElement instanceof HTMLElement &&
          activeElement.matches(fieldSelector)
        ) {
          activeElement.blur();
        }
      }}
      className={cn(
        "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] standalone:bottom-0 standalone:pb-[env(safe-area-inset-bottom,0px)] z-50 mt-24 flex h-auto max-h-[80dvh] min-h-0 flex-col overflow-hidden rounded-[28px] border border-line/30 bg-graphite-800/60 p-0 text-ink shadow-[0_8px_32px_hsl(0_0%_0%/45%)] backdrop-blur-lg",
        className,
      )}
      style={{ ...drawerMotionStyle, ...style }}
      {...props}
    >
      <div className="mx-auto mt-2 h-[4px] w-[64px] shrink-0 rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "grid shrink-0 gap-1.5 p-3 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex shrink-0 flex-col gap-2 px-3 py-3", className)}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "min-h-0 flex-1 overflow-y-auto overscroll-contain px-3",
      className,
    )}
    {...props}
  />
);
DrawerBody.displayName = "DrawerBody";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted", className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerNested,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerBody,
  DrawerTitle,
  DrawerDescription,
};
