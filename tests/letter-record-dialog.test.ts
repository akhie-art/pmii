import { describe, it, expect } from "vitest";
import { CABANG_TENANT_ID } from "@/lib/tenancy";
import type { UserAccount } from "@/lib/db";
import type { MailItem } from "@/app/dashboard/surat/component/types";
import {
  buildRecordedMailPayload,
  filterMailsForSameTenant,
  formatDateToIndo,
  generateNextOutgoingNumber,
  isFormattedHtmlContent,
  normalizeMailStatusForType,
  parseMailDateToIso,
  resolveTargetRecordTenant,
} from "@/app/dashboard/surat/component/letter-record-helper";
import {
  computeBulkRecipientNomor,
  deduplicateBulkPagesHtml,
  embedLetterEditMetadata,
  expandNomorOccurrences,
  extractLetterEditMetadata,
  formatBulkNomorSummary,
  formatBulkRecipientSummary,
  getMaxSequenceFromNomor,
  parseBulkRangeNomor,
  parsePmiiNomorToBoxes,
  stripLetterEditMetadata,
} from "@/app/dashboard/surat/component/letter-generator-helpers";
import { buildDocxPrintStyleBlock } from "@/app/dashboard/surat/component/docx-preview-helper";
import { hasHtmlQrFooter, stripHtmlQrFooter } from "@/app/dashboard/surat/component/letter-qr-helper";
import {
  buildSampleValuesForPlaceholders,
  classifyTemplatePlaceholders,
  deriveTemplateNameFromFilename,
  resolveTemplateTenantScope,
} from "@/app/dashboard/surat/component/template-manager-helper";
import { sanitizeLetterHtml } from "@/lib/sanitize";

const AJISAKA_TENANT_ID = "2342112a-7413-4151-9998-3a13e833902f";
const JOKO_SURO_TENANT_ID = "2eae53a7-28ff-40b5-95f1-69f85d179d8e";

const adminCabangUser: UserAccount = {
  id: "u-admin-1",
  name: "Admin Cabang",
  email: "admin@pmii.or.id",
  role: "ADMIN",
  tenant_id: CABANG_TENANT_ID,
  commissariat: "Pengurus Cabang Grobogan",
  status: "AKTIF",
  createdAt: "2026-01-01T00:00:00Z",
};

const komisariatUser: UserAccount = {
  id: "u-komsat-1",
  name: "Sekretaris Ajisaka",
  email: "sekretaris@ajisaka.or.id",
  role: "pengurus",
  tenant_id: AJISAKA_TENANT_ID,
  commissariat: "Komisariat Ajisaka",
  status: "AKTIF",
  createdAt: "2026-01-01T00:00:00Z",
};

const sampleGeneratedOutgoingMail: MailItem = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  nomor: "005.PK-XII.Z-03.01.010.B-II.10.2026",
  type: "KELUAR",
  senderOrRecipient: "Pengurus Rayon Tarbiyah",
  subject: "Undangan Rapat Kerja",
  date: "2026-10-15",
  dateIndo: "15 Oktober 2026",
  classification: "Undangan",
  status: "Terkirim",
  content:
    '<div class="docx-page"><p>Assalamualaikum</p><footer data-letter-qr-footer="true"><img src="data:image/png;base64,AAAA" alt="QR" /></footer></div>',
  senderTitle: "Ketua Komisariat",
  senderLocation: "Purwodadi",
  tenant_id: AJISAKA_TENANT_ID,
  komisariat_id: AJISAKA_TENANT_ID,
  commissariat: "Komisariat Ajisaka",
  fileUrl: `private-docs/${AJISAKA_TENANT_ID}/surat-attachments/scan-lama.pdf`,
  fileName: "scan-lama.pdf",
  fileSize: "1.2 MB",
};

