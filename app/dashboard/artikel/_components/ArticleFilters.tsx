import React from "react";
import { Search, Table as TableIcon, LayoutGrid } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ArticleFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedStatus: string;
  setSelectedStatus: (val: string) => void;
  viewMode: "table" | "grid";
  setViewMode: (mode: "table" | "grid") => void;
}

export const ArticleFilters: React.FC<ArticleFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  viewMode,
  setViewMode
}) => {
  return (
    <Card className="p-3 sm:p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari judul, penulis, tagar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
              title="Tampilan Tabel"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
              title="Tampilan Grid Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category & Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
        <span className="text-[11px] text-zinc-400 font-medium">Kategori:</span>
        {["Semua", "Kaderisasi", "Opini & Pergerakan", "Tata Kelola"].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 text-[11px] rounded-lg transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-blue-600 text-white font-semibold"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {cat}
          </button>
        ))}

        <span className="text-[11px] text-zinc-400 font-medium ml-2">Status:</span>
        {["Semua", "DITAMPILKAN", "DRAFT", "ARSIP"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-2.5 py-1 text-[11px] rounded-lg transition-all cursor-pointer ${
              selectedStatus === st
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {st}
          </button>
        ))}
      </div>
    </Card>
  );
};
