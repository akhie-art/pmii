"use client";

import React from "react";
import {
  GraduationCap,
  Mail,
  Calendar,
  Edit2,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommissariatList } from "./types";

interface KomisariatCardProps {
  komisariat: CommissariatList;
  onEdit: (k: CommissariatList) => void;
  onDelete: (k: CommissariatList) => void;
}

export function KomisariatCard({
  komisariat,
  onEdit,
  onDelete,
}: KomisariatCardProps) {
  const initial =
    komisariat.logoInitial ||
    komisariat.name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 3)
      .join("")
      .toUpperCase();

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between"
    >
      <div className="p-5 flex-1 flex flex-col">
        {/* Header: Initial Logo, Title */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {komisariat.logo ? (
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-950 p-1 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-md flex-shrink-0">
                <img
                  src={komisariat.logo}
                  alt={komisariat.name}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-700 to-zinc-900 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-emerald-900/20 border border-emerald-400/30 flex-shrink-0">
                {initial}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 line-clamp-1">
                  {komisariat.name}
                </h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5 line-clamp-1">
                <GraduationCap className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                <span>{komisariat.university || komisariat.campusName || "Perguruan Tinggi"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Contact info & established year */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-400 py-2.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 truncate">
            <Mail className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span className="truncate" title={komisariat.contactEmail}>
              {komisariat.contactEmail || "-"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span>
              {komisariat.establishedYear
                ? `Est. ${komisariat.establishedYear}`
                : komisariat.establishedDate
                ? `Est. ${new Date(komisariat.establishedDate).getFullYear()}`
                : "Tahun -"}
            </span>
          </div>
        </div>

        {/* Structure BPH */}
        <div className="mt-3.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> BPH Komisariat
            </span>
            <span className="text-[11px] font-normal text-zinc-400">
              Periode {komisariat.structure?.period || "2026 - 2027"}
            </span>
          </div>
          <div className="space-y-1 bg-white/60 dark:bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Ketua:</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[170px]">
                {komisariat.structure?.chairman || "-"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Sekretaris:</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[170px]">
                {komisariat.structure?.secretary || "-"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Bendahara:</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[170px]">
                {komisariat.structure?.treasurer || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 bg-zinc-50/80 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(komisariat)}
          className="h-8 px-3 text-xs text-zinc-700 dark:text-zinc-300 hover:text-blue-600 gap-1.5"
          title="Ubah Data"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(komisariat)}
          className="h-8 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1"
          title="Hapus Komisariat"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Hapus</span>
        </Button>
      </div>
    </div>
  );
}
