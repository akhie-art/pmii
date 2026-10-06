"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  FileText,
  Clock,
  ExternalLink,
  Download,
  FileCheck,
  Upload,
  X,
  Award,
  Lock,
  ChevronLeft,
  ChevronRight,
  QrCode,
  BookOpen,
  Sparkles,
  CheckCircle2,
  FileDown,
  Layers,
  HelpCircle,
  AlertCircle,
  Target,
  Compass,
  Brain,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { db, generateUUID, QuizQuestion, ParticipantEvaluation, SessionScore } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CAREER_MBTI_PROFILES, CAREER_QUESTIONS as careerQuestions, calculateCareerMBTI } from "@/lib/careerAssessment";
import {
  formatDateIndo,
  formatEventDateIndo,
  formatDateTimeIndo,
  readFileAsDataURL,
  getFileTypeBadge
} from "./types";
import type {
  EventActivity,
  ParticipantRegistration,
  Requirement
} from "./types";

interface StagesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventActivity | null;
  myReg: ParticipantRegistration | null;
  requirements: Requirement[];
  activeCadre: any | null;
  currentStageTab: 1 | 2 | 3 | 4;
  onStageTabChange: (tab: 1 | 2 | 3 | 4) => void;
  onOpenRegister: () => void;
  onViewCard: () => void;
  onOpenCert: () => void;
  onCadreUpdated: (cadre: any) => void;
  rolePrefix: string;
  kurikulumData?: Record<string, any> | null;
  kaderisasiList?: any[];
}

