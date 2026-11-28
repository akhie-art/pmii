import { describe, expect, it } from "vitest";
import PizZip from "pizzip";
import {
  buildDefaultOverlayPlacement,
  buildOverlayItemHtml,
  injectOverlaysIntoLetterHtml,
  isSafeOverlayDataUrl,
  MAX_OVERLAY_IMAGE_BYTES,
  normalizeOverlayItem,
  stripLetterOverlaysFromHtml,
  validateOverlayImageFile,
  type LetterImageOverlay,
} from "@/app/dashboard/surat/component/letter-overlay-helper";
import {
  embedLetterEditMetadata,
  extractLetterEditMetadata,
  stripLetterEditMetadata,
} from "@/app/dashboard/surat/component/letter-generator-helpers";
import {
  embedImageOverlaysInDocx,
  fillDocxTemplate,
} from "@/app/dashboard/surat/component/docx-template-helper";
import { buildDocxPrintStyleBlock } from "@/app/dashboard/surat/component/docx-preview-helper";
import { sanitizeLetterHtml } from "@/lib/sanitize";

// 1x1 transparent PNG valid base64
const SAMPLE_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function makeOverlay(overrides: Partial<LetterImageOverlay> = {}): LetterImageOverlay {
  return {
    id: "ov-ttd-1",
    kind: "signature",
    label: "TTD Ketua Komisariat",
    dataUrl: SAMPLE_PNG_DATA_URL,
    aspectRatio: 2.2,
    pageIndex: -1,
    xPct: 14,
    yPct: 72,
    widthPct: 22,
    rotation: 0,
    opacity: 1,
    transparentBg: true,
    ...overrides,
  };
}

function createMinimalDocxBuffer(bodyInnerXml = "<w:p><w:r><w:t>Halo {{nama}}</w:t></w:r></w:p>"): ArrayBuffer {
  const zip = new PizZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      "</Types>"
  );
  zip.file(
    "_rels/.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      "</Relationships>"
  );
  zip.file(
    "word/_rels/document.xml.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>'
  );
  zip.file(
    "word/document.xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      `<w:body>${bodyInnerXml}` +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr>' +
      "</w:body></w:document>"
  );
  return zip.generate({ type: "arraybuffer" });
}

