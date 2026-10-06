"use client";

import React from "react";
import { Users, Search, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
}: ParticipantProgressTabProps) {
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
            { id: "BELUM_MULAI", label: "Belum Mulai" }
          ].map((st) => (
            <button
              key={st.id}
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
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Cari nama peserta..."
            className="pl-9 text-xs h-9 bg-white dark:bg-zinc-900 rounded-lg border-zinc-200 dark:border-zinc-800"
          />
        </div>
      </div>

      {/* Participants Table / Cards */}
      {filteredParticipants.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Belum ada data peserta
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {selectedEventName
              ? `Belum ada peserta yang terdaftar untuk kegiatan ${selectedEventName}.`
              : "Pilih kegiatan tertentu atau pastikan ada peserta yang mendaftar kegiatan kaderisasi."}
          </p>
        </Card>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold">
                <tr>
                  <th className="p-3.5 pl-5">Nama Peserta</th>
                  <th className="p-3.5">Kegiatan & Jenjang</th>
                  <th className="p-3.5">Progres RTL</th>
                  <th className="p-3.5">Status Akhir</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredParticipants.map((p) => (
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
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                            {p.cadreName}
                          </span>
                          <span className="text-[11px] text-zinc-400 block">
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
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block line-clamp-1 max-w-[180px]">
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
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {p.progressPercent}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${p.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5">
                      {p.status === "SELESAI" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-none font-bold text-[10px] gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Lulus RTL
                        </Badge>
                      ) : p.status === "REVISI" ? (
                        <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-none font-bold text-[10px] gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Perlu Revisi
                        </Badge>
                      ) : p.status === "AKTIF" ? (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-none font-bold text-[10px] gap-1">
                          <Clock className="w-3 h-3" />
                          Sedang Proses
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-none font-medium text-[10px]">
                          Belum Mulai
                        </Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => onOpenDetailModal(p)}
                          className="h-7 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          Detail Tugas
                        </Button>

                        {p.status !== "SELESAI" && (
                          <Button
                            onClick={() => onSahkanKelulusan(p)}
                            className="h-7 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                          >
                            Sahkan Lulus
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
