"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import QRCode from "qrcode";
import { db, type Anggota, type CadreFollowUp } from "@/lib/db";
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
  Save,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles
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

  const [activeTab, setActiveTab] = useState<"diri" | "akademik" | "riwayat" | "karakter" | "keamanan" | "kta">("diri");

  const changeTab = (newTab: "diri" | "akademik" | "riwayat" | "karakter" | "keamanan" | "kta") => {
    setActiveTab(newTab);
    if (formCardRef.current && typeof window !== "undefined" && window.innerWidth < 1024) {
      formCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Step 1: Data Diri & Medis
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [nim, setNim] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [alamatRumah, setAlamatRumah] = useState("");
  const [address, setAddress] = useState("");
  const [golonganDarah, setGolonganDarah] = useState("O");
  const [riwayatPenyakit, setRiwayatPenyakit] = useState("");
  const [pasFoto, setPasFoto] = useState("");
  const [isUploadingPasFoto, setIsUploadingPasFoto] = useState(false);

  // Step 2: Akademik & Kontak
  const [perguruanTinggi, setPerguruanTinggi] = useState("");
  const [fakultas, setFakultas] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [tahunMasukPT, setTahunMasukPT] = useState("");
  const [tahunLulusPT, setTahunLulusPT] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");
  const [ktmName, setKtmName] = useState("");
  const [ktmFileUrl, setKtmFileUrl] = useState<string | undefined>(undefined);

  // Step 3: Pendidikan & Organisasi
  const [pendidikanSD, setPendidikanSD] = useState("");
  const [tahunMasukSD, setTahunMasukSD] = useState("");
  const [tahunLulusSD, setTahunLulusSD] = useState("");
  const [pendidikanSMP, setPendidikanSMP] = useState("");
  const [tahunMasukSMP, setTahunMasukSMP] = useState("");
  const [tahunLulusSMP, setTahunLulusSMP] = useState("");
  const [pendidikanSMA, setPendidikanSMA] = useState("");
  const [tahunMasukSMA, setTahunMasukSMA] = useState("");
  const [tahunLulusSMA, setTahunLulusSMA] = useState("");
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

      let mine: CadreFollowUp | null = null;
      let allCadres: CadreFollowUp[] = [];

      // 1. High-Performance Targeted Query: Coba ambil data spesifik 1 kader langsung
      if (isSupabaseConfigured && supabase) {
        try {
          if (activeId) {
            const { data } = await supabase.from("anggota").select("*").eq("id", activeId).maybeSingle();
            if (data) mine = data;
          }
          if (!mine && loggedInUser?.email) {
            const { data } = await supabase.from("anggota").select("*").ilike("email", loggedInUser.email.trim()).maybeSingle();
            if (data) mine = data;
          }
          if (!mine && loggedInUser?.id) {
            const { data } = await supabase.from("anggota").select("*").eq("id", loggedInUser.id).maybeSingle();
            if (data) mine = data;
          }
        } catch (err) {
          console.warn("[ProfilPage] Targeted cadre fetch error:", err);
        }
      }

      // Fallback ke db.getAnggota jika query spesifik tidak menemukan hasil (misal mode offline/mock)
      if (!mine) {
        allCadres = await db.getAnggota([]);
        mine =
          (activeId ? allCadres.find((c) => c.id === activeId) : null) ||
          (loggedInUser
            ? allCadres.find((c) => c.id === loggedInUser.id || (c.email && c.email.toLowerCase() === loggedInUser.email?.toLowerCase()))
            : null) ||
          allCadres[0] ||
          null;
      } else {
        allCadres = [mine];
      }

      // Auto-fallback from loggedInUser to avoid broken profile state
      if (!mine && loggedInUser) {
        const isGraduated =
          loggedInUser.role?.toLowerCase() === "anggota" ||
          loggedInUser.role?.toLowerCase() === "admin" ||
          loggedInUser.role?.toLowerCase() === "pengurus";

        const fallbackAnggota: Anggota = {
          id: loggedInUser.id || `anggota-${Date.now()}`,
          name: loggedInUser.name || "Anggota PMII",
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
        mine = fallbackAnggota;
        allCadres.push(fallbackAnggota);
        await db.saveAnggota(allCadres);
      }

      setCadres(allCadres);
      setCurrentCadre(mine);

      if (mine) {
        setName(mine.name || "");
        setAvatar(mine.avatar || loggedInUser?.avatar || "");
        setGender((mine.gender as any) || "Laki-laki");
        setNim(mine.nim || mine.nik || "");
        setTempatLahir(mine.tempatLahir || "");
        setTanggalLahir(mine.tanggalLahir || "");
        setAlamatRumah(mine.alamatRumah || "");
        setAddress(mine.alamatDomisili || mine.address || "");
        setGolonganDarah(mine.golonganDarah || "O");
        setRiwayatPenyakit(mine.riwayatPenyakit || "");
        setPasFoto(mine.pasFoto || "");

        setPerguruanTinggi(mine.perguruanTinggi || mine.commissariat || "");
        setFakultas(mine.fakultas || "");
        setJurusan(mine.jurusan || "");
        setTahunMasukPT(mine.tahunMasukPT || "");
        setTahunLulusPT(mine.tahunLulusPT || "");
        setPhone(mine.phone || "");
        setEmail(mine.email || "");
        setInstagram(mine.instagram || "");
        setTwitter(mine.twitter || "");
        setFacebook(mine.facebook || "");
        setKtmName(mine.ktmName || "");
        setKtmFileUrl(mine.ktmFileUrl || undefined);

        setPendidikanSD(mine.pendidikanSD || "");
        setTahunMasukSD(mine.tahunMasukSD || "");
        setTahunLulusSD(mine.tahunLulusSD || "");
        setPendidikanSMP(mine.pendidikanSMP || "");
        setTahunMasukSMP(mine.tahunMasukSMP || "");
        setTahunLulusSMP(mine.tahunLulusSMP || "");
        setPendidikanSMA(mine.pendidikanSMA || "");
        setTahunMasukSMA(mine.tahunMasukSMA || "");
        setTahunLulusSMA(mine.tahunLulusSMA || "");
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

        // 2. Targeted Assessment / Evaluation Fetching (Hanya ambil penilaian user ini)
        if (!mine.careerProfile) {
          try {
            let myEval: any = null;
            if (isSupabaseConfigured && supabase && mine.id) {
              const { data } = await supabase
                .from("evaluations")
                .select("careerAssessment")
                .eq("cadreId", mine.id)
                .maybeSingle();
              if (data?.careerAssessment) myEval = data;
            }
            if (!myEval) {
              const allEvals = await db.getEvaluations().catch(() => []);
              myEval = allEvals.find(
                (e) =>
                  (mine?.id && e.cadreId === mine.id) ||
                  (mine?.name && e.participantName?.toLowerCase().trim() === mine.name.toLowerCase().trim())
              );
            }
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

        // 3. Targeted MAPABA Registration Fetching (Hanya registrasi kader ini)
        let matchedReg: any = null;
        if (isSupabaseConfigured && supabase && mine.email) {
          try {
            const { data } = await supabase
              .from("registrations")
              .select("registrationNumber, cadreName, cadreEmail")
              .ilike("cadreEmail", mine.email.trim())
              .maybeSingle();
            if (data) matchedReg = data;
          } catch {}
        }
        if (!matchedReg && mine.name && isSupabaseConfigured && supabase) {
          try {
            const { data } = await supabase
              .from("registrations")
              .select("registrationNumber, cadreName, cadreEmail")
              .ilike("cadreName", mine.name.trim())
              .maybeSingle();
            if (data) matchedReg = data;
          } catch {}
        }
        if (!matchedReg) {
          const allRegs = await db.getRegistrations([]).catch(() => []);
          matchedReg = allRegs.find(
            (r) =>
              (mine?.name && r.cadreName?.toLowerCase().trim() === mine.name.toLowerCase().trim()) ||
              (mine?.email && r.cadreEmail?.toLowerCase().trim() === mine.email.toLowerCase().trim())
          );
        }

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
          avatar: finalAvatarUrl
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
        avatar: ""
      };
      setCurrentCadre(updated);

      const updatedList = cadres.map((c) => (c.id === currentCadre.id ? updated : c));
      setCadres(updatedList);
      await db.saveAnggota(updatedList);

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

  // Upload and Remove Handlers for Official Pas Foto (Decoupled from Avatar)
  const handlePasFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Format berkas harus berupa gambar (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran pas foto maksimal 5 MB.");
      return;
    }

    setIsUploadingPasFoto(true);
    const toastId = toast.loading("Mengunggah Pas Foto resmi...");

    try {
      const compressedDataUrl = await compressImage(file);

      let finalPasFotoUrl = compressedDataUrl;

      if (isSupabaseConfigured && supabase) {
        try {
          const blob = await (await fetch(compressedDataUrl)).blob();
          const fileExt = file.name.split(".").pop() || "jpg";
          const cadreId = currentCadre?.id || "cadre";
          const fileName = `${cadreId}-${Date.now()}.${fileExt}`;

          // Unggah ke bucket 'pas-foto'
          const { error: uploadErr } = await supabase.storage
            .from("pas-foto")
            .upload(fileName, blob, {
              contentType: blob.type || "image/jpeg",
              upsert: true,
            });

          if (!uploadErr) {
            const { data } = supabase.storage.from("pas-foto").getPublicUrl(fileName);
            if (data?.publicUrl) {
              finalPasFotoUrl = data.publicUrl;
            }
          } else {
            console.warn("Upload ke bucket pas-foto bermasalah, mencoba fallback materials:", uploadErr);
            const fallbackPath = `pas-foto/${fileName}`;
            const { error: fallbackErr } = await supabase.storage
              .from("materials")
              .upload(fallbackPath, blob, {
                contentType: blob.type || "image/jpeg",
                upsert: true,
              });
            if (!fallbackErr) {
              const { data } = supabase.storage.from("materials").getPublicUrl(fallbackPath);
              if (data?.publicUrl) {
                finalPasFotoUrl = data.publicUrl;
              }
            }
          }
        } catch (storageErr) {
          console.warn("Storage upload failed for pas foto, keeping compressed data URL:", storageErr);
        }
      }

      setPasFoto(finalPasFotoUrl);

      if (currentCadre) {
        const updated: CadreFollowUp = {
          ...currentCadre,
          pasFoto: finalPasFotoUrl,
        };
        setCurrentCadre(updated);

        const updatedList = cadres.map((c) => (c.id === currentCadre.id ? updated : c));
        setCadres(updatedList);
        await db.saveCadres(updatedList);
      }

      toast.success("Pas foto resmi berhasil diunggah!", { id: toastId });
    } catch (err) {
      console.error("Error uploading pas foto:", err);
      toast.error("Gagal mengunggah pas foto. Silakan coba kembali.", { id: toastId });
    } finally {
      setIsUploadingPasFoto(false);
      e.target.value = "";
    }
  };

  const handleRemovePasFoto = async () => {
    const previousPasFoto = pasFoto || currentCadre?.pasFoto;
    if (previousPasFoto) {
      deleteStorageFile(previousPasFoto).catch(() => {});
    }

    setPasFoto("");
    if (currentCadre) {
      const updated: CadreFollowUp = {
        ...currentCadre,
        pasFoto: "",
      };
      setCurrentCadre(updated);

      const updatedList = cadres.map((c) => (c.id === currentCadre.id ? updated : c));
      setCadres(updatedList);
      await db.saveAnggota(updatedList);

      toast.success("Pas foto resmi berhasil dihapus.");
    }
  };

  // File Upload Handlers for KTM with Supabase Storage & Data URL Fallback
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

    // 1. Validasi Nama
    if (!name.trim()) {
      toast.error("Nama lengkap tidak boleh kosong.");
      return;
    }

    // 2. Validasi Surel / Email
    const cleanEmail = email.trim();
    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        toast.error("Format alamat email tidak valid (contoh: kader@pmii.id).");
        return;
      }
    }

    // 3. Validasi & Normalisasi Nomor Telepon (HP / WhatsApp)
    let cleanPhone = phone.trim().replace(/[\s-]/g, "");
    if (cleanPhone.startsWith("+62")) {
      cleanPhone = "0" + cleanPhone.slice(3);
    } else if (cleanPhone.startsWith("62")) {
      cleanPhone = "0" + cleanPhone.slice(2);
    }
    if (cleanPhone && !/^08\d{8,12}$/.test(cleanPhone)) {
      toast.error("Nomor WhatsApp/HP tidak valid. Harus diawali 08 dan terdiri dari 10-14 digit angka.");
      return;
    }

    // 4. Validasi NIM
    const cleanNim = nim.trim();
    if (cleanNim && cleanNim.length > 30) {
      toast.error("NIM terlalu panjang (maksimal 30 karakter).");
      return;
    }

    // 5. Validasi Tanggal Lahir
    if (tanggalLahir) {
      const birthDate = new Date(tanggalLahir);
      const now = new Date();
      if (isNaN(birthDate.getTime())) {
        toast.error("Format tanggal lahir tidak valid.");
        return;
      }
      if (birthDate > now) {
        toast.error("Tanggal lahir tidak boleh di masa depan.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const updated: CadreFollowUp = {
        ...currentCadre,
        name: name.trim(),
        avatar: avatar,
        gender,
        nim: cleanNim,
        tempatLahir: tempatLahir.trim(),
        tanggalLahir,
        alamatRumah: alamatRumah.trim(),
        address: address.trim(),
        alamatDomisili: address.trim(),
        golonganDarah,
        riwayatPenyakit: riwayatPenyakit.trim(),
        pasFoto: pasFoto.trim(),
        perguruanTinggi: perguruanTinggi.trim(),
        fakultas: fakultas.trim(),
        jurusan: jurusan.trim(),
        tahunMasukPT: tahunMasukPT.trim(),
        tahunLulusPT: tahunLulusPT.trim(),
        ktmName,
        ktmFileUrl,
        phone: cleanPhone,
        email: email.trim(),
        instagram: instagram.trim(),
        twitter: twitter.trim(),
        facebook: facebook.trim(),
        pendidikanSD: pendidikanSD.trim(),
        tahunMasukSD: tahunMasukSD.trim(),
        tahunLulusSD: tahunLulusSD.trim(),
        pendidikanSMP: pendidikanSMP.trim(),
        tahunMasukSMP: tahunMasukSMP.trim(),
        tahunLulusSMP: tahunLulusSMP.trim(),
        pendidikanSMA: pendidikanSMA.trim(),
        tahunMasukSMA: tahunMasukSMA.trim(),
        tahunLulusSMA: tahunLulusSMA.trim(),
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

      // 1. Direct Targeted Single-Row Update in Supabase & Local Cache (O(1) lightning fast)
      await db.updateAnggota(currentCadre.id, updated);

      const updatedList = cadres.map((c) => (c.id === currentCadre.id ? updated : c));
      setCadres(updatedList);
      setCurrentCadre(updated);

      // 2. Sync local user session immediately
      if (typeof window !== "undefined") {
        localStorage.setItem("PMII_ACTIVE_ANGGOTA_ID", updated.id);
        localStorage.setItem("PMII_ACTIVE_CADRE_ID", updated.id);
        const savedUserStr = localStorage.getItem("PMII_LOGGED_IN_USER");
        if (savedUserStr) {
          try {
            const loggedInUser = JSON.parse(savedUserStr);
            loggedInUser.name = name.trim();
            loggedInUser.avatar = avatar;
            loggedInUser.phone = cleanPhone;
            loggedInUser.email = email.trim();
            loggedInUser.address = address.trim();
            loggedInUser.instagram = instagram.trim();
            loggedInUser.perguruanTinggi = perguruanTinggi.trim();
            loggedInUser.jurusan = jurusan.trim();
            loggedInUser.gender = gender;
            loggedInUser.nim = cleanNim;
            localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(loggedInUser));
          } catch (err) {}
        }
      }

      // 3. ONLY run credentials & Supabase Auth sync IF email or name actually changed
      const emailChanged = previousEmail && previousEmail.toLowerCase() !== email.trim().toLowerCase();
      const nameChanged = (currentCadre.name || "").trim() !== name.trim();
      const currentPwd = db.getUserPassword(currentCadre) || (currentCadre as any).password;

      if (emailChanged && previousEmail) {
        db.migrateUserEmail(previousEmail, email.trim());
      }
      if (currentPwd) {
        db.setUserPassword([currentCadre.id, currentCadre.user_id, email.trim(), cleanNim, name.trim()], currentPwd);
      }

      // Background non-blocking sync to Supabase Auth if credentials changed
      if ((emailChanged || nameChanged) && isSupabaseConfigured && supabase) {
        const targetEmail = email.trim().toLowerCase();
        if (targetEmail.includes("@")) {
          (async () => {
            try {
              await supabase.rpc("sync_user_to_auth", {
                p_email: targetEmail,
                p_password: currentPwd || "pmii1960",
                p_name: name.trim(),
                p_role: currentCadre.role || "anggota",
                p_commissariat: currentCadre.commissariat || "Ki Ageng Getas Pendawa"
              });
            } catch (authErr) {
              console.warn("Background Supabase Auth sync notice:", authErr);
            }
          })();
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
    setNim(currentCadre.nim || currentCadre.nik || "");
    setTempatLahir(currentCadre.tempatLahir || "");
    setTanggalLahir(currentCadre.tanggalLahir || "");
    setAlamatRumah(currentCadre.alamatRumah || "");
    setAddress(currentCadre.alamatDomisili || currentCadre.address || "");
    setGolonganDarah(currentCadre.golonganDarah || "O");
    setRiwayatPenyakit(currentCadre.riwayatPenyakit || "");
    setPasFoto(currentCadre.pasFoto || "");

    setPerguruanTinggi(currentCadre.perguruanTinggi || currentCadre.commissariat || "");
    setFakultas(currentCadre.fakultas || "");
    setJurusan(currentCadre.jurusan || "");
    setTahunMasukPT(currentCadre.tahunMasukPT || "");
    setTahunLulusPT(currentCadre.tahunLulusPT || "");
    setPhone(currentCadre.phone || "");
    setEmail(currentCadre.email || "");
    setInstagram(currentCadre.instagram || "");
    setTwitter(currentCadre.twitter || "");
    setFacebook(currentCadre.facebook || "");
    setKtmName(currentCadre.ktmName || "");
    setKtmFileUrl(currentCadre.ktmFileUrl || undefined);

    setPendidikanSD(currentCadre.pendidikanSD || "");
    setTahunMasukSD(currentCadre.tahunMasukSD || "");
    setTahunLulusSD(currentCadre.tahunLulusSD || "");
    setPendidikanSMP(currentCadre.pendidikanSMP || "");
    setTahunMasukSMP(currentCadre.tahunMasukSMP || "");
    setTahunLulusSMP(currentCadre.tahunLulusSMP || "");
    setPendidikanSMA(currentCadre.pendidikanSMA || "");
    setTahunMasukSMA(currentCadre.tahunMasukSMA || "");
    setTahunLulusSMA(currentCadre.tahunLulusSMA || "");
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
          currentCadre?.nim || currentCadre?.nik,
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
        commissariat: currentCadre.commissariat || "PMII Grobogan",
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

  // Menghitung persentase kelengkapan profil kader
  const calculateProfileCompletion = () => {
    let score = 0;
    // 1. Data Diri & Medis (30%)
    if (name.trim()) score += 8;
    if (gender) score += 4;
    if (nim.trim()) score += 6;
    if (tempatLahir.trim()) score += 4;
    if (tanggalLahir.trim()) score += 4;
    if (alamatRumah.trim() || address.trim()) score += 4;

    // 2. Akademik & Kontak (30%)
    if (perguruanTinggi.trim()) score += 8;
    if (jurusan.trim()) score += 6;
    if (phone.trim()) score += 8;
    if (email.trim()) score += 8;

    // 3. Berkas & Foto (20%)
    if (avatar) score += 10;
    if (ktmFileUrl) score += 10;

    // 4. Riwayat & Karakter (20%)
    if (pendidikanSMA.trim()) score += 6;
    if (organisasiSMA.trim() || organisasiPT.trim()) score += 6;
    if (minatPassion.trim() || orientasiProfetik.trim()) score += 8;

    return Math.min(100, score);
  };

  const profileCompletionScore = calculateProfileCompletion();

  const navItems: Array<{
    id: "diri" | "akademik" | "riwayat" | "karakter" | "kta" | "keamanan";
    label: string;
    sub: string;
    icon: any;
  }> = [
    { id: "diri", label: "Data Pribadi", sub: "Nama, NIK, alamat & kontak", icon: User },
    { id: "akademik", label: "Akademik & Kampus", sub: "Universitas, fakultas & KTM", icon: GraduationCap },
    { id: "riwayat", label: "Riwayat & Organisasi", sub: "SD, SMP, SMA & organisasi", icon: Briefcase },
    { id: "karakter", label: "Minat & Karakter", sub: "Visi, passion & orientasi PMII", icon: Compass },
    { id: "kta", label: "KTA Digital PMII", sub: "Kartu identitas resmi & QR", icon: CreditCard },
    { id: "keamanan", label: "Keamanan Akun", sub: "Kata sandi login mandiri", icon: Lock },
  ];

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case "diri":
        return { title: "Data Pribadi & Biodata", sub: "Identitas dasar kader, alamat domisili, dan kontak darurat." };
      case "akademik":
        return { title: "Akademik & Kemahasiswaan", sub: "Perguruan tinggi, fakultas, jurusan, dan kartu mahasiswa." };
      case "riwayat":
        return { title: "Riwayat Pendidikan & Organisasi", sub: "Pendidikan formal (SD-SMA) dan rekam jejak keorganisasian." };
      case "karakter":
        return { title: "Minat, Bakat & Orientasi", sub: "Potensi diri, motivasi ber-PMII, dan minat pengembangan kader." };
      case "keamanan":
        return { title: "Keamanan Akun & Sandi", sub: "Perbarui kata sandi akun untuk menjaga keamanan akses profil Anda." };
      case "kta":
        return { title: "Kartu Tanda Anggota (KTA) Digital", sub: "KTA resmi digital kader PMII dengan QR code verifikasi." };
    }
  };

  const activeTabMeta = getActiveTabTitle();

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-zinc-900 dark:text-zinc-100 font-sans pb-10">
      {/* 1. HERO PROFILE HEADER (MODERN ACCOUNT HUB) */}
      <ProfileHeader
        currentCadre={currentCadre}
        avatar={avatar}
        isUploadingPhoto={isUploadingPhoto}
        hasMapabaRegistration={hasMapabaRegistration}
        completionScore={profileCompletionScore}
        memberNTA={memberNTA}
        fileInputRef={fileInputRef}
        onPhotoUpload={handlePhotoUpload}
        onRemovePhoto={handleRemovePhoto}
      />

      {/* 2. MAIN WORKSPACE GRID (4 COLS SIDEBAR + 8 COLS WORKSPACE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: VERTICAL ACCOUNT HUB NAVIGATION & MINI KTA (Hidden on Mobile, 4 Cols on Desktop) */}
        <div className="hidden lg:block lg:col-span-4 space-y-4">
          {/* Vertical Sub-navigation Card */}
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Pusat Akun Kader
              </span>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                {profileCompletionScore}% Lengkap
              </span>
            </div>

            <div className="p-2 space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => changeTab(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-center gap-3 cursor-pointer group ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/80 dark:border-blue-900/60 shadow-2xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 border border-transparent"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium truncate">{item.label}</span>
                        {item.id === "kta" && currentCadre?.isGraduated && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold uppercase shrink-0">
                            Resmi
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5 font-normal">
                        {item.sub}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        isActive ? "text-blue-600 dark:text-blue-400 translate-x-0.5" : "text-zinc-300 dark:text-zinc-600"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Mini KTA Passport / Status Widget (Visible when NOT on KTA tab) */}
          {activeTab !== "kta" && (
            <Card className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 text-white rounded-xl p-4 shadow-sm relative overflow-hidden border border-blue-800/40">
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                  <span>KTA Digital Mini</span>
                </div>
                <Badge
                  className={`text-[9px] h-5 px-2 border-0 ${
                    currentCadre?.isGraduated ? "bg-amber-400 text-slate-950 font-bold" : "bg-white/20 text-white"
                  }`}
                >
                  {currentCadre?.isGraduated ? "Kader Resmi" : "Peserta"}
                </Badge>
              </div>

              <div className="relative z-10 flex items-center gap-3">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Foto Profil"
                    className="w-11 h-11 rounded-lg object-cover border-2 border-amber-400/80 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 shrink-0 font-bold text-amber-300">
                    {currentCadre?.name?.charAt(0) || "P"}
                  </div>
                )}
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-bold truncate text-white">{currentCadre?.name || "Kader PMII"}</p>
                  <p className="font-mono text-[11px] text-amber-300 truncate mt-0.5">
                    {memberNTA && memberNTA !== "-" ? memberNTA : "NTA belum terbit"}
                  </p>
                  <p className="text-[10px] text-zinc-300 truncate mt-0.5">
                    {currentCadre?.commissariat || "PMII Grobogan"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => changeTab("kta")}
                className="mt-3.5 w-full py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 border border-white/15 cursor-pointer"
              >
                <span>Buka KTA Digital Penuh</span>
                <ArrowRight className="w-3 h-3 text-amber-300" />
              </button>
            </Card>
          )}

          {/* Verification Notice when on KTA Tab */}
          {activeTab === "kta" && (
            <Card className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Verifikasi Keaslian KTA</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                Setiap KTA memuat QR Code unik yang terhubung dengan basis data keanggotaan terpusat PMII Cabang Grobogan untuk memastikan validitas kepengurusan.
              </p>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: SPACIOUS 8-COL WORKSPACE */}
        <div className="lg:col-span-8" ref={formCardRef}>
          {/* Mobile Tab Strip (Only visible on small screens < lg) */}
          <div className="lg:hidden mb-4 overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => changeTab(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "bg-white dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VIEW 1: KTA DIGITAL FULL VIEW */}
          {activeTab === "kta" ? (
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-none p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 gap-3">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Kartu Tanda Anggota (KTA) Digital PMII</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Kartu identitas resmi kader PMII dengan QR Code verifikasi keaslian terpusat.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`h-6 self-start sm:self-auto text-[11px] font-semibold shrink-0 ${
                    currentCadre?.isGraduated
                      ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                      : "text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10"
                  }`}
                >
                  {currentCadre?.isGraduated ? "KTA Aktif & Sah" : "Menunggu Pelantikan"}
                </Badge>
              </div>

              {/* Full KTA Canvas & Actions */}
              <div className="max-w-md mx-auto">
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
            </Card>
          ) : (
            /* VIEW 2: FORM TABS (DIRI, AKADEMIK, RIWAYAT, KARAKTER, KEAMANAN) */
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-none">
                {/* Profile Card Action Toolbar */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {activeTabMeta.title}
                      </span>
                      {activeTab !== "keamanan" && (
                        isEditing ? (
                          <Badge variant="outline" className="h-5 px-2 text-[10px] font-semibold text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10 shrink-0">
                            Mode Edit
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="h-5 px-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10 shrink-0">
                            Mode Baca
                          </Badge>
                        )
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate hidden sm:block">
                      {activeTabMeta.sub}
                    </p>
                  </div>

                  {activeTab === "keamanan" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="h-6 text-[10px] font-semibold text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/5">
                        Sandi Mandiri
                      </Badge>
                    </div>
                  )}
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
                      nim={nim}
                      setNim={setNim}
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
                      pasFoto={pasFoto}
                      isUploadingPasFoto={isUploadingPasFoto}
                      onPasFotoUpload={handlePasFotoUpload}
                      onRemovePasFoto={handleRemovePasFoto}
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
                      tahunMasukPT={tahunMasukPT}
                      setTahunMasukPT={setTahunMasukPT}
                      tahunLulusPT={tahunLulusPT}
                      setTahunLulusPT={setTahunLulusPT}
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
                      tahunMasukSD={tahunMasukSD}
                      setTahunMasukSD={setTahunMasukSD}
                      tahunLulusSD={tahunLulusSD}
                      setTahunLulusSD={setTahunLulusSD}
                      pendidikanSMP={pendidikanSMP}
                      setPendidikanSMP={setPendidikanSMP}
                      tahunMasukSMP={tahunMasukSMP}
                      setTahunMasukSMP={setTahunMasukSMP}
                      tahunLulusSMP={tahunLulusSMP}
                      setTahunLulusSMP={setTahunLulusSMP}
                      pendidikanSMA={pendidikanSMA}
                      setPendidikanSMA={setPendidikanSMA}
                      tahunMasukSMA={tahunMasukSMA}
                      setTahunMasukSMA={setTahunMasukSMA}
                      tahunLulusSMA={tahunLulusSMA}
                      setTahunLulusSMA={setTahunLulusSMA}
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

                {/* Tab Navigation Footer */}
                {activeTab !== "keamanan" && (
                  <div className="p-3.5 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-zinc-50/60 dark:bg-zinc-950/50">
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
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
                        className="text-xs h-9 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto font-medium"
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
                        className="text-xs h-9 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto font-medium"
                      >
                        <span>Selanjutnya</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {isEditing ? (
                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="w-full sm:w-auto text-xs h-9 px-4 rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer font-medium"
                        >
                          Batal
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSaving}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 rounded-lg border-none cursor-pointer flex items-center justify-center gap-1.5 px-5 shrink-0 transition-colors shadow-xs"
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
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 rounded-lg border-none cursor-pointer flex items-center justify-center gap-1.5 px-5 shrink-0 transition-colors shadow-xs"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit Profil</span>
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </form>
          )}
        </div>
      </div>

      {/* SUCCESS DIALOG */}
      <SuccessDialog isOpen={isSuccessOpen} onOpenChange={setIsSuccessOpen} />

      {/* STICKY BOTTOM ACTION BAR ON MOBILE WHEN IN EDIT MODE */}
      {isEditing && activeTab !== "keamanan" && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 z-50 sm:hidden flex items-center justify-between gap-3 shadow-lg animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 truncate">
              Mode Edit ({profileCompletionScore}% Lengkap)
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelEdit}
              className="h-8 px-3 text-xs rounded-lg border-zinc-300 dark:border-zinc-700 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={() => {
                const formEl = formCardRef.current?.querySelector("form");
                if (formEl) formEl.requestSubmit();
              }}
              disabled={isSaving}
              size="sm"
              className="h-8 px-3.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Simpan</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
