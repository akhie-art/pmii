import type {
  CadreFollowUp,
  CadreSubmission,
  EventActivity,
  ParticipantEvaluation,
  ParticipantRegistration,
  Requirement,
  UserAccount,
} from "@/lib/db";
import { generateUUID } from "@/lib/db";
import {
  enforceTenantWrite,
  isCabangOrAdmin,
  isCabangRecord,
  isRecordInTenant,
} from "@/lib/tenancy";
import { isPrivateStorageRef, resolveStorageUrl } from "@/lib/storage";
import { getParticipantPhoto } from "./types";
import type { EventParticipantProgress } from "./types";

/**
 * Daftar MIME type & ekstensi yang selaras 100% dengan allowlist bucket Supabase `materials`
 * (lihat `20261124000003_security_hardening_v2.sql`). `.zip` dihapus agar unggahan tidak ditolak.
 */
export const ALLOWED_REQUIREMENT_MIME_TYPES = new Set<string>([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export const ALLOWED_REQUIREMENT_EXTENSIONS = new Set<string>([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "csv",
  "png",
  "jpg",
  "jpeg",
  "webp",
]);

export const ALLOWED_REQUIREMENT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.png,.jpg,.jpeg,.webp";

export const MAX_REQUIREMENT_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateRequirementFile(file: {
  name: string;
  size: number;
  type?: string;
}): string | null {
  if (file.size > MAX_REQUIREMENT_FILE_BYTES) {
    return "Ukuran berkas melebihi batas maksimal 10 MB. Harap pilih berkas yang lebih kecil.";
  }
  const ext = (file.name.split(".").pop() || "").toLowerCase().trim();
  const mime = (file.type || "").toLowerCase().trim();
  const extValid = Boolean(ext && ALLOWED_REQUIREMENT_EXTENSIONS.has(ext));
  const mimeValid = Boolean(mime && ALLOWED_REQUIREMENT_MIME_TYPES.has(mime));
  if (!extValid && !mimeValid) {
    return "Format berkas tidak didukung. Gunakan PDF, Word, Excel, PowerPoint, CSV, atau gambar (PNG/JPG/WEBP).";
  }
  return null;
}

/**
 * Validasi protokol URL dokumen untuk mencegah `javascript:` / `vbscript:` / `data:text/html` XSS.
 */
export function isSafeDocumentUrl(rawUrl: string | null | undefined): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  if (isPrivateStorageRef(trimmed)) return true;
  if (trimmed.startsWith("/")) return !trimmed.startsWith("//");
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^data:(?:image\/(?:png|jpe?g|webp|gif)|application\/pdf);base64,/i.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Membuka tautan berkas (URL publik, `private-docs/...` via Signed URL, atau legacy `data:` URL)
 * secara aman di tab baru — mengubah `data:` URL ke Blob URL agar tidak diblokir Chrome modern.
 */
export async function openSafeDocumentUrl(rawUrl: string | null | undefined): Promise<boolean> {
  if (!isSafeDocumentUrl(rawUrl)) return false;
  const trimmed = String(rawUrl).trim();

  try {
    const resolved = isPrivateStorageRef(trimmed)
      ? await resolveStorageUrl(trimmed)
      : trimmed;
    if (!resolved) return false;

    if (resolved.startsWith("data:")) {
      const commaIdx = resolved.indexOf(",");
      if (commaIdx === -1) return false;
      const meta = resolved.slice(5, commaIdx);
      const mimeType = meta.split(";")[0] || "application/octet-stream";
      const base64Body = resolved.slice(commaIdx + 1);
      const binaryStr = atob(base64Body);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      return true;
    }

    window.open(resolved, "_blank", "noopener,noreferrer");
    return true;
  } catch (err) {
    console.warn("Gagal membuka dokumen aman:", err);
    return false;
  }
}

export function isDeadlineOverdue(
  deadline?: string | null,
  now: Date = new Date()
): boolean {
  if (!deadline) return false;
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() < now.getTime();
}

export function translateSubmissionStatus(status: string): string {
  switch (String(status || "").toUpperCase()) {
    case "APPROVED":
      return "Disetujui";
    case "REJECTED":
      return "Perlu Revisi";
    default:
      return "Menunggu";
  }
}

/**
 * Memeriksa apakah sebuah tugas/persyaratan RTL terlihat pada lingkup tenant aktif.
 * Tugas global milik Cabang (tanpa `eventId`) tetap terlihat bagi Pengurus Komisariat
 * secara read-only agar tugas kurikulum tingkat Cabang tetap terhitung pada progres kader.
 */
export function isRequirementVisibleInScope(
  req: Requirement,
  currentUser: UserAccount | null,
  activeTenant: string,
  events: EventActivity[]
): boolean {
  const linkedEvent = req.eventId ? events.find((e) => e.id === req.eventId) : undefined;
  if (linkedEvent) {
    return isRecordInTenant(
      currentUser,
      {
        commissariat: linkedEvent.commissariat,
        komisariat_id: linkedEvent.komisariat_id,
        tenant_id: linkedEvent.tenant_id || linkedEvent.komisariat_id,
      },
      activeTenant
    );
  }

  const inTenant = isRecordInTenant(
    currentUser,
    {
      commissariat: req.commissariat,
      komisariat_id: req.komisariat_id,
      tenant_id: req.tenant_id || req.komisariat_id,
    },
    activeTenant
  );
  if (inTenant) return true;

  // Tugas global milik Cabang (tanpa eventId) dapat dilihat read-only oleh Komisariat
  if (!req.eventId && (!req.tenant_id || isCabangRecord(req))) {
    return true;
  }

  return false;
}

/**
 * Memeriksa apakah pengguna saat ini berhak mengubah/menghapus tugas RTL tersebut
 * sesuai kebijakan RLS `persyaratan_staff_manage` di Supabase (`can_access_tenant(tenant_id)`).
 */
export function canManageRequirement(
  req: Requirement,
  currentUser: UserAccount | null,
  events: EventActivity[]
): boolean {
  if (!currentUser) return false;
  if (isCabangOrAdmin(currentUser)) return true;

  const userTenantId = currentUser.tenant_id || currentUser.komisariat_id || null;
  const linkedEvent = req.eventId ? events.find((e) => e.id === req.eventId) : undefined;
  const recordTenantId =
    req.tenant_id ||
    req.komisariat_id ||
    linkedEvent?.tenant_id ||
    linkedEvent?.komisariat_id ||
    null;

  if (userTenantId && recordTenantId) {
    return userTenantId === recordTenantId;
  }

  // Tugas global Cabang tanpa tenant_id milik komisariat hanya bisa dikelola Admin Cabang
  if (!recordTenantId || isCabangRecord(req)) {
    return false;
  }

  return isRecordInTenant(
    currentUser,
    {
      commissariat: req.commissariat || linkedEvent?.commissariat,
      komisariat_id: recordTenantId,
      tenant_id: recordTenantId,
    },
    currentUser.commissariat || "ALL"
  );
}

/**
 * Menyaring daftar tugas RTL yang berlaku untuk kegiatan atau filter jenjang yang aktif
 * dengan isolasi tenant ketat.
 */
export function filterRequirementsForContext(
  requirements: Requirement[],
  params: {
    selectedEvent: EventActivity | null;
    tugasLevelFilter: string;
    currentUser: UserAccount | null;
    activeTenant: string;
    events: EventActivity[];
  }
): Requirement[] {
  const { selectedEvent, tugasLevelFilter, currentUser, activeTenant, events } = params;

  const scoped = requirements.filter((req) =>
    isRequirementVisibleInScope(req, currentUser, activeTenant, events)
  );

  if (selectedEvent) {
    const evtLevel = String(selectedEvent.level || "").toUpperCase();
    return scoped.filter(
      (r) =>
        (r.eventId && r.eventId === selectedEvent.id) ||
        (!r.eventId && String(r.level || "").toUpperCase() === evtLevel)
    );
  }

  if (tugasLevelFilter !== "ALL") {
    const targetLvl = tugasLevelFilter.toUpperCase();
    return scoped.filter((r) => String(r.level || "").toUpperCase() === targetLvl);
  }

  return scoped;
}

/**
 * Mencocokkan record `anggota` (cadre) yang paling akurat untuk sebuah registrasi peserta.
 * Memprioritaskan email, lalu ID, lalu kecocokan nama di tenant yang sama agar tidak salah orang.
 */
export function matchCadreForRegistration(
  reg: ParticipantRegistration,
  cadres: CadreFollowUp[],
  event?: EventActivity | null
): CadreFollowUp | null {
  const regEmail = (reg.cadreEmail || reg.email || "").trim().toLowerCase();
  const regName = (reg.cadreName || reg.name || "").trim().toLowerCase();
  const regTenantId =
    reg.tenant_id || reg.komisariat_id || event?.tenant_id || event?.komisariat_id || null;

  if (regEmail) {
    const byEmail = cadres.find(
      (c) => (c.email || "").trim().toLowerCase() === regEmail
    );
    if (byEmail) return byEmail;
  }

  const byId = cadres.find((c) => c.id === reg.id);
  if (byId) return byId;

  if (regName) {
    const byNameSameTenant = cadres.find((c) => {
      const cName = (c.name || "").trim().toLowerCase();
      if (cName !== regName) return false;
      if (!regTenantId) return true;
      const cTid = c.tenant_id || c.komisariat_id || null;
      return !cTid || cTid === regTenantId;
    });
    if (byNameSameTenant) return byNameSameTenant;
  }

  return null;
}

/**
 * Menentukan kegiatan & registrasi yang tepat untuk sebuah laporan RTL (`submission`)
 * milik kader — akurat meskipun kader mengikuti beberapa jenjang kegiatan (MAPABA -> PKD -> PKL).
 */
export function resolveSubmissionEventContext(
  cadre: CadreFollowUp,
  submission: CadreSubmission,
  registrations: ParticipantRegistration[],
  events: EventActivity[],
  requirements: Requirement[]
): {
  requirement: Requirement | null;
  event: EventActivity | null;
  registration: ParticipantRegistration | null;
} {
  const req = requirements.find((r) => r.id === submission.requirementId) || null;

  const cadreEmail = (cadre.email || "").trim().toLowerCase();
  const cadreName = (cadre.name || "").trim().toLowerCase();
  const cadreTid = cadre.tenant_id || cadre.komisariat_id || null;

  const matchingRegs = registrations.filter((r) => {
    if (r.id === cadre.id) return true;
    const rEmail = (r.cadreEmail || r.email || "").trim().toLowerCase();
    if (cadreEmail && rEmail && cadreEmail === rEmail) return true;
    const rName = (r.cadreName || r.name || "").trim().toLowerCase();
    if (cadreName && rName && cadreName === rName) {
      const rTid = r.tenant_id || r.komisariat_id || null;
      return !cadreTid || !rTid || cadreTid === rTid;
    }
    return false;
  });

  // 1. Jika tugas RTL terikat ke eventId tertentu, prioritaskan event tersebut
  if (req?.eventId) {
    const exactEvent = events.find((e) => e.id === req.eventId) || null;
    const exactReg = matchingRegs.find((r) => r.eventId === req.eventId) || matchingRegs[0] || null;
    return { requirement: req, event: exactEvent, registration: exactReg };
  }

  // 2. Cocokkan registrasi yang jenjang kegiatannya sesuai dengan jenjang tugas/kader
  const targetLevel = String(req?.level || cadre.level || "").toUpperCase();
  const levelMatchedReg =
    matchingRegs.find((r) => {
      const ev = events.find((e) => e.id === r.eventId);
      return ev && String(ev.level || "").toUpperCase() === targetLevel;
    }) || matchingRegs[0] || null;

  const matchedEvent = levelMatchedReg
    ? events.find((e) => e.id === levelMatchedReg.eventId) || null
    : null;

  return { requirement: req, event: matchedEvent, registration: levelMatchedReg };
}

export interface RtlProgressSummary {
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  totalRequirements: number;
  progressPercent: number;
  allCompleted: boolean;
}

/**
 * Sumber kebenaran tunggal perhitungan progres RTL berdasarkan `requirementId` dan `minSubmissions`.
 * Mencegah bug duplikat laporan pada tugas yang sama dianggap meluluskan seluruh syarat tugas.
 */
export function calculateRtlProgress(
  submissions: CadreSubmission[],
  applicableReqs: Requirement[]
): RtlProgressSummary {
  const safeSubs = Array.isArray(submissions) ? submissions : [];
  const reqIds = new Set(applicableReqs.map((r) => r.id));
  const scopedSubs =
    applicableReqs.length > 0
      ? safeSubs.filter((s) => reqIds.has(s.requirementId))
      : safeSubs;

  let approvedReqs = 0;
  let totalRatio = 0;

  for (const req of applicableReqs) {
    const minNeeded = Math.max(1, Number(req.minSubmissions) || 1);
    const approvedForReq = scopedSubs.filter(
      (s) => s.requirementId === req.id && s.status === "APPROVED"
    ).length;
    if (approvedForReq >= minNeeded) {
      approvedReqs += 1;
    }
    totalRatio += Math.min(1, approvedForReq / minNeeded);
  }

  const totalRequirements = applicableReqs.length;
  const progressPercent =
    totalRequirements > 0 ? Math.round((totalRatio / totalRequirements) * 100) : 0;

  const pendingCount = scopedSubs.filter((s) => s.status === "PENDING").length;
  const rejectedCount = scopedSubs.filter((s) => s.status === "REJECTED").length;
  const allCompleted = totalRequirements > 0 && approvedReqs >= totalRequirements;

  return {
    approvedCount: approvedReqs,
    pendingCount,
    rejectedCount,
    totalRequirements,
    progressPercent,
    allCompleted,
  };
}

/**
 * Menentukan status akhir kader setelah pengurus melakukan review atas sebuah laporan RTL.
 */
export function deriveCadreStatusAfterReview(params: {
  updatedSubmissions: CadreSubmission[];
  applicableReqs: Requirement[];
  reviewStatus: "APPROVED" | "REJECTED";
}): "SELESAI" | "REVISI" | "AKTIF" {
  const { updatedSubmissions, applicableReqs, reviewStatus } = params;
  const progress = calculateRtlProgress(updatedSubmissions, applicableReqs);

  if (reviewStatus === "REJECTED" || progress.rejectedCount > 0) {
    return "REVISI";
  }
  if (progress.pendingCount === 0 && progress.allCompleted) {
    return "SELESAI";
  }
  return "AKTIF";
}

/**
 * Menyusun payload `Requirement` baru/edit ber-UUID valid dengan `tenant_id` yang benar
 * agar selalu lolos kebijakan RLS `persyaratan_staff_manage` untuk Pengurus Komisariat & Admin Cabang.
 */
export function buildRequirementPayload(params: {
  existing?: Requirement | null;
  title: string;
  description: string;
  deadline?: string;
  minSubmissions?: number;
  targetEvent?: EventActivity | null;
  fallbackLevel?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  currentUser: UserAccount | null;
  activeTenant: string;
}): Requirement {
  const {
    existing,
    title,
    description,
    deadline,
    minSubmissions,
    targetEvent,
    fallbackLevel = "MAPABA",
    fileUrl,
    fileName,
    fileSize,
    currentUser,
    activeTenant,
  } = params;

  const validExistingId =
    existing?.id && /^[0-9a-fA-F-]{36}$/.test(existing.id) ? existing.id : null;
  const targetLevel = (targetEvent?.level || existing?.level || fallbackLevel) as
    | "MAPABA"
    | "PKD"
    | "PKL"
    | string;

  const resolvedTenantOverride =
    targetEvent?.commissariat ||
    existing?.commissariat ||
    (activeTenant && activeTenant !== "ALL" && activeTenant !== "Semua Komisariat"
      ? activeTenant
      : currentUser?.commissariat || "ALL");

  const baseRecord: Requirement = {
    ...(existing || {}),
    id: validExistingId || generateUUID(),
    title: title.trim(),
    description: description.trim(),
    level: targetLevel,
    eventId: targetEvent?.id || existing?.eventId || undefined,
    category: existing?.category || "Tugas",
    minSubmissions: Math.max(1, Math.min(20, Math.floor(Number(minSubmissions) || 1))),
    deadline: deadline?.trim() ? deadline.trim() : undefined,
    fileUrl: fileUrl?.trim() ? fileUrl.trim() : undefined,
    fileName: fileUrl?.trim() && fileName?.trim() ? fileName.trim() : undefined,
    fileSize: fileUrl?.trim() && fileSize?.trim() ? fileSize.trim() : undefined,
    tenant_id: targetEvent?.tenant_id || targetEvent?.komisariat_id || existing?.tenant_id || null,
    komisariat_id:
      targetEvent?.tenant_id || targetEvent?.komisariat_id || existing?.komisariat_id || null,
    commissariat: targetEvent?.commissariat || existing?.commissariat,
  };

  return enforceTenantWrite<Requirement>(currentUser, baseRecord, resolvedTenantOverride);
}

/**
 * Menggabungkan daftar peserta progres RTL secara terpadu & terdeduplikasi dari 3 sumber:
 * 1. `pendaftaran` aktif (bukan REJECTED/DITOLAK) — sumber utama.
 * 2. `evaluations` untuk kegiatan yang sama — memulihkan peserta tambah manual/penilaian
 *    yang belum memiliki atau tidak terlihat baris pendaftarannya.
 * 3. `anggota` (`tenantCadres`) yang sudah mengunggah laporan RTL relevan untuk kegiatan tersebut —
 *    menjamin sinkronisasi penuh antara Tab 1 (Berkas Masuk) dan Tab 2 (Progres Peserta).
 */
export function buildUnifiedEventParticipants(params: {
  registrations: ParticipantRegistration[];
  evaluations: ParticipantEvaluation[];
  tenantCadres: CadreFollowUp[];
  tenantEvents: EventActivity[];
  allEvents: EventActivity[];
  requirements: Requirement[];
  selectedEventId: string;
  selectedEvent: EventActivity | null;
  currentUser: UserAccount | null;
  activeTenant: string;
}): EventParticipantProgress[] {
  const {
    registrations,
    evaluations,
    tenantCadres,
    tenantEvents,
    allEvents,
    requirements,
    selectedEventId,
    selectedEvent,
    currentUser,
    activeTenant,
  } = params;

  const allowedEventIds = new Set(tenantEvents.map((e) => String(e.id || "").trim()));
  const selectedIdTrimmed = String(selectedEventId || "ALL").trim();
  const results: EventParticipantProgress[] = [];

  const isAlreadyIncluded = (
    eventId: string,
    cadreId?: string | null,
    email?: string | null,
    name?: string | null
  ): boolean => {
    const normEventId = String(eventId || "").trim();
    const normCadreId = String(cadreId || "").trim().toLowerCase();
    const normEmail = String(email || "").trim().toLowerCase();
    const normName = String(name || "").trim().toLowerCase();

    return results.some((existing) => {
      if (String(existing.eventId || "").trim() !== normEventId) return false;
      const exCadreId = String(existing.matchedCadre?.id || "").trim().toLowerCase();
      const exEmail = String(existing.cadreEmail || "").trim().toLowerCase();
      const exName = String(existing.cadreName || "").trim().toLowerCase();

      if (normCadreId && exCadreId && normCadreId === exCadreId) return true;
      if (normEmail && exEmail && normEmail === exEmail) return true;
      if (normName && exName && normName === exName) return true;
      return false;
    });
  };

  const buildProgressItem = (opts: {
    id: string;
    registrationId: string | null;
    hasRegistration: boolean;
    source: "REGISTRATION" | "EVALUATION" | "CADRE_SUBMISSION";
    eventId: string;
    evt: EventActivity | null;
    cadreName: string;
    cadreEmail: string;
    phone: string;
    campus: string;
    dateApplied: string;
    regStatus: string;
    regIsGraduated?: boolean;
    regGraduationStatus?: string;
    regCommissariat?: string;
    regTenantId?: string | null;
    matchedCadre: CadreFollowUp | null;
    fallbackAvatar?: string | null;
    regObj?: ParticipantRegistration | null;
  }): EventParticipantProgress => {
    const effectiveLevel =
      (opts.evt?.level as "MAPABA" | "PKD" | "PKL" | string) ||
      opts.matchedCadre?.level ||
      "MAPABA";

    const reqsForEvent = filterRequirementsForContext(requirements, {
      selectedEvent: opts.evt,
      tugasLevelFilter: opts.evt ? "ALL" : String(effectiveLevel),
      currentUser,
      activeTenant,
      events: allEvents,
    });

    const allCadreSubs = opts.matchedCadre?.submissions || [];
    const reqIdSet = new Set(reqsForEvent.map((r) => r.id));
    const relevantSubs =
      reqsForEvent.length > 0
        ? allCadreSubs.filter((s) => reqIdSet.has(s.requirementId))
        : allCadreSubs;

    const progress = calculateRtlProgress(allCadreSubs, reqsForEvent);

    const isExplicitlyGraduated = Boolean(
      opts.regIsGraduated ||
        String(opts.regGraduationStatus || "").toUpperCase() === "PASSED" ||
        opts.matchedCadre?.status === "SELESAI"
    );

    let status: "SELESAI" | "REVISI" | "AKTIF" | "BELUM_MULAI" = "BELUM_MULAI";
    if (isExplicitlyGraduated || progress.allCompleted) {
      status = "SELESAI";
    } else if (progress.rejectedCount > 0) {
      status = "REVISI";
    } else if (relevantSubs.length > 0) {
      status = "AKTIF";
    }

    const photoUrl =
      getParticipantPhoto(opts.matchedCadre, opts.regObj || null, []) ||
      (opts.fallbackAvatar &&
      (opts.fallbackAvatar.startsWith("http") ||
        opts.fallbackAvatar.startsWith("data:") ||
        opts.fallbackAvatar.startsWith("/"))
        ? opts.fallbackAvatar
        : null);

    const resolvedComm =
      opts.evt?.commissariat ||
      opts.regCommissariat ||
      opts.matchedCadre?.commissariat ||
      currentUser?.commissariat;

    const resolvedTenantId =
      opts.evt?.tenant_id ||
      opts.evt?.komisariat_id ||
      opts.regTenantId ||
      opts.matchedCadre?.tenant_id ||
      opts.matchedCadre?.komisariat_id ||
      null;

    return {
      id: opts.id,
      registrationId: opts.registrationId,
      hasRegistration: opts.hasRegistration,
      source: opts.source,
      eventId: opts.eventId,
      eventName: opts.evt?.name || opts.evt?.title || "Kegiatan Kaderisasi",
      eventLevel: effectiveLevel,
      cadreName: opts.cadreName || "Peserta",
      cadreEmail: opts.cadreEmail || "",
      phone: opts.phone || "-",
      campus: opts.campus || "-",
      commissariat: resolvedComm,
      tenant_id: resolvedTenantId,
      dateApplied: opts.dateApplied || "",
      regStatus: opts.regStatus || "APPROVED",
      isGraduated: isExplicitlyGraduated,
      matchedCadre: opts.matchedCadre,
      submissions: relevantSubs,
      applicableRequirements: reqsForEvent,
      status,
      progressPercent: progress.progressPercent,
      approvedCount: progress.approvedCount,
      pendingCount: progress.pendingCount,
      rejectedCount: progress.rejectedCount,
      totalRequirements: progress.totalRequirements,
      photoUrl,
    };
  };

  // PASS 1: Pendaftaran aktif (`pendaftaran`)
  for (const reg of registrations || []) {
    const regSt = String(reg.status || "").toUpperCase();
    if (regSt === "REJECTED" || regSt === "DITOLAK") continue;

    const regEventId = String(reg.eventId || "").trim();
    const matchesScope =
      selectedIdTrimmed !== "ALL"
        ? regEventId === selectedIdTrimmed && allowedEventIds.has(regEventId)
        : allowedEventIds.has(regEventId) ||
          isRecordInTenant(
            currentUser,
            {
              commissariat: reg.commissariat,
              komisariat_id: reg.komisariat_id,
              tenant_id: reg.tenant_id || reg.komisariat_id,
            },
            activeTenant
          );
    if (!matchesScope) continue;

    const evt =
      tenantEvents.find((e) => String(e.id || "").trim() === regEventId) ||
      selectedEvent;
    const matchedCadre = matchCadreForRegistration(reg, tenantCadres, evt);
    const name = reg.cadreName || reg.name || matchedCadre?.name || "Peserta";
    const email = reg.cadreEmail || reg.email || matchedCadre?.email || "";

    if (isAlreadyIncluded(regEventId, matchedCadre?.id, email, name)) continue;

    results.push(
      buildProgressItem({
        id: reg.id,
        registrationId: reg.id,
        hasRegistration: true,
        source: "REGISTRATION",
        eventId: regEventId,
        evt,
        cadreName: name,
        cadreEmail: email,
        phone:
          reg.phone ||
          reg.answers?.phone ||
          reg.answers?.noHp ||
          matchedCadre?.phone ||
          "-",
        campus:
          reg.answers?.kampus ||
          reg.answers?.universitas ||
          matchedCadre?.perguruanTinggi ||
          "-",
        dateApplied: reg.dateApplied,
        regStatus: reg.status,
        regIsGraduated: reg.isGraduated,
        regGraduationStatus: reg.graduationStatus,
        regCommissariat: reg.commissariat,
        regTenantId: reg.tenant_id || reg.komisariat_id || null,
        matchedCadre,
        regObj: reg,
      })
    );
  }

  // PASS 2: Peserta dari tabel `evaluations` (memulihkan peserta tambah manual / penilaian tanpa baris pendaftaran)
  for (const ev of evaluations || []) {
    const actId = String(ev.activityId || "").trim();
    if (!actId) continue;

    const matchesScope =
      selectedIdTrimmed !== "ALL"
        ? actId === selectedIdTrimmed && allowedEventIds.has(actId)
        : allowedEventIds.has(actId) ||
          isRecordInTenant(
            currentUser,
            {
              commissariat: ev.commissariat,
              komisariat_id: ev.komisariat_id,
              tenant_id: ev.tenant_id || ev.komisariat_id,
            },
            activeTenant
          );
    if (!matchesScope) continue;

    const participantName = String(ev.participantName || "").trim();
    if (!participantName) continue;

    const evt =
      tenantEvents.find((e) => String(e.id || "").trim() === actId) ||
      selectedEvent;
    const matchedCadre =
      tenantCadres.find(
        (c) =>
          (ev.cadreId && c.id === ev.cadreId) ||
          c.name.trim().toLowerCase() === participantName.toLowerCase()
      ) || null;

    const email = matchedCadre?.email || "";
    if (isAlreadyIncluded(actId, matchedCadre?.id || ev.cadreId, email, participantName)) {
      continue;
    }

    results.push(
      buildProgressItem({
        id: `eval:${ev.id}`,
        registrationId: null,
        hasRegistration: false,
        source: "EVALUATION",
        eventId: actId,
        evt,
        cadreName: participantName,
        cadreEmail: email,
        phone: matchedCadre?.phone || "-",
        campus: ev.university || matchedCadre?.perguruanTinggi || "-",
        dateApplied: ev.updatedAt || "",
        regStatus: "APPROVED",
        regCommissariat: ev.commissariat,
        regTenantId: ev.tenant_id || ev.komisariat_id || null,
        matchedCadre,
        fallbackAvatar: ev.avatar || null,
      })
    );
  }

  // PASS 3: Kader di `anggota` yang sudah mengunggah laporan RTL relevan (menjaga sinkronisasi Tab 1 & Tab 2)
  for (const cadre of tenantCadres || []) {
    const subs = Array.isArray(cadre.submissions) ? cadre.submissions : [];
    if (subs.length === 0) continue;

    let targetEvt: EventActivity | null = null;
    for (const sub of subs) {
      const ctx = resolveSubmissionEventContext(
        cadre,
        sub,
        registrations,
        allEvents,
        requirements
      );
      if (selectedIdTrimmed !== "ALL") {
        if (ctx.event && String(ctx.event.id || "").trim() === selectedIdTrimmed) {
          targetEvt = selectedEvent || ctx.event;
          break;
        }
        if (
          !ctx.event &&
          selectedEvent &&
          String(ctx.requirement?.level || cadre.level || "").toUpperCase() ===
            String(selectedEvent.level || "").toUpperCase()
        ) {
          targetEvt = selectedEvent;
          break;
        }
      } else {
        if (ctx.event && allowedEventIds.has(String(ctx.event.id || "").trim())) {
          targetEvt = ctx.event;
          break;
        }
      }
    }

    if (!targetEvt && selectedIdTrimmed === "ALL") {
      const lvl = String(cadre.level || "").toUpperCase();
      targetEvt =
        tenantEvents.find((e) => String(e.level || "").toUpperCase() === lvl) ||
        tenantEvents[0] ||
        null;
    }

    if (!targetEvt) continue;
    const targetEventId = String(targetEvt.id || "").trim();
    if (isAlreadyIncluded(targetEventId, cadre.id, cadre.email, cadre.name)) {
      continue;
    }

    results.push(
      buildProgressItem({
        id: `cadre:${cadre.id}:${targetEventId}`,
        registrationId: null,
        hasRegistration: false,
        source: "CADRE_SUBMISSION",
        eventId: targetEventId,
        evt: targetEvt,
        cadreName: cadre.name,
        cadreEmail: cadre.email || "",
        phone: cadre.phone || "-",
        campus: cadre.perguruanTinggi || "-",
        dateApplied: cadre.startDate || "",
        regStatus: "APPROVED",
        regCommissariat: cadre.commissariat,
        regTenantId: cadre.tenant_id || cadre.komisariat_id || null,
        matchedCadre: cadre,
      })
    );
  }

  return results;
}
