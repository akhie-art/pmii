"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, clearSupabaseStorage } from "@/lib/supabase";
import { db, UserAccount } from "@/lib/db";
import { Loader2, AlertCircle } from "lucide-react";

import {
  isUserSuperAdmin,
  isUserAdmin,
  isUserPengurus,
  isUserInstruktur,
  getTargetStaffPrefix
} from "@/lib/auth-helpers";
import { getKomisariatIdByName, getTenantNameById } from "@/lib/tenancy";

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

        // 1. Check if user is in users table (Admin / Pengurus / Instruktur)
        const matchedUser = users.find(
          u => u.email?.toLowerCase().trim() === email
        );
        const userRoleNorm = (matchedUser?.role || ((user as any)?.user_metadata?.role || "")).toLowerCase();
        const isStaff = isUserAdmin(userRoleNorm) || isUserPengurus(userRoleNorm) || isUserInstruktur(userRoleNorm);

        const targetRedirect = typeof window !== "undefined" ? sessionStorage.getItem("PMII_AUTH_REDIRECT") : null;
        if (targetRedirect && typeof window !== "undefined") {
          sessionStorage.removeItem("PMII_AUTH_REDIRECT");
        }

        const isSuper = isUserSuperAdmin(userRoleNorm);

        // 1. Jika Super Administrator, langsung arahkan ke panel admin
        if (isSuper) {
          const adminAccount: UserAccount = {
            id: matchedUser?.id || user.id,
            user_id: user.id || matchedUser?.user_id,
            name: matchedUser?.name || googleName || "Super Administrator",
            email: email,
            role: "superadmin",
            commissariat: "Pengurus Cabang Grobogan",
            komisariat_id: null,
            status: "AKTIF",
            createdAt: matchedUser?.createdAt || new Date().toISOString(),
            allowedMenus: matchedUser?.allowedMenus || []
          };

          localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(adminAccount));
          localStorage.setItem("PMII_ACTIVE_COMMISSARIAT", "Pengurus Cabang Grobogan");
          localStorage.removeItem("PMII_ACTIVE_CADRE_ID");

          if (isMounted) {
            setStatus("success");
            setMessage("Berhasil masuk sebagai Super Administrator!");
          }
          setTimeout(() => router.push(targetRedirect || "/admin"), 150);
          return;
        }

        // 2. Cek apakah pengguna terdaftar di tabel anggota (kader/pengurus terverifikasi)
        const matchedKader = cadres.find(
          c => c.email?.toLowerCase().trim() === email
        );

        if (matchedKader) {
          const roleNormalized = (matchedKader.role || (matchedKader.isGraduated ? "anggota" : "peserta")).toLowerCase();
          const isCadreStaff = isUserAdmin(roleNormalized) || isUserPengurus(roleNormalized) || isUserInstruktur(roleNormalized);
          const targetTid =
            (matchedKader as any).tenant_id ||
            (matchedKader as any).komisariat_id ||
            getKomisariatIdByName(matchedKader.commissariat);
          const targetComm =
            matchedKader.commissariat ||
            (targetTid ? getTenantNameById(targetTid) : "") ||
            "";
          const hasCommissariat = Boolean(targetTid || (targetComm && targetComm.trim()));

          if (!hasCommissariat || matchedKader.needsOnboarding) {
            const cadreSession = {
              id: matchedKader.id,
              user_id: user.id,
              name: matchedKader.name,
              email: matchedKader.email || email,
              role: roleNormalized,
              avatar: matchedKader.avatar || "",
              status: "active" as const,
              commissariat: "",
              komisariat_id: null,
              tenant_id: null,
              needsOnboarding: true,
              allowedMenus: matchedUser?.allowedMenus || []
            };
            localStorage.setItem("PMII_ACTIVE_CADRE_ID", matchedKader.id);
            localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(cadreSession));
            localStorage.removeItem("PMII_ACTIVE_COMMISSARIAT");

            if (isMounted) {
              setStatus("success");
              setMessage("Berhasil masuk! Mengarahkan untuk melengkapi data Komisariat...");
            }
            setTimeout(() => router.push("/onboarding"), 150);
            return;
          }

          const cadreSession = {
            id: matchedKader.id,
            user_id: user.id,
            name: matchedKader.name,
            email: matchedKader.email || email,
            role: roleNormalized,
            avatar: matchedKader.avatar || "",
            status: "active" as const,
            commissariat: targetComm,
            komisariat_id: targetTid,
            tenant_id: targetTid,
            needsOnboarding: false,
            allowedMenus: Array.isArray(matchedUser?.allowedMenus)
              ? matchedUser.allowedMenus
              : (Array.isArray((user as any)?.user_metadata?.allowedMenus)
                  ? (user as any).user_metadata.allowedMenus
                  : (isCadreStaff ? [] : ["/kader", "/kader/kegiatan", "/kader/materi", "/kader/profil", "/kader/laporan"]))
          };
          localStorage.setItem("PMII_ACTIVE_CADRE_ID", matchedKader.id);
          localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(cadreSession));
          if (cadreSession.commissariat) {
            localStorage.setItem("PMII_ACTIVE_COMMISSARIAT", cadreSession.commissariat);
          }

          const targetPath = isCadreStaff ? getTargetStaffPrefix(roleNormalized) : `/${roleNormalized}`;

          if (isMounted) {
            setStatus("success");
            setMessage("Berhasil masuk! Mengarahkan ke panel...");
          }
          setTimeout(() => router.push(targetRedirect || targetPath), 150);
          return;
        }

        // 3. Jika pengguna BELUM TERDAFTAR di basis data anggota, arahkan ke Onboarding
        const newCadreId = `kader-${Date.now()}`;
        const userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

        const newCadreSession = {
          id: newCadreId,
          user_id: user.id,
          name: googleName,
          email: email,
          role: matchedUser?.role || "peserta",
          status: "active" as const,
          avatar: userAvatar,
          commissariat: "",
          komisariat_id: null,
          needsOnboarding: true,
          allowedMenus: matchedUser?.allowedMenus || []
        };
        localStorage.setItem("PMII_ACTIVE_CADRE_ID", newCadreId);
        localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(newCadreSession));
        localStorage.removeItem("PMII_ACTIVE_COMMISSARIAT");

        if (isMounted) {
          setStatus("success");
          setMessage("Akun belum terdaftar di keanggotaan. Mengarahkan ke Onboarding...");
        }
        setTimeout(() => router.push("/onboarding"), 150);
        return;

      } catch (err: any) {
        const isRefreshTokenError =
          err?.message?.toLowerCase().includes("refresh token") ||
          err?.message?.toLowerCase().includes("invalid_grant");

        if (isRefreshTokenError) {
          clearSupabaseStorage();
        }

        console.warn("Auth callback notice:", err?.message || err);
        if (isMounted) {
          setStatus("error");
          setMessage(
            isRefreshTokenError
              ? "Sesi autentikasi telah kedaluwarsa. Silakan coba masuk kembali."
              : (err.message || "Gagal melakukan autentikasi Google.")
          );
        }
      }
    };

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4 font-sans">
      {status === "error" ? (
        <div className="flex flex-col items-center justify-center text-center space-y-3.5 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Gagal Masuk
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {message}
            </p>
          </div>
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors"
            >
              Coba Lagi
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-lg transition-colors"
            >
              Beranda
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
      )}
    </div>
  );
}
