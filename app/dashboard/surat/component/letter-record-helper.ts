import type { UserAccount } from "@/lib/db";
import { generateUUID } from "@/lib/db";
import {
  CABANG_TENANT_ID,
  LEGACY_CABANG_TENANT_ID,
  enforceTenantWrite,
  getTenantIdByName,
  isCabangOrAdmin,
  isCabangRecord,
} from "@/lib/tenancy";
import type { MailItem } from "./types";
import { getMaxSequenceFromNomor } from "./letter-generator-helpers";

export const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

/**
 * Mengembalikan tanggal hari ini dalam format lokal `YYYY-MM-DD` tanpa pergeseran zona waktu UTC.
 */
export function getTodayLocalIsoDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Memformat tanggal ISO `YYYY-MM-DD` menjadi format Indonesia (mis. `26 November 2026`).
 */
export function formatDateToIndo(isoDate: string): string {
  const match = String(isoDate || "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return isoDate || "-";
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (monthIdx < 0 || monthIdx > 11 || !Number.isFinite(day) || day < 1 || day > 31) {
    return isoDate;
  }
  return `${day} ${INDONESIAN_MONTHS[monthIdx]} ${year}`;
}

/**
 * Mengonversi nilai `date` atau `dateIndo` dari arsip surat menjadi format input `<input type="date">` (`YYYY-MM-DD`).
 */
export function parseMailDateToIso(
  dateVal?: string | null,
  dateIndoVal?: string | null,
  fallbackNow: Date = new Date()
): string {
  const rawDate = String(dateVal || "").trim();
  const isoMatch = rawDate.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  const rawIndo = String(dateIndoVal || "").trim();
  const indoMatch = rawIndo.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (indoMatch) {
    const day = String(Number(indoMatch[1])).padStart(2, "0");
    const monthName = indoMatch[2].toLowerCase();
    const monthIdx = INDONESIAN_MONTHS.findIndex((m) => m.toLowerCase() === monthName);
    if (monthIdx >= 0) {
      return `${indoMatch[3]}-${String(monthIdx + 1).padStart(2, "0")}-${day}`;
    }
  }

  return getTodayLocalIsoDate(fallbackNow);
}

/**
 * Mendeteksi apakah konten surat berupa dokumen HTML terstruktur (hasil generator / DOCX / footer QR)
 * agar tidak dibocorkan sebagai teks mentah di `<textarea>` yang dapat merusak layout & QR Code.
 */
export function isFormattedHtmlContent(content?: string | null): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  if (!trimmed) return false;
  if (trimmed.includes("data-letter-qr-footer")) return true;
  return /<(?:!doctype|html|head|body|style|div|table|thead|tbody|tr|td|th|p|section|article|header|footer|img|br|hr|span|strong|em|b|i|u|ul|ol|li|h[1-6])(?:\s|\/|>)/i.test(
    trimmed
  );
}

/**
 * Menjamin status tindak lanjut selalu valid untuk jenis surat (`MASUK` vs `KELUAR`).
 * - `Diproses` dan `Selesai` dipertahankan lintas jenis.
 * - `Menunggu Tindak Lanjut` otomatis dipetakan ke `Terkirim` saat pindah ke `KELUAR`, dan sebaliknya.
 */
export function normalizeMailStatusForType(
  status: MailItem["status"] | string | undefined | null,
  mailType: "MASUK" | "KELUAR"
): MailItem["status"] {
  if (status === "Diproses" || status === "Selesai") {
    return status;
  }
  if (mailType === "MASUK") {
    return "Menunggu Tindak Lanjut";
  }
  return "Terkirim";
}

export interface TargetRecordTenantInfo {
  tenantId: string | null;
  isCabang: boolean;
  orgLevelCode: "PC" | "PK";
  defaultSenderTitle: "PC PMII" | "PK PMII";
  tenantOverrideForWrite: string;
}

/**
 * Menentukan lingkup tenant tujuan untuk operasi upload lampiran, penomoran otomatis,
 * dan penyimpanan arsip. Pada mode edit, memprioritaskan tenant asli milik surat
 * (`editingMail`) agar Admin Cabang di filter "ALL" tidak salah menaruh file ke folder Cabang.
 */
