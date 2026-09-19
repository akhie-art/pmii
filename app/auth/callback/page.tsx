"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { db, CadreFollowUp, UserAccount } from "@/lib/db";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Menghubungkan akun Google...");

  useEffect(() => {
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

        setMessage("Sinkronisasi data akun...");

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
            localStorage.removeItem("PMII_ACTIVE_RAYON");
            localStorage.removeItem("PMII_ACTIVE_CADRE_ID");

            setStatus("success");
            setMessage(`Berhasil masuk sebagai ${userRoleNorm === "admin" ? "Admin" : "Pengurus"}. Mengarahkan ke Dashboard...`);
            setTimeout(() => router.push(targetRedirect || "/dashboard"), 800);
            return;
          }
        }

        // 2. Check if user is registered cadre
        const matchedKader = cadres.find(
          c => c.email?.toLowerCase() === email
        );

        if (matchedKader) {
          localStorage.setItem("PMII_ACTIVE_CADRE_ID", matchedKader.id);
          localStorage.removeItem("PMII_LOGGED_IN_USER");
          localStorage.removeItem("PMII_ACTIVE_COMMISSARIAT");
          localStorage.removeItem("PMII_ACTIVE_RAYON");

          setStatus("success");
          setMessage("Berhasil masuk. Mengarahkan ke Portal Kader...");
          setTimeout(() => router.push(targetRedirect || "/kader"), 800);
          return;
        }

        // 3. If new registration via Google: auto-register as cadre
        const newCadre: CadreFollowUp = {
          id: `kader-${Date.now()}`,
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

        localStorage.setItem("PMII_ACTIVE_CADRE_ID", newCadre.id);
        localStorage.removeItem("PMII_LOGGED_IN_USER");
        localStorage.removeItem("PMII_ACTIVE_COMMISSARIAT");
        localStorage.removeItem("PMII_ACTIVE_RAYON");

        setStatus("success");
        setMessage("Akun Google berhasil terdaftar! Mengarahkan ke Portal...");
        setTimeout(() => router.push(targetRedirect || "/kader"), 1000);

      } catch (err: any) {
        console.error("Auth callback error:", err);
        setStatus("error");
        setMessage(err.message || "Gagal melakukan autentikasi Google.");
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-7 text-center space-y-4 shadow-none">
        <div className="w-12 h-12 rounded-xl bg-blue-600 dark:bg-blue-700 flex items-center justify-center border border-amber-500/40 text-white font-black text-sm mx-auto">
          KGP
        </div>

        {status === "loading" && (
          <div className="space-y-3">
            <div className="w-6 h-6 border-2 border-blue-600 dark:border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <AlertCircle className="w-7 h-7 text-red-500 mx-auto" />
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">{message}</p>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer w-full"
            >
              Kembali ke Halaman Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
