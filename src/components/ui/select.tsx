"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { NextIcon } from "@/components/atoms/next-icon";
import {
  buttonVariants,
  type ButtonRounded,
  type ButtonTextSize,
  type ButtonVariant,
} from "@/components/ui/button";
import {
  menuContentVariants,
  type MenuContentVariant,
} from "@/components/ui/menu-content-variants";
import { cn } from "@/shared/lib/utils";

type SelectVisuals = {
  controlId: string;
  variant: ButtonVariant;
  size: ButtonTextSize;
  rounded: ButtonRounded;
  loading: boolean;
};

const SelectVisualContext = createContext<SelectVisuals>({
  variant: "default",
  controlId: "",
  size: "default",
  rounded: false,
  loading: false,
});

type SelectProps = ComponentProps<typeof SelectPrimitive.Root> & {
  containerClassName?: string;
  label?: string;
  id?: string;
  loading?: boolean;
  rounded?: ButtonRounded;
  size?: ButtonTextSize;
  variant?: ButtonVariant;
};

export function Select({
  children,
  containerClassName,
  defaultValue,
  disabled = false,
  id,
  label,
  loading = false,
  name,
  onValueChange,
  required = false,
  rounded = false,
  size = "default",
  value,
  variant = "default",
  ...rootProps
}: SelectProps) {
  const isCoarsePointer = useCoarsePointer();
  const generatedId = useId();
  const [uncontrolledValue, setUncontrolledValue] = useState(
    value ?? defaultValue ?? "",
  );
  const selectedValue = value ?? uncontrolledValue;
  const { options, placeholder, triggerProps } = readSelectChildren(children);
  const controlId = id ?? triggerProps.id ?? generatedId;
  const triggerSize = triggerProps.size ?? size;

  function changeValue(nextValue: string) {
    if (value === undefined) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  }

  const visuals = { variant, size: triggerSize, rounded, loading, controlId };

  return (
    <SelectVisualContext.Provider value={visuals}>
      <div
        className={cn(
          "flex w-full min-w-0 shrink-0 flex-col gap-1.5",
          containerClassName,
        )}
      >
        <label
          className={cn("text-xs font-medium text-muted", !label && "sr-only")}
          htmlFor={controlId}
        >
          {label || "Campo de seleção"}
        </label>
        <SelectPrimitive.Root
          {...rootProps}
          defaultValue={undefined}
          disabled={disabled || loading || isCoarsePointer}
          name={isCoarsePointer ? undefined : name}
          onValueChange={changeValue}
          required={isCoarsePointer ? false : required}
          value={selectedValue}
        >
          <div className="relative w-full shrink-0">
            <div className="[@media(pointer:coarse)]:hidden">{children}</div>
            <NativeSelect
              autoComplete={rootProps.autoComplete}
              controlId={controlId}
              disabled={disabled || loading || !isCoarsePointer}
              name={isCoarsePointer ? name : undefined}
              onChange={(event) => changeValue(event.currentTarget.value)}
              options={options}
              placeholder={placeholder}
              required={isCoarsePointer && required}
              selectedValue={selectedValue}
              rounded={rounded}
              size={triggerSize}
              triggerProps={triggerProps}
              variant={variant}
              loading={loading}
            />
          </div>
        </SelectPrimitive.Root>
      </div>
    </SelectVisualContext.Provider>
  );
}

export const SelectGroup = SelectPrimitive.Group;

export function SelectValue({
  className = "",
  ...props
}: ComponentProps<typeof SelectPrimitive.Value>) {
  return (
    <SelectPrimitive.Value
      className={cn(
        "min-w-0 flex-1 truncate text-inherit data-[placeholder]:text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function SelectTrigger({
  className = "",
  children,
  id,
  size,
  ...props
}: Omit<ComponentProps<typeof SelectPrimitive.Trigger>, "size"> & {
  size?: ButtonTextSize;
}) {
  const { controlId, loading, rounded, size: contextSize, variant } =
    useContext(SelectVisualContext);
  const triggerSize = size ?? contextSize;
  const variantClasses =
    variant === "unstyled"
      ? ""
      : cn(
          buttonVariants({ variant, size: triggerSize }),
          rounded && "rounded-full",
        );

  return (
    <SelectPrimitive.Trigger
      aria-busy={loading || undefined}
      className={cn(
        variantClasses,
        "relative w-full shrink-0 cursor-pointer justify-between pr-10 text-left outline-none",
        className,
        rounded && "rounded-full",
        "shrink-0",
      )}
      id={controlId || id}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        aria-hidden="true"
        className="pointer-events-none absolute right-3 text-muted"
      >
        {loading ? (
          <NextIcon
            className="animate-spin motion-reduce:animate-none"
            name="LoadingOutline"
            size={16}
          />
        ) : (
          <NextIcon name="ChevronDownOutline" size={16} />
        )}
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  children,
  className = "",
  position = "popper",
  style,
  variant = "default",
  ...props
}: ComponentProps<typeof SelectPrimitive.Content> & {
  variant?: MenuContentVariant;
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          menuContentVariants({ variant }),
          "ui-select-content z-[120] max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] origin-[var(--radix-select-content-transform-origin)] translate-y-0 opacity-100 transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:!transform-none motion-reduce:transition-opacity motion-reduce:duration-100",
          className,
        )}
        position={position}
        style={{ zIndex: 120, ...style }}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-0.5">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectLabel({
  className = "",
  ...props
}: ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn("px-2 py-1.5 text-xs font-semibold text-muted", className)}
      {...props}
    />
  );
}

