"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileSpreadsheet,
  Printer,
  CheckCheck,
  ChevronRight
} from "lucide-react";
import {
  db,
  type ParticipantEvaluation,
  type EventActivity,
  type ParticipantRegistration,
  type CadreFollowUp
} from "@/lib/db";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { LeaderboardPodium } from "./_components/LeaderboardPodium";
import { YudisiumFilters } from "./_components/YudisiumFilters";
import { YudisiumTable } from "./_components/YudisiumTable";
import { ScoreDetailModal } from "./_components/ScoreDetailModal";

export default function RekapNilaiPage() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [events, setEvents] = useState<EventActivity[]>([]);
  const [registrations, setRegistrations] = useState<ParticipantRegistration[]>([]);
  const [evaluations, setEvaluations] = useState<ParticipantEvaluation[]>([]);
  const [cadres, setCadres] = useState<CadreFollowUp[]>([]);
  const [loading, setLoading] = useState(true);

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
    setMounted(true);
    const loadData = async () => {
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
        setRegistrations(cleanRegs);

        // Deduplicate evaluations before setting state
        const dedupMap = new Map<string, typeof cleanEvals[0]>();
        for (const item of cleanEvals) {
          const key = `${item.activityId}__${(item.cadreId || item.participantName).trim().toLowerCase()}`;
          const existing = dedupMap.get(key);
          if (!existing) {
            dedupMap.set(key, item);
          } else {
            const existingCount = Object.keys(existing.sessionScores || {}).length;
            const newCount = Object.keys(item.sessionScores || {}).length;
            if (newCount > existingCount || (newCount === existingCount && (item.updatedAt || "") > (existing.updatedAt || ""))) {
              dedupMap.set(key, item);
            }
          }
        }
        setEvaluations(Array.from(dedupMap.values()));
      } catch (err) {
        console.error("Error loading evaluation data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          console.error("User parse error:", e);
        }
      }
    }

    loadData();
  }, []);

  const currentActivity = useMemo(() => {
    return events.find((e) => e.id === selectedActivityId) || events[0] || null;
  }, [events, selectedActivityId]);

  const getParticipantAvatar = (item: ParticipantEvaluation): string | undefined => {
    if (item.avatar && typeof item.avatar === "string" && (item.avatar.startsWith("http") || item.avatar.startsWith("data:") || item.avatar.startsWith("/"))) {
      return item.avatar;
    }
    const matchedCadre = cadres.find(
      (c) =>
        (item.cadreId && c.id === item.cadreId) ||
        (c.name && item.participantName && c.name.trim().toLowerCase() === item.participantName.trim().toLowerCase())
    );
    if (matchedCadre?.avatar && typeof matchedCadre.avatar === "string" && (matchedCadre.avatar.startsWith("http") || matchedCadre.avatar.startsWith("data:") || matchedCadre.avatar.startsWith("/"))) {
      return matchedCadre.avatar;
    }
    return undefined;
  };

  // All evaluations for current activity sorted by score descending
  const currentActivityEvals = useMemo(() => {
    return evaluations
      .filter((e) => e.activityId === selectedActivityId)
      .sort((a, b) => b.finalScore - a.finalScore);
  }, [evaluations, selectedActivityId]);

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


  // Export CSV
  const handleExportCSV = () => {
    if (filteredList.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const headers = [
      "Peringkat",
      "Nama Peserta",
      "Gender",
      "Asal Kampus",
      "Komisariat",
      "Jumlah Materi Dinilai",
      "Rata-rata Kognitif (30%)",
      "Rata-rata Afektif (35%)",
      "Rata-rata Motorik (35%)",
      "Nilai Akhir Kumulatif",
      "Predikat",
      "Status Kelulusan",
      "Catatan Instruktur"
    ];

    const rows = filteredList.map((item, index) => [
      index + 1,
      `"${item.participantName}"`,
      `"${item.gender || "-"}"`,
      `"${item.university || "-"}"`,
      `"${item.commissariat || "-"}"`,
      item.sessionScores ? Object.keys(item.sessionScores).length : 0,
      item.kognitif,
      item.afektif,
      item.psikomotorik,
      item.finalScore,
      item.grade,
      item.status,
      `"${(item.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Nilai_Yudisium_${selectedActivityId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("File CSV rekapitulasi berhasil diunduh!");
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
            onClick={handleExportCSV}
            className="h-8.5 text-xs font-medium border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer text-zinc-700 dark:text-zinc-300 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Ekspor Excel/CSV</span>
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
        events={events}
        selectedActivityId={selectedActivityId}
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
