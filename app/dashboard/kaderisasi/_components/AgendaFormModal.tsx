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
  Move,
  Sparkles,
  Palette,
  Layers,
  Settings2,
  Sliders,
  HelpCircle,
  Info,
  CheckCircle2
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
  DEFAULT_CERT_CONFIG,
  generateCertificatePdf,
  sanitizeCertFontSize
} from "@/lib/services";
import { generateUUID } from "@/lib/utils";
import { supabase, isSupabaseConfigured, deleteStorageFile } from "@/lib/supabase";
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
  const [inspectorSubTab, setInspectorSubTab] = useState<"bidang" | "format" | "nomor">("format");
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isLandscape, setIsLandscape] = useState<boolean>(false);

  useEffect(() => {
    if (!certificateTemplate) return;
    const img = new Image();
    img.onload = () => {
      setIsLandscape(img.naturalWidth > img.naturalHeight);
    };
    img.src = certificateTemplate;
  }, [certificateTemplate]);

  // Canvas Drag & Viewport Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const zoomLevelRef = useRef<number>(zoomLevel);
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

  // Keep zoomLevelRef in sync for touch/gesture event handlers
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

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
      const loadedCfg = agenda.certificateConfig || DEFAULT_CERT_CONFIG;
      setCertConfig({
        ...loadedCfg,
        nama: { ...loadedCfg.nama, fontSize: sanitizeCertFontSize("nama", loadedCfg.nama?.fontSize, 13) },
        nomor: { ...loadedCfg.nomor, fontSize: sanitizeCertFontSize("nomor", loadedCfg.nomor?.fontSize, 13) },
        nik: { ...loadedCfg.nik, fontSize: sanitizeCertFontSize("nik", loadedCfg.nik?.fontSize, 12) },
        ttl: { ...loadedCfg.ttl, fontSize: sanitizeCertFontSize("ttl", loadedCfg.ttl?.fontSize, 12) },
        jurusan: { ...loadedCfg.jurusan, fontSize: sanitizeCertFontSize("jurusan", loadedCfg.jurusan?.fontSize, 12) },
        kampus: { ...loadedCfg.kampus, fontSize: sanitizeCertFontSize("kampus", loadedCfg.kampus?.fontSize, 12) },
      });
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
  }, [isOpen, agenda]);

  // Auto-fit canvas zoom when switching to certificate tab
  useEffect(() => {
    if (activeTab !== "sertifikat" || !canvasViewportRef.current || !certificateTemplate) return;
    const vp = canvasViewportRef.current;
    const availW = vp.clientWidth - 48;
    const availH = vp.clientHeight - 48;
    const baseW = isLandscape ? 842 : 595;
    const baseH = isLandscape ? 595 : 842;
    if (availW > 0 && availH > 0) {
      const fitRatio = Math.min(availW / baseW, availH / baseH, 1);
      setZoomLevel(Math.max(30, Math.min(100, Math.round(fitRatio * 100))));
    }
  }, [activeTab, isLandscape, certificateTemplate]);

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
      if (dragInfoRef.current.isDragging && e.touches.length === 1) {
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

  // Keyboard arrow keys for micro-adjustments on canvas
  useEffect(() => {
    if (activeTab !== "sertifikat" || !certificateTemplate) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.tagName === "SELECT"
      ) {
        return;
      }

      const step = e.shiftKey ? 1 : 0.2;
      let handled = false;

      setCertConfig((prev) => {
        const current = (prev as any)[activeCertField] || { x: 50, y: 50 };
        const curX = current.x ?? 50;
        const curY = current.y ?? 50;

        let newX = curX;
        let newY = curY;

        if (e.key === "ArrowLeft") {
          newX = Math.round(Math.max(0, curX - step) * 10) / 10;
          handled = true;
        } else if (e.key === "ArrowRight") {
          newX = Math.round(Math.min(100, curX + step) * 10) / 10;
          handled = true;
        } else if (e.key === "ArrowUp") {
          newY = Math.round(Math.max(0, curY - step) * 10) / 10;
          handled = true;
        } else if (e.key === "ArrowDown") {
          newY = Math.round(Math.min(100, curY + step) * 10) / 10;
          handled = true;
        }

        if (!handled) return prev;

        return {
          ...prev,
          [activeCertField]: {
            ...current,
            x: newX,
            y: newY
          }
        };
      });

      if (handled) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, certificateTemplate, activeCertField]);

  // Touchpad pinch-to-zoom & touchscreen 2-finger pinch on canvas
  useEffect(() => {
    const el = canvasViewportRef.current;
    if (!el || !certificateTemplate) return;

    // 1. Trackpad pinch-to-zoom (Chrome / Safari / Edge / Firefox wheel with ctrlKey)
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        // Negative deltaY means fingers expanding (pinch out -> zoom in)
        // Positive deltaY means fingers closing (pinch in -> zoom out)
        const factor = 0.8;
        const delta = -e.deltaY * factor;
        setZoomLevel((prev) => {
          const next = Math.min(250, Math.max(40, prev + delta));
          return Math.round(next);
        });
      }
    };

    // 2. Safari macOS gesture events (WebKit GestureEvent)
    let gestureStartZoom = 100;
    const handleGestureStart = (e: any) => {
      e.preventDefault();
      gestureStartZoom = zoomLevelRef.current;
    };

    const handleGestureChange = (e: any) => {
      e.preventDefault();
      if (typeof e.scale === "number") {
        const next = Math.min(250, Math.max(40, gestureStartZoom * e.scale));
        setZoomLevel(Math.round(next));
      }
    };

    const handleGestureEnd = (e: any) => {
      e.preventDefault();
    };

    // 3. Touchscreen 2-finger pinch
    let initialTouchDistance = 0;
    let initialTouchZoom = 100;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        dragInfoRef.current.isDragging = false;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialTouchDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        initialTouchZoom = zoomLevelRef.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialTouchDistance > 0) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const scale = currentDist / initialTouchDistance;
        const next = Math.min(250, Math.max(40, initialTouchZoom * scale));
        setZoomLevel(Math.round(next));
      }
    };

    const handleTouchEnd = () => {
      initialTouchDistance = 0;
    };

    // passive: false is required to allow e.preventDefault() and stop page zoom
    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("gesturestart", handleGestureStart as any, { passive: false });
    el.addEventListener("gesturechange", handleGestureChange as any, { passive: false });
    el.addEventListener("gestureend", handleGestureEnd as any, { passive: false });
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);
    el.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("gesturestart", handleGestureStart as any);
      el.removeEventListener("gesturechange", handleGestureChange as any);
      el.removeEventListener("gestureend", handleGestureEnd as any);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [certificateTemplate, activeTab]);

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

  const processTemplateFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Format berkas harus berupa gambar (PNG, JPG, atau JPEG).");
      return;
    }

    setIsUploadingTemplate(true);
    let finalUrl = "";

    try {
      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split(".").pop();
        const filePath = `cert-templates/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("materials").upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });

        if (uploadError) {
          throw new Error(`Gagal upload ke bucket Supabase: ${uploadError.message}`);
        }

        const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
        finalUrl = data.publicUrl;

        // Bersihkan template lama dari bucket Supabase jika sebelumnya ada
        if (certificateTemplate && certificateTemplate.includes("cert-templates")) {
          deleteStorageFile(certificateTemplate).catch(() => {});
        }
      } else {
        finalUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setCertificateTemplate(finalUrl);
    } catch (err: any) {
      console.error("Upload template error:", err);
      alert(err?.message || "Gagal mengunggah template piagam.");
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  const handleUploadCertificateTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processTemplateFile(file);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processTemplateFile(file);
    }
  };

  const handleSetDefaultTemplate = () => {
    setCertificateTemplate("/templates/template-piagam-mapaba.jpg");
  };

  const handleRemoveTemplate = () => {
    if (certificateTemplate && certificateTemplate.includes("cert-templates")) {
      deleteStorageFile(certificateTemplate).catch(() => {});
    }
    setCertificateTemplate(undefined);
  };

  const handleResetCertConfig = () => {
    setCertConfig(DEFAULT_CERT_CONFIG);
  };

  const updateNumberSegment = (index: number, val: string) => {
    const current = certConfig.numberSegments || ["010", "01", "091222", "001", "12", "2026"];
    const updated = [...current] as [string, string, string, string, string, string];
    updated[index] = val;
    setCertConfig((prev) => ({
      ...prev,
      numberSegments: updated
    }));
  };

  const handlePreviewPdf = async () => {
    if (!certificateTemplate) return;

    setIsGeneratingPdf(true);
    try {
      const renderFields = CERT_FIELDS.map((f) => ({
        key: f.key,
        text:
          f.key === "nomor" && certConfig.numberSegments
            ? certConfig.numberSegments.join(".")
            : f.sample,
        fallbackX: f.key === "nomor" ? 50 : 35,
        fallbackY: f.key === "nomor" ? 13.8 : 29.2,
        fallbackSize: f.key === "nama" || f.key === "nomor" ? 13 : 12,
        fallbackAlign: (f.key === "nomor" ? "center" : "left") as "center" | "left",
        bold: f.key === "nama"
      }));

      const blobUrl = await generateCertificatePdf({
        templateUrl: certificateTemplate,
        config: certConfig,
        fields: renderFields,
        outputType: "bloburl",
        fileName: "Pratinjau_Sertifikat_A4.pdf"
      });

      if (typeof blobUrl === "string") {
        window.open(blobUrl, "_blank");
      }
    } catch (err) {
      console.error("Gagal membuat pratinjau PDF:", err);
      alert("Gagal memproses pratinjau file PDF. Pastikan gambar template dapat diakses.");
    } finally {
      setIsGeneratingPdf(false);
    }
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
                {/* STUDIO TOOLBAR HEADER */}
                <div className="p-3 sm:p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
                  {/* Left: Studio Info & Badges */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Studio Desain Piagam & Sertifikat
                        </span>
                        {certificateTemplate ? (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Supabase Cloud Aktif
                          </span>
                        ) : (
                          <span className="text-[10.5px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60">
                            Belum Ada Template
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {certificateTemplate
                          ? "Tarik teks langsung di kanvas untuk penempatan presisi atau atur detail pada panel samping."
                          : "Unggah gambar desain piagam resmi untuk mulai mengatur posisi teks kelulusan."}
                      </p>
                    </div>
                  </div>

                  {/* Right: Quick Action Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Zoom & View Controls */}
                    {certificateTemplate && (
                      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                        <button
                          type="button"
                          onClick={() => setZoomLevel((z) => Math.max(40, z - 10))}
                          className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                          title="Perkecil Kanvas (Cubit Touchpad)"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoomLevel(100)}
                          className="font-mono text-[11px] font-semibold px-1.5 text-zinc-700 dark:text-zinc-200 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Reset ke 100% (Klik)"
                        >
                          {zoomLevel}%
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoomLevel((z) => Math.min(250, z + 10))}
                          className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                          title="Perbesar Kanvas (Cubit Touchpad)"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowGuides(!showGuides)}
                          className={`h-7 px-2 rounded-lg text-[10.5px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            showGuides
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700"
                          }`}
                          title="Tampilkan / Sembunyikan Garis Panduan Tengah"
                        >
                          <span>Panduan</span>
                        </button>
                      </div>
                    )}



                    {/* Template Controls */}
                    {certificateTemplate ? (
                      <>
                        <Button
                          type="button"
                          disabled={isGeneratingPdf}
                          onClick={handlePreviewPdf}
                          className="h-8 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                          title="Buka hasil cetak PDF di tab browser baru"
                        >
                          {isGeneratingPdf ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Menyiapkan...</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Uji Cetak PDF</span>
                            </>
                          )}
                        </Button>

                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleUploadCertificateTemplate}
                            disabled={isUploadingTemplate}
                            className="hidden"
                          />
                          <span className="h-8 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{isUploadingTemplate ? "Mengunggah..." : "Ganti Gambar"}</span>
                          </span>
                        </label>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleResetCertConfig}
                          className="h-8 px-2.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
                          title="Kembalikan koordinat posisi ke standar"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          <span>Reset</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveTemplate}
                          className="h-8 px-2.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer"
                          title="Hapus template piagam dari agenda ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleUploadCertificateTemplate}
                            disabled={isUploadingTemplate}
                            className="hidden"
                          />
                          <span className="h-8 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{isUploadingTemplate ? "Mengunggah ke Cloud..." : "Unggah Template (A4)"}</span>
                          </span>
                        </label>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSetDefaultTemplate}
                          className="h-8 px-3 text-xs font-medium rounded-xl border-zinc-200 dark:border-zinc-800 cursor-pointer"
                        >
                          Terapkan Bawaan PMII
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {certificateTemplate ? (
                  /* WORKSPACE STUDIO: KANVAS KIRI + INSPECTOR KANAN */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch flex-1 min-h-0">
                    {/* VISUAL CANVAS STAGE (8 COLS) */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-full min-h-[460px] bg-slate-100 dark:bg-zinc-950 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:18px_18px]">
                      {/* Interactive Canvas Viewport */}
                      <div
                        ref={canvasViewportRef}
                        className="p-4 sm:p-8 overflow-auto flex items-center justify-center flex-1 min-h-0 relative select-none"
                      >
                        <div
                          ref={canvasRef}
                          style={{
                            width: isLandscape ? "842px" : "595px",
                            height: isLandscape ? "595px" : "842px",
                            aspectRatio: isLandscape ? "297 / 210" : "210 / 297",
                            transform: `scale(${zoomLevel / 100})`,
                            transformOrigin: "center center",
                            fontFamily: certConfig.fontFamily || 'Poppins, var(--font-poppins), sans-serif'
                          }}
                          className="relative shrink-0 shadow-2xl border border-zinc-300/80 dark:border-zinc-700 select-none bg-white rounded-md transition-transform duration-75"
                        >
                          {/* Background Image Template */}
                          <img
                            src={certificateTemplate}
                            alt="Template Piagam Resmi"
                            className="w-full h-full object-fill block select-none pointer-events-none rounded-md"
                          />

                          {/* Center Alignment Guides */}
                          {showGuides && (
                            <>
                              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-dashed border-blue-500/35 pointer-events-none z-10" />
                              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-blue-500/35 pointer-events-none z-10" />
                            </>
                          )}

                          {/* Text Markers Layer */}
                          <div className="absolute inset-0 select-none pointer-events-auto">
                            {CERT_FIELDS.map((f) => {
                              const defaultX = f.key === "nomor" ? 50 : 35;
                              const defaultAlign = f.key === "nomor" ? "center" : "left";
                              const conf = (certConfig as any)[f.key] || {
                                x: defaultX,
                                y: f.key === "nomor" ? 13.8 : 29.2,
                                fontSize: f.key === "nama" || f.key === "nomor" ? 13 : 12,
                                bold: f.key === "nama",
                                align: defaultAlign,
                                enabled: true,
                                color: "#0f172a"
                              };
                              const isActive = activeCertField === f.key;
                              const isEnabled = conf.enabled !== false;
                              const align = conf.align || defaultAlign;

                              const textSample =
                                f.key === "nomor" && certConfig.numberSegments
                                  ? certConfig.numberSegments.join(".")
                                  : f.sample;

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
                                    fontSize: `${sanitizeCertFontSize(f.key, conf.fontSize, f.key === "nama" || f.key === "nomor" ? 13 : 12)}px`,
                                    lineHeight: 1,
                                    color: conf.color || "#0f172a"
                                  }}
                                  className={`absolute cursor-grab active:cursor-grabbing p-0 select-none transition-shadow ${
                                    !isEnabled
                                      ? "opacity-35 line-through border border-dashed border-zinc-400 bg-zinc-200/50"
                                      : isActive
                                      ? "ring-2 ring-blue-600 bg-blue-500/10 font-bold z-30 rounded-[2px]"
                                      : "hover:ring-1 hover:ring-blue-400 hover:bg-blue-50/20 z-10 rounded-[2px]"
                                  } ${conf.bold ? "font-bold" : "font-normal"} whitespace-nowrap group`}
                                  title={`${f.label} (Klik & tarik untuk memindahkan)`}
                                >
                                  {/* Selection Handles (4 Corners) */}
                                  {isActive && (
                                    <>
                                      <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-blue-600 border border-white shadow-xs pointer-events-none" />
                                      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-600 border border-white shadow-xs pointer-events-none" />
                                      <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-blue-600 border border-white shadow-xs pointer-events-none" />
                                      <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-blue-600 border border-white shadow-xs pointer-events-none" />

                                      {/* Floating Tag */}
                                      <div className="absolute -top-5 left-0 bg-blue-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shadow-md pointer-events-none whitespace-nowrap z-40 flex items-center gap-1">
                                        <span>{f.label}</span>
                                        <span className="opacity-75">|</span>
                                        <span>X:{conf.x}% Y:{conf.y}%</span>
                                      </div>
                                    </>
                                  )}

                                  {textSample}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Canvas Footer Status & Keyboard Hint */}
                      <div className="p-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                            <Move className="w-3.5 h-3.5" />
                            <span>Interaksi:</span>
                          </span>
                          <span className="hidden sm:inline">Klik & tarik teks di kanvas.</span>
                          <span>Gunakan tombol panah keyboard (↑ ↓ ← →) untuk pergeseran presisi.</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 hidden md:flex">
                          <span>Shift + Panah = Geser Cepat</span>
                          <span>•</span>
                          <span className="text-blue-600 dark:text-blue-400 font-sans font-semibold">🤏 Cubit Touchpad = Zoom</span>
                        </div>
                      </div>
                    </div>

                    {/* INSPECTOR PANEL (4-5 COLS) */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs h-full">
                      {/* Inspector Header with Sub-Tabs */}
                      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 p-2 shrink-0">
                        <div className="grid grid-cols-3 gap-1 bg-zinc-200/60 dark:bg-zinc-800/60 p-0.5 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setInspectorSubTab("bidang")}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              inspectorSubTab === "bidang"
                                ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Bidang</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setInspectorSubTab("format")}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              inspectorSubTab === "format"
                                ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                            }`}
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Format Teks</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setInspectorSubTab("nomor")}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              inspectorSubTab === "nomor"
                                ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                            }`}
                          >
                            <Hash className="w-3.5 h-3.5" />
                            <span>Penomoran</span>
                          </button>
                        </div>
                      </div>

                      {/* Inspector Content Area */}
                      <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-4">
                        {/* TAB 1: LIST OF LAYERS / BIDANG */}
                        {inspectorSubTab === "bidang" && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-1">
                              <span>Daftar Bidang Teks Piagam</span>
                              <span className="font-mono text-blue-600 dark:text-blue-400">
                                {CERT_FIELDS.filter((f) => (certConfig as any)[f.key]?.enabled !== false).length} / {CERT_FIELDS.length} Aktif
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {CERT_FIELDS.map((f) => {
                                const conf = (certConfig as any)[f.key] || { x: 50, y: 50, enabled: true };
                                const isActive = activeCertField === f.key;
                                const fEnabled = conf.enabled !== false;
                                const IconComp = getFieldIcon(f.key);

                                return (
                                  <div
                                    key={f.key}
                                    onClick={() => {
                                      setActiveCertField(f.key);
                                      setInspectorSubTab("format");
                                    }}
                                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                                      isActive
                                        ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500/80 shadow-xs ring-1 ring-blue-500/30"
                                        : "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                    } ${!fEnabled ? "opacity-45" : ""}`}
                                  >
                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                      <div
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                          isActive
                                            ? "bg-blue-600 text-white shadow-2xs"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                        }`}
                                      >
                                        <IconComp className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="overflow-hidden">
                                        <div className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                          <span>{f.label}</span>
                                          {isActive && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                                          )}
                                        </div>
                                        <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-2">
                                          <span>X: {conf.x}%</span>
                                          <span>Y: {conf.y}%</span>
                                          <span>•</span>
                                          <span>{conf.fontSize || 13}px</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateCurrentField({ enabled: !fEnabled });
                                        }}
                                        className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                        title={fEnabled ? "Sembunyikan bidang" : "Tampilkan bidang"}
                                      >
                                        {fEnabled ? (
                                          <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        ) : (
                                          <EyeOff className="w-4 h-4 text-zinc-400" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* TAB 2: FORMAT TEKS & TIPOGRAFI */}
                        {inspectorSubTab === "format" && (
                          <div className="space-y-4">
                            {/* Active Field Header Banner */}
                            <div className="p-3 rounded-xl border border-blue-200/70 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/30 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                  {CERT_FIELDS.find((f) => f.key === activeCertField)?.label.slice(0, 1)}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                    {CERT_FIELDS.find((f) => f.key === activeCertField)?.label}
                                  </div>
                                  <div className="text-[10px] text-zinc-500 font-mono">
                                    Sampel: {CERT_FIELDS.find((f) => f.key === activeCertField)?.sample}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => updateCurrentField({ enabled: !isCurFieldEnabled })}
                                className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                                  isCurFieldEnabled
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                }`}
                              >
                                {isCurFieldEnabled ? "Aktif" : "Nonaktif"}
                              </button>
                            </div>



                            {/* Typography: Size, Bold, Alignment */}
                            <div className="space-y-3 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
                              <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 block">
                                Tipografi & Format
                              </span>

                              <div className="grid grid-cols-2 gap-2">
                                {/* Font Size */}
                                <div className="space-y-1">
                                  <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Ukuran Huruf</span>
                                  <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1">
                                    <button
                                      type="button"
                                      onClick={() => updateCurrentField({ fontSize: Math.max(8, (curField.fontSize || 13) - 1) })}
                                      className="h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                      {curField.fontSize || 13}pt
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateCurrentField({ fontSize: Math.min(36, (curField.fontSize || 13) + 1) })}
                                      className="h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                {/* Bold Format */}
                                <div className="space-y-1">
                                  <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Gaya Huruf</span>
                                  <button
                                    type="button"
                                    onClick={() => updateCurrentField({ bold: !curField.bold })}
                                    className={`w-full h-8 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                      curField.bold
                                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                                    }`}
                                  >
                                    <Bold className="w-3.5 h-3.5" />
                                    <span>{curField.bold ? "Tebal (Bold)" : "Normal"}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Alignment */}
                              <div className="space-y-1 pt-1">
                                <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Perataan Teks (Alignment)</span>
                                <div className="grid grid-cols-3 gap-1 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                  <button
                                    type="button"
                                    onClick={() => updateCurrentField({ align: "left" })}
                                    className={`h-7 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                                      curAlign === "left"
                                        ? "bg-blue-600 text-white shadow-2xs"
                                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                                    }`}
                                  >
                                    <AlignLeft className="w-3.5 h-3.5" />
                                    <span>Kiri</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateCurrentField({ align: "center" })}
                                    className={`h-7 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                                      curAlign === "center"
                                        ? "bg-blue-600 text-white shadow-2xs"
                                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                                    }`}
                                  >
                                    <AlignCenter className="w-3.5 h-3.5" />
                                    <span>Tengah</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateCurrentField({ align: "right" })}
                                    className={`h-7 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                                      curAlign === "right"
                                        ? "bg-blue-600 text-white shadow-2xs"
                                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                                    }`}
                                  >
                                    <AlignRight className="w-3.5 h-3.5" />
                                    <span>Kanan</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Global Font Family Selector */}
                            <div className="space-y-1.5 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
                              <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 block">
                                Jenis Huruf Piagam (Global)
                              </span>
                              <select
                                value={certConfig.fontFamily || '"Arial Narrow", Arial, sans-serif'}
                                onChange={(e) =>
                                  setCertConfig((prev) => ({ ...prev, fontFamily: e.target.value }))
                                }
                                className="w-full text-xs h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 cursor-pointer font-medium"
                              >
                                {FONT_OPTIONS.map((font) => (
                                  <option key={font.value} value={font.value}>
                                    {font.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* TAB 3: SEGMEN NOMOR RESMI */}
                        {inspectorSubTab === "nomor" && (
                          <div className="space-y-4">
                            {/* Live Number Banner */}
                            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/30 text-center space-y-1">
                              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider">
                                Pratinjau Nomor Piagam Resmi
                              </span>
                              <div className="text-base font-black font-mono text-zinc-900 dark:text-zinc-100 tracking-wide">
                                {(certConfig.numberSegments || ["010", "01", "091222", "001", "12", "2026"]).join(".")}
                              </div>
                              <p className="text-[10.5px] text-zinc-500">
                                Segmen [001] otomatis diganti dengan nomor registrasi urut masing-masing peserta saat kelulusan.
                              </p>
                            </div>

                            {/* Segment Inputs (6 fields) */}
                            <div className="space-y-2.5">
                              <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 px-1 block">
                                Konfigurasi 6 Segmen Kode Nomor
                              </span>

                              {[
                                { idx: 0, label: "Segmen 1: No. SK / Kode Dokumen", desc: "Contoh: 010" },
                                { idx: 1, label: "Segmen 2: Jenis / Tingkat Kaderisasi", desc: "Contoh: 01 (Mapaba), 02 (PKD)" },
                                { idx: 2, label: "Segmen 3: Kode Wilayah / Komisariat", desc: "Contoh: 091222" },
                                { idx: 3, label: "Segmen 4: Nomor Urut Peserta", desc: "Default: 001 (Dinamis per kader)" },
                                { idx: 4, label: "Segmen 5: Bulan Pelaksanaan", desc: "Contoh: 12" },
                                { idx: 5, label: "Segmen 6: Tahun Kegiatan", desc: "Contoh: 2026" }
                              ].map((seg) => {
                                const currentSegs = certConfig.numberSegments || ["010", "01", "091222", "001", "12", "2026"];
                                return (
                                  <div
                                    key={seg.idx}
                                    className="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40 space-y-1"
                                  >
                                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                      <span>{seg.label}</span>
                                      <span className="text-[10px] text-zinc-400 font-normal">{seg.desc}</span>
                                    </div>
                                    <Input
                                      value={currentSegs[seg.idx] || ""}
                                      onChange={(e) => updateNumberSegment(seg.idx, e.target.value.trim())}
                                      placeholder="Nilai kode segmen"
                                      className="h-8 text-xs font-mono font-bold bg-white dark:bg-zinc-900 rounded-lg"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* EMPTY STATE: MODERN DRAG & DROP UPLOAD ZONE */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`py-16 px-6 sm:px-12 rounded-3xl border-2 border-dashed text-center space-y-4 transition-all duration-200 flex-1 flex flex-col items-center justify-center ${
                      isDragOver
                        ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/30 scale-[0.99]"
                        : "border-zinc-300/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 hover:border-zinc-400"
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/60 dark:to-indigo-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200/50 dark:border-blue-900/40 shadow-sm">
                      <UploadCloud className="w-8 h-8" />
                    </div>

                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h4 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                        Unggah Template Desain Piagam Resmi
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Tarik & lepas berkas gambar piagam kosong ke sini, atau klik tombol di bawah untuk memilih gambar dari perangkat Anda.
                      </p>
                    </div>

                    {/* Format Specifications Badge */}
                    <div className="flex items-center gap-2 flex-wrap justify-center text-[10.5px] font-medium text-zinc-500 dark:text-zinc-400 pt-1">
                      <span className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                        📐 Ukuran Kertas: <strong>A4 Landscape (297 × 210 mm)</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                        🖼️ Format: <strong>PNG / JPG (Rekomendasi 300 DPI)</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                        ☁️ Storage: <strong>Bucket Supabase Cloud</strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-2.5 pt-3 flex-wrap">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={handleUploadCertificateTemplate}
                          disabled={isUploadingTemplate}
                          className="hidden"
                        />
                        <span className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/25 transition-all">
                          <UploadCloud className="w-4 h-4" />
                          <span>{isUploadingTemplate ? "Mengunggah ke Supabase..." : "Pilih Berkas Gambar"}</span>
                        </span>
                      </label>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSetDefaultTemplate}
                        className="h-10 px-5 text-xs font-semibold rounded-xl border-zinc-300 dark:border-zinc-800 cursor-pointer shadow-2xs"
                      >
                        Terapkan Template Standar PMII
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
