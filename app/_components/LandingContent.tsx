"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Floaty } from "./Floaty";
import {
  ShieldCheck,
  Mail,
  Users,
  CheckCircle2,
  LogIn,
  Sun,
  Moon,
  ArrowRight,
  ArrowUpRight,
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
  Building2,
  Calendar,
  Lock,
  Menu,
  X,
  FileCheck,
  Layers,
  Check,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db, formatArticleDate } from "@/lib/db";
import type { Article } from "@/lib/db";
import { getKomisariatSlug } from "@/lib/tenancy";
import { DEFAULT_COMMISSARIATS } from "@/lib/services/defaults";
import type { CommissariatList } from "@/lib/services/types";

interface PublicVerifiedCadre {
  name: string;
  level: string;
  commissariat: string;
  status: string;
}

const ARTICLE_CATEGORIES = ["Semua", "Kaderisasi", "Opini & Pergerakan", "Tata Kelola"];

const NAV_ITEMS = [
  { id: "komisariat", label: "Komisariat", href: "#komisariat" },
  { id: "alur", label: "Alur Kaderisasi", href: "#alur" },
  { id: "layanan", label: "Layanan Digital", href: "#layanan" },
  { id: "artikel", label: "Warta & Opini", href: "#artikel" },
  { id: "verifikasi", label: "Verifikasi Anggota", href: "#verifikasi" },
];

