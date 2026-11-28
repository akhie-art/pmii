"use client";

import React, { useState, useMemo } from "react";
import {
  FileCheck,
  Search,
  ExternalLink,
  X,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TablePagination, paginateItems } from "@/components/ui/table-pagination";
import { ParticipantAvatar } from "./ParticipantAvatar";
import {
  isSafeDocumentUrl,
  openSafeDocumentUrl,
  translateSubmissionStatus,
} from "./verifikasi-helper";
import type { CadreSubmission } from "@/lib/db";

export type DisplaySubmission = CadreSubmission & {
  cadreId: string;
  cadreName: string;
  cadreLevel: string;
  cadreAvatar?: string | null;
  eventId?: string;
  eventName?: string;
  requirementTitle?: string;
  requirementDeadline?: string;
};

interface VerifikasiSubmissionsTabProps {
  reviewSubTab: "PENDING" | "APPROVED" | "REJECTED";
  onReviewSubTabChange: (tab: "PENDING" | "APPROVED" | "REJECTED") => void;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  filteredSubmissions: DisplaySubmission[];
  onOpenReview: (sub: DisplaySubmission) => void;
}

export function VerifikasiSubmissionsTab({
  reviewSubTab,
  onReviewSubTabChange,
  pendingCount,
  approvedCount,
  rejectedCount,
  searchQuery,
  onSearchQueryChange,
  filteredSubmissions,
  onOpenReview,
}: VerifikasiSubmissionsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const listSignature = useMemo(
    () =>
      `${reviewSubTab}|${filteredSubmissions
        .map((s) => `${s.cadreId}:${s.id}`)
        .join(",")}`,
    [filteredSubmissions, reviewSubTab]
  );
  const [prevSignature, setPrevSignature] = useState(listSignature);
  if (listSignature !== prevSignature) {
    setPrevSignature(listSignature);
    if (currentPage !== 1) setCurrentPage(1);
  }

  const { paginatedItems: paginatedSubmissions, safePage } = paginateItems(
    filteredSubmissions,
    currentPage,
    pageSize
  );

  return (
    <div className="space-y-4">
      {/* Sub-Tabs & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "PENDING" as const, label: "Menunggu", count: pendingCount },
            { id: "APPROVED" as const, label: "Disetujui", count: approvedCount },
            { id: "REJECTED" as const, label: "Perlu Revisi", count: rejectedCount },
          ].map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => onReviewSubTabChange(sub.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                reviewSubTab === sub.id
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                  : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <span>{sub.label}</span>
              <span className="text-[10px] opacity-75 tabular-nums">({sub.count})</span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Cari nama kader, judul tugas..."
            className="pl-9 pr-8 text-xs h-9 bg-white dark:bg-zinc-900 rounded-lg border-zinc-200 dark:border-zinc-800"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Hapus pencarian laporan"
              onClick={() => onSearchQueryChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-transparent border-none p-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Tidak ada laporan dalam kategori ini
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "Tidak ada laporan yang cocok dengan kata kunci pencarian."
              : reviewSubTab === "PENDING"
              ? "Semua laporan yang masuk sudah selesai diverifikasi!"
              : "Belum ada berkas laporan dengan status ini."}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedSubmissions.map((sub) => {
              const hasSafeFile = isSafeDocumentUrl(sub.fileLink);
              const isLate =
                sub.requirementDeadline &&
                sub.date &&
                !Number.isNaN(new Date(sub.requirementDeadline).getTime()) &&
                !Number.isNaN(new Date(sub.date).getTime()) &&
                new Date(sub.date).getTime() > new Date(sub.requirementDeadline).getTime();

              return (
                <Card
                  key={`${sub.cadreId}-${sub.id}`}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs"
                >
                  <div className="space-y-3">
                    {/* Header: Cadre info & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ParticipantAvatar
                          name={sub.cadreName}
                          photoUrl={sub.cadreAvatar}
                          sizeClass="w-9 h-9"
                          textClass="text-xs"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                            {sub.cadreName}
                          </h4>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate">
                            {sub.eventName || `Jenjang ${sub.cadreLevel}`}
                          </span>
                        </div>
                      </div>

                      <Badge
                        className={`text-[10px] font-bold border-none shrink-0 ${
                          sub.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : sub.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {translateSubmissionStatus(sub.status)}
                      </Badge>
                    </div>

                    {/* Submission Title & Description */}
                    <div className="space-y-1">
                      {sub.requirementTitle && sub.requirementTitle !== sub.title && (
                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 block truncate">
                          Tugas: {sub.requirementTitle}
                        </span>
                      )}
                      <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                        {sub.title}
                      </h5>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                        {sub.description || "Tidak ada ringkasan deskripsi."}
                      </p>
                    </div>

                    {/* Date and Safe File Link */}
                    <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                      <span className="inline-flex items-center gap-1">
                        <span>{sub.date || "-"}</span>
                        {isLate && (
                          <span className="inline-flex items-center gap-0.5 text-[9.5px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.2 rounded">
                            <Clock className="w-2.5 h-2.5" />
                            Terlambat
                          </span>
                        )}
                      </span>
                      {hasSafeFile ? (
                        <button
                          type="button"
                          onClick={() => void openSafeDocumentUrl(sub.fileLink)}
                          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium bg-transparent border-none p-0 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Buka Berkas</span>
                        </button>
                      ) : (
                        <span className="text-zinc-400 italic">Tanpa berkas</span>
                      )}
                    </div>

                    {/* Evaluator feedback if available */}
                    {sub.feedback && (
                      <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-300 space-y-1">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-200 block text-[10px] uppercase tracking-wider">
                          Catatan Review:
                        </span>
                        <p className="italic">{sub.feedback}</p>
                      </div>
                    )}
                  </div>

                  {/* Review Action Button */}
                  <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <Button
                      type="button"
                      onClick={() => onOpenReview(sub)}
                      className="w-full text-xs h-8 font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 cursor-pointer"
                    >
                      {sub.status === "PENDING" ? "Review & Validasi" : "Ubah Hasil Review"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination Bar (referensi halaman Pengguna) */}
          <TablePagination
            totalItems={filteredSubmissions.length}
            currentPage={safePage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="laporan"
            variant="card"
          />
        </>
      )}
    </div>
  );
}
