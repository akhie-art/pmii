"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ChevronRight } from "lucide-react";
import {
  db,
  generateUUID,
  deduplicateEvaluations,
  type ParticipantEvaluation,
  type SessionScore,
  type EventActivity,
  type ParticipantRegistration,
  type CadreFollowUp,
  calculateEvaluationScore,
  recalculateParticipantCumulative
} from "@/lib/db";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { AssessmentFilters } from "./_components/AssessmentFilters";
import { MateriTabs } from "./_components/MateriTabs";
import { AssessmentList } from "./_components/AssessmentList";
import { ScoringModal } from "./_components/ScoringModal";

export default function PenilaianPesertaPage() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [events, setEvents] = useState<EventActivity[]>([]);
  const [registrations, setRegistrations] = useState<ParticipantRegistration[]>([]);
  const [evaluations, setEvaluations] = useState<ParticipantEvaluation[]>([]);
  const [cadres, setCadres] = useState<CadreFollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Activity & Session
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [selectedMateri, setSelectedMateri] = useState<string>("ALL");

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("SEMUA");

  // Modal Scoring State
  const [selectedEval, setSelectedEval] = useState<ParticipantEvaluation | null>(null);
  const [modalMateri, setModalMateri] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Scoring Form States
  const [kognitif, setKognitif] = useState(80);
  const [afektif, setAfektif] = useState(80);
  const [psikomotorik, setPsikomotorik] = useState(80);
  const [sessionNotes, setSessionNotes] = useState("");

  const matchRole = pathname ? pathname.match(/^\/(admin|pengurus|instruktur|dashboard)/) : null;
  const staffPrefix = matchRole && matchRole[1] !== "dashboard"
    ? `/${matchRole[1]}`
    : (currentUser?.role?.toLowerCase() === "admin" ? "/admin" : currentUser?.role?.toLowerCase() === "instruktur" ? "/instruktur" : "/pengurus");

  // Load Data and Auto-Sync Participants from Registrations
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

        // Filter out legacy dummy registrations and evaluations
        const cleanRegs = (regsData || []).filter(
          (r) => !["reg-101", "reg-102", "reg-103", "reg-104", "reg-105", "reg-106"].includes(r.id)
        );
        const cleanEvals = (evalsData || []).filter(
          (e) =>
            !["eval-1", "eval-2", "eval-3", "eval-4", "eval-5"].includes(e.id) &&
            !["reg-101", "reg-102", "reg-103", "reg-104", "reg-105", "reg-106"].includes(e.cadreId || "")
        );

        setRegistrations(cleanRegs);

        // Auto-populate
        const targetEventId = cleanEvents[0]?.id || "";
        setSelectedActivityId((prev) => {
          if (!prev || !cleanEvents.some((e) => e.id === prev)) {
            return targetEventId;
          }
          return prev;
        });
        const currentEvent = cleanEvents.find((e) => e.id === targetEventId) || cleanEvents[0] || null;
        const eventRegs = targetEventId ? cleanRegs.filter((r) => r.eventId === targetEventId) : [];

        let hasNewSync = false;
        const syncedList = [...cleanEvals];

        // Enrich existing evaluations with photo avatar if available
        syncedList.forEach((e) => {
          if (!e.avatar) {
            const matchedCadre = cadresData?.find(
              (c) =>
                (c.name && e.participantName && c.name.trim().toLowerCase() === e.participantName.trim().toLowerCase()) ||
                (e.cadreId && c.id === e.cadreId)
            );
            if (matchedCadre?.avatar) {
              e.avatar = matchedCadre.avatar;
              hasNewSync = true;
            }
          }
        });

        eventRegs.forEach((reg) => {
          const matchedCadre = cadresData?.find(
            (c) =>
              (c.name && reg.cadreName && c.name.trim().toLowerCase() === reg.cadreName.trim().toLowerCase()) ||
              (c.email && reg.cadreEmail && c.email.toLowerCase() === reg.cadreEmail.toLowerCase())
          );
          const regCadreId = matchedCadre?.id || reg.id;
          const regCleanName = (reg.cadreName || "").trim().toLowerCase();

          const alreadyInEval = syncedList.some((e) => {
            if (e.activityId !== targetEventId) return false;
            const evalCleanName = (e.participantName || "").trim().toLowerCase();
            const evalCadreId = (e.cadreId || "").trim().toLowerCase();
            return (
              (regCadreId && evalCadreId && (evalCadreId === regCadreId.toLowerCase() || (matchedCadre?.id && evalCadreId === matchedCadre.id.toLowerCase()))) ||
              (regCleanName && evalCleanName && evalCleanName === regCleanName)
            );
          });

          if (!alreadyInEval) {
            hasNewSync = true;
            syncedList.push({
              id: generateUUID(),
              activityId: targetEventId,
              activityName: currentEvent?.name || "",
              cadreId: regCadreId,
              participantName: reg.cadreName,
              avatar: matchedCadre?.avatar || "",
              gender: (matchedCadre?.gender as any) || "",
              commissariat: matchedCadre?.commissariat || "",
              university: matchedCadre?.perguruanTinggi || "",
              level: currentEvent?.level || "MAPABA",
              sessionScores: {},
              kognitif: 0,
              afektif: 0,
              psikomotorik: 0,
              finalScore: 0,
              grade: "E",
              status: "BELUM_DINILAI",
              evaluatorId: currentUser?.id || "",
              evaluatorName: currentUser?.name || "",
              notes: "",
              updatedAt: new Date().toISOString()
            });
          }
        });

        // Deduplicate final list before saving and setting state
        const dedupedList = deduplicateEvaluations(syncedList);

        if (hasNewSync || cleanEvals.length !== evalsData.length || dedupedList.length !== cleanEvals.length) {
          await db.saveEvaluations(dedupedList);
        }

        setEvaluations(dedupedList);
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

  // Selected Activity Object
  const currentActivity = useMemo(() => {
    return events.find((e) => e.id === selectedActivityId) || events[0] || null;
  }, [events, selectedActivityId]);

  // List of Materi Sessions for Current Activity
  const activitySessions: string[] = useMemo(() => {
    if (currentActivity?.sessions && Array.isArray(currentActivity.sessions)) {
      return currentActivity.sessions;
    }
    return [];
  }, [currentActivity]);

  // Helper to resolve avatar for participant
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

  // When activity changes, sync registrations of that activity into evaluations
  const handleActivityChange = async (actId: string) => {
    setSelectedActivityId(actId);
    setSelectedMateri("ALL");

    const targetEvent = events.find((e) => e.id === actId) || events[0] || null;
    const eventRegs = registrations.filter((r) => r.eventId === actId);

    let hasNewSync = false;
    const syncedList = [...evaluations];

    eventRegs.forEach((reg) => {
      const matchedCadre = cadres.find(
        (c) =>
          (c.name && reg.cadreName && c.name.trim().toLowerCase() === reg.cadreName.trim().toLowerCase()) ||
          (c.email && reg.cadreEmail && c.email.toLowerCase() === reg.cadreEmail.toLowerCase())
      );
      const regCadreId = matchedCadre?.id || reg.id;
      const regCleanName = (reg.cadreName || "").trim().toLowerCase();

      const alreadyInEval = syncedList.some((e) => {
        if (e.activityId !== actId) return false;
        const evalCleanName = (e.participantName || "").trim().toLowerCase();
        const evalCadreId = (e.cadreId || "").trim().toLowerCase();
        return (
          (regCadreId && evalCadreId && (evalCadreId === regCadreId.toLowerCase() || (matchedCadre?.id && evalCadreId === matchedCadre.id.toLowerCase()))) ||
          (regCleanName && evalCleanName && evalCleanName === regCleanName)
        );
      });

      if (!alreadyInEval) {
        hasNewSync = true;
        syncedList.push({
          id: generateUUID(),
          activityId: actId,
          activityName: targetEvent?.name || "",
          cadreId: regCadreId,
          participantName: reg.cadreName,
          avatar: matchedCadre?.avatar || "",
          gender: (matchedCadre?.gender as any) || "",
          commissariat: matchedCadre?.commissariat || "",
          university: matchedCadre?.perguruanTinggi || "",
          level: targetEvent?.level || "MAPABA",
          sessionScores: {},
          kognitif: 0,
          afektif: 0,
          psikomotorik: 0,
          finalScore: 0,
          grade: "E",
          status: "BELUM_DINILAI",
          evaluatorId: currentUser?.id || "",
          evaluatorName: currentUser?.name || "",
          notes: "",
          updatedAt: new Date().toISOString()
        });
      }
    });

    if (hasNewSync) {
      const dedupedList = deduplicateEvaluations(syncedList);
      setEvaluations(dedupedList);
      await db.saveEvaluations(dedupedList);
      toast.info(`Daftar peserta otomatis disinkronkan dari pendaftaran ${targetEvent?.name || ""}`);
    }
  };

  // Filtered Participants List
  const filteredParticipants = useMemo(() => {
    return evaluations.filter((item) => {
      const matchActivity = item.activityId === selectedActivityId;
      const matchSearch =
        item.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.university && item.university.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchStatus = true;
      if (statusFilter === "LULUS") matchStatus = item.status === "LULUS";
      else if (statusFilter === "LULUS_BERSYARAT") matchStatus = item.status === "LULUS_BERSYARAT";
      else if (statusFilter === "TIDAK_LULUS") matchStatus = item.status === "TIDAK_LULUS";
      else if (statusFilter === "BELUM_DINILAI") {
        if (selectedMateri === "ALL") {
          matchStatus = item.status === "BELUM_DINILAI";
        } else {
          matchStatus = !item.sessionScores || !item.sessionScores[selectedMateri];
        }
      }

      return matchActivity && matchSearch && matchStatus;
    });
  }, [evaluations, selectedActivityId, searchQuery, statusFilter, selectedMateri]);

  // Open Score Modal for specific materi
  const handleOpenScoreModal = (evalItem: ParticipantEvaluation, materi: string) => {
    setSelectedEval(evalItem);
    setModalMateri(materi);

    const existingSession = evalItem.sessionScores ? evalItem.sessionScores[materi] : null;

    if (existingSession) {
      setKognitif(existingSession.kognitif);
      setAfektif(existingSession.afektif);
      setPsikomotorik(existingSession.psikomotorik);
      setSessionNotes(existingSession.notes || "");
    } else {
      setKognitif(80);
      setAfektif(80);
      setPsikomotorik(80);
      setSessionNotes("");
    }

    setIsModalOpen(true);
  };

  // Live calculation of current modal values
  const currentModalCalc = useMemo(() => {
    return calculateEvaluationScore(kognitif, afektif, psikomotorik);
  }, [kognitif, afektif, psikomotorik]);

  // Save Session Score and Auto-Recalculate Cumulative Score
  const handleSaveEvaluation = async () => {
    if (!selectedEval || !modalMateri) return;

    const sessionScore: SessionScore = {
      materiId: `materi-${modalMateri.substring(0, 1)}`,
      materiTitle: modalMateri,
      kognitif,
      afektif,
      psikomotorik,
      score: currentModalCalc.finalScore,
      notes: sessionNotes,
      evaluatedAt: new Date().toISOString(),
      evaluatorName: currentUser?.name || "Sahabat Instruktur"
    };

    const updatedList = evaluations.map((item) => {
      if (item.id === selectedEval.id) {
        const updatedSessionScores = {
          ...(item.sessionScores || {}),
          [modalMateri]: sessionScore
        };

        const cumulative = recalculateParticipantCumulative(updatedSessionScores);

        return {
          ...item,
          sessionScores: updatedSessionScores,
          kognitif: cumulative.kognitif,
          afektif: cumulative.afektif,
          psikomotorik: cumulative.psikomotorik,
          finalScore: cumulative.finalScore,
          grade: cumulative.grade,
          status: cumulative.status,
          evaluatorId: currentUser?.id || item.evaluatorId || "user-instruktur",
          evaluatorName: currentUser?.name || item.evaluatorName || "Sahabat Instruktur",
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    setEvaluations(updatedList);
    await db.saveEvaluations(updatedList);
    setIsModalOpen(false);
    toast.success(`Nilai ${modalMateri} untuk ${selectedEval.participantName} berhasil disimpan!`);
  };

  if (!mounted || loading) {
    return (
      <div className="space-y-5 max-w-7xl mx-auto p-4 animate-pulse">
        <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="h-14 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        <div className="h-10 w-96 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="h-80 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-zinc-900 dark:text-zinc-100 pb-16 font-sans select-none">
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
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Penilaian
          </span>
        </nav>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Link href={`${staffPrefix}/rekap-nilai`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8.5 text-xs font-medium border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer text-zinc-700 dark:text-zinc-300 shadow-2xs"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Rekapitulasi & Yudisium</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. MINIMALIST CONTROLS BAR */}
      <AssessmentFilters
        events={events}
        selectedActivityId={selectedActivityId}
        onActivityChange={handleActivityChange}
        currentActivity={currentActivity}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* 3. SESI MATERI HORIZONTAL PILL TABS */}
      <MateriTabs
        selectedMateri={selectedMateri}
        setSelectedMateri={setSelectedMateri}
        activitySessions={activitySessions}
        evaluations={evaluations}
        selectedActivityId={selectedActivityId}
        filteredParticipantsCount={filteredParticipants.length}
      />

      {/* 4. PARTICIPANTS TABLE / CARD LIST */}
      <AssessmentList
        filteredParticipants={filteredParticipants}
        selectedMateri={selectedMateri}
        activitySessions={activitySessions}
        currentActivity={currentActivity}
        getParticipantAvatar={getParticipantAvatar}
        onOpenScoreModal={handleOpenScoreModal}
      />

      {/* 5. CLEAN MINIMALIST SCORING MODAL */}
      <ScoringModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        selectedEval={selectedEval}
        modalMateri={modalMateri}
        getParticipantAvatar={getParticipantAvatar}
        currentModalCalc={currentModalCalc}
        kognitif={kognitif}
        setKognitif={setKognitif}
        afektif={afektif}
        setAfektif={setAfektif}
        psikomotorik={psikomotorik}
        setPsikomotorik={setPsikomotorik}
        sessionNotes={sessionNotes}
        setSessionNotes={setSessionNotes}
        onSaveEvaluation={handleSaveEvaluation}
      />
    </div>
  );
}
