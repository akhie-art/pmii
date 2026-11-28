"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { db, generateUUID } from "@/lib/db";
import type {
  EventActivity,
  ParticipantEvaluation,
  ParticipantRegistration,
  Requirement,
  CadreFollowUp,
  CadreSubmission,
  UserAccount,
} from "@/lib/db";
import { supabase, isSupabaseConfigured, deleteStorageFile } from "@/lib/supabase";
import {
  isRecordInTenant,
  enforceTenantWrite,
  getActiveTenant,
  isCabangOrAdmin,
  TENANT_CHANGED_EVENT,
} from "@/lib/tenancy";
import { FeedbackModal } from "@/components/ui/feedback-modal";

import {
  EventParticipantProgress,
  readFileAsDataURL,
  getParticipantPhoto,
} from "./_components/types";
import {
  buildRequirementPayload,
  buildUnifiedEventParticipants,
  calculateRtlProgress,
  canManageRequirement,
  deriveCadreStatusAfterReview,
  filterRequirementsForContext,
  resolveSubmissionEventContext,
  validateRequirementFile,
} from "./_components/verifikasi-helper";
import { VerifikasiHero } from "./_components/VerifikasiHero";
import { VerifikasiTabsHeader } from "./_components/VerifikasiTabsHeader";
import {
  VerifikasiSubmissionsTab,
  DisplaySubmission,
} from "./_components/VerifikasiSubmissionsTab";
import { ParticipantProgressTab } from "./_components/ParticipantProgressTab";
import { TugasTab } from "./_components/TugasTab";
import { ReviewSubmissionModal } from "./_components/ReviewSubmissionModal";
import { ParticipantDetailModal } from "./_components/ParticipantDetailModal";
import { TaskModal } from "./_components/TaskModal";
import { DeleteTaskModal } from "./_components/DeleteTaskModal";
import { SahkanKelulusanModal } from "./_components/SahkanKelulusanModal";

