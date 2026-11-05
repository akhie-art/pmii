"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  UserCheck,
  Mail,
  Building,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import type { UserAccount, Role } from "@/lib/db";
import { getRoleBadgeClass, isMasterAdmin } from "./types";

interface UserTableProps {
  users: UserAccount[];
  roles?: Role[];
  selectedIds: string[];
  onToggleSelect: (userId: string) => void;
  onSelectAll: () => void;
  onSelectPage?: (pageUserIds: string[], select: boolean) => void;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  onOpenEdit: (user: UserAccount) => void;
  onOpenDelete: (user: UserAccount) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  roles,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onSelectPage,
  isAllSelected,
  isSomeSelected,
  onOpenEdit,
  onOpenDelete,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset ke halaman 1 saat daftar users berubah (karena filter/pencarian)
  const usersSignature = useMemo(() => users.map((u) => u.id).join(","), [users]);
  useEffect(() => {
    setCurrentPage(1);
  }, [usersSignature]);

  const totalPages = Math.ceil(users.length / pageSize) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, users.length);
  const paginatedUsers = users.slice(startIndex, startIndex + pageSize);

  const selectablePageUsers = paginatedUsers.filter((u) => !isMasterAdmin(u));
  const isPageAllSelected =
    selectablePageUsers.length > 0 && selectablePageUsers.every((u) => selectedIds.includes(u.id));
  const isPageSomeSelected =
    selectablePageUsers.some((u) => selectedIds.includes(u.id)) && !isPageAllSelected;

  const handleHeaderCheckboxChange = () => {
    if (onSelectPage) {
      const pageIds = selectablePageUsers.map((u) => u.id);
      onSelectPage(pageIds, !isPageAllSelected);
    } else {
      onSelectAll();
    }
  };

  if (users.length === 0) {
    return (
      <Card className="p-8 text-center bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl">
        <UserCheck className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Tidak ada pengguna yang cocok dengan pencarian.</p>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800">
            <TableRow>
              {/* Checkbox All */}
              <TableHead className="w-10 px-4 py-3">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={isPageAllSelected ? true : isPageSomeSelected ? "indeterminate" : false}
                    onCheckedChange={handleHeaderCheckboxChange}
                    title={
                      isPageAllSelected
                        ? "Batalkan pilihan pengguna di halaman ini"
                        : "Pilih semua pengguna di halaman ini"
                    }
                  />
                </div>
              </TableHead>

              <TableHead className="text-xs font-semibold text-zinc-500 py-3 px-3">Pengguna</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 py-3 px-4">Peran</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 py-3 px-4">Komisariat</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 py-3 px-4">Status</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 py-3 px-4">Akses Menu</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 py-3 px-4 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {paginatedUsers.map((u, idx) => {
              const roleKey = (u.role || "").toLowerCase();
              const isMaster = isMasterAdmin(u);
              const isSelected = selectedIds.includes(u.id);

              return (
                <TableRow
                  key={u.id ? `${u.id}-${idx}` : `user-${idx}`}
                  className={`transition-colors ${
                    isSelected
                      ? "bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-900/30"
                      : "hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30"
                  }`}
                >
                  {/* Row Checkbox */}
                  <TableCell className="w-10 px-4 py-3">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={isSelected}
                        disabled={isMaster}
                        onCheckedChange={() => onToggleSelect(u.id)}
                        title={isMaster ? "Master Admin tidak dapat dipilih untuk tindakan massal" : `Pilih ${u.name}`}
                      />
                    </div>
                  </TableCell>

                  {/* User Info */}
                  <TableCell className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block truncate max-w-[160px] sm:max-w-[200px]">
                            {u.name}
                          </span>
                          {roleKey === "superadmin" || roleKey === "super_admin" ? (
                            <span title="Super Administrator (Akses Global)" className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 rounded text-[9px] font-bold">
                              ★ Superadmin
                            </span>
                          ) : isMaster ? (
                            <span title="Ketua Cabang (Master Admin)" className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 rounded text-[9px] font-bold">
                              ★ Master Cabang
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[150px]">{u.email}</span>
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Role */}
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    {(() => {
                      const roleObj = roles?.find((r) => r.id === u.role_id || r.code.toLowerCase() === roleKey);
                      const roleDisplayName = u.role_name || (roleObj as any)?.name || roleObj?.code || u.role;
                      const roleBadgeClass = getRoleBadgeClass((roleObj as any)?.level, u.role);

                      return (
                        <Badge className={`text-[10px] font-medium border ${roleBadgeClass}`}>
                          {roleDisplayName}
                        </Badge>
                      );
                    })()}
                  </TableCell>

                  {/* Commissariat */}
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      <Building className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="truncate max-w-[160px]">
                        {roleKey === "superadmin" || roleKey === "super_admin"
                          ? "Pusat / Global (Semua Tenant)"
                          : roleKey === "admin"
                          ? "Pengurus Cabang Grobogan (Semua)"
                          : (u.commissariat || "Belum Ditentukan")}
                      </span>
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${u.status === "AKTIF" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.status === "AKTIF" ? "bg-emerald-500" : "bg-zinc-400"}`} />
                      {u.status === "AKTIF" ? "Aktif" : "Non-Aktif"}
                    </span>
                  </TableCell>

                  {/* Access Menus */}
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    {u.allowedMenus && u.allowedMenus.length > 0 ? (
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                        {u.allowedMenus.length} Menu
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400 italic">Default Peran</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenEdit(u)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors"
                      >
                        Edit
                      </button>
                      {!isMaster && (
                        <button
                          onClick={() => onOpenDelete(u)}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-600 px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                          title="Hapus pengguna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start flex-wrap">
          <div>
            Menampilkan{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {users.length > 0 ? startIndex + 1 : 0}
            </span>
            –
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{endIndex}</span>{" "}
            dari{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{users.length}</span> pengguna
          </div>

          <div className="flex items-center gap-1.5 pl-2 sm:border-l border-zinc-200 dark:border-zinc-800">
            <span className="text-[11px] text-zinc-400">Tampilkan:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                if (val) {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }
              }}
            >
              <SelectTrigger className="h-7 text-xs w-[72px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 min-w-[72px]">
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="25" className="text-xs">25</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
                <SelectItem value="100" className="text-xs">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-[11px] text-zinc-400 hidden sm:inline">per hal.</span>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="h-7 w-7 rounded-lg cursor-pointer"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 w-7 rounded-lg cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>

            <span className="px-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 select-none">
              Hal. {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 w-7 rounded-lg cursor-pointer"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="h-7 w-7 rounded-lg cursor-pointer"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
