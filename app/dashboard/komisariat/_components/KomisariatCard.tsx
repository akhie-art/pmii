"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Mail,
  Calendar,
  Edit2,
  Trash2,
  ShieldCheck,
  Users,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommissariatList, KomisariatBphData } from "./types";

interface KomisariatCardProps {
  komisariat: CommissariatList;
  onEdit: (k: CommissariatList) => void;
  onDelete: (k: CommissariatList) => void;
  canDelete?: boolean;
  bph?: KomisariatBphData;
}

export function KomisariatCard({
  komisariat,
  onEdit,
  onDelete,
  canDelete = true,
  bph,
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
        <div className="mt-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> BPH Komisariat
              {bph?.isSynced && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Pengurus
                </span>
              )}
            </span>
            <span className="text-[11px] font-normal text-zinc-400">
              Periode {bph?.period || komisariat.structure?.period || "2026 - 2027"}
            </span>
          </div>

          {bph?.hasData ? (
            <div className="space-y-1.5 bg-zinc-50/80 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
              {/* Ketua */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Ketua:
                </span>
                <span
                  className={`font-semibold truncate max-w-[170px] ${
                    bph.chairman && bph.chairman !== "-"
                      ? "text-zinc-800 dark:text-zinc-200"
                      : "text-zinc-400 italic"
                  }`}
                  title={bph.chairman}
                >
                  {bph.chairman && bph.chairman !== "-" ? bph.chairman : "Belum ditentukan"}
                </span>
              </div>
              {/* Sekretaris */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Sekretaris:
                </span>
                <span
                  className={`font-medium truncate max-w-[170px] ${
                    bph.secretary && bph.secretary !== "-"
                      ? "text-zinc-700 dark:text-zinc-300"
                      : "text-zinc-400 italic"
                  }`}
                  title={bph.secretary}
                >
                  {bph.secretary && bph.secretary !== "-" ? bph.secretary : "Belum ditentukan"}
                </span>
              </div>
              {/* Bendahara */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Bendahara:
                </span>
                <span
                  className={`font-medium truncate max-w-[170px] ${
                    bph.treasurer && bph.treasurer !== "-"
                      ? "text-zinc-700 dark:text-zinc-300"
                      : "text-zinc-400 italic"
                  }`}
                  title={bph.treasurer}
                >
                  {bph.treasurer && bph.treasurer !== "-" ? bph.treasurer : "Belum ditentukan"}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/40 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    BPH Belum Diatur
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {bph?.totalBoardCount && bph.totalBoardCount > 0
                      ? `${bph.totalBoardCount} pengurus terdaftar (belum ditugaskan BPH)`
                      : "Belum ada fungsionaris BPH"}
                  </p>
                </div>
              </div>
              <Link
                href={`/dashboard/pengurus?campus=${encodeURIComponent(komisariat.name)}`}
                className="shrink-0 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-0.5"
              >
                Atur
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 bg-zinc-50/80 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
        <Link
          href={`/dashboard/pengurus?campus=${encodeURIComponent(komisariat.name)}`}
          className="h-8 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg inline-flex items-center gap-1.5 border border-zinc-200/80 dark:border-zinc-800 transition-colors font-medium"
          title="Kelola Data Pengurus Komisariat Ini"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Pengurus</span>
        </Link>

        <div className="flex items-center gap-1.5">
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

          {canDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(komisariat)}
              className="h-8 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1 cursor-pointer"
              title="Hapus Komisariat"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
