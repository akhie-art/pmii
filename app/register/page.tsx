"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db, Kaderisasi, ensureEvaluationForRegistration } from "@/lib/db";
import type { UserRole, UserAccount } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { exportCardAsImage } from "@/lib/cardExporter";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Globe,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  UploadCloud,
  X,
  FileText,
  Download,
  Printer,
  Sun,
  Moon,
  Calendar,
  MapPin,
  Building,
  ShieldCheck,
  Check,
  UserCheck,
  CheckCircle2,
  QrCode,
  GraduationCap,
  Users,
  CreditCard,
  ClipboardCheck,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "file";
  required: boolean;
  options?: string[];
}

interface EventActivity {
  id: string;
  name: string;
  level: string;
  date: string;
  commissariat?: string;
  komisariat_id?: string | null;
  description: string;
  status: "OPEN" | "CLOSED";
  formFields?: FormField[];
}

interface ParticipantRegistration {
  id: string;
  eventId: string;
  cadreName: string;
  cadreEmail: string;
  dateApplied: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  notes: string;
  answers: Record<string, string>;
  verificationStatus: Record<string, boolean>;
  attendance?: string[];
  isGraduated?: boolean;
  registrationNumber?: string;
}

interface CadreSubmission {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  fileLink: string;
  date: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  feedback: string;
}

interface CadreFollowUp {
  id: string;
  user_id?: string;
  name: string;
  level: "MAPABA" | "PKD" | "PKL";
  commissariat: string;
  startDate: string;
  status: "AKTIF" | "SELESAI" | "REVISI";
  submissions: CadreSubmission[];
  phone?: string;
  email?: string;
  address?: string;
  instagram?: string;
  password?: string;
  isGraduated?: boolean;
  registrationNumber?: string;
  nta?: string;
  role?: UserRole;
}

const INDONESIA_UNIVERSITIES = [
  "Komisariat Ki Ageng Getas Pendawa",
  "UIN Walisongo",
  "Universitas Diponegoro (UNDIP)",
  "Universitas Negeri Semarang (UNNES)",
  "Universitas Semarang (USM)",
  "Universitas Islam Sultan Agung (UNISSULA)",
  "UPGRIS",
  "Lainnya"
];

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

