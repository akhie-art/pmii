"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Mail,
  Send,
  Bookmark,
  FileText,
  Trash2,
  Paperclip,
  UploadCloud,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Calendar,
  ExternalLink,
  RefreshCw,
  Undo2,
  ShieldCheck,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { UserAccount } from "@/lib/db";
import { deleteStorageFile } from "@/lib/supabase";
import { PRIVATE_DOC_MAX_BYTES, resolveStorageUrl } from "@/lib/storage";
import { uploadFileToStorage, formatBytes } from "./docx-template-helper";
import {
  buildRecordedMailPayload,
  filterMailsForSameTenant,
  formatDateToIndo,
  generateNextOutgoingNumber,
  getTodayLocalIsoDate,
  isFormattedHtmlContent,
  normalizeMailStatusForType,
  parseMailDateToIso,
  resolveTargetRecordTenant,
} from "./letter-record-helper";
import type { MailItem } from "./types";

interface LetterRecordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveMail: (mail: MailItem, isEdit: boolean) => Promise<void>;
  outgoing: MailItem[];
  incoming?: MailItem[];
  currentUser: UserAccount | null;
  activeTenant?: string;
  editingMail?: MailItem | null;
}

function getDefaultLocationFromSettings(): string {
  if (typeof window === "undefined") return "Purwodadi";
  try {
    const raw = localStorage.getItem("PMII_SYSTEM_SETTINGS");
    if (raw) {
      const parsed = JSON.parse(raw);
      const city = parsed?.organization?.city || parsed?.administration?.defaultCity;
      if (typeof city === "string" && city.trim()) return city.trim();
    }
  } catch {}
  return "Purwodadi";
}

interface InitialFormSnapshot {
  mailType: "MASUK" | "KELUAR";
  nomor: string;
  senderOrRecipient: string;
  subject: string;
  date: string;
  classification: MailItem["classification"];
  status: MailItem["status"];
  content: string;
  senderTitle: string;
  senderLocation: string;
  attachmentUrl: string;
  attachmentName: string;
}

function buildInitialSnapshot(editingMail: MailItem | null | undefined): InitialFormSnapshot {
  if (editingMail) {
    const type: "MASUK" | "KELUAR" = editingMail.type === "KELUAR" ? "KELUAR" : "MASUK";
    return {
      mailType: type,
      nomor: editingMail.nomor || "",
      senderOrRecipient: editingMail.senderOrRecipient || "",
      subject: editingMail.subject || "",
      date: parseMailDateToIso(editingMail.date, editingMail.dateIndo),
      classification: editingMail.classification || "Instruksi",
      status: normalizeMailStatusForType(editingMail.status, type),
      content: isFormattedHtmlContent(editingMail.content) ? "" : editingMail.content || "",
      senderTitle: editingMail.senderTitle || "",
      senderLocation: editingMail.senderLocation || "",
      attachmentUrl: editingMail.fileUrl || "",
      attachmentName: editingMail.fileName || "",
    };
  }
  return {
    mailType: "MASUK",
    nomor: "",
    senderOrRecipient: "",
    subject: "",
    date: getTodayLocalIsoDate(),
    classification: "Instruksi",
    status: "Menunggu Tindak Lanjut",
    content: "",
    senderTitle: "",
    senderLocation: "",
    attachmentUrl: "",
    attachmentName: "",
  };
}

