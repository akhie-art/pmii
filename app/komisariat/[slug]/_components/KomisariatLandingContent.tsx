"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  GraduationCap,
  Users,
  Calendar,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
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
  X,
  Network,
  LayoutGrid,
  Search,
  Crown,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [structureViewMode, setStructureViewMode] = useState<"tree" | "directory">("tree");
  const [searchDirectoryQuery, setSearchDirectoryQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("Semua");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

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

  const wakilKetuaList = useMemo(() => {
    return boardMembers.filter((b) => {
      const pos = (b.position || "").toLowerCase();
      return (
        (pos.includes("wakil ketua") || pos.includes("waka") || pos.includes("wakil mandataris")) &&
        !pos.includes("sekretaris") &&
        !pos.includes("bendahara")
      );
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
    const nonBph = boardMembers.filter((m) => {
      if (!m) return false;
      const dept = (m.department || "").toUpperCase();
      const pos = (m.position || "").toLowerCase();

      // Leadership exclusion so they don't leak into Bidang
      const isLeadership =
        (pos.includes("ketua") && !pos.includes("bidang") && !pos.includes("biro")) ||
        pos.includes("mandataris") ||
        pos.includes("wakil ketua") ||
        pos.includes("waka") ||
        (pos.includes("sekretaris") && !pos.includes("bidang")) ||
        (pos.includes("bendahara") && !pos.includes("bidang"));

      if (dept === "BPH" || dept === "PIMPINAN") return false;
      if (isLeadership && !m.biro && (!m.department || m.department === "BPH")) return false;

      return true;
    });

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
          biroMap.set(bName, { dept: m.department || "", members: [] });
        }
        biroMap.get(bName)!.members.push(m);
      } else {
        const rawDept = (m.department || "Lainnya").trim();
        const dName = rawDept.toLowerCase().startsWith("bidang")
          ? rawDept
          : `Bidang ${rawDept}`;

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

  // Direktori Lengkap Fungsionaris
  const allDirectoryMembers = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      position: string;
      department: string;
      biro?: string;
      gender: "Sahabat" | "Sahabati";
      avatar?: string;
      category: "Pimpinan" | "Bidang" | "Biro";
    }> = [];

    const addedNames = new Set<string>();

    if (chairmanName) {
      list.push({
        id: chairmanMember?.id || "chairman",
        name: chairmanName,
        position: chairmanMember?.position || "Ketua Mandataris / Ketua Komisariat",
        department: "BPH (Badan Pengurus Harian)",
        gender: getGender(chairmanName, chairmanMember?.anggota_id),
        avatar: getAvatar(chairmanName, chairmanMember?.anggota_id, chairmanMember?.avatar),
        category: "Pimpinan",
      });
      addedNames.add(chairmanName.toLowerCase().trim());
    }

    wakilKetuaList.forEach((wk, i) => {
      const key = wk.name?.toLowerCase().trim();
      if (key && !addedNames.has(key)) {
        list.push({
          id: wk.id || `wk-${i}`,
          name: wk.name,
          position: wk.position || "Wakil Ketua",
          department: wk.department || "BPH (Pimpinan Harian)",
          gender: getGender(wk.name, wk.anggota_id),
          avatar: getAvatar(wk.name, wk.anggota_id, wk.avatar),
          category: "Pimpinan",
        });
        addedNames.add(key);
      }
    });

    if (secretaryName) {
      const key = secretaryName.toLowerCase().trim();
      if (!addedNames.has(key)) {
        list.push({
          id: secretaryMember?.id || "secretary",
          name: secretaryName,
          position: secretaryMember?.position || "Sekretaris",
          department: "BPH (Sekretariat)",
          gender: getGender(secretaryName, secretaryMember?.anggota_id),
          avatar: getAvatar(secretaryName, secretaryMember?.anggota_id, secretaryMember?.avatar),
          category: "Pimpinan",
        });
        addedNames.add(key);
      }
    }

    wakilSekretaris.forEach((ws, i) => {
      const key = ws.name?.toLowerCase().trim();
      if (key && !addedNames.has(key)) {
        list.push({
          id: ws.id || `ws-${i}`,
          name: ws.name,
          position: ws.position || "Wakil Sekretaris",
          department: "BPH (Sekretariat)",
          gender: getGender(ws.name, ws.anggota_id),
          avatar: getAvatar(ws.name, ws.anggota_id, ws.avatar),
          category: "Pimpinan",
        });
        addedNames.add(key);
      }
    });

    if (treasurerName) {
      const key = treasurerName.toLowerCase().trim();
      if (!addedNames.has(key)) {
        list.push({
          id: treasurerMember?.id || "treasurer",
          name: treasurerName,
          position: treasurerMember?.position || "Bendahara",
          department: "BPH (Kebendaharaan)",
          gender: getGender(treasurerName, treasurerMember?.anggota_id),
          avatar: getAvatar(treasurerName, treasurerMember?.anggota_id, treasurerMember?.avatar),
          category: "Pimpinan",
        });
        addedNames.add(key);
      }
    }

    wakilBendahara.forEach((wb, i) => {
      const key = wb.name?.toLowerCase().trim();
      if (key && !addedNames.has(key)) {
        list.push({
          id: wb.id || `wb-${i}`,
          name: wb.name,
          position: wb.position || "Wakil Bendahara",
          department: "BPH (Kebendaharaan)",
          gender: getGender(wb.name, wb.anggota_id),
          avatar: getAvatar(wb.name, wb.anggota_id, wb.avatar),
          category: "Pimpinan",
        });
        addedNames.add(key);
      }
    });

    bidangGroups.forEach((group) => {
      group.members.forEach((m, i) => {
        const key = m.name?.toLowerCase().trim();
        if (key && !addedNames.has(key)) {
          list.push({
            id: m.id || `bidang-${group.name}-${i}`,
            name: m.name,
            position: m.position || "Fungsionaris Bidang",
            department: group.name,
            gender: getGender(m.name, m.anggota_id),
            avatar: getAvatar(m.name, m.anggota_id, m.avatar),
            category: "Bidang",
          });
          addedNames.add(key);
        }
      });
    });

    biroGroups.forEach((group) => {
      group.members.forEach((m, i) => {
        const key = m.name?.toLowerCase().trim();
        if (key && !addedNames.has(key)) {
          list.push({
            id: m.id || `biro-${group.name}-${i}`,
            name: m.name,
            position: m.position || "Fungsionaris Biro",
            department: group.name,
            biro: group.department ? `Naungan Bidang ${group.department}` : undefined,
            gender: getGender(m.name, m.anggota_id),
            avatar: getAvatar(m.name, m.anggota_id, m.avatar),
            category: "Biro",
          });
          addedNames.add(key);
        }
      });
    });

    boardMembers.forEach((bm) => {
      const key = bm?.name?.toLowerCase().trim();
      if (key && !addedNames.has(key)) {
        list.push({
          id: bm.id,
          name: bm.name,
          position: bm.position || "Pengurus",
          department: bm.department || "Pengurus Harian",
          gender: getGender(bm.name, bm.anggota_id),
          avatar: getAvatar(bm.name, bm.anggota_id, bm.avatar),
          category: "Bidang",
        });
        addedNames.add(key);
      }
    });

    return list;
  }, [
    chairmanName,
    chairmanMember,
    wakilKetuaList,
    secretaryName,
    secretaryMember,
    wakilSekretaris,
    treasurerName,
    treasurerMember,
    wakilBendahara,
    bidangGroups,
    biroGroups,
    boardMembers,
    cadres,
  ]);

  const filteredDirectoryMembers = useMemo(() => {
    return allDirectoryMembers.filter((m) => {
      const q = searchDirectoryQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.position.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q) ||
        (m.biro && m.biro.toLowerCase().includes(q));

      const matchesCategory =
        selectedDeptFilter === "Semua" || m.category === selectedDeptFilter;

      return matchesSearch && matchesCategory;
    });
  }, [allDirectoryMembers, searchDirectoryQuery, selectedDeptFilter]);

  const hasAnyBphData = Boolean(
    chairmanName ||
    secretaryName ||
    treasurerName ||
    wakilKetuaList.length > 0 ||
    wakilSekretaris.length > 0 ||
    wakilBendahara.length > 0 ||
    bidangGroups.length > 0 ||
    biroGroups.length > 0 ||
    boardMembers.length > 0
  );

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

  const registerUrl = komisariat ? `/register?commissariat=${encodeURIComponent(komisariat.name)}` : "/register";
  const campusName = komisariat?.university || (komisariat as any)?.campusName || "Perguruan Tinggi";

  // Carousel Slides Data
  const heroSlides = useMemo(() => {
    if (!komisariat) return [];
    const campus = komisariat.university || (komisariat as any).campusName || "Perguruan Tinggi";
    const period = bphData?.period || komisariat.structure?.period || "2026 - 2027";

    const defaultImg1 = "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1600&q=80";
    const defaultImg2 = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80";
    const defaultImg3 = "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&q=80";

    const img1 = gallery[0]?.imageUrl || defaultImg1;
    const img2 = gallery[1]?.imageUrl || defaultImg2;
    const img3 = gallery[2]?.imageUrl || defaultImg3;

    return [
      {
        id: "slide-1",
        badge: "Portal Resmi Komisariat",
        badgeIcon: Sparkles,
        badgeStyle: "bg-blue-500/20 text-blue-300 border-blue-400/30",
        headline: komisariat.name,
        subHeadline: campus,
        description: `Wadah pembinaan mahasiswa Islam berlandaskan Ahlussunnah wal Jama'ah — mengasah intelektualitas kritis, militansi gerakan, dan kepemimpinan transformatif di lingkungan ${campus}.`,
        image: img1,
        primaryCta: {
          label: "Daftar MAPABA Sekarang",
          href: registerUrl,
          icon: UserPlus,
        },
        secondaryCta: {
          label: "Jelajahi Profil & Visi",
          href: "#sejarah",
          icon: BookOpen,
        },
        metric: {
          value: cadresCount > 0 ? cadresCount : "Aktif",
          label: "Kader Terdata",
          sub: "Sahabat & Sahabati",
        },
      },
      {
        id: "slide-2",
        badge: "Kaderisasi & Pembinaan Anggota",
        badgeIcon: GraduationCap,
        badgeStyle: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
        headline: "Masa Penerimaan Anggota Baru",
        subHeadline: "MAPABA PMII " + campus,
        description: `Langkah awal menapaki proses pembentukan karakter, integritas intelektual, dan dialektika kritis mahasiswa. Bersiaplah menjadi bagian dari agen perubahan bangsa.`,
        image: img2,
        primaryCta: {
          label: "Registrasi Calon Peserta",
          href: registerUrl,
          icon: ArrowRight,
        },
        secondaryCta: {
          label: "Lihat Agenda Kegiatan",
          href: "#kaderisasi",
          icon: Calendar,
        },
        metric: {
          value: events.length > 0 ? `${events.length} Agenda` : "Terbuka",
          label: "Kegiatan Terjadwal",
          sub: "Kaderisasi & Forum",
        },
      },
      {
        id: "slide-3",
        badge: `Masa Khidmat ${period}`,
        badgeIcon: Crown,
        badgeStyle: "bg-amber-500/20 text-amber-300 border-amber-400/30",
        headline: "Badan Pengurus Harian",
        subHeadline: "Hierarki & Basis Rayon Terpadu",
        description: `Menjalankan amanah roda organisasi secara profesional dan transparan, menaungi ${(komisariat.rayons || []).length || "seluruh"} rayon fakultas di lingkungan ${campus}.`,
        image: img3,
        primaryCta: {
          label: "Bagan Struktur BPH",
          href: "#struktur",
          icon: Network,
        },
        secondaryCta: {
          label: "Galeri & Dokumentasi",
          href: "#galeri",
          icon: ImageIcon,
        },
        metric: {
          value: (komisariat.rayons || []).length > 0 ? `${(komisariat.rayons || []).length} Rayon` : "1 Komando",
          label: "Basis Rayon Aktif",
          sub: "Tingkat Fakultas",
        },
      },
    ];
  }, [komisariat, bphData, cadresCount, events, gallery, registerUrl]);

  // Auto-play interval
  useEffect(() => {
    if (!heroSlides.length || isCarouselPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [heroSlides.length, isCarouselPaused]);

  const nextSlide = () => {
    if (!heroSlides.length) return;
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    if (!heroSlides.length) return;
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
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

      {/* 2. HERO SECTION CAROUSEL */}
      <section className="relative pt-4 sm:pt-6 pb-6 sm:pb-8 overflow-hidden">
        <div className="container mx-auto px-3 sm:px-6 max-w-6xl">
          <div
            className="relative rounded-3xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-xl bg-zinc-950 text-white min-h-[500px] sm:min-h-[540px] md:min-h-[580px] flex flex-col justify-between"
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => setIsCarouselPaused(false)}
          >
            {/* Background Slides with AnimatePresence */}
            <div className="absolute inset-0 z-0">
              <AnimatePresence mode="wait">
                {heroSlides[currentSlide] && (
                  <motion.div
                    key={heroSlides[currentSlide].id}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <img
                      src={heroSlides[currentSlide].image}
                      alt={heroSlides[currentSlide].headline}
                      className="w-full h-full object-cover object-center"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Layered Gradient Overlays for High Contrast Readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/25 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/20 blur-3xl rounded-full pointer-events-none" />
            </div>

            {/* Top Bar inside Carousel: Campus Badge & Slide Count */}
            <div className="relative z-10 px-5 sm:px-8 md:px-12 pt-6 sm:pt-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] sm:text-xs font-semibold text-zinc-300 tracking-wider uppercase">
                  Portal Resmi PMII {campusName}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-mono font-medium text-zinc-300">
                <span className="text-white font-bold">0{currentSlide + 1}</span>
                <span className="text-zinc-500">/</span>
                <span className="text-zinc-400">0{heroSlides.length}</span>
              </div>
            </div>

            {/* Main Slide Content */}
            <div className="relative z-10 px-5 sm:px-8 md:px-12 py-8 sm:py-12 my-auto">
              <AnimatePresence mode="wait">
                {heroSlides[currentSlide] && (
                  <motion.div
                    key={heroSlides[currentSlide].id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                  >
                    {/* Left Column: Headlines & CTA */}
                    <div className="lg:col-span-8 space-y-4 sm:space-y-6">
                      {/* Badge */}
                      {(() => {
                        const BadgeIcon = heroSlides[currentSlide].badgeIcon;
                        return (
                          <div
                            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md shadow-xs ${heroSlides[currentSlide].badgeStyle}`}
                          >
                            <BadgeIcon className="w-3.5 h-3.5" />
                            <span>{heroSlides[currentSlide].badge}</span>
                          </div>
                        );
                      })()}

                      {/* Title */}
                      <div className="space-y-1.5">
                        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                          {heroSlides[currentSlide].headline}
                        </h1>
                        <span className="block text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-200 bg-clip-text text-transparent">
                          {heroSlides[currentSlide].subHeadline}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-base text-zinc-300 max-w-2xl leading-relaxed">
                        {heroSlides[currentSlide].description}
                      </p>

                      {/* CTA Buttons */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {(() => {
                          const PrimaryIcon = heroSlides[currentSlide].primaryCta.icon;
                          const SecondaryIcon = heroSlides[currentSlide].secondaryCta.icon;
                          return (
                            <>
                              <Link
                                href={heroSlides[currentSlide].primaryCta.href}
                                className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all cursor-pointer group"
                              >
                                <PrimaryIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span>{heroSlides[currentSlide].primaryCta.label}</span>
                              </Link>

                              <a
                                href={heroSlides[currentSlide].secondaryCta.href}
                                className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-white text-xs sm:text-sm font-medium transition-all cursor-pointer"
                              >
                                <SecondaryIcon className="w-4 h-4 text-blue-300" />
                                <span>{heroSlides[currentSlide].secondaryCta.label}</span>
                              </a>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Right Column: Featured Floating Card (Desktop & Tablet) */}
                    <div className="hidden lg:flex lg:col-span-4 justify-end">
                      <div className="p-5 rounded-2xl bg-white/10 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/15 shadow-2xl space-y-4 max-w-xs w-full">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-xs">
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
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">
                              {komisariat.name}
                            </h4>
                            <p className="text-[10px] text-zinc-300 truncate">
                              {campusName}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1">
                          <span className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider block">
                            {heroSlides[currentSlide].metric.label}
                          </span>
                          <span className="text-2xl font-extrabold text-white font-mono block">
                            {heroSlides[currentSlide].metric.value}
                          </span>
                          <span className="text-[10px] text-zinc-400 block">
                            {heroSlides[currentSlide].metric.sub}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-zinc-300">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>Terdaftar Resmi PC PMII Grobogan</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Controls: Navigation Arrows & Indicator Pills */}
            <div className="relative z-10 px-5 sm:px-8 md:px-12 pb-6 sm:pb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-4">
              {/* Slide Indicator Pills */}
              <div className="flex items-center gap-2">
                {heroSlides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlide(idx)}
                    className={`transition-all duration-300 rounded-full h-2 ${
                      currentSlide === idx
                        ? "w-8 sm:w-10 bg-gradient-to-r from-blue-500 to-indigo-500"
                        : "w-2 sm:w-2.5 bg-white/30 hover:bg-white/60"
                    }`}
                    aria-label={`Buka slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevSlide}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer"
                  aria-label="Slide sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer"
                  aria-label="Slide berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
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
        <div className="text-center space-y-2.5 mb-8 sm:mb-12">
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

          {/* View Mode Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
            <button
              type="button"
              onClick={() => setStructureViewMode("tree")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                structureViewMode === "tree"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Bagan Struktur (Hierarki)
            </button>
            <button
              type="button"
              onClick={() => setStructureViewMode("directory")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                structureViewMode === "directory"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Direktori Fungsionaris ({allDirectoryMembers.length})
            </button>
          </div>
        </div>

        {/* MODE 1: BAGAN STRUKTUR (HIERARKI) */}
        {structureViewMode === "tree" && (
          <div>
            {!hasAnyBphData && !chairmanName && !secretaryName && !treasurerName ? (
              <Card className="p-8 sm:p-12 text-center max-w-xl mx-auto bg-zinc-50/50 dark:bg-zinc-900/50 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Susunan Fungsionaris Sedang Dimutakhirkan
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                  Data pengurus dan bagan hierarki organisasi untuk masa khidmat ini sedang dalam proses digitalisasi oleh BPH terpilih.
                </p>
              </Card>
            ) : (
              <div className="relative">
                {/* LEVEL 1: KETUA KOMISARIAT */}
                <div className="w-72 max-w-full mx-auto">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 rounded-2xl blur-xs opacity-25 group-hover:opacity-40 transition duration-300" />
                    <Card className="relative p-5 bg-white dark:bg-zinc-900 border border-blue-500/40 rounded-2xl shadow-xs text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-bold uppercase tracking-wider mb-3">
                        <Crown className="w-3 h-3 text-amber-500" />
                        Ketua Mandataris
                      </div>

                      {/* Avatar */}
                      <div className="relative w-16 h-16 mx-auto mb-2.5">
                        {getAvatar(chairmanName, chairmanMember?.anggota_id) ? (
                          <img
                            src={getAvatar(chairmanName, chairmanMember?.anggota_id)}
                            alt={chairmanName}
                            className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500/40 shadow-xs"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg ring-2 ring-blue-500/40 shadow-xs">
                            {getInitials(chairmanName)}
                          </div>
                        )}
                        <span className="absolute -bottom-1 right-0 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-600 text-white shadow-2xs">
                          {getGender(chairmanName, chairmanMember?.anggota_id)}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {chairmanName || "Belum Ditetapkan"}
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                        Ketua Mandataris / Pimpinan Tertinggi
                      </p>
                    </Card>
                  </div>
                </div>

                {/* CONNECTOR STEM FROM KETUA */}
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-700" />
                </div>

                {/* LEVEL 2: WAKIL-WAKIL KETUA (JIKA ADA) */}
                {wakilKetuaList.length > 0 && (
                  <div className="mb-6">
                    {/* Horizontal distributor bar across Wakil Ketua */}
                    {wakilKetuaList.length > 1 && (
                      <div className="hidden sm:block relative max-w-2xl mx-auto h-3">
                        <div className="absolute top-0 left-12 right-12 h-0.5 bg-zinc-300 dark:bg-zinc-700" />
                      </div>
                    )}
                    <div
                      className={`grid gap-3.5 mx-auto ${
                        wakilKetuaList.length === 1
                          ? "max-w-xs"
                          : wakilKetuaList.length === 2
                          ? "grid-cols-1 sm:grid-cols-2 max-w-xl"
                          : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-3xl"
                      }`}
                    >
                      {wakilKetuaList.map((wk, idx) => {
                        const av = getAvatar(wk.name, wk.anggota_id, wk.avatar);
                        const g = getGender(wk.name, wk.anggota_id);
                        return (
                          <div key={idx} className="flex flex-col items-center">
                            {wakilKetuaList.length > 1 && (
                              <div className="hidden sm:block w-0.5 h-3 bg-zinc-300 dark:bg-zinc-700 mb-1" />
                            )}
                            <Card className="w-full p-3.5 bg-white dark:bg-zinc-900 border border-blue-200/80 dark:border-blue-900/50 rounded-xl shadow-none text-center hover:border-blue-500/40 transition-colors">
                              <div className="relative w-11 h-11 mx-auto mb-2">
                                {av ? (
                                  <img
                                    src={av}
                                    alt={wk.name}
                                    className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500/20"
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                                    {getInitials(wk.name)}
                                  </div>
                                )}
                                <span className="absolute -bottom-0.5 right-0 px-1.5 py-0.2 rounded-full text-[8px] font-semibold bg-blue-600 text-white">
                                  {g}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                                {wk.position || `Wakil Ketua ${idx + 1}`}
                              </span>
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                                {wk.name}
                              </h4>
                              {wk.department && wk.department !== "BPH" && (
                                <span className="text-[9.5px] text-zinc-400 dark:text-zinc-500 block mt-0.5">
                                  {wk.department}
                                </span>
                              )}
                            </Card>
                          </div>
                        );
                      })}
                    </div>

                    {/* Stem down to Sekretaris & Bendahara */}
                    <div className="flex flex-col items-center mt-3">
                      <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-700" />
                    </div>
                  </div>
                )}

                {/* CONNECTOR LINE TO SEKRETARIS & BENDAHARA */}
                <div className="hidden sm:block relative max-w-2xl mx-auto h-6">
                  {/* Stem from above into junction */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-zinc-300 dark:bg-zinc-700" />
                  {/* Horizontal bar linking col 1 (25%) and col 2 (75%) */}
                  <div className="absolute top-3 left-[25%] right-[25%] h-0.5 bg-zinc-300 dark:bg-zinc-700" />
                  {/* Drop pin to Sekretaris */}
                  <div className="absolute top-3 left-[25%] w-0.5 h-3 bg-zinc-300 dark:bg-zinc-700" />
                  {/* Drop pin to Bendahara */}
                  <div className="absolute top-3 right-[25%] w-0.5 h-3 bg-zinc-300 dark:bg-zinc-700" />
                </div>

                {/* Mobile drop line */}
                <div className="sm:hidden flex justify-center my-2">
                  <div className="w-0.5 h-4 bg-zinc-300 dark:bg-zinc-700" />
                </div>

                {/* LEVEL 3: SEKRETARIS & BENDAHARA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {/* SEKRETARIS */}
                  <Card className="p-4.5 bg-white dark:bg-zinc-900 border border-indigo-200/80 dark:border-indigo-900/50 rounded-2xl shadow-none hover:border-indigo-500/40 transition-all text-center flex flex-col justify-between">
                    <div>
                      <div className="relative w-13 h-13 mx-auto mb-2.5">
                        {getAvatar(secretaryName, secretaryMember?.anggota_id) ? (
                          <img
                            src={getAvatar(secretaryName, secretaryMember?.anggota_id)}
                            alt={secretaryName}
                            className="w-13 h-13 rounded-full object-cover ring-2 ring-indigo-500/20"
                          />
                        ) : (
                          <div className="w-13 h-13 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-200 dark:border-indigo-900">
                            {getInitials(secretaryName)}
                          </div>
                        )}
                        <span className="absolute -bottom-0.5 right-0 px-1.5 py-0.2 rounded-full text-[8px] font-semibold bg-indigo-600 text-white">
                          {getGender(secretaryName, secretaryMember?.anggota_id)}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                        Sekretaris Komisariat
                      </span>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                        {secretaryName || "Belum Ditetapkan"}
                      </h3>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        Tata Kelola Administrasi & Kesekretariatan
                      </p>
                    </div>

                    {wakilSekretaris.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                          Wakil Sekretaris ({wakilSekretaris.length})
                        </span>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {wakilSekretaris.map((ws, i) => {
                            const avatar = getAvatar(ws.name, ws.anggota_id, ws.avatar);
                            return (
                              <div
                                key={i}
                                className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/40"
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
                  <Card className="p-4.5 bg-white dark:bg-zinc-900 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl shadow-none hover:border-emerald-500/40 transition-all text-center flex flex-col justify-between">
                    <div>
                      <div className="relative w-13 h-13 mx-auto mb-2.5">
                        {getAvatar(treasurerName, treasurerMember?.anggota_id) ? (
                          <img
                            src={getAvatar(treasurerName, treasurerMember?.anggota_id)}
                            alt={treasurerName}
                            className="w-13 h-13 rounded-full object-cover ring-2 ring-emerald-500/20"
                          />
                        ) : (
                          <div className="w-13 h-13 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-200 dark:border-emerald-900">
                            {getInitials(treasurerName)}
                          </div>
                        )}
                        <span className="absolute -bottom-0.5 right-0 px-1.5 py-0.2 rounded-full text-[8px] font-semibold bg-emerald-600 text-white">
                          {getGender(treasurerName, treasurerMember?.anggota_id)}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                        Bendahara Komisariat
                      </span>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                        {treasurerName || "Belum Ditetapkan"}
                      </h3>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        Manajemen Anggaran & Kebendaharaan
                      </p>
                    </div>

                    {wakilBendahara.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                          Wakil Bendahara ({wakilBendahara.length})
                        </span>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {wakilBendahara.map((wb, i) => {
                            const avatar = getAvatar(wb.name, wb.anggota_id, wb.avatar);
                            return (
                              <div
                                key={i}
                                className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/40"
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

                {/* CONNECTOR STEM TO JAJARAN BIDANG */}
                {bidangGroups.length > 0 && (
                  <div className="flex flex-col items-center my-10">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-zinc-300 via-blue-400 to-blue-500 dark:from-zinc-700 dark:via-blue-600 dark:to-blue-500" />
                    <div className="px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5 shadow-2xs">
                      <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Jajaran Bidang Kepengurusan ({bidangGroups.length})
                    </div>
                    <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-700" />
                  </div>
                )}

                {/* LEVEL 4: JAJARAN BIDANG */}
                {bidangGroups.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bidangGroups.map((dept, idx) => (
                      <Card
                        key={idx}
                        className="p-4 bg-white dark:bg-zinc-900 border border-blue-200/70 dark:border-blue-900/40 rounded-xl shadow-none hover:border-blue-500/30 transition-colors"
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
                )}

                {/* CONNECTOR STEM TO JAJARAN BIRO */}
                {biroGroups.length > 0 && (
                  <div className="flex flex-col items-center my-10">
                    <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-700" />
                    <div className="px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 shadow-2xs">
                      <GitFork className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Jajaran Biro Pelaksana Teknis ({biroGroups.length})
                    </div>
                    <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-700" />
                  </div>
                )}

                {/* LEVEL 5: JAJARAN BIRO PELAKSANA */}
                {biroGroups.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {biroGroups.map((biro, idx) => (
                      <Card
                        key={idx}
                        className="p-4 bg-white dark:bg-zinc-900 border border-indigo-200/70 dark:border-indigo-900/40 rounded-xl shadow-none hover:border-indigo-500/30 transition-colors"
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
                )}

                {/* LEVEL 6: RAYON DI BAWAH NAUNGAN */}
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
            )}
          </div>
        )}

        {/* MODE 2: DIREKTORI FUNGSIONARIS LENGKAP */}
        {structureViewMode === "directory" && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Cari fungsionaris, nama, posisi, atau bidang..."
                  value={searchDirectoryQuery}
                  onChange={(e) => setSearchDirectoryQuery(e.target.value)}
                  className="pl-9 h-9 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700"
                />
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(["Semua", "Pimpinan", "Bidang", "Biro"] as const).map((cat) => {
                  const count =
                    cat === "Semua"
                      ? allDirectoryMembers.length
                      : allDirectoryMembers.filter((m) => m.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedDeptFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedDeptFilter === cat
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      {cat} <span className="opacity-70 text-[10px]">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cadres Grid */}
            {filteredDirectoryMembers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredDirectoryMembers.map((member) => (
                  <Card
                    key={member.id}
                    className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl hover:border-blue-500/40 transition-all flex items-center gap-3.5 group shadow-2xs"
                  >
                    <div className="relative w-12 h-12 shrink-0">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20 group-hover:ring-blue-500/50 transition-all"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-200/60 dark:border-blue-900/60">
                          {getInitials(member.name)}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-0.5 px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-blue-600 text-white shadow-2xs">
                        {member.gender}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                            member.category === "Pimpinan"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                              : member.category === "Biro"
                              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                          }`}
                        >
                          {member.category}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 truncate">
                        {member.name}
                      </h4>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate font-medium">
                        {member.position}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                        {member.department}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <Search className="w-8 h-8 text-zinc-400 mx-auto mb-2 opacity-60" />
                <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Tidak Ada Fungsionaris yang Cocok
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Coba kata kunci lain atau bersihkan filter pencarian Anda.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchDirectoryQuery("");
                    setSelectedDeptFilter("Semua");
                  }}
                  className="mt-3 text-xs"
                >
                  Reset Filter
                </Button>
              </div>
            )}
          </div>
        )}
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
