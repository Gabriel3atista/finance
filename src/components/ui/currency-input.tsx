import type { Ref } from "react";
import { NumericFormat } from "react-number-format";
import { Input, type InputProps } from "@/components/ui/input";

type CurrencyInputProps = Pick<
  InputProps,
  "className" | "containerClassName" | "error" | "label" | "placeholder"
> & {
  name: string;
  value: string;
  onBlur: () => void;
  onValueChange: (value: string) => void;
  inputRef?: Ref<HTMLInputElement>;
};

export function CurrencyInput({
  inputRef,
  onBlur,
  onValueChange,
  ...props
}: CurrencyInputProps) {
  return (
    <NumericFormat<InputProps>
      {...props}
      allowNegative={false}
      customInput={Input}
      decimalScale={2}
      decimalSeparator=","
      getInputRef={inputRef}
      inputMode="decimal"
      onBlur={onBlur}
      onValueChange={(values, sourceInfo) => {
        if (sourceInfo.source === "event") onValueChange(values.value);
      }}
      thousandSeparator="."
      type="text"
      valueIsNumericString
    />
  );
}