describe("Edit Arsip Surat Modal Helpers (letter-record-helper)", () => {
  it("explicitly serializes null for removed attachment fields so Supabase upsert clears DB columns", () => {
    const payload = buildRecordedMailPayload({
      editingMail: sampleGeneratedOutgoingMail,
      currentUser: komisariatUser,
      activeTenant: "Komisariat Ajisaka",
      mailType: "KELUAR",
      nomor: sampleGeneratedOutgoingMail.nomor,
      senderOrRecipient: sampleGeneratedOutgoingMail.senderOrRecipient,
      subject: "Undangan Rapat Kerja (Revisi)",
      date: "2026-10-18",
      classification: "Undangan",
      status: "Terkirim",
      content: "",
      preserveOriginalHtmlContent: true,
      senderTitle: "Ketua Komisariat",
      senderLocation: "Purwodadi",
      defaultLocation: "Purwodadi",
      attachmentUrl: "",
      attachmentName: "",
      attachmentSize: "",
    });

    expect(payload.fileUrl).toBeNull();
    expect(payload.fileName).toBeNull();
    expect(payload.fileSize).toBeNull();

    // Pastikan JSON.stringify tetap menyertakan key bernilai null (bukan dibuang seperti undefined)
    const serialized = JSON.parse(JSON.stringify(payload));
    expect("fileUrl" in serialized).toBe(true);
    expect(serialized.fileUrl).toBeNull();
    expect(serialized.fileName).toBeNull();
    expect(serialized.fileSize).toBeNull();
  });

  it("detects structured HTML/QR content and preserves it intact during metadata edit", () => {
    expect(isFormattedHtmlContent(sampleGeneratedOutgoingMail.content)).toBe(true);
    expect(isFormattedHtmlContent("<div>Surat Resmi</div>")).toBe(true);
    expect(isFormattedHtmlContent("Ringkasan catatan biasa untuk rapat pengurus.")).toBe(false);
    expect(isFormattedHtmlContent("")).toBe(false);

    const payload = buildRecordedMailPayload({
      editingMail: sampleGeneratedOutgoingMail,
      currentUser: komisariatUser,
      activeTenant: "Komisariat Ajisaka",
      mailType: "KELUAR",
      nomor: sampleGeneratedOutgoingMail.nomor,
      senderOrRecipient: "Pengurus Rayon Baru",
      subject: "Perihal Baru",
      date: "2026-10-15",
      classification: "Undangan",
      status: "Selesai",
      content: "Teks kosong yang tidak boleh menimpa HTML",
      preserveOriginalHtmlContent: true,
      senderTitle: "Ketua Komisariat",
      senderLocation: "Purwodadi",
      defaultLocation: "Purwodadi",
      attachmentUrl: sampleGeneratedOutgoingMail.fileUrl || "",
      attachmentName: sampleGeneratedOutgoingMail.fileName || "",
      attachmentSize: sampleGeneratedOutgoingMail.fileSize || "",
    });

    expect(payload.content).toBe(sampleGeneratedOutgoingMail.content);
    expect(payload.content).toContain("data-letter-qr-footer");
  });

  it("normalizes status cleanly when switching between MASUK and KELUAR", () => {
    expect(normalizeMailStatusForType("Menunggu Tindak Lanjut", "KELUAR")).toBe("Terkirim");
    expect(normalizeMailStatusForType("Terkirim", "MASUK")).toBe("Menunggu Tindak Lanjut");
    expect(normalizeMailStatusForType("Diproses", "KELUAR")).toBe("Diproses");
    expect(normalizeMailStatusForType("Diproses", "MASUK")).toBe("Diproses");
    expect(normalizeMailStatusForType("Selesai", "KELUAR")).toBe("Selesai");
    expect(normalizeMailStatusForType("Selesai", "MASUK")).toBe("Selesai");

    const switchedPayload = buildRecordedMailPayload({
      editingMail: { ...sampleGeneratedOutgoingMail, type: "MASUK", status: "Menunggu Tindak Lanjut" },
      currentUser: komisariatUser,
      activeTenant: "Komisariat Ajisaka",
      mailType: "KELUAR",
      nomor: "009.PK-XII.Z-03.01.010.B-II.11.2026",
      senderOrRecipient: "Rayon Syariah",
      subject: "Surat Keluar",
      date: "2026-11-26",
      classification: "Instruksi",
      status: "Menunggu Tindak Lanjut",
      content: "Isi ringkas",
      preserveOriginalHtmlContent: false,
      senderTitle: "Ketua",
      senderLocation: "Purwodadi",
      defaultLocation: "Purwodadi",
      attachmentUrl: "",
      attachmentName: "",
      attachmentSize: "",
    });

    expect(switchedPayload.type).toBe("KELUAR");
    expect(switchedPayload.status).toBe("Terkirim");
  });

  it("preserves Komisariat tenant scope & upload folder when Admin Cabang edits under filter ALL", () => {
    const info = resolveTargetRecordTenant(sampleGeneratedOutgoingMail, adminCabangUser, "ALL");
    expect(info.isCabang).toBe(false);
    expect(info.tenantId).toBe(AJISAKA_TENANT_ID);
    expect(info.orgLevelCode).toBe("PK");

    const payload = buildRecordedMailPayload({
      editingMail: sampleGeneratedOutgoingMail,
      currentUser: adminCabangUser,
      activeTenant: "ALL",
      mailType: "KELUAR",
      nomor: sampleGeneratedOutgoingMail.nomor,
      senderOrRecipient: sampleGeneratedOutgoingMail.senderOrRecipient,
      subject: "Edit Oleh Admin Cabang",
      date: "2026-10-20",
      classification: "Undangan",
      status: "Terkirim",
      content: "",
      preserveOriginalHtmlContent: true,
      senderTitle: "",
      senderLocation: "Purwodadi",
      defaultLocation: "Purwodadi",
      attachmentUrl: sampleGeneratedOutgoingMail.fileUrl || "",
      attachmentName: sampleGeneratedOutgoingMail.fileName || "",
      attachmentSize: sampleGeneratedOutgoingMail.fileSize || "",
    });

    expect(payload.tenant_id).toBe(AJISAKA_TENANT_ID);
    expect(payload.commissariat).toBe("Komisariat Ajisaka");
    expect(payload.senderTitle).toBe("PK PMII");
    expect(payload.date).toBe("2026-10-20");
    expect(payload.dateIndo).toBe("20 Oktober 2026");
  });

  it("isolates same-tenant outgoing list and learns organizational segment pattern for auto-numbering", () => {
    const allOutgoing: MailItem[] = [
      sampleGeneratedOutgoingMail, // Ajisaka #005, middle = PK-XII.Z-03.01.010.B-II
      {
        ...sampleGeneratedOutgoingMail,
        id: "550e8400-e29b-41d4-a716-446655440002",
        nomor: "042.PK-IX.Z-03.01.010.B-II.10.2026",
        tenant_id: JOKO_SURO_TENANT_ID,
        komisariat_id: JOKO_SURO_TENANT_ID,
        commissariat: "Komisariat Joko Suro",
      },
      {
        ...sampleGeneratedOutgoingMail,
        id: "550e8400-e29b-41d4-a716-446655440003",
        nomor: "099.PC-XV.Z-03.01.010.A-I.10.2026",
        tenant_id: CABANG_TENANT_ID,
        komisariat_id: CABANG_TENANT_ID,
        commissariat: "Pengurus Cabang Grobogan",
      },
    ];

    const ajisakaOnly = filterMailsForSameTenant(allOutgoing, AJISAKA_TENANT_ID, false);
    expect(ajisakaOnly).toHaveLength(1);
    expect(ajisakaOnly[0].tenant_id).toBe(AJISAKA_TENANT_ID);

    const nextAjisaka = generateNextOutgoingNumber(ajisakaOnly, "PK", "2026-11-26");
    expect(nextAjisaka).toBe("006.PK-XII.Z-03.01.010.B-II.11.2026");

    const cabangOnly = filterMailsForSameTenant(allOutgoing, CABANG_TENANT_ID, true);
    expect(cabangOnly).toHaveLength(1);
    const nextCabang = generateNextOutgoingNumber(cabangOnly, "PC", "2026-12-01");
    expect(nextCabang).toBe("100.PC-XV.Z-03.01.010.A-I.12.2026");
  });

  it("formats and parses Indonesian & ISO dates without timezone shifts", () => {
    expect(formatDateToIndo("2026-11-01")).toBe("1 November 2026");
    expect(formatDateToIndo("2026-02-28")).toBe("28 Februari 2026");
    expect(parseMailDateToIso("2026-10-15T00:00:00Z")).toBe("2026-10-15");
    expect(parseMailDateToIso("", "5 Agustus 2026")).toBe("2026-08-05");
  });

  it("parses standard 9-segment PMII letter numbers into boxes and returns null for custom formats", () => {
    expect(parsePmiiNomorToBoxes("007.PK-XI.Z-03.01.010.B-II.11.2026")).toEqual([
      "007",
      "PK",
      "XI",
      "Z-03",
      "01",
      "010",
      "B-II",
      "11",
      "2026",
    ]);
    expect(parsePmiiNomorToBoxes("001/PK-PMII/XI/2026")).toBeNull();
    expect(parsePmiiNomorToBoxes("")).toBeNull();
  });

  it("embeds, survives sanitizeLetterHtml, extracts, and strips DOCX template edit metadata", () => {
    const baseHtml = '<div class="docx-wrapper"><section class="docx"><p>Isi Surat</p><footer><img src="data:image/png;base64,AAAA" /></footer></section></div>';
    const withMeta = embedLetterEditMetadata(baseHtml, {
      v: 1,
      templateId: "tmpl-undangan-01",
      docxValues: {
        waktu: "09.00 WIB s.d Selesai",
        tempat: "Gedung PCNU Lt. 2 Purwodadi",
        agenda: "Rapat Kerja Komisariat",
      },
    });

    const sanitized = sanitizeLetterHtml(withMeta, { preserveDocxLayout: true });
    const extracted = extractLetterEditMetadata(sanitized);
    expect(extracted).toEqual({
      v: 1,
      templateId: "tmpl-undangan-01",
      docxValues: {
        waktu: "09.00 WIB s.d Selesai",
        tempat: "Gedung PCNU Lt. 2 Purwodadi",
        agenda: "Rapat Kerja Komisariat",
      },
    });

    const stripped = stripLetterEditMetadata(sanitized);
    expect(stripped).not.toContain("data-letter-meta");
    expect(hasHtmlQrFooter(stripped)).toBe(true);
  });

  it("strips auto-managed HTML QR footer during direct edit while keeping body intact", () => {
    const htmlWithQr =
      '<div><p>Assalamualaikum</p></div>\n<footer class="letter-qr-footer" contenteditable="false"><img src="data:image/png;base64,XYZ" alt="QR Verifikasi Surat" /></footer>';
    const editableBody = stripHtmlQrFooter(htmlWithQr);
    expect(editableBody).toBe("<div><p>Assalamualaikum</p></div>");
    expect(editableBody).not.toContain("letter-qr-footer");
  });

  it("classifies template placeholders, generates realistic PMII sample values, and preserves template tenant on edit", () => {
    const classified = classifyTemplatePlaceholders([
      "nomor_surat",
      "tujuan_surat",
      "perihal",
      "waktu",
      "tempat",
      "nomor_surat", // duplicate should be deduplicated
    ]);
    expect(classified.coreKeys).toEqual(["nomor_surat", "tujuan_surat", "perihal"]);
    expect(classified.customKeys).toEqual(["waktu", "tempat"]);

    const samples = buildSampleValuesForPlaceholders(["nomor_surat", "waktu", "tempat", "ruangan"]);
    expect(samples.nomor_surat).toContain("PK-XI");
    expect(samples.waktu).toContain("WIB");
    expect(samples.tempat).toContain("Purwodadi");
    expect(samples.ruangan).toBe("Contoh Ruangan");

    expect(deriveTemplateNameFromFilename("template_undangan-rapat_resmi.docx")).toBe(
      "Template undangan rapat resmi"
    );

    const scope = resolveTemplateTenantScope(
      {
        id: "tmpl-1",
        name: "Undangan Ajisaka",
        content: "",
        tenant_id: AJISAKA_TENANT_ID,
        commissariat: "Komisariat Ajisaka",
      },
      adminCabangUser,
      "ALL"
    );
    expect(scope.isCabang).toBe(false);
    expect(scope.tenantId).toBe(AJISAKA_TENANT_ID);
    expect(scope.displayLabel).toBe("Komisariat Ajisaka");
  });

  it("formats unified single-record bulk letter numbers, recipient summaries, and advances auto-numbering past bulk ranges", () => {
    const first = "001.PK-XI.Z-03.01.010.B-II.11.2026";
    const last = "005.PK-XI.Z-03.01.010.B-II.11.2026";

    expect(formatBulkNomorSummary(first, last, 5, true)).toBe(
      "001-005.PK-XI.Z-03.01.010.B-II.11.2026"
    );
    expect(formatBulkNomorSummary(first, first, 5, false)).toBe(first);
    expect(formatBulkNomorSummary(first, first, 1, true)).toBe(first);

    expect(formatBulkRecipientSummary(["Ahmad Fauzi"])).toBe("Ahmad Fauzi");
    expect(formatBulkRecipientSummary(["Ahmad Fauzi", "Siti Nurhaliza"])).toBe(
      "Ahmad Fauzi, Siti Nurhaliza"
    );
    expect(
      formatBulkRecipientSummary(["Ahmad Fauzi", "Siti Nurhaliza", "Budi Santoso", "Dewi Lestari"])
    ).toBe("Ahmad Fauzi (+3 penerima lainnya)");

    const range = parseBulkRangeNomor("001-005.PK-XI.Z-03.01.010.B-II.11.2026");
    expect(range?.startSeq).toBe(1);
    expect(range?.endSeq).toBe(5);
    expect(range?.startNomor).toBe(first);
    expect(range?.endNomor).toBe(last);

    expect(getMaxSequenceFromNomor("001-005.PK-XI.Z-03.01.010.B-II.11.2026")).toBe(5);
    expect(computeBulkRecipientNomor(first, 2, true)).toBe("003.PK-XI.Z-03.01.010.B-II.11.2026");
    expect(computeBulkRecipientNomor(first, 2, false)).toBe(first);

    const expanded = expandNomorOccurrences("001-005.PK-XI.Z-03.01.010.B-II.11.2026");
    expect(expanded.seqNumbers).toEqual([1, 2, 3, 4, 5]);
    expect(expanded.normalizedNomors).toContain("003.pk-xi.z-03.01.010.b-ii.11.2026");

    const nextAfterBulk = generateNextOutgoingNumber(
      [
        {
          ...sampleGeneratedOutgoingMail,
          nomor: "001-005.PK-XI.Z-03.01.010.B-II.11.2026",
        },
      ],
      "PK",
      "2026-11-28"
    );
    expect(nextAfterBulk).toBe("006.PK-XI.Z-03.01.010.B-II.11.2026");
  });

  it("persists and restores full bulk revision metadata (recipients, Excel columns/rows, sequential flag) across sanitizeLetterHtml", () => {
    const pagesHtml = deduplicateBulkPagesHtml([
      '<style>.docx p { margin: 0pt; }</style><div class="docx-wrapper"><section class="docx"><p>Kepada Ahmad</p></section></div>',
      '<style>.docx p { margin: 0pt; }</style><div class="docx-wrapper"><section class="docx"><p>Kepada Siti</p></section></div>',
    ]);

    // Blok <style> identik hanya dipertahankan sekali di halaman pertama
    expect(pagesHtml.match(/<style\b/g)?.length).toBe(1);
    expect(pagesHtml.match(/class="bulk-letter-page"/g)?.length).toBe(2);

    const withBulkMeta = embedLetterEditMetadata(pagesHtml, {
      v: 1,
      templateId: "tmpl-undangan-massal",
      docxValues: { waktu: "09.00 WIB", tempat: "Aula PCNU" },
      mode: "bulk",
      bulk: {
        recipients: ["Sahabat Ahmad Fauzi", "Sahabati Siti Nurhaliza"],
        isSequentialNumbering: true,
        startNomor: "010.PK-XI.Z-03.01.010.B-II.11.2026",
        excelColumns: [{ key: "jabatan", originalHeader: "Jabatan", sampleValue: "Ketua Rayon" }],
        excelRowsData: [
          { recipient: "Sahabat Ahmad Fauzi", data: { jabatan: "Ketua Rayon Tarbiyah" } },
          { recipient: "Sahabati Siti Nurhaliza", data: { jabatan: "Ketua Rayon Syariah" } },
        ],
      },
    });

    const sanitized = sanitizeLetterHtml(withBulkMeta, { preserveDocxLayout: true });
    const extracted = extractLetterEditMetadata(sanitized);

    expect(extracted?.mode).toBe("bulk");
    expect(extracted?.templateId).toBe("tmpl-undangan-massal");
    expect(extracted?.docxValues).toEqual({ waktu: "09.00 WIB", tempat: "Aula PCNU" });
    expect(extracted?.bulk?.recipients).toEqual([
      "Sahabat Ahmad Fauzi",
      "Sahabati Siti Nurhaliza",
    ]);
    expect(extracted?.bulk?.isSequentialNumbering).toBe(true);
    expect(extracted?.bulk?.startNomor).toBe("010.PK-XI.Z-03.01.010.B-II.11.2026");
    expect(extracted?.bulk?.excelRowsData?.[1]?.data.jabatan).toBe("Ketua Rayon Syariah");

    const printCss = buildDocxPrintStyleBlock(sanitized, { isBulk: true });
    expect(printCss).toContain(".bulk-letter-page:last-of-type");
  });
});
