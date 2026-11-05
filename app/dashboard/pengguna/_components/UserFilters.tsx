import React, { useMemo } from "react";
import { Search, UserPlus, X, Building, ShieldCheck, CheckCircle2, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import type { Role } from "@/lib/db";
import { formatRoleName } from "./types";

interface UserFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  tenantFilter?: string;
  setTenantFilter?: (val: string) => void;
  availableKomisariats?: string[];
  isCabang?: boolean;
  availableRoles?: Role[];
  onOpenCreate: () => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  tenantFilter = "ALL",
  setTenantFilter,
  availableKomisariats = [],
  isCabang = false,
  availableRoles,
  onOpenCreate,
}) => {
  const filterRoles = useMemo(() => {
    const list = availableRoles && availableRoles.length > 0 ? [...availableRoles] : [];
    const ensureRoles: Array<{ id: string; code: string }> = [
      { id: "def-ketua-kom", code: "ketua_komisariat" },
      { id: "def-pengurus-kom", code: "pengurus_komisariat" },
      { id: "def-anggota", code: "anggota" },
      { id: "def-peserta", code: "peserta" },
    ];
    ensureRoles.forEach((er) => {
      if (!list.some((r) => r.code.toLowerCase() === er.code.toLowerCase())) {
        list.push(er as any);
      }
    });

    const seen = new Set<string>();
    const unique = list.filter((r) => {
      const c = r.code.toLowerCase().trim();
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    });

    const ROLE_PRIORITY: Record<string, number> = {
      superadmin: 1,
      ketua_cabang: 2,
      admin: 3,
      pengurus_cabang: 4,
      ketua_komisariat: 5,
      pengurus_komisariat: 6,
      pengurus: 7,
      instruktur: 8,
      anggota: 9,
      peserta: 10,
    };

    return unique.sort((a, b) => {
      const orderA = ROLE_PRIORITY[a.code.toLowerCase()] ?? 99;
      const orderB = ROLE_PRIORITY[b.code.toLowerCase()] ?? 99;
      return orderA - orderB;
    });
  }, [availableRoles]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    roleFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    (isCabang && tenantFilter !== "ALL");

  const handleResetFilters = () => {
    setSearchQuery("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    if (setTenantFilter) setTenantFilter("ALL");
  };

  return (
    <Card className="p-2.5 sm:p-3 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari nama, email, komisariat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 w-full"
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

        {/* Filter Dropdowns & Create Button */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-start">
          {/* Peran Filter */}
          <div className="w-full sm:w-[135px] shrink-0">
            <Select value={roleFilter} onValueChange={(val) => { if (val) setRoleFilter(val); }}>
              <SelectTrigger className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg w-full cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-1.5 min-w-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <SelectValue placeholder="Semua Peran">
                    {roleFilter === "ALL" ? "Semua Peran" : formatRoleName(roleFilter)}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg max-h-60 shadow-md">
                <SelectItem value="ALL" className="text-xs">Semua Peran</SelectItem>
                {filterRoles.map((r) => (
                  <SelectItem key={r.id || r.code} value={r.code.toLowerCase()} className="text-xs">
                    {formatRoleName(r.code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Komisariat Filter (Cabang / Super Admin) */}
          {isCabang && setTenantFilter && (
            <div className="w-full sm:w-[175px] shrink-0">
              <Select value={tenantFilter} onValueChange={(val) => { if (val) setTenantFilter(val); }}>
                <SelectTrigger className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg w-full cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Building className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <SelectValue placeholder="Semua Komisariat">
                      {tenantFilter === "ALL" ? "Semua Komisariat" : tenantFilter}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg max-h-60 shadow-md">
                  <SelectItem value="ALL" className="text-xs">Semua Komisariat / Cabang</SelectItem>
                  <SelectItem value="Pengurus Cabang Grobogan" className="text-xs">Pengurus Cabang Grobogan</SelectItem>
                  {availableKomisariats.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status Filter */}
          <div className="w-full sm:w-[120px] shrink-0">
            <Select value={statusFilter} onValueChange={(val) => { if (val) setStatusFilter(val); }}>
              <SelectTrigger className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg w-full cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <SelectValue placeholder="Semua Status">
                    {statusFilter === "ALL" ? "Semua Status" : statusFilter === "AKTIF" ? "Aktif" : "Non-Aktif"}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg shadow-md">
                <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                <SelectItem value="AKTIF" className="text-xs">Aktif</SelectItem>
                <SelectItem value="NONAKTIF" className="text-xs">Non-Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Button (jika ada filter aktif) */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleResetFilters}
              className="h-8.5 w-8.5 shrink-0 rounded-lg cursor-pointer text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              title="Reset semua filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          )}

          {/* Tambah Pengguna Button */}
          <Button
            onClick={onOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8.5 px-3.5 rounded-lg flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer w-full sm:w-auto justify-center"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Pengguna</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};
