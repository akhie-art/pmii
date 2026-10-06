"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Save,
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

export default function DashboardProfilPage() {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [cadres, setCadres] = useState<CadreFollowUp[]>([]);
  const [currentCadre, setCurrentCadre] = useState<CadreFollowUp | null>(null);

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

  // Step 4: Karakter & Minat / Kepengurusan
  const [orientasiProfetik, setOrientasiProfetik] = useState("");
  const [minatPassion, setMinatPassion] = useState("");
  const [motivasiMapaba, setMotivasiMapaba] = useState("");
  const [angkatan, setAngkatan] = useState("");
  const [jabatan, setJabatan] = useState("Pengurus");

  // Step 5: Keamanan & Sandi
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Dialog & Card State
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      const activeId = typeof window !== "undefined" ? (localStorage.getItem("PMII_ACTIVE_CADRE_ID") || "") : "";
      const savedUserStr = typeof window !== "undefined" ? localStorage.getItem("PMII_LOGGED_IN_USER") : null;
      let loggedInUser: any = null;
      if (savedUserStr) {
        try {
          loggedInUser = JSON.parse(savedUserStr);
          setCurrentUser(loggedInUser);
        } catch (e) {}
      }
      
      const [allCadres, allBoards] = await Promise.all([
        db.getCadres([]),
        db.getBoards([])
      ]);

      // Check matching board record
      const matchedBoard = allBoards.find(
        (b) =>
          (loggedInUser && b.user_id && b.user_id === loggedInUser.id) ||
          (loggedInUser && b.email && b.email.toLowerCase() === loggedInUser.email?.toLowerCase()) ||
          (loggedInUser && b.name && b.name.toLowerCase() === loggedInUser.name?.toLowerCase())
      );

      // Check matching cadre record
      let mine: CadreFollowUp | null = 
        (activeId ? allCadres.find(c => c.id === activeId) : null) || 
        (loggedInUser ? allCadres.find(c => c.id === loggedInUser.id || (c.email && c.email.toLowerCase() === loggedInUser.email?.toLowerCase())) : null) || 
        allCadres[0] || null;

      // Auto-fallback from loggedInUser to guarantee full operational record
      if (!mine && loggedInUser) {
        const fallbackCadre: CadreFollowUp = {
          id: loggedInUser.id || `staff-${Date.now()}`,
          name: loggedInUser.name || "Pengurus PMII",
          email: loggedInUser.email || "",
          phone: loggedInUser.phone || "",
          level: "PKL",
          commissariat: loggedInUser.commissariat || "Ki Ageng Getas Pendawa",
          startDate: loggedInUser.createdAt ? loggedInUser.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          status: "AKTIF",
          submissions: [],
          isGraduated: true,
          nta: loggedInUser.nta || `NTA-STAFF-${Date.now().toString().slice(-6)}`,
          avatar: loggedInUser.avatar || "",
          address: loggedInUser.address || "",
          perguruanTinggi: loggedInUser.perguruanTinggi || "Komisariat Ki Ageng Getas Pendawa",
          jurusan: loggedInUser.jurusan || "",
          angkatan: loggedInUser.angkatan || new Date().getFullYear().toString(),
          role: loggedInUser.role || "pengurus",
          jabatan: matchedBoard?.position || (loggedInUser.role?.toLowerCase() === "admin" ? "Administrator" : "Pengurus Komisariat")
        };
        mine = fallbackCadre;
        allCadres.push(fallbackCadre);
        await db.saveCadres(allCadres);
      }

      setCadres(allCadres);
      setCurrentCadre(mine);

      if (mine) {
        setName(mine.name || loggedInUser?.name || "");
        setAvatar(mine.avatar || loggedInUser?.avatar || matchedBoard?.avatar || "");
        setGender((mine.gender as any) || "Laki-laki");
        setNik(mine.nik || "");
        setKtpName(mine.ktpName || "");
        setTempatLahir(mine.tempatLahir || "");
        setTanggalLahir(mine.tanggalLahir || "");
        setAlamatRumah(mine.alamatRumah || "");
        setAddress(mine.alamatDomisili || mine.address || "");
        setGolonganDarah(mine.golonganDarah || "O");
        setRiwayatPenyakit(mine.riwayatPenyakit || "");

        setPerguruanTinggi(mine.perguruanTinggi || mine.commissariat || "PK PMII Ki Ageng Getas Pendawa");
        setFakultas(mine.fakultas || "");
        setJurusan(mine.jurusan || "");
        setKtmName(mine.ktmName || "");
        setPhone(mine.phone || loggedInUser?.phone || "");
        setEmail(mine.email || loggedInUser?.email || "");
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

        setAngkatan(mine.angkatan || new Date().getFullYear().toString());
        setJabatan(matchedBoard?.position || mine.jabatan || (loggedInUser?.role?.toLowerCase() === "admin" ? "Administrator" : "Pengurus Komisariat"));
        setOrientasiProfetik(mine.orientasiProfetik || "Kepemimpinan & Intelektual");
        setMinatPassion(mine.minatPassion || "");
        setMotivasiMapaba(mine.motivasiMapaba || "Berkhidmat untuk PMII dan peradaban");
      }
      setMounted(true);
    };
    loadData();
  }, []);

  const memberNTA = currentCadre?.nta || `NTA-PMII-${(currentCadre?.name || "STAFF").slice(0, 3).toUpperCase()}-2026`;
  const memberStartDate = currentCadre?.startDate || new Date().toISOString().split("T")[0];

  // Offline-safe local QR Code generation
  useEffect(() => {
    if (!currentCadre) return;
    const code = memberNTA;

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
  }, [currentCadre, memberNTA]);

  // Compress image before saving
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
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = () => reject(new Error("Gagal membaca file gambar"));
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Gagal membaca file"));
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
      toast.error("Ukuran foto maksimal 5 MB.");
      return;
    }

    const toastId = toast.loading("Mengunggah foto profil...");

    try {
      setIsUploadingPhoto(true);
      let finalAvatarUrl = "";
      const previousAvatar = avatar || currentCadre?.avatar;

      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const cadreId = currentCadre?.id || currentUser?.id || "avatar";
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

          // Hapus foto profil lama dari Supabase Storage jika ada penggantian
          if (previousAvatar && previousAvatar !== finalAvatarUrl) {
            deleteStorageFile(previousAvatar).catch(() => {});
          }
        }
      } else {
        finalAvatarUrl = await compressImage(file);
      }

      setAvatar(finalAvatarUrl);

      // Auto-save photo immediately
      if (currentCadre) {
        const updatedCadre = { ...currentCadre, avatar: finalAvatarUrl };
        setCurrentCadre(updatedCadre);

        const updatedCadres = cadres.map(c => c.id === currentCadre.id ? updatedCadre : c);
        await db.saveCadres(updatedCadres);
      }

      // Sync to logged-in user session & database
      const savedUserStr = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          parsed.avatar = finalAvatarUrl;
          localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(parsed));
          window.dispatchEvent(new CustomEvent("pmii-profile-updated", { detail: parsed }));

          const users = await db.getUsers();
          const userIdx = users.findIndex(
            (u) => u.id === parsed.id || (u.email && u.email.toLowerCase() === parsed.email?.toLowerCase())
          );
          if (userIdx !== -1) {
            users[userIdx] = { ...users[userIdx], avatar: finalAvatarUrl };
            await db.saveUsers(users);
          }
        } catch (e) {}
      }

      toast.success("Foto profil berhasil diperbarui.", { id: toastId });
    } catch (err) {
      console.error("Photo upload error:", err);
      toast.error("Gagal mengunggah foto profil.", { id: toastId });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      const previousAvatar = avatar || currentCadre?.avatar;
      if (previousAvatar) {
        deleteStorageFile(previousAvatar).catch(() => {});
      }

      setAvatar("");

      if (currentCadre) {
        const updatedCadre = { ...currentCadre, avatar: "" };
        setCurrentCadre(updatedCadre);

        const updatedCadres = cadres.map(c => c.id === currentCadre.id ? updatedCadre : c);
        await db.saveCadres(updatedCadres);
      }

      const savedUserStr = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          parsed.avatar = "";
          localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(parsed));
          window.dispatchEvent(new CustomEvent("pmii-profile-updated", { detail: parsed }));

          const users = await db.getUsers();
          const userIdx = users.findIndex(
            (u) => u.id === parsed.id || (u.email && u.email.toLowerCase() === parsed.email?.toLowerCase())
          );
          if (userIdx !== -1) {
            delete users[userIdx].avatar;
            await db.saveUsers(users);
          }
        } catch (e) {}
      }

      toast.success("Foto profil dihapus.");
    } catch (err) {
      console.error("Photo remove error:", err);
      toast.error("Gagal menghapus foto.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCadre) return;

    if (!name.trim()) {
      toast.error("Nama lengkap wajib diisi.");
      return;
    }

    try {
      setIsSaving(true);

      const updatedCadre: CadreFollowUp = {
        ...currentCadre,
        name: name.trim(),
        avatar: avatar,
        gender,
        nik: nik.trim(),
        ktpName: ktpName.trim(),
        tempatLahir: tempatLahir.trim(),
        tanggalLahir: tanggalLahir.trim(),
        alamatRumah: alamatRumah.trim(),
        alamatDomisili: address.trim(),
        address: address.trim(),
        golonganDarah,
        riwayatPenyakit: riwayatPenyakit.trim(),
        perguruanTinggi: perguruanTinggi.trim(),
        fakultas: fakultas.trim(),
        jurusan: jurusan.trim(),
        ktmName: ktmName.trim(),
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
        angkatan: angkatan.trim(),
        jabatan: jabatan.trim()
      };

      setCurrentCadre(updatedCadre);

      // Save Cadres Table
      const updatedCadres = cadres.map(c => c.id === currentCadre.id ? updatedCadre : c);
      await db.saveCadres(updatedCadres);

      // Sync Session and Users Table
      const savedUserStr = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (savedUserStr) {
        try {
          const loggedInUser = JSON.parse(savedUserStr);
          loggedInUser.name = name.trim();
          loggedInUser.avatar = avatar;
          loggedInUser.email = email.trim();
          loggedInUser.phone = phone.trim();
          loggedInUser.address = address.trim();
          loggedInUser.gender = gender;
          loggedInUser.nik = nik.trim();
          localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(loggedInUser));
          window.dispatchEvent(new CustomEvent("pmii-profile-updated", { detail: loggedInUser }));

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
          console.error("Error syncing session:", err);
        }
      }

      // Sync Boards Table if applicable
      try {
        const boards = await db.getBoards([]);
        let boardChanged = false;
        const updatedBoards = boards.map(b => {
          if (
            (currentCadre.id && b.user_id === currentCadre.id) ||
            (currentCadre.email && b.email?.toLowerCase().trim() === currentCadre.email.toLowerCase().trim()) ||
            (currentCadre.name && b.name?.toLowerCase().trim() === currentCadre.name.toLowerCase().trim())
          ) {
            boardChanged = true;
            return {
              ...b,
              name: name.trim(),
              avatar: avatar,
              phone: phone.trim(),
              email: email.trim(),
              position: jabatan.trim() || b.position
            };
          }
          return b;
        });
        if (boardChanged) {
          await db.saveBoards(updatedBoards);
        }
      } catch (err) {
        console.error("Error syncing boards:", err);
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

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    try {
      setIsSavingPassword(true);

      // Record in credentials store
      db.setUserPassword(
        [
          currentCadre?.id,
          currentCadre?.user_id,
          currentCadre?.email,
          currentCadre?.nik,
          currentCadre?.name
        ],
        newPassword
      );

      // Update cadre record
      if (currentCadre) {
        const updatedCadre = { ...currentCadre, password: newPassword };
        setCurrentCadre(updatedCadre);
        const updatedCadres = cadres.map(c => c.id === currentCadre.id ? updatedCadre : c);
        await db.saveCadres(updatedCadres);
      }

      // Update users
      const users = await db.getUsers();
      const userIdx = users.findIndex(
        (u) =>
          (currentCadre && u.id === currentCadre.id) ||
          (currentCadre?.user_id && u.user_id === currentCadre.user_id) ||
          (currentCadre?.email && u.email?.toLowerCase() === currentCadre.email.toLowerCase()) ||
          (currentCadre?.name && u.name?.toLowerCase().trim() === currentCadre.name.toLowerCase().trim())
      );
      if (userIdx !== -1) {
        users[userIdx] = {
          ...users[userIdx],
          password: newPassword
        };
        await db.saveUsers(users);
      }

      // Update active session
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

      if (isSupabaseConfigured && supabase) {
        try {
          const targetEmail = (currentCadre?.email || "").trim().toLowerCase();
          if (targetEmail.includes("@")) {
            await supabase.rpc("sync_user_to_auth", {
              p_email: targetEmail,
              p_password: newPassword,
              p_name: currentCadre?.name,
              p_role: currentCadre?.role || "admin",
              p_commissariat: currentCadre?.commissariat || "Ki Ageng Getas Pendawa"
            });
            await supabase.auth.signInWithPassword({
              email: targetEmail,
              password: newPassword
            });
          }
        } catch (supabaseErr) {
          console.warn("Supabase Auth password update error:", supabaseErr);
        }
      }
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Kata sandi berhasil diubah! Silakan gunakan kata sandi baru ini saat login.");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah kata sandi.");
    } finally {
      setIsSavingPassword(false);
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
    setAngkatan(currentCadre.angkatan || "");
    setJabatan(currentCadre.jabatan || "Pengurus");
    setIsEditing(false);
  };

  const handleDownloadCard = async () => {
    if (!currentCadre) return;
    setIsDownloading(true);
    try {
      await exportCardAsImage({
        type: "kta",
        name: currentCadre.name,
        idNumber: memberNTA,
        commissariat: currentCadre.commissariat || "Ki Ageng Getas Pendawa",
        level: currentCadre.level || "PENGURUS",
        startDate: memberStartDate
      });
      toast.success("KTA Digital berhasil diunduh!");
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
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Profil Belum Ditemukan</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Data akun pengurus tidak ditemukan dalam sistem. Silakan masuk kembali dengan akun Anda.
          </p>
        </div>
      </div>
    );
  }

  const userRoleNorm = (currentUser?.role || currentCadre.role || "pengurus").toLowerCase();
  const isAdmin = userRoleNorm === "admin";

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-zinc-900 dark:text-zinc-100 font-sans pb-12">
      {/* 1. TOP HEADER BANNER CARD */}
      <ProfileHeader
        currentCadre={currentCadre}
        isAdmin={isAdmin}
        avatar={avatar}
        isUploadingPhoto={isUploadingPhoto}
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
            isAdmin={isAdmin}
            memberNTA={memberNTA}
            memberStartDate={memberStartDate}
            jabatan={jabatan}
            qrCodeDataUrl={qrCodeDataUrl}
            isDownloading={isDownloading}
            onDownloadCard={handleDownloadCard}
          />
        </div>

        {/* RIGHT COLUMN: EDITABLE PROFILE DETAILS (7 Cols) */}
        <div className="lg:col-span-7" ref={formCardRef}>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-none">
              {/* Clean Underline Tabs Header with Edit Button */}
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
                <div className="flex gap-4 text-xs font-medium overflow-x-auto no-scrollbar">
                  {[
                    { id: "diri", label: "1. Data Diri & Medis", icon: User },
                    { id: "akademik", label: "2. Akademik & Kontak", icon: GraduationCap },
                    { id: "riwayat", label: "3. Riwayat Pendidikan", icon: Briefcase },
                    { id: "karakter", label: "4. Kepengurusan", icon: Compass },
                    { id: "keamanan", label: "5. Keamanan Sandi", icon: Lock },
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
                    setKtpName={setKtpName}
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
                    setKtmName={setKtmName}
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
                    angkatan={angkatan}
                    setAngkatan={setAngkatan}
                    jabatan={jabatan}
                    setJabatan={setJabatan}
                    orientasiProfetik={orientasiProfetik}
                    setOrientasiProfetik={setOrientasiProfetik}
                    minatPassion={minatPassion}
                    setMinatPassion={setMinatPassion}
                    motivasiMapaba={motivasiMapaba}
                    setMotivasiMapaba={setMotivasiMapaba}
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
                      if (activeTab === "keamanan") changeTab("karakter");
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
                    disabled={activeTab === "keamanan"}
                    onClick={() => {
                      if (activeTab === "diri") changeTab("akademik");
                      if (activeTab === "akademik") changeTab("riwayat");
                      if (activeTab === "riwayat") changeTab("karakter");
                      if (activeTab === "karakter") changeTab("keamanan");
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
      <SuccessDialog
        isOpen={isSuccessOpen}
        onOpenChange={setIsSuccessOpen}
      />
    </div>
  );
}
