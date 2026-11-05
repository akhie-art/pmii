"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  FileCheck,
  Plus,
  Search,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Trash2,
  Edit3,
  UploadCloud,
  Building2,
  Calendar,
  User,
  Phone,
  Check,
  RefreshCw,
  FileText,
  Send,
  MessageSquare,
  ShieldCheck,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FileUp,
  Loader2,
  Lock,
  Info,
  X,
  Users
} from "lucide-react";
import {
  db,
  PengajuanSK,
  StatusPengajuanSK,
  generateUUID,
  CommissariatList
} from "@/lib/db";
import {
  isUserAdmin,
  isUserSuperAdmin,
  isUserPengurus
} from "@/lib/auth-helpers";
import { supabase, isSupabaseConfigured, deleteStorageFile } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";

// Helper membaca file sebagai base64 DataURL (persisten di LocalStorage saat luring)
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper upload berkas ke Supabase Storage bucket 'materials'
async function uploadDocFile(file: File, folder = "pengajuan-sk"): Promise<string> {
  if (isSupabaseConfigured && supabase) {
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_");
      const path = `${folder}/${Date.now()}-${cleanName}.${ext}`;
      const contentType =
        file.type ||
        (ext === "pdf"
          ? "application/pdf"
          : ext === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : ext === "doc"
          ? "application/msword"
          : undefined);
      const { error } = await supabase.storage.from("materials").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType
      });
      if (!error) {
        const { data } = supabase.storage.from("materials").getPublicUrl(path);
        if (data?.publicUrl) return data.publicUrl;
      } else {
        console.warn("Gagal unggah Supabase Storage:", error.message);
      }
    } catch (e) {
      console.warn("Gagal unggah ke storage, beralih ke local fallback:", e);
    }
  }

  // Fallback: Jika berkas <= 2.5 MB, simpan sebagai DataURL base64 agar persisten di LocalStorage
  if (file.size <= 2.5 * 1024 * 1024) {
    try {
      return await readFileAsDataUrl(file);
    } catch (e) {
      console.warn("Gagal membaca DataURL:", e);
    }
  }

  // Fallback darurat: Object URL sementara untuk sesi saat ini
  return URL.createObjectURL(file);
}

// Helper ekstraksi nama berkas dari URL/Path
function extractFileName(url?: string): string {
  if (!url) return "";
  try {
    const raw = url.split("/").pop() || "";
    const clean = decodeURIComponent(raw).replace(/^\d+-/, "");
    return clean || "Berkas_Terlampir.pdf";
  } catch {
    return "Berkas_Terlampir.pdf";
  }
}

// Subkomponen Modern Interactive File Drop Card
interface FileDropCardProps {
  label: string;
  sublabel: string;
  required?: boolean;
  fileUrl?: string;
  fileName?: string;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onPreview?: (fileUrl: string, fileName?: string) => void;
  accept?: string;
}

