"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db";
import type { EventActivity, ParticipantRegistration } from "@/lib/db";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Search,
  Check,
  AlertCircle,
  XCircle,
  Layers,
  FileCheck,
  UploadCloud,
  FileText,
  X
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

export default function KaderKegiatanPage() {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<EventActivity[]>([]);
  const [registrations, setRegistrations] = useState<ParticipantRegistration[]>([]);
  const [activeCadre, setActiveCadre] = useState<any | null>(null);
  const [kaderisasiList, setKaderisasiList] = useState<any[]>([]);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState<"SEMUA" | "OPEN" | "MY_EVENTS">("SEMUA");

  // Registration Modal State
  const [selectedEvent, setSelectedEvent] = useState<EventActivity | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [highlightEventId, setHighlightEventId] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      const activeId = typeof window !== "undefined" ? (localStorage.getItem("PMII_ACTIVE_CADRE_ID") || "") : "";
      
      const allCadres = await db.getCadres([]);
      const current = allCadres.find((c: any) => c.id === activeId) || allCadres[0] || null;
      setActiveCadre(current);

      const allKaderisasi = await db.getKaderisasi();
      setKaderisasiList(allKaderisasi);

      const allEvents = await db.getEvents([]);
      const enrichedEvents = allEvents.map((ev: any) => {
        const matched = allKaderisasi.find(
          (k: any) => k.nama === ev.level || k.id === ev.level
        );
        return {
          ...ev,
          formFields: matched?.formFields || []
        };
      });
      setEvents(enrichedEvents);

      const allRegs = await db.getRegistrations([]);
      setRegistrations(allRegs);

      // Check ?event= parameter in URL
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const eventId = params.get("event") || params.get("id");
        if (eventId) {
          const target = enrichedEvents.find((e: any) => e.id === eventId);
          if (target) {
            setHighlightEventId(eventId);
            const isAlreadyReg = allRegs.some(
              (r) => r.eventId === eventId && current && (r.cadreName === current.name || r.cadreEmail === current.email)
            );
            if (!isAlreadyReg && target.status === "OPEN") {
              setSelectedEvent(target);
              setFormAnswers({});
              setIsRegisterModalOpen(true);
            }
          }
        }
      }

      setMounted(true);
    };
    loadData();
  }, []);

  // Filtered Events
  const filteredEvents = events.filter((ev) => {
    const matchesSearch = ev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.level && ev.level.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === "OPEN") {
      return ev.status === "OPEN";
    }

    if (filterTab === "MY_EVENTS") {
      if (!activeCadre) return false;
      const isRegistered = registrations.some(
        (r) => r.eventId === ev.id && (r.cadreName === activeCadre.name || r.cadreEmail === activeCadre.email)
      );
      return isRegistered;
    }

    return true;
  });

  const getMyRegistration = (eventId: string) => {
    if (!activeCadre) return null;
    return registrations.find(
      (r) => r.eventId === eventId && (r.cadreName === activeCadre.name || r.cadreEmail === activeCadre.email)
    );
  };

  const getEventFormFields = (ev: EventActivity | null) => {
    if (!ev) return [];
    if (ev.formFields && ev.formFields.length > 0) return ev.formFields;
    const matched = kaderisasiList.find(
      (k: any) => k.nama === ev.level || k.id === ev.level
    );
    return matched?.formFields || [];
  };

  const handleOpenRegisterModal = (ev: EventActivity) => {
    const matched = kaderisasiList.find(
      (k: any) => k.nama === ev.level || k.id === ev.level
    );
    const formFields = matched?.formFields || ev.formFields || [];
    setSelectedEvent({
      ...ev,
      formFields
    });
    setFormAnswers({});
    setFileNames({});
    setUploadingFields({});
    setIsRegisterModalOpen(true);
  };

  const handleFileUpload = async (fieldId: string, file: File) => {
    if (!file) return;

    setUploadingFields((prev) => ({ ...prev, [fieldId]: true }));
    setFileNames((prev) => ({ ...prev, [fieldId]: file.name }));

    try {
      let finalUrl = "";
      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split(".").pop();
        const eventFolder = selectedEvent?.id || "kegiatan";
        const filePath = `kegiatan/${eventFolder}/${fieldId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (uploadError) {
          console.error("Supabase upload error, falling back to Data URL:", uploadError.message);
          finalUrl = await readFileAsDataURL(file);
        } else {
          const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
          finalUrl = data.publicUrl;
        }
      } else {
        finalUrl = await readFileAsDataURL(file);
      }

      setFormAnswers((prev) => ({ ...prev, [fieldId]: finalUrl }));
    } catch (err) {
      console.error("Failed to upload file", err);
      alert(`Gagal mengunggah berkas ${file.name}.`);
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

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !activeCadre) return;

    if (Object.values(uploadingFields).some(Boolean)) {
      alert("Mohon tunggu hingga seluruh berkas selesai diunggah.");
      return;
    }

    // Validate required fields
    const currentFields = getEventFormFields(selectedEvent);
    for (const field of currentFields) {
      if (field.required && !formAnswers[field.id]?.trim()) {
        alert(`Mohon lengkapi kolom "${field.label}"`);
        return;
      }
    }

    const isMapabaEvent = selectedEvent.level === "MAPABA" || selectedEvent.name.toLowerCase().includes("mapaba");
    const generatedRegNo = isMapabaEvent 
      ? `MAP-${Math.floor(100000 + Math.random() * 900000)}` 
      : `REG-${Math.floor(100000 + Math.random() * 900000)}`;

    const newReg: ParticipantRegistration = {
      id: `reg-${Date.now()}`,
      eventId: selectedEvent.id,
      cadreName: activeCadre.name,
      cadreRayon: activeCadre.rayon || "",
      cadreEmail: activeCadre.email || `${activeCadre.name.toLowerCase().replace(/\s+/g, ".")}@pmii.org`,
      dateApplied: new Date().toISOString().split("T")[0],
      status: "PENDING",
      notes: "",
      answers: formAnswers,
      verificationStatus: {},
      registrationNumber: generatedRegNo
    };

    const updated = [newReg, ...registrations];
    setRegistrations(updated);
    await db.saveRegistrations(updated);

    // Also synchronize registrationNumber to active cadre
    try {
      const allCadres = await db.getCadres([]);
      const updatedCadres = allCadres.map(c => {
        if (c.id === activeCadre.id || (c.email && c.email.toLowerCase() === (activeCadre.email || "").toLowerCase())) {
          return {
            ...c,
            registrationNumber: generatedRegNo
          };
        }
        return c;
      });
      await db.saveCadres(updatedCadres);
    } catch (err) {
      console.error("Error updating cadre registration number:", err);
    }

    setIsRegisterModalOpen(false);
    setSuccessMessage(`Pendaftaran Anda untuk kegiatan "${selectedEvent.name}" berhasil dikirim! Menunggu verifikasi pengurus.`);
    setIsSuccessOpen(true);
  };

  if (!mounted) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-28 bg-zinc-200 dark:bg-zinc-800/40 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-zinc-200 dark:bg-zinc-800/40 rounded-lg animate-pulse" />
          <div className="h-48 bg-zinc-200 dark:bg-zinc-800/40 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-zinc-900 dark:text-zinc-100 font-sans">
      
      {/* 1. HEADER BANNER */}
      <div className="relative overflow-hidden rounded-lg bg-white dark:bg-zinc-900 p-6 md:p-8 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800">
        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Agenda & Kegiatan Kaderisasi
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl font-normal">
            Ikuti pelatihan formal, kajian ideologi, diskusi publik, dan agenda pengkaderan yang diselenggarakan oleh PK PMII Ki Ageng Getas Pendawa.
          </p>
        </div>
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg">
        {/* TABS */}
        <div className="flex gap-1.5 overflow-x-auto p-0.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFilterTab("SEMUA")}
            className={`text-xs font-bold rounded-md h-8 cursor-pointer transition-colors border shadow-none ${
              filterTab === "SEMUA"
                ? "bg-blue-600 hover:bg-blue-700 text-white hover:text-white border-blue-600 hover:border-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white dark:hover:text-white dark:border-blue-600 dark:hover:border-blue-700"
                : "bg-transparent hover:bg-zinc-100 dark:bg-transparent dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Semua ({events.length})
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFilterTab("OPEN")}
            className={`text-xs font-bold rounded-md h-8 cursor-pointer transition-colors border shadow-none ${
              filterTab === "OPEN"
                ? "bg-blue-600 hover:bg-blue-700 text-white hover:text-white border-blue-600 hover:border-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white dark:hover:text-white dark:border-blue-600 dark:hover:border-blue-700"
                : "bg-transparent hover:bg-zinc-100 dark:bg-transparent dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Pendaftaran Dibuka ({events.filter((e) => e.status === "OPEN").length})
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFilterTab("MY_EVENTS")}
            className={`text-xs font-bold rounded-md h-8 cursor-pointer transition-colors border shadow-none ${
              filterTab === "MY_EVENTS"
                ? "bg-blue-600 hover:bg-blue-700 text-white hover:text-white border-blue-600 hover:border-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white dark:hover:text-white dark:border-blue-600 dark:hover:border-blue-700"
                : "bg-transparent hover:bg-zinc-100 dark:bg-transparent dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Kegiatan Saya
          </Button>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Cari kegiatan atau tema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-md h-8 text-zinc-900 dark:text-zinc-100 focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-0 shadow-none"
          />
        </div>
      </div>

      {/* 3. EVENT CARDS GRID */}
      {filteredEvents.length === 0 ? (
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center shadow-none">
          <Calendar className="w-12 h-12 mx-auto text-zinc-350 dark:text-zinc-700 mb-3" />
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            Tidak ada kegiatan yang ditemukan
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {filterTab === "MY_EVENTS"
              ? "Anda belum terdaftar dalam kegiatan apapun. Silakan pilih kegiatan yang dibuka dan daftarkan diri Anda."
              : "Belum ada agenda kegiatan yang sesuai dengan kriteria filter saat ini."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEvents.map((ev) => {
            const myReg = getMyRegistration(ev.id);
            const isOpen = ev.status === "OPEN";
            const isHighlighted = highlightEventId === ev.id;

            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Card className={`bg-white dark:bg-zinc-900 rounded-lg p-5 h-full flex flex-col justify-between transition-colors duration-150 border shadow-none ${
                  isHighlighted
                    ? "border-amber-500 dark:border-amber-400 bg-amber-500/[0.02]"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}>
                  <div className="space-y-3.5">
                    {/* TOP BADGES */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded shadow-none">
                          <Layers className="w-3 h-3 mr-1" /> {ev.level}
                        </Badge>
                        <Badge
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border shadow-none ${
                            isOpen
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                              : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                          }`}
                        >
                          {isOpen ? "Pendaftaran Dibuka" : "Selesai / Ditutup"}
                        </Badge>
                        {isHighlighted && (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9.5px] font-bold px-1.5 py-0.5 rounded shadow-none">
                            Terpilih
                          </Badge>
                        )}
                      </div>

                      {/* MY REG STATUS BADGE */}
                      {myReg && (
                        <Badge
                          className={`text-[9.5px] font-black px-2 py-0.5 rounded border shadow-none ${
                            myReg.status === "APPROVED"
                              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                              : myReg.status === "REJECTED"
                              ? "bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400"
                              : "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {myReg.status === "APPROVED" && <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" />}
                          {myReg.status === "PENDING" && <Clock className="w-3 h-3 mr-1 text-amber-500" />}
                          {myReg.status === "REJECTED" && <XCircle className="w-3 h-3 mr-1 text-rose-500" />}
                          {myReg.status === "APPROVED" ? "Terverifikasi" : myReg.status === "REJECTED" ? "Ditolak" : "Menunggu Review"}
                        </Badge>
                      )}
                    </div>

                    {/* EVENT INFO */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                        {ev.name}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                        {ev.description || "Tidak ada deskripsi rinci untuk kegiatan ini."}
                      </p>
                    </div>

                    {/* META: DATE & LOCATION */}
                    <div className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="font-medium text-zinc-700 dark:text-zinc-300 text-[11px]">
                          {ev.date || "Jadwal akan diumumkan"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span className="font-medium text-zinc-700 dark:text-zinc-300 text-[11px]">
                          PK PMII Ki Ageng Getas Pendawa
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ACTION */}
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 mt-4">
                    {myReg ? (
                      <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">
                          <FileCheck className="w-4 h-4 text-emerald-500" />
                          <span>Kode: {myReg.registrationNumber || "TERDAFTAR"}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {myReg.dateApplied}
                        </span>
                      </div>
                    ) : isOpen ? (
                      <Button
                        onClick={() => handleOpenRegisterModal(ev)}
                        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white dark:text-white font-bold text-xs h-9 rounded-md border border-blue-600 dark:border-blue-600 cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-none"
                      >
                        Daftar Kegiatan Ini
                      </Button>
                    ) : (
                      <Button
                        disabled
                        variant="outline"
                        className="w-full text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-800 text-xs h-9 rounded-md shadow-none"
                      >
                        Pendaftaran Ditutup
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 4. REGISTRATION DIALOG */}
      <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg max-w-md w-full p-6 text-zinc-900 dark:text-zinc-100 shadow-none max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1 text-left pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              Pendaftaran Kegiatan
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              {selectedEvent?.name}
            </DialogDescription>
          </DialogHeader>

          {activeCadre && selectedEvent && (() => {
            const currentFields = getEventFormFields(selectedEvent);
            return (
              <form onSubmit={handleSubmitRegistration} className="space-y-4 pt-3">
                {/* CADRE INFO SUMMARY */}
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 dark:text-zinc-400">Pendaftar</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{activeCadre.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 dark:text-zinc-400">Email</span>
                    <span className="text-zinc-700 dark:text-zinc-300">{activeCadre.email || "-"}</span>
                  </div>
                  {activeCadre.rayon && (
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 dark:text-zinc-400">Rayon</span>
                      <span className="text-zinc-700 dark:text-zinc-300">{activeCadre.rayon}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 dark:text-zinc-400">Jenjang Kegiatan</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedEvent.level}</span>
                  </div>
                </div>

                {/* DYNAMIC FORM FIELDS */}
                {currentFields.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 border-b border-zinc-100 dark:border-zinc-800 pb-1">
                      Berkas & Formulir Pendaftaran ({currentFields.length})
                    </div>
                    {currentFields.map((field: any) => (
                      <div key={field.id} className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                          <span>{field.label}</span>
                          {field.required ? (
                            <span className="text-rose-500 font-bold">*</span>
                          ) : (
                            <span className="text-zinc-400 font-normal text-[10px]">(Opsional)</span>
                          )}
                        </label>
                        {field.type === "textarea" ? (
                          <textarea
                            required={field.required}
                            value={formAnswers[field.id] || ""}
                            onChange={(e) =>
                              setFormAnswers({ ...formAnswers, [field.id]: e.target.value })
                            }
                            placeholder={`Masukkan ${field.label.toLowerCase()}...`}
                            className="w-full text-xs p-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
                            rows={3}
                          />
                        ) : field.type === "select" ? (
                          <select
                            required={field.required}
                            value={formAnswers[field.id] || ""}
                            onChange={(e) =>
                              setFormAnswers({ ...formAnswers, [field.id]: e.target.value })
                            }
                            className="w-full text-xs h-9.5 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
                          >
                            <option value="">-- Pilih {field.label} --</option>
                            {(field.options || []).map((opt: string) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "file" ? (
                          <div className="space-y-1.5">
                            {formAnswers[field.id] ? (
                              <div className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <FileText className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                      {fileNames[field.id] || "Berkas Terunggah"}
                                    </p>
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                      ✓ Berkas siap dikirim
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormAnswers((prev) => {
                                      const copy = { ...prev };
                                      delete copy[field.id];
                                      return copy;
                                    });
                                    setFileNames((prev) => ({ ...prev, [field.id]: "" }));
                                  }}
                                  className="p-1 text-zinc-400 hover:text-rose-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                                  title="Ganti berkas"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full p-3.5 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 bg-zinc-50/60 dark:bg-zinc-950/60 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 rounded-lg cursor-pointer transition-colors text-center">
                                {uploadingFields[field.id] ? (
                                  <div className="flex items-center gap-2 py-1">
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                      Mengunggah berkas...
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-1">
                                    <UploadCloud className="w-6 h-6 text-zinc-400 group-hover:text-blue-500" />
                                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                      Klik untuk unggah berkas
                                    </div>
                                    <span className="text-[10px] text-zinc-400 font-normal">
                                      PDF, JPG, PNG (Maks. 5MB)
                                    </span>
                                  </div>
                                )}
                                <input
                                  type="file"
                                  disabled={uploadingFields[field.id]}
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) =>
                                    e.target.files?.[0] && handleFileUpload(field.id, e.target.files[0])
                                  }
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        ) : (
                          <Input
                            type="text"
                            placeholder={`Masukkan ${field.label.toLowerCase()}...`}
                            required={field.required}
                            value={formAnswers[field.id] || ""}
                            onChange={(e) =>
                              setFormAnswers({ ...formAnswers, [field.id]: e.target.value })
                            }
                            className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 h-9.5 rounded-md focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-0 shadow-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-500 dark:text-zinc-400">
                    Tidak ada berkas atau kolom formulir khusus yang disyaratkan untuk kegiatan ini. Anda dapat langsung mengirim pendaftaran.
                  </div>
                )}

                <DialogFooter className="pt-2 gap-2 sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="text-xs border-zinc-200 dark:border-zinc-800 rounded-md h-9 hover:bg-zinc-100 dark:hover:bg-zinc-900 shadow-none cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white dark:text-white font-bold text-xs h-9 rounded-md border border-blue-600 dark:border-blue-600 cursor-pointer shadow-none"
                  >
                    Kirim Pendaftaran
                  </Button>
                </DialogFooter>
              </form>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* 5. SUCCESS DIALOG */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg max-w-sm text-center p-6 text-zinc-900 dark:text-zinc-100 shadow-none">
          <DialogHeader className="flex flex-col items-center justify-center space-y-2 pb-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Pendaftaran Terkirim
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              {successMessage}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="justify-center sm:justify-center pt-2">
            <Button
              onClick={() => setIsSuccessOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white dark:text-white font-bold text-xs h-8 rounded-md px-6 border border-blue-600 dark:border-blue-600 shadow-none"
            >
              Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
