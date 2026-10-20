"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { db, CommissariatList, CadreFollowUp } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isValidUUID } from "@/lib/utils";
import { isUserAdmin, isUserPengurus, isUserInstruktur, getTargetStaffPrefix } from "@/lib/auth-helpers";
import {
  Building2,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  User,
  Sparkles,
  Sun,
  Moon,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Fallback 4 komisariat resmi PMII Cabang Grobogan jika offline/loading
const DEFAULT_KOMISARIATS: Partial<CommissariatList>[] = [
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Komisariat Ki Ageng Tarub",
    university: "Sekolah Tinggi Agama Islam Walisembilan Semarang",
    campusName: "Sekolah Tinggi Agama Islam Walisembilan Semarang",
    contactEmail: "kiagengtarub@pmii.org",
    establishedYear: 2019
  },
  {
    id: "2342112a-7413-4151-9998-3a13e833902f",
    name: "Komisariat Ajisaka",
    university: "Sekolah Tinggi Agama Islam Grobogan",
    campusName: "Sekolah Tinggi Agama Islam Grobogan",
    contactEmail: "ajisaka@pmii.org",
    establishedYear: 2020
  },
  {
    id: "2eae53a7-28ff-40b5-95f1-69f85d179d8e",
    name: "Komisariat Joko Suro",
    university: "Sekolah Tinggi Agama Islam Walisembilan Semarang",
    campusName: "Sekolah Tinggi Agama Islam Walisembilan Semarang",
    contactEmail: "jokosuro@pmii.org",
    establishedYear: 2021
  },
  {
    id: "13aea81b-ca8c-43c2-b44f-7d70cdc11f7f",
    name: "Komisariat Ki Ageng Getas Pendawa",
    university: "Universitas An Nuur",
    campusName: "Universitas An Nuur",
    contactEmail: "getaspendawa@pmii.org",
    establishedYear: 2018
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // User state
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Master Komisariat Data
  const [komisariats, setKomisariats] = useState<CommissariatList[]>([]);
  const [loadingKomisariat, setLoadingKomisariat] = useState(true);

  // Form states
  const [selectedKomisariatId, setSelectedKomisariatId] = useState<string>("");

  // Action states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("PMII_THEME") || "dark";
      setDarkMode(savedTheme === "dark");
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      // Check current user session
      const savedUserStr = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (!savedUserStr) {
        router.replace("/login");
        return;
      }

      try {
        const user = JSON.parse(savedUserStr);
        setCurrentUser(user);
        if (user.komisariat_id) setSelectedKomisariatId(user.komisariat_id);
      } catch {
        router.replace("/login");
        return;
      }
    }

    // Load Komisariats (hanya menampilkan Komisariat Kampus, bukan Pengurus Cabang)
    async function loadKomisariats() {
      try {
        const list = await db.getCommissariats();
        const campusOnly = (list || []).filter((k) => {
          const isCabang =
            k.id === "c0000000-0000-0000-0000-000000000001" ||
            k.id === "f9fd547e-117e-4d39-b8cc-2ff9a818a8d9" ||
            (k.level && k.level.toUpperCase() === "CABANG") ||
            (k.type && k.type.toUpperCase() === "CABANG") ||
            (k.name && (
              k.name.toLowerCase().includes("cabang") ||
              k.name.toLowerCase().includes("pc pmii") ||
              k.name.toLowerCase().includes("pengurus cabang")
            ));
          return !isCabang;
        });

        if (campusOnly.length > 0) {
          setKomisariats(campusOnly);
        } else {
          setKomisariats(DEFAULT_KOMISARIATS as CommissariatList[]);
        }
      } catch (err) {
        console.warn("Gagal memuat komisariat dari DB, menggunakan data default:", err);
        setKomisariats(DEFAULT_KOMISARIATS as CommissariatList[]);
      } finally {
        setLoadingKomisariat(false);
      }
    }

    loadKomisariats();
  }, [router]);

  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (typeof window !== "undefined") {
      localStorage.setItem("PMII_THEME", nextDark ? "dark" : "light");
      if (nextDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("PMII_LOGGED_IN_USER");
      localStorage.removeItem("PMII_ACTIVE_CADRE_ID");
      localStorage.removeItem("PMII_ACTIVE_COMMISSARIAT");
    }
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    router.replace("/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKomisariatId) {
      setErrorMsg("Silakan pilih salah satu komisariat asal Anda terlebih dahulu.");
      return;
    }

    const selected = komisariats.find((k) => k.id === selectedKomisariatId);
    if (!selected) {
      setErrorMsg("Komisariat yang dipilih tidak valid.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    try {
      const activeCadreId =
        (typeof window !== "undefined" && localStorage.getItem("PMII_ACTIVE_CADRE_ID")) ||
        currentUser?.id ||
        `kader-${Date.now()}`;

      const universityName = selected.university || selected.campusName || "-";

      // 1. Simpan/Perbarui di tabel Supabase 'anggota' jika terhubung
      if (isSupabaseConfigured && supabase) {
        try {
          const memberPayload: any = {
            tenant_id: selected.id,
            perguruanTinggi: universityName
          };

          const { data: existingMember } = await supabase
            .from("anggota")
            .select("id")
            .or(`id.eq.${activeCadreId},email.eq.${currentUser?.email}`)
            .maybeSingle();

          if (existingMember) {
            const { error: updateErr } = await supabase
              .from("anggota")
              .update(memberPayload)
              .eq("id", existingMember.id);

            if (updateErr) {
              console.warn("Notice updating anggota in Supabase:", updateErr.message);
            }
          } else {
            const newMember = {
              user_id: currentUser?.user_id || (isValidUUID(currentUser?.id) ? currentUser?.id : null),
              name: currentUser?.name || currentUser?.email?.split("@")[0] || "Anggota PMII",
              email: currentUser?.email,
              role: currentUser?.role || "anggota",
              tenant_id: selected.id,
              perguruanTinggi: universityName,
              status: "AKTIF"
            };
            const { error: insertErr } = await supabase
              .from("anggota")
              .insert(newMember);

            if (insertErr) {
              console.warn("Notice inserting anggota in Supabase:", insertErr.message);
            }
          }

          // Sinkronkan ke auth user metadata jika memungkinkan
          if (currentUser?.id || currentUser?.user_id) {
            try {
              await supabase.rpc("update_auth_user", {
                p_user_id: currentUser.user_id || currentUser.id,
                p_email: currentUser.email,
                p_commissariat: selected.name,
                p_komisariat_id: selected.id
              });
            } catch {}
          }
        } catch (dbErr) {
          console.warn("DB update exception:", dbErr);
        }
      }

      // 2. Perbarui list kader di db local/cache
      try {
        const cadres = await db.getCadres([]);
        const existingIdx = cadres.findIndex(
          (c) =>
            c.id === activeCadreId ||
            (c.email && currentUser?.email && c.email.toLowerCase() === currentUser.email.toLowerCase())
        );

        if (existingIdx >= 0) {
          const updated = [...cadres];
          updated[existingIdx] = {
            ...updated[existingIdx],
            komisariat_id: selected.id,
            commissariat: selected.name,
            perguruanTinggi: universityName,
            needsOnboarding: false
          };
          await db.saveCadres(updated);
        } else {
          const newCadre: CadreFollowUp = {
            id: activeCadreId,
            user_id: currentUser?.user_id || (isValidUUID(currentUser?.id) ? currentUser?.id : undefined),
            name: currentUser?.name || currentUser?.email?.split("@")[0] || "Anggota PMII",
            email: currentUser?.email || "",
            komisariat_id: selected.id,
            commissariat: selected.name,
            perguruanTinggi: universityName,
            role: currentUser?.role || "anggota",
            status: "AKTIF",
            level: "MAPABA",
            startDate: new Date().toISOString().split("T")[0],
            needsOnboarding: false,
            isGraduated: false,
            submissions: []
          };
          await db.saveCadres([...cadres, newCadre]);
        }
      } catch (cacheErr) {
        console.warn("Cache save notice:", cacheErr);
      }

      // 3. Perbarui session di localStorage
      const updatedUser = {
        ...currentUser,
        komisariat_id: selected.id,
        commissariat: selected.name,
        perguruanTinggi: universityName,
        needsOnboarding: false
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(updatedUser));
        localStorage.setItem("PMII_ACTIVE_COMMISSARIAT", selected.name);
        localStorage.setItem("PMII_ACTIVE_CADRE_ID", activeCadreId);
      }

      setSuccess(true);

      const roleLower = (updatedUser.role || "anggota").toLowerCase();
      const isStaff = isUserAdmin(roleLower) || isUserPengurus(roleLower) || isUserInstruktur(roleLower);
      const targetPath = isStaff ? getTargetStaffPrefix(roleLower) : `/${roleLower}`;

      setTimeout(() => {
        router.push(targetPath);
      }, 1000);
    } catch (err: any) {
      console.error("Gagal menyelesaikan onboarding:", err);
      setErrorMsg(err.message || "Terjadi gangguan saat menyimpan data. Silakan coba kembali.");
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse space-y-3 text-center">
          <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 mx-auto" />
          <div className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
        </div>
      </div>
    );
  }

  const selectedKomisariat = komisariats.find((k) => k.id === selectedKomisariatId);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl"
        aria-hidden="true"
      />

      {/* TOP HEADER */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-6 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-white border border-zinc-200/80 dark:border-zinc-700/80 p-1.5 flex items-center justify-center shadow-xs">
            <Image
              src="/image/logo_komsat.png"
              alt="Logo PMII"
              width={36}
              height={36}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wider text-blue-700 dark:text-amber-400 uppercase leading-none">
              PMII CABANG GROBOGAN
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Sistem Informasi & Pangkalan Data Kader
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs cursor-pointer transition-colors"
            title={darkMode ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs cursor-pointer transition-colors flex items-center gap-1.5 text-xs"
            title="Keluar / Ganti Akun"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="w-full max-w-4xl mx-auto my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Welcome Banner */}
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-zinc-950/5 dark:shadow-black/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  Langkah Awal Anggota Baru
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Selamat Datang, Sahabat {currentUser?.name || "Kader"}!
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
                  Akun Anda telah berhasil terhubung. Untuk melanjutkan, silakan tentukan{" "}
                  <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">Komisariat asal kampus Anda</strong> di bawah ini agar data kaderisasi dan koordinasi kegiatan terhubung secara tepat.
                </p>
              </div>

              {/* User Identity Chip */}
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-500/20 overflow-hidden">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (currentUser?.name || "K").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="text-left pr-2">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                    {currentUser?.name || "Kader PMII"}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    {currentUser?.email || "-"}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Terverifikasi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ERROR ALERT */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* KOMISARIAT SELECTION GRID */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Pilih Komisariat PMII Cabang Grobogan <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {komisariats.length} Komisariat Terdaftar
                  </span>
                </div>

                {loadingKomisariat ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-6 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {komisariats.map((k) => {
                      const isSelected = selectedKomisariatId === k.id;
                      const campus = k.university || k.campusName || "Perguruan Tinggi";

                      return (
                        <div
                          key={k.id}
                          onClick={() => {
                            setSelectedKomisariatId(k.id);
                            setErrorMsg("");
                          }}
                          className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between ${
                            isSelected
                              ? "bg-emerald-500/10 border-emerald-500/80 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/30"
                              : "bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/70"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isSelected
                                    ? "bg-emerald-600 text-white"
                                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                }`}
                              >
                                {k.logo ? (
                                  <img
                                    src={k.logo}
                                    alt={k.name}
                                    className="w-full h-full object-contain p-1 rounded-xl"
                                  />
                                ) : (
                                  <Building2 className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                                  {k.name}
                                </h3>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5 line-clamp-1">
                                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                                  <span>{campus}</span>
                                </p>
                              </div>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                                isSelected
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "border-zinc-300 dark:border-zinc-600 bg-transparent"
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-4 h-4" />}
                            </div>
                          </div>

                          {k.contactEmail && (
                            <div className="mt-3 pt-2.5 border-t border-zinc-200/40 dark:border-zinc-700/40 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                              <span>Kontak: {k.contactEmail}</span>
                              {k.establishedYear && <span>Est. {k.establishedYear}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SELECTED SUMMARY NOTICE */}
              {selectedKomisariat && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    Anda memilih <strong>{selectedKomisariat.name}</strong> ({selectedKomisariat.university || selectedKomisariat.campusName}).
                  </span>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
                <Button
                  type="submit"
                  disabled={submitting || !selectedKomisariatId}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-10 px-6 rounded-xl shadow-md cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 border-none"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Pilihan...</span>
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Berhasil! Mengarahkan...</span>
                    </>
                  ) : (
                    <>
                      <span>Konfirmasi & Masuk ke Portal PMII</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-4xl mx-auto text-center pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          © {new Date().getFullYear()} Pengurus Cabang PMII Kabupaten Grobogan. Seluruh Hak Cipta Dilindungi.
        </p>
      </footer>
    </div>
  );
}
