"use client";

import React from "react";
import { FileCheck, Search, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ParticipantAvatar } from "./ParticipantAvatar";
import type { CadreSubmission } from "@/lib/db";

export type DisplaySubmission = CadreSubmission & {
  cadreId: string;
  cadreName: string;
  cadreLevel: string;
  cadreAvatar?: string | null;
  eventId?: string;
  eventName?: string;
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
  return (
    <div className="space-y-4">
      {/* Sub-Tabs & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex gap-2">
          {[
            { id: "PENDING" as const, label: "Menunggu", count: pendingCount },
            { id: "APPROVED" as const, label: "Disetujui", count: approvedCount },
            { id: "REJECTED" as const, label: "Perlu Revisi", count: rejectedCount }
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => onReviewSubTabChange(sub.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                reviewSubTab === sub.id
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                  : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <span>{sub.label}</span>
              <span className="text-[10px] opacity-75">({sub.count})</span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Cari nama kader, judul tugas..."
            className="pl-9 text-xs h-9 bg-white dark:bg-zinc-900 rounded-lg border-zinc-200 dark:border-zinc-800"
          />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubmissions.map((sub) => (
            <Card
              key={sub.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs"
            >
              <div className="space-y-3">
                {/* Header: Cadre info & Level */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <ParticipantAvatar
                      name={sub.cadreName}
                      photoUrl={sub.cadreAvatar}
                      sizeClass="w-9 h-9"
                      textClass="text-xs"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {sub.cadreName}
                      </h4>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {sub.eventName || `Jenjang ${sub.cadreLevel}`}
                      </span>
                    </div>
                  </div>

                  <Badge
                    className={`text-[10px] font-bold border-none ${
                      sub.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : sub.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {sub.status === "APPROVED"
                      ? "Disetujui"
                      : sub.status === "REJECTED"
                      ? "Revisi"
                      : "Menunggu"}
                  </Badge>
                </div>

                {/* Submission Title & Description */}
                <div className="space-y-1">
                  <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                    {sub.title}
                  </h5>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                    {sub.description || "Tidak ada ringkasan deskripsi."}
                  </p>
                </div>

                {/* Date and File Link */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                  <span>{sub.date || "-"}</span>
                  {sub.fileLink ? (
                    <a
                      href={sub.fileLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Buka Berkas</span>
                    </a>
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
                  onClick={() => onOpenReview(sub)}
                  className="w-full text-xs h-8 font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 cursor-pointer"
                >
                  {sub.status === "PENDING" ? "Review & Validasi" : "Ubah Hasil Review"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
