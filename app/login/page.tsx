"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { db, UserAccount, UserRole } from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase, isSupabaseConfigured, clearSupabaseStorage, safeSignOut } from "@/lib/supabase";
import {
  isUserSuperAdmin,
  isUserAdmin,
  isUserPengurus,
  isUserInstruktur,
  getTargetStaffPrefix
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

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Flow states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("PMII_THEME");
      if (savedTheme) {
        setDarkMode(savedTheme === "dark");
      } else {
        setDarkMode(document.documentElement.classList.contains("dark"));
      }

      const params = new URLSearchParams(window.location.search);
      const safeRedirect = sanitizeRedirectPath(params.get("redirect"));
      if (safeRedirect) {
        setRedirectUrl(safeRedirect);
      }

      // Bersihkan token autentikasi usang jika belum login
      if (!localStorage.getItem("PMII_LOGGED_IN_USER")) {
        clearSupabaseStorage();
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

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    setLoadingMessage("Mengarahkan ke akun Google...");

    try {
      if (redirectUrl && typeof window !== "undefined") {
        sessionStorage.setItem("PMII_AUTH_REDIRECT", redirectUrl);
      }

      if (!supabase) {
        throw new Error("Koneksi autentikasi database belum aktif.");
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?mode=login`
        }
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setError(
        err.message?.includes("provider")
          ? "Google OAuth belum diaktifkan di pengaturan Supabase (Auth > Providers > Google)."
          : (err.message || "Gagal menghubungi Google OAuth.")
      );
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const inputId = email.trim().toLowerCase();
    if (!inputId || !password) {
      setError("Email/identitas dan kata sandi wajib diisi.");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setError("Koneksi autentikasi server belum dikonfigurasi.");
      return;
    }

    setLoading(true);
    setLoadingMessage("Memverifikasi akun secara aman...");

    try {
      // 1. Resolusi email login: jika bukan format email (mis. NIM, NIPA, username), cari email via RPC aman
      let authEmail = inputId;
      if (!inputId.includes("@")) {
        const { data: resolvedEmail, error: resolveErr } = await supabase.rpc(
          "resolve_login_email",
          { p_identifier: inputId }
        );
        if (!resolveErr && typeof resolvedEmail === "string" && resolvedEmail.includes("@")) {
          authEmail = resolvedEmail.trim().toLowerCase();
        } else {
          setError("Akun tidak ditemukan. Silakan gunakan alamat email terdaftar.");
          setLoading(false);
          return;
        }
      }

      // 2. Autentikasi eksklusif melalui Supabase Auth (verifikasi bcrypt di server — tanpa bypass lokal)
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (authError) {
        const errLower = (authError.message || "").toLowerCase();
        if (errLower.includes("refresh token") || errLower.includes("invalid_grant")) {
          clearSupabaseStorage();
          const retry = await supabase.auth.signInWithPassword({
            email: authEmail,
            password,
          });
          authData = retry.data;
          authError = retry.error;
        }
      }

      if (authError || !authData?.user) {
        const msg = (authError?.message || "").toLowerCase();
        if (msg.includes("banned")) {
          setError("Akun Anda sedang dinonaktifkan oleh pengurus. Hubungi admin cabang/komisariat.");
        } else {
          setError("Email atau kata sandi tidak sesuai. Silakan periksa kembali.");
        }
        setLoading(false);
        return;
      }

      const authenticatedUser = authData.user;
      setLoadingMessage("Memuat profil otoritatif...");

      // 3. Ambil profil otoritatif dari server (raw_app_meta_data + public.anggota + public.roles)
      const profile = await db.getMyProfile();

      const appRole = String(
        profile?.role ||
          authenticatedUser.app_metadata?.role ||
          authenticatedUser.user_metadata?.role ||
          "anggota"
      )
        .toLowerCase()
        .trim();

      if (profile?.status === "NONAKTIF") {
        await safeSignOut();
        setError("Akun Anda saat ini berstatus NONAKTIF. Silakan hubungi pengurus.");
        setLoading(false);
        return;
      }

      const isSuperAdmin = isUserSuperAdmin(appRole);
      const isStaff =
        isUserAdmin(appRole) || isUserPengurus(appRole) || isUserInstruktur(appRole);

      const resolvedTenantId = profile?.tenant_id || profile?.komisariat_id || null;
      const resolvedComm =
        profile?.commissariat ||
        (resolvedTenantId ? getTenantNameById(resolvedTenantId) : "") ||
        "";
      const needsOnboarding =
        typeof profile?.needsOnboarding === "boolean"
          ? profile.needsOnboarding
          : !isSuperAdmin && !resolvedTenantId && !resolvedComm;

      const sessionProfile: UserAccount = {
        id: profile?.id || authenticatedUser.id,
        user_id: authenticatedUser.id,
        name:
          profile?.name ||
          authenticatedUser.user_metadata?.name ||
          authenticatedUser.email?.split("@")[0] ||
          "Pengguna PMII",
        email: profile?.email || authenticatedUser.email || authEmail,
        role: appRole as UserRole,
        role_id: profile?.role_id,
        role_name: profile?.role_name || appRole,
        commissariat: resolvedComm,
        komisariat_id: resolvedTenantId,
        tenant_id: resolvedTenantId,
        needsOnboarding,
        status: "AKTIF",
        createdAt: profile?.createdAt || authenticatedUser.created_at || new Date().toISOString(),
        avatar: profile?.avatar || authenticatedUser.user_metadata?.avatar_url || "",
        allowedMenus: Array.isArray(profile?.allowedMenus) ? profile.allowedMenus : [],
      };

      // Simpan hanya cache UI non-sensitif (tanpa password)
      localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(sessionProfile));
      if (sessionProfile.commissariat) {
        localStorage.setItem("PMII_ACTIVE_COMMISSARIAT", sessionProfile.commissariat);
      } else {
        localStorage.removeItem("PMII_ACTIVE_COMMISSARIAT");
      }
      const cadreId = profile?.anggota_id || sessionProfile.id;
      if (cadreId) {
        localStorage.setItem("PMII_ACTIVE_CADRE_ID", cadreId);
        localStorage.setItem("PMII_ACTIVE_ANGGOTA_ID", cadreId);
      }

      setSuccess(true);
      setLoading(false);

      if (!isSuperAdmin && needsOnboarding) {
        router.push("/onboarding");
        return;
      }

      const defaultPath = isStaff
        ? getTargetStaffPrefix(appRole)
        : appRole === "peserta"
        ? "/peserta"
        : "/anggota";
      const safeRedirect = sanitizeRedirectPath(redirectUrl);
      router.push(safeRedirect || defaultPath);
    } catch (err) {
      console.error("Login verification error:", err);
      setError("Terjadi kesalahan sistem saat menghubungi server autentikasi.");
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse space-y-3 text-center">
          <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 mx-auto" />
          <div className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-center items-center font-sans antialiased selection:bg-blue-600 selection:text-white overflow-hidden transition-colors duration-200 p-4 sm:p-6">
      {/* Soft gradient ambient glow + faded grid background (exact match with Landing page design system) */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -right-24 w-[560px] h-[560px] rounded-full bg-violet-400/20 dark:bg-violet-600/10 blur-3xl" />
        <div className="absolute top-28 -left-32 w-[480px] h-[480px] rounded-full bg-amber-200/40 dark:bg-amber-500/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[400px] rounded-full bg-blue-300/20 dark:bg-blue-600/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(120,120,170,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,120,170,0.12) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      {/* LOGIN CARD WRAPPER */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto">
        <Card className="relative overflow-hidden rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800/90 shadow-2xl shadow-zinc-950/5 p-6 sm:p-8 transition-colors duration-200">
          
          {/* Subtle top card glow line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-amber-400 to-blue-600 opacity-80" />

          <div className="space-y-6">
            
            {/* Header: Logo & Title */}
            <div className="text-center space-y-3">
              <Link
                href="/"
                title="Kembali ke Beranda"
                className="inline-flex p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
              >
                <Image
                  src="/image/logopmii.png"
                  alt="Logo PMII"
                  width={44}
                  height={44}
                  className="w-11 h-11 object-contain"
                  priority
                />
              </Link>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  Masuk ke Portal
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Akses layanan kaderisasi & tata kelola terpadu
                </p>
              </div>
            </div>

            {/* Redirect Notice */}
            {redirectUrl && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs rounded-2xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="leading-relaxed font-medium">
                  Silakan masuk ke akun Anda terlebih dahulu untuk melanjutkan akses ke halaman tujuan.
                </div>
              </div>
            )}

            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="outline"
              disabled={loading || success}
              onClick={handleGoogleLogin}
              className="w-full h-11 rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all duration-150 cursor-pointer bg-white dark:bg-zinc-900/90 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-600"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>Masuk dengan Akun Google</span>
            </Button>

            {/* Or Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200/80 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-white/95 dark:bg-zinc-900/95 px-3 text-zinc-400 dark:text-zinc-500 font-semibold tracking-wider">
                  atau kredensial kader
                </span>
              </div>
            </div>

            {/* Error Alert */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-xs rounded-2xl flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  <div className="font-medium leading-relaxed">{error}</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Identity Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Identitas Kader / Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                  <Input
                    type="text"
                    required
                    disabled={loading || success}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email, Nama Lengkap, NIK, atau NTA"
                    className="text-sm pl-10 h-11 bg-zinc-50/80 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-600/10 transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Kata Sandi
                  </label>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    Default: NIK / Tanggal Lahir
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={loading || success}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="text-sm pl-10 pr-10 h-11 bg-zinc-50/80 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-600/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || success}
                className="w-full h-11 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>{loadingMessage || "Memproses..."}</span>
                  </div>
                ) : success ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-600" />
                    <span>Masuk Berhasil! Mengalihkan...</span>
                  </div>
                ) : (
                  <>
                    <span>Masuk ke Akun Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Register Link */}
            <div className="text-center pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Belum terdaftar sebagai kader?</span>{" "}
              <Link 
                href={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register"} 
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
              >
                <span>Daftar Kader Sekarang</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

          </div>
        </Card>
      </main>
    </div>
  );
}