export function resolveTargetRecordTenant(
  editingMail: MailItem | null | undefined,
  currentUser: UserAccount | null | undefined,
  activeTenant: string = "ALL"
): TargetRecordTenantInfo {
  const adminCabang = isCabangOrAdmin(currentUser);

  if (editingMail) {
    const rawTenantId = editingMail.tenant_id || editingMail.komisariat_id || null;
    const cabangRecord =
      isCabangRecord(editingMail) ||
      rawTenantId === CABANG_TENANT_ID ||
      rawTenantId === LEGACY_CABANG_TENANT_ID;

    const resolvedTenantId = cabangRecord
      ? CABANG_TENANT_ID
      : rawTenantId ||
        getTenantIdByName(editingMail.commissariat) ||
        currentUser?.tenant_id ||
        currentUser?.komisariat_id ||
        null;

    const isCabang =
      cabangRecord ||
      resolvedTenantId === CABANG_TENANT_ID ||
      resolvedTenantId === LEGACY_CABANG_TENANT_ID;

    // Untuk Admin Cabang yang mengedit arsip komisariat, kirim "ALL" (atau nama komisariat asli)
    // agar enforceTenantWrite tidak menimpa commissariat/tenant_id dengan filter dropdown aktif.
    const tenantOverrideForWrite = adminCabang
      ? isCabang
        ? "Pengurus Cabang Grobogan"
        : editingMail.commissariat || "ALL"
      : activeTenant;

    return {
      tenantId: resolvedTenantId,
      isCabang,
      orgLevelCode: isCabang ? "PC" : "PK",
      defaultSenderTitle: isCabang ? "PC PMII" : "PK PMII",
      tenantOverrideForWrite,
    };
  }

  const isCabangScope =
    adminCabang &&
    (!activeTenant ||
      activeTenant === "ALL" ||
      activeTenant === "Semua Komisariat" ||
      activeTenant.toLowerCase().includes("cabang"));

  let tenantId: string | null = null;
  if (isCabangScope) {
    tenantId = CABANG_TENANT_ID;
  } else if (activeTenant && activeTenant !== "ALL" && activeTenant !== "Semua Komisariat") {
    tenantId =
      getTenantIdByName(activeTenant) ||
      currentUser?.tenant_id ||
      currentUser?.komisariat_id ||
      null;
  } else {
    tenantId = currentUser?.tenant_id || currentUser?.komisariat_id || null;
  }

  return {
    tenantId,
    isCabang: isCabangScope,
    orgLevelCode: isCabangScope ? "PC" : "PK",
    defaultSenderTitle: isCabangScope ? "PC PMII" : "PK PMII",
    tenantOverrideForWrite: activeTenant,
  };
}

/**
 * Menyaring daftar surat agar hanya mencakup tenant yang sama dengan surat yang sedang
 * dibuat/diedit — mencegah pencampuran nomor urut & duplikat palsu antar-komisariat di mode "ALL".
 */
export function filterMailsForSameTenant(
  mails: MailItem[],
  targetTenantId: string | null,
  isCabang: boolean
): MailItem[] {
  if (!Array.isArray(mails) || mails.length === 0) return [];
  return mails.filter((item) => {
    const itemIsCabang = isCabangRecord(item);
    if (isCabang) return itemIsCabang;
    if (itemIsCabang) return false;
    if (!targetTenantId) return true;
    const itemTenantId =
      item.tenant_id || item.komisariat_id || getTenantIdByName(item.commissariat);
    if (!itemTenantId) return true;
    return itemTenantId === targetTenantId;
  });
}

/**
 * Menghasilkan nomor surat keluar otomatis berikutnya berdasarkan arsip pada tenant yang sama.
 * Menyesuaikan pola segmen periode/kode cabang dari surat terakhir tenant jika tersedia.
 */
