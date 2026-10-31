import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-none">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          type="text"
          placeholder="Cari nama atau jabatan pengurus..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg w-full text-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Department / Division Filter */}
        <Select
          value={selectedDept}
          onValueChange={(val) => {
            if (val) setSelectedDept(val);
          }}
        >
          <SelectTrigger className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg min-w-[135px]">
            <SelectValue placeholder="Semua Divisi" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg max-h-60">
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

        {/* Tenant/Komisariat Filter (Cabang / Admin only) */}
        {isCabang && setTenantFilter && (
          <Select
            value={tenantFilter}
            onValueChange={(val) => {
              if (val) setTenantFilter(val);
            }}
          >
            <SelectTrigger className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg min-w-[150px]">
              <SelectValue placeholder="Semua Komisariat" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg max-h-60">
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
        )}

        {/* Status Filter */}
        <Select
          value={selectedStatus}
          onValueChange={(val) => {
            if (val) setSelectedStatus(val);
          }}
        >
          <SelectTrigger className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg min-w-[125px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
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
    </div>
  );
};
