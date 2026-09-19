"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  Users,
  FolderOpen,
  CheckCircle2,
  LogIn,
  Sun,
  Moon
} from "lucide-react";

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);

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

  const features = [
    {
      title: "Manajemen Kaderisasi",
      desc: "Pemetaan database anggota dan pemantauan jenjang kaderisasi (MAPABA, PKD, PKL) se-komisariat.",
      icon: Users
    },
    {
      title: "Administrasi Digital",
      desc: "Pencatatan persuratan resmi berbasis nomor surat otomatis standar PMII dan arsip digital.",
      icon: Mail
    },
    {
      title: "Arsip & Pustaka",
      desc: "Bank materi keilmuan, modul kaderisasi, silabus, dan dokumentasi legalitas organisasi.",
      icon: FolderOpen
    },
    {
      title: "Verifikasi Anggota",
      desc: "Validasi keaktifan kader dan kepengurusan di bawah naungan komisariat.",
      icon: CheckCircle2
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 flex flex-col justify-between font-sans transition-colors duration-200">
      
      {/* TOP NAVBAR */}
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-30 transition-colors duration-200">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 dark:bg-blue-700 flex items-center justify-center border border-amber-500/40 text-white font-black text-xs tracking-wider">
              KGP
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                PK PMII KI AGENG GETAS PENDAWA
              </span>
              <span className="text-[10px] text-zinc-500 font-medium tracking-wide">
                Portal Resmi Komisariat
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* DARK / LIGHT MODE TOGGLE BUTTON */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Beralih ke Mode Terang (Light Mode)" : "Beralih ke Mode Gelap (Dark Mode)"}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer"
              aria-label="Toggle theme"
            >
              {mounted && darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-blue-600" />
              )}
            </button>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 border border-zinc-900 dark:border-zinc-700 text-xs font-semibold transition-all duration-200"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Masuk</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN HERO */}
      <main className="container mx-auto px-6 py-16 md:py-24 flex flex-col items-center justify-center flex-1 text-center relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Minimal Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Masa Khidmat 2026 - 2027</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.15] text-zinc-900 dark:text-zinc-100 max-w-3xl mx-auto">
            Sistem Informasi & Tata Kelola
            <span className="block mt-1.5 text-amber-600 dark:text-amber-400">
              PK PMII Ki Ageng Getas Pendawa
            </span>
          </h1>

          {/* Clean Description */}
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Portal terpadu pengelolaan kaderisasi, administrasi persuratan, database anggota, dan arsip keilmuan komisariat.
          </p>
        </motion.div>

        {/* MINIMALIST FEATURE CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 w-full text-left"
        >
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/70 hover:border-zinc-300 dark:hover:border-zinc-700/90 transition-all duration-200 group flex flex-col justify-between shadow-xs dark:shadow-none"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-3 text-zinc-600 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-amber-400 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-200 group-hover:text-blue-700 dark:group-hover:text-white transition-colors">
                    {feat.title}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400/90 leading-relaxed mt-1.5">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </main>

      {/* MINIMAL FOOTER */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-6 relative z-10 transition-colors duration-200">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 font-normal">
          <span>© 2026 PK PMII Ki Ageng Getas Pendawa. Hak cipta dilindungi.</span>
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-amber-400/80" />
            <span className="text-[11px] font-mono tracking-wider">PORTAL RESMI KOMISARIAT</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
