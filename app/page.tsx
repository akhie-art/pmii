"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  Users,
  FolderOpen,
  CheckCircle2,
  LogIn,
  Sun,
  Moon,
  ArrowRight,
  UserPlus,
  Award,
  BookOpen,
  Search,
  Sparkles,
  FileText,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Clock,
  Building,
  Check,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { db, DEFAULT_ARTICLES, formatArticleDate } from "@/lib/db";
import type { CadreFollowUp, Article } from "@/lib/db";

const HERO_SLIDES = [
  {
    id: 1,
    titlePrefix: "Mari Tumbuh & Berdaya Bersama",
    highlight: "Ayo Gabung PK PMII Ki Ageng Getas Pendawa!",
    description: "Temukan ruang terbaik untuk belajar, mengasah kepemimpinan, dan berjuang bersama ribuan sahabat mahasiswa berlandaskan Ahlussunnah wal Jama'ah.",
    badges: [
      { icon: ShieldCheck, label: "Wadah Pengembangan Diri Mahasiswa", color: "text-blue-600 dark:text-blue-400" },
      { icon: Users, label: "Jejaring Sahabat Seluruh Indonesia", color: "text-indigo-600 dark:text-indigo-400" },
      { icon: Sparkles, label: "Aktualisasi & Pengabdian Nyata", color: "text-amber-500" },
    ],
    image: "/image/landing_page.png",
    imageAlt: "Kader PK PMII Ki Ageng Getas Pendawa",
  },
  {
    id: 2,
    titlePrefix: "Asah Potensi Kepemimpinanmu",
    highlight: "Jadilah Kader Kritis & Ulul Albab",
    description: "Melalui Mapaba dan pelatihan berjenjang, temukan jati dirimu sebagai intelektual muda yang mandiri, kritis, dan berakhlak mulia di kampus.",
    badges: [
      { icon: GraduationCap, label: "Kaderisasi Formal & Pelatihan Rutin", color: "text-blue-600 dark:text-blue-400" },
      { icon: Award, label: "Mentoring Sahabat Senior & Alumni", color: "text-amber-500" },
      { icon: CheckCircle2, label: "Ruang Diskusi & Kajian Kritis", color: "text-emerald-600 dark:text-emerald-400" },
    ],
    image: "/image/kaderisasi.jpg",
    imageAlt: "Kaderisasi dan Kepemimpinan PMII",
  },
  {
    id: 3,
    titlePrefix: "Keluarga Besar Pergerakan Mahasiswa",
    highlight: "Saatnya Melangkah & Berkontribusi Nyata",
    description: "Jadikan masa perkuliahanmu lebih bermakna. Bersama PMII, satukan ide, aksi sosial, dan karya nyata untuk kampus dan peradaban bangsa.",
    badges: [
      { icon: Sparkles, label: "Aksi Sosial & Advokasi Mahasiswa", color: "text-amber-500" },
      { icon: ShieldCheck, label: "Legalitas & Pengakuan Resmi", color: "text-blue-600 dark:text-blue-400" },
      { icon: Clock, label: "Pintu Terbuka untuk Seluruh Mahasiswa", color: "text-indigo-600 dark:text-indigo-400" },
    ],
    image: "/image/administrasi.jpg",
    imageAlt: "Administrasi Persuratan dan Verifikasi Digital PMII",
  },
];