export function LandingContent() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);

  // Navbar: glass background after scrolling + close mobile menu with Escape
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Database States
  const [cadresCount, setCadresCount] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

  // Commissariat Directory State
  const [komisariats, setKomisariats] = useState<CommissariatList[]>(
    DEFAULT_COMMISSARIATS.filter(
      (k) =>
        k.level !== "CABANG" &&
        !k.name.toLowerCase().includes("cabang") &&
        k.id !== "f9fd547e-117e-4d39-b8cc-2ff9a818a8d9"
    )
  );
  const [komisariatQuery, setKomisariatQuery] = useState("");
  const [brokenLogos, setBrokenLogos] = useState<Record<string, boolean>>({});

  // Article Section State
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState<boolean>(true);
  const [selectedArticleCategory, setSelectedArticleCategory] = useState<string>("Semua");

  // Quick Verification State
  const [verifyQuery, setVerifyQuery] = useState("");
  const [verifyResults, setVerifyResults] = useState<PublicVerifiedCadre[] | "NOT_FOUND" | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDarkMode(document.documentElement.classList.contains("dark"));

    // 1. Load accurate cadre count from DB
    db.getCadres([])
      .then((cadres) => {
        if (Array.isArray(cadres)) {
          setCadresCount(cadres.length);
        }
      })
      .catch(() => {
        fetch("/api/public-stats")
          .then((res) => res.json())
          .then((data) => {
            if (data && typeof data.cadresCount === "number") {
              setCadresCount(data.cadresCount);
            }
          })
          .catch(() => {});
      })
      .finally(() => {
        setIsLoadingStats(false);
      });

    // 2. Load published articles
    setIsLoadingArticles(true);
    db.getArticles()
      .then((arts) => {
        setArticles(Array.isArray(arts) ? arts.filter((a) => a.status === "DITAMPILKAN") : []);
      })
      .catch(() => {
        setArticles([]);
      })
      .finally(() => {
        setIsLoadingArticles(false);
      });

    // 3. Load commissariats
    db.getCommissariats(DEFAULT_COMMISSARIATS)
      .then((list) => {
        if (Array.isArray(list)) {
          const filtered = list.filter(
            (k) =>
              k.level !== "CABANG" &&
              !k.name.toLowerCase().includes("cabang") &&
              k.id !== "f9fd547e-117e-4d39-b8cc-2ff9a818a8d9"
          );
          if (filtered.length > 0) {
            setKomisariats(filtered);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Scroll Spy for Active Navigation Highlight
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      let current = "";
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            current = item.id;
            break;
          }
        }
      }
      setActiveSection((prev) => current || (window.scrollY < 400 ? "" : prev));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("PMII_THEME", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("PMII_THEME", "light");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = verifyQuery.trim();
    if (!query || query.length < 2) return;

    setIsVerifying(true);
    setVerifyResults(null);

    try {
      const res = await fetch(`/api/verify-cadre?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok && data.found) {
        if (Array.isArray(data.results) && data.results.length > 0) {
          setVerifyResults(data.results);
        } else if (data.cadre) {
          setVerifyResults([data.cadre]);
        } else {
          setVerifyResults("NOT_FOUND");
        }
      } else {
        const localCadres = await db.getCadres([]);
        const qLower = query.toLowerCase();
        const matches = localCadres
          .filter(
            (c: any) =>
              (c.name && String(c.name).toLowerCase().includes(qLower)) ||
              (c.nim && String(c.nim).toLowerCase().includes(qLower))
          )
          .slice(0, 5)
          .map((m: any) => ({
            name: m.name,
            level: m.level || "Anggota",
            commissariat: m.commissariat || "PC PMII Grobogan",
            status: m.status || "Aktif",
          }));

        if (matches.length > 0) {
          setVerifyResults(matches);
        } else {
          setVerifyResults("NOT_FOUND");
        }
      }
    } catch {
      setVerifyResults("NOT_FOUND");
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredKomisariats = useMemo(() => {
    const q = komisariatQuery.trim().toLowerCase();
    if (!q) return komisariats;
    return komisariats.filter((k) => {
      const name = (k.name || "").toLowerCase();
      const campus = (k.university || (k as any).campusName || "").toLowerCase();
      return name.includes(q) || campus.includes(q);
    });
  }, [komisariats, komisariatQuery]);

  const filteredArticles = useMemo(() => {
    return articles.filter(
      (art) => selectedArticleCategory === "Semua" || art.category === selectedArticleCategory
    );
  }, [articles, selectedArticleCategory]);

  const totalRayons = useMemo(() => {
    return komisariats.reduce(
      (acc, k) => acc + (Array.isArray(k.rayons) ? k.rayons.length : 0),
      0
    );
  }, [komisariats]);

  const steps = [
    {
      step: "01",
      title: "MAPABA",
      subtitle: "Masa Penerimaan Anggota Baru",
      output: "Status: Anggota Mu'takid",
      desc: "Orientasi pengenalan ideologi Ahlussunnah wal Jama'ah (Aswaja), Nilai Dasar Pergerakan (NDP), dan ke-PMII-an di tingkat komisariat/rayon.",
      icon: GraduationCap,
    },
    {
      step: "02",
      title: "PKD",
      subtitle: "Pelatihan Kader Dasar",
      output: "Status: Kader Mujahid",
      desc: "Penguatan komitmen ideologis, kepemimpinan organisasi, analisis sosial kritis, serta pemetaan gerakan mahasiswa.",
      icon: Award,
    },
    {
      step: "03",
      title: "PKL",
      subtitle: "Pelatihan Kader Lanjut",
      output: "Status: Kader Mujtahid",
      desc: "Pengembangan kapasitas analisis strategis, advokasi kebijakan publik, dan kepemimpinan gerakan tingkat cabang/nasional.",
      icon: BookOpen,
    },
    {
      step: "04",
      title: "RKTL & Sertifikasi",
      subtitle: "Rencana Kerja Tindak Lanjut",
      output: "Output: E-Sertifikat Resmi",
      desc: "Aktualisasi ilmu melalui tugas pengabdian sosial, penulisan karya tulis ilmiah, verifikasi instruktur, dan penerbitan sertifikat.",
      icon: CheckCircle2,
    },
  ];

  const features = [
    {
      title: "Database & Kaderisasi",
      category: "Manajemen Anggota",
      desc: "Pemetaan biodata kader, pemantauan jenjang MAPABA, PKD, PKL, serta penerimaan pendaftar baru secara terpusat.",
      icon: Users,
      href: "/login",
    },
    {
      title: "Pengajuan & Legalisasi SK",
      category: "Tata Kelola Komisariat",
      desc: "Pengajuan berkas hasil RTK komisariat dan penerbitan Surat Keputusan (SK) resmi Pengurus Cabang secara paperless.",
      icon: FileCheck,
      href: "/login",
    },
    {
      title: "E-Surat & Administrasi",
      category: "Kesekretariatan",
      desc: "Pembuatan surat organisasi dengan format penomoran otomatis sesuai pedoman penyelenggaraan tertib administrasi PMII.",
      icon: Mail,
      href: "/login",
    },
    {
      title: "Verifikasi RKTL & Sertifikat",
      category: "Evaluasi & Kelulusan",
      desc: "Validasi penugasan Rencana Kerja Tindak Lanjut paska-pelatihan, penilaian instruktur, dan unduh sertifikat kader.",
      icon: Award,
      href: "/login",
    },
  ];

  const latestArticle = articles[0];

  const renderKomLogo = (kom: CommissariatList, boxClass: string) => {
    const ok = kom.logo && !brokenLogos[kom.id];
    return (
      <div
        className={`${boxClass} rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 p-1 flex items-center justify-center overflow-hidden shrink-0`}
      >
        {ok ? (
          <img
            src={kom.logo}
            alt={kom.name}
            onError={() => setBrokenLogos((prev) => ({ ...prev, [kom.id]: true }))}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full rounded-lg bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
            {kom.logoInitial || "PK"}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* ===================================================================== */}
      {/* 1. FLOATING PILL NAVBAR                                               */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-50 h-0">
        <div className="relative px-3 sm:px-6 pt-3 sm:pt-4">
          <div
            className={`max-w-6xl mx-auto flex items-center justify-between gap-3 rounded-full pl-3 pr-2 py-2 transition-all duration-300 ${
              scrolled
                ? "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 shadow-lg shadow-zinc-900/5"
                : "bg-transparent border border-transparent"
            }`}
          >
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2.5 min-w-0 group" aria-label="PC PMII Grobogan - Beranda">
              <Image
                src="/image/logopmii.png"
                alt="Logo PC PMII Grobogan"
                width={36}
                height={36}
                className="w-9 h-9 object-contain shrink-0"
                priority
              />
              <span className="flex flex-col leading-tight min-w-0">
                <span className="text-sm font-extrabold tracking-tight whitespace-nowrap text-zinc-900 dark:text-zinc-50">
                  PC PMII
                </span>
                <span className="text-[11px] font-semibold tracking-wide whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                  GROBOGAN
                </span>
              </span>
            </Link>

            {/* Center pill navigation (desktop) */}
            <nav
              aria-label="Navigasi Utama"
              className="hidden lg:flex items-center gap-0.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/70 dark:border-zinc-800 shadow-sm p-1"
            >
              <a
                href="#top"
                aria-current={activeSection === "" ? "page" : undefined}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                  activeSection === ""
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Beranda
              </a>
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    aria-current={isActive ? "true" : undefined}
                    className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={toggleTheme}
                title={darkMode ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
                className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center border border-zinc-200/80 dark:border-zinc-800 bg-white/80 hover:bg-white dark:bg-zinc-900/80 dark:hover:bg-zinc-800 backdrop-blur text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                aria-label="Ubah tema warna"
              >
                {mounted && darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-700" />
                )}
              </button>

              <Link
                href="/login"
                className="group inline-flex items-center gap-1.5 h-10 px-4 sm:px-5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-[13px] font-semibold shadow-md transition-all whitespace-nowrap"
              >
                <span className="sm:hidden">Masuk</span>
                <span className="hidden sm:inline">Masuk Portal</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur text-zinc-700 dark:text-zinc-300 cursor-pointer"
                aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile menu panel */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="lg:hidden fixed inset-0 -z-10 bg-zinc-950/20 backdrop-blur-[2px]"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="lg:hidden max-w-6xl mx-auto mt-2 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-900/10 p-2"
                >
                  <a
                    href="#top"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-2xl text-sm font-medium flex items-center justify-between transition-colors ${
                      activeSection === ""
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <span>Beranda</span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </a>
                  {NAV_ITEMS.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-4 py-3 rounded-2xl text-sm font-medium flex items-center justify-between transition-colors ${
                        activeSection === item.id
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </a>
                  ))}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="sm:hidden w-full px-4 py-3 rounded-2xl text-sm font-medium flex items-center justify-between text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                  >
                    <span>{mounted && darkMode ? "Mode Terang" : "Mode Gelap"}</span>
                    {mounted && darkMode ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-zinc-500" />
                    )}
                  </button>
                  <div className="grid grid-cols-2 gap-2 p-1 pt-3 mt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 h-11 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[13px] font-semibold text-zinc-800 dark:text-zinc-100"
                    >
                      <UserPlus className="w-4 h-4 text-blue-600" />
                      <span>Daftar Kader</span>
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 h-11 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-semibold"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Masuk Portal</span>
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* =================================================================== */}
        {/* 2. HERO SECTION (CENTERED HEADLINE + FLOATING LIVE-DATA CARDS)      */}
        {/* =================================================================== */}
        <section className="relative overflow-hidden bg-white dark:bg-zinc-950">
          {/* Soft gradient glow + faded grid */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute -top-32 -right-24 w-[640px] h-[640px] rounded-full bg-violet-400/25 dark:bg-violet-600/15 blur-3xl" />
            <div className="absolute top-24 -left-32 w-[540px] h-[540px] rounded-full bg-amber-200/50 dark:bg-amber-500/8 blur-3xl" />
            <div className="absolute top-44 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full bg-blue-300/25 dark:bg-blue-600/12 blur-3xl" />
            <div
              className="absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(120,120,170,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,120,170,0.12) 1px, transparent 1px)",
                backgroundSize: "56px 56px",
              }}
            />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-32">
            {/* ---------- Floating cards (desktop only, all data real) ---------- */}
            {komisariats[0] && (
              <Floaty className="hidden lg:block absolute left-0 top-28 z-10 w-64 -rotate-3" delay={0}>
                <div className="rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur border border-zinc-200/80 dark:border-zinc-800 shadow-lg shadow-zinc-900/5 p-3.5">
                  <div className="flex items-center gap-3">
                    {renderKomLogo(komisariats[0], "w-10 h-10")}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {komisariats[0].name}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {komisariats[0].university || (komisariats[0] as any).campusName || "Perguruan Tinggi"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>Pangkalan Kampus</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                      {Array.isArray(komisariats[0].rayons) && komisariats[0].rayons.length > 0
                        ? `${komisariats[0].rayons.length} Rayon`
                        : "Aktif"}
                    </span>
                  </div>
                </div>
              </Floaty>
            )}

            <Floaty className="hidden lg:block absolute right-0 top-32 z-10 w-60 rotate-3" delay={0.4} duration={7}>
              <div className="rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur border border-zinc-200/80 dark:border-zinc-800 shadow-lg shadow-zinc-900/5 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Kader Terdata</p>
                    <p className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 leading-tight">
                      {isLoadingStats ? "—" : cadresCount}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Basis data resmi Pengurus Cabang
                </div>
              </div>
            </Floaty>

            <Floaty className="hidden lg:block absolute left-2 bottom-28 z-10 -rotate-2" delay={0.8} duration={6.5}>
              <div className="rounded-2xl bg-zinc-900 dark:bg-zinc-800 text-white pl-2.5 pr-5 py-2.5 flex items-center gap-3 shadow-xl shadow-zinc-900/15 border border-white/5">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">Kaderisasi Berjenjang</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">MAPABA · PKD · PKL</p>
                </div>
              </div>
            </Floaty>

            <Floaty className="hidden lg:block absolute right-2 bottom-32 z-10 rotate-2" delay={1.2} duration={7.5}>
              <div className="rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white pl-2.5 pr-5 py-2.5 flex items-center gap-3 shadow-xl shadow-violet-500/25">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Building2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">{komisariats.length} Komisariat</p>
                  <p className="text-[11px] text-violet-100 mt-0.5">se-Kabupaten Grobogan</p>
                </div>
              </div>
            </Floaty>

            <Sparkles className="hidden lg:block absolute left-[31%] top-28 w-5 h-5 text-indigo-500" aria-hidden="true" />
            <Sparkles className="hidden lg:block absolute right-[29%] bottom-[30%] w-4 h-4 text-violet-500" aria-hidden="true" />

            {/* ---------- Centered headline block ---------- */}
            <div className="relative z-10 max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200/80 dark:border-zinc-800 shadow-2xs mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide">
                  Portal Resmi PC PMII Kabupaten Grobogan
                </span>
              </div>

              <div className="relative">
                <h1 className="text-[27px] min-[380px]:text-[30px] sm:text-5xl lg:text-[64px] font-extrabold tracking-tight leading-[1.15] sm:leading-[1.08] text-zinc-900 dark:text-zinc-50">
                  <span className="block">Ruang Kaderisasi.</span>
                  <span className="block">Membentuk Kader Kritis,</span>
                  <span className="block bg-gradient-to-b from-zinc-500 to-zinc-400 sm:from-zinc-400 sm:to-zinc-300 dark:from-zinc-400 dark:to-zinc-600 dark:sm:from-zinc-500 dark:sm:to-zinc-700 bg-clip-text text-transparent">
                    Mandiri &amp; Berintegritas
                  </span>
                  <span className="block">Bersama PMII Grobogan</span>
                </h1>

                {/* Overlapping highlight card (real latest article, else MAPABA CTA) */}
                <Floaty
                  className="hidden lg:block absolute left-1/2 top-[56%] -translate-x-1/2 z-20 w-60 -rotate-6"
                  delay={0.2}
                  duration={6}
                >
                  <Link
                    href={latestArticle ? `/artikel/${latestArticle.slug || latestArticle.id}` : "/register"}
                    className="block rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xl shadow-violet-500/20 border border-zinc-200/60 dark:border-zinc-800 text-left"
                  >
                    <div className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white px-3.5 pt-3 pb-3.5">
                      <p className="text-[11px] text-violet-100">
                        {latestArticle ? "Warta Terbaru" : "Pendaftaran Kader"}
                      </p>
                      <p className="text-sm font-bold leading-snug mt-0.5 line-clamp-2">
                        {latestArticle ? latestArticle.title : "Daftar MAPABA Sekarang"}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold">
                          {latestArticle ? latestArticle.category : "Online"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold">
                          {latestArticle ? "Baca" : "Terbuka"}
                        </span>
                      </div>
                    </div>
                    <div className="px-3.5 py-2.5 flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span suppressHydrationWarning>
                        {latestArticle
                          ? formatArticleDate(latestArticle.createdAt || (latestArticle as any).created_at || latestArticle)
                          : "Pilih komisariat kampus Anda"}
                      </span>
                    </div>
                  </Link>
                </Floaty>
              </div>

              <p className="mt-6 sm:mt-8 text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
                Sistem informasi kaderisasi dan tata kelola organisasi terpadu.{" "}
                <br className="hidden sm:block" />
                Menguatkan dzikir, fikir, dan amal shaleh untuk kemaslahatan umat.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#alur"
                  className="inline-flex items-center h-11 px-6 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-800 dark:text-zinc-100 shadow-xs hover:shadow-md transition-all"
                >
                  Pelajari Alur
                </a>
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 h-11 px-6 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold shadow-md transition-all"
                >
                  <span>Daftar Kader</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Compact stats for tablet & mobile (floating cards hidden) */}
              <div className="lg:hidden mt-9 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  {isLoadingStats ? "—" : cadresCount} Kader
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  {komisariats.length} Komisariat
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  3 Jenjang
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Komisariat strip (real data, replaces partner-logo row) */}
        <section aria-label="Pangkalan komisariat" className="border-y border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-stretch overflow-x-auto divide-x divide-zinc-200/80 dark:divide-zinc-800 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {komisariats.slice(0, 6).map((kom) => (
                <Link
                  key={kom.id}
                  href={`/komisariat/${getKomisariatSlug(kom)}`}
                  className="flex-1 min-w-[200px] flex items-center justify-center gap-2.5 px-5 py-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors"
                >
                  {renderKomLogo(kom, "w-8 h-8")}
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 truncate max-w-[150px]">
                    {kom.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 3. KEY METRICS STRIP (CLEAN BENTO SUMMARY)                          */}
        {/* =================================================================== */}
        <section aria-label="Ringkasan Data Organisasi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Kader Terdata
                </p>
                <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight mt-0.5">
                  {isLoadingStats ? "—" : cadresCount}
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Basis Data Cabang
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Pangkalan Kampus
                </p>
                <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight mt-0.5">
                  {komisariats.length}
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {totalRayons > 0 ? `Komisariat & ${totalRayons} Rayon` : "Komisariat Resmi"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Kaderisasi Formal
                </p>
                <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight mt-0.5">
                  3 Jenjang
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  MAPABA, PKD & PKL
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Sistem Administrasi
                </p>
                <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight mt-0.5">
                  Terpadu
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  E-Surat, SK & RKTL
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 4. DIREKTORI KOMISARIAT KAMPUS (SEARCHABLE & CLEAN CARDS)           */}
        {/* =================================================================== */}
        <section id="komisariat" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div className="space-y-2 max-w-xl">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600 dark:text-blue-400 block">
                Jejaring Pangkalan Kampus
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Komisariat PMII se-Kabupaten Grobogan
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Pilih komisariat di perguruan tinggi Anda untuk mengakses profil kepengurusan, struktur BPH, agenda kaderisasi, dan pendaftaran anggota baru.
              </p>
            </div>

            {/* Instant Filter Input for Usability */}
            {komisariats.length > 3 && (
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  value={komisariatQuery}
                  onChange={(e) => setKomisariatQuery(e.target.value)}
                  placeholder="Cari komisariat atau kampus..."
                  className="pl-9 pr-8 h-9 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                />
                {komisariatQuery && (
                  <button
                    onClick={() => setKomisariatQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    aria-label="Bersihkan pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {filteredKomisariats.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center max-w-md mx-auto space-y-2">
              <Building2 className="w-6 h-6 text-zinc-400 mx-auto" />
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Komisariat Tidak Ditemukan
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Tidak ada komisariat atau perguruan tinggi yang cocok dengan kata kunci &ldquo;{komisariatQuery}&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredKomisariats.map((kom) => {
                const slug = getKomisariatSlug(kom);
                const campus = kom.university || (kom as any).campusName || "Perguruan Tinggi";
                const rayonCount = Array.isArray(kom.rayons) ? kom.rayons.length : 0;
                const period = kom.structure?.period || (kom as any).period;
                const hasValidLogo = kom.logo && !brokenLogos[kom.id];

                return (
                  <Link
                    key={kom.id}
                    href={`/komisariat/${slug}`}
                    className="group bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/90 hover:border-blue-600/50 dark:hover:border-blue-500/50 rounded-2xl p-5 transition-all duration-200 hover:shadow-md dark:hover:shadow-zinc-950/50 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Card Top Bar */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-11 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                          {hasValidLogo ? (
                            <img
                              src={kom.logo}
                              alt={kom.name}
                              onError={() =>
                                setBrokenLogos((prev) => ({ ...prev, [kom.id]: true }))
                              }
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                              {kom.logoInitial || "PK"}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {rayonCount > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold">
                              {rayonCount} Rayon
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-medium">
                            {kom.establishedYear ? `Sejak ${kom.establishedYear}` : period || "Aktif"}
                          </span>
                        </div>
                      </div>

                      {/* Title & University */}
                      <div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                          {kom.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-1">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="truncate">{campus}</span>
                        </div>
                      </div>

                      {/* Summary */}
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {(kom as any).vision ||
                          `Pangkalan resmi pembinaan intelektual, kaderisasi, dan gerakan mahasiswa Islam di lingkungan ${campus}.`}
                      </p>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-3.5 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                      <span>Kunjungi Portal Komisariat</span>
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* =================================================================== */}
        {/* 5. ALUR KADERISASI FORMAL (STRUCTURED PROGRESSION)                  */}
        {/* =================================================================== */}
        <section
          id="alur"
          className="py-16 sm:py-24 bg-white dark:bg-zinc-900/40 border-y border-zinc-200/80 dark:border-zinc-800/80 scroll-mt-24"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div className="space-y-2 max-w-xl">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600 dark:text-blue-400 block">
                  Kurikulum Kaderisasi Nasional
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Alur Pembinaan Kader Pergerakan
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Tahapan pendidikan formal berjenjang untuk membentuk kader Ulul Albab yang beriman, bertakwa, berilmu, dan berkarya nyata.
                </p>
              </div>

              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
              >
                <span>Mulai dari Tahap MAPABA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {steps.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-zinc-50/70 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/40 transition-colors"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                          TAHAP {item.step}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                          {item.title}
                        </h3>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>

                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-3.5 mt-4 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      <span>{item.output}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 6. LAYANAN TATA KELOLA DIGITAL (MODULAR BENTO GRID)                 */}
        {/* =================================================================== */}
        <section id="layanan" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600 dark:text-blue-400 block">
              Ekosistem Organisasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Layanan Tata Kelola Digital
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Memodernisasi administrasi Pengurus Cabang dan Komisariat dalam satu sistem informasi yang terukur, transparan, dan aman.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <Link
                  key={i}
                  href={feat.href}
                  className="group bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-blue-600/40 dark:hover:border-blue-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-sm"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                        {feat.category}
                      </span>
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

                  <div className="pt-3.5 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <span className="inline-flex items-center gap-1.5 text-[11px]">
                      <Lock className="w-3 h-3" />
                      <span>Portal Internal</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <span>Masuk</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* =================================================================== */}
        {/* 7. WARTA & OPINI PERGERAKAN (EDITORIAL ARTICLES)                    */}
        {/* =================================================================== */}
        <section
          id="artikel"
          className="py-16 sm:py-24 bg-white dark:bg-zinc-900/40 border-y border-zinc-200/80 dark:border-zinc-800/80 scroll-mt-24"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div className="space-y-2 max-w-xl">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600 dark:text-blue-400 block">
                  Warta & Opini Pergerakan
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Artikel & Gagasan Terbaru
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Kumpulan tulisan ilmiah, opini kader, serta dokumentasi kegiatan resmi PC PMII Grobogan dan komisariat.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="w-full sm:w-auto overflow-x-auto flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/90 p-1 rounded-xl border border-zinc-200/70 dark:border-zinc-800">
                  {ARTICLE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedArticleCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                        selectedArticleCategory === cat
                          ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold"
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
                  <span>Indeks Artikel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {isLoadingArticles ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 rounded-2xl overflow-hidden p-4 space-y-3 animate-pulse"
                  >
                    <div className="aspect-[16/10] rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="bg-zinc-50/70 dark:bg-zinc-900/60 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center max-w-lg mx-auto space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Belum Ada Artikel Diterbitkan
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {selectedArticleCategory === "Semua"
                    ? "Saat ini belum ada artikel atau rilis berita yang dipublikasikan."
                    : `Belum ada artikel pada kategori "${selectedArticleCategory}".`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.slice(0, 6).map((art) => (
                  <Link
                    key={art.id}
                    href={`/artikel/${art.slug || art.id}`}
                    className="group bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-blue-600/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <Image
                          src={art.image || "/image/landing_page.png"}
                          alt={art.title}
                          width={800}
                          height={500}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute top-3 left-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-[10px] font-semibold text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md border border-zinc-200/60 dark:border-zinc-800">
                          {art.category}
                        </span>
                      </div>

                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span suppressHydrationWarning>
                            {formatArticleDate(art.createdAt || (art as any).created_at || art)}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                          {art.title}
                        </h3>

                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {art.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 pb-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center justify-center border border-blue-200/60 dark:border-blue-900 shrink-0">
                          {art.authorInitials || "PM"}
                        </div>
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                          {art.authorName}
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 shrink-0">
                        <span>Baca</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =================================================================== */}
        {/* 8. VERIFIKASI ANGGOTA MANDIRI (CLEAN USER-FRIENDLY SEARCH)          */}
        {/* =================================================================== */}
        <section id="verifikasi" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xs">
            <div className="text-center space-y-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-900/60 text-[10px] font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verifikasi Publik</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Cek Status & Jenjang Kader
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                Masukkan nama lengkap atau Nomor Induk Mahasiswa (NIM) untuk memeriksa validitas keanggotaan di database resmi PC PMII Grobogan.
              </p>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Ketik nama kader atau NIM (min. 2 karakter)..."
                  value={verifyQuery}
                  onChange={(e) => setVerifyQuery(e.target.value)}
                  className="pl-10 pr-8 h-10 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
                />
                {verifyQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyQuery("");
                      setVerifyResults(null);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    aria-label="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <Button
                type="submit"
                disabled={isVerifying || verifyQuery.trim().length < 2}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-10 px-5 rounded-xl cursor-pointer shrink-0"
              >
                {isVerifying ? "Memeriksa..." : "Cek Validitas"}
              </Button>
            </form>

            <AnimatePresence>
              {verifyResults && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="mt-5 pt-5 border-t border-zinc-100 dark:border-zinc-800"
                >
                  {verifyResults === "NOT_FOUND" ? (
                    <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>
                        Data kader tidak ditemukan dalam database resmi. Pastikan ejaan nama lengkap atau NIM sudah sesuai.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
                        <span>Hasil Verifikasi Database:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {verifyResults.length} Kader Terverifikasi
                        </span>
                      </div>
                      {verifyResults.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-900/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                                {item.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 pl-5">
                              {item.commissariat}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 pl-5 sm:pl-0 shrink-0">
                            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                              {item.level}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold">
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 9. CLOSING CALL-TO-ACTION BANNER                                    */}
        {/* =================================================================== */}
        <section className="pb-16 sm:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="max-w-xl mx-auto space-y-4 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Siap Berproses & Mengabdi Bersama PMII?
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                Daftarkan diri Anda pada Masa Penerimaan Anggota Baru (MAPABA) di komisariat kampus Anda atau masuk ke portal pengurus untuk mengelola organisasi.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-2xs transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar Kader Sekarang</span>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-blue-800/60 hover:bg-blue-800 text-white border border-white/20 text-xs font-semibold transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Portal</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===================================================================== */}
      {/* 10. STRUCTURED MULTI-COLUMN FOOTER                                    */}
      {/* ===================================================================== */}
      <footer className="w-full border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-zinc-100 dark:border-zinc-800/80">
            {/* Brand Column */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 flex items-center justify-center">
                  <Image
                    src="/image/logopmii.png"
                    alt="Logo PC PMII Grobogan"
                    width={28}
                    height={28}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  PC PMII GROBOGAN
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
                Portal Resmi Sistem Informasi Kaderisasi, Basis Data Anggota, dan Tata Kelola Organisasi Pengurus Cabang Pergerakan Mahasiswa Islam Indonesia Kabupaten Grobogan.
              </p>
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                Dzikir, Fikir, dan Amal Shaleh
              </p>
            </div>

            {/* Section Navigation */}
            <div className="md:col-span-3 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Navigasi Halaman
              </h4>
              <ul className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Direct Portal Links */}
            <div className="md:col-span-4 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Layanan & Akses
              </h4>
              <ul className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                <li>
                  <Link href="/register" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Registrasi Anggota Baru (MAPABA)
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Portal Pengurus & Anggota
                  </Link>
                </li>
                <li>
                  <Link href="/artikel" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Arsip Warta & Opini Pergerakan
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span>© {new Date().getFullYear()} Pengurus Cabang PMII Grobogan. Hak cipta dilindungi.</span>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sistem Informasi Terintegrasi</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
