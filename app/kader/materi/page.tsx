"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  HelpCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Award,
  BookMarked,
  Clock,
  Target,
  FileText,
  Layers,
  Check,
  Lock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { db, DEFAULT_KURIKULUM } from "@/lib/db";
import type { KaderisasiLevel, SyllabusItem, MaterialFile, QuizQuestion } from "@/lib/db";

const LEVEL_ORDER: Record<"MAPABA" | "PKD" | "PKL" | "PKN", number> = {
  MAPABA: 1,
  PKD: 2,
  PKL: 3,
  PKN: 4
};

export default function KaderMateriPage() {
  const [mounted, setMounted] = useState(false);
  const [kaderisasiData, setKaderisasiData] = useState<Record<"MAPABA" | "PKD" | "PKL" | "PKN", KaderisasiLevel>>(DEFAULT_KURIKULUM);
  const [selectedLevelId, setSelectedLevelId] = useState<"MAPABA" | "PKD" | "PKL" | "PKN">("MAPABA");
  const [userCadreLevel, setUserCadreLevel] = useState<"MAPABA" | "PKD" | "PKL" | "PKN">("MAPABA");
  const [isAdminOrPengurus, setIsAdminOrPengurus] = useState(false);
  const [activeTab, setActiveTab] = useState<"syllabus" | "quiz">("syllabus");

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
          setKaderisasiData(DEFAULT_KURIKULUM);
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

        let detectedLevel: "MAPABA" | "PKD" | "PKL" | "PKN" = "MAPABA";
        if (savedSimLevel && ["MAPABA", "PKD", "PKL", "PKN"].includes(savedSimLevel)) {
          detectedLevel = savedSimLevel as "MAPABA" | "PKD" | "PKL" | "PKN";
        } else if (currentCadre?.level && ["MAPABA", "PKD", "PKL", "PKN"].includes(currentCadre.level)) {
          detectedLevel = currentCadre.level as "MAPABA" | "PKD" | "PKL" | "PKN";
        } else if (loggedInUser?.level && ["MAPABA", "PKD", "PKL", "PKN"].includes(loggedInUser.level)) {
          detectedLevel = loggedInUser.level as "MAPABA" | "PKD" | "PKL" | "PKN";
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

  const currentLevel: KaderisasiLevel = kaderisasiData[selectedLevelId] || DEFAULT_KURIKULUM[selectedLevelId];
  const syllabusList: SyllabusItem[] = currentLevel?.syllabus || [];
  const materialsList: MaterialFile[] = currentLevel?.materials || [];
  const quizList: QuizQuestion[] = currentLevel?.quiz || [];

  const isLevelAccessible = (level: "MAPABA" | "PKD" | "PKL" | "PKN"): boolean => {
    return LEVEL_ORDER[level] <= LEVEL_ORDER[userCadreLevel];
  };

  const handleLevelChange = (levelId: "MAPABA" | "PKD" | "PKL" | "PKN") => {
    if (!isLevelAccessible(levelId)) {
      toast.error(
        `Akses Terkunci: Anda baru menempuh jenjang ${userCadreLevel}. Selesaikan jenjang ${userCadreLevel} terlebih dahulu untuk membuka materi ${levelId}.`
      );
      return;
    }
    setSelectedLevelId(levelId);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setScore(0);
  };

  const handleSimulateLevelChange = (newLevel: "MAPABA" | "PKD" | "PKL" | "PKN") => {
    setUserCadreLevel(newLevel);
    if (LEVEL_ORDER[selectedLevelId] > LEVEL_ORDER[newLevel]) {
      setSelectedLevelId(newLevel);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("PMII_USER_CADRE_LEVEL", newLevel);
    }
    toast.info(`Simulasi jenjang diubah ke: ${newLevel}`);
  };

  const handleDownload = (file: MaterialFile) => {
    handleDownloadSingleFile(file.fileUrl || "#", file.fileName, file.id);
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
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleQuizSubmit = () => {
    let correctCount = 0;
    quizList.forEach(q => {
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
      <div className="space-y-6 max-w-5xl mx-auto font-sans">
        <div className="h-32 bg-zinc-200 dark:bg-zinc-800/40 rounded-lg animate-pulse" />
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800/40 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-44 bg-zinc-200 dark:bg-zinc-800/40 rounded-lg animate-pulse" />
            <div className="h-44 bg-zinc-200 dark:bg-zinc-800/40 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-48 bg-zinc-200 dark:bg-zinc-800/40 rounded-lg animate-pulse" />
            <div className="h-48 bg-zinc-200 dark:bg-zinc-800/40 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-zinc-900 dark:text-zinc-100 font-sans">
      
      {/* 1. HEADER BANNER */}
      <div className="relative overflow-hidden rounded-lg bg-white dark:bg-zinc-900 p-6 md:p-8 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Silabus & Bahan Ajar Kaderisasi
              </h1>
              <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[11px] font-bold px-2 py-0.5 rounded shadow-none">
                Jenjang Anda: {userCadreLevel}
              </Badge>
            </div>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl font-normal">
              Akses silabus resmi, modul digital pembelajaran, dan evaluasi pemahaman mandiri sesuai jenjang kaderisasi yang telah Anda tempuh.
            </p>
            {isAdminOrPengurus && (
              <div className="pt-2 flex items-center gap-2">
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  Uji Jenjang (Admin):
                </span>
                <select
                  value={userCadreLevel}
                  onChange={(e) => handleSimulateLevelChange(e.target.value as any)}
                  className="text-xs font-bold bg-zinc-50 dark:bg-zinc-950 border border-amber-500/30 text-zinc-800 dark:text-zinc-200 rounded px-2 py-1 cursor-pointer focus:outline-none"
                >
                  <option value="MAPABA">MAPABA (Baru MAPABA)</option>
                  <option value="PKD">PKD (Telah Lulus PKD)</option>
                  <option value="PKL">PKL (Telah Lulus PKL)</option>
                  <option value="PKN">PKN (Telah Lulus PKN)</option>
                </select>
              </div>
            )}
          </div>

          {/* LEVEL SWITCHER */}
          <div className="flex-shrink-0 flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-md border border-zinc-200 dark:border-zinc-800">
            {(["MAPABA", "PKD", "PKL", "PKN"] as const).map((lvl) => {
              const isSelected = selectedLevelId === lvl;
              const isAccessible = isLevelAccessible(lvl);
              return (
                <button
                  key={lvl}
                  onClick={() => handleLevelChange(lvl)}
                  title={
                    isAccessible
                      ? `Buka jenjang ${lvl}`
                      : `Terkunci: Anda baru menempuh jenjang ${userCadreLevel}. Selesaikan jenjang ${userCadreLevel} untuk membuka ${lvl}.`
                  }
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 border shadow-none ${
                    isSelected
                      ? "bg-blue-600 hover:bg-blue-700 text-white hover:text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white dark:hover:text-white border-blue-600 hover:border-blue-700 cursor-pointer"
                      : isAccessible
                      ? "bg-transparent hover:bg-zinc-100 dark:bg-transparent dark:hover:bg-zinc-800 border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                      : "bg-zinc-100/50 dark:bg-zinc-900/50 border-transparent text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-50"
                  }`}
                >
                  {!isAccessible && <Lock className="w-3 h-3 text-zinc-400 dark:text-zinc-600" />}
                  <span>{lvl}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. TABS SEGMENT OR LOCKED GUARD */}
      {!isLevelAccessible(selectedLevelId) ? (
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center shadow-none space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400 dark:text-zinc-500">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Jenjang {selectedLevelId} Masih Terkunci
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Anda saat ini menempuh jenjang kaderisasi <strong className="text-zinc-700 dark:text-zinc-300">{userCadreLevel}</strong>. Selesaikan proses kaderisasi dan kelulusan jenjang ini terlebih dahulu untuk membuka akses materi {selectedLevelId}.
            </p>
          </div>
          <div>
            <Button
              onClick={() => handleLevelChange(userCadreLevel)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-md cursor-pointer shadow-none"
            >
              Buka Materi Jenjang {userCadreLevel}
            </Button>
          </div>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "syllabus" | "quiz")} className="w-full">
        <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-lg shadow-none mb-6 overflow-x-auto">
          <TabsList className="bg-transparent border-none p-0 flex gap-1.5 h-auto">
            <TabsTrigger
              value="syllabus"
              className="text-xs font-bold px-4 py-2 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 border shadow-none data-[state=active]:bg-blue-600 data-[state=active]:hover:bg-blue-700 data-[state=active]:text-white data-[state=active]:hover:text-white data-[state=active]:border-blue-600 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:hover:bg-blue-700 dark:data-[state=active]:text-white dark:data-[state=active]:border-blue-600 data-[state=inactive]:bg-transparent data-[state=inactive]:border-transparent data-[state=inactive]:text-zinc-600 dark:data-[state=inactive]:text-zinc-400 hover:data-[state=inactive]:bg-zinc-100 dark:hover:data-[state=inactive]:bg-zinc-800"
            >
              <BookMarked className="w-3.5 h-3.5" /> Silabus & Modul Pembelajaran
            </TabsTrigger>
            <TabsTrigger
              value="quiz"
              className="text-xs font-bold px-4 py-2 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 border shadow-none data-[state=active]:bg-blue-600 data-[state=active]:hover:bg-blue-700 data-[state=active]:text-white data-[state=active]:hover:text-white data-[state=active]:border-blue-600 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:hover:bg-blue-700 dark:data-[state=active]:text-white dark:data-[state=active]:border-blue-600 data-[state=inactive]:bg-transparent data-[state=inactive]:border-transparent data-[state=inactive]:text-zinc-600 dark:data-[state=inactive]:text-zinc-400 hover:data-[state=inactive]:bg-zinc-100 dark:hover:data-[state=inactive]:bg-zinc-800"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Kuis Pemahaman Mandiri
            </TabsTrigger>
          </TabsList>

          <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline-block pr-2">
            Jenjang: {selectedLevelId}
          </span>
        </div>

        {/* TAB 1: SILABUS & DOWNLOADS */}
        <TabsContent value="syllabus" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Syllabus Cards (Col-span 2) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between pl-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Struktur Silabus {selectedLevelId}
                </h3>
                <span className="text-xs font-bold text-zinc-400">
                  {syllabusList.length} Mata Materi
                </span>
              </div>
              
              {syllabusList.length === 0 ? (
                <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-10 text-center shadow-none">
                  <BookMarked className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Belum ada mata materi silabus yang ditambahkan
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Silabus untuk jenjang ini sedang dalam proses penyusunan.
                  </p>
                </Card>
              ) : (
                syllabusList.map((item, index) => {
                  const tujuanList = item.tujuan && item.tujuan.length > 0 ? item.tujuan : (item.goal ? [item.goal] : []);
                  const pokokList = item.pokokPembahasan && item.pokokPembahasan.length > 0 ? item.pokokPembahasan : (item.description ? [item.description] : []);
                  const metodeList = item.metode && item.metode.length > 0 ? item.metode : [];
                  const prosesList = item.prosesKegiatan && item.prosesKegiatan.length > 0 ? item.prosesKegiatan : [];
                  const harapanList = item.harapan && item.harapan.length > 0 ? item.harapan : [];

                  return (
                    <Card key={index} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none p-5 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          {item.category && (
                            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold rounded px-2 py-0.5 mb-1.5 shadow-none">
                              {item.category}
                            </Badge>
                          )}
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                            {item.subjectName}
                          </h4>
                        </div>
                        <Badge variant="outline" className="border-zinc-200 dark:border-zinc-800 text-[11px] font-medium py-0.5 px-2 text-zinc-500 dark:text-zinc-400 font-mono flex-shrink-0 rounded shadow-none flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{item.durationHours} Menit</span>
                        </Badge>
                      </div>

                      {/* Tujuan Pembelajaran */}
                      {tujuanList.length > 0 && (
                        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 rounded-md text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-400 text-xs">
                            <Target className="w-3.5 h-3.5" />
                            <span>Tujuan Pembelajaran:</span>
                          </div>
                          <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
                            {tujuanList.map((t, tIdx) => (
                              <li key={tIdx}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Pokok Pembahasan */}
                      {pokokList.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                            Pokok Pembahasan:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {pokokList.map((p, pIdx) => (
                              <div key={pIdx} className="text-xs p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-start gap-1.5 text-zinc-700 dark:text-zinc-300">
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                                <span>{p}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metode, Proses Kegiatan & Harapan */}
                      {(metodeList.length > 0 || prosesList.length > 0 || harapanList.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                          {metodeList.length > 0 && (
                            <div className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                                Metode:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {metodeList.map((m, mIdx) => (
                                  <span key={mIdx} className="text-[10px] font-medium bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50 px-1.5 py-0.5 rounded">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {prosesList.length > 0 && (
                            <div className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                                Proses Kegiatan:
                              </span>
                              <ul className="space-y-0.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                                {prosesList.map((pr, prIdx) => (
                                  <li key={prIdx} className="flex items-start gap-1">
                                    <span className="font-mono text-[9px] text-blue-600 dark:text-blue-400 font-bold shrink-0">{prIdx + 1}.</span>
                                    <span>{pr}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {harapanList.length > 0 && (
                            <div className="bg-blue-50/30 dark:bg-blue-950/20 p-2.5 rounded-lg border border-blue-200/50 dark:border-blue-900/40 space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                                Harapan Pembelajaran:
                              </span>
                              <ul className="space-y-0.5 text-[11px] text-zinc-700 dark:text-zinc-300">
                                {harapanList.map((h, hIdx) => (
                                  <li key={hIdx} className="flex items-start gap-1">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">✓</span>
                                    <span>{h}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>

            {/* Downloads List (Col-span 1) */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between pl-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Modul & Buku Digital
                </h3>
                <span className="text-xs font-bold text-zinc-400">
                  {materialsList.length} Berkas
                </span>
              </div>

              {materialsList.length === 0 ? (
                <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center shadow-none">
                  <FileText className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Belum ada modul digital
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Modul untuk jenjang {selectedLevelId} akan segera diunggah oleh pengurus.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {materialsList.map((file) => {
                    const allMatFiles = file.materialFiles && file.materialFiles.length > 0
                      ? file.materialFiles
                      : (file.fileName ? [{ name: file.fileName, size: file.fileSize, url: file.fileUrl }] : []);
                    const allRefFiles = file.referensiFiles && file.referensiFiles.length > 0 ? file.referensiFiles : [];
                    const displayName = file.title || file.fileName;

                    return (
                      <Card key={file.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none p-4 flex flex-col justify-between space-y-3">
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                            {displayName}
                          </h4>

                          {/* Berkas Materi */}
                          {allMatFiles.length > 0 && (
                            <div className="space-y-1.5 pt-0.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                                Berkas Materi ({allMatFiles.length})
                              </span>
                              <div className="space-y-1">
                                {allMatFiles.map((mFile, mIdx) => (
                                  <div key={mIdx} className="flex items-center justify-between p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                                      <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                      <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate" title={mFile.name}>
                                        {mFile.name}
                                      </span>
                                      <span className="text-[9px] text-zinc-400 font-mono shrink-0">
                                        ({mFile.size})
                                      </span>
                                    </div>
                                    <Button
                                      onClick={() => handleDownloadSingleFile(mFile.url || "#", mFile.name, file.id)}
                                      size="sm"
                                      className="h-6 px-2 text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer shrink-0 shadow-none flex items-center gap-1"
                                    >
                                      <Download className="w-3 h-3" /> Unduh
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Berkas Referensi */}
                          {allRefFiles.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                                Berkas Referensi ({allRefFiles.length})
                              </span>
                              <div className="space-y-1">
                                {allRefFiles.map((rFile, rIdx) => (
                                  <div key={rIdx} className="flex items-center justify-between p-2 rounded bg-blue-50/20 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                                      <BookMarked className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                      <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate" title={rFile.name}>
                                        {rFile.name}
                                      </span>
                                      <span className="text-[9px] text-zinc-400 font-mono shrink-0">
                                        ({rFile.size})
                                      </span>
                                    </div>
                                    <Button
                                      onClick={() => handleDownloadSingleFile(rFile.url || "#", rFile.name, file.id)}
                                      size="sm"
                                      className="h-6 px-2 text-[10px] font-semibold bg-white hover:bg-blue-50 text-blue-700 dark:bg-zinc-900 dark:hover:bg-blue-950 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 rounded cursor-pointer shrink-0 shadow-none flex items-center gap-1"
                                    >
                                      <Download className="w-3 h-3" /> Unduh
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {file.referensi && allRefFiles.length === 0 && (
                            <div className="text-[10px] text-zinc-500 font-medium pt-1">
                              Referensi: {file.referensi}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                            Total {file.downloadCount || 0} unduhan
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </TabsContent>

        {/* TAB 2: INTERACTIVE QUIZ */}
        <TabsContent value="quiz" className="outline-none">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-start gap-3 shadow-none">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Latihan Evaluasi Mandiri ({selectedLevelId})
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                  Uji wawasan Anda mengenai materi-materi {selectedLevelId} sebelum mengajukan evaluasi kelulusan dari pengurus. Kuis ini dapat diulang kapan saja tanpa batasan percobaan.
                </p>
              </div>
            </div>

            {quizList.length === 0 ? (
              <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-10 text-center shadow-none">
                <HelpCircle className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Belum ada soal kuis
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Soal kuis pemahaman mandiri untuk jenjang {selectedLevelId} belum tersedia.
                </p>
              </Card>
            ) : (
              <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-6 shadow-none">
                <div className="space-y-6">
                  {quizList.map((q, qIndex) => (
                    <div key={q.id} className="space-y-3 pb-6 border-b border-zinc-100 dark:border-zinc-800/80 last:border-none last:pb-0">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-relaxed">
                        {qIndex + 1}. {q.question}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedAnswers[q.id] === optIdx;
                          const isCorrect = q.correctAnswer === optIdx;
                          const showFeedback = quizSubmitted;

                          let optionStyle = "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900";
                          if (isSelected && !showFeedback) {
                            optionStyle = "bg-blue-500/10 border-blue-600 text-blue-600 dark:text-blue-400 font-bold";
                          } else if (showFeedback) {
                            if (isCorrect) {
                              optionStyle = "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold";
                            } else if (isSelected && !isCorrect) {
                              optionStyle = "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400 font-bold";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleAnswerSelect(q.id, optIdx)}
                              disabled={quizSubmitted}
                              className={`p-3 text-left text-xs rounded-md border transition-colors cursor-pointer flex items-center justify-between ${optionStyle} shadow-none`}
                            >
                              <span>{opt}</span>
                              {showFeedback && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                              {showFeedback && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* QUIZ FOOTER ACTION */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                  {quizSubmitted ? (
                    <div className="flex items-center gap-3">
                      <Badge className={`px-2.5 py-1 rounded text-xs font-bold border uppercase tracking-wider flex items-center gap-1.5 shadow-none ${
                        score >= 70 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" 
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      }`}>
                        <Award className="w-3.5 h-3.5" /> Skor: {score}%
                      </Badge>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {score >= 70 ? "Selamat, pemahaman materi Anda sangat baik." : "Pelajari kembali modul silabus di atas untuk memperdalam pemahaman."}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      Pastikan seluruh pertanyaan terjawab sebelum mengirim kuis.
                    </span>
                  )}

                  <div className="flex gap-2.5 w-full sm:w-auto justify-end">
                    {quizSubmitted ? (
                      <Button
                        onClick={handleQuizReset}
                        variant="outline"
                        className="px-4 py-2 border-zinc-200 dark:border-zinc-800 text-xs font-bold rounded-md h-9 hover:bg-zinc-100 dark:hover:bg-zinc-900 shadow-none cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Ulangi Kuis
                      </Button>
                    ) : (
                      <Button
                        onClick={handleQuizSubmit}
                        disabled={Object.keys(selectedAnswers).length < quizList.length}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white font-bold text-xs rounded-md h-9 border border-blue-600 shadow-none cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Kirim Jawaban
                      </Button>
                    )}
                  </div>
                </div>

              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
      )}

    </div>
  );
}
