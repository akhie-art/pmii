"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  FileText,
  UserCheck,
  ArrowRight,
  Award,
  TrendingUp
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

export default function DashboardHome() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          console.error("Error reading user session:", e);
        }
      }
    }
  }, []);

  const userRole = (currentUser?.role || "").toLowerCase();
  const isAnggota = userRole === "anggota" || userRole === "peserta" || userRole === "kader";
  const isInstruktur = userRole === "instruktur";

  const matchRole = pathname ? pathname.match(/^\/(admin|pengurus|instruktur|dashboard)/) : null;
  const staffPrefix = matchRole && matchRole[1] !== "dashboard"
    ? `/${matchRole[1]}`
    : (userRole === "admin" ? "/admin" : isInstruktur ? "/instruktur" : "/pengurus");

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
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
      className="space-y-6 max-w-7xl mx-auto text-zinc-900 dark:text-zinc-100"
    >
      {/* 1. WELCOME CARD */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-xl bg-white dark:bg-zinc-900 p-6 md:p-7 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-none"
      >
        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Selamat Datang, {currentUser?.name || "Sahabat"}!
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-3xl">
            {isAnggota
              ? "Portal Kaderisasi mandiri untuk mengakses bahan ajar silabus, menyerahkan laporan progres RKTL, dan melihat identitas keanggotaan Anda."
              : isInstruktur
              ? "Panel Fasilitator & Instruktur Kaderisasi PK PMII Ki Ageng Getas Pendawa. Lakukan penilaian kognitif, afektif, dan motorik/keaktifan forum peserta secara langsung."
              : "Sistem Informasi Manajemen & Administrasi PK PMII Ki Ageng Getas Pendawa. Kelola data anggota, verifikasi berkas kaderisasi, dan dokumen kepengurusan."}
          </p>
        </div>
      </motion.div>

      {/* 2. 4 ACTION NAVIGATION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        
        {/* CARD 1 */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none p-5 h-full flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
                {isInstruktur ? <Award className="w-5 h-5 text-amber-500" /> : <BookOpen className="w-5 h-5" />}
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {isInstruktur ? "Penilaian Peserta" : "Materi & Silabus"}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {isInstruktur
                    ? "Input nilai kognitif, afektif, dan keaktifan motorik forum peserta..."
                    : "Pelajari modul resmi MAPABA, kajian Aswaja, dan latihan kuis..."}
                </CardDescription>
              </div>
            </div>

            <div className="pt-4">
              <Link href={isInstruktur ? `${staffPrefix}/penilaian` : `${staffPrefix}/materi`}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 rounded-lg border-none cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
                  {isInstruktur ? "Buka Penilaian" : "Buka Silabus"} <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* CARD 2 */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none p-5 h-full flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
                {isInstruktur ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <Calendar className="w-5 h-5" />}
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {isInstruktur ? "Rekap & Yudisium" : "Agenda Kegiatan"}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {isInstruktur
                    ? "Peringkat peserta terbaik, distribusi kelulusan, dan hasil yudisium..."
                    : "Daftar pelatihan kaderisasi formal, kajian publik, dan agenda..."}
                </CardDescription>
              </div>
            </div>

            <div className="pt-4">
              <Link href={isInstruktur ? `${staffPrefix}/rekap-nilai` : `${staffPrefix}/kegiatan`}>
                <Button className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium text-xs h-9 rounded-lg border-none cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
                  {isInstruktur ? "Buka Rekapitulasi" : "Lihat Kegiatan"} <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* CARD 3 */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none p-5 h-full flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
                {isInstruktur ? <BookOpen className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {isInstruktur ? "Materi & Silabus" : isAnggota ? "Laporan RKTL" : "Verifikasi RTL"}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {isInstruktur
                    ? "Akses modul kurikulum dan silabus materi forum kaderisasi..."
                    : isAnggota
                    ? "Kirimkan resume buku, risalah kajian mandiri, dan berkas tindak..."
                    : "Tinjau dan verifikasi penyerahan tugas tindak lanjut kader..."}
                </CardDescription>
              </div>
            </div>

            <div className="pt-4">
              <Link href={isInstruktur ? `${staffPrefix}/materi` : `${staffPrefix}/verifikasi`}>
                <Button className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium text-xs h-9 rounded-lg border-none cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
                  {isInstruktur ? "Lihat Silabus" : isAnggota ? "Buat Laporan" : "Buka Verifikasi"} <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* CARD 4 */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none p-5 h-full flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-900/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                {isInstruktur ? <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <UserCheck className="w-5 h-5" />}
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {isInstruktur ? "Jadwal Kegiatan" : "Database Anggota"}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {isInstruktur
                    ? "Jadwal dan sesi forum kaderisasi yang sedang berlangsung..."
                    : "Kelola database keanggotaan komisariat dan rekapitulasi kader."}
                </CardDescription>
              </div>
            </div>

            <div className="pt-4">
              <Link href={isInstruktur ? `${staffPrefix}/kegiatan` : `${staffPrefix}/anggota`}>
                <Button className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium text-xs h-9 rounded-lg border-none cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
                  {isInstruktur ? "Lihat Jadwal" : "Lihat Database"} <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
}
