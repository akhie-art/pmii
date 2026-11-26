"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { sanitizeHtml, sanitizeLetterHtml } from "@/lib/sanitize";
import {
  Plus,
  Trash2,
  Edit3,
  Eye,
  UploadCloud,
  FileText,
  Search,
  Check,
  X,
  Loader2,
  Save,
  Download,
  RefreshCw,
  Sparkles,
  FileCode,
  Lightbulb,
  Building,
  GraduationCap,
  Copy,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  SlidersHorizontal,
  CloudCheck,
} from "lucide-react";
import { db, SuratTemplate, generateUUID } from "@/lib/db";
import { deleteStorageFile } from "@/lib/supabase";
import {
  isRecordInTenant,
  isCabangRecord,
  enforceTenantWrite,
  getActiveTenant,
  TENANT_CHANGED_EVENT,
} from "@/lib/tenancy";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  extractDocxPlaceholders,
  fillDocxTemplate,
  serializeTemplateContent,
  parseTemplateContent,
  downloadDocxBlob,
  uploadFileToStorage,
  getDocxArrayBuffer,
  formatBytes,
  OFFICIAL_PMII_TEMPLATE_URL,
} from "./docx-template-helper";
import {
  extractDocxPageMetadata,
  renderDocxToElement,
  type DocxPageMetadata,
} from "./docx-preview-helper";
import {
  humanizePlaceholderKey,
  isMultilineField,
} from "./letter-generator-helpers";
import {
  STANDARD_PMII_TAGS,
  buildSampleValuesForPlaceholders,
  classifyTemplatePlaceholders,
  deriveTemplateNameFromFilename,
  resolveTemplateTenantScope,
} from "./template-manager-helper";
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
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface TemplateManagerDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTemplatesUpdated?: (count?: number) => void;
  inline?: boolean;
  currentUser?: any;
  activeTenant?: string;
}

const MAX_DOCX_SIZE = 10 * 1024 * 1024; // 10 MB