describe("letter-overlay-helper: validasi & normalisasi TTD/Stempel", () => {
  it("menerima PNG/JPG/WEBP <= 5 MB dan menolak format tidak didukung atau melebihi batas", () => {
    expect(validateOverlayImageFile({ name: "ttd.png", size: 24_000, type: "image/png" })).toBeNull();
    expect(validateOverlayImageFile({ name: "stempel.jpg", size: 120_000, type: "image/jpeg" })).toBeNull();
    expect(validateOverlayImageFile({ name: "cap.webp", size: 80_000, type: "image/webp" })).toBeNull();

    expect(validateOverlayImageFile({ name: "empty.png", size: 0, type: "image/png" })).toMatch(/kosong/i);
    expect(
      validateOverlayImageFile({ name: "huge.png", size: MAX_OVERLAY_IMAGE_BYTES + 1, type: "image/png" })
    ).toMatch(/5 MB/i);
    expect(
      validateOverlayImageFile({ name: "payload.svg", size: 1024, type: "image/svg+xml" })
    ).toMatch(/tidak didukung/i);
    expect(
      validateOverlayImageFile({ name: "dokumen.pdf", size: 5000, type: "application/pdf" })
    ).toMatch(/tidak didukung/i);
  });

  it("memblokir data URL berbahaya (SVG/javascript) dan melakukan clamping koordinat", () => {
    expect(isSafeOverlayDataUrl(SAMPLE_PNG_DATA_URL)).toBe(true);
    expect(isSafeOverlayDataUrl("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBe(false);
    expect(isSafeOverlayDataUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeOverlayDataUrl("https://evil.example/ttd.png")).toBe(false);

    expect(normalizeOverlayItem({ dataUrl: "data:image/svg+xml;base64,AAAA" })).toBeNull();

    const normalized = normalizeOverlayItem({
      id: "ov-1",
      kind: "stamp",
      label: "  Stempel Cabang  ",
      dataUrl: SAMPLE_PNG_DATA_URL,
      xPct: -20,
      yPct: 180,
      widthPct: 200,
      rotation: 99,
      opacity: 0.05,
      aspectRatio: 0.01,
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.label).toBe("Stempel Cabang");
    expect(normalized?.xPct).toBe(0);
    expect(normalized?.yPct).toBe(95);
    expect(normalized?.widthPct).toBe(65);
    expect(normalized?.rotation).toBe(45);
    expect(normalized?.opacity).toBe(0.3);
    expect(normalized?.aspectRatio).toBe(0.2);
  });

  it("menghitung slot posisi awal berbeda untuk beberapa TTD & Stempel agar tidak saling menimpa", () => {
    const ttd1 = buildDefaultOverlayPlacement("signature", []);
    const ttd2 = buildDefaultOverlayPlacement("signature", [makeOverlay({ id: "s1", kind: "signature" })]);
    const stamp1 = buildDefaultOverlayPlacement("stamp", [makeOverlay({ id: "s1", kind: "signature" })]);

    expect(ttd1.xPct).not.toBe(ttd2.xPct);
    expect(ttd1.pageIndex).toBe(-1);
    expect(stamp1.rotation).toBe(-4);
    expect(stamp1.opacity).toBeLessThan(1);
  });
});

describe("letter-overlay-helper: injeksi HTML, sanitasi, & strip mode edit", () => {
  it("menyisipkan overlay pada halaman terakhir (pageIndex=-1) dan halaman spesifik di HTML docx multi-halaman", () => {
    const multiPageHtml =
      '<div class="docx-wrapper">' +
      '<section class="docx" style="width:794px;min-height:1123px;"><p>Halaman 1</p></section>' +
      '<section class="docx" style="width:794px;min-height:1123px;"><p>Halaman 2</p></section>' +
      "</div>";

    const overlays: LetterImageOverlay[] = [
      makeOverlay({ id: "ov-p1", kind: "signature", label: "Paraf Hal 1", pageIndex: 0, xPct: 75, yPct: 85 }),
      makeOverlay({ id: "ov-last", kind: "stamp", label: "Stempel Resmi", pageIndex: -1, xPct: 36, yPct: 70, rotation: -5 }),
    ];

    const injected = injectOverlaysIntoLetterHtml(multiPageHtml, overlays);
    const sections = injected.match(/<section\b[^>]*>[\s\S]*?<\/section>/gi) || [];

    expect(sections).toHaveLength(2);
    expect(sections[0]).toContain("position:relative;");
    expect(sections[0]).toContain('data-letter-overlay="ov-p1"');
    expect(sections[0]).not.toContain('data-letter-overlay="ov-last"');

    expect(sections[1]).toContain("position:relative;");
    expect(sections[1]).toContain('data-letter-overlay="ov-last"');
    expect(sections[1]).toContain("rotate(-5deg)");
  });

  it("bertahan utuh setelah melewati sanitizeLetterHtml dan dapat dibersihkan total saat masuk mode edit", () => {
    const docxHtml =
      '<div class="docx-wrapper"><section class="docx"><p>Isi Surat Resmi</p></section></div>';
    const overlay = makeOverlay({ id: "ov-safe-1", label: "TTD Ketua" });

    const injected = injectOverlaysIntoLetterHtml(docxHtml, [overlay]);
    const sanitized = sanitizeLetterHtml(injected, { preserveDocxLayout: true });

    expect(sanitized).toContain("pmii-letter-overlay-item");
    expect(sanitized).toContain('data-letter-overlay="ov-safe-1"');
    expect(sanitized).toContain(SAMPLE_PNG_DATA_URL);

    const stripped = stripLetterOverlaysFromHtml(sanitized);
    expect(stripped).not.toContain("pmii-letter-overlay-item");
    expect(stripped).toContain("Isi Surat Resmi");
  });

  it("melakukan unwrap .pmii-letter-overlay-host secara bersih untuk dokumen HTML non-DOCX", () => {
    const plainHtml = "<div class='surat-body'><p>Undangan Rapat</p></div>";
    const injected = injectOverlaysIntoLetterHtml(plainHtml, [makeOverlay()]);
    expect(injected).toContain("pmii-letter-overlay-host");
    expect(injected).toContain("pmii-letter-overlay-item");

    const stripped = stripLetterOverlaysFromHtml(injected);
    expect(stripped).toBe(plainHtml);
  });

  it("menghindari XSS pada atribut alt/id overlay dan menyertakan CSS cetak .pmii-letter-overlay-item", () => {
    const html = buildOverlayItemHtml(
      makeOverlay({ id: 'ov-"xss"', label: 'TTD <script>alert(1)</script>' })
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");

    const printCss = buildDocxPrintStyleBlock('<section class="docx"></section>');
    expect(printCss).toContain(".pmii-letter-overlay-item");
    expect(printCss).toContain("position: relative !important;");
  });
});

describe("letter-generator-helpers: round-trip metadata revisi dengan overlays", () => {
  it("menyimpan dan memulihkan array overlays pada LetterEditMetadata termasuk tanpa templateId", () => {
    const overlay = makeOverlay({ id: "ov-rev-1", kind: "stamp", label: "Stempel PC", xPct: 40, yPct: 68 });
    const baseHtml = "<p>Surat Keputusan</p>";

    const embedded = embedLetterEditMetadata(baseHtml, {
      v: 1,
      templateId: "",
      docxValues: { nomor: "001/PC" },
      overlays: [overlay],
    });

    const extracted = extractLetterEditMetadata(embedded);
    expect(extracted).not.toBeNull();
    expect(extracted?.overlays).toHaveLength(1);
    expect(extracted?.overlays?.[0].id).toBe("ov-rev-1");
    expect(extracted?.overlays?.[0].label).toBe("Stempel PC");
    expect(extracted?.overlays?.[0].xPct).toBe(40);
    expect(stripLetterEditMetadata(embedded)).toBe(baseHtml);
  });
});

describe("docx-template-helper: embed floating DrawingML TTD & Stempel pada berkas .docx", () => {
  it("menyematkan media PNG, relasi, content-type, dan wp:anchor relativeFrom=page tanpa merusak paragraf", () => {
    const buffer = createMinimalDocxBuffer();
    const overlays = [
      makeOverlay({ id: "ov-ttd", kind: "signature", label: "TTD Ketua", xPct: 15, yPct: 72, widthPct: 22, rotation: 0 }),
      makeOverlay({ id: "ov-cap", kind: "stamp", label: "Stempel PMII", xPct: 36, yPct: 68, widthPct: 20, rotation: -6 }),
    ];

    const { arrayBuffer, error } = fillDocxTemplate(
      buffer,
      { nama: "Sahabat Ahmad" },
      undefined,
      undefined,
      overlays
    );

    expect(error).toBeUndefined();
    const outZip = new PizZip(arrayBuffer);

    expect(outZip.file("word/media/letter_overlay_1.png")).not.toBeNull();
    expect(outZip.file("word/media/letter_overlay_2.png")).not.toBeNull();

    const relsXml = outZip.file("word/_rels/document.xml.rels")?.asText() || "";
    expect(relsXml).toContain('Id="rIdLetterOverlay1"');
    expect(relsXml).toContain('Target="media/letter_overlay_1.png"');
    expect(relsXml).toContain('Id="rIdLetterOverlay2"');

    const ctXml = outZip.file("[Content_Types].xml")?.asText() || "";
    expect(ctXml).toContain('Extension="png"');
    expect(ctXml).toContain('ContentType="image/png"');

    const docXml = outZip.file("word/document.xml")?.asText() || "";
    expect(docXml).toContain("Halo Sahabat Ahmad");
    expect(docXml).toContain('<wp:positionH relativeFrom="page">');
    expect(docXml).toContain('<wp:positionV relativeFrom="page">');
    expect(docXml).toContain('r:embed="rIdLetterOverlay1"');
    expect(docXml).toContain('r:embed="rIdLetterOverlay2"');
    expect(docXml).toContain('rot="-360000"'); // -6 * 60000
  });

  it("aman terhadap array overlay kosong pada embedImageOverlaysInDocx", () => {
    const zip = new PizZip(createMinimalDocxBuffer());
    const before = zip.file("word/document.xml")?.asText();
    embedImageOverlaysInDocx(zip, []);
    expect(zip.file("word/document.xml")?.asText()).toBe(before);
  });
});
