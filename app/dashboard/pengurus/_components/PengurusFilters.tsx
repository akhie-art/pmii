"use client";

import React from "react";
import {
  Search,
  Building2,
  Layers,
  CheckCircle2,
  RotateCcw,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface PengurusFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedDept: string;
  setSelectedDept: (dept: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  tenantFilter?: string;
  setTenantFilter?: (tenant: string) => void;
  availableKomisariats?: string[];
  isCabang?: boolean;
  allDepartments: string[];
}

export const PengurusFilters: React.FC<PengurusFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedDept,
  setSelectedDept,
  selectedStatus,
  setSelectedStatus,
  tenantFilter = "ALL",
  setTenantFilter,
  availableKomisariats = [],
  isCabang = false,
  allDepartments
}) => {
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedDept !== "ALL" ||
    selectedStatus !== "ALL" ||
    (isCabang && tenantFilter !== "ALL");

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDept("ALL");
    setSelectedStatus("ALL");
    if (setTenantFilter) setTenantFilter("ALL");
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 p-2.5 sm:p-3 rounded-2xl shadow-2xs">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Cari fungsionaris, ketua, atau jabatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl w-full text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer rounded-full transition-colors"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns Container */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {/* 1. Tenant/Komisariat Filter (Cabang / Super Admin) */}
          {isCabang && setTenantFilter && (
            <div className="w-full sm:w-[190px] shrink-0">
              <Select
                value={tenantFilter}
                onValueChange={(val) => {
                  if (val) setTenantFilter(val);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl w-full cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <SelectValue placeholder="Semua Lembaga">
                      {tenantFilter === "ALL"
                        ? "Semua Komisariat"
                        : tenantFilter}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl max-h-64 shadow-lg">
                  <SelectItem value="ALL" className="text-xs">
                    Semua Komisariat / Cabang
                  </SelectItem>
                  <SelectItem value="Pengurus Cabang Grobogan" className="text-xs">
                    Pengurus Cabang Grobogan
                  </SelectItem>
                  {availableKomisariats.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 2. Department / Division Filter */}
          <div className="w-full sm:w-[150px] shrink-0">
            <Select
              value={selectedDept}
              onValueChange={(val) => {
                if (val) setSelectedDept(val);
              }}
            >
              <SelectTrigger className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl w-full cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <SelectValue placeholder="Semua Divisi">
                    {selectedDept === "ALL"
                      ? "Semua Divisi"
                      : selectedDept === "BPH"
                      ? "BPH"
                      : `Bidang ${selectedDept}`}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl max-h-64 shadow-lg">
                <SelectItem value="ALL" className="text-xs">
                  Semua Divisi
                </SelectItem>
                {allDepartments.map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">
                    {d === "BPH" ? "BPH" : `Bidang ${d}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Status Filter */}
          <div className="w-full sm:w-[130px] shrink-0">
            <Select
              value={selectedStatus}
              onValueChange={(val) => {
                if (val) setSelectedStatus(val);
              }}
            >
              <SelectTrigger className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl w-full cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <SelectValue placeholder="Semua Status">
                    {selectedStatus === "ALL"
                      ? "Semua Status"
                      : selectedStatus === "AKTIF"
                      ? "Aktif"
                      : "Demisioner"}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg">
                <SelectItem value="ALL" className="text-xs">
                  Semua Status
                </SelectItem>
                <SelectItem value="AKTIF" className="text-xs">
                  Aktif
                </SelectItem>
                <SelectItem value="DEMISIONER" className="text-xs">
                  Demisioner
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Reset Filters Button */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-2.5 text-xs border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
              title="Reset Semua Filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
