import React, { useRef, useState } from "react";
import Image from "next/image";
import {
  Newspaper,
  X,
  Lock,
  Globe,
  RotateCw,
  Upload,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { PRESET_CATEGORIES, slugify } from "./types";
import type { ArticleFormData } from "./types";
import type { Article } from "@/lib/db";

interface ArticleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingArticle: Article | null;
  formData: ArticleFormData;
  setFormData: React.Dispatch<React.SetStateAction<ArticleFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  showToast: (msg: string) => void;
}

export const ArticleFormModal: React.FC<ArticleFormModalProps> = ({
  isOpen,
  onClose,
  editingArticle,
  formData,
  setFormData,
  onSubmit,
  showToast
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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
          image: e.target!.result as string
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

  return (
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
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FORM WRAPPER (FLEX-1) */}
        <form onSubmit={onSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* SCROLLABLE FORM BODY */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
              {/* LEFT COLUMN: Main Writing Canvas */}
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
                        slug: !editingArticle || !prev.slug ? slugify(newTitle) : prev.slug
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

              {/* RIGHT COLUMN: Sidebar Settings */}
              <div className="lg:col-span-4 space-y-4">
                {/* Gambar Sampul */}
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
                    status: e.target.value as "DITAMPILKAN" | "DRAFT" | "ARSIP"
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
                onClick={onClose}
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
    </div>
  );
};
