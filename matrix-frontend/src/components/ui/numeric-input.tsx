import React, { useState, useEffect } from "react";
import { Input } from "./input";

export interface NumericInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "onChange" | "value" | "type"
> {
  value?: number | string;
  onChange?: (value: number) => void;
  decimals?: number;
  align?: "left" | "right";
  useGrouping?: boolean;
}

export const NumericInput = React.forwardRef<
  HTMLInputElement,
  NumericInputProps
>(
  (
    {
      value,
      onChange,
      decimals = 2,
      align = "right",
      useGrouping = true,
      onBlur,
      onFocus,
      className,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [localValue, setLocalValue] = useState("");

    useEffect(() => {
      if (!isFocused) {
        const clean =
          typeof value === "string" ? value.replace(/,/g, "") : value;
        const numValue = typeof clean === "string" ? parseFloat(clean) : clean;
        if (
          numValue == null ||
          typeof numValue !== "number" ||
          isNaN(numValue)
        ) {
          setLocalValue("");
        } else if (useGrouping) {
          setLocalValue(
            new Intl.NumberFormat("en-US", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
              useGrouping: true,
            }).format(numValue),
          );
        } else {
          setLocalValue(numValue.toFixed(decimals));
        }
      }
    }, [value, isFocused, decimals, useGrouping]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
      const clean = e.target.value.replace(/,/g, "");
      const parsed = parseFloat(clean);
      if (onChange) {
        onChange(isNaN(parsed) ? 0 : parsed);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      const clean = typeof value === "string" ? value.replace(/,/g, "") : value;
      const numValue = typeof clean === "string" ? parseFloat(clean) : clean;
      const isValid =
        numValue != null && typeof numValue === "number" && !isNaN(numValue);
      setLocalValue(isValid ? numValue.toFixed(decimals) : "");
      setTimeout(() => e.target.select(), 0);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    return (
      <Input
        ref={ref}
        type={isFocused ? "number" : "text"}
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`${align === "right" ? "text-right" : "text-left"} ${className || ""}`}
        {...props}
      />
    );
  },
);
NumericInput.displayName = "NumericInput";

export const AmountInput = React.forwardRef<
  HTMLInputElement,
  Omit<NumericInputProps, "decimals">
>((props, ref) => (
  <NumericInput ref={ref} decimals={2} useGrouping={true} {...props} />
));
AmountInput.displayName = "AmountInput";

export const WeightInput = React.forwardRef<
  HTMLInputElement,
  Omit<NumericInputProps, "decimals">
>((props, ref) => (
  <NumericInput ref={ref} decimals={3} useGrouping={false} {...props} />
));
WeightInput.displayName = "WeightInput";
