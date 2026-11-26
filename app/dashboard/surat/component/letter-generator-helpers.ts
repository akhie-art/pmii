"use client";

import { escapeHtml } from "@/lib/sanitize";
import {
  buildPrintFontContext,
  buildDocxPrintStyleBlock,
  buildPrintAutoTriggerScript,
} from "./docx-preview-helper";

export interface LetterCoreFields {
  nomor: string;
  recipient: string;
  subject: string;
  location: string;
  date: string;
}

export interface ExcelColumnDef {
  key: string;
  originalHeader: string;
  sampleValue: string;
}

export interface ExcelRowEntry {
  recipient: string;
  data: Record<string, string>;
}

export type PmiiNomorBoxes = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

/**
 * Memecah nomor surat standar PMII 9 segmen (`001.PK-XI.Z-03.01.010.B-II.11.2026`)
 * menjadi tuple 9 kotak. Mengembalikan `null` jika format nomor kustom / non-standar.
 */
export function parsePmiiNomorToBoxes(nomor: string | null | undefined): PmiiNomorBoxes | null {
  const clean = String(nomor || "").trim();
  if (!clean) return null;
  const match = clean.match(
    /^([^.\s/]+)\.([^.\s/-]+)-([^.\s/]+)\.([^.\s/]+)\.([^.\s/]+)\.([^.\s/]+)\.([^.\s/]+)\.([^.\s/]+)\.([^.\s/]+)$/
  );
  if (!match) return null;
  return [
    match[1],
    match[2],
    match[3],
    match[4],
    match[5],
    match[6],
    match[7],
    match[8],
    match[9],
  ];
}

export interface BulkLetterMetadata {
  recipients: string[];
  isSequentialNumbering: boolean;
  startNomor?: string;
  excelColumns?: ExcelColumnDef[];
  excelRowsData?: ExcelRowEntry[];
}

export interface LetterEditMetadata {
  v: 1;
  templateId: string;
  docxValues: Record<string, string>;
  mode?: "single" | "bulk";
  bulk?: BulkLetterMetadata;
}

export interface ParsedBulkRangeNomor {
  startSeq: number;
  endSeq: number;
  padLength: number;
  suffix: string;
  startNomor: string;
  endNomor: string;
}

/**
 * Mem-parse format nomor surat massal berurutan (mis. `001-005.PK-XI.Z-03.01.010.B-II.11.2026`
 * atau `001.PK-... s.d. 005.PK-...`) menjadi rentang nomor awal hingga akhir.
 */
export function parseBulkRangeNomor(
  nomor: string | null | undefined
): ParsedBulkRangeNomor | null {
  const clean = String(nomor || "").trim();
  if (!clean) return null;

  const compactMatch = clean.match(/^(\d{1,4})\s*[-–]\s*(\d{1,4})(\..+)$/);
  if (compactMatch) {
    const startRaw = compactMatch[1];
    const endRaw = compactMatch[2];
    const suffix = compactMatch[3];
    const startSeq = parseInt(startRaw, 10);
    const endSeq = parseInt(endRaw, 10);
    if (
      Number.isFinite(startSeq) &&
      Number.isFinite(endSeq) &&
      endSeq >= startSeq &&
      endSeq < 10000
    ) {
      const padLength = Math.max(startRaw.length, 3);
      return {
        startSeq,
        endSeq,
        padLength,
        suffix,
        startNomor: `${startRaw}${suffix}`,
        endNomor: `${endRaw}${suffix}`,
      };
    }
  }

  const sdMatch = clean.match(/^(\d{1,4})(\..+?)\s+s\.d\.?\s+(\d{1,4})(\..+)$/i);
  if (sdMatch) {
    const startRaw = sdMatch[1];
    const suffix = sdMatch[2];
    const endRaw = sdMatch[3];
    const startSeq = parseInt(startRaw, 10);
    const endSeq = parseInt(endRaw, 10);
    if (
      Number.isFinite(startSeq) &&
      Number.isFinite(endSeq) &&
      endSeq >= startSeq &&
      endSeq < 10000
    ) {
      return {
        startSeq,
        endSeq,
        padLength: Math.max(startRaw.length, 3),
        suffix,
        startNomor: `${startRaw}${suffix}`,
        endNomor: `${endRaw}${sdMatch[4]}`,
      };
    }
  }

  return null;
}

