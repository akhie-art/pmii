"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BookMarked,
  FileDown,
  HelpCircle,
  Lock,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { db } from "@/lib/db";
import type { KaderisasiLevel, SyllabusItem, MaterialFile, QuizQuestion } from "@/lib/db";

import { LevelId, LEVEL_ORDER, LEVEL_METAS } from "./_components/types";
import { MateriHeader } from "./_components/MateriHeader";
import { SyllabusSection } from "./_components/SyllabusSection";
import { MaterialDownloads } from "./_components/MaterialDownloads";
import { QuizSection } from "./_components/QuizSection";

export default function KaderMateriPage() {
  const [mounted, setMounted] = useState(false);
  const [kaderisasiData, setKaderisasiData] = useState<Record<string, KaderisasiLevel>>({});
  const [selectedLevelId, setSelectedLevelId] = useState<LevelId>("MAPABA");
  const [userCadreLevel, setUserCadreLevel] = useState<LevelId>("MAPABA");
  const [isAdminOrPengurus, setIsAdminOrPengurus] = useState(false);
  const [activeTab, setActiveTab] = useState<"syllabus" | "materials" | "quiz">("syllabus");

  // Quiz States
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Load curriculum and active cadre level dynamically
  useEffect(() => {
    const loadData = async () => {
      try {
        const [kurikulumRes, cadres] = await Promise.all([
          db.getKurikulum(),
          db.getCadres([])
        ]);

        if (kurikulumRes && Object.keys(kurikulumRes).length > 0) {
          setKaderisasiData(kurikulumRes);
        } else {
          setKaderisasiData({});
        }

        // Determine cadre's current level
        const activeId = typeof window !== "undefined" ? (localStorage.getItem("PMII_ACTIVE_CADRE_ID") || "") : "";
        const savedUserStr = typeof window !== "undefined" ? localStorage.getItem("PMII_LOGGED_IN_USER") : null;
        let loggedInUser: any = null;
        if (savedUserStr) {
          try {
            loggedInUser = JSON.parse(savedUserStr);
          } catch (e) {}
        }

        const role = (loggedInUser?.role || "").toLowerCase();
        const isAdmin = role === "admin" || role === "pengurus";
        setIsAdminOrPengurus(isAdmin);

        const currentCadre = (activeId ? cadres.find((c: any) => c.id === activeId) : null) || 
                             (loggedInUser ? cadres.find((c: any) => c.id === loggedInUser.id || (c.email && c.email.toLowerCase() === loggedInUser.email?.toLowerCase())) : null) || 
                             cadres[0] || null;

        const savedSimLevel = typeof window !== "undefined" ? localStorage.getItem("PMII_USER_CADRE_LEVEL") : null;

        let detectedLevel: LevelId = "MAPABA";
        if (savedSimLevel && ["MAPABA", "PKD", "PKL", "PKN"].includes(savedSimLevel)) {
          detectedLevel = savedSimLevel as LevelId;
        } else if (currentCadre?.level && ["MAPABA", "PKD", "PKL", "PKN"].includes(currentCadre.level)) {
          detectedLevel = currentCadre.level as LevelId;
        } else if (loggedInUser?.level && ["MAPABA", "PKD", "PKL", "PKN"].includes(loggedInUser.level)) {
          detectedLevel = loggedInUser.level as LevelId;
        }

        setUserCadreLevel(detectedLevel);
        setSelectedLevelId(detectedLevel);
      } catch (err) {
        console.error("Error loading curriculum data:", err);
      } finally {
        setMounted(true);
      }
    };

    loadData();
  }, []);

  const currentLevel: KaderisasiLevel | undefined = kaderisasiData[selectedLevelId];
  const syllabusList: SyllabusItem[] = currentLevel?.syllabus || [];
  const materialsList: MaterialFile[] = currentLevel?.materials || [];
  const quizList: QuizQuestion[] = currentLevel?.quiz || [];

  const totalDurationMinutes = useMemo(() => {
    return syllabusList.reduce((acc, curr) => acc + (curr.durationHours || 90), 0);
  }, [syllabusList]);

  const isLevelAccessible = (level: LevelId): boolean => {
    return LEVEL_ORDER[level] <= LEVEL_ORDER[userCadreLevel];
  };

  const handleLevelChange = (levelId: LevelId) => {
    if (!isLevelAccessible(levelId)) {
      toast.error(
        `Akses Terkunci: Anda saat ini menempuh jenjang ${userCadreLevel}. Selesaikan kaderisasi ${userCadreLevel} terlebih dahulu untuk membuka materi ${levelId}.`
      );
      return;
    }
    setSelectedLevelId(levelId);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setScore(0);
  };

  const handleSimulateLevelChange = (newLevel: LevelId) => {
    setUserCadreLevel(newLevel);
    if (LEVEL_ORDER[selectedLevelId] > LEVEL_ORDER[newLevel]) {
      setSelectedLevelId(newLevel);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("PMII_USER_CADRE_LEVEL", newLevel);
    }
    toast.info(`Simulasi jenjang kader disetel ke: ${newLevel}`);
  };

  const handleDownloadSingleFile = (fileUrl: string, fileName: string, materialId: string) => {
    // Increment download count dynamically
    const updatedMaterials = materialsList.map((m) =>
      m.id === materialId ? { ...m, downloadCount: (m.downloadCount || 0) + 1 } : m
    );

    const updatedKurikulum = {
      ...kaderisasiData,
      [selectedLevelId]: {
        ...currentLevel,
        materials: updatedMaterials
      }
    };

    setKaderisasiData(updatedKurikulum);
    db.saveKurikulum(updatedKurikulum);

    // Trigger download
    const link = document.createElement("a");
    link.href = fileUrl || "#";
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Mengunduh berkas: ${fileName}`);
  };

  const handleAnswerSelect = (questionId: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleQuizSubmit = () => {
    let correctCount = 0;
    quizList.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / (quizList.length || 1)) * 100);
    setScore(calculatedScore);
    setQuizSubmitted(true);
  };

  const handleQuizReset = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setScore(0);
  };

  if (!mounted) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto font-sans p-2">
        <div className="h-56 bg-zinc-200/80 dark:bg-zinc-800/40 rounded-2xl animate-pulse" />
        <div className="h-12 bg-zinc-200/80 dark:bg-zinc-800/40 rounded-xl animate-pulse" />
        <div className="space-y-4">
          <div className="h-44 bg-zinc-200/80 dark:bg-zinc-800/40 rounded-xl animate-pulse" />
          <div className="h-44 bg-zinc-200/80 dark:bg-zinc-800/40 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const isAccessible = isLevelAccessible(selectedLevelId);
  const selectedMeta = LEVEL_METAS[selectedLevelId];

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-zinc-900 dark:text-zinc-100 font-sans pb-12">
      {/* 1. HERO HEADER WITH STEPPER AND STATS */}
      <MateriHeader
        selectedLevelId={selectedLevelId}
        userCadreLevel={userCadreLevel}
        isAdminOrPengurus={isAdminOrPengurus}
        totalSubjects={syllabusList.length}
        totalDurationMinutes={totalDurationMinutes}
        totalMaterials={materialsList.length}
        totalQuizzes={quizList.length}
        onSelectLevel={handleLevelChange}
        onSimulateLevelChange={handleSimulateLevelChange}
      />

      {/* 2. ACCESS GUARD IF LEVEL IS LOCKED */}
      {!isAccessible ? (
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 sm:p-14 text-center shadow-xs space-y-5 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Materi Jenjang {selectedLevelId} Masih Terkunci
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
              Saat ini jenjang kaderisasi Anda tercatat pada tahap{" "}
              <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
                {userCadreLevel} ({LEVEL_METAS[userCadreLevel].fullName})
              </strong>
              . Anda perlu menuntaskan seluruh proses kaderisasi dan dinyatakan lulus oleh pengurus sebelum dapat mengakses kurikulum {selectedLevelId}.
            </p>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => handleLevelChange(userCadreLevel)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-6 rounded-xl cursor-pointer shadow-md shadow-blue-600/20 inline-flex items-center gap-2"
            >
              <span>Buka Materi Jenjang {userCadreLevel}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ) : (
        /* 3. TABS: SYLLABUS, MATERIALS, QUIZ */
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "syllabus" | "materials" | "quiz")}
          className="w-full space-y-4"
        >
          {/* Custom Modern Tabs Bar */}
          <div className="p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 shadow-xs">
            <TabsList className="bg-transparent border-none p-0 flex flex-wrap gap-1.5 h-auto">
              <TabsTrigger
                value="syllabus"
                className="text-xs font-bold px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 border shadow-none data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-zinc-600 dark:data-[state=inactive]:text-zinc-400 hover:data-[state=inactive]:bg-zinc-100 dark:hover:data-[state=inactive]:bg-zinc-800"
              >
                <BookMarked className="w-4 h-4" />
                <span>Silabus & Kurikulum</span>
                <span className="ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
                  {syllabusList.length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="materials"
                className="text-xs font-bold px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 border shadow-none data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-zinc-600 dark:data-[state=inactive]:text-zinc-400 hover:data-[state=inactive]:bg-zinc-100 dark:hover:data-[state=inactive]:bg-zinc-800"
              >
                <FileDown className="w-4 h-4" />
                <span>Modul & Buku Digital</span>
                <span className="ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
                  {materialsList.length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="quiz"
                className="text-xs font-bold px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 border shadow-none data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-zinc-600 dark:data-[state=inactive]:text-zinc-400 hover:data-[state=inactive]:bg-zinc-100 dark:hover:data-[state=inactive]:bg-zinc-800"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Evaluasi Mandiri</span>
                <span className="ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
                  {quizList.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <div className="hidden md:flex items-center gap-2 pr-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span>Kurikulum:</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/50 dark:border-blue-900/50">
                {selectedLevelId}
              </span>
            </div>
          </div>

          {/* TAB 1: SILABUS & KURIKULUM */}
          <TabsContent value="syllabus" className="outline-none">
            <SyllabusSection
              levelId={selectedLevelId}
              syllabusList={syllabusList}
              materialsList={materialsList}
              onDownloadFile={handleDownloadSingleFile}
            />
          </TabsContent>

          {/* TAB 2: MODUL & BUKU DIGITAL */}
          <TabsContent value="materials" className="outline-none">
            <MaterialDownloads
              levelId={selectedLevelId}
              materialsList={materialsList}
              onDownloadFile={handleDownloadSingleFile}
            />
          </TabsContent>

          {/* TAB 3: EVALUASI MANDIRI */}
          <TabsContent value="quiz" className="outline-none">
            <QuizSection
              levelId={selectedLevelId}
              quizList={quizList}
              selectedAnswers={selectedAnswers}
              quizSubmitted={quizSubmitted}
              score={score}
              onAnswerSelect={handleAnswerSelect}
              onSubmit={handleQuizSubmit}
              onReset={handleQuizReset}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
