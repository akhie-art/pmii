"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Building,
  Shield,
  Save,
  Globe,
  Phone,
  Mail,
  Lock,
  CheckCircle,
  AlertTriangle,
  Trash2,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  Image as ImageIcon
} from "lucide-react";

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

// Import db utility
import { db } from "@/lib/db";

// Define TypeScript interfaces for settings structure
interface OrganizationSettings {
  cabangName: string;
  period: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  instagram: string;
  logo?: string;
}

interface SystemSettings {
  organization: OrganizationSettings;
  theme: "dark" | "light" | "system";
}

const DEFAULT_SETTINGS: SystemSettings = {
  organization: {
    cabangName: "PK PMII UIN Walisongo Semarang",
    period: "2026 - 2027",
    address: "Kampus UIN Walisongo, Ngaliyan, Kota Semarang, Jawa Tengah",
    email: "komisariat.walisongo@pmii.id",
    phone: "-",
    website: "https://pmii-walisongo.org",
    instagram: "@pmii_walisongo",
    logo: ""
  },
  theme: "dark"
};

export default function PengaturanPage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Toast message
  const [toastMessage, setToastMessage] = useState("");

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // File input ref for logo
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"org" | "security">("org");

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

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

      const userAccount = users[userIndex];
      if (userAccount.password && currentPassword && userAccount.password !== currentPassword) {
        setPasswordError("Kata sandi saat ini yang Anda masukkan salah.");
        setIsSavingPassword(false);
        return;
      }

      // Update password
      users[userIndex] = {
        ...userAccount,
        password: newPassword
      };

      await db.saveUsers(users);

      // Update local session
      if (currentUser) {
        const updatedSession = { ...currentUser, password: newPassword };
        setCurrentUser(updatedSession);
        localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(updatedSession));
      }

      setPasswordSuccess("Kata sandi akun Anda berhasil diperbarui!");
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
      
      {/* FLOATING TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 right-6 z-50 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-zinc-700 dark:border-zinc-300"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
        {/* TAB 1: ORGANISASI PROFIL */}
        {activeTab === "org" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Settings Form */}
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none lg:col-span-2">
              <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-sm font-bold tracking-wide flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{currentUser?.role === "KOMISARIAT" ? "Identitas Organisasi Komisariat" : "Identitas Organisasi Cabang"}</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                  {currentUser?.role === "KOMISARIAT"
                    ? "Informasi resmi kepengurusan PMII tingkat komisariat yang tertera pada dokumen dan arsip administrasi."
                    : "Informasi resmi kepengurusan PMII tingkat cabang yang tertera pada dokumen dan arsip administrasi."}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {currentUser?.role === "KOMISARIAT" ? "Nama Komisariat" : "Nama Komisariat"}
                    </label>
                    <Input
                      value={settings.organization.cabangName}
                      onChange={(e) => updateOrgField("cabangName", e.target.value)}
                      className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Masa Khidmat / Periode
                    </label>
                    <Input
                      value={settings.organization.period}
                      onChange={(e) => updateOrgField("period", e.target.value)}
                      className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Alamat Sekretariat
                  </label>
                  <textarea
                    value={settings.organization.address}
                    onChange={(e) => updateOrgField("address", e.target.value)}
                    rows={3}
                    className="w-full p-2.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Nomor WhatsApp Resmi
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <Input
                        value={settings.organization.phone}
                        onChange={(e) => updateOrgField("phone", e.target.value)}
                        className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Surel Resmi (E-mail)
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <Input
                        type="email"
                        value={settings.organization.email}
                        onChange={(e) => updateOrgField("email", e.target.value)}
                        className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Situs Web Resmi
                    </label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <Input
                        value={settings.organization.website}
                        onChange={(e) => updateOrgField("website", e.target.value)}
                        className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Instagram Resmi
                    </label>
                    <div className="relative">
                      <Instagram className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <Input
                        value={settings.organization.instagram}
                        onChange={(e) => updateOrgField("instagram", e.target.value)}
                        className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar Card: Logo Only */}
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none lg:col-span-1 p-5 sm:p-6 flex flex-col justify-center">
              <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-3.5">
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoChange}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                />

                <div className="w-24 h-24 rounded-full bg-blue-600 dark:bg-blue-700 border-2 border-amber-400/40 flex items-center justify-center text-white font-bold text-lg shadow-sm relative overflow-hidden group">
                  {settings.organization.logo ? (
                    <img
                      src={settings.organization.logo}
                      alt="Logo Organisasi"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <span>PMII</span>
                  )}
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-semibold text-white transition-opacity duration-200 cursor-pointer"
                  >
                    Ganti Logo
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {currentUser?.role === "KOMISARIAT" ? "Lambang PK PMII" : "Lambang PC PMII"}
                  </h4>
                  <p className="text-[10px] text-zinc-400">PNG, JPG, SVG, atau WebP (Maks. 2MB)</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    className="text-xs font-medium h-8 border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{settings.organization.logo ? "Ganti Logo" : "Unggah Logo"}</span>
                  </Button>

                  {settings.organization.logo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="text-xs font-medium h-8 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>

          </div>
        )}

        {/* TAB 2: KEAMANAN & AKUN */}
        {activeTab === "security" && (
          <div className="max-w-3xl">
            
            {/* Main Form: Password */}
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none">
              <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-sm font-bold tracking-wide flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Autentikasi & Akun Pengurus</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                  Kelola keamanan kata sandi akun dan proteksi autentikasi login pengguna.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 sm:p-6 space-y-6">
                
                {/* Real Working Password Change Form */}
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Ubah Kata Sandi Akun</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? "Sembunyikan" : "Tampilkan"}</span>
                    </button>
                  </div>

                  {passwordError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Kata Sandi Saat Ini
                      </label>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password saat ini..."
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Kata Sandi Baru <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 6 karakter..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Ulangi Kata Sandi <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Ketik ulang password..."
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      disabled={isSavingPassword || !newPassword || !confirmPassword}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-8.5 px-3.5 rounded-lg cursor-pointer"
                    >
                      {isSavingPassword ? "Menyimpan..." : "Perbarui Kata Sandi"}
                    </Button>
                  </div>
                </form>

              </CardContent>
            </Card>

          </div>
        )}
      </div>

      {/* --- DIALOGS / MODALS --- */}
      
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

    </div>
  );
}



function Instagram({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
