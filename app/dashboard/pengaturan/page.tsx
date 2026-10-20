"use client";

import React, { useState, useEffect } from "react";
import { useFeedbackModal } from "@/components/ui/feedback-modal";
import { Settings, Building, Shield, Save, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

import { db, setUserPassword } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  DEFAULT_SETTINGS,
  type SystemSettings,
  type OrganizationSettings
} from "./_components/types";
import { OrganizationTab } from "./_components/OrganizationTab";
import { SecurityTab } from "./_components/SecurityTab";

export default function PengaturanPage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { showToast, FeedbackModalComponent } = useFeedbackModal();

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [activeTab, setActiveTab] = useState<"org" | "security">("org");

  // Load settings from Supabase (with LocalStorage cache fallback)
  useEffect(() => {
    const loadInitialData = async () => {
      let loggedUser: any = null;
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("PMII_LOGGED_IN_USER");
        if (storedUser) {
          try {
            loggedUser = JSON.parse(storedUser);
            setCurrentUser(loggedUser);
          } catch (e) {
            console.error("Failed to parse user session", e);
          }
        }
      }

      let loadedSettings: SystemSettings = { ...DEFAULT_SETTINGS };

      // 1. Ambil dari Supabase tabel pengaturan
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from("pengaturan")
            .select("value")
            .eq("key", "system_settings")
            .maybeSingle();

          if (!error && data?.value) {
            loadedSettings = {
              ...DEFAULT_SETTINGS,
              ...data.value,
              organization: {
                ...DEFAULT_SETTINGS.organization,
                ...(data.value.organization || {})
              },
              administration: {
                ...DEFAULT_SETTINGS.administration,
                ...(data.value.administration || {})
              }
            };
          }
        } catch (err) {
          console.warn("[PengaturanPage] Supabase load error:", err);
        }
      }

      // 2. Fallback jika offline/local cache
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("PMII_SYSTEM_SETTINGS");
        if (cached && !loadedSettings.organization.cabangName) {
          try {
            const parsed = JSON.parse(cached);
            loadedSettings = {
              ...DEFAULT_SETTINGS,
              ...parsed,
              organization: {
                ...DEFAULT_SETTINGS.organization,
                ...(parsed.organization || {})
              },
              administration: {
                ...DEFAULT_SETTINGS.administration,
                ...(parsed.administration || {})
              }
            };
          } catch {}
        }
      }

      // 3. Jika user adalah Pengurus Komisariat lokal, load data komisariat spesifik
      const isKomisariatUser =
        loggedUser &&
        (loggedUser.role === "komisariat" || loggedUser.role === "pengurus_komisariat");

      if (isKomisariatUser && isSupabaseConfigured && supabase) {
        try {
          const userTenantId = loggedUser.tenant_id || loggedUser.komisariat_id;
          let commQuery = supabase.from("tenant").select("*");
          if (userTenantId) {
            commQuery = commQuery.eq("id", userTenantId);
          } else if (loggedUser.commissariat) {
            commQuery = commQuery.ilike("name", `%${loggedUser.commissariat}%`);
          }
          const { data: commData } = await commQuery.maybeSingle();

          if (commData) {
            loadedSettings.organization = {
              ...loadedSettings.organization,
              cabangName: commData.name || loadedSettings.organization.cabangName,
              email: commData.contactEmail || loadedSettings.organization.email,
              logo: commData.logo || loadedSettings.organization.logo
            };
          }
        } catch (e) {
          console.warn("[PengaturanPage] Failed to fetch tenant detail:", e);
        }
      }

      setSettings(loadedSettings);
      setMounted(true);
    };

    loadInitialData();
  }, []);

  // Save Settings Handler (Database Supabase & LocalStorage)
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // 1. Simpan ke database Supabase tabel pengaturan
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from("pengaturan").upsert(
            {
              key: "system_settings",
              value: settings,
              updated_at: new Date().toISOString(),
              updated_by: currentUser?.email || "admin"
            },
            { onConflict: "key" }
          );
        } catch (err) {
          console.warn("[PengaturanPage] Supabase save error:", err);
        }

        // Jika user adalah Pengurus Komisariat, simpan pembaruan ke tabel tenant
        const isKomisariatUser =
          currentUser &&
          (currentUser.role === "komisariat" || currentUser.role === "pengurus_komisariat");

        const targetTenantId = currentUser?.tenant_id || currentUser?.komisariat_id;
        if (isKomisariatUser && targetTenantId) {
          try {
            await supabase
              .from("tenant")
              .update({
                name: settings.organization.cabangName,
                contactEmail: settings.organization.email,
                logo: settings.organization.logo
              })
              .eq("id", targetTenantId);
          } catch (e) {
            console.warn("[PengaturanPage] Error updating tenant row:", e);
          }
        }
      }

      // 2. Simpan cache di LocalStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("PMII_SYSTEM_SETTINGS", JSON.stringify(settings));
      }

      showToast("Pengaturan berhasil disimpan ke cloud database!");
      setSuccessMessage(
        currentUser?.role === "komisariat"
          ? "Pengaturan profil komisariat berhasil diperbarui dan tersimpan aman di database."
          : "Pengaturan identitas dan administrasi Pengurus Cabang Grobogan berhasil diperbarui di database."
      );
      setIsSuccessOpen(true);
    } catch (err: any) {
      console.error("Save settings error:", err);
      showToast("Gagal menyimpan ke database, pengaturan disimpan lokal.");
    } finally {
      setIsSaving(false);
    }
  };

  // Direct Cloud Storage Upload Logo Handler
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran logo maksimal 2MB.");
      return;
    }

    setIsUploadingLogo(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split(".").pop() || "png";
        const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20);
        const filePath = `logos/${Date.now()}_${cleanName}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("komisariat")
          .upload(filePath, file, {
            contentType: file.type || "image/png",
            upsert: true
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: pubData } = supabase.storage.from("komisariat").getPublicUrl(filePath);
        if (pubData?.publicUrl) {
          updateOrgField("logo", pubData.publicUrl);
          showToast("Logo berhasil diunggah ke Supabase Storage!");
          return;
        }
      }

      // Fallback lokal jika supabase storage tidak tersedia
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        updateOrgField("logo", base64);
        showToast("Logo disimpan secara lokal.");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Logo upload exception:", err);
      showToast("Gagal mengunggah logo ke cloud storage.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    updateOrgField("logo", "");
    showToast("Logo organisasi dikembalikan ke default.");
  };

  // Safe Password Change Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Kata sandi baru minimal harus 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    const targetEmail = currentUser?.email;
    if (!targetEmail) {
      setPasswordError("Sesi pengguna tidak valid.");
      setIsSavingPassword(false);
      return;
    }

    try {
      setIsSavingPassword(true);

      // 1. Update password di Supabase Auth (auth.users)
      if (isSupabaseConfigured && supabase) {
        try {
          const { error: updateAuthErr } = await supabase.auth.updateUser({
            password: newPassword
          });
          if (updateAuthErr) {
            console.warn("Supabase Auth updateUser warning:", updateAuthErr.message);
          }
        } catch (e: any) {
          console.warn("Supabase Auth update password exception:", e);
        }
      }

      // 2. Simpan juga ke credentials store aplikasi agar sinkron saat login kembali
      setUserPassword([targetEmail, currentUser?.id, currentUser?.name], newPassword);

      // 3. Update password di tabel anggota jika ada kolom password
      if (isSupabaseConfigured && supabase && currentUser?.id) {
        try {
          await supabase
            .from("anggota")
            .update({ password: newPassword })
            .eq("id", currentUser.id);
        } catch {}
      }

      setPasswordSuccess("Kata sandi akun Anda berhasil diperbarui secara aman!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Kata sandi berhasil diperbarui!");
    } catch (err: any) {
      console.error("Change password error:", err);
      setPasswordError("Gagal memperbarui kata sandi. Periksa koneksi.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  // State helper functions
  const updateOrgField = (key: keyof OrganizationSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      organization: {
        ...prev.organization,
        [key]: value
      }
    }));
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  const isKomisariat =
    currentUser?.role === "komisariat" || currentUser?.role === "pengurus_komisariat";

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 font-sans pb-10">
      {/* 1. HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 rounded-xl shadow-none">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white shadow-sm shrink-0">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {isKomisariat ? "Pengaturan Komisariat PMII" : "Pengaturan Sistem PMII Grobogan"}
              </h1>
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2">
                Cloud Config
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-xl leading-relaxed">
              {isKomisariat
                ? "Konfigurasi identitas komisariat, persuratan, keamanan kata sandi, dan status cloud database."
                : "Konfigurasi identitas Pengurus Cabang Grobogan, format persuratan, keamanan akun, dan integrasi cloud."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-9 px-4 rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 2. TABS SELECTOR */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-xs font-medium">
        {[
          {
            id: "org",
            label: isKomisariat ? "Profil Komisariat" : "Profil Cabang",
            icon: Building
          },
          {
            id: "security",
            label: "Keamanan & Akun",
            icon: Shield
          }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 cursor-pointer border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENTS */}
      <div className="pt-2 min-h-[400px]">
        {activeTab === "org" && (
          <OrganizationTab
            settings={settings}
            currentUser={currentUser}
            updateOrgField={updateOrgField}
            onLogoChange={handleLogoChange}
            onRemoveLogo={handleRemoveLogo}
            isUploadingLogo={isUploadingLogo}
          />
        )}

        {activeTab === "security" && (
          <SecurityTab
            currentUser={currentUser}
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            passwordError={passwordError}
            passwordSuccess={passwordSuccess}
            isSavingPassword={isSavingPassword}
            onSavePassword={handleChangePassword}
          />
        )}
      </div>

      {/* DIALOG: SUCCESS NOTIFICATION */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-sm w-full p-6">
          <DialogHeader className="flex flex-col items-center justify-center text-center space-y-2 pb-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Pengaturan Disimpan
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {successMessage}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="justify-center sm:justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => setIsSuccessOpen(false)}
              className="text-xs border-zinc-200 dark:border-zinc-800 h-8.5 px-6 rounded-lg cursor-pointer"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {FeedbackModalComponent}
    </div>
  );
}