export default function RegisterPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [step, setStep] = useState<number>(1);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [commissariat, setCommissariat] = useState("Komisariat Ki Ageng Getas Pendawa");
  const [level, setLevel] = useState<"MAPABA" | "PKD" | "PKL">("MAPABA");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [redirectParam, setRedirectParam] = useState("");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("PMII_THEME");
      if (savedTheme) {
        setDarkMode(savedTheme === "dark");
      } else {
        setDarkMode(document.documentElement.classList.contains("dark"));
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status flags
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [registeredNumber, setRegisteredNumber] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isGoogleAuthUser, setIsGoogleAuthUser] = useState(false);
  const [googleAvatar, setGoogleAvatar] = useState("");

  // Existing account detection states
  const [isExistingAccount, setIsExistingAccount] = useState(false);
  const [existingAccountName, setExistingAccountName] = useState("");
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isExistingPasswordVerified, setIsExistingPasswordVerified] = useState(false);
  const [existingCadreObj, setExistingCadreObj] = useState<any | null>(null);
  const [alreadyRegisteredData, setAlreadyRegisteredData] = useState<ParticipantRegistration | null>(null);

  const checkEventRegistrationStatus = async (targetEmail: string, eventId: string | null) => {
    if (!targetEmail || !eventId) {
      setAlreadyRegisteredData(null);
      return null;
    }
    try {
      const regList = await db.getRegistrations();
      const cleanEmail = targetEmail.trim().toLowerCase();
      const found = regList.find(
        (r) => r.eventId === eventId && (
          r.cadreEmail?.trim().toLowerCase() === cleanEmail ||
          (r as any).email?.trim().toLowerCase() === cleanEmail
        )
      );
      if (found) {
        setAlreadyRegisteredData(found);
        if (found.registrationNumber) {
          setRegisteredNumber(found.registrationNumber);
        }
        return found;
      } else {
        setAlreadyRegisteredData(null);
        return null;
      }
    } catch (err) {
      console.warn("Check event registration status error:", err);
      return null;
    }
  };

  const checkExistingAccount = async (targetEmail: string, isFromGoogle = false) => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setIsExistingAccount(false);
      setExistingAccountName("");
      setExistingCadreObj(null);
      setIsExistingPasswordVerified(false);
      setAlreadyRegisteredData(null);
      return;
    }

    if (targetEventId) {
      await checkEventRegistrationStatus(cleanEmail, targetEventId);
    }

    setIsVerifyingEmail(true);
    try {
      const [cadres, users] = await Promise.all([
        db.getCadres(),
        db.getUsers()
      ]);

      const matchedCadre = cadres.find(c => c.email?.trim().toLowerCase() === cleanEmail);
      const matchedUser = users.find(u => u.email?.trim().toLowerCase() === cleanEmail);

      if (matchedCadre || matchedUser) {
        const foundName = matchedCadre?.name || matchedUser?.name || "";
        const cleanFoundName = foundName.replace(/^Sahabat\s+/i, "").trim();
        const foundPhone = matchedCadre?.phone || "";
        const foundComm = matchedCadre?.commissariat || matchedUser?.commissariat || "";

        setIsExistingAccount(true);
        setExistingAccountName(cleanFoundName);
        setExistingCadreObj(matchedCadre || matchedUser);

        if (isFromGoogle) {
          // Dari Google OAuth: identitas sudah terverifikasi
          if (cleanFoundName && !name.trim()) setName(cleanFoundName);
          if (foundPhone && !phone.trim()) setPhone(foundPhone);
          if (foundComm && !commissariat.trim()) setCommissariat(foundComm);
          setIsExistingPasswordVerified(true);
        }
      } else {
        setIsExistingAccount(false);
        setExistingAccountName("");
        setExistingCadreObj(null);
        setIsExistingPasswordVerified(false);
      }
    } catch (err) {
      console.warn("Check existing account notice:", err);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  useEffect(() => {
    const checkCurrentUser = async () => {
      // 1. Cek sesi Supabase jika user baru saja login dari Google OAuth
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && user.email) {
            const gName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split("@")[0];
            const gAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";
            setName((prev) => prev || gName);
            setEmail(user.email);
            setIsGoogleAuthUser(true);
            setGoogleAvatar(gAvatar);
            if (user.user_metadata?.phone) {
              setPhone((prev) => prev || user.user_metadata.phone);
            }
            await checkExistingAccount(user.email, true);
            const currentParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
            const evId = currentParams?.get("event");
            if (evId) {
              await checkEventRegistrationStatus(user.email, evId);
            }
            return;
          }
        } catch (e) {
          console.warn("Session check notice on register:", e);
        }
      }

      // 2. Cek session tersimpan lokal
      const savedUserStr = typeof window !== "undefined" ? localStorage.getItem("PMII_LOGGED_IN_USER") : null;
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser?.email) {
            setEmail(savedUser.email);
            setName((prev) => prev || savedUser.name);
            if (savedUser.avatar) setGoogleAvatar(savedUser.avatar);
            if (savedUser.phone) setPhone((prev) => prev || savedUser.phone);
            if (savedUser.commissariat) setCommissariat((prev) => prev || savedUser.commissariat);
            setIsGoogleAuthUser(true);
            await checkExistingAccount(savedUser.email, true);
            const currentParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
            const evId = currentParams?.get("event");
            if (evId) {
              await checkEventRegistrationStatus(savedUser.email, evId);
            }
          }
        } catch (e) {}
      }
    };
    checkCurrentUser();
  }, []);

  useEffect(() => {
    if (!registeredNumber) {
      setQrCodeDataUrl("");
      return;
    }
    QRCode.toDataURL(registeredNumber, {
      width: 200,
      margin: 1,
      color: {
        dark: "#090d16",
        light: "#ffffff"
      }
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => {
        console.error("Local QR code generation error:", err);
      });
  }, [registeredNumber]);

  const handleGoogleRegister = async () => {
    setError("");
    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Koneksi autentikasi database belum aktif.");
      }

      // Simpan URL saat ini agar setelah dari Google, diarahkan kembali ke event yang sama
      if (typeof window !== "undefined") {
        sessionStorage.setItem("PMII_AUTH_REDIRECT", window.location.href);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?mode=register`
        }
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error("Google register error:", err);
      setError(
        err.message?.includes("provider")
          ? "Google OAuth belum diaktifkan di pengaturan Supabase (Auth > Providers > Google)."
          : (err.message || "Gagal menghubungi Google OAuth.")
      );
      setLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("PMII_LOGGED_IN_USER");
      localStorage.removeItem("PMII_ACTIVE_CADRE_ID");
    }
    setIsGoogleAuthUser(false);
    setGoogleAvatar("");
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setIsExistingAccount(false);
    setExistingAccountName("");
    setExistingCadreObj(null);
    setIsExistingPasswordVerified(false);
    setAlreadyRegisteredData(null);
    setStep(1);
  };

  // Dynamic custom event states
  const [targetEventId, setTargetEventId] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<EventActivity | null>(null);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [kaderisasiData, setKaderisasiData] = useState<Kaderisasi | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreviewFile = (url: string, title: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
    setIsPreviewOpen(true);
  };

  const handleFileUpload = async (fieldId: string, file: File) => {
    if (!file) return;

    setError("");
    setUploadingFields((prev) => ({ ...prev, [fieldId]: true }));
    setFileNames((prev) => ({ ...prev, [fieldId]: file.name }));

    try {
      let finalUrl = "";
      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split(".").pop();
        const eventFolder = targetEventId || "general";
        const filePath = `registrations/${eventFolder}/${fieldId}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (uploadError) {
          console.error("Supabase upload error, falling back:", uploadError.message);
          finalUrl = await readFileAsDataURL(file);
        } else {
          const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
          finalUrl = data.publicUrl;
        }
      } else {
        finalUrl = await readFileAsDataURL(file);
      }

      setCustomAnswers((prev) => ({ ...prev, [fieldId]: finalUrl }));
    } catch (err) {
      console.error("Failed to upload file", err);
      setError(`Gagal mengunggah berkas ${file.name}.`);
    } finally {
      setUploadingFields((prev) => ({ ...prev, [fieldId]: false }));
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.size < 2 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        resolve(URL.createObjectURL(file));
      }
    });
  };

  const syncAnswersWithData = (
    currentAnswers: Record<string, string>,
    targetName: string,
    targetPhone: string,
    targetEmail: string,
    cadre?: any,
    fields?: FormField[]
  ) => {
    const list = fields || eventDetails?.formFields || [];
    if (!list || list.length === 0) return currentAnswers;

    const next = { ...currentAnswers };
    list.forEach((f) => {
      const l = (f.label || "").toLowerCase();
      if (l.includes("nama")) {
        if (!next[f.id] || next[f.id].trim() === "" || next[f.id] === name) {
          next[f.id] = targetName;
        }
      } else if (l.includes("whatsapp") || l.includes("hp") || l.includes("telepon")) {
        if (!next[f.id] || next[f.id].trim() === "" || next[f.id] === phone) {
          next[f.id] = targetPhone;
        }
      } else if (l.includes("email")) {
        if (!next[f.id] || next[f.id].trim() === "" || next[f.id] === email) {
          next[f.id] = targetEmail;
        }
      } else if (cadre) {
        if ((l.includes("nik") || l.includes("nim")) && (cadre.nik || cadre.nim) && !next[f.id]) {
          next[f.id] = cadre.nik || cadre.nim;
        } else if (l.includes("kelamin") && !next[f.id]) {
          const g = cadre.gender || cadre.jenisKelamin;
          if (g === "L" || g === "Laki-laki") next[f.id] = "Laki-laki";
          else if (g === "P" || g === "Perempuan") next[f.id] = "Perempuan";
          else if (g) next[f.id] = g;
        } else if ((l.includes("tempat") || l.includes("lahir") || l.includes("ttl")) && !next[f.id]) {
          next[f.id] = cadre.ttl || `${cadre.tempatLahir || ""}, ${cadre.tanggalLahir || ""}`.trim();
        } else if (l.includes("alamat") && cadre.address && !next[f.id]) {
          next[f.id] = cadre.address;
        } else if ((l.includes("perguruan tinggi") || l.includes("kampus")) && cadre.perguruanTinggi && !next[f.id]) {
          next[f.id] = cadre.perguruanTinggi;
        } else if (l.includes("jurusan") && cadre.jurusan && !next[f.id]) {
          next[f.id] = cadre.jurusan;
        } else if (l.includes("fakultas") && cadre.fakultas && !next[f.id]) {
          next[f.id] = cadre.fakultas;
        }
      }
    });
    return next;
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (eventDetails?.formFields) {
      eventDetails.formFields.forEach((f) => {
        if ((f.label || "").toLowerCase().includes("nama")) {
          setCustomAnswers((prev) => ({ ...prev, [f.id]: val }));
        }
      });
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (eventDetails?.formFields) {
      eventDetails.formFields.forEach((f) => {
        const l = (f.label || "").toLowerCase();
        if (l.includes("whatsapp") || l.includes("hp") || l.includes("telepon")) {
          setCustomAnswers((prev) => ({ ...prev, [f.id]: val }));
        }
      });
    }
  };

  const getFieldIcon = (label: string, type: string) => {
    const l = (label || "").toLowerCase();
    if (type === "file") return <UploadCloud className="w-4 h-4 text-blue-500" />;
    if (l.includes("nama")) return <User className="w-4 h-4 text-blue-500" />;
    if (l.includes("nik") || l.includes("nim") || l.includes("ktp")) return <CreditCard className="w-4 h-4 text-blue-500" />;
    if (l.includes("kelamin")) return <Users className="w-4 h-4 text-blue-500" />;
    if (l.includes("lahir") || l.includes("tanggal") || l.includes("ttl")) return <Calendar className="w-4 h-4 text-blue-500" />;
    if (l.includes("phone") || l.includes("wa") || l.includes("hp") || l.includes("telepon")) return <Phone className="w-4 h-4 text-blue-500" />;
    if (l.includes("email")) return <Mail className="w-4 h-4 text-blue-500" />;
    if (l.includes("kampus") || l.includes("perguruan") || l.includes("jurusan") || l.includes("fakultas")) return <GraduationCap className="w-4 h-4 text-blue-500" />;
    if (l.includes("alamat") || l.includes("domisili") || l.includes("kota")) return <MapPin className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  const isAutoSyncedField = (label: string) => {
    const l = (label || "").toLowerCase();
    return (
      (l.includes("nama") && !!name) ||
      ((l.includes("whatsapp") || l.includes("hp") || l.includes("telepon")) && !!phone) ||
      (l.includes("email") && !!email) ||
      (existingCadreObj && (
        ((l.includes("nik") || l.includes("nim")) && !!(existingCadreObj.nik || existingCadreObj.nim)) ||
        (l.includes("kelamin") && !!(existingCadreObj.gender || existingCadreObj.jenisKelamin)) ||
        ((l.includes("tempat") || l.includes("lahir") || l.includes("ttl")) && !!(existingCadreObj.ttl || existingCadreObj.tempatLahir))
      ))
    );
  };

  useEffect(() => {
    const loadEvents = async () => {
      setMounted(true);

      if (typeof window !== "undefined") {
        router.prefetch("/anggota/kegiatan");
        router.prefetch("/peserta/kegiatan");
        router.prefetch("/kader/kegiatan");
        router.prefetch("/anggota");
        router.prefetch("/peserta");
        router.prefetch("/kader");
        router.prefetch("/login");

        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");
        if (redirect) {
          setRedirectParam(redirect);
        }

        const commParam = params.get("commissariat") || params.get("komisariat");
        if (commParam) {
          setCommissariat(commParam);
        }

        let eventId = params.get("event");
        if (!eventId && redirect) {
          const match = redirect.match(/event=([^&]+)/);
          if (match && match[1]) {
            eventId = decodeURIComponent(match[1]);
          }
        }

        if (eventId) {
          setTargetEventId(eventId);

          // Cek apakah user saat ini sudah pernah terdaftar di kegiatan ini
          const savedStr = typeof window !== "undefined" ? localStorage.getItem("PMII_LOGGED_IN_USER") : null;
          let mailToCheck = email;
          if (savedStr) {
            try {
              mailToCheck = JSON.parse(savedStr)?.email || email;
            } catch (e) {}
          }
          if (mailToCheck) {
            await checkEventRegistrationStatus(mailToCheck, eventId);
          }

          const events = await db.getEvents();
          const foundEvent = events.find((e: any) => e.id === eventId);
          if (foundEvent) {
            setEventDetails(foundEvent);
            setCommissariat(foundEvent.commissariat || "PMII Grobogan");
            setLevel(foundEvent.level as "MAPABA" | "PKD" | "PKL");

            const initialAnswers: Record<string, string> = {};
            (foundEvent.formFields || []).forEach((field: any) => {
              initialAnswers[field.id] = "";
            });
            setCustomAnswers(syncAnswersWithData(initialAnswers, name, phone, mailToCheck, null, foundEvent.formFields));

            // Fetch curriculum syllabus and module
            try {
              const kList = await db.getKaderisasi();
              const foundK = kList.find(
                (k: any) => k.nama.trim().toUpperCase() === foundEvent.level.trim().toUpperCase()
              );
              if (foundK) {
                setKaderisasiData(foundK);
                const activeFields = foundK.formFields || [];
                foundEvent.formFields = activeFields;
                const syncedAnswers: Record<string, string> = {};
                activeFields.forEach((field: any) => {
                  syncedAnswers[field.id] = "";
                });
                setCustomAnswers(syncAnswersWithData(syncedAnswers, name, phone, mailToCheck, null, activeFields));
                setEventDetails({ ...foundEvent, formFields: activeFields });
              }
            } catch (err) {
              console.error("Failed to load matching Kaderisasi details", err);
            }
          }
        }
      }
    };
    loadEvents();
  }, []);

  const handleNextStep = async () => {
    setError("");

    if (!email.trim()) return setError("Alamat email harus diisi.");

    // Cek apakah akun ada jika belum dicek
    let accountExists = isExistingAccount;
    let cadreObj = existingCadreObj;
    if (!accountExists) {
      const [cadres, users] = await Promise.all([db.getCadres(), db.getUsers()]);
      const matchedCadre = cadres.find(c => c.email?.trim().toLowerCase() === email.trim().toLowerCase());
      const matchedUser = users.find(u => u.email?.trim().toLowerCase() === email.trim().toLowerCase());
      if (matchedCadre || matchedUser) {
        accountExists = true;
        cadreObj = matchedCadre || matchedUser;
        setIsExistingAccount(true);
        setExistingCadreObj(cadreObj);
        setExistingAccountName(cadreObj.name || "");
      }
    }

    if (accountExists && !isGoogleAuthUser) {
      if (!password) {
        return setError("Silakan masukkan kata sandi akun Anda untuk memverifikasi profil.");
      }

      setLoading(true);
      try {
        let isValid = false;

        // 1. Verifikasi dengan Supabase Auth
        if (isSupabaseConfigured && supabase) {
          try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
              email: email.trim().toLowerCase(),
              password: password.trim()
            });
            if (authData?.user && !authError) {
              isValid = true;
            }
          } catch (e) {}
        }

        // 2. Verifikasi dengan database lokal credential store
        if (!isValid) {
          const localPwd = db.getUserPassword(email.trim().toLowerCase()) 
            || (cadreObj?.user_id && db.getUserPassword(cadreObj.user_id))
            || (cadreObj?.id && db.getUserPassword(cadreObj.id));
          if (localPwd && localPwd === password.trim()) {
            isValid = true;
          } else if (cadreObj?.password && cadreObj.password === password.trim()) {
            isValid = true;
          }
        }

        if (!isValid) {
          setError("Kata sandi salah. Silakan periksa kembali kata sandi akun Anda.");
          setLoading(false);
          return;
        }

        setIsExistingPasswordVerified(true);
        // Otomatis tarik data anggota yang sudah tersimpan jika field belum diisi
        if (cadreObj?.name && !name.trim()) {
          const cleanName = cadreObj.name.replace(/^Sahabat\s+/i, "");
          setName(cleanName);
        }
        if (cadreObj?.phone && !phone.trim()) setPhone(cadreObj.phone);
        if (cadreObj?.commissariat && !commissariat.trim()) setCommissariat(cadreObj.commissariat);

        // Jika bukan pendaftaran event spesifik, ingatkan bahwa akun sudah terdaftar
        if (!targetEventId) {
          setError("Akun Anda sudah terdaftar di sistem. Silakan langsung masuk melalui halaman login.");
          setLoading(false);
          return;
        }

        // Cek apakah sudah terdaftar pada kegiatan ini
        const regList = await db.getRegistrations();
        const alreadyReg = regList.find(
          r => r.eventId === targetEventId && (
            r.cadreEmail?.toLowerCase() === email.toLowerCase() ||
            (r as any).email?.toLowerCase() === email.toLowerCase()
          )
        );
        if (alreadyReg) {
          setAlreadyRegisteredData(alreadyReg);
          if (alreadyReg.registrationNumber) setRegisteredNumber(alreadyReg.registrationNumber);
          setLoading(false);
          return;
        }

        setCustomAnswers((prev) => syncAnswersWithData(prev, name, phone, email, cadreObj, eventDetails?.formFields));
        setCustomAnswers((prev) => syncAnswersWithData(prev, name, phone, email, null, eventDetails?.formFields));
      setStep(2);
      } catch (err) {
        console.error("Password verification error:", err);
        setError("Gagal memverifikasi kata sandi.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Akun baru atau via Google Auth
    if (!name.trim()) return setError("Nama Lengkap harus diisi.");
    if (!phone.trim()) return setError("Nomor WhatsApp harus diisi.");
    if (!isGoogleAuthUser) {
      if (!password) return setError("Kata sandi harus diisi.");
      if (password !== confirmPassword) return setError("Konfirmasi sandi tidak cocok dengan kata sandi.");
      if (password.length < 6) return setError("Kata sandi harus minimal 6 karakter.");
    }

    setLoading(true);
    try {
      const cadresList = await db.getCadres();
      const isDuplicate = cadresList.some(c => c.email?.toLowerCase() === email.toLowerCase());
      if (isDuplicate && !isGoogleAuthUser) {
        setError("Alamat email sudah terdaftar. Masukkan kata sandi akun Anda untuk menghubungkan data profil.");
        setIsExistingAccount(true);
        setLoading(false);
        return;
      }

      if (targetEventId) {
        const regList = await db.getRegistrations();
        const alreadyReg = regList.find(
          r => r.eventId === targetEventId && (
            r.cadreEmail?.toLowerCase() === email.toLowerCase() ||
            (r as any).email?.toLowerCase() === email.toLowerCase()
          )
        );
        if (alreadyReg) {
          setAlreadyRegisteredData(alreadyReg);
          if (alreadyReg.registrationNumber) setRegisteredNumber(alreadyReg.registrationNumber);
          setLoading(false);
          return;
        }
      }

      setCustomAnswers((prev) => syncAnswersWithData(prev, name, phone, email, null, eventDetails?.formFields));
      setStep(2);
    } catch (err) {
      console.error("Validation error", err);
      setError("Terjadi kesalahan saat memeriksa akun.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (eventDetails && eventDetails.formFields && eventDetails.formFields.length > 0 && step === 1) {
      await handleNextStep();
      return;
    }

    if (!name.trim()) return setError("Nama Lengkap harus diisi.");
    if (!email.trim()) return setError("Alamat email harus diisi.");
    if (!phone.trim()) return setError("Nomor WhatsApp harus diisi.");
    if (!isGoogleAuthUser && !isExistingAccount) {
      if (password !== confirmPassword) return setError("Konfirmasi sandi tidak cocok dengan kata sandi.");
      if (password.length < 6) return setError("Kata sandi harus minimal 6 karakter.");
    }

    if (eventDetails && eventDetails.formFields && eventDetails.formFields.length > 0) {
      for (const field of eventDetails.formFields) {
        if (field.required && !customAnswers[field.id]?.trim()) {
          setError(`Persyaratan "${field.label}" harus diisi.`);
          return;
        }
      }
    }

    setLoading(true);

    try {
      const cadresList = await db.getCadres();
      const isDuplicate = cadresList.some(c => c.email?.toLowerCase() === email.toLowerCase());
      if (isDuplicate && !isGoogleAuthUser && !isExistingAccount) {
        setError("Alamat email sudah terdaftar. Masukkan kata sandi akun Anda untuk menghubungkan profil.");
        setLoading(false);
        return;
      }

      const hasEvent = Boolean(targetEventId && eventDetails);
      if (hasEvent) {
        const regList = await db.getRegistrations();
        const alreadyReg = regList.find(
          r => r.eventId === targetEventId && (
            r.cadreEmail?.toLowerCase() === email.toLowerCase() ||
            (r as any).email?.toLowerCase() === email.toLowerCase()
          )
        );
        if (alreadyReg) {
          setAlreadyRegisteredData(alreadyReg);
          if (alreadyReg.registrationNumber) setRegisteredNumber(alreadyReg.registrationNumber);
          setLoading(false);
          return;
        }
      }

      const regNo = hasEvent ? `${level.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}` : undefined;
      if (regNo) {
        setRegisteredNumber(regNo);
        try {
          const generatedQr = await QRCode.toDataURL(regNo, {
            width: 200,
            margin: 1,
            color: {
              dark: "#090d16",
              light: "#ffffff"
            }
          });
          setQrCodeDataUrl(generatedQr);
        } catch (qrErr) {
          console.warn("Pre-generating QR code warning:", qrErr);
        }
      }

      const formattedName = name.replace(/^Sahabat\s+/i, "").trim();
      const userRole: UserRole = level !== "MAPABA" ? "anggota" : "peserta";

      // 1. Sinkronisasi dengan Supabase Auth (auth.users sebagai Master Identity)
      let authUserId: string | undefined = existingCadreObj?.user_id || existingCadreObj?.id;
      const effectivePassword = password.trim() || `GoogleAuth_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      if (isSupabaseConfigured && supabase && !isExistingAccount) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user?.id) {
            authUserId = userData.user.id;
          } else {
            const { data: authData, error: authError } = await supabase.auth.signUp({
              email: email.trim().toLowerCase(),
              password: effectivePassword,
              options: {
                data: {
                  full_name: formattedName,
                  commissariat: commissariat,
                  level: level,
                  role: userRole
                }
              }
            });
            if (authError && !authError.message?.toLowerCase().includes("already registered")) {
              console.warn("Supabase Auth registration notice:", authError.message);
            } else if (authData?.user) {
              authUserId = authData.user.id;
            }
          }
        } catch (authException) {
          console.warn("Supabase Auth connection notice:", authException);
        }
      }
      
      // 2. Simpan kredensial kata sandi ke credential store jika akun baru
      if (!isExistingAccount) {
        db.setUserPassword([authUserId, email.trim().toLowerCase(), formattedName, regNo], effectivePassword);
      }

      // 3. Rekam akun pengguna di tabel users sistem jika belum ada
      const existingUsers = await db.getUsers();
      let activeUserId = authUserId || `usr-${Date.now()}`;
      if (!isExistingAccount) {
        const newUserAccount: UserAccount = {
          id: activeUserId,
          user_id: authUserId,
          name: formattedName,
          email: email.trim().toLowerCase(),
          role: userRole,
          commissariat: commissariat,
          status: "AKTIF",
          createdAt: new Date().toISOString()
        };
        await db.saveUsers([...existingUsers.filter(u => u.email?.toLowerCase() !== email.trim().toLowerCase()), newUserAccount]);
      } else {
        activeUserId = existingCadreObj?.user_id || existingCadreObj?.id || activeUserId;
      }

      // 4. ATURAN ORGANISASI: Data pendaftar MAPABA BARU berstatus PESERTA dan BELUM masuk ke tabel anggota.
      //    Jika sudah merupakan akun anggota yang terdaftar (existing account), update nama yang diedit.
      let createdCadre: CadreFollowUp | null = existingCadreObj || null;
      if (isExistingAccount && existingCadreObj) {
        const updatedList = cadresList.map(c => {
          if (c.email?.toLowerCase() === email.trim().toLowerCase() || c.id === existingCadreObj.id) {
            return {
              ...c,
              name: formattedName,
              phone: phone.trim() || c.phone
            };
          }
          return c;
        });
        await db.saveCadres(updatedList);
        createdCadre = { ...existingCadreObj, name: formattedName, phone: phone.trim() || existingCadreObj.phone };
      } else if (!isExistingAccount && level !== "MAPABA") {
        const newCadre: CadreFollowUp = {
          id: `cadre-${Date.now()}`,
          user_id: authUserId,
          name: formattedName,
          level: level,
          commissariat: commissariat,
          startDate: new Date().toISOString().split("T")[0],
          status: "AKTIF",
          submissions: [],
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          address: `Komisariat ${commissariat}`,
          isGraduated: true,
          registrationNumber: regNo,
          role: "anggota"
        };
        createdCadre = newCadre;
        const updatedList = [...cadresList, newCadre];
        await db.saveCadres(updatedList);
      }

      // 5. Simpan data pendaftaran kegiatan (tabel pendaftaran)
      const registrationsList = await db.getRegistrations();
      const initialVerificationStatus: Record<string, boolean> = {};
      if (eventDetails) {
        (eventDetails.formFields || []).forEach((field) => {
          initialVerificationStatus[field.id] = true;
        });
      }

      let effectiveEventId = targetEventId;
      if (!effectiveEventId) {
        const events = await db.getEvents();
        const mapabaEvent = events.find(e => e.level === "MAPABA");
        effectiveEventId = mapabaEvent?.id || "act-mapaba";
      }

      const newRegistration: ParticipantRegistration = {
        id: `reg-${Date.now()}`,
        eventId: effectiveEventId,
        cadreName: formattedName,
        cadreEmail: email.trim().toLowerCase(),
        dateApplied: new Date().toISOString().split("T")[0],
        status: "APPROVED",
        notes: isExistingAccount ? "Pendaftaran anggota terverifikasi berhasil direkam." : "Pendaftaran calon peserta berhasil direkam.",
        answers: customAnswers,
        verificationStatus: initialVerificationStatus,
        registrationNumber: regNo,
        attendance: [],
        isGraduated: existingCadreObj?.isGraduated ?? (level !== "MAPABA")
      };

      await db.saveRegistrations([...registrationsList, newRegistration]);

      try {
        await ensureEvaluationForRegistration(newRegistration, null, createdCadre);
      } catch (evalErr) {
        console.warn("Failed to auto-sync evaluation on public register:", evalErr);
      }

      // Simpan session lokal jika akun terverifikasi (Google atau Akun Anggota yang sudah ada)
      if (isGoogleAuthUser || isExistingAccount) {
        const loggedInSession = {
          id: activeUserId,
          user_id: activeUserId,
          name: formattedName,
          email: email.trim().toLowerCase(),
          role: existingCadreObj?.role || userRole,
          commissariat: existingCadreObj?.commissariat || commissariat,
          status: "active" as const,
          avatar: googleAvatar || existingCadreObj?.avatar || "",
          needsOnboarding: false,
          allowedMenus: ["/kader", "/kader/kegiatan", "/kader/materi", "/kader/profil", "/kader/laporan"]
        };
        localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(loggedInSession));
        localStorage.setItem("PMII_ACTIVE_CADRE_ID", activeUserId);
        localStorage.setItem("PMII_ACTIVE_COMMISSARIAT", loggedInSession.commissariat);
      }

      setLoading(false);
      setIsSuccessOpen(true);
    } catch (err) {
      console.error("Failed to register", err);
      setError("Terjadi kesalahan koneksi database.");
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setIsSuccessOpen(false);
    const effectiveRole = (existingCadreObj?.role || (level !== "MAPABA" ? "anggota" : "peserta")).toLowerCase();
    const defaultTarget = `/${effectiveRole}/kegiatan`;
    if (isGoogleAuthUser || isExistingAccount) {
      router.push(redirectParam || defaultTarget);
    } else {
      const target = redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : `/login?redirect=${encodeURIComponent(defaultTarget)}`;
      router.push(target);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse space-y-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 mx-auto" />
          <div className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-4 sm:p-6 font-sans transition-colors duration-200">
      
      {/* TOP BAR */}
      <div className="w-full max-w-2xl mx-auto flex items-center justify-between py-2">
        <Link
          href={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : "/login"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Login</span>
        </Link>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? "Mode Terang" : "Mode Gelap"}
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer"
          aria-label="Toggle theme"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-blue-600" />
          )}
        </button>
      </div>

      <div className="w-full max-w-2xl mx-auto my-auto space-y-4 sm:space-y-5">
        {/* REGISTRATION CARD */}
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-7 shadow-sm transition-colors duration-300">
          
          <div className="space-y-5">
            
            {/* 1. HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3.5 gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {eventDetails ? "Formulir Pendaftaran Kegiatan" : "Daftar Akun Kader"}
                  </h1>
                  {eventDetails && (
                    <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60 text-[10px] font-bold uppercase py-0.5 px-2">
                      {eventDetails.level}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {eventDetails 
                    ? `Silakan lengkapi formulir pendaftaran untuk mengikuti ${eventDetails.name}` 
                    : "Lengkapi data keanggotaan Anda secara lengkap"}
                </p>
              </div>
            </div>

            {/* 2. EVENT CONTEXT HERO BANNER (JIKA MENDAFTAR KEGIATAN) */}
            {eventDetails && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-blue-50/60 via-zinc-50 to-white dark:from-zinc-950/80 dark:via-zinc-900 dark:to-zinc-900 border border-blue-200/60 dark:border-zinc-800 space-y-2.5 shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                      Agenda Terpilih:
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug break-words">
                      {eventDetails.name}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {eventDetails.description || "Pelatihan kaderisasi resmi untuk mengasah kapasitas intelektual dan kepemimpinan."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                    <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">
                      {eventDetails.commissariat || commissariat}
                    </span>
                  </div>
                  {eventDetails.date && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{eventDetails.date}</span>
                    </div>
                  )}
                  {(eventDetails as any).location && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate max-w-[160px]">{(eventDetails as any).location}</span>
                    </div>
                  )}
                </div>

                {/* Optional Modul & Silabus Section */}
                {kaderisasiData && (kaderisasiData.syllabus || kaderisasiData.modul) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 flex-wrap text-xs">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase">Materi:</span>
                    {kaderisasiData.syllabus && (
                      <button
                        type="button"
                        onClick={() => handlePreviewFile(kaderisasiData.syllabus!.fileUrl, `Silabus ${kaderisasiData.nama}`)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> Silabus
                      </button>
                    )}
                    {kaderisasiData.modul && (
                      <button
                        type="button"
                        onClick={() => handlePreviewFile(kaderisasiData.modul!.fileUrl, `Modul ${kaderisasiData.nama}`)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer ml-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> Modul
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* JIKA SUDAH TERDAFTAR: TAMPILKAN STATUS PENDAFTARAN & KARTU PESERTA */}
            {alreadyRegisteredData ? (
              <div className="space-y-5">
                {/* 1. STATUS HEADER */}
                <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Status: Terdaftar Resmi
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white pt-1">
                      Anda Sudah Terdaftar pada Kegiatan Ini
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                      Pendaftaran Anda untuk kegiatan <strong className="text-zinc-900 dark:text-zinc-200">{eventDetails?.name || "kegiatan ini"}</strong> sudah tercatat aktif di sistem keanggotaan.
                    </p>
                  </div>
                </div>

                {/* 2. DETAIL KARTU REGISTRASI */}
                <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3.5">
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200/80 dark:border-zinc-800">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Rincian Data Pendaftaran
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      alreadyRegisteredData.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        : alreadyRegisteredData.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300"
                    }`}>
                      {alreadyRegisteredData.status === "APPROVED"
                        ? "✓ Terverifikasi / Lolos"
                        : alreadyRegisteredData.status === "REJECTED"
                        ? "✕ Ditolak"
                        : "⏳ Menunggu Screening"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-zinc-400 block">No. Registrasi</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-white text-xs sm:text-sm truncate block">
                        {alreadyRegisteredData.registrationNumber || registeredNumber || "REG-TERCATAT"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Tanggal Mendaftar</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm truncate block">
                        {alreadyRegisteredData.dateApplied || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Nama Peserta</span>
                      <span className="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm truncate block">
                        {alreadyRegisteredData.cadreName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Email Terdaftar</span>
                      <span className="font-medium text-zinc-600 dark:text-zinc-400 truncate block text-xs">
                        {alreadyRegisteredData.cadreEmail}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. TOMBOL TINDAKAN */}
                <div className="space-y-2.5 pt-1">
                  <Button
                    type="button"
                    onClick={() => router.push(`/${(existingCadreObj?.role || (level !== "MAPABA" ? "anggota" : "peserta")).toLowerCase()}/kegiatan?event=${targetEventId}`)}
                    className="w-full h-11 sm:h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Buka Halaman Alur & Tahap Kegiatan</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setRegisteredNumber(alreadyRegisteredData.registrationNumber || "");
                        setIsSuccessOpen(true);
                      }}
                      className="h-10 sm:h-11 rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                      <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Lihat Kartu Peserta</span>
                    </Button>

                    {(eventDetails as any)?.waGroupLink ? (
                      <a
                        href={(eventDetails as any).waGroupLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 sm:h-11 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span>Grup WhatsApp</span>
                      </a>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(`/${(existingCadreObj?.role || (level !== "MAPABA" ? "anggota" : "peserta")).toLowerCase()}`)}
                        className="h-10 sm:h-11 rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      >
                        <span>Buka Dashboard Utama</span>
                      </Button>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">Ingin mendaftar untuk peserta lain?</span>
                    <button
                      type="button"
                      onClick={() => {
                        handleDisconnectGoogle();
                        setAlreadyRegisteredData(null);
                        setStep(1);
                      }}
                      className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                    >
                      Daftar Akun Lain
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
            {/* 3. SLEEK STEPPER (JIKA MULTI-STEP) */}
            {eventDetails && eventDetails.formFields && eventDetails.formFields.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl select-none">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    step === 1
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    step > 1
                      ? "bg-emerald-500 text-white"
                      : "bg-blue-600 text-white"
                  }`}>
                    {step > 1 ? "✓" : "1"}
                  </span>
                  <span className="truncate">Informasi Akun</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (step === 1) handleNextStep();
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    step === 2
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    step === 2
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                  }`}>
                    2
                  </span>
                  <span className="truncate">Formulir & Persyaratan</span>
                </button>
              </div>
            )}

            {/* 4. GOOGLE REGISTRATION BUTTON / ACTIVE USER BADGE (TAHAP 1) */}
            {step === 1 && (
              isGoogleAuthUser ? (
                <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {googleAvatar ? (
                      <img src={googleAvatar} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-emerald-400/80 shadow-2xs" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        <GoogleIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{name}</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800">
                          Google Terhubung
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate block mt-0.5">{email}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectGoogle}
                    className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 h-8 px-2.5 rounded-lg border-zinc-200 dark:border-zinc-700 cursor-pointer shrink-0"
                  >
                    Ganti
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={handleGoogleRegister}
                    className="w-full h-11 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all duration-150 cursor-pointer bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 shadow-xs"
                  >
                    <GoogleIcon className="w-4 h-4" />
                    <span>Daftar Cepat dengan Akun Google</span>
                  </Button>

                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-100 dark:border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase">
                      <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-400 dark:text-zinc-500 font-semibold">
                        Atau lengkapi formulir manual
                      </span>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* ERROR ALERT */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-medium rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <div>{error}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleRegister} className="space-y-5">
              
              {/* STEP 1: INFORMASI AKUN */}
              {step === 1 && (
                <div className="space-y-5">
                  {/* EXISTING ACCOUNT DETECTED BANNER */}
                  {isExistingAccount && !isGoogleAuthUser && (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex items-start gap-3 shadow-xs">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-100">
                            Akun Anggota Terdeteksi: {existingAccountName || "Kader PMII"}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-300/80 dark:border-blue-800">
                            Terdaftar di Database
                          </span>
                        </div>
                        <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-1 leading-relaxed">
                          {isExistingPasswordVerified
                            ? "Kata sandi Anda telah diverifikasi. Data profil anggota telah otomatis dihubungkan untuk pendaftaran ini."
                            : targetEventId
                            ? "Alamat email ini sudah terdaftar sebagai anggota. Cukup masukkan kata sandi Anda untuk menghubungkan data profil dan mendaftar kegiatan ini."
                            : "Alamat email ini sudah terdaftar. Masukkan kata sandi akun Anda."}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-400 tracking-wider">Alamat Email</label>
                        {isVerifyingEmail ? (
                          <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                            <div className="w-2.5 h-2.5 border border-zinc-400 border-t-transparent rounded-full animate-spin" />
                            Memeriksa...
                          </span>
                        ) : isGoogleAuthUser ? (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            ✓ Terverifikasi Google
                          </span>
                        ) : isExistingAccount ? (
                          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Akun Terdaftar
                          </span>
                        ) : null}
                      </div>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                        <Input
                          type="email"
                          required
                          disabled={loading || isGoogleAuthUser}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (isExistingAccount) {
                              setIsExistingAccount(false);
                              setExistingAccountName("");
                              setExistingCadreObj(null);
                              setIsExistingPasswordVerified(false);
                            }
                          }}
                          onBlur={() => checkExistingAccount(email, false)}
                          placeholder="sahabat@domain.com"
                          className="text-sm pl-10 bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800/80 rounded-xl h-11 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors disabled:opacity-80 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-400 tracking-wider">Nama Lengkap</label>
                        {isExistingPasswordVerified && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            ✓ Profil Dihubungkan
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                        <Input
                          required
                          disabled={loading}
                          value={name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="Ahmad Fudholi"
                          className="text-sm pl-10 bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800/80 rounded-xl h-11 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-400 tracking-wider">Nomor WhatsApp</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                        <Input
                          required
                          disabled={loading}
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          placeholder="081234567890"
                          className="text-sm pl-10 bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800/80 rounded-xl h-11 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                        />
                      </div>
                    </div>

                    {!isGoogleAuthUser && isExistingAccount ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-400 tracking-wider">Kata Sandi Akun</label>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Verifikasi Anggota</span>
                        </div>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            required
                            disabled={loading}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Masukkan kata sandi akun Anda"
                            className="text-sm pl-10 pr-10 bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800/80 rounded-xl h-11 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 focus:outline-none transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {!isGoogleAuthUser && !isExistingAccount ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-400 tracking-wider">Kata Sandi Baru</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            required
                            disabled={loading}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimal 6 karakter"
                            className="text-sm pl-10 pr-10 bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800/80 rounded-xl h-11 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 focus:outline-none transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-400 tracking-wider">Konfirmasi Sandi</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            disabled={loading}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ulangi kata sandi"
                            className="text-sm pl-10 pr-10 bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800/80 rounded-xl h-11 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 focus:outline-none transition-colors cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : isGoogleAuthUser ? (
                    <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Autentikasi akun Anda terhubung dan diamankan oleh Google. Anda tidak perlu memasukkan kata sandi.</span>
                    </div>
                  ) : null}

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm h-11 sm:h-12 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Memproses...</span>
                        </div>
                      ) : (
                        <>
                          <span>{eventDetails && eventDetails.formFields && eventDetails.formFields.length > 0 ? "Lanjut ke Formulir & Persyaratan" : "Selesaikan Pendaftaran"}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: DYNAMIC PERSYARATAN */}
              {step === 2 && eventDetails && eventDetails.formFields && eventDetails.formFields.length > 0 && (
                <div className="space-y-6">
                  {/* Section Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <ClipboardCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                          Formulir & Dokumen Persyaratan
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Lengkapi data screening dan berkas persyaratan untuk kegiatan ini.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                      {eventDetails.formFields.length} Kolom
                    </span>
                  </div>

                  {/* Form Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {eventDetails.formFields.map((field) => {
                      const value = customAnswers[field.id] || "";
                      const handleChange = (val: string | null) =>
                        setCustomAnswers((prev) => ({ ...prev, [field.id]: val || "" }));
                      const isFullWidth = field.type === "textarea" || field.type === "file";
                      const autoSynced = isAutoSyncedField(field.label);

                      return (
                        <div
                          key={field.id}
                          className={`space-y-2 ${isFullWidth ? "md:col-span-2" : "md:col-span-1"}`}
                        >
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-400 tracking-wider block">
                              {field.label} {field.required && <span className="text-rose-500">*</span>}
                            </label>
                            {autoSynced && value && (
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1">
                                ✓ Sesuai Akun
                              </span>
                            )}
                          </div>

                          {field.type === "textarea" ? (
                            <div className="relative">
                              <textarea
                                required={field.required}
                                disabled={loading}
                                value={value}
                                onChange={(e) => handleChange(e.target.value)}
                                placeholder={`Ketik ${field.label.toLowerCase()}...`}
                                className="w-full text-sm p-3.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl h-24 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 resize-none transition-colors"
                              />
                            </div>
                          ) : field.type === "select" ? (
                            <Select value={value} onValueChange={handleChange}>
                              <SelectTrigger className="text-sm bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800/80 rounded-xl h-11 text-zinc-900 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors">
                                <div className="flex items-center gap-2.5 truncate">
                                  <span className="text-zinc-400 dark:text-zinc-500 shrink-0">
                                    {getFieldIcon(field.label, field.type)}
                                  </span>
                                  <SelectValue placeholder={`Pilih ${field.label}...`} />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#090d16] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-xl">
                                {((field.options && field.options.length > 0)
                                  ? field.options
                                  : (field.label || "").toLowerCase().includes("kelamin")
                                  ? ["Laki-laki", "Perempuan"]
                                  : []
                                ).map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === "file" ? (
                            <div className="space-y-2">
                              {value ? (
                                <div className="flex items-center justify-between p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                                      <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                        {fileNames[field.id] || "Berkas Terunggah"}
                                      </span>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ Siap Dikirim</span>
                                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                        <a
                                          href={value}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                          Lihat Berkas ↗
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      handleChange("");
                                      setFileNames((prev) => ({ ...prev, [field.id]: "" }));
                                    }}
                                    className="h-9 w-9 p-0 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                    title="Hapus dan unggah ulang"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full py-6 px-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 bg-zinc-50/60 dark:bg-zinc-950/30 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 rounded-xl cursor-pointer transition-all group">
                                  <div className="flex flex-col items-center justify-center space-y-2 text-center">
                                    {uploadingFields[field.id] ? (
                                      <>
                                        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Mengunggah berkas...</p>
                                      </>
                                    ) : (
                                      <>
                                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                          <UploadCloud className="w-5 h-5" />
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                                            Pilih atau Tarik Dokumen / File ke Sini
                                          </p>
                                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">
                                            Format PDF, JPG, PNG, atau DOCX (Maksimal 2 MB)
                                          </p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <input
                                    type="file"
                                    disabled={uploadingFields[field.id] || loading}
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    onChange={(e) => e.target.files?.[0] && handleFileUpload(field.id, e.target.files[0])}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                                {getFieldIcon(field.label, field.type)}
                              </div>
                              <Input
                                required={field.required}
                                disabled={loading}
                                type="text"
                                value={value}
                                onChange={(e) => handleChange(e.target.value)}
                                placeholder={`Masukkan ${field.label.toLowerCase()}...`}
                                className="text-sm pl-10 bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800/80 rounded-xl h-11 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Notice Info */}
                  <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 rounded-xl flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      Data formulir dan berkas yang Anda kirimkan akan diverifikasi oleh panitia dan pengurus pada tahap <strong>Screening Berkas</strong> kegiatan ini.
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="h-11 sm:h-12 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1.5" /> Kembali ke Akun
                    </Button>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-11 sm:h-12 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Menyimpan...</span>
                        </div>
                      ) : (
                        <>
                          <span>Kirim Pendaftaran</span>
                          <CheckCircle className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

            </form>
            </>
            )}
          </div>
        </Card>
      </div>

      {/* SUCCESS DIALOG */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl sm:max-w-[420px] w-[95vw] p-6 overflow-hidden flex flex-col items-center">
          <div className="w-full space-y-6 flex flex-col items-center">
            
            {/* Header Text */}
            <div className="text-center space-y-3 mt-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mx-auto shadow-inner">
                <CheckCircle className="w-7 h-7 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">
                  Registrasi Berhasil!
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-600 dark:text-zinc-400 font-medium text-center leading-relaxed px-2">
                  Berkas pendaftaran <span className="text-zinc-900 dark:text-zinc-200 font-bold">{name}</span> telah masuk. Simpan Kartu Peserta di bawah untuk keperluan absensi via QR Code.
                </DialogDescription>
              </div>
            </div>

            {/* PRINTABLE ID CARD - FIXED LAYOUT */}
            {eventDetails && registeredNumber && (
              <div className="w-full flex flex-col items-center gap-5">
                <div 
                  id="printable-id-card"
                  className="w-full max-w-[360px] bg-[#0c101a] border border-amber-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden text-zinc-100"
                >
                  {/* Watermark Soft */}
                  <div className="absolute -bottom-6 -right-4 text-[90px] font-black text-white/[0.02] pointer-events-none font-sans tracking-tighter leading-none select-none">
                    {level}
                  </div>

                  {/* Header Kartu */}
                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center shadow-sm">
                        <span className="text-[#090d16] font-black text-[10px] tracking-wide">PM</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white leading-tight">PMII {commissariat}</span>
                      </div>
                    </div>
                    <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                      PESERTA
                    </Badge>
                  </div>

                  {/* Konten Utama Grid (Fleksibel) */}
                  <div className="grid grid-cols-[auto_1fr] gap-4 items-center relative z-10">
                    
                    {/* Kolom Kiri: QR Code */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-1.5 bg-white rounded-xl shadow-sm">
                        <img 
                          src={qrCodeDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${registeredNumber}`} 
                          alt="QR Code Absensi" 
                          className="w-[72px] h-[72px] object-contain rounded-lg"
                        />
                      </div>
                      <span className="text-[9px] font-mono font-black text-amber-500 tracking-widest">
                        {registeredNumber}
                      </span>
                    </div>

                    {/* Kolom Kanan: Detail Peserta */}
                    <div className="flex flex-col justify-center space-y-2.5 min-w-0">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold uppercase text-zinc-500 tracking-wider">Nama Lengkap</span>
                        <p className="text-xs font-black text-white leading-tight truncate">
                          {(name || alreadyRegisteredData?.cadreName || "").replace(/^Sahabat\s+/i, "").trim()}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold uppercase text-zinc-500 tracking-wider">Kegiatan</span>
                        <p className="text-[10px] font-bold text-zinc-200 leading-tight line-clamp-1">
                          {eventDetails.name}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-bold uppercase text-zinc-500 tracking-wider">Jenjang</span>
                          <span className="text-[10px] font-black text-amber-500 block truncate">
                            {eventDetails.level}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-bold uppercase text-zinc-500 tracking-wider">Tanggal</span>
                          <span className="text-[10px] font-bold text-zinc-300 block truncate">
                            {eventDetails.date}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Peringatan Bawah */}
                  <div className="mt-5 border-t border-zinc-800/60 pt-2.5 text-center relative z-10">
                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">
                      Bawa Kartu Ini Untuk Bukti Absensi Acara
                    </p>
                  </div>
                </div>

                {/* Tombol Aksi ID Card */}
                <div className="w-full max-w-[360px]">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (eventDetails && registeredNumber) {
                        await exportCardAsImage({
                          type: "peserta",
                          name: (name || alreadyRegisteredData?.cadreName || "Peserta"),
                          idNumber: registeredNumber,
                          commissariat: commissariat,
                          level: eventDetails.level,
                          eventName: eventDetails.name,
                          eventDate: eventDetails.date
                        });
                      }
                    }}
                    className="w-full h-10 text-xs font-bold bg-zinc-100 dark:bg-zinc-900/50 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-colors gap-2 cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4" /> Download Kartu
                  </Button>
                </div>
              </div>
            )}
            
            <div className="w-full pt-2">
              <Button 
                onClick={handleSuccessClose} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm h-11 sm:h-12 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Saya Mengerti, Masuk Sekarang
              </Button>
            </div>
          </div>

        </DialogContent>
      </Dialog>

      {/* FILE PREVIEW DIALOG */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl sm:max-w-[720px] w-[95vw] p-6 overflow-hidden flex flex-col">
          
          <DialogHeader className="pb-3 border-b border-zinc-200 dark:border-zinc-800/65 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">
                Pertinjau Dokumen
              </DialogTitle>
              <DialogDescription className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase mt-1">
                {previewTitle}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-[50vh] flex items-center justify-center py-4">
            {previewUrl ? (
              previewUrl.toLowerCase().endsWith(".pdf") || previewUrl.includes("materials/") ? (
                <iframe 
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                  className="w-full h-[55vh] border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-100 dark:bg-zinc-950" 
                  title={previewTitle}
                />
              ) : previewUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) || previewUrl.startsWith("data:image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={previewUrl} 
                  alt={previewTitle} 
                  className="max-w-full max-h-[55vh] object-contain rounded-xl border border-zinc-200 dark:border-zinc-800"
                />
              ) : (
                <iframe 
                  src={previewUrl} 
                  className="w-full h-[55vh] border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-100 dark:bg-zinc-950" 
                  title={previewTitle}
                />
              )
            ) : (
              <span className="text-xs text-zinc-500">Memuat berkas...</span>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-zinc-200 dark:border-zinc-800/65 justify-end">
            <DialogClose render={
              <Button 
                variant="outline" 
                className="text-xs border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 h-9 rounded-xl px-4 cursor-pointer"
              >
                Tutup
              </Button>
            } />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}