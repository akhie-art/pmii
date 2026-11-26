import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import { NextRequest } from "next/server";
import {
  getShortVerificationCode,
  getLetterVerificationUrl,
  generateLetterQrDataUrl,
  buildHtmlQrFooter,
  hasHtmlQrFooter,
  upsertHtmlQrFooter,
} from "@/app/dashboard/surat/component/letter-qr-helper";
import { fillDocxTemplate } from "@/app/dashboard/surat/component/docx-template-helper";
import { sanitizeLetterHtml } from "@/lib/sanitize";
import { resetRateLimits } from "@/lib/rate-limit";

const mockRpc = vi.fn();
const mockServerFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: (...args: unknown[]) => mockServerFrom(...args),
  })),
}));

import { GET as verifySuratGET } from "@/app/api/verify-surat/route";

function createDocxWithExistingFooter(options?: { titlePg?: boolean }): ArrayBuffer {
  const zip = new PizZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
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
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>`
  );
  zip.file(
    "word/footer1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:r><w:t>Footer Asli Komisariat</w:t></w:r></w:p>
</w:ftr>`
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p><w:r><w:t>Nomor: {{nomor_surat}}</w:t></w:r></w:p>
    <w:sectPr>
      <w:footerReference w:type="default" r:id="rIdFooter1"/>
      ${options?.titlePg ? "<w:titlePg/>" : ""}
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`
  );
  return zip.generate({ type: "arraybuffer" });
}

describe("Letter QR Footer & Verification Helpers", () => {
  const sampleId = "550e8400-e29b-41d4-a716-446655440000";

  it("formats verification URLs, short codes, and generates real PNG QR Data URLs", async () => {
    expect(getShortVerificationCode(sampleId)).toBe("VER-550E8400");
    expect(getLetterVerificationUrl(sampleId, "https://pmii.or.id/")).toBe(
      `https://pmii.or.id/verifikasi-surat/${sampleId}`
    );

    const qr = await generateLetterQrDataUrl(sampleId, "https://pmii.or.id");
    expect(qr.shortCode).toBe("VER-550E8400");
    expect(qr.verificationUrl).toBe(`https://pmii.or.id/verifikasi-surat/${sampleId}`);
    expect(qr.qrDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("builds HTML QR footer, upserts idempotently, and survives sanitizeLetterHtml intact", async () => {
    const qr = await generateLetterQrDataUrl(sampleId, "https://pmii.or.id");
    const footerHtml = buildHtmlQrFooter({
      letterId: sampleId,
      nomor: "001.PK-XI.Z-03.01.010.B-II.11.2026",
      qrDataUrl: qr.qrDataUrl,
      verificationUrl: qr.verificationUrl,
      orgLabel: "KOMISARIAT AJISAKA",
    });

    expect(hasHtmlQrFooter(footerHtml)).toBe(true);
    expect(footerHtml).toContain("QR Verifikasi Surat");
    expect(footerHtml).not.toContain("DOKUMEN RESMI TERVERIFIKASI DIGITAL");
    expect(footerHtml).not.toContain("Pindai QR Code");
    expect(footerHtml).not.toContain("VER-550E8400");

    const combinedOnce = upsertHtmlQrFooter("<div>Isi Surat</div>", footerHtml);
    const updatedFooter = buildHtmlQrFooter({
      letterId: sampleId,
      nomor: "002.PK-XI.Z-03.01.010.B-II.11.2026",
      qrDataUrl: qr.qrDataUrl,
      verificationUrl: qr.verificationUrl,
      orgLabel: "KOMISARIAT AJISAKA",
    });
    const combinedTwice = upsertHtmlQrFooter(combinedOnce, updatedFooter);

    expect(combinedTwice.match(/letter-qr-footer/g)).toHaveLength(1);

    // Pastikan DOMPurify mempertahankan QR <img src="data:image/png;base64,..."> & <footer>
    const sanitized = sanitizeLetterHtml(combinedTwice, { preserveDocxLayout: true });
    expect(sanitized).toContain("<footer");
    expect(sanitized).toContain("letter-qr-footer");
    expect(sanitized).toContain("data:image/png;base64,");
    expect(sanitized).not.toContain("DOKUMEN RESMI TERVERIFIKASI DIGITAL");
  });

  it("embeds QR verification footer into official PMII DOCX template (without prior footer & self-closing rels)", async () => {
    const officialPath = path.join(process.cwd(), "public/templates/template-surat-resmi-pmii.docx");
    const officialBuf = fs.readFileSync(officialPath);
    const officialArrayBuf = officialBuf.buffer.slice(
      officialBuf.byteOffset,
      officialBuf.byteOffset + officialBuf.byteLength
    );

    const qr = await generateLetterQrDataUrl(sampleId, "https://pmii.or.id");
    const filled = fillDocxTemplate(
      officialArrayBuf,
      {
        nomor_surat: "007.PK-XI.Z-03.01.010.B-II.11.2026",
        tujuan_surat: "Ketua Rayon Tarbiyah",
        perihal: "Undangan Rapat Kerja",
        kota_surat: "Purwodadi",
        tanggal_surat: "26 November 2026",
      },
      undefined,
      {
        qrDataUrl: qr.qrDataUrl,
        letterId: sampleId,
        nomor: "007.PK-XI.Z-03.01.010.B-II.11.2026",
        verificationUrl: qr.verificationUrl,
        orgLabel: "KOMISARIAT AJISAKA",
      }
    );

    expect(filled.error).toBeUndefined();
    const outZip = new PizZip(filled.arrayBuffer);

    expect(outZip.file("word/media/qr_verifikasi_surat.png")).toBeTruthy();
    const footerXml = outZip.file("word/footer_qr_verify.xml")?.asText() || "";
    expect(footerXml).toContain('r:embed="rIdQrVerifySurat"');
    expect(footerXml).toContain('name="QR Verifikasi Surat"');
    expect(footerXml).not.toContain("DOKUMEN RESMI TERVERIFIKASI DIGITAL");
    expect(footerXml).not.toContain("Pindai QR Code");
    expect(footerXml).not.toContain("VER-550E8400");

    const footerRels = outZip.file("word/_rels/footer_qr_verify.xml.rels")?.asText() || "";
    expect(footerRels).toContain('Target="media/qr_verifikasi_surat.png"');

    const docRels = outZip.file("word/_rels/document.xml.rels")?.asText() || "";
    expect(docRels).toContain('Id="rIdFooterQrVerify"');
    expect(docRels).toContain('Target="footer_qr_verify.xml"');
    expect(docRels).toContain("</Relationships>");

    const docXml = outZip.file("word/document.xml")?.asText() || "";
    expect(docXml).toContain('<w:footerReference w:type="default" r:id="rIdFooterQrVerify"/>');
    expect(docXml).toContain('w:footer="450"');

    const ctXml = outZip.file("[Content_Types].xml")?.asText() || "";
    expect(ctXml).toContain('Extension="png"');
    expect(ctXml).toContain('PartName="/word/footer_qr_verify.xml"');
  });

  it("appends QR verification block into existing DOCX footer while preserving original footer content", async () => {
    const bufWithFooter = createDocxWithExistingFooter();
    const qr = await generateLetterQrDataUrl(sampleId, "https://pmii.or.id");

    const filled = fillDocxTemplate(
      bufWithFooter,
      { nomor_surat: "008.PK-XI.2026" },
      undefined,
      {
        qrDataUrl: qr.qrDataUrl,
        letterId: sampleId,
        nomor: "008.PK-XI.2026",
        verificationUrl: qr.verificationUrl,
        orgLabel: "KOMISARIAT AJISAKA",
      }
    );

    expect(filled.error).toBeUndefined();
    const outZip = new PizZip(filled.arrayBuffer);

    const existingFooterXml = outZip.file("word/footer1.xml")?.asText() || "";
    expect(existingFooterXml).toContain("Footer Asli Komisariat");
    expect(existingFooterXml).toContain('r:embed="rIdQrVerifySurat"');
    expect(existingFooterXml).toContain("<w:tbl>");
    expect(existingFooterXml).toContain('<w:vAlign w:val="center"/>');
    expect(existingFooterXml).not.toContain("DOKUMEN RESMI TERVERIFIKASI DIGITAL");

    const footerRels = outZip.file("word/_rels/footer1.xml.rels")?.asText() || "";
    expect(footerRels).toContain('Target="media/qr_verifikasi_surat.png"');
  });
});

