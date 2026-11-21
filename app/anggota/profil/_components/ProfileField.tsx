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
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          <span>{label}</span>
          {required && isEditing && <span className="text-zinc-700 dark:text-zinc-300 font-bold">*</span>}
        </label>
        {badge}
      </div>

      {isEditing ? (
        children
      ) : (
        <div className="min-h-[36px] px-3 py-1.5 rounded-md bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 text-xs sm:text-[13px] flex items-center transition-colors">
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
 * Format string tanggal YYYY-MM-DD, DD/MM/YYYY, atau ISO string menjadi format bahasa Indonesia yang mudah dibaca.
 * Contoh: "2006-03-17" -> "17 Maret 2006"
 */
export function formatIndonesianDate(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return "";
  const clean = dateStr.trim().split("T")[0]; // Hilangkan komponen jam jika format ISO
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // Format YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
    const parts = clean.split("-");
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
      return `${day} ${months[monthIdx]} ${year}`;
    }
  }

  // Format DD/MM/YYYY atau DD-MM-YYYY
  if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(clean)) {
    const separator = clean.includes("/") ? "/" : "-";
    const parts = clean.split(separator);
    const day = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const year = parts[2];
    if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
      return `${day} ${months[monthIdx]} ${year}`;
    }
  }

  return dateStr;
}
