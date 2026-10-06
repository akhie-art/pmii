"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db";
import type { UserAccount } from "@/lib/db";
import { isRecordInTenant, enforceTenantWrite } from "@/lib/tenancy";
import {
  Mail,
  Plus,
  Search,
  Filter,
  Eye,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Send,
  UploadCloud,
  Trash2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Layers,
  FileCheck,
  Paperclip,
  RotateCcw,
  Sparkles,
  Printer
} from "lucide-react";
import { uploadFileToStorage, formatBytes } from "./component/docx-template-helper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useFeedbackModal } from "@/components/ui/feedback-modal";

import LetterGeneratorDialog from "./component/letter-generator-dialog";
import TemplateManagerDialog from "./component/template-manager-dialog";

interface MailItem {
  id: string;
  nomor: string;
  type?: "MASUK" | "KELUAR";
  senderOrRecipient: string;
  subject: string;
  date: string;
  classification: "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi";
  status: "Selesai" | "Diproses" | "Menunggu Tindak Lanjut" | "Terkirim";
  content: string;
  senderTitle: string;
  senderLocation: string;
  dateIndo: string;
  commissariat?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
}

export default function SuratPage() {
  const [mounted, setMounted] = useState(false);
  const [incoming, setIncoming] = useState<MailItem[]>([]);
  const [outgoing, setOutgoing] = useState<MailItem[]>([]);
  const [activeTab, setActiveTab] = useState<"masuk" | "keluar">("masuk");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [templateCount, setTemplateCount] = useState<number>(0);
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [mailToDelete, setMailToDelete] = useState<MailItem | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [copiedNomor, setCopiedNomor] = useState(false);
  const { showToast, FeedbackModalComponent } = useFeedbackModal();

  // Pagination states
  const [currentIncomingPage, setCurrentIncomingPage] = useState(1);
  const [currentOutgoingPage, setCurrentOutgoingPage] = useState(1);
  const itemsPerPage = 6;

  // States for Recording New Mail Form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [newMailType, setNewMailType] = useState<"MASUK" | "KELUAR">("MASUK");
  const [newNomor, setNewNomor] = useState("");
  const [newSenderRecipient, setNewSenderRecipient] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newClassification, setNewClassification] = useState<
    "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi"
  >("Instruksi");
  const [newContent, setNewContent] = useState("");
  const [newSenderTitle, setNewSenderTitle] = useState("");
  const [newSenderLocation, setNewSenderLocation] = useState("");

  // States for File Attachment (Scan Berkas Fisik / PDF)
  const [newAttachmentFile, setNewAttachmentFile] = useState<File | null>(null);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState<string>("");
  const [newAttachmentName, setNewAttachmentName] = useState<string>("");
  const [newAttachmentSize, setNewAttachmentSize] = useState<string>("");
  const [isUploadingAttachment, setIsUploadingAttachment] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing user session:", e);
        }
      }

      // Bersihkan cache dummy lokal persuratan agar sinkron bersih dengan Supabase
      try {
        const localSurat = localStorage.getItem("PMII_SURAT_DATA");
        if (localSurat) {
          const parsed = JSON.parse(localSurat);
          if (Array.isArray(parsed) && parsed.some((s: any) => s.nomor?.includes("25.PANPEL") || s.subject?.includes("MAPABA") || s.subject?.includes("Rapat Kerja"))) {
            localStorage.removeItem("PMII_SURAT_DATA");
          }
        }
        const localTmpl = localStorage.getItem("PMII_SURAT_TEMPLATES");
        if (localTmpl) {
          const parsed = JSON.parse(localTmpl);
          if (Array.isArray(parsed) && parsed.some((t: any) => t.name?.includes("Narasumber") || t.id === "default-1")) {
            localStorage.removeItem("PMII_SURAT_TEMPLATES");
          }
        }
      } catch (e) {
        // ignore
      }
    }

    const fetchSurat = async () => {
      const data = await db.getSurat();
      if (data && Array.isArray(data)) {
        setIncoming(data.filter((item: any) => item.type === "MASUK"));
        setOutgoing(data.filter((item: any) => item.type === "KELUAR"));
      } else {
        setIncoming([]);
        setOutgoing([]);
      }

      try {
        const tmpls = await db.getSuratTemplates();
        if (tmpls && Array.isArray(tmpls)) {
          setTemplateCount(tmpls.length);
        }
      } catch (e) {
        // ignore
      }
      setMounted(true);
    };
    fetchSurat();
  }, []);

  // Update jumlah template ketika dialog template ditutup
  useEffect(() => {
    if (!isTemplateManagerOpen) {
      db.getSuratTemplates().then((tmpls) => {
        if (tmpls && Array.isArray(tmpls)) setTemplateCount(tmpls.length);
      }).catch(() => {});
    }
  }, [isTemplateManagerOpen]);

  useEffect(() => {
    setCurrentIncomingPage(1);
    setCurrentOutgoingPage(1);
  }, [searchQuery, selectedClass, selectedStatus]);

  const filterList = (list: MailItem[]) => {
    return list.filter((item) => {
      const matchesSearch =
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nomor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.senderOrRecipient.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = selectedClass === "ALL" || item.classification === selectedClass;
      const matchesStatus = selectedStatus === "ALL" || item.status === selectedStatus;

      const matchesTenant =
        !item.commissariat ||
        isRecordInTenant(currentUser, {
          commissariat: item.commissariat
        });

      return matchesSearch && matchesClass && matchesStatus && matchesTenant;
    });
  };

  const isFiltered = searchQuery.trim() !== "" || selectedClass !== "ALL" || selectedStatus !== "ALL";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedClass("ALL");
    setSelectedStatus("ALL");
  };

  const filteredIncoming = filterList(incoming);
  const filteredOutgoing = filterList(outgoing);

  const pendingIncomingCount = incoming.filter(
    (m) => m.status === "Menunggu Tindak Lanjut" || m.status === "Diproses"
  ).length;

  const incomingTotalPages = Math.ceil(filteredIncoming.length / itemsPerPage);
  const currentIncoming = filteredIncoming.slice(
    (currentIncomingPage - 1) * itemsPerPage,
    currentIncomingPage * itemsPerPage
  );

  const outgoingTotalPages = Math.ceil(filteredOutgoing.length / itemsPerPage);
  const currentOutgoing = filteredOutgoing.slice(
    (currentOutgoingPage - 1) * itemsPerPage,
    currentOutgoingPage * itemsPerPage
  );

  const isNewNomorDuplicate = newMailType === "KELUAR" && Boolean(
    newNomor.trim() && outgoing.some((m) => m.nomor.trim().toLowerCase() === newNomor.trim().toLowerCase())
  );

  const handleRegisterMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNomor.trim() || !newSubject.trim() || !newSenderRecipient.trim()) return;

    if (isNewNomorDuplicate) {
      const confirmUse = window.confirm(
        `PERINGATAN: Nomor surat "${newNomor}" sudah terdaftar di Surat Keluar.\n\nTetap simpan surat ini?`
      );
      if (!confirmUse) return;
    }

    const today = new Date().toISOString().split("T")[0];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const dateStr = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

    let finalFileUrl = newAttachmentUrl;
    let finalFileName = newAttachmentName;
    let finalFileSize = newAttachmentSize;

    if (newAttachmentFile && !finalFileUrl) {
      setIsUploadingAttachment(true);
      const res = await uploadFileToStorage(newAttachmentFile, "surat-attachments", newAttachmentFile.name);
      if (res?.url) {
        finalFileUrl = res.url;
        finalFileName = newAttachmentFile.name;
        finalFileSize = res.sizeFormatted;
      }
      setIsUploadingAttachment(false);
    }

    const newMail: MailItem = enforceTenantWrite<MailItem>(currentUser, {
      id: `${newMailType === "MASUK" ? "in" : "out"}-${Date.now()}`,
      nomor: newNomor,
      type: newMailType,
      senderOrRecipient: newSenderRecipient,
      subject: newSubject,
      date: today,
      classification: newClassification,
      status: newMailType === "MASUK" ? "Menunggu Tindak Lanjut" : "Terkirim",
      content: newContent || "Isi surat terlampir.",
      senderTitle: newSenderTitle || (newMailType === "MASUK" ? "Pengirim" : "PC PMII"),
      senderLocation: newSenderLocation || "Semarang",
      dateIndo: dateStr,
      fileUrl: finalFileUrl || undefined,
      fileName: finalFileName || undefined,
      fileSize: finalFileSize || undefined
    });

    const updatedInc = newMailType === "MASUK" ? [newMail, ...incoming] : incoming;
    const updatedOut = newMailType === "KELUAR" ? [newMail, ...outgoing] : outgoing;

    if (newMailType === "MASUK") setIncoming(updatedInc);
    else setOutgoing(updatedOut);

    await db.saveSurat([...updatedInc, ...updatedOut]);

    setNewNomor("");
    setNewSenderRecipient("");
    setNewSubject("");
    setNewContent("");
    setNewSenderTitle("");
    setNewSenderLocation("");
    setNewAttachmentFile(null);
    setNewAttachmentUrl("");
    setNewAttachmentName("");
    setNewAttachmentSize("");
    setIsAddOpen(false);
    showToast(`Surat ${newMailType === "MASUK" ? "Masuk" : "Keluar"} berhasil dicatat!`);
  };

  const handlePublishCustomLetter = async (data: any) => {
    const items: any[] = Array.isArray(data) ? data : [data];
    if (items.length === 0) return;

    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const dateStr = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

    const newMails: MailItem[] = items.map((item, idx) =>
      enforceTenantWrite<MailItem>(currentUser, {
        id: `out-gen-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        nomor: item.nomor,
        type: "KELUAR",
        senderOrRecipient: item.recipient,
        subject: item.subject,
        date: new Date().toISOString().split("T")[0],
        classification: item.classification,
        status: "Terkirim",
        content: item.content,
        senderTitle: item.senderTitle,
        senderLocation: item.senderLocation,
        dateIndo: dateStr
      })
    );

    const updatedOut = [...newMails, ...outgoing];
    setOutgoing(updatedOut);
    await db.saveSurat([...incoming, ...updatedOut]);
    
    if (items.length > 1) {
      showToast(`${items.length} Surat massal resmi berhasil diterbitkan & dicatat ke arsip!`);
    } else {
      showToast(`Surat resmi "${items[0].subject}" berhasil diterbitkan!`);
    }
  };

  const confirmDeleteMail = async () => {
    if (!mailToDelete) return;
    const nomor = mailToDelete.nomor;
    if (mailToDelete.type === "MASUK") {
      const res = incoming.filter((i) => i.id !== mailToDelete.id);
      setIncoming(res);
      await db.saveSurat([...res, ...outgoing]);
    } else {
      const res = outgoing.filter((i) => i.id !== mailToDelete.id);
      setOutgoing(res);
      await db.saveSurat([...incoming, ...res]);
    }
    setMailToDelete(null);
    showToast(`Surat nomor ${nomor} berhasil dihapus.`);
  };

  const handleCopyNomor = (nomor: string) => {
    navigator.clipboard.writeText(nomor);
    setCopiedNomor(true);
    setTimeout(() => setCopiedNomor(false), 2000);
  };

  const cleanMailContent = (content?: string, subject?: string, recipient?: string): string => {
    if (!content) {
      return `Surat resmi perihal "${subject || "kegiatan"}" ditujukan kepada ${recipient || "instansi terkait"}.`;
    }

    // 1. Remove style and script tags and their inner content
    let text = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");

    // 2. Remove CSS selector declarations like .docx-wrapper { ... }
    text = text.replace(/\{[^}]*\}/g, " ");

    // 3. Remove all HTML tags
    text = text.replace(/<[^>]+>/g, " ");

    // 4. Decode HTML entities
    text = text
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">");

    // 5. Clean up extra whitespaces and newlines
    text = text.replace(/\s+/g, " ").trim();

    // 6. Check if it's empty, too short, or still contaminated with CSS class names
    if (
      !text ||
      text.length < 5 ||
      text.includes(".docx") ||
      text.includes("box-shadow") ||
      text.includes("display: flex") ||
      text.includes("flex-flow")
    ) {
      return `Dokumen resmi perihal "${subject || "kegiatan"}" ditujukan kepada ${recipient || "instansi terkait"}. Berkas telah terbit dan siap diunduh atau dicetak.`;
    }

    return text;
  };

  const handlePrintMail = (mail: MailItem) => {
    if (!mail.content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Gagal membuka jendela cetak. Pastikan izin pop-up browser aktif.");
      return;
    }

    const printTitle = (mail.nomor || "Surat_Resmi").replace(/[\s\/\.]+/g, "_");
    const allStyles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((el) => el.outerHTML)
      .join("\n");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>${printTitle}</title>
          ${allStyles}
          <style>
            @page {
              size: auto;
              margin: 15mm 20mm;
            }
            *, *::before, *::after {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              width: 100% !important;
              font-family: 'Times New Roman', 'Arial', sans-serif !important;
            }
          </style>
        </head>
        <body>
          <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
            ${mail.content}
          </div>
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 300);
            });
            window.addEventListener('afterprint', function() {
              window.close();
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatDetailContent = (content?: string, subject?: string, recipient?: string): string => {
    if (!content) return "Tidak ada konten teks terlampir.";
    let sanitized = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
    sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
    sanitized = sanitized.replace(/\{[^}]*\}/g, " ");
    const plain = sanitized.replace(/<[^>]+>/g, " ").trim();
    if (!plain || plain.length < 5 || plain.includes(".docx") || plain.includes("display: flex")) {
      return `<p class="text-zinc-600 dark:text-zinc-400">Dokumen resmi perihal <strong>${subject || "persuratan"}</strong> untuk <strong>${recipient || "instansi tujuan"}</strong> telah diterbitkan dan tersimpan secara digital.</p>`;
    }
    return sanitized.replace(/\n/g, "<br/>");
  };

  const getClassificationBadge = (cls: MailItem["classification"]) => {
    const variants = {
      Instruksi: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900",
      Permohonan: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-900",
      Undangan: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900",
      Rekomendasi: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900",
      Keputusan: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
    };
    return (
      <Badge className={`${variants[cls] || variants.Keputusan} text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2 shadow-none`}>
        {cls}
      </Badge>
    );
  };

  const getStatusBadge = (status: MailItem["status"]) => {
    if (status === "Selesai") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-[10px] font-semibold uppercase py-0.5 px-2 shadow-none">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
        </Badge>
      );
    }
    if (status === "Diproses") {
      return (
        <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-[10px] font-semibold uppercase py-0.5 px-2 shadow-none">
          <Clock className="w-3 h-3 mr-1" /> Diproses
        </Badge>
      );
    }
    if (status === "Terkirim") {
      return (
        <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[10px] font-semibold uppercase py-0.5 px-2 shadow-none">
          <Send className="w-3 h-3 mr-1" /> Terkirim
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[10px] font-semibold uppercase py-0.5 px-2 shadow-none animate-pulse">
        <AlertCircle className="w-3 h-3 mr-1" /> Menunggu Tindak Lanjut
      </Badge>
    );
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse pb-12">
        <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/3" />
        <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
      </div>
    );
  }

  const activeData = activeTab === "masuk" ? currentIncoming : currentOutgoing;
  const activeTotalFiltered = activeTab === "masuk" ? filteredIncoming.length : filteredOutgoing.length;
  const activeCurrentPage = activeTab === "masuk" ? currentIncomingPage : currentOutgoingPage;
  const activeTotalPages = activeTab === "masuk" ? incomingTotalPages : outgoingTotalPages;
  const setActivePage = activeTab === "masuk" ? setCurrentIncomingPage : setCurrentOutgoingPage;

  return (
    <div className="space-y-6 relative z-10 font-sans text-zinc-900 dark:text-zinc-100 pb-12">


      {/* 1. HERO HEADER (Sama persis dengan pola Verifikasi) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 rounded-xl shadow-none">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white shadow-sm shrink-0 mt-0.5 sm:mt-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Administrasi Persuratan
              </h1>
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2">
                Tata Kelola Surat
              </Badge>
              {pendingIncomingCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 px-2 py-0.5 rounded-md">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                  </span>
                  <span>{pendingIncomingCount} perlu tindak lanjut</span>
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
              Arsipkan surat masuk, pantau tindak lanjut, dan terbitkan lembaran surat keluar resmi organisasi secara digital.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start lg:self-center flex-wrap sm:flex-nowrap">
          {/* Tombol Kelola Template Surat */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsTemplateManagerOpen(true)}
            className="h-9 px-3 text-xs font-medium border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-2xs cursor-pointer transition-colors bg-white dark:bg-zinc-900"
          >
            <Bookmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Kelola Template</span>
          </Button>

          {/* Form Pencatatan Manual */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <Button
              onClick={() => setIsAddOpen(true)}
              variant="outline"
              className="h-9 px-3 text-xs font-medium border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-2xs cursor-pointer transition-colors bg-white dark:bg-zinc-900"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Catat Surat</span>
            </Button>
            <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-lg w-full p-0 overflow-hidden">
              <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Registrasi Surat Baru
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Lengkapi metadata arsip persuratan untuk database PMII
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleRegisterMail}>
                <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                  {/* Toggle Jenis Surat */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Jenis Persuratan <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewMailType("MASUK")}
                        className={`p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                          newMailType === "MASUK"
                            ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-400 shadow-xs"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        <Mail className="w-4 h-4" />
                        <span>Surat Masuk</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewMailType("KELUAR")}
                        className={`p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                          newMailType === "KELUAR"
                            ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-400 shadow-xs"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        <span>Surat Keluar</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Nomor Surat <span className="text-rose-500">*</span>
                        </label>
                        {newMailType === "KELUAR" && (
                          <button
                            type="button"
                            onClick={() => {
                              let maxSeq = 0;
                              outgoing.forEach((m) => {
                                const match = m.nomor?.match(/^(\d{1,4})/);
                                if (match) {
                                  const num = parseInt(match[1], 10);
                                  if (!isNaN(num) && num > maxSeq) maxSeq = num;
                                }
                              });
                              const next = (maxSeq + 1).toString().padStart(3, "0");
                              const m = String(new Date().getMonth() + 1).padStart(2, "0");
                              const y = new Date().getFullYear();
                              setNewNomor(`${next}.PC-XI.Z-03.01.010.B-II.${m}.${y}`);
                            }}
                            className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                            title="Generate nomor urut berikutnya"
                          >
                            + No. Otomatis
                          </button>
                        )}
                      </div>
                      <Input
                        required
                        placeholder="Contoh: 021.PC-XI.Z-03..."
                        value={newNomor}
                        onChange={(e) => setNewNomor(e.target.value)}
                        className={`h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border rounded-lg ${
                          isNewNomorDuplicate
                            ? "border-rose-400 dark:border-rose-600 focus:ring-rose-500"
                            : "border-zinc-200 dark:border-zinc-800"
                        }`}
                      />
                      {isNewNomorDuplicate && (
                        <p className="text-[10px] text-rose-500 font-medium">
                          ⚠️ Nomor ini sudah terdaftar di Surat Keluar!
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Klasifikasi <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={newClassification}
                        onChange={(e) => setNewClassification(e.target.value as any)}
                        className="h-9 w-full text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Instruksi">Instruksi</option>
                        <option value="Permohonan">Permohonan</option>
                        <option value="Undangan">Undangan</option>
                        <option value="Keputusan">Keputusan</option>
                        <option value="Rekomendasi">Rekomendasi</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {newMailType === "MASUK" ? "Instansi Pengirim *" : "Instansi Tujuan *"}
                    </label>
                    <Input
                      required
                      placeholder={newMailType === "MASUK" ? "Contoh: PKC PMII Jawa Tengah" : "Contoh: PC PMII Kota Semarang"}
                      value={newSenderRecipient}
                      onChange={(e) => setNewSenderRecipient(e.target.value)}
                      className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Perihal / Hal Surat <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="Contoh: Undangan Rapat Kerja Cabang..."
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Penandatangan</label>
                      <Input
                        placeholder="Ketua / Sekretaris"
                        value={newSenderTitle}
                        onChange={(e) => setNewSenderTitle(e.target.value)}
                        className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Kota / Lokasi</label>
                      <Input
                        placeholder="Semarang"
                        value={newSenderLocation}
                        onChange={(e) => setNewSenderLocation(e.target.value)}
                        className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Ringkasan / Isi Pokok Surat
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tuliskan pokok perihal atau catatan penting terkait surat..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full text-xs p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[85px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 font-medium resize-y"
                    />
                  </div>

                  {/* Unggah Berkas Fisik / Scan PDF Surat */}
                  <div className="space-y-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                        <span>Lampiran Berkas Asli (PDF / Scan / Foto)</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-normal">Opsional</span>
                    </label>

                    {newAttachmentFile || newAttachmentUrl ? (
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-xs">
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {newAttachmentName || newAttachmentFile?.name}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              {newAttachmentSize || (newAttachmentFile ? formatBytes(newAttachmentFile.size) : "")}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewAttachmentFile(null);
                            setNewAttachmentUrl("");
                            setNewAttachmentName("");
                            setNewAttachmentSize("");
                          }}
                          className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-600 rounded-md cursor-pointer shrink-0"
                          title="Hapus berkas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-center hover:border-blue-400 transition-colors bg-zinc-50/50 dark:bg-zinc-900/40">
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.docx"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setNewAttachmentFile(file);
                              setNewAttachmentName(file.name);
                              setNewAttachmentSize(formatBytes(file.size));
                              uploadFileToStorage(file, "surat-attachments", file.name).then((res) => {
                                if (res?.url) {
                                  setNewAttachmentUrl(res.url);
                                }
                              });
                            }
                            e.target.value = "";
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
                          <UploadCloud className="w-5 h-5 text-zinc-400" />
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                            Klik atau seret file PDF / scan surat ke sini
                          </p>
                          <p className="text-[9.5px] text-zinc-400">Maks. 15MB (PDF, PNG, JPG, DOCX)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setNewAttachmentFile(null);
                      setNewAttachmentUrl("");
                      setNewAttachmentName("");
                      setNewAttachmentSize("");
                      setIsAddOpen(false);
                    }}
                    className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploadingAttachment}
                    className="h-9 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    {isUploadingAttachment ? "Mengunggah Lampiran..." : "Simpan & Arsipkan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Generator Pembuat Surat Digital */}
          <LetterGeneratorDialog
            onPublish={handlePublishCustomLetter}
            existingMails={outgoing}
            onOpenTemplateManager={() => setIsTemplateManagerOpen(true)}
          />

          {/* Dialog CRUD Kelola Template */}
          <TemplateManagerDialog
            isOpen={isTemplateManagerOpen}
            onOpenChange={setIsTemplateManagerOpen}
          />
        </div>
      </div>

      {/* 2. TABS SELECTOR (Persis seperti Tabs di Verifikasi) */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-xs font-medium">
        {[
          {
            id: "masuk" as const,
            label: "Surat Masuk",
            icon: Mail,
            count: filteredIncoming.length,
            badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          },
          {
            id: "keluar" as const,
            label: "Surat Keluar",
            icon: Send,
            count: filteredOutgoing.length,
            badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedStatus("ALL");
              }}
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

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari perihal, nomor surat, atau instansi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px]">Filter:</span>
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">Semua Klasifikasi</option>
            <option value="Instruksi">Instruksi</option>
            <option value="Permohonan">Permohonan</option>
            <option value="Undangan">Undangan</option>
            <option value="Keputusan">Keputusan</option>
            <option value="Rekomendasi">Rekomendasi</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            {activeTab === "masuk" ? (
              <>
                <option value="Menunggu Tindak Lanjut">Menunggu Tindak Lanjut</option>
                <option value="Diproses">Diproses</option>
                <option value="Selesai">Selesai</option>
              </>
            ) : (
              <>
                <option value="Terkirim">Terkirim</option>
                <option value="Selesai">Selesai</option>
              </>
            )}
          </select>

          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 px-2.5 rounded-lg cursor-pointer"
              title="Reset pencarian dan filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* 4. CONTENT DISPLAY (Tabel List) */}
      {activeData.length === 0 ? (
        /* Empty State Card (Persis seperti Verifikasi) */
        <Card className="p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-center flex flex-col items-center justify-center space-y-3 bg-white dark:bg-zinc-900 shadow-none">
          <div className="w-11 h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
            <Mail className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Tidak Ada Surat Ditemukan
            </span>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {searchQuery || selectedClass !== "ALL"
                ? "Tidak ada arsip surat yang sesuai dengan kriteria pencarian atau klasifikasi yang dipilih."
                : activeTab === "masuk"
                ? "Belum ada arsip surat masuk yang tercatat di sistem."
                : "Belum ada arsip surat keluar yang diterbitkan di sistem."}
            </p>
          </div>
        </Card>
      ) : (
        /* Table List View */
        <Card className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-none bg-white dark:bg-zinc-900">
          <Table>
            <TableHeader className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <TableRow>
                <TableHead className="font-bold text-[11px] pl-6 py-3.5 text-zinc-600 dark:text-zinc-300">
                  Nomor &amp; Tanggal
                </TableHead>
                <TableHead className="font-bold text-[11px] py-3.5 text-zinc-600 dark:text-zinc-300">
                  {activeTab === "masuk" ? "Instansi Pengirim" : "Instansi Tujuan"}
                </TableHead>
                <TableHead className="font-bold text-[11px] py-3.5 text-zinc-600 dark:text-zinc-300">
                  Perihal / Hal
                </TableHead>
                <TableHead className="font-bold text-[11px] py-3.5 text-zinc-600 dark:text-zinc-300">
                  Klasifikasi
                </TableHead>
                <TableHead className="font-bold text-[11px] py-3.5 text-zinc-600 dark:text-zinc-300">
                  Status
                </TableHead>
                <TableHead className="font-bold text-[11px] text-center pr-6 py-3.5 text-zinc-600 dark:text-zinc-300">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeData.map((mail) => (
                <TableRow
                  key={mail.id}
                  className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  <TableCell className="pl-6 py-3.5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">{mail.nomor}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyNomor(mail.nomor)}
                          className="h-5 w-5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors border-none cursor-pointer"
                          title="Salin nomor surat"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3" /> {mail.dateIndo || mail.date}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {mail.senderOrRecipient}
                  </TableCell>
                  <TableCell className="py-3.5 text-xs max-w-xs">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {mail.subject}
                    </p>
                    {mail.fileUrl && (
                      <a
                        href={mail.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline mt-0.5 font-medium"
                        onClick={(e) => e.stopPropagation()}
                        title={`Buka berkas ${mail.fileName || 'Lampiran'}`}
                      >
                        <Paperclip className="w-2.5 h-2.5 text-blue-500" />
                        <span className="truncate max-w-[180px]">{mail.fileName || "Lampiran Fisik"}</span>
                        <ExternalLink className="w-2 h-2 opacity-60" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="py-3.5">{getClassificationBadge(mail.classification)}</TableCell>
                  <TableCell className="py-3.5">{getStatusBadge(mail.status)}</TableCell>
                  <TableCell className="text-center pr-6 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setSelectedMail(mail)}
                        className="rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                        title="Lihat Detail Surat"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setMailToDelete(mail)}
                        className="rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Hapus Surat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* 5. PAGINATION (Sama seperti Verifikasi) */}
      {activeTotalFiltered > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 px-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Menampilkan{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {(activeCurrentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {Math.min(activeCurrentPage * itemsPerPage, activeTotalFiltered)}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {activeTotalFiltered}
            </span>{" "}
            surat
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivePage((p) => Math.max(p - 1, 1))}
              disabled={activeCurrentPage === 1}
              className="h-8 px-3 text-xs rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-40 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
            </Button>
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 px-2">
              {activeCurrentPage} / {Math.max(1, activeTotalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivePage((p) => Math.min(p + 1, activeTotalPages))}
              disabled={activeCurrentPage >= activeTotalPages}
              className="h-8 px-3 text-xs rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-40 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 6. DIALOG DETAIL SURAT */}
      <Dialog open={!!selectedMail} onOpenChange={(open) => !open && setSelectedMail(null)}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-3xl w-full p-0 overflow-hidden">
          {selectedMail && (() => {
            const isHtmlDocument = Boolean(
              selectedMail.content &&
              (selectedMail.content.includes("<table") ||
               selectedMail.content.includes("<div") ||
               selectedMail.content.includes("<p") ||
               selectedMail.content.includes("data-field") ||
               selectedMail.content.includes("KOP SURAT") ||
               selectedMail.content.includes("Commissariat") ||
               selectedMail.content.includes("PERGERAKAN MAHASISWA ISLAM INDONESIA"))
            );

            return (
              <>
                <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                            Detail Arsip Surat
                          </DialogTitle>
                          <Badge className={`text-[10px] font-bold py-0.5 px-2 shadow-none border ${
                            selectedMail.type === "MASUK"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                          }`}>
                            {selectedMail.type === "MASUK" ? "Surat Masuk" : "Surat Keluar"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-400 truncate">
                            {selectedMail.nomor}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyNomor(selectedMail.nomor)}
                            className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 rounded transition-colors cursor-pointer border-none bg-transparent"
                            title="Salin nomor surat"
                          >
                            {copiedNomor ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                  {/* Unified Metadata Card */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          Perihal / Hal Surat
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 leading-snug">
                          {selectedMail.subject}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                        {getClassificationBadge(selectedMail.classification)}
                        {getStatusBadge(selectedMail.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-400" /> Tanggal Surat
                        </span>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {selectedMail.dateIndo || selectedMail.date}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                          <Building className="w-3 h-3 text-zinc-400" /> {selectedMail.type === "MASUK" ? "Instansi Pengirim" : "Instansi Tujuan"}
                        </span>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate" title={selectedMail.senderOrRecipient}>
                          {selectedMail.senderOrRecipient}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                          <FileCheck className="w-3 h-3 text-zinc-400" /> Penandatangan &amp; Wilayah
                        </span>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {selectedMail.senderTitle || "-"} • {selectedMail.senderLocation || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content / Document Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{isHtmlDocument ? "Pratinjau Lembar Surat Resmi" : "Isi Ringkasan Pokok Surat"}</span>
                      </label>
                      {isHtmlDocument && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintMail(selectedMail)}
                          className="h-7 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-none"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Cetak / Simpan PDF</span>
                        </Button>
                      )}
                    </div>

                    {isHtmlDocument ? (
                      /* Authentic Document Paper Preview */
                      <div className="bg-zinc-100 dark:bg-zinc-950/80 p-3 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 max-h-[440px] overflow-y-auto">
                        <div className="bg-white text-zinc-900 p-6 sm:p-8 rounded-lg shadow-sm border border-zinc-200/90 max-w-full overflow-x-auto text-[13px] leading-relaxed">
                          <div
                            className="preview-official-letter select-text"
                            dangerouslySetInnerHTML={{ __html: selectedMail.content }}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Clean Plain Text Box */
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 max-h-56 overflow-y-auto">
                        {selectedMail.content ? (
                          <p className="whitespace-pre-line">{selectedMail.content}</p>
                        ) : (
                          <p className="text-zinc-400 italic">Tidak ada konten teks terlampir.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Lampiran Berkas Asli (PDF / Scan) */}
                  {selectedMail.fileUrl && (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                        <span>Lampiran Berkas Fisik / Dokumen</span>
                      </label>
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs">
                        <div className="flex items-center gap-3 truncate min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate min-w-0">
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {selectedMail.fileName || "Berkas_Lampiran"}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              {selectedMail.fileSize || "Tersimpan di Cloud Storage"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                          <a
                            href={selectedMail.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 px-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg flex items-center gap-1 border border-blue-200 dark:border-blue-900/60 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Buka Berkas</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between sm:justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyNomor(selectedMail.nomor)}
                      className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {copiedNomor ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedNomor ? "Nomor Tersalin!" : "Salin No. Surat"}</span>
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {isHtmlDocument && (
                      <Button
                        type="button"
                        onClick={() => handlePrintMail(selectedMail)}
                        className="h-9 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Surat</span>
                      </Button>
                    )}
                    <DialogClose render={
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        Tutup
                      </Button>
                    } />
                  </div>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* 7. DIALOG KONFIRMASI HAPUS (Persis pola Verifikasi) */}
      <Dialog open={!!mailToDelete} onOpenChange={(open) => !open && setMailToDelete(null)}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-md w-full p-0 overflow-hidden">
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Konfirmasi Hapus Surat
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Tindakan ini permanen dan menghapus catatan dari database
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 sm:p-6 text-xs text-zinc-600 dark:text-zinc-400">
            Apakah Anda yakin ingin menghapus arsip surat nomor{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
              {mailToDelete?.nomor}
            </span>
            ? Data yang telah dihapus tidak dapat dipulihkan.
          </div>

          <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMailToDelete(null)}
              className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteMail}
              className="h-9 text-xs font-medium rounded-lg text-white bg-rose-600 hover:bg-rose-700 cursor-pointer"
            >
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {FeedbackModalComponent}
    </div>
  );
}