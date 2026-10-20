"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  Calendar,
  Mail,
  ArrowRight,
  Plus,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Award,
  GraduationCap,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Clock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { db } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isUserSuperAdmin } from "@/lib/auth-helpers";
import {
  isRecordInTenant,
  getActiveTenant,
  TENANT_CHANGED_EVENT,
  isCabangOrAdmin,
  getTenantNameById
} from "@/lib/tenancy";

export default function DashboardHome() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Database metrics states
  const [cadres, setCadres] = useState<any[]>([]);
  const [commissariats, setCommissariats] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [letters, setLetters] = useState<any[]>([]);

  const [activeTenant, setActiveTenant] = useState<string>("ALL");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (stored) {
        try {
          const u = JSON.parse(stored);
          setCurrentUser(u);
          setActiveTenant(getActiveTenant(u) || "ALL");
        } catch (e) {
          console.error("Error reading user session:", e);
        }
      }

      const handleTenant = (e: any) => {
        setActiveTenant(e.detail?.activeTenant || "ALL");
      };
      window.addEventListener(TENANT_CHANGED_EVENT, handleTenant);
      return () => window.removeEventListener(TENANT_CHANGED_EVENT, handleTenant);
    }
  }, []);

  // Fetch real-time dashboard data
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        let cadresData: any[] = [];
        let commData: any[] = [];
        let eventsData: any[] = [];
        let lettersData: any[] = [];

        // 1. Fetch Cadres / Anggota
        try {
          cadresData = await db.getCadres([]);
        } catch (e) {
          console.warn("db.getCadres warning:", e);
        }

        // Direct fallback jika kosong
        if ((!cadresData || cadresData.length === 0) && isSupabaseConfigured && supabase) {
          try {
            const { data } = await supabase.from("anggota").select("*");
            if (data && data.length > 0) cadresData = data;
          } catch {}
        }

        // 2. Fetch Commissariats
        try {
          commData = await db.getCommissariats([]);
        } catch (e) {
          console.warn("db.getCommissariats warning:", e);
        }

        if ((!commData || commData.length === 0) && isSupabaseConfigured && supabase) {
          try {
            const { data } = await supabase.from("tenant").select("*");
            if (data && data.length > 0) commData = data;
          } catch {}
        }

        // 3. Fetch Events
        try {
          eventsData = await db.getEvents([]);
        } catch (e) {
          console.warn("db.getEvents warning:", e);
        }

        if ((!eventsData || eventsData.length === 0) && isSupabaseConfigured && supabase) {
          try {
            const { data } = await supabase.from("kegiatan").select("*");
            if (data && data.length > 0) eventsData = data;
          } catch {}
        }

        // 4. Fetch Letters / Surat
        try {
          lettersData = await db.getSurat().catch(() => []);
        } catch (e) {
          console.warn("db.getSurat warning:", e);
        }

        if ((!lettersData || lettersData.length === 0) && isSupabaseConfigured && supabase) {
          try {
            const { data } = await supabase.from("surat").select("*");
            if (data && data.length > 0) lettersData = data;
          } catch {}
        }

        setCadres(cadresData || []);
        setCommissariats(commData || []);
        setEvents(eventsData || []);
        setLetters(lettersData || []);
      } catch (err) {
        console.error("Dashboard stats fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const userRole = (currentUser?.role || "").toLowerCase();
  const isAdmin = userRole === "admin" || userRole === "cabang" || userRole === "pc" || userRole === "superadmin" || userRole === "super_admin";
  const isSuperAdmin = isUserSuperAdmin(userRole, currentUser?.email);
  const isInstruktur = userRole === "instruktur";
  const isCabang = isCabangOrAdmin(currentUser);

  const matchRole = pathname ? pathname.match(/^\/(admin|pengurus|instruktur|dashboard)/) : null;
  const staffPrefix = matchRole && matchRole[1] !== "dashboard"
    ? `/${matchRole[1]}`
    : (isAdmin ? "/admin" : isInstruktur ? "/instruktur" : "/pengurus");

  const tenantOrKomisariatUrl = `${staffPrefix}/${isSuperAdmin ? "tenant" : "komisariat"}`;
  const tenantOrKomisariatLabel = isSuperAdmin ? "Data Tenant" : "Data Komisariat";

  // Perhitungan Statistik Berdasarkan Tenant Aktif
  const scopedCadres = useMemo(() => {
    return cadres.filter((c) => isRecordInTenant(currentUser, c, activeTenant));
  }, [cadres, currentUser, activeTenant]);

  const scopedEvents = useMemo(() => {
    return events.filter((e) => isRecordInTenant(currentUser, e, activeTenant));
  }, [events, currentUser, activeTenant]);

  const scopedLetters = useMemo(() => {
    return letters.filter((l) => isRecordInTenant(currentUser, l, activeTenant));
  }, [letters, currentUser, activeTenant]);

  const totalCadres = scopedCadres.length;
  const mapabaCount = scopedCadres.filter((c) => (c.level || "").toUpperCase() === "MAPABA").length;
  const pkdCount = scopedCadres.filter((c) => (c.level || "").toUpperCase() === "PKD").length;
  const pklCount = scopedCadres.filter((c) => (c.level || "").toUpperCase() === "PKL").length;

  const totalCommissariats = isCabang ? (commissariats.length || 4) : 1;
  const totalEvents = scopedEvents.length;
  const totalLetters = scopedLetters.length;

  // Sebaran Kader per Komisariat
  const defaultCommissariatsList = [
    { name: "Komisariat Ki Ageng Tarub", campus: "STAI Walisembilan Semarang" },
    { name: "Komisariat Ajisaka", campus: "STAI Grobogan" },
    { name: "Komisariat Joko Suro", campus: "STAI Walisembilan Semarang" },
    { name: "Komisariat Ki Ageng Getas Pendawa", campus: "Universitas An Nuur" },
  ];

  const relevantCommissariatsList = useMemo(() => {
    if (!isCabang) {
      const userComm = currentUser?.commissariat || (currentUser?.tenant_id ? getTenantNameById(currentUser.tenant_id) : "");
      return defaultCommissariatsList.filter((c) =>
        isRecordInTenant(currentUser, { commissariat: c.name, campus: c.campus })
      );
    }
    if (activeTenant && activeTenant !== "ALL") {
      return defaultCommissariatsList.filter((c) =>
        isRecordInTenant(currentUser, { commissariat: c.name, campus: c.campus }, activeTenant)
      );
    }
    return defaultCommissariatsList;
  }, [currentUser, activeTenant, isCabang]);

  const commissariatDistribution = relevantCommissariatsList.map((comm) => {
    const count = cadres.filter((c) => {
      const memberComm = (c.commissariat || c.komisariat || "").toLowerCase();
      const targetName = comm.name.toLowerCase();
      const targetCampus = comm.campus.toLowerCase();
      return (
        memberComm.includes(targetName) ||
        targetName.includes(memberComm) ||
        memberComm.includes(targetCampus)
      );
    }).length;

    const percentage = totalCadres > 0 ? Math.round((count / totalCadres) * 100) : 0;

    return {
      name: comm.name,
      campus: comm.campus,
      count,
      percentage
    };
  });

  // Anggota Terbaru (maks 5) dari data yang terfilter tenant
  const recentCadres = scopedCadres.slice(-5).reverse();

  // Tanggal Hari Ini (Format Indonesia)
  const currentDateFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  } as const;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-7xl mx-auto text-zinc-900 dark:text-zinc-100 font-sans pb-10"
    >
      {/* 1. WELCOME BANNER EXECUTIVE */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 p-6 md:p-8 text-white shadow-sm border border-blue-800/40"
      >
        {/* Background glow & decoration */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 bottom-0 -mb-8 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-300" />
                {currentDateFormatted}
              </span>
              <Badge className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-semibold uppercase px-2 py-0.5">
                {isAdmin ? "Pimpinan Cabang" : isInstruktur ? "Instruktur" : "Pengurus"}
              </Badge>
            </div>

            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-white">
              Selamat Datang, {currentUser?.name || "Sahabat"}!
            </h1>
            <p className="text-xs md:text-sm text-blue-100/80 leading-relaxed max-w-2xl">
              {isAdmin
                ? "Pusat Kendali Sistem Informasi & Administrasi Terpadu Pengurus Cabang PMII Grobogan. Pantau pangkalan data kader, komisariat naungan, dan persuratan resmi."
                : isInstruktur
                ? "Panel Fasilitator & Instruktur Kaderisasi PMII. Input penilaian forum, pantau keaktifan peserta, dan rekapitulasi hasil yudisium."
                : `Sistem Informasi Manajemen & Administrasi ${currentUser?.commissariat || "PMII"}. Kelola keanggotaan dan aktivitas kaderisasi.`}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link href={`${staffPrefix}/anggota`}>
              <Button className="h-9 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all border-none cursor-pointer">
                <Plus className="w-4 h-4" />
                <span>Registrasi Anggota</span>
              </Button>
            </Link>
            <Link href={`${staffPrefix}/surat`}>
              <Button className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer">
                <Mail className="w-4 h-4" />
                <span>Buat Surat</span>
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* 2. 4 KEY METRIC CARDS (REAL-TIME STATS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        
        {/* Card 1: Total Anggota / Kader */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none p-5 h-full flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Users className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[10px] text-zinc-500 font-normal">
                  Pangkalan Data
                </Badge>
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Kader Terdaftar</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {loading ? "..." : totalCadres}
                  </span>
                  <span className="text-xs text-zinc-400">Anggota</span>
                </div>
              </div>

              {/* Jenjang Kaderisasi Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium border border-blue-200/50 dark:border-blue-900/50">
                  {mapabaCount} Mapaba
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-medium border border-amber-200/50 dark:border-amber-900/50">
                  {pkdCount} PKD
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200/50 dark:border-emerald-900/50">
                  {pklCount} PKL
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 mt-4">
              <Link href={`${staffPrefix}/anggota`} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                <span>Kelola Database Anggota</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Card 2: Komisariat Naungan */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none p-5 h-full flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[10px] text-zinc-500 font-normal">
                  PC Grobogan
                </Badge>
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Komisariat Naungan</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {loading ? "..." : totalCommissariats}
                  </span>
                  <span className="text-xs text-zinc-400">Komisariat Resmi</span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Ki Ageng Tarub, Ajisaka, Joko Suro, Getas Pendawa.
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 mt-4">
              <Link href={tenantOrKomisariatUrl} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                <span>Lihat {tenantOrKomisariatLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Card 3: Agenda & Kegiatan */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none p-5 h-full flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[10px] text-zinc-500 font-normal">
                  Kaderisasi
                </Badge>
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Agenda & Pelatihan</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {loading ? "..." : totalEvents}
                  </span>
                  <span className="text-xs text-zinc-400">Kegiatan Terdaftar</span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Pelatihan formal (Mapaba/PKD), kajian publik, dan RTL.
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 mt-4">
              <Link href={`${staffPrefix}/kegiatan`} className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                <span>Kelola Agenda Acara</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Card 4: Administrasi & Surat */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none p-5 h-full flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200/80 dark:border-violet-900/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <Mail className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[10px] text-zinc-500 font-normal">
                  Administrasi
                </Badge>
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Dokumen & Surat</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {loading ? "..." : totalLetters}
                  </span>
                  <span className="text-xs text-zinc-400">Surat Resmi</span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Arsip nomor surat resmi, SK, dan template persuratan.
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 mt-4">
              <Link href={`${staffPrefix}/surat`} className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
                <span>Buka Tata Persuratan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </motion.div>

      </div>

      {/* 3. TWO-COLUMN DASHBOARD SECTION: SEBARAN KOMISARIAT & ANGGOTA TERBARU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sebaran Kader per Komisariat (2 Cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold tracking-wide flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Distribusi Kader per Komisariat</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Rekapitulasi persebaran anggota di 4 komisariat naungan PMII Grobogan
                </CardDescription>
              </div>

              <Link href={tenantOrKomisariatUrl}>
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-blue-600 dark:text-blue-400 cursor-pointer">
                  Detail <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-4">
              {commissariatDistribution.map((item, index) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{item.name}</span>
                      <span className="text-[11px] text-zinc-400 ml-2">({item.campus})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.count} Kader</span>
                      <span className="text-[10px] text-zinc-400 font-mono">({item.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(item.percentage, item.count > 0 ? 35 : 0))}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column: Anggota Terbaru Onboarded (1 Col) */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none h-full flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold tracking-wide flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Anggota Terbaru</span>
                  </CardTitle>
                  <CardDescription className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Data kader terdaftar terakhir
                  </CardDescription>
                </div>

                <Link href={`${staffPrefix}/anggota`}>
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer">
                    Semua
                  </Button>
                </Link>
              </CardHeader>

              <CardContent className="p-4 divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {recentCadres.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-400">
                    Belum ada anggota terdaftar.
                  </div>
                ) : (
                  recentCadres.map((member) => (
                    <div key={member.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                      <Avatar className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {member.name ? member.name.slice(0, 2).toUpperCase() : "PM"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {member.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {member.commissariat || "PK PMII Grobogan"}
                        </p>
                      </div>
                      <Badge className="text-[9px] px-1.5 py-0 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-none shrink-0">
                        {member.level || "MAPABA"}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <Link href={`${staffPrefix}/anggota`}>
                <Button variant="outline" className="w-full text-xs h-8 border-zinc-200 dark:border-zinc-800 cursor-pointer">
                  Lihat Seluruh Anggota ({totalCadres})
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

      </div>

      {/* 4. MODUL AKSES CEPAT (BOTTOM NAVIGATION) */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Data Anggota", href: `${staffPrefix}/anggota`, icon: Users },
            { label: tenantOrKomisariatLabel, href: tenantOrKomisariatUrl, icon: Building2 },
            { label: "Agenda Kegiatan", href: `${staffPrefix}/kegiatan`, icon: Calendar },
            { label: "Tata Persuratan", href: `${staffPrefix}/surat`, icon: Mail },
            { label: "Materi & Silabus", href: `${staffPrefix}/materi`, icon: BookOpen },
            { label: "Rekap Yudisium", href: `${staffPrefix}/rekap-nilai`, icon: TrendingUp },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

    </motion.div>
  );
}
