"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Edit,
  Check,
  Copy,
  Search,
  CheckCircle2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { db, DEFAULT_EVENTS, DEFAULT_REGISTRATIONS } from "@/lib/db";
import type { UserAccount } from "@/lib/db";
import { isRecordInTenant, enforceTenantWrite } from "@/lib/tenancy";
import { generateUUID } from "@/lib/utils";

import type { FormField, EventActivity, ParticipantRegistration } from "./_components/types";
import { DEFAULT_EVENT_SESSIONS } from "./_components/types";
import EventFormModal from "./_components/EventFormModal";
import DeleteEventModal from "./_components/DeleteEventModal";
import ScreeningTab from "./_components/ScreeningTab";
import ScreeningDetailModal from "./_components/ScreeningDetailModal";
import AttendanceTab from "./_components/AttendanceTab";
import GraduationTab from "./_components/GraduationTab";

export type { FormField, EventActivity, ParticipantRegistration };

export default function KomisariatKegiatanPage() {
  const [mounted, setMounted] = useState(false);
  const [activeCampus, setActiveCampus] = useState("UIN Walisongo");
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [events, setEvents] = useState<EventActivity[]>([]);
  const [registrations, setRegistrations] = useState<ParticipantRegistration[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [kaderisasiList, setKaderisasiList] = useState<any[]>([]);

  // Search filter
  const [eventSearch, setEventSearch] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEventId, setEditEventId] = useState("");

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState("");
  const [deleteEventName, setDeleteEventName] = useState("");

  const [screeningReg, setScreeningReg] = useState<ParticipantRegistration | null>(null);

  // Notifications & UI states
  const [toastMessage, setToastMessage] = useState("");
  const [copiedId, setCopiedId] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<"screening" | "absensi" | "kelulusan">("screening");

  const showToast = (msg: string, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), duration);
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
            setCurrentUser(JSON.parse(storedUser));
          } catch (e) {
            console.error("Error parsing user session:", e);
          }
        }
      }
      const storedCampus = localStorage.getItem("PMII_ACTIVE_COMMISSARIAT") || "UIN Walisongo";
      setActiveCampus(storedCampus);

      // Load kaderisasi list
      let parsedKaderisasi: any[] = [];
      try {
        parsedKaderisasi = await db.getKaderisasi();
        setKaderisasiList(parsedKaderisasi);
      } catch (err) {
        console.error("Error loading kaderisasi list:", err);
      }

      // Load activities
      const fetchedEvents = await db.getEvents(DEFAULT_EVENTS);
      setEvents(fetchedEvents);
      if (fetchedEvents.length > 0) {
        setSelectedEventId(fetchedEvents[0].id);
      }

      // Load registrations
      const fetchedRegs = await db.getRegistrations(DEFAULT_REGISTRATIONS);
      const cleanedRegs = fetchedRegs.filter((r: any) => !r.id?.startsWith("reg-mock") && !r.id?.includes("mock"));
      setRegistrations(cleanedRegs);

      setMounted(true);
    };

    loadData();
  }, []);

  // Filter events belonging to active campus
  const campusEvents = events.filter((e) =>
    isRecordInTenant(currentUser, {
      commissariat: e.commissariat
    })
  );

  const filteredCampusEvents = campusEvents.filter((e) =>
    e.name.toLowerCase().includes(eventSearch.toLowerCase()) ||
    e.level.toLowerCase().includes(eventSearch.toLowerCase())
  );

  const selectedEvent = campusEvents.find((e) => e.id === selectedEventId) || campusEvents[0];
  const activeRegistrations = registrations
    .filter((r) => r.eventId === (selectedEvent?.id || selectedEventId))
    .filter((r) =>
      isRecordInTenant(currentUser, {
        commissariat: selectedEvent?.commissariat
      })
    );

  const handleCopyLink = (eventId: string) => {
    if (typeof window !== "undefined") {
      const link = `${window.location.origin}/kader/kegiatan?event=${eventId}`;
      navigator.clipboard.writeText(link);
      setCopiedId(eventId);
      showToast("Tautan kegiatan disalin.");
      setTimeout(() => setCopiedId(""), 3000);
    }
  };

  // Submit New Event
  const handleCreateEvent = async (eventData: {
    name: string;
    level: string;
    date: string;
    description?: string;
    sessions?: string[];
  }) => {
    const newEvent: EventActivity = enforceTenantWrite(currentUser, {
      id: generateUUID(),
      name: eventData.name,
      level: eventData.level,
      date: eventData.date,
      commissariat: activeCampus,
      description: eventData.description || "",
      status: "OPEN",
      sessions: eventData.sessions && eventData.sessions.length > 0 ? eventData.sessions : DEFAULT_EVENT_SESSIONS
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
  }) => {
    const updatedEvents = events.map((e) => {
      if (e.id === editEventId) {
        return {
          ...e,
          name: eventData.name,
          level: eventData.level,
          date: eventData.date,
          description: eventData.description || "",
          sessions: eventData.sessions && eventData.sessions.length > 0 ? eventData.sessions : DEFAULT_EVENT_SESSIONS
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

    const remainingEvents = events.filter((e) => e.id !== deleteEventId);
    setEvents(remainingEvents);
    await db.saveEvents(remainingEvents);

    const remainingRegistrations = registrations.filter((r) => r.eventId !== deleteEventId);
    setRegistrations(remainingRegistrations);
    await db.saveRegistrations(remainingRegistrations);

    if (selectedEventId === deleteEventId) {
      const nextEvent = remainingEvents.find((e) =>
        isRecordInTenant(currentUser, { commissariat: e.commissariat })
      );
      setSelectedEventId(nextEvent ? nextEvent.id : "");
    }

    setShowDeleteConfirmModal(false);
    setDeleteEventId("");
    setDeleteEventName("");
    showToast("Kegiatan berhasil dihapus.");
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
    }

    setScreeningReg(null);
    showToast("Hasil screening disimpan.");
  };

  // Attendance scan code handler
  const handleScanCode = (
    code: string,
    sessionName: string
  ): { success: boolean; message: string; participantName?: string } => {
    if (!code) return { success: false, message: "Kode QR kosong." };

    const foundReg = registrations.find(
      (r) =>
        r.registrationNumber?.toLowerCase() === code.trim().toLowerCase() &&
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
            startDate: c.startDate || new Date().toISOString().split("T")[0]
          };
        }
        return c;
      });
    } else {
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
        registrationNumber: reg.registrationNumber
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
              nta: c.nta || generatedNTA
            };
          }
          return c;
        });
      } else {
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
          registrationNumber: reg.registrationNumber
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
    <div className="space-y-5 select-none pb-8">
      {/* MINIMAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            Kegiatan & Kaderisasi
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Komisariat {activeCampus}
          </p>
        </div>

        <div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 h-8.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors border-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Kegiatan</span>
          </Button>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 px-3.5 py-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-blue-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN LAYOUT: SIDEBAR & WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* LEFT COLUMN: EVENTS LIST */}
        <div className="lg:col-span-1 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Daftar Kegiatan ({campusEvents.length})
            </span>
          </div>

          {/* Minimal Search Input */}
          {campusEvents.length > 2 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder="Cari kegiatan..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 rounded-lg placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          )}

          <div className="space-y-2 max-h-[640px] overflow-y-auto">
            {filteredCampusEvents.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                Tidak ada kegiatan.
              </div>
            ) : (
              filteredCampusEvents.map((evt) => {
                const isActive = selectedEvent?.id === evt.id;
                const evtRegs = registrations.filter((r) => r.eventId === evt.id);
                const pendingCount = evtRegs.filter((r) => r.status === "PENDING").length;

                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventId(evt.id)}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer text-left ${
                      isActive
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase">
                        {evt.level}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {evt.date}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-white mt-1 truncate">
                      {evt.name}
                    </h4>

                    <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{evtRegs.length} Pendaftar</span>
                      <div className="flex items-center gap-1.5">
                        {pendingCount > 0 && (
                          <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400">
                            {pendingCount} Verifikasi
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(evt.id);
                          }}
                          className="px-1.5 py-0.5 rounded text-[9.5px] border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-blue-600 cursor-pointer"
                        >
                          {copiedId === evt.id ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: EVENT WORKSPACE */}
        <div className="lg:col-span-2 space-y-4">
          {selectedEvent ? (
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 sm:p-5 shadow-none space-y-4 text-zinc-900 dark:text-zinc-100">
              {/* Event Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-[9px] font-semibold uppercase px-2 py-0.5 rounded-md">
                      {selectedEvent.level}
                    </Badge>
                    <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {selectedEvent.date}
                    </span>
                  </div>

                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {selectedEvent.name}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto">
                  <Button
                    onClick={() => handleCopyLink(selectedEvent.id)}
                    size="sm"
                    className="h-8 px-2.5 rounded-lg font-medium text-[11px] cursor-pointer bg-blue-600 hover:bg-blue-700 text-white border-none"
                  >
                    {copiedId === selectedEvent.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === selectedEvent.id ? "Tersalin" : "Salin Link"}</span>
                  </Button>

                  <Button
                    onClick={() => {
                      setEditEventId(selectedEvent.id);
                      setShowEditModal(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-lg cursor-pointer border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    onClick={() => {
                      setDeleteEventId(selectedEvent.id);
                      setDeleteEventName(selectedEvent.name);
                      setShowDeleteConfirmModal(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-lg cursor-pointer border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-rose-600"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* CLEAN MINIMAL TABS */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedTab("screening")}
                  className={`pb-2 text-xs font-semibold transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 ${
                    selectedTab === "screening"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  Screening Berkas ({activeRegistrations.length})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTab("absensi")}
                  className={`pb-2 text-xs font-semibold transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 ${
                    selectedTab === "absensi"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  Presensi & QR
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTab("kelulusan")}
                  className={`pb-2 text-xs font-semibold transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 ${
                    selectedTab === "kelulusan"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  Evaluasi Kelulusan
                </button>
              </div>

              {/* TAB 1: SCREENING BERKAS */}
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
                />
              )}

              {/* TAB 2: ABSENSI QR & SESI */}
              {selectedTab === "absensi" && (
                <AttendanceTab
                  event={selectedEvent}
                  registrations={activeRegistrations}
                  onScanCode={handleScanCode}
                />
              )}

              {/* TAB 3: KELULUSAN & KTA */}
              {selectedTab === "kelulusan" && (
                <GraduationTab
                  event={selectedEvent}
                  registrations={activeRegistrations}
                  onMarkGraduated={handleMarkGraduated}
                  onRevokeGraduation={handleRevokeGraduation}
                  onBatchGraduate={handleBatchGraduate}
                />
              )}
            </Card>
          ) : (
            <div className="py-20 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              Pilih kegiatan untuk melihat data.
            </div>
          )}
        </div>
      </div>

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <EventFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEvent}
          kaderisasiList={kaderisasiList}
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
    </div>
  );
}
