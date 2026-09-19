"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  ArrowRight,
  Sun,
  Moon,
  LogIn,
  UserPlus,
  ShieldCheck,
  Search,
  BookOpen,
  ArrowLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db, DEFAULT_ARTICLES, formatArticleDate } from "@/lib/db";
import type { Article } from "@/lib/db";

const ARTICLE_CATEGORIES = ["Semua", "Kaderisasi", "Opini & Pergerakan", "Tata Kelola"];

export default function SemuaArtikelPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [articles, setArticles] = useState<Article[]>(DEFAULT_ARTICLES);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

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

    db.getArticles()
      .then((data) => {
        if (data && data.length > 0) {
          setArticles(data.filter((a) => a.status === "DITAMPILKAN"));
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil data artikel:", err);
      })
      .finally(() => {
        setLoading(false);
      });
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

  const filteredArticles = articles.filter((art) => {
    const matchCat = selectedCategory === "Semua" || art.category === selectedCategory;
    const matchSearch =
      searchQuery.trim() === "" ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

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
      <main className="flex-1 py-10 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl space-y-10">
          {/* Header Section */}
          <div className="space-y-4 max-w-3xl">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </Link>

            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2">
              Kabar & Opini Pergerakan
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Artikel, Kajian & Warta Resmi
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Kumpulan tulisan ilmiah, pemikiran kritis kader, diskursus Aswaja, serta kabar pergerakan resmi Pengurus Komisariat PMII Ki Ageng Getas Pendawa.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
            {/* Category tabs */}
            <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
              {ARTICLE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Cari judul, tagar, atau penulis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
              />
            </div>
          </div>

          {/* Articles Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <BookOpen className="w-10 h-10 mx-auto text-zinc-400" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Tidak ada artikel yang ditemukan
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Coba sesuaikan kata kunci pencarian atau pilih kategori lain.
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="text-xs h-8 px-3 rounded-lg mt-2"
                >
                  Reset Pencarian
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredArticles.map((art) => (
                <Link
                  key={art.id}
                  href={`/artikel/${art.slug || art.id}`}
                  className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xl dark:hover:shadow-zinc-950/50 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Article Image Container */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      <Image
                        src={art.image}
                        alt={art.title}
                        width={800}
                        height={500}
                        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-3 left-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-[10px] font-semibold text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md border border-zinc-200/60 dark:border-zinc-800 shadow-xs">
                        {art.category}
                      </span>
                    </div>

                    {/* Article Body */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatArticleDate(art.createdAt || (art as any).created_at || art)}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                        {art.title}
                      </h3>

                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                        {art.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Author + Read Link */}
                  <div className="px-5 pb-5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center justify-center border border-blue-200 dark:border-blue-900">
                        {art.authorInitials || "PM"}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 block leading-tight">
                          {art.authorName}
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
                          {art.authorRole}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Baca
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-8 transition-colors duration-200">
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