export default function UnifiedRtlVerifikasiPage() {
  const pathname = usePathname();
  const staffPrefix = pathname?.startsWith("/admin")
    ? "/admin"
    : pathname?.startsWith("/pengurus")
    ? "/pengurus"
    : pathname?.startsWith("/instruktur")
    ? "/instruktur"
    : "/dashboard";

  const [mounted, setMounted] = useState(false);
  const [activeTenant, setActiveTenant] = useState<string>("ALL");

  // Core Data (tanpa over-fetching PII db.getUsers())
  const [events, setEvents] = useState<EventActivity[]>([]);
  const [registrations, setRegistrations] = useState<ParticipantRegistration[]>([]);
  const [evaluations, setEvaluations] = useState<ParticipantEvaluation[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [cadres, setCadres] = useState<CadreFollowUp[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Filter & View States
  const [selectedEventId, setSelectedEventId] = useState<string>("ALL");
  const [hasInitializedEvent, setHasInitializedEvent] = useState(false);
  const [mainTab, setMainTab] = useState<"VERIFIKASI" | "PROGRES" | "TUGAS">("VERIFIKASI");
  const [reviewSubTab, setReviewSubTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [progressSearch, setProgressSearch] = useState("");
  const [progresStatusFilter, setProgresStatusFilter] = useState<string>("ALL");
  const [tugasLevelFilter, setTugasLevelFilter] = useState<string>("ALL");

  // Review Dialog States
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState<DisplaySubmission | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState<string>("");
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewError, setReviewError] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Participant Detail Dialog State (simpan ID agar selalu reaktif & tidak stale)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);

  // CRUD Requirement (Tugas) Dialog States
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [reqFormEventId, setReqFormEventId] = useState<string>("");
  const [reqFormTitle, setReqFormTitle] = useState("");
  const [reqFormDeadline, setReqFormDeadline] = useState("");
  const [reqFormMinSubmissions, setReqFormMinSubmissions] = useState<number>(1);
  const [reqFormDescription, setReqFormDescription] = useState("");
  const [reqFormFileUrl, setReqFormFileUrl] = useState("");
  const [reqFormFileName, setReqFormFileName] = useState("");
  const [reqFormFileSize, setReqFormFileSize] = useState("");
  const [reqOriginalFileUrl, setReqOriginalFileUrl] = useState("");
  const [isUploadingReqFile, setIsUploadingReqFile] = useState(false);
  const [isSavingReq, setIsSavingReq] = useState(false);

  // Delete Confirmation Dialog States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingReq, setDeletingReq] = useState<Requirement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sahkan / Batalkan Kelulusan Dialog States
  const [isSahkanModalOpen, setIsSahkanModalOpen] = useState(false);
  const [participantToSahkan, setParticipantToSahkan] = useState<EventParticipantProgress | null>(
    null
  );
  const [sahkanActionMode, setSahkanActionMode] = useState<"APPROVE" | "REVOKE">("APPROVE");
  const [isSubmittingSahkan, setIsSubmittingSahkan] = useState(false);

  // Success / Feedback Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    title: string;
    description: string;
    type?: "success" | "error";
  }>({
    title: "Berhasil",
    description: "Perubahan berhasil disimpan.",
    type: "success",
  });

  const showNotificationModal = useCallback(
    (title: string, description: string, type: "success" | "error" = "success") => {
      setSuccessModalData({ title, description, type });
      setIsSuccessModalOpen(true);
    },
    []
  );

  const fetchAllData = useCallback(async () => {
    const [loadedEvents, loadedRegs, loadedEvals, loadedReqs, loadedCadres] = await Promise.all([
      db.getEvents(),
      db.getRegistrations(),
      db.getEvaluations([]),
      db.getRequirements(),
      db.getCadres(),
    ]);
    setEvents(Array.isArray(loadedEvents) ? loadedEvents : []);
    setRegistrations(Array.isArray(loadedRegs) ? loadedRegs : []);
    setEvaluations(Array.isArray(loadedEvals) ? loadedEvals : []);
    setRequirements(Array.isArray(loadedReqs) ? loadedReqs : []);
    setCadres(Array.isArray(loadedCadres) ? loadedCadres : []);
  }, []);

  // Initial Data Fetch + Live Sync Listener
  useEffect(() => {
    let active = true;

    const loadAll = async () => {
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("PMII_LOGGED_IN_USER");
        if (storedUser) {
          try {
            setCurrentUser(JSON.parse(storedUser));
          } catch (e) {
            console.error("Error parsing user session:", e);
          }
        }
        setActiveTenant(getActiveTenant() || "ALL");
      }

      try {
        await fetchAllData();
      } catch (err) {
        console.error("Error loading RTL & Verifikasi data:", err);
      } finally {
        if (active) setMounted(true);
      }
    };

    const handleTenant = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      setActiveTenant(detail?.activeTenant || "ALL");
    };

    const handleTableSync = (e: Event) => {
      const table = (e as CustomEvent)?.detail?.table;
      if (
        table === "kegiatan" ||
        table === "pendaftaran" ||
        table === "evaluations" ||
        table === "persyaratan" ||
        table === "anggota"
      ) {
        void fetchAllData();
      }
    };

    window.addEventListener(TENANT_CHANGED_EVENT, handleTenant);
    window.addEventListener("PMII_TABLE_SYNC", handleTableSync);

    void loadAll();

    return () => {
      active = false;
      window.removeEventListener(TENANT_CHANGED_EVENT, handleTenant);
      window.removeEventListener("PMII_TABLE_SYNC", handleTableSync);
    };
  }, [fetchAllData]);

  // Scope Label untuk Hero Header
  const scopeLabel = useMemo(() => {
    if (isCabangOrAdmin(currentUser)) {
      return !activeTenant || activeTenant === "ALL" || activeTenant === "Semua Komisariat"
        ? "Seluruh Cabang & Komisariat"
        : activeTenant;
    }
    return currentUser?.commissariat || "Lingkup Komisariat";
  }, [currentUser, activeTenant]);

  // 1. Kegiatan terisolasi ketat per Tenant (termasuk tenant_id)
  const tenantEvents = useMemo(() => {
    return events.filter((e) =>
      isRecordInTenant(
        currentUser,
        {
          commissariat: e.commissariat,
          komisariat_id: e.komisariat_id,
          tenant_id: e.tenant_id || e.komisariat_id,
        },
        activeTenant
      )
    );
  }, [events, currentUser, activeTenant]);

  // Auto-select event pertama milik tenant saat mount, dan jaga agar selectedEventId selalu valid di tenant aktif
  useEffect(() => {
    if (!mounted) return;
    if (!hasInitializedEvent) {
      queueMicrotask(() => {
        setSelectedEventId(tenantEvents.length > 0 ? tenantEvents[0].id : "ALL");
        setHasInitializedEvent(true);
      });
      return;
    }
    if (
      selectedEventId !== "ALL" &&
      !tenantEvents.some((evt) => evt.id === selectedEventId)
    ) {
      queueMicrotask(() => {
        setSelectedEventId(tenantEvents.length > 0 ? tenantEvents[0].id : "ALL");
      });
    }
  }, [mounted, hasInitializedEvent, tenantEvents, selectedEventId]);

  const selectedEvent = useMemo(() => {
    if (selectedEventId === "ALL") return null;
    return tenantEvents.find((e) => e.id === selectedEventId) || null;
  }, [selectedEventId, tenantEvents]);

  // 2. Kader terisolasi per Tenant
  const tenantCadres = useMemo(() => {
    return cadres.filter((c) =>
      isRecordInTenant(
        currentUser,
        {
          commissariat: c.commissariat,
          komisariat_id: c.komisariat_id,
          tenant_id: c.tenant_id || c.komisariat_id,
        },
        activeTenant
      )
    );
  }, [cadres, currentUser, activeTenant]);

  // 3. Tugas RTL yang berlaku untuk konteks & tenant saat ini
  const currentApplicableReqs = useMemo(() => {
    return filterRequirementsForContext(requirements, {
      selectedEvent,
      tugasLevelFilter,
      currentUser,
      activeTenant,
      events,
    });
  }, [requirements, selectedEvent, tugasLevelFilter, currentUser, activeTenant, events]);

  // 4. Progres Peserta Kegiatan (gabungan pendaftaran + evaluations + kader pengunggah RTL, terisolasi tenant)
  const eventParticipantsProgress: EventParticipantProgress[] = useMemo(() => {
    return buildUnifiedEventParticipants({
      registrations,
      evaluations,
      tenantCadres,
      tenantEvents,
      allEvents: events,
      requirements,
      selectedEventId,
      selectedEvent,
      currentUser,
      activeTenant,
    });
  }, [
    registrations,
    evaluations,
    tenantCadres,
    tenantEvents,
    events,
    requirements,
    selectedEventId,
    selectedEvent,
    currentUser,
    activeTenant,
  ]);

  // Modal Detail selalu sinkron live berdasarkan ID peserta
  const selectedParticipantProgress = useMemo(() => {
    if (!selectedParticipantId) return null;
    return eventParticipantsProgress.find((p) => p.id === selectedParticipantId) || null;
  }, [eventParticipantsProgress, selectedParticipantId]);

  // 5. Antrean Verifikasi Berkas Masuk (terisolasi tenant + akurat lintas jenjang MAPABA/PKD/PKL)
  const allSubmissions: DisplaySubmission[] = useMemo(() => {
    const list: DisplaySubmission[] = [];
    const allowedEventIds = new Set(tenantEvents.map((e) => e.id));

    tenantCadres.forEach((cadre) => {
      const subs = Array.isArray(cadre.submissions) ? cadre.submissions : [];
      subs.forEach((s) => {
        const ctx = resolveSubmissionEventContext(
          cadre,
          s,
          registrations,
          events,
          requirements
        );

        // Filter ketat sesuai kegiatan yang dipilih
        if (selectedEventId !== "ALL") {
          if (ctx.event) {
            if (ctx.event.id !== selectedEventId) return;
          } else {
            const reqLvl = String(ctx.requirement?.level || cadre.level || "").toUpperCase();
            const selLvl = String(selectedEvent?.level || "").toUpperCase();
            if (!selLvl || reqLvl !== selLvl) return;
          }
        } else if (ctx.event && !allowedEventIds.has(ctx.event.id)) {
          return;
        }

        const photoUrl = getParticipantPhoto(cadre, ctx.registration, []);
        list.push({
          ...s,
          cadreId: cadre.id,
          cadreName: cadre.name,
          cadreLevel: ctx.event?.level || ctx.requirement?.level || cadre.level,
          cadreAvatar: photoUrl || cadre.avatar,
          eventId: ctx.event?.id,
          eventName:
            ctx.event?.name ||
            ctx.event?.title ||
            `Kaderisasi ${ctx.requirement?.level || cadre.level}`,
          requirementTitle: ctx.requirement?.title,
          requirementDeadline: ctx.requirement?.deadline,
        });
      });
    });

    // Urutkan terbaru dulu
    list.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    return list;
  }, [
    tenantCadres,
    tenantEvents,
    registrations,
    events,
    requirements,
    selectedEventId,
    selectedEvent,
  ]);

  // Statistics
  const pendingCount = allSubmissions.filter((s) => s.status === "PENDING").length;
  const approvedCount = allSubmissions.filter((s) => s.status === "APPROVED").length;
  const rejectedCount = allSubmissions.filter((s) => s.status === "REJECTED").length;

  const totalParticipantsInEvent = eventParticipantsProgress.length;
  const lulusRtlCount = eventParticipantsProgress.filter((p) => p.status === "SELESAI").length;

  // Filtered submissions (Tab 1)
  const filteredSubmissions = useMemo(() => {
    const q = submissionSearch.trim().toLowerCase();
    return allSubmissions.filter((s) => {
      const matchesTab = s.status === reviewSubTab;
      const matchesSearch =
        !q ||
        s.cadreName.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q) ||
        (s.requirementTitle || "").toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [allSubmissions, reviewSubTab, submissionSearch]);

  // Filtered participants (Tab 2)
  const filteredParticipants = useMemo(() => {
    const q = progressSearch.trim().toLowerCase();
    return eventParticipantsProgress.filter((p) => {
      const matchesSearch =
        !q ||
        p.cadreName.toLowerCase().includes(q) ||
        p.cadreEmail.toLowerCase().includes(q) ||
        p.eventName.toLowerCase().includes(q);
      const matchesStatus =
        progresStatusFilter === "ALL" || p.status === progresStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [eventParticipantsProgress, progressSearch, progresStatusFilter]);

  // Review Actions
  const handleOpenReview = (sub: DisplaySubmission) => {
    setReviewingSubmission(sub);
    setReviewStatus(sub.status === "REJECTED" ? "REJECTED" : "APPROVED");
    setReviewFeedback(sub.feedback || "");
    setReviewError("");
    setIsReviewModalOpen(true);
  };

  const handleOpenReviewFromParticipantDetail = (
    participant: EventParticipantProgress,
    sub: CadreSubmission
  ) => {
    if (!participant.matchedCadre) return;
    const req = participant.applicableRequirements.find((r) => r.id === sub.requirementId);
    handleOpenReview({
      ...sub,
      cadreId: participant.matchedCadre.id,
      cadreName: participant.cadreName,
      cadreLevel: participant.eventLevel,
      cadreAvatar: participant.photoUrl,
      eventId: participant.eventId,
      eventName: participant.eventName,
      requirementTitle: req?.title,
      requirementDeadline: req?.deadline,
    });
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSubmission) return;

    const trimmedFeedback = reviewFeedback.trim();
    if (reviewStatus === "REJECTED" && !trimmedFeedback) {
      setReviewError(
        "Catatan revisi wajib diisi saat mengembalikan berkas agar kader mengetahui bagian yang perlu diperbaiki."
      );
      return;
    }

    const targetCadre = cadres.find((c) => c.id === reviewingSubmission.cadreId);
    if (!targetCadre) {
      showNotificationModal(
        "Data Kader Tidak Ditemukan",
        "Record kader tidak lagi tersedia. Silakan muat ulang halaman.",
        "error"
      );
      return;
    }

    setReviewError("");
    setIsSubmittingReview(true);

    try {
      const updatedSubmissions: CadreSubmission[] = (targetCadre.submissions || []).map((sub) =>
        sub.id === reviewingSubmission.id
          ? {
              ...sub,
              status: reviewStatus,
              feedback: trimmedFeedback,
            }
          : sub
      );

      // Hitung status baru secara akurat per requirementId & minSubmissions untuk event kader ini
      const targetEvt = reviewingSubmission.eventId
        ? events.find((ev) => ev.id === reviewingSubmission.eventId) || null
        : selectedEvent;

      const applicableReqs = filterRequirementsForContext(requirements, {
        selectedEvent: targetEvt,
        tugasLevelFilter: targetEvt ? "ALL" : String(targetCadre.level || "MAPABA"),
        currentUser,
        activeTenant,
        events,
      });

      const newStatus = deriveCadreStatusAfterReview({
        updatedSubmissions,
        applicableReqs,
        reviewStatus,
      });

      // O(1) update 1 baris di tabel anggota + cek hasil boolean (anti silent failure & anti RLS lintas tenant)
      const saved = await db.updateCadre(targetCadre.id, {
        submissions: updatedSubmissions,
        status: newStatus,
        ...(newStatus === "SELESAI" ? { isGraduated: true } : {}),
      });

      if (!saved) {
        showNotificationModal(
          "Gagal Menyimpan Verifikasi",
          "Database menolak penyimpanan hasil verifikasi. Pastikan Anda memiliki hak akses pada komisariat ini dan koneksi stabil.",
          "error"
        );
        return;
      }

      // Sinkronkan juga status kelulusan di tabel pendaftaran jika kader resmi lulus seluruh RTL
      if (newStatus === "SELESAI") {
        const ctx = resolveSubmissionEventContext(
          targetCadre,
          reviewingSubmission,
          registrations,
          events,
          requirements
        );
        if (ctx.registration && !ctx.registration.isGraduated) {
          const regOk = await db.updateRegistration(ctx.registration.id, {
            isGraduated: true,
            graduationStatus: "PASSED",
          });
          if (regOk) {
            setRegistrations((prev) =>
              prev.map((r) =>
                r.id === ctx.registration!.id
                  ? { ...r, isGraduated: true, graduationStatus: "PASSED" }
                  : r
              )
            );
          }
        }
      }

      setCadres((prev) =>
        prev.map((c) =>
          c.id === targetCadre.id
            ? {
                ...c,
                submissions: updatedSubmissions,
                status: newStatus,
                ...(newStatus === "SELESAI" ? { isGraduated: true } : {}),
              }
            : c
        )
      );

      setIsReviewModalOpen(false);
      setReviewingSubmission(null);
      setReviewFeedback("");
      showNotificationModal(
        reviewStatus === "APPROVED"
          ? "Laporan Berhasil Disetujui"
          : "Laporan Dikembalikan untuk Revisi",
        `Hasil peninjauan laporan "${reviewingSubmission.title}" untuk ${reviewingSubmission.cadreName} telah tersimpan di database.`,
        "success"
      );
    } catch (error) {
      console.error("Failed to save review:", error);
      showNotificationModal(
        "Gagal Menyimpan Verifikasi",
        "Terjadi kendala tak terduga saat menyimpan hasil verifikasi berkas. Silakan coba lagi.",
        "error"
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Sahkan / Batalkan Kelulusan RTL Peserta
  const handleSahkanKelulusan = (
    p: EventParticipantProgress,
    mode: "APPROVE" | "REVOKE" = "APPROVE"
  ) => {
    setParticipantToSahkan(p);
    setSahkanActionMode(mode);
    setIsSahkanModalOpen(true);
  };

  const handleConfirmSahkanKelulusan = async () => {
    if (!participantToSahkan) return;
    const p = participantToSahkan;
    const isApprove = sahkanActionMode === "APPROVE";
    setIsSubmittingSahkan(true);

    try {
      let nextCadreStatus: "SELESAI" | "REVISI" | "AKTIF" = "SELESAI";
      if (!isApprove) {
        const recalculated = calculateRtlProgress(
          p.matchedCadre?.submissions || [],
          p.applicableRequirements
        );
        nextCadreStatus =
          recalculated.rejectedCount > 0 ? "REVISI" : "AKTIF";
      }

      let cadreSaved = false;
      let createdCadre: CadreFollowUp | null = null;

      if (p.matchedCadre) {
        cadreSaved = await db.updateCadre(p.matchedCadre.id, {
          status: nextCadreStatus,
          isGraduated: isApprove,
        });
      } else if (isApprove) {
        const tenantOverride =
          p.commissariat ||
          selectedEvent?.commissariat ||
          (activeTenant !== "ALL" && activeTenant !== "Semua Komisariat"
            ? activeTenant
            : currentUser?.commissariat || "ALL");

        const rawNewCadre: CadreFollowUp = {
          id: generateUUID(),
          name: p.cadreName,
          level: p.eventLevel,
          commissariat: p.commissariat || selectedEvent?.commissariat || currentUser?.commissariat,
          tenant_id: p.tenant_id || selectedEvent?.tenant_id || currentUser?.tenant_id || null,
          komisariat_id:
            p.tenant_id || selectedEvent?.komisariat_id || currentUser?.komisariat_id || null,
          startDate: selectedEvent?.date || new Date().toISOString().split("T")[0],
          status: "SELESAI",
          isGraduated: true,
          submissions: [],
          email: p.cadreEmail,
          phone: p.phone !== "-" ? p.phone : undefined,
          avatar: p.photoUrl || undefined,
        };
        createdCadre = enforceTenantWrite<CadreFollowUp>(
          currentUser,
          rawNewCadre,
          tenantOverride
        );
        cadreSaved = await db.upsertCadre(createdCadre);
      } else {
        cadreSaved = true;
      }

      if (!cadreSaved) {
        showNotificationModal(
          isApprove ? "Gagal Mengesahkan Kelulusan" : "Gagal Membatalkan Kelulusan",
          "Database menolak pembaruan data kader. Periksa hak akses tenant dan koneksi Anda.",
          "error"
        );
        return;
      }

      // Sinkronkan status kelulusan ke tabel pendaftaran bila peserta berasal dari tabel pendaftaran
      let regSaved = false;
      if (p.hasRegistration && p.registrationId) {
        regSaved = await db.updateRegistration(p.registrationId, {
          isGraduated: isApprove,
          graduationStatus: isApprove ? "PASSED" : "PENDING",
        });
      }

      if (p.matchedCadre) {
        setCadres((prev) =>
          prev.map((c) =>
            c.id === p.matchedCadre!.id
              ? { ...c, status: nextCadreStatus, isGraduated: isApprove }
              : c
          )
        );
      } else if (createdCadre) {
        setCadres((prev) => [...prev, createdCadre!]);
      }

      if (regSaved && p.registrationId) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === p.registrationId
              ? {
                  ...r,
                  isGraduated: isApprove,
                  graduationStatus: isApprove ? "PASSED" : "PENDING",
                }
              : r
          )
        );
      }

      setIsSahkanModalOpen(false);
      setParticipantToSahkan(null);
      showNotificationModal(
        isApprove ? "Kelulusan Berhasil Disahkan" : "Pengesahan Kelulusan Dibatalkan",
        isApprove
          ? `Kelulusan RTL ${p.cadreName} telah disahkan dan disinkronkan ke data kader & pendaftaran.`
          : `Status kelulusan RTL ${p.cadreName} dikembalikan ke status proses aktif.`,
        "success"
      );
    } catch (err) {
      console.error("Gagal memperbarui pengesahan kelulusan:", err);
      showNotificationModal(
        "Gagal Memperbarui Kelulusan",
        "Terjadi kendala saat menyimpan perubahan kelulusan. Silakan coba lagi.",
        "error"
      );
    } finally {
      setIsSubmittingSahkan(false);
    }
  };

  // CRUD Requirement (Tugas) Actions
  const handleOpenAddReq = () => {
    setEditingReqId(null);
    setReqFormEventId(selectedEventId !== "ALL" ? selectedEventId : tenantEvents[0]?.id || "");
    setReqFormTitle("");
    setReqFormDeadline("");
    setReqFormMinSubmissions(1);
    setReqFormDescription("");
    setReqFormFileUrl("");
    setReqFormFileName("");
    setReqFormFileSize("");
    setReqOriginalFileUrl("");
    setIsReqModalOpen(true);
  };

  const handleOpenEditReq = (req: Requirement) => {
    if (!canManageRequirement(req, currentUser, events)) {
      showNotificationModal(
        "Akses Terbatas",
        "Tugas RTL ini milik tingkat Cabang / komisariat lain dan hanya dapat diubah oleh pengelola terkait.",
        "error"
      );
      return;
    }
    setEditingReqId(req.id);
    setReqFormEventId(
      req.eventId || (selectedEventId !== "ALL" ? selectedEventId : tenantEvents[0]?.id || "")
    );
    setReqFormTitle(req.title);
    setReqFormDeadline(req.deadline || "");
    setReqFormMinSubmissions(Math.max(1, Number(req.minSubmissions) || 1));
    setReqFormDescription(req.description || "");
    setReqFormFileUrl(req.fileUrl || "");
    setReqFormFileName(req.fileName || "");
    setReqFormFileSize(req.fileSize || "");
    setReqOriginalFileUrl(req.fileUrl || "");
    setIsReqModalOpen(true);
  };

  const handleReqFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validateRequirementFile(file);
    if (validationError) {
      showNotificationModal("Berkas Tidak Valid", validationError, "error");
      return;
    }

    setIsUploadingReqFile(true);
    const formattedSize =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    try {
      let finalUrl = "";
      if (isSupabaseConfigured && supabase) {
        const cleanExt = (file.name.split(".").pop() || "pdf")
          .replace(/[^a-zA-Z0-9]/g, "")
          .toLowerCase();
        const tenantSegment =
          currentUser?.tenant_id && /^[0-9a-fA-F-]{36}$/.test(currentUser.tenant_id)
            ? currentUser.tenant_id
            : "general";
        const filePath = `req-files/${tenantSegment}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}.${cleanExt}`;
        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });

        if (uploadError) {
          console.error("Gagal mengunggah berkas panduan ke Storage:", uploadError.message);
          showNotificationModal(
            "Gagal Mengunggah Berkas",
            `Berkas tidak dapat disimpan ke server penyimpanan (${uploadError.message}). Pastikan ukuran maksimal 10 MB dan format sesuai.`,
            "error"
          );
          return;
        }
        const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
        finalUrl = data.publicUrl;
      } else {
        if (file.size > 2 * 1024 * 1024) {
          showNotificationModal(
            "Mode Offline Terbatas",
            "Pada mode lokal/offline, ukuran lampiran dibatasi maksimal 2 MB.",
            "error"
          );
          return;
        }
        finalUrl = await readFileAsDataURL(file);
      }

      // Hapus berkas sementara sebelumnya bila user mengganti file sebelum klik Simpan
      if (reqFormFileUrl && reqFormFileUrl !== reqOriginalFileUrl) {
        void deleteStorageFile(reqFormFileUrl);
      }

      setReqFormFileName(file.name);
      setReqFormFileSize(formattedSize);
      setReqFormFileUrl(finalUrl);
    } catch (err) {
      console.error("Gagal memproses berkas panduan:", err);
      showNotificationModal(
        "Gagal Memproses Berkas",
        "Terjadi kendala saat mengunggah berkas panduan. Silakan coba kembali.",
        "error"
      );
    } finally {
      setIsUploadingReqFile(false);
    }
  };

  const handleRemoveReqFile = () => {
    if (reqFormFileUrl && reqFormFileUrl !== reqOriginalFileUrl) {
      void deleteStorageFile(reqFormFileUrl);
    }
    setReqFormFileName("");
    setReqFormFileSize("");
    setReqFormFileUrl("");
  };

  const handleCloseReqModal = (open: boolean) => {
    if (!open && reqFormFileUrl && reqFormFileUrl !== reqOriginalFileUrl) {
      // Bersihkan file baru yang terlanjur terunggah saat modal dibatalkan
      void deleteStorageFile(reqFormFileUrl);
    }
    setIsReqModalOpen(open);
  };

  const handleSaveRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqFormTitle.trim()) {
      showNotificationModal(
        "Judul Tugas Wajib Diisi",
        "Silakan masukkan judul tugas RTL sebelum menyimpan data.",
        "error"
      );
      return;
    }

    const existingReq = editingReqId
      ? requirements.find((r) => r.id === editingReqId) || null
      : null;

    if (existingReq && !canManageRequirement(existingReq, currentUser, events)) {
      showNotificationModal(
        "Akses Ditolak",
        "Anda tidak memiliki izin mengubah tugas milik tenant lain.",
        "error"
      );
      return;
    }

    const targetEvtId = selectedEventId !== "ALL" ? selectedEventId : reqFormEventId;
    const targetEvent = tenantEvents.find((ev) => ev.id === targetEvtId) || null;

    if (!targetEvent && !isCabangOrAdmin(currentUser) && !existingReq) {
      showNotificationModal(
        "Kegiatan Wajib Dipilih",
        "Buat atau pilih kegiatan kaderisasi komisariat terlebih dahulu sebelum menambahkan tugas RTL.",
        "error"
      );
      return;
    }

    setIsSavingReq(true);
    try {
      const payload = buildRequirementPayload({
        existing: existingReq,
        title: reqFormTitle,
        description: reqFormDescription,
        deadline: reqFormDeadline,
        minSubmissions: reqFormMinSubmissions,
        targetEvent,
        fallbackLevel:
          tugasLevelFilter !== "ALL" ? tugasLevelFilter : selectedEvent?.level || "MAPABA",
        fileUrl: reqFormFileUrl,
        fileName: reqFormFileName,
        fileSize: reqFormFileSize,
        currentUser,
        activeTenant,
      });

      // Delta upsert O(1) — tidak mengirim baris milik tenant lain
      const saved = await db.upsertRequirement(payload);
      if (!saved) {
        showNotificationModal(
          "Gagal Menyimpan Tugas",
          "Database menolak penyimpanan tugas RTL. Periksa izin akun/tenant dan koneksi internet Anda.",
          "error"
        );
        return;
      }

      // Bersihkan berkas lama di Storage bila diganti atau dihapus
      if (reqOriginalFileUrl && reqOriginalFileUrl !== (payload.fileUrl || "")) {
        void deleteStorageFile(reqOriginalFileUrl);
      }

      setRequirements((prev) => {
        if (existingReq) {
          return prev.map((r) => (r.id === existingReq.id ? payload : r));
        }
        return [payload, ...prev];
      });

      setReqOriginalFileUrl(payload.fileUrl || "");
      setIsReqModalOpen(false);
      showNotificationModal(
        editingReqId ? "Tugas Berhasil Diperbarui" : "Tugas Berhasil Ditambahkan",
        editingReqId
          ? "Perubahan tugas RTL telah tersimpan di database."
          : "Tugas RTL baru telah ditambahkan ke agenda kegiatan.",
        "success"
      );
    } catch (err) {
      console.error("Gagal menyimpan tugas:", err);
      showNotificationModal(
        "Gagal Menyimpan Tugas",
        "Terjadi kendala tak terduga saat menyimpan data tugas. Silakan coba lagi.",
        "error"
      );
    } finally {
      setIsSavingReq(false);
    }
  };

  const handlePromptDeleteRequirement = (req: Requirement) => {
    if (!canManageRequirement(req, currentUser, events)) {
      showNotificationModal(
        "Akses Terbatas",
        "Tugas RTL ini milik tingkat Cabang / komisariat lain dan tidak dapat dihapus dari akun ini.",
        "error"
      );
      return;
    }
    setDeletingReq(req);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteRequirement = async () => {
    if (!deletingReq) return;
    setIsDeleting(true);
    try {
      // Hapus langsung 1 baris di Supabase `persyaratan` + bersihkan file Storage
      const deleted = await db.deleteRequirement(deletingReq.id, deletingReq.fileUrl);
      if (!deleted) {
        showNotificationModal(
          "Gagal Menghapus Tugas",
          "Database menolak penghapusan tugas RTL ini. Periksa izin akun/tenant dan koneksi Anda.",
          "error"
        );
        return;
      }

      setRequirements((prev) => prev.filter((r) => r.id !== deletingReq.id));
      setIsDeleteModalOpen(false);
      setDeletingReq(null);
      showNotificationModal(
        "Tugas Berhasil Dihapus",
        "Tugas RTL dan berkas panduannya telah dihapus secara permanen dari database.",
        "success"
      );
    } catch (err) {
      console.error("Gagal menghapus tugas:", err);
      showNotificationModal(
        "Gagal Menghapus Tugas",
        "Terjadi kendala saat menghapus tugas. Silakan coba lagi.",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse p-4 sm:p-6">
        <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-full" />
        <div className="h-14 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
        <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10 font-sans text-zinc-900 dark:text-zinc-100 pb-16">
      {/* 1. HERO HEADER WITH EVENT SELECTOR & TENANT SCOPE */}
      <VerifikasiHero
        staffPrefix={staffPrefix}
        scopeLabel={scopeLabel}
        isCabangScope={isCabangOrAdmin(currentUser)}
        pendingCount={pendingCount}
        totalParticipantsInEvent={totalParticipantsInEvent}
        selectedEventId={selectedEventId}
        onSelectedEventIdChange={setSelectedEventId}
        tenantEvents={tenantEvents}
        selectedEvent={selectedEvent}
        lulusRtlCount={lulusRtlCount}
      />

      {/* 2. MAIN NAVIGATION TABS */}
      <VerifikasiTabsHeader
        mainTab={mainTab}
        onTabChange={(tab) => {
          setMainTab(tab);
        }}
        pendingCount={pendingCount}
        totalParticipantsInEvent={totalParticipantsInEvent}
        tasksCount={currentApplicableReqs.length}
      />

      {/* 3. TAB 1: VERIFIKASI BERKAS MASUK */}
      {mainTab === "VERIFIKASI" && (
        <VerifikasiSubmissionsTab
          reviewSubTab={reviewSubTab}
          onReviewSubTabChange={setReviewSubTab}
          pendingCount={pendingCount}
          approvedCount={approvedCount}
          rejectedCount={rejectedCount}
          searchQuery={submissionSearch}
          onSearchQueryChange={setSubmissionSearch}
          filteredSubmissions={filteredSubmissions}
          onOpenReview={handleOpenReview}
        />
      )}

      {/* 4. TAB 2: PROGRES PESERTA KEGIATAN */}
      {mainTab === "PROGRES" && (
        <ParticipantProgressTab
          progresStatusFilter={progresStatusFilter}
          onProgresStatusFilterChange={setProgresStatusFilter}
          searchQuery={progressSearch}
          onSearchQueryChange={setProgressSearch}
          filteredParticipants={filteredParticipants}
          selectedEventName={selectedEvent?.name || selectedEvent?.title}
          onOpenDetailModal={(p) => {
            setSelectedParticipantId(p.id);
            setIsDetailModalOpen(true);
          }}
          onSahkanKelulusan={(p) => handleSahkanKelulusan(p, "APPROVE")}
          onRevokeKelulusan={(p) => handleSahkanKelulusan(p, "REVOKE")}
        />
      )}

      {/* 5. TAB 3: TUGAS (CRUD TUGAS RTL) */}
      {mainTab === "TUGAS" && (
        <TugasTab
          selectedEvent={selectedEvent}
          tugasLevelFilter={tugasLevelFilter}
          onTugasLevelFilterChange={setTugasLevelFilter}
          currentApplicableReqs={currentApplicableReqs}
          events={events}
          canManageReq={(req) => canManageRequirement(req, currentUser, events)}
          onOpenAddReq={handleOpenAddReq}
          onOpenEditReq={handleOpenEditReq}
          onPromptDeleteReq={handlePromptDeleteRequirement}
        />
      )}

      {/* 6. MODAL: REVIEW LAPORAN */}
      <ReviewSubmissionModal
        isOpen={isReviewModalOpen}
        onOpenChange={(open) => {
          setIsReviewModalOpen(open);
          if (!open) setReviewError("");
        }}
        reviewingSubmission={reviewingSubmission}
        reviewStatus={reviewStatus}
        onReviewStatusChange={(st) => {
          setReviewStatus(st);
          setReviewError("");
        }}
        reviewFeedback={reviewFeedback}
        onReviewFeedbackChange={(val) => {
          setReviewFeedback(val);
          if (reviewError && val.trim()) setReviewError("");
        }}
        reviewError={reviewError}
        isSubmittingReview={isSubmittingReview}
        onSubmitReview={handleSaveReview}
      />

      {/* 7. MODAL: DETAIL PROGRES PESERTA */}
      <ParticipantDetailModal
        isOpen={isDetailModalOpen}
        onOpenChange={(open) => {
          setIsDetailModalOpen(open);
          if (!open) setSelectedParticipantId(null);
        }}
        participant={selectedParticipantProgress}
        onReviewSubmission={handleOpenReviewFromParticipantDetail}
        onSahkanKelulusan={(p) => handleSahkanKelulusan(p, "APPROVE")}
        onRevokeKelulusan={(p) => handleSahkanKelulusan(p, "REVOKE")}
      />

      {/* 8. MODAL: CRUD TUGAS RTL */}
      <TaskModal
        isOpen={isReqModalOpen}
        onOpenChange={handleCloseReqModal}
        editingReqId={editingReqId}
        selectedEventId={selectedEventId}
        selectedEvent={selectedEvent}
        tenantEvents={tenantEvents}
        reqFormEventId={reqFormEventId}
        onReqFormEventIdChange={setReqFormEventId}
        reqFormTitle={reqFormTitle}
        onReqFormTitleChange={setReqFormTitle}
        reqFormDeadline={reqFormDeadline}
        onReqFormDeadlineChange={setReqFormDeadline}
        reqFormMinSubmissions={reqFormMinSubmissions}
        onReqFormMinSubmissionsChange={setReqFormMinSubmissions}
        reqFormFileUrl={reqFormFileUrl}
        reqFormFileName={reqFormFileName}
        reqFormFileSize={reqFormFileSize}
        isUploadingReqFile={isUploadingReqFile}
        isSavingReq={isSavingReq}
        onReqFileChange={handleReqFileChange}
        onRemoveReqFile={handleRemoveReqFile}
        reqFormDescription={reqFormDescription}
        onReqFormDescriptionChange={setReqFormDescription}
        onSaveRequirement={handleSaveRequirement}
      />

      {/* 9. MODAL: KONFIRMASI HAPUS TUGAS */}
      <DeleteTaskModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        deletingReq={deletingReq}
        events={events}
        isDeleting={isDeleting}
        onConfirmDelete={handleConfirmDeleteRequirement}
      />

      {/* 10. MODAL: SAHKAN / BATALKAN KELULUSAN RTL */}
      <SahkanKelulusanModal
        isOpen={isSahkanModalOpen}
        onOpenChange={setIsSahkanModalOpen}
        participant={participantToSahkan}
        mode={sahkanActionMode}
        isSubmitting={isSubmittingSahkan}
        onConfirm={handleConfirmSahkanKelulusan}
      />

      {/* 11. MODAL: SUCCESS / FEEDBACK NOTIFICATION */}
      <FeedbackModal
        open={isSuccessModalOpen}
        onOpenChange={setIsSuccessModalOpen}
        title={successModalData.title}
        description={successModalData.description}
        type={successModalData.type}
      />
    </div>
  );
}
