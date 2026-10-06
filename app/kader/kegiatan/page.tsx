"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Search, Calendar } from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type {
  EventActivity,
  ParticipantRegistration,
  Requirement
} from "./_components/types";
import { EventCard } from "./_components/EventCard";
import { StagesModal } from "./_components/StagesModal";
import { CertificateModal } from "./_components/CertificateModal";
import { ParticipantCardModal } from "./_components/ParticipantCardModal";
import { RegistrationModal } from "./_components/RegistrationModal";
import { RegistrationSuccessModal } from "./_components/RegistrationSuccessModal";

export default function KaderKegiatanPage() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<EventActivity[]>([]);
  const [registrations, setRegistrations] = useState<ParticipantRegistration[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [kaderisasiList, setKaderisasiList] = useState<any[]>([]);
  const [kurikulumData, setKurikulumData] = useState<Record<string, any> | null>(null);
  const [activeCadre, setActiveCadre] = useState<any | null>(null);

  const match = pathname ? pathname.match(/^\/(peserta|anggota|kader)/) : null;
  const rolePrefix = match
    ? `/${match[1]}`
    : activeCadre?.role
    ? `/${activeCadre.role.toLowerCase()}`
    : "/peserta";

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState<"SEMUA" | "OPEN" | "MY_EVENTS">("SEMUA");

  // Registration Modal State
  const [selectedEvent, setSelectedEvent] = useState<EventActivity | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Success Modal State
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [highlightEventId, setHighlightEventId] = useState<string>("");

  // Participant Card Modal State
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCardEvent, setSelectedCardEvent] = useState<EventActivity | null>(null);
  const [selectedCardReg, setSelectedCardReg] = useState<ParticipantRegistration | null>(null);

  // Stages Modal State (4 Tahap Kegiatan)
  const [selectedStagesEvent, setSelectedStagesEvent] = useState<EventActivity | null>(null);
  const [isStagesModalOpen, setIsStagesModalOpen] = useState(false);
  const [currentStageTab, setCurrentStageTab] = useState<1 | 2 | 3 | 4>(1);

  // Certificate Modal State
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certEvent, setCertEvent] = useState<EventActivity | null>(null);
  const [certReg, setCertReg] = useState<ParticipantRegistration | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // 1. Ambil session user yang sedang login dari localStorage
      const savedUserStr =
        typeof window !== "undefined"
          ? localStorage.getItem("PMII_LOGGED_IN_USER")
          : null;
      let loggedInUser: any = null;
      if (savedUserStr) {
        try {
          loggedInUser = JSON.parse(savedUserStr);
        } catch (e) {}
      }

      // 2. Jika ada Supabase Auth session, prioritaskan email user yang terautentikasi
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user?.email) {
            const authEmail = authData.user.email.toLowerCase();
            if (!loggedInUser || loggedInUser.email?.toLowerCase() !== authEmail) {
              loggedInUser = {
                id: authData.user.id,
                name: authData.user.user_metadata?.name || authEmail.split("@")[0],
                email: authEmail,
                role: authData.user.user_metadata?.role || "anggota",
                commissariat: authData.user.user_metadata?.commissariat || "Ki Ageng Getas Pendawa"
              };
            }
          }
        } catch (e) {
          console.warn("Notice checking supabase auth user:", e);
        }
      }

      const activeId =
        typeof window !== "undefined"
          ? localStorage.getItem("PMII_ACTIVE_CADRE_ID") || ""
          : "";

      const allCadres = await db.getCadres([]);

      // 3. Resolusi identitas kader aktif dengan ketat:
      let current = null;

      // Prioritas 1: Cocokkan email dari akun yang sedang login
      if (loggedInUser?.email) {
        const targetEmail = loggedInUser.email.trim().toLowerCase();
        current = allCadres.find(
          (c: any) => c.email && c.email.trim().toLowerCase() === targetEmail
        );
      }

      // Prioritas 2: Cocokkan activeId atau ID user
      if (!current && activeId) {
        current = allCadres.find((c: any) => c.id === activeId);
      }
      if (!current && loggedInUser?.id) {
        current = allCadres.find(
          (c: any) => c.id === loggedInUser.id || c.user_id === loggedInUser.id
        );
      }

      // Prioritas 3: Jika user login tapi belum terdaftar di tabel kader, gunakan profil loggedInUser
      if (!current && loggedInUser) {
        current = {
          id: loggedInUser.id || `cadre-${Date.now()}`,
          name: loggedInUser.name || loggedInUser.email?.split("@")[0] || "Peserta PMII",
          email: loggedInUser.email || "",
          level: "MAPABA",
          commissariat: loggedInUser.commissariat || "Ki Ageng Getas Pendawa",
          status: "AKTIF",
          submissions: []
        };
      }

      // Prioritas 4: Fallback hanya jika tidak ada sesi login sama sekali
      if (!current) {
        current = allCadres[0] || null;
      }

      setActiveCadre(current);
      if (current?.id && typeof window !== "undefined") {
        localStorage.setItem("PMII_ACTIVE_CADRE_ID", current.id);
      }

      const allKaderisasi = await db.getKaderisasi();
      setKaderisasiList(allKaderisasi);

      const kurikulumRes = await db.getKurikulum();
      setKurikulumData(kurikulumRes);

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

      const allReqs = await db.getRequirements();
      setRequirements(allReqs);

      // Check ?event= or ?level= parameter in URL
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const eventId = params.get("event") || params.get("id");
        const levelParam = params.get("level") || params.get("kaderisasi");

        let target: any = null;
        if (eventId) {
          target = enrichedEvents.find((e: any) => e.id === eventId);
        } else if (levelParam) {
          target = enrichedEvents.find(
            (e: any) =>
              e.level?.trim().toUpperCase() === levelParam.trim().toUpperCase() ||
              e.name?.trim().toUpperCase().includes(levelParam.trim().toUpperCase())
          );
        }

        if (target) {
          setHighlightEventId(target.id);
          const currentEmail = current?.email?.trim().toLowerCase();
          const currentName = current?.name?.trim().toLowerCase();
          const isAlreadyReg = allRegs.some(
            (r) =>
              r.eventId === target.id &&
              ((currentEmail && r.cadreEmail && r.cadreEmail.trim().toLowerCase() === currentEmail) ||
               (currentName && r.cadreName && r.cadreName.trim().toLowerCase() === currentName))
          );
          if (!isAlreadyReg && target.status === "OPEN") {
            setSelectedEvent(target);
            setIsRegisterModalOpen(true);
          }
        }
      }

      setMounted(true);
    };
    loadData();
  }, []);

  // Filtered Events
  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.description &&
        ev.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.level && ev.level.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === "OPEN") {
      return ev.status === "OPEN";
    }

    if (filterTab === "MY_EVENTS") {
      if (!activeCadre) return false;
      const activeEmail = (activeCadre.email || "").trim().toLowerCase();
      const activeName = (activeCadre.name || "").trim().toLowerCase();
      const isRegistered = registrations.some(
        (r) =>
          r.eventId === ev.id &&
          ((activeEmail && r.cadreEmail && r.cadreEmail.trim().toLowerCase() === activeEmail) ||
           (activeName && r.cadreName && r.cadreName.trim().toLowerCase() === activeName))
      );
      return isRegistered;
    }

    return true;
  });

  const getMyRegistration = (eventId: string) => {
    if (!activeCadre) return null;
    const activeEmail = (activeCadre.email || "").trim().toLowerCase();
    const activeName = (activeCadre.name || "").trim().toLowerCase();
    return registrations.find(
      (r) =>
        r.eventId === eventId &&
        ((activeEmail && r.cadreEmail && r.cadreEmail.trim().toLowerCase() === activeEmail) ||
         (activeName && r.cadreName && r.cadreName.trim().toLowerCase() === activeName))
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
    setSelectedEvent({
      ...ev,
      formFields: matched?.formFields || ev.formFields || []
    });
    setIsRegisterModalOpen(true);
  };

  const handleViewParticipantCard = (
    ev: EventActivity,
    reg: ParticipantRegistration
  ) => {
    setSelectedCardEvent(ev);
    setSelectedCardReg(reg);
    setIsCardModalOpen(true);
  };

  // 4 Stages Modal Handler
  const handleOpenStagesModal = (
    ev: EventActivity,
    initialStage?: 1 | 2 | 3 | 4
  ) => {
    setSelectedStagesEvent(ev);
    const myReg = getMyRegistration(ev.id);
    const levelReqs = requirements.filter(
      (r) =>
        (r.eventId && r.eventId === ev.id) ||
        (!r.eventId && r.level?.toUpperCase() === ev.level?.toUpperCase())
    );
    const mySubmissions = activeCadre?.submissions || [];
    const approvedSubmissions = mySubmissions.filter(
      (s: any) =>
        levelReqs.some((r) => r.id === s.requirementId) && s.status === "APPROVED"
    );
    const isRtlFinished =
      levelReqs.length > 0 && approvedSubmissions.length >= levelReqs.length;
    const isGraduated =
      myReg?.isGraduated || isRtlFinished || activeCadre?.status === "SELESAI";

    if (initialStage) {
      setCurrentStageTab(initialStage);
    } else {
      if (isGraduated) {
        setCurrentStageTab(4);
      } else if (
        myReg &&
        myReg.status === "APPROVED" &&
        (mySubmissions.length > 0 || ev.status === "CLOSED")
      ) {
        setCurrentStageTab(3);
      } else if (myReg && myReg.status === "APPROVED") {
        setCurrentStageTab(2);
      } else {
        setCurrentStageTab(1);
      }
    }
    setIsStagesModalOpen(true);
  };

  const handleOpenCertModal = (
    ev: EventActivity,
    reg: ParticipantRegistration | null
  ) => {
    setCertEvent(ev);
    setCertReg(reg);
    setIsCertModalOpen(true);
  };

  const handleSubmitRegistration = async (answers: Record<string, any>) => {
    if (!selectedEvent || !activeCadre) return;

    const regNumber = `REG-${selectedEvent.level}-${Date.now().toString().slice(-4)}`;
    
    // Verifikasi otomatis semua field persyaratan formulir
    const formFields = getEventFormFields(selectedEvent);
    const initialVerificationStatus: Record<string, boolean> = {};
    if (formFields && formFields.length > 0) {
      formFields.forEach((field: any) => {
        initialVerificationStatus[field.id] = true;
      });
    }

    const newReg: ParticipantRegistration = {
      id: `reg-${Date.now()}`,
      eventId: selectedEvent.id,
      cadreName: activeCadre.name,
      cadreEmail: activeCadre.email || "",
      dateApplied: new Date().toISOString().slice(0, 10),
      status: "APPROVED",
      notes: "Pendaftaran otomatis disetujui sistem.",
      answers,
      verificationStatus: initialVerificationStatus,
      registrationNumber: regNumber
    };

    const updated = [newReg, ...registrations];
    setRegistrations(updated);
    await db.saveRegistrations(updated);

    setIsRegisterModalOpen(false);
    setSuccessMessage(
      `Pendaftaran untuk ${selectedEvent.name} telah berhasil dan langsung disetujui secara otomatis (No. Registrasi: ${regNumber}). Anda kini dapat langsung mengunduh Kartu Tanda Peserta dan mengakses tahapan kegiatan.`
    );
    setIsSuccessOpen(true);
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-zinc-900 dark:text-zinc-100">
      {/* 1. HERO HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Agenda & Kegiatan Kaderisasi
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Pantau seluruh alur tahapan kaderisasi: Formulir Pendaftaran, Mengikuti Kegiatan, Tugas RTL, hingga Terima Sertifikat Kelulusan.
          </p>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder="Cari kegiatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-md h-8.5"
            />
          </div>

          <div className="flex rounded-md border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-50 dark:bg-zinc-900 w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={() => setFilterTab("SEMUA")}
              className={`text-xs px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                filterTab === "SEMUA"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("OPEN")}
              className={`text-xs px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                filterTab === "OPEN"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Buka
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("MY_EVENTS")}
              className={`text-xs px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                filterTab === "MY_EVENTS"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Diikuti
            </button>
          </div>
        </div>
      </div>

      {/* 2. EVENT LIST GRID */}
      {filteredEvents.length === 0 ? (
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-center py-12 px-4 shadow-none">
          <Calendar className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <CardTitle className="text-sm font-semibold">
            Tidak ada agenda kegiatan ditemukan
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? "Coba cari dengan kata kunci lain."
              : filterTab === "MY_EVENTS"
              ? "Anda belum terdaftar di kegiatan apa pun saat ini."
              : "Belum ada agenda pelatihan atau kegiatan yang dijadwalkan."}
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              myReg={getMyRegistration(ev.id) || null}
              requirements={requirements}
              activeCadre={activeCadre}
              isHighlighted={highlightEventId === ev.id}
              onOpenStages={(stage) => handleOpenStagesModal(ev, stage)}
              onViewCard={() => {
                const reg = getMyRegistration(ev.id);
                if (reg) handleViewParticipantCard(ev, reg);
              }}
            />
          ))}
        </div>
      )}

      {/* 3. MODAL: DETAIL 4 TAHAPAN KEGIATAN */}
      <StagesModal
        isOpen={isStagesModalOpen}
        onOpenChange={setIsStagesModalOpen}
        event={selectedStagesEvent}
        myReg={selectedStagesEvent ? getMyRegistration(selectedStagesEvent.id) || null : null}
        requirements={requirements}
        activeCadre={activeCadre}
        currentStageTab={currentStageTab}
        onStageTabChange={setCurrentStageTab}
        onOpenRegister={() => {
          setIsStagesModalOpen(false);
          if (selectedStagesEvent) handleOpenRegisterModal(selectedStagesEvent);
        }}
        onViewCard={() => {
          if (selectedStagesEvent) {
            const reg = getMyRegistration(selectedStagesEvent.id);
            if (reg) handleViewParticipantCard(selectedStagesEvent, reg);
          }
        }}
        onOpenCert={() => {
          if (selectedStagesEvent) {
            handleOpenCertModal(
              selectedStagesEvent,
              getMyRegistration(selectedStagesEvent.id) || null
            );
          }
        }}
        onCadreUpdated={(updated) => setActiveCadre(updated)}
        rolePrefix={rolePrefix}
        kurikulumData={kurikulumData}
        kaderisasiList={kaderisasiList}
      />

      {/* 4. MODAL: SERTIFIKAT DIGITAL RESMI */}
      <CertificateModal
        isOpen={isCertModalOpen}
        onOpenChange={setIsCertModalOpen}
        event={certEvent}
        registration={certReg}
        activeCadre={activeCadre}
        kaderisasiList={kaderisasiList}
      />

      {/* 5. MODAL: FORMULIR PENDAFTARAN KEGIATAN */}
      <RegistrationModal
        isOpen={isRegisterModalOpen}
        onOpenChange={setIsRegisterModalOpen}
        event={selectedEvent}
        activeCadre={activeCadre}
        formFields={getEventFormFields(selectedEvent)}
        onSubmit={handleSubmitRegistration}
      />

      {/* 6. MODAL: SUKSES PENDAFTARAN */}
      <RegistrationSuccessModal
        isOpen={isSuccessOpen}
        onOpenChange={setIsSuccessOpen}
        message={successMessage}
        waGroupLink={selectedEvent?.waGroupLink}
        onViewStages={() => {
          setIsSuccessOpen(false);
          if (selectedEvent) {
            handleOpenStagesModal(selectedEvent);
          }
        }}
      />

      {/* 7. MODAL: KARTU PESERTA BER-QR CODE (DENGAN OFFLINE CACHING) */}
      <ParticipantCardModal
        isOpen={isCardModalOpen}
        onOpenChange={setIsCardModalOpen}
        event={selectedCardEvent}
        registration={selectedCardReg}
        activeCadre={activeCadre}
      />
    </div>
  );
}
