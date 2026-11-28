"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  ChevronDown,
  Calendar,
  ChevronRight,
  Building,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EventActivity } from "@/lib/db";

interface VerifikasiHeroProps {
  staffPrefix: string;
  scopeLabel: string;
  isCabangScope: boolean;
  pendingCount: number;
  totalParticipantsInEvent: number;
  selectedEventId: string;
  onSelectedEventIdChange: (id: string) => void;
  tenantEvents: EventActivity[];
  selectedEvent: EventActivity | null;
  lulusRtlCount: number;
}

export function VerifikasiHero({
  staffPrefix,
  scopeLabel,
  isCabangScope,
  pendingCount,
  totalParticipantsInEvent,
  selectedEventId,
  onSelectedEventIdChange,
  tenantEvents,
  selectedEvent,
  lulusRtlCount,
}: VerifikasiHeroProps) {
  return (
    <div className="space-y-3 pb-3.5 border-b border-zinc-200 dark:border-zinc-800">
      {/* BREADCRUMB, SCOPE & STATUS COUNTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Link
              href={staffPrefix}
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              RTL &amp; Verifikasi
            </span>
          </nav>

          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Verifikasi RTL Kaderisasi
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {isCabangScope ? (
                <Building className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              ) : (
                <GraduationCap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>{scopeLabel}</span>
            </span>
          </div>
        </div>

        {/* Quick Counter Badges */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span>{pendingCount} Antrean Verifikasi</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-xs font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>{totalParticipantsInEvent} Peserta</span>
          </div>
        </div>
      </div>

      {/* EVENT SELECTOR BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label
            htmlFor="verifikasi-event-selector"
            className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 shrink-0"
          >
            Pilih Kegiatan:
          </label>
          <div className="relative w-full sm:w-80">
            <select
              id="verifikasi-event-selector"
              value={selectedEventId}
              onChange={(e) => onSelectedEventIdChange(e.target.value)}
              className="w-full h-8.5 px-3 pr-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none shadow-2xs"
            >
              <option value="ALL">-- Semua Kegiatan ({tenantEvents.length}) --</option>
              {tenantEvents.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  [{evt.level}] {evt.name || evt.title} ({evt.status === "OPEN" ? "Buka" : "Selesai"})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {selectedEvent && (
          <div className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              {selectedEvent.date || "-"}
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-none text-[10px] font-bold">
              {selectedEvent.level}
            </Badge>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span>
              {lulusRtlCount} dari {totalParticipantsInEvent} Lulus RTL
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
