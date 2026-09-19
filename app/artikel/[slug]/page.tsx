"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  Eye,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Sun,
  Moon,
  LogIn,
  UserPlus,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Sparkles,
  Heart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db, DEFAULT_ARTICLES, formatArticleDate } from "@/lib/db";
import type { Article } from "@/lib/db";

export default function BacaArtikelPage() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = params?.slug as string;

  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Like Article State
  const [articleLikes, setArticleLikes] = useState(0);
  const [isArticleLiked, setIsArticleLiked] = useState(false);

  // Sync theme
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("PMII_THEME");
      if (savedTheme) {
        setDarkMode(savedTheme === "dark");
      } else {
        setDarkMode(document.documentElement.classList.contains("dark"));
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("PMII_THEME", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("PMII_THEME", "light");
    }
  }, [darkMode, mounted]);

  // Fetch article by slug or id
  useEffect(() => {
    if (!rawSlug) return;
    const decodedSlug = decodeURIComponent(rawSlug);

    const loadArticle = async () => {
      setLoading(true);
      try {
        const allArticles = await db.getArticles();
        const articlesPool = allArticles && allArticles.length > 0 ? allArticles : DEFAULT_ARTICLES;

        // Find match by slug or id
        const found = articlesPool.find(
          (a) => a.slug === decodedSlug || a.id === decodedSlug || a.slug === rawSlug || a.id === rawSlug
        );

        if (found) {
          setArticle(found);
          setArticleLikes(found.likes || 0);

          // Check if already liked from localStorage
          if (typeof window !== "undefined") {
            const likedList = JSON.parse(localStorage.getItem("PMII_LIKED_ARTICLES") || "[]");
            if (likedList.includes(found.id)) {
              setIsArticleLiked(true);
            }
          }

          // Get related articles
          const others = articlesPool
            .filter((a) => a.id !== found.id && a.status === "DITAMPILKAN")
            .sort((a, b) => {
              if (a.category === found.category && b.category !== found.category) return -1;
              if (b.category === found.category && a.category !== found.category) return 1;
              return 0;
            })
            .slice(0, 3);
          setRelatedArticles(others);

          // Increment view counter once per load in background
          const updatedArticles = articlesPool.map((item) =>
            item.id === found.id ? { ...item, views: (item.views || 0) + 1 } : item
          );
          db.saveArticles(updatedArticles).catch(() => {});
        } else {
          setArticle(null);
        }
      } catch (err) {
        console.error("Gagal memuat artikel:", err);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [rawSlug]);

  const handleToggleLikeArticle = async () => {
    if (!article) return;

    if (isArticleLiked) {
      // Unlike
      const nextLikes = Math.max(0, articleLikes - 1);
      setArticleLikes(nextLikes);
      setIsArticleLiked(false);
      if (typeof window !== "undefined") {
        const likedList = JSON.parse(localStorage.getItem("PMII_LIKED_ARTICLES") || "[]");
        const filtered = likedList.filter((id: string) => id !== article.id);
        localStorage.setItem("PMII_LIKED_ARTICLES", JSON.stringify(filtered));
      }
      try {
        const allArticles = await db.getArticles();
        const updated = allArticles.map((a) => (a.id === article.id ? { ...a, likes: nextLikes } : a));
        await db.saveArticles(updated);
      } catch {
        // ignore
      }
    } else {
      // Like
      const nextLikes = articleLikes + 1;
      setArticleLikes(nextLikes);
      setIsArticleLiked(true);
      if (typeof window !== "undefined") {
        const likedList = JSON.parse(localStorage.getItem("PMII_LIKED_ARTICLES") || "[]");
        if (!likedList.includes(article.id)) {
          likedList.push(article.id);
          localStorage.setItem("PMII_LIKED_ARTICLES", JSON.stringify(likedList));
        }
      }
      try {
        await db.likeArticle(article.id);
      } catch {
        // ignore
      }
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWA = () => {
    if (typeof window !== "undefined" && article) {
      const text = encodeURIComponent(`*${article.title}*\n\nBaca selengkapnya di Portal PMII:\n${window.location.href}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
  };

  const handleShareTwitter = () => {
    if (typeof window !== "undefined" && article) {
      const text = encodeURIComponent(`"${article.title}" oleh ${article.authorName} di Portal PMII:`);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 flex flex-col justify-between font-sans transition-colors duration-200 selection:bg-blue-600 selection:text-white">
      {/* 1. TOP NAVBAR */}
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
        <div className="container mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-xs tracking-wider shrink-0">
              PMII
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[11px] sm:text-sm tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                PK PMII KI AGENG GETAS PENDAWA
              </span>
              <span className="hidden md:block text-[10px] text-zinc-500 dark:text-zinc-400 font-medium tracking-wide mt-0.5">
                Portal Resmi Kaderisasi & Tata Kelola
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* DARK / LIGHT MODE TOGGLE */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Beralih ke Mode Terang (Light Mode)" : "Beralih ke Mode Gelap (Dark Mode)"}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer"
              aria-label="Toggle theme"
            >
              {mounted && darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-blue-600" />
              )}
            </button>

            <Link
              href="/register"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Daftar Anggota</span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="sm:hidden">Masuk</span>
              <span className="hidden sm:inline">Masuk Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          {/* Top Breadcrumb & Navigation */}
          <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
            <nav className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 overflow-x-auto whitespace-nowrap">
              <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1">
                Beranda
              </Link>
              <ChevronRight className="w-3 h-3 shrink-0" />
              <Link href="/artikel" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Artikel
              </Link>
              {article && (
                <>
                  <ChevronRight className="w-3 h-3 shrink-0" />
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[200px] sm:max-w-xs">
                    {article.category}
                  </span>
                </>
              )}
            </nav>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="h-8 text-xs px-3 rounded-lg flex items-center gap-1.5 shrink-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </Button>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-6 animate-pulse">
              <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              <div className="h-10 w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              <div className="aspect-[16/9] w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
              <div className="space-y-3 pt-4">
                <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          )}

          {/* Not Found */}
          {!loading && !article && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                <BookOpen className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Artikel Tidak Ditemukan
              </h2>
              <p className="text-sm text-zinc-500 max-w-md mx-auto">
                Artikel yang Anda cari mungkin telah diarsipkan, dihapus, atau tautan yang Anda tuju salah.
              </p>
              <div className="pt-2">
                <Link href="/artikel">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 h-9 rounded-xl">
                    Jelajahi Artikel Lainnya
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Full Article Content */}
          {!loading && article && (
            <article className="space-y-8">
              {/* Header Info */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-xs font-semibold py-1 px-3 rounded-md uppercase tracking-wider">
                    {article.category}
                  </Badge>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatArticleDate(article.createdAt || (article as any).created_at || article)}
                  </span>
                  {article.views !== undefined && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {article.views} kali dibaca
                    </span>
                  )}
                  <span className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    {articleLikes} suka
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-[1.2]">
                  {article.title}
                </h1>

                {/* Author Info & Share Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center border border-blue-200 dark:border-blue-900 shrink-0 shadow-xs">
                      {article.authorInitials || "PM"}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <span>{article.authorName}</span>
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800 font-semibold">
                          Penulis
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-0.5">
                        {article.authorRole} • PK PMII Ki Ageng Getas Pendawa
                      </span>
                    </div>
                  </div>

                  {/* Top Share buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                      title="Salin Tautan Artikel"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Tersalin!" : "Salin Link"}</span>
                    </button>
                    <button
                      onClick={handleShareWA}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                      title="Bagikan ke WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={handleShareTwitter}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                      title="Bagikan ke X (Twitter)"
                    >
                      <span>X</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Featured Cover Image */}
              <div className="relative aspect-[16/9] w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 shadow-md">
                <Image
                  src={article.image}
                  alt={article.title}
                  width={1200}
                  height={675}
                  priority
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Main Article Body */}
              <div className="pt-2">
                <div className="text-zinc-800 dark:text-zinc-200 text-base sm:text-lg leading-relaxed sm:leading-loose space-y-5 font-normal">
                  {Array.isArray(article.content) ? (
                    article.content.map((paragraph, idx) => (
                      <div
                        key={idx}
                        className="space-y-4 [&_p]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-600 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-600 dark:[&_blockquote]:text-zinc-400"
                        dangerouslySetInnerHTML={{ __html: paragraph }}
                      />
                    ))
                  ) : (
                    <div
                      className="space-y-4 [&_p]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-600 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-600 dark:[&_blockquote]:text-zinc-400"
                      dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                  )}
                </div>
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mr-1">
                    Tagar Pembahasan:
                  </span>
                  {article.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* INTERACTIVE LIKE & ENGAGEMENT BAR */}
              <div className="py-6 px-5 sm:px-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
                  {/* Like Button */}
                  <button
                    onClick={handleToggleLikeArticle}
                    className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${
                      isArticleLiked
                        ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
                        : "bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 transition-transform ${
                        isArticleLiked ? "fill-rose-500 text-rose-500 scale-110" : ""
                      }`}
                    />
                    <span>{isArticleLiked ? "Disukai" : "Sukai Artikel"}</span>
                    <span className="bg-white/80 dark:bg-zinc-900/80 px-2 py-0.5 rounded-full text-[11px] font-bold border border-zinc-200 dark:border-zinc-700">
                      {articleLikes}
                    </span>
                  </button>
                </div>

                {/* Share Quick Links */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                  <span className="text-xs text-zinc-400 mr-1 hidden md:inline">Bagikan:</span>
                  <Button
                    onClick={handleShareWA}
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs px-3 rounded-lg border-emerald-300 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1" />
                    WhatsApp
                  </Button>
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs px-3 rounded-lg cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copied ? "Tersalin" : "Salin Link"}
                  </Button>
                </div>
              </div>

              {/* Author Biography Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-lg flex items-center justify-center border border-blue-200 dark:border-blue-900 shrink-0">
                  {article.authorInitials || "PM"}
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Tentang Penulis
                  </span>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {article.authorName}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Menjabat sebagai {article.authorRole} di Pengurus Komisariat PMII Ki Ageng Getas Pendawa. Aktif menulis kajian ilmiah, opini sosial politik, dan penguatan kaderisasi Aswaja.
                  </p>
                </div>
              </div>

              {/* Share Banner Footer */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-zinc-900 border border-blue-100 dark:border-blue-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Menemukan inspirasi dari tulisan ini?
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    Bagikan wawasan dan gagasan ini ke grup kader atau jejaring sahabat Anda.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={handleShareWA}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 rounded-xl cursor-pointer"
                  >
                    Bagikan WhatsApp
                  </Button>
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="text-xs h-9 px-3 rounded-xl cursor-pointer"
                  >
                    {copied ? "Tersalin!" : "Salin Tautan"}
                  </Button>
                </div>
              </div>

              {/* Related Articles Section */}
              {relatedArticles.length > 0 && (
                <section className="pt-10 border-t border-zinc-200 dark:border-zinc-800 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        Artikel & Opini Lainnya
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Lanjutkan membaca wawasan pergerakan dan telaah kader lainnya.
                      </p>
                    </div>
                    <Link
                      href="/artikel"
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>Lihat Semua</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {relatedArticles.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/artikel/${rel.slug || rel.id}`}
                        className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                            <Image
                              src={rel.image}
                              alt={rel.title}
                              width={600}
                              height={375}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <span className="absolute top-2.5 left-2.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-[9px] font-semibold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded shadow-xs">
                              {rel.category}
                            </span>
                          </div>
                          <div className="p-4 space-y-2">
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                              <span>{formatArticleDate(rel.createdAt || (rel as any).created_at || rel)}</span>
                            </div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                              {rel.title}
                            </h4>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                              {rel.excerpt}
                            </p>
                          </div>
                        </div>

                        <div className="px-4 pb-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                          <span className="text-zinc-500 dark:text-zinc-400 text-[11px] truncate max-w-[130px]">
                            {rel.authorName}
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Baca
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </article>
          )}
        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-8 transition-colors duration-200 mt-12">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              PK PMII Ki Ageng Getas Pendawa
            </span>
            <span className="hidden sm:inline text-zinc-400">•</span>
            <span>© 2026 Hak cipta dilindungi.</span>
          </div>

          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Masuk
            </Link>
            <span>•</span>
            <Link href="/register" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Pendaftaran
            </Link>
            <span>•</span>
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Portal Terverifikasi</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