/**
 * Mengambil nomor urut tertinggi dari sebuah nomor surat (mendukung nomor tunggal maupun rentang massal).
 */
export function getMaxSequenceFromNomor(nomor: string | null | undefined): number {
  const clean = String(nomor || "").trim();
  if (!clean) return 0;

  const range = parseBulkRangeNomor(clean);
  if (range) {
    return range.endSeq;
  }

  const singleMatch = clean.match(/^(\d{1,4})/);
  if (singleMatch) {
    const num = parseInt(singleMatch[1], 10);
    if (Number.isFinite(num) && num > 0 && num < 10000) {
      return num;
    }
  }
  return 0;
}

/**
 * Menguraikan satu nomor surat (tunggal atau rentang massal `001-005.PK-...`) menjadi daftar
 * nomor yang ditempati untuk deteksi konflik/duplikat nomor yang akurat.
 */
export function expandNomorOccurrences(nomor: string | null | undefined): {
  normalizedNomors: string[];
  seqNumbers: number[];
} {
  const clean = String(nomor || "").trim();
  if (!clean) return { normalizedNomors: [], seqNumbers: [] };

  const range = parseBulkRangeNomor(clean);
  if (range) {
    const count = Math.min(range.endSeq - range.startSeq + 1, 500);
    const normalizedNomors: string[] = [];
    const seqNumbers: number[] = [];
    for (let i = 0; i < count; i++) {
      const seq = range.startSeq + i;
      const padded = String(seq).padStart(range.padLength, "0");
      normalizedNomors.push(`${padded}${range.suffix}`.toLowerCase());
      seqNumbers.push(seq);
    }
    return { normalizedNomors, seqNumbers };
  }

  const seqMatch = clean.match(/^(\d{1,4})/);
  const seq = seqMatch ? parseInt(seqMatch[1], 10) : NaN;
  return {
    normalizedNomors: [clean.toLowerCase()],
    seqNumbers: Number.isFinite(seq) && seq < 10000 ? [seq] : [],
  };
}

/**
 * Membentuk ringkasan nomor surat untuk arsip 1-data surat massal.
 * Contoh: `001-005.PK-XI.Z-03.01.010.B-II.11.2026` bila berurutan, atau 1 nomor bila nomor sama.
 */
export function formatBulkNomorSummary(
  firstNomor: string,
  lastNomor: string,
  count: number,
  isSequential: boolean
): string {
  const first = String(firstNomor || "").trim();
  const last = String(lastNomor || "").trim();
  if (count <= 1 || !isSequential || !last || first === last) {
    return first;
  }

  const firstParts = first.match(/^(\d{1,4})(\..+)$/);
  const lastParts = last.match(/^(\d{1,4})(\..+)$/);
  if (firstParts && lastParts && firstParts[2] === lastParts[2]) {
    return `${firstParts[1]}-${lastParts[1]}${firstParts[2]}`;
  }

  return `${first} s.d. ${last}`;
}

/**
 * Membentuk ringkasan tujuan/penerima untuk arsip 1-data surat massal.
 */
