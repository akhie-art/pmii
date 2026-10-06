"use client";

import React, { useState, useEffect } from "react";
import { Newspaper, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db, DEFAULT_ARTICLES } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useFeedbackModal } from "@/components/ui/feedback-modal";
import type { Article, UserAccount } from "@/lib/db";

import {
  PRESET_CATEGORIES,
  ArticleFormData,
  slugify,
  stripHtml,
  getAuthorDetails
} from "./_components/types";
import { ArticleFilters } from "./_components/ArticleFilters";
import { ArticleTable } from "./_components/ArticleTable";
import { ArticleGrid } from "./_components/ArticleGrid";
import { ArticleFormModal } from "./_components/ArticleFormModal";
import { ArticlePreviewModal } from "./_components/ArticlePreviewModal";
import { ArticleDeleteModal } from "./_components/ArticleDeleteModal";

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

  const { showToast, FeedbackModalComponent } = useFeedbackModal();

  // Form Field States
  const [formData, setFormData] = useState<ArticleFormData>({
    title: "",
    slug: "",
    category: "Kaderisasi",
    customCategory: "",
    content: "",
    authorName: "",
    authorRole: "",
    image: "/image/kaderisasi.jpg",
    tagsInput: "PMII, Kaderisasi, Pergerakan",
    status: "DITAMPILKAN"
  });

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
            authorRole: author.role
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
      status: "DITAMPILKAN"
    });
    setShowFormModal(true);
  };

  // Open Edit Form
  const handleOpenEdit = (article: Article) => {
    setEditingArticle(article);
    const isPresetCat = PRESET_CATEGORIES.includes(article.category);
    const author = getAuthorDetails(currentUser);

    const initialContentHtml = Array.isArray(article.content)
      ? article.content.join("<br/><br/>")
      : article.content || "";

    setFormData({
      title: article.title,
      slug: article.slug || slugify(article.title),
      category: isPresetCat ? article.category : "Lainnya",
      customCategory: isPresetCat ? "" : article.category,
      content: initialContentHtml,
      authorName: article.authorName || author.name,
      authorRole: article.authorRole || author.role,
      image: article.image || "/image/kaderisasi.jpg",
      tagsInput: article.tags?.join(", ") || "",
      status: article.status
    });
    setShowFormModal(true);
  };

  // Save / Update Article
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Judul artikel wajib diisi!");
      return;
    }

    const resolvedCategory =
      formData.category === "Lainnya"
        ? formData.customCategory.trim() || "Kaderisasi"
        : formData.category;

    const resolvedSlug = formData.slug.trim()
      ? slugify(formData.slug)
      : slugify(formData.title);

    const tagsArray = formData.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const rawText = stripHtml(formData.content);
    const autoExcerpt =
      rawText.length > 150 ? rawText.substring(0, 150) + "..." : rawText || formData.title;

    let resolvedImage = formData.image;
    if (resolvedImage.startsWith("data:image/")) {
      try {
        const fileExt = resolvedImage.substring(
          resolvedImage.indexOf("/") + 1,
          resolvedImage.indexOf(";base64")
        );
        const fileName = `article-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const base64Data = resolvedImage.split(",")[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: `image/${fileExt}` });
        const file = new File([blob], fileName, { type: `image/${fileExt}` });

        if (isSupabaseConfigured && supabase) {
          const { error: uploadError } = await supabase.storage.from("articles").upload(fileName, file);
          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage.from("articles").getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) {
              resolvedImage = publicUrlData.publicUrl;
            }
          }
        }
      } catch (uploadErr) {
        console.error("Gagal mengunggah foto sampul ke storage:", uploadErr);
      }
    }

    const initials = formData.authorName
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

    const now = new Date();
    const finalContent = formData.content.trim() ? [formData.content] : [formData.title];

    let updatedList: Article[];

    if (editingArticle) {
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
            updatedAt: now.toISOString()
          };
        }
        return art;
      });
      showToast("Artikel berhasil diperbarui!");
    } else {
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
        updated_at: now.toISOString()
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
      <ArticleFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

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
        <ArticleTable
          articles={filteredArticles}
          onToggleStatus={handleToggleStatus}
          onOpenPreview={handleOpenPreview}
          onOpenEdit={handleOpenEdit}
          onConfirmDelete={(art) => {
            setDeletingArticle(art);
            setShowDeleteModal(true);
          }}
        />
      ) : (
        <ArticleGrid
          articles={filteredArticles}
          onOpenPreview={handleOpenPreview}
          onOpenEdit={handleOpenEdit}
          onConfirmDelete={(art) => {
            setDeletingArticle(art);
            setShowDeleteModal(true);
          }}
        />
      )}

      {/* CREATE / EDIT ARTICLE MODAL */}
      <ArticleFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        editingArticle={editingArticle}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSaveArticle}
        showToast={showToast}
      />

      {/* ARTICLE PREVIEW MODAL */}
      <ArticlePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        article={previewArticle}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <ArticleDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        article={deletingArticle}
        onConfirm={handleDeleteArticle}
      />

      {FeedbackModalComponent}
    </div>
  );
}
