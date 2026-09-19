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
  Trash2,
  Briefcase,
  Compass,
  Upload,
  Trash,
  Heart,
  ChevronLeft,
  ChevronRight,
  Pencil
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import NikInput from "@/app/dashboard/anggota/_components/NikInput";

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

  const [activeTab, setActiveTab] = useState<"diri" | "akademik" | "riwayat" | "karakter">("diri");

  // Step 1: Data Diri & Medis
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [nik, setNik] = useState("");
  const [ktpName, setKtpName] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [alamatRumah, setAlamatRumah] = useState("");
  const [address, setAddress] = useState("");
  const [golonganDarah, setGolonganDarah] = useState("O");
  const [riwayatPenyakit, setRiwayatPenyakit] = useState("");

  // Step 2: Akademik & Kontak
  const [perguruanTinggi, setPerguruanTinggi] = useState("");
  const [fakultas, setFakultas] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [ktmName, setKtmName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");

  // Step 3: Pendidikan & Organisasi
  const [pendidikanSD, setPendidikanSD] = useState("");
  const [pendidikanSMP, setPendidikanSMP] = useState("");
  const [pendidikanSMA, setPendidikanSMA] = useState("");
  const [organisasiSD, setOrganisasiSD] = useState("");
  const [organisasiSMP, setOrganisasiSMP] = useState("");
  const [organisasiSMA, setOrganisasiSMA] = useState("");
  const [organisasiPT, setOrganisasiPT] = useState("");

  // Step 4: Karakter & Minat
  const [orientasiProfetik, setOrientasiProfetik] = useState("");
  const [minatPassion, setMinatPassion] = useState("");
  const [motivasiMapaba, setMotivasiMapaba] = useState("");
  const [angkatan, setAngkatan] = useState("");
  const [jabatan, setJabatan] = useState("Anggota");
  const [isEditing, setIsEditing] = useState(false);
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
        setGender((mine.gender as any) || "Laki-laki");
        setNik(mine.nik || "");
        setKtpName(mine.ktpName || "");
        setTempatLahir(mine.tempatLahir || "");
        setTanggalLahir(mine.tanggalLahir || "");
        setAlamatRumah(mine.alamatRumah || "");
        setAddress(mine.alamatDomisili || mine.address || "");
        setGolonganDarah(mine.golonganDarah || "O");
        setRiwayatPenyakit(mine.riwayatPenyakit || "");

        setPerguruanTinggi(mine.perguruanTinggi || mine.commissariat || "");
        setFakultas(mine.fakultas || "");
        setJurusan(mine.jurusan || "");
        setKtmName(mine.ktmName || "");
        setPhone(mine.phone || "");
        setEmail(mine.email || "");
        setInstagram(mine.instagram || "");
        setTwitter(mine.twitter || "");
        setFacebook(mine.facebook || "");

        setPendidikanSD(mine.pendidikanSD || "");
        setPendidikanSMP(mine.pendidikanSMP || "");
        setPendidikanSMA(mine.pendidikanSMA || "");
        setOrganisasiSD(mine.organisasiSD || "");
        setOrganisasiSMP(mine.organisasiSMP || "");
        setOrganisasiSMA(mine.organisasiSMA || "");
        setOrganisasiPT(mine.organisasiPT || "");

        // Auto-fill Tahun Angkatan PMII if already an anggota (isGraduated)
        const graduationYear = mine.startDate
          ? (mine.startDate.includes("-") ? mine.startDate.split("-")[0] : new Date(mine.startDate).getFullYear().toString())
          : new Date().getFullYear().toString();

        if (mine.isGraduated) {
          const autoAngkatan = mine.angkatan || graduationYear;
          setAngkatan(autoAngkatan);
          if (!mine.angkatan) {
            mine.angkatan = autoAngkatan;
            db.saveCadres(allCadres);
          }
        } else {
          // If still a peserta (not graduated), angkatan is not filled
          setAngkatan("");
        }

        setJabatan(mine.jabatan || "Anggota");

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
        gender,
        nik: nik.trim(),
        ktpName,
        tempatLahir: tempatLahir.trim(),
        tanggalLahir,
        alamatRumah: alamatRumah.trim(),
        address: address.trim(),
        alamatDomisili: address.trim(),
        golonganDarah,
        riwayatPenyakit: riwayatPenyakit.trim(),
        perguruanTinggi: perguruanTinggi.trim(),
        fakultas: fakultas.trim(),
        jurusan: jurusan.trim(),
        ktmName,
        phone: phone.trim(),
        email: email.trim(),
        instagram: instagram.trim(),
        twitter: twitter.trim(),
        facebook: facebook.trim(),
        pendidikanSD: pendidikanSD.trim(),
        pendidikanSMP: pendidikanSMP.trim(),
        pendidikanSMA: pendidikanSMA.trim(),
        organisasiSD: organisasiSD.trim(),
        organisasiSMP: organisasiSMP.trim(),
        organisasiSMA: organisasiSMA.trim(),
        organisasiPT: organisasiPT.trim(),
        orientasiProfetik: orientasiProfetik.trim(),
        minatPassion: minatPassion.trim(),
        motivasiMapaba: motivasiMapaba.trim(),
        angkatan: currentCadre.isGraduated 
          ? (angkatan.trim() || currentCadre.startDate?.split("-")[0] || new Date().getFullYear().toString())
          : "",
        jabatan: jabatan.trim()
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
            loggedInUser.angkatan = currentCadre.isGraduated 
              ? (angkatan.trim() || currentCadre.startDate?.split("-")[0] || new Date().getFullYear().toString())
              : "";
            loggedInUser.gender = gender;
            loggedInUser.nik = nik.trim();
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
      setIsEditing(false);
      setIsSuccessOpen(true);
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Gagal menyimpan perubahan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!currentCadre) return;
    setName(currentCadre.name || "");
    setAvatar(currentCadre.avatar || "");
    setGender((currentCadre.gender as any) || "Laki-laki");
    setNik(currentCadre.nik || "");
    setKtpName(currentCadre.ktpName || "");
    setTempatLahir(currentCadre.tempatLahir || "");
    setTanggalLahir(currentCadre.tanggalLahir || "");
    setAlamatRumah(currentCadre.alamatRumah || "");
    setAddress(currentCadre.alamatDomisili || currentCadre.address || "");
    setGolonganDarah(currentCadre.golonganDarah || "O");
    setRiwayatPenyakit(currentCadre.riwayatPenyakit || "");

    setPerguruanTinggi(currentCadre.perguruanTinggi || currentCadre.commissariat || "");
    setFakultas(currentCadre.fakultas || "");
    setJurusan(currentCadre.jurusan || "");
    setKtmName(currentCadre.ktmName || "");
    setPhone(currentCadre.phone || "");
    setEmail(currentCadre.email || "");
    setInstagram(currentCadre.instagram || "");
    setTwitter(currentCadre.twitter || "");
    setFacebook(currentCadre.facebook || "");

    setPendidikanSD(currentCadre.pendidikanSD || "");
    setPendidikanSMP(currentCadre.pendidikanSMP || "");
    setPendidikanSMA(currentCadre.pendidikanSMA || "");
    setOrganisasiSD(currentCadre.organisasiSD || "");
    setOrganisasiSMP(currentCadre.organisasiSMP || "");
    setOrganisasiSMA(currentCadre.organisasiSMA || "");
    setOrganisasiPT(currentCadre.organisasiPT || "");

    setOrientasiProfetik(currentCadre.orientasiProfetik || "");
    setMinatPassion(currentCadre.minatPassion || "");
    setMotivasiMapaba(currentCadre.motivasiMapaba || "");
    if (currentCadre.isGraduated) {
      setAngkatan(currentCadre.angkatan || "");
    } else {
      setAngkatan("");
    }
    setJabatan(currentCadre.jabatan || "Anggota");
    setIsEditing(false);
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
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-white dark:border-zinc-900 shadow-md overflow-hidden cursor-pointer relative select-none transition-transform hover:scale-102"
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

                {/* Camera button in bottom-right corner */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Ubah foto profil"
                  className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full border-2 border-white dark:border-zinc-900 shadow-sm cursor-pointer transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>

                {/* Trash button in bottom-left corner (if avatar exists) */}
                {avatar && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto();
                    }}
                    disabled={isUploadingPhoto}
                    title="Hapus foto profil"
                    className="absolute bottom-0 left-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-950/40 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />
              </div>

              {/* Name, Status Badge & Basic Info */}
              <div className="space-y-1.5 sm:space-y-1 pt-1 sm:pt-0">
                <div className="flex flex-col sm:flex-row items-center sm:items-baseline justify-center sm:justify-start gap-1.5 sm:gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {currentCadre.name}
                  </h1>

                  {/* Status Badge on Mobile (under name) */}
                  <div className="sm:hidden">
                    <Badge className={`h-6 px-2.5 text-[11px] font-semibold rounded-full shadow-none ${
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
                
                {/* Email & Commissariat info chips */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  {currentCadre.email && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-0 sm:py-0 bg-zinc-100 dark:bg-zinc-800/80 sm:bg-transparent rounded-full sm:rounded-none">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate max-w-[210px] sm:max-w-none">{currentCadre.email}</span>
                    </span>
                  )}
                  <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-0 sm:py-0 bg-zinc-100 dark:bg-zinc-800/80 sm:bg-transparent rounded-full sm:rounded-none">
                    <Building className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{currentCadre.commissariat}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Status Badge (Desktop Only) */}
            <div className="hidden sm:flex items-center justify-end shrink-0">
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
                className="relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-zinc-950 dark:via-[#0c101a] dark:to-zinc-950 border border-amber-200 dark:border-amber-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 text-zinc-900 dark:text-white shadow-sm flex flex-col justify-between"
              >
                {/* Watermark */}
                <div className="absolute right-4 bottom-3 text-[100px] font-black text-amber-900/[0.04] dark:text-white/[0.02] tracking-tighter select-none pointer-events-none leading-none z-0">
                  {currentCadre.level || "KTA"}
                </div>

                <div className="space-y-4 relative z-10">
                  {/* Card Top */}
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/[0.08] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 border border-zinc-200/80 dark:border-white/10 shadow-xs p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/image/logo_komsat.png"
                          alt="Logo Komisariat"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                          PMII {currentCadre.commissariat}
                        </h4>
                        <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          PK KI AGENG GETAS PENDAWA
                        </p>
                      </div>
                    </div>
                    <span className="border border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-[10px] px-2.5 py-1 rounded-md tracking-wider uppercase">
                      KADER
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
                    {/* QR Code Container */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-32 h-32 bg-white dark:bg-white border border-zinc-200 dark:border-transparent rounded-xl p-2.5 flex items-center justify-center shadow-xs">
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
                      <p className="text-amber-600 dark:text-amber-400 font-mono font-bold text-xs sm:text-sm tracking-wider text-center mt-2">
                        {memberNTA}
                      </p>
                      <p className="text-zinc-400 dark:text-zinc-500 text-[9px] font-semibold uppercase tracking-wider text-center">
                        QR DIGITAL NTA
                      </p>
                    </div>

                    {/* Member Details */}
                    <div className="flex-1 min-w-0 space-y-2.5 pt-0.5">
                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-semibold block">
                          Nama Anggota
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
                          {currentCadre.name.startsWith("Sahabat") ? currentCadre.name : `Sahabat ${currentCadre.name}`}
                        </h3>
                      </div>

                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-semibold block">
                          Komisariat
                        </span>
                        <p className="text-xs text-zinc-600 dark:text-zinc-200 truncate">
                          {currentCadre.commissariat}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100 dark:border-white/[0.06]">
                        <div>
                          <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-semibold block">
                            Jenjang
                          </span>
                          <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            {currentCadre.level}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-semibold block">
                            Tanggal
                          </span>
                          <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                            {memberStartDate !== "-" ? memberStartDate : new Date().toISOString().slice(0, 10)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Notice */}
                  <div className="border-t border-zinc-100 dark:border-white/[0.08] pt-2.5">
                    <p className="text-zinc-400 dark:text-zinc-500 text-[9px] uppercase tracking-widest text-center">
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
                className="w-full h-9 text-xs font-semibold border border-amber-200 dark:border-amber-500/30 hover:border-amber-300 dark:hover:border-amber-500/60 text-amber-700 dark:text-zinc-100 hover:text-amber-800 dark:hover:text-white bg-amber-50/60 dark:bg-zinc-900/90 hover:bg-amber-100/70 dark:hover:bg-amber-500/10 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                {isDownloading ? (
                  <div className="w-3.5 h-3.5 border-2 border-amber-600 dark:border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                )}
                <span>Download KTA Digital (PNG)</span>
              </Button>
            </div>
          ) : hasMapabaRegistration ? (
            /* KARTU PESERTA MAPABA */
            <div className="space-y-3">
              <div 
                id="kartu-peserta-card"
                className="relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-zinc-950 dark:via-[#0c101a] dark:to-zinc-950 border border-blue-200 dark:border-blue-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 text-zinc-900 dark:text-white shadow-sm flex flex-col justify-between"
              >
                {/* Watermark */}
                <div className="absolute right-4 bottom-3 text-[100px] font-black text-blue-900/[0.04] dark:text-white/[0.02] tracking-tighter select-none pointer-events-none leading-none z-0">
                  MAPABA
                </div>

                <div className="space-y-4 relative z-10">
                  {/* Card Top */}
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/[0.08] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 border border-zinc-200/80 dark:border-white/10 shadow-xs p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/image/logo_komsat.png"
                          alt="Logo Komisariat"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                          PMII Ki Ageng Getas Pendawa
                        </h4>
                        <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          KARTU PESERTA RESMI
                        </p>
                      </div>
                    </div>
                    <span className="border border-blue-200 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-[10px] px-2.5 py-1 rounded-md tracking-wider uppercase">
                      PESERTA
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
                    {/* QR Code Container */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-32 h-32 bg-white dark:bg-white border border-zinc-200 dark:border-transparent rounded-xl p-2.5 flex items-center justify-center shadow-xs">
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
                      <p className="text-blue-600 dark:text-blue-400 font-mono font-bold text-xs sm:text-sm tracking-wider text-center mt-2">
                        {memberRegNumber}
                      </p>
                      <p className="text-zinc-400 dark:text-zinc-500 text-[9px] font-semibold uppercase tracking-wider text-center">
                        ABSENSI QR
                      </p>
                    </div>

                    {/* Participant Details */}
                    <div className="flex-1 min-w-0 space-y-2.5 pt-0.5">
                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-semibold block">
                          Nama Peserta
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
                          {currentCadre.name.replace(/^Sahabat\s*/i, "")}
                        </h3>
                      </div>

                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-semibold block">
                          Kegiatan
                        </span>
                        <p className="text-xs text-zinc-600 dark:text-zinc-200 truncate">
                          Masa Penerimaan Anggota Baru (MAPABA)
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100 dark:border-white/[0.06]">
                        <div>
                          <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-semibold block">
                            Jenjang
                          </span>
                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            MAPABA
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-semibold block">
                            Tanggal
                          </span>
                          <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                            {memberStartDate !== "-" ? memberStartDate : new Date().toISOString().slice(0, 10)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Notice */}
                  <div className="border-t border-zinc-100 dark:border-white/[0.08] pt-2.5">
                    <p className="text-zinc-400 dark:text-zinc-500 text-[9px] uppercase tracking-widest text-center">
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
                className="w-full h-9 text-xs font-semibold border border-blue-200 dark:border-blue-500/30 hover:border-blue-300 dark:hover:border-blue-500/60 text-blue-700 dark:text-zinc-100 hover:text-blue-800 dark:hover:text-white bg-blue-50/60 dark:bg-zinc-900/90 hover:bg-blue-100/70 dark:hover:bg-blue-500/10 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                {isDownloading ? (
                  <div className="w-3.5 h-3.5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
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


        </div>

        {/* RIGHT COLUMN: EDITABLE PROFILE DETAILS (7 Cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-none">
              {/* Clean Underline Tabs Header with Edit Button */}
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
                <div className="flex gap-4 text-xs font-medium overflow-x-auto no-scrollbar">
                  {[
                    { id: "diri", label: "1. Data Diri & Medis", icon: User },
                    { id: "akademik", label: "2. Akademik & Kontak", icon: GraduationCap },
                    { id: "riwayat", label: "3. Riwayat Pendidikan", icon: Briefcase },
                    { id: "karakter", label: "4. Karakter & Minat", icon: Compass }
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-3 cursor-pointer border-b-2 -mb-px transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                          isActive
                            ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                            : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Edit Button / Mode Badge in Header */}
                <div className="shrink-0 py-2 pl-2">
                  {!isEditing ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-7.5 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit Data</span>
                      <span className="sm:hidden">Edit</span>
                    </Button>
                  ) : (
                    <Badge variant="outline" className="h-6 text-[10px] font-semibold text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/5">
                      Mode Edit
                    </Badge>
                  )}
                </div>
              </div>

              {/* Form Content Body */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* TAB 1: DATA DIRI & MEDIS */}
                {activeTab === "diri" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Nama Lengkap <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          required
                          disabled={!isEditing}
                          placeholder="Masukkan nama lengkap"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Jenis Kelamin
                        </label>
                        <Select disabled={!isEditing} value={gender} onValueChange={(val) => { if (val) setGender(val as any); }}>
                          <SelectTrigger className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default">
                            <SelectValue placeholder="Pilih Jenis Kelamin" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                            <SelectItem value="Laki-laki">Laki-laki (Sahabat)</SelectItem>
                            <SelectItem value="Perempuan">Perempuan (Sahabati)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* NIK Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        Nomor Induk Kependudukan (NIK 16 Digit)
                      </label>
                      <NikInput value={nik} onChange={setNik} disabled={!isEditing} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Tempat Lahir
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="Kota / Kabupaten kelahiran"
                          value={tempatLahir}
                          onChange={(e) => setTempatLahir(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Tanggal Lahir
                        </label>
                        <Input
                          type="date"
                          disabled={!isEditing}
                          value={tanggalLahir}
                          onChange={(e) => setTanggalLahir(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Alamat Asal Sesuai KTP
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="Alamat lengkap asal KTP"
                          value={alamatRumah}
                          onChange={(e) => setAlamatRumah(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Alamat Domisili Sekarang <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          required
                          disabled={!isEditing}
                          placeholder="Alamat domisili / tempat tinggal saat ini"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Golongan Darah
                        </label>
                        <Select disabled={!isEditing} value={golonganDarah} onValueChange={(val) => { if (val) setGolonganDarah(val); }}>
                          <SelectTrigger className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default">
                            <SelectValue placeholder="Golongan Darah" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                            <SelectItem value="A">Golongan A</SelectItem>
                            <SelectItem value="B">Golongan B</SelectItem>
                            <SelectItem value="AB">Golongan AB</SelectItem>
                            <SelectItem value="O">Golongan O</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Riwayat Penyakit (Opsional)
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="Misal: Asma, Alergi (jika ada)"
                          value={riwayatPenyakit}
                          onChange={(e) => setRiwayatPenyakit(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>
                    </div>

                    {/* Lampiran KTP */}
                    <div className="space-y-1 pt-1">
                      <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        Lampiran Berkas KTP
                      </label>
                      {ktpName ? (
                        <div className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs">
                          <span className="truncate max-w-[240px] text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
                            {ktpName}
                          </span>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => setKtpName("")}
                              className="text-zinc-400 hover:text-rose-500 p-0.5 cursor-pointer"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : isEditing ? (
                        <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 rounded-lg cursor-pointer bg-zinc-50/50 dark:bg-zinc-950/50 text-xs text-zinc-500">
                          <Upload className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-[11px]">Pilih File KTP (Gambar/PDF)</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setKtpName(e.target.files[0].name);
                            }}
                          />
                        </label>
                      ) : (
                        <div className="p-2 text-xs text-zinc-400 dark:text-zinc-500 italic bg-zinc-50/60 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg">
                          Belum ada lampiran berkas KTP
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: AKADEMIK & KONTAK */}
                {activeTab === "akademik" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Perguruan Tinggi
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="Nama Kampus / Universitas"
                          value={perguruanTinggi}
                          onChange={(e) => setPerguruanTinggi(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Fakultas
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="Misal: FST, Tarbiyah"
                          value={fakultas}
                          onChange={(e) => setFakultas(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Jurusan / Prodi
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="Misal: Teknologi Informasi"
                          value={jurusan}
                          onChange={(e) => setJurusan(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Nomor WhatsApp / HP <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          required
                          disabled={!isEditing}
                          placeholder="08xxxxxxxxxx"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Alamat Surel (E-mail) <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="email"
                          required
                          disabled={!isEditing}
                          placeholder="nama@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Instagram
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="@username"
                          value={instagram.replace(/^@+/, "")}
                          onChange={(e) => setInstagram(e.target.value ? `@${e.target.value.replace(/^@+/, "")}` : "")}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          X (Twitter)
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="@username"
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Facebook
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="Nama Akun"
                          value={facebook}
                          onChange={(e) => setFacebook(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>
                    </div>

                    {/* Lampiran KTM */}
                    <div className="space-y-1 pt-1">
                      <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        Unggah Kartu Tanda Mahasiswa (KTM)
                      </label>
                      {ktmName ? (
                        <div className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs">
                          <span className="truncate max-w-[240px] text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
                            {ktmName}
                          </span>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => setKtmName("")}
                              className="text-zinc-400 hover:text-rose-500 p-0.5 cursor-pointer"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : isEditing ? (
                        <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 rounded-lg cursor-pointer bg-zinc-50/50 dark:bg-zinc-950/50 text-xs text-zinc-500">
                          <Upload className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-[11px]">Pilih File KTM (Gambar/PDF)</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setKtmName(e.target.files[0].name);
                            }}
                          />
                        </label>
                      ) : (
                        <div className="p-2 text-xs text-zinc-400 dark:text-zinc-500 italic bg-zinc-50/60 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg">
                          Belum ada lampiran berkas KTM
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: RIWAYAT PENDIDIKAN & ORGANISASI */}
                {activeTab === "riwayat" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Sekolah Dasar (SD/MI)
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="Nama SD / MI"
                          value={pendidikanSD}
                          onChange={(e) => setPendidikanSD(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          SMP / MTs
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="Nama SMP / MTs"
                          value={pendidikanSMP}
                          onChange={(e) => setPendidikanSMP(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          SMA / SMK / MA
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="Nama SMA / SMK / MA"
                          value={pendidikanSMA}
                          onChange={(e) => setPendidikanSMA(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Organisasi Tingkat SMP / MTs
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="Misal: OSIS, Pramuka"
                          value={organisasiSMP}
                          onChange={(e) => setOrganisasiSMP(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Organisasi Tingkat SMA / SMK / MA
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="Misal: IPNU/IPPNU, OSIS"
                          value={organisasiSMA}
                          onChange={(e) => setOrganisasiSMA(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Organisasi di Kampus / Luar PMII (Lainnya)
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="Misal: BEM, Himpunan Mahasiswa Jurusan, UKM"
                          value={organisasiPT}
                          onChange={(e) => setOrganisasiPT(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: KARAKTER & MINAT */}
                {activeTab === "karakter" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Tahun Angkatan PMII
                        </label>
                        <Input
                          placeholder="Contoh: 2026"
                          value={currentCadre.isGraduated ? angkatan : ""}
                          disabled={!isEditing || !currentCadre.isGraduated}
                          onChange={(e) => {
                            if (currentCadre.isGraduated) {
                              setAngkatan(e.target.value);
                            }
                          }}
                          className={`h-8.5 text-xs rounded-lg ${
                            !currentCadre.isGraduated
                              ? "bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                              : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Jabatan Kepengurusan
                        </label>
                        <Input
                          disabled
                          placeholder="Misal: Anggota, Pengurus Rayon/Komisariat"
                          value={jabatan}
                          className="h-8.5 text-xs bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Orientasi Profetik / Jalur Pengembangan
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="Misal: Intelektual, Akademik, Advokasi, Keagamaan"
                          value={orientasiProfetik}
                          onChange={(e) => setOrientasiProfetik(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Minat & Passion
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="Misal: Kepenulisan, Desain Grafis, Riset, Wirausaha"
                          value={minatPassion}
                          onChange={(e) => setMinatPassion(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Motivasi Bergabung PMII
                        </label>
                        <Input
                          disabled={!isEditing}
                          placeholder="Alasan & cita-cita berkhidmat di PMII"
                          value={motivasiMapaba}
                          onChange={(e) => setMotivasiMapaba(e.target.value)}
                          className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 disabled:opacity-100 disabled:text-zinc-800 dark:disabled:text-zinc-200 disabled:bg-zinc-50/70 dark:disabled:bg-zinc-950/70 disabled:border-zinc-200/80 dark:disabled:border-zinc-800/80 disabled:cursor-default"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tab Navigation Footer */}
              <div className="p-3.5 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-zinc-50/50 dark:bg-zinc-950/50">
                <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={activeTab === "diri"}
                    onClick={() => {
                      if (activeTab === "akademik") setActiveTab("diri");
                      if (activeTab === "riwayat") setActiveTab("akademik");
                      if (activeTab === "karakter") setActiveTab("riwayat");
                    }}
                    className="text-xs h-8.5 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={activeTab === "karakter"}
                    onClick={() => {
                      if (activeTab === "diri") setActiveTab("akademik");
                      if (activeTab === "akademik") setActiveTab("riwayat");
                      if (activeTab === "riwayat") setActiveTab("karakter");
                    }}
                    className="text-xs h-8.5 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Selanjutnya</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="flex-1 sm:flex-initial text-xs h-8.5 px-3.5 rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8.5 rounded-lg border-none cursor-pointer flex items-center justify-center gap-1.5 px-5 shrink-0 transition-colors"
                    >
                      {isSaving ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Simpan Perubahan</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8.5 rounded-lg border-none cursor-pointer flex items-center justify-center gap-1.5 px-5 shrink-0 transition-colors shadow-xs"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Data Profil</span>
                  </Button>
                )}
              </div>
            </Card>
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
