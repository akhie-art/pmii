"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { EventActivity, EventStageTimeline } from "@/lib/db";
import { getDefaultEventTimeline } from "@/lib/db";

export function ToggleSwitch({
  checked,
  onChange,
  disabled
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
        checked ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

interface TimelineTabProps {
  event: EventActivity;
  onUpdateEvent: (updated: EventActivity) => Promise<void>;
  registrationsCount: number;
  approvedCount: number;
  pendingCount: number;
}

export default function TimelineTab({
  event,
  onUpdateEvent,
  registrationsCount,
  approvedCount,
  pendingCount
}: TimelineTabProps) {
  const [timeline, setTimeline] = useState<EventStageTimeline>(() =>
    getDefaultEventTimeline(event)
  );

  // Sync state if event prop changes
  React.useEffect(() => {
    setTimeline(getDefaultEventTimeline(event));
  }, [event]);

  // Immediate toggle for individual stages
  const handleToggleStage = async (
    stageKey: "registration" | "forum" | "rtl" | "certification",
    checked: boolean
  ) => {
    const updatedStage = {
      ...timeline[stageKey],
      isOpen: checked
    };
    const updatedTimeline = {
      ...timeline,
      [stageKey]: updatedStage
    };
    setTimeline(updatedTimeline);

    // If toggling registration, also sync main event.status
    const updatedEvent: EventActivity = {
      ...event,
      status: stageKey === "registration" ? (checked ? "OPEN" : "CLOSED") : event.status,
      timeline: updatedTimeline
    };

    try {
      await onUpdateEvent(updatedEvent);
      const stageNames = {
        registration: "Pendaftaran & Screening",
        forum: "Pelaksanaan Forum & Sesi",
        rtl: "Pengumpulan RTL",
        certification: "Penerbitan Sertifikat & Yudisium"
      };
      toast.success(
        `${stageNames[stageKey]} berhasil ${checked ? "DIBUKA" : "DITUTUP"}.`
      );
    } catch {
      toast.error("Gagal memperbarui status tahapan.");
    }
  };

  return (
    <div className="space-y-3.5">
      {/* TIMELINE 4 STAGES TOGGLE CARDS */}
      <div className="space-y-3">
        {/* TAHAP 1: PENDAFTARAN & SCREENING */}
        <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs mt-0.5 shrink-0 ${
                  timeline.registration.isOpen
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                }`}
              >
                1
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Tahap 1: Formulir Pendaftaran & Screening Berkas
                  </h4>
                  <Badge
                    className={
                      timeline.registration.isOpen
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] px-1.5 py-0 rounded font-semibold"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[9px] px-1.5 py-0 rounded font-semibold"
                    }
                  >
                    {timeline.registration.isOpen ? "Terbuka" : "Ditutup"}
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Calon peserta mendaftar, mengisi formulir online, dan diverifikasi panitia screening.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {timeline.registration.isOpen ? "Buka Akses" : "Tutup Akses"}
              </span>
              <ToggleSwitch
                checked={timeline.registration.isOpen}
                onChange={(val: boolean) => handleToggleStage("registration", val)}
              />
            </div>
          </div>
        </Card>

        {/* TAHAP 2: PELAKSANAAN FORUM & MATERI */}
        <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs mt-0.5 shrink-0 ${
                  timeline.forum.isOpen
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                }`}
              >
                2
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Tahap 2: Pelaksanaan Forum, Sesi Materi & Presensi
                  </h4>
                  <Badge
                    className={
                      timeline.forum.isOpen
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] px-1.5 py-0 rounded font-semibold"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[9px] px-1.5 py-0 rounded font-semibold"
                    }
                  >
                    {timeline.forum.isOpen ? "Aktif Berjalan" : "Ditutup"}
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Peserta hadir di forum, memindai presensi QR code, mengikuti materi, serta mengerjakan Pre-test & Post-test.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {timeline.forum.isOpen ? "Buka Akses" : "Tutup Akses"}
              </span>
              <ToggleSwitch
                checked={timeline.forum.isOpen}
                onChange={(val: boolean) => handleToggleStage("forum", val)}
              />
            </div>
          </div>
        </Card>

        {/* TAHAP 3: RTL (RENCANA TINDAK LANJUT) */}
        <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs mt-0.5 shrink-0 ${
                  timeline.rtl.isOpen
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                }`}
              >
                3
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Tahap 3: Rencana Tindak Lanjut (RTL)
                  </h4>
                  <Badge
                    className={
                      timeline.rtl.isOpen
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] px-1.5 py-0 rounded font-semibold"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[9px] px-1.5 py-0 rounded font-semibold"
                    }
                  >
                    {timeline.rtl.isOpen ? "Masa Pengumpulan" : "Ditutup"}
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Peserta mengunggah laporan penugasan, resume diskusi, dan RTL pasca forum kaderisasi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {timeline.rtl.isOpen ? "Buka Akses" : "Tutup Akses"}
              </span>
              <ToggleSwitch
                checked={timeline.rtl.isOpen}
                onChange={(val: boolean) => handleToggleStage("rtl", val)}
              />
            </div>
          </div>
        </Card>

        {/* TAHAP 4: TERIMA SERTIFIKAT & YUDISIUM */}
        <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs mt-0.5 shrink-0 ${
                  timeline.certification.isOpen
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                }`}
              >
                4
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Tahap 4: Yudisium & Penerbitan Sertifikat PMII
                  </h4>
                  <Badge
                    className={
                      timeline.certification.isOpen
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] px-1.5 py-0 rounded font-semibold"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[9px] px-1.5 py-0 rounded font-semibold"
                    }
                  >
                    {timeline.certification.isOpen ? "Klaim Terbuka" : "Terkunci"}
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Peserta yang lulus berhak mengunduh sertifikat resmi ber-barcode dan NIPA Digital.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {timeline.certification.isOpen ? "Buka Klaim" : "Kunci Klaim"}
              </span>
              <ToggleSwitch
                checked={timeline.certification.isOpen}
                onChange={(val: boolean) => handleToggleStage("certification", val)}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
