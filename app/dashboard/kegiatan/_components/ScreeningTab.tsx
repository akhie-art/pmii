"use client";

import React, { useState } from "react";
import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { EventActivity, ParticipantRegistration } from "./types";

interface ScreeningTabProps {
  event: EventActivity;
  registrations: ParticipantRegistration[];
  onOpenScreening: (reg: ParticipantRegistration) => void;
}

export default function ScreeningTab({
  event,
  registrations,
  onOpenScreening
}: ScreeningTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  const totalFields = (event.formFields || []).length;

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.cadreName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.cadreEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.registrationNumber && reg.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || reg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = registrations.filter((r) => r.status === "PENDING").length;
  const approvedCount = registrations.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = registrations.filter((r) => r.status === "REJECTED").length;

  return (
    <div className="space-y-3.5 pt-1">
      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Cari nama atau nomor registrasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap ${
              statusFilter === "ALL"
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            Semua ({registrations.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("PENDING")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap ${
              statusFilter === "PENDING"
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            Menunggu ({pendingCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("APPROVED")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap ${
              statusFilter === "APPROVED"
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            Lolos ({approvedCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("REJECTED")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap ${
              statusFilter === "REJECTED"
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            Ditolak ({rejectedCount})
          </button>
        </div>
      </div>

      {/* Registrations List */}
      {filteredRegistrations.length === 0 ? (
        <div className="py-12 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
          Tidak ada data pendaftar.
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-0.5">
          {filteredRegistrations.map((reg) => {
            const verifiedCount = Object.values(reg.verificationStatus || {}).filter(Boolean).length;

            return (
              <div
                key={reg.id}
                className="p-3 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {reg.cadreName ? reg.cadreName.substring(0, 2).toUpperCase() : "PM"}
                  </div>

                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                        {reg.cadreName}
                      </span>

                      <Badge
                        className={`text-[8.5px] font-medium px-1.5 py-0.2 rounded border-none ${
                          reg.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : reg.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {reg.status === "APPROVED"
                          ? "Lolos"
                          : reg.status === "REJECTED"
                          ? "Ditolak"
                          : "Menunggu"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                      <span>{reg.registrationNumber || "Belum ID"}</span>
                      <span>&bull;</span>
                      <span className="truncate">{reg.cadreEmail}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-auto">
                  <span className="text-[10px] text-zinc-500 font-medium">
                    Berkas: {verifiedCount}/{totalFields}
                  </span>

                  <Button
                    size="xs"
                    onClick={() => onOpenScreening(reg)}
                    className="h-7.5 px-3 text-[11px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer border-none flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Tinjau</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
