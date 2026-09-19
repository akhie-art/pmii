"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Building,
  Shield,
  Database,
  Save,
  RotateCcw,
  Download,
  Upload,
  Globe,
  Phone,
  Mail,
  MapPin,
  Lock,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  Info,
  CheckCircle,
  AlertTriangle,
  Server
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
  DialogFooter,
  DialogClose
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
}

interface CadreizationConfig {
  minMapabaFollowUp: number;
  minPkdFollowUp: number;
  autoApproveSubmissions: boolean;
  registrationOpen: boolean;
  notifyOnPendingReview: boolean;
}

interface SecuritySettings {
  mfaEnabled: boolean;
  sessionTimeout: number; // in minutes
  allowMultiSession: boolean;
}

interface SystemSettings {
  organization: OrganizationSettings;
  cadreization: CadreizationConfig;
  security: SecuritySettings;
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
    instagram: "@pmii_walisongo"
  },
  cadreization: {
    minMapabaFollowUp: 4,
    minPkdFollowUp: 6,
    autoApproveSubmissions: false,
    registrationOpen: true,
    notifyOnPendingReview: true
  },
  security: {
    mfaEnabled: false,
    sessionTimeout: 60,
    allowMultiSession: true
  },
  theme: "dark"
};

export default function PengaturanPage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Dialog status flags
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Input file state for backup import
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
          setSettings(JSON.parse(savedSettings));
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
      setMounted(true);
    }, 0);
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem("PMII_SYSTEM_SETTINGS", JSON.stringify(settings));
    setSuccessMessage(currentUser?.role === "KOMISARIAT" ? "Pengaturan komisariat berhasil disimpan secara lokal!" : "Pengaturan sistem berhasil disimpan secara lokal!");
    setIsSuccessOpen(true);
  };

  const handleResetSettings = async () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem("PMII_SYSTEM_SETTINGS", JSON.stringify(DEFAULT_SETTINGS));
    
    // Clear all Supabase tables to restore the database to standard empty state
    try {
      await Promise.all([
        db.saveCommissariats([]),
        db.saveCadres([]),
        db.saveRequirements([]),
        db.saveEvents([]),
        db.saveRegistrations([]),
        db.saveBoards([]),
        db.saveUsers([
          {
            id: "user-admin",
            name: "Admin Cabang PC PMII",
            email: "admin@pmii.org",
            password: "password",
            role: "ADMIN",
            status: "AKTIF",
            createdAt: new Date().toISOString()
          }
        ]),
        db.saveKaderisasi([]),
        db.saveSurat([]),
        db.saveArsip([])
      ]);
    } catch (e) {
      console.error("Failed to clear Supabase database during reset:", e);
    }
    
    setIsResetOpen(false);
    setSuccessMessage("Seluruh pengaturan dan basis data Supabase telah dikembalikan ke standar awal (kosong).");
    setIsSuccessOpen(true);
  };

  // Full Database Export (Backup JSON file from Supabase directly)
  const handleExportBackup = async () => {
    try {
      const [
        komisariatList,
        cadresList,
        requirementsList,
        eventsList,
        registrationsList,
        boardsList,
        usersList,
        kaderisasiList,
        suratList,
        arsipList
      ] = await Promise.all([
        db.getCommissariats([]),
        db.getCadres([]),
        db.getRequirements([]),
        db.getEvents([]),
        db.getRegistrations([]),
        db.getBoards([]),
        db.getUsers([]),
        db.getKaderisasi(),
        db.getSurat(),
        db.getArsip()
      ]);

      const backupData = {
        meta: {
          exportedAt: new Date().toISOString(),
          version: "1.1.0",
          origin: settings.organization.cabangName
        },
        komisariat: JSON.stringify(komisariatList),
        kader: JSON.stringify(cadresList),
        persyaratan: JSON.stringify(requirementsList),
        kegiatan: JSON.stringify(eventsList),
        pendaftaran: JSON.stringify(registrationsList),
        pengurus: JSON.stringify(boardsList),
        pengguna: JSON.stringify(usersList),
        kaderisasi: JSON.stringify(kaderisasiList),
        surat: JSON.stringify(suratList),
        arsip: JSON.stringify(arsipList),
        settings: JSON.stringify(settings)
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `backup_pmii_smg_${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Gagal membuat berkas backup sistem.");
    }
  };

  // Database Import (Restore JSON file directly to Supabase)
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.meta || !json.settings) {
          throw new Error("Format berkas backup tidak valid.");
        }

        // Restore settings to local storage
        if (json.settings) {
          localStorage.setItem("PMII_SYSTEM_SETTINGS", json.settings);
          setSettings(JSON.parse(json.settings));
        }

        const promises: Promise<boolean>[] = [];

        // Support new format and compatibility keys for commissariats
        if (json.komisariat) {
          promises.push(db.saveCommissariats(JSON.parse(json.komisariat)));
        } else if (json.komisariat_list) {
          promises.push(db.saveCommissariats(JSON.parse(json.komisariat_list)));
        }

        // Support new format and compatibility keys for cadres
        if (json.kader) {
          promises.push(db.saveCadres(JSON.parse(json.kader)));
        } else if (json.followup_cadres) {
          promises.push(db.saveCadres(JSON.parse(json.followup_cadres)));
        }

        // Support new format and compatibility keys for requirements
        if (json.persyaratan) {
          promises.push(db.saveRequirements(JSON.parse(json.persyaratan)));
        } else if (json.followup_requirements) {
          promises.push(db.saveRequirements(JSON.parse(json.followup_requirements)));
        }

        // Import other tables if present
        if (json.kegiatan) {
          promises.push(db.saveEvents(JSON.parse(json.kegiatan)));
        }
        if (json.pendaftaran) {
          promises.push(db.saveRegistrations(JSON.parse(json.pendaftaran)));
        }
        if (json.pengurus) {
          promises.push(db.saveBoards(JSON.parse(json.pengurus)));
        }
        if (json.pengguna) {
          promises.push(db.saveUsers(JSON.parse(json.pengguna)));
        }
        if (json.kaderisasi) {
          promises.push(db.saveKaderisasi(JSON.parse(json.kaderisasi)));
        }
        if (json.surat) {
          promises.push(db.saveSurat(JSON.parse(json.surat)));
        }
        if (json.arsip) {
          promises.push(db.saveArsip(JSON.parse(json.arsip)));
        }

        const results = await Promise.all(promises);
        const success = results.every(r => r);

        if (!success) {
          alert("Beberapa data gagal disimpan ke Supabase database. Periksa koneksi/konfigurasi.");
        }

        setSuccessMessage("Sistem berhasil memulihkan database dari berkas backup! Halaman akan dimuat ulang.");
        setIsSuccessOpen(true);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error(err);
        alert("Gagal memulihkan database. Pastikan berkas JSON memiliki format backup resmi PMII Admin.");
      }
    };
    reader.readAsText(file);
  };

  // Organization field state setter helpers
  const updateOrgField = (key: keyof OrganizationSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      organization: {
        ...prev.organization,
        [key]: value
      }
    }));
  };

  // Cadreization field state setter helpers
  const updateCadreField = <K extends keyof CadreizationConfig>(key: K, value: CadreizationConfig[K]) => {
    setSettings((prev) => ({
      ...prev,
      cadreization: {
        ...prev.cadreization,
        [key]: value
      }
    }));
  };

  // Security field state setter helpers
  const updateSecurityField = <K extends keyof SecuritySettings>(key: K, value: SecuritySettings[K]) => {
    setSettings((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: value
      }
    }));
  };

  // UI animation constants
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 25 } }
  } as const;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  } as const;

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-zinc-200 dark:bg-zinc-800/40 rounded-3xl animate-pulse" />
        <div className="h-96 bg-zinc-200 dark:bg-zinc-800/40 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 text-zinc-900 dark:text-zinc-100"
    >
      {/* 1. HEADER BANNER */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-lg bg-blue-600 dark:bg-blue-700 p-6 md:p-7 text-white border border-blue-500/80 shadow-none"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <Badge className="bg-white/15 border border-white/20 text-[10px] font-extrabold uppercase tracking-wider text-white">
              <Settings className="w-3.5 h-3.5 mr-1" /> Pengaturan
            </Badge>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              {currentUser?.role === "KOMISARIAT" ? "Pengaturan Komisariat PMII" : "Pengaturan Sistem PMII"}
            </h1>
            <p className="text-xs md:text-sm text-blue-100 leading-relaxed">
              {currentUser?.role === "KOMISARIAT"
                ? "Konfigurasi profil komisariat, aturan kalkulasi pengaderan formal, parameter otentikasi login, serta utilitas pemeliharaan database cadangan."
                : "Konfigurasi profil cabang, aturan kalkulasi pengaderan formal, parameter otentikasi login, serta utilitas pemeliharaan database cadangan."}
            </p>
          </div>

          <div className="flex-shrink-0 flex gap-2.5">
            <Button
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-white hover:bg-zinc-100 text-blue-700 font-semibold text-xs rounded-lg shadow-sm border-none cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Simpan Pengaturan
            </Button>
          </div>
        </div>
      </motion.div>

      {/* 2. TABS CONTAINER */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="org" className="w-full">
            <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-lg shadow-none mb-6 overflow-x-auto">
              <TabsList className="bg-transparent border-none p-0 flex gap-1 h-9">
                <TabsTrigger
                  value="org"
                  className="text-xs font-semibold px-3.5 py-1.5 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Building className="w-3.5 h-3.5" /> {currentUser?.role === "KOMISARIAT" ? "Profil Komisariat" : "Profil Cabang"}
                </TabsTrigger>
                {currentUser?.role !== "KOMISARIAT" && (
                  <TabsTrigger
                    value="cadre"
                    className="text-xs font-semibold px-3.5 py-1.5 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Aturan Pengaderan
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="security"
                  className="text-xs font-bold px-4 py-2 rounded-xl data-[state=active]:bg-pmii-blue data-[state=active]:text-white dark:data-[state=active]:bg-pmii-gold dark:data-[state=active]:text-[#090d16] text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" /> Keamanan & Akun
                </TabsTrigger>
                {currentUser?.role !== "KOMISARIAT" && (
                  <TabsTrigger
                    value="db"
                    className="text-xs font-bold px-4 py-2 rounded-xl data-[state=active]:bg-pmii-blue data-[state=active]:text-white dark:data-[state=active]:bg-pmii-gold dark:data-[state=active]:text-[#090d16] text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <Database className="w-3.5 h-3.5" /> Database & Pemeliharaan
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* TAB 1: ORGANISASI PROFIL */}
            <TabsContent value="org" className="outline-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Settings Form */}
                <Card className="bg-white dark:bg-[#090d16]/80 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-xs ring-1 ring-foreground/5 lg:col-span-2">
                  <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                    <CardTitle className="text-sm font-extrabold tracking-wide flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-pmii-blue dark:text-pmii-gold" /> {currentUser?.role === "KOMISARIAT" ? "Identitas Organisasi Komisariat" : "Identitas Organisasi Cabang"}
                    </CardTitle>
                    <CardDescription className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                      {currentUser?.role === "KOMISARIAT"
                        ? "Informasi resmi kepengurusan PMII tingkat komisariat yang tertera pada kop surat dan arsip administrasi."
                        : "Informasi resmi kepengurusan PMII tingkat cabang yang tertera pada kop surat dan arsip administrasi."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">{currentUser?.role === "KOMISARIAT" ? "Nama Komisariat / Pengurus" : "Nama Cabang / Pengurus"}</label>
                        <Input
                          value={settings.organization.cabangName}
                          onChange={(e) => updateOrgField("cabangName", e.target.value)}
                          className="text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Masa Khidmat / Periode</label>
                        <Input
                          value={settings.organization.period}
                          onChange={(e) => updateOrgField("period", e.target.value)}
                          className="text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Alamat Sekretariat</label>
                      <textarea
                        value={settings.organization.address}
                        onChange={(e) => updateOrgField("address", e.target.value)}
                        rows={3}
                        className="w-full p-2.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-pmii-blue dark:focus:border-pmii-gold outline-hidden transition-all text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Nomor Hubungi (WhatsApp)</label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <Input
                            value={settings.organization.phone}
                            onChange={(e) => updateOrgField("phone", e.target.value)}
                            className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Surel Hubungi (E-mail)</label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <Input
                            type="email"
                            value={settings.organization.email}
                            onChange={(e) => updateOrgField("email", e.target.value)}
                            className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Situs Web Resmi</label>
                        <div className="relative">
                          <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <Input
                            value={settings.organization.website}
                            onChange={(e) => updateOrgField("website", e.target.value)}
                            className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Instagram Resmi</label>
                        <div className="relative">
                          <Instagram className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <Input
                            value={settings.organization.instagram}
                            onChange={(e) => updateOrgField("instagram", e.target.value)}
                            className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sidebar Card: Logo & KopPreview */}
                <Card className="bg-white dark:bg-[#090d16]/80 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-xs ring-1 ring-foreground/5 lg:col-span-1 p-6 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Kop Surat & Logo preview
                  </h3>
                  
                  {/* Simulated Logo upload container */}
                  <div className="border border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pmii-blue to-pmii-blue-light dark:from-[#0d2a56] dark:to-[#164182] border-4 border-pmii-gold/30 flex items-center justify-center text-white font-extrabold text-lg shadow-lg relative overflow-hidden group">
                      <span className="group-hover:opacity-0 transition-opacity">PMII</span>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold transition-all duration-200 cursor-pointer">
                        Ubah Foto
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{currentUser?.role === "KOMISARIAT" ? "Lambang PK PMII" : "Lambang PC PMII"}</h4>
                      <p className="text-[9px] text-zinc-400 font-medium">Format file: SVG, PNG, JPG (Maks. 2MB)</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-[10px] font-bold h-7 border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer">
                      Ganti Logo
                    </Button>
                  </div>

                  <div className="p-4 bg-zinc-50/40 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-2 text-xs">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-pmii-gold" /> Preview Alamat Resmi
                    </p>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold italic">
                      &ldquo;{settings.organization.address}&rdquo;
                    </p>
                  </div>
                </Card>

              </div>
            </TabsContent>

            {/* TAB 2: ATURAN PENGADERAN */}
            {currentUser?.role !== "KOMISARIAT" && (
              <TabsContent value="cadre" className="outline-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Main Config */}
                  <Card className="bg-white dark:bg-[#090d16]/80 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-xs ring-1 ring-foreground/5 lg:col-span-2">
                    <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                      <CardTitle className="text-sm font-extrabold tracking-wide flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-pmii-blue dark:text-pmii-gold" /> Konfigurasi Bobot Kurikulum
                      </CardTitle>
                      <CardDescription className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                        Tentukan ambang batas minimum pemenuhan indikator kelulusan Rencana Kerja Tindak Lanjut (RKTL).
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 space-y-5">
                      
                      {/* Minimum Submissions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                            Sesi Kajian Wajib MAPABA
                          </label>
                          <p className="text-[9px] text-zinc-400 font-medium">Minimum jumlah kajian/resume yang wajib dilaporkan.</p>
                          <Input
                            type="number"
                            min={1}
                            value={settings.cadreization.minMapabaFollowUp}
                            onChange={(e) => updateCadreField("minMapabaFollowUp", parseInt(e.target.value) || 1)}
                            className="text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                            Sesi Kajian Wajib PKD
                          </label>
                          <p className="text-[9px] text-zinc-400 font-medium">Minimum jumlah kajian/resume yang wajib dilaporkan.</p>
                          <Input
                            type="number"
                            min={1}
                            value={settings.cadreization.minPkdFollowUp}
                            onChange={(e) => updateCadreField("minPkdFollowUp", parseInt(e.target.value) || 1)}
                            className="text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                          />
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="space-y-3.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                        {/* Auto approve */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5 max-w-[80%]">
                            <label className="text-xs font-bold text-zinc-850 dark:text-zinc-200">
                              Persetujuan Otomatis Laporan Follow Up
                            </label>
                            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium leading-relaxed">
                              Sistem akan langsung menyetujui setiap resume kajian follow up yang diunggah oleh kader tanpa perlu proses review/kurasi manual oleh admin.
                            </p>
                          </div>
                          <button
                            onClick={() => updateCadreField("autoApproveSubmissions", !settings.cadreization.autoApproveSubmissions)}
                            className="focus:outline-hidden cursor-pointer"
                          >
                            {settings.cadreization.autoApproveSubmissions ? (
                              <ToggleRight className="w-8 h-8 text-pmii-blue dark:text-pmii-gold" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-zinc-400 dark:text-zinc-700" />
                            )}
                          </button>
                        </div>

                        {/* Registration open */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5 max-w-[80%]">
                            <label className="text-xs font-bold text-zinc-850 dark:text-zinc-200">
                              Portal Pendaftaran Anggota Terbuka
                            </label>
                            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium leading-relaxed">
                              Buka formulir registrasi mandiri untuk kader/anggota baru secara publik. Jika ditutup, kader hanya bisa ditambahkan oleh admin.
                            </p>
                          </div>
                          <button
                            onClick={() => updateCadreField("registrationOpen", !settings.cadreization.registrationOpen)}
                            className="focus:outline-hidden cursor-pointer"
                          >
                            {settings.cadreization.registrationOpen ? (
                              <ToggleRight className="w-8 h-8 text-pmii-blue dark:text-pmii-gold" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-zinc-400 dark:text-zinc-700" />
                            )}
                          </button>
                        </div>

                        {/* Notify on pending */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5 max-w-[80%]">
                            <label className="text-xs font-bold text-zinc-850 dark:text-zinc-200">
                              Notifikasi Email Laporan Baru
                            </label>
                            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium leading-relaxed">
                              Kirimkan ringkasan pemberitahuan ke email kepengurusan setiap kali ada kader yang mengunggah berkas follow-up baru untuk direview.
                            </p>
                          </div>
                          <button
                            onClick={() => updateCadreField("notifyOnPendingReview", !settings.cadreization.notifyOnPendingReview)}
                            className="focus:outline-hidden cursor-pointer"
                          >
                            {settings.cadreization.notifyOnPendingReview ? (
                              <ToggleRight className="w-8 h-8 text-pmii-blue dark:text-pmii-gold" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-zinc-400 dark:text-zinc-700" />
                            )}
                          </button>
                        </div>
                      </div>

                    </CardContent>
                  </Card>

                  {/* Sidebar Card: Accreditation Weights */}
                  <Card className="bg-white dark:bg-[#090d16]/80 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-xs ring-1 ring-foreground/5 lg:col-span-1 p-6 space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      {currentUser?.role === "KOMISARIAT" ? "Metrik Standarisasi Komisariat" : "Metrik Standarisasi Cabang"}
                    </h3>

                    <div className="p-4 bg-zinc-50/40 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-3.5 text-xs">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-pmii-gold" /> Penilaian Akreditasi
                      </p>
                      <div className="space-y-2 text-[10px] font-semibold text-zinc-500 leading-relaxed">
                        <div className="flex justify-between">
                          <span>Kelengkapan Data Anggota:</span>
                          <span className="font-bold text-foreground">100%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Agenda Kaderisasi Formal:</span>
                          <span className="font-bold text-foreground">Rutin</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Keaktifan BPH Teratur:</span>
                          <span className="font-bold text-emerald-500">Wajib</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-600 dark:text-amber-400 leading-relaxed font-semibold rounded-xl">
                      <AlertTriangle className="w-4 h-4 inline mr-1 text-amber-500" />
                      Setiap penyesuaian jumlah minimum follow-up akan berdampak langsung secara dinamis pada perhitungan progres persentase (%) kelulusan seluruh kader yang sedang aktif di sistem.
                    </div>
                  </Card>

                </div>
              </TabsContent>
            )}

            {/* TAB 3: KEAMANAN & AKUN */}
            <TabsContent value="security" className="outline-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Form */}
                <Card className="bg-white dark:bg-[#090d16]/80 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-xs ring-1 ring-foreground/5 lg:col-span-2">
                  <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                    <CardTitle className="text-sm font-extrabold tracking-wide flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-pmii-blue dark:text-pmii-gold" /> Autentikasi & Akun Pengurus
                    </CardTitle>
                    <CardDescription className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                      Kelola keamanan data sistem, proteksi akun administrator, serta sesi login aktif.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Kata Sandi Baru</label>
                        <Input
                          type="password"
                          placeholder="Masukkan password baru..."
                          className="text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Ulangi Kata Sandi Baru</label>
                        <Input
                          type="password"
                          placeholder="Ketik ulang password..."
                          className="text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                        />
                      </div>
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 space-y-4">
                      <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                        Parameter Keamanan Sesi
                      </h4>

                      <div className="space-y-3.5">
                        <div className="flex items-start justify-between gap-4 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-150">
                              Batas Sesi Waktu Tunggu (Timeout)
                            </h5>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold leading-relaxed">
                              Sesi akun administrator keluar otomatis setelah waktu diam yang ditentukan.
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Input
                              type="number"
                              value={settings.security.sessionTimeout}
                              onChange={(e) => updateSecurityField("sessionTimeout", Number(e.target.value))}
                              className="text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg h-8 w-16"
                            />
                            <span className="text-[10px] font-bold text-zinc-400">menit</span>
                          </div>
                        </div>

                        {([
                          {
                            key: "mfaEnabled",
                            title: "Aktifkan Multi-Factor Authentication (MFA)",
                            desc: "Memerlukan kode OTP verifikasi tambahan saat masuk ke dashboard utama."
                          },
                          {
                            key: "allowMultiSession",
                            title: "Izinkan Multi-Session Login",
                            desc: "Mengizinkan satu akun pengurus login secara bersamaan di perangkat berbeda."
                          }
                        ] as { key: keyof SecuritySettings; title: string; desc: string }[]).map((item) => {
                          const isActive = settings.security[item.key];
                          return (
                            <div
                              key={item.key}
                              className="flex items-start justify-between gap-4 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30"
                            >
                              <div className="space-y-0.5">
                                <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-150">
                                  {item.title}
                                </h5>
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold leading-relaxed">
                                  {item.desc}
                                </p>
                              </div>
                              <button
                                onClick={() => updateSecurityField(item.key, !isActive)}
                                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer animate-none"
                              >
                                {isActive ? (
                                  <ToggleRight className="w-8 h-8 text-pmii-blue dark:text-pmii-gold" />
                                ) : (
                                  <ToggleLeft className="w-8 h-8 text-zinc-400 dark:text-zinc-700" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </CardContent>
                </Card>

                {/* Sidebar Card: Security Notes */}
                <Card className="bg-white dark:bg-[#090d16]/80 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-xs ring-1 ring-foreground/5 lg:col-span-1 p-6 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Otorisasi Hak Akses
                  </h3>

                  <div className="p-4 bg-zinc-50/40 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-3.5 text-xs">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-pmii-gold" /> Struktur Peran Login
                    </p>
                    <div className="space-y-2 text-[10px] font-semibold text-zinc-500 leading-relaxed">
                      <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-1">
                        <span>Ketua Cabang:</span>
                        <span className="font-bold text-emerald-500">Hak Akses Penuh</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-1">
                        <span>Ketua Komisariat:</span>
                        <span className="font-bold text-zinc-300">Terbatas Kampus</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kader / Anggota:</span>
                        <span className="font-bold text-zinc-350">Hanya Laporan</span>
                      </div>
                    </div>
                  </div>
                </Card>

              </div>
            </TabsContent>

            {/* TAB 4: DATABASE & BACKUP */}
            {currentUser?.role !== "KOMISARIAT" && (
              <TabsContent value="db" className="outline-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Backup & System operations */}
                <Card className="bg-white dark:bg-[#090d16]/80 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-xs ring-1 ring-foreground/5 lg:col-span-2">
                  <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                    <CardTitle className="text-sm font-extrabold tracking-wide flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-pmii-blue dark:text-pmii-gold" /> Pemeliharaan & Ekspor-Impor Database
                    </CardTitle>
                    <CardDescription className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                      Utilitas untuk mencadangkan seluruh data anggota, progress follow-up kader ke berkas eksternal, atau memulihkannya.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    
                    {/* Database Operations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Export Card */}
                      <div className="p-5 border border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl space-y-4 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-100 flex items-center gap-1">
                            <Download className="w-4 h-4 text-pmii-blue dark:text-pmii-gold" /> Backup Database (Ekspor)
                          </h4>
                          <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
                            Unduh seluruh database saat ini (Komisariat, Data Anggota, Progres Kader, Persyaratan) ke dalam format berkas berkode `.json`.
                          </p>
                        </div>
                        <Button
                          onClick={handleExportBackup}
                          className="w-full bg-pmii-blue hover:bg-pmii-blue-light dark:bg-pmii-gold dark:hover:bg-pmii-gold-light text-white dark:text-[#090d16] font-bold text-xs h-9 rounded-lg border-none cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-4 h-4" /> Unduh Cadangan JSON
                        </Button>
                      </div>

                      {/* Import Card */}
                      <div className="p-5 border border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl space-y-4 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-100 flex items-center gap-1">
                            <Upload className="w-4 h-4 text-emerald-500" /> Pulihkan Database (Impor)
                          </h4>
                          <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
                            Unggah berkas cadangan JSON yang telah diunduh sebelumnya untuk mengembalikan atau menimpa database sistem secara instan.
                          </p>
                        </div>
                        
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImportBackup}
                          accept=".json"
                          className="hidden"
                        />

                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          className="w-full border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-bold h-9 rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Upload className="w-4 h-4 text-emerald-500" /> Unggah & Pulihkan File
                        </Button>
                      </div>

                    </div>

                    {/* Reset Card Dangerous */}
                    <div className="border-2 border-dashed border-rose-500/20 bg-rose-500/[0.02] rounded-2xl p-5 space-y-4">
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <RotateCcw className="w-4 h-4" /> Reset Database Sistem
                        </h4>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-semibold leading-relaxed">
                          Menghapus seluruh modifikasi lokal data (anggota, progress follow-up) dan memulihkannya kembali ke data default standar sistem. Tindakan ini tidak dapat dibatalkan.
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => setIsResetOpen(true)}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 rounded-lg border-none cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-4 h-4" /> Reset Data ke Awal
                      </Button>
                    </div>

                  </CardContent>
                </Card>

                {/* Sidebar Card: System Info */}
                <Card className="bg-white dark:bg-[#090d16]/80 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-xs ring-1 ring-foreground/5 lg:col-span-1 p-6 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Informasi Sistem & Versi
                  </h3>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center gap-3">
                      <Server className="w-4 h-4 text-pmii-gold flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wide">Mesin Database</p>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                          Supabase Cloud Database (PostgreSQL)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Info className="w-4 h-4 text-pmii-blue dark:text-pmii-gold flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wide">Versi Aplikasi</p>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                          v1.2.4-stable
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                </div>
              </TabsContent>
            )}

          </Tabs>
        </motion.div>
      </div>

      {/* --- DIALOGS / MODALS --- */}
      
      {/* 1. DIALOG: RESET WARNING */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-sm text-foreground w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4.5 h-4.5" /> Konfirmasi Reset Database
            </DialogTitle>
            <DialogDescription className="text-[10px] text-zinc-450 font-semibold leading-relaxed">
              Tindakan ini akan menghapus permanen data keanggotaan, progres laporan, dan pengaturan yang Anda buat. Sistem akan dikembalikan ke data awal.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <DialogClose render={<Button variant="outline" className="text-xs border-zinc-200 dark:border-zinc-850 h-9 rounded-lg" />}>
              Batal
            </DialogClose>
            <Button
              onClick={handleResetSettings}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 rounded-lg border-none cursor-pointer"
            >
              Ya, Reset Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. DIALOG: SUCCESS NOTIFICATION */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-sm text-foreground w-full p-6">
          <DialogHeader className="flex flex-col items-center justify-center text-center space-y-1 pb-2">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
            <DialogTitle className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider">
              Berhasil
            </DialogTitle>
            <DialogDescription className="text-[10px] text-zinc-400 font-semibold select-text">
              {successMessage}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="justify-center sm:justify-center">
            <DialogClose render={<Button variant="outline" className="text-xs border-zinc-200 dark:border-zinc-850 h-8 rounded-lg" />}>
              Tutup
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
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