export const StagesModal: React.FC<StagesModalProps> = ({
  isOpen,
  onOpenChange,
  event,
  myReg,
  requirements,
  activeCadre,
  currentStageTab,
  onStageTabChange,
  onOpenRegister,
  onViewCard,
  onOpenCert,
  onCadreUpdated,
  rolePrefix,
  kurikulumData,
  kaderisasiList
}) => {
  // RTL direct upload state
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [taskUploadFile, setTaskUploadFile] = useState<File | null>(null);
  const [taskUploadFileName, setTaskUploadFileName] = useState<string>("");
  const [taskUploadFileSize, setTaskUploadFileSize] = useState<string>("");
  const [taskUploadNotes, setTaskUploadNotes] = useState<string>("");
  const [isSubmittingTask, setIsSubmittingTask] = useState<boolean>(false);

  // Curriculum & Materials Cache for Session Material files
  const [kurikulum, setKurikulum] = useState<Record<string, any>>({});
  const [kaderisasi, setKaderisasi] = useState<any[]>([]);

  // Active Syllabus Viewer Modal State
  const [activeSyllabusModal, setActiveSyllabusModal] = useState<{
    sessionTitle: string;
    syllabus: any;
  } | null>(null);

  // Pre-Test & Post-Test Quiz Runner State
  const [activeQuizSession, setActiveQuizSession] = useState<string | null>(null);
  const [activeQuizSubject, setActiveQuizSubject] = useState<string | null>(null);
  const [activeQuizType, setActiveQuizType] = useState<"PRE" | "POST">("PRE");
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [quizResults, setQuizResults] = useState<
    Record<string, { score: number; correctCount: number; submittedAt: string }>
  >({});

  // Career & Cognitive Preference Assessment State
  const [isCareerModalOpen, setIsCareerModalOpen] = useState<boolean>(false);
  const [careerAnswers, setCareerAnswers] = useState<Record<number, string>>({});
  const [isReviewingCareer, setIsReviewingCareer] = useState<boolean>(false);
  const [careerResult, setCareerResult] = useState<{
    mbtiCode: string;
    talent: string;
    interest: string;
    formulaResult: string;
    cognitiveType: string;
    careerPath: string;
    strategicRole: string;
    description: string;
    dimensionScores?: {
      E: number;
      I: number;
      S: number;
      N: number;
      T: number;
      F: number;
      J: number;
      P: number;
    };
    traitScores?: Record<string, number>;
    submittedAt: string;
  } | null>(null);

  // Load saved quiz and career results for this event & cadre
  useEffect(() => {
    if (typeof window !== "undefined" && event?.id) {
      try {
        const key = `PMII_QUIZ_RESULTS_${activeCadre?.id || "guest"}_${event.id}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          setQuizResults(JSON.parse(raw));
        }
      } catch (e) {
        console.error("Failed to load quiz results", e);
      }

      try {
        const careerKey = `PMII_CAREER_TEST_${activeCadre?.id || "guest"}_${event.id}`;
        const rawCareer = localStorage.getItem(careerKey);
        if (rawCareer) {
          const parsed = JSON.parse(rawCareer);
          setCareerResult(parsed);
          setIsReviewingCareer(true);
        } else if (activeCadre?.id) {
          // Fallback load from evaluations in DB
          db.getEvaluations([]).then((allEvals) => {
            const ev = allEvals.find(
              (e) => String(e.activityId) === String(event.id) && String(e.cadreId) === String(activeCadre.id)
            );
            if (ev?.careerAssessment) {
              const resObj = {
                mbtiCode: ev.careerAssessment.mbtiCode,
                talent: ev.careerAssessment.talent,
                interest: ev.careerAssessment.interest,
                formulaResult: ev.careerAssessment.formulaResult,
                cognitiveType: `${ev.careerAssessment.mbtiCode} - ${ev.careerAssessment.talent}`,
                careerPath: ev.careerAssessment.interest,
                strategicRole: ev.careerAssessment.strategicRole,
                description: ev.careerAssessment.description,
                dimensionScores: ev.careerAssessment.dimensionScores,
                submittedAt: ev.careerAssessment.submittedAt
              };
              setCareerResult(resObj);
              setIsReviewingCareer(true);
              if (ev.careerAssessment.answers) {
                setCareerAnswers(ev.careerAssessment.answers);
              }
              localStorage.setItem(careerKey, JSON.stringify(resObj));
            }
          }).catch(() => {});
        }
      } catch (e) {
        console.error("Failed to load career test results", e);
      }
    }
  }, [event?.id, activeCadre?.id]);

  const handleStartSessionQuiz = (
    sesi: string,
    questions: QuizQuestion[],
    type: "PRE" | "POST" = "PRE"
  ) => {
    const keySpecific = `${sesi}-${type}`;
    const existing = quizResults[keySpecific] || (type === "POST" ? quizResults[sesi] : undefined);

    setActiveQuizSession(sesi);
    setActiveQuizType(type);
    const sub = questions[0]?.subjectName || questions[0]?.materialTitle || sesi;
    setActiveQuizSubject(sub);
    setActiveQuizQuestions(questions);

    if (existing) {
      toast.info(`${type === "PRE" ? "Pre-Test" : "Post-Test"} materi ini sudah selesai dikerjakan dan tidak dapat diulang.`);
      return;
    }

    setUserAnswers({});
    setIsQuizSubmitted(false);
    setQuizScore(0);
    setCorrectAnswersCount(0);
  };

  const handleSubmitActiveQuiz = () => {
    if (activeQuizQuestions.length === 0 || !activeQuizSession) return;
    let correctCount = 0;
    activeQuizQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correctCount += 1;
      }
    });

    const calculatedScore = Math.round((correctCount / activeQuizQuestions.length) * 100);
    setQuizScore(calculatedScore);
    setCorrectAnswersCount(correctCount);
    setIsQuizSubmitted(true);

    const now = new Date();
    const timeStr =
      now.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) +
      " " +
      now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    const keySpecific = `${activeQuizSession}-${activeQuizType}`;
    const updated: Record<string, any> = {
      ...quizResults,
      [keySpecific]: {
        score: calculatedScore,
        correctCount,
        submittedAt: timeStr
      }
    };
    if (activeQuizType === "POST") {
      updated[activeQuizSession] = {
        score: calculatedScore,
        correctCount,
        submittedAt: timeStr
      };
    }
    setQuizResults(updated);

    if (typeof window !== "undefined" && event?.id) {
      try {
        const key = `PMII_QUIZ_RESULTS_${activeCadre?.id || "guest"}_${event.id}`;
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save quiz results", e);
      }
    }

    // Sync to evaluations in database for Admin Rekap Nilai
    (async () => {
      try {
        if (!activeCadre || !event?.id) return;
        const allEvals = await db.getEvaluations([]);
        let participantEval = allEvals.find(
          (e) => e.activityId === event.id && (e.cadreId === activeCadre.id || e.id === activeCadre.id)
        );

        const currentQuizResults = participantEval?.quizResults ? { ...participantEval.quizResults } : {};
        const subjectKey = activeQuizSubject || activeQuizSession;
        const subjectEntry = currentQuizResults[subjectKey] ? { ...currentQuizResults[subjectKey] } : {};

        if (activeQuizType === "PRE") {
          subjectEntry.preTest = calculatedScore;
        } else {
          subjectEntry.postTest = calculatedScore;
        }
        subjectEntry.submittedAt = timeStr;
        currentQuizResults[subjectKey] = subjectEntry;

        // Calculate pre and post averages
        const preVals = Object.values(currentQuizResults).map((v) => v.preTest).filter((v): v is number => typeof v === "number");
        const postVals = Object.values(currentQuizResults).map((v) => v.postTest).filter((v): v is number => typeof v === "number");
        const preAvg = preVals.length > 0 ? Math.round(preVals.reduce((a, b) => a + b, 0) / preVals.length) : undefined;
        const postAvg = postVals.length > 0 ? Math.round(postVals.reduce((a, b) => a + b, 0) / postVals.length) : undefined;

        // Update sessionScores with individual pre/post score for the subject
        const currentSessionScores = participantEval?.sessionScores ? { ...participantEval.sessionScores } : {};
        const subjectSession: SessionScore = currentSessionScores[subjectKey] ? { ...currentSessionScores[subjectKey] } : {
          materiId: activeQuizSession,
          materiTitle: activeQuizSubject || activeQuizSession,
          kognitif: 0,
          afektif: 0,
          psikomotorik: 0,
          score: 0
        };
        if (activeQuizType === "PRE") {
          subjectSession.preTestScore = calculatedScore;
        } else {
          subjectSession.postTestScore = calculatedScore;
        }
        currentSessionScores[subjectKey] = subjectSession;

        if (participantEval) {
          const updatedEval: ParticipantEvaluation = {
            ...participantEval,
            sessionScores: currentSessionScores,
            quizResults: currentQuizResults,
            preTestAverage: preAvg,
            postTestAverage: postAvg,
            updatedAt: new Date().toISOString()
          };
          const updatedList = allEvals.map((e) => (e.id === participantEval!.id ? updatedEval : e));
          await db.saveEvaluations(updatedList);
        } else {
          const newEval: ParticipantEvaluation = {
            id: generateUUID(),
            activityId: event.id,
            activityName: event.name,
            cadreId: activeCadre.id,
            participantName: activeCadre.nama || "Peserta",
            commissariat: activeCadre.rayon || activeCadre.asalKomisariat || event.commissariat,
            university: activeCadre.kampus || "Universitas",
            level: event.level,
            sessionScores: currentSessionScores,
            kognitif: 0,
            afektif: 0,
            psikomotorik: 0,
            finalScore: 0,
            grade: "C",
            status: "BELUM_DINILAI",
            quizResults: currentQuizResults,
            preTestAverage: preAvg,
            postTestAverage: postAvg,
            updatedAt: new Date().toISOString()
          };
          await db.saveEvaluations([...allEvals, newEval]);
        }
      } catch (err) {
        console.warn("Failed to sync evaluation to db:", err);
      }
    })();

    toast.success(`${activeQuizType === "PRE" ? "Pre-Test" : "Post-Test"} selesai! Skor Anda: ${calculatedScore}`);
  };

  const handleSubmitCareerTest = () => {
    const totalQuestions = careerQuestions.length;
    if (Object.keys(careerAnswers).length < totalQuestions) {
      toast.error(`Mohon lengkapi seluruh ${totalQuestions} pertanyaan pilihan.`);
      return;
    }

    const result = calculateCareerMBTI(careerAnswers);
    setCareerResult(result);
    setIsReviewingCareer(true);

    if (typeof window !== "undefined" && event?.id) {
      try {
        const key = `PMII_CAREER_TEST_${activeCadre?.id || "guest"}_${event.id}`;
        localStorage.setItem(key, JSON.stringify(result));
      } catch (e) {
        console.error("Failed to save career test result locally", e);
      }
    }

    // Double-Sync to Database: evaluations & cadres
    (async () => {
      try {
        if (event?.id && activeCadre?.id) {
          // 1. Sync to evaluations table
          const allEvals = await db.getEvaluations([]);
          const existingEval = allEvals.find(
            (e) => String(e.activityId) === String(event.id) && String(e.cadreId) === String(activeCadre.id)
          );

          const assessmentData = {
            mbtiCode: result.mbtiCode,
            talent: result.talent,
            interest: result.interest,
            formulaResult: result.formulaResult,
            strategicRole: result.strategicRole,
            description: result.description,
            dimensionScores: { ...result.dimensionScores },
            answers: { ...careerAnswers },
            submittedAt: result.submittedAt
          };

          if (existingEval) {
            const updated = allEvals.map((e) =>
              e.id === existingEval.id
                ? { ...e, careerAssessment: assessmentData, updatedAt: new Date().toISOString() }
                : e
            );
            await db.saveEvaluations(updated);
          } else {
            const newEval: ParticipantEvaluation = {
              id: generateUUID(),
              activityId: event.id,
              activityName: event.name || "Kegiatan Kaderisasi",
              cadreId: activeCadre.id,
              participantName: activeCadre.name || myReg?.cadreName || "Peserta",
              gender: activeCadre.gender,
              commissariat: activeCadre.commissariat,
              university: activeCadre.perguruanTinggi,
              kognitif: 0,
              afektif: 0,
              psikomotorik: 0,
              finalScore: 0,
              grade: "C",
              status: "BELUM_DINILAI",
              updatedAt: new Date().toISOString(),
              careerAssessment: assessmentData
            };
            await db.saveEvaluations([...allEvals, newEval]);
          }

          // 2. Sync to cadres table
          const allCadres = await db.getCadres([]);
          const cadreIndex = allCadres.findIndex((c) => String(c.id) === String(activeCadre.id));
          if (cadreIndex !== -1) {
            const updatedCadres = [...allCadres];
            updatedCadres[cadreIndex] = {
              ...updatedCadres[cadreIndex],
              careerProfile: {
                mbtiCode: result.mbtiCode,
                talent: result.talent,
                interest: result.interest,
                formulaResult: result.formulaResult,
                strategicRole: result.strategicRole,
                description: result.description,
                submittedAt: result.submittedAt
              }
            };
            await db.saveCadres(updatedCadres);
          }
        }
      } catch (dbErr) {
        console.warn("Failed to sync career assessment to database:", dbErr);
      }
    })();

    toast.success(`Analisis selesai! Tipe Anda: ${result.mbtiCode} (${result.talent})`);
  };

  useEffect(() => {
    if (kurikulumData && Object.keys(kurikulumData).length > 0) {
      setKurikulum(kurikulumData);
    } else {
      db.getKurikulum().then((res) => {
        if (res) setKurikulum(res);
      });
    }

    if (kaderisasiList && kaderisasiList.length > 0) {
      setKaderisasi(kaderisasiList);
    } else {
      db.getKaderisasi().then((res) => {
        if (res) setKaderisasi(res);
      });
    }
  }, [kurikulumData, kaderisasiList]);

  if (!event) return null;

  const isOpenForReg = event.status === "OPEN" && (event.timeline?.registration?.isOpen !== false);
  const isForumOpen = event.timeline?.forum?.isOpen !== false;
  const isRtlOpen = event.timeline?.rtl?.isOpen !== false;
  const isCertOpen = event.timeline?.certification?.isOpen !== false;

  const levelReqs = requirements.filter(
    (r) =>
      (r.eventId && r.eventId === event.id) ||
      (!r.eventId && r.level?.toUpperCase() === event.level?.toUpperCase())
  );
  const mySubmissions = activeCadre?.submissions || [];
  const approvedSubmissions = mySubmissions.filter(
    (s: any) =>
      levelReqs.some((r) => r.id === s.requirementId) && s.status === "APPROVED"
  );
  const isRtlFinished =
    levelReqs.length > 0 && approvedSubmissions.length >= levelReqs.length;
  const isGraduated =
    myReg?.isGraduated || isRtlFinished || activeCadre?.status === "SELESAI";

  const stage1Done = myReg && myReg.status === "APPROVED";
  const stage2Done =
    stage1Done &&
    (event.status === "CLOSED" ||
      approvedSubmissions.length > 0 ||
      isRtlFinished);
  const stage3Done = isRtlFinished;
  const stage4Done = isGraduated && isCertOpen;

  const handleTaskFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Ukuran berkas terlalu besar. Maksimal 15MB.");
      return;
    }
    setTaskUploadFile(file);
    setTaskUploadFileName(file.name);
    setTaskUploadFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");
  };

  const handleCancelTaskUpload = () => {
    setUploadingTaskId(null);
    setTaskUploadFile(null);
    setTaskUploadFileName("");
    setTaskUploadFileSize("");
    setTaskUploadNotes("");
  };

  const handleDirectTaskUpload = async (req: Requirement) => {
    if (!activeCadre) {
      toast.error("Data kader tidak ditemukan. Silakan login terlebih dahulu.");
      return;
    }
    if (!taskUploadFile) {
      toast.error("Harap pilih berkas tugas terlebih dahulu!");
      return;
    }

    setIsSubmittingTask(true);
    try {
      let finalUrl = "";
      if (isSupabaseConfigured && supabase) {
        const fileExt = taskUploadFile.name.split(".").pop();
        const filePath = `rktl/${activeCadre.id || "cadre"}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(filePath, taskUploadFile, { cacheControl: "3600", upsert: true });

        if (uploadError) {
          console.warn("Supabase upload error, falling back to data URL:", uploadError.message);
          finalUrl = await readFileAsDataURL(taskUploadFile);
        } else {
          const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
          finalUrl = data.publicUrl;
        }
      } else {
        finalUrl = await readFileAsDataURL(taskUploadFile);
      }

      const newSubmission: any = {
        id: `sub-${Date.now()}`,
        requirementId: req.id,
        title: req.title,
        description: taskUploadNotes.trim(),
        fileLink: finalUrl,
        date: new Date().toISOString().slice(0, 10),
        status: "PENDING",
        feedback: ""
      };

      const existingSubs = (activeCadre.submissions || []).filter(
        (s: any) => s.requirementId !== req.id
      );
      const updatedSubmissions = [newSubmission, ...existingSubs];

      const updatedCadre = {
        ...activeCadre,
        submissions: updatedSubmissions
      };

      const latestAllCadres = await db.getCadres([]);
      const updatedAllCadres = latestAllCadres.map((c: any) =>
        c.id === activeCadre.id ? updatedCadre : c
      );

      await db.saveCadres(updatedAllCadres);
      onCadreUpdated(updatedCadre);

      toast.success("Laporan tugas RTL berhasil dikirim! Menunggu verifikasi.");
      handleCancelTaskUpload();
    } catch (err) {
      console.error("Gagal mengunggah tugas:", err);
      toast.error("Gagal mengirim berkas tugas. Silakan coba lagi.");
    } finally {
      setIsSubmittingTask(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl">
        <div className="flex flex-col max-h-[85vh]">
          {/* MODAL HEADER */}
          <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {event.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                  {event.commissariat || "PK PMII Ki Ageng Getas Pendawa"} •{" "}
                  {formatEventDateIndo(event.date)}
                </DialogDescription>
              </div>
            </div>

            {/* SLEEK SEGMENTED STEPPER */}
            <div className="grid grid-cols-4 gap-1 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl">
              {[
                { num: 1 as const, title: "Daftar", done: stage1Done, isLocked: false },
                { num: 2 as const, title: "Kegiatan", done: stage2Done, isLocked: !isForumOpen },
                { num: 3 as const, title: "RTL", done: stage3Done, isLocked: !isRtlOpen },
                { num: 4 as const, title: "Sertifikat", done: stage4Done, isLocked: !isCertOpen }
              ].map((st) => {
                const isActive = currentStageTab === st.num;
                return (
                  <button
                    key={st.num}
                    type="button"
                    onClick={() => onStageTabChange(st.num)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      isActive
                        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold"
                        : st.done
                        ? "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    {st.done ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                        ✓
                      </span>
                    ) : st.isLocked ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 flex items-center justify-center shrink-0">
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    ) : (
                      <span
                        className={`w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                            : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                        }`}
                      >
                        {st.num}
                      </span>
                    )}
                    <span className="truncate text-[11px]">{st.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MODAL BODY (TAB CONTENT) */}
          <div className="p-5 sm:p-6 overflow-y-auto max-h-[60vh] space-y-4">
            {/* TAHAP 1: FORMULIR PENDAFTARAN */}
            {currentStageTab === 1 && (
              <div className="space-y-4">
                {myReg ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
                      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200/60 dark:border-zinc-800/60">
                        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                          Status & Data Pendaftaran
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                            myReg.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60"
                              : myReg.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60"
                          }`}
                        >
                          {myReg.status === "APPROVED"
                            ? "✓ Pendaftaran Disetujui"
                            : myReg.status === "REJECTED"
                            ? "✕ Pendaftaran Ditolak"
                            : "⏳ Menunggu Verifikasi"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-zinc-400 text-[10px] block">
                            No. Registrasi
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono text-[11px]">
                            {myReg.registrationNumber || "REG-TERCATAT"}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[10px] block">
                            Tanggal Daftar
                          </span>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200 text-[11px]">
                            {myReg.dateApplied}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[10px] block">
                            Nama Peserta
                          </span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px] truncate block">
                            {myReg.cadreName}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[10px] block">
                            Email
                          </span>
                          <span className="text-zinc-600 dark:text-zinc-400 text-[11px] truncate block">
                            {myReg.cadreEmail || "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CARD TES ANALISIS PREFERENSI KOGNITIF & ARAH KARIER MAHASISWA - ULTRA CLEAN & MINIMALIST */}
                    <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8.5 h-8.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0 shadow-2xs">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
                              Preferensi Kognitif & Arah Karier
                            </h4>
                            {careerResult ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-900/50 px-1.5 py-0.2 rounded">
                                  <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block"></span>
                                  Selesai
                                </span>
                                <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                                  {careerResult.mbtiCode}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                12 Pertanyaan
                              </span>
                            )}
                          </div>

                          {careerResult ? (
                            <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 truncate leading-snug">
                              <span className="text-zinc-700 dark:text-zinc-300 font-medium">Bakat:</span> {careerResult.talent} <span className="text-zinc-300 dark:text-zinc-600 mx-1">•</span> <span className="text-zinc-700 dark:text-zinc-300 font-medium">Minat:</span> {careerResult.interest}
                            </p>
                          ) : (
                            <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 truncate leading-snug">
                              Kuesioner pemetaan potensi berpikir & rekomendasi arah karier mahasiswa.
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (careerResult) {
                            setIsReviewingCareer(true);
                          } else {
                            setIsReviewingCareer(false);
                          }
                          setIsCareerModalOpen(true);
                        }}
                        className={`h-8 px-3.5 text-xs font-medium rounded-lg shrink-0 cursor-pointer shadow-none transition-colors ${
                          careerResult
                            ? "bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700"
                            : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 border-transparent"
                        }`}
                      >
                        {careerResult ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-zinc-500 mr-1.5" />
                            Lihat Hasil
                          </>
                        ) : (
                          "Mulai Tes"
                        )}
                      </Button>
                    </div>

                    {myReg.status === "APPROVED" && (
                      <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block">
                            Kartu Peserta Resmi Siap
                          </span>
                          <span className="text-[11px] text-emerald-700/90 dark:text-emerald-400 block">
                            Buka atau simpan kartu peserta ber-QR code untuk presensi kegiatan di lokasi.
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {event.waGroupLink ? (
                            <a
                              href={event.waGroupLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold text-xs h-8 px-3.5 rounded-xl shrink-0 cursor-pointer shadow-none transition-colors"
                            >
                              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              <span>Masuk Grup WA</span>
                            </a>
                          ) : (
                            <Button
                              type="button"
                              onClick={() =>
                                toast.info(
                                  "Link grup WhatsApp kegiatan belum dicantumkan oleh panitia."
                                )
                              }
                              className="bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold text-xs h-8 px-3.5 rounded-xl shrink-0 cursor-pointer shadow-none transition-colors"
                            >
                              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              <span>Masuk Grup WA</span>
                            </Button>
                          )}
                          <Button
                            onClick={onViewCard}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-4 rounded-xl shrink-0 cursor-pointer shadow-none"
                          >
                            <QrCode className="w-3.5 h-3.5 mr-1.5" />
                            <span>Kartu Peserta</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80 text-center space-y-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Formulir Pendaftaran {event.name}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                        Silakan isi formulir data diri dan berkas persyaratan pendaftaran untuk diverifikasi panitia.
                      </p>
                    </div>
                    {isOpenForReg ? (
                      <Button
                        type="button"
                        onClick={onOpenRegister}
                        className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-xs h-9 px-6 rounded-xl cursor-pointer shadow-none"
                      >
                        Isi Formulir Pendaftaran Sekarang
                      </Button>
                    ) : (
                      <span className="inline-block text-xs text-zinc-400 font-medium py-1 px-3 rounded-lg bg-zinc-200/60 dark:bg-zinc-800">
                        Pendaftaran Kegiatan Ini Telah Ditutup
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAHAP 2: MENGIKUTI KEGIATAN */}
            {currentStageTab === 2 && (() => {
              const levelKurikulum = event
                ? kurikulum[event.level] ||
                  kurikulum[event.level?.toUpperCase()] ||
                  Object.values(kurikulum).find(
                    (k: any) =>
                      k.name?.toLowerCase() === event.level?.toLowerCase() ||
                      k.id?.toLowerCase() === event.level?.toLowerCase()
                  )
                : null;
              const levelMaterials: any[] = levelKurikulum?.materials || [];
              const levelSyllabus: any[] = levelKurikulum?.syllabus || [];
              const levelQuizzes: QuizQuestion[] = levelKurikulum?.quiz || [];
              const matchedKaderisasi = kaderisasi.find((k: any) => k.nama === event?.level || k.id === event?.level);

              const handleDownloadMaterial = (url?: string, fileName?: string) => {
                if (!url || url === "#") {
                  toast.info(`Berkas "${fileName || "materi"}" sedang disiapkan oleh panitia/instruktur.`);
                  return;
                }
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", fileName || "berkas-materi");
                link.target = "_blank";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success(`Mengunduh berkas: ${fileName || "berkas materi"}`);
              };

              const getSessionResources = (sessionTitle: string) => {
                const clean = sessionTitle.toLowerCase().replace(/^(sesi\s*\d+[:\-.]?|\d+[:\-.]?)\s*/i, "").trim();
                const rawWords = clean.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
                const words = rawWords.filter((w) => w.length >= 2);

                const files: { name: string; size?: string; url?: string; isRef?: boolean }[] = [];

                levelMaterials.forEach((mat) => {
                  const mTitle = (mat.title || mat.fileName || "").toLowerCase();
                  const mDesc = (mat.description || "").toLowerCase();
                  const isMatch = mTitle.includes(clean) || clean.includes(mTitle) || words.some((w) => mTitle.includes(w) || mDesc.includes(w));

                  if (isMatch) {
                    if (mat.materialFiles && mat.materialFiles.length > 0) {
                      mat.materialFiles.forEach((f: any) => {
                        if (f.url && f.url !== "#") {
                          files.push({ name: f.name || "Berkas Materi", size: f.size, url: f.url, isRef: false });
                        }
                      });
                    } else if (mat.fileUrl && mat.fileUrl !== "#") {
                      files.push({ name: mat.fileName || mat.title || "Berkas Materi", size: mat.fileSize, url: mat.fileUrl, isRef: false });
                    }

                    if (mat.referensiFiles && mat.referensiFiles.length > 0) {
                      mat.referensiFiles.forEach((f: any) => {
                        if (f.url && f.url !== "#") {
                          files.push({ name: f.name || "Berkas Referensi", size: f.size, url: f.url, isRef: true });
                        }
                      });
                    }
                  }
                });

                const matchedSyllabus = levelSyllabus.find((s) => {
                  const sName = (s.subjectName || "").toLowerCase();
                  return sName.includes(clean) || clean.includes(sName) || words.some((w) => sName.includes(w));
                });

                // Match quiz questions configured in /admin/materi for this session/materi
                const matchedQuizzes = levelQuizzes.filter((q) => {
                  const sub = (q.subjectName || q.materialTitle || "").toLowerCase().trim();
                  if (!sub) return false;
                  const subWords = sub.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w: string) => w.length >= 2);

                  if (sub === clean || clean.includes(sub) || sub.includes(clean)) return true;
                  if (words.some((w: string) => sub.includes(w) || subWords.includes(w))) return true;

                  if (matchedSyllabus?.subjectName) {
                    const sylClean = matchedSyllabus.subjectName.toLowerCase().trim();
                    if (sylClean === sub || sylClean.includes(sub) || sub.includes(sylClean)) return true;
                    const sylWords = sylClean.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w: string) => w.length >= 2);
                    if (sylWords.some((w: string) => sub.includes(w) || subWords.includes(w))) return true;
                  }

                  return false;
                });

                return { files, matchedSyllabus, matchedQuizzes };
              };

              if (!isForumOpen) {
                return (
                  <div className="p-8 sm:p-10 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80 text-center space-y-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center mx-auto shadow-2xs">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Akses Forum & Sesi Materi Belum Dibuka
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                        {event.timeline?.forum?.note || "Akses materi forum, presensi, dan kuis evaluasi untuk kegiatan ini saat ini ditutup oleh panitia pelaksana."}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {!stage1Done && (
                    <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Pendaftaran Anda belum diverifikasi/disetujui. Sesi di bawah ini berstatus pratinjau.</span>
                    </div>
                  )}

                  {/* Daftar Sesi dan Berkas Materi Sesi */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                        Materi & Sesi Pokok Kegiatan ({event.sessions?.length || 0} Sesi):
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Klik berkas untuk melihat atau mengunduh materi
                      </span>
                    </div>

                    {!event.sessions || event.sessions.length === 0 ? (
                      <div className="p-8 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400 space-y-1">
                        <BookOpen className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-1" />
                        <p className="font-semibold text-zinc-700 dark:text-zinc-300">Belum ada sesi materi yang dicantumkan</p>
                        <p className="text-[11px]">Silabus dan bahan bacaan jenjang {event.level} dapat diakses di menu Materi.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {event.sessions.map((sesi, idx) => {
                          const isAttended = myReg?.attendance?.includes(sesi);
                          const { files, matchedSyllabus, matchedQuizzes } = getSessionResources(sesi);
                          const sessionQuizResult = quizResults[sesi];

                          return (
                            <div
                              key={idx}
                              className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                                isAttended
                                  ? "border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                                  : "border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900"
                              }`}
                            >
                              {/* Session Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <span
                                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                      isAttended
                                        ? "bg-emerald-500 text-white"
                                        : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                    }`}
                                  >
                                    {isAttended ? "✓" : idx + 1}
                                  </span>

                                  <div className="space-y-0.5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-[10px] font-mono text-zinc-400 font-semibold">
                                        Sesi #{idx + 1}
                                      </span>
                                      {matchedSyllabus?.category && (
                                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[9px] px-1.5 py-0.2 rounded font-medium">
                                          {matchedSyllabus.category}
                                        </Badge>
                                      )}
                                      {matchedSyllabus?.durationHours && (
                                        <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                                          <Clock className="w-3 h-3" /> {matchedSyllabus.durationHours}m
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                                      {sesi}
                                    </h4>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                  {isAttended ? (
                                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-100/70 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> Hadir
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60">
                                      Belum Presensi
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Card Silabus Sesi Materi (Diatas Berkas Materi Sesi) */}
                              <div className="pl-0 sm:pl-8 pt-1 w-full max-w-full overflow-hidden">
                                <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-950/70 border border-zinc-200/60 dark:border-zinc-800/60 space-y-2.5 w-full max-w-full overflow-hidden">
                                  <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                                    <span className="flex items-center gap-1.5">
                                      <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                      Silabus Sesi Materi:
                                    </span>
                                    {matchedSyllabus ? (
                                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                                        Silabus Tersedia
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-zinc-400 italic">Belum diatur</span>
                                    )}
                                  </div>

                                  {matchedSyllabus ? (
                                    <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs w-full max-w-full overflow-hidden">
                                      <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                            {matchedSyllabus.subjectName || sesi}
                                          </span>
                                          {matchedSyllabus.category && (
                                            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[9px] px-1.5 py-0.2 rounded font-medium">
                                              {matchedSyllabus.category}
                                            </Badge>
                                          )}
                                          {matchedSyllabus.durationHours && (
                                            <span className="text-[10px] text-zinc-400 flex items-center gap-0.5 font-medium">
                                              <Clock className="w-3 h-3" /> {matchedSyllabus.durationHours}m
                                            </span>
                                          )}
                                        </div>
                                        {matchedSyllabus.tujuan && matchedSyllabus.tujuan.length > 0 && (
                                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 break-words">
                                            Sasaran: {matchedSyllabus.tujuan[0]}
                                          </p>
                                        )}
                                      </div>

                                      <Button
                                        size="sm"
                                        type="button"
                                        onClick={() => setActiveSyllabusModal({ sessionTitle: sesi, syllabus: matchedSyllabus })}
                                        className="h-7.5 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer shrink-0 shadow-none flex items-center justify-center gap-1.5 self-start sm:self-center transition-colors"
                                      >
                                        <BookOpen className="w-3.5 h-3.5" />
                                        <span>Lihat Silabus</span>
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="py-1">
                                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
                                        Belum ada silabus pembelajaran resmi yang dikonfigurasi untuk materi ini.
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Berkas File Materi untuk Sesi ini */}
                              <div className="pl-0 sm:pl-8 pt-1 w-full max-w-full overflow-hidden">
                                <div className="p-2.5 rounded-xl bg-zinc-50/70 dark:bg-zinc-950/70 border border-zinc-200/60 dark:border-zinc-800/60 space-y-2">
                                  <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                                    <span className="flex items-center gap-1">
                                      <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                      Berkas Materi Sesi:
                                    </span>
                                    {files.length > 0 && (
                                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                                        {files.length} Berkas Siap Unduh
                                      </span>
                                    )}
                                  </div>

                                  {files.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {files.map((file, fIdx) => {
                                        const typeBadge = getFileTypeBadge(file.name);
                                        return (
                                          <div
                                            key={fIdx}
                                            className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-2 text-xs"
                                          >
                                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                              <Badge className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded ${typeBadge.color}`}>
                                                {typeBadge.label}
                                              </Badge>
                                              <span className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200 truncate" title={file.name}>
                                                {file.name}
                                              </span>
                                              {file.size && (
                                                <span className="text-[9px] text-zinc-400 font-mono shrink-0">
                                                  ({file.size})
                                                </span>
                                              )}
                                            </div>

                                            <Button
                                              size="sm"
                                              onClick={() => handleDownloadMaterial(file.url, file.name)}
                                              className="h-6 px-2 text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer shrink-0 shadow-none flex items-center gap-1"
                                            >
                                              <Download className="w-3 h-3" /> Unduh
                                            </Button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="py-1">
                                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
                                        Belum ada berkas materi yang diunggah untuk sesi ini.
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Pre-Test & Post-Test Evaluasi Materi jika ada di /admin/materi */}
                              {matchedQuizzes && matchedQuizzes.length > 0 && (() => {
                                const preQuizzes = matchedQuizzes.filter(
                                  (q) => q.testType === "PRE" || q.testType === "BOTH" || !q.testType
                                );
                                const postQuizzes = matchedQuizzes.filter(
                                  (q) => q.testType === "POST" || q.testType === "BOTH" || !q.testType
                                );
                                const preResult = quizResults[`${sesi}-PRE`];
                                const postResult = quizResults[`${sesi}-POST`] || quizResults[sesi];

                                return (
                                  <div className="pl-0 sm:pl-8 pt-1">
                                    <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2.5">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                          <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                          <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                                            Evaluasi Sesi Materi:
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-zinc-400">
                                          {matchedSyllabus?.subjectName || sesi}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {/* KOTAK PRE-TEST */}
                                        {preQuizzes.length > 0 && (
                                          <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex items-center justify-between gap-3 shadow-2xs">
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                  Pre-Test
                                                </span>
                                                <span className="text-[11px] text-zinc-400">
                                                  • {preQuizzes.length} Soal
                                                </span>
                                              </div>
                                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                                                {preResult ? (
                                                  <>
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                    <span>Selesai dikerjakan</span>
                                                  </>
                                                ) : (
                                                  "Tes pemahaman awal"
                                                )}
                                              </p>
                                            </div>

                                            {preResult ? (
                                              <div
                                                className="h-7.5 px-3 text-xs font-semibold bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 rounded-lg flex items-center shrink-0 cursor-default select-none shadow-none"
                                              >
                                                <span className="text-[11px] font-normal text-emerald-600/80 dark:text-emerald-400/80 mr-1.5">Nilai</span>
                                                <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300">{preResult.score}</span>
                                              </div>
                                            ) : !isForumOpen ? (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                disabled
                                                className="h-7.5 px-3 text-xs font-medium bg-zinc-100 dark:bg-zinc-800/60 text-zinc-400 border-zinc-200 dark:border-zinc-700 rounded-lg opacity-70 cursor-not-allowed shrink-0"
                                              >
                                                <Lock className="w-3 h-3 mr-1" /> Ditutup
                                              </Button>
                                            ) : (
                                              <Button
                                                size="sm"
                                                onClick={() => handleStartSessionQuiz(sesi, preQuizzes, "PRE")}
                                                className="h-7.5 px-3 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg cursor-pointer shrink-0 transition-colors shadow-2xs"
                                              >
                                                Kerjakan
                                              </Button>
                                            )}
                                          </div>
                                        )}

                                        {/* KOTAK POST-TEST */}
                                        {postQuizzes.length > 0 && (
                                          <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex items-center justify-between gap-3 shadow-2xs">
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                  Post-Test
                                                </span>
                                                <span className="text-[11px] text-zinc-400">
                                                  • {postQuizzes.length} Soal
                                                </span>
                                              </div>
                                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                                                {postResult ? (
                                                  <>
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                    <span>Selesai dikerjakan</span>
                                                  </>
                                                ) : (
                                                  "Tes akhir kelulusan"
                                                )}
                                              </p>
                                            </div>

                                            {postResult ? (
                                              <div
                                                className="h-7.5 px-3 text-xs font-semibold bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 rounded-lg flex items-center shrink-0 cursor-default select-none shadow-none"
                                              >
                                                <span className="text-[11px] font-normal text-emerald-600/80 dark:text-emerald-400/80 mr-1.5">Nilai</span>
                                                <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300">{postResult.score}</span>
                                              </div>
                                            ) : !isForumOpen ? (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                disabled
                                                className="h-7.5 px-3 text-xs font-medium bg-zinc-100 dark:bg-zinc-800/60 text-zinc-400 border-zinc-200 dark:border-zinc-700 rounded-lg opacity-70 cursor-not-allowed shrink-0"
                                              >
                                                <Lock className="w-3 h-3 mr-1" /> Ditutup
                                              </Button>
                                            ) : (
                                              <Button
                                                size="sm"
                                                onClick={() => handleStartSessionQuiz(sesi, postQuizzes, "POST")}
                                                className="h-7.5 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer shrink-0 transition-colors shadow-2xs"
                                              >
                                                Kerjakan
                                              </Button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* TAHAP 3: RTL (RENCANA TINDAK LANJUT) */}
            {currentStageTab === 3 && (
              !isRtlOpen ? (
                <div className="p-8 sm:p-10 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80 text-center space-y-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center mx-auto shadow-2xs">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Pengumpulan Tugas RTL Belum Dibuka
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                      {event.timeline?.rtl?.note || "Masa pengumpulan laporan dan tugas Rencana Tindak Lanjut (RTL) saat ini belum dibuka atau telah ditutup oleh panitia."}
                    </p>
                  </div>
                  {event.timeline?.rtl?.endDate && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/40 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Batas Waktu: {event.timeline.rtl.endDate}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                      Daftar Indikator Penugasan:
                    </span>
                    <span className="text-[10.5px] text-zinc-400">
                      Unggah langsung berkas tugas di bawah ini
                    </span>
                  </div>

                  {levelReqs.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
                      Belum ada penugasan RTL yang didaftarkan untuk kegiatan ini.
                    </div>
                  ) : (
                    levelReqs.map((req) => {
                      const sub = mySubmissions.find(
                        (s: any) => s.requirementId === req.id
                      );
                      const isApproved = sub?.status === "APPROVED";
                      const isPending = sub?.status === "PENDING";
                      const isRejected = sub?.status === "REJECTED";
                      const isCurrentlyUploading = uploadingTaskId === req.id;

                      return (
                        <div
                          key={req.id}
                          className={`p-4 rounded-2xl border transition-all space-y-3 text-xs ${
                            isApproved
                              ? "bg-white dark:bg-zinc-900 border-emerald-200/70 dark:border-emerald-950/60"
                              : isCurrentlyUploading
                              ? "bg-blue-50/20 dark:bg-blue-950/10 border-blue-400/80 dark:border-blue-500/80"
                              : isRejected
                              ? "bg-rose-50/20 dark:bg-rose-950/10 border-rose-200/80 dark:border-rose-900/50"
                              : "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80"
                          }`}
                        >
                          {/* Header: Judul Tugas & Status Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <h5 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                                {req.title}
                              </h5>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                {req.description}
                              </p>
                            </div>

                            <span
                              className={`text-[9.5px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                                isApproved
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60"
                                  : isPending
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60"
                                  : isRejected
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60"
                                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                              }`}
                            >
                              {isApproved
                                ? "✓ Disetujui"
                                : isPending
                                ? "⏳ Menunggu Review"
                                : isRejected
                                ? "✕ Perlu Revisi"
                                : "Belum Mengumpulkan"}
                            </span>
                          </div>

                          {/* Metadata: Deadline & Panduan Soal */}
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-100 dark:border-zinc-800/80 gap-2 flex-wrap">
                            {req.deadline ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1 text-[11px]">
                                <Clock className="w-3 h-3 shrink-0" />
                                Deadline: {formatDateTimeIndo(req.deadline)}
                              </span>
                            ) : (
                              <span className="text-zinc-400 italic text-[10.5px]">
                                Batas waktu fleksibel
                              </span>
                            )}

                            {req.fileUrl && (
                              <a
                                href={req.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1.5 text-[11px] bg-blue-50/80 dark:bg-blue-950/50 px-2 py-0.5 rounded-lg border border-blue-200/50 dark:border-blue-900/40"
                              >
                                <FileText className="w-3 h-3 text-blue-500" />
                                <span>Lihat / Unduh Soal Tugas</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          {/* Detail Berkas Yang Sudah Dikumpulkan */}
                          {sub && !isCurrentlyUploading && (
                            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70 space-y-2">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <div className="min-w-0">
                                    <span className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                                      Berkas Laporan Terkirim
                                    </span>
                                    <span className="text-[10px] text-zinc-400 block">
                                      Dikumpulkan pada {formatDateIndo(sub.date)}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {sub.fileLink && (
                                    <a
                                      href={sub.fileLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-lg"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>Lihat Berkas Saya</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}

                                  {!isApproved && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setUploadingTaskId(req.id);
                                        setTaskUploadNotes(sub.description || "");
                                      }}
                                      className="h-7 text-[10.5px] px-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                                    >
                                      {isRejected
                                        ? "Unggah Revisi"
                                        : "Ganti Berkas"}
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {sub.description && (
                                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 bg-white/70 dark:bg-zinc-900/70 p-2 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
                                  <span className="text-zinc-400 block text-[10px]">
                                    Catatan Pengumpulan:
                                  </span>
                                  {sub.description}
                                </p>
                              )}

                              {isRejected && sub.feedback && (
                                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] border border-rose-200/60 dark:border-rose-900/60">
                                  <strong>Catatan Evaluasi Instruktur:</strong>{" "}
                                  {sub.feedback}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tombol Awal Untuk Buka Form Upload */}
                          {!sub && !isCurrentlyUploading && (
                            <div className="pt-1">
                              {!isRtlOpen ? (
                                <Button
                                  type="button"
                                  disabled
                                  className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-xs font-semibold h-8.5 rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5 shadow-none opacity-70"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Pengumpulan Tugas Ditutup oleh Panitia</span>
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  onClick={() => {
                                    setUploadingTaskId(req.id);
                                    setTaskUploadNotes("");
                                  }}
                                  className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold h-8.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-none"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Unggah Berkas Laporan Tugas</span>
                                </Button>
                              )}
                            </div>
                          )}

                          {/* FORM UPLOAD TUGAS LANGSUNG */}
                          {isCurrentlyUploading && (
                            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/80 border border-blue-200 dark:border-blue-900/60 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Unggah Laporan Tugas Langsung</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={handleCancelTaskUpload}
                                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="space-y-2">
                                <div className="relative border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-white dark:bg-zinc-900">
                                  <input
                                    type="file"
                                    id={`file-task-${req.id}`}
                                    onChange={handleTaskFileSelect}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                  <div className="flex flex-col items-center justify-center gap-1.5">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                                      <Upload className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                      {taskUploadFileName ||
                                        "Klik untuk memilih berkas"}
                                    </span>
                                    <span className="text-[10px] text-zinc-400">
                                      {taskUploadFileSize
                                        ? `Ukuran: ${taskUploadFileSize}`
                                        : "Format PDF, DOCX, ZIP, JPG, PNG (Maks 15MB)"}
                                    </span>
                                  </div>
                                </div>

                                <textarea
                                  value={taskUploadNotes}
                                  onChange={(e) =>
                                    setTaskUploadNotes(e.target.value)
                                  }
                                  placeholder="Tuliskan keterangan ringkas atau link Google Drive cadangan jika ada..."
                                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  rows={2}
                                />
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelTaskUpload}
                                  className="h-8 text-xs cursor-pointer"
                                >
                                  Batal
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={isSubmittingTask || !taskUploadFile}
                                  onClick={() => handleDirectTaskUpload(req)}
                                  className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer"
                                >
                                  {isSubmittingTask
                                    ? "Mengunggah..."
                                    : "Kirim Laporan"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              )
            )}

            {/* TAHAP 4: TERIMA SERTIFIKAT */}
            {currentStageTab === 4 && (
              !isCertOpen ? (
                <div className="p-8 sm:p-10 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80 text-center space-y-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center mx-auto shadow-2xs">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Penerbitan Sertifikat Belum Dibuka
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                      {event.timeline?.certification?.note || "Pengesahan sertifikat resmi dan kelulusan kaderisasi masih dalam proses verifikasi & yudisium oleh panitia."}
                    </p>
                  </div>
                  {event.timeline?.certification?.releaseDate && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/40 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Estimasi Rilis Yudisium: {event.timeline.certification.releaseDate}</span>
                    </div>
                  )}
                </div>
              ) : stage4Done ? (
                  <div className="p-6 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-xs">
                      <Award className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
                        PENGESAHAN KADERISASI RESMI
                      </span>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        Selamat Sahabat {activeCadre?.name || myReg?.cadreName}!
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                        Anda telah berhasil menuntaskan seluruh tahapan {event.name} ({event.level}) beserta kewajiban RTL dengan hasil memuaskan.
                      </p>
                    </div>

                    <div className="inline-block p-2 rounded-xl bg-white dark:bg-zinc-900 border border-amber-500/20 text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                      No. Sertifikat: SERT-PMII-{event.level}-{myReg?.registrationNumber || "LULUS-2026"}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                      <Button
                        type="button"
                        onClick={onOpenCert}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9 px-5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-none"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Lihat & Cetak Sertifikat Digital</span>
                      </Button>

                      <Link href={`${rolePrefix}/profil`}>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full text-xs h-9 rounded-xl border-amber-300/80 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 cursor-pointer shadow-none"
                        >
                          <span>Buka KTA Digital</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80 text-center space-y-3">
                    <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Sertifikat Belum Diterbitkan
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                        Sertifikat resmi dan KTA Digital tingkat {event.level} akan otomatis terbuka setelah seluruh tugas RTL pada Tahap 3 diverifikasi dan disetujui.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => onStageTabChange(3)}
                      className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-xs h-8.5 px-4 rounded-xl cursor-pointer shadow-none"
                    >
                      Periksa Tugas RTL (Tahap 3)
                    </Button>
                  </div>
                )
            )}
          </div>

          {/* MODAL FOOTER */}
          <div className="p-3.5 sm:p-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30 flex items-center justify-between">
            <div>
              {currentStageTab > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    onStageTabChange((currentStageTab - 1) as any)
                  }
                  className="h-8.5 text-xs rounded-xl cursor-pointer text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 px-2.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </Button>
              )}
            </div>

            <div>
              {currentStageTab < 4 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    onStageTabChange((currentStageTab + 1) as any)
                  }
                  className="h-8.5 text-xs rounded-xl cursor-pointer text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 px-2.5"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* MODAL PENGERJAAN KUIS PRE-TEST & POST-TEST INTERAKTIF */}
    <Dialog
      open={Boolean(activeQuizSession)}
      onOpenChange={(open) => {
        if (!open) {
          setActiveQuizSession(null);
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !max-h-none !rounded-none !m-0 p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-none shadow-none flex flex-col z-50 focus:outline-none"
      >
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-6 py-3.5 shrink-0 shadow-xs">
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                      activeQuizType === "PRE"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {activeQuizType === "PRE" ? "Pre-Test" : "Post-Test"}
                  </Badge>
                  <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-2">
                    <span>{activeQuizSubject || activeQuizSession}</span>
                    {isQuizSubmitted && (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs px-2 py-0.5 font-bold shrink-0">
                        Nilai: {quizScore}
                      </Badge>
                    )}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  Evaluasi {activeQuizType === "PRE" ? "Awal (Pre-Test)" : "Kelulusan (Post-Test)"} materi kegiatan {event.name} ({activeQuizQuestions.length} Butir Soal)
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setActiveQuizSession(null)}
              className="h-8.5 w-8.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Tutup</span>
            </Button>
          </div>
        </div>

        {/* Body: Questions */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
          {/* Status banner jika sudah dikumpulkan dengan Hasil Nilai */}
          {isQuizSubmitted && (
            <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200/90 dark:border-emerald-900/70 bg-gradient-to-br from-emerald-50 via-emerald-50/70 to-teal-50/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                      Jawaban {activeQuizType === "PRE" ? "Pre-Test" : "Post-Test"} Berhasil Dikirim
                    </span>
                    <Badge variant="outline" className="bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-[11px] font-semibold py-0.5 px-2">
                      Tersimpan
                    </Badge>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                    Terima kasih! Jawaban Anda telah tersimpan dan terekam oleh sistem instruktur. Soal evaluasi tidak dapat diulang.
                    {activeQuizQuestions.length > 0 && (
                      <span className="block mt-0.5 font-medium text-emerald-800 dark:text-emerald-200">
                        Hasil evaluasi: Benar {correctAnswersCount} dari {activeQuizQuestions.length} butir soal.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Box Nilai Utama */}
              <div className="flex sm:flex-col items-center justify-between sm:justify-center px-5 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800/80 shadow-xs shrink-0 min-w-[130px] text-center">
                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Nilai Anda
                </span>
                <div className="flex items-baseline justify-center gap-1 my-0.5">
                  <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {quizScore}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                    / 100
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  quizScore >= 75
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
                    : quizScore >= 60
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
                }`}>
                  {quizScore >= 75 ? "Sangat Baik" : quizScore >= 60 ? "Cukup" : "Perlu Belajar"}
                </span>
              </div>
            </div>
          )}

          {/* Questions List */}
          {activeQuizQuestions.map((q, qIdx) => {
            const selectedOpt = userAnswers[q.id];
            const letterLabels = ["A", "B", "C", "D"];
            const isUserAnswerCorrect = isQuizSubmitted && selectedOpt === q.correctAnswer;
            const hasUserAnswered = isQuizSubmitted && typeof selectedOpt === "number";

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  isQuizSubmitted
                    ? isUserAnswerCorrect
                      ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                      : hasUserAnswered
                      ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex-1 leading-relaxed">
                    <span className="text-zinc-400 mr-1.5">{qIdx + 1}.</span> {q.question}
                  </span>
                  {isQuizSubmitted && (
                    hasUserAnswered ? (
                      isUserAnswerCorrect ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded font-semibold shrink-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Benar
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 text-[10px] px-2 py-0.5 rounded font-semibold shrink-0">
                          <X className="w-3 h-3 mr-1" /> Salah
                        </Badge>
                      )
                    ) : null
                  )}
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedOpt === optIdx;
                    const isCorrectAnswer = q.correctAnswer === optIdx;

                    let optClass =
                      "border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300";

                    if (isQuizSubmitted) {
                      if (isSelected && isCorrectAnswer) {
                        optClass =
                          "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500/40 cursor-default";
                      } else if (isSelected && !isCorrectAnswer) {
                        optClass =
                          "border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 font-semibold ring-1 ring-rose-500/40 cursor-default";
                      } else if (!isSelected && isCorrectAnswer && hasUserAnswered) {
                        optClass =
                          "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-400/30 cursor-default";
                      } else {
                        optClass =
                          "border-zinc-200 dark:border-zinc-800 opacity-60 text-zinc-400 dark:text-zinc-500 cursor-default";
                      }
                    } else if (isSelected) {
                      optClass =
                        "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 font-semibold";
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={isQuizSubmitted}
                        onClick={() => {
                          if (!isQuizSubmitted) {
                            setUserAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                          }
                        }}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs text-left transition-all ${optClass}`}
                      >
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isSelected && !isQuizSubmitted
                              ? "bg-blue-600 text-white"
                              : isQuizSubmitted && isSelected && isCorrectAnswer
                              ? "bg-emerald-600 text-white"
                              : isQuizSubmitted && isSelected && !isCorrectAnswer
                              ? "bg-rose-600 text-white"
                              : isQuizSubmitted && isCorrectAnswer && hasUserAnswered
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : isSelected && isQuizSubmitted
                              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {letterLabels[optIdx]}
                        </span>
                        <span className="truncate flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-6 py-3.5 shrink-0">
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-500">
              {isQuizSubmitted
                ? `Hasil: ${quizScore}/100 • ${correctAnswersCount} dari ${activeQuizQuestions.length} soal benar`
                : `${Object.keys(userAnswers).length} dari ${activeQuizQuestions.length} soal dijawab`}
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveQuizSession(null)}
                className="h-8.5 text-xs border-zinc-200 dark:border-zinc-800 cursor-pointer"
              >
                {isQuizSubmitted ? "Tutup" : "Batal"}
              </Button>

              {!isQuizSubmitted && (
                <Button
                  type="button"
                  onClick={handleSubmitActiveQuiz}
                  disabled={Object.keys(userAnswers).length === 0}
                  className="h-8.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 cursor-pointer shadow-xs border-none"
                >
                  Kumpulkan Jawaban
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Modal Detail Silabus Sesi */}
    <Dialog
      open={Boolean(activeSyllabusModal)}
      onOpenChange={(open) => {
        if (!open) setActiveSyllabusModal(null);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        {activeSyllabusModal && (
          <div className="flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold px-2 py-0.5">
                  Silabus Pembelajaran
                </Badge>
                {activeSyllabusModal.syllabus.category && (
                  <Badge variant="outline" className="text-xs">
                    {activeSyllabusModal.syllabus.category}
                  </Badge>
                )}
                {activeSyllabusModal.syllabus.durationHours && (
                  <span className="text-xs text-zinc-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" /> Alokasi: {activeSyllabusModal.syllabus.durationHours} Menit
                  </span>
                )}
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {activeSyllabusModal.syllabus.subjectName || activeSyllabusModal.sessionTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                Rencana pembelajaran dan sasaran kompetensi kurikulum kaderisasi
              </DialogDescription>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Tujuan & Sasaran */}
              {(activeSyllabusModal.syllabus.tujuan?.length > 0 || activeSyllabusModal.syllabus.goal) && (
                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300 text-xs">
                    <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Tujuan & Sasaran Pembelajaran:</span>
                  </div>
                  <ul className="space-y-1.5 pl-5 list-disc text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {(activeSyllabusModal.syllabus.tujuan || [activeSyllabusModal.syllabus.goal]).map((t: string, tIdx: number) => (
                      <li key={tIdx}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pokok Pembahasan */}
              {(activeSyllabusModal.syllabus.pokokPembahasan?.length > 0 || activeSyllabusModal.syllabus.description) && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                    Pokok Pembahasan:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(activeSyllabusModal.syllabus.pokokPembahasan || [activeSyllabusModal.syllabus.description]).map((pokok: string, pIdx: number) => (
                      <div
                        key={pIdx}
                        className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 text-xs flex items-start gap-2 text-zinc-800 dark:text-zinc-200"
                      >
                        <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          {pIdx + 1}
                        </span>
                        <span className="leading-relaxed">{pokok}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metode & Output */}
              {(activeSyllabusModal.syllabus.metode?.length > 0 || activeSyllabusModal.syllabus.harapan?.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {activeSyllabusModal.syllabus.metode?.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 space-y-2">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                        Metode Pembelajaran
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeSyllabusModal.syllabus.metode.map((m: string, mIdx: number) => (
                          <Badge
                            key={mIdx}
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSyllabusModal.syllabus.harapan?.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/50 space-y-2">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                        Target Capaian & Hasil
                      </span>
                      <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                        {activeSyllabusModal.syllabus.harapan.map((h: string, hIdx: number) => (
                          <li key={hIdx} className="leading-snug">• {h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveSyllabusModal(null)}
                className="px-4 text-xs cursor-pointer"
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Modal Kuesioner & Hasil: Analisis Preferensi Kognitif & Arah Karier Mahasiswa */}
    <Dialog open={isCareerModalOpen} onOpenChange={setIsCareerModalOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="flex flex-col">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                    Instrumen Mahasiswa
                  </span>
                  {careerResult && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Selesai
                    </span>
                  )}
                </div>
                <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Analisis Preferensi Kognitif & Arah Karier Mahasiswa
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                  Pemetaan gaya berpikir, bakat alamiah, dan rekomendasi arah profesi berbasis situasi sehari-hari.
                </DialogDescription>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsCareerModalOpen(false)}
                className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Tutup</span>
              </Button>
            </div>
          </div>

          {/* Body Content: Laporan Hasil OR Form Pengisian */}
          {isReviewingCareer && careerResult ? (
            /* VIEW LAPORAN HASIL - CLEAN & MINIMALIST */
            <div className="p-5 sm:p-6 space-y-4">
              {/* Formula Result Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono font-bold">
                      Tipe: {careerResult.mbtiCode}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      Hasil Analisis Kognitif
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    {careerResult.submittedAt}
                  </span>
                </div>

                <div className="pt-1">
                  <p className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {careerResult.formulaResult}
                  </p>
                </div>
              </div>

              {/* Grid 2 Kolom: Bakat & Minat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
                    <Brain className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    <span>Bakat Dominan</span>
                  </div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {careerResult.talent}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Kekuatan alamiah dalam pola berpikir konseptual, logika pemecahan masalah, dan pendekatan kerja.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
                    <TrendingUp className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    <span>Minat & Orientasi Karier</span>
                  </div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {careerResult.interest}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Sektor profesi dan ragam bidang kerja yang paling selaras dengan motivasi berkarya Anda.
                  </p>
                </div>
              </div>

              {/* Rekomendasi Peran Strategis di Organisasi PMII */}
              <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-850/40 border border-zinc-200/70 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
                  <Target className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  <span>Rekomendasi Penugasan di PMII</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {careerResult.strategicRole}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {careerResult.description}
                </p>
              </div>

              {/* Komposisi Skor 4 Dimensi MBTI */}
              {careerResult.dimensionScores && (
                <div className="p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2.5">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
                    Breakdown 4 Polarisasi Preferensi:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/60 dark:border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block font-medium">Energi</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                        E: {careerResult.dimensionScores.E} | I: {careerResult.dimensionScores.I}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/60 dark:border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block font-medium">Informasi</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                        S: {careerResult.dimensionScores.S} | N: {careerResult.dimensionScores.N}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/60 dark:border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block font-medium">Keputusan</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                        T: {careerResult.dimensionScores.T} | F: {careerResult.dimensionScores.F}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/60 dark:border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block font-medium">Eksekusi</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                        J: {careerResult.dimensionScores.J} | P: {careerResult.dimensionScores.P}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsReviewingCareer(false);
                    setCareerAnswers({});
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
                >
                  Isi Ulang Form
                </Button>

                <Button
                  type="button"
                  onClick={() => setIsCareerModalOpen(false)}
                  className="h-8.5 px-4 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl cursor-pointer"
                >
                  Tutup
                </Button>
              </div>
            </div>
          ) : (
            /* FORM PERTANYAAN PILIHAN - CLEAN & MINIMALIST */
            <div className="p-5 sm:p-6 space-y-5">
              {/* Progress Indicator */}
              <div className="space-y-1.5 pb-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Progres Pengisian
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-mono">
                    {Object.keys(careerAnswers).length} / {careerQuestions.length} Terjawab
                  </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300 rounded-full"
                    style={{
                      width: `${(Object.keys(careerAnswers).length / careerQuestions.length) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3.5">
                {careerQuestions.map((q, qIdx) => {
                  const selectedKey = careerAnswers[q.id];

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            No. {qIdx + 1 < 10 ? `0${qIdx + 1}` : qIdx + 1} • {q.category}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                          {q.question}
                        </h4>
                      </div>

                      {/* Options in 2 columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                        {q.options.map((opt) => {
                          const isSelected = selectedKey === opt.key;

                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => {
                                setCareerAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: opt.key
                                }));
                              }}
                              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                                isSelected
                                  ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-900/10 dark:ring-zinc-100/10"
                                  : "border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300"
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                  isSelected
                                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                                }`}
                              >
                                {opt.key}
                              </span>
                              <span className="text-xs leading-relaxed flex-1">
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Form Footer */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCareerModalOpen(false)}
                  className="h-8.5 text-xs px-4 text-zinc-500 hover:text-zinc-900 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitCareerTest}
                  disabled={Object.keys(careerAnswers).length < careerQuestions.length}
                  className="h-8.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-5 rounded-xl cursor-pointer shadow-xs disabled:opacity-40"
                >
                  Simpan & Analisis Hasil
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  </>
);
};
