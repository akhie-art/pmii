"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Printer,
  X,
  Plus,
  Trash2,
  Sparkles,
  Check,
  Info,
  Bookmark,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  Loader2,
  FileCode,
  MapPin,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Copy,
  RotateCcw,
  Upload,
  FileSpreadsheet,
  Tag,
  Eye,
  Edit3,
  Layers,
  Paperclip,
  Save
} from "lucide-react";
import PizZip from "pizzip";
import { exportToExcel, readSpreadsheetTo2DArray } from "@/lib/excel";
import { sanitizeLetterHtml, escapeHtml } from "@/lib/sanitize";
import { toast } from "sonner";
import { db, generateUUID, SuratTemplate, type UserAccount } from "@/lib/db";
import { isRecordInTenant, enforceTenantWrite } from "@/lib/tenancy";
import {
  base64ToArrayBuffer,
  arrayBufferToBase64,
  getDocxArrayBuffer,
  fillDocxTemplate,
  parseTemplateContent,
  downloadDocxBlob,
  type DocxQrFooterOptions
} from "./docx-template-helper";
import {
  renderDocxToElement,
  buildPrintFontContext,
  buildDocxPrintStyleBlock,
  buildPrintAutoTriggerScript,
} from "./docx-preview-helper";
import {
  generateLetterQrDataUrl,
  buildHtmlQrFooter,
  upsertHtmlQrFooter,
  stripHtmlQrFooter
} from "./letter-qr-helper";
import { LetterNumberingBoxes } from "./letter-numbering-boxes";
import { LetterExcelImporter } from "./letter-excel-importer";
import { LetterDocxPlaceholders } from "./letter-docx-placeholders";
import { LetterSignatureStampPanel } from "./letter-signature-stamp-panel";
import { LetterOverlayCanvas } from "./letter-overlay-canvas";
import {
  injectOverlaysIntoLetterHtml,
  stripLetterOverlaysFromHtml,
  loadSavedOverlayAssets,
  saveOverlayAssetToLibrary,
  deleteOverlayAssetFromLibrary,
  type LetterImageOverlay,
  type SavedOverlayAsset,
} from "./letter-overlay-helper";
import {
  isCoreStandardKey,
  buildLetterMergeData,
  humanizePlaceholderKey,
  isMultilineField,
  openLetterPrintWindow,
  parsePmiiNomorToBoxes,
  parseBulkRangeNomor,
  getMaxSequenceFromNomor,
  expandNomorOccurrences,
  formatBulkNomorSummary,
  formatBulkRecipientSummary,
  deduplicateBulkPagesHtml,
  embedLetterEditMetadata,
  extractLetterEditMetadata,
  stripLetterEditMetadata,
  type LetterEditMetadata,
} from "./letter-generator-helpers";
import {
  filterMailsForSameTenant,
  formatDateToIndo,
  isFormattedHtmlContent,
  normalizeMailStatusForType,
  parseMailDateToIso,
  resolveTargetRecordTenant,
} from "./letter-record-helper";
import type { MailItem } from "./types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";

interface LetterGeneratorDialogProps {
  onPublish: (
    newMailData:
      | {
          id?: string;
          nomor: string;
          recipient: string;
          subject: string;
          classification: "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi";
          content: string;
          senderTitle: string;
          senderLocation: string;
          dateIndo?: string;
          bulkCount?: number;
        }
      | Array<{
          id?: string;
          nomor: string;
          recipient: string;
          subject: string;
          classification: "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi";
          content: string;
          senderTitle: string;
          senderLocation: string;
          dateIndo?: string;
          bulkCount?: number;
        }>
  ) => void | Promise<void>;
  onUpdateMail?: (updatedMail: MailItem) => void | Promise<void>;
  editingMail?: MailItem | null;
  onCloseEdit?: () => void;
  onOpenArchiveEdit?: (mail: MailItem) => void;
  existingMails?: any[];
  onOpenTemplateManager?: () => void;
  defaultMode?: "single" | "bulk";
  currentUser?: UserAccount | null;
  activeTenant?: string;
}

const EXISTING_DOCUMENT_TEMPLATE_ID = "__existing_document__";

