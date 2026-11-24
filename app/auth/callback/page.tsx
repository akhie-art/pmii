"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, clearSupabaseStorage } from "@/lib/supabase";
import { db, UserAccount, UserRole } from "@/lib/db";
import { Loader2, AlertCircle } from "lucide-react";
import {
  isUserSuperAdmin,
  isUserAdmin,
  isUserPengurus,
  isUserInstruktur,
  getTargetStaffPrefix,
} from "@/lib/auth-helpers";
import { getTenantNameById } from "@/lib/tenancy";

function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return "";
  }
  return trimmed;
}

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

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user || !user.email) {
          throw new Error(userError?.message || "Sesi autentikasi Google tidak ditemukan.");
        }

        const email = user.email.trim().toLowerCase();
        const googleName =
          user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0];
        const googleAvatar =
          user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

        if (isMounted) setMessage("Menyinkronkan data akun ke portal...");

        const profile = await db.getMyProfile();

        const rawRedirect =
          typeof window !== "undefined" ? sessionStorage.getItem("PMII_AUTH_REDIRECT") : null;
        if (rawRedirect && typeof window !== "undefined") {
          sessionStorage.removeItem("PMII_AUTH_REDIRECT");
        }
        const targetRedirect = sanitizeRedirectPath(rawRedirect);

        const roleNorm = String(
          profile?.role || user.app_metadata?.role || user.user_metadata?.role || "peserta"
        )
          .toLowerCase()
          .trim();

        const isSuper = isUserSuperAdmin(roleNorm);
        const isStaff =
          isUserAdmin(roleNorm) || isUserPengurus(roleNorm) || isUserInstruktur(roleNorm);

        const targetTid = profile?.tenant_id || profile?.komisariat_id || null;
        const targetComm =
          profile?.commissariat || (targetTid ? getTenantNameById(targetTid) : "") || "";
        const needsOnboarding =
          typeof profile?.needsOnboarding === "boolean"
            ? profile.needsOnboarding
            : !isSuper && !targetTid && !targetComm;

        const sessionAccount: UserAccount = {
          id: profile?.id || user.id,
          user_id: user.id,
          name: profile?.name || googleName,
          email,
          role: roleNorm as UserRole,
          role_id: profile?.role_id,
          role_name: profile?.role_name || roleNorm,
          commissariat: targetComm,
          komisariat_id: targetTid,
          tenant_id: targetTid,
          needsOnboarding,
          status: profile?.status === "NONAKTIF" ? "NONAKTIF" : "AKTIF",
          avatar: profile?.avatar || googleAvatar,
          createdAt: profile?.createdAt || user.created_at || new Date().toISOString(),
          allowedMenus: Array.isArray(profile?.allowedMenus) ? profile.allowedMenus : [],
        };

        const cadreId = profile?.anggota_id || sessionAccount.id;
        localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(sessionAccount));
        localStorage.setItem("PMII_ACTIVE_CADRE_ID", cadreId);
        localStorage.setItem("PMII_ACTIVE_ANGGOTA_ID", cadreId);
        if (sessionAccount.commissariat) {
          localStorage.setItem("PMII_ACTIVE_COMMISSARIAT", sessionAccount.commissariat);
        } else {
          localStorage.removeItem("PMII_ACTIVE_COMMISSARIAT");
        }

        if (!isSuper && needsOnboarding) {
          if (isMounted) {
            setStatus("success");
            setMessage(
              targetRedirect
                ? "Berhasil terhubung dengan Google! Mengarahkan..."
                : "Berhasil masuk! Mengarahkan ke halaman pilihan komisariat..."
            );
          }
          setTimeout(() => router.push(targetRedirect || "/onboarding"), 150);
          return;
        }

        const defaultPath = isStaff
          ? getTargetStaffPrefix(roleNorm)
          : roleNorm === "peserta"
          ? "/peserta"
          : "/anggota";

        if (isMounted) {
          setStatus("success");
          setMessage("Berhasil masuk! Mengarahkan ke panel...");
        }
        setTimeout(() => router.push(targetRedirect || defaultPath), 150);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err || "");
        const isRefreshTokenError =
          errMsg.toLowerCase().includes("refresh token") ||
          errMsg.toLowerCase().includes("invalid_grant");

        if (isRefreshTokenError) {
          clearSupabaseStorage();
        }

        console.warn("Auth callback notice:", errMsg);
        if (isMounted) {
          setStatus("error");
          setMessage(
            isRefreshTokenError
              ? "Sesi autentikasi telah kedaluwarsa. Silakan coba masuk kembali."
              : errMsg || "Gagal melakukan autentikasi Google."
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
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{message}</p>
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