export function formatBulkRecipientSummary(recipients: string[]): string {
  const clean = recipients.map((r) => String(r || "").trim()).filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]}, ${clean[1]}`;
  return `${clean[0]} (+${clean.length - 1} penerima lainnya)`;
}

/**
 * Menghitung nomor surat untuk indeks penerima tertentu dari metadata surat massal.
 */
export function computeBulkRecipientNomor(
  startNomor: string,
  index: number,
  isSequential: boolean
): string {
  const cleanStart = String(startNomor || "").trim();
  if (!isSequential || index <= 0) return cleanStart;

  const parts = cleanStart.match(/^(\d{1,4})(\..+)$/);
  if (!parts) return cleanStart;

  const baseNum = parseInt(parts[1], 10);
  if (!Number.isFinite(baseNum)) return cleanStart;
  const padLength = Math.max(parts[1].length, 3);
  return `${String(baseNum + index).padStart(padLength, "0")}${parts[2]}`;
}

/**
 * Menggabungkan potongan HTML tiap halaman surat massal sekaligus menduplikasi-hapus
 * blok `<style>` identik antar halaman agar ukuran arsip 1-data tetap ringan dan bersih.
 */
export function deduplicateBulkPagesHtml(pagesHtml: string[]): string {
  const seenStyles = new Set<string>();
  return pagesHtml
    .map((pageHtml) => {
      const cleanedPage = pageHtml.replace(
        /<style\b[^>]*>([\s\S]*?)<\/style>/gi,
        (fullMatch, cssBody: string) => {
          const normalizedCss = cssBody.trim();
          if (!normalizedCss) return "";
          if (seenStyles.has(normalizedCss)) {
            return "";
          }
          seenStyles.add(normalizedCss);
          return fullMatch;
        }
      );
      return `<div class="bulk-letter-page">${cleanedPage}</div>`;
    })
    .join("");
}

function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decodeBase64Utf8(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

const LETTER_META_TAG_REGEX =
  /<span\b[^>]*data-letter-meta=["']([^"']+)["'][^>]*>\s*<\/span>/gi;

/**
 * Menghapus penanda metadata tersembunyi `data-letter-meta` dari HTML surat.
 */
export function stripLetterEditMetadata(html: string | null | undefined): string {
  if (!html || typeof html !== "string") return "";
  return html.replace(LETTER_META_TAG_REGEX, "").trim();
}

/**
 * Menyematkan metadata template, variabel, dan daftar penerima massal secara tersembunyi di HTML surat
 * agar saat Surat Keluar (tunggal maupun massal) direvisi, seluruh state otomatis terpulihkan.
 */
export function embedLetterEditMetadata(html: string, meta: LetterEditMetadata): string {
  const cleaned = stripLetterEditMetadata(html);
  const hasBulk = meta.mode === "bulk" && Boolean(meta.bulk?.recipients?.length);
  if (!meta.templateId && !hasBulk) return cleaned;

  const safeValues: Record<string, string> = {};
  for (const [k, v] of Object.entries(meta.docxValues || {})) {
    if (typeof k === "string" && k.trim() && typeof v === "string") {
      safeValues[k] = v;
    }
  }

  const payload: LetterEditMetadata = {
    v: 1,
    templateId: (meta.templateId || "").trim(),
    docxValues: safeValues,
  };

  if (hasBulk && meta.bulk) {
    payload.mode = "bulk";
    const safeRecipients = meta.bulk.recipients
      .map((r) => String(r || "").trim())
      .filter(Boolean);
    const safeCols: ExcelColumnDef[] | undefined = Array.isArray(meta.bulk.excelColumns) &&
      meta.bulk.excelColumns.length > 0
        ? meta.bulk.excelColumns
            .filter((c) => c && typeof c.key === "string" && c.key.trim())
            .map((c) => ({
              key: c.key.trim(),
              originalHeader: String(c.originalHeader || c.key).trim(),
              sampleValue: String(c.sampleValue || ""),
            }))
        : undefined;
    const safeRows: ExcelRowEntry[] | undefined = Array.isArray(meta.bulk.excelRowsData) &&
      meta.bulk.excelRowsData.length > 0
        ? meta.bulk.excelRowsData.map((row) => {
            const cleanData: Record<string, string> = {};
            if (row?.data && typeof row.data === "object") {
              for (const [k, v] of Object.entries(row.data)) {
                if (typeof k === "string" && k.trim() && typeof v === "string") {
                  cleanData[k] = v;
                }
              }
            }
            return {
              recipient: String(row?.recipient || "").trim(),
              data: cleanData,
            };
          })
        : undefined;

    payload.bulk = {
      recipients: safeRecipients,
      isSequentialNumbering: Boolean(meta.bulk.isSequentialNumbering),
      ...(meta.bulk.startNomor ? { startNomor: String(meta.bulk.startNomor).trim() } : {}),
      ...(safeCols ? { excelColumns: safeCols } : {}),
      ...(safeRows ? { excelRowsData: safeRows } : {}),
    };
  }

  const encoded = encodeBase64Utf8(JSON.stringify(payload));
  const tag = `<span class="pmii-letter-meta" data-letter-meta="${escapeHtml(encoded)}" style="display:none"></span>`;
  return `${cleaned}\n${tag}`;
}

/**
 * Membaca kembali metadata template, variabel, dan daftar penerima massal dari HTML surat tersimpan.
 */
export function extractLetterEditMetadata(
  html: string | null | undefined
): LetterEditMetadata | null {
  if (!html || typeof html !== "string") return null;
  const match = html.match(/data-letter-meta=["']([^"']+)["']/i);
  if (!match?.[1]) return null;
  try {
    const raw = decodeBase64Utf8(match[1]);
    const parsed = JSON.parse(raw) as Partial<LetterEditMetadata>;
    const hasBulk =
      parsed?.mode === "bulk" &&
      Array.isArray(parsed?.bulk?.recipients) &&
      parsed.bulk.recipients.length > 0;
    const hasTemplateId = typeof parsed?.templateId === "string" && parsed.templateId.trim().length > 0;

    if (parsed?.v !== 1 || (!hasTemplateId && !hasBulk)) {
      return null;
    }

    const docxValues: Record<string, string> = {};
    if (parsed.docxValues && typeof parsed.docxValues === "object") {
      for (const [k, v] of Object.entries(parsed.docxValues)) {
        if (typeof k === "string" && typeof v === "string") {
          docxValues[k] = v;
        }
      }
    }

    const result: LetterEditMetadata = {
      v: 1,
      templateId: typeof parsed.templateId === "string" ? parsed.templateId.trim() : "",
      docxValues,
    };

    if (hasBulk && parsed.bulk) {
      result.mode = "bulk";
      const recipients = parsed.bulk.recipients
        .map((r) => String(r || "").trim())
        .filter(Boolean);
      const excelColumns = Array.isArray(parsed.bulk.excelColumns)
        ? parsed.bulk.excelColumns
            .filter((c) => c && typeof c.key === "string" && c.key.trim())
            .map((c) => ({
              key: c.key.trim(),
              originalHeader: String(c.originalHeader || c.key).trim(),
              sampleValue: String(c.sampleValue || ""),
            }))
        : undefined;
      const excelRowsData = Array.isArray(parsed.bulk.excelRowsData)
        ? parsed.bulk.excelRowsData.map((row) => {
            const cleanData: Record<string, string> = {};
            if (row?.data && typeof row.data === "object") {
              for (const [k, v] of Object.entries(row.data)) {
                if (typeof k === "string" && typeof v === "string") {
                  cleanData[k] = v;
                }
              }
            }
            return {
              recipient: String(row?.recipient || "").trim(),
              data: cleanData,
            };
          })
        : undefined;

      result.bulk = {
        recipients,
        isSequentialNumbering: Boolean(parsed.bulk.isSequentialNumbering),
        ...(typeof parsed.bulk.startNomor === "string" && parsed.bulk.startNomor.trim()
          ? { startNomor: parsed.bulk.startNomor.trim() }
          : {}),
        ...(excelColumns && excelColumns.length > 0 ? { excelColumns } : {}),
        ...(excelRowsData && excelRowsData.length > 0 ? { excelRowsData } : {}),
      };
    }

    return result;
  } catch {
    return null;
  }
}

export function isCoreStandardKey(key: string): boolean {
  const lk = key.toLowerCase().trim();
  return (
    lk === "nomor" ||
    lk === "no" ||
    lk === "nomor_surat" ||
    lk === "no_surat" ||
    lk === "perihal" ||
    lk === "hal" ||
    lk === "perihal_surat" ||
    lk === "penerima" ||
    lk === "nama_penerima" ||
    lk === "kepada" ||
    lk === "tujuan" ||
    lk === "tujuan_surat" ||
    lk === "lokasi" ||
    lk === "kota" ||
    lk === "kota_surat" ||
    lk === "tanggal" ||
    lk === "hari_tanggal" ||
    lk === "tanggal_surat"
  );
}

export function resolveCoreFieldValue(
  key: string,
  core: LetterCoreFields
): string | undefined {
  const lk = key.toLowerCase().trim();
  if (lk === "nomor" || lk === "no" || lk === "nomor_surat" || lk === "no_surat") {
    return core.nomor;
  }
  if (lk === "perihal" || lk === "hal" || lk === "perihal_surat") {
    return core.subject;
  }
  if (
    lk === "penerima" ||
    lk === "nama_penerima" ||
    lk === "kepada" ||
    lk === "tujuan" ||
    lk === "tujuan_surat"
  ) {
    return core.recipient;
  }
  if (lk === "lokasi" || lk === "kota" || lk === "kota_surat") {
    return core.location;
  }
  if (lk === "tanggal" || lk === "hari_tanggal" || lk === "tanggal_surat") {
    return core.date;
  }
  return undefined;
}

/**
 * Membangun kamus data mail-merge yang konsisten untuk 1 surat (mode single maupun bulk).
 * Urutan prioritas (rendah -> tinggi):
 * 1. `manualValues` global (nilai variabel bersama lintas penerima)
 * 2. Data baris Excel spesifik penerima (`excelRowsData[index]` atau pencocokan nama)
 * 3. Field inti surat untuk indeks tersebut (`nomor`/`nomor_surat`, `penerima`/`tujuan_surat`, dll.)
 */
export function buildLetterMergeData(params: {
  mode: "single" | "bulk";
  index: number;
  core: LetterCoreFields;
  manualValues: Record<string, string>;
  excelColumns?: ExcelColumnDef[];
  excelRowsData?: ExcelRowEntry[];
  activePlaceholders?: string[];
}): Record<string, string> {
  const {
    mode,
    index,
    core,
    manualValues,
    excelRowsData = [],
    activePlaceholders = [],
  } = params;

  const merged: Record<string, string> = {};

  // 1. Nilai manual global (variabel bersama seperti agenda, tempat, waktu, nama_ketua)
  for (const [k, v] of Object.entries(manualValues)) {
    if (!k) continue;
    merged[k] = v ?? "";
    merged[k.toLowerCase()] = v ?? "";
  }

  // 2. Di mode massal, data baris Excel milik penerima pada `index` HARUS menimpa default global
  if (mode === "bulk" && excelRowsData.length > 0) {
    const recLower = core.recipient.trim().toLowerCase();
    const matched =
      excelRowsData[index] ||
      (recLower
        ? excelRowsData.find((r) => r.recipient.trim().toLowerCase() === recLower)
        : undefined);

    if (matched?.data) {
      for (const [k, v] of Object.entries(matched.data)) {
        if (!k) continue;
        const val = v ?? "";
        merged[k] = val;
        merged[k.toLowerCase()] = val;
      }
    }
  }

  // 3. Field inti standar + alias resmi template PMII (selalu spesifik untuk penerima & nomor ini)
  const coreAliases: Record<string, string> = {
    nomor: core.nomor,
    no: core.nomor,
    nomor_surat: core.nomor,
    no_surat: core.nomor,
    perihal: core.subject,
    hal: core.subject,
    perihal_surat: core.subject,
    penerima: core.recipient,
    nama_penerima: core.recipient,
    kepada: core.recipient,
    tujuan: core.recipient,
    tujuan_surat: core.recipient,
    lokasi: core.location,
    kota: core.location,
    kota_surat: core.location,
    tanggal: core.date,
    hari_tanggal: core.date,
    tanggal_surat: core.date,
  };

  for (const [k, v] of Object.entries(coreAliases)) {
    merged[k] = v;
  }

  // 4. Pastikan seluruh placeholder persis (case-sensitive untuk docxtemplater) terisi
  for (const placeholder of activePlaceholders) {
    if (!placeholder) continue;
    const coreVal = resolveCoreFieldValue(placeholder, core);
    if (coreVal !== undefined) {
      merged[placeholder] = coreVal;
    } else if (merged[placeholder] === undefined) {
      const lowerVal = merged[placeholder.toLowerCase()];
      if (lowerVal !== undefined) {
        merged[placeholder] = lowerVal;
      }
    }
  }

  return merged;
}

export function humanizePlaceholderKey(key: string): string {
  const lk = key.toLowerCase().trim();
  if (lk === "nomor" || lk === "no" || lk === "nomor_surat" || lk === "no_surat") return "Nomor Surat";
  if (lk === "perihal" || lk === "hal" || lk === "perihal_surat") return "Perihal Surat";
  if (lk === "penerima" || lk === "nama_penerima" || lk === "kepada" || lk === "tujuan" || lk === "tujuan_surat") {
    return "Tujuan / Penerima Surat";
  }
  if (lk === "kota_surat" || lk === "kota" || lk === "lokasi") return "Kota / Lokasi Surat";
  if (lk === "tanggal_surat" || lk === "tanggal" || lk === "hari_tanggal") return "Tanggal Surat";
  if (lk === "lokasi_tujuan") return "Lokasi / Kota Tujuan";
  if (lk === "isi") return "Isi Surat / Redaksi Pokok";
  if (lk === "kegiatan" || lk === "acara" || lk === "agenda") return "Nama Kegiatan / Agenda";
  if (lk === "tema") return "Tema Kegiatan";
  if (lk === "tempat") return "Tempat / Lokasi Kegiatan";
  if (lk === "waktu" || lk === "pukul") return "Waktu / Pukul Pelaksanaan";
  if (lk === "hari") return "Hari Pelaksanaan";
  if (lk === "lampiran" || lk === "lamp") return "Lampiran Surat";
  if (lk === "narasumber" || lk === "pemateri") return "Nama Narasumber / Pemateri";
  if (lk === "nama") return "Nama Lengkap";
  if (lk === "ketua" || lk === "nama_ketua") return "Nama Ketua / Pimpinan";
  if (lk === "sekretaris" || lk === "nama_sekretaris") return "Nama Sekretaris";
  if (lk === "peserta") return "Target Peserta";
  if (lk === "keterangan" || lk === "catatan") return "Keterangan / Catatan Tambahan";

  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export function isMultilineField(key: string): boolean {
  const lk = key.toLowerCase();
  return (
    lk === "isi" ||
    lk === "deskripsi" ||
    lk === "agenda" ||
    lk === "catatan" ||
    lk === "keterangan" ||
    lk.includes("konten") ||
    lk.includes("materi")
  );
}

export function openLetterPrintWindow(
  title: string,
  innerHtml: string,
  onBlocked: () => void
): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    onBlocked();
    return;
  }

  const allStyles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
    .map((el) => el.outerHTML)
    .join("\n");

  const safeTitle = escapeHtml(title.replace(/\s+/g, "_"));
  const cleanPrintHtml = stripLetterEditMetadata(innerHtml);
  const { htmlClassAttr, fontVarsCss, baseHref } = buildPrintFontContext();
  const printStyles = buildDocxPrintStyleBlock(cleanPrintHtml, {
    fontVarsCss,
    isBulk: cleanPrintHtml.includes("bulk-letter-page"),
  });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id" class="${escapeHtml(htmlClassAttr)}">
      <head>
        <meta charset="utf-8">
        ${baseHref ? `<base href="${escapeHtml(baseHref)}">` : ""}
        <title>${safeTitle}</title>
        ${allStyles}
        <style>${printStyles}</style>
      </head>
      <body>
        <div id="custom-letter-print-area">${cleanPrintHtml}</div>
        ${buildPrintAutoTriggerScript(200)}
      </body>
    </html>
  `);
  printWindow.document.close();
}
