"use client";

import React from "react";
import {
  GraduationCap,
  Mail,
  Edit2,
  Trash2,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { CommissariatList } from "./types";

interface KomisariatTableProps {
  komisariats: CommissariatList[];
  getMemberCount: (name: string) => number;
  onEdit: (k: CommissariatList) => void;
  onDelete: (k: CommissariatList) => void;
  isTenantView?: boolean;
}

export function KomisariatTable({
  komisariats,
  getMemberCount,
  onEdit,
  onDelete,
  isTenantView = false,
}: KomisariatTableProps) {
  if (komisariats.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-12 text-center">
        <Building2 className="w-12 h-12 mx-auto text-zinc-400 mb-3 opacity-60" />
        <h4 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Tidak ada {isTenantView ? "tenant" : "komisariat"} ditemukan
        </h4>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Sesuaikan kata kunci pencarian atau filter yang Anda gunakan.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30">
              <TableHead className="font-semibold text-xs text-zinc-600 dark:text-zinc-400">
                {isTenantView ? "Tenant" : "Komisariat"}
              </TableHead>
              <TableHead className="font-semibold text-xs text-zinc-600 dark:text-zinc-400">Perguruan Tinggi</TableHead>
              <TableHead className="font-semibold text-xs text-zinc-600 dark:text-zinc-400">BPH & Periode</TableHead>
              <TableHead className="font-semibold text-xs text-zinc-600 dark:text-zinc-400 text-center">Anggota</TableHead>
              <TableHead className="font-semibold text-xs text-zinc-600 dark:text-zinc-400 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {komisariats.map((k) => {
              const count = getMemberCount(k.name);

              return (
                <TableRow
                  key={k.id}
                  className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      {k.logo ? (
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-950 p-1 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-xs flex-shrink-0">
                          <img
                            src={k.logo}
                            alt={k.name}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                          {k.logoInitial ||
                            k.name
                              .split(" ")
                              .map((w) => w[0])
                              .slice(0, 3)
                              .join("")}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          {k.name}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[180px]">{k.contactEmail || "-"}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="font-medium">{k.university || k.campusName || "-"}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {k.establishedYear ? `Didirikan ${k.establishedYear}` : ""}
                    </div>
                  </TableCell>



                  <TableCell className="py-3.5">
                    <div className="text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400">Ketua: </span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {k.structure?.chairman || "-"}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Periode {k.structure?.period || "2026 - 2027"}
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5 text-center">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {count} Kader
                    </span>
                  </TableCell>

                  <TableCell className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(k)}
                        className="h-7 w-7 p-0 text-zinc-500 hover:text-blue-600"
                        title="Ubah Data"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(k)}
                        className="h-7 w-7 p-0 text-zinc-500 hover:text-rose-600"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
