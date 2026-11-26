"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { db, generateUUID, type UserAccount, type SuratTemplate } from "@/lib/db";
import { resolveStorageUrl, isPrivateStorageRef } from "@/lib/storage";
import {
  isRecordInTenant,
  isCabangRecord,
  enforceTenantWrite,
  getActiveTenant,
  setActiveTenant as setGlobalActiveTenant,
  isCabangOrAdmin,
  DEFAULT_KOMISARIAT_LIST,
  TENANT_CHANGED_EVENT,
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
  Eye,
  Edit3,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Trash2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Paperclip,
  Lock,
  RotateCcw,
  Building,
  GraduationCap,
  QrCode,
  ArrowUpDown,
  X,
  Inbox,
  FileText,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFeedbackModal } from "@/components/ui/feedback-modal";

import LetterGeneratorDialog from "./component/letter-generator-dialog";
import { TemplateManagerDialog } from "./component/template-manager-dialog";
import { LetterRecordDialog } from "./component/letter-record-dialog";
import { LetterDetailDialog } from "./component/letter-detail-dialog";
import {
  extractLetterEditMetadata,
  type BulkLetterMetadata,
} from "./component/letter-generator-helpers";
import type { MailItem } from "./component/types";

export type { MailItem };

type SortMode = "newest" | "oldest" | "nomor_asc";

