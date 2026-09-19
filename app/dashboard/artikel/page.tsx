"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  Newspaper,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Archive,
  Calendar,
  Tag,
  User,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ChevronRight,
  FileText,
  X,
  LayoutGrid,
  Table as TableIcon,
  Check,
  Globe,
  Share2,
  Lock,
  Upload,
  Image as ImageIcon,
  RotateCw,
  Heart
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { db, DEFAULT_ARTICLES, formatArticleDate } from "@/lib/db";
import type { Article, UserAccount } from "@/lib/db";


const PRESET_CATEGORIES = ["Kaderisasi", "Opini & Pergerakan", "Tata Kelola", "Warta Gerakan", "Wawasan Islam"];

export default function AdminArtikelPage() {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [selectedStatus, setSelectedStatus] = useState<string>("Semua");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Helper Functions
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .trim();
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>?/gm, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  };

  const getAuthorDetails = (user: UserAccount | null) => {
    const name = user?.name || "Pengurus PMII";
    let role = (user as unknown as { jabatan?: string })?.jabatan;
    if (!role) {
      const r = (user?.role || "").toLowerCase();
      if (r === "admin") {
        role = "Administrator Komisariat";
      } else if (r === "pengurus") {
        role = "Pengurus Komisariat";
      } else {
        role = "Pengurus PMII";
      }
    }
    return { name, role };
  };

  // Form Field States
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "Kaderisasi",
    customCategory: "",
    content: "",
    authorName: "",
    authorRole: "",
    image: "/image/kaderisasi.jpg",
    tagsInput: "PMII, Kaderisasi, Pergerakan",
    status: "DITAMPILKAN" as "DITAMPILKAN" | "DRAFT" | "ARSIP",
  });

  // File Upload State
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Harap pilih file gambar (JPG, PNG, WebP)!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran file gambar maksimal 5MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFormData((prev) => ({
          ...prev,
          image: e.target!.result as string,
        }));
        showToast("Gambar berhasil diunggah!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Load User & Articles
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setCurrentUser(user);
          const author = getAuthorDetails(user);
          setFormData((prev) => ({
            ...prev,
            authorName: author.name,
            authorRole: author.role,
          }));
        } catch (e) {
          console.error("Error parsing logged in user", e);
        }
      }
    }

    const fetchArticles = async () => {
      try {
        setLoading(true);
        const data = await db.getArticles();
        setArticles(data);
      } catch (err) {
        console.error("Failed to load articles:", err);
        setArticles(DEFAULT_ARTICLES);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Filtered Articles
  const filteredArticles = articles.filter((art) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      art.title.toLowerCase().includes(q) ||
      art.authorName.toLowerCase().includes(q) ||
      art.excerpt.toLowerCase().includes(q) ||
      art.tags.some((t) => t.toLowerCase().includes(q));

    const matchCategory =
      selectedCategory === "Semua" || art.category === selectedCategory;

    const matchStatus =
      selectedStatus === "Semua" || art.status === selectedStatus;

    return matchSearch && matchCategory && matchStatus;
  });

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingArticle(null);
    const author = getAuthorDetails(currentUser);
    setFormData({
      title: "",
      slug: "",
      category: "Kaderisasi",
      customCategory: "",
      content: "",
      authorName: author.name,
      authorRole: author.role,
      image: "/image/kaderisasi.jpg",
      tagsInput: "PMII, Kaderisasi, Pergerakan",
      status: "DITAMPILKAN",
    });
    setShowFormModal(true);
  };

  // Open Edit Form
  const handleOpenEdit = (article: Article) => {
    setEditingArticle(article);
    const isPresetCat = PRESET_CATEGORIES.includes(article.category);
    const author = getAuthorDetails(currentUser);

    const initialContentHtml = Array.isArray(article.content)
      ? article.content.map((p) => (p.startsWith("<") ? p : `<p>${p}</p>`)).join("")
      : (article.content || "");

    setFormData({
      title: article.title,
      slug: article.slug || slugify(article.title),
      category: isPresetCat ? article.category : "Lainnya",
      customCategory: isPresetCat ? "" : article.category,
      content: initialContentHtml,
      authorName: article.authorName || author.name,
      authorRole: article.authorRole || author.role,
      image: article.image || "/image/kaderisasi.jpg",
      tagsInput: article.tags.join(", "),
      status: article.status,
    });
    setShowFormModal(true);
  };

  // Save Article (Create / Update)
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Judul artikel tidak boleh kosong!");
      return;
    }

    const resolvedCategory =
      formData.category === "Lainnya" && formData.customCategory.trim()
        ? formData.customCategory.trim()
        : formData.category;

    const resolvedImage = formData.image || "/image/kaderisasi.jpg";

    const plainText = stripHtml(formData.content);
    const autoExcerpt = plainText.length > 160 ? plainText.slice(0, 160).trim() + "..." : (plainText || formData.title);
    const resolvedSlug = formData.slug.trim() || slugify(formData.title);

    const initials = formData.authorName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "PM";

    const tagsArray = formData.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const now = new Date();
    const dateFormatted = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const finalContent = formData.content.trim() ? [formData.content] : [formData.title];

    let updatedList: Article[];

    if (editingArticle) {
      // Update existing
      updatedList = articles.map((art) => {
        if (art.id === editingArticle.id) {
          return {
            ...art,
            title: formData.title,
            slug: resolvedSlug,
            category: resolvedCategory,
            excerpt: autoExcerpt,
            content: finalContent,
            authorName: formData.authorName,
            authorRole: formData.authorRole,
            authorInitials: initials,
            image: resolvedImage || "/image/kaderisasi.jpg",
            tags: tagsArray.length > 0 ? tagsArray : ["PMII"],
            status: formData.status,
            updatedAt: now.toISOString(),
          };
        }
        return art;
      });
      showToast("Artikel berhasil diperbarui!");
    } else {
      // Create new
      const newArticle: Article = {
        id: `art-${Date.now()}`,
        slug: resolvedSlug,
        title: formData.title,
        category: resolvedCategory,
        excerpt: autoExcerpt,
        content: finalContent,
        authorName: formData.authorName,
        authorRole: formData.authorRole,
        authorInitials: initials,
        image: resolvedImage || "/image/kaderisasi.jpg",
        tags: tagsArray.length > 0 ? tagsArray : ["PMII"],
        status: formData.status,
        views: 0,
        commissariat: currentUser?.commissariat || "Ki Ageng Getas Pendawa",
        createdAt: now.toISOString(),
        created_at: now.toISOString(),
        updatedAt: now.toISOString(),
        updated_at: now.toISOString(),
      };
      updatedList = [newArticle, ...articles];
      showToast("Artikel baru berhasil dipublikasikan!");
    }

    setArticles(updatedList);
    await db.saveArticles(updatedList);
    setShowFormModal(false);
  };

  // Toggle Article Status Directly
  const handleToggleStatus = async (article: Article) => {
    const nextStatus: Article["status"] =
      article.status === "DITAMPILKAN"
        ? "DRAFT"
        : article.status === "DRAFT"
        ? "ARSIP"
        : "DITAMPILKAN";

    const updated = articles.map((a) => (a.id === article.id ? { ...a, status: nextStatus } : a));
    setArticles(updated);
    await db.saveArticles(updated);
    showToast(`Status artikel diubah menjadi: ${nextStatus}`);
  };

  // Delete Article
  const handleDeleteArticle = async () => {
    if (!deletingArticle) return;
    const updated = articles.filter((a) => a.id !== deletingArticle.id);
    setArticles(updated);
    await db.saveArticles(updated);
    setShowDeleteModal(false);
    setDeletingArticle(null);
    showToast("Artikel berhasil dihapus.");
  };

  // Open Preview Modal
  const handleOpenPreview = (article: Article) => {
    setPreviewArticle(article);
    setShowPreviewModal(true);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-medium shadow-2xl border border-zinc-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Manajemen Artikel & Warta
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Kelola tulisan ilmiah, opini pergerakan, dan warta kegiatan yang tampil di landing page.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-9 sm:h-10 px-4 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Artikel Baru</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-3 sm:p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari judul, penulis, tagar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white dark:bg-zinc-900 text-blue-600 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
                title="Tampilan Tabel"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-zinc-900 text-blue-600 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
                title="Tampilan Grid Kartu"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category & Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-400 font-medium">Kategori:</span>
          {["Semua", "Kaderisasi", "Opini & Pergerakan", "Tata Kelola"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[11px] rounded-lg transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white font-semibold"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}

          <span className="text-[11px] text-zinc-400 font-medium ml-2">Status:</span>
          {["Semua", "DITAMPILKAN", "DRAFT", "ARSIP"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 text-[11px] rounded-lg transition-all cursor-pointer ${
                selectedStatus === st
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </Card>

      {/* Articles Content: Table or Grid */}
      {loading ? (
        <Card className="p-8 text-center bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl">
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 mx-auto rounded" />
            <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800/60 mx-auto rounded" />
          </div>
        </Card>
      ) : filteredArticles.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <Newspaper className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Tidak ada artikel yang sesuai
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Coba ganti filter kategori, status, atau kata kunci pencarian Anda.
          </p>
          <Button
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 rounded-lg mt-2 cursor-pointer"
          >
            + Tulis Artikel Baru
          </Button>
        </Card>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium">
                <tr>
                  <th className="px-4 py-3.5">Artikel & Judul</th>
                  <th className="px-4 py-3.5">Kategori</th>
                  <th className="px-4 py-3.5">Penulis</th>
                  <th className="px-4 py-3.5">Tanggal</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center">Statistik</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredArticles.map((art) => (
                  <tr
                    key={art.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Article Title & Cover */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-9 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                          <Image
                            src={art.image}
                            alt={art.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 max-w-xs sm:max-w-md">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 block truncate transition-colors">
                            {art.title}
                          </span>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate block mt-0.5">
                            {art.excerpt}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px]">
                        {art.category}
                      </Badge>
                    </td>

                    {/* Author */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-[9px] flex items-center justify-center shrink-0">
                          {art.authorInitials || "PM"}
                        </div>
                        <div>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 block leading-none">
                            {art.authorName}
                          </span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                            {art.authorRole}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      <span>{formatArticleDate(art.createdAt || (art as any).created_at || art)}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(art)}
                        title="Klik untuk ubah status"
                        className="cursor-pointer"
                      >
                        <Badge
                          className={`text-[10px] font-semibold border ${
                            art.status === "DITAMPILKAN"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                              : art.status === "DRAFT"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          {art.status}
                        </Badge>
                      </button>
                    </td>

                    {/* Views & Likes */}
                    <td className="px-4 py-3 whitespace-nowrap text-center text-zinc-700 dark:text-zinc-300">
                      <div className="flex items-center justify-center gap-2">
                        <span className="flex items-center gap-1 font-mono text-[11px]" title="Dibaca">
                          <Eye className="w-3.5 h-3.5 text-zinc-400" />
                          {art.views || 0}
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="flex items-center gap-1 font-mono text-[11px] text-rose-600 dark:text-rose-400 font-medium" title="Disukai">
                          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                          {art.likes || 0}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenPreview(art)}
                          className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center transition-colors cursor-pointer"
                          title="Lihat Pratinjau"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(art)}
                          className="w-7 h-7 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit Artikel"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingArticle(art);
                            setShowDeleteModal(true);
                          }}
                          className="w-7 h-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                          title="Hapus Artikel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((art) => (
            <Card
              key={art.id}
              className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image Cover */}
                <div className="relative aspect-[16/10] bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <Image
                    src={art.image}
                    alt={art.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <Badge className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-[10px] font-semibold text-blue-600 dark:text-blue-400 border border-zinc-200/60 dark:border-zinc-800">
                      {art.category}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge
                      className={`text-[9px] font-semibold ${
                        art.status === "DITAMPILKAN"
                          ? "bg-emerald-500 text-white"
                          : art.status === "DRAFT"
                          ? "bg-amber-500 text-white"
                          : "bg-zinc-600 text-white"
                      }`}
                    >
                      {art.status}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatArticleDate(art.createdAt || (art as any).created_at || art)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {art.views || 0}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                    {art.title}
                  </h3>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-[9px] flex items-center justify-center">
                    {art.authorInitials || "PM"}
                  </div>
                  <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[110px]">
                    {art.authorName}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenPreview(art)}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
                    title="Pratinjau"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(art)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingArticle(art);
                      setShowDeleteModal(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE / EDIT ARTICLE MODAL */}
      {mounted && showFormModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-5xl h-[92vh] max-h-[92vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* STICKY MODAL HEADER */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-900/60 shadow-xs shrink-0">
                  <Newspaper className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    {editingArticle ? "Sunting Artikel" : "Tulis Artikel Baru"}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
                    Publikasikan gagasan, opini, dan warta kegiatan kader PMII
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Author Pill */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-xs">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {formData.authorName ? formData.authorName.charAt(0).toUpperCase() : "P"}
                  </div>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 max-w-[140px] truncate">
                    {formData.authorName}
                  </span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px] max-w-[130px] truncate">
                    {formData.authorRole}
                  </span>
                  <span title="Penulis terikat akun login">
                    <Lock className="w-3 h-3 text-zinc-400 ml-0.5" />
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* FORM WRAPPER (FLEX-1) */}
            <form onSubmit={handleSaveArticle} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* SCROLLABLE FORM BODY */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                  {/* LEFT COLUMN: Main Writing Canvas (8 Cols on Desktop) */}
                  <div className="lg:col-span-8 space-y-4">
                    {/* Judul Artikel */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <span>Judul Artikel</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <Input
                        type="text"
                        required
                        placeholder="Tuliskan judul artikel yang tajam dan menggugah..."
                        value={formData.title}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            title: newTitle,
                            slug: !editingArticle || !prev.slug ? slugify(newTitle) : prev.slug,
                          }));
                        }}
                        className="h-11 text-sm font-semibold bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                      />
                    </div>

                    {/* Slug URL Artikel */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                          <span>Slug URL Ramah SEO</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, slug: slugify(prev.title) }))}
                          className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Generate Otomatis</span>
                        </button>
                      </div>
                      <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                        <span className="px-3 py-2 text-xs font-mono text-zinc-400 bg-zinc-100/70 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 select-none">
                          pmii.id/artikel/
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="judul-slug-artikel"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                          className="w-full px-3 py-2 text-xs bg-transparent text-zinc-900 dark:text-zinc-100 outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Rich Text Editor */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <span>Isi Lengkap Artikel</span>
                          <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <span className="text-[11px] text-zinc-400 hidden sm:inline">
                          Mendukung judul, tebal, miring, kutipan, tautan & daftar poin
                        </span>
                      </div>
                      <RichTextEditor
                        value={formData.content}
                        onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
                        placeholder="Mulai ketik paragraf, opini, atau liputan kegiatan di sini..."
                        minHeight="340px"
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Sidebar Settings (4 Cols on Desktop) */}
                  <div className="lg:col-span-4 space-y-4">
                    {/* Gambar Sampul (Compact & Sleek) */}
                    <Card className="p-4 bg-zinc-50/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                          <span>Sampul Artikel</span>
                        </label>
                        {formData.image && (
                          <span className="text-[10px] text-zinc-400 font-mono">16:9</span>
                        )}
                      </div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {formData.image ? (
                        <div className="relative group rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-[16/9] w-full bg-zinc-100 dark:bg-zinc-950 shadow-xs">
                          <Image
                            src={formData.image}
                            alt="Sampul Artikel"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="h-7 text-[11px] px-2.5 bg-white hover:bg-zinc-100 text-zinc-900 rounded-md cursor-pointer font-medium"
                            >
                              Ganti
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => setFormData((prev) => ({ ...prev, image: "" }))}
                              className="h-7 text-[11px] px-2.5 rounded-md cursor-pointer font-medium"
                            >
                              Hapus
                            </Button>
                          </div>
                          {/* Mobile quick actions */}
                          <div className="absolute bottom-1.5 right-1.5 flex sm:hidden items-center gap-1">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2 py-0.5 text-[10px] font-bold bg-white text-zinc-900 rounded shadow-xs"
                            >
                              Ganti
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, image: "" }))}
                              className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded shadow-xs"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            isDragging
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                              : "border-zinc-300 dark:border-zinc-700 hover:border-blue-500/60 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40"
                          }`}
                        >
                          <Upload className="w-6 h-6 text-blue-500 mb-1.5" />
                          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Unggah Gambar Sampul
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            PNG, JPG, WebP (Maks. 5MB)
                          </p>
                        </div>
                      )}
                    </Card>

                    {/* Kategori & Tagar */}
                    <Card className="p-4 bg-zinc-50/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3.5">
                      {/* Kategori */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                          Kategori
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full h-9 px-3 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 font-medium cursor-pointer"
                        >
                          {PRESET_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="Lainnya">Lainnya (Kustom)</option>
                        </select>
                        {formData.category === "Lainnya" && (
                          <Input
                            type="text"
                            placeholder="Ketik kategori baru..."
                            value={formData.customCategory}
                            onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                            className="h-8 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                          />
                        )}
                      </div>

                      {/* Tagar */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                          Tagar Artikel
                        </label>
                        <Input
                          type="text"
                          placeholder="Contoh: Aswaja, Kaderisasi, Pemikiran"
                          value={formData.tagsInput}
                          onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                          className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                        <span className="text-[10px] text-zinc-400 block">
                          Pisahkan dengan koma (contoh: Mapaba, NDP)
                        </span>
                      </div>
                    </Card>

                    {/* Info Identitas Penulis */}
                    <Card className="p-3.5 bg-zinc-50/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900">
                          {formData.authorName ? formData.authorName.slice(0, 2).toUpperCase() : "PM"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate block">
                              {formData.authorName}
                            </span>
                            <span title="Identitas terikat dengan akun login">
                              <Lock className="w-3 h-3 text-zinc-400 shrink-0" />
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate block">
                            {formData.authorRole}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>

              {/* STICKY FOOTER ACTION BAR */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-xs shrink-0">
                {/* Status Selector */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Status:
                  </span>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "DITAMPILKAN" | "DRAFT" | "ARSIP",
                      })
                    }
                    className={`h-8.5 px-3 text-xs font-semibold rounded-lg border outline-none cursor-pointer ${
                      formData.status === "DITAMPILKAN"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                        : formData.status === "DRAFT"
                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700"
                    }`}
                  >
                    <option value="DITAMPILKAN">DITAMPILKAN (Langsung Terbit)</option>
                    <option value="DRAFT">DRAFT (Tersimpan Sementara)</option>
                    <option value="ARSIP">ARSIP (Diarsipkan)</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFormModal(false)}
                    className="h-9 text-xs px-4 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs px-5 rounded-xl shadow-md cursor-pointer font-semibold flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingArticle ? "Perbarui Artikel" : "Simpan & Terbitkan"}</span>
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ARTICLE PREVIEW MODAL */}
      {mounted && showPreviewModal && previewArticle && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 flex flex-col">
            {/* Cover Image */}
            <div className="relative aspect-[16/9] w-full bg-zinc-100 dark:bg-zinc-800 shrink-0">
              <Image
                src={previewArticle.image}
                alt={previewArticle.title}
                fill
                className="object-cover"
              />
              <button
                onClick={() => setShowPreviewModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
                aria-label="Tutup pratinjau"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-0.5 px-2">
                    {previewArticle.category}
                  </Badge>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatArticleDate(previewArticle.createdAt || (previewArticle as any).created_at || previewArticle)}
                  </span>
                  <span className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    {previewArticle.likes || 0} Suka
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {previewArticle.title}
                </h2>

                {/* Author Bar */}
                <div className="flex items-center gap-3 py-3 border-y border-zinc-100 dark:border-zinc-800">
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-200 dark:border-blue-900">
                    {previewArticle.authorInitials || "PM"}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                      {previewArticle.authorName}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                      {previewArticle.authorRole}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body Paragraphs with Rich Text Formatting */}
              <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal prose dark:prose-invert max-w-none">
                {Array.isArray(previewArticle.content)
                  ? previewArticle.content.map((p, idx) => (
                      <div key={idx} dangerouslySetInnerHTML={{ __html: p }} />
                    ))
                  : <div dangerouslySetInnerHTML={{ __html: previewArticle.content }} />}
              </div>

              {/* Tags */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Tagar:</span>
                {previewArticle.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-[11px] rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <a
                  href={`/artikel/${previewArticle.slug || previewArticle.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Halaman Baca Publik</span>
                </a>
                <Button
                  onClick={() => setShowPreviewModal(false)}
                  variant="outline"
                  className="text-xs h-9 px-4 rounded-lg cursor-pointer"
                >
                  Tutup Pratinjau
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {mounted && showDeleteModal && deletingArticle && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Hapus Artikel Ini?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Anda yakin ingin menghapus artikel <strong>&quot;{deletingArticle.title}&quot;</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="h-9 text-xs px-4 rounded-lg cursor-pointer"
              >
                Batal
              </Button>
              <Button
                onClick={handleDeleteArticle}
                className="bg-rose-600 hover:bg-rose-700 text-white h-9 text-xs px-4 rounded-lg shadow-xs cursor-pointer"
              >
                Ya, Hapus
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