export function LetterRecordDialog({
  isOpen,
  onOpenChange,
  onSaveMail,
  outgoing,
  incoming = [],
  currentUser,
  activeTenant = "ALL",
  editingMail = null,
}: LetterRecordDialogProps) {
  const tenantInfo = useMemo(
    () => resolveTargetRecordTenant(editingMail, currentUser, activeTenant),
    [editingMail, currentUser, activeTenant]
  );

  const hasRichHtmlContent = useMemo(
    () => Boolean(editingMail && isFormattedHtmlContent(editingMail.content)),
    [editingMail]
  );

  const [newMailType, setNewMailType] = useState<"MASUK" | "KELUAR">("MASUK");
  const [newNomor, setNewNomor] = useState("");
  const [newSenderRecipient, setNewSenderRecipient] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newDate, setNewDate] = useState<string>(() => getTodayLocalIsoDate());
  const [newClassification, setNewClassification] =
    useState<MailItem["classification"]>("Instruksi");
  const [newStatus, setNewStatus] = useState<MailItem["status"]>("Menunggu Tindak Lanjut");
  const [newContent, setNewContent] = useState("");
  const [newSenderTitle, setNewSenderTitle] = useState("");
  const [newSenderLocation, setNewSenderLocation] = useState("");

  const [newAttachmentFile, setNewAttachmentFile] = useState<File | null>(null);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState<string>("");
  const [newAttachmentName, setNewAttachmentName] = useState<string>("");
  const [newAttachmentSize, setNewAttachmentSize] = useState<string>("");
  const [isUploadingAttachment, setIsUploadingAttachment] = useState<boolean>(false);
  const [isOpeningAttachment, setIsOpeningAttachment] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [confirmDuplicate, setConfirmDuplicate] = useState<boolean>(false);
  const [confirmDiscard, setConfirmDiscard] = useState<boolean>(false);
  const [initialSnapshot, setInitialSnapshot] = useState<InitialFormSnapshot>(() =>
    buildInitialSnapshot(null)
  );

  const uncommittedFileUrlRef = useRef<string | null>(null);
  const originalFileUrlRef = useRef<string | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);

  const openSyncKey = isOpen ? `${editingMail?.id || "new"}:${activeTenant}` : "";
  const [prevOpenSyncKey, setPrevOpenSyncKey] = useState("");
  if (openSyncKey !== prevOpenSyncKey) {
    setPrevOpenSyncKey(openSyncKey);
    if (isOpen) {
      const snap = buildInitialSnapshot(editingMail);
      setInitialSnapshot(snap);
      setUploadError("");
      setFormError("");
      setConfirmDuplicate(false);
      setConfirmDiscard(false);
      setIsDraggingOver(false);
      setNewAttachmentFile(null);
      setNewMailType(snap.mailType);
      setNewNomor(snap.nomor);
      setNewSenderRecipient(snap.senderOrRecipient);
      setNewSubject(snap.subject);
      setNewDate(snap.date);
      setNewClassification(snap.classification);
      setNewStatus(snap.status);
      setNewContent(snap.content);
      setNewSenderTitle(snap.senderTitle);
      setNewSenderLocation(snap.senderLocation);
      setNewAttachmentUrl(snap.attachmentUrl);
      setNewAttachmentName(snap.attachmentName);
      setNewAttachmentSize(editingMail?.fileSize || "");
    }
  }

  // Sinkronkan ref lifecycle lampiran setiap kali modal dibuka/berganti target edit
  useEffect(() => {
    if (isOpen) {
      originalFileUrlRef.current = editingMail?.fileUrl || null;
      uncommittedFileUrlRef.current = null;
    }
  }, [isOpen, editingMail?.id, editingMail?.fileUrl]);

  const sameTenantOutgoing = useMemo(
    () => filterMailsForSameTenant(outgoing, tenantInfo.tenantId, tenantInfo.isCabang),
    [outgoing, tenantInfo.tenantId, tenantInfo.isCabang]
  );

  const sameTenantIncoming = useMemo(
    () => filterMailsForSameTenant(incoming, tenantInfo.tenantId, tenantInfo.isCabang),
    [incoming, tenantInfo.tenantId, tenantInfo.isCabang]
  );

  const isOutgoingNomorDuplicate =
    newMailType === "KELUAR" &&
    Boolean(
      newNomor.trim() &&
        sameTenantOutgoing.some(
          (m) =>
            m.id !== editingMail?.id &&
            m.nomor.trim().toLowerCase() === newNomor.trim().toLowerCase()
        )
    );

  const isIncomingNomorDuplicate =
    newMailType === "MASUK" &&
    Boolean(
      newNomor.trim() &&
        sameTenantIncoming.some(
          (m) =>
            m.id !== editingMail?.id &&
            m.nomor.trim().toLowerCase() === newNomor.trim().toLowerCase()
        )
    );

  const isDirty = useMemo(() => {
    if (!isOpen) return false;
    return (
      newMailType !== initialSnapshot.mailType ||
      newNomor !== initialSnapshot.nomor ||
      newSenderRecipient !== initialSnapshot.senderOrRecipient ||
      newSubject !== initialSnapshot.subject ||
      newDate !== initialSnapshot.date ||
      newClassification !== initialSnapshot.classification ||
      newStatus !== initialSnapshot.status ||
      (!hasRichHtmlContent && newContent !== initialSnapshot.content) ||
      newSenderTitle !== initialSnapshot.senderTitle ||
      newSenderLocation !== initialSnapshot.senderLocation ||
      newAttachmentUrl !== initialSnapshot.attachmentUrl ||
      newAttachmentName !== initialSnapshot.attachmentName
    );
  }, [
    isOpen,
    initialSnapshot,
    newMailType,
    newNomor,
    newSenderRecipient,
    newSubject,
    newDate,
    newClassification,
    newStatus,
    hasRichHtmlContent,
    newContent,
    newSenderTitle,
    newSenderLocation,
    newAttachmentUrl,
    newAttachmentName,
  ]);

  const isOriginalAttachmentPendingRemoval = Boolean(
    editingMail?.fileUrl && !newAttachmentUrl && !newAttachmentFile
  );

  const isSwitchingOutgoingToIncoming = Boolean(
    editingMail && editingMail.type === "KELUAR" && newMailType === "MASUK"
  );

  const cleanupUncommittedFile = () => {
    if (
      uncommittedFileUrlRef.current &&
      uncommittedFileUrlRef.current !== originalFileUrlRef.current
    ) {
      const toRemove = uncommittedFileUrlRef.current;
      uncommittedFileUrlRef.current = null;
      deleteStorageFile(toRemove).catch(() => {});
    }
  };

  const forceCloseDialog = () => {
    cleanupUncommittedFile();
    setConfirmDuplicate(false);
    setConfirmDiscard(false);
    setUploadError("");
    setFormError("");
    onOpenChange(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      if (isUploadingAttachment || isSaving) return;
      if (isDirty && !confirmDiscard) {
        setConfirmDiscard(true);
        return;
      }
      forceCloseDialog();
      return;
    }
    onOpenChange(true);
  };

  const handleToggleMailType = (nextType: "MASUK" | "KELUAR") => {
    setNewMailType(nextType);
    setNewStatus((prev) => normalizeMailStatusForType(prev, nextType));
    setConfirmDuplicate(false);
    setConfirmDiscard(false);
    setFormError("");
  };

  const handleFileChange = async (file: File) => {
    if (file.size > PRIVATE_DOC_MAX_BYTES) {
      setUploadError(
        `Ukuran berkas terlalu besar (${formatBytes(file.size)}). Batas maksimal 10 MB.`
      );
      return;
    }

    const prevSnapshot = {
      file: newAttachmentFile,
      url: newAttachmentUrl,
      name: newAttachmentName,
      size: newAttachmentSize,
    };

    setUploadError("");
    setConfirmDiscard(false);
    setNewAttachmentFile(file);
    setNewAttachmentName(file.name);
    setNewAttachmentSize(formatBytes(file.size));
    setIsUploadingAttachment(true);

    try {
      const res = await uploadFileToStorage(
        file,
        "surat-attachments",
        file.name,
        tenantInfo.tenantId
      );
      if (res?.url) {
        // Hapus file uncommitted sebelumnya hanya setelah unggahan pengganti sukses
        if (
          uncommittedFileUrlRef.current &&
          uncommittedFileUrlRef.current !== originalFileUrlRef.current &&
          uncommittedFileUrlRef.current !== res.url
        ) {
          const oldUncommitted = uncommittedFileUrlRef.current;
          deleteStorageFile(oldUncommitted).catch(() => {});
        }
        setNewAttachmentUrl(res.url);
        setNewAttachmentSize(res.sizeFormatted);
        uncommittedFileUrlRef.current = res.url;
      } else {
        setUploadError(
          "Gagal mengunggah lampiran ke storage. Periksa koneksi atau format berkas."
        );
        setNewAttachmentFile(prevSnapshot.file);
        setNewAttachmentUrl(prevSnapshot.url);
        setNewAttachmentName(prevSnapshot.name);
        setNewAttachmentSize(prevSnapshot.size);
      }
    } catch {
      setUploadError("Terjadi kesalahan saat mengunggah berkas lampiran.");
      setNewAttachmentFile(prevSnapshot.file);
      setNewAttachmentUrl(prevSnapshot.url);
      setNewAttachmentName(prevSnapshot.name);
      setNewAttachmentSize(prevSnapshot.size);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleRemoveAttachment = () => {
    cleanupUncommittedFile();
    setNewAttachmentFile(null);
    setNewAttachmentUrl("");
    setNewAttachmentName("");
    setNewAttachmentSize("");
    setUploadError("");
    setConfirmDiscard(false);
  };

  const handleUndoRemoveAttachment = () => {
    if (!editingMail?.fileUrl) return;
    setNewAttachmentFile(null);
    setNewAttachmentUrl(editingMail.fileUrl);
    setNewAttachmentName(editingMail.fileName || "Lampiran Surat");
    setNewAttachmentSize(editingMail.fileSize || "");
    setUploadError("");
  };

  const handlePreviewAttachment = async () => {
    if (isOpeningAttachment || isUploadingAttachment) return;
    if (!newAttachmentUrl && !newAttachmentFile) return;

    setIsOpeningAttachment(true);
    setUploadError("");
    try {
      if (newAttachmentUrl) {
        const resolved = await resolveStorageUrl(newAttachmentUrl);
        if (resolved) {
          window.open(resolved, "_blank", "noopener,noreferrer");
          return;
        }
      }
      if (newAttachmentFile) {
        const blobUrl = URL.createObjectURL(newAttachmentFile);
        window.open(blobUrl, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
        return;
      }
      setUploadError("Tautan pratinjau lampiran tidak dapat dimuat.");
    } catch {
      setUploadError("Gagal membuka pratinjau berkas lampiran.");
    } finally {
      setIsOpeningAttachment(false);
    }
  };

  const handleRegisterMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingAttachment || isSaving) return;

    setFormError("");
    setConfirmDiscard(false);

    if (!newNomor.trim()) {
      setFormError("Nomor surat wajib diisi dan tidak boleh hanya berupa spasi.");
      return;
    }
    if (!newDate.trim()) {
      setFormError("Tanggal surat wajib diisi.");
      return;
    }
    if (!newSenderRecipient.trim()) {
      setFormError(
        newMailType === "MASUK"
          ? "Instansi pengirim wajib diisi."
          : "Instansi tujuan wajib diisi."
      );
      return;
    }
    if (!newSubject.trim()) {
      setFormError("Perihal / hal surat wajib diisi.");
      return;
    }

    if (isOutgoingNomorDuplicate && !confirmDuplicate) {
      setConfirmDuplicate(true);
      return;
    }

    setIsSaving(true);
    try {
      const mailPayload = buildRecordedMailPayload({
        editingMail,
        currentUser,
        activeTenant,
        mailType: newMailType,
        nomor: newNomor,
        senderOrRecipient: newSenderRecipient,
        subject: newSubject,
        date: newDate,
        classification: newClassification,
        status: newStatus,
        content: newContent,
        preserveOriginalHtmlContent: hasRichHtmlContent,
        senderTitle: newSenderTitle,
        senderLocation: newSenderLocation,
        defaultLocation: getDefaultLocationFromSettings(),
        attachmentUrl: newAttachmentUrl,
        attachmentName: newAttachmentName,
        attachmentSize: newAttachmentSize,
      });

      await onSaveMail(mailPayload, Boolean(editingMail));

      // Hapus file lama di storage hanya setelah penyimpanan DB benar-benar sukses
      const prevUrl = originalFileUrlRef.current || editingMail?.fileUrl || null;
      const nextUrl = mailPayload.fileUrl || null;
      if (prevUrl && prevUrl !== nextUrl) {
        deleteStorageFile(prevUrl).catch(() => {});
      }

      uncommittedFileUrlRef.current = null;
      originalFileUrlRef.current = null;
      setConfirmDuplicate(false);
      setConfirmDiscard(false);
      onOpenChange(false);
    } catch (err) {
      console.error("Gagal menyimpan arsip surat:", err);
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : "Gagal menyimpan arsip surat ke database. Periksa koneksi atau hak akses Anda."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-lg w-full p-0 overflow-hidden">
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {editingMail ? "Edit Arsip Surat" : "Registrasi Surat Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {editingMail
                  ? "Perbarui metadata, tanggal, status tindak lanjut, atau berkas lampiran surat"
                  : "Lengkapi metadata arsip persuratan untuk database PMII"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleRegisterMail} noValidate>
          <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Banner Error Validasi / Simpan Form */}
            {formError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Toggle Jenis Surat */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                Jenis Persuratan <span className="text-rose-500">*</span>
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleMailType("MASUK")}
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
                  onClick={() => handleToggleMailType("KELUAR")}
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

              {isSwitchingOutgoingToIncoming && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Mengubah <strong>Surat Keluar</strong> menjadi <strong>Surat Masuk</strong>{" "}
                    akan menonaktifkan verifikasi QR Code pada salinan surat yang sudah dicetak.
                  </span>
                </div>
              )}
            </div>

            {/* Nomor Surat & Klasifikasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="surat-record-nomor"
                    className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Nomor Surat <span className="text-rose-500">*</span>
                  </label>
                  {newMailType === "KELUAR" && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewNomor(
                          generateNextOutgoingNumber(
                            sameTenantOutgoing,
                            tenantInfo.orgLevelCode,
                            newDate
                          )
                        );
                        setConfirmDuplicate(false);
                        setFormError("");
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer shrink-0"
                      title="Generate nomor urut berikutnya untuk lembaga ini"
                    >
                      + No. Otomatis
                    </button>
                  )}
                </div>
                <Input
                  id="surat-record-nomor"
                  required
                  placeholder={`Contoh: 001.${tenantInfo.orgLevelCode}-XI.Z-03...`}
                  value={newNomor}
                  onChange={(e) => {
                    setNewNomor(e.target.value);
                    setConfirmDuplicate(false);
                    setFormError("");
                  }}
                  className={`h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border rounded-lg font-mono ${
                    isOutgoingNomorDuplicate
                      ? "border-rose-400 dark:border-rose-600 focus:ring-rose-500"
                      : isIncomingNomorDuplicate
                      ? "border-amber-400 dark:border-amber-600 focus:ring-amber-500"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                />
                {isOutgoingNomorDuplicate && (
                  <p className="text-[10px] text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>Nomor ini sudah terdaftar di Surat Keluar!</span>
                  </p>
                )}
                {isIncomingNomorDuplicate && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <Info className="w-3 h-3 shrink-0" />
                    <span>Nomor ini pernah tercatat di Surat Masuk.</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="surat-record-classification"
                  className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Klasifikasi <span className="text-rose-500">*</span>
                </label>
                <select
                  id="surat-record-classification"
                  value={newClassification}
                  onChange={(e) =>
                    setNewClassification(e.target.value as MailItem["classification"])
                  }
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

            {/* Tanggal Surat & Status Tindak Lanjut */}
            <div
              className={`grid grid-cols-1 ${editingMail ? "sm:grid-cols-2" : ""} gap-3`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="surat-record-date"
                    className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1"
                  >
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    <span>
                      Tanggal Surat <span className="text-rose-500">*</span>
                    </span>
                  </label>
                  {newDate && (
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {formatDateToIndo(newDate)}
                    </span>
                  )}
                </div>
                <Input
                  id="surat-record-date"
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    setFormError("");
                  }}
                  className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                />
              </div>

              {editingMail && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="surat-record-status"
                    className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Status Tindak Lanjut
                  </label>
                  <select
                    id="surat-record-status"
                    value={normalizeMailStatusForType(newStatus, newMailType)}
                    onChange={(e) => setNewStatus(e.target.value as MailItem["status"])}
                    className="h-9 w-full text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    {newMailType === "MASUK" ? (
                      <>
                        <option value="Menunggu Tindak Lanjut">Menunggu Tindak Lanjut</option>
                        <option value="Diproses">Diproses</option>
                        <option value="Selesai">Selesai</option>
                      </>
                    ) : (
                      <>
                        <option value="Terkirim">Terkirim</option>
                        <option value="Diproses">Diproses</option>
                        <option value="Selesai">Selesai</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>

            {/* Instansi Pengirim / Tujuan */}
            <div className="space-y-1.5">
              <label
                htmlFor="surat-record-party"
                className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                {newMailType === "MASUK" ? "Instansi Pengirim" : "Instansi Tujuan"}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <Input
                id="surat-record-party"
                required
                placeholder={
                  newMailType === "MASUK"
                    ? "Contoh: PC PMII Grobogan / PKC PMII Jawa Tengah"
                    : "Contoh: Pengurus Rayon / Instansi Tujuan"
                }
                value={newSenderRecipient}
                onChange={(e) => {
                  setNewSenderRecipient(e.target.value);
                  setFormError("");
                }}
                className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>

            {/* Perihal */}
            <div className="space-y-1.5">
              <label
                htmlFor="surat-record-subject"
                className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Perihal / Hal Surat <span className="text-rose-500">*</span>
              </label>
              <Input
                id="surat-record-subject"
                required
                placeholder="Contoh: Undangan Rapat Kerja / Permohonan Pemateri..."
                value={newSubject}
                onChange={(e) => {
                  setNewSubject(e.target.value);
                  setFormError("");
                }}
                className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>

            {/* Penandatangan & Kota */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="surat-record-signer"
                  className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Penandatangan
                </label>
                <Input
                  id="surat-record-signer"
                  placeholder={
                    tenantInfo.isCabang
                      ? "Ketua Cabang / Sekretaris"
                      : "Ketua Komisariat / Sekretaris"
                  }
                  value={newSenderTitle}
                  onChange={(e) => setNewSenderTitle(e.target.value)}
                  className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="surat-record-location"
                  className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Kota / Lokasi
                </label>
                <Input
                  id="surat-record-location"
                  placeholder="Purwodadi"
                  value={newSenderLocation}
                  onChange={(e) => setNewSenderLocation(e.target.value)}
                  className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                />
              </div>
            </div>

            {/* Isi / Ringkasan Surat (terproteksi bila konten HTML/DOCX/QR) */}
            <div className="space-y-1.5">
              <label
                htmlFor="surat-record-content"
                className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Ringkasan / Isi Pokok Surat
              </label>
              {hasRichHtmlContent ? (
                <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                      Dokumen Surat Resmi Terformat Dilindungi
                    </p>
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                      Isi dokumen hasil Generator Surat (termasuk layout &amp; QR Code verifikasi)
                      disimpan utuh secara otomatis agar tidak rusak saat Anda memperbarui metadata
                      surat ini.
                    </p>
                  </div>
                </div>
              ) : (
                <textarea
                  id="surat-record-content"
                  rows={3}
                  placeholder="Tuliskan pokok perihal atau catatan penting terkait surat..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[85px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 font-medium resize-y"
                />
              )}
            </div>

            {/* Unggah Berkas Fisik / Scan PDF Surat (Private Storage) */}
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  <span>Lampiran Berkas Asli (PDF / Scan / Foto)</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-normal">Privat &amp; Opsional</span>
              </div>

              {/* Input tersembunyi untuk aksi "Ganti File" langsung */}
              <input
                ref={replaceFileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileChange(file);
                  e.target.value = "";
                }}
                className="hidden"
              />

              {uploadError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {newAttachmentFile || newAttachmentUrl ? (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-xs">
                  <div className="flex items-center gap-2 truncate min-w-0">
                    {isUploadingAttachment ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                    <div className="truncate">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {newAttachmentName || newAttachmentFile?.name || "Lampiran Surat"}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {isUploadingAttachment
                          ? "Mengunggah ke penyimpanan privat..."
                          : newAttachmentSize ||
                            (newAttachmentFile ? formatBytes(newAttachmentFile.size) : "Tersimpan")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isUploadingAttachment || isOpeningAttachment}
                      onClick={() => void handlePreviewAttachment()}
                      className="h-7 px-2 text-[11px] text-blue-600 dark:text-blue-400 hover:bg-blue-100/70 dark:hover:bg-blue-950/60 rounded-md cursor-pointer flex items-center gap-1"
                      title="Buka pratinjau berkas lampiran"
                    >
                      {isOpeningAttachment ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ExternalLink className="w-3 h-3" />
                      )}
                      <span className="hidden sm:inline">Lihat</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isUploadingAttachment}
                      onClick={() => replaceFileInputRef.current?.click()}
                      className="h-7 px-2 text-[11px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-md cursor-pointer flex items-center gap-1"
                      title="Ganti dengan berkas lain"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span className="hidden sm:inline">Ganti</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isUploadingAttachment}
                      onClick={handleRemoveAttachment}
                      className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md cursor-pointer"
                      title="Hapus berkas lampiran"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {isOriginalAttachmentPendingRemoval && (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                      <span>
                        Lampiran lama (<strong>{editingMail?.fileName || "berkas"}</strong>) akan
                        dihapus saat perubahan disimpan.
                      </span>
                      <button
                        type="button"
                        onClick={handleUndoRemoveAttachment}
                        className="inline-flex items-center gap-1 font-semibold text-amber-900 dark:text-amber-200 hover:underline cursor-pointer shrink-0"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>Urungkan</span>
                      </button>
                    </div>
                  )}

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingOver(true);
                    }}
                    onDragLeave={() => setIsDraggingOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingOver(false);
                      const droppedFile = e.dataTransfer.files?.[0];
                      if (droppedFile) void handleFileChange(droppedFile);
                    }}
                    className={`relative border border-dashed rounded-lg p-3.5 text-center transition-colors ${
                      isDraggingOver
                        ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/30"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-blue-400 bg-zinc-50/50 dark:bg-zinc-900/40"
                    }`}
                  >
                    <input
                      id="surat-record-attachment"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleFileChange(file);
                        e.target.value = "";
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
                      <UploadCloud
                        className={`w-5 h-5 ${
                          isDraggingOver ? "text-blue-600" : "text-zinc-400"
                        }`}
                      />
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                        {isDraggingOver
                          ? "Lepaskan file di sini untuk mengunggah"
                          : "Klik atau seret file PDF / scan surat ke sini"}
                      </p>
                      <p className="text-[9.5px] text-zinc-400">
                        Maks. 10MB (PDF, PNG, JPG, WEBP, DOCX)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Konfirmasi inline jika nomor duplikat (pengganti window.confirm) */}
            {confirmDuplicate && isOutgoingNomorDuplicate && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2">
                <div className="flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Konfirmasi Nomor Surat Duplikat</p>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                      Nomor <span className="font-mono font-semibold">{newNomor}</span> sudah
                      tercatat pada Surat Keluar lembaga ini. Klik tombol simpan sekali lagi untuk
                      tetap melanjutkan, atau ubah nomor di atas.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Konfirmasi inline bila ada perubahan belum disimpan saat menutup modal */}
            {confirmDiscard && isDirty && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Perubahan Belum Disimpan</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      Tutup modal dan buang perubahan yang sudah Anda ketik?
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDiscard(false)}
                    className="h-7 px-2.5 text-[11px] bg-white dark:bg-zinc-900 border-amber-300 dark:border-amber-800 rounded-md cursor-pointer"
                  >
                    Lanjut Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={forceCloseDialog}
                    className="h-7 px-2.5 text-[11px] bg-amber-600 hover:bg-amber-700 text-white rounded-md cursor-pointer"
                  >
                    Buang
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-none px-5 sm:px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isUploadingAttachment || isSaving}
              onClick={() => handleDialogOpenChange(false)}
              className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isUploadingAttachment || isSaving}
              className={`h-9 text-xs font-medium rounded-lg text-white cursor-pointer ${
                confirmDuplicate
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isUploadingAttachment
                ? "Mengunggah Lampiran..."
                : isSaving
                ? "Menyimpan..."
                : confirmDuplicate
                ? "Ya, Tetap Simpan"
                : editingMail
                ? "Simpan Perubahan"
                : "Simpan & Arsipkan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
