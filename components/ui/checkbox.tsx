"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "checked"> {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = checked === "indeterminate";
      }
    }, [checked]);

    const isChecked = checked === true;
    const isIndeterminate = checked === "indeterminate";

    return (
      <label
        className={cn(
          "relative inline-flex items-center justify-center w-4 h-4 rounded border transition-all cursor-pointer select-none shrink-0",
          isChecked || isIndeterminate
            ? "bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500 shadow-xs"
            : "bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 hover:border-blue-500",
          disabled && "opacity-40 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        <input
          type="checkbox"
          ref={inputRef}
          checked={isChecked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only"
          {...props}
        />
        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
        {isIndeterminate && <Minus className="w-3 h-3 stroke-[3]" />}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