export function TemplateManagerDialog({
  isOpen = false,
  onOpenChange = () => {},
  onTemplatesUpdated,
  inline = false,
  currentUser: propCurrentUser,
  activeTenant: propActiveTenant,
}: TemplateManagerDialogProps) {
  const [localUser, setLocalUser] = useState<any>(null);
  const [currentTenant, setCurrentTenant] = useState<string>("ALL");
  const uncommittedFileUrlRef = useRef<string | null>(null);
  const cleanMasterHtmlRef = useRef<string>("");

  const [templates, setTemplates] = useState<SuratTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form Editor Modal State (Create / Edit)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SuratTemplate | null>(null);
  const [formName, setFormName] = useState("");
  const [formContent, setFormContent] = useState("");

  // Konsep Pengisi Template DOCX (PizZip + Docxtemplater + docx-preview)
  const [formFileBase64, setFormFileBase64] = useState<string>("");
  const [formFileUrl, setFormFileUrl] = useState<string>("");
  const [previousFileUrl, setPreviousFileUrl] = useState<string | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [uploadedFileSize, setUploadedFileSize] = useState<string>("");
  const [formPlaceholders, setFormPlaceholders] = useState<string[]>([]);
  const [formTestValues, setFormTestValues] = useState<Record<string, string>>({});
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [isUploadingDocx, setIsUploadingDocx] = useState(false);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [isUpdatingPreview, setIsUpdatingPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Studio Canvas UI States
  const [inspectorTab, setInspectorTab] = useState<"variables" | "guide">("variables");
  const [previewMode, setPreviewMode] = useState<"original" | "simulated">("original");
  const [pageMeta, setPageMeta] = useState<DocxPageMetadata | null>(null);
  const [canvasViewportWidth, setCanvasViewportWidth] = useState<number>(860);
  const [unscaledCanvasHeight, setUnscaledCanvasHeight] = useState<number>(1060);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const docxInputRef = useRef<HTMLInputElement>(null);
  const editorCanvasRef = useRef<HTMLDivElement>(null);
  const canvasViewportRef = useRef<HTMLDivElement>(null);

  // Preview Modal State
  const [previewTemplate, setPreviewTemplate] = useState<SuratTemplate | null>(null);

  // Delete Confirmation Modal State
  const [templateToDelete, setTemplateToDelete] = useState<{
    id: string;
    name: string;
    fileUrl?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync user and active tenant
  useEffect(() => {
    if (typeof window !== "undefined") {
      queueMicrotask(() => {
        const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
        if (stored) {
          try {
            setLocalUser(JSON.parse(stored));
          } catch {}
        }
        setCurrentTenant(getActiveTenant() || "ALL");
      });
      const handleTenant = (e: any) => {
        setCurrentTenant(e.detail?.activeTenant || "ALL");
      };
      window.addEventListener(TENANT_CHANGED_EVENT, handleTenant);
      return () => {
        window.removeEventListener(TENANT_CHANGED_EVENT, handleTenant);
      };
    }
  }, []);

  const currentUser = propCurrentUser || localUser;
  const activeTenant = propActiveTenant || currentTenant;

  const tenantScope = useMemo(
    () => resolveTemplateTenantScope(editingTemplate, currentUser, activeTenant),
    [editingTemplate, currentUser, activeTenant]
  );

  const { coreKeys, customKeys } = useMemo(
    () => classifyTemplatePlaceholders(formPlaceholders),
    [formPlaceholders]
  );

  const hasDocxReady = Boolean(formFileBase64 || formFileUrl);
  const hasNameReady = Boolean(formName.trim());
  const canSaveTemplate =
    !isUploadingDocx && !isSavingForm && hasNameReady && (hasDocxReady || Boolean(formContent.trim()));

  const onTemplatesUpdatedRef = useRef(onTemplatesUpdated);
  useEffect(() => {
    onTemplatesUpdatedRef.current = onTemplatesUpdated;
  });

  // Load templates from database
  const loadTemplates = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await db.getSuratTemplates();
      if (Array.isArray(data)) {
        setTemplates(data);
      }
    } catch (e) {
      console.error("Gagal memuat template surat:", e);
      toast.error("Gagal memuat daftar template dari database");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (inline || isOpen) {
      queueMicrotask(() => {
        void loadTemplates();
      });
    }
  }, [isOpen, inline, loadTemplates]);

  // Sinkronkan antar-instance (modal vs tab inline) saat surat_templates berubah
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleTableSync = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail?.table || detail.table === "surat_templates") {
        void loadTemplates();
      }
    };
    window.addEventListener("PMII_TABLE_SYNC", handleTableSync);
    return () => window.removeEventListener("PMII_TABLE_SYNC", handleTableSync);
  }, [loadTemplates]);

  // Kunci sumber dokumen stabil: hindari re-render/kedipan ganda ketika upload cloud selesai
  const activeDocxSourceKey = formFileBase64
    ? `b64:${formFileBase64.length}:${formFileBase64.slice(0, 32)}`
    : formFileUrl
      ? `url:${formFileUrl}`
      : "";

  // Ukur lebar area canvas Google Docs untuk mode "Sesuaikan Lebar (Fit)" yang selalu tajam
  useEffect(() => {
    if (!isEditorOpen) return;
    const viewportEl = canvasViewportRef.current;
    if (!viewportEl || typeof ResizeObserver === "undefined") return;

    const updateWidth = () => {
      const w = viewportEl.clientWidth;
      if (w > 0) setCanvasViewportWidth(w);
    };
    updateWidth();

    const ro = new ResizeObserver(updateWidth);
    ro.observe(viewportEl);
    return () => ro.disconnect();
  }, [isEditorOpen, hasDocxReady]);

  // Sinkronkan tinggi wrapper berskala agar scroll vertikal selalu persis setinggi halaman dokumen
  useEffect(() => {
    if (!isEditorOpen || !hasDocxReady) return;
    const canvasEl = editorCanvasRef.current;
    if (!canvasEl || typeof ResizeObserver === "undefined") return;

    const updateHeight = () => {
      const h = canvasEl.scrollHeight || canvasEl.offsetHeight;
      if (h > 0) setUnscaledCanvasHeight(h);
    };
    updateHeight();

    const ro = new ResizeObserver(updateHeight);
    ro.observe(canvasEl);
    return () => ro.disconnect();
  }, [isEditorOpen, hasDocxReady]);

  // Dimensi halaman asli & skala otomatis pas layar (maks 100% agar teks & garis tajam)
  const pagePxWidth = useMemo(
    () => (pageMeta?.widthPt || 612) * (96 / 72),
    [pageMeta]
  );

  const effectiveScale = useMemo(() => {
    const available = Math.max(320, canvasViewportWidth - 56);
    return Math.min(1, Math.max(0.55, available / pagePxWidth));
  }, [canvasViewportWidth, pagePxWidth]);

  // Render live preview dokumen Word 1:1 (Mode Asli maupun Mode Simulasi Data auto-debounced)
  useEffect(() => {
    if (!isEditorOpen || !activeDocxSourceKey) return;
    let cancelled = false;

    const delay = previewMode === "simulated" ? 260 : 30;
    const timer = setTimeout(async () => {
      const canvasEl = editorCanvasRef.current;
      if (!canvasEl || cancelled) return;

      setIsUpdatingPreview(true);
      try {
        // Prioritaskan buffer lokal agar 0ms & tidak kedip saat upload ke Storage selesai
        const rawBuffer = formFileBase64
          ? base64ToArrayBuffer(formFileBase64)
          : await getDocxArrayBuffer({ fileUrl: formFileUrl });
        if (cancelled) return;

        setPageMeta(extractDocxPageMetadata(rawBuffer));

        let bufferToRender = rawBuffer;
        if (previewMode === "simulated" && Object.keys(formTestValues).length > 0) {
          const { arrayBuffer: filledBuffer, error } = fillDocxTemplate(rawBuffer, formTestValues);
          if (!error) {
            bufferToRender = filledBuffer;
          }
        }

        if (cancelled || !editorCanvasRef.current) return;

        await renderDocxToElement(bufferToRender, canvasEl);

        if (!cancelled) {
          const renderedHeight = canvasEl.scrollHeight || canvasEl.offsetHeight;
          if (renderedHeight > 0) {
            setUnscaledCanvasHeight(renderedHeight);
          }
          // Simpan HTML bersih (unfilled master) agar uji coba simulasi tidak mengotori arsip template
          if (previewMode === "original") {
            cleanMasterHtmlRef.current = canvasEl.innerHTML;
            setFormContent(canvasEl.innerHTML);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Gagal render preview Word:", e);
        }
      } finally {
        if (!cancelled) {
          setIsUpdatingPreview(false);
        }
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditorOpen, activeDocxSourceKey, previewMode, formTestValues]);

  // Filter templates berdasarkan Tenant (sebelum pencarian, agar badge tab akurat per tenant)
  const tenantTemplates = useMemo(
    () =>
      templates.filter((t) =>
        isRecordInTenant(
          currentUser,
          {
            commissariat: t.commissariat,
            komisariat_id: t.komisariat_id,
            tenant_id: t.tenant_id || t.komisariat_id,
          },
          activeTenant
        )
      ),
    [templates, currentUser, activeTenant]
  );

  // Laporkan jumlah template sesuai scope tenant aktif ke parent tab badge
  useEffect(() => {
    if (onTemplatesUpdatedRef.current) {
      onTemplatesUpdatedRef.current(tenantTemplates.length);
    }
  }, [tenantTemplates.length]);

  const filteredTemplates = tenantTemplates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyTag = (tag: string) => {
    const formatted = `{{${tag}}}`;
    navigator.clipboard?.writeText(formatted).catch(() => {});
    setCopiedTag(tag);
    toast.success(`Tag ${formatted} disalin! Tempelkan di dokumen Microsoft Word.`);
    setTimeout(() => {
      setCopiedTag((prev) => (prev === tag ? null : prev));
    }, 1800);
  };

  // Tutup Editor dan bersihkan berkas yang diunggah jika batal
  const handleCloseEditor = () => {
    if (isUploadingDocx || isSavingForm) return;
    if (uncommittedFileUrlRef.current && uncommittedFileUrlRef.current !== previousFileUrl) {
      deleteStorageFile(uncommittedFileUrlRef.current).catch((err) => {
        console.warn("Membersihkan berkas uncommitted storage:", err);
      });
      uncommittedFileUrlRef.current = null;
    }
    setIsEditorOpen(false);
    setEditingTemplate(null);
    setIsDragging(false);
  };

  // Open Editor for New Template
  const handleAddNew = () => {
    uncommittedFileUrlRef.current = null;
    cleanMasterHtmlRef.current = "";
    setEditingTemplate(null);
    setPreviousFileUrl(null);
    setFormName("");
    setFormContent("");
    setFormFileBase64("");
    setFormFileUrl("");
    setUploadedFileSize("");
    setFormPlaceholders([]);
    setFormTestValues({});
    setUploadedFileName("");
    setPreviewMode("original");
    setInspectorTab("variables");
    setPageMeta(null);
    setIsEditorOpen(true);
  };

  // Open Editor for Existing Template
  const handleEdit = (tmpl: SuratTemplate) => {
    uncommittedFileUrlRef.current = null;
    setEditingTemplate(tmpl);
    setFormName(tmpl.name);

    const parsed = parseTemplateContent(tmpl.content);
    cleanMasterHtmlRef.current = parsed.html || "";
    setFormContent(parsed.html);
    const b64 = parsed.fileBase64 || "";
    setFormFileBase64(b64);
    const fUrl = tmpl.fileUrl || parsed.fileUrl || "";
    setFormFileUrl(fUrl);
    setPreviousFileUrl(fUrl || null);
    setUploadedFileSize("");
    const ph = tmpl.placeholders || parsed.placeholders || [];
    setFormPlaceholders(ph);
    setUploadedFileName(tmpl.name ? `${tmpl.name}.docx` : "");
    setFormTestValues(buildSampleValuesForPlaceholders(ph));
    setPreviewMode("original");
    setInspectorTab("variables");
    setPageMeta(null);
    setIsEditorOpen(true);
  };

  // Delete Template Handlers
  const handleDeleteClick = (id: string, name: string) => {
    const tmpl = templates.find((t) => t.id === id);
    const parsed = tmpl ? parseTemplateContent(tmpl.content) : null;
    const fileUrl = tmpl?.fileUrl || parsed?.fileUrl;
    setTemplateToDelete({ id, name, fileUrl });
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
      const deleted = await db.deleteSuratTemplate(templateToDelete.id, templateToDelete.fileUrl);
      if (!deleted) {
        toast.error("Gagal menghapus template dari database. Periksa koneksi atau hak akses Anda.");
        return;
      }
      const updated = templates.filter((t) => t.id !== templateToDelete.id);
      setTemplates(updated);
      toast.success(`Template "${templateToDelete.name}" berhasil dihapus.`);
      setTemplateToDelete(null);
    } catch (e) {
      console.error("Gagal menghapus template:", e);
      toast.error("Gagal menghapus template dari database.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Proses file Word (.docx)
  const processDocxFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      toast.error("Format file harus .docx (Microsoft Word)");
      return;
    }

    if (file.size > MAX_DOCX_SIZE) {
      toast.error(
        `Ukuran file terlalu besar (${formatBytes(file.size)}). Batas maksimal adalah 10 MB.`
      );
      return;
    }

    setIsUploadingDocx(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const b64 = arrayBufferToBase64(arrayBuffer);

      // Ekstraksi placeholder {{nama}}, {{nomor}}, dll. via PizZip + docxtemplater
      const { keys, error: extractErr } = extractDocxPlaceholders(arrayBuffer);
      if (extractErr) {
        toast.warning("Info template: " + extractErr);
      }

      setFormFileBase64(b64);
      setPageMeta(extractDocxPageMetadata(arrayBuffer));
      setUploadedFileName(file.name);
      setUploadedFileSize(formatBytes(file.size));
      setFormPlaceholders(keys);
      setFormTestValues(buildSampleValuesForPlaceholders(keys));
      setPreviewMode("original");
      setInspectorTab("variables");

      // Berikan nama default rapi dari nama file jika belum diisi
      const derivedName = deriveTemplateNameFromFilename(file.name);
      if (!formName.trim() && derivedName) {
        setFormName(derivedName);
      }

      const prevUncommitted = uncommittedFileUrlRef.current;
      const uploadRes = await uploadFileToStorage(
        file,
        "surat-templates",
        file.name,
        tenantScope.tenantId
      );
      if (uploadRes?.url) {
        if (
          prevUncommitted &&
          prevUncommitted !== previousFileUrl &&
          prevUncommitted !== uploadRes.url
        ) {
          deleteStorageFile(prevUncommitted).catch(() => {});
        }
        setFormFileUrl(uploadRes.url);
        uncommittedFileUrlRef.current = uploadRes.url;
      }

      toast.success(
        keys.length > 0
          ? `Berkas "${file.name}" dimuat (${keys.length} tag variabel terdeteksi).`
          : `Berkas "${file.name}" berhasil dimuat.`
      );
    } catch (err: any) {
      console.error("Gagal memproses file Word:", err);
      toast.error("Gagal membaca file Word: " + (err?.message || "File rusak."));
    } finally {
      setIsUploadingDocx(false);
    }
  };

  const handleDocxFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processDocxFile(file);
    }
    e.target.value = "";
  };

  const handleStageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleStageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setIsDragging(false);
  };

  const handleStageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processDocxFile(file);
  };

  // Memuat Template Resmi Master PMII secara langsung ke editor
  const handleLoadOfficialSample = async () => {
    setIsLoadingSample(true);
    try {
      const response = await fetch(OFFICIAL_PMII_TEMPLATE_URL);
      if (!response.ok) throw new Error("Gagal mengambil file contoh master.");
      const blob = await response.blob();
      const sampleFile = new File([blob], "Template-Surat-Resmi-PMII.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      await processDocxFile(sampleFile);
      if (!formName.trim()) setFormName("Format Surat Resmi PMII");
    } catch (e: any) {
      console.error("Gagal memuat template master resmi:", e);
      toast.error("Gagal memuat template resmi: " + (e?.message || "File tidak ditemukan."));
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Unduh langsung file contoh resmi PMII untuk diedit di Microsoft Word
  const handleDownloadOfficialSample = async () => {
    try {
      const response = await fetch(OFFICIAL_PMII_TEMPLATE_URL);
      if (!response.ok) throw new Error("File contoh tidak ditemukan.");
      const blob = await response.blob();
      downloadDocxBlob(blob, "Contoh_Template_Surat_Resmi_PMII");
      toast.success("Contoh master Word (.docx) berhasil diunduh!");
    } catch (e: any) {
      toast.error("Gagal mengunduh contoh master: " + (e?.message || "Coba lagi."));
    }
  };

  // Unduh Master / Filled .docx
  const handleDownloadDocx = async (useTestValues = false) => {
    if (!formFileBase64 && !formFileUrl) return;
    try {
      const arrayBuffer = await getDocxArrayBuffer({
        fileUrl: formFileUrl,
        fileBase64: formFileBase64,
      });
      let blob: Blob;
      if (useTestValues && Object.keys(formTestValues).length > 0) {
        const res = fillDocxTemplate(arrayBuffer, formTestValues);
        blob = res.blob;
      } else {
        blob = new Blob([arrayBuffer], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
      }
      const suffix = useTestValues ? "_Simulasi" : "";
      const fname = `${(formName.trim() || "Template-PMII").replace(/\s+/g, "_")}${suffix}`;
      downloadDocxBlob(blob, fname);
      toast.success(
        useTestValues
          ? "Hasil simulasi dokumen .docx berhasil diunduh!"
          : "Dokumen master .docx berhasil diunduh!"
      );
    } catch (e: any) {
      toast.error("Gagal mengunduh file: " + e.message);
    }
  };

  // Save Template to Database (delta single-row upsert)
  const handleSaveForm = async () => {
    if (isUploadingDocx || isSavingForm) return;
    if (!formName.trim()) {
      toast.error("Harap masukkan nama template terlebih dahulu.");
      return;
    }

    if (!formFileBase64 && !formFileUrl && !formContent.trim()) {
      toast.error("Harap unggah file Word (.docx) terlebih dahulu.");
      return;
    }

    setIsSavingForm(true);
    // Selalu simpan HTML bersih dari master asli (bukan hasil simulasi sementara)
    const htmlToSave = cleanMasterHtmlRef.current || formContent || editorCanvasRef.current?.innerHTML || "";
    const serializedContent = serializeTemplateContent(htmlToSave, formPlaceholders, formFileUrl);

    try {
      const rawTemplateItem: SuratTemplate = {
        ...(editingTemplate || {}),
        id: editingTemplate?.id || generateUUID(),
        name: formName.trim(),
        content: serializedContent,
        fileUrl: formFileUrl || undefined,
        placeholders: formPlaceholders,
        isDocx: Boolean(formFileBase64 || formFileUrl),
        commissariat: tenantScope.commissariatForWrite,
        created_at: editingTemplate?.created_at || new Date().toISOString(),
      };

      const templateItem = enforceTenantWrite(
        currentUser,
        rawTemplateItem,
        tenantScope.tenantOverrideForWrite
      );

      const saved = await db.upsertSuratTemplate(templateItem);
      if (!saved) {
        toast.error("Gagal menyimpan template ke database. Periksa koneksi atau hak akses Anda.");
        return;
      }
      uncommittedFileUrlRef.current = null;

      let updated: SuratTemplate[] = [];
      if (editingTemplate?.id) {
        updated = templates.map((t) =>
          t.id === editingTemplate.id ? { ...t, ...templateItem } : t
        );
        toast.success(`Template "${formName.trim()}" berhasil diperbarui!`);
      } else {
        updated = [templateItem, ...templates];
        toast.success(`Template "${formName.trim()}" berhasil disimpan!`);
      }

      // Bersihkan file lama di Supabase Storage jika file diganti saat edit
      if (editingTemplate?.id && previousFileUrl && formFileUrl && previousFileUrl !== formFileUrl) {
        deleteStorageFile(previousFileUrl).catch((err) => {
          console.warn("Gagal menghapus file lama dari storage:", err);
        });
      }

      setTemplates(updated);
      setIsEditorOpen(false);
      setEditingTemplate(null);
    } catch (e) {
      console.error("Gagal menyimpan template:", e);
      toast.error("Gagal menyimpan template ke database.");
    } finally {
      setIsSavingForm(false);
    }
  };

  const renderList = () => (
    <div className="space-y-4">
      {/* Toolbar Pencarian & Aksi Template */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama template surat..."
            className="pl-9 pr-8 h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer bg-transparent border-none p-0"
              aria-label="Hapus pencarian template"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            {filteredTemplates.length} dari {tenantTemplates.length} template
          </span>
          <Button
            type="button"
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl h-9 px-3.5 flex items-center gap-1.5 shadow-xs cursor-pointer border-none shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Template Word</span>
          </Button>
        </div>
      </div>

      {/* Grid Template Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-2.5 w-1/2 bg-zinc-100 dark:bg-zinc-800/70 rounded" />
                </div>
              </div>
              <div className="h-16 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
              <div className="h-7 bg-zinc-100 dark:bg-zinc-800/40 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
            {searchQuery ? <Search className="w-5 h-5" /> : <FileText className="w-6 h-6" />}
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {searchQuery
              ? `Template "${searchQuery}" Tidak Ditemukan`
              : "Belum Ada Template Surat Tersimpan"}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
            {searchQuery
              ? "Coba kata kunci lain atau hapus pencarian untuk melihat seluruh daftar template."
              : "Unggah berkas Microsoft Word (.docx) resmi organisasi berisi tag variabel seperti {{tujuan_surat}} dan {{perihal}} untuk penerbitan surat cepat."}
          </p>
          {searchQuery ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setSearchQuery("")}
              className="text-xs h-9 rounded-xl px-4 gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tampilkan Semua Template</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleAddNew}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 rounded-xl px-4 gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Template Word Pertama</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((tmpl) => {
            const parsed = parseTemplateContent(tmpl.content);
            const isDocx = tmpl.isDocx || parsed.isDocxTemplate;
            const placeholders = tmpl.placeholders || parsed.placeholders || [];
            const phCount = placeholders.length;
            const fileUrl = tmpl.fileUrl || parsed.fileUrl;
            const isCabangTmpl = isCabangRecord(tmpl);

            return (
              <div
                key={tmpl.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-sm transition-all relative group"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isDocx
                          ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/60"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4
                        className="font-bold text-xs sm:text-[13px] text-zinc-900 dark:text-zinc-100 line-clamp-1"
                        title={tmpl.name}
                      >
                        {tmpl.name}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isDocx && (
                          <Badge className="text-[9.5px] px-1.5 py-0 bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900 shadow-none">
                            DOCX
                          </Badge>
                        )}
                        {fileUrl && (
                          <Badge className="text-[9.5px] px-1.5 py-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900 shadow-none">
                            Cloud
                          </Badge>
                        )}
                        {isCabangTmpl ? (
                          <span className="inline-flex items-center gap-0.5 text-[9.5px] text-zinc-500 dark:text-zinc-400 font-medium">
                            <Building className="w-2.5 h-2.5" />
                            <span>Cabang</span>
                          </span>
                        ) : tmpl.commissariat ? (
                          <span className="inline-flex items-center gap-0.5 text-[9.5px] text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[130px]">
                            <GraduationCap className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{tmpl.commissariat}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Placeholder Tags / Snippet Preview */}
                  {phCount > 0 ? (
                    <div className="p-2.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 text-[10px] space-y-1.5">
                      <span className="font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        <span>{phCount} Variabel Dinamis</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {placeholders.slice(0, 5).map((p, idx) => (
                          <span
                            key={idx}
                            className="font-mono text-[9.5px] bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-blue-600 dark:text-blue-400"
                          >
                            {`{{${p}}}`}
                          </span>
                        ))}
                        {phCount > 5 && (
                          <span className="text-zinc-400 text-[9.5px] self-center px-1 font-medium">
                            +{phCount - 5} lagi
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2.5 text-[9.5px] text-zinc-500 font-sans pointer-events-none opacity-80 leading-relaxed">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(
                            (parsed.html || "")
                              .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
                              .slice(0, 320) || "Template siap digunakan..."
                          ),
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-3 mt-3.5 border-t border-zinc-100 dark:border-zinc-800 gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewTemplate(tmpl)}
                      className="h-7 px-2 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-1 cursor-pointer"
                      title="Pratinjau Tampilan Surat"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat</span>
                    </Button>
                    {isDocx && fileUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const buf = await getDocxArrayBuffer({ fileUrl });
                            downloadDocxBlob(new Blob([buf]), tmpl.name || "master-template");
                          } catch (err: any) {
                            toast.error("Gagal mengunduh dokumen: " + err.message);
                          }
                        }}
                        className="h-7 px-2 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-1 cursor-pointer"
                        title="Unduh Master Dokumen Word (.docx)"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span>.docx</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(tmpl)}
                      className="h-7 px-2.5 text-[11px] font-semibold border-zinc-200 dark:border-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg flex items-center gap-1 cursor-pointer shadow-none"
                      title="Ubah / Edit Template"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(tmpl.id, tmpl.name)}
                      className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg flex items-center justify-center cursor-pointer"
                      title="Hapus Template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      {inline ? (
        renderList()
      ) : (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent
            showCloseButton={false}
            className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-screen max-w-none h-screen max-h-none bg-white dark:bg-zinc-900 border-none rounded-none ring-0 shadow-none p-0 gap-0 flex flex-col overflow-hidden z-50"
            style={{ transform: "none", translate: "none" }}
          >
            {/* Top Bar Header */}
            <DialogHeader className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
              <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        Kelola Template Surat Resmi
                      </DialogTitle>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-blue-50/50 text-blue-700 dark:text-blue-300 border-blue-200"
                      >
                        DOCX Engine Active
                      </Badge>
                    </div>
                    <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Unggah template Word master (.docx) berisi placeholder seperti{" "}
                      <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px] font-mono text-blue-600 dark:text-blue-400">
                        {"{{tujuan_surat}}"}
                      </code>
                      . Tata letak, tabel, dan logo tetap 100% utuh sesuai Word asli.
                    </DialogDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    onClick={handleAddNew}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg h-9 px-3.5 flex items-center gap-1.5 shadow-sm cursor-pointer border-none"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Template DOCX</span>
                  </Button>

                  <DialogClose
                    render={
                      <button
                        type="button"
                        className="w-9 h-9 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors border-none cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    }
                  />
                </div>
              </div>
            </DialogHeader>

            {/* Body Konten: Filter & List Template */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50/50 dark:bg-zinc-950/50">
              <div className="max-w-7xl mx-auto">{renderList()}</div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* =====================================================================
          MODAL EDITOR STUDIO: TAMBAH / EDIT TEMPLATE SURAT WORD (.docx)
          ===================================================================== */}
      <Dialog
        open={isEditorOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseEditor();
          else setIsEditorOpen(true);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-screen max-w-none h-screen max-h-none bg-zinc-50 dark:bg-zinc-950 border-none rounded-none ring-0 shadow-none p-0 gap-0 flex flex-col overflow-hidden z-[60]"
          style={{ transform: "none", translate: "none" }}
        >
          {/* Hidden File Input Global */}
          <input
            ref={docxInputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleDocxFileInput}
          />

          {/* 1. STUDIO TOP BAR */}
          <DialogHeader className="px-4 sm:px-6 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
            <div className="flex items-center justify-between gap-4 w-full">
              {/* Brand */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  {editingTemplate ? <Edit3 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {editingTemplate ? "Edit Template Word (.docx)" : "Tambah Template Word (.docx)"}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Studio unggah, inspeksi tag placeholder, dan pratinjau langsung template surat Word (.docx)
                  </DialogDescription>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploadingDocx || isSavingForm}
                  onClick={handleCloseEditor}
                  className="h-9 px-3.5 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  disabled={!canSaveTemplate}
                  onClick={handleSaveForm}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg h-9 px-4 flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isUploadingDocx || isSavingForm ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isUploadingDocx
                      ? "Mengunggah..."
                      : isSavingForm
                      ? "Menyimpan..."
                      : editingTemplate
                      ? "Simpan Perubahan"
                      : "Simpan Template"}
                  </span>
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* 2. TWO-COLUMN WORKSPACE */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
            {/* LEFT PANEL: Konfigurasi, Upload & Inspektor Placeholder */}
            <div className="lg:col-span-4 xl:col-span-3 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 p-4 space-y-4 overflow-y-auto h-full">
              {/* CARD 1: IDENTITAS & BERKAS WORD */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-4 shadow-2xs">
                {/* Input Nama Template */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="docx-template-name"
                      className="text-xs font-bold text-zinc-800 dark:text-zinc-200"
                    >
                      Nama Template <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-zinc-400">Tampil di daftar Buat Surat</span>
                  </div>
                  <Input
                    id="docx-template-name"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Undangan Rapat Kerja / Permohonan Pemateri"
                    className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:bg-white dark:focus:bg-zinc-900"
                  />
                </div>

                {/* Upload / File Card */}
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Berkas Master Word (.docx) <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10px] text-zinc-400">Maks. 10 MB</span>
                  </div>

                  {hasDocxReady ? (
                    /* Compact Uploaded File Card (tetap support drag-and-drop ganti file!) */
                    <div
                      onDragOver={handleStageDragOver}
                      onDragLeave={handleStageDragLeave}
                      onDrop={handleStageDrop}
                      className={`rounded-xl border p-3 transition-all space-y-2.5 ${
                        isDragging
                          ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20"
                          : "border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          {isUploadingDocx ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate"
                            title={uploadedFileName}
                          >
                            {uploadedFileName || "Template-Word.docx"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px]">
                            {uploadedFileSize && (
                              <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                                {uploadedFileSize}
                              </span>
                            )}
                            {isUploadingDocx ? (
                              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                Mengunggah ke penyimpanan privat...
                              </span>
                            ) : formFileUrl ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                                <CloudCheck className="w-3 h-3" />
                                <span>Tersimpan di Cloud</span>
                              </span>
                            ) : (
                              <span className="text-zinc-500 font-medium">Siap disimpan</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1 border-t border-blue-200/50 dark:border-blue-900/50">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingDocx}
                          onClick={() => docxInputRef.current?.click()}
                          className="flex-1 h-7 text-[11px] font-medium bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-none"
                        >
                          <RefreshCw className="w-3 h-3 text-blue-600" />
                          <span>Ganti File .docx</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingDocx}
                          onClick={() => void handleDownloadDocx(false)}
                          className="h-7 px-2.5 text-[11px] font-medium bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer flex items-center gap-1 shadow-none"
                          title="Unduh file Word master asli"
                        >
                          <Download className="w-3 h-3 text-zinc-500" />
                          <span>Master</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Interactive Dropzone (Empty State) */
                    <div className="space-y-2.5">
                      <div
                        onDragOver={handleStageDragOver}
                        onDragLeave={handleStageDragLeave}
                        onDrop={handleStageDrop}
                        onClick={() => docxInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                          isDragging
                            ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40"
                            : "border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-zinc-800/40"
                        }`}
                      >
                        {isUploadingDocx ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-1" />
                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              Memindai dokumen &amp; tag placeholder...
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-0.5">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                              Klik atau seret file .docx ke sini
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              Tata letak, kop surat &amp; tabel Word tetap 100% utuh
                            </span>
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isLoadingSample || isUploadingDocx}
                          onClick={handleLoadOfficialSample}
                          className="h-8 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50/60 hover:bg-blue-100/70 dark:bg-blue-950/30 dark:hover:bg-blue-950/60 border-blue-200 dark:border-blue-900/60 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-none"
                        >
                          {isLoadingSample ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                          <span className="truncate">Pakai Master PMII</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isLoadingSample || isUploadingDocx}
                          onClick={handleDownloadOfficialSample}
                          className="h-8 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-none"
                          title="Unduh file contoh .docx PMII untuk diedit di Microsoft Word"
                        >
                          <Download className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate">Unduh Contoh</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 2: INSPEKTOR VARIABEL & PANDUAN TAG */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
                {/* Segmented Tab Header */}
                <div className="p-2 bg-zinc-50/80 dark:bg-zinc-950/60 border-b border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setInspectorTab("variables")}
                    className={`h-8 px-2.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${
                      inspectorTab === "variables"
                        ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "bg-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Variabel</span>
                    <span
                      className={`text-[10px] px-1.5 py-0 rounded-full font-bold ${
                        formPlaceholders.length > 0
                          ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {formPlaceholders.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorTab("guide")}
                    className={`h-8 px-2.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${
                      inspectorTab === "guide"
                        ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "bg-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Panduan Tag</span>
                  </button>
                </div>

                <div className="p-4">
                  {inspectorTab === "guide" ? (
                    /* TAB PANDUAN TAG (1-Click Copy Cheat Sheet) */
                    <div className="space-y-3.5">
                      <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2 leading-relaxed">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>
                          Klik tag di bawah untuk menyalin, lalu tempelkan langsung di Microsoft
                          Word. Hindari mengubah font/bold di tengah kata tag agar Word tidak
                          memecahnya.
                        </span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                          Diisi Otomatis oleh Sistem
                        </span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {STANDARD_PMII_TAGS.filter((t) => t.group === "core").map((item) => (
                            <button
                              key={item.tag}
                              type="button"
                              onClick={() => handleCopyTag(item.tag)}
                              className="w-full px-2.5 py-2 rounded-lg border border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer bg-white dark:bg-zinc-900"
                            >
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                                  {item.label}
                                </p>
                                <code className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                                  {`{{${item.tag}}}`}
                                </code>
                              </div>
                              {copiedTag === item.tag ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                          Tag Umum / Kegiatan (Isian Tambahan)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {STANDARD_PMII_TAGS.filter((t) => t.group === "custom").map((item) => (
                            <button
                              key={item.tag}
                              type="button"
                              onClick={() => handleCopyTag(item.tag)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 bg-zinc-50 dark:bg-zinc-950 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 text-[10px] font-mono text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                              title={`Salin {{${item.tag}}} (${item.label})`}
                            >
                              <span>{`{{${item.tag}}}`}</span>
                              {copiedTag === item.tag ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-2.5 h-2.5 opacity-60" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : !hasDocxReady ? (
                    /* TAB VARIABEL: Belum ada file */
                    <div className="py-5 px-3 text-center space-y-2">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Menunggu Berkas Word (.docx)
                      </p>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Unggah file `.docx` di atas untuk mendeteksi semua tag{" "}
                        <code className="font-mono text-blue-600 dark:text-blue-400">
                          {"{{variabel}}"}
                        </code>{" "}
                        dan mengujinya secara langsung.
                      </p>
                    </div>
                  ) : formPlaceholders.length === 0 ? (
                    /* TAB VARIABEL: File ada, 0 tag */
                    <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 space-y-2 text-[11px]">
                      <p className="font-bold text-amber-900 dark:text-amber-200">
                        Tidak Ada Tag {"{{...}}"} Terdeteksi
                      </p>
                      <p className="text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                        Dokumen ini tetap bisa disimpan sebagai template statis. Jika ingin isi
                        surat terisi otomatis, tambahkan tag dari{" "}
                        <button
                          type="button"
                          onClick={() => setInspectorTab("guide")}
                          className="font-bold underline cursor-pointer bg-transparent border-none p-0 text-amber-900 dark:text-amber-200"
                        >
                          Panduan Tag
                        </button>{" "}
                        di Microsoft Word lalu unggah ulang.
                      </p>
                    </div>
                  ) : (
                    /* TAB VARIABEL: Tag Terdeteksi + Live Simulasi */
                    <div className="space-y-4">
                      {/* Ringkasan Kelompok Tag */}
                      <div className="space-y-2.5">
                        {coreKeys.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Otomatis Sistem ({coreKeys.length})
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {coreKeys.map((k) => (
                                <button
                                  key={k}
                                  type="button"
                                  onClick={() => handleCopyTag(k)}
                                  className="font-mono text-[10px] bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 px-1.5 py-0.5 rounded-md text-emerald-700 dark:text-emerald-300 font-medium cursor-pointer hover:bg-emerald-100/70 transition-colors"
                                  title="Diisi otomatis dari Informasi Surat — klik untuk salin"
                                >
                                  {`{{${k}}}`}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {customKeys.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Isian Kustom ({customKeys.length})
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {customKeys.map((k) => (
                                <button
                                  key={k}
                                  type="button"
                                  onClick={() => handleCopyTag(k)}
                                  className="font-mono text-[10px] bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 px-1.5 py-0.5 rounded-md text-blue-700 dark:text-blue-300 font-medium cursor-pointer hover:bg-blue-100/70 transition-colors"
                                  title="Muncul sebagai kolom isian di Buat Surat — klik untuk salin"
                                >
                                  {`{{${k}}}`}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Form Simulasi Data Live */}
                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200">
                            Simulasi Pengisian Live
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setFormTestValues(
                                  buildSampleValuesForPlaceholders(formPlaceholders)
                                );
                                setPreviewMode("simulated");
                              }}
                              className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 px-2 py-1 rounded-md cursor-pointer border-none bg-transparent transition-colors"
                            >
                              Isi Contoh
                            </button>
                            {previewMode === "simulated" && (
                              <button
                                type="button"
                                onClick={() => setPreviewMode("original")}
                                className="text-[10px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-1.5 py-1 rounded-md cursor-pointer border-none bg-transparent inline-flex items-center gap-0.5"
                                title="Kembali ke tampilan tag asli"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                <span>Asli</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                          {formPlaceholders.map((k) => {
                            const multiline = isMultilineField(k);
                            return (
                              <div key={k} className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <label
                                    htmlFor={`tmpl-sim-${k}`}
                                    className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate"
                                  >
                                    {humanizePlaceholderKey(k)}
                                  </label>
                                  <code className="text-[9.5px] font-mono text-zinc-400 shrink-0">
                                    {`{{${k}}}`}
                                  </code>
                                </div>
                                {multiline ? (
                                  <textarea
                                    id={`tmpl-sim-${k}`}
                                    rows={2}
                                    value={formTestValues[k] || ""}
                                    onChange={(e) => {
                                      setFormTestValues((prev) => ({
                                        ...prev,
                                        [k]: e.target.value,
                                      }));
                                      if (previewMode !== "simulated") {
                                        setPreviewMode("simulated");
                                      }
                                    }}
                                    placeholder={`Uji nilai ${humanizePlaceholderKey(k)}...`}
                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-blue-500 focus:outline-none text-zinc-900 dark:text-zinc-100 resize-y"
                                  />
                                ) : (
                                  <Input
                                    id={`tmpl-sim-${k}`}
                                    value={formTestValues[k] || ""}
                                    onChange={(e) => {
                                      setFormTestValues((prev) => ({
                                        ...prev,
                                        [k]: e.target.value,
                                      }));
                                      if (previewMode !== "simulated") {
                                        setPreviewMode("simulated");
                                      }
                                    }}
                                    placeholder={`Uji nilai ${humanizePlaceholderKey(k)}...`}
                                    className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:bg-white dark:focus:bg-zinc-900"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: Document Canvas (1:1 Format Asli Word) */}
            <div
              onDragOver={handleStageDragOver}
              onDragLeave={handleStageDragLeave}
              onDrop={handleStageDrop}
              className="lg:col-span-8 xl:col-span-9 bg-[#F9FBFD] dark:bg-[#111318] flex flex-col overflow-hidden h-full relative"
            >
              {/* Full-Stage Drag Overlay */}
              {isDragging && (
                <div className="absolute inset-3 z-30 rounded-2xl border-2 border-dashed border-blue-500 bg-blue-50/90 dark:bg-blue-950/85 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                    Lepaskan File Word (.docx) di Sini
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Dokumen akan ditampilkan 1:1 sesuai format asli tanpa perubahan tata letak
                  </p>
                </div>
              )}

              {isUpdatingPreview && hasDocxReady && (
                <div className="absolute top-3 right-4 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-700 shadow-xs text-[11px] text-blue-600 dark:text-blue-400 font-medium pointer-events-none">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Memuat dokumen...</span>
                </div>
              )}

              {/* Scrollable Document Desk & Paper Canvas */}
              <div
                ref={canvasViewportRef}
                className="flex-1 overflow-auto px-4 sm:px-6 py-6 flex flex-col items-center"
              >
                {!hasDocxReady ? (
                  /* Rich Interactive Empty Stage */
                  <div className="w-full max-w-xl my-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 text-center">
                    <div className="space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                        <FileText className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        Canvas Dokumen Word (Format 1:1 Asli)
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                        Unggah template surat format Microsoft Word (<code>.docx</code>). Kop
                        surat, garis pemisah, margin, font, tabel, footer, dan tanda tangan tampil
                        persis seperti dokumen asli tanpa perubahan format.
                      </p>
                    </div>

                    {/* 3-Step Visual Guide */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/70 dark:border-zinc-800 space-y-1">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          Langkah 1
                        </span>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          Beri Tag di Word
                        </p>
                        <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-snug">
                          Tulis tag seperti <code className="font-mono text-blue-600">{"{{perihal}}"}</code> pada bagian dinamis surat.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/70 dark:border-zinc-800 space-y-1">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          Langkah 2
                        </span>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          Unggah &amp; Simulasi
                        </p>
                        <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-snug">
                          Seret file `.docx` ke layar ini — format tampil utuh seperti di Google Docs.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/70 dark:border-zinc-800 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Langkah 3
                        </span>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          Terbit + QR Otomatis
                        </p>
                        <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-snug">
                          Setiap surat keluar dari template ini otomatis disematkan QR verifikasi.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <Button
                        type="button"
                        onClick={() => docxInputRef.current?.click()}
                        className="h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Pilih File .docx</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isLoadingSample}
                        onClick={handleLoadOfficialSample}
                        className="h-9 px-3.5 text-xs font-medium border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        {isLoadingSample ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>Coba Template Resmi PMII</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Crisp GPU-Scaled Google Docs Paper Sheet Container */
                  <div
                    className="relative shrink-0 mx-auto"
                    style={{
                      width: `${Math.round(pagePxWidth * effectiveScale)}px`,
                      minHeight: `${Math.round(unscaledCanvasHeight * effectiveScale)}px`,
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.round(pagePxWidth)}px`,
                        transform: effectiveScale === 1 ? undefined : `scale(${effectiveScale})`,
                        transformOrigin: "top left",
                      }}
                    >
                      <div
                        ref={editorCanvasRef}
                        className="select-text cursor-text flex flex-col items-center justify-start outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL PREVIEW SURAT */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] bg-white dark:bg-zinc-900 p-6 flex flex-col gap-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 z-[70]">
          <DialogHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {previewTemplate?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  {previewTemplate?.placeholders?.length
                    ? `${previewTemplate.placeholders.length} placeholder terdeteksi`
                    : "Format dokumen Word asli"}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {previewTemplate &&
                  (previewTemplate.fileUrl || parseTemplateContent(previewTemplate.content).fileUrl) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const fUrl =
                          previewTemplate.fileUrl ||
                          parseTemplateContent(previewTemplate.content).fileUrl;
                        if (fUrl) {
                          try {
                            const buf = await getDocxArrayBuffer({ fileUrl: fUrl });
                            downloadDocxBlob(
                              new Blob([buf]),
                              previewTemplate.name || "master-template"
                            );
                          } catch (err: any) {
                            toast.error("Gagal mengunduh dokumen: " + err.message);
                          }
                        }
                      }}
                      className="h-8 text-xs border-zinc-200 dark:border-zinc-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span>Unduh .docx</span>
                    </Button>
                  )}
                <DialogClose
                  render={
                    <button className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 border-none cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  }
                />
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 bg-zinc-100/80 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
            {(() => {
              const previewHtml = previewTemplate
                ? parseTemplateContent(previewTemplate.content).html
                : "";
              const isDocxHtml = previewHtml.includes("docx-wrapper");
              const safeHtml = sanitizeLetterHtml(previewHtml, { preserveDocxLayout: true });
              return isDocxHtml ? (
                <div
                  className="preview-official-letter select-text flex flex-col items-center"
                  dangerouslySetInnerHTML={{ __html: safeHtml }}
                />
              ) : (
                <div
                  className="bg-white text-zinc-900 p-8 rounded-lg shadow-sm font-sans overflow-x-auto"
                  style={{ fontFamily: '"Arial Narrow", Arial, sans-serif', lineHeight: "1.35" }}
                  dangerouslySetInnerHTML={{ __html: safeHtml }}
                />
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI HAPUS TEMPLATE */}
      <Dialog
        open={!!templateToDelete}
        onOpenChange={(open) => !open && !isDeleting && setTemplateToDelete(null)}
      >
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full p-0 overflow-hidden">
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Hapus Template Surat
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Tindakan ini permanen dan tidak dapat dipulihkan
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 sm:p-6 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-2">
            <p>
              Apakah Anda yakin ingin menghapus template{" "}
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                &ldquo;{templateToDelete?.name}&rdquo;
              </span>
              ?
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Template ini akan dihapus dari bank template dan tidak dapat digunakan lagi saat
              membuat surat resmi.
            </p>
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setTemplateToDelete(null)}
              className="h-9 px-4 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={confirmDeleteTemplate}
              className="h-9 px-4 text-xs font-semibold rounded-lg text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TemplateManagerDialog;
