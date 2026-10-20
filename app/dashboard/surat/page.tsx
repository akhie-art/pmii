"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { db, generateUUID, type UserAccount } from "@/lib/db";
import {
  isRecordInTenant,
  isCabangRecord,
  enforceTenantWrite,
  getActiveTenant,
  setActiveTenant as setGlobalActiveTenant,
  isCabangOrAdmin,
  DEFAULT_KOMISARIAT_LIST,
  TENANT_CHANGED_EVENT
} from "@/lib/tenancy";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Mail,
  Plus,
  Search,
  Filter,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Send,
  Trash2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Paperclip,
  RotateCcw
} from "lucide-react";
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
  DialogFooter
} from "@/components/ui/dialog";
import { useFeedbackModal } from "@/components/ui/feedback-modal";

import LetterGeneratorDialog from "./component/letter-generator-dialog";
import { TemplateManagerDialog } from "./component/template-manager-dialog";
import { LetterRecordDialog } from "./component/letter-record-dialog";
import { LetterDetailDialog } from "./component/letter-detail-dialog";
import type { MailItem } from "./component/types";

export type { MailItem };

export default function SuratPage() {
  const [mounted, setMounted] = useState(false);
  const [incoming, setIncoming] = useState<MailItem[]>([]);
  const [outgoing, setOutgoing] = useState<MailItem[]>([]);
  const [activeTab, setActiveTab] = useState<"template" | "masuk" | "keluar">("template");
  const [templateCount, setTemplateCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [mailToDelete, setMailToDelete] = useState<MailItem | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTenant, setActiveTenant] = useState<string>("ALL");
  const [copiedNomor, setCopiedNomor] = useState(false);
  const { showToast, FeedbackModalComponent } = useFeedbackModal();

  // Pagination states
  const [currentIncomingPage, setCurrentIncomingPage] = useState(1);
  const [currentOutgoingPage, setCurrentOutgoingPage] = useState(1);
  const itemsPerPage = 6;

  // Dialog triggers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);

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
          if (
            Array.isArray(parsed) &&
            parsed.some(
              (s: any) =>
                s.nomor?.includes("25.PANPEL") ||
                s.subject?.includes("MAPABA") ||
                s.subject?.includes("Rapat Kerja")
            )
          ) {
            localStorage.removeItem("PMII_SURAT_DATA");
          }
        }
        const localTmpl = localStorage.getItem("PMII_SURAT_TEMPLATES");
        if (localTmpl) {
          const parsed = JSON.parse(localTmpl);
          if (
            Array.isArray(parsed) &&
            parsed.some(
              (t: any) => t.name?.includes("Narasumber") || t.id === "default-1"
            )
          ) {
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

  useEffect(() => {
    setActiveTenant(getActiveTenant() || "ALL");
    const handleTenant = (e: any) => {
      setActiveTenant(e.detail?.activeTenant || "ALL");
      setCurrentIncomingPage(1);
      setCurrentOutgoingPage(1);
    };
    window.addEventListener(TENANT_CHANGED_EVENT, handleTenant);
    return () => window.removeEventListener(TENANT_CHANGED_EVENT, handleTenant);
  }, []);

  useEffect(() => {
    setCurrentIncomingPage(1);
    setCurrentOutgoingPage(1);
  }, [searchQuery, selectedClass, selectedStatus, activeTenant]);

  const filterList = (list: MailItem[]) => {
    return list.filter((item) => {
      const matchesSearch =
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nomor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.senderOrRecipient.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = selectedClass === "ALL" || item.classification === selectedClass;
      const matchesStatus = selectedStatus === "ALL" || item.status === selectedStatus;

      const matchesTenant = isRecordInTenant(currentUser, item, activeTenant);

      return matchesSearch && matchesClass && matchesStatus && matchesTenant;
    });
  };

  const isFiltered =
    searchQuery.trim() !== "" || selectedClass !== "ALL" || selectedStatus !== "ALL";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedClass("ALL");
    setSelectedStatus("ALL");
  };

  const filteredIncoming = filterList(incoming);
  const filteredOutgoing = filterList(outgoing);

  const pendingIncomingCount = filteredIncoming.filter(
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

  const handleSaveRecordedMail = async (newMail: MailItem) => {
    const isMasuk = newMail.type === "MASUK";
    const updatedInc = isMasuk ? [newMail, ...incoming] : incoming;
    const updatedOut = !isMasuk ? [newMail, ...outgoing] : outgoing;

    if (isMasuk) setIncoming(updatedInc);
    else setOutgoing(updatedOut);

    await db.saveSurat([...updatedInc, ...updatedOut]);
    showToast(`Surat ${isMasuk ? "Masuk" : "Keluar"} berhasil dicatat!`);
  };

  const handlePublishCustomLetter = async (data: any) => {
    const items: any[] = Array.isArray(data) ? data : [data];
    if (items.length === 0) return;

    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const dateStr = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

    const newMails: MailItem[] = items.map((item) =>
      enforceTenantWrite<MailItem>(currentUser, {
        id: generateUUID(),
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
    const targetId = mailToDelete.id;
    const targetType = mailToDelete.type;
    const targetFileUrl = mailToDelete.fileUrl;

    try {
      await db.deleteSurat(targetId, targetFileUrl);
      if (targetType === "MASUK") {
        setIncoming((prev) => prev.filter((i) => i.id !== targetId));
      } else {
        setOutgoing((prev) => prev.filter((i) => i.id !== targetId));
      }
      showToast(`Surat nomor ${nomor} berhasil dihapus.`);
    } catch (err) {
      console.error("Gagal menghapus surat:", err);
      showToast(`Gagal menghapus surat nomor ${nomor}.`);
    } finally {
      setMailToDelete(null);
    }
  };

  const handleCopyNomor = (nomor: string) => {
    navigator.clipboard.writeText(nomor);
    setCopiedNomor(true);
    setTimeout(() => setCopiedNomor(false), 2000);
  };

  const getClassificationBadge = (cls: MailItem["classification"]) => {
    const variants = {
      Instruksi:
        "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900",
      Permohonan:
        "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-900",
      Undangan:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900",
      Rekomendasi:
        "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900",
      Keputusan:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
    };
    return (
      <Badge
        className={`${
          variants[cls] || variants.Keputusan
        } text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2 shadow-none`}
      >
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
    <div className="space-y-4 pb-16 font-sans text-zinc-900 dark:text-zinc-100">
      {/* 1. BREADCRUMB & TOP ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Link
            href="/dashboard"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Surat Menyurat
          </span>
          {pendingIncomingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 px-2 py-0.5 rounded-md ml-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              <span>{pendingIncomingCount} perlu tindak lanjut</span>
            </span>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {/* Form Pencatatan Manual */}
          <Button
            onClick={() => setIsAddOpen(true)}
            variant="outline"
            className="h-8.5 px-3 text-xs font-medium border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-2xs cursor-pointer transition-colors bg-white dark:bg-zinc-900"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Catat Surat</span>
          </Button>

          {/* Generator Pembuat Surat Digital */}
          <LetterGeneratorDialog
            onPublish={handlePublishCustomLetter}
            existingMails={outgoing}
            onOpenTemplateManager={() => setIsTemplateManagerOpen(true)}
          />
        </div>
      </div>

      {/* Modal Registrasi Surat Manual */}
      <LetterRecordDialog
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSaveMail={handleSaveRecordedMail}
        outgoing={outgoing}
        currentUser={currentUser}
      />

      {/* Dialog Modal CRUD Kelola Template (untuk dibuka dari Generator Dialog jika diperlukan) */}
      <TemplateManagerDialog
        isOpen={isTemplateManagerOpen}
        onOpenChange={setIsTemplateManagerOpen}
        onTemplatesUpdated={(count) => {
          if (count !== undefined) setTemplateCount(count);
        }}
      />

      {/* 2. TABS SELECTOR (Template Surat di sebelah kiri Surat Masuk) */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-xs font-medium">
        {[
          {
            id: "template" as const,
            label: "Template Surat",
            icon: Bookmark,
            count: templateCount,
            badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
          },
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
                  ? tab.id === "template"
                    ? "border-purple-600 text-purple-600 dark:text-purple-400 font-semibold"
                    : "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
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

      {/* 3. KONTEN TAB */}
      {activeTab === "template" ? (
        /* TAB TEMPLATE SURAT (Inline View) */
        <TemplateManagerDialog
          inline={true}
          onTemplatesUpdated={(count) => {
            if (count !== undefined) setTemplateCount(count);
          }}
        />
      ) : (
        <>
          {/* SEARCH & FILTER TOOLBAR UNTUK SURAT MASUK / SURAT KELUAR */}
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

              {isCabangOrAdmin(currentUser) && (
                <Select
                  value={activeTenant}
                  onValueChange={(val) => {
                    if (val) {
                      setActiveTenant(val);
                      setGlobalActiveTenant(val);
                    }
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg min-w-[150px]">
                    <SelectValue placeholder="Semua Komisariat" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg max-h-60">
                    <SelectItem value="ALL" className="text-xs">Semua Komisariat / Cabang</SelectItem>
                    <SelectItem value="Pengurus Cabang Grobogan" className="text-xs">Pengurus Cabang Grobogan</SelectItem>
                    {DEFAULT_KOMISARIAT_LIST.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

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

          {/* TABEL LIST ARSIP SURAT */}
          {activeData.length === 0 ? (
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
                            <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                              {mail.nomor}
                            </span>
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
                        <div className="flex items-center gap-1.5 mt-1">
                          {isCabangRecord(mail) ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded">
                              🏛️ Tingkat Cabang
                            </span>
                          ) : mail.commissariat ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-1.5 py-0.2 rounded truncate max-w-[150px]">
                              🎓 {mail.commissariat}
                            </span>
                          ) : null}
                        </div>
                        {mail.fileUrl && (
                          <a
                            href={mail.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline mt-0.5 font-medium"
                            onClick={(e) => e.stopPropagation()}
                            title={`Buka berkas ${mail.fileName || "Lampiran"}`}
                          >
                            <Paperclip className="w-2.5 h-2.5 text-blue-500" />
                            <span className="truncate max-w-[180px]">
                              {mail.fileName || "Lampiran Fisik"}
                            </span>
                            <ExternalLink className="w-2 h-2 opacity-60" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5">
                        {getClassificationBadge(mail.classification)}
                      </TableCell>
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

          {/* PAGINATION */}
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
        </>
      )}

      {/* 4. DIALOG DETAIL SURAT */}
      <LetterDetailDialog
        selectedMail={selectedMail}
        onClose={() => setSelectedMail(null)}
        copiedNomor={copiedNomor}
        onCopyNomor={handleCopyNomor}
        showToast={showToast}
        getClassificationBadge={getClassificationBadge}
        getStatusBadge={getStatusBadge}
      />

      {/* 5. DIALOG KONFIRMASI HAPUS */}
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
                  Tindakan ini permanen dan menghapus catatan serta lampiran dari database
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