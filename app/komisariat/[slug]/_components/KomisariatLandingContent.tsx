"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Building2,
  GraduationCap,
  Users,
  Calendar,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  UserPlus,
  LogIn,
  Sun,
  Moon,
  Mail,
  MapPin,
  Award,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  ExternalLink,
  GitFork,
  Layers,
  Image as ImageIcon,
  Camera,
  ZoomIn,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { db, DEFAULT_ARTICLES, formatArticleDate } from "@/lib/db";
import type { Article, EventActivity } from "@/lib/db";
import { getKomisariatSlug, normalizeTenantName } from "@/lib/tenancy";
import { DEFAULT_COMMISSARIATS } from "@/lib/services/defaults";
import { CommissariatList, getKomisariatBph, KomisariatBphData, KomisariatGalleryItem } from "@/app/dashboard/komisariat/_components/types";

interface Props {
  slug: string;
}

export function KomisariatLandingContent({ slug }: Props) {
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [komisariat, setKomisariat] = useState<CommissariatList | null>(null);
  const [bphData, setBphData] = useState<KomisariatBphData | null>(null);
  const [cadresCount, setCadresCount] = useState<number>(0);
  const [events, setEvents] = useState<EventActivity[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [gallery, setGallery] = useState<KomisariatGalleryItem[]>([]);
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>("Semua");
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<KomisariatGalleryItem | null>(null);
  const [boardMembers, setBoardMembers] = useState<any[]>([]);
  const [cadres, setCadres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    setDarkMode(document.documentElement.classList.contains("dark"));

    const loadData = async () => {
      try {
        const [commList, boardList, cadresList, eventList, articleList] = await Promise.all([
          db.getCommissariats(DEFAULT_COMMISSARIATS),
          db.getBoards([]),
          db.getCadres([]),
          db.getEvents([]),
          db.getArticles()
        ]);

        // Find matching commissariat by slug or id or partial name
        const targetSlug = slug.toLowerCase().trim();
        const found = commList.find((c) => {
          const cSlug = getKomisariatSlug(c);
          return (
            cSlug === targetSlug ||
            c.id === targetSlug ||
            normalizeTenantName(c.name).includes(targetSlug) ||
            targetSlug.includes(normalizeTenantName(c.name))
          );
        });

        if (found) {
          setKomisariat(found);
          const bph = getKomisariatBph(found, boardList);
          setBphData(bph);
          setCadres(cadresList);
          setGallery(found.gallery || []);

          // Filter board members for this commissariat
          const fNorm = normalizeTenantName(found.name);
          const uNorm = normalizeTenantName(found.university || (found as any).campusName || "");
          const commBoards = boardList.filter((b: any) => {
            if (!b) return false;
            if (found.id && (b.komisariat_id === found.id || b.tenant_id === found.id)) return true;
            const bComm = normalizeTenantName(b.commissariat || b.komisariat || b.campus || "");
            return (
              (fNorm && bComm === fNorm) ||
              (fNorm && bComm.includes(fNorm)) ||
              (uNorm && bComm.includes(uNorm))
            );
          });
          setBoardMembers(commBoards);

          // Count cadres belonging to this commissariat
          const matchedCadres = cadresList.filter((c: any) => {
            if (c.tenant_id === found.id || c.komisariat_id === found.id) return true;
            const cComm = normalizeTenantName(c.commissariat || c.komisariat || c.campus || "");
            return (
              (fNorm && cComm === fNorm) ||
              (fNorm && cComm.includes(fNorm)) ||
              (uNorm && cComm.includes(uNorm))
            );
          });
          setCadresCount(matchedCadres.length);

          // Filter events/kaderisasi organized by this commissariat
          const matchedEvents = eventList.filter((e: any) => {
            if (e.tenant_id === found.id || e.komisariat_id === found.id) return true;
            const eComm = normalizeTenantName(e.commissariat || e.komisariat || "");
            return fNorm && (eComm.includes(fNorm) || fNorm.includes(eComm));
          });
          setEvents(matchedEvents);

          // Filter artikel khusus milik komisariat / tenant ini secara ketat (tanpa fallback cabang lain)
          const shownArticles = articleList.filter((a) => a.status === "DITAMPILKAN");
          const commArticles = shownArticles.filter((a: any) => {
            if (found.id && (a.tenant_id === found.id || a.komisariat_id === found.id)) return true;
            const aComm = normalizeTenantName(a.commissariat || a.komisariat || a.campus || "");
            if (
              aComm &&
              ((fNorm && aComm === fNorm) ||
                (fNorm && aComm.includes(fNorm)) ||
                (fNorm && fNorm.includes(aComm)))
            ) {
              return true;
            }
            if (uNorm && aComm && (aComm.includes(uNorm) || uNorm.includes(aComm))) {
              return true;
            }
            const authorComm = normalizeTenantName(a.authorCommissariat || a.author_commissariat || "");
            if (authorComm && ((fNorm && authorComm === fNorm) || (fNorm && authorComm.includes(fNorm)))) {
              return true;
            }
            return false;
          });
          setArticles(commArticles);
        }
      } catch (err) {
        console.error("Gagal memuat data komisariat:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  // Gallery Categories & Filtered List
  const galleryCategories = useMemo(() => {
    const cats = Array.from(new Set(gallery.map((g) => g.category || "Dokumentasi").filter(Boolean)));
    return ["Semua", ...cats];
  }, [gallery]);

  const filteredGallery = useMemo(() => {
    if (selectedGalleryCategory === "Semua") return gallery;
    return gallery.filter((g) => (g.category || "Dokumentasi") === selectedGalleryCategory);
  }, [gallery, selectedGalleryCategory]);

  // Helper avatar resolution
  const getAvatar = (name?: string, anggota_id?: string | null, directAvatar?: string) => {
    if (directAvatar) return directAvatar;
    if (!name && !anggota_id) return "";
    if (anggota_id) {
      const byId = cadres.find((c) => c.id === anggota_id);
      const av = byId?.avatar || (byId as any)?.foto || (byId as any)?.photo || (byId as any)?.image;
      if (av) return av;
    }
    const cleanName = (name || "").toLowerCase().replace(/['"`]/g, "").trim();
    const byName = cadres.find((c) => {
      const cClean = (c.name || "").toLowerCase().replace(/['"`]/g, "").trim();
      return cClean === cleanName || (cleanName && cClean.includes(cleanName)) || (cleanName && cleanName.includes(cClean));
    });
    return byName?.avatar || (byName as any)?.foto || (byName as any)?.photo || (byName as any)?.image || "";
  };

  const getGender = (name?: string, anggota_id?: string | null): "Sahabat" | "Sahabati" => {
    if (!name && !anggota_id) return "Sahabat";
    const matched = cadres.find((c) => (anggota_id && c.id === anggota_id) || c.name?.toLowerCase().trim() === name?.toLowerCase().trim());
    const g = matched?.gender || "Sahabat";
    return g === "Perempuan" || g === "Sahabati" ? "Sahabati" : "Sahabat";
  };

  const getInitials = (name?: string) => {
    if (!name) return "PK";
    return name
      .split(" ")
      .filter((w) => w.toLowerCase() !== "sahabat" && w.toLowerCase() !== "sahabati")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "PK";
  };

  const formatIndonesianDate = (dateStr?: string, withDay: boolean = false): string => {
    if (!dateStr) return "";
    const trimmed = dateStr.trim();

    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10);
      const day = parseInt(isoMatch[3], 10);

      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];

      if (month >= 1 && month <= 12) {
        if (withDay) {
          const d = new Date(year, month - 1, day);
          const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
          const dayName = days[d.getDay()];
          return `${dayName}, ${day} ${months[month - 1]} ${year}`;
        }
        return `${day} ${months[month - 1]} ${year}`;
      }
    }

    try {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric"
        });
      }
    } catch {
      // fallback
    }

    return trimmed;
  };

  // Specific BPH Role Resolution
  const chairmanMember = useMemo(() => {
    return boardMembers.find((b) => {
      const pos = (b.position || "").toLowerCase();
      return (pos.includes("ketua") || pos.includes("mandataris")) && !pos.includes("wakil") && !pos.includes("bidang");
    });
  }, [boardMembers]);

  const secretaryMember = useMemo(() => {
    return boardMembers.find((b) => {
      const pos = (b.position || "").toLowerCase();
      return pos.includes("sekretaris") && !pos.includes("wakil") && !pos.includes("bidang");
    });
  }, [boardMembers]);

  const treasurerMember = useMemo(() => {
    return boardMembers.find((b) => {
      const pos = (b.position || "").toLowerCase();
      return pos.includes("bendahara") && !pos.includes("wakil") && !pos.includes("bidang");
    });
  }, [boardMembers]);

  const chairmanName = chairmanMember?.name || bphData?.chairman || komisariat?.structure?.chairman || "";
  const secretaryName = secretaryMember?.name || bphData?.secretary || komisariat?.structure?.secretary || "";
  const treasurerName = treasurerMember?.name || bphData?.treasurer || komisariat?.structure?.treasurer || "";

  // Wakil-wakil jika ada
  const wakilSekretaris = useMemo(() => {
    return boardMembers.filter((b) => (b.position || "").toLowerCase().includes("wakil sekretaris"));
  }, [boardMembers]);

  const wakilBendahara = useMemo(() => {
    return boardMembers.filter((b) => (b.position || "").toLowerCase().includes("wakil bendahara"));
  }, [boardMembers]);

  // Pemisahan Fungsionaris Bidang dan Biro
  const { bidangGroups, biroGroups } = useMemo(() => {
    const nonBph = boardMembers.filter(
      (m) => m && m.department && m.department !== "BPH" && m.department !== "PIMPINAN"
    );

    const bidangMap = new Map<string, any[]>();
    const biroMap = new Map<string, { dept: string; members: any[] }>();

    for (const m of nonBph) {
      const pos = (m.position || "").toLowerCase();
      const isBiro = !!m.biro || pos.includes("biro") || pos.includes("kabiro");

      if (isBiro) {
        let bName = m.biro ? m.biro.trim() : "";
        if (!bName) {
          bName = m.department ? `Biro ${m.department}` : "Biro Pelaksana";
        }
        if (!bName.toLowerCase().startsWith("biro")) {
          bName = `Biro ${bName}`;
        }

        if (!biroMap.has(bName)) {
          biroMap.set(bName, { dept: m.department, members: [] });
        }
        biroMap.get(bName)!.members.push(m);
      } else {
        const dName = m.department.toLowerCase().startsWith("bidang")
          ? m.department.trim()
          : `Bidang ${m.department.trim()}`;

        if (!bidangMap.has(dName)) {
          bidangMap.set(dName, []);
        }
        bidangMap.get(dName)!.push(m);
      }
    }

    const bGroups = Array.from(bidangMap.entries()).map(([name, members]) => ({
      name,
      members,
    }));

    const rGroups = Array.from(biroMap.entries()).map(([name, data]) => ({
      name,
      department: data.dept,
      members: data.members,
    }));

    return { bidangGroups: bGroups, biroGroups: rGroups };
  }, [boardMembers]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20" />
          <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  if (!komisariat) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <Building2 className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Komisariat Tidak Ditemukan
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mt-2">
          Halaman profil komisariat dengan pengenal <span className="font-mono text-blue-600">&quot;{slug}&quot;</span> tidak terdaftar dalam database resmi PC PMII Grobogan.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Portal Utama</span>
        </Link>
      </div>
    );
  }

  const registerUrl = `/register?commissariat=${encodeURIComponent(komisariat.name)}`;
  const campusName = komisariat.university || (komisariat as any).campusName || "Perguruan Tinggi";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. TOP NAVBAR */}
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/#komisariat"
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mr-1 sm:mr-2"
              title="Kembali ke Portal PC PMII Grobogan"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden md:inline">Portal Cabang</span>
            </Link>

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

            {/* Logo Komisariat / Inisial */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden bg-white border border-zinc-200/80 dark:border-zinc-700/80 p-1 flex items-center justify-center shadow-xs shrink-0">
              {komisariat.logo ? (
                <img
                  src={komisariat.logo}
                  alt={komisariat.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  {komisariat.logoInitial || "PK"}
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[11px] sm:text-sm tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                {komisariat.name}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                {campusName}
              </span>
            </div>
          </div>

          {/* Quick Navigation Anchor Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#struktur" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Struktur BPH
            </a>
            {events.length > 0 && (
              <a href="#kaderisasi" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Agenda Kegiatan
              </a>
            )}
            <a href="#galeri" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Galeri
            </a>
            {articles.length > 0 && (
              <a href="#artikel" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Artikel & Opini
              </a>
            )}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
              aria-label="Toggle theme"
            >
              {mounted && darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-blue-600" />
              )}
            </button>

            <Link
              href={registerUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Daftar MAPABA</span>
              <span className="sm:hidden">Daftar</span>
            </Link>

            <Link
              href="/login"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Masuk Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION BRANDING KOMISARIAT */}
      <section className="relative pt-8 pb-12 sm:pt-16 sm:pb-20 overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/10 dark:bg-blue-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="text-center space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.15]">
              {komisariat.name}
              <span className="block mt-2 text-xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-300 bg-clip-text text-transparent">
                {campusName}
              </span>
            </h1>

            <p className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Wadah pembinaan mahasiswa Islam berlandaskan Ahlussunnah wal Jama&apos;ah, mengasah intelektualitas, militansi, dan kepemimpinan transformatif di lingkungan {campusName}.
            </p>
          </div>
        </div>
      </section>

      {/* 3. STATS STRIP */}
      <section className="border-y border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                {cadresCount > 0 ? cadresCount : "Aktif"}
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Sahabat / Sahabati</p>
            </div>
            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {(komisariat.rayons || []).length > 0 ? (komisariat.rayons || []).length : "Terpadu"}
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Rayon / Fakultas</p>
            </div>
            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                {events.length > 0 ? events.length : "Rutin"}
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Agenda Kaderisasi</p>
            </div>
            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {bphData?.period || komisariat.structure?.period || "2026 - 2027"}
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Masa Khidmat</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SUSUNAN BPH (BADAN PENGURUS HARIAN) & BAGAN STRUKTUR */}
      <section id="struktur" className="py-16 md:py-24 container mx-auto px-4 sm:px-6 max-w-5xl scroll-mt-20">
        <div className="text-center space-y-2.5 mb-12 sm:mb-16">
          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-1 px-3 tracking-wider inline-flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Bagan Struktur Organisasi
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Badan Pengurus Harian & Hierarki
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Amanah fungsionaris kepemimpinan komisariat masa khidmat{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-200">
              {bphData?.period || komisariat.structure?.period || "2026 - 2027"}
            </span>.
          </p>
        </div>

        <div className="relative max-w-xl mx-auto">
          {/* LEVEL 1: KETUA KOMISARIAT */}
          <div className="w-60 sm:w-64 mx-auto">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-xs opacity-20 group-hover:opacity-30 transition duration-300" />
              <Card className="relative p-4 sm:p-4.5 bg-white dark:bg-zinc-900 border border-blue-500/30 rounded-2xl shadow-xs text-center">
                {/* Avatar */}
                <div className="relative w-14 h-14 mx-auto mb-2">
                  {getAvatar(chairmanName, chairmanMember?.anggota_id) ? (
                    <img
                      src={getAvatar(chairmanName, chairmanMember?.anggota_id)}
                      alt={chairmanName}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500/30 shadow-xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-base ring-2 ring-blue-500/30 shadow-xs">
                      {getInitials(chairmanName)}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 right-0 px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-blue-600 text-white shadow-xs">
                    {getGender(chairmanName, chairmanMember?.anggota_id)}
                  </span>
                </div>

                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Ketua Komisariat
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {chairmanName || "Belum Ditetapkan"}
                </h3>
              </Card>
            </div>
          </div>

          {/* CONNECTOR LINE: KETUA -> SEKRETARIS & BENDAHARA */}
          <div className="hidden sm:flex flex-col items-center">
            {/* Vertical stem from Ketua */}
            <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-700" />
            {/* Horizontal branch */}
            <div className="w-[52%] h-0.5 bg-zinc-300 dark:bg-zinc-700" />
            {/* Drop pins */}
            <div className="w-[52%] flex justify-between">
              <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-700" />
              <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-700" />
            </div>
          </div>

          {/* Mobile spacing line */}
          <div className="sm:hidden flex justify-center my-3">
            <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-700" />
          </div>

          {/* LEVEL 2: SEKRETARIS & BENDAHARA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {/* SEKRETARIS */}
            <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-none hover:border-indigo-500/40 transition-all text-center flex flex-col justify-between">
              <div>
                <div className="relative w-12 h-12 mx-auto mb-2">
                  {getAvatar(secretaryName, secretaryMember?.anggota_id) ? (
                    <img
                      src={getAvatar(secretaryName, secretaryMember?.anggota_id)}
                      alt={secretaryName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/20"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-200 dark:border-indigo-900">
                      {getInitials(secretaryName)}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 right-0 px-1.5 py-0.2 rounded-full text-[8px] font-semibold bg-indigo-600 text-white">
                    {getGender(secretaryName, secretaryMember?.anggota_id)}
                  </span>
                </div>

                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  Sekretaris
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {secretaryName || "Belum Ditetapkan"}
                </h3>
              </div>

              {wakilSekretaris.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Wakil Sekretaris:
                  </span>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {wakilSekretaris.map((ws, i) => {
                      const avatar = getAvatar(ws.name, ws.anggota_id, ws.avatar);
                      return (
                        <div
                          key={i}
                          className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200/70 dark:border-zinc-700/70 shadow-2xs"
                        >
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={ws.name}
                              className="w-5 h-5 rounded-full object-cover ring-1 ring-indigo-500/30 shrink-0"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[9px] font-bold shrink-0">
                              {getInitials(ws.name)}
                            </div>
                          )}
                          <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
                            {ws.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>

            {/* BENDAHARA */}
            <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-none hover:border-emerald-500/40 transition-all text-center flex flex-col justify-between">
              <div>
                <div className="relative w-12 h-12 mx-auto mb-2">
                  {getAvatar(treasurerName, treasurerMember?.anggota_id) ? (
                    <img
                      src={getAvatar(treasurerName, treasurerMember?.anggota_id)}
                      alt={treasurerName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/20"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-200 dark:border-emerald-900">
                      {getInitials(treasurerName)}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 right-0 px-1.5 py-0.2 rounded-full text-[8px] font-semibold bg-emerald-600 text-white">
                    {getGender(treasurerName, treasurerMember?.anggota_id)}
                  </span>
                </div>

                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Bendahara
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {treasurerName || "Belum Ditetapkan"}
                </h3>
              </div>

              {wakilBendahara.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Wakil Bendahara:
                  </span>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {wakilBendahara.map((wb, i) => {
                      const avatar = getAvatar(wb.name, wb.anggota_id, wb.avatar);
                      return (
                        <div
                          key={i}
                          className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200/70 dark:border-zinc-700/70 shadow-2xs"
                        >
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={wb.name}
                              className="w-5 h-5 rounded-full object-cover ring-1 ring-emerald-500/30 shrink-0"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[9px] font-bold shrink-0">
                              {getInitials(wb.name)}
                            </div>
                          )}
                          <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
                            {wb.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        <div>

          {/* LEVEL 3A: JAJARAN BIDANG */}
          {bidangGroups.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-center mb-6">
                <span className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
                <span className="px-3 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Jajaran Bidang Kepengurusan
                </span>
                <span className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bidangGroups.map((dept, idx) => (
                  <Card
                    key={idx}
                    className="p-4 bg-white dark:bg-zinc-900 border border-blue-200/70 dark:border-blue-900/40 rounded-xl shadow-none"
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                        {dept.name}
                      </h4>
                      <Badge className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] py-0 px-2 font-normal border border-blue-200/50 dark:border-blue-900/50">
                        {dept.members.length} Fungsionaris
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {dept.members.map((m, mIdx) => {
                        const avatar = getAvatar(m.name, m.anggota_id, m.avatar);
                        return (
                          <div key={mIdx} className="flex items-center gap-2.5">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={m.name}
                                className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500/30 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {getInitials(m.name)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                {m.name}
                              </p>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                                {m.position || "Anggota Bidang"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* LEVEL 3B: JAJARAN BIRO PELAKSANA */}
          {biroGroups.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-center mb-6">
                <span className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
                <span className="px-3 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <GitFork className="w-3.5 h-3.5" /> Jajaran Biro Pelaksana
                </span>
                <span className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {biroGroups.map((biro, idx) => (
                  <Card
                    key={idx}
                    className="p-4 bg-white dark:bg-zinc-900 border border-indigo-200/70 dark:border-indigo-900/40 rounded-xl shadow-none"
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                          {biro.name}
                        </h4>
                        {biro.department && (
                          <span className="text-[9.5px] text-zinc-400 block mt-0.5">
                            Naungan Bidang {biro.department}
                          </span>
                        )}
                      </div>
                      <Badge className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] py-0 px-2 font-normal border border-indigo-200/50 dark:border-indigo-900/50 shrink-0">
                        {biro.members.length} Fungsionaris
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {biro.members.map((m, mIdx) => {
                        const avatar = getAvatar(m.name, m.anggota_id, m.avatar);
                        return (
                          <div key={mIdx} className="flex items-center gap-2.5">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={m.name}
                                className="w-7 h-7 rounded-full object-cover ring-1 ring-indigo-500/30 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {getInitials(m.name)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                {m.name}
                              </p>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                                {m.position || "Anggota Biro"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* LEVEL 4: RAYON DI BAWAH NAUNGAN */}
          {komisariat.rayons && komisariat.rayons.length > 0 && (
            <div className="mt-12 p-6 bg-gradient-to-br from-zinc-50 to-blue-50/20 dark:from-zinc-900/50 dark:to-blue-950/10 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Rayon di Bawah Naungan Komisariat
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Basis kaderisasi tingkat fakultas / kejuruan di {campusName}
                    </p>
                  </div>
                </div>
                <Badge className="self-start sm:self-auto bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs py-0.5 px-2.5">
                  {komisariat.rayons.length} Rayon Aktif
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {komisariat.rayons.map((r, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 flex items-center gap-2.5 shadow-2xs hover:border-blue-500/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {r.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {r.memberCount ? `${r.memberCount} Kader Terdata` : "Basis Rayon Aktif"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. AGENDA KADERISASI & EVENT TERBUKA */}
      <section id="kaderisasi" className="py-16 md:py-20 bg-zinc-100/60 dark:bg-zinc-900/40 border-y border-zinc-200 dark:border-zinc-800 scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center space-y-2 mb-10 sm:mb-12">
            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60 text-[10px] font-semibold uppercase py-1 px-3 tracking-wider inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Agenda & Kaderisasi
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Agenda Kegiatan Terbuka
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
              Pelatihan formal penerimaan anggota baru (MAPABA), kaderisasi lanjutan, dan agenda pengembangan kapasitas diri bersama {komisariat.name}.
            </p>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {events.map((ev) => {
                const isClosed = ev.status === "CLOSED";
                const poster = (ev as any).image || (ev as any).imageUrl || (ev as any).poster;
                const level = (ev.level || "Kaderisasi").toUpperCase();
                const levelBadgeClass = level.includes("MAPABA")
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60"
                  : level.includes("PKD")
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/60"
                  : level.includes("PKL")
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60";

                return (
                  <Card
                    key={ev.id}
                    className="group bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-none hover:shadow-md hover:border-blue-500/40 transition-all duration-200 flex flex-col justify-between"
                  >
                    {poster && (
                      <div className="relative aspect-[16/8] overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800">
                        <img
                          src={poster}
                          alt={ev.title || ev.name}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        {/* Top Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge className={`${levelBadgeClass} border text-[10px] font-semibold uppercase py-0.5 px-2.5`}>
                            {ev.level || "Kaderisasi"}
                          </Badge>

                          {isClosed ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                              Pendaftaran Ditutup
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Pendaftaran Dibuka
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                          {ev.title || ev.name}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                          {ev.description || "Mari berproses dan ikuti pelatihan kaderisasi resmi untuk mengasah kapasitas intelektual dan kepemimpinan transformatif."}
                        </p>

                        {/* Metadata Pills */}
                        <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                          {ev.date && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>{formatIndonesianDate(ev.date)}</span>
                            </div>
                          )}

                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span className="truncate max-w-[180px]">{ev.location || campusName}</span>
                          </div>

                          {ev.quota ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                              <Users className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{ev.quota} Kuota Peserta</span>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Card Action Button */}
                      <div className="pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800">
                        {isClosed ? (
                          <div className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 font-semibold text-xs text-center cursor-not-allowed">
                            Pendaftaran Telah Berakhir
                          </div>
                        ) : (
                          <Link
                            href={`/register?event=${ev.id}&commissariat=${encodeURIComponent(komisariat.name)}`}
                            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs hover:shadow transition-all"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Daftar Sekarang</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-none">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-900/60">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Belum Ada Agenda Terbuka yang Dijadwalkan
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                Agenda Masa Penerimaan Anggota Baru (MAPABA) dan pelatihan terbuka di {campusName} akan segera diperbarui di sini.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <Link
                  href={registerUrl}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Daftar MAPABA / Anggota Baru</span>
                </Link>
                <a
                  href="#kontak"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Hubungi Fungsionaris</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. GALERI DOKUMENTASI KEGIATAN KOMISARIAT */}
      <section id="galeri" className="py-16 md:py-20 container mx-auto px-4 sm:px-6 max-w-5xl scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div className="space-y-2">
            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60 text-[10px] font-semibold uppercase py-1 px-3 tracking-wider inline-flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Dokumentasi & Galeri
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Galeri Jejak Pergerakan
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">
              Dokumentasi aktivitas, kaderisasi, aksi sosial, dan dinamika kebersamaan sahabat-sahabati di {komisariat.name}.
            </p>
          </div>

          {/* Filter kategori jika foto memiliki lebih dari 1 kategori */}
          {galleryCategories.length > 2 && (
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              {galleryCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedGalleryCategory(cat)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedGalleryCategory === cat
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredGallery.length > 0 ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveLightboxPhoto(item)}
                className="break-inside-avoid inline-block w-full mb-4 group cursor-pointer"
              >
                {/* Pinterest Pin Card */}
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-2xs hover:shadow-xl transition-all duration-300">
                  <img
                    src={item.imageUrl}
                    alt={item.title || "Dokumentasi Kegiatan"}
                    className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  {/* Category badge */}
                  {item.category && (
                    <span className="absolute top-2.5 left-2.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-zinc-200/60 dark:border-zinc-800 shadow-xs">
                      {item.category}
                    </span>
                  )}
                  {/* Pinterest hover overlay */}
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <span className="p-3 rounded-full bg-white/90 text-zinc-900 shadow-md transform group-hover:scale-105 transition-transform">
                      <ZoomIn className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                {/* Content jika ada */}
                {(item.title || item.caption || item.date) ? (
                  <div className="p-2 space-y-1">
                    {item.date && (
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-emerald-500" />
                        {formatIndonesianDate(item.date)}
                      </span>
                    )}
                    {item.title && (
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h3>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-none">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-900/60">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Galeri Dokumentasi Belum Diunggah
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
              Pengurus komisariat dapat mengunggah foto kegiatan, MAPABA, dan momentum pergerakan melalui menu Manajemen Komisariat di Dashboard Portal Pengurus.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Portal Pengurus Komisariat</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 7. ARTIKEL & WARTA KADER KOMISARIAT */}
      <section id="artikel" className="py-16 md:py-20 bg-zinc-100/60 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div className="space-y-2">
            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-1 px-3 tracking-wider inline-flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Warta & Opini Kader
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Artikel & Pemikiran Kader
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">
              Karya tulis ilmiah, gagasan wacana pergerakan, dan pemikiran intelektual kader {komisariat.name}.
            </p>
          </div>

          <Link
            href="/artikel"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            <span>Portal Artikel Cabang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((art) => (
              <Link
                key={art.id}
                href={`/artikel/${art.slug || art.id}`}
                className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-blue-500/40 hover:shadow-lg dark:hover:shadow-zinc-950/50 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <img
                      src={art.image || "/image/landing_page.png"}
                      alt={art.title}
                      className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-[10px] font-semibold text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-md border border-zinc-200/60 dark:border-zinc-800 shadow-xs">
                      {art.category}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-blue-500" />
                      {formatIndonesianDate(art.createdAt || (art as any).created_at || art.date)}
                    </span>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                      {art.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                  <span className="text-[11px] font-medium truncate max-w-[140px] text-zinc-700 dark:text-zinc-300">
                    {art.authorName || "Kader PMII"}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Baca Selengkapnya
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-none">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-900/60">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Belum Ada Publikasi Artikel dari {komisariat.name}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
              Kader dan pengurus {komisariat.name} belum menerbitkan artikel khusus di portal ini. Seluruh karya tulis yang diterbitkan oleh fungsionaris komisariat ini akan otomatis tampil di sini.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/artikel"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Kunjungi Portal Artikel Cabang</span>
              </Link>
            </div>
          </div>
        )}
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-8">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {komisariat.name}
            </span>
            <span className="hidden sm:inline text-zinc-400">•</span>
            <span>Bernaung di bawah Pengurus Cabang PMII Grobogan</span>
          </div>

          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Portal Cabang
            </Link>
            <span>•</span>
            <Link href={registerUrl} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Daftar MAPABA
            </Link>
          </div>
        </div>
      </footer>

      {/* LIGHTBOX MODAL */}
      {activeLightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => setActiveLightboxPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveLightboxPhoto(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
              aria-label="Tutup foto"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
              <img
                src={activeLightboxPhoto.imageUrl}
                alt={activeLightboxPhoto.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            {(activeLightboxPhoto.title || activeLightboxPhoto.caption || activeLightboxPhoto.category || activeLightboxPhoto.date) && (
              <div className="p-5 sm:p-6 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  {activeLightboxPhoto.category && (
                    <span className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-medium">
                      {activeLightboxPhoto.category}
                    </span>
                  )}
                  {activeLightboxPhoto.date && (
                    <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      {formatIndonesianDate(activeLightboxPhoto.date, true)}
                    </span>
                  )}
                </div>
                {activeLightboxPhoto.title && (
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {activeLightboxPhoto.title}
                  </h3>
                )}
                {activeLightboxPhoto.caption && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {activeLightboxPhoto.caption}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
