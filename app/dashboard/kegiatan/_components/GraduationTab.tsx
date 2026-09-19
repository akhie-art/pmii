"use client";

import React, { useState } from "react";
import { Search, Award, Copy, CheckCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { EventActivity, ParticipantRegistration } from "./types";
import { DEFAULT_EVENT_SESSIONS } from "./types";

interface GraduationTabProps {
  event: EventActivity;
  registrations: ParticipantRegistration[];
  onMarkGraduated: (regId: string) => Promise<void>;
  onRevokeGraduation: (regId: string) => Promise<void>;
  onBatchGraduate: (regIds: string[]) => Promise<void>;
}

export default function GraduationTab({
  event,
  registrations,
  onMarkGraduated,
  onRevokeGraduation,
  onBatchGraduate
}: GraduationTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [copiedGraduates, setCopiedGraduates] = useState(false);

  const totalSessions =
    event.sessions && event.sessions.length > 0
      ? event.sessions.length
      : DEFAULT_EVENT_SESSIONS.length;

  const approvedRegistrations = registrations.filter((r) => r.status === "APPROVED");

  const filteredRegistrations = approvedRegistrations.filter((reg) => {
    return (
      reg.cadreName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.registrationNumber &&
        reg.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const eligibleUnGraduated = approvedRegistrations.filter((reg) => {
    if (reg.isGraduated) return false;
    const attCount = reg.attendance ? reg.attendance.length : 0;
    const percent = (attCount / Math.max(1, totalSessions)) * 100;
    return percent >= 75;
  });

  const graduatedCadres = approvedRegistrations.filter((r) => r.isGraduated);
  const graduatedCount = graduatedCadres.length;

  const handleSingleMark = async (regId: string) => {
    setProcessingId(regId);
    try {
      await onMarkGraduated(regId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSingleRevoke = async (regId: string) => {
    setProcessingId(regId);
    try {
      await onRevokeGraduation(regId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleBatch = async () => {
    if (eligibleUnGraduated.length === 0) return;
    setIsBatchProcessing(true);
    try {
      const ids = eligibleUnGraduated.map((r) => r.id);
      await onBatchGraduate(ids);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleCopyGraduates = () => {
    if (graduatedCadres.length === 0) return;
    const lines = [
      `Kelulusan: ${event.name}`,
      `Total: ${graduatedCadres.length} Peserta Lulus`,
      ...graduatedCadres.map(
        (r, i) => `${i + 1}. ${r.cadreName} (${r.registrationNumber || "-"})`
      )
    ].join("\n");

    navigator.clipboard.writeText(lines);
    setCopiedGraduates(true);
    setTimeout(() => setCopiedGraduates(false), 2500);
  };

  return (
    <div className="space-y-3.5 pt-1 text-left">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
        <div className="text-zinc-600 dark:text-zinc-400">
          <span>Lolos Administrasi: <strong>{approvedRegistrations.length}</strong></span>
          <span className="mx-2">&bull;</span>
          <span>Lulus KTA: <strong>{graduatedCount}</strong></span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {graduatedCount > 0 && (
            <button
              type="button"
              onClick={handleCopyGraduates}
              className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedGraduates ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedGraduates ? "Tersalin" : "Salin Lulusan"}</span>
            </button>
          )}

          {eligibleUnGraduated.length > 0 && (
            <Button
              size="xs"
              onClick={handleBatch}
              disabled={isBatchProcessing}
              className="h-7.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg border-none cursor-pointer flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5" />
              <span>{isBatchProcessing ? "Memproses..." : `Luluskan Semua (${eligibleUnGraduated.length})`}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <Input
          type="text"
          placeholder="Cari nama atau nomor registrasi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
        />
      </div>

      {/* Evaluation Table */}
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/30">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500 text-[10px] uppercase">
              <th className="p-3">Nama Peserta</th>
              <th className="p-3 text-center">Kehadiran</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredRegistrations.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-zinc-400 text-xs">
                  {approvedRegistrations.length === 0
                    ? "Belum ada peserta yang lolos screening."
                    : "Tidak ada peserta yang cocok."}
                </td>
              </tr>
            ) : (
              filteredRegistrations.map((reg) => {
                const attCount = reg.attendance ? reg.attendance.length : 0;
                const attPercent = Math.min(
                  100,
                  Math.round((attCount / Math.max(1, totalSessions)) * 100)
                );
                const isProcessing = processingId === reg.id;

                return (
                  <tr key={reg.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="p-3">
                      <span className="font-semibold text-zinc-900 dark:text-white block text-xs">
                        {reg.cadreName}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {reg.registrationNumber || "-"}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {attCount}/{totalSessions} Sesi ({attPercent}%)
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      {reg.isGraduated ? (
                        <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-none text-[8.5px] px-2 py-0.5 rounded font-medium">
                          LULUS
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-none text-[8.5px] px-2 py-0.5 rounded font-medium">
                          CALON
                        </Badge>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      {reg.isGraduated ? (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleSingleRevoke(reg.id)}
                          className="text-[11px] text-zinc-400 hover:text-rose-600 font-medium cursor-pointer"
                        >
                          {isProcessing ? "Menyimpan..." : "Batal"}
                        </button>
                      ) : (
                        <Button
                          size="xs"
                          disabled={isProcessing}
                          onClick={() => handleSingleMark(reg.id)}
                          className="h-7 px-2.5 text-[11px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer border-none"
                        >
                          {isProcessing ? "Memproses..." : "Luluskan"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
