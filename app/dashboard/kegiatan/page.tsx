"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Plus,
  Trash2,
  Edit,
  Check,
  Copy,
  Search,
  CheckCircle2,
  ChevronRight,
  Building,
  GraduationCap,
  Users,
  Clock,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Filter
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { db, getDefaultEventTimeline, ensureEvaluationForRegistration } from "@/lib/db";
import type { UserAccount, EventStageTimeline } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  isRecordInTenant,
  enforceTenantWrite,
  getActiveTenant,
  setActiveTenant as setGlobalActiveTenant,
  isCabangOrAdmin,
  DEFAULT_KOMISARIAT_LIST,
  TENANT_CHANGED_EVENT,
  getKomisariatIdByName,
  getTenantIdByName,
  CABANG_TENANT_ID
} from "@/lib/tenancy";
import { generateUUID } from "@/lib/utils";
import { useFeedbackModal } from "@/components/ui/feedback-modal";

import type { FormField, EventActivity, ParticipantRegistration } from "./_components/types";
import { DEFAULT_EVENT_SESSIONS } from "./_components/types";
import EventFormModal from "./_components/EventFormModal";
import DeleteEventModal from "./_components/DeleteEventModal";
import ScreeningTab from "./_components/ScreeningTab";
import ScreeningDetailModal from "./_components/ScreeningDetailModal";
import AttendanceTab from "./_components/AttendanceTab";
import AddParticipantModal from "./_components/AddParticipantModal";
import TimelineTab, { ToggleSwitch } from "./_components/TimelineTab";
import TwibbonTab from "./_components/TwibbonTab";

export type { FormField, EventActivity, ParticipantRegistration };

