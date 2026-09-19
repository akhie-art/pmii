"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db";
import type { UserAccount } from "@/lib/db";
import { isRecordInTenant } from "@/lib/tenancy";
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MessageSquare,
  ClipboardList,
  Check,
  X,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  User,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

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
  phone?: string;
  email?: string;
  address?: string;
  instagram?: string;
}

export default function KomisariatVerifikasiPage() {
  const [mounted, setMounted] = useState(false);
  const [cadres, setCadres] = useState<CadreFollowUp[]>([]);
  const [activeCampus, setActiveCampus] = useState("UIN Walisongo");
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");

  // Review Dialog states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState<CadreSubmission | null>(null);
  const [reviewingCadreId, setReviewingCadreId] = useState<string>("");
  const [reviewingCadreName, setReviewingCadreName] = useState<string>("");
  const [reviewingCadreLevel, setReviewingCadreLevel] = useState<string>("");
  const [reviewFeedback, setReviewFeedback] = useState<string>("");
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string>("");

  useEffect(() => {
    const storedCampus =
      typeof window !== "undefined"
        ? localStorage.getItem("PMII_ACTIVE_COMMISSARIAT") || "UIN Walisongo"
        : "UIN Walisongo";
    setActiveCampus(storedCampus);

    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Error parsing user session:", e);
        }
      }
    }

    db.getCadres().then((data) => {
      setCadres(data);
      setMounted(true);
    });
  }, []);

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

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/3" />
        <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
      </div>
    );
  }

  // Get active submissions list with strict tenant filtering
  const campusCadres = cadres.filter((c) =>
    isRecordInTenant(currentUser, {
      commissariat: c.commissariat,
      rayon: c.rayon
    })
  );

  const flatSubmissions = campusCadres.flatMap((c) =>
    c.submissions.map((s) => ({
      ...s,
      cadreId: c.id,
      cadreName: c.name,
      cadreLevel: c.level,
      cadreAvatar: c.avatar
    }))
  );

  // Statistics calculation
  const pendingCount = flatSubmissions.filter((s) => s.status === "PENDING").length;
  const approvedCount = flatSubmissions.filter((s) => s.status === "APPROVED").length;
  const rejectedCount = flatSubmissions.filter((s) => s.status === "REJECTED").length;

  // Filtered submissions
  const filteredSubmissions = flatSubmissions.filter((s) => {
    const matchesTab = s.status === activeTab;
    const matchesSearch =
      searchQuery.trim() === "" ||
      s.cadreName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === "ALL" || s.cadreLevel === selectedLevel;
    return matchesTab && matchesSearch && matchesLevel;
  });

  const handleOpenReview = (sub: typeof flatSubmissions[0]) => {
    setReviewingSubmission({
      id: sub.id,
      requirementId: sub.requirementId,
      title: sub.title,
      description: sub.description,
      fileLink: sub.fileLink,
      date: sub.date,
      status: sub.status,
      feedback: sub.feedback
    });
    setReviewingCadreId(sub.cadreId);
    setReviewingCadreName(sub.cadreName);
    setReviewingCadreLevel(sub.cadreLevel);
    setReviewStatus(sub.status === "REJECTED" ? "REJECTED" : "APPROVED");
    setReviewFeedback(sub.feedback || "");
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSubmission || !reviewingCadreId) return;

    setIsSubmittingReview(true);
    try {
      const updatedCadres = cadres.map((cadre) => {
        if (cadre.id === reviewingCadreId) {
          const updatedSubmissions = cadre.submissions.map((sub) => {
            if (sub.id === reviewingSubmission.id) {
              return {
                ...sub,
                status: reviewStatus,
                feedback: reviewFeedback.trim()
              };
            }
            return sub;
          });

          // Determine updated cadre status
          let newStatus = cadre.status;
          if (reviewStatus === "REJECTED") {
            newStatus = "REVISI";
          } else {
            // Check if all needed submissions are approved for their level
            const hasPending = updatedSubmissions.some((s) => s.status === "PENDING");
            const hasRejected = updatedSubmissions.some((s) => s.status === "REJECTED");
            const totalReq = cadre.level === "MAPABA" ? 3 : cadre.level === "PKD" ? 3 : 4;
            const currentApproved = updatedSubmissions.filter((s) => s.status === "APPROVED").length;

            if (!hasPending && !hasRejected && currentApproved >= totalReq) {
              newStatus = "SELESAI";
            } else {
              newStatus = "AKTIF";
            }
          }

          return {
            ...cadre,
            submissions: updatedSubmissions,
            status: newStatus
          };
        }
        return cadre;
      });

      setCadres(updatedCadres);
      await db.saveCadres(updatedCadres);
      setIsReviewModalOpen(false);
      setReviewingSubmission(null);
      setReviewingCadreId("");
      setReviewFeedback("");
      showToast(
        reviewStatus === "APPROVED"
          ? `Laporan "${reviewingSubmission.title}" berhasil disetujui!`
          : `Laporan "${reviewingSubmission.title}" dikembalikan untuk revisi.`
      );
    } catch (error) {
      console.error("Failed to save review:", error);
      showToast("Gagal menyimpan hasil verifikasi. Silakan coba lagi.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
                Verifikasi RKTL
              </h1>
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2">
                Follow-up Kader
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-xl leading-relaxed">
              Tinjau, validasi berkas, dan berikan catatan umpan balik atas laporan tindak lanjut kader {activeCampus}.
            </p>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-xs font-medium self-start sm:self-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>{pendingCount} laporan menunggu verifikasi</span>
          </div>
        )}
      </div>



      {/* 3. TABS SELECTOR */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-xs font-medium">
        {[
          {
            id: "PENDING" as const,
            label: "Antrean Verifikasi",
            icon: Clock,
            count: pendingCount,
            badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
          },
          {
            id: "APPROVED" as const,
            label: "Laporan Disetujui",
            icon: CheckCircle2,
            count: approvedCount,
            badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          },
          {
            id: "REJECTED" as const,
            label: "Perlu Revisi",
            icon: XCircle,
            count: rejectedCount,
            badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
          }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 cursor-pointer border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${tab.badgeColor}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. SEARCH & FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari nama kader atau judul laporan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span>Jenjang:</span>
          </div>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">Semua Jenjang</option>
            <option value="MAPABA">MAPABA</option>
            <option value="PKD">PKD</option>
            <option value="PKL">PKL</option>
          </select>
        </div>
      </div>

      {/* 5. SUBMISSIONS LIST */}
      <div className="space-y-3.5">
        {filteredSubmissions.length === 0 ? (
          <Card className="p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-center flex flex-col items-center justify-center space-y-3 bg-white dark:bg-zinc-900 shadow-none">
            <div className="w-11 h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Tidak Ada Laporan
              </span>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                {searchQuery || selectedLevel !== "ALL"
                  ? "Tidak ada pengajuan yang sesuai dengan kriteria pencarian atau filter yang dipilih."
                  : activeTab === "PENDING"
                  ? "Semua laporan follow-up kader telah selesai ditinjau. Antrean saat ini bersih!"
                  : activeTab === "APPROVED"
                  ? "Belum ada laporan follow-up yang berstatus disetujui."
                  : "Tidak ada laporan yang berstatus perlu revisi."}
              </p>
            </div>
          </Card>
        ) : (
          filteredSubmissions.map((sub) => (
            <Card
              key={sub.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-none space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Cadre & Submission info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  {sub.cadreAvatar ? (
                    <img
                      src={sub.cadreAvatar}
                      alt={sub.cadreName}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800 shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-200/60 dark:border-blue-900/60 shrink-0 mt-0.5">
                      {getInitials(sub.cadreName)}
                    </div>
                  )}

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {sub.cadreName}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-semibold h-5 px-1.5 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                      >
                        {sub.cadreLevel}
                      </Badge>
                      <span className="text-[10px] text-zinc-400">•</span>
                      <span className="text-[10px] text-zinc-400">Diajukan: {sub.date}</span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {sub.title}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {sub.description}
                    </p>
                  </div>
                </div>

                {/* Document Link */}
                <div className="flex items-center gap-2 shrink-0 md:self-start">
                  {sub.fileLink && (
                    <a
                      href={sub.fileLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Berkas</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Feedback Note (if exists) */}
              {sub.feedback && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Catatan Review Pengurus</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 text-xs leading-relaxed pl-5">
                    {sub.feedback}
                  </p>
                </div>
              )}

              {/* Action Bar */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400">Status Laporan:</span>
                  <Badge
                    className={`text-[10px] font-semibold uppercase py-0.5 px-2 ${
                      sub.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                        : sub.status === "REJECTED"
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                    }`}
                  >
                    {sub.status === "APPROVED"
                      ? "Disetujui"
                      : sub.status === "REJECTED"
                      ? "Perlu Revisi"
                      : "Menunggu Review"}
                  </Badge>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleOpenReview(sub)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-8 px-3.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Tinjau Laporan</span>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 6. REVIEW DIALOG MODAL */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
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
                  Validasi laporan {reviewingCadreName} ({reviewingCadreLevel})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {reviewingSubmission && (
            <form onSubmit={handleSaveReview}>
              <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                {/* Submission Details Card */}
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {reviewingSubmission.title}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {reviewingSubmission.date}
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    {reviewingSubmission.description}
                  </p>
                  {reviewingSubmission.fileLink && (
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

                {/* Decision Toggle */}
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

                {/* Feedback Note Input */}
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
                    Catatan ini akan dapat dilihat langsung oleh kader pada status laporan mereka.
                  </p>
                </div>
              </div>

              <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReviewModalOpen(false)}
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
