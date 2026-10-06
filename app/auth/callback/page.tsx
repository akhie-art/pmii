"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { db, CadreFollowUp, UserAccount } from "@/lib/db";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, RefreshCw, Home } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Menghubungkan akun Google...");

  useEffect(() => {
    let isMounted = true;

    const handleAuth = async () => {
      try {
        if (!supabase) {
          throw new Error("Koneksi autentikasi belum dikonfigurasi.");
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session?.user) {
          // If no session found yet, wait briefly for URL hash processing
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData?.user) {
            throw new Error(error?.message || userError?.message || "Sesi Google tidak ditemukan.");
          }
        }

        const user = session?.user || (await supabase.auth.getUser()).data.user;
        if (!user || !user.email) {
          throw new Error("Gagal mengambil data akun Google.");
        }

        const email = user.email.trim().toLowerCase();
        const googleName = user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0];

        if (isMounted) setMessage("Menyinkronkan data akun ke portal...");

        const [cadres, users] = await Promise.all([
          db.getCadres(),
          db.getUsers()
        ]);

        // 1. Check if user is in users table (Admin / Pengurus)
        const matchedUser = users.find(
          u => u.email?.toLowerCase() === email && u.status === "AKTIF"
        );
        const userRoleNorm = (matchedUser?.role || (email === "admin@pmii.org" ? "admin" : "")).toLowerCase();

        const targetRedirect = typeof window !== "undefined" ? sessionStorage.getItem("PMII_AUTH_REDIRECT") : null;
        if (targetRedirect && typeof window !== "undefined") {
          sessionStorage.removeItem("PMII_AUTH_REDIRECT");
        }

        if (matchedUser || email === "admin@pmii.org") {
          const isDashboardRole = userRoleNorm === "admin" || userRoleNorm === "pengurus" || userRoleNorm === "komisariat";
          if (isDashboardRole) {
            const adminAccount: UserAccount = matchedUser || {
              id: "user-admin",
              name: googleName || "Admin PK PMII Ki Ageng Getas Pendawa",
              email: email,
              role: "admin",
              commissariat: "Ki Ageng Getas Pendawa",
              status: "AKTIF",
              createdAt: new Date().toISOString()
            };

            localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(adminAccount));
            localStorage.setItem("PMII_ACTIVE_COMMISSARIAT", adminAccount.commissariat || "Ki Ageng Getas Pendawa");
            localStorage.removeItem("PMII_ACTIVE_CADRE_ID");

            const targetStaffPrefix = userRoleNorm === "admin" ? "/admin" : "/pengurus";
            if (isMounted) {
              setStatus("success");
              setMessage(`Berhasil masuk sebagai ${userRoleNorm === "admin" ? "Admin" : "Pengurus"}. Mengarahkan ke ${userRoleNorm === "admin" ? "Panel Admin" : "Panel Pengurus"}...`);
            }
            setTimeout(() => router.push(targetRedirect || targetStaffPrefix), 800);
            return;
          }
        }

        // 2. Check if user is registered cadre
        const matchedKader = cadres.find(
          c => c.email?.toLowerCase() === email
        );

        if (matchedKader) {
          const roleNormalized = (matchedKader.role || (matchedKader.isGraduated ? "anggota" : "peserta")).toLowerCase();
          const isStaff = roleNormalized === "admin" || roleNormalized === "pengurus" || roleNormalized === "komisariat";

          const cadreSession = {
            id: matchedKader.id,
            user_id: user.id,
            name: matchedKader.name,
            email: matchedKader.email || email,
            role: roleNormalized,
            avatar: matchedKader.avatar || "",
            status: "active" as const,
            commissariat: matchedKader.commissariat || "Ki Ageng Getas Pendawa"
          };
          localStorage.setItem("PMII_ACTIVE_CADRE_ID", matchedKader.id);
          localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(cadreSession));
          localStorage.setItem("PMII_ACTIVE_COMMISSARIAT", cadreSession.commissariat);

          const targetPath = isStaff ? (roleNormalized === "admin" ? "/admin" : "/pengurus") : `/${roleNormalized}`;

          if (isMounted) {
            setStatus("success");
            setMessage(`Berhasil masuk! Mengarahkan ke ${isStaff ? (roleNormalized === "admin" ? "Panel Admin" : "Panel Pengurus") : `Portal ${roleNormalized === "peserta" ? "Peserta" : "Anggota"}`}...`);
          }
          setTimeout(() => router.push(targetRedirect || targetPath), 800);
          return;
        }

        // 3. If new registration via Google: auto-register as cadre
        const newCadre: CadreFollowUp = {
          id: `kader-${Date.now()}`,
          user_id: user.id,
          name: googleName,
          email: email,
          level: "MAPABA",
          commissariat: "Ki Ageng Getas Pendawa",
          startDate: new Date().toISOString().split("T")[0],
          status: "AKTIF",
          submissions: [],
          isGraduated: false,
          role: "peserta"
        };

        const updated = [...cadres, newCadre];
        await db.saveCadres(updated);

        const newCadreSession = {
          id: newCadre.id,
          user_id: user.id,
          name: newCadre.name,
          email: newCadre.email,
          role: "peserta",
          status: "active" as const,
          commissariat: newCadre.commissariat
        };
        localStorage.setItem("PMII_ACTIVE_CADRE_ID", newCadre.id);
        localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(newCadreSession));
        localStorage.setItem("PMII_ACTIVE_COMMISSARIAT", newCadre.commissariat);

        if (isMounted) {
          setStatus("success");
          setMessage("Akun Google berhasil terdaftar! Mengarahkan ke Portal Peserta...");
        }
        setTimeout(() => router.push(targetRedirect || `/${newCadreSession.role}`), 1000);

      } catch (err: any) {
        console.error("Auth callback error:", err);
        if (isMounted) {
          setStatus("error");
          setMessage(err.message || "Gagal melakukan autentikasi Google.");
        }
      }
    };

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4 font-sans overflow-hidden transition-colors">
      {/* Background Glow Accents */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-500/10 dark:bg-amber-500/15 blur-3xl"
        aria-hidden="true"
      />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 text-center shadow-xl shadow-zinc-950/5 dark:shadow-black/40">
          {/* Logo Brand Header */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-zinc-200/90 dark:border-zinc-700/80 p-2.5 flex items-center justify-center shadow-md dark:shadow-black/50 mb-3.5 transition-transform hover:scale-105 duration-200">
              <Image
                src="/image/logo_komsat.png"
                alt="Logo PK PMII Ki Ageng Getas Pendawa"
                width={72}
                height={72}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="inline-block text-[11px] font-bold tracking-wider text-blue-700 dark:text-amber-400 uppercase">
              PK PMII Ki Ageng Getas Pendawa
            </span>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              Sistem Informasi & Portal Kader
            </p>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent mb-6" />

          {/* Status Content */}
          <AnimatePresence mode="wait">
            {status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4 py-2"
              >
                <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-600/20 dark:border-amber-400/20 animate-ping opacity-30" />
                  <Loader2 className="w-8 h-8 text-blue-600 dark:text-amber-400 animate-spin" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Memverifikasi Akun
                  </h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                    {message}
                  </p>
                </div>

                {/* Animated loading bar */}
                <div className="w-48 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mx-auto mt-4">
                  <div className="w-full h-full bg-gradient-to-r from-blue-600 via-amber-400 to-blue-600 rounded-full animate-pulse" />
                </div>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 py-2"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Autentikasi Berhasil
                  </h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                    {message}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-48 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mx-auto mt-4">
                  <motion.div
                    initial={{ width: "20%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 py-2"
              >
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
                  <AlertCircle className="w-7 h-7 text-red-500" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-sm sm:text-base font-bold text-red-600 dark:text-red-400">
                    Gagal Masuk
                  </h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed max-w-xs mx-auto">
                    {message}
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => router.push("/login")}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Lagi</span>
                  </button>
                  <Link
                    href="/"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Beranda</span>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
              Tangan Terkepal dan Maju Ke Muka • Salam Pergerakan!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
