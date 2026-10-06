"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import QRCode from "qrcode";
import { db, type CadreFollowUp } from "@/lib/db";
import { exportCardAsImage } from "@/lib/cardExporter";
import { supabase, isSupabaseConfigured, deleteStorageFile } from "@/lib/supabase";
import {
  User,
  GraduationCap,
  Briefcase,
  Compass,
  Lock,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { ProfileHeader } from "./_components/ProfileHeader";
import { DigitalKtaCard } from "./_components/DigitalKtaCard";
import { BiodataTab } from "./_components/BiodataTab";
import { AcademicTab } from "./_components/AcademicTab";
import { HistoryTab } from "./_components/HistoryTab";
import { CharacterTab } from "./_components/CharacterTab";
import { SecurityTab } from "./_components/SecurityTab";
import { SuccessDialog } from "./_components/SuccessDialog";

export default function ProfilPage() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [cadres, setCadres] = useState<CadreFollowUp[]>([]);
  const [currentCadre, setCurrentCadre] = useState<CadreFollowUp | null>(null);

  const match = pathname ? pathname.match(/^\/(peserta|anggota|kader)/) : null;
  const rolePrefix = match
    ? `/${match[1]}`
    : currentCadre?.role
    ? `/${currentCadre.role.toLowerCase()}`
    : "/peserta";

  // Profile photo states
  const [avatar, setAvatar] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formCardRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<"diri" | "akademik" | "riwayat" | "karakter" | "keamanan">("diri");

  const changeTab = (newTab: "diri" | "akademik" | "riwayat" | "karakter" | "keamanan") => {
    setActiveTab(newTab);
    if (formCardRef.current && typeof window !== "undefined" && window.innerWidth < 1024) {
      formCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Step 1: Data Diri & Medis
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [nik, setNik] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [alamatRumah, setAlamatRumah] = useState("");
  const [address, setAddress] = useState("");
  const [golonganDarah, setGolonganDarah] = useState("O");
  const [riwayatPenyakit, setRiwayatPenyakit] = useState("");
  const [ktpName, setKtpName] = useState("");
  const [ktpFileUrl, setKtpFileUrl] = useState<string | undefined>(undefined);

  // Step 2: Akademik & Kontak
  const [perguruanTinggi, setPerguruanTinggi] = useState("");
  const [fakultas, setFakultas] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");
  const [ktmName, setKtmName] = useState("");
  const [ktmFileUrl, setKtmFileUrl] = useState<string | undefined>(undefined);

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

  // Step 5: Keamanan & Ganti Sandi
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Mode & dialog states
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [hasMapabaRegistration, setHasMapabaRegistration] = useState(false);
  const [registrationCode, setRegistrationCode] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      const activeId = typeof window !== "undefined" ? localStorage.getItem("PMII_ACTIVE_CADRE_ID") || "" : "";
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
        (activeId ? allCadres.find((c) => c.id === activeId) : null) ||
        (loggedInUser
          ? allCadres.find((c) => c.id === loggedInUser.id || (c.email && c.email.toLowerCase() === loggedInUser.email?.toLowerCase()))
          : null) ||
        allCadres[0] ||
        null;

      // Auto-fallback from loggedInUser to avoid broken profile state
      if (!mine && loggedInUser) {
        const isGraduated =
          loggedInUser.role?.toLowerCase() === "anggota" ||
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
        setTempatLahir(mine.tempatLahir || "");
        setTanggalLahir(mine.tanggalLahir || "");
        setAlamatRumah(mine.alamatRumah || "");
        setAddress(mine.alamatDomisili || mine.address || "");
        setGolonganDarah(mine.golonganDarah || "O");
        setRiwayatPenyakit(mine.riwayatPenyakit || "");
        setKtpName(mine.ktpName || "");
        setKtpFileUrl(mine.ktpFileUrl || undefined);

        setPerguruanTinggi(mine.perguruanTinggi || mine.commissariat || "");
        setFakultas(mine.fakultas || "");
        setJurusan(mine.jurusan || "");
        setPhone(mine.phone || "");
        setEmail(mine.email || "");
        setInstagram(mine.instagram || "");
        setTwitter(mine.twitter || "");
        setFacebook(mine.facebook || "");
        setKtmName(mine.ktmName || "");
        setKtmFileUrl(mine.ktmFileUrl || undefined);

        setPendidikanSD(mine.pendidikanSD || "");
        setPendidikanSMP(mine.pendidikanSMP || "");
        setPendidikanSMA(mine.pendidikanSMA || "");
        setOrganisasiSD(mine.organisasiSD || "");
        setOrganisasiSMP(mine.organisasiSMP || "");
        setOrganisasiSMA(mine.organisasiSMA || "");
        setOrganisasiPT(mine.organisasiPT || "");

        // Auto-fill Tahun Angkatan PMII if already graduated
        const graduationYear = mine.startDate
          ? mine.startDate.includes("-")
            ? mine.startDate.split("-")[0]
            : new Date(mine.startDate).getFullYear().toString()
          : new Date().getFullYear().toString();

        if (mine.isGraduated) {
          const autoAngkatan = mine.angkatan || graduationYear;
          setAngkatan(autoAngkatan);
        } else {
          setAngkatan("");
        }

        setJabatan(mine.jabatan || "Anggota");

        // Check if cadre has careerProfile or fallback to evaluations
        if (!mine.careerProfile) {
          try {
            const allEvals = await db.getEvaluations();
            const myEval = allEvals.find(
              (e) =>
                (mine.id && e.cadreId === mine.id) ||
                (mine.name && e.participantName?.toLowerCase().trim() === mine.name.toLowerCase().trim())
            );
            if (myEval?.careerAssessment) {
              mine.careerProfile = {
                mbtiCode: myEval.careerAssessment.mbtiCode,
                talent: myEval.careerAssessment.talent,
                interest: myEval.careerAssessment.interest,
                formulaResult: myEval.careerAssessment.formulaResult,
                strategicRole: myEval.careerAssessment.strategicRole,
                description: myEval.careerAssessment.description,
                submittedAt: myEval.careerAssessment.submittedAt
              };
            }
          } catch {}
        }

        // Check MAPABA registration
        const matchedReg = allRegs.find(
          (r) =>
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
      width: 400,
      margin: 1,
      color: {
        dark: "#090d16",
        light: "#ffffff"
      }
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error("Local QR Code generation failed:", err));
  }, [currentCadre, registrationCode]);

  // Compress image before saving to keep storage lightweight
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
      toast.error("Ukuran foto terlalu besar. Maksimal 5 MB.");
      return;
    }

    setIsUploadingPhoto(true);
    const toastId = toast.loading("Mengunggah foto profil...");

    try {
      let finalAvatarUrl = "";
      const previousAvatar = avatar || currentCadre?.avatar;

      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const cadreId = currentCadre?.id || "avatar";
        const filePath = `avatars/${cadreId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (uploadError) {
          console.error("Supabase avatar upload error:", uploadError);
          finalAvatarUrl = await compressImage(file);
        } else {
          const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
          finalAvatarUrl = data.publicUrl;

          // Hapus foto profil lama dari Supabase Storage jika ada penggantian berkas
          if (previousAvatar && previousAvatar !== finalAvatarUrl) {
            deleteStorageFile(previousAvatar).catch(() => {});
          }
        }
      } else {
        finalAvatarUrl = await compressImage(file);
      }

      setAvatar(finalAvatarUrl);

      if (currentCadre) {
        const updated: CadreFollowUp = {
          ...currentCadre,
          avatar: finalAvatarUrl,
          pasFotoName: file.name
        };
        setCurrentCadre(updated);

        const updatedList = cadres.map((c) => (c.id === currentCadre.id ? updated : c));
        setCadres(updatedList);
        await db.saveCadres(updatedList);

        if (typeof window !== "undefined") {
          const savedUserStr = localStorage.getItem("PMII_LOGGED_IN_USER");
          if (savedUserStr) {
            try {
              const loggedInUser = JSON.parse(savedUserStr);
              loggedInUser.avatar = finalAvatarUrl;
              localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(loggedInUser));

              const users = await db.getUsers();
              const userIdx = users.findIndex(
                (u) => u.id === loggedInUser.id || (u.email && u.email.toLowerCase() === loggedInUser.email?.toLowerCase())
              );
              if (userIdx !== -1) {
                users[userIdx] = { ...users[userIdx], avatar: finalAvatarUrl };
                await db.saveUsers(users);
              }
            } catch (err) {
              console.error("Error syncing logged in user avatar:", err);
            }
          }
        }
        toast.success("Foto profil berhasil diperbarui!", { id: toastId });
      }
    } catch (err) {
      console.error("Error uploading photo:", err);
      toast.error("Gagal memproses foto. Silakan coba kembali.", { id: toastId });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    const previousAvatar = avatar || currentCadre?.avatar;
    if (previousAvatar) {
      deleteStorageFile(previousAvatar).catch(() => {});
    }

    setAvatar("");
    if (currentCadre) {
      const updated: CadreFollowUp = {
        ...currentCadre,
        avatar: "",
        pasFotoName: ""
      };
      setCurrentCadre(updated);

      const updatedList = cadres.map((c) => (c.id === currentCadre.id ? updated : c));
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
            const userIdx = users.findIndex(
              (u) => u.id === loggedInUser.id || (u.email && u.email.toLowerCase() === loggedInUser.email?.toLowerCase())
            );
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

  // File Upload Handlers for KTP & KTM with Supabase Storage & Data URL Fallback
  const handleKtpUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran berkas KTP maksimal 5 MB.");
      return;
    }

    const toastId = toast.loading(`Mengunggah berkas KTP (${file.name})...`);

    try {
      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split(".").pop() || "pdf";
        const cadreId = currentCadre?.id || "cadre";
        const filePath = `ktp/${cadreId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (uploadError) {
          console.error("Supabase upload error for KTP:", uploadError);
          // Fallback to base64
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64Url = e.target?.result as string;
            setKtpName(file.name);
            setKtpFileUrl(base64Url);
            toast.success(`Berkas KTP (${file.name}) siap disimpan secara lokal.`, { id: toastId });
          };
          reader.onerror = () => toast.error("Gagal membaca berkas KTP.", { id: toastId });
          reader.readAsDataURL(file);
          return;
        }

        const { data } = supabase.storage.from("materials").getPublicUrl(filePath);

        // Hapus file KTP lama di storage jika ada penggantian berkas
        if (ktpFileUrl && ktpFileUrl !== data.publicUrl) {
          deleteStorageFile(ktpFileUrl).catch(() => {});
        }

        setKtpName(file.name);
        setKtpFileUrl(data.publicUrl);
        toast.success(`Berkas KTP (${file.name}) berhasil diunggah ke storage cloud.`, { id: toastId });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Url = e.target?.result as string;
          setKtpName(file.name);
          setKtpFileUrl(base64Url);
          toast.success(`Berkas KTP (${file.name}) siap disimpan.`, { id: toastId });
        };
        reader.onerror = () => toast.error("Gagal membaca berkas KTP.", { id: toastId });
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Error in handleKtpUpload:", err);
      toast.error("Terjadi kesalahan saat mengunggah KTP.", { id: toastId });
    }
  };

  const handleRemoveKtp = async () => {
    if (ktpFileUrl) {
      try {
        await deleteStorageFile(ktpFileUrl);
      } catch (e) {
        console.error("Failed to delete KTP from storage:", e);
      }
    }
    setKtpName("");
    setKtpFileUrl(undefined);
    toast.info("Lampiran KTP dihapus.");
  };

  const handleKtmUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran berkas KTM maksimal 5 MB.");
      return;
    }

    const toastId = toast.loading(`Mengunggah berkas KTM (${file.name})...`);

    try {
      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split(".").pop() || "pdf";
        const cadreId = currentCadre?.id || "cadre";
        const filePath = `ktm/${cadreId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (uploadError) {
          console.error("Supabase upload error for KTM:", uploadError);
          // Fallback to base64
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64Url = e.target?.result as string;
            setKtmName(file.name);
            setKtmFileUrl(base64Url);
            toast.success(`Berkas KTM (${file.name}) siap disimpan secara lokal.`, { id: toastId });
          };
          reader.onerror = () => toast.error("Gagal membaca berkas KTM.", { id: toastId });
          reader.readAsDataURL(file);
          return;
        }

        const { data } = supabase.storage.from("materials").getPublicUrl(filePath);

        // Hapus file KTM lama di storage jika ada penggantian berkas
        if (ktmFileUrl && ktmFileUrl !== data.publicUrl) {
          deleteStorageFile(ktmFileUrl).catch(() => {});
        }

        setKtmName(file.name);
        setKtmFileUrl(data.publicUrl);
        toast.success(`Berkas KTM (${file.name}) berhasil diunggah ke storage cloud.`, { id: toastId });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Url = e.target?.result as string;
          setKtmName(file.name);
          setKtmFileUrl(base64Url);
          toast.success(`Berkas KTM (${file.name}) siap disimpan.`, { id: toastId });
        };
        reader.onerror = () => toast.error("Gagal membaca berkas KTM.", { id: toastId });
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Error in handleKtmUpload:", err);
      toast.error("Terjadi kesalahan saat mengunggah KTM.", { id: toastId });
    }
  };

  const handleRemoveKtm = async () => {
    if (ktmFileUrl) {
      try {
        await deleteStorageFile(ktmFileUrl);
      } catch (e) {
        console.error("Failed to delete KTM from storage:", e);
      }
    }
    setKtmName("");
    setKtmFileUrl(undefined);
    toast.info("Lampiran KTM dihapus.");
  };

  // Save Biodata Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCadre) return;
    if (!name.trim()) {
      toast.error("Nama lengkap tidak boleh kosong.");
      return;
    }

    const cleanNik = nik.trim().replace(/\D/g, "");
    if (nik.trim() && cleanNik.length !== 16) {
      toast.error("NIK harus terdiri dari tepat 16 digit angka.");
      changeTab("diri");
      return;
    }

    let cleanPhone = phone.trim().replace(/[\s-]/g, "");
    if (cleanPhone.startsWith("+62")) {
      cleanPhone = "0" + cleanPhone.slice(3);
    }

    setIsSaving(true);
    try {
      const updated: CadreFollowUp = {
        ...currentCadre,
        name: name.trim(),
        avatar: avatar,
        gender,
        nik: cleanNik || nik.trim(),
        ktpName,
        ktpFileUrl,
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
        ktmFileUrl,
        phone: cleanPhone,
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
          ? angkatan.trim() || currentCadre.startDate?.split("-")[0] || new Date().getFullYear().toString()
          : "",
        jabatan: jabatan.trim()
      };

      const previousEmail = currentCadre.email || "";
      const updatedList = cadres.map((c) => (c.id === currentCadre.id ? updated : c));
      setCadres(updatedList);
      setCurrentCadre(updated);
      await db.saveCadres(updatedList);

      // Migrate credentials if email changed
      if (previousEmail && previousEmail.toLowerCase() !== email.trim().toLowerCase()) {
        db.migrateUserEmail(previousEmail, email.trim());
      }
      // Re-bind password to new email & identifiers
      const currentPwd = db.getUserPassword(currentCadre) || (currentCadre as any).password;
      if (currentPwd) {
        db.setUserPassword([currentCadre.id, currentCadre.user_id, email.trim(), currentCadre.nik, name.trim()], currentPwd);
      }

      // Sync user session & accounts
      if (typeof window !== "undefined") {
        localStorage.setItem("PMII_ACTIVE_CADRE_ID", updated.id);
        const savedUserStr = localStorage.getItem("PMII_LOGGED_IN_USER");
        if (savedUserStr) {
          try {
            const loggedInUser = JSON.parse(savedUserStr);
            const oldUserEmail = loggedInUser.email;
            loggedInUser.name = name.trim();
            loggedInUser.avatar = avatar;
            loggedInUser.phone = phone.trim();
            loggedInUser.email = email.trim();
            loggedInUser.address = address.trim();
            loggedInUser.instagram = instagram.trim();
            loggedInUser.perguruanTinggi = perguruanTinggi.trim();
            loggedInUser.jurusan = jurusan.trim();
            loggedInUser.gender = gender;
            loggedInUser.nik = nik.trim();
            localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(loggedInUser));

            const users = await db.getUsers();
            const userIdx = users.findIndex(
              (u) =>
                u.id === loggedInUser.id ||
                u.id === currentCadre.id ||
                (u.user_id && currentCadre.user_id && u.user_id === currentCadre.user_id) ||
                (oldUserEmail && u.email && u.email.toLowerCase() === oldUserEmail.toLowerCase()) ||
                (previousEmail && u.email && u.email.toLowerCase() === previousEmail.toLowerCase()) ||
                (u.email && u.email.toLowerCase() === email.trim().toLowerCase())
            );
            if (userIdx !== -1) {
              users[userIdx] = {
                ...users[userIdx],
                name: name.trim(),
                avatar: avatar,
                email: email.trim(),
                password: currentPwd || users[userIdx].password
              };
              await db.saveUsers(users);
            }
          } catch (err) {
            console.error("Error syncing logged in user:", err);
          }
        }
      }

      // Supabase Auth Sync: update langsung ke auth.users via RPC
      if (isSupabaseConfigured && supabase) {
        try {
          const targetEmail = email.trim().toLowerCase();
          if (targetEmail.includes("@")) {
            const pwd = currentPwd || "pmii1960";
            const { data: rpcUserId } = await supabase.rpc("sync_user_to_auth", {
              p_email: targetEmail,
              p_password: pwd,
              p_name: name.trim(),
              p_role: currentCadre.role || "anggota",
              p_commissariat: currentCadre.commissariat || "Ki Ageng Getas Pendawa"
            });
            if (rpcUserId && currentCadre && !currentCadre.user_id) {
              currentCadre.user_id = rpcUserId;
              const updatedList2 = cadres.map(c => c.id === currentCadre.id ? { ...c, user_id: rpcUserId } : c);
              await db.saveCadres(updatedList2);
            }
          }
        } catch (authErr) {
          console.warn("Supabase Auth profile sync notice:", authErr);
        }
      }

      toast.success("Data profil berhasil diperbarui.");
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
    setTempatLahir(currentCadre.tempatLahir || "");
    setTanggalLahir(currentCadre.tanggalLahir || "");
    setAlamatRumah(currentCadre.alamatRumah || "");
    setAddress(currentCadre.alamatDomisili || currentCadre.address || "");
    setGolonganDarah(currentCadre.golonganDarah || "O");
    setRiwayatPenyakit(currentCadre.riwayatPenyakit || "");
    setKtpName(currentCadre.ktpName || "");
    setKtpFileUrl(currentCadre.ktpFileUrl || undefined);

    setPerguruanTinggi(currentCadre.perguruanTinggi || currentCadre.commissariat || "");
    setFakultas(currentCadre.fakultas || "");
    setJurusan(currentCadre.jurusan || "");
    setPhone(currentCadre.phone || "");
    setEmail(currentCadre.email || "");
    setInstagram(currentCadre.instagram || "");
    setTwitter(currentCadre.twitter || "");
    setFacebook(currentCadre.facebook || "");
    setKtmName(currentCadre.ktmName || "");
    setKtmFileUrl(currentCadre.ktmFileUrl || undefined);

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
    setAngkatan(currentCadre.isGraduated ? currentCadre.angkatan || "" : "");
    setJabatan(currentCadre.jabatan || "Anggota");
    setIsEditing(false);
  };

  // Save Career Profile from Character Tab (Updates member profile only, never touches evaluations)
  const handleSaveCareerProfile = async (result: any) => {
    if (!currentCadre) return;
    const updatedCadre: CadreFollowUp = {
      ...currentCadre,
      careerProfile: {
        mbtiCode: result.mbtiCode,
        talent: result.talent,
        interest: result.interest,
        formulaResult: result.formulaResult,
        strategicRole: result.strategicRole,
        description: result.description,
        submittedAt: result.submittedAt
      }
    };
    setCurrentCadre(updatedCadre);
    const updatedList = cadres.map((c) => (c.id === currentCadre.id ? updatedCadre : c));
    setCadres(updatedList);
    await db.saveCadres(updatedList);

    // Sync to Supabase anggota table (isolated, without touching evaluations)
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from("anggota")
          .update({
            career_profile: updatedCadre.careerProfile
          })
          .eq("id", currentCadre.id);
      } catch (err) {
        console.warn("Notice: could not sync career_profile to anggota:", err);
      }
    }
  };

  // Save New Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak sesuai.");
      return;
    }

    try {
      setIsSavingPassword(true);

      // 0. Update credentials store directly
      db.setUserPassword(
        [
          currentCadre?.id,
          currentCadre?.user_id,
          currentCadre?.email,
          email.trim(),
          currentCadre?.nik,
          currentCadre?.name,
          name.trim()
        ],
        newPassword
      );

      // 1. Update Cadre record
      if (currentCadre) {
        const updatedCadre: CadreFollowUp = {
          ...currentCadre,
          password: newPassword
        };
        setCurrentCadre(updatedCadre);
        const updatedCadres = cadres.map((c) => (c.id === currentCadre.id ? updatedCadre : c));
        setCadres(updatedCadres);
        await db.saveCadres(updatedCadres);
      }

      // 2. Update User Account record
      const users = await db.getUsers();
      const userIdx = users.findIndex(
        (u) =>
          (currentCadre && u.id === currentCadre.id) ||
          (currentCadre?.user_id && u.user_id === currentCadre.user_id) ||
          (currentCadre?.email && u.email?.toLowerCase() === currentCadre.email.toLowerCase()) ||
          (email && u.email?.toLowerCase() === email.trim().toLowerCase()) ||
          (currentCadre?.name && u.name?.toLowerCase().trim() === currentCadre.name.toLowerCase().trim())
      );
      if (userIdx !== -1) {
        users[userIdx] = {
          ...users[userIdx],
          password: newPassword
        };
        await db.saveUsers(users);
      }

      // 3. Update active session in localStorage
      if (typeof window !== "undefined") {
        const savedUserStr = localStorage.getItem("PMII_LOGGED_IN_USER");
        if (savedUserStr) {
          try {
            const loggedInUser = JSON.parse(savedUserStr);
            loggedInUser.password = newPassword;
            localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(loggedInUser));
          } catch (e) {}
        }
      }

      // 4. Update in Supabase Auth via sync_user_to_auth RPC
      if (isSupabaseConfigured && supabase) {
        try {
          const targetEmail = (email || currentCadre?.email || "").trim().toLowerCase();
          if (targetEmail.includes("@")) {
            const { data: rpcUserId } = await supabase.rpc("sync_user_to_auth", {
              p_email: targetEmail,
              p_password: newPassword,
              p_name: (name || currentCadre?.name || "").trim(),
              p_role: currentCadre?.role || "anggota",
              p_commissariat: currentCadre?.commissariat || "Ki Ageng Getas Pendawa"
            });
            if (rpcUserId && currentCadre && !currentCadre.user_id) {
              currentCadre.user_id = rpcUserId;
              const updatedList = cadres.map(c => c.id === currentCadre.id ? { ...c, user_id: rpcUserId } : c);
              await db.saveCadres(updatedList);
            }
            await supabase.auth.signInWithPassword({
              email: targetEmail,
              password: newPassword
            });
          }
        } catch (supabaseErr) {
          console.warn("Supabase Auth password error:", supabaseErr);
        }
      }

      setNewPassword("");
      setConfirmPassword("");
      toast.success("Kata sandi berhasil diperbarui! Silakan gunakan sandi baru ini saat login.");
    } catch (err: any) {
      console.error("Save password error:", err);
      toast.error(err.message || "Gagal memperbarui kata sandi.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Download KTA Digital
  const handleDownloadCard = async () => {
    if (!currentCadre) return;
    setIsDownloading(true);
    try {
      await exportCardAsImage({
        type: "kta",
        name: currentCadre.name,
        idNumber: memberNTA,
        commissariat: currentCadre.commissariat,
        level: currentCadre.level,
        startDate: memberStartDate !== "-" ? memberStartDate : undefined
      });
      toast.success("KTA Digital berhasil diunduh (PNG)!");
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

  const memberNTA = currentCadre.nta || "-";
  const memberStartDate = currentCadre.startDate || "-";

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-zinc-900 dark:text-zinc-100 font-sans pb-10">
      {/* 1. HERO PROFILE HEADER */}
      <ProfileHeader
        currentCadre={currentCadre}
        avatar={avatar}
        isUploadingPhoto={isUploadingPhoto}
        hasMapabaRegistration={hasMapabaRegistration}
        fileInputRef={fileInputRef}
        onPhotoUpload={handlePhotoUpload}
        onRemovePhoto={handleRemovePhoto}
      />

      {/* 2. MAIN CONTENT GRID (12 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: DIGITAL ID CARD & MEMBERSHIP INFO (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <DigitalKtaCard
            currentCadre={currentCadre}
            rolePrefix={rolePrefix}
            memberNTA={memberNTA}
            memberStartDate={memberStartDate}
            qrCodeDataUrl={qrCodeDataUrl}
            isDownloading={isDownloading}
            onDownloadCard={handleDownloadCard}
          />
        </div>

        {/* RIGHT COLUMN: EDITABLE PROFILE TABS (7 Cols) */}
        <div className="lg:col-span-7" ref={formCardRef}>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-none">
              {/* Clean Underline Tabs Header with Edit Button */}
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
                <div className="flex gap-4 text-xs font-medium overflow-x-auto no-scrollbar">
                  {[
                    { id: "diri", label: "1. Data Diri", icon: User },
                    { id: "akademik", label: "2. Akademik", icon: GraduationCap },
                    { id: "riwayat", label: "3. Riwayat", icon: Briefcase },
                    { id: "karakter", label: "4. Minat", icon: Compass },
                    { id: "keamanan", label: "5. Keamanan", icon: Lock }
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => changeTab(tab.id as any)}
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
                  {activeTab === "keamanan" ? (
                    <Badge variant="outline" className="h-6 text-[10px] font-semibold text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/5">
                      Sandi Mandiri
                    </Badge>
                  ) : !isEditing ? (
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
                {activeTab === "diri" && (
                  <BiodataTab
                    isEditing={isEditing}
                    name={name}
                    setName={setName}
                    gender={gender}
                    setGender={setGender}
                    nik={nik}
                    setNik={setNik}
                    tempatLahir={tempatLahir}
                    setTempatLahir={setTempatLahir}
                    tanggalLahir={tanggalLahir}
                    setTanggalLahir={setTanggalLahir}
                    alamatRumah={alamatRumah}
                    setAlamatRumah={setAlamatRumah}
                    address={address}
                    setAddress={setAddress}
                    golonganDarah={golonganDarah}
                    setGolonganDarah={setGolonganDarah}
                    riwayatPenyakit={riwayatPenyakit}
                    setRiwayatPenyakit={setRiwayatPenyakit}
                    ktpName={ktpName}
                    ktpFileUrl={ktpFileUrl}
                    onKtpUpload={handleKtpUpload}
                    onRemoveKtp={handleRemoveKtp}
                  />
                )}

                {activeTab === "akademik" && (
                  <AcademicTab
                    isEditing={isEditing}
                    perguruanTinggi={perguruanTinggi}
                    setPerguruanTinggi={setPerguruanTinggi}
                    fakultas={fakultas}
                    setFakultas={setFakultas}
                    jurusan={jurusan}
                    setJurusan={setJurusan}
                    phone={phone}
                    setPhone={setPhone}
                    email={email}
                    setEmail={setEmail}
                    instagram={instagram}
                    setInstagram={setInstagram}
                    twitter={twitter}
                    setTwitter={setTwitter}
                    facebook={facebook}
                    setFacebook={setFacebook}
                    ktmName={ktmName}
                    ktmFileUrl={ktmFileUrl}
                    onKtmUpload={handleKtmUpload}
                    onRemoveKtm={handleRemoveKtm}
                  />
                )}

                {activeTab === "riwayat" && (
                  <HistoryTab
                    isEditing={isEditing}
                    pendidikanSD={pendidikanSD}
                    setPendidikanSD={setPendidikanSD}
                    pendidikanSMP={pendidikanSMP}
                    setPendidikanSMP={setPendidikanSMP}
                    pendidikanSMA={pendidikanSMA}
                    setPendidikanSMA={setPendidikanSMA}
                    organisasiSMP={organisasiSMP}
                    setOrganisasiSMP={setOrganisasiSMP}
                    organisasiSMA={organisasiSMA}
                    setOrganisasiSMA={setOrganisasiSMA}
                    organisasiPT={organisasiPT}
                    setOrganisasiPT={setOrganisasiPT}
                  />
                )}

                {activeTab === "karakter" && (
                  <CharacterTab
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    isGraduated={Boolean(currentCadre.isGraduated)}
                    angkatan={angkatan}
                    setAngkatan={setAngkatan}
                    jabatan={jabatan}
                    orientasiProfetik={orientasiProfetik}
                    setOrientasiProfetik={setOrientasiProfetik}
                    minatPassion={minatPassion}
                    setMinatPassion={setMinatPassion}
                    motivasiMapaba={motivasiMapaba}
                    setMotivasiMapaba={setMotivasiMapaba}
                    careerProfile={currentCadre?.careerProfile}
                    onSaveCareerProfile={handleSaveCareerProfile}
                  />
                )}

                {activeTab === "keamanan" && (
                  <SecurityTab
                    newPassword={newPassword}
                    setNewPassword={setNewPassword}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    isSavingPassword={isSavingPassword}
                    onSavePassword={handleSavePassword}
                  />
                )}
              </div>

              {/* Tab Navigation Footer (for tabs 1-4) */}
              {activeTab !== "keamanan" && (
                <div className="p-3.5 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-zinc-50/50 dark:bg-zinc-950/50">
                  <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={activeTab === "diri"}
                      onClick={() => {
                        if (activeTab === "akademik") changeTab("diri");
                        if (activeTab === "riwayat") changeTab("akademik");
                        if (activeTab === "karakter") changeTab("riwayat");
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
                        if (activeTab === "diri") changeTab("akademik");
                        if (activeTab === "akademik") changeTab("riwayat");
                        if (activeTab === "riwayat") changeTab("karakter");
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
              )}
            </Card>
          </form>
        </div>
      </div>

      {/* SUCCESS DIALOG */}
      <SuccessDialog isOpen={isSuccessOpen} onOpenChange={setIsSuccessOpen} />
    </div>
  );
}
