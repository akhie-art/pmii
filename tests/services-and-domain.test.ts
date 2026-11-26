import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  isCabangOrAdmin,
  isRecordInTenant,
  enforceTenantWrite,
  CABANG_TENANT_ID,
} from "@/lib/tenancy";
import { extractStorageInfo } from "@/lib/supabase";
import {
  isPrivateStorageRef,
  resolveStorageUrl,
  PRIVATE_DOC_MAX_BYTES,
  shouldFallbackToPublicBucket,
} from "@/lib/storage";
import {
  calculateEvaluationScore,
  recalculateParticipantCumulative,
  deduplicateEvaluations,
} from "@/lib/services/evaluations";
import { calculateCareerMBTI } from "@/lib/careerAssessment";
import { normalizeDateString, extractMissingColumn } from "@/lib/services/core";
import {
  isCoreStandardKey,
  buildLetterMergeData,
  humanizePlaceholderKey,
  isMultilineField,
} from "@/app/dashboard/surat/component/letter-generator-helpers";
import {
  serializeTemplateContent,
  parseTemplateContent,
  formatBytes,
  extractDocxPlaceholders,
  fillDocxTemplate,
} from "@/app/dashboard/surat/component/docx-template-helper";
import PizZip from "pizzip";
import {
  formatDateIndo,
  resolveMemberPhotoUrl,
} from "@/app/dashboard/anggota/_components/types";
import type { UserAccount, ParticipantEvaluation } from "@/lib/db";

const KOM_AJISAKA_ID = "2342112a-7413-4151-9998-3a13e833902f";
const KOM_TARUB_ID = "66467355-3508-4f25-a999-667f9f287d41";

describe("Multi-Tenancy Isolation & Privilege Regression Guards", () => {
  it("never grants cabang privileges based on email substring or member fallback commissariat", () => {
    const emailSpoofAnggota: UserAccount = {
      id: "u-1",
      name: "Budi Cabang",
      email: "budi.cabang@gmail.com",
      role: "anggota",
      commissariat: "Pengurus Cabang PMII Grobogan",
      tenant_id: CABANG_TENANT_ID,
      status: "AKTIF",
      createdAt: "",
    };
    expect(isCabangOrAdmin(emailSpoofAnggota)).toBe(false);

    const emailSpoofKomisariat: UserAccount = {
      id: "u-2",
      name: "Pengurus Komisariat",
      email: "sekretaris.cabang@gmail.com",
      role: "pengurus",
      commissariat: "Komisariat Ajisaka",
      tenant_id: KOM_AJISAKA_ID,
      status: "AKTIF",
      createdAt: "",
    };
    expect(isCabangOrAdmin(emailSpoofKomisariat)).toBe(false);
  });

  it("isolates records across komisariat tenants while letting cabang view all or filter", () => {
    const pengurusAjisaka: UserAccount = {
      id: "p-1",
      name: "Pengurus Ajisaka",
      email: "ajisaka@pmii.org",
      role: "pengurus",
      commissariat: "Komisariat Ajisaka",
      tenant_id: KOM_AJISAKA_ID,
      status: "AKTIF",
      createdAt: "",
    };
    const adminCabang: UserAccount = {
      id: "a-1",
      name: "Admin Cabang",
      email: "admin@pmii.org",
      role: "admin",
      commissariat: "Pengurus Cabang PMII Grobogan",
      tenant_id: CABANG_TENANT_ID,
      status: "AKTIF",
      createdAt: "",
    };

    const recAjisaka = { tenant_id: KOM_AJISAKA_ID, commissariat: "Komisariat Ajisaka" };
    const recTarub = { tenant_id: KOM_TARUB_ID, commissariat: "Komisariat Ki Ageng Tarub" };

    expect(isRecordInTenant(pengurusAjisaka, recAjisaka)).toBe(true);
    expect(isRecordInTenant(pengurusAjisaka, recTarub)).toBe(false);
    expect(isRecordInTenant(adminCabang, recAjisaka, "ALL")).toBe(true);
    expect(isRecordInTenant(adminCabang, recTarub, "ALL")).toBe(true);
    expect(isRecordInTenant(adminCabang, recTarub, KOM_AJISAKA_ID)).toBe(false);
  });

  it("enforces non-cabang tenant_id on writes to prevent cross-tenant tampering", () => {
    const pengurusAjisaka: UserAccount = {
      id: "p-1",
      name: "Pengurus Ajisaka",
      email: "ajisaka@pmii.org",
      role: "pengurus",
      commissariat: "Komisariat Ajisaka",
      tenant_id: KOM_AJISAKA_ID,
      status: "AKTIF",
      createdAt: "",
    };

    const stamped = enforceTenantWrite(pengurusAjisaka, {
      title: "Arsip",
      tenant_id: KOM_TARUB_ID,
      komisariat_id: KOM_TARUB_ID,
      commissariat: "Komisariat Ki Ageng Tarub",
    });

    expect(stamped.tenant_id).toBe(KOM_AJISAKA_ID);
    expect(stamped.komisariat_id).toBe(KOM_AJISAKA_ID);
  });
});

