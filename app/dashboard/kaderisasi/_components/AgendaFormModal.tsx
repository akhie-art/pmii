"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Trash2,
  ChevronUp,
  ChevronDown,
  Pencil,
  Check,
  RotateCcw,
  Award,
  UploadCloud,
  Eye,
  EyeOff,
  Bold,
  ZoomIn,
  ZoomOut,
  Hash,
  User,
  CreditCard,
  Calendar,
  GraduationCap,
  Building,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileText,
  FileImage,
  Move
} from "lucide-react";
import jsPDF from "jspdf";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Kaderisasi,
  FormField,
  KaderisasiMateri,
  CertificateLayoutConfig,
  CertificateFieldConfig,
  DEFAULT_CERT_CONFIG
} from "@/lib/db";
import { generateUUID } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CERT_FIELDS, DEFAULT_FORM_FIELDS, FONT_OPTIONS } from "./types";

interface AgendaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  agenda?: Kaderisasi | null;
  onSubmit: (data: {
    nama: string;
    tipe: "FORMAL" | "INFORMAL" | "NON_FORMAL";
    materi: KaderisasiMateri[];
    formFields: FormField[];
    certificateTemplate?: string;
    certificateConfig?: CertificateLayoutConfig;
  }) => void;
}

export function AgendaFormModal({
  isOpen,
  onClose,
  agenda,
  onSubmit
}: AgendaFormModalProps) {
  const isEdit = Boolean(agenda);

  const [activeTab, setActiveTab] = useState<"info" | "materi" | "form" | "sertifikat">("info");
  const [nama, setNama] = useState("");
  const [tipe, setTipe] = useState<"FORMAL" | "INFORMAL" | "NON_FORMAL">("FORMAL");

  // Materi
  const [materiList, setMateriList] = useState<KaderisasiMateri[]>([]);
  const [newMateriJudul, setNewMateriJudul] = useState("");

  // Form Fields
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<"file" | "text" | "textarea" | "select">("file");
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  const [newFieldOptions, setNewFieldOptions] = useState("");

  // Edit Single Form Field State
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editFieldLabel, setEditFieldLabel] = useState("");
  const [editFieldType, setEditFieldType] = useState<"file" | "text" | "textarea" | "select">("text");
  const [editFieldRequired, setEditFieldRequired] = useState(true);
  const [editFieldOptions, setEditFieldOptions] = useState("");

  // Sertifikat State
  const [certificateTemplate, setCertificateTemplate] = useState<string | undefined>(undefined);
  const [certConfig, setCertConfig] = useState<CertificateLayoutConfig>(DEFAULT_CERT_CONFIG);
  const [activeCertField, setActiveCertField] = useState<
    keyof Omit<CertificateLayoutConfig, "fontFamily" | "numberSegments">
  >("nama");
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Canvas Drag Ref
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragInfoRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    canvasRect: DOMRect | null;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    initX: 50,
    initY: 50,
    canvasRect: null
  });

  useEffect(() => {
    if (!isOpen) return;

    if (agenda) {
      setNama(agenda.nama || "");
      setTipe(agenda.tipe || "FORMAL");
      setMateriList(agenda.materi && agenda.materi.length > 0 ? [...agenda.materi] : []);
      setFormFields(
        agenda.formFields && agenda.formFields.length > 0
          ? [...agenda.formFields]
          : [...DEFAULT_FORM_FIELDS]
      );
      setCertificateTemplate(agenda.certificateTemplate);
      setCertConfig(agenda.certificateConfig || DEFAULT_CERT_CONFIG);
    } else {
      setNama("");
      setTipe("FORMAL");
      setMateriList([]);
      setFormFields([...DEFAULT_FORM_FIELDS]);
      setCertificateTemplate(undefined);
      setCertConfig(DEFAULT_CERT_CONFIG);
    }

    setActiveTab("info");
    setNewMateriJudul("");
    setNewFieldLabel("");
    setNewFieldType("file");
    setNewFieldRequired(true);
    setNewFieldOptions("");
    setEditingFieldId(null);
    setEditFieldLabel("");
    setEditFieldOptions("");
    setActiveCertField("nama");
    setZoomLevel(100);
  }, [isOpen, agenda]);

  // Window drag listeners for Canvas (mouse & touch)
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!dragInfoRef.current.isDragging || !dragInfoRef.current.canvasRect) return;

      const { startX, startY, initX, initY, canvasRect } = dragInfoRef.current;
      const dxPx = clientX - startX;
      const dyPx = clientY - startY;

      const dxPercent = (dxPx / canvasRect.width) * 100;
      const dyPercent = (dyPx / canvasRect.height) * 100;

      const newX = Math.round(Math.max(0, Math.min(100, initX + dxPercent)) * 10) / 10;
      const newY = Math.round(Math.max(0, Math.min(100, initY + dyPercent)) * 10) / 10;

      setCertConfig((prev) => {
        const cur = (prev as any)[activeCertField] || {
          x: 50,
          y: 50,
          fontSize: 13,
          bold: false,
          align: "left",
          enabled: true
        };
        return {
          ...prev,
          [activeCertField]: {
            ...cur,
            x: newX,
            y: newY
          }
        };
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      if (dragInfoRef.current.isDragging) {
        dragInfoRef.current.isDragging = false;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [activeCertField]);

  if (!isOpen) return null;

  // Materi Handlers
  const handleAddMateri = () => {
    if (!newMateriJudul.trim()) return;
    setMateriList([
      ...materiList,
      { id: generateUUID(), judul: newMateriJudul.trim() }
    ]);
    setNewMateriJudul("");
  };

  const handleRemoveMateri = (id: string) => {
    setMateriList(materiList.filter((m) => m.id !== id));
  };

  // Formulir Handlers
  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    let parsedOptions: string[] | undefined = undefined;
    if (newFieldType === "select" && newFieldOptions.trim()) {
      parsedOptions = newFieldOptions
        .split(",")
        .map((opt) => opt.trim())
        .filter(Boolean);
    }

    const field: FormField = {
      id: generateUUID(),
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      options: parsedOptions
    };

    setFormFields([...formFields, field]);
    setNewFieldLabel("");
    setNewFieldRequired(true);
    setNewFieldOptions("");
  };

  const handleRemoveField = (id: string) => {
    setFormFields(formFields.filter((f) => f.id !== id));
    if (editingFieldId === id) {
      setEditingFieldId(null);
    }
  };

  const handleStartEditField = (field: FormField) => {
    setEditingFieldId(field.id);
    setEditFieldLabel(field.label);
    setEditFieldType(field.type);
    setEditFieldRequired(field.required);
    setEditFieldOptions(field.options && field.options.length > 0 ? field.options.join(", ") : "");
  };

  const handleCancelEditField = () => {
    setEditingFieldId(null);
    setEditFieldLabel("");
    setEditFieldOptions("");
  };

  const handleSaveEditField = () => {
    if (!editingFieldId || !editFieldLabel.trim()) return;

    let parsedOptions: string[] | undefined = undefined;
    if (editFieldType === "select" && editFieldOptions.trim()) {
      parsedOptions = editFieldOptions
        .split(",")
        .map((opt) => opt.trim())
        .filter(Boolean);
    }

    setFormFields(
      formFields.map((f) =>
        f.id === editingFieldId
          ? {
              ...f,
              label: editFieldLabel.trim(),
              type: editFieldType,
              required: editFieldRequired,
              options: parsedOptions
            }
          : f
      )
    );

    setEditingFieldId(null);
    setEditFieldLabel("");
    setEditFieldOptions("");
  };

  const handleResetToDefaultFields = () => {
    setFormFields([...DEFAULT_FORM_FIELDS]);
    setEditingFieldId(null);
  };

  const handleMoveModalField = (index: number, direction: "up" | "down") => {
    const fields = [...formFields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const temp = fields[index];
    fields[index] = fields[targetIndex];
    fields[targetIndex] = temp;

    setFormFields(fields);
  };

  // Sertifikat Handlers
  const handleStartDrag = (
    clientX: number,
    clientY: number,
    fieldKey: keyof Omit<CertificateLayoutConfig, "fontFamily" | "numberSegments">
  ) => {
    setActiveCertField(fieldKey);
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const curConf = (certConfig as any)[fieldKey] || { x: 50, y: 50 };

    dragInfoRef.current = {
      isDragging: true,
      startX: clientX,
      startY: clientY,
      initX: curConf.x ?? 50,
      initY: curConf.y ?? 50,
      canvasRect: rect
    };
  };

  const updateCurrentField = (updates: Partial<CertificateFieldConfig>) => {
    setCertConfig((prev) => {
      const cur = (prev as any)[activeCertField] || {
        x: 50,
        y: 50,
        fontSize: 13,
        bold: false,
        align: "left",
        enabled: true
      };
      return {
        ...prev,
        [activeCertField]: {
          ...cur,
          ...updates
        }
      };
    });
  };

  const handleUploadCertificateTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Format file harus berupa gambar (JPG atau PNG).");
      return;
    }

    setIsUploadingTemplate(true);
    let finalUrl = "";

    try {
      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split(".").pop();
        const filePath = `cert-templates/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("materials").upload(filePath, file);

        if (!uploadError) {
          const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
          finalUrl = data.publicUrl;
        }
      }

      if (!finalUrl) {
        finalUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setCertificateTemplate(finalUrl);
    } catch (err) {
      console.error("Upload template error:", err);
      alert("Gagal mengunggah template piagam.");
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  const handleSetDefaultTemplate = () => {
    setCertificateTemplate("/templates/template-piagam-mapaba.jpg");
  };

  const handleRemoveTemplate = () => {
    setCertificateTemplate(undefined);
  };

  const handleResetCertConfig = () => {
    setCertConfig(DEFAULT_CERT_CONFIG);
  };

  const handlePreviewPdf = () => {
    if (!certificateTemplate) return;

    setIsGeneratingPdf(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const orientation = img.width > img.height ? "l" : "p";
        const isF4 = (certConfig.paperSize || "F4") === "F4";
        const standardWidth = isF4 ? 215 : 210;
        const standardHeight = isF4 ? 330 : 297;
        const pdfWidth = orientation === "l" ? standardHeight : standardWidth;
        const pdfHeight = orientation === "l" ? standardWidth : standardHeight;

        const pdf = new jsPDF({
          orientation,
          unit: "mm",
          format: [pdfWidth, pdfHeight],
          compress: true
        });

        pdf.addImage(img, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

        const baseFont = certConfig.fontFamily?.toLowerCase().includes("times")
          ? "times"
          : certConfig.fontFamily?.toLowerCase().includes("courier")
          ? "courier"
          : "helvetica";

        CERT_FIELDS.forEach((f) => {
          const conf = (certConfig as any)[f.key] as CertificateFieldConfig | undefined;
          if (conf && conf.enabled === false) return;

          const posX = ((conf?.x ?? 50) / 100) * pdfWidth;
          const posY = ((conf?.y ?? 50) / 100) * pdfHeight;
          const ptSize = Math.max(8, conf?.fontSize ?? 13);
          const isBold = conf?.bold ?? false;
          const align = conf?.align || "left";

          const textSample =
            f.key === "nomor" && certConfig.numberSegments
              ? certConfig.numberSegments.join(".")
              : f.sample;

          pdf.setFont(baseFont, isBold ? "bold" : "normal");
          pdf.setFontSize(ptSize);
          pdf.setTextColor(15, 23, 42);
          pdf.text(textSample, posX, posY, { align, baseline: "top" });
        });

        const blobUrl = pdf.output("bloburl");
        window.open(blobUrl, "_blank");
      } catch (err) {
        console.error("Gagal membuat preview PDF:", err);
      } finally {
        setIsGeneratingPdf(false);
      }
    };

    img.onerror = () => {
      setIsGeneratingPdf(false);
      alert("Gagal memuat template gambar untuk preview.");
    };

    img.src = certificateTemplate;
  };

  const getFieldIcon = (key: string) => {
    switch (key) {
      case "nomor":
        return Hash;
      case "nama":
        return User;
      case "nik":
        return CreditCard;
      case "ttl":
        return Calendar;
      case "jurusan":
        return GraduationCap;
      case "kampus":
        return Building;
      default:
        return Type;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setActiveTab("info");
      return;
    }

    onSubmit({
      nama: nama.trim(),
      tipe,
      materi: materiList,
      formFields,
      certificateTemplate,
      certificateConfig: certConfig
    });
  };

  const curField = (certConfig as any)[activeCertField] || {
    x: 50,
    y: 50,
    fontSize: 13,
    bold: false,
    align: "left",
    enabled: true
  };
  const isCurFieldEnabled = curField.enabled !== false;
  const curAlign = curField.align || "left";

  return (
    <div
      className={`fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn ${
        activeTab === "sertifikat" ? "p-0" : "p-2 sm:p-4"
      }`}
    >
      <Card
        className={`w-full flex flex-col text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 transition-all duration-200 ${
          activeTab === "sertifikat"
            ? "!w-screen !h-screen !max-w-none !max-h-none !rounded-none !border-none !shadow-none !m-0"
            : "max-w-xl max-h-[92vh] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative"
        }`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                {isEdit ? "Edit Agenda Kaderisasi" : "Tambah Agenda Baru"}
              </h3>
              {activeTab === "sertifikat" && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  Layar Penuh
                </span>
              )}
              {certificateTemplate && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sertifikat Siap
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4 gap-4 text-xs font-medium overflow-x-auto [scrollbar-width:none] shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`py-2.5 cursor-pointer border-b-2 -mb-px transition-colors whitespace-nowrap ${
                activeTab === "info"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Informasi
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("materi")}
              className={`py-2.5 cursor-pointer border-b-2 -mb-px transition-colors whitespace-nowrap ${
                activeTab === "materi"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Materi ({materiList.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("form")}
              className={`py-2.5 cursor-pointer border-b-2 -mb-px transition-colors whitespace-nowrap ${
                activeTab === "form"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Formulir ({formFields.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sertifikat")}
              className={`py-2.5 cursor-pointer border-b-2 -mb-px transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "sertifikat"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Sertifikat</span>
              {certificateTemplate && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>
          </div>

          {/* Body */}
          <div
            className={`p-4 overflow-y-auto flex-1 text-left ${
              activeTab === "sertifikat"
                ? "min-h-0 flex flex-col space-y-3 sm:space-y-4"
                : "space-y-3.5"
            }`}
          >
            {/* TAB 1: INFORMASI */}
            {activeTab === "info" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Nama Agenda *
                  </label>
                  <Input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Misal: Masa Penerimaan Anggota Baru (MAPABA)"
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Tipe Kaderisasi *
                  </label>
                  <select
                    value={tipe}
                    onChange={(e) => setTipe(e.target.value as any)}
                    className="w-full h-8.5 px-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600"
                  >
                    <option value="FORMAL">FORMAL (MAPABA, PKD, PKL)</option>
                    <option value="INFORMAL">INFORMAL (Kajian, Diskusi, Halaqah)</option>
                    <option value="NON_FORMAL">NON FORMAL (Pelatihan, Workshop)</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 2: MATERI */}
            {activeTab === "materi" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newMateriJudul}
                    onChange={(e) => setNewMateriJudul(e.target.value)}
                    placeholder="Nama / Judul materi..."
                    className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddMateri();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddMateri}
                    disabled={!newMateriJudul.trim()}
                    className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg border-none cursor-pointer flex-shrink-0"
                  >
                    Tambah
                  </Button>
                </div>

                <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                  {materiList.length === 0 ? (
                    <div className="py-6 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                      Belum ada materi pembelajaran.
                    </div>
                  ) : (
                    materiList.map((m, idx) => (
                      <div
                        key={m.id}
                        className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 flex items-center justify-between text-xs"
                      >
                        <span className="text-zinc-800 dark:text-zinc-200 truncate">
                          {idx + 1}. {m.judul}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMateri(m.id)}
                          className="text-zinc-400 hover:text-rose-600 cursor-pointer p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: FORMULIR */}
            {activeTab === "form" && (
              <div className="space-y-3">
                {/* Tambah Kolom Baru Card */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                  <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Tambah Kolom Syarat Pendaftaran
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      type="text"
                      placeholder="Label Kolom (contoh: Scan Surat Rekomendasi)"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg"
                    />

                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as any)}
                      className="h-8 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="file">Unggah Berkas (PDF / Gambar)</option>
                      <option value="text">Teks Pendek</option>
                      <option value="textarea">Teks Panjang / Esai</option>
                      <option value="select">Dropdown</option>
                    </select>
                  </div>

                  {newFieldType === "select" && (
                    <Input
                      type="text"
                      placeholder="Opsi (pisahkan dengan koma, misal: S, M, L, XL)"
                      value={newFieldOptions}
                      onChange={(e) => setNewFieldOptions(e.target.value)}
                      className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg"
                    />
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="rounded text-blue-600 h-3.5 w-3.5"
                      />
                      <span>Wajib diisi</span>
                    </label>

                    <Button
                      type="button"
                      onClick={handleAddField}
                      disabled={!newFieldLabel.trim()}
                      className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg border-none cursor-pointer"
                    >
                      Tambah Kolom
                    </Button>
                  </div>
                </div>

                {/* Toolbar Header List */}
                <div className="flex items-center justify-between px-0.5 pt-1">
                  <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Daftar Kolom ({formFields.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleResetToDefaultFields}
                    className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                    title="Kembalikan daftar kolom ke standar PMII"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Bawaan</span>
                  </button>
                </div>

                {/* Daftar Kolom with Inline Edit */}
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-0.5">
                  {formFields.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                      Belum ada kolom persyaratan formulir.
                    </div>
                  ) : (
                    formFields.map((field, idx) => {
                      const isEditingThis = editingFieldId === field.id;

                      if (isEditingThis) {
                        return (
                          <div
                            key={field.id}
                            className="p-3 rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/40 space-y-2.5 shadow-2xs"
                          >
                            <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-200">
                              <span className="flex items-center gap-1.5">
                                <Pencil className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Edit Kolom #{idx + 1}</span>
                              </span>
                              <button
                                type="button"
                                onClick={handleCancelEditField}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                                title="Batal edit"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase">
                                  Label Kolom *
                                </label>
                                <Input
                                  type="text"
                                  value={editFieldLabel}
                                  onChange={(e) => setEditFieldLabel(e.target.value)}
                                  placeholder="Nama kolom..."
                                  className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase">
                                  Tipe Input *
                                </label>
                                <select
                                  value={editFieldType}
                                  onChange={(e) => setEditFieldType(e.target.value as any)}
                                  className="w-full h-8 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600"
                                >
                                  <option value="file">Unggah Berkas (PDF / Gambar)</option>
                                  <option value="text">Teks Pendek</option>
                                  <option value="textarea">Teks Panjang / Esai</option>
                                  <option value="select">Dropdown</option>
                                </select>
                              </div>
                            </div>

                            {editFieldType === "select" && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase">
                                  Pilihan Opsi (Pisahkan Koma)
                                </label>
                                <Input
                                  type="text"
                                  value={editFieldOptions}
                                  onChange={(e) => setEditFieldOptions(e.target.value)}
                                  placeholder="Contoh: Laki-laki, Perempuan"
                                  className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                                />
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1">
                              <label className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editFieldRequired}
                                  onChange={(e) => setEditFieldRequired(e.target.checked)}
                                  className="rounded text-blue-600 h-3.5 w-3.5"
                                />
                                <span>Wajib diisi</span>
                              </label>

                              <div className="flex items-center gap-1.5">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEditField}
                                  className="h-7 px-2.5 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg cursor-pointer"
                                >
                                  Batal
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={!editFieldLabel.trim()}
                                  onClick={handleSaveEditField}
                                  className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 cursor-pointer border-none shadow-2xs"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Simpan</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      const typeBadgeLabel =
                        field.type === "file"
                          ? "Berkas"
                          : field.type === "textarea"
                          ? "Esai"
                          : field.type === "select"
                          ? "Dropdown"
                          : "Teks";

                      return (
                        <div
                          key={field.id}
                          className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-900/40">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="font-medium text-zinc-900 dark:text-white truncate flex items-center gap-1">
                                <span className="truncate">{field.label}</span>
                                {field.required && (
                                  <span className="text-rose-500 font-bold shrink-0">*</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                                <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                                  {typeBadgeLabel}
                                </span>
                                {field.options && field.options.length > 0 && (
                                  <span className="truncate max-w-[160px] text-zinc-400">
                                    ({field.options.join(", ")})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveModalField(idx, "up")}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-25 disabled:cursor-not-allowed p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                              title="Pindahkan ke atas"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={idx === formFields.length - 1}
                              onClick={() => handleMoveModalField(idx, "down")}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-25 disabled:cursor-not-allowed p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                              title="Pindahkan ke bawah"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartEditField(field)}
                              className="text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors"
                              title="Edit kolom inputan ini"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveField(field.id)}
                              className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                              title="Hapus kolom"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: SERTIFIKAT */}
            {activeTab === "sertifikat" && (
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                {/* Header Actions for Template */}
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-900/40">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <span>Desain & Titik Posisi Piagam</span>
                        {certificateTemplate ? (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                            Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                            Belum Diatur
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {certificateTemplate
                          ? "Geser posisi teks langsung di atas piagam untuk menyesuaikan koordinat."
                          : "Pilih template bawaan PMII atau unggah template gambar piagam baru."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleUploadCertificateTemplate}
                        disabled={isUploadingTemplate}
                        className="hidden"
                      />
                      <span className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-2xs">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{isUploadingTemplate ? "Mengunggah..." : "Unggah Gambar"}</span>
                      </span>
                    </label>

                    {!certificateTemplate && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSetDefaultTemplate}
                        className="h-8 px-2.5 text-xs rounded-lg cursor-pointer"
                      >
                        Terapkan Bawaan PMII
                      </Button>
                    )}

                    {certificateTemplate && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isGeneratingPdf}
                          onClick={handlePreviewPdf}
                          className="h-8 px-2.5 text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/40 rounded-lg cursor-pointer flex items-center gap-1"
                          title="Buka hasil cetak PDF di tab baru"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isGeneratingPdf ? "Menyiapkan..." : "Uji Cetak PDF"}</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleResetCertConfig}
                          className="h-8 px-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                          title="Kembalikan koordinat teks ke standar"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          <span>Reset</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveTemplate}
                          className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                          title="Hapus template piagam"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {certificateTemplate ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 min-h-0">
                    {/* Visual Canvas Stage (7 cols on lg, 8 cols on xl) */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-full min-h-[420px]">
                      {/* Zoom and Paper Size Toolbar */}
                      <div className="p-2 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 flex items-center justify-between gap-2 text-xs shrink-0">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                            className="h-6 w-6 rounded flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                            title="Perkecil"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-[11px] px-1 text-zinc-700 dark:text-zinc-300">
                            {zoomLevel}%
                          </span>
                          <button
                            type="button"
                            onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                            className="h-6 w-6 rounded flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                            title="Perbesar"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setCertConfig((prev) => ({ ...prev, paperSize: "F4" }))}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                              (certConfig.paperSize || "F4") === "F4"
                                ? "bg-blue-600 text-white"
                                : "text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            F4 (Folio PMII)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCertConfig((prev) => ({ ...prev, paperSize: "A4" }))}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                              certConfig.paperSize === "A4"
                                ? "bg-blue-600 text-white"
                                : "text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            A4
                          </button>
                        </div>
                      </div>

                      {/* Interactive Canvas */}
                      <div className="p-4 sm:p-6 overflow-auto flex items-center justify-center flex-1 min-h-0">
                        <div
                          ref={canvasRef}
                          style={{
                            transform: `scale(${zoomLevel / 100})`,
                            transformOrigin: "center center",
                            fontFamily: certConfig.fontFamily || '"Arial Narrow", Arial, sans-serif'
                          }}
                          className="relative max-w-full shadow-lg border border-zinc-300 dark:border-zinc-700 select-none bg-white rounded transition-transform duration-100"
                        >
                          <img
                            src={certificateTemplate}
                            alt="Template Sertifikat"
                            className="w-full h-auto block select-none pointer-events-none rounded"
                          />

                          {/* Text Markers Layer */}
                          <div className="absolute inset-0 select-none text-slate-900 pointer-events-auto">
                            {CERT_FIELDS.map((f) => {
                              const conf = (certConfig as any)[f.key] || {
                                x: 50,
                                y: 50,
                                fontSize: 13,
                                bold: false,
                                align: "left",
                                enabled: true
                              };
                              const isActive = activeCertField === f.key;
                              const isEnabled = conf.enabled !== false;
                              const align = conf.align || "left";

                              return (
                                <div
                                  key={f.key}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    handleStartDrag(e.clientX, e.clientY, f.key);
                                  }}
                                  onTouchStart={(e) => {
                                    if (e.touches.length > 0) {
                                      handleStartDrag(
                                        e.touches[0].clientX,
                                        e.touches[0].clientY,
                                        f.key
                                      );
                                    }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveCertField(f.key);
                                  }}
                                  style={{
                                    top: `${conf.y}%`,
                                    left: `${conf.x}%`,
                                    transform:
                                      align === "center"
                                        ? "translateX(-50%)"
                                        : align === "right"
                                        ? "translateX(-100%)"
                                        : "none",
                                    textAlign: align,
                                    fontSize: `${Math.max(8, (conf.fontSize || 12) * 0.9)}px`,
                                    lineHeight: 1
                                  }}
                                  className={`absolute cursor-grab active:cursor-grabbing px-1 py-0.5 select-none transition-all ${
                                    !isEnabled
                                      ? "opacity-35 line-through border border-dashed border-zinc-400 bg-zinc-200/50"
                                      : isActive
                                      ? "ring-2 ring-blue-600 bg-blue-500/15 text-slate-950 font-bold z-30 rounded-[2px]"
                                      : "hover:ring-1 hover:ring-blue-400 hover:bg-blue-50/40 text-slate-900 z-10 rounded-[2px]"
                                  } ${conf.bold ? "font-bold" : "font-normal"} whitespace-nowrap`}
                                  title={`${f.label} (Klik & tarik untuk menggeser)`}
                                >
                                  {isActive && (
                                    <div className="absolute -top-4.5 left-0 bg-blue-600 text-white text-[8.5px] font-mono px-1 py-0.2 rounded shadow pointer-events-none whitespace-nowrap z-40">
                                      {f.label} • X:{conf.x}% Y:{conf.y}%
                                    </div>
                                  )}

                                  {f.key === "nomor" && certConfig.numberSegments
                                    ? certConfig.numberSegments.join(".")
                                    : f.sample}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-[10px] text-zinc-500 flex items-center justify-center gap-1.5 shrink-0">
                        <Move className="w-3 h-3 text-blue-500" />
                        <span>Tarik teks langsung di atas kanvas atau ubah koordinat di panel samping.</span>
                      </div>
                    </div>

                    {/* Inspector Panel (5 cols on lg, 4 cols on xl) */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-3 overflow-y-auto pr-1 h-full">
                      {/* Font Family Selector */}
                      <div className="space-y-1">
                        <label className="text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase">
                          Jenis Huruf (Font)
                        </label>
                        <select
                          value={certConfig.fontFamily || '"Arial Narrow", Arial, sans-serif'}
                          onChange={(e) =>
                            setCertConfig((prev) => ({ ...prev, fontFamily: e.target.value }))
                          }
                          className="w-full text-xs h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 cursor-pointer"
                        >
                          {FONT_OPTIONS.map((font) => (
                            <option key={font.value} value={font.value}>
                              {font.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Fields Layer Selector */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase">
                          <span>Bidang Teks Piagam</span>
                          <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                            {CERT_FIELDS.filter((f) => (certConfig as any)[f.key]?.enabled !== false).length} / {CERT_FIELDS.length} Aktif
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          {CERT_FIELDS.map((f) => {
                            const conf = (certConfig as any)[f.key] || { x: 50, y: 50, enabled: true };
                            const isActive = activeCertField === f.key;
                            const fEnabled = conf.enabled !== false;
                            const IconComp = getFieldIcon(f.key);

                            return (
                              <div
                                key={f.key}
                                onClick={() => setActiveCertField(f.key)}
                                className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between gap-1 ${
                                  isActive
                                    ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 shadow-2xs"
                                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                                } ${!fEnabled ? "opacity-45" : ""}`}
                              >
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  <div
                                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                                      isActive
                                        ? "bg-blue-600 text-white"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                    }`}
                                  >
                                    <IconComp className="w-3 h-3" />
                                  </div>
                                  <div className="overflow-hidden">
                                    <div className="text-[10.5px] font-semibold truncate text-zinc-900 dark:text-zinc-100">
                                      {f.label}
                                    </div>
                                    <div className="text-[8.5px] font-mono text-zinc-400">
                                      X:{conf.x}% Y:{conf.y}%
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateCurrentField({ enabled: !fEnabled });
                                  }}
                                  className="h-5 w-5 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer shrink-0"
                                  title={fEnabled ? "Sembunyikan bidang" : "Tampilkan bidang"}
                                >
                                  {fEnabled ? (
                                    <Eye className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <EyeOff className="w-3 h-3 text-zinc-400" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Active Field Properties Box */}
                      <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          <span>Pengaturan: {CERT_FIELDS.find((f) => f.key === activeCertField)?.label}</span>
                          <button
                            type="button"
                            onClick={() => updateCurrentField({ enabled: !isCurFieldEnabled })}
                            className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            {isCurFieldEnabled ? "Sembunyikan" : "Aktifkan"}
                          </button>
                        </div>

                        {/* Coordinates Manual Slider / Inputs */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-medium text-zinc-500">
                              <span>Posisi X</span>
                              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{curField.x}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={curField.x ?? 50}
                              onChange={(e) => updateCurrentField({ x: parseFloat(e.target.value) })}
                              className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-medium text-zinc-500">
                              <span>Posisi Y</span>
                              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{curField.y}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={curField.y ?? 50}
                              onChange={(e) => updateCurrentField({ y: parseFloat(e.target.value) })}
                              className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        </div>

                        {/* Typography & Alignment */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200/70 dark:border-zinc-800/70">
                          {/* Font Size */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-zinc-500">Ukuran Huruf</span>
                            <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  updateCurrentField({
                                    fontSize: Math.max(8, (curField.fontSize || 13) - 1)
                                  })
                                }
                                className="h-6 w-6 rounded flex items-center justify-center text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                {curField.fontSize || 13}px
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateCurrentField({
                                    fontSize: Math.min(32, (curField.fontSize || 13) + 1)
                                  })
                                }
                                className="h-6 w-6 rounded flex items-center justify-center text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Bold Format */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-zinc-500">Format Huruf</span>
                            <button
                              type="button"
                              onClick={() => updateCurrentField({ bold: !curField.bold })}
                              className={`w-full h-7 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                curField.bold
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              <Bold className="w-3.5 h-3.5" />
                              <span>{curField.bold ? "Tebal" : "Normal"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Alignment Buttons */}
                        <div className="space-y-1 pt-1 border-t border-zinc-200/70 dark:border-zinc-800/70">
                          <span className="text-[10px] font-medium text-zinc-500">Perataan Teks</span>
                          <div className="grid grid-cols-3 gap-1 bg-white dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                            <button
                              type="button"
                              onClick={() => updateCurrentField({ align: "left" })}
                              className={`h-6 rounded text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                                curAlign === "left"
                                  ? "bg-blue-600 text-white"
                                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                              }`}
                            >
                              <AlignLeft className="w-3 h-3" />
                              <span>Kiri</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCurrentField({ align: "center" })}
                              className={`h-6 rounded text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                                curAlign === "center"
                                  ? "bg-blue-600 text-white"
                                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                              }`}
                            >
                              <AlignCenter className="w-3 h-3" />
                              <span>Tengah</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCurrentField({ align: "right" })}
                              className={`h-6 rounded text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                                curAlign === "right"
                                  ? "bg-blue-600 text-white"
                                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                              }`}
                            >
                              <AlignRight className="w-3 h-3" />
                              <span>Kanan</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty Template State */
                  <div className="py-12 px-6 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-3 bg-zinc-50/50 dark:bg-zinc-950/40">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200/50 dark:border-blue-900/40">
                      <FileImage className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Belum Ada Template Sertifikat
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Unggah gambar desain piagam resmi atau gunakan template bawaan PMII untuk mengatur posisi teks cetak otomatis.
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={handleUploadCertificateTemplate}
                          disabled={isUploadingTemplate}
                          className="hidden"
                        />
                        <span className="h-8.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{isUploadingTemplate ? "Mengunggah..." : "Unggah Template Piagam"}</span>
                        </span>
                      </label>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSetDefaultTemplate}
                        className="h-8.5 px-4 text-xs font-medium rounded-xl cursor-pointer"
                      >
                        Terapkan Bawaan PMII
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2 bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-8 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="text-xs font-medium px-4 h-8 rounded-lg text-white bg-blue-600 hover:bg-blue-700 border-none cursor-pointer shadow-xs"
            >
              {isEdit ? "Simpan Perubahan" : "Simpan Agenda"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
