"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { db, type CadreFollowUp, type Requirement } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  Send,
  User,
  Clock,
  AlertCircle,
  ExternalLink,
  Inbox,
  PlusCircle,
  MessageSquare,
  Info,
  Check,
  RotateCcw,
  Sparkles,
  Upload,
  Trash2,
  FileUp,
  Paperclip
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

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

export default function LaporanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  
  // State from Database
  const [cadres, setCadres] = useState<CadreFollowUp[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [currentCadre, setCurrentCadre] = useState<CadreFollowUp | null>(null);

  // Tab State: "form" (Buat Laporan) | "history" (Riwayat Laporan)
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");
  const [historyFilter, setHistoryFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  // Form Fields State
  const [selectedReqId, setSelectedReqId] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  
  // File Upload State
  const [fileLink, setFileLink] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog State
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const activeId = typeof window !== "undefined" ? (localStorage.getItem("PMII_ACTIVE_CADRE_ID") || "") : "";
      const savedUserStr = typeof window !== "undefined" ? localStorage.getItem("PMII_LOGGED_IN_USER") : null;
      let loggedInUser: any = null;
      if (savedUserStr) {
        try {
          loggedInUser = JSON.parse(savedUserStr);
        } catch (e) {}
      }

      const allCadres = await db.getCadres([]);
      const mine = (activeId ? allCadres.find(c => c.id === activeId) : null) || 
                   (loggedInUser ? allCadres.find(c => c.id === loggedInUser.id || (c.email && c.email.toLowerCase() === loggedInUser.email?.toLowerCase())) : null) || 
                   allCadres[0] || null;
      
      const allReqs = await db.getRequirements([]);

      setCadres(allCadres);
      if (mine) {
        setRequirements(allReqs.filter(r => r.level === mine.level));
      }
      setCurrentCadre(mine);
      setDate(new Date().toISOString().split("T")[0]);
      setMounted(true);
    };
    loadData();
  }, []);

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 15MB
    if (file.size > 15 * 1024 * 1024) {
      alert("Ukuran berkas terlalu besar. Maksimal 15MB.");
      return;
    }

    setIsUploadingFile(true);
    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");

    try {
      let finalUrl = "";
      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split(".").pop();
        const filePath = `rktl/${currentCadre?.id || "cadre"}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (uploadError) {
          console.warn("Supabase upload error, falling back to data URL:", uploadError.message);
          finalUrl = await readFileAsDataURL(file);
        } else {
          const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
          finalUrl = data.publicUrl;
        }
      } else {
        finalUrl = await readFileAsDataURL(file);
      }

      setFileLink(finalUrl);
    } catch (err) {
      console.error("Gagal membaca berkas:", err);
      alert("Gagal membaca berkas. Silakan coba kembali.");
      setFileName("");
      setFileSize("");
      setFileLink("");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setFileLink("");
    setFileName("");
    setFileSize("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCadre || !selectedReqId || !title.trim()) return;

    setIsSubmitting(true);

    try {
      // Create new submission
      const newSubmission: CadreSubmission = {
        id: `sub-${Date.now()}`,
        requirementId: selectedReqId,
        title: title.trim(),
        description: "",
        fileLink: fileLink.trim() || fileName.trim(),
        date: date || new Date().toISOString().split("T")[0],
        status: "PENDING",
        feedback: ""
      };

      // Update cadre object
      const updatedCadre: CadreFollowUp = {
        ...currentCadre,
        submissions: [newSubmission, ...(currentCadre.submissions || [])]
      };

      // Update entire list
      const updatedCadres = cadres.map(c => c.id === currentCadre.id ? updatedCadre : c);

      // Save to Database
      setCadres(updatedCadres);
      setCurrentCadre(updatedCadre);
      await db.saveCadres(updatedCadres);

      // Reset form
      setSelectedReqId("");
      setTitle("");
      handleRemoveFile();
      setDate(new Date().toISOString().split("T")[0]);

      // Show success dialog
      setIsSuccessOpen(true);
    } catch (error) {
      console.error("Gagal menyimpan laporan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-2">
        <div className="h-28 bg-zinc-200 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
        <div className="h-96 bg-zinc-200 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!currentCadre) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md mx-auto shadow-sm space-y-6 text-zinc-900 dark:text-zinc-100">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Profil Tidak Ditemukan</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Data profil Anda tidak ditemukan di database. Silakan masuk kembali dengan akun Anda atau lakukan pendaftaran.
          </p>
        </div>
        <div className="flex gap-3 w-full justify-center">
          <Link href="/login" className="w-1/2">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 rounded-lg border-none cursor-pointer">
              Masuk (Login)
            </Button>
          </Link>
          <Link href="/register" className="w-1/2">
            <Button variant="outline" className="w-full border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-xs h-9 rounded-lg cursor-pointer">
              Daftar (Register)
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const submissions = currentCadre.submissions || [];
  const approvedCount = submissions.filter(s => s.status === "APPROVED").length;
  const pendingCount = submissions.filter(s => s.status === "PENDING").length;
  const rejectedCount = submissions.filter(s => s.status === "REJECTED").length;

  const filteredSubmissions = submissions.filter(s => {
    if (historyFilter === "ALL") return true;
    return s.status === historyFilter;
  });

  const selectedRequirement = requirements.find(r => r.id === selectedReqId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-zinc-900 dark:text-zinc-100 font-sans pb-12">
      
      {/* 1. TOP NAVIGATION & BREADCRUMB */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/kader">
          <Button variant="outline" size="sm" className="h-8.5 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 font-medium text-xs flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-7 px-3 text-[11px] font-semibold rounded-full border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40">
            Kaderisasi: {currentCadre.level || "MAPABA"}
          </Badge>
          <Badge variant="outline" className="h-7 px-3 text-[11px] font-semibold rounded-full border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900">
            {currentCadre.commissariat || "Komisariat PMII"}
          </Badge>
        </div>
      </div>

      {/* 2. HERO HEADER & STATS SUMMARY */}
      <div className="relative overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-none">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Laporan Rencana Kerja Tindak Lanjut (RKTL)
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl pl-0.5">
            Unggah berkas laporan berkala, resume bacaan kritis, dan risalah tugas kaderisasi Anda untuk diverifikasi oleh tim reviewer pengurus.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-zinc-100 dark:border-zinc-800">
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">Total Laporan</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">{submissions.length}</span>
          </div>
          <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Menunggu
            </span>
            <span className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-0.5 block">{pendingCount}</span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Disetujui
            </span>
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 block">{approvedCount}</span>
          </div>
          <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
            <span className="text-[11px] font-medium text-rose-700 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Revisi
            </span>
            <span className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-0.5 block">{rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* 3. SEGMENTED TABS: FORM vs HISTORY */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("form")}
          className={`pb-3 cursor-pointer border-b-2 -mb-px transition-colors flex items-center gap-2 ${
            activeTab === "form"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat Laporan Baru</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`pb-3 cursor-pointer border-b-2 -mb-px transition-colors flex items-center gap-2 ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Riwayat Laporan</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {submissions.length}
          </span>
        </button>
      </div>

      {/* 4. TAB CONTENTS */}
      <AnimatePresence mode="wait">
        {activeTab === "form" ? (
          /* TAB 1: FORM PENYERAHAN LAPORAN */
          <motion.div
            key="tab-form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none overflow-hidden">
              <CardHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Formulir Pengajuan Laporan RKTL
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Pilih syarat yang ingin dilaporkan, tulis judul tugas, dan unggah berkas pendukung Anda.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* REQUIREMENT DROPDOWN */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                      <span>Kategori Syarat RKTL <span className="text-rose-500">*</span></span>
                      {requirements.length === 0 && (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-normal">
                          Belum ada daftar syarat khusus untuk level {currentCadre.level}
                        </span>
                      )}
                    </label>
                    
                    {requirements.length > 0 ? (
                      <Select value={selectedReqId} onValueChange={(val) => val && setSelectedReqId(val)}>
                        <SelectTrigger className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9">
                          <SelectValue placeholder="-- Pilih persyaratan tugas yang ingin dilaporkan --" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                          {requirements.map(req => (
                            <SelectItem key={req.id} value={req.id} className="text-xs focus:bg-zinc-100 dark:focus:bg-zinc-800">
                              {req.title} {req.category ? `(${req.category})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Ketikkan kategori / tugas RKTL"
                        value={selectedReqId}
                        onChange={(e) => setSelectedReqId(e.target.value)}
                        className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                      />
                    )}

                    {/* Selected Requirement Detail Banner */}
                    {selectedRequirement && (
                      <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 space-y-1 text-xs text-blue-950 dark:text-blue-200 mt-2">
                        <div className="flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-300">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>Instruksi Tugas: {selectedRequirement.title}</span>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 pl-5 leading-relaxed">
                          {selectedRequirement.description}
                        </p>
                        {selectedRequirement.minSubmissions && (
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 pl-5 pt-0.5">
                            Target Minimal: <span className="font-semibold">{selectedRequirement.minSubmissions} laporan</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* JUDUL LAPORAN */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Judul Laporan / Resume Kajian <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <Input
                        placeholder="Misal: Resume Modul Sejarah Pergerakan Islam & Ke-PMII-an"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>


                  {/* UPLOAD FILE BERKAS PENDUKUNG */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Upload Berkas Pendukung</span>
                        <span className="text-zinc-400 font-normal">(Opsional)</span>
                      </span>
                      {fileName && (
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {fileSize}
                        </span>
                      )}
                    </label>

                    {/* Hidden Native File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                      className="hidden"
                    />

                    {fileName ? (
                      /* File Selected Card */
                      <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60 rounded-lg text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-md bg-blue-600 text-white shrink-0">
                            <FileUp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[260px] sm:max-w-md">
                              {fileName}
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {isUploadingFile ? "Mengunggah berkas..." : `Ukuran: ${fileSize} • Siap dikirim`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-7 text-[11px] px-2.5 rounded-md border-zinc-200 dark:border-zinc-800"
                          >
                            Ganti
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveFile}
                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                            title="Hapus berkas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Dropzone / Upload Trigger */
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            fileInputRef.current?.click();
                          }
                        }}
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/50 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 cursor-pointer transition-colors text-center space-y-2 group"
                      >
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-950/80 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            Pilih berkas atau seret file ke sini
                          </p>
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            Format didukung: PDF, DOC, DOCX, JPG, PNG, ZIP (Maks. 15MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting || isUploadingFile || !selectedReqId || !title.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9.5 rounded-lg border-none cursor-pointer flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Mengirim Laporan...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Kirim Laporan ke Reviewer</span>
                        </>
                      )}
                    </Button>
                  </div>

                </form>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* TAB 2: RIWAYAT LAPORAN & STATUS */
          <motion.div
            key="tab-history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 mr-1 text-[11px]">Filter Status:</span>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("ALL")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                    historyFilter === "ALL"
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  Semua ({submissions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("PENDING")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                    historyFilter === "PENDING"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                  }`}
                >
                  Menunggu ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("APPROVED")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                    historyFilter === "APPROVED"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                  }`}
                >
                  Disetujui ({approvedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("REJECTED")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                    historyFilter === "REJECTED"
                      ? "bg-rose-600 text-white"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                  }`}
                >
                  Revisi ({rejectedCount})
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("form")}
                className="h-7.5 px-2.5 text-xs rounded-lg border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Buat Laporan Baru</span>
              </Button>
            </div>

            {/* List of Submissions */}
            {filteredSubmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Inbox className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {historyFilter === "ALL" ? "Belum Ada Laporan" : "Tidak Ada Laporan Sesuai Filter"}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {historyFilter === "ALL"
                      ? "Anda belum pernah mengirimkan laporan progres RKTL. Klik tombol di bawah untuk mulai membuat laporan."
                      : `Tidak ditemukan laporan dengan status ${historyFilter}.`}
                  </p>
                </div>
                {historyFilter === "ALL" && (
                  <Button
                    onClick={() => setActiveTab("form")}
                    size="sm"
                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                  >
                    Buat Laporan Sekarang
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubmissions.map((sub) => {
                  const req = requirements.find(r => r.id === sub.requirementId);
                  const isApproved = sub.status === "APPROVED";
                  const isRejected = sub.status === "REJECTED";
                  const isPending = sub.status === "PENDING";

                  return (
                    <Card
                      key={sub.id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                    >
                      <div className="p-4 sm:p-5 space-y-3">
                        {/* Header Row: Req title + Status Badge */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-semibold rounded-md border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400">
                              {req?.title || "Tugas RKTL"}
                            </Badge>
                            {req?.category && (
                              <span className="text-[11px] text-zinc-400">• {req.category}</span>
                            )}
                          </div>

                          {/* Status Badge */}
                          {isApproved && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold rounded-full shadow-none px-2.5 py-0.5 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Disetujui
                            </Badge>
                          )}
                          {isPending && (
                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-semibold rounded-full shadow-none px-2.5 py-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Menunggu Review
                            </Badge>
                          )}
                          {isRejected && (
                            <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-semibold rounded-full shadow-none px-2.5 py-0.5 flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" /> Perlu Revisi
                            </Badge>
                          )}
                        </div>

                        {/* Title */}
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {sub.title}
                          </h4>
                          {sub.description && sub.description.trim().length > 0 && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-50/70 dark:bg-zinc-950/50 p-3 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60">
                              {sub.description}
                            </p>
                          )}
                        </div>

                        {/* Reviewer Feedback (if any) */}
                        {sub.feedback && (
                          <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                            isRejected
                              ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200"
                              : "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200"
                          }`}>
                            <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                              <span>Catatan Reviewer Pengurus:</span>
                            </div>
                            <p className="text-xs pl-5 leading-relaxed">{sub.feedback}</p>
                          </div>
                        )}

                        {/* Footer Info: Date & File Attachment */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/60">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Diajukan: {formatDateIndo(sub.date)}</span>
                          </div>

                          {sub.fileLink && sub.fileLink !== "Tidak ada berkas terlampir" ? (
                            <a
                              href={sub.fileLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200/60 dark:border-blue-900/40"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>Lihat / Unduh Berkas Lampiran</span>
                              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-zinc-400 italic">Tidak ada lampiran berkas</span>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. DIALOG SUCCESS */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg max-w-sm w-full p-6">
          <DialogHeader className="flex flex-col items-center justify-center text-center space-y-2 pb-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Laporan Berhasil Diserahkan!
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
              Laporan Anda telah berhasil tersimpan dan masuk ke antrean verifikasi reviewer pengurus. Anda dapat memantau status persetujuan sewaktu-waktu.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsSuccessOpen(false);
                setActiveTab("history");
              }}
              className="w-full sm:w-1/2 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg h-8.5 cursor-pointer"
            >
              Lihat Riwayat
            </Button>
            <Button
              type="button"
              onClick={() => {
                setIsSuccessOpen(false);
                router.push("/kader");
              }}
              className="w-full sm:w-1/2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8.5 cursor-pointer"
            >
              Ke Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
