"use client";

import React from "react";
import { BookOpen, Plus, Clock, FileText, ExternalLink, Edit3, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTimeIndo } from "./types";
import type { Requirement, EventActivity } from "@/lib/db";

interface TugasTabProps {
  tugasLevelFilter: string;
  onTugasLevelFilterChange: (lvl: string) => void;
  currentApplicableReqs: Requirement[];
  events: EventActivity[];
  onOpenAddReq: () => void;
  onOpenEditReq: (req: Requirement) => void;
  onPromptDeleteReq: (req: Requirement) => void;
}

export function TugasTab({
  tugasLevelFilter,
  onTugasLevelFilterChange,
  currentApplicableReqs,
  events,
  onOpenAddReq,
  onOpenEditReq,
  onPromptDeleteReq,
}: TugasTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Filter Jenjang:
          </span>
          {["ALL", "MAPABA", "PKD", "PKL"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => onTugasLevelFilterChange(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                tugasLevelFilter === lvl
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {lvl === "ALL" ? "Semua Jenjang" : lvl}
            </button>
          ))}
        </div>

        <Button
          onClick={onOpenAddReq}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Tugas
        </Button>
      </div>

      {currentApplicableReqs.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Belum ada tugas RTL untuk kegiatan ini
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            Silakan buat tugas baru agar peserta mengetahui kewajiban dan batas waktu pengumpulan tugas pasca-kegiatan.
          </p>
          <Button
            onClick={onOpenAddReq}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 rounded-lg cursor-pointer"
          >
            Buat Tugas Sekarang
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentApplicableReqs.map((req) => {
            const reqEvent = events.find((e) => e.id === req.eventId);
            return (
              <Card
                key={req.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs transition-all duration-200"
              >
                <div className="space-y-3.5">
                  {/* Top Row: Tags & Deadline */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-none">
                        {req.level}
                      </Badge>
                      {reqEvent ? (
                        <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/50 text-[10px] font-medium px-2 py-0.5 rounded-md truncate max-w-[150px] shadow-none">
                          {reqEvent.name || reqEvent.title}
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border-none text-[10px] font-medium px-2 py-0.5 rounded-md shadow-none">
                          Umum
                        </Badge>
                      )}
                    </div>

                    {req.deadline && (
                      <div className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-900/60 px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{formatDateTimeIndo(req.deadline)}</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
                      {req.title}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3">
                      {req.description || "Tidak ada petunjuk tambahan."}
                    </p>
                  </div>

                  {/* File Attachment */}
                  {req.fileUrl && (
                    <a
                      href={req.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group/file flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100/90 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-900/50">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate block group-hover/file:text-blue-600 dark:group-hover/file:text-blue-400 transition-colors">
                            {req.fileName || "Berkas Panduan / Modul"}
                          </span>
                          <span className="text-[10px] text-zinc-400 block">
                            {req.fileSize ? `${req.fileSize} • ` : ""}Klik untuk buka dokumen
                          </span>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 group-hover/file:text-zinc-700 dark:group-hover/file:text-zinc-200 shrink-0 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </a>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 mt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                    Tugas RTL
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenEditReq(req)}
                      className="h-7.5 px-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPromptDeleteReq(req)}
                      className="h-7.5 px-2.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Hapus</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
