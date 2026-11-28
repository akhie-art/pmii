"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TablePagination, paginateItems } from "@/components/ui/table-pagination";
import { ParticipantAvatar } from "./ParticipantAvatar";
import { EventParticipantProgress } from "./types";

interface ParticipantProgressTabProps {
  progresStatusFilter: string;
  onProgresStatusFilterChange: (st: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  filteredParticipants: EventParticipantProgress[];
  selectedEventName?: string;
  onOpenDetailModal: (p: EventParticipantProgress) => void;
  onSahkanKelulusan: (p: EventParticipantProgress) => void;
  onRevokeKelulusan: (p: EventParticipantProgress) => void;
}

export function ParticipantProgressTab({
  progresStatusFilter,
  onProgresStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  filteredParticipants,
  selectedEventName,
  onOpenDetailModal,
  onSahkanKelulusan,
  onRevokeKelulusan,
}: ParticipantProgressTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const listSignature = useMemo(
    () => filteredParticipants.map((p) => p.id).join(","),
    [filteredParticipants]
  );
  const [prevSignature, setPrevSignature] = useState(listSignature);
  if (listSignature !== prevSignature) {
    setPrevSignature(listSignature);
    if (currentPage !== 1) setCurrentPage(1);
  }

  const { paginatedItems: paginatedParticipants, safePage } = paginateItems(
    filteredParticipants,
    currentPage,
    pageSize
  );
  const renderStatusBadge = (status: EventParticipantProgress["status"]) => {
    if (status === "SELESAI") {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-none font-bold text-[10px] gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Lulus RTL
        </Badge>
      );
    }
    if (status === "REVISI") {
      return (
        <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-none font-bold text-[10px] gap-1">
          <AlertCircle className="w-3 h-3" />
          Perlu Revisi
        </Badge>
      );
    }
    if (status === "AKTIF") {
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-none font-bold text-[10px] gap-1">
          <Clock className="w-3 h-3" />
          Sedang Proses
        </Badge>
      );
    }
    return (
      <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-none font-medium text-[10px]">
        Belum Mulai
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "ALL", label: "Semua Status" },
            { id: "SELESAI", label: "Lulus RTL" },
            { id: "AKTIF", label: "Sedang Berjalan" },
            { id: "REVISI", label: "Perlu Revisi" },
            { id: "BELUM_MULAI", label: "Belum Mulai" },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => onProgresStatusFilterChange(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                progresStatusFilter === st.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Cari nama atau email peserta..."
            className="pl-9 pr-8 text-xs h-9 bg-white dark:bg-zinc-900 rounded-lg border-zinc-200 dark:border-zinc-800"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Hapus pencarian peserta"
              onClick={() => onSearchQueryChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-transparent border-none p-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Empty State / Responsive Table + Mobile Cards */}
      {filteredParticipants.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Belum ada data peserta
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchQuery || progresStatusFilter !== "ALL"
              ? "Tidak ada peserta yang sesuai dengan filter saat ini."
              : selectedEventName
              ? `Belum ada peserta aktif yang terdaftar untuk kegiatan ${selectedEventName}.`
              : "Pilih kegiatan tertentu atau pastikan ada peserta yang mendaftar kegiatan kaderisasi."}
          </p>
        </Card>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden md:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold">
                  <tr>
                    <th className="p-3.5 pl-5">Nama Peserta</th>
                    <th className="p-3.5">Kegiatan &amp; Jenjang</th>
                    <th className="p-3.5">Progres RTL</th>
                    <th className="p-3.5">Status Akhir</th>
                    <th className="p-3.5 pr-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {paginatedParticipants.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Name & Contact */}
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-2.5">
                          <ParticipantAvatar
                            name={p.cadreName}
                            photoUrl={p.photoUrl}
                            sizeClass="w-8 h-8"
                            textClass="text-xs"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {p.cadreName}
                              </span>
                              {String(p.regStatus || "").toUpperCase() === "PENDING" && (
                                <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900">
                                  Belum Screening
                                </span>
                              )}
                              {p.source === "EVALUATION" && (
                                <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900">
                                  Dari Penilaian
                                </span>
                              )}
                              {p.source === "CADRE_SUBMISSION" && (
                                <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900">
                                  Dari Laporan RTL
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400 block truncate">
                              {p.cadreEmail || p.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Event & Level */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <Badge className="bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-none text-[10px] font-bold">
                            {p.eventLevel}
                          </Badge>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block line-clamp-1 max-w-[200px]">
                            {p.eventName}
                          </span>
                        </div>
                      </td>

                      {/* Progress Bar */}
                      <td className="p-3.5 min-w-[170px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                              {p.approvedCount} / {p.totalRequirements} Tugas
                            </span>
                            <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                              {p.progressPercent}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                p.status === "SELESAI"
                                  ? "bg-emerald-500"
                                  : "bg-blue-600 dark:bg-blue-500"
                              }`}
                              style={{ width: `${p.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5">{renderStatusBadge(p.status)}</td>

                      {/* Actions */}
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenDetailModal(p)}
                            className="h-7 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            Detail Tugas
                          </Button>

                          {p.status !== "SELESAI" ? (
                            <Button
                              type="button"
                              onClick={() => onSahkanKelulusan(p)}
                              className="h-7 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                            >
                              Sahkan Lulus
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => onRevokeKelulusan(p)}
                              title="Batalkan pengesahan kelulusan RTL"
                              className="h-7 px-2 text-xs text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer Desktop (referensi halaman Pengguna) */}
            <TablePagination
              totalItems={filteredParticipants.length}
              currentPage={safePage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="peserta"
              variant="embedded"
            />
          </div>

          {/* MOBILE CARDS */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {paginatedParticipants.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ParticipantAvatar
                      name={p.cadreName}
                      photoUrl={p.photoUrl}
                      sizeClass="w-9 h-9"
                      textClass="text-xs"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {p.cadreName}
                        </p>
                        {String(p.regStatus || "").toUpperCase() === "PENDING" && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900">
                            Belum Screening
                          </span>
                        )}
                        {p.source === "EVALUATION" && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900">
                            Dari Penilaian
                          </span>
                        )}
                        {p.source === "CADRE_SUBMISSION" && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900">
                            Dari Laporan RTL
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {p.cadreEmail || p.phone}
                      </p>
                    </div>
                  </div>
                  {renderStatusBadge(p.status)}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <Badge className="bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-none text-[10px] font-bold">
                    {p.eventLevel}
                  </Badge>
                  <span className="truncate">{p.eventName}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Progres: {p.approvedCount} / {p.totalRequirements} Tugas
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {p.progressPercent}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        p.status === "SELESAI" ? "bg-emerald-500" : "bg-blue-600"
                      }`}
                      style={{ width: `${p.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenDetailModal(p)}
                    className="h-8 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
                  >
                    Detail Tugas
                  </Button>
                  {p.status !== "SELESAI" ? (
                    <Button
                      type="button"
                      onClick={() => onSahkanKelulusan(p)}
                      className="h-8 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    >
                      Sahkan Lulus
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onRevokeKelulusan(p)}
                      className="h-8 text-xs text-rose-600 border-rose-200 dark:border-rose-900 rounded-lg cursor-pointer"
                    >
                      Batalkan Lulus
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Bar Mobile (referensi halaman Pengguna) */}
          <TablePagination
            totalItems={filteredParticipants.length}
            currentPage={safePage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="peserta"
            variant="card"
            className="md:hidden"
          />
        </>
      )}
    </div>
  );
}