describe("Storage & Private-Docs Resolution", () => {
  it("extracts bucket and path across public, signed, render, and relative storage refs", () => {
    expect(
      extractStorageInfo(
        "https://abc.supabase.co/storage/v1/object/public/materials/drive/surat%20sk.pdf?v=1"
      )
    ).toEqual({ bucket: "materials", path: "drive/surat sk.pdf" });

    expect(
      extractStorageInfo(
        "https://abc.supabase.co/storage/v1/object/sign/private-docs/tenant-1/ktm/id.pdf?token=xyz"
      )
    ).toEqual({ bucket: "private-docs", path: "tenant-1/ktm/id.pdf" });

    expect(extractStorageInfo("private-docs/tenant-1/pengajuan-sk/sk.pdf")).toEqual({
      bucket: "private-docs",
      path: "tenant-1/pengajuan-sk/sk.pdf",
    });

    expect(extractStorageInfo("drive/legacy-file.pdf")).toEqual({
      bucket: "materials",
      path: "drive/legacy-file.pdf",
    });

    expect(extractStorageInfo("https://example.com/external.png")).toBeNull();
  });

  it("identifies private storage references and resolves passthrough URLs safely", async () => {
    expect(isPrivateStorageRef("private-docs/abc/ktm/1.jpg")).toBe(true);
    expect(
      isPrivateStorageRef("https://abc.supabase.co/storage/v1/object/sign/private-docs/a/b.pdf")
    ).toBe(true);
    expect(
      isPrivateStorageRef("https://abc.supabase.co/storage/v1/object/public/materials/a.pdf")
    ).toBe(false);
    expect(isPrivateStorageRef(null)).toBe(false);

    expect(await resolveStorageUrl("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
    expect(await resolveStorageUrl("blob:https://pmii.or.id/xyz")).toBe("blob:https://pmii.or.id/xyz");
    expect(await resolveStorageUrl("/image/logo_komsat.png")).toBe("/image/logo_komsat.png");
    expect(await resolveStorageUrl("")).toBe("");
  });
});

describe("Evaluations, Cumulative Scoring & Deduplication", () => {
  it("computes weighted scores (30/35/35) and grade boundaries accurately", () => {
    expect(calculateEvaluationScore(90, 90, 90)).toEqual({
      finalScore: 90,
      grade: "A",
      status: "LULUS",
    });
    expect(calculateEvaluationScore(80, 75, 75)).toEqual({
      finalScore: 76.5,
      grade: "B",
      status: "LULUS",
    });
    expect(calculateEvaluationScore(70, 65, 65)).toEqual({
      finalScore: 66.5,
      grade: "C",
      status: "LULUS_BERSYARAT",
    });
    expect(calculateEvaluationScore(55, 55, 55)).toEqual({
      finalScore: 55,
      grade: "D",
      status: "LULUS_BERSYARAT",
    });
    expect(calculateEvaluationScore(40, 40, 40)).toEqual({
      finalScore: 40,
      grade: "E",
      status: "TIDAK_LULUS",
    });
  });

  it("recalculates cumulative scores across sessions while ignoring __metadata keys", () => {
    expect(recalculateParticipantCumulative({})).toEqual({
      kognitif: 0,
      afektif: 0,
      psikomotorik: 0,
      finalScore: 0,
      grade: "E",
      status: "BELUM_DINILAI",
    });

    const res = recalculateParticipantCumulative({
      "Materi 1": { materiId: "m-1", materiTitle: "Materi 1", kognitif: 80, afektif: 90, psikomotorik: 80 },
      "Materi 2": { materiId: "m-2", materiTitle: "Materi 2", kognitif: 100, afektif: 90, psikomotorik: 100 },
      __meta: { materiId: "meta", materiTitle: "meta", kognitif: 0, afektif: 0, psikomotorik: 0 },
    });
    expect(res.kognitif).toBe(90);
    expect(res.afektif).toBe(90);
    expect(res.psikomotorik).toBe(90);
    expect(res.grade).toBe("A");
    expect(res.status).toBe("LULUS");
  });

  it("deduplicates evaluations per activity without losing other activities", () => {
    const evals: ParticipantEvaluation[] = [
      {
        id: "e1",
        activityId: "act-1",
        cadreId: "c-1",
        participantName: "Ahmad Fauzi",
        kognitif: 80,
        afektif: 80,
        psikomotorik: 80,
        finalScore: 80,
        grade: "B",
        status: "LULUS",
        sessionScores: { Sesi1: { materiId: "s-1", materiTitle: "Sesi 1", kognitif: 80, afektif: 80, psikomotorik: 80 } },
      },
      {
        id: "e2",
        activityId: "act-1",
        cadreId: "c-1",
        participantName: "Ahmad Fauzi",
        kognitif: 90,
        afektif: 90,
        psikomotorik: 90,
        finalScore: 90,
        grade: "A",
        status: "LULUS",
        sessionScores: { Sesi2: { materiId: "s-2", materiTitle: "Sesi 2", kognitif: 90, afektif: 90, psikomotorik: 90 } },
      },
      {
        id: "e3",
        activityId: "act-2",
        cadreId: "c-1",
        participantName: "Ahmad Fauzi",
        kognitif: 85,
        afektif: 85,
        psikomotorik: 85,
        finalScore: 85,
        grade: "A",
        status: "LULUS",
        sessionScores: {},
      },
    ];

    const deduped = deduplicateEvaluations(evals);
    expect(deduped).toHaveLength(2);
    const act1 = deduped.find((e) => e.activityId === "act-1");
    expect(act1?.sessionScores).toHaveProperty("Sesi1");
    expect(act1?.sessionScores).toHaveProperty("Sesi2");
  });
});

describe("Career MBTI, Core Utilities & Letter Helpers", () => {
  it("computes deterministic MBTI codes and complete career profiles", () => {
    const allA: Record<number, string> = {};
    const allB: Record<number, string> = {};
    for (let i = 1; i <= 12; i++) {
      allA[i] = "A";
      allB[i] = "B";
    }
    const resA = calculateCareerMBTI(allA);
    const resB = calculateCareerMBTI(allB);

    expect(resA.mbtiCode).toBe("ESTJ");
    expect(resA.talent).toBeTruthy();
    expect(resA.strategicRole).toBeTruthy();
    expect(resB.mbtiCode).toBe("INFP");
    expect(resB.dimensionScores?.I).toBe(3);
    expect(resB.dimensionScores?.P).toBe(3);
  });

  it("normalizes date strings and extracts PostgREST/Postgres missing columns", () => {
    expect(normalizeDateString("2026-11-24T12:00:00Z")).toBe("2026-11-24");
    expect(normalizeDateString("Mei 2026")).toBe("2026-05-01");
    expect(normalizeDateString("Agustus 2025")).toBe("2025-08-01");
    expect(normalizeDateString("Desember 2024")).toBe("2024-12-01");
    expect(normalizeDateString("")).toBeNull();

    expect(
      extractMissingColumn("Could not find the 'organisasiSD' column of 'anggota' in the schema cache")
    ).toBe("organisasiSD");
    expect(extractMissingColumn('column "rayon" of relation "pengurus" does not exist')).toBe("rayon");
    expect(extractMissingColumn('column "legacy_col" does not exist')).toBe("legacy_col");
    expect(extractMissingColumn("duplicate key value violates unique constraint")).toBeNull();
  });

  it("formats Indonesian dates, member photos, and letter placeholder metadata", () => {
    expect(formatDateIndo("2026-08-17")).toBe("17 Agustus 2026");
    expect(formatDateIndo("")).toBe("-");
    expect(resolveMemberPhotoUrl({ pasFoto: "https://cdn.example.com/a.jpg" })).toBe(
      "https://cdn.example.com/a.jpg"
    );
    expect(resolveMemberPhotoUrl({ avatar: "/image/default.png" })).toBe("/image/default.png");

    expect(isCoreStandardKey("nomor")).toBe(true);
    expect(isCoreStandardKey("hari_tanggal")).toBe(true);
    expect(isCoreStandardKey("kegiatan")).toBe(false);
    expect(humanizePlaceholderKey("narasumber")).toBe("Nama Narasumber / Pemateri");
    expect(humanizePlaceholderKey("namaKetuaPanitia")).toBe("Nama Ketua Panitia");
    expect(isMultilineField("isi")).toBe(true);
    expect(isMultilineField("materi_pokok")).toBe(true);
    expect(isMultilineField("nomor")).toBe(false);
  });
});

function createMinimalDocxBuffer(documentBodyXml: string): ArrayBuffer {
  const zip = new PizZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${documentBodyXml}</w:body>
</w:document>`
  );
  return zip.generate({ type: "arraybuffer" });
}

describe("Surat Module: DOCX Engine, Serialization, Private Storage & Tenant Writes", () => {
  it("serializes and parses DOCX JSON templates while falling back safely for legacy or malformed content", () => {
    const serialized = serializeTemplateContent(
      "<p>Pratinjau</p>",
      ["nomor", "penerima"],
      "private-docs/tenant-1/surat/template-undangan.docx"
    );
    const parsed = parseTemplateContent(serialized);
    expect(parsed.isDocxTemplate).toBe(true);
    expect(parsed.fileUrl).toBe("private-docs/tenant-1/surat/template-undangan.docx");
    expect(parsed.placeholders).toEqual(["nomor", "penerima"]);
    expect(parsed.html).toBe("<p>Pratinjau</p>");

    // Tanpa fileUrl -> kembali ke raw HTML biasa
    expect(serializeTemplateContent("<p>HTML Polos</p>", ["nomor"])).toBe("<p>HTML Polos</p>");
    const legacyParsed = parseTemplateContent("<p>HTML Polos</p>");
    expect(legacyParsed.isDocxTemplate).toBe(false);
    expect(legacyParsed.html).toBe("<p>HTML Polos</p>");

    // Malformed JSON wrapper fallback
    const malformed = parseTemplateContent('{"isDocxTemplate":true, broken');
    expect(malformed.isDocxTemplate).toBe(false);
    expect(malformed.html).toBe('{"isDocxTemplate":true, broken');
  });

  it("formats byte sizes cleanly across units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-50)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(2 * 1024 * 1024)).toBe("2 MB");
  });

  it("cleans split Word XML proofing tags, extracts placeholders, and fills unique bulk recipients", () => {
    // Simulasi Word memecah placeholder {{nomor}} dengan <w:proofErr/> dan <w:lang/>
    const docxBuffer = createMinimalDocxBuffer(
      `<w:p><w:r><w:t>Nomor: {{no</w:t></w:r><w:proofErr w:type="spellStart"/><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:t>mor}}</w:t></w:r></w:p>
       <w:p><w:r><w:t>Kepada Yth. {{penerima}} ({{jabatan}})</w:t></w:r></w:p>`
    );

    const extracted = extractDocxPlaceholders(docxBuffer);
    expect(extracted.error).toBeUndefined();
    expect(extracted.keys).toEqual(["nomor", "penerima", "jabatan"]);

    const fillA = fillDocxTemplate(docxBuffer, {
      nomor: "001.PK-XI.2026",
      penerima: "Sahabat Ahmad",
      jabatan: "Ketua Rayon Tarbiyah",
    });
    const fillB = fillDocxTemplate(docxBuffer, {
      nomor: "002.PK-XI.2026",
      penerima: "Sahabati Siti",
      jabatan: "Ketua Rayon Syariah",
    });

    expect(fillA.error).toBeUndefined();
    expect(fillB.error).toBeUndefined();

    const textA = new PizZip(fillA.arrayBuffer).file("word/document.xml")?.asText() || "";
    const textB = new PizZip(fillB.arrayBuffer).file("word/document.xml")?.asText() || "";

    expect(textA).toContain("001.PK-XI.2026");
    expect(textA).toContain("Sahabat Ahmad");
    expect(textA).not.toContain("Sahabati Siti");

    expect(textB).toContain("002.PK-XI.2026");
    expect(textB).toContain("Sahabati Siti");
    expect(textB).not.toContain("Sahabat Ahmad");
  });

  it("recognizes private-docs surat refs and enforces activeTenant scope on writes", () => {
    expect(isPrivateStorageRef(`private-docs/${KOM_AJISAKA_ID}/surat/lampiran-123.pdf`)).toBe(true);
    expect(isPrivateStorageRef(`private-docs/${CABANG_TENANT_ID}/surat/template-sk.docx`)).toBe(true);

    const adminCabang: UserAccount = {
      id: "a-1",
      name: "Sekretaris Cabang",
      email: "cabang@pmii.org",
      role: "admin",
      commissariat: "Pengurus Cabang Grobogan",
      tenant_id: CABANG_TENANT_ID,
      status: "AKTIF",
      createdAt: "",
    };
    const pengurusAjisaka: UserAccount = {
      id: "p-1",
      name: "Sekretaris Ajisaka",
      email: "ajisaka@pmii.org",
      role: "pengurus",
      commissariat: "Komisariat Ajisaka",
      tenant_id: KOM_AJISAKA_ID,
      status: "AKTIF",
      createdAt: "",
    };

    // Cabang yang memilih filter tenant komisariat tertentu menuliskan surat ke komisariat tersebut
    const cabangToAjisaka = enforceTenantWrite<{ nomor: string; subject: string; tenant_id?: string | null }>(
      adminCabang,
      { nomor: "001.PK", subject: "Surat Undangan" },
      "Komisariat Ajisaka"
    );
    expect(cabangToAjisaka.tenant_id).toBe(KOM_AJISAKA_ID);

    // Pengurus komisariat tidak dapat memalsukan activeTenant ke komisariat lain
    const forgedByKomisariat = enforceTenantWrite<{ nomor: string; subject: string; tenant_id?: string | null }>(
      pengurusAjisaka,
      { nomor: "002.PK", subject: "Surat Forged" },
      "Komisariat Ki Ageng Tarub"
    );
    expect(forgedByKomisariat.tenant_id).toBe(KOM_AJISAKA_ID);
  });

  it("merges per-row Excel columns accurately in bulk mode without row-0 clobbering and maps official PMII template aliases", () => {
    const excelRows = [
      {
        recipient: "Sahabat Ahmad",
        data: { jabatan: "Ketua Rayon", instansi: "Rayon Tarbiyah", catatan: "Bawa laptop" },
      },
      {
        recipient: "Sahabati Siti",
        data: { jabatan: "Sekretaris Rayon", instansi: "Rayon Syariah", catatan: "" },
      },
    ];

    const row0 = buildLetterMergeData({
      mode: "bulk",
      index: 0,
      core: {
        nomor: "001.PK-XI.2026",
        recipient: "Sahabat Ahmad",
        subject: "Undangan Rapat Kerja",
        location: "Purwodadi",
        date: "25 November 2026",
      },
      manualValues: { agenda: "Rapat Kerja Komisariat", waktu: "09.00", tempat: "Aula PCNU" },
      excelRowsData: excelRows,
      activePlaceholders: ["nomor_surat", "tujuan_surat", "kota_surat", "tanggal_surat", "agenda", "instansi"],
    });

    const row1 = buildLetterMergeData({
      mode: "bulk",
      index: 1,
      core: {
        nomor: "002.PK-XI.2026",
        recipient: "Sahabati Siti",
        subject: "Undangan Rapat Kerja",
        location: "Purwodadi",
        date: "25 November 2026",
      },
      manualValues: { agenda: "Rapat Kerja Komisariat", waktu: "09.00", tempat: "Aula PCNU" },
      excelRowsData: excelRows,
      activePlaceholders: ["nomor_surat", "tujuan_surat", "kota_surat", "tanggal_surat", "agenda", "instansi"],
    });

    expect(row0.instansi).toBe("Rayon Tarbiyah");
    expect(row0.catatan).toBe("Bawa laptop");
    expect(row1.instansi).toBe("Rayon Syariah");
    expect(row1.jabatan).toBe("Sekretaris Rayon");
    expect(row1.catatan).toBe(""); // tidak bocor dari baris #0
    expect(row1.agenda).toBe("Rapat Kerja Komisariat"); // variabel global tetap terisi

    // Verifikasi alias placeholder pada file resmi public/templates/template-surat-resmi-pmii.docx
    expect(isCoreStandardKey("nomor_surat")).toBe(true);
    expect(isCoreStandardKey("tujuan_surat")).toBe(true);
    expect(isCoreStandardKey("kota_surat")).toBe(true);
    expect(isCoreStandardKey("tanggal_surat")).toBe(true);
    expect(isCoreStandardKey("lokasi_tujuan")).toBe(false);

    const officialPath = path.join(process.cwd(), "public/templates/template-surat-resmi-pmii.docx");
    const officialBuf = fs.readFileSync(officialPath);
    const officialArrayBuf = officialBuf.buffer.slice(
      officialBuf.byteOffset,
      officialBuf.byteOffset + officialBuf.byteLength
    );
    const extracted = extractDocxPlaceholders(officialArrayBuf);
    expect(extracted.error).toBeUndefined();
    expect(extracted.keys).toContain("nomor_surat");
    expect(extracted.keys).toContain("tujuan_surat");

    const filled = fillDocxTemplate(officialArrayBuf, row1);
    expect(filled.error).toBeUndefined();
    const docXml = new PizZip(filled.arrayBuffer).file("word/document.xml")?.asText() || "";
    expect(docXml).toContain("002.PK-XI.2026");
    expect(docXml).toContain("Sahabati Siti");
    expect(docXml).toContain("Purwodadi");
    expect(docXml).toContain("25 November 2026");
    expect(docXml).toContain("Rapat Kerja Komisariat");
    expect(docXml).not.toContain("{{nomor_surat}}");
    expect(docXml).not.toContain("{{tujuan_surat}}");
  });

  it("enforces 10 MB private-docs upload limit and blocks silent fallback to public bucket", () => {
    expect(PRIVATE_DOC_MAX_BYTES).toBe(10 * 1024 * 1024);
    expect(shouldFallbackToPublicBucket("The object exceeded the maximum allowed size", false)).toBe(false);
    expect(shouldFallbackToPublicBucket("The object exceeded the maximum allowed size", true)).toBe(false);
    expect(shouldFallbackToPublicBucket("new row violates row-level security policy", true)).toBe(false);
    expect(shouldFallbackToPublicBucket("Bucket not found", false)).toBe(false);
    expect(shouldFallbackToPublicBucket("Bucket not found", true)).toBe(true);
  });
});
