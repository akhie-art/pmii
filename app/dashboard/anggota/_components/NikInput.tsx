"use client";

import React from "react";

interface NikInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function formatNikDisplay(val: string) {
  const digits = (val || "").replace(/\D/g, "").slice(0, 16);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(" ");
}

export default function NikInput({ value, onChange, disabled = false }: NikInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  const handleBoxClick = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const rawVal = e.target.value.replace(/\D/g, "");
    onChange(rawVal.slice(0, 16));
  };

  const safeVal = value || "";

  return (
    <div className="relative w-full">
      {/* Mobile View (< sm): Formatted single input with 4-digit grouping to prevent squishing */}
      <div className="sm:hidden relative flex items-center">
        <input
          disabled={disabled}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={19} // 16 digits + 3 spaces
          placeholder="3201 0000 0000 0001"
          value={formatNikDisplay(safeVal)}
          onChange={handleInputChange}
          className={`w-full h-9 px-3 pr-14 text-xs font-mono tracking-widest border rounded-lg transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-zinc-400 ${
            disabled
              ? "bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 cursor-default"
              : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          }`}
        />
        <div className="absolute right-2.5 flex items-center gap-1 pointer-events-none">
          <span
            className={`text-[10px] font-mono font-medium ${
              safeVal.length === 16
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-zinc-400"
            }`}
          >
            {safeVal.length}/16
          </span>
        </div>
      </div>

      {/* Desktop/Tablet View (sm+): 16 individual visual boxes */}
      <div className="hidden sm:block relative w-full">
        {/* Hidden input */}
        <input
          ref={inputRef}
          disabled={disabled}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={16}
          value={safeVal}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`absolute inset-0 w-full h-full opacity-0 z-10 ${disabled ? "cursor-default pointer-events-none" : "cursor-pointer"}`}
        />

        {/* 16 Visual Digits Boxes */}
        <div className="flex items-center gap-1 w-full justify-between select-none">
          {Array.from({ length: 16 }).map((_, index) => {
            const char = safeVal[index] || "";
            const isActive = !disabled && isFocused && (safeVal.length === index || (index === 15 && safeVal.length === 16));
            const isFilled = char !== "";
            const hasDividerAfter = index === 3 || index === 7 || index === 11;

            return (
              <React.Fragment key={index}>
                <div
                  onClick={handleBoxClick}
                  className={`flex-1 min-w-0 h-9 flex items-center justify-center rounded-md border text-xs font-mono font-bold transition-all ${
                    disabled
                      ? isFilled
                        ? "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 cursor-default"
                        : "bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200/60 dark:border-zinc-800/60 text-zinc-400 cursor-default"
                      : isActive
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20 cursor-pointer"
                      : isFilled
                      ? "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 cursor-pointer"
                      : "bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-pointer"
                  }`}
                >
                  {char}
                  {isActive && safeVal.length === index && (
                    <span className="w-[1.5px] h-3 bg-blue-600 dark:bg-blue-400 animate-pulse" />
                  )}
                </div>
                {hasDividerAfter && (
                  <div className="w-[1px] h-3.5 bg-zinc-300 dark:bg-zinc-700 rounded-full self-center shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