export default function SuratPage() {
  const pathname = usePathname();
  const staffPrefix = pathname?.startsWith("/admin")
    ? "/admin"
    : pathname?.startsWith("/pengurus")
    ? "/pengurus"
    : pathname?.startsWith("/instruktur")
    ? "/instruktur"
    : "/dashboard";

  const [mounted, setMounted] = useState(false);
  const [incoming, setIncoming] = useState<MailItem[]>([]);
  const [outgoing, setOutgoing] = useState<MailItem[]>([]);
  const [allTemplates, setAllTemplates] = useState<SuratTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<"template" | "masuk" | "keluar">("template");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [editingMail, setEditingMail] = useState<MailItem | null>(null);
  const [mailToDelete, setMailToDelete] = useState<MailItem | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [openingAttachmentId, setOpeningAttachmentId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTenant, setActiveTenant] = useState<string>("ALL");
  const [copiedNomor, setCopiedNomor] = useState(false);
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);
  const { showToast, FeedbackModalComponent } = useFeedbackModal();

  // Pagination states
  const [currentIncomingPage, setCurrentIncomingPage] = useState(1);
  const [currentOutgoingPage, setCurrentOutgoingPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Dialog triggers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGeneratorMail, setEditingGeneratorMail] = useState<MailItem | null>(null);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);

  const refreshTemplates = useCallback(async () => {
    try {
      const tmpls = await db.getSuratTemplates();
      if (tmpls && Array.isArray(tmpls)) {
        setAllTemplates(tmpls);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      queueMicrotask(() => {
        const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
        if (stored) {
          try {
            setCurrentUser(JSON.parse(stored));
          } catch (e) {
            console.error("Error parsing user session:", e);
          }
        }
      });

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
      } catch {
        // ignore
      }
    }

    const fetchAllSuratPaginated = async (): Promise<MailItem[]> => {
      try {
        const pageSize = 200;
        const firstPage = await db.getSuratPaginated({ page: 1, pageSize });
        if (firstPage.totalPages <= 1) {
          return firstPage.data as MailItem[];
        }
        const pageRequests: Promise<{ data: any[] }>[] = [];
        for (let p = 2; p <= firstPage.totalPages; p++) {
          pageRequests.push(db.getSuratPaginated({ page: p, pageSize }));
        }
        const rest = await Promise.all(pageRequests);
        return [
          ...(firstPage.data as MailItem[]),
          ...rest.flatMap((r) => r.data as MailItem[]),
        ];
      } catch {
        const fallback = await db.getSurat();
        return Array.isArray(fallback) ? (fallback as MailItem[]) : [];
      }
    };

    const fetchSurat = async () => {
      const [data] = await Promise.all([fetchAllSuratPaginated(), refreshTemplates()]);
      setIncoming(data.filter((item) => item.type === "MASUK"));
      setOutgoing(data.filter((item) => item.type === "KELUAR"));
      setMounted(true);
    };
    fetchSurat();

    const handleTableSync = (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      if (detail?.table === "surat_templates") {
        void refreshTemplates();
      }
    };
    window.addEventListener("PMII_TABLE_SYNC", handleTableSync);
    return () => {
      window.removeEventListener("PMII_TABLE_SYNC", handleTableSync);
    };
  }, [refreshTemplates]);

  useEffect(() => {
    queueMicrotask(() => setActiveTenant(getActiveTenant() || "ALL"));
    const handleTenant = (e: any) => {
      setActiveTenant(e.detail?.activeTenant || "ALL");
      setCurrentIncomingPage(1);
      setCurrentOutgoingPage(1);
    };
    window.addEventListener(TENANT_CHANGED_EVENT, handleTenant);
    return () => window.removeEventListener(TENANT_CHANGED_EVENT, handleTenant);
  }, []);

  const suratFilterKey = `${searchQuery}|${selectedClass}|${selectedStatus}|${activeTenant}|${sortMode}|${itemsPerPage}`;
  const [prevSuratFilterKey, setPrevSuratFilterKey] = useState(suratFilterKey);
  if (suratFilterKey !== prevSuratFilterKey) {
    setPrevSuratFilterKey(suratFilterKey);
    if (currentIncomingPage !== 1) setCurrentIncomingPage(1);
    if (currentOutgoingPage !== 1) setCurrentOutgoingPage(1);
  }

  const tenantIncoming = useMemo(
    () => incoming.filter((item) => isRecordInTenant(currentUser, item, activeTenant)),
    [incoming, currentUser, activeTenant]
  );

  const tenantOutgoing = useMemo(
    () => outgoing.filter((item) => isRecordInTenant(currentUser, item, activeTenant)),
    [outgoing, currentUser, activeTenant]
  );

  const templateCount = useMemo(
    () =>
      allTemplates.filter((t) =>
        isRecordInTenant(
          currentUser,
          {
            commissariat: t.commissariat,
            komisariat_id: t.komisariat_id,
            tenant_id: t.tenant_id || t.komisariat_id,
          },
          activeTenant
        )
      ).length,
    [allTemplates, currentUser, activeTenant]
  );

  const bulkMetaByMailId = useMemo(() => {
    const map = new Map<string, BulkLetterMetadata>();
    for (const item of [...incoming, ...outgoing]) {
      const meta = extractLetterEditMetadata(item.content);
      if (meta?.mode === "bulk" && meta.bulk && meta.bulk.recipients.length > 0) {
        map.set(item.id, meta.bulk);
      }
    }
    return map;
  }, [incoming, outgoing]);

  const filterAndSortList = useCallback(
    (list: MailItem[]) => {
      const q = searchQuery.trim().toLowerCase();
      const filtered = list.filter((item) => {
        const bulkRecipients = bulkMetaByMailId.get(item.id)?.recipients;
        const matchesSearch =
          !q ||
          item.subject.toLowerCase().includes(q) ||
          item.nomor.toLowerCase().includes(q) ||
          item.senderOrRecipient.toLowerCase().includes(q) ||
          Boolean(bulkRecipients?.some((r) => r.toLowerCase().includes(q)));
        const matchesClass = selectedClass === "ALL" || item.classification === selectedClass;
        const matchesStatus = selectedStatus === "ALL" || item.status === selectedStatus;
        return matchesSearch && matchesClass && matchesStatus;
      });

      const sorted = [...filtered];
      sorted.sort((a, b) => {
        if (sortMode === "nomor_asc") {
          return String(a.nomor || "").localeCompare(String(b.nomor || ""), "id", { numeric: true });
        }
        const tA = new Date(a.created_at || a.date || 0).getTime();
        const tB = new Date(b.created_at || b.date || 0).getTime();
        return sortMode === "oldest" ? tA - tB : tB - tA;
      });
      return sorted;
    },
    [searchQuery, selectedClass, selectedStatus, sortMode, bulkMetaByMailId]
  );

  const filteredIncoming = useMemo(
    () => filterAndSortList(tenantIncoming),
    [filterAndSortList, tenantIncoming]
  );

  const filteredOutgoing = useMemo(
    () => filterAndSortList(tenantOutgoing),
    [filterAndSortList, tenantOutgoing]
  );

  const totalPendingIncoming = useMemo(
    () =>
      tenantIncoming.filter(
        (m) => m.status === "Menunggu Tindak Lanjut" || m.status === "Diproses"
      ).length,
    [tenantIncoming]
  );

  const isFiltered =
    searchQuery.trim() !== "" || selectedClass !== "ALL" || selectedStatus !== "ALL";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedClass("ALL");
    setSelectedStatus("ALL");
    setSortMode("newest");
  };

  const incomingTotalPages = Math.max(1, Math.ceil(filteredIncoming.length / itemsPerPage));
  const currentIncoming = filteredIncoming.slice(
    (currentIncomingPage - 1) * itemsPerPage,
    currentIncomingPage * itemsPerPage
  );

  const outgoingTotalPages = Math.max(1, Math.ceil(filteredOutgoing.length / itemsPerPage));
  const currentOutgoing = filteredOutgoing.slice(
    (currentOutgoingPage - 1) * itemsPerPage,
    currentOutgoingPage * itemsPerPage
  );

  const handleSaveRecordedMail = async (savedMail: MailItem, isEdit: boolean) => {
    const isMasuk = savedMail.type === "MASUK";
    const previousType = editingMail?.type;
    const didChangeType = Boolean(isEdit && previousType && previousType !== savedMail.type);

    const saved = await db.upsertSurat(savedMail);
    if (!saved) {
      throw new Error(
        "Gagal menyimpan arsip surat ke database. Periksa koneksi atau hak akses Anda."
      );
    }

    setIncoming((prev) => {
      const withoutTarget = prev.filter((item) => item.id !== savedMail.id);
      if (!isMasuk) return withoutTarget;
      const existingIdx = prev.findIndex((item) => item.id === savedMail.id);
      if (isEdit && existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = savedMail;
        return copy;
      }
      return [savedMail, ...withoutTarget];
    });

    setOutgoing((prev) => {
      const withoutTarget = prev.filter((item) => item.id !== savedMail.id);
      if (isMasuk) return withoutTarget;
      const existingIdx = prev.findIndex((item) => item.id === savedMail.id);
      if (isEdit && existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = savedMail;
        return copy;
      }
      return [savedMail, ...withoutTarget];
    });

    if (didChangeType) {
      setActiveTab(isMasuk ? "masuk" : "keluar");
    }

    setSelectedMail((prev) => (prev && prev.id === savedMail.id ? savedMail : prev));
    setEditingMail(null);
    showToast(
      didChangeType
        ? `Surat berhasil diperbarui & dipindahkan ke tab Surat ${isMasuk ? "Masuk" : "Keluar"}!`
        : isEdit
        ? `Surat ${isMasuk ? "Masuk" : "Keluar"} berhasil diperbarui!`
        : `Surat ${isMasuk ? "Masuk" : "Keluar"} berhasil dicatat!`
    );
  };

  const handleUpdateGeneratedLetter = async (updatedMail: MailItem) => {
    const saved = await db.upsertSurat(updatedMail);
    if (!saved) {
      throw new Error(
        "Gagal menyimpan perubahan surat ke database. Periksa koneksi atau hak akses Anda."
      );
    }

    setOutgoing((prev) => {
      const idx = prev.findIndex((item) => item.id === updatedMail.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedMail;
        return copy;
      }
      return [updatedMail, ...prev];
    });
    setIncoming((prev) => prev.filter((item) => item.id !== updatedMail.id));
    setSelectedMail((prev) => (prev && prev.id === updatedMail.id ? updatedMail : prev));
    setEditingGeneratorMail(null);
    const updatedBulk = extractLetterEditMetadata(updatedMail.content)?.bulk;
    if (updatedBulk && updatedBulk.recipients.length > 1) {
      showToast(
        `Surat massal "${updatedMail.subject}" (${updatedBulk.recipients.length} penerima) berhasil diperbarui dalam 1 arsip!`
      );
    } else {
      showToast(`Surat Keluar "${updatedMail.subject}" berhasil diperbarui!`);
    }
  };

  const handlePublishCustomLetter = async (data: any) => {
    const items: any[] = Array.isArray(data) ? data : [data];
    if (items.length === 0) return;

    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    const now = new Date();
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    const newMails: MailItem[] = items.map((item) =>
      enforceTenantWrite<MailItem>(
        currentUser,
        {
          id: item.id || generateUUID(),
          nomor: item.nomor,
          type: "KELUAR",
          senderOrRecipient: item.recipient,
          subject: item.subject,
          date: now.toISOString().split("T")[0],
          classification: item.classification,
          status: "Terkirim",
          content: item.content,
          senderTitle: item.senderTitle,
          senderLocation: item.senderLocation,
          dateIndo: item.dateIndo || dateStr,
        },
        activeTenant
      )
    );

    const saved = await db.upsertSuratBatch(newMails);
    if (!saved) {
      showToast(
        "Gagal menyimpan surat yang diterbitkan ke database. Periksa koneksi atau hak akses Anda."
      );
      throw new Error("Gagal menyimpan surat ke database.");
    }
    setOutgoing((prev) => [...newMails, ...prev]);

    const unifiedBulkCount = items.length === 1 ? Number(items[0]?.bulkCount || 0) : 0;
    if (unifiedBulkCount > 1) {
      showToast(
        `Surat massal "${items[0].subject}" (${unifiedBulkCount} penerima) berhasil disimpan sebagai 1 arsip!`
      );
    } else if (items.length > 1) {
      showToast(`${items.length} Surat massal resmi berhasil diterbitkan & dicatat ke arsip!`);
    } else {
      showToast(`Surat resmi "${items[0].subject}" berhasil diterbitkan!`);
    }
  };

  const handleUpdateMailStatus = async (mailId: string, nextStatus: MailItem["status"]) => {
    setUpdatingStatusId(mailId);
    try {
      const updated = await db.updateSurat(mailId, { status: nextStatus });
      if (!updated) {
        showToast("Gagal memperbarui status surat di database.");
        return;
      }
      setIncoming((prev) =>
        prev.map((m) => (m.id === mailId ? { ...m, status: nextStatus } : m))
      );
      setOutgoing((prev) =>
        prev.map((m) => (m.id === mailId ? { ...m, status: nextStatus } : m))
      );
      setSelectedMail((prev) =>
        prev && prev.id === mailId ? { ...prev, status: nextStatus } : prev
      );
      showToast(`Status surat diperbarui menjadi "${nextStatus}".`);
    } catch (err) {
      console.error("Gagal memperbarui status surat:", err);
      showToast("Gagal memperbarui status surat.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleOpenAttachment = async (mail: MailItem) => {
    if (!mail.fileUrl) return;
    setOpeningAttachmentId(mail.id);
    try {
      const resolvedUrl = await resolveStorageUrl(mail.fileUrl);
      if (!resolvedUrl) {
        showToast("Tautan lampiran tidak dapat dimuat.");
        return;
      }
      window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Gagal membuka lampiran surat:", err);
      showToast("Gagal membuka berkas lampiran surat.");
    } finally {
      setOpeningAttachmentId(null);
    }
  };

  const confirmDeleteMail = async () => {
    if (!mailToDelete) return;
    const nomor = mailToDelete.nomor;
    const targetId = mailToDelete.id;
    const targetType = mailToDelete.type;
    const targetFileUrl = mailToDelete.fileUrl;

    try {
      const deleted = await db.deleteSurat(targetId, targetFileUrl);
      if (!deleted) {
        showToast(`Gagal menghapus surat nomor ${nomor} dari database.`);
        return;
      }
      if (targetType === "MASUK") {
        setIncoming((prev) => prev.filter((i) => i.id !== targetId));
      } else {
        setOutgoing((prev) => prev.filter((i) => i.id !== targetId));
      }
      showToast(`Surat nomor ${nomor} berhasil dihapus.`);
    } catch (err) {
      console.error("Gagal menghapus surat:", err);
      showToast("Gagal menghapus surat dari database.");
    } finally {
      setMailToDelete(null);
    }
  };

  const handleCopyNomor = (nomor: string, rowId?: string) => {
    navigator.clipboard?.writeText(nomor).catch(() => {});
    setCopiedNomor(true);
    if (rowId) {
      setCopiedRowId(rowId);
      setTimeout(() => setCopiedRowId((prev) => (prev === rowId ? null : prev)), 1800);
    }
    showToast(`Nomor surat ${nomor} disalin.`);
    setTimeout(() => setCopiedNomor(false), 2000);
  };

  const handleEditAction = (mail: MailItem) => {
    if (mail.type === "KELUAR" || activeTab === "keluar") {
      setEditingGeneratorMail(mail);
    } else {
      setEditingMail(mail);
      setIsAddOpen(true);
    }
  };

  const getClassificationBadge = (cls: MailItem["classification"]) => {
    const variants: Record<string, string> = {
      Instruksi:
        "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900",
      Permohonan:
        "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900",
      Undangan:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900",
      Rekomendasi:
        "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-900",
      Keputusan:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900",
    };
    return (
      <Badge
        className={`${
          variants[cls] || variants.Keputusan
        } text-[10px] font-semibold py-0.5 px-2 rounded-md shadow-none`}
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
      <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[10px] font-semibold uppercase py-0.5 px-2 shadow-none">
        <AlertCircle className="w-3 h-3 mr-1" /> Menunggu Tindak Lanjut
      </Badge>
    );
  };

  const getStatusMeta = (status: MailItem["status"]) => {
    if (status === "Selesai") {
      return {
        shortLabel: "Selesai",
        dotClass: "bg-emerald-500",
        triggerClass:
          "bg-emerald-50/80 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100/70 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
      };
    }
    if (status === "Diproses") {
      return {
        shortLabel: "Diproses",
        dotClass: "bg-amber-500",
        triggerClass:
          "bg-amber-50/80 text-amber-700 border-amber-200/90 hover:bg-amber-100/70 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
      };
    }
    if (status === "Terkirim") {
      return {
        shortLabel: "Terkirim",
        dotClass: "bg-blue-500",
        triggerClass:
          "bg-blue-50/80 text-blue-700 border-blue-200/90 hover:bg-blue-100/70 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
      };
    }
    return {
      shortLabel: "Menunggu",
      dotClass: "bg-rose-500",
      triggerClass:
        "bg-rose-50/80 text-rose-700 border-rose-200/90 hover:bg-rose-100/70 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900",
    };
  };

  const renderStatusDropdown = (mail: MailItem) => {
    const meta = getStatusMeta(mail.status);
    return (
      <Select
        value={mail.status}
        disabled={updatingStatusId === mail.id}
        onValueChange={(val) => {
          const nextStatus = val as MailItem["status"];
          if (nextStatus && nextStatus !== mail.status) {
            void handleUpdateMailStatus(mail.id, nextStatus);
          }
        }}
      >
        <SelectTrigger
          aria-label={`Ubah status surat ${mail.nomor}`}
          size="sm"
          className={`w-auto min-w-[116px] data-[size=sm]:h-7 rounded-full px-2.5 text-[11px] font-semibold border shadow-none cursor-pointer transition-colors ${meta.triggerClass}`}
        >
          <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotClass}`} />
            <SelectValue placeholder={meta.shortLabel}>{meta.shortLabel}</SelectValue>
          </span>
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl min-w-[180px]">
          {mail.type === "MASUK" ? (
            <>
              <SelectItem value="Menunggu Tindak Lanjut" className="text-xs">
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Menunggu Tindak Lanjut</span>
                </span>
              </SelectItem>
              <SelectItem value="Diproses" className="text-xs">
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Diproses</span>
                </span>
              </SelectItem>
              <SelectItem value="Selesai" className="text-xs">
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Selesai</span>
                </span>
              </SelectItem>
            </>
          ) : (
            <>
              <SelectItem value="Terkirim" className="text-xs">
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span>Terkirim</span>
                </span>
              </SelectItem>
              <SelectItem value="Diproses" className="text-xs">
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Diproses</span>
                </span>
              </SelectItem>
              <SelectItem value="Selesai" className="text-xs">
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Selesai</span>
                </span>
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
    );
  };

  if (!mounted) {
    return (
      <div className="space-y-5 pb-12 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="h-3 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-6 w-60 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-9 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-2xl" />
          ))}
        </div>
        <div className="h-11 w-96 max-w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        <div className="h-80 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-2xl" />
      </div>
    );
  }

  const activeData = activeTab === "masuk" ? currentIncoming : currentOutgoing;
  const activeTotalFiltered =
    activeTab === "masuk" ? filteredIncoming.length : filteredOutgoing.length;
  const activeCurrentPage =
    activeTab === "masuk" ? currentIncomingPage : currentOutgoingPage;
  const activeTotalPages = activeTab === "masuk" ? incomingTotalPages : outgoingTotalPages;
  const setActivePage =
    activeTab === "masuk" ? setCurrentIncomingPage : setCurrentOutgoingPage;

  const isAdminCabang = isCabangOrAdmin(currentUser);
  const currentScopeLabel = isAdminCabang
    ? activeTenant === "ALL" || activeTenant === "Semua Komisariat"
      ? "Seluruh Cabang & Komisariat"
      : activeTenant
    : currentUser?.commissariat || "Lingkup Komisariat";

  return (
    <div className="space-y-5 pb-16 font-sans text-zinc-900 dark:text-zinc-100">
      {/* 1. HEADER HALAMAN & AKSI UTAMA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Link
              href={staffPrefix}
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Surat Menyurat
            </span>
          </nav>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Administrasi Persuratan
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {isAdminCabang && (activeTenant === "ALL" || activeTenant.toLowerCase().includes("cabang")) ? (
                <Building className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              ) : (
                <GraduationCap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>{currentScopeLabel}</span>
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Kelola template Word (.docx), arsip surat masuk, dan penerbitan surat keluar resmi ber-QR verifikasi.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            type="button"
            onClick={() => {
              setEditingMail(null);
              setIsAddOpen(true);
            }}
            variant="outline"
            className="h-9 px-3.5 text-xs font-semibold border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 shadow-2xs cursor-pointer transition-colors bg-white dark:bg-zinc-900"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Catat Surat</span>
          </Button>

          {/* Generator & Editor Pembuat Surat Digital */}
          <LetterGeneratorDialog
            onPublish={handlePublishCustomLetter}
            onUpdateMail={handleUpdateGeneratedLetter}
            editingMail={editingGeneratorMail}
            onCloseEdit={() => setEditingGeneratorMail(null)}
            onOpenArchiveEdit={(mail) => {
              setEditingGeneratorMail(null);
              setEditingMail(mail);
              setIsAddOpen(true);
            }}
            existingMails={tenantOutgoing}
            currentUser={currentUser}
            activeTenant={activeTenant}
            onOpenTemplateManager={() => setIsTemplateManagerOpen(true)}
          />
        </div>
      </div>

      {/* 2. RINGKASAN STATISTIK (KLIK UNTUK PINDAH TAB / FILTER CEPAT) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab("template");
          }}
          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            activeTab === "template"
              ? "bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 shadow-2xs"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-purple-200 dark:hover:border-purple-900"
          }`}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
              Template Word
            </p>
            <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-0.5 tabular-nums">
              {templateCount}
            </p>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium mt-0.5 truncate">
              Format master .docx
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100/80 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Bookmark className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("masuk");
            setSelectedStatus("ALL");
          }}
          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            activeTab === "masuk" && selectedStatus === "ALL"
              ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 shadow-2xs"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-900"
          }`}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
              Surat Masuk
            </p>
            <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-0.5 tabular-nums">
              {tenantIncoming.length}
            </p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5 truncate">
              Total arsip diterima
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100/80 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Inbox className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("masuk");
            setSelectedStatus("Menunggu Tindak Lanjut");
          }}
          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            activeTab === "masuk" && selectedStatus === "Menunggu Tindak Lanjut"
              ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-2xs"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-amber-200 dark:hover:border-amber-900"
          }`}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
              Perlu Tindak Lanjut
            </p>
            <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-0.5 tabular-nums">
              {totalPendingIncoming}
            </p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 truncate">
              {totalPendingIncoming > 0 ? "Klik untuk tinjau" : "Semua tertangani"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100/80 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("keluar");
            setSelectedStatus("ALL");
          }}
          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            activeTab === "keluar"
              ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shadow-2xs"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-emerald-200 dark:hover:border-emerald-900"
          }`}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
              Surat Keluar
            </p>
            <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-0.5 tabular-nums">
              {tenantOutgoing.length}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 truncate">
              Terverifikasi QR Code
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Send className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Modal Registrasi & Edit Surat Manual */}
      <LetterRecordDialog
        isOpen={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setEditingMail(null);
        }}
        onSaveMail={handleSaveRecordedMail}
        outgoing={tenantOutgoing}
        incoming={tenantIncoming}
        currentUser={currentUser}
        activeTenant={activeTenant}
        editingMail={editingMail}
      />

      {/* Dialog Modal CRUD Kelola Template (saat dibuka dari Generator Dialog) */}
      {isTemplateManagerOpen && (
        <TemplateManagerDialog
          isOpen={isTemplateManagerOpen}
          onOpenChange={setIsTemplateManagerOpen}
          currentUser={currentUser}
          activeTenant={activeTenant}
          onTemplatesUpdated={() => {
            void refreshTemplates();
          }}
        />
      )}

      {/* 3. SEGMENTED NAVIGATION BAR + FILTER TENANT TERPADU */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Kategori Persuratan"
          className="inline-flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-x-auto max-w-full"
        >
          {[
            {
              id: "template" as const,
              label: "Template Surat",
              icon: Bookmark,
              count: templateCount,
              activeText: "text-purple-700 dark:text-purple-300",
              badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
            },
            {
              id: "masuk" as const,
              label: "Surat Masuk",
              icon: Mail,
              count: tenantIncoming.length,
              activeText: "text-blue-700 dark:text-blue-300",
              badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
            },
            {
              id: "keluar" as const,
              label: "Surat Keluar",
              icon: Send,
              count: tenantOutgoing.length,
              activeText: "text-emerald-700 dark:text-emerald-300",
              badgeColor:
                "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedStatus("ALL");
                }}
                className={`px-3.5 py-2 rounded-lg text-xs cursor-pointer transition-all flex items-center gap-2 shrink-0 border-none ${
                  isActive
                    ? `bg-white dark:bg-zinc-800 ${tab.activeText} font-bold shadow-xs`
                    : "bg-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none tabular-nums ${
                    isActive
                      ? tab.badgeColor
                      : "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Tenant Terpadu untuk Admin Cabang (aktif di semua tab termasuk Template!) */}
        {isAdminCabang && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 hidden md:inline shrink-0">
              Lingkup:
            </span>
            <Select
              value={activeTenant}
              onValueChange={(val) => {
                if (val) {
                  setActiveTenant(val);
                  setGlobalActiveTenant(val);
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[220px] data-[size=default]:h-9 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl">
                <SelectValue placeholder="Semua Komisariat / Cabang">
                  {activeTenant === "ALL" || activeTenant === "Semua Komisariat"
                    ? "Semua Komisariat / Cabang"
                    : activeTenant}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl max-h-60">
                <SelectItem value="ALL" className="text-xs">
                  Semua Komisariat / Cabang
                </SelectItem>
                <SelectItem value="Pengurus Cabang Grobogan" className="text-xs">
                  Pengurus Cabang Grobogan
                </SelectItem>
                {DEFAULT_KOMISARIAT_LIST.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* 4. KONTEN TAB */}
      {activeTab === "template" ? (
        <TemplateManagerDialog
          inline={true}
          currentUser={currentUser}
          activeTenant={activeTenant}
          onTemplatesUpdated={() => {
            void refreshTemplates();
          }}
        />
      ) : (
        <div className="space-y-3.5">
          {/* SEARCH, FILTER & SORT TOOLBAR */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl shadow-2xs space-y-2.5">
            <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
              {/* Search Box dengan Tombol Clear */}
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="text"
                  placeholder={
                    activeTab === "masuk"
                      ? "Cari perihal, nomor surat, atau instansi pengirim..."
                      : "Cari perihal, nomor surat, atau instansi tujuan..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer bg-transparent border-none p-0"
                    aria-label="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter & Sort Controls (Sejajar 1 baris rapi di desktop, grid 3 kolom di tablet) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:items-center gap-2 shrink-0">
                <Select
                  value={selectedClass}
                  onValueChange={(val) => val && setSelectedClass(val)}
                >
                  <SelectTrigger
                    aria-label="Filter Klasifikasi"
                    className="w-full lg:w-[155px] data-[size=default]:h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl font-medium text-zinc-700 dark:text-zinc-200"
                  >
                    <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <SelectValue placeholder="Semua Klasifikasi">
                        {selectedClass === "ALL" ? "Semua Klasifikasi" : selectedClass}
                      </SelectValue>
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <SelectItem value="ALL" className="text-xs">Semua Klasifikasi</SelectItem>
                    <SelectItem value="Instruksi" className="text-xs">Instruksi</SelectItem>
                    <SelectItem value="Permohonan" className="text-xs">Permohonan</SelectItem>
                    <SelectItem value="Undangan" className="text-xs">Undangan</SelectItem>
                    <SelectItem value="Rekomendasi" className="text-xs">Rekomendasi</SelectItem>
                    <SelectItem value="Keputusan" className="text-xs">Keputusan</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedStatus}
                  onValueChange={(val) => val && setSelectedStatus(val)}
                >
                  <SelectTrigger
                    aria-label="Filter Status"
                    className="w-full lg:w-[165px] data-[size=default]:h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl font-medium text-zinc-700 dark:text-zinc-200"
                  >
                    <SelectValue placeholder="Semua Status">
                      {selectedStatus === "ALL" ? "Semua Status" : selectedStatus}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                    {activeTab === "masuk" ? (
                      <>
                        <SelectItem value="Menunggu Tindak Lanjut" className="text-xs">
                          Menunggu Tindak Lanjut
                        </SelectItem>
                        <SelectItem value="Diproses" className="text-xs">Diproses</SelectItem>
                        <SelectItem value="Selesai" className="text-xs">Selesai</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Terkirim" className="text-xs">Terkirim</SelectItem>
                        <SelectItem value="Diproses" className="text-xs">Diproses</SelectItem>
                        <SelectItem value="Selesai" className="text-xs">Selesai</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={sortMode}
                  onValueChange={(val) => val && setSortMode(val as SortMode)}
                >
                  <SelectTrigger
                    aria-label="Urutkan Surat"
                    className="w-full lg:w-[136px] data-[size=default]:h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl font-medium text-zinc-700 dark:text-zinc-200"
                  >
                    <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                      <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <SelectValue placeholder="Terbaru">
                        {sortMode === "newest"
                          ? "Terbaru"
                          : sortMode === "oldest"
                          ? "Terlama"
                          : "Nomor Surat"}
                      </SelectValue>
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <SelectItem value="newest" className="text-xs">Terbaru</SelectItem>
                    <SelectItem value="oldest" className="text-xs">Terlama</SelectItem>
                    <SelectItem value="nomor_asc" className="text-xs">Nomor Surat</SelectItem>
                  </SelectContent>
                </Select>

                {isFiltered && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-9 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center gap-1 px-2.5 rounded-xl cursor-pointer sm:col-span-3 lg:col-span-1 shrink-0"
                    title="Reset pencarian dan filter"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filter Chips */}
            {isFiltered && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px]">
                <span className="text-zinc-400 mr-1">Filter aktif:</span>
                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900">
                    <span>Cari: &ldquo;{searchQuery.trim()}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="cursor-pointer bg-transparent border-none p-0 text-current hover:opacity-75"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedClass !== "ALL" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    <span>Klasifikasi: {selectedClass}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedClass("ALL")}
                      className="cursor-pointer bg-transparent border-none p-0 text-current hover:opacity-75"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedStatus !== "ALL" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-900">
                    <span>Status: {selectedStatus}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedStatus("ALL")}
                      className="cursor-pointer bg-transparent border-none p-0 text-current hover:opacity-75"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* DAFTAR SURAT (EMPTY STATE / DESKTOP TABLE / MOBILE CARDS) */}
          {activeData.length === 0 ? (
            <div className="p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center flex flex-col items-center justify-center space-y-3 bg-white dark:bg-zinc-900">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                {isFiltered ? (
                  <Search className="w-5 h-5" />
                ) : activeTab === "masuk" ? (
                  <Inbox className="w-5 h-5" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {isFiltered
                    ? "Tidak Ada Surat yang Sesuai"
                    : activeTab === "masuk"
                    ? "Belum Ada Arsip Surat Masuk"
                    : "Belum Ada Surat Keluar Diterbitkan"}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  {isFiltered
                    ? "Coba ubah kata kunci pencarian atau reset filter untuk melihat seluruh arsip surat."
                    : activeTab === "masuk"
                    ? "Catat surat yang masuk ke sekretariat lengkap dengan lampiran PDF atau foto scan fisiknya."
                    : "Buat surat keluar resmi menggunakan Template Word (.docx) agar langsung dilengkapi QR verifikasi."}
                </p>
              </div>
              <div className="pt-1 flex items-center gap-2 flex-wrap justify-center">
                {isFiltered ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetFilters}
                    className="h-9 px-4 text-xs rounded-xl gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Filter</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      setEditingMail(null);
                      setIsAddOpen(true);
                    }}
                    className="h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {activeTab === "masuk" ? "Catat Surat Masuk Pertama" : "Catat Surat Manual"}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* DESKTOP VIEW: TABEL MODERN TANPA DEAD SPACE */}
              <div className="hidden md:block rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
                <Table>
                  <TableHeader className="bg-zinc-50/90 dark:bg-zinc-950/70">
                    <TableRow className="border-b border-zinc-200/80 dark:border-zinc-800 hover:bg-transparent">
                      <TableHead className="w-[240px] font-semibold text-[11px] uppercase tracking-wider pl-5 py-3 text-zinc-500 dark:text-zinc-400">
                        Nomor &amp; Tanggal
                      </TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider py-3 text-zinc-500 dark:text-zinc-400">
                        Perihal &amp; Detail
                      </TableHead>
                      <TableHead className="w-[180px] font-semibold text-[11px] uppercase tracking-wider py-3 text-zinc-500 dark:text-zinc-400">
                        {activeTab === "masuk" ? "Pengirim" : "Tujuan"}
                      </TableHead>
                      <TableHead className="w-[120px] font-semibold text-[11px] uppercase tracking-wider py-3 text-zinc-500 dark:text-zinc-400">
                        Klasifikasi
                      </TableHead>
                      <TableHead className="w-[148px] font-semibold text-[11px] uppercase tracking-wider py-3 text-zinc-500 dark:text-zinc-400">
                        Status
                      </TableHead>
                      <TableHead className="w-[152px] font-semibold text-[11px] uppercase tracking-wider text-right pr-5 py-3 text-zinc-500 dark:text-zinc-400">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeData.map((mail) => (
                      <TableRow
                        key={mail.id}
                        onClick={() => setSelectedMail(mail)}
                        className="border-b border-zinc-100 dark:border-zinc-800/70 last:border-b-0 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                      >
                        {/* Nomor & Tanggal */}
                        <TableCell className="pl-5 py-3.5 align-middle">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">
                                {mail.nomor}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyNomor(mail.nomor, mail.id);
                                }}
                                className={`h-5 w-5 rounded-md flex items-center justify-center transition-all border-none cursor-pointer bg-transparent ${
                                  copiedRowId === mail.id
                                    ? "opacity-100 text-emerald-600"
                                    : "opacity-35 group-hover:opacity-100 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/70 dark:hover:bg-zinc-700"
                                }`}
                                title="Salin nomor surat"
                              >
                                {copiedRowId === mail.id ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                              <Calendar className="w-3 h-3 shrink-0" />
                              <span>{mail.dateIndo || mail.date}</span>
                            </span>
                          </div>
                        </TableCell>

                        {/* Perihal & Detail Metadata Tenang */}
                        <TableCell className="py-3.5 align-middle">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p
                                className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1"
                                title={mail.subject}
                              >
                                {mail.subject}
                              </p>
                              {bulkMetaByMailId.get(mail.id) &&
                                (bulkMetaByMailId.get(mail.id)?.recipients.length ?? 0) > 1 && (
                                  <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900 text-[10px] font-semibold py-0 px-1.5 rounded-md shadow-none shrink-0 inline-flex items-center gap-1">
                                    <Users className="w-2.5 h-2.5" />
                                    <span>
                                      Massal · {bulkMetaByMailId.get(mail.id)?.recipients.length}
                                    </span>
                                  </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap text-[11px] text-zinc-500 dark:text-zinc-400">
                              {isCabangRecord(mail) ? (
                                <span className="inline-flex items-center gap-1 font-medium text-zinc-500 dark:text-zinc-400">
                                  <Building className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>Pengurus Cabang</span>
                                </span>
                              ) : mail.commissariat ? (
                                <span
                                  className="inline-flex items-center gap-1 font-medium text-zinc-500 dark:text-zinc-400 max-w-[260px]"
                                  title={mail.commissariat}
                                >
                                  <GraduationCap className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                                  <span className="truncate">{mail.commissariat}</span>
                                </span>
                              ) : null}

                              {mail.fileUrl && (
                                <>
                                  <span className="text-zinc-300 dark:text-zinc-700 select-none">•</span>
                                  <button
                                    type="button"
                                    disabled={openingAttachmentId === mail.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void handleOpenAttachment(mail);
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium bg-transparent border-none p-0 cursor-pointer disabled:opacity-50"
                                    title={`Buka lampiran ${mail.fileName || "Berkas"}`}
                                  >
                                    {isPrivateStorageRef(mail.fileUrl) ? (
                                      <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    ) : (
                                      <Paperclip className="w-3 h-3 shrink-0" />
                                    )}
                                    <span className="truncate max-w-[170px]">
                                      {openingAttachmentId === mail.id
                                        ? "Membuka..."
                                        : mail.fileName || "Lampiran"}
                                    </span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Pengirim / Tujuan */}
                        <TableCell className="py-3.5 align-middle">
                          <p
                            className="text-xs font-medium text-zinc-700 dark:text-zinc-300 line-clamp-2"
                            title={
                              bulkMetaByMailId.get(mail.id)?.recipients.length
                                ? bulkMetaByMailId.get(mail.id)!.recipients.join(", ")
                                : mail.senderOrRecipient
                            }
                          >
                            {mail.senderOrRecipient}
                          </p>
                        </TableCell>

                        {/* Klasifikasi */}
                        <TableCell className="py-3.5 align-middle">
                          {getClassificationBadge(mail.classification)}
                        </TableCell>

                        {/* Status Pill Dropdown Modern */}
                        <TableCell
                          className="py-3.5 align-middle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {renderStatusDropdown(mail)}
                        </TableCell>

                        {/* Aksi Pill Group Rapi */}
                        <TableCell
                          className="text-right pr-5 py-3.5 align-middle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800">
                            {mail.type === "KELUAR" && (
                              <Link
                                href={`/verifikasi-surat/${mail.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-7 w-7 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center justify-center transition-colors"
                                title="Buka Halaman Verifikasi QR"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </Link>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setSelectedMail(mail)}
                              className="h-7 w-7 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                              title="Lihat Detail Surat"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleEditAction(mail)}
                              className="h-7 w-7 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/50 text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
                              title={
                                mail.type === "KELUAR" || activeTab === "keluar"
                                  ? "Edit Surat Keluar"
                                  : "Edit Arsip Surat"
                              }
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setMailToDelete(mail)}
                              className="h-7 w-7 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                              title="Hapus Surat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* MOBILE VIEW: KARTU RESPONSIF TANPA SCROLL HORIZONTAL */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {activeData.map((mail) => (
                  <div
                    key={mail.id}
                    onClick={() => setSelectedMail(mail)}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3 shadow-2xs active:scale-[0.99] transition-transform cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 truncate">
                            {mail.nomor}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyNomor(mail.nomor, mail.id);
                            }}
                            className="h-5 w-5 rounded flex items-center justify-center text-zinc-400 border-none bg-transparent cursor-pointer shrink-0"
                            aria-label="Salin nomor surat"
                          >
                            {copiedRowId === mail.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{mail.dateIndo || mail.date}</span>
                        </p>
                      </div>
                      {getClassificationBadge(mail.classification)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                          {mail.subject}
                        </p>
                        {bulkMetaByMailId.get(mail.id) &&
                          (bulkMetaByMailId.get(mail.id)?.recipients.length ?? 0) > 1 && (
                            <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900 text-[10px] font-semibold py-0 px-1.5 rounded-md shadow-none inline-flex items-center gap-1">
                              <Users className="w-2.5 h-2.5" />
                              <span>
                                Massal · {bulkMetaByMailId.get(mail.id)?.recipients.length}
                              </span>
                            </Badge>
                          )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <FileText className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {activeTab === "masuk" ? "Dari: " : "Kepada: "}
                          <strong className="text-zinc-700 dark:text-zinc-300 font-medium">
                            {mail.senderOrRecipient}
                          </strong>
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-zinc-500 dark:text-zinc-400">
                      {isCabangRecord(mail) ? (
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Building className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Pengurus Cabang</span>
                        </span>
                      ) : mail.commissariat ? (
                        <span className="inline-flex items-center gap-1 font-medium truncate max-w-[200px]">
                          <GraduationCap className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="truncate">{mail.commissariat}</span>
                        </span>
                      ) : null}

                      {mail.fileUrl && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-700">•</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleOpenAttachment(mail);
                            }}
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium bg-transparent border-none p-0 cursor-pointer"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span className="truncate max-w-[140px]">
                              {mail.fileName || "Lampiran"}
                            </span>
                          </button>
                        </>
                      )}
                    </div>

                    <div
                      className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderStatusDropdown(mail)}

                      <div className="flex items-center gap-1">
                        {mail.type === "KELUAR" && (
                          <Link
                            href={`/verifikasi-surat/${mail.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center"
                            title="Verifikasi QR"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAction(mail)}
                          className="h-8 px-2.5 text-[11px] font-semibold rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3 text-amber-600" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setMailToDelete(mail)}
                          className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* PAGINATION & PER-PAGE CONTROL */}
          {activeTotalFiltered > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 px-1">
              <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <span>
                  Menampilkan{" "}
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    {(activeCurrentPage - 1) * itemsPerPage + 1}–
                    {Math.min(activeCurrentPage * itemsPerPage, activeTotalFiltered)}
                  </strong>{" "}
                  dari <strong className="text-zinc-900 dark:text-zinc-100">{activeTotalFiltered}</strong>{" "}
                  surat
                </span>

                <select
                  aria-label="Jumlah surat per halaman"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="h-7 text-[11px] font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 text-zinc-700 dark:text-zinc-300 cursor-pointer focus:outline-none"
                >
                  <option value={6}>6 / hal</option>
                  <option value={10}>10 / hal</option>
                  <option value={20}>20 / hal</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActivePage((p) => Math.max(p - 1, 1))}
                  disabled={activeCurrentPage === 1}
                  className="h-8 px-2.5 text-xs rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-40 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </Button>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 px-2.5 tabular-nums">
                  {activeCurrentPage} / {activeTotalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActivePage((p) => Math.min(p + 1, activeTotalPages))}
                  disabled={activeCurrentPage >= activeTotalPages}
                  className="h-8 px-2.5 text-xs rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-40 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. DIALOG DETAIL SURAT */}
      <LetterDetailDialog
        selectedMail={selectedMail}
        onClose={() => setSelectedMail(null)}
        copiedNomor={copiedNomor}
        onCopyNomor={handleCopyNomor}
        showToast={showToast}
        getClassificationBadge={getClassificationBadge}
        getStatusBadge={getStatusBadge}
        onUpdateStatus={handleUpdateMailStatus}
        onEditMail={(mail) => {
          setSelectedMail(null);
          if (mail.type === "KELUAR") {
            setEditingGeneratorMail(mail);
          } else {
            setEditingMail(mail);
            setIsAddOpen(true);
          }
        }}
      />

      {/* 6. DIALOG KONFIRMASI HAPUS */}
      <Dialog open={!!mailToDelete} onOpenChange={(open) => !open && setMailToDelete(null)}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-md w-full p-0 overflow-hidden">
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
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

          <div className="p-5 sm:p-6 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Apakah Anda yakin ingin menghapus arsip surat nomor{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
              {mailToDelete?.nomor}
            </span>
            ? Data yang telah dihapus tidak dapat dipulihkan.
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMailToDelete(null)}
              className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteMail}
              className="h-9 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-700 cursor-pointer"
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