type SelectItemProps = ComponentProps<typeof SelectPrimitive.Item>;

export function SelectItem({
  children,
  className = "",
  ...props
}: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex min-h-9 w-full cursor-default select-none items-center rounded-lg py-1.5 pl-2 pr-8 text-sm text-ink outline-none transition-[color,background-color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:duration-100 hover:bg-graphite-600 hover:text-ink focus:bg-graphite-600 focus:text-ink data-[highlighted]:bg-graphite-600 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 inline-flex items-center">
        <NextIcon name="CheckOutline" size={16} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

type NativeOption = { value: string; label: string; disabled?: boolean };
type NativeTriggerProps = {
  id?: string;
  size?: ButtonTextSize;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
};

function NativeSelect({
  autoComplete,
  disabled,
  loading,
  name,
  onChange,
  options,
  placeholder,
  required,
  selectedValue,
  rounded,
  size,
  triggerProps,
  controlId,
  variant,
}: {
  autoComplete?: string;
  disabled: boolean;
  loading: boolean;
  name?: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  options: NativeOption[];
  placeholder?: string;
  required: boolean;
  selectedValue: string;
  rounded: ButtonRounded;
  size: ButtonTextSize;
  triggerProps: NativeTriggerProps;
  controlId: string;
  variant: ButtonVariant;
}) {
  const variantClasses =
    variant === "unstyled"
      ? ""
      : cn(buttonVariants({ variant, size }), rounded && "rounded-full");

  return (
    <div className="relative hidden w-full shrink-0 [@media(pointer:coarse)]:block">
      <select
        aria-busy={loading || undefined}
        aria-label={triggerProps["aria-label"]}
        aria-labelledby={triggerProps["aria-labelledby"]}
        aria-describedby={triggerProps["aria-describedby"]}
        autoComplete={autoComplete}
        className={cn(
          variantClasses,
          "w-full shrink-0 cursor-pointer appearance-none pr-10 text-left mobile-app:focus:!outline-none truncate",
          disabled && "cursor-not-allowed opacity-50",
          rounded && "rounded-full",
          "shrink-0",
        )}
        disabled={disabled}
        id={controlId}
        name={name}
        onChange={onChange}
        required={required}
        value={selectedValue}
      >
        {placeholder && (
          <option disabled={required} value="">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            disabled={option.disabled}
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      >
        {loading ? (
          <NextIcon
            className="animate-spin motion-reduce:animate-none"
            name="LoadingOutline"
            size={16}
          />
        ) : (
          <NextIcon name="ChevronDownOutline" size={16} />
        )}
      </span>
    </div>
  );
}

function useCoarsePointer() {
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const updatePointer = () => setIsCoarsePointer(mediaQuery.matches);

    updatePointer();
    mediaQuery.addEventListener("change", updatePointer);
    return () => mediaQuery.removeEventListener("change", updatePointer);
  }, []);

  return isCoarsePointer;
}

function readSelectChildren(children: ReactNode) {
  const options: NativeOption[] = [];
  let placeholder: string | undefined;
  let triggerProps: NativeTriggerProps = {};

  function visit(node: ReactNode) {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return;

      if (child.type === SelectItem) {
        const itemProps = child.props as SelectItemProps;
        options.push({
          value: itemProps.value,
          label: textContent(itemProps.children),
          disabled: itemProps.disabled,
        });
        return;
      }

      if (child.type === SelectValue) {
        const valueProps = child.props as { placeholder?: string };
        placeholder = valueProps.placeholder;
      }

      if (child.type === SelectTrigger) {
        const props = child.props as NativeTriggerProps;
        triggerProps = {
          id: props.id,
          size: props.size,
          "aria-label": props["aria-label"],
          "aria-labelledby": props["aria-labelledby"],
          "aria-describedby": props["aria-describedby"],
        };
      }

      const nestedChildren = (child.props as { children?: ReactNode }).children;
      if (nestedChildren) visit(nestedChildren);
    });
  }

  visit(children);
  return { options, placeholder, triggerProps };
}

function textContent(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }
      if (isValidElement<{ children?: ReactNode }>(child)) {
        return textContent(child.props.children);
      }
      return "";
    })
    .join("");
}
