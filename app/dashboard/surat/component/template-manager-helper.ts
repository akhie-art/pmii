import type { SuratTemplate, UserAccount } from "@/lib/db";
import {
  CABANG_TENANT_ID,
  LEGACY_CABANG_TENANT_ID,
  getTenantIdByName,
  isCabangOrAdmin,
  isCabangRecord,
} from "@/lib/tenancy";
import { isCoreStandardKey, humanizePlaceholderKey } from "./letter-generator-helpers";

export interface StandardTagGuideItem {
  tag: string;
  label: string;
  group: "core" | "custom";
}

export const STANDARD_PMII_TAGS: StandardTagGuideItem[] = [
  { tag: "nomor_surat", label: "Nomor Surat Resmi", group: "core" },
  { tag: "perihal", label: "Perihal / Hal", group: "core" },
  { tag: "tujuan_surat", label: "Tujuan / Penerima", group: "core" },
  { tag: "kota_surat", label: "Kota Terbit", group: "core" },
  { tag: "tanggal_surat", label: "Tanggal Surat", group: "core" },
  { tag: "lampiran", label: "Lampiran", group: "custom" },
  { tag: "hari", label: "Hari Acara", group: "custom" },
  { tag: "waktu", label: "Waktu / Pukul", group: "custom" },
  { tag: "tempat", label: "Tempat Kegiatan", group: "custom" },
  { tag: "agenda", label: "Agenda / Kegiatan", group: "custom" },
  { tag: "tema", label: "Tema Kegiatan", group: "custom" },
  { tag: "ketua", label: "Nama Ketua", group: "custom" },
  { tag: "sekretaris", label: "Nama Sekretaris", group: "custom" },
];

/**
 * Menghasilkan contoh data simulasi yang realistis untuk pratinjau template Word PMII.
 */
export function getRealisticSampleValue(key: string): string {
  const lk = key.toLowerCase().trim();
  if (lk === "nomor" || lk === "no" || lk === "nomor_surat" || lk === "no_surat") {
    return "001.PK-XI.Z-03.01.010.B-II.11.2026";
  }
  if (lk === "perihal" || lk === "hal" || lk === "perihal_surat") {
    return "Undangan Rapat Kerja Komisariat";
  }
  if (
    lk === "penerima" ||
    lk === "nama_penerima" ||
    lk === "kepada" ||
    lk === "tujuan" ||
    lk === "tujuan_surat"
  ) {
    return "Ketua Pengurus Rayon Tarbiyah";
  }
  if (lk === "kota" || lk === "lokasi" || lk === "kota_surat") {
    return "Purwodadi";
  }
  if (lk === "lokasi_tujuan") {
    return "Tempat";
  }
  if (lk === "tanggal" || lk === "tanggal_surat" || lk === "hari_tanggal") {
    return "26 November 2026";
  }
  if (lk === "hari") {
    return "Kamis";
  }
  if (lk === "waktu" || lk === "pukul") {
    return "09.00 WIB s.d. Selesai";
  }
  if (lk === "tempat") {
    return "Gedung PCNU Lt. 2 Purwodadi";
  }
  if (lk === "lampiran" || lk === "lamp") {
    return "1 (Satu) Berkas";
  }
  if (lk === "agenda" || lk === "kegiatan" || lk === "acara") {
    return "Rapat Kerja & Evaluasi Program Kerja";
  }
  if (lk === "tema") {
    return "Meneguhkan Kaderisasi Progresif di Era Digital";
  }
  if (lk === "narasumber" || lk === "pemateri") {
    return "Sahabat Ahmad Fauzi, M.Pd.";
  }
  if (lk === "ketua" || lk === "nama_ketua") {
    return "Ahmad Fauzi";
  }
  if (lk === "sekretaris" || lk === "nama_sekretaris") {
    return "Siti Nurhaliza";
  }
  if (lk === "jabatan") {
    return "Ketua Pengurus Rayon";
  }
  if (lk === "instansi" || lk === "lembaga") {
    return "PR PMII Rayon Tarbiyah";
  }
  if (lk === "isi") {
    return "Sehubungan dengan agenda kegiatan organisasi, kami mengundang Sahabat/i untuk hadir tepat waktu.";
  }
  return `Contoh ${humanizePlaceholderKey(key)}`;
}

