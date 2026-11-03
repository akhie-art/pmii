"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  Trash2,
  Edit2,
  ZoomIn,
  X,
  Upload,
  ExternalLink,
  LayoutGrid,
  List,
  Sparkles,
  Camera,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Download,
  Share2,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { db, type UserAccount, type GalleryItem } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { generateUUID } from "@/lib/utils";
import { useFeedbackModal } from "@/components/ui/feedback-modal";
import {
  getActiveTenant,
  isCabangOrAdmin,
  TENANT_CHANGED_EVENT,
  getKomisariatSlug,
  normalizeTenantName
} from "@/lib/tenancy";
import { DEFAULT_COMMISSARIATS } from "@/lib/services/defaults";
import {
  CommissariatList,
  KomisariatGalleryItem
} from "@/app/dashboard/komisariat/_components/types";

// Extended item with commissariat metadata for unified management
interface GalleryItemWithCommissariat extends KomisariatGalleryItem {
  commissariatId: string;
  commissariatName: string;
  commissariatUniversity: string;
  commissariatSlug: string;
}

export default function GaleriPage() {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [commissariats, setCommissariats] = useState<CommissariatList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTenant, setActiveTenant] = useState<string>("ALL");

  // Pinterest Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommFilter, setSelectedCommFilter] = useState("ALL");
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingCommissariatId, setEditingCommissariatId] = useState<string>("");

  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryItemWithCommissariat | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItemWithCommissariat | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [formCommissariatId, setFormCommissariatId] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formError, setFormError] = useState("");

  const { showSuccess, showError, FeedbackModalComponent } = useFeedbackModal();

  // Load User & Tenant from LocalStorage
  useEffect(() => {
    setMounted(true);
    setActiveTenant(getActiveTenant() || "ALL");

    try {
      const stored =
        localStorage.getItem("PMII_LOGGED_IN_USER") ||
        localStorage.getItem("PMII_USER_SESSION");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Gagal membaca sesi pengguna:", e);
    }

    const handleTenantChange = (e: any) => {
      setActiveTenant(e.detail?.activeTenant || "ALL");
    };
    window.addEventListener(TENANT_CHANGED_EVENT, handleTenantChange);
    return () => window.removeEventListener(TENANT_CHANGED_EVENT, handleTenantChange);
  }, []);

  // Fetch Commissariats & Gallery
  const loadCommissariats = async () => {
    setLoading(true);
    try {
      const list = await db.getCommissariats(DEFAULT_COMMISSARIATS);
      setCommissariats(list);
    } catch (err) {
      console.error("Gagal memuat data komisariat:", err);
      showError(
        "Gagal Memuat Data",
        "Terjadi kesalahan saat memuat data galeri foto."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommissariats();
  }, []);

  // User scope check
  const isSuperOrCabang = isCabangOrAdmin(currentUser);
  const userTenantId = currentUser?.komisariat_id || currentUser?.tenant_id || "";

  // Available commissariats for current user
  const allowedCommissariats = useMemo(() => {
    if (isSuperOrCabang) {
      if (activeTenant && activeTenant !== "ALL") {
        return commissariats.filter((c) => c.id === activeTenant || normalizeTenantName(c.name) === normalizeTenantName(activeTenant));
      }
      return commissariats;
    }
    // Scoped to user's commissariat
    if (userTenantId) {
      return commissariats.filter(
        (c) =>
          c.id === userTenantId ||
          normalizeTenantName(c.name) === normalizeTenantName(currentUser?.commissariat || "")
      );
    }
    return commissariats;
  }, [commissariats, isSuperOrCabang, activeTenant, userTenantId, currentUser]);

  // Resolve the logged-in user's tenant commissariat
  const userCommissariat = useMemo(() => {
    if (!commissariats.length) return null;

    const rawCommName =
      currentUser?.commissariat ||
      (currentUser as any)?.komisariat ||
      (currentUser as any)?.campus ||
      (currentUser as any)?.perguruanTinggi;
    const rawTenantId = (currentUser as any)?.komisariat_id || (currentUser as any)?.tenant_id;
    const active = activeTenant && activeTenant !== "ALL" ? activeTenant : null;

    // 1. Try finding by user tenant ID
    if (rawTenantId) {
      const found = commissariats.find((c) => c.id === rawTenantId);
      if (found) return found;
    }

    // 2. Try finding by activeTenant (if set by switcher)
    if (active) {
      const found = commissariats.find(
        (c) => c.id === active || normalizeTenantName(c.name) === normalizeTenantName(active)
      );
      if (found) return found;
    }

    // 3. Try finding by user's commissariat name or campus
    if (rawCommName) {
      const normUserComm = normalizeTenantName(rawCommName);
      const found = commissariats.find((c) => {
        const normName = normalizeTenantName(c.name);
        const normUniv = normalizeTenantName(c.university);
        return (
          normName === normUserComm ||
          normName.includes(normUserComm) ||
          normUserComm.includes(normName) ||
          (normUniv && (normUniv === normUserComm || normUniv.includes(normUserComm) || normUserComm.includes(normUniv)))
        );
      });
      if (found) return found;
    }

    // Fallback: first allowed commissariat or first commissariat
    return allowedCommissariats[0] || commissariats[0] || null;
  }, [commissariats, currentUser, activeTenant, allowedCommissariats]);

  // Current selected commissariat for the modal form
  const currentSelectedComm = useMemo(() => {
    if (formCommissariatId) {
      const found = commissariats.find((c) => c.id === formCommissariatId);
      if (found) return found;
    }
    return userCommissariat;
  }, [formCommissariatId, commissariats, userCommissariat]);

  // Keep formCommissariatId synchronized with user's tenant
  useEffect(() => {
    if (!formCommissariatId && userCommissariat?.id) {
      setFormCommissariatId(userCommissariat.id);
    }
  }, [userCommissariat, formCommissariatId]);

  // Flatten all gallery items with their parent commissariat
  const allGalleryItems: GalleryItemWithCommissariat[] = useMemo(() => {
    const items: GalleryItemWithCommissariat[] = [];
    allowedCommissariats.forEach((c) => {
      if (Array.isArray(c.gallery)) {
        c.gallery.forEach((g) => {
          items.push({
            ...g,
            commissariatId: c.id,
            commissariatName: c.name,
            commissariatUniversity: c.university || (c as any).campusName || "PMII",
            commissariatSlug: getKomisariatSlug(c)
          });
        });
      }
    });

    // Sort by date newest first
    return items.sort((a, b) => {
      const dateA = new Date(a.date || a.created_at || "").getTime() || 0;
      const dateB = new Date(b.date || b.created_at || "").getTime() || 0;
      return dateB - dateA;
    });
  }, [allowedCommissariats]);

  // Copy Link Helper
  const handleCopyLink = (url: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Gallery items list with Pinterest search & filter
  const filteredItems = useMemo(() => {
    return allGalleryItems.filter((item) => {
      if (selectedCommFilter !== "ALL" && item.commissariatId !== selectedCommFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.commissariatName.toLowerCase().includes(q);
        const matchUniv = item.commissariatUniversity.toLowerCase().includes(q);
        if (!matchName && !matchUniv) return false;
      }
      return true;
    });
  }, [allGalleryItems, selectedCommFilter, searchQuery]);

  // Format date helper (Indonesian)
  const formatIndonesianDate = (dateStr?: string): string => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingPhotoId(null);
    setEditingCommissariatId("");
    setFormError("");
    setFormImageUrl("");

    // Automatically default to the logged-in user's commissariat
    const defaultComm = userCommissariat?.id || allowedCommissariats[0]?.id || "";
    setFormCommissariatId(defaultComm);

    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: GalleryItemWithCommissariat) => {
    setIsEditing(true);
    setEditingPhotoId(item.id);
    setEditingCommissariatId(item.commissariatId);
    setFormCommissariatId(item.commissariatId);
    setFormImageUrl(item.imageUrl);
    setFormError("");

    setIsFormOpen(true);
  };

  // Upload Photo File Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Hanya file gambar (JPG, PNG, WebP) yang diperbolehkan.");
      return;
    }

    setIsUploadingPhoto(true);
    setFormError("");

    try {
      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const cleanComm = formCommissariatId.slice(0, 8);
        const filePath = `gallery/${cleanComm}-${Date.now()}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from("materials")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (!uploadErr) {
          const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
          setFormImageUrl(data.publicUrl);
          setIsUploadingPhoto(false);
          return;
        }
      }

      // Fallback: FileReader Base64
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormImageUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Gagal mengunggah foto:", err);
      setFormError("Gagal mengunggah foto gambar.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Save (Create or Update) Photo
  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formImageUrl) {
      setFormError("Pilih atau unggah file foto terlebih dahulu.");
      return;
    }
    const targetCommId = formCommissariatId || userCommissariat?.id || allowedCommissariats[0]?.id || "";
    if (!targetCommId) {
      setFormError("Komisariat akun tidak ditemukan.");
      return;
    }

    try {
      const photoId = isEditing && editingPhotoId ? editingPhotoId : generateUUID();
      const photoPayload: GalleryItem = {
        id: photoId,
        tenant_id: targetCommId,
        imageUrl: formImageUrl,
        image_url: formImageUrl,
        created_at: new Date().toISOString()
      };

      // Simpan langsung ke tabel galeri database Supabase
      await db.upsertGalleryItem(photoPayload);

      const updatedCommissariats = commissariats.map((c) => {
        if (c.id === targetCommId) {
          const currentGallery = Array.isArray(c.gallery) ? [...c.gallery] : [];

          if (isEditing && editingPhotoId) {
            // Update photo in current commissariat
            const updatedGallery = currentGallery.map((p) =>
              p.id === editingPhotoId
                ? {
                    ...p,
                    imageUrl: formImageUrl,
                  }
                : p
            );
            return { ...c, gallery: updatedGallery };
          } else {
            // Insert new photo
            return { ...c, gallery: [photoPayload, ...currentGallery] };
          }
        }

        // If editing and commissariat changed: remove from old commissariat
        if (isEditing && editingCommissariatId && editingCommissariatId !== targetCommId && c.id === editingCommissariatId) {
          const cleanedGallery = (c.gallery || []).filter((p) => p.id !== editingPhotoId);
          return { ...c, gallery: cleanedGallery };
        }

        return c;
      });

      await db.saveCommissariats(updatedCommissariats);
      setCommissariats(updatedCommissariats);
      setIsFormOpen(false);

      showSuccess(
        isEditing ? "Foto Diperbarui" : "Foto Berhasil Ditambahkan",
        isEditing
          ? "File foto dokumentasi telah berhasil diperbarui."
          : `Foto baru berhasil ditambahkan ke galeri ${commissariats.find((c) => c.id === targetCommId)?.name || ""}.`
      );
    } catch (err) {
      console.error("Gagal menyimpan foto galeri:", err);
      showError(
        "Gagal Menyimpan",
        "Terjadi kesalahan saat menyimpan foto galeri."
      );
    }
  };

  // Delete Photo Confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      // Hapus langsung dari tabel galeri database Supabase & file di storage jika ada
      await db.deleteGalleryItem(deleteTarget.id, deleteTarget.imageUrl);

      const updatedCommissariats = commissariats.map((c) => {
        if (c.id === deleteTarget.commissariatId) {
          const filtered = (c.gallery || []).filter((p) => p.id !== deleteTarget.id);
          return { ...c, gallery: filtered };
        }
        return c;
      });

      await db.saveCommissariats(updatedCommissariats);
      setCommissariats(updatedCommissariats);
      setDeleteTarget(null);

      showSuccess(
        "Foto Dihapus",
        `Foto berhasil dihapus dari galeri ${deleteTarget.commissariatName}.`
      );
    } catch (err) {
      console.error("Gagal menghapus foto:", err);
      showError(
        "Gagal Menghapus",
        "Terjadi kesalahan saat menghapus foto galeri."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 pb-12">
      {FeedbackModalComponent}

      {/* 1. PINTEREST HEADER: BREADCRUMB, SEARCH & ACTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Breadcrumb & Title */}
        <div>
          <nav className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-zinc-700 dark:text-zinc-300">Publikasi & Media</span>
            <span>/</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Galeri Pinterest</span>
          </nav>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Dokumentasi & Galeri
            </h1>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs py-0.5 px-2 rounded-full font-semibold"
            >
              {filteredItems.length} Pin
            </Badge>
          </div>
        </div>

        {/* Pinterest Search & Upload Action */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md md:justify-end">
          {/* Pill Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari dokumentasi atau nama komisariat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-8 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all border-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Button
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs font-semibold h-10 px-4.5 rounded-full flex items-center gap-2 shrink-0 active:scale-95 transition-transform cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Unggah Foto</span>
          </Button>
        </div>
      </div>

      {/* 2. PINTEREST COMMISSARIAT BUBBLE CHIPS (IF MULTI-TENANT) */}
      {allowedCommissariats.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCommFilter("ALL")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedCommFilter === "ALL"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            Semua ({allGalleryItems.length})
          </button>
          {allowedCommissariats.map((c) => {
            const count = allGalleryItems.filter((g) => g.commissariatId === c.id).length;
            const shortName = c.name.replace(/Komisariat|PK PMII|PMII/gi, "").trim();
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCommFilter(c.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  selectedCommFilter === c.id
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <span>{shortName}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. PINTEREST MASONRY WATERFALL GRID */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Memuat dokumentasi pin galeri...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl mx-auto shadow-none">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200/60 dark:border-emerald-900/60">
            <ImageIcon className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {searchQuery ? "Tidak Ditemukan Foto" : "Belum Ada Pin Galeri"}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
            {searchQuery
              ? `Tidak ada dokumentasi foto yang cocok dengan pencarian "${searchQuery}". Coba kata kunci lain.`
              : "Belum ada foto kegiatan yang diunggah ke galeri komisariat ini. Mulai unggah dokumentasi momen berharga sekarang."}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {searchQuery ? (
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
                className="rounded-full text-xs h-9 px-4"
              >
                Reset Pencarian
              </Button>
            ) : (
              <Button
                onClick={handleOpenCreate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-full h-9 px-5 gap-2 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Unggah Pin Sekarang</span>
              </Button>
            )}
          </div>
        </Card>
      ) : (
        /* PINTEREST WATERFALL COLUMNS */
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
          {filteredItems.map((item) => {
            const initials =
              item.commissariatName
                .replace(/Komisariat|PK PMII|PMII/gi, "")
                .trim()
                .slice(0, 2)
                .toUpperCase() || "PK";

            return (
              <div
                key={`${item.commissariatId}-${item.id}`}
                className="break-inside-avoid inline-block w-full mb-4 group cursor-pointer"
                onClick={() => setLightboxPhoto(item)}
              >
                {/* Pin Image Container */}
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-2xs hover:shadow-xl transition-all duration-300">
                  <img
                    src={item.imageUrl}
                    alt={item.commissariatName}
                    className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />

                  {/* Pinterest Dark Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-between pointer-events-none">
                    {/* Top: Visit Landing Page Button */}
                    <div className="flex items-center justify-between gap-2 pointer-events-auto">
                      <span className="text-[10px] font-semibold text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                        Dokumentasi
                      </span>
                      <Link
                        href={`/komisariat/${item.commissariatSlug}#galeri`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] px-3 py-1.5 rounded-full shadow-lg transition-all transform active:scale-95 flex items-center gap-1.5"
                        title="Buka Landing Page Publik"
                      >
                        <span>Kunjungi</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Bottom Actions: Round Pinterest Buttons */}
                    <div className="flex items-center justify-end gap-1.5 pointer-events-auto">
                      {/* Download */}
                      <a
                        href={item.imageUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-zinc-800 flex items-center justify-center shadow-md transition-all hover:scale-105"
                        title="Unduh Foto"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(item);
                        }}
                        className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-zinc-800 flex items-center justify-center shadow-md transition-all hover:scale-105"
                        title="Ubah Foto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(item);
                        }}
                        className="w-8 h-8 rounded-full bg-white/90 hover:bg-rose-50 text-rose-600 flex items-center justify-center shadow-md transition-all hover:scale-105"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pinterest Pin Subtitle: Avatar + Info */}
                <div className="mt-2 px-1 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:underline">
                      {item.commissariatName}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {formatIndonesianDate(item.created_at || item.date)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. MODAL FORM: UNGGAH / EDIT FOTO */}
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setIsFormOpen(false)}
        >
          <div
            className="relative max-w-xl w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {isEditing ? "Ubah Foto Dokumentasi" : "Unggah Foto Galeri Baru"}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {isEditing ? "Perbarui informasi dan deskripsi foto kegiatan" : "Tambahkan foto rekam jejak kegiatan ke landing page"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePhoto} className="space-y-4">
              {/* Komisariat (Read Only - Otomatis Sesuai Akun Login) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>
                    Komisariat <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Otomatis Akun Login
                  </span>
                </label>
                <div className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center justify-between cursor-not-allowed select-none shadow-2xs">
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate font-semibold">
                      {currentSelectedComm
                        ? `${currentSelectedComm.name} (${currentSelectedComm.university || "PMII"})`
                        : "Memuat data komisariat..."}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-600 dark:text-zinc-300 border-none font-normal flex items-center gap-1"
                    >
                      <Lock className="w-2.5 h-2.5" />
                      Read Only
                    </Badge>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  Foto dokumentasi otomatis terhubung ke galeri & landing page <span className="font-medium text-zinc-600 dark:text-zinc-300">{currentSelectedComm?.name || "komisariat Anda"}</span>.
                </p>
                <input
                  type="hidden"
                  name="commissariatId"
                  value={formCommissariatId || currentSelectedComm?.id || ""}
                />
              </div>

              {/* Photo Upload & Preview */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  File Foto Gambar <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  {formImageUrl ? (
                    <div className="relative w-full sm:w-40 aspect-[4/3] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 shrink-0">
                      <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormImageUrl("")}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black"
                        title="Hapus Gambar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : null}

                  <div className="flex-1 w-full">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-4 cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-950/50 text-center">
                      <Upload className="w-5 h-5 text-zinc-400 mb-1" />
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {isUploadingPhoto ? "Mengunggah..." : "Pilih file foto dari perangkat"}
                      </span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">JPG, PNG, atau WebP (Maks. 5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploadingPhoto}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUploadingPhoto}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl shadow-xs"
                >
                  {isEditing ? "Simpan Perubahan" : "Unggah ke Galeri"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. PINTEREST PIN LIGHTBOX MODAL */}
      {lightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 my-auto flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button Top Right */}
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left: Full Photo View */}
            <div className="md:w-3/5 bg-zinc-950 flex items-center justify-center p-2 sm:p-4">
              <img
                src={lightboxPhoto.imageUrl}
                alt={lightboxPhoto.commissariatName}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl"
              />
            </div>

            {/* Right: Pinterest Pin Info & Actions */}
            <div className="md:w-2/5 p-6 flex flex-col justify-between space-y-6 bg-white dark:bg-zinc-900">
              {/* Top Bar: Action Buttons */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 pr-10">
                  <div className="flex items-center gap-1.5">
                    {/* Share / Copy Link Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(lightboxPhoto.imageUrl)}
                      className="h-9 px-3 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Salin Tautan Foto"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </button>

                    {/* Download Button */}
                    <a
                      href={lightboxPhoto.imageUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center transition-all cursor-pointer"
                      title="Unduh Foto Resolusi Penuh"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Red/Emerald Pinterest Visit Button */}
                  <Link
                    href={`/komisariat/${lightboxPhoto.commissariatSlug}#galeri`}
                    target="_blank"
                    className="h-9 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                  >
                    <span>Kunjungi</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Pin Publisher Info */}
                <div className="pt-2 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                    {lightboxPhoto.commissariatName
                      .replace(/Komisariat|PK PMII|PMII/gi, "")
                      .trim()
                      .slice(0, 2)
                      .toUpperCase() || "PK"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {lightboxPhoto.commissariatName}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {lightboxPhoto.commissariatUniversity || "PMII Cabang Grobogan"}
                    </p>
                  </div>
                </div>

                {/* Details badge */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Waktu Unggah
                    </span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {formatIndonesianDate(lightboxPhoto.created_at || lightboxPhoto.date)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Building2 className="w-3.5 h-3.5" />
                      Status Publikasi
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                      Aktif di Landing Page
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Bottom Actions for Management */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const item = lightboxPhoto;
                    setLightboxPhoto(null);
                    handleOpenEdit(item);
                  }}
                  className="rounded-full text-xs h-9 px-4 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>Ubah Foto</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const item = lightboxPhoto;
                    setLightboxPhoto(null);
                    setDeleteTarget(item);
                  }}
                  className="rounded-full text-xs h-9 px-4 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>Hapus</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. DELETE CONFIRMATION DIALOG */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Hapus Foto Dokumentasi?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Apakah Anda yakin ingin menghapus foto ini dari galeri <span className="font-semibold text-zinc-800 dark:text-zinc-200">{deleteTarget.commissariatName}</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                className="text-xs rounded-xl"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-xl shadow-xs"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus Foto"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
