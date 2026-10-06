"use client";

import React from "react";
import { UserCheck, Mail, Building, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import type { UserAccount } from "@/lib/db";
import { ROLE_LABELS, ROLE_BADGE, isMasterAdmin } from "./types";

interface UserTableProps {
  users: UserAccount[];
  selectedIds: string[];
  onToggleSelect: (userId: string) => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  onOpenEdit: (user: UserAccount) => void;
  onOpenDelete: (user: UserAccount) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  isAllSelected,
  isSomeSelected,
  onOpenEdit,
  onOpenDelete,
}) => {
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
                    checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                    onCheckedChange={onSelectAll}
                    title="Pilih Semua Pengguna"
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
            {users.map((u) => {
              const roleKey = (u.role || "").toLowerCase();
              const isMaster = isMasterAdmin(u);
              const isSelected = selectedIds.includes(u.id);

              return (
                <TableRow
                  key={u.id}
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
                          {isMaster && (
                            <span title="Master Administrator" className="text-amber-500 text-[10px] font-bold">★</span>
                          )}
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
                    <Badge className={`text-[10px] font-medium border ${ROLE_BADGE[roleKey] || "bg-zinc-100 text-zinc-600"}`}>
                      {ROLE_LABELS[roleKey] || u.role}
                    </Badge>
                  </TableCell>

                  {/* Commissariat */}
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      <Building className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="truncate max-w-[160px]">{u.commissariat || "Semua (Pusat)"}</span>
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
    </Card>
  );
};
