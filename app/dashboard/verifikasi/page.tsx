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
  Sparkles,
  ClipboardList,
  Check,
  X,
  AlertCircle,
  Clock,
  Compass
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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

  // Review Dialog states
  const [reviewingSubmission, setReviewingSubmission] = useState<CadreSubmission | null>(null);
  const [reviewingCadreId, setReviewingCadreId] = useState<string>("");
  const [reviewingCadreName, setReviewingCadreName] = useState<string>("");
  const [reviewFeedback, setReviewFeedback] = useState<string>("");
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");

  // Feedback notifications
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    const storedCampus = typeof window !== "undefined" ? (localStorage.getItem("PMII_ACTIVE_COMMISSARIAT") || "UIN Walisongo") : "UIN Walisongo";
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

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/4" />
        <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-full" />
        <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-full" />
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
    }))
  );

  const filteredSubmissions = flatSubmissions.filter((s) => s.status === activeTab);

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
    setReviewStatus("APPROVED");
    setReviewFeedback(sub.feedback || "");
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSubmission || !reviewingCadreId) return;

    const updatedCadres = cadres.map((cadre) => {
      if (cadre.id === reviewingCadreId) {
        const updatedSubmissions = cadre.submissions.map((sub) => {
          if (sub.id === reviewingSubmission.id) {
            return {
              ...sub,
              status: reviewStatus,
              feedback: reviewFeedback
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
          const hasPending = updatedSubmissions.some(s => s.status === "PENDING");
          const hasRejected = updatedSubmissions.some(s => s.status === "REJECTED");
          const totalReq = cadre.level === "MAPABA" ? 3 : cadre.level === "PKD" ? 3 : 4;
          const approvedCount = updatedSubmissions.filter(s => s.status === "APPROVED").length;
          
          if (!hasPending && !hasRejected && approvedCount >= totalReq) {
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
    setReviewingSubmission(null);
    setReviewingCadreId("");
    setReviewFeedback("");
    setSuccessMessage("Status pengajuan berhasil diperbarui secara real-time!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  return (
    <div className="space-y-6 select-none pb-12">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-650 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
          Verifikasi RKTL
        </h1>
        <p className="text-xs text-zinc-550 dark:text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
          Tinjau & berikan umpan balik (feedback) pengajuan laporan follow-up kader {activeCampus}
        </p>
      </div>

      {/* TOAST SUCCESS NOTIFICATION */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 p-4 bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2.5 z-50 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* FILTER TABS */}
      <div className="flex gap-2 p-1 bg-zinc-150 dark:bg-zinc-950/60 border border-zinc-200/50 dark:border-zinc-800/60 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "PENDING"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Clock className="w-4 h-4" /> Antrean ({flatSubmissions.filter((s) => s.status === "PENDING").length})
        </button>
        <button
          onClick={() => setActiveTab("APPROVED")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "APPROVED"
              ? "bg-emerald-500 text-white shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Disetujui ({flatSubmissions.filter((s) => s.status === "APPROVED").length})
        </button>
        <button
          onClick={() => setActiveTab("REJECTED")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "REJECTED"
              ? "bg-rose-500 text-white shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <XCircle className="w-4 h-4" /> Perlu Revisi ({flatSubmissions.filter((s) => s.status === "REJECTED").length})
        </button>
      </div>

      {/* SUBMISSIONS STACK */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <Card className="p-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center flex flex-col items-center justify-center space-y-3 bg-white dark:bg-zinc-900 shadow-none">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">
                Tidak Ada Pengajuan
              </span>
              <p className="text-[10.5px] text-zinc-500 font-medium max-w-xs mx-auto">
                Kategori status ini bersih. Tidak ada pengajuan laporan yang masuk dalam filter ini.
              </p>
            </div>
          </Card>
        ) : (
          filteredSubmissions.map((sub) => (
            <Card
              key={sub.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 sm:p-5 shadow-none space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors relative overflow-hidden"
            >
              {/* Card status background overlay line */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                sub.status === "APPROVED" 
                  ? "bg-emerald-500" 
                  : sub.status === "REJECTED" 
                  ? "bg-rose-500" 
                  : "bg-amber-500"
              }`} />

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pl-2">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-zinc-900 dark:text-white">
                      {sub.cadreName}
                    </span>
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[8.5px] font-black uppercase py-0.5 px-2 rounded-lg">
                      {sub.cadreLevel}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-black text-zinc-850 dark:text-zinc-100">
                    {sub.title}
                  </h3>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-medium">
                    {sub.description}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-550 font-mono">
                    Diajukan: {sub.date}
                  </span>
                  {sub.fileLink && (
                    <a
                      href={sub.fileLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-pmii-blue dark:text-pmii-gold hover:underline flex items-center gap-1 mt-1 bg-pmii-blue/5 dark:bg-pmii-gold/5 border border-pmii-blue/10 dark:border-pmii-gold/10 px-2 py-1 rounded-lg"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Buka Laporan / Dokumen
                    </a>
                  )}
                </div>
              </div>

              {/* Feedback Show */}
              {sub.feedback && (
                <div className="pl-2">
                  <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-950/40 border-l-2 border-zinc-400 dark:border-zinc-700 rounded-r-2xl text-[11px] font-semibold text-zinc-700 dark:text-zinc-350 space-y-1">
                    <span className="text-[9px] text-zinc-500 dark:text-zinc-550 font-bold uppercase tracking-widest flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-amber-500" /> Catatan Komisariat
                    </span>
                    <p>{sub.feedback}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pl-2 border-t border-zinc-150 dark:border-zinc-850 pt-4 flex justify-end gap-2.5">
                <Button
                  size="xs"
                  onClick={() => handleOpenReview(sub)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10.5px] px-3.5 py-1.5 rounded-xl border-none cursor-pointer flex items-center gap-1"
                >
                  <FileCheck className="w-3.5 h-3.5" /> Tinjau / Ubah Status
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* REVIEW DIALOG MODAL */}
      {reviewingSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden relative">
            
            {/* Top decorative gradient bar */}
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-pmii-blue w-full" />
            
            <form onSubmit={handleSaveReview} className="space-y-5">
              
              {/* Header */}
              <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center border border-white/10 shadow-md">
                    <Compass className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                      Tinjau RKTL: {reviewingCadreName}
                    </h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-550 font-bold uppercase tracking-wider mt-0.5">
                      Berikan status persetujuan laporan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewingSubmission(null)}
                  className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                
                {/* Details box */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-800 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-zinc-850 dark:text-zinc-200">
                    {reviewingSubmission.title}
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-450 leading-relaxed font-semibold">
                    {reviewingSubmission.description}
                  </p>
                </div>

                {/* Status Toggle Grid */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                    Keputusan Peninjauan
                  </label>
                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => setReviewStatus("APPROVED")}
                      className={`p-3 rounded-2xl border text-xs font-black cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                        reviewStatus === "APPROVED"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/5"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 text-zinc-500"
                      }`}
                    >
                      <Check className="w-4.5 h-4.5" />
                      <span>Setujui Laporan (Approved)</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setReviewStatus("REJECTED")}
                      className={`p-3 rounded-2xl border text-xs font-black cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                        reviewStatus === "REJECTED"
                          ? "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-450 shadow-md shadow-rose-500/5"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 text-zinc-500"
                      }`}
                    >
                      <X className="w-4.5 h-4.5" />
                      <span>Tolak / Perlu Revisi</span>
                    </button>
                  </div>
                </div>

                {/* Feedback Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                    Umpan Balik (Feedback Catatan)
                  </label>
                  <Input
                    type="text"
                    required
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder="Contoh: Analisis yang tajam! Pertahankan gagasan NDP..."
                    className="h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 bg-zinc-50 dark:bg-black/20 border-t border-zinc-150 dark:border-zinc-800 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewingSubmission(null)}
                  className="text-xs font-bold px-4 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Batal
                </Button>
                
                <Button
                  type="submit"
                  className={`text-xs font-extrabold px-4 h-9 rounded-xl text-white border-none cursor-pointer ${
                    reviewStatus === "APPROVED" 
                      ? "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/10" 
                      : "bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/10"
                  }`}
                >
                  Simpan Keputusan Review
                </Button>
              </div>

            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