describe("Public API Route: GET /api/verify-surat", () => {
  const validId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    mockRpc.mockReset();
    mockServerFrom.mockReset();
    resetRateLimits();
  });

  it("rejects invalid UUIDs with HTTP 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/verify-surat?id=not-a-uuid");
    const res = await verifySuratGET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("returns verified metadata for valid outgoing letter UUIDs", async () => {
    mockRpc.mockResolvedValue({
      data: {
        valid: true,
        id: validId,
        nomor: "001.PK-XI.2026",
        subject: "Undangan Rapat Kerja",
        senderOrRecipient: "Ketua Rayon",
        classification: "Undangan",
        status: "Terkirim",
        dateIndo: "26 November 2026",
        commissariat: "Komisariat Ajisaka",
      },
      error: null,
    });

    const req = new NextRequest(`http://localhost:3000/api/verify-surat?id=${validId}`, {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });
    const res = await verifySuratGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.letter.nomor).toBe("001.PK-XI.2026");
    expect(mockRpc).toHaveBeenCalledWith("verify_surat_public", { p_id: validId });
  });

  it("returns valid: false when letter is not found or not an outgoing letter", async () => {
    mockRpc.mockResolvedValue({ data: { valid: false }, error: null });

    const req = new NextRequest(`http://localhost:3000/api/verify-surat?id=${validId}`, {
      headers: { "x-forwarded-for": "203.0.113.11" },
    });
    const res = await verifySuratGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(false);
  });

  it("falls back safely via authenticated server client when verify_surat_public RPC is missing from schema cache (PGRST202)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockRpc.mockResolvedValue({
      data: null,
      error: {
        code: "PGRST202",
        message: "Could not find the function public.verify_surat_public(p_id) in the schema cache",
      },
    });

    mockServerFrom.mockImplementation((table: string) => {
      if (table === "surat") {
        return {
          select: () => ({
            eq: () => ({
              ilike: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: validId,
                    nomor: "009.PK-XI.2026",
                    type: "KELUAR",
                    senderOrRecipient: "Pengurus Rayon Syariah",
                    subject: "Undangan Pelantikan",
                    date: "2026-11-26",
                    dateIndo: "26 November 2026",
                    classification: "Undangan",
                    status: "Terkirim",
                    senderTitle: "Ketua Komisariat",
                    senderLocation: "Purwodadi",
                    created_at: "2026-11-26T04:00:00Z",
                    tenant_id: "13aea81b-ca8c-43c2-b44f-7d70cdc11f7f",
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                name: "Komisariat Ki Ageng Getas Pendawa",
                level: "KOMISARIAT",
                type: "KOMISARIAT",
              },
              error: null,
            }),
          }),
        }),
      };
    });

    const req = new NextRequest(`http://localhost:3000/api/verify-surat?id=${validId}`, {
      headers: { "x-forwarded-for": "203.0.113.12" },
    });
    const res = await verifySuratGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.letter.nomor).toBe("009.PK-XI.2026");
    expect(body.letter.commissariat).toBe("Komisariat Ki Ageng Getas Pendawa");
    warnSpy.mockRestore();
  });
});
