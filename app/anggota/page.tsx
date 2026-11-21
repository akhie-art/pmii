"use client";

import React, { useState, useEffect } from "react";
import { db, type Anggota } from "@/lib/db";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  FileText,
  UserCheck,
  ArrowRight,
  User,
  GraduationCap,
  Building2,
  ShieldCheck,
  ClipboardList,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

type Tone = "blue" | "emerald" | "indigo" | "amber";

const toneClasses: Record<Tone, { icon: string; glow: string }> = {
  blue: {
    icon: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400",
    glow: "group-hover:border-blue-300 dark:group-hover:border-blue-800"
  },
  emerald: {
    icon: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400",
    glow: "group-hover:border-emerald-300 dark:group-hover:border-emerald-800"
  },
  indigo: {
    icon: "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400",
    glow: "group-hover:border-indigo-300 dark:group-hover:border-indigo-800"
  },
  amber: {
    icon: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400",
    glow: "group-hover:border-amber-300 dark:group-hover:border-amber-800"
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 25 } }
} as const;

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
} as const;

function StatTile({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5"
    >
      <div className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center ${toneClasses[tone].icon}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{value}</p>
      </div>
    </motion.div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  href,
  cta,
  tone,
  primary,
  badge
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: Tone;
  primary?: boolean;
  badge?: string;
}) {
  return (
    <motion.div variants={itemVariants} className="h-full">
      <Link href={href} className="group block h-full focus:outline-none">
        <Card
          className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none p-5 h-full flex flex-col justify-between gap-5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-blue-500 ${toneClasses[tone].glow}`}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${toneClasses[tone].icon}`}>
                <Icon className="w-5 h-5" />
              </div>
              {badge && (
                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-[10px] font-semibold">
                  {badge}
                </Badge>
              )}
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</CardTitle>
              <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-3">
                {description}
              </CardDescription>
            </div>
          </div>

          <div
            className={`flex items-center justify-between text-xs font-semibold rounded-lg px-3 h-9 transition-colors ${
              primary
                ? "bg-blue-600 text-white group-hover:bg-blue-700"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700"
            }`}
          >
            <span>{cta}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function KaderDashboardPage() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [anggota, setAnggota] = useState<Anggota | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const activeId = typeof window !== "undefined" ? (localStorage.getItem("PMII_ACTIVE_ANGGOTA_ID") || localStorage.getItem("PMII_ACTIVE_CADRE_ID") || "") : "";
      const savedUserStr = typeof window !== "undefined" ? localStorage.getItem("PMII_LOGGED_IN_USER") : null;
      let loggedInUser: any = null;
      if (savedUserStr) {
        try {
          loggedInUser = JSON.parse(savedUserStr);
        } catch (e) {}
      }

      const anggotaList = await db.getAnggota([]);
      const currentAnggota = (activeId ? anggotaList.find((c: any) => c.id === activeId) : null) ||
                             (loggedInUser ? anggotaList.find((c: any) => c.id === loggedInUser.id || (c.email && c.email.toLowerCase() === loggedInUser.email?.toLowerCase())) : null) ||
                             anggotaList[0] || null;

      setAnggota(currentAnggota);
      setMounted(true);
    };
    loadData();
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-36 bg-zinc-200 dark:bg-zinc-800/40 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-zinc-200 dark:bg-zinc-800/40 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-zinc-200 dark:bg-zinc-800/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!anggota) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md mx-auto shadow-sm space-y-6 text-zinc-900 dark:text-zinc-100">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Profil Tidak Ditemukan</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Data profil Anda tidak ditemukan. Silakan masuk kembali dengan akun Anda atau lakukan pendaftaran.
          </p>
        </div>
        <div className="flex gap-3 w-full justify-center">
          <Link href="/login" className="w-1/2">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 rounded-xl border-none cursor-pointer">
              Masuk
            </Button>
          </Link>
          <Link href="/register" className="w-1/2">
            <Button variant="outline" className="w-full border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs h-9 rounded-xl cursor-pointer">
              Daftar
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const match = pathname ? pathname.match(/^\/(peserta|anggota|kader)/) : null;
  const rolePrefix = match ? `/${match[1]}` : (anggota?.role ? `/${anggota.role.toLowerCase()}` : "/peserta");
  const isPeserta = (match ? match[1] : (anggota?.role ? anggota.role.toLowerCase() : "peserta")) === "peserta" || rolePrefix === "/peserta";

  const initials = (anggota.name || "K")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const firstName = (anggota.name || "").split(" ")[0] || "Sahabat";
  const statusLabel = anggota.isGraduated
    ? "Lulus"
    : anggota.status === "AKTIF"
    ? "Aktif"
    : anggota.status === "SELESAI"
    ? "Selesai"
    : anggota.status === "REVISI"
    ? "Perlu Revisi"
    : anggota.status || "-";
  const submissionCount = Array.isArray(anggota.submissions) ? anggota.submissions.length : 0;
  const idNumber = anggota.nipa || anggota.nta || anggota.registrationNumber || "-";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-5xl mx-auto text-zinc-900 dark:text-zinc-100"
    >
      {/* 1. WELCOME BANNER */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-blue-50 via-white to-white dark:from-blue-950/40 dark:via-zinc-900 dark:to-zinc-900 p-5 md:p-6"
      >
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {isPeserta ? "Portal Peserta" : "Portal Anggota"}
            </p>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Selamat datang, {firstName}!
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
              {isPeserta
                ? "Pantau agenda pelatihan, kerjakan alur kegiatan, dan lihat profil Anda."
                : "Akses bahan ajar silabus, serahkan laporan progres RKTL, dan lihat identitas keanggotaan Anda."}
            </p>
          </div>
          <Badge
            className={`self-start sm:self-center shrink-0 border text-[11px] font-semibold px-2.5 py-1 ${
              anggota.isGraduated || anggota.status === "AKTIF"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900"
            }`}
          >
            {statusLabel}
          </Badge>
        </div>
      </motion.div>

      {/* 2. RINGKASAN PROFIL */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile icon={GraduationCap} label="Tingkat Kaderisasi" value={anggota.level || "-"} tone="blue" />
        <StatTile icon={Building2} label="Komisariat" value={anggota.commissariat || "-"} tone="indigo" />
        <StatTile icon={ShieldCheck} label="No. Anggota" value={idNumber} tone="emerald" />
        <StatTile icon={ClipboardList} label="Tugas Terkirim" value={`${submissionCount} tugas`} tone="amber" />
      </div>

      {/* 3. MENU CEPAT */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
          Menu Cepat
        </h2>
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isPeserta ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4`}>
          {!isPeserta && (
            <ActionCard
              icon={BookOpen}
              title="Materi & Silabus"
              description="Pelajari modul resmi MAPABA, kajian Aswaja, dan latihan kuis mandiri."
              href={`${rolePrefix}/materi`}
              cta="Buka Silabus"
              tone="blue"
            />
          )}
          <ActionCard
            icon={Calendar}
            title="Agenda Kegiatan"
            description="Daftar pelatihan kaderisasi formal, kajian publik, dan agenda komisariat."
            href={`${rolePrefix}/kegiatan`}
            cta="Lihat Kegiatan"
            tone="indigo"
            primary
          />
          <ActionCard
            icon={FileText}
            title="Tugas RTL Kegiatan"
            description="Pantau tahapan kegiatan dan kumpulkan tugas RTL langsung pada alur agenda Anda."
            href={`${rolePrefix}/kegiatan`}
            cta="Buka Kegiatan & RTL"
            tone="amber"
            primary
          />
          <ActionCard
            icon={UserCheck}
            title="Profil & E-KTA"
            description="Kelola data diri, status registrasi, dan unduh Kartu Identitas Digital."
            href={`${rolePrefix}/profil`}
            cta="Lihat Profil"
            tone="emerald"
            badge={anggota.isGraduated ? "Terverifikasi" : undefined}
          />
        </div>
      </div>
    </motion.div>
  );
}