export default function KomisariatKegiatanPage() {
  const [mounted, setMounted] = useState(false);
  const [commissariats, setCommissariats] = useState<any[]>([]);
  const [activeCampus, setActiveCampus] = useState("Pengurus Cabang Grobogan");
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [events, setEvents] = useState<EventActivity[]>([]);
  const [registrations, setRegistrations] = useState<ParticipantRegistration[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [activeTenant, setActiveTenant] = useState<string>("ALL");
  const [kaderisasiList, setKaderisasiList] = useState<any[]>([]);

  // Search & Filter state
  const [eventSearch, setEventSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"hub" | "detail">("hub");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEventId, setEditEventId] = useState("");

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState("");
  const [deleteEventName, setDeleteEventName] = useState("");

  const [screeningReg, setScreeningReg] = useState<ParticipantRegistration | null>(null);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);

  const { showToast, FeedbackModalComponent } = useFeedbackModal();
  const [copiedId, setCopiedId] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<"timeline" | "screening" | "absensi" | "twibbon">("timeline");

  const handleUpdateTimelineEvent = async (updatedEvent: EventActivity) => {
    const updatedEvents = events.map((e) => (String(e.id) === String(updatedEvent.id) ? updatedEvent : e));
    setEvents(updatedEvents);
    await db.saveEvents(updatedEvents);
  };

  const generateUniqueNTA = (cadresList: any[]): string => {
    const existingNTAs = new Set(cadresList.map((c: any) => c.nta).filter(Boolean));
    for (let i = 0; i < 50; i++) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const testNTA = `PMII-SMG-26.05.22.${randomNum}`;
      if (!existingNTAs.has(testNTA)) {
        return testNTA;
      }
    }
    return `PMII-SMG-26.05.22.${Date.now().toString().slice(-4)}`;
  };

  useEffect(() => {
    const loadData = async () => {
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("PMII_LOGGED_IN_USER");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (!parsed.commissariat) {
              const activeComm = localStorage.getItem("PMII_ACTIVE_COMMISSARIAT");
              if (activeComm && !activeComm.toUpperCase().includes("CABANG")) {
                parsed.commissariat = activeComm;
              }
            }
            if (!parsed.komisariat_id && parsed.commissariat) {
              parsed.komisariat_id = getKomisariatIdByName(parsed.commissariat);
            }
            setCurrentUser(parsed);
          } catch (e) {
            console.error("Error parsing user session:", e);
          }
        }
      }

      // Load commissariats
      try {
        const commList = await db.getCommissariats();
        setCommissariats(commList);
        const storedCampus = localStorage.getItem("PMII_ACTIVE_COMMISSARIAT") || (commList[0]?.name || "Pengurus Cabang Grobogan");
        setActiveCampus(storedCampus);
      } catch (cErr) {
        console.error("Error loading commissariats:", cErr);
      }

      // Load kaderisasi list
      let parsedKaderisasi: any[] = [];
      try {
        parsedKaderisasi = await db.getKaderisasi();
        setKaderisasiList(parsedKaderisasi);
      } catch (err) {
        console.error("Error loading kaderisasi list:", err);
      }

      // Load activities
      const fetchedEvents = await db.getEvents([]);
      setEvents(fetchedEvents);
      if (fetchedEvents.length > 0) {
        setSelectedEventId(fetchedEvents[0].id);
      }

      // Load registrations
      const fetchedRegs = await db.getRegistrations([]);
      const cleanedRegs = fetchedRegs.filter((r: any) => !r.id?.startsWith("reg-mock") && !r.id?.includes("mock"));
      setRegistrations(cleanedRegs);

      setMounted(true);
    };

    const refreshRegistrations = async (showNotice = false) => {
      try {
        const fetchedRegs = await db.getRegistrations();
        const cleanedRegs = fetchedRegs.filter((r: any) => !r.id?.startsWith("reg-mock") && !r.id?.includes("mock"));
        setRegistrations((prev) => {
          if (showNotice && cleanedRegs.length > prev.length) {
            const newItems = cleanedRegs.filter((nr) => !prev.some((pr) => pr.id === nr.id));
            if (newItems.length > 0) {
              const newest = newItems[0];
              showToast(`Pendaftar baru masuk: ${newest.cadreName || "Peserta"}`);
            }
          }
          return cleanedRegs;
        });
      } catch (err) {
        console.warn("Realtime sync registrations warning:", err);
      }
    };

    const refreshEvents = async () => {
      try {
        const fetchedEvents = await db.getEvents([]);
        setEvents(fetchedEvents);
      } catch (err) {
        console.warn("Realtime sync events warning:", err);
      }
    };

    setActiveTenant(getActiveTenant() || "ALL");
    const handleTenant = (e: any) => {
      const nextTenant = e.detail?.activeTenant || "ALL";
      setActiveTenant(nextTenant);
      if (nextTenant !== "ALL") {
        setActiveCampus(nextTenant);
      }
    };
    window.addEventListener(TENANT_CHANGED_EVENT, handleTenant);

    // 1. In-App Custom Event (Same Tab / In-App Event)
    const handleTableSync = (event: any) => {
      const table = event?.detail?.table;
      if (!table || table === "pendaftaran" || table === "kegiatan" || table === "registrations") {
        refreshRegistrations(true);
        refreshEvents();
      }
    };
    window.addEventListener("PMII_TABLE_SYNC", handleTableSync);

    // 2. Storage Event (Cross-Tab Local Storage)
    const handleStorageEvent = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key.includes("registrations") ||
        e.key.includes("pendaftaran") ||
        e.key.includes("events") ||
        e.key.includes("kegiatan")
      ) {
        refreshRegistrations(true);
        refreshEvents();
      }
    };
    window.addEventListener("storage", handleStorageEvent);

    // 3. BroadcastChannel (Cross-Tab Realtime Channel)
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        bc = new BroadcastChannel("pmii_realtime_sync");
        bc.onmessage = (msg) => {
          const table = msg?.data?.table;
          if (!table || table === "pendaftaran" || table === "kegiatan" || table === "registrations") {
            refreshRegistrations(true);
            refreshEvents();
          }
        };
      } catch (e) {}
    }

    // 4. Supabase Postgres Realtime (Cross-Device & Multi-User Sync)
    let supabaseChannel: any = null;
    if (isSupabaseConfigured && supabase) {
      try {
        supabaseChannel = supabase
          .channel("pengurus-kegiatan-realtime-dashboard")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "pendaftaran" },
            () => {
              refreshRegistrations(true);
            }
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "kegiatan" },
            () => {
              refreshEvents();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Supabase Realtime subscription error:", err);
      }
    }

    // 5. Visibility Change (Auto-refresh saat tab kembali aktif)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshRegistrations(false);
        refreshEvents();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 6. Polling Heartbeat Ringan (setiap 8 detik saat tab aktif)
    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshRegistrations(false);
      }
    }, 8000);

    loadData();

    return () => {
      window.removeEventListener(TENANT_CHANGED_EVENT, handleTenant);
      window.removeEventListener("PMII_TABLE_SYNC", handleTableSync);
      window.removeEventListener("storage", handleStorageEvent);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(heartbeatInterval);
      if (bc) bc.close();
      if (supabaseChannel && supabase) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, []);

  // Filter events: periksa foreign key tenant_id / komisariat_id dan nama komisariat
  const campusEvents = events.filter((e) =>
    isRecordInTenant(currentUser, {
      commissariat: e.commissariat,
      komisariat_id: e.komisariat_id,
      tenant_id: e.tenant_id || e.komisariat_id
    }, activeTenant)
  );

  const filteredCampusEvents = campusEvents.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.level.toLowerCase().includes(eventSearch.toLowerCase()) ||
      (e.commissariat || "").toLowerCase().includes(eventSearch.toLowerCase());
    const matchesLevel = levelFilter === "ALL" || e.level === levelFilter;
    const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const handleOpenDetail = (evtId: string) => {
    setSelectedEventId(evtId);
    setViewMode("detail");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackToHub = () => {
    setViewMode("hub");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const selectedEvent = campusEvents.find((e) => e.id === selectedEventId) || campusEvents[0];
  const activeRegistrations = registrations
    .filter((r) => r.eventId === (selectedEvent?.id || selectedEventId))
    .filter((r) =>
      isRecordInTenant(currentUser, {
        commissariat: selectedEvent?.commissariat,
        komisariat_id: selectedEvent?.komisariat_id,
        tenant_id: selectedEvent?.tenant_id || selectedEvent?.komisariat_id
      }, activeTenant)
    );

  const pendingCount = activeRegistrations.filter((r) => r.status === "PENDING").length;
  const approvedCount = activeRegistrations.filter((r) => r.status === "APPROVED").length;
  const graduatedCount = activeRegistrations.filter((r) => r.isGraduated).length;

  const handleCopyLink = (eventId: string) => {
    if (typeof window !== "undefined") {
      const link = `${window.location.origin}/kader/kegiatan?event=${eventId}`;
      navigator.clipboard.writeText(link);
      setCopiedId(eventId);
      showToast("Tautan kegiatan disalin.");
      setTimeout(() => setCopiedId(""), 3000);
    }
  };

  const handleToggleEventStatus = async (checked: boolean) => {
    if (!selectedEvent) return;
    const newStatus = checked ? "OPEN" : "CLOSED";
    const currentTimeline = selectedEvent.timeline || getDefaultEventTimeline(selectedEvent);
    const updatedTimeline: EventStageTimeline = {
      ...currentTimeline,
      registration: {
        ...currentTimeline.registration,
        isOpen: checked
      }
    };
    const updatedEvent: EventActivity = {
      ...selectedEvent,
      status: newStatus,
      timeline: updatedTimeline
    };
    await handleUpdateTimelineEvent(updatedEvent);
    showToast(
      checked
        ? "Kegiatan & pendaftaran dibuka untuk publik."
        : "Kegiatan & pendaftaran ditutup."
    );
  };

  // Submit New Event
  const handleCreateEvent = async (eventData: {
    name: string;
    level: string;
    date: string;
    description?: string;
    sessions?: string[];
    waGroupLink?: string;
    commissariat?: string;
    komisariat_id?: string | null;
    tenant_id?: string | null;
  }) => {
    const tid = eventData.tenant_id ?? eventData.komisariat_id;
    const isCabang = tid === CABANG_TENANT_ID || (eventData.commissariat && eventData.commissariat.includes("Cabang"));
    const assignedId = isCabang ? CABANG_TENANT_ID : (tid ?? undefined);
    const newEvent: EventActivity = enforceTenantWrite(currentUser, {
      id: generateUUID(),
      name: eventData.name,
      level: eventData.level,
      date: eventData.date,
      commissariat: isCabang ? "Pengurus Cabang Grobogan" : (eventData.commissariat || activeCampus),
      komisariat_id: assignedId,
      tenant_id: assignedId,
      description: eventData.description || "",
      status: "OPEN",
      sessions: eventData.sessions && eventData.sessions.length > 0 ? eventData.sessions : [],
      waGroupLink: eventData.waGroupLink || ""
    });

    const updatedEvents = [newEvent, ...events];
    setEvents(updatedEvents);
    await db.saveEvents(updatedEvents);

    setSelectedEventId(newEvent.id);
    setShowCreateModal(false);
    showToast("Kegiatan baru berhasil dibuat.");
  };

  // Submit Updated Event
  const handleUpdateEvent = async (eventData: {
    name: string;
    level: string;
    date: string;
    description?: string;
    sessions?: string[];
    waGroupLink?: string;
    commissariat?: string;
    komisariat_id?: string | null;
    tenant_id?: string | null;
  }) => {
    const tid = eventData.tenant_id ?? eventData.komisariat_id;
    const isCabang = tid === CABANG_TENANT_ID || (eventData.commissariat && eventData.commissariat.includes("Cabang"));
    const updatedEvents = events.map((e) => {
      if (e.id === editEventId) {
        const assignedId = isCabang ? CABANG_TENANT_ID : (tid !== undefined ? tid : (e.tenant_id || e.komisariat_id));
        return {
          ...e,
          name: eventData.name,
          level: eventData.level,
          date: eventData.date,
          commissariat: isCabang ? "Pengurus Cabang Grobogan" : (eventData.commissariat || e.commissariat),
          komisariat_id: assignedId,
          tenant_id: assignedId,
          description: eventData.description || "",
          sessions: eventData.sessions && eventData.sessions.length > 0 ? eventData.sessions : [],
          waGroupLink: eventData.waGroupLink ?? e.waGroupLink ?? ""
        };
      }
      return e;
    });

    setEvents(updatedEvents);
    await db.saveEvents(updatedEvents);

    setShowEditModal(false);
    setEditEventId("");
    showToast("Perubahan kegiatan disimpan.");
  };

  // Confirm Event Deletion
  const confirmDeleteEvent = async () => {
    if (!deleteEventId) return;

    try {
      // 1. Hapus permanen dari Supabase & bersihkan pendaftaran terkait
      await db.deleteEvent(deleteEventId);

      // 2. Perbarui state lokal
      const remainingEvents = events.filter((e) => e.id !== deleteEventId);
      setEvents(remainingEvents);

      const remainingRegistrations = registrations.filter((r) => r.eventId !== deleteEventId);
      setRegistrations(remainingRegistrations);

      if (selectedEventId === deleteEventId) {
        const nextEvent = remainingEvents.find((e) =>
          isRecordInTenant(currentUser, { commissariat: e.commissariat, komisariat_id: e.komisariat_id }, activeTenant)
        );
        setSelectedEventId(nextEvent ? nextEvent.id : "");
      }

      setShowDeleteConfirmModal(false);
      setDeleteEventId("");
      setDeleteEventName("");
      showToast("Kegiatan berhasil dihapus.");
    } catch (err: any) {
      console.error("Error deleting event:", err);
      showToast("Gagal menghapus kegiatan.");
    }
  };

  // Save Screening Result
  const handleSaveScreeningResult = async (
    regId: string,
    status: "APPROVED" | "REJECTED",
    notes: string,
    verificationStatus: Record<string, boolean>
  ) => {
    const targetReg = registrations.find((r) => r.id === regId);
    if (!targetReg) return;

    const updatedRegs = registrations.map((r) => {
      if (r.id === regId) {
        return { ...r, status, notes, verificationStatus };
      }
      return r;
    });

    setRegistrations(updatedRegs);
    await db.saveRegistrations(updatedRegs);

    if (status === "APPROVED") {
      try {
        const cadresList = await db.getCadres();
        const exists = cadresList.some(
          (c: any) =>
            c.name.toLowerCase().includes(targetReg.cadreName.toLowerCase()) ||
            (c.email && c.email.toLowerCase() === targetReg.cadreEmail.toLowerCase())
        );

        let updatedCadresList;
        if (exists) {
          updatedCadresList = cadresList.map((c: any) => {
            if (
              c.name.toLowerCase().includes(targetReg.cadreName.toLowerCase()) ||
              (c.email && c.email.toLowerCase() === targetReg.cadreEmail.toLowerCase())
            ) {
              return {
                ...c,
                status: selectedEvent?.level === "MAPABA" ? "AKTIF" : c.status,
                isGraduated: selectedEvent?.level === "MAPABA" ? c.isGraduated || false : true
              };
            }
            return c;
          });
        } else {
          let extractedPhone = "";
          let extractedIG = "";
          let extractedAddress = "";

          const eventKad = kaderisasiList.find(
            (k) => k.nama === selectedEvent?.level || k.id === selectedEvent?.level
          );
          const eventFormFields = eventKad?.formFields || [];

          Object.keys(targetReg.answers).forEach((fid) => {
            const fieldObj = (eventFormFields || []).find((ff: any) => ff.id === fid);
            if (fieldObj) {
              const labelLower = fieldObj.label.toLowerCase();
              const val = targetReg.answers[fid];
              if (
                labelLower.includes("hp") ||
                labelLower.includes("telepon") ||
                labelLower.includes("wa") ||
                labelLower.includes("phone")
              ) {
                extractedPhone = val;
              } else if (labelLower.includes("instagram") || labelLower.includes("ig")) {
                extractedIG = val;
              } else if (
                labelLower.includes("alamat") ||
                labelLower.includes("tinggal") ||
                labelLower.includes("address")
              ) {
                extractedAddress = val;
              }
            }
          });

          const newCadre = {
            id: `cadre-${Date.now()}`,
            name: targetReg.cadreName,
            level: (selectedEvent?.level as "MAPABA" | "PKD" | "PKL") || "MAPABA",
            commissariat: activeCampus,
            startDate: new Date().toISOString().split("T")[0],
            status: "AKTIF" as const,
            phone: extractedPhone,
            email: targetReg.cadreEmail,
            address: extractedAddress,
            instagram: extractedIG,
            submissions: [],
            isGraduated: selectedEvent?.level !== "MAPABA",
            registrationNumber:
              targetReg.registrationNumber || `MAP-${Math.floor(100000 + Math.random() * 900000)}`
          };
          updatedCadresList = [...cadresList, newCadre];
        }
        await db.saveCadres(updatedCadresList);
      } catch (err) {
        console.error("Failed to sync cadre on screening approval:", err);
      }

      try {
        await ensureEvaluationForRegistration(targetReg, selectedEvent);
      } catch (evalErr) {
        console.warn("Failed to sync evaluation on screening approval:", evalErr);
      }
    }

    setScreeningReg(null);
    showToast("Hasil screening disimpan.");
  };

  // Quick Approve a single registration
  const handleQuickApprove = async (reg: ParticipantRegistration) => {
    const eventKad = kaderisasiList.find(
      (k) => k.nama === selectedEvent?.level || k.id === selectedEvent?.level
    );
    const formFields = eventKad?.formFields || selectedEvent?.formFields || [];
    const allVerified: Record<string, boolean> = {};
    formFields.forEach((f: any) => {
      allVerified[f.id] = true;
    });

    await handleSaveScreeningResult(
      reg.id,
      "APPROVED",
      "Pendaftaran disetujui langsung oleh Admin.",
      allVerified
    );
    showToast(`Pendaftaran ${reg.cadreName} berhasil disetujui.`);
  };

  // Batch approve all pending registrations
  const handleBatchApprove = async (pendingRegs: ParticipantRegistration[]) => {
    if (!pendingRegs || pendingRegs.length === 0) return;

    const eventKad = kaderisasiList.find(
      (k) => k.nama === selectedEvent?.level || k.id === selectedEvent?.level
    );
    const formFields = eventKad?.formFields || selectedEvent?.formFields || [];
    const allVerified: Record<string, boolean> = {};
    formFields.forEach((f: any) => {
      allVerified[f.id] = true;
    });

    const pendingIds = new Set(pendingRegs.map((r) => r.id));
    const updatedRegs = registrations.map((r) => {
      if (pendingIds.has(r.id)) {
        return {
          ...r,
          status: "APPROVED" as const,
          notes: "Pendaftaran disetujui otomatis oleh Admin.",
          verificationStatus: allVerified
        };
      }
      return r;
    });

    setRegistrations(updatedRegs);
    await db.saveRegistrations(updatedRegs);

    // Sync cadres for approved participants
    try {
      const cadresList = await db.getCadres();
      let workingCadres = [...cadresList];

      for (const reg of pendingRegs) {
        const exists = workingCadres.some(
          (c: any) =>
            c.name.toLowerCase().includes(reg.cadreName.toLowerCase()) ||
            (c.email && c.email.toLowerCase() === reg.cadreEmail.toLowerCase())
        );

        if (exists) {
          workingCadres = workingCadres.map((c: any) => {
            if (
              c.name.toLowerCase().includes(reg.cadreName.toLowerCase()) ||
              (c.email && c.email.toLowerCase() === reg.cadreEmail.toLowerCase())
            ) {
              return {
                ...c,
                status: selectedEvent?.level === "MAPABA" ? "AKTIF" : c.status,
                isGraduated: selectedEvent?.level === "MAPABA" ? c.isGraduated || false : true
              };
            }
            return c;
          });
        } else {
          let extractedPhone = "";
          let extractedAddress = "";
          Object.keys(reg.answers || {}).forEach((fid) => {
            const fieldObj = (formFields || []).find((ff: any) => ff.id === fid);
            if (fieldObj) {
              const labelLower = fieldObj.label.toLowerCase();
              const val = reg.answers[fid];
              if (labelLower.includes("hp") || labelLower.includes("telepon") || labelLower.includes("wa")) {
                extractedPhone = val;
              } else if (labelLower.includes("alamat")) {
                extractedAddress = val;
              }
            }
          });

          const newCadre = {
            id: `cadre-${Date.now()}-${Math.random()}`,
            name: reg.cadreName,
            level: (selectedEvent?.level as "MAPABA" | "PKD" | "PKL") || "MAPABA",
            commissariat: activeCampus,
            startDate: new Date().toISOString().split("T")[0],
            status: "AKTIF" as const,
            phone: extractedPhone,
            email: reg.cadreEmail,
            address: extractedAddress,
            instagram: "",
            submissions: [],
            isGraduated: selectedEvent?.level !== "MAPABA",
            registrationNumber:
              reg.registrationNumber || `MAP-${Math.floor(100000 + Math.random() * 900000)}`
          };
          workingCadres.push(newCadre);
        }
      }

      await db.saveCadres(workingCadres);
    } catch (err) {
      console.error("Failed to sync cadres on batch approval:", err);
    }

    try {
      for (const reg of pendingRegs) {
        await ensureEvaluationForRegistration(reg, selectedEvent);
      }
    } catch (evalErr) {
      console.warn("Failed to sync evaluations on batch approval:", evalErr);
    }

    showToast(`${pendingRegs.length} pendaftar berhasil disetujui sekaligus.`);
  };

  // Delete participant registration
  const handleDeleteRegistration = async (regId: string, cadreName?: string) => {
    try {
      await db.deleteRegistration(regId);
      const remainingRegs = registrations.filter((r) => r.id !== regId);
      setRegistrations(remainingRegs);
      await db.saveRegistrations(remainingRegs);
      showToast(`Data pendaftar ${cadreName ? `"${cadreName}" ` : ""}berhasil dihapus.`);
    } catch (err) {
      console.error("Error deleting registration:", err);
      showToast("Gagal menghapus data pendaftar.");
    }
  };

  // Add participant directly and auto-approve
  const handleAddParticipant = async (data: {
    cadreName: string;
    cadreEmail: string;
    answers?: Record<string, string>;
  }) => {
    if (!selectedEvent) return;

    const eventKad = kaderisasiList.find(
      (k) => k.nama === selectedEvent.level || k.id === selectedEvent.level
    );
    const formFields = eventKad?.formFields || selectedEvent.formFields || [];
    const allVerified: Record<string, boolean> = {};
    formFields.forEach((f: any) => {
      allVerified[f.id] = true;
    });

    const regNumber = `REG-${selectedEvent.level}-${Date.now().toString().slice(-4)}`;
    const newReg: ParticipantRegistration = {
      id: `reg-${Date.now()}`,
      eventId: selectedEvent.id,
      cadreName: data.cadreName,
      cadreEmail: data.cadreEmail,
      dateApplied: new Date().toISOString().slice(0, 10),
      status: "APPROVED",
      notes: "Ditambahkan dan disetujui langsung oleh Admin.",
      answers: data.answers || {},
      verificationStatus: allVerified,
      registrationNumber: regNumber
    };

    const updated = [newReg, ...registrations];
    setRegistrations(updated);
    await db.saveRegistrations(updated);

    // Sync cadre
    try {
      const cadresList = await db.getCadres();
      const exists = cadresList.some(
        (c: any) =>
          c.name.toLowerCase().includes(data.cadreName.toLowerCase()) ||
          (c.email && c.email.toLowerCase() === data.cadreEmail.toLowerCase())
      );

      if (!exists) {
        const newCadre = {
          id: `cadre-${Date.now()}`,
          name: data.cadreName,
          level: (selectedEvent.level as "MAPABA" | "PKD" | "PKL") || "MAPABA",
          commissariat: activeCampus,
          startDate: new Date().toISOString().split("T")[0],
          status: "AKTIF" as const,
          phone: data.answers?.["f-hp"] || "",
          email: data.cadreEmail,
          address: data.answers?.["f-alamat"] || `Komisariat ${activeCampus}`,
          instagram: data.answers?.["f-ig"] || "",
          submissions: [],
          isGraduated: selectedEvent.level !== "MAPABA",
          registrationNumber: regNumber
        };
        await db.saveCadres([...cadresList, newCadre]);
      }
    } catch (err) {
      console.error("Failed to sync cadre on manual participant add:", err);
    }

    try {
      await ensureEvaluationForRegistration(newReg, selectedEvent);
    } catch (evalErr) {
      console.warn("Failed to sync evaluation on manual participant add:", evalErr);
    }

    showToast(`${data.cadreName} berhasil didaftarkan dan langsung disetujui.`);
  };

  // Attendance scan code handler
  const handleScanCode = (
    code: string,
    sessionName: string
  ): { success: boolean; message: string; participantName?: string } => {
    if (!code) return { success: false, message: "Kode QR kosong." };

    let cleanCode = code.trim();
    if (cleanCode.startsWith("{") && cleanCode.endsWith("}")) {
      try {
        const parsed = JSON.parse(cleanCode);
        cleanCode = parsed.reg || parsed.registrationNumber || parsed.id || cleanCode;
      } catch {}
    } else if (cleanCode.includes(":")) {
      const parts = cleanCode.split(":");
      cleanCode = parts[parts.length - 1] || cleanCode;
    }

    const foundReg = registrations.find(
      (r) =>
        (r.registrationNumber?.toLowerCase() === cleanCode.toLowerCase() ||
         r.id?.toLowerCase() === cleanCode.toLowerCase()) &&
        r.eventId === selectedEvent?.id
    );

    if (!foundReg) {
      return { success: false, message: "Kode tidak ditemukan di kegiatan ini." };
    }

    if (foundReg.status !== "APPROVED") {
      return {
        success: false,
        message: `${foundReg.cadreName} belum lolos screening berkas.`
      };
    }

    const currentAtt = foundReg.attendance || [];
    if (currentAtt.includes(sessionName)) {
      return {
        success: false,
        message: `${foundReg.cadreName} sudah tercatat di sesi ini.`
      };
    }

    const updatedAtt = [...currentAtt, sessionName];
    const updatedRegs = registrations.map((r) => {
      if (r.id === foundReg.id) {
        return { ...r, attendance: updatedAtt };
      }
      return r;
    });

    setRegistrations(updatedRegs);
    db.saveRegistrations(updatedRegs);

    return {
      success: true,
      participantName: foundReg.cadreName,
      message: `Presensi berhasil: ${foundReg.cadreName}.`
    };
  };

  // Graduation mark handler
  const handleMarkGraduated = async (regId: string) => {
    const reg = registrations.find((r) => r.id === regId);
    if (!reg) return;

    const updatedRegs = registrations.map((r) => {
      if (r.id === regId) {
        return { ...r, isGraduated: true };
      }
      return r;
    });
    setRegistrations(updatedRegs);
    await db.saveRegistrations(updatedRegs);

    const cadresList = await db.getCadres();
    const generatedNTA = generateUniqueNTA(cadresList);

    const matchedCadre = cadresList.find(
      (c: any) =>
        c.email?.toLowerCase() === reg.cadreEmail.toLowerCase() ||
        c.name.toLowerCase() === reg.cadreName.toLowerCase()
    );

    let updatedCadresList;
    if (matchedCadre) {
      updatedCadresList = cadresList.map((c: any) => {
        if (c.id === matchedCadre.id) {
          return {
            ...c,
            isGraduated: true,
            status: "SELESAI",
            nta: c.nta || generatedNTA,
            startDate: c.startDate || new Date().toISOString().split("T")[0],
            angkatan: c.angkatan || (c.startDate ? c.startDate.split("-")[0] : new Date().getFullYear().toString())
          };
        }
        return c;
      });
    } else {
      const gradYear = new Date().getFullYear().toString();
      const newCadre = {
        id: `cadre-${Date.now()}`,
        name: reg.cadreName,
        level: (selectedEvent?.level as "MAPABA" | "PKD" | "PKL") || "MAPABA",
        commissariat: activeCampus,
        startDate: new Date().toISOString().split("T")[0],
        status: "SELESAI" as const,
        phone: reg.answers["f-hp"] || reg.answers["f-phone"] || "",
        email: reg.cadreEmail,
        address: reg.answers["f-alamat"] || `Komisariat ${activeCampus}`,
        instagram: reg.answers["f-ig"] || "",
        submissions: [],
        isGraduated: true,
        nta: generatedNTA,
        registrationNumber: reg.registrationNumber,
        angkatan: gradYear
      };
      updatedCadresList = [...cadresList, newCadre];
    }

    await db.saveCadres(updatedCadresList);
    showToast(`${reg.cadreName} dinyatakan lulus.`);
  };

  // Revoke graduation
  const handleRevokeGraduation = async (regId: string) => {
    const reg = registrations.find((r) => r.id === regId);
    if (!reg) return;

    const updatedRegs = registrations.map((r) => {
      if (r.id === regId) {
        return { ...r, isGraduated: false };
      }
      return r;
    });
    setRegistrations(updatedRegs);
    await db.saveRegistrations(updatedRegs);

    const cadresList = await db.getCadres();
    const updatedCadresList = cadresList.map((c: any) => {
      if (
        c.email?.toLowerCase() === reg.cadreEmail.toLowerCase() ||
        c.name.toLowerCase() === reg.cadreName.toLowerCase()
      ) {
        return { ...c, isGraduated: false, status: "AKTIF", nta: undefined };
      }
      return c;
    });
    await db.saveCadres(updatedCadresList);
    showToast(`Status kelulusan ${reg.cadreName} dibatalkan.`);
  };

  // Batch graduate
  const handleBatchGraduate = async (regIds: string[]) => {
    const idSet = new Set(regIds);
    const updatedRegs = registrations.map((r) => {
      if (idSet.has(r.id)) {
        return { ...r, isGraduated: true };
      }
      return r;
    });
    setRegistrations(updatedRegs);
    await db.saveRegistrations(updatedRegs);

    const cadresList = await db.getCadres();
    let workingCadres = [...cadresList];

    for (const regId of regIds) {
      const reg = registrations.find((r) => r.id === regId);
      if (!reg) continue;

      const generatedNTA = generateUniqueNTA(workingCadres);
      const matchedCadre = workingCadres.find(
        (c: any) =>
          c.email?.toLowerCase() === reg.cadreEmail.toLowerCase() ||
          c.name.toLowerCase() === reg.cadreName.toLowerCase()
      );

      if (matchedCadre) {
        workingCadres = workingCadres.map((c: any) => {
          if (c.id === matchedCadre.id) {
            return {
              ...c,
              isGraduated: true,
              status: "SELESAI",
              nta: c.nta || generatedNTA,
              angkatan: c.angkatan || (c.startDate ? c.startDate.split("-")[0] : new Date().getFullYear().toString())
            };
          }
          return c;
        });
      } else {
        const gradYear = new Date().getFullYear().toString();
        const newCadre = {
          id: `cadre-${Date.now()}-${Math.random()}`,
          name: reg.cadreName,
          level: (selectedEvent?.level as "MAPABA" | "PKD" | "PKL") || "MAPABA",
          commissariat: activeCampus,
          startDate: new Date().toISOString().split("T")[0],
          status: "SELESAI" as const,
          phone: reg.answers["f-hp"] || reg.answers["f-phone"] || "",
          email: reg.cadreEmail,
          address: reg.answers["f-alamat"] || `Komisariat ${activeCampus}`,
          instagram: reg.answers["f-ig"] || "",
          submissions: [],
          isGraduated: true,
          nta: generatedNTA,
          registrationNumber: reg.registrationNumber,
          angkatan: gradYear
        };
        workingCadres.push(newCadre);
      }
    }

    await db.saveCadres(workingCadres);
    showToast(`${regIds.length} peserta diluluskan.`);
  };

  if (!mounted) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-lg lg:col-span-1" />
          <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-lg lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 select-none pb-12">
      {viewMode === "hub" ? (
        /* ========================================================================= */
        /* TAMPILAN 1: HUB GRID KEGIATAN (OVERVIEW SEMUA KEGIATAN)                  */
        /* ========================================================================= */
        <div className="space-y-5">
          {/* Header Toolbar Hub */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-3.5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="space-y-1">
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500 font-normal">
                  <Link
                    href="/dashboard"
                    className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    Hub Kegiatan Kaderisasi
                  </span>
                  <span className="inline-flex items-center gap-1 ml-1 px-2 py-0.2 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Sync
                  </span>
                </nav>
                <h1 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Pusat Manajemen Kegiatan
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                  Kelola pendaftaran kader, verifikasi berkas screening, presensi QR, dan twibbon kegiatan.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Komisariat / Tenant Filter jika Admin/Cabang */}
                {isCabangOrAdmin(currentUser) && (
                  <div className="flex-1 sm:w-52">
                    <Select
                      value={activeTenant}
                      onValueChange={(val) => {
                        if (val) {
                          setActiveTenant(val);
                          setGlobalActiveTenant(val);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg w-full">
                        <SelectValue placeholder="Semua Komisariat">
                          {activeTenant === "ALL" ? "Semua Komisariat / Cabang" : activeTenant}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg max-h-60">
                        <SelectItem value="ALL" className="text-xs">Semua Komisariat / Cabang</SelectItem>
                        <SelectItem value="Pengurus Cabang Grobogan" className="text-xs">Pengurus Cabang Grobogan</SelectItem>
                        {DEFAULT_KOMISARIAT_LIST.map((c) => (
                          <SelectItem key={c} value={c} className="text-xs">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3 sm:px-3.5 h-8.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors border-none shadow-2xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Buat Kegiatan Baru</span>
                  <span className="sm:hidden">Buat Kegiatan</span>
                </Button>
              </div>
            </div>

            {/* Search & Filter Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 pt-0.5">
              <div className="col-span-2 sm:col-span-6 relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Cari nama kegiatan atau komisariat..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="pl-8.5 h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 w-full"
                />
              </div>

              <div className="col-span-1 sm:col-span-3">
                <Select value={levelFilter} onValueChange={(val) => setLevelFilter(val || "ALL")}>
                  <SelectTrigger className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg w-full">
                    <SelectValue placeholder="Semua Tingkat">
                      {levelFilter === "ALL" ? "Semua Tingkat" : levelFilter}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectItem value="ALL" className="text-xs">Semua Tingkat</SelectItem>
                    <SelectItem value="MAPABA" className="text-xs">MAPABA</SelectItem>
                    <SelectItem value="PKD" className="text-xs">PKD</SelectItem>
                    <SelectItem value="PKL" className="text-xs">PKL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-1 sm:col-span-3">
                <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
                  <SelectTrigger className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg w-full">
                    <SelectValue placeholder="Semua Status">
                      {statusFilter === "ALL"
                        ? "Semua Status"
                        : statusFilter === "OPEN"
                        ? "Buka"
                        : "Tutup"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                    <SelectItem value="OPEN" className="text-xs">Pendaftaran Buka</SelectItem>
                    <SelectItem value="CLOSED" className="text-xs">Pendaftaran Tutup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Indikator Filter Aktif & Reset */}
            {(eventSearch.trim() !== "" || levelFilter !== "ALL" || statusFilter !== "ALL") && (
              <div className="flex items-center justify-between gap-2 text-xs pt-1 px-0.5 text-zinc-500">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-zinc-400">Filter aktif:</span>
                  {eventSearch.trim() !== "" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10.5px]">
                      &ldquo;{eventSearch}&rdquo;
                      <button
                        type="button"
                        onClick={() => setEventSearch("")}
                        className="hover:text-rose-500 cursor-pointer ml-0.5 text-zinc-400"
                        title="Hapus pencarian"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {levelFilter !== "ALL" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10.5px]">
                      Tingkat: {levelFilter}
                      <button
                        type="button"
                        onClick={() => setLevelFilter("ALL")}
                        className="hover:text-rose-500 cursor-pointer ml-0.5 text-blue-400"
                        title="Reset tingkat"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {statusFilter !== "ALL" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10.5px]">
                      Status: {statusFilter === "OPEN" ? "Buka" : "Tutup"}
                      <button
                        type="button"
                        onClick={() => setStatusFilter("ALL")}
                        className="hover:text-rose-500 cursor-pointer ml-0.5 text-emerald-400"
                        title="Reset status"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEventSearch("");
                    setLevelFilter("ALL");
                    setStatusFilter("ALL");
                  }}
                  className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer ml-auto shrink-0"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>

          {/* Grid Kartu Kegiatan (Hub Cards) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Daftar Kegiatan ({filteredCampusEvents.length})
              </h2>
            </div>

            {filteredCampusEvents.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mx-auto">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Tidak Ada Kegiatan yang Sesuai
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto font-normal">
                  Coba ubah kata kunci pencarian atau buat kegiatan kaderisasi baru dengan mengklik tombol di bawah.
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 h-8.5 rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Buat Kegiatan Baru</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {filteredCampusEvents.map((evt) => {
                  const evtRegs = registrations.filter((r) => r.eventId === evt.id);
                  const pCount = evtRegs.filter((r) => r.status === "PENDING").length;
                  const aCount = evtRegs.filter((r) => r.status === "APPROVED").length;

                  return (
                    <Card
                      key={evt.id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col justify-between group space-y-3"
                    >
                      {/* Card Header */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 shrink-0">
                              {evt.level}
                            </span>
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                evt.status === "OPEN"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                              }`}
                            >
                              {evt.status === "OPEN" && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              )}
                              <span>{evt.status === "OPEN" ? "BUKA" : "TUTUP"}</span>
                            </span>
                          </div>

                          <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {evt.date}
                          </span>
                        </div>

                        {/* Title & Commissariat */}
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                            {evt.name}
                          </h3>

                          <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500 font-normal">
                            {evt.komisariat_id === null || (evt.commissariat && evt.commissariat.toLowerCase().includes("cabang")) ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                                <Building className="w-3.5 h-3.5" />
                                <span>Tingkat Cabang Grobogan</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 truncate">
                                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{evt.commissariat || "Komisariat PMII"}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress / Quick Stats Box */}
                        <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                              {evtRegs.length}
                            </span>
                            <span className="text-zinc-400 ml-1">Pendaftar</span>
                            <span className="text-zinc-300 dark:text-zinc-700 mx-1.5">•</span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {aCount} Lolos
                            </span>
                          </div>

                          {pCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                              {pCount} Perlu Cek
                            </span>
                          ) : (
                            <span className="text-[10.5px] text-zinc-400">
                              Verifikasi Beres
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Quick Actions & Primary CTA */}
                      <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyLink(evt.id);
                            }}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-blue-600 cursor-pointer transition-colors"
                            title="Salin Tautan Form Pendaftaran"
                          >
                            {copiedId === evt.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditEventId(evt.id);
                              setShowEditModal(true);
                            }}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                            title="Edit Kegiatan"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteEventId(evt.id);
                              setDeleteEventName(evt.name);
                              setShowDeleteConfirmModal(true);
                            }}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-400 hover:text-rose-600 cursor-pointer transition-colors"
                            title="Hapus Kegiatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Primary Button to Open Detail */}
                        <Button
                          type="button"
                          onClick={() => handleOpenDetail(evt.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8 px-3 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>Kelola</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* TAMPILAN 2: DETAIL WORKSPACE KEGIATAN TERPILIH (100% LEBAR PENUH)       */
        /* ========================================================================= */
        selectedEvent && (
          <div className="space-y-5">
            {/* Navigasi Kembali ke Hub */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackToHub}
                className="h-8 px-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium flex items-center gap-1.5 cursor-pointer w-fit"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Semua Kegiatan</span>
              </Button>

              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500 font-normal">
                <Link
                  href="/dashboard"
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Dashboard
                </Link>
                <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                <button
                  type="button"
                  onClick={handleBackToHub}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  Kegiatan
                </button>
                <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">
                  {selectedEvent.name}
                </span>
                <span className="inline-flex items-center gap-1 ml-1 px-2 py-0.2 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </nav>
            </div>

            {/* Header Kegiatan Terpilih */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Info Kegiatan */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                      {selectedEvent.name}
                    </h1>
                    <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold uppercase bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/60">
                      {selectedEvent.level}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-zinc-500 flex-wrap font-normal">
                    <span className="font-mono text-[11px] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      {selectedEvent.date}
                    </span>
                    {selectedEvent.commissariat && (
                      <>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-zinc-400" />
                          {selectedEvent.commissariat}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Actions Toolbar */}
                <div className="flex items-center gap-2 flex-wrap sm:self-center">
                  {/* Toggle Status Pendaftaran */}
                  <div className="flex items-center gap-2 px-2.5 h-8.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs">
                    <span className="text-[11px] text-zinc-500 font-normal">Pendaftaran:</span>
                    <ToggleSwitch
                      checked={selectedEvent.status === "OPEN"}
                      onChange={handleToggleEventStatus}
                    />
                    <span className={`text-[11px] font-medium ${
                      selectedEvent.status === "OPEN" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                    }`}>
                      {selectedEvent.status === "OPEN" ? "Buka" : "Tutup"}
                    </span>
                  </div>

                  {/* Edit Event */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditEventId(selectedEvent.id);
                      setShowEditModal(true);
                    }}
                    className="h-8.5 px-3 rounded-lg cursor-pointer border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Edit</span>
                  </Button>

                  {/* Hapus Event */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDeleteEventId(selectedEvent.id);
                      setDeleteEventName(selectedEvent.name);
                      setShowDeleteConfirmModal(true);
                    }}
                    className="h-8.5 w-8.5 p-0 rounded-lg cursor-pointer border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors"
                    title="Hapus Kegiatan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Full-Width Workspace Card (4 Tabs Kerja) */}
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-2xs space-y-5 text-zinc-900 dark:text-zinc-100">
              {/* CLEAN MINIMALIST TABS */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-4 sm:gap-6 overflow-x-auto pb-px">
                <button
                  type="button"
                  onClick={() => setSelectedTab("timeline")}
                  className={`pb-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 whitespace-nowrap px-0.5 ${
                    selectedTab === "timeline"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  <span>Alur & Timeline</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTab("screening")}
                  className={`pb-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 whitespace-nowrap px-0.5 ${
                    selectedTab === "screening"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  <span>Screening Berkas</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-medium ${
                    selectedTab === "screening"
                      ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}>
                    {activeRegistrations.length}
                  </span>
                  {pendingCount > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title={`${pendingCount} pendaftar perlu verifikasi`} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTab("absensi")}
                  className={`pb-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 whitespace-nowrap px-0.5 ${
                    selectedTab === "absensi"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  <span>Presensi & QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTab("twibbon")}
                  className={`pb-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 whitespace-nowrap px-0.5 ${
                    selectedTab === "twibbon"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  <span>Twibbon Kampanye</span>
                  {selectedEvent.twibbon?.isActive && selectedEvent.twibbon?.frameUrl && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Twibbon Aktif" />
                  )}
                </button>
              </div>

              {/* TAB CONTENTS */}
              {selectedTab === "timeline" && (
                <TimelineTab
                  event={selectedEvent}
                  onUpdateEvent={handleUpdateTimelineEvent}
                  registrationsCount={activeRegistrations.length}
                  approvedCount={approvedCount}
                  pendingCount={pendingCount}
                />
              )}

              {selectedTab === "screening" && (
                <ScreeningTab
                  event={
                    selectedEvent
                      ? {
                          ...selectedEvent,
                          formFields:
                            kaderisasiList.find(
                              (k) => k.nama === selectedEvent.level || k.id === selectedEvent.level
                            )?.formFields || []
                        }
                      : selectedEvent
                  }
                  registrations={activeRegistrations}
                  onOpenScreening={(reg) => setScreeningReg(reg)}
                  onQuickApprove={handleQuickApprove}
                  onBatchApprove={handleBatchApprove}
                  onOpenAddParticipant={() => setShowAddParticipantModal(true)}
                  onDeleteRegistration={handleDeleteRegistration}
                />
              )}

              {selectedTab === "absensi" && (
                <AttendanceTab
                  event={selectedEvent}
                  registrations={activeRegistrations}
                  onScanCode={handleScanCode}
                />
              )}

              {selectedTab === "twibbon" && (
                <TwibbonTab
                  event={selectedEvent}
                  onUpdateEvent={handleUpdateTimelineEvent}
                />
              )}
            </Card>
          </div>
        )
      )}

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <EventFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEvent}
          kaderisasiList={kaderisasiList}
          currentUser={currentUser}
          commissariats={commissariats}
        />
      )}

      {/* EDIT EVENT MODAL */}
      {showEditModal && (
        <EventFormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditEventId("");
          }}
          event={events.find((e) => e.id === editEventId)}
          onSubmit={handleUpdateEvent}
          kaderisasiList={kaderisasiList}
          currentUser={currentUser}
          commissariats={commissariats}
        />
      )}

      {/* DELETE EVENT CONFIRMATION MODAL */}
      {showDeleteConfirmModal && (
        <DeleteEventModal
          isOpen={showDeleteConfirmModal}
          eventName={deleteEventName}
          onClose={() => {
            setShowDeleteConfirmModal(false);
            setDeleteEventId("");
            setDeleteEventName("");
          }}
          onConfirm={confirmDeleteEvent}
        />
      )}

      {/* SCREENING VERIFICATION MODAL */}
      {screeningReg && (
        <ScreeningDetailModal
          isOpen={Boolean(screeningReg)}
          registration={screeningReg}
          event={
            selectedEvent
              ? {
                  ...selectedEvent,
                  formFields:
                    kaderisasiList.find(
                      (k) => k.nama === selectedEvent.level || k.id === selectedEvent.level
                    )?.formFields || []
                }
              : selectedEvent
          }
          onClose={() => setScreeningReg(null)}
          onSave={handleSaveScreeningResult}
        />
      )}

      {/* ADD PARTICIPANT MODAL */}
      {showAddParticipantModal && selectedEvent && (
        <AddParticipantModal
          isOpen={showAddParticipantModal}
          onClose={() => setShowAddParticipantModal(false)}
          event={selectedEvent}
          existingRegistrations={activeRegistrations}
          onAddParticipant={handleAddParticipant}
        />
      )}

      {FeedbackModalComponent}
    </div>
  );
}
