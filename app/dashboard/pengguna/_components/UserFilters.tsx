import React from "react";
import { Search, UserPlus } from "lucide-react";
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

interface UserFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  onOpenCreate: () => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onOpenCreate,
}) => {
  return (
    <Card className="p-3 sm:p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari nama, email, komisariat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={roleFilter} onValueChange={(val) => { if (val) setRoleFilter(val); }}>
              <SelectTrigger className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg min-w-[120px]">
                <SelectValue placeholder="Semua Peran" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                <SelectItem value="ALL" className="text-xs">Semua Peran</SelectItem>
                <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                <SelectItem value="pengurus" className="text-xs">Pengurus</SelectItem>
                <SelectItem value="instruktur" className="text-xs">Instruktur</SelectItem>
                <SelectItem value="anggota" className="text-xs">Anggota</SelectItem>
                <SelectItem value="peserta" className="text-xs">Peserta</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(val) => { if (val) setStatusFilter(val); }}>
              <SelectTrigger className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg min-w-[120px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                <SelectItem value="AKTIF" className="text-xs">Aktif</SelectItem>
                <SelectItem value="NONAKTIF" className="text-xs">Non-Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={onOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8.5 px-3.5 rounded-lg flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer w-full sm:w-auto justify-center"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </Button>
      </div>
    </Card>
  );
};
