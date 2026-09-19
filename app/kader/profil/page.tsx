"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import type { CadreFollowUp } from "@/lib/db";
import { exportCardAsImage } from "@/lib/cardExporter";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  CheckCircle,
  GraduationCap,
  Building,
  Calendar,
  Award,
  ShieldCheck,
  Download,
  BookOpen,
  Camera,
  Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

export default function ProfilPage() {
  const [mounted, setMounted] = useState(false);
  const [cadres, setCadres] = useState<CadreFollowUp[]>([]);
  const [currentCadre, setCurrentCadre] = useState<CadreFollowUp | null>(null);

  // Profile photo states
  const [avatar, setAvatar] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [instagram, setInstagram] = useState("");
  const [perguruanTinggi, setPerguruanTinggi] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [angkatan, setAngkatan] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Dialog & registration states
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [hasMapabaRegistration, setHasMapabaRegistration] = useState(false);
  const [registrationCode, setRegistrationCode] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      const activeId = typeof window !== "undefined" ? (localStorage.getItem("PMII_ACTIVE_CADRE_ID") || "") : "";
      const savedUserStr = typeof window !== "undefined" ? localStorage.getItem("PMII_LOGGED_IN_USER") : null;
      let loggedInUser: any = null;
      if (savedUserStr) {
        try {
          loggedInUser = JSON.parse(savedUserStr);
        } catch (e) {}
      }
      
      const [allCadres, allRegs] = await Promise.all([
        db.getCadres([]),
        db.getRegistrations([])
      ]);

      let mine: CadreFollowUp | null = 
        (activeId ? allCadres.find(c => c.id === activeId) : null) || 
        (loggedInUser ? allCadres.find(c => c.id === loggedInUser.id || (c.email && c.email.toLowerCase() === loggedInUser.email?.toLowerCase())) : null) || 
        allCadres[0] || null;

      // Auto-fallback from loggedInUser to avoid broken profile state
      if (!mine && loggedInUser) {
        const isGraduated = loggedInUser.role?.toLowerCase() === "anggota" || 
                            loggedInUser.role?.toLowerCase() === "admin" || 
                            loggedInUser.role?.toLowerCase() === "pengurus";

        const fallbackCadre: CadreFollowUp = {
          id: loggedInUser.id || `cadre-${Date.now()}`,
          name: loggedInUser.name || "Kader PMII",
          email: loggedInUser.email || "",
          phone: loggedInUser.phone || "",
          level: (loggedInUser.level as any) || "MAPABA",
          commissariat: loggedInUser.commissariat || "Ki Ageng Getas Pendawa",
          startDate: loggedInUser.createdAt ? loggedInUser.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          status: "AKTIF",
          submissions: [],
          isGraduated,
          nta: loggedInUser.nta || "",
          avatar: loggedInUser.avatar || "",
          address: loggedInUser.address || "",
          perguruanTinggi: loggedInUser.perguruanTinggi || "Komisariat Ki Ageng Getas Pendawa",
          jurusan: loggedInUser.jurusan || "",
          angkatan: loggedInUser.angkatan || "2026"
        };
        mine = fallbackCadre;
        allCadres.push(fallbackCadre);
        await db.saveCadres(allCadres);
      }

      setCadres(allCadres);
      setCurrentCadre(mine);

      if (mine) {
        setName(mine.name || "");
        setAvatar(mine.avatar || loggedInUser?.avatar || "");
        setPhone(mine.phone || "");
        setEmail(mine.email || "");
        setAddress(mine.address || "");
        setInstagram(mine.instagram || "");
        setPerguruanTinggi(mine.perguruanTinggi || mine.commissariat || "");
        setJurusan(mine.jurusan || "");
        setAngkatan(mine.angkatan || "");

        // Check MAPABA registration
        const matchedReg = allRegs.find(r => 
          (mine?.name && r.cadreName?.toLowerCase().trim() === mine.name.toLowerCase().trim()) || 
          (mine?.email && r.cadreEmail?.toLowerCase().trim() === mine.email.toLowerCase().trim())
        );

        if (matchedReg) {
          setHasMapabaRegistration(true);
          setRegistrationCode(matchedReg.registrationNumber || mine.registrationNumber || "");
        } else {
          setHasMapabaRegistration(Boolean(mine.registrationNumber));
          setRegistrationCode(mine.registrationNumber || "");
        }
      }
      setMounted(true);
    };
    loadData();
  }, []);

  // Offline-safe local QR Code generation
  useEffect(() => {
    if (!currentCadre) return;
    const code = currentCadre.isGraduated
      ? currentCadre.nta || currentCadre.name || "KTA-PMII"
      : registrationCode || currentCadre.registrationNumber || currentCadre.name || "REG-PMII";

    QRCode.toDataURL(code, {
      width: 300,
      margin: 1,
      color: {
        dark: "#090d16",
        light: "#ffffff"
      }
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error("Local QR Code generation failed:", err));
  }, [currentCadre, registrationCode]);

  // Compress image before saving to keep localStorage and sync lightweight
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Format file tidak didukung. Harap pilih gambar (JPG, PNG, atau WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 5 MB.");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const compressedBase64 = await compressImage(file);
      setAvatar(compressedBase64);

      if (currentCadre) {
        const updated: CadreFollowUp = {
          ...currentCadre,
          avatar: compressedBase64,
          pasFotoName: file.name
        };
        setCurrentCadre(updated);

        // Update in cadres list
        const updatedList = cadres.map(c => c.id === currentCadre.id ? updated : c);
        setCadres(updatedList);
        await db.saveCadres(updatedList);

        // Synchronize with PMII_LOGGED_IN_USER
        if (typeof window !== "undefined") {
          const savedUserStr = localStorage.getItem("PMII_LOGGED_IN_USER");
          if (savedUserStr) {
            try {
              const loggedInUser = JSON.parse(savedUserStr);
              loggedInUser.avatar = compressedBase64;
              localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(loggedInUser));

              const users = await db.getUsers();
              const userIdx = users.findIndex(u => u.id === loggedInUser.id || (u.email && u.email.toLowerCase() === loggedInUser.email?.toLowerCase()));
              if (userIdx !== -1) {
                users[userIdx] = {
                  ...users[userIdx],
                  avatar: compressedBase64
                };
                await db.saveUsers(users);
              }
            } catch (err) {
              console.error("Error syncing logged in user avatar:", err);
            }
          }
        }
        toast.success("Foto profil berhasil diperbarui!");
      }
    } catch (err) {
      console.error("Error uploading photo:", err);
      toast.error("Gagal memproses foto. Silakan coba kembali.");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    setAvatar("");
    if (currentCadre) {
      const updated: CadreFollowUp = {
        ...currentCadre,
        avatar: "",
        pasFotoName: ""
      };
      setCurrentCadre(updated);

      const updatedList = cadres.map(c => c.id === currentCadre.id ? updated : c);
      setCadres(updatedList);
      await db.saveCadres(updatedList);

      if (typeof window !== "undefined") {
        const savedUserStr = localStorage.getItem("PMII_LOGGED_IN_USER");
        if (savedUserStr) {
          try {
            const loggedInUser = JSON.parse(savedUserStr);
            delete loggedInUser.avatar;
            localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(loggedInUser));

            const users = await db.getUsers();
            const userIdx = users.findIndex(u => u.id === loggedInUser.id || (u.email && u.email.toLowerCase() === loggedInUser.email?.toLowerCase()));
            if (userIdx !== -1) {
              delete users[userIdx].avatar;
              await db.saveUsers(users);
            }
          } catch (err) {}
        }
      }
      toast.success("Foto profil berhasil dihapus.");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCadre) return;
    if (!name.trim()) {
      toast.error("Nama lengkap tidak boleh kosong.");
      return;
    }
    setIsSaving(true);

    try {
      const updated: CadreFollowUp = {
        ...currentCadre,
        name: name.trim(),
        avatar: avatar,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        instagram: instagram.trim(),
        perguruanTinggi: perguruanTinggi.trim(),
        jurusan: jurusan.trim(),
        angkatan: angkatan.trim()
      };

      const updatedList = cadres.map(c => c.id === currentCadre.id ? updated : c);
      setCadres(updatedList);
      setCurrentCadre(updated);

      await db.saveCadres(updatedList);

      if (typeof window !== "undefined") {
        const savedUserStr = localStorage.getItem("PMII_LOGGED_IN_USER");
        if (savedUserStr) {
          try {
            const loggedInUser = JSON.parse(savedUserStr);
            loggedInUser.name = name.trim();
            loggedInUser.avatar = avatar;
            loggedInUser.phone = phone.trim();
            loggedInUser.email = email.trim();
            loggedInUser.address = address.trim();
            loggedInUser.instagram = instagram.trim();
            loggedInUser.perguruanTinggi = perguruanTinggi.trim();
            loggedInUser.jurusan = jurusan.trim();
            loggedInUser.angkatan = angkatan.trim();
            localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(loggedInUser));

            const users = await db.getUsers();
            const userIdx = users.findIndex(u => u.id === loggedInUser.id || (u.email && u.email.toLowerCase() === loggedInUser.email?.toLowerCase()));
            if (userIdx !== -1) {
              users[userIdx] = {
                ...users[userIdx],
                name: name.trim(),
                avatar: avatar,
                email: email.trim()
              };
              await db.saveUsers(users);
            }
          } catch (err) {
            console.error("Error syncing logged in user:", err);
          }
        }
      }

      // Also sync registrations if registered
      try {
        const allRegs = await db.getRegistrations([]);
        let regChanged = false;
        const updatedRegs = allRegs.map(r => {
          if (
            (currentCadre.id && r.id === currentCadre.id) ||
            (currentCadre.email && r.cadreEmail?.toLowerCase().trim() === currentCadre.email.toLowerCase().trim()) ||
            (currentCadre.name && r.cadreName?.toLowerCase().trim() === currentCadre.name.toLowerCase().trim())
          ) {
            regChanged = true;
            return {
              ...r,
              cadreName: name.trim(),
              cadreEmail: email.trim(),
              cadrePhone: phone.trim()
            };
          }
          return r;
        });
        if (regChanged) {
          await db.saveRegistrations(updatedRegs);
        }
      } catch (err) {
        console.error("Error syncing registrations:", err);
      }

      toast.success("Data profil dan nama berhasil diperbarui.");
      setIsSuccessOpen(true);
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Gagal menyimpan perubahan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadCard = async (type: "kta" | "peserta") => {
    if (!currentCadre) return;
    setIsDownloading(true);
    try {
      await exportCardAsImage({
        type,
        name: currentCadre.name,
        idNumber: type === "kta" ? memberNTA : memberRegNumber,
        commissariat: currentCadre.commissariat,
        level: currentCadre.level,
        eventName: type === "peserta" ? "Masa Penerimaan Anggota Baru (MAPABA)" : undefined,
        eventDate: type === "peserta" ? (memberStartDate !== "-" ? memberStartDate : new Date().toISOString().split("T")[0]) : undefined,
        startDate: type === "kta" ? memberStartDate : undefined
      });
      toast.success(type === "kta" ? "KTA Digital berhasil diunduh!" : "Kartu Peserta berhasil diunduh!");
    } catch (err) {
      console.error("Download card error:", err);
      toast.error("Gagal mengunduh kartu. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-32 bg-zinc-200 dark:bg-zinc-800/40 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-80 bg-zinc-200 dark:bg-zinc-800/40 rounded-xl animate-pulse" />
          <div className="lg:col-span-7 h-80 bg-zinc-200 dark:bg-zinc-800/40 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!currentCadre) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] text-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md mx-auto space-y-5">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
          <User className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Profil Belum Terdaftar</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Data akun Anda belum terhubung di sistem kader. Silakan masuk kembali atau hubungi pengurus komisariat.
          </p>
        </div>
        <div className="flex gap-3 w-full justify-center">
          <Link href="/login" className="w-1/2">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8.5 rounded-lg">
              Masuk Akun
            </Button>
          </Link>
          <Link href="/register" className="w-1/2">
            <Button variant="outline" className="w-full border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-xs h-8.5 rounded-lg">
              Daftar MAPABA
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const memberNTA = currentCadre.nta ? currentCadre.nta : "-";
  const memberRegNumber = registrationCode || currentCadre.registrationNumber || "-";
  const memberStartDate = currentCadre.startDate ? currentCadre.startDate : "-";

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-zinc-900 dark:text-zinc-100 font-sans pb-10">
      
      {/* 1. HERO PROFILE HEADER */}
      <div className="relative overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-none">
        {/* Decorative Top Banner Strip - Plain Solid Blue */}
        <div className="h-20 sm:h-24 w-full bg-blue-600 dark:bg-blue-700 relative overflow-hidden" />

        {/* Profile Info Bar */}
        <div className="px-4 sm:px-6 pb-5 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            
            {/* Avatar & Main Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3.5 sm:gap-4 text-center sm:text-left">
              {/* Avatar with Camera Trigger */}
              <div className="relative group flex-shrink-0 -mt-12 sm:-mt-14 z-10">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      fileInputRef.current?.click();
                    }
                  }}
                  title="Klik untuk mengubah foto profil"
                  className="w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-white dark:border-zinc-900 shadow-md overflow-hidden cursor-pointer relative select-none transition-transform hover:scale-102"
                >
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar}
                      alt={currentCadre.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{currentCadre.name.split(" ").slice(0, 2).map(n => n[0]).join("") || "KD"}</span>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px] font-medium mt-0.5">Ubah</span>
                  </div>

                  {/* Loading Spinner */}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Camera badge in corner */}
                <div className="absolute bottom-0 right-0 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full border-2 border-white dark:border-zinc-900 shadow-xs pointer-events-none">
                  <Camera className="w-3.5 h-3.5" />
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />
              </div>

              {/* Name & Basic Info */}
              <div className="space-y-1 pt-1 sm:pt-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {currentCadre.name}
                  </h1>
                  {avatar && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isUploadingPhoto}
                      className="text-[11px] text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors font-medium cursor-pointer inline-flex items-center gap-1"
                      title="Hapus foto profil"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {currentCadre.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      {currentCadre.email}
                    </span>
                  )}
                  <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-zinc-400" />
                    {currentCadre.commissariat}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Status Badge */}
            <div className="flex items-center justify-center sm:justify-end shrink-0">
              <Badge className={`h-7 px-3 text-[11px] font-semibold rounded-full shadow-none ${
                currentCadre.isGraduated
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  : hasMapabaRegistration
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                  : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20"
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                {currentCadre.isGraduated 
                  ? "Kader Resmi" 
                  : hasMapabaRegistration 
                  ? "Peserta MAPABA" 
                  : "Calon Kader"}
              </Badge>
            </div>

          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT GRID (12 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: DIGITAL ID CARD & MEMBERSHIP INFO (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* DIGITAL ID CARD */}
          {currentCadre.isGraduated ? (
            /* KTA DIGITAL */
            <div className="space-y-3">
              <div 
                id="digital-kta-card"
                className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-[#0c101a] to-zinc-950 border border-amber-500/25 dark:border-amber-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 text-white shadow-sm flex flex-col justify-between"
              >
                {/* Watermark */}
                <div className="absolute right-4 bottom-3 text-[100px] font-black text-white/[0.02] tracking-tighter select-none pointer-events-none leading-none z-0">
                  {currentCadre.level || "KTA"}
                </div>

                <div className="space-y-4 relative z-10">
                  {/* Card Top */}
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-zinc-950 font-black text-sm tracking-tight shrink-0 shadow-xs">
                        KGP
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                          PMII {currentCadre.commissariat}
                        </h4>
                        <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                          PK KI AGENG GETAS PENDAWA
                        </p>
                      </div>
                    </div>
                    <span className="border border-amber-500/40 bg-amber-500/15 text-amber-400 font-bold text-[10px] px-2.5 py-1 rounded-md tracking-wider uppercase">
                      KADER
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
                    {/* QR Code Container */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-32 h-32 bg-white rounded-xl p-2.5 flex items-center justify-center shadow-md">
                        {qrCodeDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={qrCodeDataUrl}
                            alt="QR NTA"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <p className="text-amber-400 font-mono font-bold text-xs sm:text-sm tracking-wider text-center mt-2">
                        {memberNTA}
                      </p>
                      <p className="text-zinc-500 text-[9px] font-semibold uppercase tracking-wider text-center">
                        QR DIGITAL NTA
                      </p>
                    </div>

                    {/* Member Details */}
                    <div className="flex-1 min-w-0 space-y-2.5 pt-0.5">
                      <div>
                        <span className="text-zinc-500 text-[10px] uppercase font-semibold block">
                          Nama Anggota
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-white truncate">
                          {currentCadre.name.startsWith("Sahabat") ? currentCadre.name : `Sahabat ${currentCadre.name}`}
                        </h3>
                      </div>

                      <div>
                        <span className="text-zinc-500 text-[10px] uppercase font-semibold block">
                          Komisariat
                        </span>
                        <p className="text-xs text-zinc-200 truncate">
                          {currentCadre.commissariat}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.06]">
                        <div>
                          <span className="text-zinc-500 text-[10px] uppercase font-semibold block">
                            Jenjang
                          </span>
                          <p className="text-xs font-bold text-amber-400">
                            {currentCadre.level}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500 text-[10px] uppercase font-semibold block">
                            Tanggal
                          </span>
                          <p className="text-xs font-mono text-zinc-300">
                            {memberStartDate !== "-" ? memberStartDate : new Date().toISOString().slice(0, 10)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Notice */}
                  <div className="border-t border-white/[0.08] pt-2.5">
                    <p className="text-zinc-500 text-[9px] uppercase tracking-widest text-center">
                      DILANTIK: {memberStartDate !== "-" ? memberStartDate : "2026-05-22"} &nbsp;|&nbsp; ANGGOTA RESMI PMII
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant="outline"
                size="sm"
                disabled={isDownloading}
                onClick={() => handleDownloadCard("kta")}
                className="w-full h-9 text-xs font-semibold border border-amber-500/30 hover:border-amber-500/60 text-zinc-100 hover:text-white bg-zinc-900/90 hover:bg-amber-500/10 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                {isDownloading ? (
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Download KTA Digital (PNG)</span>
              </Button>
            </div>
          ) : hasMapabaRegistration ? (
            /* KARTU PESERTA MAPABA */
            <div className="space-y-3">
              <div 
                id="kartu-peserta-card"
                className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-[#0c101a] to-zinc-950 border border-blue-500/25 dark:border-blue-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 text-white shadow-sm flex flex-col justify-between"
              >
                {/* Watermark */}
                <div className="absolute right-4 bottom-3 text-[100px] font-black text-white/[0.02] tracking-tighter select-none pointer-events-none leading-none z-0">
                  MAPABA
                </div>

                <div className="space-y-4 relative z-10">
                  {/* Card Top */}
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm tracking-tight shrink-0 shadow-xs">
                        KGP
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                          PMII Ki Ageng Getas Pendawa
                        </h4>
                        <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                          KARTU PESERTA RESMI
                        </p>
                      </div>
                    </div>
                    <span className="border border-blue-500/40 bg-blue-500/15 text-blue-400 font-bold text-[10px] px-2.5 py-1 rounded-md tracking-wider uppercase">
                      PESERTA
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
                    {/* QR Code Container */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-32 h-32 bg-white rounded-xl p-2.5 flex items-center justify-center shadow-md">
                        {qrCodeDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={qrCodeDataUrl}
                            alt="QR Registrasi"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <p className="text-blue-400 font-mono font-bold text-xs sm:text-sm tracking-wider text-center mt-2">
                        {memberRegNumber}
                      </p>
                      <p className="text-zinc-500 text-[9px] font-semibold uppercase tracking-wider text-center">
                        ABSENSI QR
                      </p>
                    </div>

                    {/* Participant Details */}
                    <div className="flex-1 min-w-0 space-y-2.5 pt-0.5">
                      <div>
                        <span className="text-zinc-500 text-[10px] uppercase font-semibold block">
                          Nama Peserta
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-white truncate">
                          {currentCadre.name.replace(/^Sahabat\s*/i, "")}
                        </h3>
                      </div>

                      <div>
                        <span className="text-zinc-500 text-[10px] uppercase font-semibold block">
                          Kegiatan
                        </span>
                        <p className="text-xs text-zinc-200 truncate">
                          Masa Penerimaan Anggota Baru (MAPABA)
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.06]">
                        <div>
                          <span className="text-zinc-500 text-[10px] uppercase font-semibold block">
                            Jenjang
                          </span>
                          <p className="text-xs font-bold text-blue-400">
                            MAPABA
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500 text-[10px] uppercase font-semibold block">
                            Tanggal
                          </span>
                          <p className="text-xs font-mono text-zinc-300">
                            {memberStartDate !== "-" ? memberStartDate : new Date().toISOString().slice(0, 10)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Notice */}
                  <div className="border-t border-white/[0.08] pt-2.5">
                    <p className="text-zinc-500 text-[9px] uppercase tracking-widest text-center">
                      BAWA KARTU INI UNTUK BUKTI ABSENSI ACARA
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant="outline"
                size="sm"
                disabled={isDownloading}
                onClick={() => handleDownloadCard("peserta")}
                className="w-full h-9 text-xs font-semibold border border-blue-500/30 hover:border-blue-500/60 text-zinc-100 hover:text-white bg-zinc-900/90 hover:bg-blue-500/10 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                {isDownloading ? (
                  <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>Download Kartu Peserta (PNG)</span>
              </Button>
            </div>
          ) : (
            <Card className="bg-zinc-50 dark:bg-zinc-900/60 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Kartu Digital Belum Diterbitkan</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Kartu Peserta atau KTA Digital akan otomatis aktif setelah Anda terdaftar di MAPABA atau dilantik sebagai anggota resmi.
                </p>
              </div>
              <Link href="/kader/kegiatan">
                <Button variant="outline" size="sm" className="text-xs rounded-lg border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  Lihat Agenda Kaderisasi
                </Button>
              </Link>
            </Card>
          )}

          {/* INFORMASI KEANGGOTAAN */}
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-none">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Informasi Keanggotaan
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 rounded-lg">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Jenjang</span>
                </div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{currentCadre.level}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 rounded-lg">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Komisariat</span>
                </div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px] text-right">{currentCadre.commissariat}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                    {currentCadre.isGraduated ? "Pelantikan" : "Terdaftar"}
                  </span>
                </div>
                <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">{memberStartDate}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 rounded-lg">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Status</span>
                </div>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Aktif
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: EDITABLE PROFILE DETAILS (7 Cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* CARD 1: DATA PRIBADI & KONTAK */}
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-none space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Data Pribadi & Kontak
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Nama lengkap, kontak aktif, dan alamat domisili Anda untuk keperluan identitas dan koordinasi organisasi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* NAMA LENGKAP */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      required
                      placeholder="Masukkan nama lengkap"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                    />
                  </div>
                </div>

                {/* WHATSAPP */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Nomor WhatsApp / Telepon <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      required
                      placeholder="08xxxxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Alamat Surel (E-mail) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type="email"
                      required
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                    />
                  </div>
                </div>
              </div>

              {/* INSTAGRAM */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Akun Instagram
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">@</span>
                  <Input
                    placeholder="username"
                    value={instagram.replace(/^@+/, "")}
                    onChange={(e) => setInstagram(e.target.value ? `@${e.target.value.replace(/^@+/, "")}` : "")}
                    className="text-xs pl-8 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                  />
                </div>
              </div>

              {/* ALAMAT DOMISILI */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Alamat Domisili Sekarang <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                  <textarea
                    required
                    placeholder="Masukkan alamat lengkap domisili tempat tinggal..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-blue-600 dark:focus:border-blue-500 outline-hidden transition-all text-zinc-900 dark:text-zinc-100 resize-none"
                  />
                </div>
              </div>
            </Card>

            {/* CARD 2: DATA AKADEMIK & KEMAHASISWAAN */}
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-none space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Data Akademik & Kemahasiswaan
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Data kampus, fakultas, dan jurusan tempat studi sahabat kader.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PERGURUAN TINGGI */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Perguruan Tinggi / Kampus
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      placeholder="Nama Kampus / Universitas"
                      value={perguruanTinggi}
                      onChange={(e) => setPerguruanTinggi(e.target.value)}
                      className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                    />
                  </div>
                </div>

                {/* PROGRAM STUDI / JURUSAN */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Program Studi / Jurusan
                  </label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      placeholder="Contoh: Pendidikan Agama Islam"
                      value={jurusan}
                      onChange={(e) => setJurusan(e.target.value)}
                      className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                    />
                  </div>
                </div>
              </div>

              {/* ANGKATAN KULIAH */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Tahun Angkatan Kuliah
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    placeholder="Contoh: 2024"
                    value={angkatan}
                    onChange={(e) => setAngkatan(e.target.value)}
                    className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                  />
                </div>
              </div>
            </Card>

            {/* SUBMIT ACTION BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-none">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 text-center sm:text-left">
                Pastikan data yang dimasukkan sudah sesuai dan mutakhir.
              </span>
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 rounded-lg border-none cursor-pointer flex items-center justify-center gap-1.5 px-6 shrink-0 transition-colors"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Simpan Perubahan</span>
              </Button>
            </div>

          </form>
        </div>

      </div>

      {/* SUCCESS DIALOG */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg max-w-sm text-foreground w-full p-6">
          <DialogHeader className="flex flex-col items-center justify-center text-center space-y-1.5 pb-2">
            <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500 mb-1">
              <CheckCircle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Profil Berhasil Disimpan
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
              Perubahan data kontak dan akademik Anda telah tersimpan dan disinkronkan ke pangkalan data.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="justify-center sm:justify-center pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsSuccessOpen(false)}
              className="text-xs border-zinc-200 dark:border-zinc-800 h-8 px-5 rounded-lg cursor-pointer"
            >
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