export default function LetterGeneratorDialog({
  onPublish,
  onUpdateMail,
  editingMail = null,
  onCloseEdit,
  onOpenArchiveEdit,
  existingMails,
  onOpenTemplateManager,
  defaultMode = "single",
  currentUser = null,
  activeTenant = "ALL"
}: LetterGeneratorDialogProps) {
  const isEditMode = Boolean(editingMail);
  const targetTenantInfo = React.useMemo(
    () => resolveTargetRecordTenant(editingMail, currentUser, activeTenant),
    [editingMail, currentUser, activeTenant]
  );
  const isCabangScope = targetTenantInfo.isCabang;

  const [isOpen, setIsOpen] = useState(false);
  const dialogOpen = isOpen || isEditMode;
  const [letterMode, setLetterMode] = useState<"single" | "bulk">(defaultMode);
  const [mailHistory, setMailHistory] = useState<any[]>(existingMails || []);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const [duplicateConfirmMode, setDuplicateConfirmMode] = useState<"single" | "bulk" | null>(null);
  const [editStatus, setEditStatus] = useState<MailItem["status"]>("Terkirim");
  const [useCustomNomor, setUseCustomNomor] = useState<boolean>(false);
  const [customNomorInput, setCustomNomorInput] = useState<string>("");
  const [savedExistingHtml, setSavedExistingHtml] = useState<string>("");
  const [plainTextFallbackNote, setPlainTextFallbackNote] = useState<string>("");
  const [pendingEditTemplateMeta, setPendingEditTemplateMeta] = useState<LetterEditMetadata | null>(null);
  const [savingEditAction, setSavingEditAction] = useState<"save" | "save_print" | null>(null);
  const isSavingEdit = savingEditAction !== null;
  const printAfterSaveRef = useRef<boolean>(false);
  const canvasTextareaRef = useRef<HTMLDivElement>(null);
  const canvasStageRef = useRef<HTMLDivElement>(null);

  // States upload gambar Tanda Tangan & Stempel Organisasi
  const [letterOverlays, setLetterOverlays] = useState<LetterImageOverlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [overlayRawMap, setOverlayRawMap] = useState<Record<string, string>>({});
  const [savedOverlayAssets, setSavedOverlayAssets] = useState<SavedOverlayAsset[]>([]);
  const [overlayPageCount, setOverlayPageCount] = useState<number>(1);
  const [canvasRenderVersion, setCanvasRenderVersion] = useState<number>(0);

  const overlayTenantKey =
    targetTenantInfo.tenantId || targetTenantInfo.tenantOverrideForWrite || activeTenant || "default";

  useEffect(() => {
    if (!dialogOpen) return;
    queueMicrotask(() => {
      setSavedOverlayAssets(loadSavedOverlayAssets(overlayTenantKey));
    });
  }, [dialogOpen, overlayTenantKey]);

  const handleAddLetterOverlay = React.useCallback(
    (overlay: LetterImageOverlay, rawDataUrl?: string) => {
      setLetterOverlays((prev) => [...prev, overlay]);
      setSelectedOverlayId(overlay.id);
      if (rawDataUrl) {
        setOverlayRawMap((prev) => ({ ...prev, [overlay.id]: rawDataUrl }));
      }
    },
    []
  );

  const handleUpdateLetterOverlay = React.useCallback(
    (id: string, patch: Partial<LetterImageOverlay>) => {
      setLetterOverlays((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    []
  );

  const handleDuplicateLetterOverlay = React.useCallback((id: string) => {
    const newId = `ov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    let duplicated = false;
    setLetterOverlays((prev) => {
      const target = prev.find((item) => item.id === id);
      if (!target) return prev;
      duplicated = true;
      const copy: LetterImageOverlay = {
        ...target,
        id: newId,
        label: `${target.label} (Salinan)`,
        xPct: Math.min(85, target.xPct + 4),
        yPct: Math.min(85, target.yPct + 3),
      };
      return [...prev, copy];
    });
    setOverlayRawMap((prev) => (prev[id] ? { ...prev, [newId]: prev[id] } : prev));
    if (duplicated) {
      setSelectedOverlayId(newId);
    } else {
      queueMicrotask(() => setSelectedOverlayId(newId));
    }
  }, []);

  const handleRemoveLetterOverlay = React.useCallback((id: string) => {
    setLetterOverlays((prev) => prev.filter((item) => item.id !== id));
    setSelectedOverlayId((prev) => (prev === id ? null : prev));
    setOverlayRawMap((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleSaveOverlayAssetToLibrary = React.useCallback(
    (overlay: LetterImageOverlay) => {
      const updated = saveOverlayAssetToLibrary(
        {
          id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          kind: overlay.kind,
          label: overlay.label,
          dataUrl: overlay.dataUrl,
          aspectRatio: overlay.aspectRatio,
          transparentBg: overlay.transparentBg,
          createdAt: new Date().toISOString(),
        },
        overlayTenantKey
      );
      setSavedOverlayAssets(updated);
      toast.success(`"${overlay.label}" disimpan ke koleksi untuk dipakai ulang di surat berikutnya.`);
    },
    [overlayTenantKey]
  );

  const handleDeleteSavedOverlayAsset = React.useCallback(
    (assetId: string) => {
      const updated = deleteOverlayAssetFromLibrary(assetId, overlayTenantKey);
      setSavedOverlayAssets(updated);
      toast.success("Aset dihapus dari koleksi tersimpan.");
    },
    [overlayTenantKey]
  );

  // States khusus Surat Massal
  const [bulkRecipientsText, setBulkRecipientsText] = useState<string>("");
  const [isSequentialNumbering, setIsSequentialNumbering] = useState<boolean>(true);
  const [previewBulkIndex, setPreviewBulkIndex] = useState<number>(0);
  const [isBatchPrinting, setIsBatchPrinting] = useState<boolean>(false);

  // Kolom & Data Baris Excel / Mail-Merge Kustom
  const [excelColumns, setExcelColumns] = useState<{
    key: string;
    originalHeader: string;
    sampleValue: string;
  }[]>([]);
  const [excelRowsData, setExcelRowsData] = useState<{
    recipient: string;
    data: Record<string, string>;
  }[]>([]);

  // Dialog Tambah Placeholder Kustom / Manual
  const [isAddPlaceholderOpen, setIsAddPlaceholderOpen] = useState(false);
  const [manualKeyInput, setManualKeyInput] = useState("");
  const [manualValInput, setManualValInput] = useState("");

  // Mode Tampilan Canvas HTML (Edit Template vs Pratinjau Terisi)
  const [htmlCanvasMode, setHtmlCanvasMode] = useState<"edit" | "preview">("edit");

  // Selection range tracker untuk penempatan placeholder di posisi kursor
  const lastSelectionRangeRef = useRef<Range | null>(null);

  // ID surat & cache QR Code verifikasi terpadu (1 arsip = 1 UUID, valid untuk tunggal maupun seluruh halaman surat massal)
  const [singleLetterId, setSingleLetterId] = useState<string>(() => generateUUID());
  const qrCacheRef = useRef<
    Map<string, { qrDataUrl: string; verificationUrl: string; shortCode: string }>
  >(new Map());
  const [activeQrMeta, setActiveQrMeta] = useState<{
    letterId: string;
    qrDataUrl: string;
    verificationUrl: string;
    shortCode: string;
  } | null>(null);

  const getLetterIdForIndex = React.useCallback((): string => {
    return editingMail?.id || singleLetterId;
  }, [editingMail?.id, singleLetterId]);

  const getOrCreateQrMeta = React.useCallback(async (letterId: string) => {
    const cached = qrCacheRef.current.get(letterId);
    if (cached) return cached;
    const generated = await generateLetterQrDataUrl(letterId);
    qrCacheRef.current.set(letterId, generated);
    return generated;
  }, []);

  const resetDraftLetterIds = React.useCallback(() => {
    setSingleLetterId(generateUUID());
    qrCacheRef.current.clear();
  }, []);

  // Sync Mail History (terisolasi sesuai tenant aktif)
  useEffect(() => {
    let active = true;
    if (existingMails !== undefined) {
      queueMicrotask(() => {
        if (active) setMailHistory(existingMails);
      });
    } else if (dialogOpen) {
      db.getSurat().then((res) => {
        if (active && res && Array.isArray(res)) {
          const outOnly = res.filter(
            (m: any) =>
              (m.type === "KELUAR" || !m.type) &&
              (!currentUser || isRecordInTenant(currentUser, m, activeTenant))
          );
          setMailHistory(outOnly);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [existingMails, dialogOpen, currentUser, activeTenant]);

  const scopedMailHistory = React.useMemo(
    () =>
      filterMailsForSameTenant(
        mailHistory as MailItem[],
        targetTenantInfo.tenantId,
        targetTenantInfo.isCabang
      ),
    [mailHistory, targetTenantInfo.tenantId, targetTenantInfo.isCabang]
  );

  const getNextSeqNumber = React.useCallback((mails: any[]): string => {
    let maxSeq = 0;
    mails.forEach((m) => {
      if (!m.nomor) return;
      const num = getMaxSequenceFromNomor(m.nomor);
      if (num > maxSeq) {
        maxSeq = num;
      }
    });
    return (maxSeq + 1).toString().padStart(3, "0");
  }, []);

  // Form States (Template Word .docx & Edit Langsung)
  const [createTemplate, setCreateTemplate] = useState<string>("");
  const [customTemplates, setCustomTemplates] = useState<SuratTemplate[]>([]);

  // Konsep Pengisi Template DOCX (docxtemplater + PizZip + docx-preview)
  const [activeFileBase64, setActiveFileBase64] = useState<string>("");
  const [activePlaceholders, setActivePlaceholders] = useState<string[]>([]);
  const [docxValues, setDocxValues] = useState<Record<string, string>>({});
  const [isRenderingDocx, setIsRenderingDocx] = useState(false);

  const [createRecipient, setCreateRecipient] = useState("");
  const [createSubject, setCreateSubject] = useState("");
  const [createClassification, setCreateClassification] = useState<
    "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi"
  >("Permohonan");
  const [createContent, setCreateContent] = useState("");
  const [createSenderTitle, setCreateSenderTitle] = useState(
    isCabangScope ? "Ketua Cabang" : "Ketua Komisariat"
  );
  const [createSenderLocation, setCreateSenderLocation] = useState("Purwodadi");
  const [letterDate, setLetterDate] = useState(() => {
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const now = new Date();
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  });

  // Kop & Footer Settings (Dinamis berdasarkan ruang lingkup Cabang / Komisariat)
  const [createKopTitle, setCreateKopTitle] = useState("PERGERAKAN MAHASISWA ISLAM INDONESIA");
  const [createKopSubtitle, setCreateKopSubtitle] = useState(
    isCabangScope ? "PENGURUS CABANG" : "PENGURUS KOMISARIAT"
  );
  const [createKopEnglish, setCreateKopEnglish] = useState(
    isCabangScope
      ? "(Branch Board Indonesian Islamic Student Movement)"
      : "(Commissariat Board Indonesian Islamic Student Movement)"
  );
  const [createKopAddress, setCreateKopAddress] = useState(
    "Jl. Getas Pendawa RT 01/RW 12 Kec. Purwodadi Kab. Grobogan\nEmail : pb.pmii@gmail.com Website : https://pmii.or.id"
  );
  const [createFooterLeft, setCreateFooterLeft] = useState("Dzikir, Fikir, Amal Sholeh");
  const [createLogoUrl, setCreateLogoUrl] = useState<string>("/image/logo_komsat.png");

  // STATE MODE 1: SINGLE SURAT (9 Kotak PMII)
  const [numBox1, setNumBox1] = useState("001");
  const [numBox2, setNumBox2] = useState(isCabangScope ? "PC" : "PK");
  const [numBox3, setNumBox3] = useState("XI");
  const [numBox4, setNumBox4] = useState("Z-03");
  const [numBox5, setNumBox5] = useState("01");
  const [numBox6, setNumBox6] = useState("010");
  const [numBox7, setNumBox7] = useState("B-II");
  const [numBox8, setNumBox8] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [numBox9, setNumBox9] = useState(String(new Date().getFullYear()));

  // Sinkronisasi state form saat membuka Mode Edit Surat Keluar (Tunggal maupun Massal 1-Arsip)
  const editSyncKey = editingMail
    ? `edit:${editingMail.id}:${editingMail.nomor}:${editingMail.dateIndo || editingMail.date}`
    : "";
  const [prevEditSyncKey, setPrevEditSyncKey] = useState("");
  if (editSyncKey !== prevEditSyncKey) {
    setPrevEditSyncKey(editSyncKey);
    if (editingMail) {
      const extractedMeta = extractLetterEditMetadata(editingMail.content);
      const bulkMeta =
        extractedMeta?.mode === "bulk" &&
        extractedMeta.bulk &&
        extractedMeta.bulk.recipients.length > 0
          ? extractedMeta.bulk
          : null;

      setLetterMode(bulkMeta ? "bulk" : "single");
      setHtmlCanvasMode("edit");
      setDuplicateConfirmMode(null);
      setSingleLetterId(editingMail.id);
      setEditStatus(normalizeMailStatusForType(editingMail.status, "KELUAR"));
      setCreateSubject(editingMail.subject || "");
      setCreateClassification(editingMail.classification || "Permohonan");
      setCreateSenderTitle(
        editingMail.senderTitle ||
          (targetTenantInfo.isCabang ? "Ketua Cabang" : "Ketua Komisariat")
      );
      setCreateSenderLocation(editingMail.senderLocation || "Purwodadi");
      setLetterDate(
        editingMail.dateIndo?.trim() ||
          formatDateToIndo(parseMailDateToIso(editingMail.date, editingMail.dateIndo))
      );

      if (bulkMeta) {
        setBulkRecipientsText(bulkMeta.recipients.join("\n"));
        setIsSequentialNumbering(bulkMeta.isSequentialNumbering);
        setExcelColumns(bulkMeta.excelColumns || []);
        setExcelRowsData(bulkMeta.excelRowsData || []);
        setPreviewBulkIndex(0);
        setCreateRecipient(bulkMeta.recipients[0] || editingMail.senderOrRecipient || "");
      } else {
        setBulkRecipientsText("");
        setIsSequentialNumbering(true);
        setExcelColumns([]);
        setExcelRowsData([]);
        setPreviewBulkIndex(0);
        setCreateRecipient(editingMail.senderOrRecipient || "");
      }

      const nomorForBoxes = bulkMeta
        ? bulkMeta.startNomor || parseBulkRangeNomor(editingMail.nomor)?.startNomor || editingMail.nomor
        : editingMail.nomor;
      const parsedBoxes = parsePmiiNomorToBoxes(nomorForBoxes);
      if (parsedBoxes) {
        setUseCustomNomor(false);
        setCustomNomorInput("");
        setNumBox1(parsedBoxes[0]);
        setNumBox2(parsedBoxes[1]);
        setNumBox3(parsedBoxes[2]);
        setNumBox4(parsedBoxes[3]);
        setNumBox5(parsedBoxes[4]);
        setNumBox6(parsedBoxes[5]);
        setNumBox7(parsedBoxes[6]);
        setNumBox8(parsedBoxes[7]);
        setNumBox9(parsedBoxes[8]);
      } else {
        setUseCustomNomor(true);
        setCustomNomorInput(nomorForBoxes || "");
      }

      setPendingEditTemplateMeta(extractedMeta);

      const rawWithoutMeta = stripLetterEditMetadata(editingMail.content || "");
      const hasHtml = isFormattedHtmlContent(rawWithoutMeta);
      const cleanedEditableHtml = hasHtml
        ? stripLetterOverlaysFromHtml(stripHtmlQrFooter(rawWithoutMeta))
        : "";
      const plainNote =
        !hasHtml &&
        rawWithoutMeta.trim() &&
        rawWithoutMeta.trim().toLowerCase() !== "isi surat terlampir."
          ? rawWithoutMeta.trim()
          : "";

      setLetterOverlays(extractedMeta?.overlays || []);
      setSelectedOverlayId(null);
      setOverlayRawMap({});
      setSavedExistingHtml(cleanedEditableHtml);
      setPlainTextFallbackNote(plainNote);
      setCreateTemplate(hasHtml ? EXISTING_DOCUMENT_TEMPLATE_ID : "");
      setActiveFileBase64("");
      setActivePlaceholders(
        bulkMeta?.excelColumns?.map((c) => c.key).filter((k) => !isCoreStandardKey(k)) || []
      );
      setDocxValues(extractedMeta?.docxValues || {});
      setCreateContent(cleanedEditableHtml);
      setHasAutoFilled(true);
    }
  }

  // Auto assign next number & scope defaults when modal opens (Create mode only)
  useEffect(() => {
    if (isOpen && !isEditMode && !hasAutoFilled) {
      const next = getNextSeqNumber(scopedMailHistory);
      queueMicrotask(() => {
        setNumBox1(next);
        setNumBox2(isCabangScope ? "PC" : "PK");
        setNumBox8(String(new Date().getMonth() + 1).padStart(2, "0"));
        setNumBox9(String(new Date().getFullYear()));
        setCreateSenderTitle(isCabangScope ? "Ketua Cabang" : "Ketua Komisariat");
        setHasAutoFilled(true);
      });
    }
  }, [isOpen, isEditMode, scopedMailHistory, hasAutoFilled, getNextSeqNumber, isCabangScope]);

  const handleAutoAssignNextNumber = () => {
    const next = getNextSeqNumber(scopedMailHistory);
    setUseCustomNomor(false);
    setNumBox1(next);
    setNumBox8(String(new Date().getMonth() + 1).padStart(2, "0"));
    setNumBox9(String(new Date().getFullYear()));
  };

  const boxRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const standardSingleNomor = `${numBox1}.${numBox2}-${numBox3}.${numBox4}.${numBox5}.${numBox6}.${numBox7}.${numBox8}.${numBox9}`;
  const baseSingleNomor =
    isEditMode && useCustomNomor ? customNomorInput.trim() : standardSingleNomor;
  const activeSenderTitle =
    createSenderTitle.trim() || (isCabangScope ? "Ketua Cabang" : "Ketua Komisariat");

  // Parsing Daftar Penerima Surat Massal
  const parsedBulkRecipients = React.useMemo(() => {
    return bulkRecipientsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [bulkRecipientsText]);

  // Jaga indeks preview agar tetap dalam rentang daftar penerima massal
  useEffect(() => {
    if (previewBulkIndex >= parsedBulkRecipients.length && parsedBulkRecipients.length > 0) {
      const clamped = parsedBulkRecipients.length - 1;
      queueMicrotask(() => setPreviewBulkIndex(clamped));
    }
  }, [parsedBulkRecipients.length, previewBulkIndex]);

  // Kalkulasi nomor surat per indeks penerima massal
  const getNomorForIndex = React.useCallback((index: number) => {
    if (!isSequentialNumbering) {
      return baseSingleNomor;
    }
    const startNum = parseInt(numBox1, 10);
    const currentNum = isNaN(startNum) ? 1 : startNum + index;
    const padLength = Math.max(numBox1.length, 3);
    const paddedNum = currentNum.toString().padStart(padLength, "0");
    return `${paddedNum}.${numBox2}-${numBox3}.${numBox4}.${numBox5}.${numBox6}.${numBox7}.${numBox8}.${numBox9}`;
  }, [isSequentialNumbering, baseSingleNomor, numBox1, numBox2, numBox3, numBox4, numBox5, numBox6, numBox7, numBox8, numBox9]);

  // Ref & Handler Upload Excel untuk Surat Massal
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  // Simpan posisi kursor saat pengguna mengetik/mengklik lembar surat
  const saveCanvasSelection = () => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && canvasTextareaRef.current) {
      const range = sel.getRangeAt(0);
      if (canvasTextareaRef.current.contains(range.commonAncestorContainer)) {
        lastSelectionRangeRef.current = range.cloneRange();
      }
    }
  };

  // Sisipkan tag placeholder ke lembar surat di posisi kursor aktif
  const insertPlaceholderAtCursor = (placeholderKey: string, explicitVal?: string) => {
    const clean = placeholderKey.replace(/^\{+/, "").replace(/\}+$/, "").trim();
    const cleanKey = clean.toLowerCase();

    // Pastikan terdaftar di activePlaceholders agar muncul di form variabel
    if (!activePlaceholders.includes(cleanKey)) {
      setActivePlaceholders((prev) => [...prev, cleanKey]);
    }

    // Pastikan mode edit aktif agar kursor dapat menulis
    if (htmlCanvasMode !== "edit") {
      setHtmlCanvasMode("edit");
    }

    const canvas = canvasTextareaRef.current;
    if (!canvas) {
      navigator.clipboard.writeText(`{{${cleanKey}}}`);
      toast.success(`Placeholder {{${cleanKey}}} disalin ke clipboard! Tempelkan (Ctrl+V) di surat.`);
      return;
    }

    const rowData = getRowDataForIndex(previewBulkIndex);
    const colDef = excelColumns.find((c) => c.key === cleanKey || c.originalHeader?.toLowerCase() === cleanKey);
    const liveVal =
      explicitVal ||
      rowData[cleanKey] ||
      rowData[clean] ||
      docxValues[cleanKey] ||
      docxValues[clean] ||
      colDef?.sampleValue ||
      (excelRowsData[previewBulkIndex]?.data?.[cleanKey]) ||
      "";

    // Buat elemen span penampung variabel live dengan aksen biru dan garis bawah titik-titik
    const span = document.createElement("span");
    span.setAttribute("data-placeholder", cleanKey);
    span.style.color = "#1d4ed8";
    span.style.fontWeight = "600";
    span.style.textDecoration = "underline decoration-dotted";
    span.style.textUnderlineOffset = "3px";
    span.title = `Variabel: {{${cleanKey}}}`;
    span.textContent = liveVal || `{{${cleanKey}}}`;

    canvas.focus();
    let inserted = false;

    // Coba gunakan saved selection range jika ada
    const savedRange = lastSelectionRangeRef.current;
    const sel = typeof window !== "undefined" ? window.getSelection() : null;

    if (savedRange && canvas.contains(savedRange.commonAncestorContainer)) {
      try {
        savedRange.deleteContents();
        savedRange.insertNode(span);

        // Tambah spasi setelah span agar mengetik berikutnya lancar
        const spaceNode = document.createTextNode(" ");
        if (span.parentNode) {
          span.parentNode.insertBefore(spaceNode, span.nextSibling);
        }

        const newRange = document.createRange();
        newRange.setStartAfter(spaceNode);
        newRange.setEndAfter(spaceNode);
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
        lastSelectionRangeRef.current = newRange.cloneRange();
        inserted = true;
      } catch (err) {
        console.warn("Gagal menyisipkan ke range tersimpan:", err);
      }
    }

    if (!inserted) {
      if (sel && sel.rangeCount > 0 && canvas.contains(sel.anchorNode)) {
        try {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(span);

          const spaceNode = document.createTextNode(" ");
          if (span.parentNode) {
            span.parentNode.insertBefore(spaceNode, span.nextSibling);
          }

          range.setStartAfter(spaceNode);
          range.setEndAfter(spaceNode);
          sel.removeAllRanges();
          sel.addRange(range);
          lastSelectionRangeRef.current = range.cloneRange();
          inserted = true;
        } catch (err) {
          console.warn("Gagal menyisipkan kursor langsung:", err);
        }
      }
    }

    if (!inserted) {
      // Coba sisipkan di blok penerima jika ditemukan
      const recipientEl = canvas.querySelector('[data-field="recipient-name"]');
      if (recipientEl && recipientEl.parentElement) {
        const div = document.createElement("div");
        div.appendChild(span);
        recipientEl.parentElement.appendChild(div);
        inserted = true;
      } else {
        canvas.appendChild(span);
        const spaceNode = document.createTextNode(" ");
        canvas.appendChild(spaceNode);
        inserted = true;
      }
    }

    setCreateContent(canvas.innerHTML);
    toast.success(
      liveVal
        ? `Variabel {{${cleanKey}}} ("${liveVal}") berhasil ditempatkan!`
        : `Variabel {{${cleanKey}}} ditempatkan! Anda dapat mengisi nilainya di formulir Isian Variabel.`
    );
  };

  // Simpan placeholder kustom yang ditambahkan manual oleh pengguna
  const handleSaveManualPlaceholder = () => {
    let raw = manualKeyInput.trim();
    if (!raw) {
      toast.error("Nama placeholder tidak boleh kosong.");
      return;
    }
    raw = raw.replace(/^\{+/, "").replace(/\}+$/, "");
    const cleanKey = raw
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!cleanKey) {
      toast.error("Nama placeholder tidak valid.");
      return;
    }

    const defaultVal = manualValInput.trim();

    // Daftarkan ke excelColumns jika belum ada
    setExcelColumns((prev) => {
      if (prev.some((c) => c.key === cleanKey)) return prev;
      return [
        ...prev,
        {
          key: cleanKey,
          originalHeader: raw,
          sampleValue: defaultVal || cleanKey
        }
      ];
    });

    // Perbarui data setiap baris penerima
    setExcelRowsData((prev) =>
      prev.map((r) => ({
        ...r,
        data: {
          ...r.data,
          [cleanKey]: defaultVal || r.data[cleanKey] || ""
        }
      }))
    );

    // Daftarkan ke activePlaceholders
    setActivePlaceholders((prev) => {
      if (prev.includes(cleanKey)) return prev;
      return [...prev, cleanKey];
    });

    setDocxValues((prev) => ({
      ...prev,
      [cleanKey]: defaultVal || prev[cleanKey] || ""
    }));

    setIsAddPlaceholderOpen(false);
    setManualKeyInput("");
    setManualValInput("");

    // Sisipkan langsung ke kursor dengan nilai yang baru saja ditentukan
    insertPlaceholderAtCursor(cleanKey, defaultVal);
  };

  // Ambil data variabel baris untuk indeks penerima tertentu (single & bulk mail-merge)
  const getRowDataForIndex = React.useCallback(
    (index: number, modeOverride?: "single" | "bulk"): Record<string, string> => {
      const effectiveMode = modeOverride ?? letterMode;
      const recName =
        effectiveMode === "bulk"
          ? parsedBulkRecipients[index] || ""
          : createRecipient || "";
      const nomor =
        effectiveMode === "bulk" ? getNomorForIndex(index) : baseSingleNomor;

      return buildLetterMergeData({
        mode: effectiveMode,
        index,
        core: {
          nomor,
          recipient: recName,
          subject: createSubject,
          location: createSenderLocation,
          date: letterDate,
        },
        manualValues: docxValues,
        excelColumns,
        excelRowsData,
        activePlaceholders,
      });
    },
    [
      letterMode,
      parsedBulkRecipients,
      createRecipient,
      getNomorForIndex,
      baseSingleNomor,
      createSubject,
      createSenderLocation,
      letterDate,
      docxValues,
      excelColumns,
      excelRowsData,
      activePlaceholders,
    ]
  );

  // Helper interpolasi variabel {{...}} ke dalam HTML surat
  const replacePlaceholdersInHtml = (
    html: string,
    data: Record<string, string>
  ): string => {
    if (!html) return "";
    let result = html;

    // 1. Data attributes: [data-field="..."] dan [data-placeholder="..."]
    if (typeof DOMParser !== "undefined") {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(result, "text/html");

        const setField = (selector: string, val: string) => {
          doc.querySelectorAll(selector).forEach((el) => {
            el.textContent = val;
          });
        };

        if (data["nomor"]) setField('[data-field="nomor-value"]', data["nomor"]);
        if (data["perihal"]) setField('[data-field="perihal-value"]', data["perihal"]);
        if (data["penerima"]) setField('[data-field="recipient-name"]', data["penerima"]);
        if (data["tanggal"] && data["lokasi"]) {
          setField('[data-field="location-date"]', `${data["lokasi"]}, ${data["tanggal"]}`);
        }

        Object.entries(data).forEach(([key, val]) => {
          if (!key) return;
          setField(`[data-field="${key}"]`, val);
        });

        // Ganti elemen [data-placeholder] menjadi teks biasa bersih untuk cetak/pratinjau
        doc.querySelectorAll("[data-placeholder]").forEach((el) => {
          const key = el.getAttribute("data-placeholder") || "";
          const cleanKey = key.toLowerCase();
          const val =
            data[cleanKey] ??
            data[key] ??
            docxValues[cleanKey] ??
            docxValues[key] ??
            "";
          if (val) {
            el.replaceWith(doc.createTextNode(val));
          }
        });

        result = doc.body.innerHTML;
      } catch (e) {
        console.warn("replacePlaceholdersInHtml DOMParser error:", e);
      }
    }

    // 2. Double curly braces {{key}}
    Object.entries(data).forEach(([key, val]) => {
      if (!key) return;
      const safe = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\{\\{\\s*${safe}\\s*\\}\\}`, "gi");
      result = result.replace(regex, val ?? "");
    });

    return result;
  };

  const handleDownloadExcelTemplate = async () => {
    try {
      const headers = [
        "Nama Penerima",
        "Jabatan",
        "Instansi / Lembaga",
        "Alamat / Kota",
        "Catatan Khusus"
      ];
      const sampleData = [
        ["Sahabat Ahmad Fauzi", "Ketua Rayon", "PR PMII Rayon Tarbiyah", "Grobogan", "Konfirmasi kehadiran"],
        ["Sahabati Siti Nurhaliza", "Ketua Rayon", "PR PMII Rayon Syariah", "Purwodadi", "Konfirmasi kehadiran"],
        ["Sahabat Ridwan Kamil", "Ketua Rayon", "PR PMII Rayon Dakwah", "Grobogan", "Konfirmasi kehadiran"],
        ["Sahabat Budi Santoso", "Ketua Rayon", "PR PMII Rayon Ushuluddin", "Purwodadi", "Konfirmasi kehadiran"],
        ["Sahabati Dewi Lestari", "Ketua Rayon", "PR PMII Rayon Ekonomi & Bisnis", "Grobogan", "Konfirmasi kehadiran"]
      ];

      await exportToExcel("Format_Penerima_Surat_Massal_PMII.xlsx", [
        {
          name: "Penerima Surat PMII",
          aoa: [headers, ...sampleData],
          colWidths: [32, 18, 30, 20, 24],
        },
      ]);
      toast.success("Format template Excel berhasil diunduh!");
    } catch (e: any) {
      console.error("Gagal mengunduh format Excel:", e);
      toast.error("Gagal mengunduh format Excel: " + e.message);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const { sheetName: firstSheetName, rows: sheetData } = await readSpreadsheetTo2DArray(buffer, {
        fileName: file.name,
      });
      if (!firstSheetName) {
        toast.error("File Excel kosong atau tidak memiliki lembar kerja.");
        return;
      }

      if (!sheetData || sheetData.length === 0) {
        toast.error("Lembar kerja Excel kosong.");
        return;
      }

      // Deteksi baris header & kolom penerima
      let headerRowIndex = 0;
      let recipientColIndex = 0;
      let foundHeader = false;

      for (let r = 0; r < Math.min(sheetData.length, 5); r++) {
        const row = sheetData[r] || [];
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || "").trim().toLowerCase();
          if (
            val.includes("penerima") ||
            val.includes("nama") ||
            val.includes("tujuan") ||
            val.includes("kepada") ||
            val.includes("organisasi") ||
            val.includes("instansi")
          ) {
            headerRowIndex = r;
            recipientColIndex = c;
            foundHeader = true;
            break;
          }
        }
        if (foundHeader) break;
      }

      // Ekstrak seluruh kolom dari header row
      const headerRow = sheetData[headerRowIndex] || [];
      const detectedCols: { key: string; originalHeader: string; sampleValue: string }[] = [];
      const colMapping: { colIdx: number; key: string; originalHeader: string }[] = [];

      headerRow.forEach((rawH: any, colIdx: number) => {
        const headerStr = String(rawH || "").trim();
        if (!headerStr) return;

        let cleanKey = headerStr
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .replace(/\s+/g, "_")
          .replace(/^_+|_+$/g, "");

        if (!cleanKey) cleanKey = `kolom_${colIdx + 1}`;

        let sampleVal = "";
        for (let r = headerRowIndex + 1; r < sheetData.length; r++) {
          const val = String(sheetData[r]?.[colIdx] || "").trim();
          if (val && !val.toLowerCase().startsWith("contoh:")) {
            sampleVal = val;
            break;
          }
        }

        colMapping.push({ colIdx, key: cleanKey, originalHeader: headerStr });
        detectedCols.push({
          key: cleanKey,
          originalHeader: headerStr,
          sampleValue: sampleVal
        });
      });

      const startDataIndex = foundHeader ? headerRowIndex + 1 : 0;
      const extractedNames: string[] = [];
      const parsedRowsData: { recipient: string; data: Record<string, string> }[] = [];

      for (let i = startDataIndex; i < sheetData.length; i++) {
        const row = sheetData[i] || [];
        const rawVal = row[recipientColIndex];
        const name = String(rawVal || "").trim();
        if (
          name &&
          !name.toLowerCase().startsWith("contoh:") &&
          !name.toLowerCase().startsWith("nama penerima") &&
          !name.toLowerCase().startsWith("penerima")
        ) {
          extractedNames.push(name);

          const rowData: Record<string, string> = {};
          colMapping.forEach(({ colIdx, key, originalHeader }) => {
            const cellVal = String(row[colIdx] ?? "").trim();
            rowData[key] = cellVal;
            rowData[originalHeader] = cellVal;
            rowData[originalHeader.toLowerCase()] = cellVal;
          });
          rowData["penerima"] = name;
          rowData["nama_penerima"] = name;
          rowData["kepada"] = name;

          parsedRowsData.push({
            recipient: name,
            data: rowData
          });
        }
      }

      if (extractedNames.length === 0) {
        toast.error("Tidak ditemukan nama penerima yang valid di file Excel.");
        return;
      }

      setExcelColumns(detectedCols);
      setExcelRowsData(parsedRowsData);
      setBulkRecipientsText(extractedNames.join("\n"));
      setPreviewBulkIndex(0);

      // Daftarkan kolom kustom ke activePlaceholders (kecuali alias field inti surat)
      const extraKeys = detectedCols
        .map((c) => c.key)
        .filter((k) => !isCoreStandardKey(k) && k !== "nama");

      setActivePlaceholders((prev) => {
        const set = new Set([...prev, ...extraKeys]);
        return Array.from(set);
      });

      // Jangan salin data baris #0 ke docxValues global agar data per baris Excel tidak tertimpa.
      // Bersihkan key di docxValues yang sekarang dikelola per-baris oleh kolom Excel.
      const excelKeySet = new Set(
        detectedCols.flatMap((c) => [c.key, c.key.toLowerCase(), c.originalHeader, c.originalHeader.toLowerCase()])
      );
      setDocxValues((prev) => {
        const cleaned: Record<string, string> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (!excelKeySet.has(k) && !excelKeySet.has(k.toLowerCase())) {
            cleaned[k] = v;
          }
        }
        return cleaned;
      });

      toast.success(
        `Berhasil mengimpor ${extractedNames.length} nama penerima & ${detectedCols.length} kolom data dari Excel!`
      );
    } catch (e: any) {
      console.error("Gagal membaca file Excel:", e);
      toast.error("Gagal membaca file Excel: " + e.message);
    } finally {
      if (excelFileInputRef.current) {
        excelFileInputRef.current.value = "";
      }
    }
  };

  // Bersihkan Penerima Surat Massal
  const loadPresetRecipients = (_type?: string) => {
    setBulkRecipientsText("");
    setExcelColumns([]);
    setExcelRowsData([]);
    setPreviewBulkIndex(0);
  };

  // Daftar nomor & urutan yang sudah terpakai (mendukung arsip tunggal maupun rentang massal 001-005.PK-...)
  const occupiedHistoryEntries = React.useMemo(() => {
    return scopedMailHistory
      .filter((m) => Boolean(m.nomor) && (!editingMail || m.id !== editingMail.id))
      .map((m) => ({
        mail: m,
        ...expandNomorOccurrences(m.nomor),
      }));
  }, [scopedMailHistory, editingMail]);

  // Deteksi Duplikat Nomor Surat Keluar (Single Mode, mengecualikan surat yang sedang diedit)
  const currentNormalizedNomor = baseSingleNomor.trim().toLowerCase();
  const duplicateEntry = occupiedHistoryEntries.find((entry) =>
    entry.normalizedNomors.includes(currentNormalizedNomor)
  )?.mail;

  const currentSeqNum = parseInt(numBox1, 10);
  const duplicateSeqEntry = !duplicateEntry && !(isEditMode && useCustomNomor) && !isNaN(currentSeqNum)
    ? occupiedHistoryEntries.find((entry) => entry.seqNumbers.includes(currentSeqNum))?.mail || null
    : null;

  // Deteksi Duplikat Nomor Surat Keluar (Bulk Mode — juga mengecualikan surat massal yang sedang direvisi)
  const bulkDuplicateEntries = React.useMemo(() => {
    if (letterMode !== "bulk" || parsedBulkRecipients.length === 0) return [];
    const duplicates: { index: number; nomor: string; recipient: string; matchedMail: any }[] = [];
    parsedBulkRecipients.forEach((rec, idx) => {
      const nom = getNomorForIndex(idx).trim().toLowerCase();
      const match = occupiedHistoryEntries.find((entry) =>
        entry.normalizedNomors.includes(nom)
      )?.mail;
      if (match) {
        duplicates.push({ index: idx, nomor: getNomorForIndex(idx), recipient: rec, matchedMail: match });
      }
    });
    return duplicates;
  }, [letterMode, parsedBulkRecipients, getNomorForIndex, occupiedHistoryEntries]);

  // Deklarasi Variabel Preview Utama (Mendukung Single & Bulk)
  const currentPreviewNomor =
    letterMode === "bulk"
      ? getNomorForIndex(previewBulkIndex)
      : baseSingleNomor;

  const currentPreviewRecipient =
    letterMode === "bulk"
      ? (parsedBulkRecipients[previewBulkIndex] || "Nama Penerima Surat")
      : createRecipient;

  const currentPreviewSubject = createSubject;
  const currentPreviewLocation = createSenderLocation;
  const currentPreviewFooterLeft = createFooterLeft;
  const activeOrgLabel =
    createKopSubtitle ||
    (isCabangScope
      ? "PENGURUS CABANG PMII"
      : currentUser?.commissariat || "PENGURUS KOMISARIAT PMII");
  const activePreviewLetterId = getLetterIdForIndex();

  // Siapkan QR Code verifikasi aktif untuk pratinjau live
  useEffect(() => {
    if (!dialogOpen || !activePreviewLetterId) return;
    let cancelled = false;
    getOrCreateQrMeta(activePreviewLetterId)
      .then((meta) => {
        if (!cancelled) {
          setActiveQrMeta({ letterId: activePreviewLetterId, ...meta });
        }
      })
      .catch((err) => {
        console.warn("Gagal membuat QR verifikasi surat:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [dialogOpen, activePreviewLetterId, getOrCreateQrMeta]);

  // Sinkronisasi Kop Surat & Logo Otomatis dari Pengaturan Sistem & Ruang Lingkup Tenant
  useEffect(() => {
    if (typeof window !== "undefined" && dialogOpen) {
      queueMicrotask(() => {
        try {
          const savedSettings = localStorage.getItem("PMII_SYSTEM_SETTINGS");
          const komLabel =
            (isEditMode && editingMail?.commissariat) ||
            (activeTenant && activeTenant !== "ALL"
              ? activeTenant
              : currentUser?.commissariat || "PENGURUS KOMISARIAT");

          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            const org = parsed?.organization;
            if (org) {
              if (isCabangScope && org.cabangName) {
                setCreateKopSubtitle(org.cabangName.toUpperCase());
                setCreateKopEnglish("(Branch Board Indonesian Islamic Student Movement)");
              } else if (!isCabangScope) {
                setCreateKopSubtitle(komLabel.toUpperCase());
                setCreateKopEnglish("(Commissariat Board Indonesian Islamic Student Movement)");
              }
              const addressParts: string[] = [];
              if (org.address) addressParts.push(`Sekretariat: ${org.address}`);
              if (org.phone) addressParts.push(`Telp: ${org.phone}`);
              if (org.email) addressParts.push(`Email: ${org.email}`);
              if (addressParts.length > 0) {
                setCreateKopAddress(addressParts.join(" | "));
              }
              if (!isEditMode && (org.city || org.kota)) {
                setCreateSenderLocation(org.city || org.kota);
              }
              if (org.logo) {
                setCreateLogoUrl(org.logo);
              }
            }
          } else {
            if (isCabangScope) {
              setCreateKopSubtitle("PENGURUS CABANG");
              setCreateKopEnglish("(Branch Board Indonesian Islamic Student Movement)");
            } else {
              setCreateKopSubtitle(komLabel.toUpperCase());
              setCreateKopEnglish("(Commissariat Board Indonesian Islamic Student Movement)");
            }
          }
        } catch (e) {
          console.error("Failed to load system settings for letter kop:", e);
        }
      });
    }
  }, [dialogOpen, isEditMode, editingMail?.commissariat, isCabangScope, activeTenant, currentUser]);

  // Render Preview Menggunakan docxtemplater + PizZip + docx-preview (100% Persis Word Asli + QR Footer)
  const renderFilledDocxPreview = async (
    b64: string,
    data: Record<string, string>,
    letterIdOverride?: string
  ) => {
    const canvasEl = canvasTextareaRef.current;
    if (!b64 || !canvasEl) return;
    setIsRenderingDocx(true);
    try {
      const targetLetterId = letterIdOverride || activePreviewLetterId;
      const qrMeta = await getOrCreateQrMeta(targetLetterId);
      const qrFooter: DocxQrFooterOptions = {
        qrDataUrl: qrMeta.qrDataUrl,
        letterId: targetLetterId,
        nomor: data.nomor || currentPreviewNomor,
        verificationUrl: qrMeta.verificationUrl,
        orgLabel: activeOrgLabel,
      };

      const arrayBuffer = base64ToArrayBuffer(b64);
      const { arrayBuffer: filledBuffer, error } = fillDocxTemplate(
        arrayBuffer,
        data,
        undefined,
        qrFooter
      );
      if (error) {
        console.warn("Docxtemplater warning:", error);
      }
      await renderDocxToElement(filledBuffer, canvasEl);
      setCreateContent(canvasEl.innerHTML);
      setCanvasRenderVersion((v) => v + 1);
    } catch (e) {
      console.error("Gagal render docx preview:", e);
    } finally {
      setIsRenderingDocx(false);
    }
  };

  const handleDownloadDocxResult = async () => {
    if (!activeFileBase64) return;
    try {
      const arrayBuffer = base64ToArrayBuffer(activeFileBase64);
      const idx = letterMode === "bulk" ? previewBulkIndex : 0;
      const mergedData = getRowDataForIndex(idx);
      const targetLetterId = getLetterIdForIndex();
      const qrMeta = await getOrCreateQrMeta(targetLetterId);
      const { blob, error } = fillDocxTemplate(
        arrayBuffer,
        mergedData,
        undefined,
        {
          qrDataUrl: qrMeta.qrDataUrl,
          letterId: targetLetterId,
          nomor: mergedData.nomor || currentPreviewNomor,
          verificationUrl: qrMeta.verificationUrl,
          orgLabel: activeOrgLabel,
        },
        letterOverlays
      );
      if (error) {
        toast.error("Gagal mengisi data ke docx: " + error);
        return;
      }
      const safeNomor = currentPreviewNomor.replace(/[/\\?%*:|"<>]/g, "_");
      const safeRecipient = (currentPreviewRecipient || "Penerima").replace(/[/\\?%*:|"<>]/g, "_");
      const fileName = `${safeNomor}_${safeRecipient}`;
      downloadDocxBlob(blob, fileName);
      toast.success("Dokumen Word (.docx) dengan QR verifikasi berhasil diunduh!");
    } catch (e: any) {
      toast.error("Gagal mengunduh file: " + e.message);
    }
  };

  const handleDownloadBulkZip = async () => {
    if (!activeFileBase64 || parsedBulkRecipients.length === 0) return;
    try {
      const zip = new PizZip();
      const arrayBuffer = base64ToArrayBuffer(activeFileBase64);

      const unifiedLetterId = getLetterIdForIndex();
      const qrMeta = await getOrCreateQrMeta(unifiedLetterId);

      for (let idx = 0; idx < parsedBulkRecipients.length; idx++) {
        const rec = parsedBulkRecipients[idx];
        const nomor = getNomorForIndex(idx);
        const data = getRowDataForIndex(idx, "bulk");

        const { arrayBuffer: filledBuffer } = fillDocxTemplate(
          arrayBuffer,
          data,
          undefined,
          {
            qrDataUrl: qrMeta.qrDataUrl,
            letterId: unifiedLetterId,
            nomor,
            verificationUrl: qrMeta.verificationUrl,
            orgLabel: activeOrgLabel,
          },
          letterOverlays
        );
        const safeNomor = nomor.replace(/[/\\?%*:|"<>]/g, "_");
        const safeRec = rec.replace(/[/\\?%*:|"<>]/g, "_");
        zip.file(`${safeNomor}_${safeRec}.docx`, filledBuffer);
      }

      const zipBlob = zip.generate({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Surat_Massal_PMII_${parsedBulkRecipients.length}_Berkas.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2500);
      toast.success(`Berhasil mengunduh paket ZIP (${parsedBulkRecipients.length} file .docx ber-QR)!`);
    } catch (e: any) {
      console.error("Gagal buat ZIP docx:", e);
      toast.error("Gagal mengunduh ZIP: " + e.message);
    }
  };

  const applyTemplateSelection = async (
    tmpl: SuratTemplate,
    options?: {
      preserveExistingFields?: boolean;
      initialDocxValues?: Record<string, string>;
    }
  ) => {
    const preserve = options?.preserveExistingFields === true;
    const parsed = parseTemplateContent(tmpl.content);
    let b64 = parsed.fileBase64 || "";
    const fileUrl = tmpl.fileUrl || parsed.fileUrl;
    const ph = tmpl.placeholders || parsed.placeholders || [];

    if (!b64 && fileUrl) {
      try {
        const buffer = await getDocxArrayBuffer({ fileUrl });
        b64 = arrayBufferToBase64(buffer);
      } catch (err) {
        console.warn("Gagal memuat template DOCX dari Cloud Storage:", err);
      }
    }

    setActiveFileBase64(b64);
    const mergedPlaceholders = Array.from(
      new Set([
        ...ph,
        ...excelColumns
          .map((c) => c.key)
          .filter((k) => !isCoreStandardKey(k) && k !== "nama"),
      ])
    );
    setActivePlaceholders(mergedPlaceholders);

    const nextSubject = preserve ? createSubject : tmpl.subject || tmpl.name || "";
    if (!preserve) {
      setCreateSubject(nextSubject);
      if (
        tmpl.classification &&
        ["Instruksi", "Permohonan", "Undangan", "Keputusan", "Rekomendasi"].includes(
          tmpl.classification
        )
      ) {
        setCreateClassification(tmpl.classification as typeof createClassification);
      } else {
        setCreateClassification("Permohonan");
      }
    }
    const loc = preserve
      ? createSenderLocation || "Purwodadi"
      : tmpl.senderLocation || createSenderLocation || "Purwodadi";
    if (!preserve) {
      setCreateSenderLocation(loc);
      if (tmpl.senderTitle) {
        setCreateSenderTitle(tmpl.senderTitle);
      }
    }

    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const today = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

    const seedVals = options?.initialDocxValues || (preserve ? docxValues : {});
    const initManualVals: Record<string, string> = {};
    ph.forEach((k) => {
      if (!isCoreStandardKey(k)) {
        initManualVals[k] = seedVals[k] ?? seedVals[k.toLowerCase()] ?? "";
      }
    });
    setDocxValues(initManualVals);

    const initialMerged = buildLetterMergeData({
      mode: letterMode,
      index: letterMode === "bulk" ? previewBulkIndex : 0,
      core: {
        nomor: currentPreviewNomor,
        recipient: currentPreviewRecipient,
        subject: nextSubject,
        location: loc,
        date: letterDate || today,
      },
      manualValues: initManualVals,
      excelColumns,
      excelRowsData,
      activePlaceholders: ph,
    });

    if (b64) {
      renderFilledDocxPreview(b64, initialMerged, activePreviewLetterId);
    } else {
      setCreateContent(parsed.html || tmpl.content);
      if (canvasTextareaRef.current) {
        canvasTextareaRef.current.innerHTML = sanitizeLetterHtml(parsed.html || tmpl.content, {
          preservePlaceholders: true,
          preserveDocxLayout: true,
        });
      }
    }
  };

  const previewMergedData = React.useMemo(
    () => getRowDataForIndex(letterMode === "bulk" ? previewBulkIndex : 0),
    [getRowDataForIndex, letterMode, previewBulkIndex]
  );

  const templateSyncRef = useRef({
    createTemplate,
    applyTemplateSelection,
    getRowDataForIndex,
    previewMergedData,
    renderFilledDocxPreview,
    pendingEditTemplateMeta,
  });
  useEffect(() => {
    templateSyncRef.current = {
      createTemplate,
      applyTemplateSelection,
      getRowDataForIndex,
      previewMergedData,
      renderFilledDocxPreview,
      pendingEditTemplateMeta,
    };
  });

  // Sinkronisasi Template Custom dari Database (terisolasi per tenant + real-time sync)
  useEffect(() => {
    if (!dialogOpen) return;
    let active = true;
    const effectiveTenantFilter =
      isEditMode && editingMail?.commissariat ? editingMail.commissariat : activeTenant;

    const fetchScopedTemplates = () => {
      db.getSuratTemplates()
        .then((res) => {
          if (!active || !res || !Array.isArray(res)) return;
          const scoped = currentUser
            ? res.filter((t) =>
                isRecordInTenant(
                  currentUser,
                  {
                    commissariat: t.commissariat,
                    komisariat_id: t.komisariat_id,
                    tenant_id: t.tenant_id || t.komisariat_id
                  },
                  effectiveTenantFilter
                )
              )
            : res;

          setCustomTemplates(scoped);

          // Di Mode Edit: jangan timpa isi surat yang sedang diedit dengan template default.
          // Jika surat punya metadata template .docx tersimpan, pulihkan template & variabelnya otomatis!
          if (isEditMode) {
            const pendingMeta = templateSyncRef.current.pendingEditTemplateMeta;
            if (pendingMeta?.templateId) {
              const matchedTmpl =
                scoped.find((t) => t.id === pendingMeta.templateId) ||
                res.find((t) => t.id === pendingMeta.templateId);
              setPendingEditTemplateMeta(null);
              if (matchedTmpl) {
                setCreateTemplate(matchedTmpl.id);
                void templateSyncRef.current.applyTemplateSelection(matchedTmpl, {
                  preserveExistingFields: true,
                  initialDocxValues: pendingMeta.docxValues,
                });
              }
            }
            return;
          }

          const currentTemplateId = templateSyncRef.current.createTemplate;
          const stillExists = Boolean(
            currentTemplateId && scoped.some((t) => t.id === currentTemplateId)
          );

          if (!stillExists) {
            if (scoped.length > 0) {
              setCreateTemplate(scoped[0].id);
              void templateSyncRef.current.applyTemplateSelection(scoped[0]);
            } else {
              setCreateTemplate("");
              setActiveFileBase64("");
              setActivePlaceholders([]);
              setCreateContent("");
            }
          }
        })
        .catch((e) => {
          console.error("Gagal memuat template dari database:", e);
        });
    };

    fetchScopedTemplates();

    const handleTableSync = (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      if (detail?.table === "surat_templates") {
        fetchScopedTemplates();
      }
    };
    window.addEventListener("PMII_TABLE_SYNC", handleTableSync);

    return () => {
      active = false;
      window.removeEventListener("PMII_TABLE_SYNC", handleTableSync);
    };
  }, [dialogOpen, isEditMode, editingMail?.id, editingMail?.commissariat, letterMode, currentUser, activeTenant]);

  const handleTemplateChange = (val: string | null) => {
    if (!val) return;
    setCreateTemplate(val);
    setPendingEditTemplateMeta(null);

    if (val === EXISTING_DOCUMENT_TEMPLATE_ID) {
      setActiveFileBase64("");
      setActivePlaceholders([]);
      setCreateContent(savedExistingHtml);
      if (canvasTextareaRef.current) {
        canvasTextareaRef.current.innerHTML = sanitizeLetterHtml(savedExistingHtml, {
          preservePlaceholders: true,
          preserveDocxLayout: true,
        });
      }
      return;
    }

    const customTmpl = customTemplates.find((t) => t.id === val);
    if (customTmpl) {
      void applyTemplateSelection(customTmpl, { preserveExistingFields: isEditMode });
    }
  };

  // Debounced auto-render saat data placeholder, nomor, penerima, ID surat, atau baris Excel berubah
  useEffect(() => {
    if (activeFileBase64) {
      const timer = setTimeout(() => {
        renderFilledDocxPreview(activeFileBase64, previewMergedData, activePreviewLetterId);
      }, 350);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewMergedData, activeFileBase64, activePreviewLetterId, activeOrgLabel]);


  const handleBoxChange = (index: number, value: string, setBoxState: (val: string) => void, maxLength: number) => {
    setBoxState(value);
    if (value.length >= maxLength && index < 8) {
      boxRefs[index + 1]?.current?.focus();
    }
  };

  // Bangun HTML canvas default surat resmi PMII dengan placeholder lengkap
  const buildCanvasHtml = (forceFresh = false) => {
    if (!forceFresh && createContent && createContent.trim().length > 0) {
      return createContent;
    }

    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const today = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;
    const bodyParagraph = plainTextFallbackNote
      ? `<p style="margin:0 0 8px 0; white-space:pre-line;">${escapeHtml(plainTextFallbackNote)}</p>`
      : `<p style="margin:0 0 8px 0;">Sehubungan dengan akan dilaksanakannya agenda kegiatan organisasi Pengurus Komisariat PMII, maka dengan ini kami memohon/mengundang Sahabat/i untuk dapat hadir pada:</p>

    <div style="margin:10px 0 10px 24px; font-size:13px;">
      <table style="border-collapse:collapse; font-size:13px;">
        <tr><td style="width:110px; padding:3px 0;">Hari / Tanggal</td><td style="width:10px;">:</td><td style="font-weight:bold;">{{tanggal}}</td></tr>
        <tr><td style="padding:3px 0;">Waktu</td><td>:</td><td>09.00 WIB s.d Selesai</td></tr>
        <tr><td style="padding:3px 0;">Tempat</td><td>:</td><td>Gedung PCNU Lt. 2 Purwodadi</td></tr>
        <tr><td style="padding:3px 0;">Agenda Acara</td><td>:</td><td style="font-weight:bold; color:#1e3a8a;">{{perihal}}</td></tr>
      </table>
    </div>`;

    return `<div style="font-family:'Arial Narrow', Arial, sans-serif; line-height:1.45; color:#0f172a; max-width:100%;">
  <!-- KOP SURAT PMII -->
  <div style="display:flex; align-items:center; justify-content:center; gap:16px; border-bottom:3px double #1e3a8a; padding-bottom:10px; margin-bottom:16px;">
    <img src="${createLogoUrl || '/image/logo_komsat.png'}" alt="Logo PMII" style="width:64px; height:64px; object-fit:contain;" />
    <div style="text-align:center;">
      <div style="font-size:11px; font-weight:bold; letter-spacing:1px; color:#1e3a8a; text-transform:uppercase;">${createKopSubtitle}</div>
      <div style="font-size:16px; font-weight:900; color:#1e3a8a; letter-spacing:0.5px; text-transform:uppercase;">${createKopTitle}</div>
      <div style="font-size:11px; font-style:italic; color:#475569;">${createKopEnglish}</div>
      <div style="font-size:9.5px; color:#334155; margin-top:3px; white-space:pre-line;">${createKopAddress}</div>
    </div>
  </div>

  <!-- NOMOR & TANGGAL -->
  <table style="width:100%; margin-bottom:14px; font-size:13px; border-collapse:collapse;">
    <tbody>
      <tr>
        <td style="width:75px; padding:2px 0;">Nomor</td>
        <td style="width:10px; padding:2px 0;">:</td>
        <td style="padding:2px 0; font-weight:bold;" data-field="nomor-value">{{nomor}}</td>
        <td style="text-align:right; padding:2px 0;" data-field="location-date">${createSenderLocation || "Purwodadi"}, ${letterDate || today}</td>
      </tr>
      <tr>
        <td style="padding:2px 0;">Lampiran</td>
        <td style="padding:2px 0;">:</td>
        <td style="padding:2px 0;">- (Satu Berkas)</td>
        <td></td>
      </tr>
      <tr>
        <td style="padding:2px 0;">Perihal</td>
        <td style="padding:2px 0;">:</td>
        <td style="padding:2px 0; font-weight:bold; color:#1e3a8a;" data-field="perihal-value">{{perihal}}</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <!-- KEPADA YTH / PENERIMA -->
  <div style="margin-bottom:16px; font-size:13px; line-height:1.5;">
    Kepada Yang Terhormat:<br/>
    <b style="font-size:13.5px;" data-field="recipient-name">{{penerima}}</b><br/>
    <span style="color:#1e3a8a; font-weight:600;">{{jabatan}}</span> <span>{{instansi}}</span><br/>
    di - Tempat
  </div>

  <!-- SALAM & REDAKSI ISI SURAT -->
  <div style="font-size:13px; line-height:1.65; text-align:justify; margin-bottom:20px;">
    <p style="margin:0 0 8px 0;"><i><b>Assalamu'alaikum Warahmatullahi Wabarakatuh</b></i></p>
    <p style="margin:0 0 8px 0;">Salam silaturrahim teriring do'a kami sampaikan kepada Sahabat/i, semoga senantiasa dalam lindungan Allah SWT serta eksis dalam menjalankan aktifitas keseharian. Amin.</p>
    ${bodyParagraph}
    <p style="margin:0 0 8px 0;">Demikian surat permohonan ini kami sampaikan, atas perhatian dan kehadirannya kami haturkan terima kasih.</p>
    <p style="margin:0 0 4px 0;"><i><b>Wallahul Muwaffiq Ila Aqwamith Thariq</b></i></p>
    <p style="margin:0 0 16px 0;"><i><b>Wassalamu'alaikum Warahmatullahi Wabarakatuh</b></i></p>
  </div>

  <!-- TANDA TANGAN PIMPINAN -->
  <div style="margin-top:24px; font-size:13px;">
    <div style="text-align:center; font-weight:bold; margin-bottom:50px;">
      ${escapeHtml(createKopSubtitle || (isCabangScope ? "PENGURUS CABANG" : "PENGURUS KOMISARIAT"))}<br/>
      ${escapeHtml(createKopTitle)}
    </div>
    <table style="width:100%; text-align:center; font-size:13px;">
      <tr>
        <td style="width:50%;">
          <b>${escapeHtml(activeSenderTitle)}</b><br/><br/><br/><br/>
          <u><b>( ........................... )</b></u><br/>
          NIA. ...........................
        </td>
        <td style="width:50%;">
          <b>Sekretaris</b><br/><br/><br/><br/>
          <u><b>( ........................... )</b></u><br/>
          NIA. ...........................
        </td>
      </tr>
    </table>
  </div>
</div>`;
  };

  const updateCanvasFields = () => {
    const canvas = canvasTextareaRef.current;
    if (!canvas) return;
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const today = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;
    const set = (field: string, val: string, isHtml = false) => {
      const el = canvas.querySelector(`[data-field="${field}"]`) as HTMLElement | null;
      if (!el) return;
      if (isHtml) {
        el.innerHTML = sanitizeLetterHtml(val, {
          preservePlaceholders: true,
          preserveDocxLayout: true,
        });
      } else {
        el.textContent = val;
      }
    };

    set("nomor-value", currentPreviewNomor);
    if (currentPreviewSubject) set("perihal-value", currentPreviewSubject);
    set("location-date", `${currentPreviewLocation || "Purwodadi"}, ${letterDate || today}`);
    if (currentPreviewRecipient) set("recipient-name", currentPreviewRecipient);
    if (currentPreviewFooterLeft) set("footer-text", currentPreviewFooterLeft);

    // Ambil data baris saat ini (dari Excel atau form isian variabel)
    const currentRowData = getRowDataForIndex(letterMode === "bulk" ? previewBulkIndex : 0);

    // Update semua elemen [data-placeholder] yang sudah terpasang di canvas
    const placeholderEls = canvas.querySelectorAll<HTMLElement>("[data-placeholder]");
    placeholderEls.forEach((el) => {
      const key = el.getAttribute("data-placeholder") || "";
      const cleanKey = key.toLowerCase();
      const val =
        currentRowData[key] ??
        currentRowData[cleanKey] ??
        docxValues[key] ??
        docxValues[cleanKey] ??
        "";

      el.textContent = val || `{{${key}}}`;
    });

    // Pindai teks mentah {{key}} yang mungkin baru diketik pengguna dan konversikan ke live span
    scanAndConvertRawPlaceholders(canvas, currentRowData);
  };

  // Pindai dan ubah {{placeholder}} yang diketik manual menjadi span variabel aktif
  const scanAndConvertRawPlaceholders = (
    canvas: HTMLElement,
    rowData: Record<string, string>
  ) => {
    const inner = canvas.innerHTML;
    if (!inner.includes("{{")) return;

    let hasChange = false;
    const updatedHtml = inner.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (match, rawKey) => {
      const cleanKey = rawKey.toLowerCase();
      const val =
        rowData[rawKey] ??
        rowData[cleanKey] ??
        docxValues[rawKey] ??
        docxValues[cleanKey] ??
        "";

      hasChange = true;
      setActivePlaceholders((prev) => (prev.includes(cleanKey) ? prev : [...prev, cleanKey]));

      const displayContent = escapeHtml(val || `{{${rawKey}}}`);
      const safeKey = escapeHtml(cleanKey);
      return `<span data-placeholder="${safeKey}" style="color:#1d4ed8; font-weight:600; text-decoration:underline decoration-dotted; text-underline-offset:3px;" title="Variabel: {{${safeKey}}}">${displayContent}</span>`;
    });

    if (hasChange) {
      const safeUpdated = sanitizeLetterHtml(updatedHtml, {
        preservePlaceholders: true,
        preserveDocxLayout: true,
      });
      canvas.innerHTML = safeUpdated;
      setCreateContent(safeUpdated);
    }
  };

  // Canvas initialization: Untuk direct-edit dokumen & template HTML tersimpan (non-DOCX live)
  useEffect(() => {
    if (!activeFileBase64 && dialogOpen) {
      const el = canvasTextareaRef.current;
      if (!el) return;

      // Jangan tampilkan template kosong bawaan jika pengguna belum memiliki / memilih template surat
      if (!isEditMode && !createTemplate && !createContent) {
        el.innerHTML = "";
        return;
      }

      if (letterMode === "bulk" && htmlCanvasMode === "preview") {
        const fullData = getRowDataForIndex(previewBulkIndex, "bulk");
        let previewHtml = replacePlaceholdersInHtml(createContent || buildCanvasHtml(), fullData);
        if (activeQrMeta && activeQrMeta.letterId === activePreviewLetterId) {
          const footerHtml = buildHtmlQrFooter({
            letterId: activePreviewLetterId,
            nomor: currentPreviewNomor,
            qrDataUrl: activeQrMeta.qrDataUrl,
            verificationUrl: activeQrMeta.verificationUrl,
            orgLabel: activeOrgLabel,
          });
          previewHtml = upsertHtmlQrFooter(previewHtml, footerHtml);
        }
        el.innerHTML = sanitizeLetterHtml(previewHtml, { preserveDocxLayout: true });
      } else {
        if (createContent) {
          el.innerHTML = sanitizeLetterHtml(createContent, {
            preservePlaceholders: true,
            preserveDocxLayout: true,
          });
        } else if (isEditMode) {
          el.innerHTML = sanitizeLetterHtml(buildCanvasHtml(), {
            preservePlaceholders: true,
            preserveDocxLayout: true,
          });
        }
        updateCanvasFields();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dialogOpen,
    editingMail?.id,
    createTemplate,
    activeFileBase64,
    letterMode,
    htmlCanvasMode,
    previewBulkIndex,
    currentPreviewNomor,
    currentPreviewRecipient,
    currentPreviewSubject,
    currentPreviewLocation,
    letterDate,
    excelRowsData,
    docxValues,
    activePlaceholders,
    bulkRecipientsText,
    activeQrMeta,
    activePreviewLetterId,
    activeOrgLabel
  ]);

  // Jika template DOCX aktif dan dialog dibuka, render preview Word asli
  useEffect(() => {
    if (dialogOpen && activeFileBase64) {
      const timer = setTimeout(() => {
        void templateSyncRef.current.renderFilledDocxPreview(
          activeFileBase64,
          templateSyncRef.current.previewMergedData
        );
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [dialogOpen, activeFileBase64]);

  useEffect(() => {
    if (!activeFileBase64 && (letterMode !== "bulk" || htmlCanvasMode === "edit")) {
      updateCanvasFields();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPreviewNomor,
    currentPreviewSubject,
    currentPreviewLocation,
    currentPreviewRecipient,
    currentPreviewFooterLeft,
    activeFileBase64,
    htmlCanvasMode,
    letterMode
  ]);

  const handlePrintLetter = (overrideHtml?: string) => {
    const rawHtmlToPrint =
      overrideHtml ?? document.getElementById("custom-letter-print-area")?.innerHTML;
    if (!rawHtmlToPrint) return;
    const htmlToPrint = overrideHtml
      ? rawHtmlToPrint
      : injectOverlaysIntoLetterHtml(rawHtmlToPrint, letterOverlays);
    openLetterPrintWindow(
      currentPreviewNomor || "Surat_PMII",
      htmlToPrint,
      () => toast.error("Gagal membuka jendela cetak. Pastikan izin pop-up browser aktif.")
    );
  };

  // Render seluruh halaman surat massal menjadi 1 dokumen arsip terpadu dengan 1 UUID QR verifikasi
  const buildBulkRenderedOutputs = async (): Promise<{
    combinedPrintHtml: string;
    unifiedLetterId: string;
  }> => {
    const unifiedLetterId = editingMail?.id || singleLetterId;
    const qrMeta = await getOrCreateQrMeta(unifiedLetterId);
    const rawPagesHtml: string[] = [];

    if (activeFileBase64) {
      const arrayBuffer = base64ToArrayBuffer(activeFileBase64);

      for (let i = 0; i < parsedBulkRecipients.length; i++) {
        const data = getRowDataForIndex(i, "bulk");
        const nomor = getNomorForIndex(i);

        // Jangan sematkan overlay ke DOCX buffer di sini karena akan dirender HTML + injectOverlaysIntoLetterHtml
        const { arrayBuffer: filledBuffer } = fillDocxTemplate(
          arrayBuffer,
          data,
          undefined,
          {
            qrDataUrl: qrMeta.qrDataUrl,
            letterId: unifiedLetterId,
            nomor,
            verificationUrl: qrMeta.verificationUrl,
            orgLabel: activeOrgLabel,
          }
        );
        const pageEl = document.createElement("div");
        await renderDocxToElement(filledBuffer, pageEl);
        rawPagesHtml.push(injectOverlaysIntoLetterHtml(pageEl.innerHTML, letterOverlays));
      }
    } else {
      const baseHtml = stripLetterOverlaysFromHtml(
        stripLetterEditMetadata(
          createContent || (canvasTextareaRef.current?.innerHTML ?? buildCanvasHtml())
        )
      );
      if (baseHtml.includes("bulk-letter-page")) {
        const container = document.createElement("div");
        container.innerHTML = sanitizeLetterHtml(baseHtml, { preserveDocxLayout: true });
        const bulkPages = container.querySelectorAll(".bulk-letter-page");
        if (bulkPages.length > 0 && letterOverlays.length > 0) {
          bulkPages.forEach((pageNode) => {
            pageNode.innerHTML = injectOverlaysIntoLetterHtml(pageNode.innerHTML, letterOverlays);
          });
        }
        return {
          combinedPrintHtml: container.innerHTML,
          unifiedLetterId,
        };
      }
      for (let i = 0; i < parsedBulkRecipients.length; i++) {
        const fullData = getRowDataForIndex(i, "bulk");
        const nomor = getNomorForIndex(i);

        const footerHtml = buildHtmlQrFooter({
          letterId: unifiedLetterId,
          nomor,
          qrDataUrl: qrMeta.qrDataUrl,
          verificationUrl: qrMeta.verificationUrl,
          orgLabel: activeOrgLabel,
        });
        const mergedWithFooter = upsertHtmlQrFooter(
          replacePlaceholdersInHtml(baseHtml, fullData),
          footerHtml
        );
        const renderedHtml = sanitizeLetterHtml(mergedWithFooter, {
          preserveDocxLayout: true,
        });
        rawPagesHtml.push(injectOverlaysIntoLetterHtml(renderedHtml, letterOverlays));
      }
    }

    return {
      combinedPrintHtml: deduplicateBulkPagesHtml(rawPagesHtml),
      unifiedLetterId,
    };
  };

  const openBulkPrintWindow = (combinedPrintHtml: string) => {
    const allStyles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((el) => el.outerHTML)
      .join("\n");

    const printTitle = `Surat_Massal_PMII_${parsedBulkRecipients.length}_Penerima`;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Pastikan izin pop-up browser aktif.");
      return;
    }

    const cleanBulkHtml = stripLetterEditMetadata(combinedPrintHtml);
    const { htmlClassAttr, fontVarsCss, baseHref } = buildPrintFontContext();
    const printStyles = buildDocxPrintStyleBlock(cleanBulkHtml, {
      fontVarsCss,
      isBulk: true,
    });

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id" class="${escapeHtml(htmlClassAttr)}">
          <head>
            <meta charset="utf-8">
            ${baseHref ? `<base href="${escapeHtml(baseHref)}">` : ""}
            <title>${escapeHtml(printTitle)}</title>
            ${allStyles}
            <style>${printStyles}</style>
          </head>
          <body>
            <div id="custom-letter-print-area">
              ${cleanBulkHtml}
            </div>
            ${buildPrintAutoTriggerScript(280)}
          </body>
        </html>
      `);
    printWindow.document.close();
  };

  const handleCloseGenerator = React.useCallback(() => {
    setIsOpen(false);
    onCloseEdit?.();
    setHasAutoFilled(false);
    setDuplicateConfirmMode(null);
    setPendingEditTemplateMeta(null);
    setUseCustomNomor(false);
    setCustomNomorInput("");
    setSavedExistingHtml("");
    setPlainTextFallbackNote("");
    setCreateContent("");
    setActiveFileBase64("");
    setActivePlaceholders([]);
    setDocxValues({});
    setCreateTemplate("");
    setCreateRecipient("");
    setCreateSubject("");
    setBulkRecipientsText("");
    setIsSequentialNumbering(true);
    setExcelColumns([]);
    setExcelRowsData([]);
    setPreviewBulkIndex(0);
    setLetterMode("single");
    setLetterOverlays([]);
    setSelectedOverlayId(null);
    setOverlayRawMap({});
    setOverlayPageCount(1);
    printAfterSaveRef.current = false;
    resetDraftLetterIds();
  }, [onCloseEdit, resetDraftLetterIds]);

  const executePublish = async (mode: "single" | "bulk") => {
    setDuplicateConfirmMode(null);

    if (mode === "bulk") {
      setIsBatchPrinting(true);
      if (isEditMode) {
        setSavingEditAction(printAfterSaveRef.current ? "save_print" : "save");
      }
      try {
        const { combinedPrintHtml, unifiedLetterId } = await buildBulkRenderedOutputs();
        const firstNomor = getNomorForIndex(0);
        const lastNomor = getNomorForIndex(Math.max(0, parsedBulkRecipients.length - 1));
        const bulkNomorSummary = formatBulkNomorSummary(
          firstNomor,
          lastNomor,
          parsedBulkRecipients.length,
          isSequentialNumbering
        );
        const bulkRecipientSummary = formatBulkRecipientSummary(parsedBulkRecipients);
        const finalBulkContent = embedLetterEditMetadata(combinedPrintHtml, {
          v: 1,
          templateId:
            createTemplate && createTemplate !== EXISTING_DOCUMENT_TEMPLATE_ID
              ? createTemplate
              : "",
          docxValues,
          mode: "bulk",
          bulk: {
            recipients: parsedBulkRecipients,
            isSequentialNumbering,
            startNomor: firstNomor,
            excelColumns,
            excelRowsData,
          },
          ...(letterOverlays.length > 0 ? { overlays: letterOverlays } : {}),
        });

        if (isEditMode && editingMail && onUpdateMail) {
          const trimmedDateIndo = letterDate.trim() || editingMail.dateIndo || "";
          const resolvedIsoDate =
            trimmedDateIndo && trimmedDateIndo !== editingMail.dateIndo
              ? parseMailDateToIso("", trimmedDateIndo)
              : parseMailDateToIso(editingMail.date, trimmedDateIndo);

          const updatedBulkMail: MailItem = enforceTenantWrite<MailItem>(
            currentUser,
            {
              ...editingMail,
              id: editingMail.id,
              nomor: bulkNomorSummary,
              type: "KELUAR",
              senderOrRecipient: bulkRecipientSummary,
              subject: currentPreviewSubject.trim(),
              classification: createClassification,
              status: normalizeMailStatusForType(editStatus, "KELUAR"),
              content: finalBulkContent,
              senderTitle: activeSenderTitle,
              senderLocation: currentPreviewLocation.trim() || "Purwodadi",
              date: resolvedIsoDate,
              dateIndo: trimmedDateIndo || formatDateToIndo(resolvedIsoDate),
            },
            targetTenantInfo.tenantOverrideForWrite
          );

          await onUpdateMail(updatedBulkMail);
          if (printAfterSaveRef.current) {
            openBulkPrintWindow(combinedPrintHtml);
          }
          handleCloseGenerator();
          return;
        }

        // Simpan seluruh surat massal sebagai 1 arsip terpadu agar mudah direvisi & diperbarui
        await onPublish({
          id: unifiedLetterId,
          nomor: bulkNomorSummary,
          recipient: bulkRecipientSummary,
          subject: currentPreviewSubject.trim(),
          classification: createClassification,
          content: finalBulkContent,
          senderTitle: activeSenderTitle,
          senderLocation: currentPreviewLocation,
          dateIndo: letterDate,
          bulkCount: parsedBulkRecipients.length,
        });
        openBulkPrintWindow(combinedPrintHtml);
        handleCloseGenerator();
      } catch (e: any) {
        console.error(
          isEditMode ? "Gagal memperbarui surat massal:" : "Gagal menerbitkan surat massal:",
          e
        );
        toast.error(
          (isEditMode ? "Gagal memperbarui surat massal: " : "Gagal menerbitkan surat massal: ") +
            (e?.message || "Kesalahan tidak diketahui")
        );
      } finally {
        setIsBatchPrinting(false);
        setSavingEditAction(null);
        printAfterSaveRef.current = false;
      }
      return;
    }

    if (isEditMode) {
      setSavingEditAction(printAfterSaveRef.current ? "save_print" : "save");
    }

    try {
      const letterId = getLetterIdForIndex();
      const qrMeta = await getOrCreateQrMeta(letterId);
      const singleData = getRowDataForIndex(0, "single");

      let finalSingleContent = "";
      let printableSingleContent = "";
      if (activeFileBase64) {
        const arrayBuffer = base64ToArrayBuffer(activeFileBase64);
        const { arrayBuffer: filledBuffer } = fillDocxTemplate(arrayBuffer, singleData, undefined, {
          qrDataUrl: qrMeta.qrDataUrl,
          letterId,
          nomor: currentPreviewNomor,
          verificationUrl: qrMeta.verificationUrl,
          orgLabel: activeOrgLabel,
        });
        const renderTarget = document.createElement("div");
        await renderDocxToElement(filledBuffer, renderTarget);
        const renderedWithOverlays = injectOverlaysIntoLetterHtml(
          renderTarget.innerHTML,
          letterOverlays
        );
        printableSingleContent = renderedWithOverlays;
        const resolvedTemplateId =
          createTemplate && createTemplate !== EXISTING_DOCUMENT_TEMPLATE_ID
            ? createTemplate
            : "";
        finalSingleContent =
          resolvedTemplateId || letterOverlays.length > 0
            ? embedLetterEditMetadata(renderedWithOverlays, {
                v: 1,
                templateId: resolvedTemplateId,
                docxValues,
                ...(letterOverlays.length > 0 ? { overlays: letterOverlays } : {}),
              })
            : renderedWithOverlays;
      } else {
        const rawSingleHtml = stripLetterOverlaysFromHtml(
          stripLetterEditMetadata(
            (canvasTextareaRef.current?.innerHTML || createContent || buildCanvasHtml()).trim()
          )
        );
        const alreadyHasDocxEmbeddedQr =
          rawSingleHtml.includes("docx-wrapper") && /<footer\b[\s\S]*?<img\b/i.test(rawSingleHtml);

        let sanitizedSingleHtml = "";
        if (alreadyHasDocxEmbeddedQr) {
          sanitizedSingleHtml = sanitizeLetterHtml(rawSingleHtml, {
            preserveDocxLayout: true,
          });
        } else {
          const footerHtml = buildHtmlQrFooter({
            letterId,
            nomor: currentPreviewNomor,
            qrDataUrl: qrMeta.qrDataUrl,
            verificationUrl: qrMeta.verificationUrl,
            orgLabel: activeOrgLabel,
          });
          sanitizedSingleHtml = sanitizeLetterHtml(
            upsertHtmlQrFooter(replacePlaceholdersInHtml(rawSingleHtml, singleData), footerHtml),
            { preserveDocxLayout: true }
          );
        }
        const singleWithOverlays = injectOverlaysIntoLetterHtml(
          sanitizedSingleHtml,
          letterOverlays
        );
        printableSingleContent = singleWithOverlays;
        finalSingleContent =
          letterOverlays.length > 0
            ? embedLetterEditMetadata(singleWithOverlays, {
                v: 1,
                templateId: "",
                docxValues,
                overlays: letterOverlays,
              })
            : singleWithOverlays;
      }

      if (isEditMode && editingMail && onUpdateMail) {
        const trimmedDateIndo = letterDate.trim() || editingMail.dateIndo || "";
        const resolvedIsoDate =
          trimmedDateIndo && trimmedDateIndo !== editingMail.dateIndo
            ? parseMailDateToIso("", trimmedDateIndo)
            : parseMailDateToIso(editingMail.date, trimmedDateIndo);

        const updatedMail: MailItem = enforceTenantWrite<MailItem>(
          currentUser,
          {
            ...editingMail,
            id: editingMail.id,
            nomor: currentPreviewNomor,
            type: "KELUAR",
            senderOrRecipient: currentPreviewRecipient.trim(),
            subject: currentPreviewSubject.trim(),
            classification: createClassification,
            status: normalizeMailStatusForType(editStatus, "KELUAR"),
            content: finalSingleContent,
            senderTitle: activeSenderTitle,
            senderLocation: currentPreviewLocation.trim() || "Purwodadi",
            date: resolvedIsoDate,
            dateIndo: trimmedDateIndo || formatDateToIndo(resolvedIsoDate),
          },
          targetTenantInfo.tenantOverrideForWrite
        );

        await onUpdateMail(updatedMail);
        if (printAfterSaveRef.current) {
          handlePrintLetter(printableSingleContent);
        }
        handleCloseGenerator();
        return;
      }

      await onPublish({
        id: letterId,
        nomor: currentPreviewNomor,
        recipient: currentPreviewRecipient,
        subject: currentPreviewSubject,
        classification: createClassification,
        content: finalSingleContent,
        senderTitle: activeSenderTitle,
        senderLocation: currentPreviewLocation,
        dateIndo: letterDate
      });
      handlePrintLetter(printableSingleContent);
      handleCloseGenerator();
    } catch (e: any) {
      console.error(isEditMode ? "Gagal memperbarui surat:" : "Gagal menerbitkan surat:", e);
      toast.error(
        (isEditMode ? "Gagal memperbarui surat: " : "Gagal menerbitkan surat: ") +
          (e?.message || "Periksa koneksi atau hak akses Anda.")
      );
    } finally {
      setSavingEditAction(null);
      printAfterSaveRef.current = false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingEdit || isBatchPrinting) return;

    if (!isEditMode && !createTemplate && !activeFileBase64 && !createContent.trim()) {
      toast.error("Silakan pilih atau unggah template surat Word (.docx) terlebih dahulu.");
      return;
    }

    if (letterMode === "bulk") {
      if (!createSubject.trim()) {
        toast.error("Perihal surat tidak boleh kosong.");
        return;
      }
      if (parsedBulkRecipients.length === 0) {
        toast.error("Silakan masukkan minimal 1 nama penerima surat massal.");
        return;
      }
      if (bulkDuplicateEntries.length > 0) {
        setDuplicateConfirmMode("bulk");
        return;
      }
      await executePublish("bulk");
    } else {
      if (!currentPreviewNomor.trim()) {
        toast.error("Nomor surat tidak boleh kosong.");
        return;
      }
      if (!createSubject.trim()) {
        toast.error("Perihal surat tidak boleh kosong.");
        return;
      }
      if (!createRecipient.trim()) {
        toast.error("Tujuan / penerima surat tidak boleh kosong.");
        return;
      }
      if (duplicateEntry) {
        setDuplicateConfirmMode("single");
        return;
      }
      await executePublish("single");
    }
  };

  const isDocxStyledCanvas =
    Boolean(activeFileBase64) || createContent.includes("docx-wrapper");

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onCloseEdit?.();
          setLetterMode("single");
          setIsOpen(true);
        }}
        className="h-9 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer border-none shrink-0"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>Buat Surat Resmi</span>
      </button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseGenerator();
          } else {
            setIsOpen(true);
          }
        }}
      >
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-screen max-w-none h-screen max-h-none bg-white dark:bg-zinc-900 border-none rounded-none ring-0 shadow-none p-0 gap-0 flex flex-col overflow-hidden z-50"
        style={{ transform: "none", translate: "none" }}
      >
        {/* Header Modul (Mengikuti Standar Verifikasi) */}
        <DialogHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isEditMode
                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                    : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                }`}
              >
                {isEditMode ? <Edit3 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {isEditMode
                      ? letterMode === "bulk"
                        ? "Edit Surat Massal"
                        : "Edit Surat Keluar"
                      : "Pembuat Surat Resmi"}
                  </DialogTitle>
                  {isEditMode && editingMail && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                    >
                      {editingMail.nomor}
                    </Badge>
                  )}
                  {letterMode === "bulk" && parsedBulkRecipients.length > 0 && (
                    <Badge className="text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-none">
                      1 Arsip · {parsedBulkRecipients.length} Penerima
                    </Badge>
                  )}
                </div>
                <DialogDescription className={isEditMode ? "text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate" : "sr-only"}>
                  {isEditMode
                    ? letterMode === "bulk"
                      ? "Revisi isi surat, template, atau daftar penerima sekaligus dalam 1 arsip surat massal terpadu"
                      : "Sunting isi surat, template Word, atau metadata — QR Code verifikasi tetap terhubung dengan surat ini"
                    : "Formulir pembuatan surat resmi PMII"}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isEditMode && editingMail && onOpenArchiveEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const target = editingMail;
                    handleCloseGenerator();
                    onOpenArchiveEdit(target);
                  }}
                  className="h-8 px-2.5 text-[11px] font-medium border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  title="Kelola berkas lampiran PDF/scan atau ubah jenis arsip surat"
                >
                  <Paperclip className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="hidden sm:inline">Lampiran &amp; Arsip</span>
                </Button>
              )}

              <DialogClose render={
                <button className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer border-none">
                  <X className="w-4 h-4" />
                </button>
              } />
            </div>
          </div>
        </DialogHeader>

        {/* Workspace Panel */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
          {/* Sisi Kiri: Form Input & Konfigurasi */}
          {(() => {
            const selectedTemplateObj = customTemplates.find((t) => t.id === createTemplate);
            const detailPlaceholders = activePlaceholders.filter((k) => !isCoreStandardKey(k));

            return (
              <form
                onSubmit={handleSubmit}
                className="lg:col-span-4 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 h-full flex flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  {/* CARD 1: PILIHAN TEMPLATE SURAT */}
                  <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5 shadow-none">
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Template Surat
                        </span>
                      </div>

                      {onOpenTemplateManager && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            onOpenTemplateManager();
                          }}
                          className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1 cursor-pointer border-none bg-transparent hover:underline"
                          title="Buka panel pengelolaan template surat"
                        >
                          <Bookmark className="w-3 h-3" />
                          <span>Kelola Template</span>
                        </button>
                      )}
                    </div>

                    <Select value={createTemplate} onValueChange={handleTemplateChange}>
                      <SelectTrigger className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <SelectValue placeholder="Pilih Template Surat">
                          {createTemplate === EXISTING_DOCUMENT_TEMPLATE_ID
                            ? "Dokumen Surat Saat Ini (Edit Langsung)"
                            : selectedTemplateObj?.name ||
                              (customTemplates.length === 0
                                ? "Belum ada template tersimpan"
                                : "Pilih Template Surat")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="border-zinc-200 dark:border-zinc-800 max-h-64">
                        {isEditMode && savedExistingHtml && (
                          <SelectItem value={EXISTING_DOCUMENT_TEMPLATE_ID}>
                            Dokumen Surat Saat Ini (Edit Langsung)
                          </SelectItem>
                        )}
                        {customTemplates.length > 0 ? (
                          <>
                            <div
                              className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 ${
                                isEditMode && savedExistingHtml
                                  ? "border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1"
                                  : ""
                              }`}
                            >
                              Template Tersimpan ({customTemplates.length})
                            </div>
                            {customTemplates.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                <div className="flex items-center justify-between w-full gap-2">
                                  <span className="truncate">{t.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        ) : (
                          <div className="px-3 py-3 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                            Belum ada template Word (.docx) tersimpan.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {!isEditMode && customTemplates.length === 0 && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 rounded-lg px-2.5 py-2 leading-relaxed">
                        Unggah minimal 1 template Word (<code>.docx</code>) di menu{" "}
                        {onOpenTemplateManager ? (
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              onOpenTemplateManager();
                            }}
                            className="font-bold underline cursor-pointer bg-transparent border-none p-0 text-amber-800 dark:text-amber-200"
                          >
                            Kelola Template
                          </button>
                        ) : (
                          <strong>Kelola Template</strong>
                        )}{" "}
                        untuk mulai membuat surat resmi.
                      </p>
                    )}
                  </div>

                  {/* CARD 2: INFORMASI SURAT */}
                  <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3 shadow-none">
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Informasi Surat
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAutoAssignNextNumber}
                        className="h-6 px-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded flex items-center gap-1 border border-blue-200/60 dark:border-blue-800/60 cursor-pointer shadow-none"
                        title="Ambil nomor urut berikutnya"
                      >
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        <span>No. Otomatis (#{getNextSeqNumber(scopedMailHistory)})</span>
                      </Button>
                    </div>

                    {/* Nomor Surat (9 Segmen PMII atau Format Kustom saat Edit) */}
                    {isEditMode && useCustomNomor ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                            Nomor Surat (Format Kustom) *
                          </label>
                          <button
                            type="button"
                            onClick={() => setUseCustomNomor(false)}
                            className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-transparent border-none"
                          >
                            Pakai 9 Segmen PMII
                          </button>
                        </div>
                        <Input
                          required
                          value={customNomorInput}
                          onChange={(e) => setCustomNomorInput(e.target.value)}
                          placeholder="Nomor surat resmi..."
                          className={`h-9 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 rounded-lg ${
                            duplicateEntry
                              ? "border-rose-400 dark:border-rose-700"
                              : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        />
                        {duplicateEntry && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>Nomor ini sudah digunakan pada &ldquo;{duplicateEntry.subject}&rdquo;.</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <LetterNumberingBoxes
                        boxes={[numBox1, numBox2, numBox3, numBox4, numBox5, numBox6, numBox7, numBox8, numBox9]}
                        onBoxChange={(index, val) => {
                          const setters = [
                            setNumBox1, setNumBox2, setNumBox3, setNumBox4, setNumBox5,
                            setNumBox6, setNumBox7, setNumBox8, setNumBox9
                          ];
                          setters[index](val);
                        }}
                        letterMode={letterMode}
                        isSequentialNumbering={isSequentialNumbering}
                        onToggleSequential={setIsSequentialNumbering}
                        bulkDuplicateEntries={bulkDuplicateEntries}
                        duplicateEntry={duplicateEntry}
                        duplicateSeqEntry={duplicateSeqEntry}
                        onAutoAssignNextNumber={handleAutoAssignNextNumber}
                        nextSeqNumber={getNextSeqNumber(scopedMailHistory)}
                        parsedBulkRecipientsLength={parsedBulkRecipients.length}
                        firstNomor={getNomorForIndex(0)}
                        lastNomor={getNomorForIndex(Math.max(0, parsedBulkRecipients.length - 1))}
                      />
                    )}

                    {/* Perihal Surat */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        Perihal Surat *
                      </label>
                      <Input
                        required
                        value={createSubject}
                        onChange={(e) => setCreateSubject(e.target.value)}
                        placeholder="Perihal / agenda surat..."
                        className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>

                    {/* Tujuan / Penerima */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Tujuan / Penerima *</span>
                        </label>
                        {/* Selector Mode Penerima (Tunggal vs Massal 1-Arsip) */}
                        <div className="inline-flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              if (!createRecipient.trim() && parsedBulkRecipients[0]) {
                                setCreateRecipient(parsedBulkRecipients[0]);
                              }
                              setLetterMode("single");
                            }}
                            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer border-none ${
                              letterMode === "single"
                                ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 bg-transparent font-medium"
                            }`}
                          >
                            1 Penerima
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!bulkRecipientsText.trim() && createRecipient.trim()) {
                                setBulkRecipientsText(createRecipient.trim());
                              }
                              setLetterMode("bulk");
                            }}
                            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer border-none flex items-center gap-1 ${
                              letterMode === "bulk"
                                ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 bg-transparent font-medium"
                            }`}
                          >
                            <span>Banyak (Excel)</span>
                            {parsedBulkRecipients.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[9px] font-bold">
                                {parsedBulkRecipients.length}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

                      {letterMode === "bulk" ? (
                        <>
                          <input
                            type="file"
                            ref={excelFileInputRef}
                            onChange={handleExcelUpload}
                            accept=".xlsx, .xls, .csv"
                            className="hidden"
                          />
                          <LetterExcelImporter
                            parsedBulkRecipients={parsedBulkRecipients}
                            bulkRecipientsText={bulkRecipientsText}
                            onBulkRecipientsChange={setBulkRecipientsText}
                            excelColumns={excelColumns}
                            excelRowsData={excelRowsData}
                            activePlaceholders={activePlaceholders}
                            docxValues={docxValues}
                            onUploadExcelClick={() => excelFileInputRef.current?.click()}
                            onDownloadExcelTemplate={handleDownloadExcelTemplate}
                            onLoadPreset={loadPresetRecipients}
                            onOpenAddPlaceholder={() => setIsAddPlaceholderOpen(true)}
                            onInsertPlaceholder={insertPlaceholderAtCursor}
                            previewBulkIndex={previewBulkIndex}
                            onSelectPreviewIndex={setPreviewBulkIndex}
                            getNomorForIndex={getNomorForIndex}
                            getRowDataForIndex={getRowDataForIndex}
                          />
                        </>
                      ) : (
                        <Input
                          required
                          value={createRecipient}
                          onChange={(e) => setCreateRecipient(e.target.value)}
                          placeholder="Nama tujuan / instansi penerima..."
                          className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      )}
                    </div>

                    {/* Kota & Tanggal */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                          Kota
                        </label>
                        <Input
                          value={createSenderLocation}
                          onChange={(e) => setCreateSenderLocation(e.target.value)}
                          placeholder="Purwodadi"
                          className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                          Tanggal
                        </label>
                        <Input
                          value={letterDate}
                          onChange={(e) => setLetterDate(e.target.value)}
                          placeholder="12 Oktober 2026"
                          className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Klasifikasi & Penandatangan */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                          Klasifikasi
                        </label>
                        <Select
                          value={createClassification}
                          onValueChange={(val) => {
                            if (val) {
                              setCreateClassification(val as typeof createClassification);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
                            <SelectValue placeholder="Pilih Klasifikasi" />
                          </SelectTrigger>
                          <SelectContent className="border-zinc-200 dark:border-zinc-800">
                            <SelectItem value="Permohonan" className="text-xs">Permohonan</SelectItem>
                            <SelectItem value="Undangan" className="text-xs">Undangan</SelectItem>
                            <SelectItem value="Instruksi" className="text-xs">Instruksi</SelectItem>
                            <SelectItem value="Keputusan" className="text-xs">Keputusan</SelectItem>
                            <SelectItem value="Rekomendasi" className="text-xs">Rekomendasi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                          Penandatangan
                        </label>
                        <Input
                          value={createSenderTitle}
                          onChange={(e) => setCreateSenderTitle(e.target.value)}
                          placeholder={isCabangScope ? "Ketua Cabang" : "Ketua Komisariat"}
                          className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Status Surat Keluar (khusus Mode Edit) */}
                    {isEditMode && (
                      <div className="space-y-1 pt-0.5">
                        <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                          Status Arsip Surat Keluar
                        </label>
                        <Select
                          value={normalizeMailStatusForType(editStatus, "KELUAR")}
                          onValueChange={(val) => {
                            if (val) setEditStatus(val as MailItem["status"]);
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
                            <SelectValue placeholder="Pilih Status" />
                          </SelectTrigger>
                          <SelectContent className="border-zinc-200 dark:border-zinc-800">
                            <SelectItem value="Terkirim" className="text-xs">Terkirim</SelectItem>
                            <SelectItem value="Diproses" className="text-xs">Diproses</SelectItem>
                            <SelectItem value="Selesai" className="text-xs">Selesai</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* CARD 3: ISIAN VARIABEL TEMPLATE & PLACEHOLDER KUSTOM */}
                  <LetterDocxPlaceholders
                    detailPlaceholders={detailPlaceholders}
                    docxValues={docxValues}
                    onDocxValueChange={(key, val) => {
                      const lowerKey = key.toLowerCase();
                      const matchedExcelCol = excelColumns.find(
                        (c) => c.key === lowerKey || c.originalHeader?.toLowerCase() === lowerKey
                      );
                      if (
                        letterMode === "bulk" &&
                        excelRowsData[previewBulkIndex] &&
                        (matchedExcelCol ||
                          Object.prototype.hasOwnProperty.call(excelRowsData[previewBulkIndex].data, key) ||
                          Object.prototype.hasOwnProperty.call(excelRowsData[previewBulkIndex].data, lowerKey))
                      ) {
                        setExcelRowsData((prev) =>
                          prev.map((row, rowIdx) => {
                            if (rowIdx !== previewBulkIndex) return row;
                            const nextData = {
                              ...row.data,
                              [key]: val,
                              [lowerKey]: val,
                            };
                            if (matchedExcelCol) {
                              nextData[matchedExcelCol.key] = val;
                              nextData[matchedExcelCol.originalHeader] = val;
                              nextData[matchedExcelCol.originalHeader.toLowerCase()] = val;
                            }
                            return { ...row, data: nextData };
                          })
                        );
                        return;
                      }

                      setDocxValues((prev) => ({
                        ...prev,
                        [key]: val,
                      }));
                    }}
                    excelColumns={excelColumns}
                    currentRowData={letterMode === "bulk" ? (excelRowsData[previewBulkIndex]?.data || {}) : {}}
                    humanizePlaceholderKey={humanizePlaceholderKey}
                    isMultilineField={isMultilineField}
                  />

                  {/* CARD 4: UPLOAD GAMBAR TANDA TANGAN & STEMPEL ORGANISASI */}
                  <LetterSignatureStampPanel
                    overlays={letterOverlays}
                    selectedOverlayId={selectedOverlayId}
                    onSelectOverlay={setSelectedOverlayId}
                    onAddOverlay={handleAddLetterOverlay}
                    onUpdateOverlay={handleUpdateLetterOverlay}
                    onRemoveOverlay={handleRemoveLetterOverlay}
                    rawImageMap={overlayRawMap}
                    savedAssets={savedOverlayAssets}
                    onSaveAssetToLibrary={handleSaveOverlayAssetToLibrary}
                    onDeleteSavedAsset={handleDeleteSavedOverlayAsset}
                    pageCount={overlayPageCount}
                    disabled={!isEditMode && !createTemplate && !activeFileBase64 && !createContent.trim()}
                  />
                </div>

                {/* Footer Form Kiri */}
                <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end bg-zinc-50/50 dark:bg-zinc-950/50 px-5 py-3.5">
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <DialogClose render={
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isBatchPrinting || isSavingEdit}
                        className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
                      >
                        Batal
                      </Button>
                    } />
                    {isEditMode ? (
                      <>
                        <Button
                          type="submit"
                          disabled={
                            isSavingEdit ||
                            isBatchPrinting ||
                            (letterMode === "bulk" && parsedBulkRecipients.length === 0)
                          }
                          onClick={() => {
                            printAfterSaveRef.current = false;
                          }}
                          className="h-9 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 cursor-pointer flex items-center gap-1.5"
                        >
                          {savingEditAction === "save" ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>
                                {letterMode === "bulk"
                                  ? `Menyimpan ${parsedBulkRecipients.length} Surat...`
                                  : "Menyimpan..."}
                              </span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>
                                {letterMode === "bulk"
                                  ? `Simpan Revisi (${parsedBulkRecipients.length} Surat)`
                                  : "Simpan Perubahan"}
                              </span>
                            </>
                          )}
                        </Button>
                        <Button
                          type="submit"
                          variant="outline"
                          disabled={
                            isSavingEdit ||
                            isBatchPrinting ||
                            (letterMode === "bulk" && parsedBulkRecipients.length === 0)
                          }
                          onClick={() => {
                            printAfterSaveRef.current = true;
                          }}
                          className="h-9 text-xs font-medium rounded-lg border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-white dark:bg-zinc-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer flex items-center gap-1.5"
                          title="Simpan perubahan dan langsung cetak PDF"
                        >
                          {savingEditAction === "save_print" ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Menyiapkan...</span>
                            </>
                          ) : (
                            <>
                              <Printer className="w-3.5 h-3.5" />
                              <span>
                                {letterMode === "bulk"
                                  ? `Simpan & Cetak (${parsedBulkRecipients.length})`
                                  : "Simpan & Cetak"}
                              </span>
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isBatchPrinting || (letterMode === "bulk" && parsedBulkRecipients.length === 0)}
                        className="h-9 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 cursor-pointer flex items-center gap-1.5"
                      >
                        {isBatchPrinting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Menyiapkan {parsedBulkRecipients.length} Dokumen...</span>
                          </>
                        ) : (
                          <>
                            <Printer className="w-3.5 h-3.5" />
                            <span>
                              {letterMode === "bulk"
                                ? `Terbitkan & Cetak ${parsedBulkRecipients.length} Surat Massal`
                                : "Terbitkan & Cetak PDF"}
                            </span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            );
          })()}

          {/* Sisi Kanan: Real-time Live WYSIWYG Canvas */}
          <div className="lg:col-span-8 p-4 md:p-6 flex flex-col gap-3 bg-zinc-100 dark:bg-zinc-950 overflow-y-auto h-full relative">
            <div className="w-full flex flex-col gap-3 relative max-w-3xl mx-auto">
              {/* Carousel / Navigation Bar saat mode Surat Massal */}
              {letterMode === "bulk" && parsedBulkRecipients.length > 0 && (
                <div className="w-full flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl shadow-xs shrink-0">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
                      Pratinjau Surat:
                    </span>
                    <Badge className="bg-blue-600 text-white text-[10px] px-2 py-0.5 h-5 shrink-0">
                      #{previewBulkIndex + 1} dari {parsedBulkRecipients.length}
                    </Badge>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {parsedBulkRecipients[previewBulkIndex]}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0 hidden sm:inline">
                      ({currentPreviewNomor})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!activeFileBase64 && (
                      <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 mr-1">
                        <button
                          type="button"
                          onClick={() => setHtmlCanvasMode("edit")}
                          className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                            htmlCanvasMode === "edit"
                              ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                          }`}
                          title="Mode Edit: Ketik isi surat dan tempatkan placeholder {{...}}"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Template</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHtmlCanvasMode("preview")}
                          className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                            htmlCanvasMode === "preview"
                              ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                          }`}
                          title="Mode Pratinjau: Lihat tampilan surat dengan data terisi per penerima"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Pratinjau Terisi</span>
                        </button>
                      </div>
                    )}
                    {activeFileBase64 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadBulkZip}
                        className="h-7 text-[10px] font-medium text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 mr-1 flex items-center gap-1 cursor-pointer"
                        title="Unduh semua berkas Word sebagai arsip ZIP"
                      >
                        <Download className="w-3 h-3 text-blue-600" />
                        <span className="hidden sm:inline">Unduh ZIP</span>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={previewBulkIndex <= 0}
                      onClick={() => setPreviewBulkIndex((prev) => Math.max(0, prev - 1))}
                      className="h-7 w-7 p-0 cursor-pointer disabled:opacity-30 border-zinc-200 dark:border-zinc-700"
                      title="Penerima Sebelumnya"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-xs font-mono font-semibold px-1 text-zinc-600 dark:text-zinc-300">
                      {previewBulkIndex + 1}/{parsedBulkRecipients.length}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={previewBulkIndex >= parsedBulkRecipients.length - 1}
                      onClick={() => setPreviewBulkIndex((prev) => Math.min(parsedBulkRecipients.length - 1, prev + 1))}
                      className="h-7 w-7 p-0 cursor-pointer disabled:opacity-30 border-zinc-200 dark:border-zinc-700"
                      title="Penerima Berikutnya"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}


              {/* Toolbar Mode Edit Langsung di Kanvas */}
              {isEditMode && !activeFileBase64 && (
                <div className="w-full flex items-center justify-between gap-2 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 px-3.5 py-2 rounded-xl shadow-xs shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-[11px] font-medium text-amber-900 dark:text-amber-200">
                      <strong>Mode Edit Langsung:</strong> Klik teks pada lembar surat di bawah
                      untuk mengubah isi surat secara langsung, atau pilih Template Word di panel
                      kiri.
                    </span>
                  </div>
                </div>
              )}

              {/* Toolbar Cepat Unduh .docx untuk Mode 1 Penerima */}
              {letterMode === "single" && activeFileBase64 && (
                <div className="w-full flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl shadow-xs shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                      Mode Template Word (.docx) — Nomor {currentPreviewNomor}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadDocxResult}
                    className="h-7 text-[10px] font-medium text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 flex items-center gap-1 cursor-pointer shrink-0"
                    title="Unduh surat terisi dalam format Microsoft Word (.docx)"
                  >
                    <Download className="w-3 h-3 text-blue-600" />
                    <span>Unduh .docx</span>
                  </Button>
                </div>
              )}

              {/* CANVAS KERTAS SURAT (Word Asli / Empty State bila belum ada template) */}
              <div
                ref={canvasStageRef}
                onPointerDown={() => setSelectedOverlayId(null)}
                className="w-full relative min-h-[600px] flex flex-col items-center justify-start"
              >
                {!isEditMode && !createTemplate && !activeFileBase64 && !createContent.trim() ? (
                  <div className="w-full max-w-md my-auto bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-8 text-center space-y-3 shadow-2xs">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Belum Ada Template Surat Dipilih
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Unggah template Word (<code>.docx</code>) terlebih dahulu untuk menampilkan
                      lembar surat resmi beserta kop surat dan footer organisasi.
                    </p>
                    {onOpenTemplateManager && (
                      <Button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onOpenTemplateManager();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 px-4 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Kelola Template Word</span>
                      </Button>
                    )}
                  </div>
                ) : null}

                {isRenderingDocx && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-xl shadow-lg">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Merender Dokumen Word Asli...
                      </span>
                    </div>
                  </div>
                )}

                <div
                  id="custom-letter-print-area"
                  ref={canvasTextareaRef}
                  contentEditable={!activeFileBase64 && htmlCanvasMode === "edit"}
                  suppressContentEditableWarning
                  onInput={() => {
                    if (canvasTextareaRef.current && htmlCanvasMode === "edit") {
                      setCreateContent(canvasTextareaRef.current.innerHTML);
                    }
                  }}
                  onKeyUp={(e) => {
                    saveCanvasSelection();
                    if (e.key === "}" && canvasTextareaRef.current) {
                      updateCanvasFields();
                    }
                  }}
                  onMouseUp={saveCanvasSelection}
                  onSelect={saveCanvasSelection}
                  onBlur={() => {
                    saveCanvasSelection();
                    if (canvasTextareaRef.current) {
                      updateCanvasFields();
                    }
                  }}
                  className={
                    !isEditMode && !createTemplate && !activeFileBase64 && !createContent.trim()
                      ? "hidden"
                      : isDocxStyledCanvas
                      ? "relative z-0 isolate w-full min-h-[600px] flex flex-col items-center justify-start p-2 sm:p-4 overflow-auto outline-none"
                      : "relative z-0 isolate w-full aspect-[215/330] bg-white text-zinc-900 p-8 sm:p-10 rounded-xl border border-zinc-300 shadow-xl flex flex-col outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 cursor-text overflow-auto"
                  }
                  style={isDocxStyledCanvas ? undefined : { fontFamily: '"Arial Narrow", Arial, sans-serif', lineHeight: "1.35" }}
                />

                {/* Layer Interaktif Drag & Resize Tanda Tangan + Stempel Organisasi */}
                <LetterOverlayCanvas
                  stageRef={canvasStageRef}
                  canvasRef={canvasTextareaRef}
                  overlays={letterOverlays}
                  selectedOverlayId={selectedOverlayId}
                  onSelectOverlay={setSelectedOverlayId}
                  onUpdateOverlay={handleUpdateLetterOverlay}
                  onDuplicateOverlay={handleDuplicateLetterOverlay}
                  onRemoveOverlay={handleRemoveLetterOverlay}
                  onPageCountChange={setOverlayPageCount}
                  renderVersion={canvasRenderVersion}
                />

                {/* Pratinjau Footer QR Verifikasi Otomatis (Mode Kanvas HTML Edit) */}
                {!isDocxStyledCanvas &&
                  (isEditMode || Boolean(createTemplate) || Boolean(createContent.trim())) &&
                  !(letterMode === "bulk" && htmlCanvasMode === "preview") &&
                  activeQrMeta && (
                    <div className="w-full mt-3 bg-white px-5 py-3 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-start">
                      <SmartImage
                        src={activeQrMeta.qrDataUrl}
                        alt="Pratinjau QR Verifikasi Surat"
                        width={60}
                        height={60}
                        className="w-15 h-15 bg-white shrink-0"
                      />
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* DIALOG MODAL: TAMBAH PLACEHOLDER MANUAL */}
        <Dialog open={isAddPlaceholderOpen} onOpenChange={setIsAddPlaceholderOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Tambah Placeholder Sendiri</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Buat tag variabel baru (misal: <code>&#123;&#123;ruangan&#125;&#125;</code> atau <code>&#123;&#123;keperluan&#125;&#125;</code>) yang dapat Anda tempatkan ke dalam teks surat.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Nama Tag Placeholder *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400">
                    &#123;&#123;
                  </span>
                  <Input
                    value={manualKeyInput}
                    onChange={(e) => setManualKeyInput(e.target.value)}
                    placeholder="contoh: ruangan, keperluan, alamat"
                    className="pl-7 pr-7 h-9 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400">
                    &#125;&#125;
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Gunakan huruf kecil atau garis bawah tanpa spasi (misal: <code>alamat_tujuan</code>).
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Nilai Default / Contoh
                </label>
                <Input
                  value={manualValInput}
                  onChange={(e) => setManualValInput(e.target.value)}
                  placeholder="contoh: Gedung PCNU Lt. 2"
                  className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddPlaceholderOpen(false)}
                className="text-xs h-8"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveManualPlaceholder}
                className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Simpan &amp; Sisipkan ke Surat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* DIALOG MODAL: KONFIRMASI NOMOR SURAT DUPLIKAT */}
        <Dialog
          open={!!duplicateConfirmMode}
          onOpenChange={(open) => {
            if (!open) setDuplicateConfirmMode(null);
          }}
        >
          <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Peringatan Nomor Surat Duplikat</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Nomor surat berikut sudah tercatat di arsip surat keluar tenant ini.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2 text-xs text-zinc-700 dark:text-zinc-300">
              {duplicateConfirmMode === "bulk" ? (
                <>
                  <p>
                    Ditemukan <b>{bulkDuplicateEntries.length}</b> nomor surat yang sudah digunakan:
                  </p>
                  <ul className="space-y-1 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-lg p-2.5 text-[11px] font-mono">
                    {bulkDuplicateEntries.slice(0, 4).map((d) => (
                      <li key={d.index} className="truncate">
                        • {d.nomor} ({d.recipient})
                      </li>
                    ))}
                    {bulkDuplicateEntries.length > 4 && (
                      <li className="text-zinc-500 font-sans">
                        ...dan {bulkDuplicateEntries.length - 4} nomor lainnya
                      </li>
                    )}
                  </ul>
                </>
              ) : (
                <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-lg p-2.5 space-y-1">
                  <p className="font-mono font-bold text-amber-900 dark:text-amber-200">
                    {currentPreviewNomor}
                  </p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Sudah digunakan pada surat &ldquo;{duplicateEntry?.subject || "Surat Keluar"}&rdquo;.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDuplicateConfirmMode(null)}
                className="text-xs h-8 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  handleAutoAssignNextNumber();
                  setDuplicateConfirmMode(null);
                  toast.success(`Nomor urut diperbarui ke #${getNextSeqNumber(scopedMailHistory)}`);
                }}
                className="text-xs h-8 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Pakai No. #{getNextSeqNumber(scopedMailHistory)}</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (duplicateConfirmMode) {
                    void executePublish(duplicateConfirmMode);
                  }
                }}
                className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white font-medium cursor-pointer"
              >
                {isEditMode ? "Tetap Simpan" : "Tetap Terbitkan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
    </>
  );
}