export function generateNextOutgoingNumber(
  sameTenantOutgoing: MailItem[],
  orgLevelCode: "PC" | "PK",
  isoDate: string
): string {
  let maxSeq = 0;
  let learnedMiddlePattern: string | null = null;

  for (const m of sameTenantOutgoing) {
    const trimmed = String(m.nomor || "").trim();
    const num = getMaxSequenceFromNomor(trimmed);
    if (num > maxSeq) {
      maxSeq = num;
    }
    if (!learnedMiddlePattern) {
      const patternMatch = trimmed.match(/^\d{1,4}(?:\s*[-–]\s*\d{1,4})?\.(.+?)\.\d{1,2}\.\d{4}$/);
      if (patternMatch && patternMatch[1]) {
        learnedMiddlePattern = patternMatch[1];
      }
    }
  }

  const next = String(maxSeq + 1).padStart(3, "0");
  const dateMatch = String(isoDate || "").match(/^(\d{4})-(\d{2})-\d{2}/);
  const now = new Date();
  const year = dateMatch ? dateMatch[1] : String(now.getFullYear());
  const month = dateMatch ? dateMatch[2] : String(now.getMonth() + 1).padStart(2, "0");

  const middle = learnedMiddlePattern || `${orgLevelCode}-XI.Z-03.01.010.B-II`;
  return `${next}.${middle}.${month}.${year}`;
}

export interface BuildRecordedMailInput {
  editingMail: MailItem | null | undefined;
  currentUser: UserAccount | null | undefined;
  activeTenant: string;
  mailType: "MASUK" | "KELUAR";
  nomor: string;
  senderOrRecipient: string;
  subject: string;
  date: string;
  classification: MailItem["classification"];
  status: MailItem["status"];
  content: string;
  preserveOriginalHtmlContent: boolean;
  senderTitle: string;
  senderLocation: string;
  defaultLocation: string;
  attachmentUrl: string;
  attachmentName: string;
  attachmentSize: string;
}

/**
 * Menyusun payload `MailItem` final sebelum disimpan ke Supabase:
 * - Mengirim `null` eksplisit saat lampiran dihapus agar kolom DB benar-benar dikosongkan.
 * - Menjaga konten HTML/QR asli bila `preserveOriginalHtmlContent` aktif.
 * - Menormalisasi status tindak lanjut sesuai jenis surat.
 * - Mempertahankan identitas tenant asli pada mode edit.
 */
export function buildRecordedMailPayload(input: BuildRecordedMailInput): MailItem {
  const {
    editingMail,
    currentUser,
    activeTenant,
    mailType,
    nomor,
    senderOrRecipient,
    subject,
    date,
    classification,
    status,
    content,
    preserveOriginalHtmlContent,
    senderTitle,
    senderLocation,
    defaultLocation,
    attachmentUrl,
    attachmentName,
    attachmentSize,
  } = input;

  const tenantInfo = resolveTargetRecordTenant(editingMail, currentUser, activeTenant);
  const cleanDate = parseMailDateToIso(date, editingMail?.dateIndo);
  const originalIso = editingMail ? parseMailDateToIso(editingMail.date, editingMail.dateIndo) : "";
  const resolvedDateIndo =
    editingMail && cleanDate === originalIso && editingMail.dateIndo?.trim()
      ? editingMail.dateIndo.trim()
      : formatDateToIndo(cleanDate);

  const resolvedStatus = normalizeMailStatusForType(
    editingMail ? status : mailType === "MASUK" ? "Menunggu Tindak Lanjut" : "Terkirim",
    mailType
  );

  const resolvedContent =
    preserveOriginalHtmlContent && editingMail?.content
      ? editingMail.content
      : content.trim() || "Isi surat terlampir.";

  const trimmedUrl = attachmentUrl.trim();
  const trimmedName = attachmentName.trim();
  const trimmedSize = attachmentSize.trim();

  return enforceTenantWrite<MailItem>(
    currentUser,
    {
      ...(editingMail || {}),
      id: editingMail?.id || generateUUID(),
      nomor: nomor.trim(),
      type: mailType,
      senderOrRecipient: senderOrRecipient.trim(),
      subject: subject.trim(),
      date: cleanDate,
      classification,
      status: resolvedStatus,
      content: resolvedContent,
      senderTitle:
        senderTitle.trim() || (mailType === "MASUK" ? "Pengirim" : tenantInfo.defaultSenderTitle),
      senderLocation: senderLocation.trim() || defaultLocation,
      dateIndo: resolvedDateIndo,
      fileUrl: trimmedUrl ? trimmedUrl : null,
      fileName: trimmedUrl && trimmedName ? trimmedName : null,
      fileSize: trimmedUrl && trimmedSize ? trimmedSize : null,
    },
    tenantInfo.tenantOverrideForWrite
  );
}
