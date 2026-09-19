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
  Sparkles,
  FolderOpen,
  MessageSquare,
  CheckCircle2
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
  DialogFooter,
  DialogClose
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

// Define TypeScript interfaces
interface FollowUpRequirement {
  id: string;
  title: string;
  category: "Makalah" | "Membaca Buku" | "Diskusi Forum" | "Bakti Sosial" | "Keorganisasian" | "Lainnya";
  level: "MAPABA" | "PKD" | "PKL";
  description: string;
  minSubmissions: number; // Target quantity (e.g. read 3 books, attend 4 discussions)
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
}

// PMII Follow-up Requirements and Cadres are now fetched dynamically from the shared database.

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

  // 4. Feedback Review Dialog
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState("");
  const [reviewingCadreId, setReviewingCadreId] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");

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

  // Helper function to calculate a cadre's follow up progress mathematically
  const calculateCadreProgress = (cadre: CadreFollowUp, reqsList: FollowUpRequirement[]): number => {
    const levelReqs = reqsList.filter(r => r.level === cadre.level);
    if (levelReqs.length === 0) return 0;

    let totalPercentage = 0;
    levelReqs.forEach(req => {
      const approvedSubmissionsCount = cadre.submissions.filter(
        sub => sub.requirementId === req.id && sub.status === "APPROVED"
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
      // Find a cadre matching current tier filter or pick the first
      const levelMatches = cadres.filter(c => c.level === selectedLevel);
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
      const levelMatches = cadres.filter(c => c.level === level);
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

    const updated = cadres.map(c => {
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
  };

  const handleDeleteCadre = async (id: string) => {
    if (confirm("Apakah anda yakin ingin menghapus data progres kader ini secara permanen?")) {
      const updated = cadres.filter(c => c.id !== id);
      await saveCadreData(updated);
      if (selectedCadreId === id && updated.length > 0) {
        setSelectedCadreId(updated[0].id);
      }
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

    const updated = requirements.map(r => {
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
  };

  const handleDeleteRequirement = async (id: string) => {
    if (confirm("Hapus persyaratan ini? Kader yang sudah melapor pada poin ini akan kehilangan progresnya.")) {
      const updated = requirements.filter(r => r.id !== id);
      await saveReqData(updated);
    }
  };

  // --- SUBMISSIONS SUBMIT & REVIEW ---
  const handleOpenSubmitProgress = (reqId: string) => {
    setSubmitReqId(reqId);
    setSubmitFormTitle("");
    setSubmitFormDesc("");
    setSubmitFormLink("");
    setIsSubmitOpen(true);
  };

  const handleSubmitProgress = async () => {
    if (!selectedCadreId || !submitFormTitle.trim() || !submitFormDesc.trim()) return;

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

    const updated = cadres.map(c => {
      if (c.id === selectedCadreId) {
        return {
          ...c,
          submissions: [newSubmission, ...c.submissions]
        };
      }
      return c;
    });

    await saveCadreData(updated);
    setIsSubmitOpen(false);
  };

  const handleOpenReview = (cadreId: string, submissionId: string) => {
    const cadre = cadres.find(c => c.id === cadreId);
    const sub = cadre?.submissions.find(s => s.id === submissionId);
    if (!sub) return;

    setReviewingCadreId(cadreId);
    setReviewingSubmissionId(submissionId);
    setReviewFeedback(sub.feedback || "");
    setReviewStatus(sub.status === "APPROVED" ? "APPROVED" : "APPROVED");
    setIsReviewOpen(true);
  };

  const handleReviewSubmission = async () => {
    const updated = cadres.map(c => {
      if (c.id === reviewingCadreId) {
        const updatedSubs = c.submissions.map(s => {
          if (s.id === reviewingSubmissionId) {
            return {
              ...s,
              status: reviewStatus,
              feedback: reviewFeedback.trim()
            };
          }
          return s;
        });

        // Determine automatically if all requirements met, we could update status
        const calculatedProgress = calculateCadreProgress({ ...c, submissions: updatedSubs }, requirements);
        const overallStatus = calculatedProgress >= 100 ? "SELESAI" as const : (reviewStatus === "REJECTED" ? "REVISI" as const : c.status);

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
  };

  const handleQuickApprove = async (cadreId: string, submissionId: string) => {
    const updated = cadres.map(c => {
      if (c.id === cadreId) {
        const updatedSubs = c.submissions.map(s => {
          if (s.id === submissionId) {
            return {
              ...s,
              status: "APPROVED" as const,
              feedback: "Disetujui secara cepat oleh Pengurus."
            };
          }
          return s;
        });

        const calculatedProgress = calculateCadreProgress({ ...c, submissions: updatedSubs }, requirements);
        const overallStatus = calculatedProgress >= 100 ? "SELESAI" as const : c.status;

        return {
          ...c,
          status: overallStatus,
          submissions: updatedSubs
        };
      }
      return c;
    });
    await saveCadreData(updated);
  };

  const handleDeleteSubmission = async (cadreId: string, subId: string) => {
    if (confirm("Apakah anda yakin ingin menarik laporan progres ini?")) {
      const updated = cadres.map(c => {
        if (c.id === cadreId) {
          return {
            ...c,
            submissions: c.submissions.filter(s => s.id !== subId)
          };
        }
        return c;
      });
      await saveCadreData(updated);
    }
  };

  // --- STATS COMPUTATIONS ---
  const levelCadres = cadres.filter(c => c.level === selectedLevel);
  const totalLevelCadres = levelCadres.length;
  const activeLevelCadres = levelCadres.filter(c => c.status === "AKTIF" || c.status === "REVISI").length;
  const completedLevelCadres = levelCadres.filter(c => c.status === "SELESAI").length;

  // Gathering all pending reviews across all tiers (or chosen tier)
  const pendingSubmissionsQueue = cadres.flatMap(c =>
    c.submissions
      .filter(s => s.status === "PENDING")
      .map(s => ({
        cadreId: c.id,
        cadreName: c.name,
        cadreLevel: c.level,
        commissariat: c.commissariat,
        rayon: c.rayon,
        submission: s
      }))
  );

  // Active user selection inside Member Mode
  const activeCadre = cadres.find(c => c.id === selectedCadreId);
  const activeCadreReqs = activeCadre ? requirements.filter(r => r.level === activeCadre.level) : [];
  const activeCadreProgress = activeCadre ? calculateCadreProgress(activeCadre, requirements) : 0;

  if (!mounted) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-pmii-gold border-t-transparent animate-spin" />
        <span className="text-xs font-bold text-zinc-400">Menyiapkan Dashboard Follow Up...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-12">
      {/* 1. HEADER BANNER */}
      <div className="relative overflow-hidden rounded-lg bg-blue-600 dark:bg-blue-700 p-6 md:p-7 text-white border border-blue-500/80 shadow-none">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <Badge className="bg-white/15 border border-white/20 text-[10px] font-extrabold uppercase tracking-wider text-white hover:bg-white/20">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> RKTL (Rencana Kerja Tindak Lanjut)
            </Badge>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Sistem Pemantauan & Sertifikasi Follow Up
            </h1>
            <p className="text-xs md:text-sm text-blue-100 leading-relaxed">
              Pantau progres wajib pasca-pelatihan formal MAPABA, PKD, dan PKL secara terintegrasi. Instruktur dapat menetapkan indikator capaian, meninjau kiriman naskah kader, dan merilis sertifikat kelulusan pergerakan.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 flex-shrink-0">
            <div className="p-3 bg-white/10 border border-white/20 rounded-lg flex flex-col">
              <span className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Total Kader</span>
              <span className="text-xl font-bold text-white">{cadres.length}</span>
            </div>
            <div className="p-3 bg-white/10 border border-white/20 rounded-lg flex flex-col">
              <span className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Butuh Review</span>
              <span className={`text-xl font-bold ${pendingSubmissionsQueue.length > 0 ? "text-amber-300" : "text-white"}`}>
                {pendingSubmissionsQueue.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTROL BAR (Symmetric Tabs and Role Switcher) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none">
        {/* Tier Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg w-full md:w-auto">
          {(["MAPABA", "PKD", "PKL"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => handleLevelChange(lvl)}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all duration-200 cursor-pointer ${
                selectedLevel === lvl
                  ? "bg-white dark:bg-zinc-900 text-pmii-blue dark:text-pmii-gold shadow-sm border border-zinc-200 dark:border-zinc-800/60"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Jenjang {lvl}
            </button>
          ))}
        </div>

        {/* Role Toggle & Search */}
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          {roleMode === "MENTOR" && mentorActiveTab === "CADRES" && (
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari kader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold focus:outline-none placeholder-zinc-400 dark:text-white"
              />
            </div>
          )}

          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/60 rounded-xl">
            <button
              onClick={() => handleRoleChange("MENTOR")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                roleMode === "MENTOR"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-pmii-gold shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Mentor Mode
            </button>
            <button
              onClick={() => handleRoleChange("MEMBER")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                roleMode === "MEMBER"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-pmii-gold shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Kader Mode
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Sidebar Column: Cadre Profile and overall progression */}
            <div className="space-y-6">
              <Card className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg relative overflow-hidden shadow-none">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">
                      PILIH PROFIL KADER SIMULASI
                    </label>
                    <Select
                      value={selectedCadreId}
                      onValueChange={(val) => { if (val) setSelectedCadreId(val); }}
                    >
                      <SelectTrigger className="w-full text-xs font-bold bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <SelectValue placeholder="Pilih Profil Kader" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#080d16] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                        {cadres.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.level})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {activeCadre ? (
                    <div className="space-y-5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      {/* Member Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-pmii-blue dark:text-pmii-gold flex items-center justify-center font-bold text-lg border border-blue-500/20">
                          {activeCadre.name.charAt(0) || "S"}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-zinc-800 dark:text-white leading-tight">
                            {activeCadre.name}
                          </h3>
                          <p className="text-[10px] text-zinc-400 font-bold">
                            {activeCadre.commissariat}
                          </p>
                        </div>
                      </div>

                      {/* Training Tier Badge */}
                      <div className="flex items-center justify-between text-xs py-1 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="font-semibold text-zinc-400">Jenjang Formal:</span>
                        <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 font-black border-none rounded-md px-2 py-0.5">
                          {activeCadre.level}
                        </Badge>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center justify-between text-xs py-1 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="font-semibold text-zinc-400">Status Tindak Lanjut:</span>
                        <Badge className={`font-black border-none rounded-md px-2 py-0.5 ${
                          activeCadre.status === "SELESAI"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : activeCadre.status === "REVISI"
                            ? "bg-rose-500/15 text-rose-600"
                            : "bg-amber-500/15 text-amber-600"
                        }`}>
                          {activeCadre.status === "SELESAI" ? "LULUS / CERTIFIED" : activeCadre.status === "REVISI" ? "PERLU REVISI" : "PROSES / AKTIF"}
                        </Badge>
                      </div>

                      {/* Date Started */}
                      <div className="flex items-center justify-between text-xs py-1 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="font-semibold text-zinc-400">Tanggal Mulai:</span>
                        <span className="font-bold text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">
                          {activeCadre.startDate}
                        </span>
                      </div>

                      {/* Overall Progress Gauge */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wide">
                            Progres Kelulusan
                          </span>
                          <span className="text-sm font-black text-pmii-blue dark:text-pmii-gold">
                            {activeCadreProgress}%
                          </span>
                        </div>
                        <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden p-[2px] border border-zinc-200 dark:border-zinc-900">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-pmii-gold rounded-full transition-all duration-500"
                            style={{ width: `${activeCadreProgress}%` }}
                          />
                        </div>
                        {activeCadreProgress >= 100 && (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-[10px] font-bold flex gap-1.5 items-start mt-2">
                            <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span>
                              Selamat! Anda telah memenuhi seluruh indikator tindak lanjut kaderisasi {activeCadre.level}. Silakan minta Pengurus Cabang menerbitkan sertifikat kelulusan formal Anda!
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-zinc-400">
                      Silakan daftarkan kader terlebih dahulu di Mode Mentor.
                    </div>
                  )}
                </div>
              </Card>

              {/* Submissions History */}
              {activeCadre && (
                <Card className="p-5 bg-white/80 dark:bg-[#090d16]/80 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">
                      Riwayat Kiriman Anda
                    </h3>
                    <Badge className="bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 font-bold border-none text-[9px]">
                      {activeCadre.submissions.length} Laporan
                    </Badge>
                  </div>

                  {activeCadre.submissions.length === 0 ? (
                    <div className="text-center py-8 text-xs text-zinc-400 flex flex-col items-center gap-2">
                      <FolderOpen className="w-6 h-6 text-zinc-400" />
                      <span>Belum ada kiriman. Silakan ajukan progres pada panel kanan.</span>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {activeCadre.submissions.map(sub => {
                        const associatedReq = requirements.find(r => r.id === sub.requirementId);
                        return (
                          <div
                            key={sub.id}
                            className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-xl space-y-1.5 relative group"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 tracking-wide uppercase truncate block max-w-[130px]">
                                {associatedReq?.title || "Laporan Lain"}
                              </span>
                              <Badge className={`text-[8px] font-extrabold border-none px-1 rounded-sm uppercase ${
                                sub.status === "APPROVED"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : sub.status === "REJECTED"
                                  ? "bg-rose-500/10 text-rose-600"
                                  : "bg-amber-500/10 text-amber-600"
                              }`}>
                                {sub.status}
                              </Badge>
                            </div>
                            <h4 className="text-xs font-extrabold leading-tight text-zinc-700 dark:text-zinc-200">
                              {sub.title}
                            </h4>
                            <span className="text-[8px] font-bold text-zinc-400 block font-mono">
                              Tanggal: {sub.date}
                            </span>
                            {sub.feedback && (
                              <div className="mt-2 p-2 bg-amber-500/5 border-l-2 border-amber-500/30 text-[9px] text-zinc-600 dark:text-zinc-400 rounded-r-md">
                                <span className="font-bold text-amber-600 dark:text-amber-500">Komentar Mentor: </span>
                                &ldquo;{sub.feedback}&rdquo;
                              </div>
                            )}

                            {sub.status === "PENDING" && (
                              <button
                                onClick={() => handleDeleteSubmission(activeCadre.id, sub.id)}
                                className="absolute right-2 bottom-2 p-1 text-zinc-400 hover:text-rose-600 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                title="Batalkan laporan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Checklist items panel */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-zinc-800 dark:text-white tracking-wide">
                    Indikator Kewajiban Follow Up
                  </h2>
                  <p className="text-xs text-zinc-400 font-semibold">
                    Setiap indikator di bawah wajib dipenuhi untuk menyelesaikan program.
                  </p>
                </div>
              </div>

              {!activeCadre ? (
                <div className="p-12 text-center bg-white dark:bg-[#090d16]/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs font-semibold">
                  Silakan tambahkan data kader di Mode Mentor untuk menguji visualisasi checklist.
                </div>
              ) : activeCadreReqs.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-[#090d16]/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs font-semibold">
                  Belum ada persyaratan kurikulum yang ditetapkan untuk jenjang {activeCadre.level}.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {activeCadreReqs.map(req => {
                    const approvedCount = activeCadre.submissions.filter(
                      s => s.requirementId === req.id && s.status === "APPROVED"
                    ).length;
                    const pendingCount = activeCadre.submissions.filter(
                      s => s.requirementId === req.id && s.status === "PENDING"
                    ).length;
                    const completionRatio = Math.min(req.minSubmissions, approvedCount);
                    const isCompleted = approvedCount >= req.minSubmissions;

                    return (
                      <Card
                        key={req.id}
                        className={`p-5 bg-white dark:bg-[#090d16]/80 border transition-all relative overflow-hidden group ${
                          isCompleted
                            ? "border-emerald-500/30 dark:border-emerald-500/20 shadow-xs ring-1 ring-emerald-500/5 bg-gradient-to-br from-white to-emerald-500/2 dark:to-emerald-500/1"
                            : "border-zinc-200 dark:border-zinc-800/80"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-none font-bold text-[9px] uppercase tracking-wide">
                                {req.category}
                              </Badge>
                              <Badge className={`text-[9px] border-none font-black ${
                                isCompleted
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : approvedCount > 0
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-zinc-100 dark:bg-zinc-950 text-zinc-400"
                              }`}>
                                {isCompleted ? "Selesai" : approvedCount > 0 ? "Dicicil" : "Belum Mulai"}
                              </Badge>
                            </div>

                            <h3 className="text-sm font-black text-zinc-800 dark:text-white leading-tight">
                              {req.title}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                              {req.description}
                            </p>

                            {/* Approved submissions list on this specific task */}
                            {activeCadre.submissions.filter(s => s.requirementId === req.id).length > 0 && (
                              <div className="pt-2.5 mt-2.5 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                                <span className="text-[9px] font-black text-zinc-400 block uppercase tracking-wide">
                                  KIRIMAN DOKUMEN ANDA PADA INDIKATOR INI:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {activeCadre.submissions
                                    .filter(s => s.requirementId === req.id)
                                    .map(s => (
                                      <div
                                        key={s.id}
                                        className="p-2.5 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-xs group/item"
                                      >
                                        <div className="flex-1 min-w-0 pr-2">
                                          <div className="font-bold text-zinc-700 dark:text-zinc-200 truncate leading-none mb-1">
                                            {s.title}
                                          </div>
                                          <div className="text-[9px] font-bold text-zinc-400 font-mono leading-none">
                                            {s.date}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          {s.fileLink.startsWith("http") ? (
                                            <a
                                              href={s.fileLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-1 text-zinc-400 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md"
                                              title="Lihat Tautan"
                                            >
                                              <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                          ) : null}
                                          <span className={`text-[9px] font-extrabold px-1 py-0.5 rounded-sm ${
                                            s.status === "APPROVED"
                                              ? "bg-emerald-500/10 text-emerald-600"
                                              : s.status === "REJECTED"
                                              ? "bg-rose-500/10 text-rose-600"
                                              : "bg-amber-500/10 text-amber-600"
                                          }`}>
                                            {s.status === "APPROVED" ? "√" : s.status === "REJECTED" ? "X" : "⏳"}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 flex-shrink-0">
                            {/* Visual Progress Fraction */}
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">
                                Target Capaian
                              </span>
                              <div className="text-xl font-black text-zinc-800 dark:text-zinc-200 font-mono">
                                {completionRatio} <span className="text-xs text-zinc-400 font-semibold">/ {req.minSubmissions}</span>
                              </div>
                              {pendingCount > 0 && (
                                <span className="text-[8px] font-bold text-amber-600 dark:text-amber-500 mt-1">
                                  (+{pendingCount} Menunggu Review)
                                </span>
                              )}
                            </div>

                            {/* Submit action */}
                            {!isCompleted && (
                              <Button
                                onClick={() => handleOpenSubmitProgress(req.id)}
                                size="sm"
                                className="bg-pmii-blue hover:bg-blue-700 text-white dark:bg-pmii-gold dark:hover:bg-amber-500 dark:text-[#090d16] font-black text-xs px-3.5 py-1.5 rounded-xl border-none shadow-md shadow-pmii-blue/10 dark:shadow-pmii-gold/10 hover:shadow-lg transition-all duration-200 cursor-pointer flex-shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" /> Kirim Progres
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Inner Tabs Navigation */}
            <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800/80">
              <button
                onClick={() => setMentorActiveTab("QUEUE")}
                className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer relative ${
                  mentorActiveTab === "QUEUE"
                    ? "border-pmii-blue dark:border-pmii-gold text-pmii-blue dark:text-pmii-gold"
                    : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                }`}
              >
                Antrean Persetujuan
                {pendingSubmissionsQueue.length > 0 && (
                  <span className="ml-1.5 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {pendingSubmissionsQueue.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMentorActiveTab("CADRES")}
                className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer ${
                  mentorActiveTab === "CADRES"
                    ? "border-pmii-blue dark:border-pmii-gold text-pmii-blue dark:text-pmii-gold"
                    : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                }`}
              >
                Tabel Progres Kader
              </button>
              <button
                onClick={() => setMentorActiveTab("REQUIREMENTS")}
                className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer ${
                  mentorActiveTab === "REQUIREMENTS"
                    ? "border-pmii-blue dark:border-pmii-gold text-pmii-blue dark:text-pmii-gold"
                    : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                }`}
              >
                Persyaratan Kurikulum
              </button>
            </div>

            {/* Content for Queue Tab */}
            {mentorActiveTab === "QUEUE" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-zinc-800 dark:text-white tracking-wide">
                      Verifikasi Pengumpulan Laporan
                    </h3>
                    <p className="text-xs text-zinc-400 font-semibold">
                      Tinjau hasil kerja tindak lanjut kader, baca dokumen, dan berikan feedback kelulusan.
                    </p>
                  </div>
                </div>

                {pendingSubmissionsQueue.length === 0 ? (
                  <Card className="p-12 text-center bg-white dark:bg-[#090d16]/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <h4 className="text-xs font-black text-zinc-800 dark:text-white">Antrean Bersih!</h4>
                    <p className="text-[10px] text-zinc-400 font-medium">
                      Semua laporan progres tindak lanjut dari seluruh kader telah selesai diverifikasi.
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingSubmissionsQueue.map(item => {
                      const req = requirements.find(r => r.id === item.submission.requirementId);
                      return (
                        <Card
                          key={item.submission.id}
                          className="p-5 bg-white dark:bg-[#090d16]/80 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl space-y-4 relative flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-black text-zinc-800 dark:text-white leading-tight">
                                  {item.cadreName}
                                </h4>
                                <div className="text-[10px] font-semibold text-zinc-400 mt-0.5">
                                  Jenjang {item.cadreLevel}
                                </div>
                              </div>
                              <Badge className="bg-amber-500/10 text-amber-600 border-none font-bold text-[9px] uppercase tracking-wider">
                                {req?.category || "Laporan"}
                              </Badge>
                            </div>

                            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-900 space-y-1.5">
                              <span className="text-[9px] font-black text-zinc-400 block uppercase tracking-wide">
                                INDIKATOR: {req?.title || "Persyaratan Umum"}
                              </span>
                              <h5 className="text-xs font-black text-zinc-700 dark:text-zinc-200">
                                &ldquo;{item.submission.title}&rdquo;
                              </h5>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                                {item.submission.description}
                              </p>
                              {item.submission.fileLink.startsWith("http") ? (
                                <a
                                  href={item.submission.fileLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:underline font-bold mt-1.5"
                                >
                                  Buka Dokumen Penunjang <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-[9px] font-bold text-zinc-400 block mt-1.5 italic">
                                  Catatan: {item.submission.fileLink}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                            <span className="text-[9px] font-bold text-zinc-400 font-mono">
                              Masuk: {item.submission.date}
                            </span>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleOpenReview(item.cadreId, item.submission.id)}
                                size="sm"
                                variant="outline"
                                className="border border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 text-xs font-bold px-3 py-1.5 h-8 rounded-xl cursor-pointer"
                              >
                                Tinjau Detil
                              </Button>
                              <Button
                                onClick={() => handleQuickApprove(item.cadreId, item.submission.id)}
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3 py-1.5 h-8 rounded-xl border-none cursor-pointer"
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

            {/* Content for Cadre Directory Tab */}
            {mentorActiveTab === "CADRES" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-zinc-800 dark:text-white tracking-wide">
                      Direktori Progress Follow Up Kader
                    </h3>
                    <p className="text-xs text-zinc-400 font-semibold">
                      Kelola kader pasca-kaderisasi formal, tinjau progres lengkap, dan edit status administrasi.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Select
                      value={statusFilter}
                      onValueChange={(val) => { if (val) setStatusFilter(val); }}
                    >
                      <SelectTrigger className="w-[130px] text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold">
                        <SelectValue placeholder="Filter Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#080d16] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <SelectItem value="ALL">Semua Status</SelectItem>
                        <SelectItem value="AKTIF">Aktif / Proses</SelectItem>
                        <SelectItem value="SELESAI">Lulus RKTL</SelectItem>
                        <SelectItem value="REVISI">Butuh Revisi</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleOpenAddCadre}
                      className="bg-pmii-blue hover:bg-blue-700 text-white dark:bg-pmii-gold dark:hover:bg-amber-500 dark:text-[#090d16] font-black text-xs px-4 py-2 rounded-xl border-none shadow-xs cursor-pointer h-9"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Kader
                    </Button>
                  </div>
                </div>

                {/* Level Statistics Widget */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                  <Card className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl flex flex-col justify-center relative overflow-hidden group">
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Total Kader {selectedLevel}</span>
                    <span className="text-base font-black text-zinc-800 dark:text-zinc-100 mt-1">{totalLevelCadres} Orang</span>
                  </Card>
                  <Card className="p-4 bg-zinc-50 dark:bg-[#090d16]/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl flex flex-col justify-center relative overflow-hidden group">
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Kader Aktif / Proses</span>
                    <span className="text-base font-black text-amber-600 dark:text-amber-500 mt-1">{activeLevelCadres} Orang</span>
                  </Card>
                  <Card className="p-4 bg-zinc-50 dark:bg-[#090d16]/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl flex flex-col justify-center relative overflow-hidden group">
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Lulus Tindak Lanjut</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-500 mt-1">{completedLevelCadres} Orang</span>
                  </Card>
                </div>

                {/* Filter and search execution */}
                {(() => {
                  const filtered = cadres.filter(c => {
                    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.commissariat.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchStatus = statusFilter === "ALL" ? true : c.status === statusFilter;
                    return matchSearch && matchStatus;
                  });

                  if (filtered.length === 0) {
                    return (
                      <Card className="p-12 text-center text-xs text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                        Tidak ada kader yang sesuai dengan pencarian atau filter status.
                      </Card>
                    );
                  }

                  return (
                    <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 shadow-none">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-zinc-50 dark:bg-zinc-950/60">
                            <TableRow className="border-b border-zinc-200 dark:border-zinc-800/80">
                              <TableHead className="text-[10px] font-black uppercase tracking-wider text-zinc-400 py-3 pl-5">Nama Kader</TableHead>
                              <TableHead className="text-[10px] font-black uppercase tracking-wider text-zinc-400 py-3">Tingkat</TableHead>
                              <TableHead className="text-[10px] font-black uppercase tracking-wider text-zinc-400 py-3">Komisariat</TableHead>
                              <TableHead className="text-[10px] font-black uppercase tracking-wider text-zinc-400 py-3">Progres Capaian</TableHead>
                              <TableHead className="text-[10px] font-black uppercase tracking-wider text-zinc-400 py-3">Status</TableHead>
                              <TableHead className="text-[10px] font-black uppercase tracking-wider text-zinc-400 py-3 text-right pr-5">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filtered.map(c => {
                              const progress = calculateCadreProgress(c, requirements);
                              return (
                                <TableRow key={c.id} className="border-b border-zinc-200 dark:border-zinc-800/60 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20 transition-all">
                                  <TableCell className="py-4 pl-5">
                                    <div className="font-extrabold text-xs text-zinc-800 dark:text-zinc-200">{c.name}</div>
                                    <div className="text-[9px] font-semibold text-zinc-400 font-mono">Mulai: {c.startDate}</div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none font-bold text-[9px] px-1.5 py-0.5 rounded-sm">
                                      {c.level}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{c.commissariat}</div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="flex items-center gap-2 max-w-[150px]">
                                      <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-900">
                                        <div
                                          className="h-full bg-gradient-to-r from-blue-500 to-pmii-gold rounded-full"
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-300 font-mono w-8">
                                        {progress}%
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <Badge className={`text-[9px] font-extrabold border-none px-2 py-0.5 rounded-md ${
                                      c.status === "SELESAI"
                                        ? "bg-emerald-500/10 text-emerald-600"
                                        : c.status === "REVISI"
                                        ? "bg-rose-500/10 text-rose-600"
                                        : "bg-amber-500/10 text-amber-600"
                                    }`}>
                                      {c.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-4 text-right pr-5">
                                    <div className="flex justify-end gap-1.5">
                                      <Button
                                        onClick={() => {
                                          setSelectedCadreId(c.id);
                                          setRoleMode("MEMBER");
                                        }}
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 rounded-lg text-zinc-400 hover:text-blue-500 cursor-pointer"
                                        title="Simulasi Tampilan Kader"
                                      >
                                        <User className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        onClick={() => handleOpenEditCadre(c)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 rounded-lg text-zinc-400 hover:text-amber-500 cursor-pointer"
                                        title="Edit Kader"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        onClick={() => handleDeleteCadre(c.id)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 rounded-lg text-zinc-400 hover:text-rose-600 cursor-pointer"
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

            {/* Content for Curriculum Requirements Settings */}
            {mentorActiveTab === "REQUIREMENTS" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-zinc-800 dark:text-white tracking-wide">
                      Kelola Indikator Wajib Follow Up ({selectedLevel})
                    </h3>
                    <p className="text-xs text-zinc-400 font-semibold">
                      Tetapkan indikator kelulusan pasca-formal, sesuaikan dengan kurikulum resmi PMII.
                    </p>
                  </div>

                  <Button
                    onClick={handleOpenAddReq}
                    className="bg-pmii-blue hover:bg-blue-700 text-white dark:bg-pmii-gold dark:hover:bg-amber-500 dark:text-[#090d16] font-black text-xs px-4 py-2 rounded-xl border-none shadow-xs cursor-pointer h-9 self-end sm:self-center"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Indikator Baru
                  </Button>
                </div>

                {/* Requirements display for the currently selected level */}
                {(() => {
                  const reqs = requirements.filter(r => r.level === selectedLevel);
                  if (reqs.length === 0) {
                    return (
                      <Card className="p-12 text-center text-xs text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                        Belum ada persyaratan khusus untuk jenjang {selectedLevel}. Silakan buat indikator baru!
                      </Card>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reqs.map(req => (
                        <Card
                          key={req.id}
                          className="p-5 bg-white dark:bg-[#090d16]/80 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl relative flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <Badge className="bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-none font-bold text-[9px] uppercase tracking-wide">
                                {req.category}
                              </Badge>
                              <span className="text-[10px] font-black text-zinc-400 font-mono">
                                Target: {req.minSubmissions} Kiriman
                              </span>
                            </div>

                            <h4 className="text-xs font-black text-zinc-800 dark:text-white leading-tight">
                              {req.title}
                            </h4>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                              {req.description}
                            </p>
                          </div>

                          <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-900">
                            <Button
                              onClick={() => handleOpenEditReq(req)}
                              size="sm"
                              variant="outline"
                              className="border border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 text-xs font-bold px-3 py-1 h-8 rounded-xl cursor-pointer"
                            >
                              Edit Indikator
                            </Button>
                            <Button
                              onClick={() => handleDeleteRequirement(req.id)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-xl text-zinc-400 hover:text-rose-600 cursor-pointer"
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
         MODALS AND DIALOGS
         ======================================================== */}

      {/* DIALOG 1: ADD CADRE */}
      <Dialog open={isAddCadreOpen} onOpenChange={setIsAddCadreOpen}>
        <DialogContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-1">
              <Users className="w-4 h-4 text-pmii-gold" /> Daftarkan Progres Kader Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Masukkan informasi kader yang baru saja lulus jenjang formal dan memulai masa tindak lanjut (RKTL).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Nama Lengkap Kader</label>
              <Input
                placeholder="cth. Sahabat Ahmad Fudholi"
                value={cadreFormName}
                onChange={(e) => setCadreFormName(e.target.value)}
                className="text-xs rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold focus:outline-none dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Tingkat Follow Up</label>
                <Select
                  value={cadreFormLevel}
                  onValueChange={(val: "MAPABA" | "PKD" | "PKL" | null) => { if (val) setCadreFormLevel(val); }}
                >
                  <SelectTrigger className="text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl font-semibold bg-zinc-50 dark:bg-zinc-950">
                    <SelectValue placeholder="Pilih Tingkat" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#080d16] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <SelectItem value="MAPABA">MAPABA</SelectItem>
                    <SelectItem value="PKD">PKD</SelectItem>
                    <SelectItem value="PKL">PKL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Tanggal Mulai</label>
                <Input
                  type="date"
                  value={cadreFormDate}
                  onChange={(e) => setCadreFormDate(e.target.value)}
                  className="text-xs rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Komisariat</label>
              <Input
                placeholder="cth. PK PMII Ki Ageng Getas Pendawa"
                value={cadreFormComm}
                onChange={(e) => setCadreFormComm(e.target.value)}
                className="text-xs rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold dark:text-white"
              />
            </div>
          </div>

          <DialogFooter className="-mx-6 -mb-6 flex gap-2 justify-end border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-950/60 rounded-b-2xl">
            <DialogClose render={<Button variant="outline" className="text-xs font-bold rounded-xl cursor-pointer" />}>
              Batal
            </DialogClose>
            <Button
              onClick={handleAddCadre}
              disabled={!cadreFormName.trim() || !cadreFormComm.trim()}
              className="bg-pmii-blue hover:bg-blue-700 text-white dark:bg-pmii-gold dark:hover:bg-amber-500 dark:text-[#090d16] font-black text-xs px-4 py-2 h-9 rounded-xl border-none cursor-pointer"
            >
              Simpan Kader
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: EDIT CADRE */}
      <Dialog open={isEditCadreOpen} onOpenChange={setIsEditCadreOpen}>
        <DialogContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-1">
              <Pencil className="w-4 h-4 text-pmii-gold" /> Ubah Data Progres Kader
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Perbarui status kelulusan atau data fakultas/komisariat dari kader bersangkutan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Nama Lengkap Kader</label>
              <Input
                placeholder="cth. Sahabat Ahmad Fudholi"
                value={cadreFormName}
                onChange={(e) => setCadreFormName(e.target.value)}
                className="text-xs rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Status Administrasi</label>
                <Select
                  value={cadreFormStatus}
                  onValueChange={(val: "AKTIF" | "SELESAI" | "REVISI" | null) => { if (val) setCadreFormStatus(val); }}
                >
                  <SelectTrigger className="text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold bg-zinc-50 dark:bg-zinc-950">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#080d16] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <SelectItem value="AKTIF">Aktif / Proses</SelectItem>
                    <SelectItem value="SELESAI">Lulus RKTL</SelectItem>
                    <SelectItem value="REVISI">Perlu Revisi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Tingkat Follow Up</label>
                <Select
                  value={cadreFormLevel}
                  onValueChange={(val: "MAPABA" | "PKD" | "PKL" | null) => { if (val) setCadreFormLevel(val); }}
                >
                  <SelectTrigger className="text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl font-semibold bg-zinc-50 dark:bg-zinc-950">
                    <SelectValue placeholder="Pilih Tingkat" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#080d16] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <SelectItem value="MAPABA">MAPABA</SelectItem>
                    <SelectItem value="PKD">PKD</SelectItem>
                    <SelectItem value="PKL">PKL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Komisariat</label>
              <Input
                placeholder="cth. PK PMII Ki Ageng Getas Pendawa"
                value={cadreFormComm}
                onChange={(e) => setCadreFormComm(e.target.value)}
                className="text-xs rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Tanggal Mulai Tindak Lanjut</label>
              <Input
                type="date"
                value={cadreFormDate}
                onChange={(e) => setCadreFormDate(e.target.value)}
                className="text-xs rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold dark:text-white"
              />
            </div>
          </div>

          <DialogFooter className="-mx-6 -mb-6 flex gap-2 justify-end border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-950/60 rounded-b-2xl">
            <DialogClose render={<Button variant="outline" className="text-xs font-bold rounded-xl cursor-pointer" />}>
              Batal
            </DialogClose>
            <Button
              onClick={handleEditCadre}
              disabled={!cadreFormName.trim() || !cadreFormComm.trim()}
              className="bg-pmii-blue hover:bg-blue-700 text-white dark:bg-pmii-gold dark:hover:bg-amber-500 dark:text-[#090d16] font-black text-xs px-4 py-2 h-9 rounded-xl border-none cursor-pointer"
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: ADD REQUIREMENT */}
      <Dialog open={isAddReqOpen} onOpenChange={setIsAddReqOpen}>
        <DialogContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-pmii-gold" /> Tambah Indikator Kurikulum
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Buat persyaratan tindak lanjut baru yang harus dipenuhi oleh para lulusan formal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Judul Persyaratan</label>
              <Input
                placeholder="cth. Resume Buku Ideologi Negara"
                value={reqFormTitle}
                onChange={(e) => setReqFormTitle(e.target.value)}
                className="text-xs rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Kategori Kegiatan</label>
                <Select
                  value={reqFormCategory}
                  onValueChange={(val: FollowUpRequirement["category"] | null) => { if (val) setReqFormCategory(val); }}
                >
                  <SelectTrigger className="text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold bg-zinc-50 dark:bg-zinc-950">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#080d16] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <SelectItem value="Makalah">Makalah</SelectItem>
                    <SelectItem value="Membaca Buku">Membaca Buku</SelectItem>
                    <SelectItem value="Diskusi Forum">Diskusi Forum</SelectItem>
                    <SelectItem value="Bakti Sosial">Bakti Sosial</SelectItem>
                    <SelectItem value="Keorganisasian">Keorganisasian</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Min. Pengumpulan</label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={reqFormMinSub}
                  onChange={(e) => setReqFormMinSub(Number(e.target.value) || 1)}
                  className="text-xs rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Jenjang Pelatihan Formal</label>
              <Select
                value={reqFormLevel}
                onValueChange={(val: "MAPABA" | "PKD" | "PKL" | null) => { if (val) setReqFormLevel(val); }}
              >
                <SelectTrigger className="text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold bg-zinc-50 dark:bg-zinc-950">
                  <SelectValue placeholder="Pilih Jenjang" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#080d16] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <SelectItem value="MAPABA">MAPABA</SelectItem>
                  <SelectItem value="PKD">PKD</SelectItem>
                  <SelectItem value="PKL">PKL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Deskripsi & Panduan Tugas</label>
              <textarea
                placeholder="Rincikan petunjuk penulisan, daftar buku, atau durasi diskusi wajib..."
                value={reqFormDescription}
                onChange={(e) => setReqFormDescription(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold focus:outline-none placeholder-zinc-400 dark:text-white"
              />
            </div>
          </div>

          <DialogFooter className="-mx-6 -mb-6 flex gap-2 justify-end border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-950/60 rounded-b-2xl">
            <DialogClose render={<Button variant="outline" className="text-xs font-bold rounded-xl cursor-pointer" />}>
              Batal
            </DialogClose>
            <Button
              onClick={handleAddRequirement}
              disabled={!reqFormTitle.trim() || !reqFormDescription.trim()}
              className="bg-pmii-blue hover:bg-blue-700 text-white dark:bg-pmii-gold dark:hover:bg-amber-500 dark:text-[#090d16] font-black text-xs px-4 py-2 h-9 rounded-xl border-none cursor-pointer"
            >
              Simpan Indikator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: EDIT REQUIREMENT */}
      <Dialog open={isEditReqOpen} onOpenChange={setIsEditReqOpen}>
        <DialogContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-1">
              <Pencil className="w-4 h-4 text-pmii-gold" /> Ubah Indikator Kurikulum
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Perbarui sasaran jumlah pengumpulan atau materi pendukung pada indikator kelulusan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Judul Persyaratan</label>
              <Input
                placeholder="cth. Resume Buku Ideologi Negara"
                value={reqFormTitle}
                onChange={(e) => setReqFormTitle(e.target.value)}
                className="text-xs rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Kategori Kegiatan</label>
                <Select
                  value={reqFormCategory}
                  onValueChange={(val: FollowUpRequirement["category"] | null) => { if (val) setReqFormCategory(val); }}
                >
                  <SelectTrigger className="text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold bg-zinc-50 dark:bg-zinc-950">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#080d16] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <SelectItem value="Makalah">Makalah</SelectItem>
                    <SelectItem value="Membaca Buku">Membaca Buku</SelectItem>
                    <SelectItem value="Diskusi Forum">Diskusi Forum</SelectItem>
                    <SelectItem value="Bakti Sosial">Bakti Sosial</SelectItem>
                    <SelectItem value="Keorganisasian">Keorganisasian</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Min. Pengumpulan</label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={reqFormMinSub}
                  onChange={(e) => setReqFormMinSub(Number(e.target.value) || 1)}
                  className="text-xs rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Jenjang Pelatihan Formal</label>
              <Select
                value={reqFormLevel}
                onValueChange={(val: "MAPABA" | "PKD" | "PKL" | null) => { if (val) setReqFormLevel(val); }}
              >
                <SelectTrigger className="text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold bg-zinc-50 dark:bg-zinc-950">
                  <SelectValue placeholder="Pilih Jenjang" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#080d16] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <SelectItem value="MAPABA">MAPABA</SelectItem>
                  <SelectItem value="PKD">PKD</SelectItem>
                  <SelectItem value="PKL">PKL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Deskripsi & Panduan Tugas</label>
              <textarea
                placeholder="Rincikan petunjuk penulisan, daftar buku, atau durasi diskusi wajib..."
                value={reqFormDescription}
                onChange={(e) => setReqFormDescription(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold focus:outline-none placeholder-zinc-400 dark:text-white"
              />
            </div>
          </div>

          <DialogFooter className="-mx-6 -mb-6 flex gap-2 justify-end border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-950/60 rounded-b-2xl">
            <DialogClose render={<Button variant="outline" className="text-xs font-bold rounded-xl cursor-pointer" />}>
              Batal
            </DialogClose>
            <Button
              onClick={handleEditRequirement}
              disabled={!reqFormTitle.trim() || !reqFormDescription.trim()}
              className="bg-pmii-blue hover:bg-blue-700 text-white dark:bg-pmii-gold dark:hover:bg-amber-500 dark:text-[#090d16] font-black text-xs px-4 py-2 h-9 rounded-xl border-none cursor-pointer"
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 5: SUBMIT PROGRESS REPORT */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-[#1e2a38] rounded-2xl max-w-sm sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-1">
              <ClipboardList className="w-4 h-4 text-pmii-gold" /> Kirim Kiriman Tindak Lanjut
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Kirimkan hasil kerja, naskah makalah, resume membaca, atau data forum Anda ke database pengurus.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Judul Kiriman / Progres</label>
              <Input
                placeholder="cth. Resume Buku Teologi Pembebasan - Asghar Ali"
                value={submitFormTitle}
                onChange={(e) => setSubmitFormTitle(e.target.value)}
                className="text-xs rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Tautan Pendukung (Google Drive / Link Jurnal)</label>
              <Input
                placeholder="cth. https://drive.google.com/file/..."
                value={submitFormLink}
                onChange={(e) => setSubmitFormLink(e.target.value)}
                className="text-xs rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Catatan Tambahan & Rincian</label>
              <textarea
                placeholder="Deskripsikan secara ringkas substansi kiriman Anda..."
                value={submitFormDesc}
                onChange={(e) => setSubmitFormDesc(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold focus:outline-none placeholder-zinc-400 dark:text-white"
              />
            </div>
          </div>

          <DialogFooter className="-mx-6 -mb-6 flex gap-2 justify-end border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-950/60 rounded-b-2xl">
            <DialogClose render={<Button variant="outline" className="text-xs font-bold rounded-xl cursor-pointer" />}>
              Batal
            </DialogClose>
            <Button
              onClick={handleSubmitProgress}
              disabled={!submitFormTitle.trim() || !submitFormDesc.trim()}
              className="bg-pmii-blue hover:bg-blue-700 text-white dark:bg-pmii-gold dark:hover:bg-amber-500 dark:text-[#090d16] font-black text-xs px-4 py-2 h-9 rounded-xl border-none cursor-pointer"
            >
              Kirim Laporan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 6: REVIEW AND FEEDBACK SUBMISSION */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-1">
              <MessageSquare className="w-4 h-4 text-pmii-gold" /> Verifikasi Laporan & Beri Umpan Balik
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Evaluasi kiriman tugas kader secara substantif. Tentukan status kelayakan kiriman tugas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Status Kelayakan</label>
              <Select
                value={reviewStatus}
                onValueChange={(val: "APPROVED" | "REJECTED" | null) => { if (val) setReviewStatus(val); }}
              >
                <SelectTrigger className="text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold bg-zinc-50 dark:bg-zinc-950">
                  <SelectValue placeholder="Pilih Kelayakan" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#080d16] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <SelectItem value="APPROVED">Setujui (Memenuhi Syarat)</SelectItem>
                  <SelectItem value="REJECTED">Tolak / Butuh Revisi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Komentar & Catatan Instruktur</label>
              <textarea
                placeholder="Berikan saran kritis membangun atau koreksi penulisan untuk sahabat kader..."
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                rows={4}
                className="w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-pmii-blue dark:focus:border-pmii-gold focus:outline-none placeholder-zinc-400 dark:text-white"
              />
            </div>
          </div>

          <DialogFooter className="-mx-6 -mb-6 flex gap-2 justify-end border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-950/60 rounded-b-2xl">
            <DialogClose render={<Button variant="outline" className="text-xs font-bold rounded-xl cursor-pointer" />}>
              Batal
            </DialogClose>
            <Button
              onClick={handleReviewSubmission}
              className="bg-pmii-blue hover:bg-blue-700 text-white dark:bg-pmii-gold dark:hover:bg-amber-500 dark:text-[#090d16] font-black text-xs px-4 py-2 h-9 rounded-xl border-none cursor-pointer"
            >
              Simpan Hasil Evaluasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
