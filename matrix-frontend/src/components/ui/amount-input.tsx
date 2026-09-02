import React, { useState, useEffect } from "react";
import { Input } from "./input";

export interface NumericInputProps
  extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value" | "type"> {
  value?: number;
  onChange?: (value: number) => void;
  decimals?: number;
  align?: "left" | "right";
}

export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  (
    { value, onChange, decimals = 2, align = "right", onBlur, onFocus, className, ...props },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [localValue, setLocalValue] = useState("");

    useEffect(() => {
      if (!isFocused) {
        if (value === undefined || isNaN(value)) {
          setLocalValue("");
        } else {
          setLocalValue(
            new Intl.NumberFormat("en-US", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            }).format(value),
          );
        }
      }
    }, [value, isFocused, decimals]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
      const parsed = parseFloat(e.target.value);
      if (onChange) {
        onChange(isNaN(parsed) ? 0 : parsed);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      setLocalValue(value === undefined || isNaN(value) ? "" : value.toFixed(decimals));
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
>((props, ref) => <NumericInput ref={ref} decimals={2} {...props} />);
AmountInput.displayName = "AmountInput";

export const WeightInput = React.forwardRef<
  HTMLInputElement,
  Omit<NumericInputProps, "decimals">
>((props, ref) => <NumericInput ref={ref} decimals={3} {...props} />);
WeightInput.displayName = "WeightInput";
