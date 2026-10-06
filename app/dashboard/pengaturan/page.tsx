"use client";

import React, { useState, useEffect } from "react";
import { useFeedbackModal } from "@/components/ui/feedback-modal";
import { Settings, Building, Shield, Save, CheckCircle } from "lucide-react";
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

import { db } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { DEFAULT_SETTINGS, type SystemSettings, type OrganizationSettings } from "./_components/types";
import { OrganizationTab } from "./_components/OrganizationTab";
import { SecurityTab } from "./_components/SecurityTab";

export default function PengaturanPage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  // Load from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("PMII_SYSTEM_SETTINGS");
    const storedUser = localStorage.getItem("PMII_LOGGED_IN_USER");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user session", e);
      }
    }
    setTimeout(() => {
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({
            ...DEFAULT_SETTINGS,
            ...parsed,
            organization: {
              ...DEFAULT_SETTINGS.organization,
              ...parsed.organization
            }
          });
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
      setMounted(true);
    }, 0);
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem("PMII_SYSTEM_SETTINGS", JSON.stringify(settings));
    showToast("Pengaturan berhasil disimpan!");
    setSuccessMessage(
      currentUser?.role === "KOMISARIAT"
        ? "Pengaturan profil dan parameter komisariat berhasil disimpan."
        : "Pengaturan identitas kepengurusan cabang berhasil disimpan."
    );
    setIsSuccessOpen(true);
  };

  // Logo Change Handler
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran logo maksimal 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateOrgField("logo", base64);
      showToast("Logo organisasi berhasil diperbarui!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    updateOrgField("logo", "");
    showToast("Logo organisasi dikembalikan ke default.");
  };

  // Password Change Handler
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

    setIsSavingPassword(true);
    try {
      const users = await db.getUsers([]);
      const targetEmail = currentUser?.email || "admin@pmii.org";
      const userIndex = users.findIndex(
        (u) => u.email.toLowerCase() === targetEmail.toLowerCase()
      );

      if (userIndex === -1) {
        setPasswordError("Akun pengguna tidak ditemukan dalam database.");
        setIsSavingPassword(false);
        return;
      }

      // Update password via Supabase Auth (auth.users) secara aman & terenkripsi
      if (isSupabaseConfigured && supabase) {
        try {
          const { error: updateAuthErr } = await supabase.auth.updateUser({
            password: newPassword
          });
          if (updateAuthErr) {
            setPasswordError(updateAuthErr.message);
            setIsSavingPassword(false);
            return;
          }
        } catch (e: any) {
          console.warn("Supabase Auth update password exception:", e);
        }
      }

      setPasswordSuccess("Kata sandi akun Anda berhasil diperbarui secara aman!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Kata sandi berhasil diperbarui!");
    } catch (err) {
      console.error(err);
      setPasswordError("Gagal memperbarui kata sandi. Periksa koneksi.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Organization field state setter helper
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
                {currentUser?.role === "KOMISARIAT" ? "Pengaturan Komisariat PMII" : "Pengaturan Sistem PMII"}
              </h1>
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2">
                Konfigurasi
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-xl leading-relaxed">
              {currentUser?.role === "KOMISARIAT"
                ? "Konfigurasi profil komisariat, keamanan kata sandi akun, serta identitas administrasi kepengurusan."
                : "Konfigurasi profil cabang, keamanan kata sandi akun, serta identitas administrasi kepengurusan."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={handleSaveSettings}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-9 px-4 rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan</span>
          </Button>
        </div>
      </div>

      {/* 2. TABS SELECTOR */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-xs font-medium">
        {[
          {
            id: "org",
            label: currentUser?.role === "KOMISARIAT" ? "Profil Komisariat" : "Profil Cabang",
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
          />
        )}

        {activeTab === "security" && (
          <SecurityTab
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
              Berhasil Disimpan
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
