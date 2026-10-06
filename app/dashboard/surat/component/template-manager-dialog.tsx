"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bookmark,
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
  Layers,
  Save,
  AlertCircle,
  Download,
  RefreshCw,
  Sparkles,
  FileCode,
  FileCheck
} from "lucide-react";
import { db, SuratTemplate, generateUUID } from "@/lib/db";
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
  formatBytes
} from "./docx-template-helper";
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

interface TemplateManagerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplatesUpdated?: () => void;
}

export function TemplateManagerDialog({
  isOpen,
  onOpenChange,
  onTemplatesUpdated
}: TemplateManagerDialogProps) {
  const [templates, setTemplates] = useState<SuratTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassification, setSelectedClassification] = useState<string>("ALL");

  // Form Editor Modal State (Create / Edit)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formClassification, setFormClassification] = useState<
    "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi"
  >("Permohonan");
  const [formLocation, setFormLocation] = useState("Purwodadi");
  const [formContent, setFormContent] = useState("");

  // Konsep Pengisi Template DOCX (PizZip + Docxtemplater + docx-preview)
  const [formFileBase64, setFormFileBase64] = useState<string>("");
  const [formFileUrl, setFormFileUrl] = useState<string>("");
  const [uploadedFileSize, setUploadedFileSize] = useState<string>("");
  const [formPlaceholders, setFormPlaceholders] = useState<string[]>([]);
  const [formTestValues, setFormTestValues] = useState<Record<string, string>>({});
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [isUploadingDocx, setIsUploadingDocx] = useState(false);
  const [isUpdatingPreview, setIsUpdatingPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const docxInputRef = useRef<HTMLInputElement>(null);
  const editorCanvasRef = useRef<HTMLDivElement>(null);

  // Preview Modal State
  const [previewTemplate, setPreviewTemplate] = useState<SuratTemplate | null>(null);

  // Delete Confirmation Modal State
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load templates from database
  const loadTemplates = async () => {
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
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  // Render ulang preview dokumen Word saat modal editor dibuka
  useEffect(() => {
    if (isEditorOpen && (formFileBase64 || formFileUrl) && editorCanvasRef.current) {
      const canvasEl = editorCanvasRef.current;
      import("docx-preview").then(async (docx) => {
        try {
          const buffer = await getDocxArrayBuffer({ fileUrl: formFileUrl, fileBase64: formFileBase64 });
          canvasEl.innerHTML = "";
          docx.renderAsync(buffer, canvasEl, undefined, {
            className: "docx",
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            useBase64URL: true,
            renderHeaders: true,
            renderFooters: true,
            renderAltChunks: true
          });
        } catch (e) {
          console.error("Gagal render ulang preview Word:", e);
        }
      });
    }
  }, [isEditorOpen]);

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass =
      selectedClassification === "ALL" || t.classification === selectedClassification;
    return matchesSearch && matchesClass;
  });

  // Open Editor for New Template
  const handleAddNew = () => {
    setEditingTemplateId(null);
    setFormName("");
    setFormSubject("");
    setFormClassification("Permohonan");
    setFormLocation("Purwodadi");
    setFormContent(
      `<p style="margin:0 0 6px 0;"><strong><em>Assalamualaikum Warahmatullahi Wabarakatuh</em></strong></p>
<p style="margin:0 0 6px 0;">Salam silaturrahim teriring doa kami sampaikan semoga Sahabat senantiasa dalam lindungan-Nya...</p>
<p style="margin:0 0 8px 0;">[Tuliskan maksud dan tujuan surat di sini]</p>
<p style="margin:8px 0 6px 0;">Demikian surat ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.</p>
<p style="margin:8px 0 2px 0;"><strong><em>Wallahul Muwaffieq Ilaa Aqwamith Tharieq</em></strong></p>
<p style="margin:0 0 12px 0;"><strong><em>Wassalamualaikum Warahmatullahi Wabarakatuh</em></strong></p>`
    );
    setFormFileBase64("");
    setFormFileUrl("");
    setUploadedFileSize("");
    setFormPlaceholders([]);
    setFormTestValues({});
    setUploadedFileName("");
    setIsEditorOpen(true);
  };

  // Open Editor for Existing Template
  const handleEdit = (tmpl: SuratTemplate) => {
    setEditingTemplateId(tmpl.id);
    setFormName(tmpl.name);
    setFormSubject(tmpl.subject);
    setFormClassification(
      (tmpl.classification as "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi") ||
        "Permohonan"
    );
    setFormLocation(tmpl.senderLocation || "Purwodadi");

    const parsed = parseTemplateContent(tmpl.content);
    setFormContent(parsed.html);
    const b64 = tmpl.fileBase64 || parsed.fileBase64 || "";
    setFormFileBase64(b64);
    const fUrl = tmpl.fileUrl || parsed.fileUrl || "";
    setFormFileUrl(fUrl);
    const fSize = tmpl.fileSize || parsed.fileSize || "";
    setUploadedFileSize(fSize);
    const ph = tmpl.placeholders || parsed.placeholders || [];
    setFormPlaceholders(ph);
    setUploadedFileName(tmpl.fileName || parsed.fileName || (tmpl.name ? `${tmpl.name}.docx` : ""));

    const initialTestVals: Record<string, string> = {};
    ph.forEach((k) => {
      initialTestVals[k] = `[${k}]`;
    });
    setFormTestValues(initialTestVals);

    setIsEditorOpen(true);
  };

  // Delete Template Handlers
  const handleDeleteClick = (id: string, name: string) => {
    setTemplateToDelete({ id, name });
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
      const updated = templates.filter((t) => t.id !== templateToDelete.id);
      await db.saveSuratTemplates(updated);
      setTemplates(updated);
      toast.success(`Template "${templateToDelete.name}" berhasil dihapus.`);
      if (onTemplatesUpdated) onTemplatesUpdated();
      setTemplateToDelete(null);
    } catch (e) {
      console.error("Gagal menghapus template:", e);
      toast.error("Gagal menghapus template dari database.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Proses file Word (.docx) - Konsep Pengisi Template DOCX
  const processDocxFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      toast.error("Format file harus .docx (Microsoft Word)");
      return;
    }

    setIsUploadingDocx(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const b64 = arrayBufferToBase64(arrayBuffer);
      setFormFileBase64(b64);
      setUploadedFileName(file.name);
      setUploadedFileSize(formatBytes(file.size));

      // Unggah ke Supabase Storage secara asinkron
      uploadFileToStorage(file, "surat-templates", file.name).then((res) => {
        if (res?.url) {
          setFormFileUrl(res.url);
        }
      });

      // Ekstraksi placeholder {{nama}}, {{nomor}}, dll. via PizZip + docxtemplater
      const { keys, error: extractErr } = extractDocxPlaceholders(arrayBuffer);
      if (extractErr) {
        toast.warning("Info template: " + extractErr);
      }
      setFormPlaceholders(keys);

      // Siapkan sample nilai uji coba
      const testVals: Record<string, string> = {};
      keys.forEach((k) => {
        testVals[k] = `[Contoh ${k}]`;
      });
      setFormTestValues(testVals);

      // Render tampilan Word persis menggunakan docx-preview
      const canvasEl = editorCanvasRef.current;
      if (canvasEl) {
        canvasEl.innerHTML = "";
        const docx = await import("docx-preview");
        await docx.renderAsync(arrayBuffer, canvasEl, undefined, {
          className: "docx",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderAltChunks: true
        });
        setFormContent(canvasEl.innerHTML);
      }

      // Berikan nama & perihal default dari nama file jika belum diisi
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      if (!formName.trim()) setFormName(formattedName);
      if (!formSubject.trim()) setFormSubject(formattedName);

      toast.success(`File Word "${file.name}" berhasil dimuat! Ditemukan ${keys.length} placeholder.`);
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
      processDocxFile(file);
    }
    e.target.value = "";
  };

  // Uji Coba Pengisian Placeholder (docxtemplater + PizZip + docx-preview)
  const handleUpdateTestPreview = async () => {
    if ((!formFileBase64 && !formFileUrl) || !editorCanvasRef.current) return;
    setIsUpdatingPreview(true);
    try {
      const arrayBuffer = await getDocxArrayBuffer({ fileUrl: formFileUrl, fileBase64: formFileBase64 });
      const { arrayBuffer: filledBuffer, error } = fillDocxTemplate(arrayBuffer, formTestValues);
      if (error) {
        toast.error("Gagal mengisi template: " + error);
        return;
      }
      const canvasEl = editorCanvasRef.current;
      canvasEl.innerHTML = "";
      const docx = await import("docx-preview");
      await docx.renderAsync(filledBuffer, canvasEl, undefined, {
        className: "docx",
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        useBase64URL: true,
        renderHeaders: true,
        renderFooters: true,
        renderAltChunks: true
      });
      setFormContent(canvasEl.innerHTML);
      toast.success("Preview berhasil diperbarui dengan data placeholder!");
    } catch (err: any) {
      toast.error("Gagal perbarui preview: " + err.message);
    } finally {
      setIsUpdatingPreview(false);
    }
  };

  // Unduh Master / Filled .docx
  const handleDownloadDocx = async (useTestValues = false) => {
    if (!formFileBase64 && !formFileUrl) return;
    try {
      const arrayBuffer = await getDocxArrayBuffer({ fileUrl: formFileUrl, fileBase64: formFileBase64 });
      let blob: Blob;
      if (useTestValues && Object.keys(formTestValues).length > 0) {
        const res = fillDocxTemplate(arrayBuffer, formTestValues);
        blob = res.blob;
      } else {
        blob = new Blob([arrayBuffer], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        });
      }
      const fname = (formName.trim() || "Template-PMII").replace(/\s+/g, "_");
      downloadDocxBlob(blob, fname);
      toast.success("Dokumen .docx berhasil diunduh!");
    } catch (e: any) {
      toast.error("Gagal mengunduh file: " + e.message);
    }
  };

  // Save Template to Database
  const handleSaveForm = async () => {
    if (!formName.trim()) {
      alert("Harap masukkan nama template.");
      return;
    }

    const htmlToSave = editorCanvasRef.current?.innerHTML || formContent;
    const serializedContent = serializeTemplateContent(
      htmlToSave,
      formFileBase64,
      formPlaceholders,
      formFileUrl,
      uploadedFileName,
      uploadedFileSize
    );

    try {
      const templateItem: SuratTemplate = {
        id: editingTemplateId || generateUUID(),
        name: formName.trim(),
        subject: formSubject.trim() || formName.trim(),
        classification: formClassification,
        content: serializedContent,
        fileBase64: formFileBase64 || undefined,
        fileUrl: formFileUrl || undefined,
        fileName: uploadedFileName || undefined,
        fileSize: uploadedFileSize || undefined,
        placeholders: formPlaceholders,
        isDocx: !!(formFileBase64 || formFileUrl),
        senderLocation: formLocation || "Purwodadi",
        senderTitle: "Ketua Komisariat",
        commissariat: "Ki Ageng Getas Pendawa",
        created_at: new Date().toISOString()
      };

      let updated: SuratTemplate[] = [];
      if (editingTemplateId) {
        updated = templates.map((t) => (t.id === editingTemplateId ? { ...t, ...templateItem } : t));
        toast.success(`Template "${formName}" berhasil diperbarui!`);
      } else {
        updated = [templateItem, ...templates];
        toast.success(`Template "${formName}" berhasil ditambahkan!`);
      }

      await db.saveSuratTemplates(updated);
      setTemplates(updated);
      setIsEditorOpen(false);
      if (onTemplatesUpdated) onTemplatesUpdated();
    } catch (e) {
      console.error("Gagal menyimpan template:", e);
      toast.error("Gagal menyimpan template ke database.");
    }
  };

  return (
    <>
      {/* MODAL UTAMA: DAFTAR TEMPLATE SURAT RESMI */}
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
                    <Badge variant="outline" className="text-[10px] bg-blue-50/50 text-blue-700 dark:text-blue-300 border-blue-200">
                      DOCX Engine Active
                    </Badge>
                  </div>
                  <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Unggah template Word master (.docx) berisi placeholder seperti <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px] font-mono text-blue-600 dark:text-blue-400">{"{{nama}}"}</code>. Tata letak, tabel, dan logo tetap 100% utuh sesuai Word asli.
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

                <DialogClose render={
                  <button
                    type="button"
                    className="w-9 h-9 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors border-none cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                } />
              </div>
            </div>
          </DialogHeader>

          {/* Body Konten: Filter & List Template */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50/50 dark:bg-zinc-950/50">
            <div className="max-w-7xl mx-auto space-y-4">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama template / perihal..."
                    className="pl-9 h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-zinc-500 font-medium shrink-0">Klasifikasi:</span>
                  <Select
                    value={selectedClassification}
                    onValueChange={(val: any) => setSelectedClassification(val)}
                  >
                    <SelectTrigger className="h-9 text-xs w-full sm:w-44 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
                      <SelectValue placeholder="Pilih Klasifikasi" />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-200 dark:border-zinc-800">
                      <SelectItem value="ALL">Semua Klasifikasi</SelectItem>
                      <SelectItem value="Permohonan">Permohonan</SelectItem>
                      <SelectItem value="Undangan">Undangan</SelectItem>
                      <SelectItem value="Instruksi">Instruksi</SelectItem>
                      <SelectItem value="Keputusan">Keputusan</SelectItem>
                      <SelectItem value="Rekomendasi">Rekomendasi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Grid Template Cards */}
              {isLoading ? (
                <div className="py-24 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                  <p className="text-xs text-zinc-500">Memuat template dari database...</p>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    Belum Ada Template Surat Tersimpan
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                    Unggah file Word (.docx) resmi komisariat Anda yang memiliki tag placeholder seperti <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-[11px] text-blue-600">{"{{nama}}"}</code> untuk kemudahan pembuatan surat.
                  </p>
                  <Button
                    onClick={handleAddNew}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 rounded-lg px-4 gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Template Word Pertama</span>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((tmpl) => {
                    const parsed = parseTemplateContent(tmpl.content);
                    const isDocx = tmpl.isDocx || !!tmpl.fileBase64 || parsed.isDocxTemplate;
                    const phCount = tmpl.placeholders?.length || parsed.placeholders?.length || 0;

                    return (
                      <div
                        key={tmpl.id}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow relative group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1">
                              {tmpl.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {isDocx && (
                                <Badge className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200">
                                  DOCX {phCount > 0 ? `(${phCount} tag)` : ""}
                                </Badge>
                              )}
                              {(tmpl.fileUrl || parsed.fileUrl) && (
                                <Badge className="text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200">
                                  Cloud
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-[10px]">
                                {tmpl.classification || "Umum"}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                              Perihal:
                            </span>
                            <span className="line-clamp-1">{tmpl.subject || "-"}</span>
                          </p>

                          {/* Thumbnail / Tag List */}
                          {phCount > 0 ? (
                            <div className="p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 text-[10px] space-y-1">
                              <span className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> {phCount} Placeholder Terdeteksi:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {(tmpl.placeholders || parsed.placeholders || []).slice(0, 5).map((p, idx) => (
                                  <span key={idx} className="font-mono bg-white dark:bg-zinc-900 px-1 py-0.5 rounded border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                                    {`{{${p}}}`}
                                  </span>
                                ))}
                                {phCount > 5 && (
                                  <span className="text-zinc-400 text-[9px] self-center">
                                    +{phCount - 5} lainnya
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="h-24 overflow-hidden rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2.5 text-[9px] text-zinc-500 font-sans pointer-events-none opacity-80 leading-relaxed">
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: parsed.html?.slice(0, 400) || "Isi template kosong..."
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800">
                          <span className="text-[10px] text-zinc-400">
                            {tmpl.senderLocation || "Purwodadi"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isDocx && (tmpl.fileBase64 || parsed.fileBase64 || tmpl.fileUrl || parsed.fileUrl) && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const buf = await getDocxArrayBuffer({
                                      fileUrl: tmpl.fileUrl || parsed.fileUrl,
                                      fileBase64: tmpl.fileBase64 || parsed.fileBase64
                                    });
                                    downloadDocxBlob(new Blob([buf]), tmpl.name || "master-template");
                                  } catch (err: any) {
                                    toast.error("Gagal mengunduh dokumen: " + err.message);
                                  }
                                }}
                                className="h-7 px-2 text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded flex items-center gap-1"
                                title="Unduh Master Dokumen Word (.docx)"
                              >
                                <Download className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-[10px]">Unduh</span>
                              </Button>
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewTemplate(tmpl)}
                              className="h-7 px-2 text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded flex items-center gap-1"
                              title="Pratinjau Tampilan Surat"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat</span>
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(tmpl)}
                              className="h-7 px-2 text-xs border-zinc-200 dark:border-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded flex items-center gap-1"
                              title="Ubah / Edit Template"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(tmpl.id, tmpl.name)}
                              className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded flex items-center justify-center cursor-pointer"
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
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITOR: TAMBAH / EDIT TEMPLATE DENGAN KONSEP PENGISI TEMPLATE DOCX */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent
          showCloseButton={false}
          className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-screen max-w-none h-screen max-h-none bg-zinc-50 dark:bg-zinc-950 border-none rounded-none ring-0 shadow-none p-0 gap-0 flex flex-col overflow-hidden z-[60]"
          style={{ transform: "none", translate: "none" }}
        >
          {/* Header Editor */}
          <DialogHeader className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
            <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {editingTemplateId ? "Ubah Template Surat DOCX" : "Tambah Template Surat Word (.docx)"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Unggah file Word master berisi placeholder seperti <code className="font-mono text-blue-600 dark:text-blue-400">{"{{nama}}"}</code>. Format tetap 100% utuh tanpa diubah ke HTML buatan.
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditorOpen(false)}
                  className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveForm}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg h-9 px-4 flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Template</span>
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Form & Canvas Workspace */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
            {/* Sidebar Konfigurasi & Placeholder Inspector */}
            <div className="lg:col-span-5 xl:col-span-4 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4 overflow-y-auto h-full">
              
              {/* SECTION 1: UNGGAH TEMPLATE DOCX (Dropzone seperti Pengisi Template DOCX (1).html) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                  <span>1. Unggah Template Word (.docx)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Format Microsoft Word</span>
                </label>

                <input
                  ref={docxInputRef}
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleDocxFileInput}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processDocxFile(file);
                  }}
                  onClick={() => docxInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                    isDragging
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40"
                      : "border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  {isUploadingDocx ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-1" />
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Mengekstrak Dokumen Word & Placeholder...
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-0.5">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {uploadedFileName || "Pilih file .docx atau seret ke sini"}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {formFileBase64
                          ? `File siap (${formPlaceholders.length} placeholder terdeteksi)`
                          : "Klik untuk memilih file dari komputer Anda"}
                      </span>
                    </>
                  )}
                </div>

                <p className="text-[11px] text-zinc-400 leading-tight">
                  💡 <strong>Tips:</strong> Tulis placeholder utuh seperti <code className="text-blue-600 dark:text-blue-400">{"{{nama}}"}</code> atau <code className="text-blue-600 dark:text-blue-400">{"{{nomor}}"}</code> tanpa mengganti format font di tengah kata agar tidak terpecah oleh Word.
                </p>
              </div>

              {/* SECTION 2: IDENTITAS TEMPLATE */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Nama Template <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Permohonan Pemateri MAPABA"
                    className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Perihal / Hal Surat
                    </label>
                    <Input
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      placeholder="Contoh: Permohonan Pemateri"
                      className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Klasifikasi
                    </label>
                    <Select
                      value={formClassification}
                      onValueChange={(val: any) => setFormClassification(val)}
                    >
                      <SelectTrigger className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <SelectValue placeholder="Pilih Klasifikasi" />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-200 dark:border-zinc-800">
                        <SelectItem value="Permohonan">Permohonan</SelectItem>
                        <SelectItem value="Undangan">Undangan</SelectItem>
                        <SelectItem value="Instruksi">Instruksi</SelectItem>
                        <SelectItem value="Keputusan">Keputusan</SelectItem>
                        <SelectItem value="Rekomendasi">Rekomendasi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Kota Pengirim (Tanda Tangan)
                  </label>
                  <Input
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Contoh: Purwodadi"
                    className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                  />
                </div>
              </div>

              {/* SECTION 3: DAFTAR PLACEHOLDER & UJI COBA PENGISIAN */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-blue-600" />
                    <span>2. Placeholder Terdeteksi ({formPlaceholders.length})</span>
                  </label>
                </div>

                {formPlaceholders.length === 0 ? (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 leading-relaxed">
                    Belum ada placeholder <code className="font-mono text-zinc-700 dark:text-zinc-300">{"{{...}}"}</code> di template ini. Anda dapat mengunggah file Word yang sudah diberi tag seperti <code className="font-mono text-blue-600">{"{{nama}}"}</code> atau <code className="font-mono text-blue-600">{"{{nomor}}"}</code>.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1 p-2 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/40 max-h-28 overflow-y-auto">
                      {formPlaceholders.map((k) => (
                        <span
                          key={k}
                          className="font-mono text-[10px] bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300 font-medium"
                        >
                          {`{{${k}}}`}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                        <span>Uji Coba Pengisian Data:</span>
                      </div>
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {formPlaceholders.map((k) => (
                          <div key={k} className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-zinc-500 w-24 shrink-0 truncate text-right">
                              {k}:
                            </span>
                            <Input
                              value={formTestValues[k] || ""}
                              onChange={(e) =>
                                setFormTestValues((prev) => ({
                                  ...prev,
                                  [k]: e.target.value
                                }))
                              }
                              placeholder={`Isi ${k}...`}
                              className="h-7 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isUpdatingPreview}
                          onClick={handleUpdateTestPreview}
                          className="flex-1 h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-1 cursor-pointer border-none"
                        >
                          {isUpdatingPreview ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          <span>Perbarui Preview</span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadDocx(true)}
                          className="h-8 text-xs font-semibold border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center gap-1 cursor-pointer"
                          title="Unduh hasil pengisian dalam format Word (.docx)"
                        >
                          <Download className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                          <span>Unduh .docx</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Kanvas Dokumen Template (Render Asli docx-preview) */}
            <div className="lg:col-span-7 xl:col-span-8 p-4 md:p-6 bg-zinc-100 dark:bg-zinc-950 overflow-y-auto h-full flex flex-col items-center">
              <div className="w-full max-w-3xl flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
                  <div className="flex items-center gap-2">
                    <span>Pratinjau Dokumen Asli Word (100% Persis)</span>
                    {formFileBase64 && (
                      <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        Format Asli Utuh
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {formFileBase64 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadDocx(false)}
                        className="h-7 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 p-0 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh Master .docx</span>
                      </Button>
                    )}
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Siap Disimpan
                    </span>
                  </div>
                </div>

                <div
                  ref={editorCanvasRef}
                  contentEditable={!formFileBase64}
                  suppressContentEditableWarning
                  onInput={() => {
                    if (editorCanvasRef.current) {
                      setFormContent(editorCanvasRef.current.innerHTML);
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: formContent }}
                  className={
                    formFileBase64
                      ? "w-full min-h-[750px] flex flex-col items-center justify-start p-2 sm:p-4 overflow-auto outline-none"
                      : "w-full min-h-[750px] bg-white text-zinc-900 p-8 sm:p-12 rounded-xl border border-zinc-300 shadow-xl flex flex-col outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-text overflow-auto"
                  }
                  style={formFileBase64 ? undefined : { fontFamily: '"Arial Narrow", Arial, sans-serif', lineHeight: "1.35" }}
                />
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
                  Perihal: {previewTemplate?.subject} | Klasifikasi: {previewTemplate?.classification}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {previewTemplate && (previewTemplate.fileBase64 || parseTemplateContent(previewTemplate.content).fileBase64) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const b64 = previewTemplate.fileBase64 || parseTemplateContent(previewTemplate.content).fileBase64;
                      if (b64) {
                        const buf = base64ToArrayBuffer(b64);
                        downloadDocxBlob(new Blob([buf]), previewTemplate.name);
                      }
                    }}
                    className="h-8 text-xs border-zinc-200 dark:border-zinc-800 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Unduh .docx</span>
                  </Button>
                )}
                <DialogClose render={
                  <button className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 border-none cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                } />
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div
              className="bg-white text-zinc-900 p-8 rounded-lg shadow-sm font-sans"
              style={{ fontFamily: '"Arial Narrow", Arial, sans-serif', lineHeight: "1.35" }}
              dangerouslySetInnerHTML={{
                __html: previewTemplate ? parseTemplateContent(previewTemplate.content).html : ""
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI HAPUS TEMPLATE */}
      <Dialog open={!!templateToDelete} onOpenChange={(open) => !open && !isDeleting && setTemplateToDelete(null)}>
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
              Template ini akan dihapus dari bank template dan tidak dapat digunakan lagi saat membuat surat resmi.
            </p>
          </div>

          <DialogFooter className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-end gap-2">
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
