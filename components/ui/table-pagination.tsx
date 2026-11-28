"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export interface PaginatedSlice<T> {
  paginatedItems: T[];
  totalItems: number;
  totalPages: number;
  safePage: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Helper murni untuk memotong daftar data sesuai halaman & ukuran halaman aktif
 * dengan pengaman rentang halaman (`safePage` selalu di antara 1..totalPages).
 */
export function paginateItems<T>(
  items: T[],
  currentPage: number,
  pageSize: number
): PaginatedSlice<T> {
  const safeList = Array.isArray(items) ? items : [];
  const totalItems = safeList.length;
  const safeSize = Math.max(1, Math.floor(Number(pageSize) || 10));
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const safePage = Math.min(Math.max(1, Math.floor(Number(currentPage) || 1)), totalPages);
  const startIndex = (safePage - 1) * safeSize;
  const endIndex = Math.min(startIndex + safeSize, totalItems);
  const paginatedItems = safeList.slice(startIndex, startIndex + safeSize);

  return {
    paginatedItems,
    totalItems,
    totalPages,
    safePage,
    startIndex,
    endIndex,
  };
}

interface TablePaginationProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  itemLabel?: string;
  pageSizeOptions?: readonly number[];
  /**
   * - `embedded`: menempel di bagian bawah Card/tabel (seperti halaman Manajemen Pengguna).
   * - `card`: berdiri sebagai bar tersendiri berbingkai (cocok di bawah grid kartu).
   */
  variant?: "embedded" | "card";
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = "data",
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  variant = "embedded",
  className = "",
}) => {
  if (totalItems <= 0) return null;

  const safeSize = Math.max(1, Math.floor(Number(pageSize) || 10));
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const safePage = Math.min(Math.max(1, Math.floor(Number(currentPage) || 1)), totalPages);
  const startIndex = (safePage - 1) * safeSize;
  const endIndex = Math.min(startIndex + safeSize, totalItems);

  const containerClass =
    variant === "card"
      ? "flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs text-xs text-zinc-500 dark:text-zinc-400"
      : "flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 text-xs text-zinc-500 dark:text-zinc-400";

  return (
    <div className={`${containerClass} ${className}`.trim()}>
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start flex-wrap">
        <div>
          Menampilkan{" "}
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
            {startIndex + 1}
          </span>
          –
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
            {endIndex}
          </span>{" "}
          dari{" "}
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
            {totalItems}
          </span>{" "}
          {itemLabel}
        </div>

        <div className="flex items-center gap-1.5 pl-2 sm:border-l border-zinc-200 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-400">Tampilkan:</span>
          <Select
            value={String(safeSize)}
            onValueChange={(val) => {
              if (val) {
                onPageSizeChange(Number(val));
                onPageChange(1);
              }
            }}
          >
            <SelectTrigger className="h-7 text-xs w-[72px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 min-w-[72px]">
              {pageSizeOptions.map((opt) => (
                <SelectItem key={opt} value={String(opt)} className="text-xs">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[11px] text-zinc-400 hidden sm:inline">per hal.</span>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={safePage === 1}
            onClick={() => onPageChange(1)}
            className="h-7 w-7 rounded-lg cursor-pointer"
            title="Halaman Pertama"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={safePage === 1}
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            className="h-7 w-7 rounded-lg cursor-pointer"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>

          <span className="px-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 select-none tabular-nums">
            Hal. {safePage} / {totalPages}
          </span>

          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={safePage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            className="h-7 w-7 rounded-lg cursor-pointer"
            title="Halaman Selanjutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={safePage === totalPages}
            onClick={() => onPageChange(totalPages)}
            className="h-7 w-7 rounded-lg cursor-pointer"
            title="Halaman Terakhir"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};
