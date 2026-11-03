"use client";

import React from "react";

interface ProfileFieldProps {
  label: string;
  required?: boolean;
  isEditing: boolean;
  value?: string | null;
  displayValue?: React.ReactNode;
  emptyPlaceholder?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ProfileField({
  label,
  required,
  isEditing,
  value,
  displayValue,
  emptyPlaceholder = "Belum diisi",
  badge,
  children,
  className = ""
}: ProfileFieldProps) {
  const hasValue = displayValue !== undefined || (value !== undefined && value !== null && value.trim() !== "" && value.trim() !== "-");

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide flex items-center gap-1">
          <span>{label}</span>
          {required && isEditing && <span className="text-rose-500 font-bold">*</span>}
        </label>
        {badge}
      </div>

      {isEditing ? (
        children
      ) : (
        <div className="min-h-[38px] px-3.5 py-2 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 text-xs sm:text-[13px] flex items-center transition-all">
          {displayValue !== undefined ? (
            displayValue
          ) : hasValue ? (
            <span className="font-medium text-zinc-900 dark:text-zinc-100 break-words">{value}</span>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500 italic text-xs font-normal">
              {emptyPlaceholder}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Format string tanggal YYYY-MM-DD menjadi format bahasa Indonesia yang mudah dibaca.
 * Contoh: "2003-05-14" -> "14 Mei 2003"
 */
export function formatIndonesianDate(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return "";
  const parts = dateStr.trim().split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
      return `${day} ${months[monthIdx]} ${year}`;
    }
  }
  return dateStr;
}