function FileDropCard({
  label,
  sublabel,
  required = false,
  fileUrl,
  fileName,
  isUploading,
  onUpload,
  onRemove,
  onPreview,
  accept = ".pdf,.docx,.doc"
}: FileDropCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div
      className={`relative rounded-xl border transition-all duration-150 p-3 flex flex-col justify-between ${
        isDragging
          ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
          : fileUrl
          ? "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          : "border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />

      {/* Header: Label & Status Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100 truncate">
            {label}
          </span>
          {required ? (
            <span className="shrink-0 text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-200/60 dark:border-rose-900/50">
              Wajib
            </span>
          ) : (
            <span className="shrink-0 text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded">
              Opsional
            </span>
          )}
        </div>

        {fileUrl && (
          <span className="shrink-0 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/40 px-1.5 py-0.5 rounded-md">
            <Check className="w-2.5 h-2.5 stroke-[3]" /> Terunggah
          </span>
        )}
      </div>

      {/* Body Area */}
      {isUploading ? (
        <div className="py-4 flex flex-col items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-[11px] font-medium text-zinc-500 animate-pulse">Mengunggah berkas...</p>
        </div>
      ) : fileUrl ? (
        /* Attached File State */
        <div className="flex items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/70 dark:border-zinc-800/80 rounded-lg p-2">
          <div
            onClick={() => (onPreview ? onPreview(fileUrl, fileName) : window.open(fileUrl, "_blank"))}
            className="flex items-center gap-2 min-w-0 cursor-pointer flex-1 group/item"
            title="Klik untuk pratinjau dokumen"
          >
            <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover/item:bg-blue-100 dark:group-hover/item:bg-blue-900/60 transition-colors">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
                {fileName || "Dokumen_Terlampir"}
              </p>
              <p className="text-[10px] text-zinc-400">Klik untuk pratinjau</p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => (onPreview ? onPreview(fileUrl, fileName) : window.open(fileUrl, "_blank"))}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Pratinjau"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Ganti Berkas"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
              title="Hapus"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty Dropzone Trigger State */
        <div
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer py-2.5 px-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/70 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-800/40 flex items-center gap-3 transition-colors group/box"
        >
          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover/box:text-blue-600 group-hover/box:bg-blue-50 dark:group-hover/box:bg-blue-950/50 flex items-center justify-center shrink-0 transition-colors">
            <UploadCloud className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 group-hover/box:text-blue-600 dark:group-hover/box:text-blue-400 transition-colors">
              Pilih atau seret berkas
            </p>
            <p className="text-[10px] text-zinc-400 truncate">{sublabel}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper deteksi ekstensi berkas yang andal dari URL dan Nama Berkas
function getFileExtension(url: string, name?: string): string {
  const cleanUrl = (url || "").split("?")[0].split("#")[0];
  const urlExt = cleanUrl.includes(".") ? cleanUrl.split(".").pop()?.toLowerCase() || "" : "";
  const cleanName = (name || "").split("?")[0].split("#")[0];
  const nameExt = cleanName.includes(".") ? cleanName.split(".").pop()?.toLowerCase() || "" : "";

  const known = ["docx", "doc", "pdf", "xlsx", "xls", "jpg", "jpeg", "png", "webp", "gif", "svg", "csv"];
  if (known.includes(nameExt)) return nameExt;
  if (known.includes(urlExt)) return urlExt;
  if (nameExt && nameExt.length <= 5) return nameExt;
  if (urlExt && urlExt.length <= 5) return urlExt;
  return "";
}

// Subkomponen Modal Pratinjau Dokumen Universal (Murni Pratinjau, Tanpa Download)
function DocumentViewerModal({
  isOpen,
  onClose,
  fileUrl,
  fileName
}: {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");

  const ext = getFileExtension(fileUrl, fileName);
  const isDocx = ext === "docx" || ext === "doc";
  const isPdf = ext === "pdf";
  const isXlsx = ext === "xlsx" || ext === "xls" || ext === "csv";
  const isImage = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext);

  // Efek memuat PDF via Blob agar browser TIDAK memicu download
  useEffect(() => {
    if (!isOpen || !fileUrl || !isPdf) {
      setPdfUrl("");
      return;
    }

    let active = true;
    let blobUrl = "";
    setIsLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error("Gagal mengambil berkas PDF");
        const blob = await res.blob();
        if (!active) return;
        blobUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
        setPdfUrl(blobUrl);
      } catch {
        if (active) setPdfUrl(fileUrl);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [isOpen, fileUrl, isPdf]);

  // Efek merender DOCX / DOC
  useEffect(() => {
    if (!isOpen || !fileUrl || !isDocx) return;

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error("Gagal mengambil berkas dokumen");
        const buffer = await res.arrayBuffer();
        if (!isMounted || !containerRef.current) return;

        const targetEl = containerRef.current;
        targetEl.innerHTML = "";

        try {
          const docx = await import("docx-preview");
          await docx.renderAsync(buffer, targetEl, undefined, {
            className: "docx",
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            breakPages: true,
            useBase64URL: true,
            renderHeaders: true,
            renderFooters: true,
            renderAltChunks: true
          });
        } catch (docxErr) {
          console.warn("docx-preview gagal, mencoba mammoth fallback:", docxErr);
          const mammoth = await import("mammoth");
          const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
          if (!isMounted || !containerRef.current) return;
          targetEl.innerHTML = `<div class="p-8 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 max-w-3xl w-full mx-auto leading-relaxed text-sm font-sans">${result.value}</div>`;
        }
      } catch (err: any) {
        console.error("Gagal render preview Word docx:", err);
        if (isMounted) {
          setLoadError("Pratinjau dokumen Word tidak dapat ditampilkan.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, fileUrl, isDocx]);

  // Efek merender Excel (XLSX / XLS / CSV)
  useEffect(() => {
    if (!isOpen || !fileUrl || !isXlsx) return;

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error("Gagal mengambil berkas spreadsheet");
        const buffer = await res.arrayBuffer();
        if (!isMounted || !containerRef.current) return;

        const XLSX = await import("xlsx");
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const htmlTable = XLSX.utils.sheet_to_html(worksheet, { id: "excel-preview-table" });

        if (!isMounted || !containerRef.current) return;
        const targetEl = containerRef.current;
        targetEl.innerHTML = `
          <div class="w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
            <div class="mb-3 flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span class="text-xs font-bold text-zinc-800 dark:text-zinc-200">Lembar Kerja: ${firstSheetName}</span>
              <span class="text-[10px] text-zinc-400">Total ${workbook.SheetNames.length} sheet</span>
            </div>
            <div class="overflow-x-auto text-xs [&>table]:w-full [&>table]:border-collapse [&_th]:bg-zinc-100 dark:[&_th]:bg-zinc-800 [&_th]:p-2 [&_th]:border [&_th]:border-zinc-200 dark:[&_th]:border-zinc-700 [&_td]:p-2 [&_td]:border [&_td]:border-zinc-200 dark:[&_td]:border-zinc-700 text-zinc-800 dark:text-zinc-200">
              ${htmlTable}
            </div>
          </div>
        `;
      } catch (err: any) {
        console.error("Gagal render preview Excel:", err);
        if (isMounted) {
          setLoadError("Pratinjau spreadsheet tidak dapat ditampilkan.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, fileUrl, isXlsx]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
        {/* Header - Murni Pratinjau, Tanpa Tombol Unduh */}
        <div className="px-5 py-3.5 pr-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate max-w-sm sm:max-w-md">
                {fileName || "Pratinjau Dokumen"}
              </p>
              <p className="text-[10px] text-zinc-500">
                Mode Pratinjau Dokumen {ext ? `(${ext.toUpperCase()})` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-100/60 dark:bg-zinc-950/80 min-h-[400px] max-h-[78vh] flex flex-col items-center">
          {isLoading && (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-blue-600">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs font-medium animate-pulse">Memuat pratinjau dokumen...</p>
            </div>
          )}

          {loadError && !isLoading && (
            <div className="py-20 flex flex-col items-center justify-center gap-2.5 text-center max-w-md">
              <AlertCircle className="w-8 h-8 text-amber-500" />
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{loadError}</p>
              <p className="text-[11px] text-zinc-500">
                Dokumen tidak dapat dibuka di dalam pratinjau browser saat ini.
              </p>
            </div>
          )}

          {/* Word (DOCX / DOC) atau Excel (XLSX / XLS) */}
          {(isDocx || isXlsx) && (
            <div
              ref={containerRef}
              className={`w-full overflow-y-auto flex flex-col items-center ${isLoading || loadError ? "hidden" : "block"}`}
            />
          )}

          {/* PDF Viewer */}
          {isPdf && !loadError && (
            <div className={`w-full h-full flex flex-col ${isLoading ? "hidden" : "block"}`}>
              <iframe
                src={pdfUrl || fileUrl}
                className="w-full h-[74vh] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white"
                title={fileName}
              />
            </div>
          )}

          {/* Gambar */}
          {isImage && (
            <div className="flex items-center justify-center p-2">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800"
              />
            </div>
          )}

          {/* Fallback untuk format lain yang tidak didukung langsung browser (TIDAK BOLEH IFRAME AGAR TIDAK DOWNLOAD) */}
          {!isDocx && !isXlsx && !isPdf && !isImage && !isLoading && !loadError && (
            <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                {fileName || "Dokumen Lampiran"}
              </p>
              <p className="text-xs text-zinc-500 max-w-sm">
                Format berkas ({ext ? `.${ext.toUpperCase()}` : "tidak dikenal"}) ini tidak didukung untuk pratinjau visual langsung di browser.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PengajuanSKPage() {
  const [submissions, setSubmissions] = useState<PengajuanSK[]>([]);
  const [commissariats, setCommissariats] = useState<CommissariatList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [tenantFilter, setTenantFilter] = useState<string>("ALL");

  // User auth state
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modal State: Form Pengajuan Baru / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Item yang sedang diedit (jika ada)
  const editingItem = useMemo(() => {
    return editingId ? submissions.find((s) => s.id === editingId) : null;
  }, [editingId, submissions]);

  // Form Fields (Hanya komisariat & periode)
  const [formKomisariatId, setFormKomisariatId] = useState("");
  const [formPeriode, setFormPeriode] = useState("2026 - 2027");

  // Files state
  const [filePermohonan, setFilePermohonan] = useState<string>("");
  const [fileSusunanPengurus, setFileSusunanPengurus] = useState<string>("");
  const [fileBeritaAcara, setFileBeritaAcara] = useState<string>("");
  const [fileBeritaAcaraFormatur, setFileBeritaAcaraFormatur] = useState<string>("");
  const [fileLPJ, setFileLPJ] = useState<string>("");
  const [fileCVPengurus, setFileCVPengurus] = useState<string>("");
  const [filePresensi, setFilePresensi] = useState<string>("");
  const [fileTambahan, setFileTambahan] = useState<string>("");
  const [fileNames, setFileNames] = useState<Record<string, string>>({});

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const uploadedDocsCount = [
    filePermohonan,
    fileSusunanPengurus,
    fileBeritaAcara,
    fileBeritaAcaraFormatur,
    fileLPJ,
    fileCVPengurus,
    filePresensi,
    fileTambahan
  ].filter(Boolean).length;
  const isAllDocsUploaded = uploadedDocsCount === 8;

  // Modal State: Verifikasi & Keputusan (Admin PC)
  const [verifyItem, setVerifyItem] = useState<PengajuanSK | null>(null);
  const [verifyDecision, setVerifyDecision] = useState<"DISETUJUI" | "REVISI" | "DITOLAK">("DISETUJUI");
  const [verifyTanggalSK, setVerifyTanggalSK] = useState(new Date().toISOString().split("T")[0]);
  const [verifyFileSK, setVerifyFileSK] = useState("");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Modal State: Detail & Tracking
  const [detailItem, setDetailItem] = useState<PengajuanSK | null>(null);

  // Modal State: Hapus
  const [deleteTarget, setDeleteTarget] = useState<PengajuanSK | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal State: Pratinjau Dokumen (DOCX, PDF, Gambar)
  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    url: string;
    fileName: string;
  }>({ isOpen: false, url: "", fileName: "" });

  const handlePreviewFile = (url: string, name?: string) => {
    if (!url) return;
    setPreviewDoc({
      isOpen: true,
      url,
      fileName: name || extractFileName(url) || "Dokumen_Lampiran.pdf"
    });
  };

  // Helper mendapatkan nama komisariat
  const getKomisariatName = (komisariatId?: string | null) => {
    if (!komisariatId) return "Komisariat PMII";
    const found = commissariats.find((c) => c.id === komisariatId);
    return found?.name || "Komisariat PMII";
  };

  // Helper mendapatkan periode dari data tenant
  const getTenantPeriod = (komisariatId?: string | null) => {
    if (!komisariatId) return "2026 - 2027";
    const found = commissariats.find((c) => c.id === komisariatId);
    return found?.structure?.period || (found as any)?.period || "2026 - 2027";
  };

  // Load User & Submissions
  const loadData = async (forceRemote: boolean = false) => {
    setIsLoading(true);
    try {
      if (forceRemote && typeof window !== "undefined") {
        localStorage.removeItem("PMII_PENGAJUAN_SK");
      }
      const [skData, commData] = await Promise.all([
        db.getPengajuanSK(),
        db.getCommissariats()
      ]);
      setSubmissions(skData);
      setCommissariats(commData);
    } catch (e) {
      console.error("Gagal memuat data pengajuan SK:", e);
      toast.error("Gagal memuat data pengajuan SK");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
          if (parsed.tenant_id || parsed.komisariat_id) {
            setFormKomisariatId(parsed.tenant_id || parsed.komisariat_id);
          }
        } catch {}
      }
    }
    loadData();
  }, []);

  const userRole = (currentUser?.role || "").toLowerCase();
  const isAdmin = isUserAdmin(userRole);
  const isSuperAdmin = isUserSuperAdmin(userRole, currentUser?.email);
  const isPengurus = isUserPengurus(userRole);

  // Statistics Calculation
  const stats = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter((s) => s.status === "DIAJUKAN").length;
    const revision = submissions.filter((s) => s.status === "REVISI").length;
    const approved = submissions.filter((s) => s.status === "DISETUJUI").length;
    const rejected = submissions.filter((s) => s.status === "DITOLAK").length;
    return { total, pending, revision, approved, rejected };
  }, [submissions]);

  // Filter Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      // Role scope filter: jika pengurus komisariat biasa, tampilkan milik komisariatnya jika sesuai
      if (!isAdmin && (currentUser?.tenant_id || currentUser?.komisariat_id) && item.tenant_id) {
        const userTid = currentUser?.tenant_id || currentUser?.komisariat_id;
        if (item.tenant_id !== userTid) {
          return false;
        }
      }

      // Search match
      const commName = getKomisariatName(item.tenant_id).toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        commName.includes(q) ||
        (item.periode && item.periode.toLowerCase().includes(q));

      // Status match
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;

      // Tenant match
      const matchTenant =
        tenantFilter === "ALL" ||
        item.tenant_id === tenantFilter;

      return matchSearch && matchStatus && matchTenant;
    });
  }, [submissions, searchQuery, statusFilter, tenantFilter, isAdmin, currentUser, commissariats]);

  // Open Form Create
  const handleOpenCreate = () => {
    setEditingId(null);
    const targetKomisariatId = currentUser?.tenant_id || currentUser?.komisariat_id || (commissariats[0]?.id || "");
    setFormKomisariatId(targetKomisariatId);
    setFormPeriode(getTenantPeriod(targetKomisariatId));
    setFilePermohonan("");
    setFileSusunanPengurus("");
    setFileBeritaAcara("");
    setFileBeritaAcaraFormatur("");
    setFileLPJ("");
    setFileCVPengurus("");
    setFilePresensi("");
    setFileTambahan("");
    setFileNames({});
    setIsFormOpen(true);
  };

  // Open Form Edit
  const handleOpenEdit = (item: PengajuanSK) => {
    setEditingId(item.id);
    setFormKomisariatId(item.tenant_id || "");
    setFormPeriode(item.periode || getTenantPeriod(item.tenant_id));
    setFilePermohonan(item.berkas_surat_permohonan || "");
    setFileSusunanPengurus(item.berkas_susunan_pengurus || "");
    setFileBeritaAcara(item.berkas_berita_acara || item.berkas_berita_acara_rtk || "");
    setFileBeritaAcaraFormatur(item.berkas_berita_acara_formatur || "");
    setFileLPJ(item.berkas_lpj || "");
    setFileCVPengurus(item.berkas_cv_pengurus || "");
    setFilePresensi(item.berkas_presensi || "");
    setFileTambahan(item.berkas_tambahan || "");
    setFileNames({
      permohonan: extractFileName(item.berkas_surat_permohonan),
      susunanPengurus: extractFileName(item.berkas_susunan_pengurus),
      beritaAcara: extractFileName(item.berkas_berita_acara || item.berkas_berita_acara_rtk),
      beritaAcaraFormatur: extractFileName(item.berkas_berita_acara_formatur),
      lpj: extractFileName(item.berkas_lpj),
      cvPengurus: extractFileName(item.berkas_cv_pengurus),
      presensi: extractFileName(item.berkas_presensi),
      tambahan: extractFileName(item.berkas_tambahan),
    });
    setIsFormOpen(true);
  };

  // Upload handler for document input / drag & drop
  const processUploadFile = async (file: File, fieldName: string) => {
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Ukuran berkas maksimal 15 MB.");
      return;
    }

    setUploadingField(fieldName);
    try {
      const url = await uploadDocFile(file);
      if (fieldName === "permohonan") setFilePermohonan(url);
      else if (fieldName === "susunanPengurus") setFileSusunanPengurus(url);
      else if (fieldName === "beritaAcara") setFileBeritaAcara(url);
      else if (fieldName === "beritaAcaraFormatur") setFileBeritaAcaraFormatur(url);
      else if (fieldName === "lpj") setFileLPJ(url);
      else if (fieldName === "cvPengurus") setFileCVPengurus(url);
      else if (fieldName === "presensi") setFilePresensi(url);
      else if (fieldName === "tambahan") setFileTambahan(url);
      else if (fieldName === "skResmi") setVerifyFileSK(url);
      setFileNames((prev) => ({ ...prev, [fieldName]: file.name }));
      toast.success(`Berkas "${file.name}" berhasil diunggah!`);
    } catch (err: any) {
      toast.error("Gagal mengunggah berkas: " + err.message);
    } finally {
      setUploadingField(null);
    }
  };

  const handleRemoveFile = (fieldName: string) => {
    if (fieldName === "permohonan") setFilePermohonan("");
    else if (fieldName === "susunanPengurus") setFileSusunanPengurus("");
    else if (fieldName === "beritaAcara") setFileBeritaAcara("");
    else if (fieldName === "beritaAcaraFormatur") setFileBeritaAcaraFormatur("");
    else if (fieldName === "lpj") setFileLPJ("");
    else if (fieldName === "cvPengurus") setFileCVPengurus("");
    else if (fieldName === "presensi") setFilePresensi("");
    else if (fieldName === "tambahan") setFileTambahan("");
    else if (fieldName === "skResmi") setVerifyFileSK("");

    setFileNames((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
    toast.info("Berkas dilepas dari lampiran");
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadFile(file, fieldName);
    e.target.value = "";
  };

  // Save / Submit Pengajuan SK
  const handleSaveForm = async (targetStatus: "DRAFT" | "DIAJUKAN") => {
    const targetCommId = formKomisariatId || currentUser?.tenant_id || currentUser?.komisariat_id || (commissariats[0]?.id || "");
    if (!targetCommId) {
      toast.error("Komisariat pemohon wajib dipilih.");
      return;
    }

    const periodeTrimmed = formPeriode.trim();
    if (!periodeTrimmed) {
      toast.error("Masa khidmat / periode kepengurusan wajib diisi.");
      return;
    }
    const periodeRegex = /^\d{4}\s*[-/–]\s*\d{4}$/;
    if (!periodeRegex.test(periodeTrimmed)) {
      toast.error("Format masa khidmat harus tahun baku, contoh: 2026 - 2027");
      return;
    }

    if (targetStatus === "DIAJUKAN") {
      const missingDocs: string[] = [];
      if (!filePermohonan) missingDocs.push("Surat Permohonan SK");
      if (!fileSusunanPengurus) missingDocs.push("Susunan Pengurus Lengkap");
      if (!fileBeritaAcara) missingDocs.push("Berita Acara RTK");
      if (!fileBeritaAcaraFormatur) missingDocs.push("Berita Acara Formatur");
      if (!fileLPJ) missingDocs.push("Laporan Pertanggungjawaban (LPJ)");
      if (!fileCVPengurus) missingDocs.push("CV Pengurus");
      if (!filePresensi) missingDocs.push("Data Anggota");
      if (!fileTambahan) missingDocs.push("Dokumentasi RTK");

      if (missingDocs.length > 0) {
        toast.error(`Semua 8 dokumen persyaratan wajib dilampirkan. Belum lengkap: ${missingDocs.slice(0, 3).join(", ")}${missingDocs.length > 3 ? ` (+${missingDocs.length - 3} lainnya)` : ""}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const existing = submissions.find((s) => s.id === editingId);

      const newItem: PengajuanSK = {
        id: editingId || generateUUID(),
        tenant_id: targetCommId,
        periode: periodeTrimmed,
        tanggal_pengajuan: existing?.tanggal_pengajuan || new Date().toISOString().split("T")[0],
        status: targetStatus,
        berkas_surat_permohonan: filePermohonan || undefined,
        berkas_susunan_pengurus: fileSusunanPengurus || undefined,
        berkas_berita_acara: fileBeritaAcara || undefined,
        berkas_berita_acara_rtk: fileBeritaAcara || undefined,
        berkas_berita_acara_formatur: fileBeritaAcaraFormatur || undefined,
        berkas_lpj: fileLPJ || undefined,
        berkas_cv_pengurus: fileCVPengurus || undefined,
        berkas_presensi: filePresensi || undefined,
        berkas_tambahan: fileTambahan || undefined,
        catatan_revisi: targetStatus === "DIAJUKAN" ? "" : existing?.catatan_revisi,
        diverifikasi_oleh: existing?.diverifikasi_oleh,
        tanggal_verifikasi: existing?.tanggal_verifikasi,
        tanggal_sk_terbit: existing?.tanggal_sk_terbit,
        file_sk_resmi: existing?.file_sk_resmi,
        created_at: existing?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let updatedList: PengajuanSK[];
      if (editingId) {
        updatedList = submissions.map((s) => (s.id === editingId ? newItem : s));
        toast.success(`Pengajuan SK berhasil diperbarui!`);
      } else {
        updatedList = [newItem, ...submissions];
        toast.success(
          targetStatus === "DIAJUKAN"
            ? `Pengajuan SK berhasil diajukan ke Pengurus Cabang!`
            : `Draf Pengajuan SK berhasil disimpan!`
        );
      }

      await db.savePengajuanSK(updatedList);
      setSubmissions(updatedList);
      setIsFormOpen(false);
    } catch (e: any) {
      console.error("Gagal menyimpan pengajuan SK:", e);
      toast.error("Gagal menyimpan pengajuan: " + (e?.message || "Terjadi kesalahan."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Verifikasi & Keputusan oleh Admin Cabang
  const handleSubmitVerification = async () => {
    if (!verifyItem) return;

    if (verifyDecision === "REVISI" && !verifyNotes.trim()) {
      toast.error("Harap masukkan catatan revisi yang harus diperbaiki pemohon.");
      return;
    }

    if (verifyDecision === "DITOLAK" && !verifyNotes.trim()) {
      toast.error("Harap masukkan alasan penolakan pengajuan SK.");
      return;
    }

    setIsVerifying(true);
    try {
      const verifierName = currentUser?.name || currentUser?.email || "Admin PC PMII";
      const updatedItem: PengajuanSK = {
        ...verifyItem,
        status: verifyDecision,
        diverifikasi_oleh: verifierName,
        tanggal_verifikasi: new Date().toISOString(),
        catatan_revisi: verifyDecision !== "DISETUJUI" ? verifyNotes.trim() : verifyItem.catatan_revisi,
        tanggal_sk_terbit: verifyDecision === "DISETUJUI" ? (verifyTanggalSK || new Date().toISOString().split("T")[0]) : verifyItem.tanggal_sk_terbit,
        file_sk_resmi: verifyDecision === "DISETUJUI" && verifyFileSK ? verifyFileSK : verifyItem.file_sk_resmi,
        updated_at: new Date().toISOString()
      };

      const updatedList = submissions.map((s) => (s.id === verifyItem.id ? updatedItem : s));
      await db.savePengajuanSK(updatedList);
      setSubmissions(updatedList);

      if (verifyDecision === "DISETUJUI") {
        toast.success(`Pengajuan SK berhasil disetujui!`);
      } else if (verifyDecision === "REVISI") {
        toast.info(`Pengajuan dikembalikan untuk perbaikan (Revisi).`);
      } else {
        toast.warning(`Pengajuan SK ditolak.`);
      }

      setVerifyItem(null);
    } catch (e: any) {
      console.error("Gagal memverifikasi SK:", e);
      toast.error("Gagal memproses verifikasi: " + e.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // Delete Pengajuan
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const filesToDelete = [
        deleteTarget.berkas_surat_permohonan,
        deleteTarget.berkas_susunan_pengurus,
        deleteTarget.berkas_berita_acara,
        deleteTarget.berkas_berita_acara_formatur,
        deleteTarget.berkas_lpj,
        deleteTarget.berkas_cv_pengurus,
        deleteTarget.berkas_presensi,
        deleteTarget.berkas_tambahan,
        deleteTarget.file_sk_resmi
      ];
      await db.deletePengajuanSK(deleteTarget.id, filesToDelete);
      const updated = submissions.filter((s) => s.id !== deleteTarget.id);
      setSubmissions(updated);
      toast.success(`Pengajuan SK berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (e: any) {
      console.error("Gagal menghapus pengajuan SK:", e);
      toast.error("Gagal menghapus data: " + e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper render status badge
  const renderStatusBadge = (status: StatusPengajuanSK) => {
    switch (status) {
      case "DIAJUKAN":
        return (
          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200/80 gap-1 text-[11px] font-semibold">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Menunggu Verifikasi PC</span>
          </Badge>
        );
      case "REVISI":
        return (
          <Badge className="bg-orange-50 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300 border-orange-200/80 gap-1 text-[11px] font-semibold">
            <AlertCircle className="w-3 h-3 text-orange-600" />
            <span>Perlu Revisi</span>
          </Badge>
        );
      case "DISETUJUI":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200/80 gap-1 text-[11px] font-semibold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>SK Terbit</span>
          </Badge>
        );
      case "DITOLAK":
        return (
          <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200/80 gap-1 text-[11px] font-semibold">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Ditolak</span>
          </Badge>
        );
      case "DRAFT":
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-[11px] text-zinc-600 dark:text-zinc-400">
            <Layers className="w-3 h-3 text-zinc-500" />
            <span>Draf Pemohon</span>
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans">
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
            Pengajuan & Legalisasi SK
          </span>
          <Badge variant="outline" className="text-[10px] font-normal border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 ml-1 py-0">
            {isAdmin ? "Admin Cabang" : "Pengurus Komisariat"}
          </Badge>
          {stats.pending > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 px-2 py-0.5 rounded-md ml-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              <span>{stats.pending} menunggu verifikasi</span>
            </span>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              loadData(true);
              toast.info("Menyinkronkan data pengajuan SK dari database...");
            }}
            disabled={isLoading}
            className="h-8.5 px-3 text-xs font-medium border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center gap-1.5 cursor-pointer text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Segarkan dan sinkronkan data dari database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </Button>

          {!isAdmin && (
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="h-8.5 px-3.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer border-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajukan SK Baru</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards (Hanya Tampil untuk Pengurus Cabang / Admin) */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Total Pengajuan</span>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.total}</h3>
              <span className="text-[10px] text-zinc-400">Semua usulan SK</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Menunggu Verifikasi</span>
              <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.pending}</h3>
              <span className="text-[10px] text-amber-600/70">Perlu ditindaklanjuti PC</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Perlu Revisi</span>
              <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.revision}</h3>
              <span className="text-[10px] text-orange-600/70">Catatan perbaikan</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">SK Diterbitkan</span>
              <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.approved}</h3>
              <span className="text-[10px] text-emerald-600/70">Resmi & disahkan PC</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama komisariat, periode, atau nomor SK..."
              className="pl-9 h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
            />
          </div>

          {/* Filter Status */}
          <div className="sm:col-span-4">
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val || "ALL")}>
              <SelectTrigger className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg w-full">
                <SelectValue placeholder="Status Pengajuan" />
              </SelectTrigger>
              <SelectContent className="border-zinc-200 dark:border-zinc-800">
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="DIAJUKAN">Menunggu Verifikasi</SelectItem>
                <SelectItem value="REVISI">Perlu Revisi</SelectItem>
                <SelectItem value="DISETUJUI">SK Terbit (Disetujui)</SelectItem>
                <SelectItem value="DITOLAK">Ditolak</SelectItem>
                <SelectItem value="DRAFT">Draf</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters */}
          <div className="sm:col-span-3 flex justify-end">
            {(searchQuery || statusFilter !== "ALL" || tenantFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                  setTenantFilter("ALL");
                }}
                className="h-9 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Reset Filter
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: List Pengajuan SK */}
      {isLoading ? (
        <div className="py-24 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-xs text-zinc-500">Memuat data pengajuan SK...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Belum Ada Pengajuan SK yang Sesuai
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            {!isAdmin
              ? "Mulai ajukan pengesahan Surat Keputusan (SK) struktur kepengurusan Komisariat dengan mengunggah berkas RTK lengkap."
              : "Belum ada berkas pengajuan SK kepengurusan yang masuk dari pengurus komisariat."}
          </p>
          {!isAdmin && (
            <Button
              onClick={handleOpenCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 rounded-lg px-4 gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajukan SK Sekarang</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubmissions.map((item) => {
            const hasSK = item.status === "DISETUJUI";
            // Tombol Edit & Hapus khusus untuk role Pengurus Komisariat (pemohon) selama belum disetujui
            const canEdit = !isAdmin && item.status !== "DISETUJUI";
            const canDelete = !isAdmin && item.status !== "DISETUJUI";

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-all space-y-4 relative group"
              >
                {/* Header Card */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-1">
                        {getKomisariatName(item.tenant_id)}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Masa Khidmat: <strong className="text-zinc-700 dark:text-zinc-300">{item.periode}</strong>
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {renderStatusBadge(item.status)}
                    </div>
                  </div>

                  {/* Info Ringkas */}
                  <div className="bg-zinc-50 dark:bg-zinc-950/60 rounded-lg p-3 space-y-1.5 border border-zinc-100 dark:border-zinc-800/80 text-xs">
                    <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Tanggal Diajukan:
                      </span>
                      <span className="font-mono text-[11px]">
                        {item.tanggal_pengajuan}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Dokumen Lampiran:
                      </span>
                      <span className="font-medium text-[11px] text-zinc-700 dark:text-zinc-200">
                        {[
                          item.berkas_surat_permohonan,
                          item.berkas_susunan_pengurus,
                          item.berkas_berita_acara,
                          item.berkas_berita_acara_formatur,
                          item.berkas_lpj,
                          item.berkas_cv_pengurus,
                          item.berkas_presensi,
                          item.berkas_tambahan
                        ].filter(Boolean).length} / 8 Berkas
                      </span>
                    </div>
                  </div>

                  {/* Catatan Revisi jika ada */}
                  {item.status === "REVISI" && item.catatan_revisi && (
                    <div className="p-2.5 rounded-lg bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/50 space-y-1">
                      <span className="text-[10px] font-bold text-orange-800 dark:text-orange-300 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-orange-600" /> Catatan Revisi Cabang:
                      </span>
                      <p className="text-[11px] text-orange-900/90 dark:text-orange-200/90 leading-relaxed italic line-clamp-2">
                        &ldquo;{item.catatan_revisi}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Status SK Terbit */}
                  {hasSK && (
                    <div className="p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> SK Resmi Telah Terbit
                        </span>
                        {item.tanggal_sk_terbit && (
                          <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80">
                            {item.tanggal_sk_terbit}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setDetailItem(item)}
                    className="h-8 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Detail</span>
                  </Button>

                  <div className="flex items-center gap-1.5">
                    {/* Tombol Lihat Pratinjau SK Resmi jika sudah ada */}
                    {item.file_sk_resmi && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handlePreviewFile(item.file_sk_resmi!, "SK_Resmi.pdf")}
                        className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 flex items-center gap-1 cursor-pointer"
                        title="Lihat Pratinjau SK Resmi PC PMII"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat SK</span>
                      </Button>
                    )}

                    {/* Tombol Verifikasi bagi Admin Cabang */}
                    {isAdmin && item.status !== "DISETUJUI" && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setVerifyItem(item);
                          setVerifyDecision("DISETUJUI");
                          setVerifyTanggalSK(item.tanggal_sk_terbit || new Date().toISOString().split("T")[0]);
                          setVerifyNotes(item.catatan_revisi || "");
                          setVerifyFileSK(item.file_sk_resmi || "");
                          if (item.file_sk_resmi) {
                            setFileNames((prev) => ({ ...prev, skResmi: extractFileName(item.file_sk_resmi) }));
                          }
                        }}
                        className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-2.5 flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verifikasi</span>
                      </Button>
                    )}

                    {/* Tombol Edit bagi Pengurus Komisariat */}
                    {canEdit && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(item)}
                        className="h-8 w-8 p-0 text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg cursor-pointer"
                        title="Ubah & Perbaiki Pengajuan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {/* Tombol Hapus bagi Pengurus Komisariat */}
                    {canDelete && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(item)}
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                        title="Hapus Pengajuan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: FORM PENGAJUAN SK BARU / EDIT                   */}
      {/* ========================================================= */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
          {/* Header Minimalis */}
          <DialogHeader className="p-5 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    {editingId ? "Ubah & Perbaiki Pengajuan SK" : "Formulir Pengajuan SK Kepengurusan"}
                  </DialogTitle>
                  {editingId && (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 py-0 font-medium">
                      Mode Edit
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Lengkapi data dan berkas persyaratan untuk permohonan SK ke Pengurus Cabang.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* Alert Banner Catatan Revisi jika sedang mode perbaikan */}
            {editingItem?.status === "REVISI" && editingItem.catatan_revisi && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-semibold text-xs text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Catatan Perbaikan dari Pengurus Cabang</span>
                </div>
                <div className="pl-6 space-y-1">
                  <p className="text-xs text-amber-800 dark:text-amber-200 bg-white/70 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900/50 leading-relaxed font-medium">
                    &ldquo;{editingItem.catatan_revisi}&rdquo;
                  </p>
                  {editingItem.diverifikasi_oleh && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">
                      Diverifikasi oleh: <span className="font-semibold">{editingItem.diverifikasi_oleh}</span>
                      {editingItem.tanggal_verifikasi ? ` • ${editingItem.tanggal_verifikasi}` : ""}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Grid 2 Kolom: Komisariat Pemohon & Masa Khidmat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Komisariat Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  Komisariat Pemohon <span className="text-rose-500">*</span>
                </label>
                {!isAdmin ? (
                  <div className="h-10 px-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/90 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-800 dark:text-zinc-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate font-medium">
                        {currentUser?.commissariat || getKomisariatName(formKomisariatId) || "Komisariat Anda"}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 bg-zinc-200/60 dark:bg-zinc-700/60 px-1.5 py-0.5 rounded font-mono shrink-0">
                      Terkunci
                    </span>
                  </div>
                ) : (
                  <Select
                    value={formKomisariatId}
                    onValueChange={(val: any) => {
                      const selectedId = val || "";
                      setFormKomisariatId(selectedId);
                      if (!editingId) {
                        setFormPeriode(getTenantPeriod(selectedId));
                      }
                    }}
                  >
                    <SelectTrigger className="h-10 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <SelectValue placeholder="Pilih Komisariat" />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-200 dark:border-zinc-800">
                      {commissariats.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Masa Khidmat / Periode (Read Only dari Tenant) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    Masa Khidmat / Periode <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">Data dari profil tenant</span>
                </label>
                <div className="relative">
                  <Input
                    value={formPeriode}
                    readOnly
                    placeholder="Contoh: 2026 - 2027"
                    className="h-10 text-xs bg-zinc-100/90 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 rounded-xl cursor-not-allowed select-none focus-visible:ring-0 font-medium pr-24"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-200/70 dark:bg-zinc-700/60 px-2 py-0.5 rounded font-mono">
                      Read Only
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lampiran Berkas Persyaratan */}
            <div className="space-y-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Dokumen Persyaratan
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isAllDocsUploaded
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  }`}>
                    {isAllDocsUploaded ? "Semua Berkas Lengkap (8/8)" : `${uploadedDocsCount}/8 Dokumen Wajib`}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 hidden sm:inline">Semua dokumen wajib diunggah</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Surat Permohonan */}
                <FileDropCard
                  label="Surat Permohonan SK"
                  sublabel="Surat resmi permohonan ke PC PMII"
                  required={true}
                  fileUrl={filePermohonan}
                  fileName={fileNames["permohonan"]}
                  isUploading={uploadingField === "permohonan"}
                  onUpload={(file) => processUploadFile(file, "permohonan")}
                  onRemove={() => handleRemoveFile("permohonan")}
                  onPreview={handlePreviewFile}
                  accept=".pdf,.docx,.doc"
                />

                {/* 2. Susunan Pengurus */}
                <FileDropCard
                  label="Susunan Pengurus Lengkap"
                  sublabel="Struktur BPH, Biro, dan Lembaga"
                  required={true}
                  fileUrl={fileSusunanPengurus}
                  fileName={fileNames["susunanPengurus"]}
                  isUploading={uploadingField === "susunanPengurus"}
                  onUpload={(file) => processUploadFile(file, "susunanPengurus")}
                  onRemove={() => handleRemoveFile("susunanPengurus")}
                  onPreview={handlePreviewFile}
                  accept=".pdf,.docx,.doc,.xlsx,.xls"
                />

                {/* 3. Berita Acara RTK */}
                <FileDropCard
                  label="Berita Acara RTK"
                  sublabel="Hasil sidang pleno pemilihan mandataris"
                  required={true}
                  fileUrl={fileBeritaAcara}
                  fileName={fileNames["beritaAcara"]}
                  isUploading={uploadingField === "beritaAcara"}
                  onUpload={(file) => processUploadFile(file, "beritaAcara")}
                  onRemove={() => handleRemoveFile("beritaAcara")}
                  onPreview={handlePreviewFile}
                  accept=".pdf,.docx,.doc"
                />

                {/* 4. Berita Acara Tim Formatur */}
                <FileDropCard
                  label="Berita Acara Formatur"
                  sublabel="Hasil rapat tim formatur susunan pengurus"
                  required={true}
                  fileUrl={fileBeritaAcaraFormatur}
                  fileName={fileNames["beritaAcaraFormatur"]}
                  isUploading={uploadingField === "beritaAcaraFormatur"}
                  onUpload={(file) => processUploadFile(file, "beritaAcaraFormatur")}
                  onRemove={() => handleRemoveFile("beritaAcaraFormatur")}
                  onPreview={handlePreviewFile}
                  accept=".pdf,.docx,.doc"
                />

                {/* 5. Laporan Pertanggungjawaban (LPJ) */}
                <FileDropCard
                  label="Laporan Pertanggungjawaban (LPJ)"
                  sublabel="LPJ kepengurusan demisioner pada RTK"
                  required={true}
                  fileUrl={fileLPJ}
                  fileName={fileNames["lpj"]}
                  isUploading={uploadingField === "lpj"}
                  onUpload={(file) => processUploadFile(file, "lpj")}
                  onRemove={() => handleRemoveFile("lpj")}
                  onPreview={handlePreviewFile}
                  accept=".pdf,.docx,.doc"
                />

                {/* 6. CV Pengurus */}
                <FileDropCard
                  label="CV Pengurus"
                  sublabel="Biodata / CV pengurus harian dan biro"
                  required={true}
                  fileUrl={fileCVPengurus}
                  fileName={fileNames["cvPengurus"]}
                  isUploading={uploadingField === "cvPengurus"}
                  onUpload={(file) => processUploadFile(file, "cvPengurus")}
                  onRemove={() => handleRemoveFile("cvPengurus")}
                  onPreview={handlePreviewFile}
                  accept=".pdf,.docx,.doc,.zip,.rar"
                />

                {/* 7. Data Anggota */}
                <FileDropCard
                  label="Data Anggota"
                  sublabel="Daftar kader atau rekap anggota"
                  required={true}
                  fileUrl={filePresensi}
                  fileName={fileNames["presensi"]}
                  isUploading={uploadingField === "presensi"}
                  onUpload={(file) => processUploadFile(file, "presensi")}
                  onRemove={() => handleRemoveFile("presensi")}
                  onPreview={handlePreviewFile}
                  accept=".xlsx,.xls,.pdf,.docx,.doc,.csv"
                />

                {/* 8. Dokumentasi RTK */}
                <FileDropCard
                  label="Dokumentasi RTK"
                  sublabel="Foto atau dokumen dokumentasi kegiatan RTK"
                  required={true}
                  fileUrl={fileTambahan}
                  fileName={fileNames["tambahan"]}
                  isUploading={uploadingField === "tambahan"}
                  onUpload={(file) => processUploadFile(file, "tambahan")}
                  onRemove={() => handleRemoveFile("tambahan")}
                  onPreview={handlePreviewFile}
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.zip"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 flex items-center justify-between gap-3 shrink-0 rounded-b-2xl">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {isAllDocsUploaded ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Semua 8 berkas persyaratan wajib terpenuhi
                </span>
              ) : (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Seluruh 8 dokumen persyaratan wajib diunggah ({uploadedDocsCount}/8)</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
                className="h-8.5 px-3.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
              >
                Batal
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || !!uploadingField}
                onClick={() => handleSaveForm("DRAFT")}
                className="h-8.5 px-3.5 text-xs font-medium border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
              >
                Simpan Draf
              </Button>

              <Button
                type="button"
                disabled={isSubmitting || !!uploadingField}
                onClick={() => handleSaveForm("DIAJUKAN")}
                className="h-8.5 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Ajukan ke Cabang</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 2: VERIFIKASI & KEPUTUSAN (ADMIN PENGURUS CABANG)   */}
      {/* ========================================================= */}
      <Dialog open={!!verifyItem} onOpenChange={(open) => !open && setVerifyItem(null)}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
          {/* Header Minimalis */}
          <div className="px-5 py-3.5 pr-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Verifikasi SK
                </DialogTitle>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Info Ringkas Pemohon */}
            <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {getKomisariatName(verifyItem?.tenant_id)}
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  Masa Khidmat: <strong className="text-zinc-700 dark:text-zinc-200">{verifyItem?.periode}</strong> • Tanggal: <strong className="text-zinc-700 dark:text-zinc-200">{verifyItem?.tanggal_pengajuan}</strong>
                </p>
              </div>
              <div className="shrink-0">
                {verifyItem && renderStatusBadge(verifyItem.status)}
              </div>
            </div>

            {/* Berkas Lampiran */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Berkas Lampiran
              </span>
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Surat Permohonan */}
                <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-1 text-xs">
                  <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">Permohonan</span>
                  {verifyItem?.berkas_surat_permohonan ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewFile(verifyItem.berkas_surat_permohonan!, extractFileName(verifyItem.berkas_surat_permohonan))}
                      className="h-6 px-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 gap-1 shrink-0"
                    >
                      <Eye className="w-3 h-3" /> Lihat
                    </Button>
                  ) : (
                    <span className="text-[10px] text-zinc-400 shrink-0">Kosong</span>
                  )}
                </div>

                {/* 2. Susunan Pengurus */}
                <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-1 text-xs">
                  <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">Susunan Pengurus</span>
                  {verifyItem?.berkas_susunan_pengurus ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewFile(verifyItem.berkas_susunan_pengurus!, extractFileName(verifyItem.berkas_susunan_pengurus))}
                      className="h-6 px-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 gap-1 shrink-0"
                    >
                      <Eye className="w-3 h-3" /> Lihat
                    </Button>
                  ) : (
                    <span className="text-[10px] text-zinc-400 shrink-0">Kosong</span>
                  )}
                </div>

                {/* 3. Berita Acara RTK */}
                <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-1 text-xs">
                  <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">BA RTK</span>
                  {verifyItem?.berkas_berita_acara ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewFile(verifyItem.berkas_berita_acara!, extractFileName(verifyItem.berkas_berita_acara))}
                      className="h-6 px-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 gap-1 shrink-0"
                    >
                      <Eye className="w-3 h-3" /> Lihat
                    </Button>
                  ) : (
                    <span className="text-[10px] text-zinc-400 shrink-0">-</span>
                  )}
                </div>

                {/* 4. Berita Acara Formatur */}
                <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-1 text-xs">
                  <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">BA Formatur</span>
                  {verifyItem?.berkas_berita_acara_formatur ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewFile(verifyItem.berkas_berita_acara_formatur!, extractFileName(verifyItem.berkas_berita_acara_formatur))}
                      className="h-6 px-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 gap-1 shrink-0"
                    >
                      <Eye className="w-3 h-3" /> Lihat
                    </Button>
                  ) : (
                    <span className="text-[10px] text-zinc-400 shrink-0">-</span>
                  )}
                </div>

                {/* 5. LPJ */}
                <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-1 text-xs">
                  <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">LPJ Demisioner</span>
                  {verifyItem?.berkas_lpj ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewFile(verifyItem.berkas_lpj!, extractFileName(verifyItem.berkas_lpj))}
                      className="h-6 px-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 gap-1 shrink-0"
                    >
                      <Eye className="w-3 h-3" /> Lihat
                    </Button>
                  ) : (
                    <span className="text-[10px] text-zinc-400 shrink-0">-</span>
                  )}
                </div>

                {/* 6. CV Pengurus */}
                <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-1 text-xs">
                  <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">CV Pengurus</span>
                  {verifyItem?.berkas_cv_pengurus ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewFile(verifyItem.berkas_cv_pengurus!, extractFileName(verifyItem.berkas_cv_pengurus))}
                      className="h-6 px-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 gap-1 shrink-0"
                    >
                      <Eye className="w-3 h-3" /> Lihat
                    </Button>
                  ) : (
                    <span className="text-[10px] text-zinc-400 shrink-0">-</span>
                  )}
                </div>

                {/* 7. Data Anggota */}
                <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-1 text-xs">
                  <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">Data Anggota</span>
                  {verifyItem?.berkas_presensi ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewFile(verifyItem.berkas_presensi!, extractFileName(verifyItem.berkas_presensi))}
                      className="h-6 px-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 gap-1 shrink-0"
                    >
                      <Eye className="w-3 h-3" /> Lihat
                    </Button>
                  ) : (
                    <span className="text-[10px] text-zinc-400 shrink-0">-</span>
                  )}
                </div>

                {/* 8. Dokumentasi RTK */}
                {verifyItem?.berkas_tambahan && (
                  <div className="col-span-2 p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-1 text-xs">
                    <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">Dokumentasi RTK</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewFile(verifyItem.berkas_tambahan!, extractFileName(verifyItem.berkas_tambahan))}
                      className="h-6 px-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 gap-1 shrink-0"
                    >
                      <Eye className="w-3 h-3" /> Lihat
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Pilihan Keputusan */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Keputusan
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyDecision("DISETUJUI")}
                  className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                    verifyDecision === "DISETUJUI"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Setujui</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVerifyDecision("REVISI")}
                  className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                    verifyDecision === "REVISI"
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500/20"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                  <span>Revisi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVerifyDecision("DITOLAK")}
                  className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                    verifyDecision === "DITOLAK"
                      ? "border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Tolak</span>
                </button>
              </div>
            </div>

            {/* Form Keputusan */}
            {verifyDecision === "DISETUJUI" && (
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">File SK (.pdf / .docx)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="sk-file-upload-input"
                      accept=".pdf,.docx,.doc"
                      className="hidden"
                      onChange={(e) => handleUploadFile(e, "skResmi")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("sk-file-upload-input")?.click()}
                      className="h-8 text-xs bg-white dark:bg-zinc-900 gap-1.5 cursor-pointer shrink-0"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{verifyFileSK ? "Ganti File" : "Pilih File"}</span>
                    </Button>

                    {verifyFileSK ? (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate max-w-[180px] font-medium">
                          {fileNames["skResmi"] || extractFileName(verifyFileSK)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreviewFile(verifyFileSK, fileNames["skResmi"] || extractFileName(verifyFileSK))}
                          className="h-7 px-2 text-xs text-blue-600 dark:text-blue-400 cursor-pointer shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Lihat
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-400">Belum ada file SK</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(verifyDecision === "REVISI" || verifyDecision === "DITOLAK") && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  {verifyDecision === "REVISI" ? "Catatan Revisi:" : "Alasan Penolakan:"}
                </label>
                <textarea
                  rows={3}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder={
                    verifyDecision === "REVISI"
                      ? "Tuliskan poin yang perlu diperbaiki pemohon..."
                      : "Tuliskan alasan penolakan..."
                  }
                  className="w-full text-xs p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 resize-none"
                />
              </div>
            )}
          </div>

          {/* Footer Minimalis */}
          <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVerifyItem(null)}
              className="h-8 px-3 text-xs rounded-lg cursor-pointer"
            >
              Batal
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isVerifying}
              onClick={handleSubmitVerification}
              className={`h-8 px-4 text-xs font-semibold text-white rounded-lg cursor-pointer shadow-xs ${
                verifyDecision === "DISETUJUI"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : verifyDecision === "REVISI"
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Keputusan</span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 3: DETAIL & TRACKING PENGAJUAN SK                  */}
      {/* ========================================================= */}
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <DialogHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  Detail Pengajuan SK
                </DialogTitle>
              </div>
              {detailItem && renderStatusBadge(detailItem.status)}
            </div>
          </DialogHeader>

          {detailItem && (
            <div className="space-y-4 py-2 text-xs">
              {/* Identitas */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="col-span-2">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Komisariat Pemohon</span>
                  <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200 mt-0.5">
                    {getKomisariatName(detailItem.tenant_id)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Masa Khidmat</span>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">{detailItem.periode}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Tanggal Diajukan</span>
                  <p className="font-mono text-zinc-700 dark:text-zinc-300 mt-0.5">{detailItem.tanggal_pengajuan}</p>
                </div>
              </div>

              {/* Status SK Terbit */}
              {detailItem.status === "DISETUJUI" && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> SK Telah Diterbitkan Cabang
                    </span>
                    {detailItem.tanggal_sk_terbit && (
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        {detailItem.tanggal_sk_terbit}
                      </span>
                    )}
                  </div>
                  {detailItem.diverifikasi_oleh && (
                    <p className="text-[10px] text-zinc-500">
                      Diverifikasi oleh: {detailItem.diverifikasi_oleh}
                    </p>
                  )}
                  {detailItem.tanggal_sk_terbit && (
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      Tanggal Penetapan: {detailItem.tanggal_sk_terbit} — Diverifikasi oleh: {detailItem.diverifikasi_oleh || "Pengurus Cabang"}
                    </p>
                  )}
                  {detailItem.file_sk_resmi && (
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handlePreviewFile(detailItem.file_sk_resmi!, "SK_Resmi.pdf")}
                        className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer rounded-lg px-3"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat SK Resmi</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Catatan Revisi */}
              {detailItem.catatan_revisi && (
                <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 space-y-1">
                  <span className="font-bold text-orange-900 dark:text-orange-200 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-orange-600" /> Catatan dari Pengurus Cabang:
                  </span>
                  <p className="text-xs text-orange-950 dark:text-orange-200 leading-relaxed italic">
                    &ldquo;{detailItem.catatan_revisi}&rdquo;
                  </p>
                </div>
              )}

              {/* Berkas Lampiran yang Diunggah */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[10px]">
                  Berkas Persyaratan yang Dilampirkan:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-300">Surat Permohonan:</span>
                    {detailItem.berkas_surat_permohonan ? (
                      <button
                        type="button"
                        onClick={() => handlePreviewFile(detailItem.berkas_surat_permohonan!, "Surat_Permohonan")}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau
                      </button>
                    ) : (
                      <span className="text-zinc-400">Tidak ada</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-300">Susunan Pengurus:</span>
                    {detailItem.berkas_susunan_pengurus ? (
                      <button
                        type="button"
                        onClick={() => handlePreviewFile(detailItem.berkas_susunan_pengurus!, "Susunan_Pengurus")}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau
                      </button>
                    ) : (
                      <span className="text-zinc-400">Tidak ada</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-300">Berita Acara RTK:</span>
                    {detailItem.berkas_berita_acara ? (
                      <button
                        type="button"
                        onClick={() => handlePreviewFile(detailItem.berkas_berita_acara!, "Berita_Acara_RTK")}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau
                      </button>
                    ) : (
                      <span className="text-zinc-400">Tidak ada</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-300">Berita Acara Formatur:</span>
                    {detailItem.berkas_berita_acara_formatur ? (
                      <button
                        type="button"
                        onClick={() => handlePreviewFile(detailItem.berkas_berita_acara_formatur!, "Berita_Acara_Formatur")}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau
                      </button>
                    ) : (
                      <span className="text-zinc-400">Tidak ada</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-300">LPJ Demisioner:</span>
                    {detailItem.berkas_lpj ? (
                      <button
                        type="button"
                        onClick={() => handlePreviewFile(detailItem.berkas_lpj!, "LPJ_Demisioner")}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau
                      </button>
                    ) : (
                      <span className="text-zinc-400">Tidak ada</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-300">CV Pengurus:</span>
                    {detailItem.berkas_cv_pengurus ? (
                      <button
                        type="button"
                        onClick={() => handlePreviewFile(detailItem.berkas_cv_pengurus!, "CV_Pengurus")}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau
                      </button>
                    ) : (
                      <span className="text-zinc-400">Tidak ada</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-300">Data Anggota:</span>
                    {detailItem.berkas_presensi ? (
                      <button
                        type="button"
                        onClick={() => handlePreviewFile(detailItem.berkas_presensi!, "Data_Anggota")}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau
                      </button>
                    ) : (
                      <span className="text-zinc-400">Tidak ada</span>
                    )}
                  </div>

                  {detailItem.berkas_tambahan && (
                    <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-300">Dokumentasi RTK:</span>
                      <button
                        type="button"
                        onClick={() => handlePreviewFile(detailItem.berkas_tambahan!, "Dokumentasi_RTK")}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDetailItem(null)}
              className="h-9 text-xs"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 4: KONFIRMASI HAPUS PENGAJUAN                       */}
      {/* ========================================================= */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-2">
              <Trash2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Hapus Pengajuan SK?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Apakah Anda yakin ingin menghapus data pengajuan untuk <strong>{getKomisariatName(deleteTarget?.tenant_id)}</strong> (Periode {deleteTarget?.periode})? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="h-9 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 5: PRATINJAU DOKUMEN UNIVERSAL (DOCX, PDF, GAMBAR)   */}
      {/* ========================================================= */}
      <DocumentViewerModal
        isOpen={previewDoc.isOpen}
        onClose={() => setPreviewDoc((prev) => ({ ...prev, isOpen: false }))}
        fileUrl={previewDoc.url}
        fileName={previewDoc.fileName}
      />
    </div>
  );
}