const ARTICLE_CATEGORIES = ["Semua", "Kaderisasi", "Opini & Pergerakan", "Tata Kelola"];

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [cadres, setCadres] = useState<CadreFollowUp[]>([]);

  // Hero Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  // Article Section State
  const [articles, setArticles] = useState<Article[]>(DEFAULT_ARTICLES);
  const [selectedArticleCategory, setSelectedArticleCategory] = useState<string>("Semua");

  // Quick Verification State
  const [verifyQuery, setVerifyQuery] = useState("");
  const [verifyResult, setVerifyResult] = useState<CadreFollowUp | null | "NOT_FOUND">(null);
  const [isVerifying, setIsVerifying] = useState(false);

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

    db.getCadres().then((data) => {
      setCadres(data);
    }).catch((err) => {
      console.error("Failed to fetch cadres count:", err);
    });

    db.getArticles().then((arts) => {
      if (arts && arts.length > 0) {
        setArticles(arts.filter((a) => a.status === "DITAMPILKAN"));
      }
    }).catch((err) => {
      console.error("Failed to fetch articles:", err);
    });
  }, []);

  // Hero Carousel Autoplay
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setSlideDirection(1);
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handlePrevSlide = () => {
    setSlideDirection(-1);
    setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setSlideDirection(1);
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const handleSelectSlide = (index: number) => {
    setSlideDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

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

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyQuery.trim()) return;

    setIsVerifying(true);
    setTimeout(() => {
      const query = verifyQuery.trim().toLowerCase();
      const match = cadres.find(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.id.toLowerCase() === query ||
          (c.rayon && c.rayon.toLowerCase().includes(query))
      );

      setVerifyResult(match || "NOT_FOUND");
      setIsVerifying(false);
    }, 400);
  };

  const features = [
    {
      title: "Manajemen Kaderisasi",
      desc: "Pemetaan database anggota dan pemantauan jenjang kaderisasi (MAPABA, PKD, PKL) secara terpadu.",
      icon: Users,
      badge: "Kaderisasi",
      href: "/login"
    },
    {
      title: "Administrasi & Persuratan",
      desc: "Pencatatan persuratan resmi berbasis format penomoran surat otomatis standar PMII nasional.",
      icon: Mail,
      badge: "Administrasi",
      href: "/login"
    },
    {
      title: "Arsip Digital & Pustaka",
      desc: "Bank materi keilmuan, modul kurikulum kaderisasi, silabus, dan dokumentasi legalitas organisasi.",
      icon: FolderOpen,
      badge: "Dokumen",
      href: "/login"
    },
    {
      title: "Verifikasi RKTL & Sertifikat",
      desc: "Validasi laporan tindak lanjut paska-pelatihan dan sertifikasi kelulusan kader pergerakan.",
      icon: CheckCircle2,
      badge: "Sertifikasi",
      href: "/login"
    }
  ];

  const steps = [
    {
      step: "01",
      title: "MAPABA",
      subtitle: "Masa Penerimaan Anggota Baru",
      desc: "Gerbang awal pengenalan ideologi Ahlussunnah wal Jama'ah (Aswaja), Nilai Dasar Pergerakan (NDP), dan ke-PMII-an.",
      icon: GraduationCap,
      color: "blue"
    },
    {
      step: "02",
      title: "PKD",
      subtitle: "Pelatihan Kader Dasar",
      desc: "Penguatan militansi ideologis, kepemimpinan transformatif, analisis sosial kritis, dan wacana kebangsaan.",
      icon: Award,
      color: "emerald"
    },
    {
      step: "03",
      title: "PKL",
      subtitle: "Pelatihan Kader Lanjut",
      desc: "Pengembangan kapasitas analisis strategis, perumusan gagasan peradaban, dan kepemimpinan gerakan transformatif.",
      icon: BookOpen,
      color: "purple"
    },
    {
      step: "04",
      title: "RKTL & Sertifikasi",
      subtitle: "Rencana Kerja Tindak Lanjut",
      desc: "Pelaksanaan tugas pengabdian, penulisan resume karya ilmiah, verifikasi instruktur, dan penerbitan sertifikat resmi.",
      icon: CheckCircle2,
      color: "amber"
    }
  ];

  const displayCadresCount = cadres.length > 0 ? cadres.length : 1250;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 flex flex-col justify-between font-sans transition-colors duration-200 selection:bg-blue-600 selection:text-white">
      
      {/* 1. TOP NAVBAR */}
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
        <div className="container mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white border border-zinc-200/80 dark:border-zinc-700/80 p-1 flex items-center justify-center shadow-xs shrink-0">
              <Image
                src="/image/logo_komsat.png"
                alt="Logo PK PMII Ki Ageng Getas Pendawa"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
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
            {/* DARK / LIGHT MODE TOGGLE BUTTON */}
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

      {/* 2. HERO SECTION CAROUSEL */}
      <section
        className="relative pt-6 pb-10 sm:pt-14 sm:pb-16 md:pt-16 md:pb-20 overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Subtle Background Glow Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/10 dark:bg-blue-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative">
          <AnimatePresence mode="wait" custom={slideDirection}>
            <motion.div
              key={currentSlide}
              custom={slideDirection}
              initial={{ opacity: 0, x: slideDirection > 0 ? 30 : -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDirection > 0 ? -30 : 30 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center"
            >
              {/* Left Column: Headline, Subheading, Trust Badges */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-center lg:text-left">
                {/* Main Headline */}
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.18] sm:leading-[1.15] text-zinc-900 dark:text-zinc-100 min-h-[70px] sm:min-h-[110px] lg:min-h-[145px] flex flex-col justify-center">
                  <span>{HERO_SLIDES[currentSlide].titlePrefix}</span>
                  <span className="block mt-1.5 sm:mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-300 bg-clip-text text-transparent">
                    {HERO_SLIDES[currentSlide].highlight}
                  </span>
                </h1>

                {/* Subheading */}
                <p className="text-xs sm:text-sm md:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed min-h-[38px] sm:min-h-[48px]">
                  {HERO_SLIDES[currentSlide].description}
                </p>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-3 pt-1 sm:pt-2">
                  {HERO_SLIDES[currentSlide].badges.map((badge, idx) => {
                    const IconComponent = badge.icon;
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100/90 dark:bg-zinc-800/90 px-2.5 py-1 rounded-full border border-zinc-200/70 dark:border-zinc-700/70 shadow-2xs"
                      >
                        <IconComponent className={`w-3.5 h-3.5 ${badge.color} shrink-0`} />
                        <span>{badge.label}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Hero Image */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end mt-1 lg:mt-0">
                <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-none group">
                  {/* Glow behind image */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-md sm:blur-lg opacity-25 group-hover:opacity-40 transition duration-500" />
                  <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-900 aspect-[3/2]">
                    <Image
                      src={HERO_SLIDES[currentSlide].image}
                      alt={HERO_SLIDES[currentSlide].imageAlt}
                      width={1536}
                      height={1024}
                      priority
                      className="w-full h-full object-cover transform transition duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Controls: Slide Indicators & Prev/Next Buttons */}
          <div className="flex items-center justify-between pt-4 sm:pt-8 border-t border-zinc-100 dark:border-zinc-800/60 mt-4 sm:mt-8">
            {/* Slide Indicators */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {HERO_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => handleSelectSlide(idx)}
                  className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlide === idx
                      ? "w-7 sm:w-8 bg-blue-600 dark:bg-blue-500"
                      : "w-2 sm:w-2.5 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Prev / Next Navigation Arrows */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handlePrevSlide}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                aria-label="Slide sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextSlide}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                aria-label="Slide berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STATS SECTION */}
      <section className="border-y border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 py-6 sm:py-10 transition-colors">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            <div className="p-3.5 sm:p-5 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60 text-center space-y-1">
              <span className="text-xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tracking-tight block">
                {displayCadresCount}+
              </span>
              <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 font-medium">Kader Terdata</p>
            </div>
            <div className="p-3.5 sm:p-5 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60 text-center space-y-1">
              <span className="text-xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight block">
                3 Jenjang
              </span>
              <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 font-medium">MAPABA, PKD & PKL</p>
            </div>
            <div className="p-3.5 sm:p-5 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60 text-center space-y-1">
              <span className="text-xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tracking-tight block">
                100%
              </span>
              <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 font-medium">Arsip Digital Terpusat</p>
            </div>
            <div className="p-3.5 sm:p-5 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60 text-center space-y-1">
              <span className="text-xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tracking-tight block">
                Terpadu
              </span>
              <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 font-medium">Komisariat & Rayon</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ALUR KADERISASI FORMAL PMII */}
      <section className="py-16 md:py-24 container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2">
            Kurikulum Nasional
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Alur Kaderisasi Formal Pergerakan
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Tahapan pembinaan berjenjang untuk melahirkan kader mujahid yang berintelektual, militan, dan berakhlak mulia.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={idx}
                className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-zinc-400">
                      {item.step}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </h3>
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block mt-0.5">
                      {item.subtitle}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 5. FITUR LAYANAN UTAMA */}
      <section className="py-16 md:py-24 bg-zinc-100/60 dark:bg-zinc-900/40 border-y border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2">
              Modul Terintegrasi
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Layanan Tata Kelola Digital
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Memodernisasi kerja-kerja organisasi dengan sistem yang terpadu, aman, dan mudah diakses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <Card
                  key={i}
                  className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 text-[10px] font-medium">
                        {feat.badge}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1.5">
                        {feat.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-medium">
                    <span>Buka modul</span>
                    <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. SECTION ARTIKEL & OPINI PERGERAKAN */}
      <section className="py-16 md:py-24 container mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="space-y-3 max-w-xl">
            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2">
              Kabar & Opini Pergerakan
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Artikel & Wawasan Terbaru
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Kumpulan tulisan ilmiah, pemikiran kader, serta kabar pergerakan resmi PK PMII Ki Ageng Getas Pendawa.
            </p>
          </div>

          {/* Category Filter Tabs & View All */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-auto overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
              {ARTICLE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedArticleCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedArticleCategory === cat
                      ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <Link
              href="/artikel"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1.5"
            >
              <span>Semua Artikel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {articles
            .filter((art) => selectedArticleCategory === "Semua" || art.category === selectedArticleCategory)
            .map((art) => (
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
      </section>

      {/* 7. QUICK VERIFICATION WIDGET */}
      <section className="py-16 md:py-24 container mx-auto px-4 sm:px-6">
        <div className="max-w-xl mx-auto text-center space-y-3 mb-8">
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2">
            Verifikasi Mandiri
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Cek Validitas Status Anggota
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Masukkan nama lengkap kader untuk memverifikasi keaktifan dan jenjang kaderisasi di database resmi.
          </p>
        </div>

        <Card className="max-w-xl mx-auto p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none">
          <form onSubmit={handleVerify} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Ketik nama kader (cth: Ahmad)..."
                value={verifyQuery}
                onChange={(e) => setVerifyQuery(e.target.value)}
                className="pl-9 h-10 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <Button
              type="submit"
              disabled={isVerifying || !verifyQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-10 px-4 rounded-lg cursor-pointer shrink-0"
            >
              {isVerifying ? "Mengecek..." : "Verifikasi"}
            </Button>
          </form>

          {/* Verification Result Area */}
          <AnimatePresence>
            {verifyResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-left"
              >
                {verifyResult === "NOT_FOUND" ? (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Data anggota tidak ditemukan dalam database resmi komisariat. Silakan periksa ejaan nama.</span>
                  </div>
                ) : (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Terverifikasi Resmi
                      </span>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-none text-[9px]">
                        Status: {verifyResult.status}
                      </Badge>
                    </div>
                    <div className="text-zinc-700 dark:text-zinc-300 pt-1">
                      <div className="font-semibold text-sm">{verifyResult.name}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Jenjang: <strong className="text-zinc-800 dark:text-zinc-200">{verifyResult.level}</strong> • {verifyResult.commissariat}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </section>

      {/* 7. CLOSING CALL TO ACTION BANNER */}
      <section className="py-16 container mx-auto px-4 sm:px-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 sm:p-12 text-center relative overflow-hidden shadow-none">
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Siap Berproses & Mengabdi Bersama Pergerakan?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Daftarkan diri Anda sebagai kader pergerakan mahasiswa Islam Indonesia atau masuk ke portal untuk mengakses sistem informasi organisasi.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Daftar Kader Sekarang</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
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
