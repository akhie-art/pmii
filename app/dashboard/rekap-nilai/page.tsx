"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileSpreadsheet,
  Printer,
  CheckCheck,
  ChevronRight,
  Loader2
} from "lucide-react";
import {
  db,
  syncEvaluationsWithRegistrations,
  type ParticipantEvaluation,
  type EventActivity,
  type CadreFollowUp
} from "@/lib/db";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isRecordInTenant, getActiveTenant, TENANT_CHANGED_EVENT } from "@/lib/tenancy";

import { LeaderboardPodium } from "./_components/LeaderboardPodium";
import { YudisiumFilters } from "./_components/YudisiumFilters";
import { YudisiumTable } from "./_components/YudisiumTable";
import { ScoreDetailModal } from "./_components/ScoreDetailModal";
import { exportRekapNilaiToExcel } from "./_components/rekapExportHelpers";

export default function RekapNilaiPage() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTenant, setActiveTenant] = useState<string>("ALL");
  const [events, setEvents] = useState<EventActivity[]>([]);
  const [evaluations, setEvaluations] = useState<ParticipantEvaluation[]>([]);
  const [cadres, setCadres] = useState<CadreFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("SEMUA");

  // Detail Modal for specific participant's scores across all materi
  const [detailParticipant, setDetailParticipant] = useState<ParticipantEvaluation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const matchRole = pathname ? pathname.match(/^\/(admin|pengurus|instruktur|dashboard)/) : null;
  const staffPrefix = matchRole && matchRole[1] !== "dashboard"
    ? `/${matchRole[1]}`
    : (currentUser?.role?.toLowerCase() === "admin" ? "/admin" : currentUser?.role?.toLowerCase() === "instruktur" ? "/instruktur" : "/pengurus");

  useEffect(() => {
    const loadData = async () => {
      setMounted(true);
      try {
        const [eventsData, regsData, evalsData, cadresData] = await Promise.all([
          db.getEvents([]),
          db.getRegistrations([]),
          db.getEvaluations([]),
          db.getCadres([])
        ]);

        setCadres(cadresData || []);

        const cleanRegs = (regsData || []).filter(
          (r) => !["reg-101", "reg-102", "reg-103", "reg-104", "reg-105", "reg-106"].includes(r.id)
        );
        const cleanEvals = (evalsData || []).filter(
          (e) =>
            !["eval-1", "eval-2", "eval-3", "eval-4", "eval-5"].includes(e.id) &&
            !["reg-101", "reg-102", "reg-103", "reg-104", "reg-105", "reg-106"].includes(e.cadreId || "")
        );

        const cleanEvents = (eventsData || [])
          .filter((e) => !["act-mapaba-2026", "act-pkd-2026"].includes(e.id))
          .map((e) => ({
            ...e,
            sessions: (e.sessions || []).filter(
              (s) =>
                !s.includes("Sejarah & Ke-PMII-an") &&
                !s.includes("Analisis Sosial & Kebijakan Publik") &&
                !s.includes("Sesi Registrasi Awal")
            )
          }));

        setEvents(cleanEvents);
        if (cleanEvents.length > 0) {
          setSelectedActivityId((prev) => {
            if (!prev || !cleanEvents.some((e) => e.id === prev)) {
              return cleanEvents[0].id;
            }
            return prev;
          });
        }

        // Comprehensive sync of all registered participants across all events
        const { synced, hasChanges } = syncEvaluationsWithRegistrations(
          cleanEvals,
          cleanRegs,
          cleanEvents,
          cadresData || []
        );

        if (hasChanges || cleanEvals.length !== evalsData.length || synced.length !== cleanEvals.length) {
          await db.saveEvaluations(synced);
        }

        setEvaluations(synced);
      } catch (err) {
        console.error("Error loading evaluation data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== "undefined") {
      queueMicrotask(() => {
        const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
        let uObj: any = null;
        if (stored) {
          try {
            uObj = JSON.parse(stored);
            setCurrentUser(uObj);
          } catch (e) {
            console.error("User parse error:", e);
          }
        }
        const curTenant = getActiveTenant(uObj) || "ALL";
        setActiveTenant(curTenant);
      });

      const handleTenant = (e: any) => {
        setActiveTenant(e.detail?.activeTenant || "ALL");
      };
      window.addEventListener(TENANT_CHANGED_EVENT, handleTenant);

      loadData();

      return () => {
        window.removeEventListener(TENANT_CHANGED_EVENT, handleTenant);
      };
    } else {
      loadData();
    }
  }, []);

  // Filtered Events by Tenant
  const tenantEvents = useMemo(() => {
    return events.filter((e) => isRecordInTenant(currentUser, e, activeTenant));
  }, [events, currentUser, activeTenant]);

  const currentActivity = useMemo(() => {
    return tenantEvents.find((e) => e.id === selectedActivityId) || tenantEvents[0] || null;
  }, [tenantEvents, selectedActivityId]);

  const getParticipantAvatar = (item: ParticipantEvaluation): string | undefined => {
    const isValidUrl = (val: unknown): val is string =>
      typeof val === "string" &&
      (val.startsWith("http") || val.startsWith("data:") || val.startsWith("/"));

    const matchedCadre = cadres.find(
      (c) =>
        (item.cadreId && c.id === item.cadreId) ||
        (c.name && item.participantName && c.name.trim().toLowerCase() === item.participantName.trim().toLowerCase())
    );
    if (isValidUrl(matchedCadre?.avatar)) {
      return matchedCadre.avatar;
    }
    if (matchedCadre && !matchedCadre.avatar && item.avatar?.includes("/materials/avatars/")) {
      return undefined;
    }
    if (isValidUrl(item.avatar)) {
      return item.avatar;
    }
    return undefined;
  };

  const effectiveActivityId = currentActivity?.id || selectedActivityId;

  // All evaluations for current activity sorted by score descending
  const currentActivityEvals = useMemo(() => {
    return evaluations
      .filter((e) => e.activityId === effectiveActivityId)
      .sort((a, b) => b.finalScore - a.finalScore);
  }, [evaluations, effectiveActivityId]);

  // Top 3 Leaderboard
  const topThree = useMemo(() => {
    return currentActivityEvals
      .filter((e) => e.status !== "BELUM_DINILAI")
      .slice(0, 3);
  }, [currentActivityEvals]);

  // Filtered for table
  const filteredList = useMemo(() => {
    return currentActivityEvals.filter((item) => {
      const matchSearch =
        item.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.university && item.university.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === "SEMUA" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [currentActivityEvals, searchQuery, statusFilter]);

  // Export Excel (.xlsx) 1 sheet persis tabel web (merge cell per peserta + sub-baris materi + Rata-rata Akumulasi)
  const handleExportExcel = async () => {
    if (isExporting) return;
    if (filteredList.length === 0) {
      toast.error("Tidak ada data nilai untuk diekspor ke Excel.");
      return;
    }

    setIsExporting(true);
    try {
      const { fileName, rowCount } = await exportRekapNilaiToExcel({
        evaluations: filteredList,
        activity: currentActivity,
        statusFilter,
        searchQuery,
      });
      toast.success(`Berhasil mengekspor ${rowCount} data peserta ke ${fileName}`);
    } catch (err) {
      console.error("Gagal mengekspor rekap nilai ke Excel:", err);
      toast.error("Gagal mengekspor data rekap nilai ke Excel. Silakan coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenDetail = (participant: ParticipantEvaluation) => {
    setDetailParticipant(participant);
    setIsDetailOpen(true);
  };

  const handleFinalize = () => {
    toast.success("Hasil yudisium berhasil disahkan dan diteruskan ke Pengurus Komisariat!");
  };

  if (!mounted || loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 animate-pulse">
        <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-zinc-900 dark:text-zinc-100 pb-12 font-sans select-none">
      {/* 1. BREADCRUMB & ACTION TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Link
            href={staffPrefix}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <Link
            href={`${staffPrefix}/penilaian`}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Penilaian
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Rekapitulasi Nilai & Yudisium
          </span>
        </nav>

        {/* Action Buttons: Stacked & Full-Width on Mobile, Inline on Desktop */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting || filteredList.length === 0}
            onClick={handleExportExcel}
            className="h-8.5 text-xs font-medium border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer text-zinc-700 dark:text-zinc-300 shadow-2xs disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin shrink-0" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <span className="truncate">{isExporting ? "Mengekspor..." : "Ekspor Excel"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8.5 text-xs font-medium border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer text-zinc-700 dark:text-zinc-300 shadow-2xs hidden sm:flex"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400 shrink-0" />
            <span className="truncate">Cetak Hasil</span>
          </Button>

          <Button
            size="sm"
            onClick={handleFinalize}
            className="h-8.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-1.5 border-none cursor-pointer shadow-xs"
          >
            <CheckCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">Sahkan Yudisium</span>
          </Button>
        </div>
      </div>

      {/* 2. TOP 3 PODIUM */}
      <LeaderboardPodium topThree={topThree} />


      {/* 4. CONTROLS BAR */}
      <YudisiumFilters
        events={tenantEvents}
        selectedActivityId={effectiveActivityId}
        setSelectedActivityId={setSelectedActivityId}
        currentActivityName={currentActivity?.name}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* 5. FULL YUDISIUM TABLE */}
      <YudisiumTable
        filteredList={filteredList}
        currentActivity={currentActivity}
        getParticipantAvatar={getParticipantAvatar}
        onOpenDetail={handleOpenDetail}
      />

      {/* 6. DETAIL MODAL PER MATERI */}
      <ScoreDetailModal
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        participant={detailParticipant}
      />
    </div>
  );
}
