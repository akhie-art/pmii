"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, DEFAULT_CADRES, DEFAULT_REQUIREMENTS } from "@/lib/db";
import {
  Award,
  Users,
  BookOpen,
  ClipboardList,
  Search,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  User,
  FolderOpen,
  MessageSquare,
  CheckCircle2,
  FileCheck,
  Check,
  X,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ArrowUpRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

// TypeScript interfaces
interface FollowUpRequirement {
  id: string;
  title: string;
  category: "Makalah" | "Membaca Buku" | "Diskusi Forum" | "Bakti Sosial" | "Keorganisasian" | "Lainnya";
  level: "MAPABA" | "PKD" | "PKL";
  description: string;
  minSubmissions: number;
}

interface CadreSubmission {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  fileLink: string;
  date: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  feedback: string;
}

interface CadreFollowUp {
  id: string;
  name: string;
  level: "MAPABA" | "PKD" | "PKL";
  commissariat: string;
  rayon?: string;
  startDate: string;
  status: "AKTIF" | "SELESAI" | "REVISI";
  submissions: CadreSubmission[];
  avatar?: string;
}

export default function FollowUpPage() {
  const [mounted, setMounted] = useState(false);
  const [roleMode, setRoleMode] = useState<"MEMBER" | "MENTOR">("MENTOR");
  const [selectedLevel, setSelectedLevel] = useState<"MAPABA" | "PKD" | "PKL">("MAPABA");
  const [requirements, setRequirements] = useState<FollowUpRequirement[]>([]);
  const [cadres, setCadres] = useState<CadreFollowUp[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Selected Member for personal view
  const [selectedCadreId, setSelectedCadreId] = useState<string>("");

  // Sub-tabs in Mentor Mode
  const [mentorActiveTab, setMentorActiveTab] = useState<"QUEUE" | "CADRES" | "REQUIREMENTS">("QUEUE");

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string>("");

  // --- CRUD Modals States ---
  // 1. Cadre Dialogs
  const [isAddCadreOpen, setIsAddCadreOpen] = useState(false);
  const [isEditCadreOpen, setIsEditCadreOpen] = useState(false);
  const [editingCadre, setEditingCadre] = useState<CadreFollowUp | null>(null);
  const [cadreFormName, setCadreFormName] = useState("");
  const [cadreFormLevel, setCadreFormLevel] = useState<"MAPABA" | "PKD" | "PKL">("MAPABA");
  const [cadreFormComm, setCadreFormComm] = useState("");
  const [cadreFormDate, setCadreFormDate] = useState("");
  const [cadreFormStatus, setCadreFormStatus] = useState<"AKTIF" | "SELESAI" | "REVISI">("AKTIF");

  // 2. Requirement Dialogs
  const [isAddReqOpen, setIsAddReqOpen] = useState(false);
  const [isEditReqOpen, setIsEditReqOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<FollowUpRequirement | null>(null);
  const [reqFormTitle, setReqFormTitle] = useState("");
  const [reqFormCategory, setReqFormCategory] = useState<FollowUpRequirement["category"]>("Makalah");
  const [reqFormDescription, setReqFormDescription] = useState("");
  const [reqFormMinSub, setReqFormMinSub] = useState<number>(1);
  const [reqFormLevel, setReqFormLevel] = useState<"MAPABA" | "PKD" | "PKL">("MAPABA");

  // 3. Submission Dialogs
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submitReqId, setSubmitReqId] = useState("");
  const [submitFormTitle, setSubmitFormTitle] = useState("");
  const [submitFormDesc, setSubmitFormDesc] = useState("");
  const [submitFormLink, setSubmitFormLink] = useState("");
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);

  // 4. Review Dialog
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState("");
  const [reviewingCadreId, setReviewingCadreId] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // 5. Queue Level Filter
  const [queueLevelFilter, setQueueLevelFilter] = useState<string>("ALL");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const getInitials = (name: string): string => {
    return (
      name
        .split(" ")
        .filter((w) => w.toLowerCase() !== "sahabat" && w.toLowerCase() !== "sahabati")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "KD"
    );
  };

  // Hydration safety & Initial load
  useEffect(() => {
    const loadData = async () => {
      const savedRole = localStorage.getItem("PMII_FOLLOWUP_ROLE");
      const savedLevel = localStorage.getItem("PMII_FOLLOWUP_LEVEL");

      try {
        const loadedReqs = await db.getRequirements(DEFAULT_REQUIREMENTS as any);
        setRequirements(loadedReqs as any as FollowUpRequirement[]);

        const loadedCadres = await db.getCadres(DEFAULT_CADRES);
        setCadres(loadedCadres);

        if (loadedCadres.length > 0) {
          setSelectedCadreId(loadedCadres[0].id);
        } else {
          setSelectedCadreId(DEFAULT_CADRES[0]?.id || "");
        }
      } catch (err) {
        console.error("Failed loading data from DB:", err);
      }

      if (savedRole === "MEMBER" || savedRole === "MENTOR") {
        setRoleMode(savedRole);
      }
      if (savedLevel === "MAPABA" || savedLevel === "PKD" || savedLevel === "PKL") {
        setSelectedLevel(savedLevel);
      }

      setMounted(true);
    };
    loadData();
  }, []);

  // Save actions
  const saveReqData = async (newReqs: FollowUpRequirement[]) => {
    setRequirements(newReqs);
    await db.saveRequirements(newReqs as any);
  };

  const saveCadreData = async (newCadres: CadreFollowUp[]) => {
    setCadres(newCadres);
    await db.saveCadres(newCadres as any);
  };

  // Progress calculation
  const calculateCadreProgress = (cadre: CadreFollowUp, reqsList: FollowUpRequirement[]): number => {
    const levelReqs = reqsList.filter((r) => r.level === cadre.level);
    if (levelReqs.length === 0) return 0;

    let totalPercentage = 0;
    levelReqs.forEach((req) => {
      const approvedSubmissionsCount = cadre.submissions.filter(
        (sub) => sub.requirementId === req.id && sub.status === "APPROVED"
      ).length;
      const progressRatio = Math.min(1, approvedSubmissionsCount / req.minSubmissions);
      totalPercentage += progressRatio * 100;
    });

    return Math.round(totalPercentage / levelReqs.length);
  };

  // Switch role and auto-select compatible cadre
  const handleRoleChange = (role: "MEMBER" | "MENTOR") => {
    setRoleMode(role);
    localStorage.setItem("PMII_FOLLOWUP_ROLE", role);

    if (role === "MEMBER") {
      const levelMatches = cadres.filter((c) => c.level === selectedLevel);
      if (levelMatches.length > 0) {
        setSelectedCadreId(levelMatches[0].id);
      } else if (cadres.length > 0) {
        setSelectedCadreId(cadres[0].id);
      }
    }
  };

  const handleLevelChange = (level: "MAPABA" | "PKD" | "PKL") => {
    setSelectedLevel(level);
    localStorage.setItem("PMII_FOLLOWUP_LEVEL", level);

    if (roleMode === "MEMBER") {
      const levelMatches = cadres.filter((c) => c.level === level);
      if (levelMatches.length > 0) {
        setSelectedCadreId(levelMatches[0].id);
      }
    }
  };

  // --- CRUD HANDLERS FOR CADRES ---
  const handleOpenAddCadre = () => {
    setCadreFormName("");
    setCadreFormLevel(selectedLevel);
    setCadreFormComm("PK PMII Ki Ageng Getas Pendawa");
    setCadreFormDate(new Date().toISOString().split("T")[0]);
    setIsAddCadreOpen(true);
  };

  const handleAddCadre = async () => {
    if (!cadreFormName.trim() || !cadreFormComm.trim()) return;

    const newCadre: CadreFollowUp = {
      id: `cadre-${Date.now()}`,
      name: cadreFormName.trim(),
      level: cadreFormLevel,
      commissariat: cadreFormComm.trim(),
      startDate: cadreFormDate,
      status: "AKTIF",
      submissions: []
    };

    const updated = [...cadres, newCadre];
    await saveCadreData(updated);
    setIsAddCadreOpen(false);

    if (roleMode === "MEMBER") {
      setSelectedCadreId(newCadre.id);
    }
    showToast(`Kader "${newCadre.name}" berhasil didaftarkan.`);
  };

  const handleOpenEditCadre = (cadre: CadreFollowUp) => {
    setEditingCadre(cadre);
    setCadreFormName(cadre.name);
    setCadreFormLevel(cadre.level);
    setCadreFormComm(cadre.commissariat);
    setCadreFormDate(cadre.startDate);
    setCadreFormStatus(cadre.status);
    setIsEditCadreOpen(true);
  };

  const handleEditCadre = async () => {
    if (!editingCadre || !cadreFormName.trim() || !cadreFormComm.trim()) return;

    const updated = cadres.map((c) => {
      if (c.id === editingCadre.id) {
        return {
          ...c,
          name: cadreFormName.trim(),
          level: cadreFormLevel,
          commissariat: cadreFormComm.trim(),
          startDate: cadreFormDate,
          status: cadreFormStatus
        };
      }
      return c;
    });

    await saveCadreData(updated);
    setIsEditCadreOpen(false);
    setEditingCadre(null);
    showToast(`Data kader "${cadreFormName.trim()}" berhasil diperbarui.`);
  };

  const handleDeleteCadre = async (id: string) => {
    const targetCadre = cadres.find((c) => c.id === id);
    if (confirm("Apakah anda yakin ingin menghapus data progres kader ini secara permanen?")) {
      const updated = cadres.filter((c) => c.id !== id);
      await saveCadreData(updated);
      if (selectedCadreId === id && updated.length > 0) {
        setSelectedCadreId(updated[0].id);
      }
      showToast(`Data kader ${targetCadre ? `"${targetCadre.name}"` : ""} berhasil dihapus.`);
    }
  };

  // --- CRUD HANDLERS FOR REQUIREMENTS ---
  const handleOpenAddReq = () => {
    setReqFormTitle("");
    setReqFormCategory("Makalah");
    setReqFormDescription("");
    setReqFormMinSub(1);
    setReqFormLevel(selectedLevel);
    setIsAddReqOpen(true);
  };

  const handleAddRequirement = async () => {
    if (!reqFormTitle.trim() || !reqFormDescription.trim()) return;

    const newReq: FollowUpRequirement = {
      id: `req-${Date.now()}`,
      title: reqFormTitle.trim(),
      category: reqFormCategory,
      level: reqFormLevel,
      description: reqFormDescription.trim(),
      minSubmissions: Number(reqFormMinSub) || 1
    };

    const updated = [...requirements, newReq];
    await saveReqData(updated);
    setIsAddReqOpen(false);
    showToast(`Indikator "${newReq.title}" berhasil ditambahkan.`);
  };

  const handleOpenEditReq = (req: FollowUpRequirement) => {
    setEditingReq(req);
    setReqFormTitle(req.title);
    setReqFormCategory(req.category);
    setReqFormDescription(req.description);
    setReqFormMinSub(req.minSubmissions);
    setReqFormLevel(req.level);
    setIsEditReqOpen(true);
  };

  const handleEditRequirement = async () => {
    if (!editingReq || !reqFormTitle.trim() || !reqFormDescription.trim()) return;

    const updated = requirements.map((r) => {
      if (r.id === editingReq.id) {
        return {
          ...r,
          title: reqFormTitle.trim(),
          category: reqFormCategory,
          description: reqFormDescription.trim(),
          minSubmissions: Number(reqFormMinSub) || 1,
          level: reqFormLevel
        };
      }
      return r;
    });

    await saveReqData(updated);
    setIsEditReqOpen(false);
    setEditingReq(null);
    showToast(`Indikator "${reqFormTitle.trim()}" berhasil diperbarui.`);
  };

  const handleDeleteRequirement = async (id: string) => {
    if (confirm("Hapus persyaratan ini? Kader yang sudah melapor pada poin ini akan kehilangan progresnya.")) {
      const updated = requirements.filter((r) => r.id !== id);
      await saveReqData(updated);
      showToast("Indikator berhasil dihapus.");
    }
  };

  // --- SUBMISSIONS SUBMIT & REVIEW ---
  const handleOpenSubmitProgress = (reqId: string) => {
    setSubmitReqId(reqId);
    setSubmitFormTitle("");
    setSubmitFormDesc("");
    setSubmitFormLink("");
    setEditingSubmissionId(null);
    setIsSubmitOpen(true);
  };

  const handleOpenEditSubmission = (reqId: string, sub: CadreSubmission) => {
    setSubmitReqId(reqId);
    setSubmitFormTitle(sub.title);
    setSubmitFormDesc(sub.description);
    setSubmitFormLink(sub.fileLink === "Catatan deskripsi progres" ? "" : sub.fileLink);
    setEditingSubmissionId(sub.id);
    setIsSubmitOpen(true);
  };

  const handleSubmitProgress = async () => {
    if (!selectedCadreId || !submitFormTitle.trim() || !submitFormDesc.trim()) return;

    const updated = cadres.map((c) => {
      if (c.id === selectedCadreId) {
        if (editingSubmissionId) {
          return {
            ...c,
            submissions: c.submissions.map((s) =>
              s.id === editingSubmissionId
                ? {
                    ...s,
                    title: submitFormTitle.trim(),
                    description: submitFormDesc.trim(),
                    fileLink: submitFormLink.trim() || "Catatan deskripsi progres"
                  }
                : s
            )
          };
        } else {
          const newSubmission: CadreSubmission = {
            id: `sub-${Date.now()}`,
            requirementId: submitReqId,
            title: submitFormTitle.trim(),
            description: submitFormDesc.trim(),
            fileLink: submitFormLink.trim() || "Catatan deskripsi progres",
            date: new Date().toISOString().split("T")[0],
            status: "PENDING",
            feedback: ""
          };
          return { ...c, submissions: [newSubmission, ...c.submissions] };
        }
      }
      return c;
    });

    await saveCadreData(updated);
    setIsSubmitOpen(false);
    showToast(
      editingSubmissionId
        ? `Laporan "${submitFormTitle.trim()}" berhasil diperbarui.`
        : `Laporan "${submitFormTitle.trim()}" berhasil dikirim untuk ditinjau.`
    );
    setEditingSubmissionId(null);
  };

  const handleOpenReview = (cadreId: string, submissionId: string) => {
    const cadre = cadres.find((c) => c.id === cadreId);
    const sub = cadre?.submissions.find((s) => s.id === submissionId);
    if (!sub) return;

    setReviewingCadreId(cadreId);
    setReviewingSubmissionId(submissionId);
    setReviewFeedback(sub.feedback || "");
    // FIX PRESERVED: properly default to actual submission status
    setReviewStatus(sub.status === "REJECTED" ? "REJECTED" : "APPROVED");
    setIsReviewOpen(true);
  };

  const handleReviewSubmission = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reviewingCadreId || !reviewingSubmissionId) return;

    setIsSubmittingReview(true);
    try {
      const updated = cadres.map((c) => {
        if (c.id === reviewingCadreId) {
          const updatedSubs = c.submissions.map((s) => {
            if (s.id === reviewingSubmissionId) {
              return {
                ...s,
                status: reviewStatus,
                feedback: reviewFeedback.trim()
              };
            }
            return s;
          });

          const calculatedProgress = calculateCadreProgress({ ...c, submissions: updatedSubs }, requirements);
          const overallStatus =
            calculatedProgress >= 100
              ? ("SELESAI" as const)
              : reviewStatus === "REJECTED"
              ? ("REVISI" as const)
              : c.status;

          return {
            ...c,
            status: overallStatus,
            submissions: updatedSubs
          };
        }
        return c;
      });

      await saveCadreData(updated);
      setIsReviewOpen(false);
      showToast(
        reviewStatus === "APPROVED"
          ? "Laporan berhasil disetujui!"
          : "Laporan dikembalikan untuk revisi."
      );
    } catch (err) {
      console.error("Failed to save review:", err);
      showToast("Gagal menyimpan hasil verifikasi.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleQuickApprove = async (cadreId: string, submissionId: string) => {
    const targetCadre = cadres.find((c) => c.id === cadreId);
    const targetSub = targetCadre?.submissions.find((s) => s.id === submissionId);

    const updated = cadres.map((c) => {
      if (c.id === cadreId) {
        const updatedSubs = c.submissions.map((s) => {
          if (s.id === submissionId) {
            return {
              ...s,
              status: "APPROVED" as const,
              feedback: "Disetujui secara cepat oleh Instruktur / Pengurus."
            };
          }
          return s;
        });

        const calculatedProgress = calculateCadreProgress({ ...c, submissions: updatedSubs }, requirements);
        const overallStatus = calculatedProgress >= 100 ? ("SELESAI" as const) : c.status;

        return {
          ...c,
          status: overallStatus,
          submissions: updatedSubs
        };
      }
      return c;
    });

    await saveCadreData(updated);
    showToast(`Laporan "${targetSub?.title || ""}" berhasil disetujui.`);
  };

  const handleDeleteSubmission = async (cadreId: string, subId: string) => {
    if (confirm("Apakah anda yakin ingin menarik laporan progres ini?")) {
      const updated = cadres.map((c) => {
        if (c.id === cadreId) {
          return {
            ...c,
            submissions: c.submissions.filter((s) => s.id !== subId)
          };
        }
        return c;
      });
      await saveCadreData(updated);
      showToast("Laporan progres berhasil ditarik.");
    }
  };

  // --- STATS COMPUTATIONS ---
  const levelCadres = cadres.filter((c) => c.level === selectedLevel);
  const totalLevelCadres = levelCadres.length;
  const activeLevelCadres = levelCadres.filter((c) => c.status === "AKTIF" || c.status === "REVISI").length;
  const completedLevelCadres = levelCadres.filter((c) => c.status === "SELESAI").length;

  const pendingSubmissionsQueue = cadres.flatMap((c) =>
    c.submissions
      .filter((s) => s.status === "PENDING")
      .map((s) => ({
        cadreId: c.id,
        cadreName: c.name,
        cadreLevel: c.level,
        commissariat: c.commissariat,
        rayon: c.rayon,
        submission: s
      }))
  );

  // FIX PRESERVED: Queue tab filter by level
  const filteredQueue =
    queueLevelFilter === "ALL"
      ? pendingSubmissionsQueue
      : pendingSubmissionsQueue.filter((item) => item.cadreLevel === queueLevelFilter);

  // Active user selection inside Member Mode
  const activeCadre = cadres.find((c) => c.id === selectedCadreId);
  const activeCadreReqs = activeCadre ? requirements.filter((r) => r.level === activeCadre.level) : [];
  const activeCadreProgress = activeCadre ? calculateCadreProgress(activeCadre, requirements) : 0;

  // Active reviewing submission & cadre data
  const reviewingCadre = cadres.find((c) => c.id === reviewingCadreId);
  const reviewingSubmission = reviewingCadre?.submissions.find((s) => s.id === reviewingSubmissionId);

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/3" />
        <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10 font-sans text-zinc-900 dark:text-zinc-100 pb-12">
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 right-6 z-50 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-zinc-700 dark:border-zinc-300"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HERO HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 rounded-xl shadow-none">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white shadow-sm shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Follow Up & Sertifikasi RKTL
              </h1>
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2">
                Kaderisasi Formal
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-xl leading-relaxed">
              Pantau progres wajib pasca-pelatihan formal MAPABA, PKD, dan PKL secara terintegrasi serta validasi kelulusan pergerakan.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {pendingSubmissionsQueue.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>{pendingSubmissionsQueue.length} laporan menunggu review</span>
            </div>
          )}
          <div className="px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
            Total: <span className="font-semibold text-zinc-900 dark:text-white">{cadres.length}</span> Kader
          </div>
        </div>
      </div>

      {/* 2. CONTROL BAR (Level Tabs & Role Switcher) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800">
        {/* Tier Tabs (Underline pattern) */}
        <div className="flex gap-6 text-xs font-medium">
          {(["MAPABA", "PKD", "PKL"] as const).map((lvl) => {
            const isActive = selectedLevel === lvl;
            const count = cadres.filter((c) => c.level === lvl).length;
            return (
              <button
                key={lvl}
                onClick={() => handleLevelChange(lvl)}
                className={`pb-3 cursor-pointer border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                  isActive
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                }`}
              >
                <span>Jenjang {lvl}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    isActive
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Role Toggle Switch */}
        <div className="flex items-center gap-2 pb-3 sm:pb-2">
          <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700/60 text-xs">
            <button
              onClick={() => handleRoleChange("MENTOR")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                roleMode === "MENTOR"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Mentor Mode</span>
            </button>
            <button
              onClick={() => handleRoleChange("MEMBER")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                roleMode === "MEMBER"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Kader Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENTS BY ROLE */}
      <AnimatePresence mode="wait">
        {roleMode === "MEMBER" ? (
          /* ========================================================
             MEMBER (CADRE) VIEW
             ======================================================== */
          <motion.div
            key="member-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Sidebar Column: Cadre Profile & Progression */}
            <div className="space-y-6">
              <Card className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Pilih Profil Kader Simulasi
                  </label>
                  <Select
                    value={selectedCadreId}
                    onValueChange={(val) => {
                      if (val) setSelectedCadreId(val);
                    }}
                  >
                    <SelectTrigger className="w-full text-xs font-medium bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9">
                      <SelectValue placeholder="Pilih Profil Kader" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                      {cadres.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.name} ({c.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activeCadre ? (
                  <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    {/* Cadre Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-200/60 dark:border-blue-900/60 shrink-0">
                        {getInitials(activeCadre.name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                          {activeCadre.name}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {activeCadre.commissariat}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Items */}
                    <div className="space-y-2 text-xs pt-1">
                      <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-zinc-500 dark:text-zinc-400">Jenjang Formal:</span>
                        <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold">
                          {activeCadre.level}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-zinc-500 dark:text-zinc-400">Status Tindak Lanjut:</span>
                        <Badge
                          className={`text-[10px] font-semibold border ${
                            activeCadre.status === "SELESAI"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                              : activeCadre.status === "REVISI"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                          }`}
                        >
                          {activeCadre.status === "SELESAI"
                            ? "Lulus / Certified"
                            : activeCadre.status === "REVISI"
                            ? "Perlu Revisi"
                            : "Aktif / Proses"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-zinc-500 dark:text-zinc-400">Tanggal Mulai:</span>
                        <span className="font-mono text-zinc-700 dark:text-zinc-300 text-[11px]">
                          {activeCadre.startDate}
                        </span>
                      </div>
                    </div>

                    {/* Progress Gauge */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                          Progres Kelulusan
                        </span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {activeCadreProgress}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${activeCadreProgress}%` }}
                        />
                      </div>
                      {activeCadreProgress >= 100 && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-medium flex gap-2 items-start mt-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>
                            Selamat! Seluruh indikator tindak lanjut kaderisasi {activeCadre.level} telah terpenuhi.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-zinc-500">
                    Silakan daftarkan kader terlebih dahulu di Mode Mentor.
                  </div>
                )}
              </Card>

              {/* Submissions History Card */}
              {activeCadre && (
                <Card className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Riwayat Kiriman Anda
                    </h3>
                    <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium text-[10px] border-none">
                      {activeCadre.submissions.length} Laporan
                    </Badge>
                  </div>

                  {activeCadre.submissions.length === 0 ? (
                    <div className="text-center py-8 text-xs text-zinc-400 flex flex-col items-center gap-2">
                      <FolderOpen className="w-6 h-6 text-zinc-400" />
                      <span>Belum ada kiriman. Silakan ajukan progres pada panel sebelah kanan.</span>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                      {activeCadre.submissions.map((sub) => {
                        const associatedReq = requirements.find((r) => r.id === sub.requirementId);
                        return (
                          <div
                            key={sub.id}
                            className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-1.5 relative group"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase truncate block max-w-[140px]">
                                {associatedReq?.title || "Laporan Lain"}
                              </span>
                              <Badge
                                className={`text-[10px] font-semibold border ${
                                  sub.status === "APPROVED"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                                    : sub.status === "REJECTED"
                                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900"
                                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                                }`}
                              >
                                {sub.status === "APPROVED"
                                  ? "Disetujui"
                                  : sub.status === "REJECTED"
                                  ? "Revisi"
                                  : "Pending"}
                              </Badge>
                            </div>
                            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight">
                              {sub.title}
                            </h4>
                            <span className="text-[10px] text-zinc-400 block font-mono">
                              Tanggal: {sub.date}
                            </span>
                            {sub.feedback && (
                              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 border-l-2 border-amber-500 text-[11px] text-zinc-600 dark:text-zinc-400 rounded-r">
                                <span className="font-semibold text-amber-700 dark:text-amber-400">
                                  Catatan Mentor:{" "}
                                </span>
                                &ldquo;{sub.feedback}&rdquo;
                              </div>
                            )}

                            {sub.status === "PENDING" && (
                              <div className="flex justify-end gap-1.5 pt-1 mt-1 border-t border-zinc-200/60 dark:border-zinc-800">
                                <button
                                  onClick={() => handleOpenEditSubmission(sub.requirementId, sub)}
                                  className="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors cursor-pointer"
                                  title="Edit laporan"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSubmission(activeCadre.id, sub.id)}
                                  className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                                  title="Batalkan laporan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Checklist Items Panel */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Indikator Kewajiban Follow Up
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Penuhi seluruh indikator di bawah untuk menyelesaikan proses kaderisasi formal.
                </p>
              </div>

              {!activeCadre ? (
                <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
                  Silakan pilih atau daftarkan kader terlebih dahulu.
                </div>
              ) : activeCadreReqs.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
                  Belum ada persyaratan kurikulum yang ditetapkan untuk jenjang {activeCadre.level}.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {activeCadreReqs.map((req) => {
                    const approvedCount = activeCadre.submissions.filter(
                      (s) => s.requirementId === req.id && s.status === "APPROVED"
                    ).length;
                    const pendingCount = activeCadre.submissions.filter(
                      (s) => s.requirementId === req.id && s.status === "PENDING"
                    ).length;
                    const completionRatio = Math.min(req.minSubmissions, approvedCount);
                    const isCompleted = approvedCount >= req.minSubmissions;

                    return (
                      <Card
                        key={req.id}
                        className={`p-5 bg-white dark:bg-zinc-900 border rounded-xl shadow-none transition-all ${
                          isCompleted
                            ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10"
                            : "border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[10px] font-medium">
                                {req.category}
                              </Badge>
                              <Badge
                                className={`text-[10px] font-semibold border ${
                                  isCompleted
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                                    : approvedCount > 0
                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"
                                }`}
                              >
                                {isCompleted ? "Selesai" : approvedCount > 0 ? "Dicicil" : "Belum Mulai"}
                              </Badge>
                            </div>

                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                              {req.title}
                            </h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                              {req.description}
                            </p>

                            {/* Kiriman dokumen pada indikator ini */}
                            {activeCadre.submissions.filter((s) => s.requirementId === req.id).length > 0 && (
                              <div className="pt-2.5 mt-2.5 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block uppercase tracking-wider">
                                  Kiriman Dokumen Anda:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {activeCadre.submissions
                                    .filter((s) => s.requirementId === req.id)
                                    .map((s) => (
                                      <div
                                        key={s.id}
                                        className="p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                                      >
                                        <div className="flex-1 min-w-0 pr-2">
                                          <div className="font-semibold text-zinc-800 dark:text-zinc-200 truncate leading-none mb-1">
                                            {s.title}
                                          </div>
                                          <div className="text-[10px] text-zinc-400 font-mono leading-none">
                                            {s.date}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          {s.fileLink.startsWith("http") && (
                                            <a
                                              href={s.fileLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-1 text-blue-600 dark:text-blue-400 hover:underline"
                                              title="Lihat Tautan Berkas"
                                            >
                                              <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                          )}
                                          <Badge
                                            className={`text-[9px] font-semibold px-1.5 py-0.5 border ${
                                              s.status === "APPROVED"
                                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200"
                                                : s.status === "REJECTED"
                                                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200"
                                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200"
                                            }`}
                                          >
                                            {s.status === "APPROVED" ? "Disetujui" : s.status === "REJECTED" ? "Revisi" : "Pending"}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
                            <div className="flex flex-col sm:items-end">
                              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                Target Capaian
                              </span>
                              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                                {completionRatio} <span className="text-xs text-zinc-400 font-normal">/ {req.minSubmissions}</span>
                              </div>
                              {pendingCount > 0 && (
                                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                  ({pendingCount} menunggu review)
                                </span>
                              )}
                            </div>

                            {!isCompleted && (
                              <Button
                                onClick={() => handleOpenSubmitProgress(req.id)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-8 px-3 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Kirim Progres</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ========================================================
             MENTOR (EVALUATOR) VIEW
             ======================================================== */
          <motion.div
            key="mentor-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Inner Sub-tabs Navigation */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-xs font-medium">
              {[
                {
                  id: "QUEUE" as const,
                  label: "Antrean Persetujuan",
                  icon: Clock,
                  count: pendingSubmissionsQueue.length
                },
                {
                  id: "CADRES" as const,
                  label: "Tabel Progres Kader",
                  icon: Users,
                  count: totalLevelCadres
                },
                {
                  id: "REQUIREMENTS" as const,
                  label: "Persyaratan Kurikulum",
                  icon: BookOpen,
                  count: requirements.filter((r) => r.level === selectedLevel).length
                }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = mentorActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setMentorActiveTab(tab.id)}
                    className={`pb-3 cursor-pointer border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                      isActive
                        ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                        : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          tab.id === "QUEUE"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : isActive
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: QUEUE */}
            {mentorActiveTab === "QUEUE" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Verifikasi Pengumpulan Laporan
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Tinjau berkas naskah kader, periksa pemenuhan target, dan beri umpan balik.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={queueLevelFilter}
                      onValueChange={(val) => {
                        if (val) setQueueLevelFilter(val);
                      }}
                    >
                      <SelectTrigger className="w-[140px] text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9 font-medium">
                        <SelectValue placeholder="Filter Jenjang" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <SelectItem value="ALL" className="text-xs">Semua Jenjang</SelectItem>
                        <SelectItem value="MAPABA" className="text-xs">MAPABA</SelectItem>
                        <SelectItem value="PKD" className="text-xs">PKD</SelectItem>
                        <SelectItem value="PKL" className="text-xs">PKL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredQueue.length === 0 ? (
                  <Card className="p-12 text-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center space-y-2 shadow-none">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-1">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {queueLevelFilter === "ALL"
                        ? "Antrean Bersih!"
                        : `Tidak Ada Antrean untuk Jenjang ${queueLevelFilter}`}
                    </h4>
                    <p className="text-xs text-zinc-500 max-w-sm">
                      {queueLevelFilter === "ALL"
                        ? "Semua kiriman tugas tindak lanjut dari seluruh kader telah selesai diverifikasi."
                        : "Tidak ada laporan pending untuk jenjang yang dipilih."}
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredQueue.map((item) => {
                      const req = requirements.find((r) => r.id === item.submission.requirementId);
                      return (
                        <Card
                          key={item.submission.id}
                          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-none flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-200/60 dark:border-blue-900/60 shrink-0">
                                  {getInitials(item.cadreName)}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                    {item.cadreName}
                                  </h4>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[9px] font-semibold px-1.5 py-0">
                                      {item.cadreLevel}
                                    </Badge>
                                    <span className="text-[10px] text-zinc-400 truncate max-w-[150px]">
                                      {item.commissariat}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-[10px] font-semibold">
                                {req?.category || "Laporan"}
                              </Badge>
                            </div>

                            {/* Details container */}
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                  {item.submission.title}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  {item.submission.date}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                {item.submission.description}
                              </p>
                              {item.submission.fileLink.startsWith("http") ? (
                                <div className="pt-1">
                                  <a
                                    href={item.submission.fileLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Buka Tautan Berkas / Dokumen</span>
                                  </a>
                                </div>
                              ) : (
                                <div className="pt-1 text-[10px] text-zinc-400 italic">
                                  Catatan: {item.submission.fileLink}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                            <span className="text-[10px] text-zinc-400">
                              Indikator: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{req?.title || "Umum"}</span>
                            </span>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleOpenReview(item.cadreId, item.submission.id)}
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs font-medium border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
                              >
                                Tinjau Detil
                              </Button>
                              <Button
                                onClick={() => handleQuickApprove(item.cadreId, item.submission.id)}
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium h-8 px-3 rounded-lg cursor-pointer"
                              >
                                Setujui Cepat
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CADRES DIRECTORY */}
            {mentorActiveTab === "CADRES" && (
              <div className="space-y-4">
                {/* Level Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <span className="text-[10px] font-semibold uppercase text-zinc-400 tracking-wider">
                      Total Kader {selectedLevel}
                    </span>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                      {totalLevelCadres} <span className="text-xs font-normal text-zinc-500">Kader</span>
                    </p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <span className="text-[10px] font-semibold uppercase text-zinc-400 tracking-wider">
                      Kader Aktif / Proses
                    </span>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                      {activeLevelCadres} <span className="text-xs font-normal text-zinc-500">Kader</span>
                    </p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <span className="text-[10px] font-semibold uppercase text-zinc-400 tracking-wider">
                      Lulus Tindak Lanjut
                    </span>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {completedLevelCadres} <span className="text-xs font-normal text-zinc-500">Kader</span>
                    </p>
                  </div>
                </div>

                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-none">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      placeholder="Cari kader atau komisariat..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end">
                    <Select
                      value={statusFilter}
                      onValueChange={(val) => {
                        if (val) setStatusFilter(val);
                      }}
                    >
                      <SelectTrigger className="w-[140px] text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9 font-medium">
                        <SelectValue placeholder="Filter Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                        <SelectItem value="AKTIF" className="text-xs">Aktif / Proses</SelectItem>
                        <SelectItem value="SELESAI" className="text-xs">Lulus RKTL</SelectItem>
                        <SelectItem value="REVISI" className="text-xs">Butuh Revisi</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleOpenAddCadre}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-9 px-3.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Kader</span>
                    </Button>
                  </div>
                </div>

                {/* Table */}
                {(() => {
                  const filtered = cadres.filter((c) => {
                    const matchSearch =
                      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.commissariat.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchStatus = statusFilter === "ALL" ? true : c.status === statusFilter;
                    // FIX PRESERVED: match selected Level
                    const matchLevel = c.level === selectedLevel;
                    return matchSearch && matchStatus && matchLevel;
                  });

                  if (filtered.length === 0) {
                    return (
                      <Card className="p-12 text-center text-xs text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none">
                        Tidak ada kader yang cocok dengan kriteria pencarian atau filter jenjang {selectedLevel}.
                      </Card>
                    );
                  }

                  return (
                    <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-none">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-zinc-50/70 dark:bg-zinc-950/60">
                            <TableRow className="border-b border-zinc-200 dark:border-zinc-800">
                              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 py-3 pl-5">
                                Nama Kader
                              </TableHead>
                              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 py-3">
                                Tingkat
                              </TableHead>
                              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 py-3">
                                Komisariat
                              </TableHead>
                              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 py-3">
                                Progres Capaian
                              </TableHead>
                              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 py-3">
                                Status
                              </TableHead>
                              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 py-3 text-right pr-5">
                                Aksi
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filtered.map((c) => {
                              const progress = calculateCadreProgress(c, requirements);
                              return (
                                <TableRow
                                  key={c.id}
                                  className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                >
                                  <TableCell className="py-3.5 pl-5">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center justify-center border border-blue-200/60 dark:border-blue-900/60 shrink-0">
                                        {getInitials(c.name)}
                                      </div>
                                      <div>
                                        <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                                          {c.name}
                                        </div>
                                        <div className="text-[10px] text-zinc-400 font-mono">
                                          Mulai: {c.startDate}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3.5">
                                    <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold">
                                      {c.level}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3.5">
                                    <div className="text-xs text-zinc-700 dark:text-zinc-300">
                                      {c.commissariat}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3.5">
                                    <div className="flex items-center gap-2 max-w-[140px]">
                                      <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-blue-600 rounded-full"
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 font-mono w-8">
                                        {progress}%
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3.5">
                                    <Badge
                                      className={`text-[10px] font-semibold border ${
                                        c.status === "SELESAI"
                                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                                          : c.status === "REVISI"
                                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900"
                                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                                      }`}
                                    >
                                      {c.status === "SELESAI"
                                        ? "Lulus"
                                        : c.status === "REVISI"
                                        ? "Revisi"
                                        : "Aktif"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3.5 text-right pr-5">
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        onClick={() => {
                                          setSelectedCadreId(c.id);
                                          setRoleMode("MEMBER");
                                        }}
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg cursor-pointer"
                                        title="Simulasi Tampilan Kader"
                                      >
                                        <User className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        onClick={() => handleOpenEditCadre(c)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                                        title="Edit Kader"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        onClick={() => handleDeleteCadre(c.id)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg cursor-pointer"
                                        title="Hapus Kader"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </Card>
                  );
                })()}
              </div>
            )}

            {/* TAB 3: REQUIREMENTS SETTINGS */}
            {mentorActiveTab === "REQUIREMENTS" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Kelola Indikator Wajib Follow Up ({selectedLevel})
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Tetapkan indikator kelulusan pasca-formal sesuai kurikulum resmi PMII.
                    </p>
                  </div>

                  <Button
                    onClick={handleOpenAddReq}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-9 px-3.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 self-end sm:self-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Indikator Baru</span>
                  </Button>
                </div>

                {(() => {
                  const reqs = requirements.filter((r) => r.level === selectedLevel);
                  if (reqs.length === 0) {
                    return (
                      <Card className="p-12 text-center text-xs text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none">
                        Belum ada persyaratan kurikulum khusus untuk jenjang {selectedLevel}. Silakan buat indikator baru!
                      </Card>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reqs.map((req) => (
                        <Card
                          key={req.id}
                          className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[10px] font-medium">
                                {req.category}
                              </Badge>
                              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 font-mono">
                                Target: {req.minSubmissions} Laporan
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                              {req.title}
                            </h4>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                              {req.description}
                            </p>
                          </div>

                          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                            <Button
                              onClick={() => handleOpenEditReq(req)}
                              size="sm"
                              variant="outline"
                              className="border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium px-3 h-8 rounded-lg cursor-pointer"
                            >
                              Edit Indikator
                            </Button>
                            <Button
                              onClick={() => handleDeleteRequirement(req.id)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                              title="Hapus Indikator"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
         MODALS AND DIALOGS (VERIFIKASI STYLE)
         ======================================================== */}

      {/* DIALOG 1: ADD CADRE */}
      <Dialog open={isAddCadreOpen} onOpenChange={setIsAddCadreOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-lg w-full p-0 overflow-hidden">
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Daftarkan Progres Kader Baru
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Masukkan informasi kader yang baru saja lulus jenjang formal dan memulai masa tindak lanjut (RKTL).
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Nama Lengkap Kader <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="cth. Sahabat Ahmad Fudholi"
                value={cadreFormName}
                onChange={(e) => setCadreFormName(e.target.value)}
                className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Tingkat Follow Up <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={cadreFormLevel}
                  onValueChange={(val: "MAPABA" | "PKD" | "PKL" | null) => {
                    if (val) setCadreFormLevel(val);
                  }}
                >
                  <SelectTrigger className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-medium">
                    <SelectValue placeholder="Pilih Tingkat" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectItem value="MAPABA" className="text-xs">MAPABA</SelectItem>
                    <SelectItem value="PKD" className="text-xs">PKD</SelectItem>
                    <SelectItem value="PKL" className="text-xs">PKL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Tanggal Mulai
                </label>
                <Input
                  type="date"
                  value={cadreFormDate}
                  onChange={(e) => setCadreFormDate(e.target.value)}
                  className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Komisariat / Rayon <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="cth. PK PMII Ki Ageng Getas Pendawa"
                value={cadreFormComm}
                onChange={(e) => setCadreFormComm(e.target.value)}
                className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddCadreOpen(false)}
              className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleAddCadre}
              disabled={!cadreFormName.trim() || !cadreFormComm.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-9 px-4 rounded-lg cursor-pointer"
            >
              Simpan Kader
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: EDIT CADRE */}
      <Dialog open={isEditCadreOpen} onOpenChange={setIsEditCadreOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-lg w-full p-0 overflow-hidden">
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Pencil className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Ubah Data Progres Kader
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Perbarui status kelulusan atau data komisariat dari kader bersangkutan.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Nama Lengkap Kader <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="cth. Sahabat Ahmad Fudholi"
                value={cadreFormName}
                onChange={(e) => setCadreFormName(e.target.value)}
                className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Status Administrasi
                </label>
                <Select
                  value={cadreFormStatus}
                  onValueChange={(val: "AKTIF" | "SELESAI" | "REVISI" | null) => {
                    if (val) setCadreFormStatus(val);
                  }}
                >
                  <SelectTrigger className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-medium">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectItem value="AKTIF" className="text-xs">Aktif / Proses</SelectItem>
                    <SelectItem value="SELESAI" className="text-xs">Lulus RKTL</SelectItem>
                    <SelectItem value="REVISI" className="text-xs">Perlu Revisi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Tingkat Follow Up
                </label>
                <Select
                  value={cadreFormLevel}
                  onValueChange={(val: "MAPABA" | "PKD" | "PKL" | null) => {
                    if (val) setCadreFormLevel(val);
                  }}
                >
                  <SelectTrigger className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-medium">
                    <SelectValue placeholder="Pilih Tingkat" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectItem value="MAPABA" className="text-xs">MAPABA</SelectItem>
                    <SelectItem value="PKD" className="text-xs">PKD</SelectItem>
                    <SelectItem value="PKL" className="text-xs">PKL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Komisariat
              </label>
              <Input
                placeholder="cth. PK PMII Ki Ageng Getas Pendawa"
                value={cadreFormComm}
                onChange={(e) => setCadreFormComm(e.target.value)}
                className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Tanggal Mulai Tindak Lanjut
              </label>
              <Input
                type="date"
                value={cadreFormDate}
                onChange={(e) => setCadreFormDate(e.target.value)}
                className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditCadreOpen(false)}
              className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleEditCadre}
              disabled={!cadreFormName.trim() || !cadreFormComm.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-9 px-4 rounded-lg cursor-pointer"
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: ADD REQUIREMENT */}
      <Dialog open={isAddReqOpen} onOpenChange={setIsAddReqOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-lg w-full p-0 overflow-hidden">
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Tambah Indikator Kurikulum
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Buat persyaratan tindak lanjut baru yang harus dipenuhi oleh para kader.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Judul Persyaratan <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="cth. Resume Buku Ideologi Negara"
                value={reqFormTitle}
                onChange={(e) => setReqFormTitle(e.target.value)}
                className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Kategori Kegiatan
                </label>
                <Select
                  value={reqFormCategory}
                  onValueChange={(val: FollowUpRequirement["category"] | null) => {
                    if (val) setReqFormCategory(val);
                  }}
                >
                  <SelectTrigger className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-medium">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectItem value="Makalah" className="text-xs">Makalah</SelectItem>
                    <SelectItem value="Membaca Buku" className="text-xs">Membaca Buku</SelectItem>
                    <SelectItem value="Diskusi Forum" className="text-xs">Diskusi Forum</SelectItem>
                    <SelectItem value="Bakti Sosial" className="text-xs">Bakti Sosial</SelectItem>
                    <SelectItem value="Keorganisasian" className="text-xs">Keorganisasian</SelectItem>
                    <SelectItem value="Lainnya" className="text-xs">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Min. Pengumpulan
                </label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={reqFormMinSub}
                  onChange={(e) => setReqFormMinSub(Number(e.target.value) || 1)}
                  className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Jenjang Pelatihan Formal
              </label>
              <Select
                value={reqFormLevel}
                onValueChange={(val: "MAPABA" | "PKD" | "PKL" | null) => {
                  if (val) setReqFormLevel(val);
                }}
              >
                <SelectTrigger className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-medium">
                  <SelectValue placeholder="Pilih Jenjang" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <SelectItem value="MAPABA" className="text-xs">MAPABA</SelectItem>
                  <SelectItem value="PKD" className="text-xs">PKD</SelectItem>
                  <SelectItem value="PKL" className="text-xs">PKL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Deskripsi & Panduan Tugas <span className="text-rose-500">*</span>
              </label>
              <textarea
                placeholder="Rincikan petunjuk penulisan, daftar buku, atau format laporan..."
                value={reqFormDescription}
                onChange={(e) => setReqFormDescription(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[90px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 font-medium resize-y"
              />
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddReqOpen(false)}
              className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleAddRequirement}
              disabled={!reqFormTitle.trim() || !reqFormDescription.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-9 px-4 rounded-lg cursor-pointer"
            >
              Simpan Indikator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: EDIT REQUIREMENT */}
      <Dialog open={isEditReqOpen} onOpenChange={setIsEditReqOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-lg w-full p-0 overflow-hidden">
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Pencil className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Ubah Indikator Kurikulum
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Perbarui sasaran jumlah pengumpulan atau materi pendukung pada indikator kelulusan.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Judul Persyaratan <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="cth. Resume Buku Ideologi Negara"
                value={reqFormTitle}
                onChange={(e) => setReqFormTitle(e.target.value)}
                className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Kategori Kegiatan
                </label>
                <Select
                  value={reqFormCategory}
                  onValueChange={(val: FollowUpRequirement["category"] | null) => {
                    if (val) setReqFormCategory(val);
                  }}
                >
                  <SelectTrigger className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-medium">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectItem value="Makalah" className="text-xs">Makalah</SelectItem>
                    <SelectItem value="Membaca Buku" className="text-xs">Membaca Buku</SelectItem>
                    <SelectItem value="Diskusi Forum" className="text-xs">Diskusi Forum</SelectItem>
                    <SelectItem value="Bakti Sosial" className="text-xs">Bakti Sosial</SelectItem>
                    <SelectItem value="Keorganisasian" className="text-xs">Keorganisasian</SelectItem>
                    <SelectItem value="Lainnya" className="text-xs">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Min. Pengumpulan
                </label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={reqFormMinSub}
                  onChange={(e) => setReqFormMinSub(Number(e.target.value) || 1)}
                  className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Jenjang Pelatihan Formal
              </label>
              <Select
                value={reqFormLevel}
                onValueChange={(val: "MAPABA" | "PKD" | "PKL" | null) => {
                  if (val) setReqFormLevel(val);
                }}
              >
                <SelectTrigger className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-medium">
                  <SelectValue placeholder="Pilih Jenjang" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <SelectItem value="MAPABA" className="text-xs">MAPABA</SelectItem>
                  <SelectItem value="PKD" className="text-xs">PKD</SelectItem>
                  <SelectItem value="PKL" className="text-xs">PKL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Deskripsi & Panduan Tugas <span className="text-rose-500">*</span>
              </label>
              <textarea
                placeholder="Rincikan petunjuk penulisan, daftar buku, atau format laporan..."
                value={reqFormDescription}
                onChange={(e) => setReqFormDescription(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[90px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 font-medium resize-y"
              />
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditReqOpen(false)}
              className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleEditRequirement}
              disabled={!reqFormTitle.trim() || !reqFormDescription.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-9 px-4 rounded-lg cursor-pointer"
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 5: SUBMIT / EDIT PROGRESS REPORT */}
      <Dialog
        open={isSubmitOpen}
        onOpenChange={(open) => {
          setIsSubmitOpen(open);
          if (!open) setEditingSubmissionId(null);
        }}
      >
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-lg w-full p-0 overflow-hidden">
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {editingSubmissionId ? "Edit Laporan Tindak Lanjut" : "Kirim Laporan Tindak Lanjut"}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Kirimkan hasil kerja, naskah makalah, atau resume membaca Anda ke database evaluasi.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Judul Laporan / Progres <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="cth. Resume Buku Teologi Pembebasan - Asghar Ali"
                value={submitFormTitle}
                onChange={(e) => setSubmitFormTitle(e.target.value)}
                className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Tautan Berkas Pendukung (Google Drive / Dokumen Cloud)
              </label>
              <Input
                placeholder="cth. https://drive.google.com/file/..."
                value={submitFormLink}
                onChange={(e) => setSubmitFormLink(e.target.value)}
                className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Catatan & Rincian Progres <span className="text-rose-500">*</span>
              </label>
              <textarea
                placeholder="Deskripsikan secara ringkas substansi kiriman Anda..."
                value={submitFormDesc}
                onChange={(e) => setSubmitFormDesc(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[90px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 font-medium resize-y"
              />
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsSubmitOpen(false);
                setEditingSubmissionId(null);
              }}
              className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitProgress}
              disabled={!submitFormTitle.trim() || !submitFormDesc.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-9 px-4 rounded-lg cursor-pointer"
            >
              {editingSubmissionId ? "Simpan Perubahan" : "Kirim Laporan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 6: REVIEW DIALOG (VERIFIKASI STYLE - TWO BUTTON TOGGLE) */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-lg w-full p-0 overflow-hidden">
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Tinjau Laporan RKTL
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Validasi laporan {reviewingCadre?.name || ""} ({reviewingCadre?.level || ""})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {reviewingSubmission && (
            <form onSubmit={handleReviewSubmission}>
              <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                {/* Submission Details Card */}
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {reviewingSubmission.title}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {reviewingSubmission.date}
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    {reviewingSubmission.description}
                  </p>
                  {reviewingSubmission.fileLink && reviewingSubmission.fileLink.startsWith("http") && (
                    <div className="pt-1.5">
                      <a
                        href={reviewingSubmission.fileLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Buka Tautan Berkas / Dokumen</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Decision Toggle (Approved vs Minta Revisi) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Keputusan Peninjauan <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewStatus("APPROVED")}
                      className={`p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                        reviewStatus === "APPROVED"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-xs"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>Setujui (Approved)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewStatus("REJECTED")}
                      className={`p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                        reviewStatus === "REJECTED"
                          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-400 shadow-xs"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <X className="w-4 h-4" />
                      <span>Minta Revisi</span>
                    </button>
                  </div>
                </div>

                {/* Feedback Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Catatan Evaluasi / Umpan Balik (Feedback)
                  </label>
                  <textarea
                    rows={3}
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder="Tuliskan apresiasi, masukan, atau hal yang perlu diperbaiki oleh kader..."
                    className="w-full text-xs p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[90px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 font-medium resize-y"
                  />
                  <p className="text-[10px] text-zinc-400">
                    Catatan ini akan dapat dilihat langsung oleh kader pada riwayat laporan mereka.
                  </p>
                </div>
              </div>

              <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReviewOpen(false)}
                  className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingReview}
                  className={`h-9 text-xs font-medium rounded-lg text-white cursor-pointer ${
                    reviewStatus === "APPROVED"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isSubmittingReview
                    ? "Menyimpan..."
                    : reviewStatus === "APPROVED"
                    ? "Simpan & Setujui"
                    : "Simpan & Minta Revisi"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
