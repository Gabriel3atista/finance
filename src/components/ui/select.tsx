"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { buttonTempVariants } from "@/components/ui/button-temp";
import { cn } from "@/shared/lib/utils";

type ButtonVariant =
  NonNullable<Parameters<typeof buttonTempVariants>[0]>["variant"] | "unstyled";
type SelectSize = "sm" | "default" | "lg";

type SelectVisuals = {
  variant: ButtonVariant;
  size: SelectSize;
  loading: boolean;
};

const SelectVisualContext = createContext<SelectVisuals>({
  variant: "default",
  size: "default",
  loading: false,
});

type SelectProps = ComponentProps<typeof SelectPrimitive.Root> & {
  loading?: boolean;
  size?: SelectSize;
  variant?: ButtonVariant;
};

export function Select({
  children,
  defaultValue,
  disabled = false,
  loading = false,
  name,
  onValueChange,
  required = false,
  size = "default",
  value,
  variant = "default",
  ...rootProps
}: SelectProps) {
  const isCoarsePointer = useCoarsePointer();
  const [uncontrolledValue, setUncontrolledValue] = useState(
    value ?? defaultValue ?? "",
  );
  const selectedValue = value ?? uncontrolledValue;
  const { options, placeholder, triggerProps } = readSelectChildren(children);

  function changeValue(nextValue: string) {
    if (value === undefined) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  }

  const visuals = { variant, size, loading };

  return (
    <SelectVisualContext.Provider value={visuals}>
      <SelectPrimitive.Root
        {...rootProps}
        defaultValue={undefined}
        disabled={disabled || loading || isCoarsePointer}
        name={isCoarsePointer ? undefined : name}
        onValueChange={changeValue}
        required={isCoarsePointer ? false : required}
        value={selectedValue}
      >
        <div className="relative w-full">
          <div className="[@media(pointer:coarse)]:hidden">{children}</div>
          <NativeSelect
            autoComplete={rootProps.autoComplete}
            disabled={disabled || loading || !isCoarsePointer}
            name={isCoarsePointer ? name : undefined}
            onChange={(event) => changeValue(event.currentTarget.value)}
            options={options}
            placeholder={placeholder}
            required={isCoarsePointer && required}
            selectedValue={selectedValue}
            size={size}
            triggerProps={triggerProps}
            variant={variant}
            loading={loading}
          />
        </div>
      </SelectPrimitive.Root>
    </SelectVisualContext.Provider>
  );
}

export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  className = "",
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  const { loading, size, variant } = useContext(SelectVisualContext);
  const variantClasses =
    variant === "unstyled" ? "" : buttonTempVariants({ variant, size });

  return (
    <SelectPrimitive.Trigger
      aria-busy={loading || undefined}
      className={cn(
        variantClasses,
        "relative w-full cursor-pointer justify-between border border-line px-3 pr-10 text-left font-medium outline-none [@media(pointer:coarse)]:text-base",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        aria-hidden="true"
        className="pointer-events-none absolute right-3 text-muted"
      >
        {loading ? <Spinner /> : <ChevronDown />}
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  children,
  className = "",
  position = "popper",
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          "ui-select-content z-50 max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] origin-[var(--radix-select-content-transform-origin)] translate-y-0 rounded-xl border border-line bg-graphite-900 p-1 text-ink opacity-100 shadow-xl transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:!transform-none motion-reduce:transition-opacity motion-reduce:duration-100",
          className,
        )}
        position={position}
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
        "relative flex min-h-9 w-full cursor-default select-none items-center rounded-lg py-1.5 pl-2 pr-8 text-sm outline-none transition-[color,background-color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:duration-100 focus:bg-graphite-800 focus:text-ink data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 inline-flex items-center">
        <Check />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

type NativeOption = { value: string; label: string; disabled?: boolean };
type NativeTriggerProps = {
  id?: string;
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
  size,
  triggerProps,
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
  size: SelectSize;
  triggerProps: NativeTriggerProps;
  variant: ButtonVariant;
}) {
  const variantClasses =
    variant === "unstyled" ? "" : buttonTempVariants({ variant, size });

  return (
    <div className="relative hidden w-full [@media(pointer:coarse)]:block">
      <select
        {...triggerProps}
        aria-busy={loading || undefined}
        autoComplete={autoComplete}
        className={cn(
          variantClasses,
          "w-full cursor-pointer appearance-none border border-line px-3 pr-10 text-left font-medium [@media(pointer:coarse)]:text-base",
          disabled && "cursor-not-allowed opacity-50",
        )}
        disabled={disabled}
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
        {loading ? <Spinner /> : <ChevronDown />}
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

function ChevronDown() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path
        d="m7 10 5 5 5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="size-4 animate-spin motion-reduce:animate-none"
      fill="none"
      viewBox="0 0 16 16"
    >
      <circle
        className="opacity-25"
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        className="opacity-90"
        d="M14 8a6 6 0 0 0-6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function Check() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
