"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  ShieldCheck,
  GraduationCap,
  Upload,
  X,
  Calendar,
  Mail,
  UserCheck,
  Loader2,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { CommissariatList, KomisariatFormData, DEFAULT_FORM_DATA, getKomisariatBph, KomisariatGalleryItem } from "./types";
import { normalizeTenantName } from "@/lib/tenancy";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { generateUUID } from "@/lib/db";

interface KomisariatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: CommissariatList | null;
  onSave: (data: KomisariatFormData) => Promise<void>;
  boardMembers?: any[];
  isTenantView?: boolean;
  defaultTab?: "umum" | "bph" | "galeri";
}

export function KomisariatModal({
  open,
  onOpenChange,
  editingItem,
  onSave,
  boardMembers = [],
  isTenantView = false,
  defaultTab = "umum",
}: KomisariatModalProps) {
  const [formData, setFormData] = useState<KomisariatFormData>(DEFAULT_FORM_DATA);
  const [activeTab, setActiveTab] = useState<"umum" | "bph" | "galeri">("umum");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gallery item form state
  const [newPhoto, setNewPhoto] = useState<{
    title: string;
    imageUrl: string;
    category: string;
    date: string;
    caption: string;
  }>({
    title: "",
    imageUrl: "",
    category: "Kaderisasi",
    date: new Date().toISOString().split("T")[0],
    caption: "",
  });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingItem) {
      const detectedBph = getKomisariatBph(editingItem, boardMembers);
      setFormData({
        id: editingItem.id,
        name: editingItem.name || "",
        university: editingItem.university || editingItem.campusName || "",
        logo: editingItem.logo || "",
        logoInitial: editingItem.logoInitial || "",
        establishedDate: editingItem.establishedDate || "",
        establishedYear: editingItem.establishedYear,
        contactEmail: editingItem.contactEmail || "",
        structure: {
          chairman: editingItem.structure?.chairman || (detectedBph.chairman !== "-" ? detectedBph.chairman : ""),
          chairman_id: editingItem.structure?.chairman_id || null,
          secretary: editingItem.structure?.secretary || (detectedBph.secretary !== "-" ? detectedBph.secretary : ""),
          secretary_id: editingItem.structure?.secretary_id || null,
          treasurer: editingItem.structure?.treasurer || (detectedBph.treasurer !== "-" ? detectedBph.treasurer : ""),
          treasurer_id: editingItem.structure?.treasurer_id || null,
          period: editingItem.structure?.period || (detectedBph.period ? detectedBph.period : "2026 - 2027"),
        },
        gallery: editingItem.gallery || [],
      });
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
    setActiveTab(defaultTab || "umum");
    setErrorMsg("");
  }, [editingItem, open, defaultTab]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Ukuran foto maksimal 10MB.");
      return;
    }

    setIsUploadingPhoto(true);
    setErrorMsg("");

    try {
      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const cleanName = (formData.name || "komisariat").toLowerCase().replace(/[^a-z0-9]/g, "-");
        const filePath = `gallery/${cleanName}-${Date.now()}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from("materials")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (!uploadErr) {
          const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
          setNewPhoto((prev) => ({ ...prev, imageUrl: data.publicUrl }));
          setIsUploadingPhoto(false);
          return;
        }
      }

      // Fallback base64
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewPhoto((prev) => ({ ...prev, imageUrl: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Gagal mengunggah foto galeri:", err);
      setErrorMsg("Gagal mengunggah foto.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAddPhotoToGallery = () => {
    if (!newPhoto.imageUrl) {
      setErrorMsg("Pilih atau unggah file foto terlebih dahulu.");
      return;
    }

    const newItem: KomisariatGalleryItem = {
      id: generateUUID(),
      title: "Dokumentasi Kegiatan",
      imageUrl: newPhoto.imageUrl,
      category: "Dokumentasi",
      date: new Date().toISOString().split("T")[0],
      caption: "",
      created_at: new Date().toISOString(),
    };

    setFormData((prev) => ({
      ...prev,
      gallery: [newItem, ...(prev.gallery || [])],
    }));

    setNewPhoto({
      title: "",
      imageUrl: "",
      category: "Dokumentasi",
      date: new Date().toISOString().split("T")[0],
      caption: "",
    });
    if (photoInputRef.current) photoInputRef.current.value = "";
    setErrorMsg("");
  };

  const handleDeletePhotoFromGallery = (photoId: string) => {
    setFormData((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).filter((p) => p.id !== photoId),
    }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Ukuran file logo maksimal 5MB.");
      return;
    }

    setIsUploadingLogo(true);
    setErrorMsg("");

    try {
      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split(".").pop() || "png";
        const cleanName = (formData.name || "komisariat").toLowerCase().replace(/[^a-z0-9]/g, "-");
        const filePath = `${cleanName}-${Date.now()}.${fileExt}`;

        // 1. Coba upload langsung ke bucket 'komisariat'
        const { error: uploadErr } = await supabase.storage
          .from("komisariat")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (!uploadErr) {
          const { data } = supabase.storage.from("komisariat").getPublicUrl(filePath);
          setFormData((prev) => ({
            ...prev,
            logo: data.publicUrl,
          }));
          setIsUploadingLogo(false);
          return;
        }

        // 2. Fallback upload ke bucket 'materials' folder 'komisariat/'
        const fallbackPath = `komisariat/${filePath}`;
        const { error: matErr } = await supabase.storage
          .from("materials")
          .upload(fallbackPath, file, { cacheControl: "3600", upsert: true });

        if (!matErr) {
          const { data } = supabase.storage.from("materials").getPublicUrl(fallbackPath);
          setFormData((prev) => ({
            ...prev,
            logo: data.publicUrl,
          }));
          setIsUploadingLogo(false);
          return;
        }
      }

      // 3. Fallback FileReader Base64 jika offline
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          logo: base64,
        }));
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Gagal mengunggah logo:", err);
      setErrorMsg("Gagal mengunggah logo ke bucket storage.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("Nama Komisariat wajib diisi.");
      setActiveTab("umum");
      return;
    }
    if (!formData.university.trim()) {
      setErrorMsg("Perguruan Tinggi / Kampus wajib diisi.");
      setActiveTab("umum");
      return;
    }

    // Auto-generate inisial logo jika belum ada
    const autoInitial =
      formData.logoInitial ||
      formData.name
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 3)
        .join("")
        .toUpperCase();

    const payload: KomisariatFormData = {
      ...formData,
      logoInitial: autoInitial,
    };

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await onSave(payload);
      onOpenChange(false);
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-0 overflow-hidden text-foreground">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {editingItem
                    ? isTenantView
                      ? "Ubah Data Tenant"
                      : "Ubah Data Komisariat"
                    : isTenantView
                    ? "Tambah Tenant Baru"
                    : "Tambah Komisariat Baru"}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Lengkapi profil {isTenantView ? "tenant" : "komisariat"} binaan, kampus, dan susunan kepengurusan BPH.
                </DialogDescription>
              </div>
            </div>

            {/* Navigation Tabs (Umum, BPH, & Galeri) */}
            <div className="flex items-center gap-1.5 mt-4 pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab("umum")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "umum"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Informasi Pokok
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("bph")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "bph"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Struktur BPH
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("galeri")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "galeri"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Galeri Foto ({formData.gallery?.length || 0})</span>
              </button>
            </div>
          </DialogHeader>

          {/* Form Body */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* TAB 1: INFORMASI POKOK */}
            {activeTab === "umum" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Nama Komisariat <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      placeholder="Contoh: Ki Ageng Getas Pendawa"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Perguruan Tinggi / Kampus <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      placeholder="Contoh: UIN Walisongo Semarang"
                      value={formData.university}
                      onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                      required
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Upload Logo Komisariat */}
                <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                    Logo Komisariat
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />

                  <div className="flex items-center gap-3 pt-1">
                    {formData.logo ? (
                      <div className="relative group w-14 h-14 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 flex items-center justify-center shrink-0 shadow-xs">
                        <img
                          src={formData.logo}
                          alt="Logo Komisariat"
                          className="w-full h-full object-contain rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 shadow-sm cursor-pointer"
                          title="Hapus Logo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-14 h-14 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 bg-white dark:bg-zinc-900/60 flex flex-col items-center justify-center cursor-pointer text-zinc-400 hover:text-emerald-500 transition-colors shrink-0"
                        title="Klik untuk memilih logo"
                      >
                        <Upload className="w-4 h-4 mb-0.5" />
                        <span className="text-[9px] font-medium">Unggah</span>
                      </div>
                    )}

                    <div className="flex-1 space-y-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 text-xs gap-1.5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{formData.logo ? "Ganti Logo" : "Pilih File Logo"}</span>
                      </Button>
                      <p className="text-[11px] text-zinc-400">
                        Format PNG, JPG, WebP, atau SVG (Ukuran maksimal 2MB).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Tahun Berdiri
                    </label>
                    <Input
                      type="number"
                      placeholder="Contoh: 1985"
                      value={formData.establishedYear || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          establishedYear: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Email Kontak
                    </label>
                    <Input
                      type="email"
                      placeholder="komisariat@pmii.org"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: STRUKTUR BPH (TERHUBUNG KE TABEL PENGURUS) */}
            {activeTab === "bph" && (
              <div className="space-y-4">
                <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      Struktur BPH terhubung dengan <strong>Master Data Pengurus</strong>.
                    </span>
                  </div>
                  {boardMembers.length > 0 && (
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      {boardMembers.length} Fungsionaris Tersedia
                    </span>
                  )}
                </div>

                {/* Datalist untuk autocomplete dari tabel pengurus */}
                <datalist id="board-members-options">
                  {boardMembers.map((bm: any) => (
                    <option key={bm.id || bm.name} value={bm.name}>
                      {bm.position ? `${bm.position} - ${bm.commissariat || ""}` : ""}
                    </option>
                  ))}
                </datalist>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Periode Kepengurusan
                  </label>
                  <Input
                    placeholder="Contoh: 2026 - 2027"
                    value={formData.structure.period}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        structure: { ...formData.structure, period: e.target.value },
                      })
                    }
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Ketua Komisariat
                  </label>
                  <Input
                    list="board-members-options"
                    placeholder="Nama Lengkap Ketua Komisariat (atau pilih dari daftar pengurus)"
                    value={formData.structure.chairman}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = boardMembers.find(
                        (b: any) => b.name?.toLowerCase().trim() === val.toLowerCase().trim()
                      );
                      setFormData({
                        ...formData,
                        structure: {
                          ...formData.structure,
                          chairman: val,
                          chairman_id: matched ? matched.id : null,
                        },
                      });
                    }}
                    className="h-9 text-xs"
                  />
                  {formData.structure.chairman_id && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      ✓ Terhubung ke pengurus ID: {formData.structure.chairman_id}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Sekretaris
                    </label>
                    <Input
                      list="board-members-options"
                      placeholder="Nama Sekretaris"
                      value={formData.structure.secretary}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matched = boardMembers.find(
                          (b: any) => b.name?.toLowerCase().trim() === val.toLowerCase().trim()
                        );
                        setFormData({
                          ...formData,
                          structure: {
                            ...formData.structure,
                            secretary: val,
                            secretary_id: matched ? matched.id : null,
                          },
                        });
                      }}
                      className="h-9 text-xs"
                    />
                    {formData.structure.secretary_id && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        ✓ Terhubung ke ID: {formData.structure.secretary_id}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Bendahara
                    </label>
                    <Input
                      list="board-members-options"
                      placeholder="Nama Bendahara"
                      value={formData.structure.treasurer}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matched = boardMembers.find(
                          (b: any) => b.name?.toLowerCase().trim() === val.toLowerCase().trim()
                        );
                        setFormData({
                          ...formData,
                          structure: {
                            ...formData.structure,
                            treasurer: val,
                            treasurer_id: matched ? matched.id : null,
                          },
                        });
                      }}
                      className="h-9 text-xs"
                    />
                    {formData.structure.treasurer_id && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        ✓ Terhubung ke ID: {formData.structure.treasurer_id}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: GALERI DOKUMENTASI KEGIATAN */}
            {activeTab === "galeri" && (
              <div className="space-y-6">
                {/* Form Tambah Foto */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Tambah Foto Dokumentasi Kegiatan</span>
                    </h4>
                    <span className="text-[10px] text-zinc-500">Maks. 10MB per foto</span>
                  </div>

                  {/* Upload Foto Box */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                      File Foto Dokumentasi <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      {newPhoto.imageUrl ? (
                        <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
                          <img src={newPhoto.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewPhoto({ ...newPhoto, imageUrl: "" })}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]"
                          >
                            ×
                          </button>
                        </div>
                      ) : null}

                      <input
                        type="file"
                        ref={photoInputRef}
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="h-8 text-xs gap-1.5 cursor-pointer"
                      >
                        {isUploadingPhoto ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Mengunggah...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Pilih File Foto</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddPhotoToGallery}
                      className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambahkan ke Galeri</span>
                    </Button>
                  </div>
                </div>

                {/* List Foto Tersimpan */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Foto Tersimpan ({formData.gallery?.length || 0})
                    </h5>
                    <span className="text-[10px] text-zinc-400">
                      Foto ini otomatis tampil di Landing Page Publik Komisariat
                    </span>
                  </div>

                  {formData.gallery && formData.gallery.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {formData.gallery.map((photo) => (
                        <div
                          key={photo.id}
                          className="group relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                            <img
                              src={photo.imageUrl}
                              alt={photo.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-[9px] font-semibold text-white px-1.5 py-0.5 rounded">
                              {photo.category || "Dokumentasi"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeletePhotoFromGallery(photo.id)}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-rose-600 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                              title="Hapus foto dari galeri"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="p-2">
                            <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate">
                              {photo.title}
                            </p>
                            {photo.date && (
                              <p className="text-[9.5px] text-zinc-400 mt-0.5">
                                {photo.date}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-400">
                      Belum ada foto dokumentasi di galeri komisariat ini. Gunakan formulir di atas untuk menambahkan momen kegiatan.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs h-9 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 cursor-pointer"
            >
              {isSubmitting
                ? "Menyimpan..."
                : editingItem
                ? "Simpan Perubahan"
                : isTenantView
                ? "Tambah Tenant"
                : "Tambah Komisariat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