export function buildSampleValuesForPlaceholders(keys: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const k of keys) {
    if (k) result[k] = getRealisticSampleValue(k);
  }
  return result;
}

/**
 * Mengelompokkan daftar placeholder DOCX menjadi tag otomatis sistem vs isian kustom.
 */
export function classifyTemplatePlaceholders(keys: string[]): {
  coreKeys: string[];
  customKeys: string[];
} {
  const coreKeys: string[] = [];
  const customKeys: string[] = [];
  const seen = new Set<string>();

  for (const raw of keys) {
    const key = String(raw || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (isCoreStandardKey(key)) {
      coreKeys.push(key);
    } else {
      customKeys.push(key);
    }
  }

  return { coreKeys, customKeys };
}

/**
 * Mengubah nama file `.docx` menjadi judul template yang rapi.
 */
export function deriveTemplateNameFromFilename(fileName: string): string {
  const cleaned = String(fileName || "")
    .replace(/\.docx$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export interface TemplateTenantScope {
  isCabang: boolean;
  tenantId: string | null;
  displayLabel: string;
  commissariatForWrite: string;
  tenantOverrideForWrite: string;
}

/**
 * Menentukan lingkup tenant yang akurat untuk upload storage & simpan template.
 * Pada mode edit, mempertahankan tenant asli template agar Admin Cabang di filter "ALL"
 * tidak menimpa template Komisariat menjadi milik Cabang.
 */
export function resolveTemplateTenantScope(
  editingTemplate: SuratTemplate | null | undefined,
  currentUser: UserAccount | null | undefined,
  activeTenant: string = "ALL"
): TemplateTenantScope {
  const adminCabang = isCabangOrAdmin(currentUser);

  if (editingTemplate) {
    const rawId = editingTemplate.tenant_id || editingTemplate.komisariat_id || null;
    const isCabang =
      isCabangRecord(editingTemplate) ||
      rawId === CABANG_TENANT_ID ||
      rawId === LEGACY_CABANG_TENANT_ID;

    const tenantId = isCabang
      ? CABANG_TENANT_ID
      : rawId ||
        getTenantIdByName(editingTemplate.commissariat) ||
        currentUser?.tenant_id ||
        currentUser?.komisariat_id ||
        null;

    const commName = isCabang
      ? "Pengurus Cabang Grobogan"
      : editingTemplate.commissariat || currentUser?.commissariat || "Tingkat Komisariat";

    return {
      isCabang,
      tenantId,
      displayLabel: isCabang ? "Tingkat Cabang (PC PMII)" : commName,
      commissariatForWrite: commName,
      tenantOverrideForWrite: adminCabang ? (isCabang ? "Pengurus Cabang Grobogan" : commName) : activeTenant,
    };
  }

  const isCabangScope =
    adminCabang &&
    (!activeTenant ||
      activeTenant === "ALL" ||
      activeTenant === "Semua Komisariat" ||
      activeTenant.toLowerCase().includes("cabang"));

  const tenantId = isCabangScope
    ? CABANG_TENANT_ID
    : (activeTenant && activeTenant !== "ALL" && activeTenant !== "Semua Komisariat"
        ? getTenantIdByName(activeTenant)
        : null) ||
      currentUser?.tenant_id ||
      currentUser?.komisariat_id ||
      null;

  const commName = isCabangScope
    ? "Pengurus Cabang Grobogan"
    : activeTenant && activeTenant !== "ALL" && activeTenant !== "Semua Komisariat"
    ? activeTenant
    : currentUser?.commissariat || "Tingkat Komisariat";

  return {
    isCabang: isCabangScope,
    tenantId,
    displayLabel: isCabangScope ? "Tingkat Cabang (PC PMII)" : commName,
    commissariatForWrite: commName,
    tenantOverrideForWrite: activeTenant,
  };
}
