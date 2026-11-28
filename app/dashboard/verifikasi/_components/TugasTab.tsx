"use client";

import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Clock,
  FileText,
  ExternalLink,
  Edit3,
  Trash2,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TablePagination, paginateItems } from "@/components/ui/table-pagination";
import { formatDateTimeIndo } from "./types";
import {
  isDeadlineOverdue,
  isSafeDocumentUrl,
  openSafeDocumentUrl,
} from "./verifikasi-helper";
import type { Requirement, EventActivity } from "@/lib/db";

interface TugasTabProps {
  selectedEvent: EventActivity | null;
  tugasLevelFilter: string;
  onTugasLevelFilterChange: (lvl: string) => void;
  currentApplicableReqs: Requirement[];
  events: EventActivity[];
  canManageReq: (req: Requirement) => boolean;
  onOpenAddReq: () => void;
  onOpenEditReq: (req: Requirement) => void;
  onPromptDeleteReq: (req: Requirement) => void;
}

export function TugasTab({
  selectedEvent,
  tugasLevelFilter,
  onTugasLevelFilterChange,
  currentApplicableReqs,
  events,
  canManageReq,
  onOpenAddReq,
  onOpenEditReq,
  onPromptDeleteReq,
}: TugasTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const listSignature = useMemo(
    () => currentApplicableReqs.map((r) => r.id).join(","),
    [currentApplicableReqs]
  );
  const [prevSignature, setPrevSignature] = useState(listSignature);
  if (listSignature !== prevSignature) {
    setPrevSignature(listSignature);
    if (currentPage !== 1) setCurrentPage(1);
  }

  const { paginatedItems: paginatedReqs, safePage } = paginateItems(
    currentApplicableReqs,
    currentPage,
    pageSize
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {selectedEvent ? (
          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <span>Menampilkan tugas RTL untuk kegiatan:</span>
            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60 text-[11px] font-semibold shadow-none">
              [{selectedEvent.level}] {selectedEvent.name || selectedEvent.title}
            </Badge>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Filter Jenjang:
            </span>
            {["ALL", "MAPABA", "PKD", "PKL"].map((lvl) => (
              <button
                key={lvl}
                type="button"
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
        )}

        <Button
          type="button"
          onClick={onOpenAddReq}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tugas</span>
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
            type="button"
            onClick={onOpenAddReq}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 rounded-lg cursor-pointer"
          >
            Buat Tugas Sekarang
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedReqs.map((req) => {
            const reqEvent = events.find((e) => e.id === req.eventId);
            const manageable = canManageReq(req);
            const overdue = isDeadlineOverdue(req.deadline);
            const hasSafeFile = isSafeDocumentUrl(req.fileUrl);
            const minSubs = Math.max(1, Number(req.minSubmissions) || 1);

            return (
              <Card
                key={req.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs transition-all duration-200"
              >
                <div className="space-y-3.5">
                  {/* Top Row: Tags & Deadline */}
                  <div className="flex items-start justify-between gap-2">
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
                          Umum Cabang
                        </Badge>
                      )}
                      {minSubs > 1 && (
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/50 text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-none">
                          Min. {minSubs} laporan
                        </Badge>
                      )}
                    </div>

                    {req.deadline && (
                      <div
                        className={`inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-lg shrink-0 whitespace-nowrap border ${
                          overdue
                            ? "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200/70 dark:border-rose-900/60"
                            : "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200/70 dark:border-amber-900/60"
                        }`}
                        title={overdue ? "Batas waktu pengumpulan telah berakhir" : "Batas waktu pengumpulan"}
                      >
                        {overdue ? (
                          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                        )}
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

                  {/* Safe File Attachment */}
                  {hasSafeFile && (
                    <button
                      type="button"
                      onClick={() => void openSafeDocumentUrl(req.fileUrl)}
                      className="w-full text-left group/file flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100/90 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 transition-all cursor-pointer"
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
                    </button>
                  )}
                </div>

                {/* Card Footer Actions (selaras RLS per tenant) */}
                <div className="pt-3 mt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium inline-flex items-center gap-1">
                    {!manageable && <Lock className="w-3 h-3 text-zinc-400" />}
                    <span>{manageable ? "Tugas RTL" : "Standar Cabang (Baca Saja)"}</span>
                  </span>

                  {manageable && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenEditReq(req)}
                        className="h-7.5 px-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onPromptDeleteReq(req)}
                        className="h-7.5 px-2.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Hapus</span>
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
          </div>

          {/* Pagination Bar (referensi halaman Pengguna) */}
          <TablePagination
            totalItems={currentApplicableReqs.length}
            currentPage={safePage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="tugas"
            variant="card"
          />
        </>
      )}
    </div>
  );
}
