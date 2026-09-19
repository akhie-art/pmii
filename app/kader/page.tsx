"use client";

import React, { useState, useEffect } from "react";
import { db, type CadreFollowUp } from "@/lib/db";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  FileText,
  UserCheck,
  ArrowRight,
  User
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

export default function KaderDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [cadre, setCadre] = useState<CadreFollowUp | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const activeId = typeof window !== "undefined" ? (localStorage.getItem("PMII_ACTIVE_CADRE_ID") || "") : "";
      const savedUserStr = typeof window !== "undefined" ? localStorage.getItem("PMII_LOGGED_IN_USER") : null;
      let loggedInUser: any = null;
      if (savedUserStr) {
        try {
          loggedInUser = JSON.parse(savedUserStr);
        } catch (e) {}
      }

      const cadres = await db.getCadres([]);
      const currentCadre = (activeId ? cadres.find((c: any) => c.id === activeId) : null) || 
                           (loggedInUser ? cadres.find((c: any) => c.id === loggedInUser.id || (c.email && c.email.toLowerCase() === loggedInUser.email?.toLowerCase())) : null) || 
                           cadres[0] || null;

      setCadre(currentCadre);
      setMounted(true);
    };
    loadData();
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-32 bg-zinc-200 dark:bg-zinc-800/40 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-zinc-200 dark:bg-zinc-800/40 rounded-2xl animate-pulse" />
          <div className="h-44 bg-zinc-200 dark:bg-zinc-800/40 rounded-2xl animate-pulse" />
          <div className="h-44 bg-zinc-200 dark:bg-zinc-800/40 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!cadre) {
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

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 25 } }
  } as const;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  } as const;

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
        className="relative overflow-hidden rounded-lg bg-white dark:bg-zinc-900 p-5 md:p-6 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-none"
      >
        <div className="space-y-1.5">
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Selamat Datang, {cadre.name}!
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
            Portal Kaderisasi mandiri untuk mengakses bahan ajar silabus, menyerahkan laporan progres RKTL, dan melihat identitas keanggotaan Anda.
          </p>
        </div>
      </motion.div>

      {/* 2. MENU ACTION NAVIGATION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: MATERI */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none p-4.5 h-full flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Materi & Silabus
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">
                  Pelajari modul resmi MAPABA, kajian Aswaja, dan latihan kuis mandiri.
                </CardDescription>
              </div>
            </div>

            <div className="pt-4">
              <Link href="/kader/materi">
                <Button className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium text-xs h-8 rounded-lg border-none cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
                  Buka Silabus <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* CARD 2: KEGIATAN */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none p-4.5 h-full flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Calendar className="w-4.5 h-4.5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Agenda Kegiatan
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">
                  Daftar pelatihan kaderisasi formal, kajian publik, dan agenda komisariat.
                </CardDescription>
              </div>
            </div>

            <div className="pt-4">
              <Link href="/kader/kegiatan">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8 rounded-lg border-none cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
                  Lihat Kegiatan <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* CARD 3: LAPORAN RKTL */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none p-4.5 h-full flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Laporan RKTL
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">
                  Kirimkan resume buku, risalah kajian mandiri, dan berkas tindak lanjut.
                </CardDescription>
              </div>
            </div>

            <div className="pt-4">
              <Link href="/kader/laporan">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8 rounded-lg border-none cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
                  Buat Laporan <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* CARD 4: PROFIL & E-KTA */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none p-4.5 h-full flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <UserCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Profil & E-KTA
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">
                  Kelola data diri, status registrasi, dan unduh Kartu Identitas Digital.
                </CardDescription>
              </div>
            </div>

            <div className="pt-4">
              <Link href="/kader/profil">
                <Button className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium text-xs h-8 rounded-lg border-none cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
                  Lihat Profil <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

      </div>

    </motion.div>
  );
}
