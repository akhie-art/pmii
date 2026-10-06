"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/db";
import type {
  EventActivity,
  ParticipantRegistration,
  Requirement,
  CadreFollowUp,
  CadreSubmission,
  UserAccount
} from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isRecordInTenant } from "@/lib/tenancy";
import { FeedbackModal } from "@/components/ui/feedback-modal";

import {
  EventParticipantProgress,
  readFileAsDataURL,
  getParticipantPhoto,
} from "./_components/types";
import { VerifikasiHero } from "./_components/VerifikasiHero";
import { VerifikasiTabsHeader } from "./_components/VerifikasiTabsHeader";
import { VerifikasiSubmissionsTab, DisplaySubmission } from "./_components/VerifikasiSubmissionsTab";
import { ParticipantProgressTab } from "./_components/ParticipantProgressTab";
import { TugasTab } from "./_components/TugasTab";
import { ReviewSubmissionModal } from "./_components/ReviewSubmissionModal";
import { ParticipantDetailModal } from "./_components/ParticipantDetailModal";
import { TaskModal } from "./_components/TaskModal";
import { DeleteTaskModal } from "./_components/DeleteTaskModal";
import { SahkanKelulusanModal } from "./_components/SahkanKelulusanModal";

export default function UnifiedRtlVerifikasiPage() {
  const [mounted, setMounted] = useState(false);

  // Core Data
  const [events, setEvents] = useState<EventActivity[]>([]);
  const [registrations, setRegistrations] = useState<ParticipantRegistration[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [cadres, setCadres] = useState<CadreFollowUp[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeCampus, setActiveCampus] = useState("Ki Ageng Getas Pendawa");

  // Filter & View States
  const [selectedEventId, setSelectedEventId] = useState<string>("ALL");
  const [mainTab, setMainTab] = useState<"VERIFIKASI" | "PROGRES" | "TUGAS">("VERIFIKASI");
  const [reviewSubTab, setReviewSubTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [progresStatusFilter, setProgresStatusFilter] = useState<string>("ALL");
  const [tugasLevelFilter, setTugasLevelFilter] = useState<string>("ALL");

  // Review Dialog States
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState<CadreSubmission | null>(null);
  const [reviewingCadreId, setReviewingCadreId] = useState<string>("");
  const [reviewingCadreName, setReviewingCadreName] = useState<string>("");
  const [reviewingCadreLevel, setReviewingCadreLevel] = useState<string>("");
  const [reviewingCadreAvatar, setReviewingCadreAvatar] = useState<string | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState<string>("");
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Participant Detail Dialog States
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedParticipantProgress, setSelectedParticipantProgress] = useState<EventParticipantProgress | null>(null);

  // CRUD Requirement (Tugas) Dialog States
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [reqFormEventId, setReqFormEventId] = useState<string>("");
  const [reqFormTitle, setReqFormTitle] = useState("");
  const [reqFormDeadline, setReqFormDeadline] = useState("");
  const [reqFormDescription, setReqFormDescription] = useState("");
  const [reqFormFileUrl, setReqFormFileUrl] = useState("");
  const [reqFormFileName, setReqFormFileName] = useState("");
  const [reqFormFileSize, setReqFormFileSize] = useState("");
  const [isUploadingReqFile, setIsUploadingReqFile] = useState(false);

  // Delete Confirmation Dialog States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingReq, setDeletingReq] = useState<Requirement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sahkan Kelulusan Dialog States
  const [isSahkanModalOpen, setIsSahkanModalOpen] = useState(false);
  const [participantToSahkan, setParticipantToSahkan] = useState<EventParticipantProgress | null>(null);
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
    type: "success"
  });

  const showNotificationModal = (
    title: string,
    description: string,
    type: "success" | "error" = "success"
  ) => {
    setSuccessModalData({ title, description, type });
    setIsSuccessModalOpen(true);
  };

  // Initial Data Fetch
  useEffect(() => {
    const loadAll = async () => {
      const storedCampus =
        typeof window !== "undefined"
          ? localStorage.getItem("PMII_ACTIVE_COMMISSARIAT") || "Ki Ageng Getas Pendawa"
          : "Ki Ageng Getas Pendawa";
      setActiveCampus(storedCampus);

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

      try {
        const [loadedEvents, loadedRegs, loadedReqs, loadedCadres, loadedUsers] = await Promise.all([
          db.getEvents(),
          db.getRegistrations(),
          db.getRequirements(),
          db.getCadres(),
          db.getUsers()
        ]);

        setEvents(loadedEvents);
        setRegistrations(loadedRegs);
        setRequirements(loadedReqs);
        setCadres(loadedCadres);
        setUsers(loadedUsers);

        // Auto select first open/active event if available
        if (loadedEvents.length > 0) {
          const firstEvent = loadedEvents[0];
          setSelectedEventId(firstEvent.id);
        }
      } catch (err) {
        console.error("Error loading RTL & Verifikasi data:", err);
      } finally {
        setMounted(true);
      }
    };

    loadAll();
  }, []);

  // Filtered Events by Tenant
  const tenantEvents = useMemo(() => {
    return events.filter((e) =>
      isRecordInTenant(currentUser, { commissariat: e.commissariat })
    );
  }, [events, currentUser]);

  const selectedEvent = useMemo(() => {
    if (selectedEventId === "ALL") return null;
    return tenantEvents.find((e) => e.id === selectedEventId) || null;
  }, [selectedEventId, tenantEvents]);

  // Requirements applicable to current selection
  const currentApplicableReqs = useMemo(() => {
    if (selectedEvent) {
      return requirements.filter(
        (r) =>
          (r.eventId && r.eventId === selectedEvent.id) ||
          (!r.eventId && r.level === selectedEvent.level)
      );
    }
    if (tugasLevelFilter !== "ALL") {
      return requirements.filter((r) => r.level === tugasLevelFilter);
    }
    return requirements;
  }, [requirements, selectedEvent, tugasLevelFilter]);

  // Automatically derive participant progress list for the selected event (or all)
  const eventParticipantsProgress: EventParticipantProgress[] = useMemo(() => {
    const targetRegs =
      selectedEventId === "ALL"
        ? registrations
        : registrations.filter((r) => r.eventId === selectedEventId);

    return targetRegs.map((reg) => {
      // Find event for this registration
      const evt = events.find((e) => e.id === reg.eventId) || selectedEvent;
      const effectiveLevel = (evt?.level as "MAPABA" | "PKD" | "PKL") || "MAPABA";

      // Applicable requirements for this participant's event
      const reqsForLevel = requirements.filter(
        (r) =>
          (evt && r.eventId && r.eventId === evt.id) ||
          (!r.eventId && r.level === effectiveLevel)
      );

      // Find matched cadre record if exists
      const matchedCadre =
        cadres.find(
          (c) =>
            (c.email &&
              reg.cadreEmail &&
              c.email.toLowerCase() === reg.cadreEmail.toLowerCase()) ||
            c.name.toLowerCase() === reg.cadreName.toLowerCase() ||
            c.id === reg.id
        ) || null;

      const submissions = matchedCadre?.submissions || [];

      // Calculate progress
      let approvedCount = 0;
      let totalRatio = 0;
      reqsForLevel.forEach((r) => {
        const minNeeded = r.minSubmissions || 1;
        const approvedSubs = submissions.filter(
          (s) => s.requirementId === r.id && s.status === "APPROVED"
        ).length;
        if (approvedSubs >= minNeeded) {
          approvedCount++;
        }
        totalRatio += Math.min(1, approvedSubs / minNeeded);
      });

      const percent =
        reqsForLevel.length > 0 ? Math.round((totalRatio / reqsForLevel.length) * 100) : 0;

      let status: "SELESAI" | "REVISI" | "AKTIF" | "BELUM_MULAI" = "BELUM_MULAI";
      if (matchedCadre?.status === "SELESAI" || percent === 100) {
        status = "SELESAI";
      } else if (submissions.some((s) => s.status === "REJECTED")) {
        status = "REVISI";
      } else if (submissions.length > 0) {
        status = "AKTIF";
      }

      const photoUrl = getParticipantPhoto(matchedCadre, reg, users);

      return {
        id: reg.id,
        registrationId: reg.id,
        eventId: reg.eventId,
        eventName: evt?.name || evt?.title || "Kegiatan Kaderisasi",
        eventLevel: effectiveLevel,
        cadreName: reg.cadreName,
        cadreEmail: reg.cadreEmail,
        phone: reg.answers?.phone || reg.answers?.noHp || "-",
        campus: reg.answers?.kampus || reg.answers?.universitas || "-",
        dateApplied: reg.dateApplied,
        regStatus: reg.status,
        matchedCadre,
        submissions,
        applicableRequirements: reqsForLevel,
        status,
        progressPercent: percent,
        approvedCount,
        totalRequirements: reqsForLevel.length,
        photoUrl
      };
    });
  }, [registrations, selectedEventId, events, selectedEvent, requirements, cadres, users]);

  // Submissions for Tab 1 (Verifikasi Antrean)
  const allSubmissions: DisplaySubmission[] = useMemo(() => {
    const list: DisplaySubmission[] = [];

    cadres.forEach((cadre) => {
      const matchingReg = registrations.find(
        (r) =>
          r.id === cadre.id ||
          (r.cadreEmail &&
            cadre.email &&
            r.cadreEmail.toLowerCase() === cadre.email.toLowerCase()) ||
          r.cadreName.toLowerCase() === cadre.name.toLowerCase()
      );
      const matchingEvent = matchingReg ? events.find((e) => e.id === matchingReg.eventId) : null;
      const photoUrl = getParticipantPhoto(cadre, matchingReg, users);

      // Filter by selected event
      if (selectedEventId !== "ALL") {
        if (matchingEvent && matchingEvent.id !== selectedEventId) {
          return;
        }
        if (!matchingEvent && cadre.level !== selectedEvent?.level) {
          return;
        }
      }

      cadre.submissions.forEach((s) => {
        list.push({
          ...s,
          cadreId: cadre.id,
          cadreName: cadre.name,
          cadreLevel: cadre.level,
          cadreAvatar: photoUrl || cadre.avatar,
          eventId: matchingEvent?.id,
          eventName: matchingEvent?.name || matchingEvent?.title || `Kaderisasi ${cadre.level}`
        });
      });
    });

    return list;
  }, [cadres, registrations, events, selectedEventId, selectedEvent, users]);

  // Statistics
  const pendingCount = allSubmissions.filter((s) => s.status === "PENDING").length;
  const approvedCount = allSubmissions.filter((s) => s.status === "APPROVED").length;
  const rejectedCount = allSubmissions.filter((s) => s.status === "REJECTED").length;

  const totalParticipantsInEvent = eventParticipantsProgress.length;
  const lulusRtlCount = eventParticipantsProgress.filter((p) => p.status === "SELESAI").length;

  // Filtered submissions for display in Tab 1
  const filteredSubmissions = useMemo(() => {
    return allSubmissions.filter((s) => {
      const matchesTab = s.status === reviewSubTab;
      const matchesSearch =
        searchQuery.trim() === "" ||
        s.cadreName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [allSubmissions, reviewSubTab, searchQuery]);

  // Filtered participants for display in Tab 2
  const filteredParticipants = useMemo(() => {
    return eventParticipantsProgress.filter((p) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        p.cadreName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.cadreEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        progresStatusFilter === "ALL" || p.status === progresStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [eventParticipantsProgress, searchQuery, progresStatusFilter]);

  // Review Actions
  const handleOpenReview = (sub: DisplaySubmission) => {
    setReviewingSubmission({
      id: sub.id,
      requirementId: sub.requirementId,
      title: sub.title,
      description: sub.description,
      fileLink: sub.fileLink,
      date: sub.date,
      status: sub.status,
      feedback: sub.feedback
    });
    setReviewingCadreId(sub.cadreId);
    setReviewingCadreName(sub.cadreName);
    setReviewingCadreLevel(sub.cadreLevel);
    setReviewingCadreAvatar(sub.cadreAvatar || null);
    setReviewStatus(sub.status === "REJECTED" ? "REJECTED" : "APPROVED");
    setReviewFeedback(sub.feedback || "");
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSubmission || !reviewingCadreId) return;

    setIsSubmittingReview(true);
    try {
      const updatedCadres = cadres.map((cadre) => {
        if (cadre.id === reviewingCadreId) {
          const updatedSubmissions = cadre.submissions.map((sub) => {
            if (sub.id === reviewingSubmission.id) {
              return {
                ...sub,
                status: reviewStatus,
                feedback: reviewFeedback.trim()
              };
            }
            return sub;
          });

          // Check if cadre should be marked SELESAI
          const hasPending = updatedSubmissions.some((s) => s.status === "PENDING");
          const hasRejected = updatedSubmissions.some((s) => s.status === "REJECTED");
          const reqsForLevel = requirements.filter((r) => r.level === cadre.level);
          const currentApproved = updatedSubmissions.filter((s) => s.status === "APPROVED").length;

          let newStatus = cadre.status;
          if (reviewStatus === "REJECTED") {
            newStatus = "REVISI";
          } else if (
            !hasPending &&
            !hasRejected &&
            currentApproved >= reqsForLevel.length &&
            reqsForLevel.length > 0
          ) {
            newStatus = "SELESAI";
          } else {
            newStatus = "AKTIF";
          }

          return {
            ...cadre,
            submissions: updatedSubmissions,
            status: newStatus
          };
        }
        return cadre;
      });

      setCadres(updatedCadres);
      await db.saveCadres(updatedCadres);
      setIsReviewModalOpen(false);
      setReviewingSubmission(null);
      setReviewingCadreId("");
      setReviewFeedback("");
      showNotificationModal(
        reviewStatus === "APPROVED" ? "Laporan Berhasil Disetujui" : "Laporan Dikembalikan untuk Revisi",
        `Hasil peninjauan laporan "${reviewingSubmission.title}" untuk ${reviewingCadreName} telah tersimpan dan disinkronkan ke pangkalan data.`,
        "success"
      );
    } catch (error) {
      console.error("Failed to save review:", error);
      showNotificationModal(
        "Gagal Menyimpan Verifikasi",
        "Terjadi kendala saat menyimpan hasil verifikasi berkas. Silakan coba lagi.",
        "error"
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Sahkan Kelulusan RTL Peserta Modal Triggers
  const handleSahkanKelulusan = (p: EventParticipantProgress) => {
    setParticipantToSahkan(p);
    setIsSahkanModalOpen(true);
  };

  const handleConfirmSahkanKelulusan = async () => {
    if (!participantToSahkan) return;
    const p = participantToSahkan;
    setIsSubmittingSahkan(true);

    try {
      let updatedCadres: CadreFollowUp[];
      if (p.matchedCadre) {
        updatedCadres = cadres.map((c) =>
          c.id === p.matchedCadre!.id ? { ...c, status: "SELESAI" } : c
        );
      } else {
        const newCadre: CadreFollowUp = {
          id: `cadre-${Date.now()}`,
          name: p.cadreName,
          level: p.eventLevel as any,
          commissariat: activeCampus,
          startDate: selectedEvent?.date || new Date().toISOString().split("T")[0],
          status: "SELESAI",
          submissions: [],
          email: p.cadreEmail,
          phone: p.phone,
          avatar: p.photoUrl || undefined
        };
        updatedCadres = [...cadres, newCadre];
      }

      setCadres(updatedCadres);
      await db.saveCadres(updatedCadres);
      setIsSahkanModalOpen(false);
      setParticipantToSahkan(null);
      showNotificationModal(
        "Kelulusan Berhasil Disahkan",
        `Kelulusan RTL ${p.cadreName} telah berhasil disahkan! Status kader kini LULUS / SELESAI.`,
        "success"
      );
    } catch (err) {
      console.error("Gagal mengesahkan kelulusan:", err);
      showNotificationModal(
        "Gagal Mengesahkan Kelulusan",
        "Terjadi kendala saat mengesahkan kelulusan. Silakan coba lagi.",
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
    setReqFormDescription("");
    setReqFormFileUrl("");
    setReqFormFileName("");
    setReqFormFileSize("");
    setIsReqModalOpen(true);
  };

  const handleOpenEditReq = (req: Requirement) => {
    setEditingReqId(req.id);
    setReqFormEventId(
      req.eventId || (selectedEventId !== "ALL" ? selectedEventId : tenantEvents[0]?.id || "")
    );
    setReqFormTitle(req.title);
    setReqFormDeadline(req.deadline || "");
    setReqFormDescription(req.description || "");
    setReqFormFileUrl(req.fileUrl || "");
    setReqFormFileName(req.fileName || "");
    setReqFormFileSize(req.fileSize || "");
    setIsReqModalOpen(true);
  };

  const handleReqFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      showNotificationModal(
        "Ukuran Berkas Terlalu Besar",
        "Ukuran berkas melebihi batas maksimal 25MB. Harap pilih berkas dokumen yang lebih kecil.",
        "error"
      );
      return;
    }

    setIsUploadingReqFile(true);
    setReqFormFileName(file.name);
    setReqFormFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    try {
      let finalUrl = "";
      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split(".").pop();
        const filePath = `req-files/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("materials").upload(filePath, file);
        if (uploadError) {
          console.warn("Storage upload failed, falling back to data URL:", uploadError.message);
          finalUrl = await readFileAsDataURL(file);
        } else {
          const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
          finalUrl = data.publicUrl;
        }
      } else {
        finalUrl = await readFileAsDataURL(file);
      }
      setReqFormFileUrl(finalUrl);
    } catch (err) {
      console.error("Gagal membaca berkas:", err);
      showNotificationModal(
        "Gagal Membaca Berkas",
        "Terjadi kendala saat memproses berkas panduan. Silakan coba unggah kembali.",
        "error"
      );
      setReqFormFileName("");
      setReqFormFileSize("");
      setReqFormFileUrl("");
    } finally {
      setIsUploadingReqFile(false);
    }
  };

  const handleRemoveReqFile = () => {
    setReqFormFileName("");
    setReqFormFileSize("");
    setReqFormFileUrl("");
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

    // Determine target event
    const targetEvtId = selectedEventId !== "ALL" ? selectedEventId : reqFormEventId;
    const targetEvent = events.find((ev) => ev.id === targetEvtId);
    const targetLevel = (targetEvent?.level as "MAPABA" | "PKD" | "PKL") || "MAPABA";

    try {
      let updatedReqs: Requirement[];

      if (editingReqId) {
        updatedReqs = requirements.map((r) =>
          r.id === editingReqId
            ? {
                ...r,
                title: reqFormTitle.trim(),
                eventId: targetEvtId || undefined,
                level: targetLevel,
                deadline: reqFormDeadline || undefined,
                description: reqFormDescription.trim(),
                fileUrl: reqFormFileUrl || undefined,
                fileName: reqFormFileName || undefined,
                fileSize: reqFormFileSize || undefined,
                category: r.category || "Tugas"
              }
            : r
        );
      } else {
        const newReq: Requirement = {
          id: `req-${Date.now()}`,
          title: reqFormTitle.trim(),
          eventId: targetEvtId || undefined,
          level: targetLevel,
          category: "Tugas",
          minSubmissions: 1,
          deadline: reqFormDeadline || undefined,
          description: reqFormDescription.trim(),
          fileUrl: reqFormFileUrl || undefined,
          fileName: reqFormFileName || undefined,
          fileSize: reqFormFileSize || undefined
        };
        updatedReqs = [newReq, ...requirements];
      }

      setRequirements(updatedReqs);
      await db.saveRequirements(updatedReqs);
      setIsReqModalOpen(false);
      showNotificationModal(
        editingReqId ? "Tugas Berhasil Diperbarui" : "Tugas Berhasil Ditambahkan",
        editingReqId
          ? "Perubahan tugas RTL telah tersimpan dan disinkronkan ke pangkalan data."
          : "Tugas RTL baru telah berhasil ditambahkan ke agenda kegiatan.",
        "success"
      );
    } catch (err) {
      console.error("Gagal menyimpan tugas:", err);
      showNotificationModal(
        "Gagal Menyimpan Tugas",
        "Terjadi kendala saat menyimpan data tugas. Silakan coba lagi.",
        "error"
      );
    }
  };

  const handlePromptDeleteRequirement = (req: Requirement) => {
    setDeletingReq(req);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteRequirement = async () => {
    if (!deletingReq) return;
    setIsDeleting(true);
    try {
      const updatedReqs = requirements.filter((r) => r.id !== deletingReq.id);
      setRequirements(updatedReqs);
      await db.saveRequirements(updatedReqs);
      setIsDeleteModalOpen(false);
      setDeletingReq(null);
      showNotificationModal(
        "Tugas Berhasil Dihapus",
        "Tugas RTL telah berhasil dihapus secara permanen dari pangkalan data.",
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
      {/* 1. HERO HEADER WITH EVENT SELECTOR */}
      <VerifikasiHero
        activeCampus={activeCampus}
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
          setSearchQuery("");
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
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          filteredSubmissions={filteredSubmissions}
          onOpenReview={handleOpenReview}
        />
      )}

      {/* 4. TAB 2: PROGRES PESERTA KEGIATAN (OTOMATIS DARI PENDAFTARAN) */}
      {mainTab === "PROGRES" && (
        <ParticipantProgressTab
          progresStatusFilter={progresStatusFilter}
          onProgresStatusFilterChange={setProgresStatusFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          filteredParticipants={filteredParticipants}
          selectedEventName={selectedEvent?.name || selectedEvent?.title}
          onOpenDetailModal={(p) => {
            setSelectedParticipantProgress(p);
            setIsDetailModalOpen(true);
          }}
          onSahkanKelulusan={handleSahkanKelulusan}
        />
      )}

      {/* 5. TAB 3: TUGAS (CRUD TUGAS RTL) */}
      {mainTab === "TUGAS" && (
        <TugasTab
          tugasLevelFilter={tugasLevelFilter}
          onTugasLevelFilterChange={setTugasLevelFilter}
          currentApplicableReqs={currentApplicableReqs}
          events={events}
          onOpenAddReq={handleOpenAddReq}
          onOpenEditReq={handleOpenEditReq}
          onPromptDeleteReq={handlePromptDeleteRequirement}
        />
      )}

      {/* 6. MODAL: REVIEW LAPORAN */}
      <ReviewSubmissionModal
        isOpen={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
        reviewingSubmission={reviewingSubmission}
        reviewingCadreName={reviewingCadreName}
        reviewingCadreLevel={reviewingCadreLevel}
        reviewingCadreAvatar={reviewingCadreAvatar}
        reviewStatus={reviewStatus}
        onReviewStatusChange={setReviewStatus}
        reviewFeedback={reviewFeedback}
        onReviewFeedbackChange={setReviewFeedback}
        isSubmittingReview={isSubmittingReview}
        onSubmitReview={handleSaveReview}
      />

      {/* 7. MODAL: DETAIL PROGRES PESERTA */}
      <ParticipantDetailModal
        isOpen={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        participant={selectedParticipantProgress}
        onSahkanKelulusan={handleSahkanKelulusan}
      />

      {/* 8. MODAL: CRUD TUGAS RTL */}
      <TaskModal
        isOpen={isReqModalOpen}
        onOpenChange={setIsReqModalOpen}
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
        reqFormFileUrl={reqFormFileUrl}
        reqFormFileName={reqFormFileName}
        reqFormFileSize={reqFormFileSize}
        isUploadingReqFile={isUploadingReqFile}
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

      {/* 10. MODAL: SAHKAN KELULUSAN RTL */}
      <SahkanKelulusanModal
        isOpen={isSahkanModalOpen}
        onOpenChange={setIsSahkanModalOpen}
        participant={participantToSahkan}
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
