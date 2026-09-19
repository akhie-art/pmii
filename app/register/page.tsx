"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db, Kaderisasi } from "@/lib/db";
import type { UserRole } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { exportCardAsImage } from "@/lib/cardExporter";
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
  Moon
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
  commissariat: string;
  description: string;
  status: "OPEN" | "CLOSED";
  formFields?: FormField[];
}

interface ParticipantRegistration {
  id: string;
  eventId: string;
  cadreName: string;
  cadreRayon?: string;
  cadreEmail: string;
  dateApplied: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
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
  name: string;
  level: "MAPABA" | "PKD" | "PKL";
  commissariat: string;
  rayon?: string;
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

  const handleGoogleRegister = async () => {
    setError("");
    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Koneksi autentikasi database belum aktif.");
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

  useEffect(() => {
    const loadEvents = async () => {
      setMounted(true);

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");
        if (redirect) {
          setRedirectParam(redirect);
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

          const events = await db.getEvents();
          const foundEvent = events.find((e: any) => e.id === eventId);
          if (foundEvent) {
            setEventDetails(foundEvent);
            setCommissariat(foundEvent.commissariat);
            setLevel(foundEvent.level as "MAPABA" | "PKD" | "PKL");

            const initialAnswers: Record<string, string> = {};
            (foundEvent.formFields || []).forEach((field: any) => {
              initialAnswers[field.id] = "";
            });
            setCustomAnswers(initialAnswers);

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
                const initialAnswers: Record<string, string> = {};
                activeFields.forEach((field: any) => {
                  initialAnswers[field.id] = "";
                });
                setCustomAnswers(initialAnswers);
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

    if (!name.trim()) return setError("Nama Lengkap harus diisi.");
    if (!email.trim()) return setError("Alamat email harus diisi.");
    if (!phone.trim()) return setError("Nomor WhatsApp harus diisi.");
    if (!commissariat) return setError("Pilih Komisariat.");
    if (!password) return setError("Kata sandi harus diisi.");
    if (password !== confirmPassword) return setError("Konfirmasi sandi tidak cocok dengan kata sandi.");
    if (password.length < 6) return setError("Kata sandi harus minimal 6 karakter.");

    setLoading(true);
    try {
      const cadresList = await db.getCadres();
      const isDuplicate = cadresList.some(c => c.email?.toLowerCase() === email.toLowerCase());
      if (isDuplicate) {
        setError("Alamat email sudah terdaftar. Gunakan email lain.");
        setLoading(false);
        return;
      }
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
    if (!commissariat) return setError("Pilih salah satu Komisariat / Universitas.");
    if (password !== confirmPassword) return setError("Konfirmasi sandi tidak cocok dengan kata sandi.");
    if (password.length < 6) return setError("Kata sandi harus minimal 6 karakter.");

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
      if (isDuplicate) {
        setError("Alamat email sudah terdaftar. Gunakan email lain.");
        setLoading(false);
        return;
      }

      const hasEvent = Boolean(targetEventId && eventDetails);
      const regNo = hasEvent ? `${level.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}` : undefined;
      if (regNo) {
        setRegisteredNumber(regNo);
      }

      const formattedName = name.startsWith("Sahabat") ? name.trim() : `Sahabat ${name.trim()}`;
      
      const newCadre: CadreFollowUp = {
        id: `cadre-${Date.now()}`,
        name: formattedName,
        level: level,
        commissariat: commissariat,
        startDate: new Date().toISOString().split("T")[0],
        status: "AKTIF",
        submissions: [],
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        address: `Komisariat ${commissariat}`,
        isGraduated: level !== "MAPABA",
        registrationNumber: regNo,
        role: level !== "MAPABA" ? "anggota" : "peserta"
      };

      const updatedList = [...cadresList, newCadre];
      await db.saveCadres(updatedList);

      if (targetEventId && eventDetails) {
        const registrationsList = await db.getRegistrations();
        const initialVerificationStatus: Record<string, boolean> = {};
        (eventDetails.formFields || []).forEach((field) => {
          initialVerificationStatus[field.id] = false;
        });

        const newRegistration: ParticipantRegistration = {
          id: `reg-${Date.now()}`,
          eventId: targetEventId,
          cadreName: formattedName,
          cadreEmail: email.trim().toLowerCase(),
          dateApplied: new Date().toISOString().split("T")[0],
          status: "PENDING",
          notes: "",
          answers: customAnswers,
          verificationStatus: initialVerificationStatus,
          registrationNumber: regNo,
          attendance: [],
          isGraduated: false
        };

        await db.saveRegistrations([...registrationsList, newRegistration]);
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
    const target = redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : "/login";
    router.push(target);
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

      <div className="w-full max-w-2xl mx-auto my-auto space-y-5">
        {/* REGISTRATION CARD */}
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-sm transition-colors duration-300">
          
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 gap-2">
              <div className="space-y-1">
                <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {eventDetails ? "Formulir Pendaftaran Kegiatan" : "Daftar Akun Kader"}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {eventDetails ? `Isi berkas persyaratan untuk ${eventDetails.level}` : "Isi data keanggotaan Anda secara lengkap"}
                </p>
              </div>
            </div>

            {/* GOOGLE REGISTRATION BUTTON */}
            {!eventDetails && (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={handleGoogleRegister}
                  className="w-full h-10 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all duration-150 cursor-pointer bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 shadow-xs"
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
            )}

            {eventDetails && eventDetails.formFields && eventDetails.formFields.length > 0 && (
              <div className="flex items-center justify-center gap-4 py-2 border-b border-zinc-800/40 select-none">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 ${
                    step === 1 
                      ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 scale-105" 
                      : "bg-zinc-800 text-zinc-400"
                  }`}>
                    1
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors duration-300 ${
                    step === 1 ? "text-amber-500" : "text-zinc-500"
                  }`}>
                    Buat Akun
                  </span>
                </div>
                <div className="w-12 h-0.5 bg-zinc-800 rounded-full" />
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 ${
                    step === 2 
                      ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 scale-105" 
                      : "bg-zinc-800 text-zinc-400"
                  }`}>
                    2
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors duration-300 ${
                    step === 2 ? "text-amber-500" : "text-zinc-500"
                  }`}>
                    Persyaratan
                  </span>
                </div>
              </div>
            )}

            {/* EVENT DETAILS BANNER */}
            {eventDetails && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex flex-col gap-2 shadow-sm">
                <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider block">
                  Kegiatan Yang Diikuti:
                </span>
                <div className="flex justify-between items-start gap-3">
                  <h3 className="text-sm font-black text-white leading-snug">
                    {eventDetails.name}
                  </h3>
                  <Badge className="bg-amber-500 hover:bg-amber-400 text-[#090d16] font-black text-[9px] uppercase py-1 px-3 rounded-lg border-none flex-shrink-0">
                    {eventDetails.level}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  {eventDetails.description}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-semibold text-zinc-500 border-t border-zinc-800/50 pt-3">
                  <span>Komisariat: <strong className="text-zinc-300">{eventDetails.commissariat}</strong></span>
                  <span>•</span>
                  <span>Pelaksanaan: <strong className="text-zinc-300">{eventDetails.date}</strong></span>
                </div>

                {/* Modul & Silabus Section */}
                {kaderisasiData && (kaderisasiData.syllabus || kaderisasiData.modul) && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/50 space-y-2.5">
                    <span className="text-[9px] font-extrabold text-amber-500/80 uppercase tracking-widest block">
                      Materi & Kurikulum Kaderisasi:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {kaderisasiData.syllabus && (
                        <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 border border-zinc-800/50 rounded-xl hover:border-zinc-700/60 transition-all">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="block text-[9px] text-zinc-400 font-bold uppercase tracking-wider leading-none">Silabus</span>
                              <span className="block text-[8px] text-zinc-500 truncate mt-1 max-w-[120px]">{kaderisasiData.syllabus.fileName}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => handlePreviewFile(kaderisasiData.syllabus!.fileUrl, `Silabus ${kaderisasiData.nama}`)}
                              className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
                              title="Pertinjau Silabus"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={kaderisasiData.syllabus.fileUrl}
                              download
                              className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
                              title="Download Silabus"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}

                      {kaderisasiData.modul && (
                        <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 border border-zinc-800/50 rounded-xl hover:border-zinc-700/60 transition-all">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="block text-[9px] text-zinc-400 font-bold uppercase tracking-wider leading-none">Modul</span>
                              <span className="block text-[8px] text-zinc-500 truncate mt-1 max-w-[120px]">{kaderisasiData.modul.fileName}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => handlePreviewFile(kaderisasiData.modul!.fileUrl, `Modul ${kaderisasiData.nama}`)}
                              className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
                              title="Pertinjau Modul"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={kaderisasiData.modul.fileUrl}
                              download
                              className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
                              title="Download Modul"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ERROR ALERT */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium rounded-xl flex items-start gap-3"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Nama Lengkap</label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <Input
                          required
                          disabled={loading}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ahmad Fudholi"
                          className="text-sm pl-10 bg-zinc-950/50 border-zinc-800/80 rounded-xl h-11 text-white placeholder-zinc-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Alamat Email</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <Input
                          type="email"
                          required
                          disabled={loading}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="sahabat@domain.com"
                          className="text-sm pl-10 bg-zinc-950/50 border-zinc-800/80 rounded-xl h-11 text-white placeholder-zinc-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Nomor WhatsApp</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <Input
                          required
                          disabled={loading}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="081234567890"
                          className="text-sm pl-10 bg-zinc-950/50 border-zinc-800/80 rounded-xl h-11 text-white placeholder-zinc-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Jenjang Saat Ini</label>
                      {eventDetails ? (
                        <Input disabled value={level} className="text-sm bg-zinc-950/50 border-zinc-800/80 rounded-xl h-11 text-zinc-400 font-medium" />
                      ) : (
                        <Select value={level} onValueChange={(val) => val && setLevel(val)}>
                          <SelectTrigger className="text-sm bg-zinc-950/50 border-zinc-800/80 rounded-xl h-11 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500">
                            <SelectValue placeholder="Pilih jenjang" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#090d16] border-zinc-800 text-white">
                            <SelectItem value="MAPABA">MAPABA (Masa Penerimaan Anggota Baru)</SelectItem>
                            <SelectItem value="PKD">PKD (Pelatihan Kader Dasar)</SelectItem>
                            <SelectItem value="PKL">PKL (Pelatihan Kader Lanjut)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Komisariat (Kampus)</label>
                    <Select value={commissariat} onValueChange={(val) => val && setCommissariat(val)} disabled={!!eventDetails}>
                      <SelectTrigger className="text-sm bg-zinc-950/50 border-zinc-800/80 rounded-xl h-11 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500">
                        <SelectValue placeholder="Pilih Komisariat" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#090d16] border-zinc-800 text-white">
                        {INDONESIA_UNIVERSITIES.map((uni) => (
                          <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Kata Sandi</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          required
                          disabled={loading}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          className="text-sm pl-10 pr-10 bg-zinc-950/50 border-zinc-800/80 rounded-xl h-11 text-white placeholder-zinc-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Konfirmasi Sandi</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          disabled={loading}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi kata sandi"
                          className="text-sm pl-10 pr-10 bg-zinc-950/50 border-zinc-800/80 rounded-xl h-11 text-white placeholder-zinc-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800/50">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-[#090d16] font-black text-sm h-12 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-[#090d16] border-t-transparent rounded-full animate-spin" />
                          <span>Memproses...</span>
                        </div>
                      ) : (
                        <>
                          <span>{eventDetails && eventDetails.formFields && eventDetails.formFields.length > 0 ? "Lanjut ke Berkas Persyaratan" : "Selesaikan Pendaftaran"}</span>
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
                  <div className="grid grid-cols-1 gap-5">
                    {eventDetails.formFields.map((field) => {
                      const value = customAnswers[field.id] || "";
                      const handleChange = (val: string | null) => setCustomAnswers((prev) => ({ ...prev, [field.id]: val || "" }));

                      return (
                        <div key={field.id} className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                          </label>

                          {field.type === "textarea" ? (
                            <textarea
                              required={field.required}
                              disabled={loading}
                              value={value}
                              onChange={(e) => handleChange(e.target.value)}
                              placeholder={`Ketik ${field.label.toLowerCase()}...`}
                              className="w-full text-sm p-4 bg-zinc-950/50 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl h-28 text-white placeholder-zinc-600 resize-none"
                            />
                          ) : field.type === "select" ? (
                            <Select value={value} onValueChange={handleChange}>
                              <SelectTrigger className="text-sm bg-zinc-950/50 border-zinc-800/80 rounded-xl h-11 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500">
                                <SelectValue placeholder={`Pilih ${field.label}...`} />
                              </SelectTrigger>
                              <SelectContent className="bg-[#090d16] border-zinc-800 text-white">
                                {(field.options || []).map((opt) => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === "file" ? (
                            <div className="space-y-2">
                              {value ? (
                                <div className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800/80 rounded-xl">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                                      <FileText className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-xs font-bold text-white truncate">{fileNames[field.id] || "Berkas Terunggah"}</span>
                                      <a href={value} target="_blank" rel="noreferrer" className="text-[10px] font-medium text-amber-500 hover:underline">Lihat Berkas ↗</a>
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
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-950/30 hover:bg-zinc-950/50 rounded-xl cursor-pointer transition-all">
                                  <div className="flex flex-col items-center justify-center space-y-2 text-center px-4">
                                    {uploadingFields[field.id] ? (
                                      <>
                                        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-xs font-medium text-zinc-400">Mengunggah berkas...</p>
                                      </>
                                    ) : (
                                      <>
                                        <UploadCloud className="w-8 h-8 text-zinc-500" />
                                        <p className="text-xs font-bold text-zinc-300">Pilih Dokumen / File</p>
                                        <p className="text-[10px] text-zinc-500 font-medium">PDF, JPG, PNG (Maks. 2MB)</p>
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
                            <Input
                              required={field.required}
                              disabled={loading}
                              type="text"
                              value={value}
                              onChange={(e) => handleChange(e.target.value)}
                              placeholder={`Masukkan ${field.label.toLowerCase()}...`}
                              className="text-sm bg-zinc-950/50 border-zinc-800/80 rounded-xl h-11 text-white placeholder-zinc-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-zinc-800/50">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl h-12 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Sebelumnya
                    </Button>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] bg-amber-500 hover:bg-amber-400 text-[#090d16] font-black text-sm h-12 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-[#090d16] border-t-transparent rounded-full animate-spin" />
                          <span>Menyimpan...</span>
                        </div>
                      ) : (
                        <>
                          <span>Kirim Pendaftaran</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

            </form>
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
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-sm font-black text-white uppercase tracking-widest">
                  Registrasi Berhasil!
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 font-medium text-center leading-relaxed px-2">
                  Berkas pendaftaran <span className="text-zinc-200 font-bold">{name}</span> telah masuk. Simpan Kartu Peserta di bawah untuk keperluan absensi via QR Code.
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
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${registeredNumber}`} 
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
                          {name.startsWith("Sahabat") ? name : `Sahabat ${name}`}
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
                          name: name,
                          idNumber: registeredNumber,
                          commissariat: commissariat,
                          level: eventDetails.level,
                          eventName: eventDetails.name,
                          eventDate: eventDetails.date
                        });
                      }
                    }}
                    className="w-full h-10 text-xs font-bold bg-zinc-900/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl transition-colors gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Kartu
                  </Button>
                </div>
              </div>
            )}
            
            <div className="w-full pt-2">
              <Button 
                onClick={handleSuccessClose} 
                className="w-full bg-amber-500 hover:bg-amber-400 text-[#090d16] font-black text-sm h-12 rounded-xl transition-all shadow-lg shadow-amber-500/20"
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
          
          <DialogHeader className="pb-3 border-b border-zinc-800/65 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-sm font-black text-white uppercase tracking-widest">
                Pertinjau Dokumen
              </DialogTitle>
              <DialogDescription className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
                {previewTitle}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-[50vh] flex items-center justify-center py-4">
            {previewUrl ? (
              previewUrl.toLowerCase().endsWith(".pdf") || previewUrl.includes("materials/") ? (
                <iframe 
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                  className="w-full h-[55vh] border border-zinc-800 rounded-xl bg-zinc-950" 
                  title={previewTitle}
                />
              ) : previewUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) || previewUrl.startsWith("data:image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={previewUrl} 
                  alt={previewTitle} 
                  className="max-w-full max-h-[55vh] object-contain rounded-xl border border-zinc-800"
                />
              ) : (
                <iframe 
                  src={previewUrl} 
                  className="w-full h-[55vh] border border-zinc-800 rounded-xl bg-zinc-950" 
                  title={previewTitle}
                />
              )
            ) : (
              <span className="text-xs text-zinc-500">Memuat berkas...</span>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-zinc-800/65 justify-end">
            <DialogClose render={
              <Button 
                variant="outline" 
                className="text-xs border-zinc-800 bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800 h-9 rounded-xl px-4 cursor-pointer"
              />
            }>
              Tutup
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}