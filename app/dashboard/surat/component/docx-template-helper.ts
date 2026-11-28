"use client";

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Konversi ArrayBuffer ke Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof window !== "undefined" ? window.btoa(binary) : Buffer.from(binary, "binary").toString("base64");
}

/**
 * Konversi Base64 string ke ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString =
    typeof window !== "undefined"
      ? window.atob(base64)
      : Buffer.from(base64, "base64").toString("binary");
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Membersihkan tag internal XML Microsoft Word yang sering memecah placeholder
 * Contoh: Word sering menyisipkan <w:proofErr w:type="spellStart"/> atau <w:lang/>
 * di tengah kata "{{nama}}" yang menyebabkan docxtemplater gagal mendeteksi atau mengisi tag.
 */
export function cleanDocxXml(zip: PizZip): PizZip {
  try {
    const xmlFiles = Object.keys(zip.files).filter(
      (path) =>
        path === "word/document.xml" ||
        path.startsWith("word/header") ||
        path.startsWith("word/footer")
    );

    for (const fileName of xmlFiles) {
      const file = zip.file(fileName);
      if (!file) continue;
      const content = file.asText();
      if (!content) continue;

      // Hapus tag proofing error, noProof, dan markup bahasa yang memecah run teks
      const cleaned = content
        .replace(/<w:proofErr[^>]*\/>/g, "")
        .replace(/<w:noProof\/>/g, "")
        .replace(/<w:lang[^>]*\/>/g, "");

      zip.file(fileName, cleaned);
    }
  } catch (err) {
    console.warn("Gagal normalisasi XML Word:", err);
  }
  return zip;
}

export const OFFICIAL_PMII_TEMPLATE_URL = "/templates/template-surat-resmi-pmii.docx";

/**
 * Ekstrak seluruh placeholder {{...}} dari dokumen Word (.docx)
 * Menggunakan pendekatan yang sama persis seperti file Pengisi Template DOCX (1).html
 */
export function extractDocxPlaceholders(arrayBuffer: ArrayBuffer): {
  keys: string[];
  fullText: string;
  error?: string;
} {
  try {
    const rawZip = new PizZip(arrayBuffer);
    const zip = cleanDocxXml(rawZip);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: "{{", end: "}}" },
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => ""
    });

    const fullText = doc.getFullText();
    const regex = /\{\{\s*([^{}#\/^]+?)\s*\}\}/g;
    const keys: string[] = [];
    const seen = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = regex.exec(fullText)) !== null) {
      const key = match[1].trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }

    return { keys, fullText };
  } catch (err: any) {
    const properties = err?.properties?.errors;
    let msg = err?.message || "Format dokumen Word tidak valid";
    if (properties && Array.isArray(properties) && properties.length > 0) {
      msg = properties.map((p: any) => p.properties?.explanation || p.message).join(" | ");
    }
    return { keys: [], fullText: "", error: msg };
  }
}

export interface DocxQrFooterOptions {
  qrDataUrl: string;
  letterId: string;
  nomor?: string;
  verificationUrl: string;
  orgLabel?: string;
}

export interface DocxImageOverlayInput {
  id: string;
  label: string;
  dataUrl: string;
  aspectRatio: number;
  xPct: number;
  yPct: number;
  widthPct: number;
  rotation?: number;
}

function appendRelationshipXml(relsXml: string, relationshipTag: string): string {
  if (/<Relationships\b[^>]*\/>/.test(relsXml)) {
    return relsXml.replace(
      /<Relationships([^>]*)\/>/,
      `<Relationships$1>${relationshipTag}</Relationships>`
    );
  }
  if (relsXml.includes("</Relationships>")) {
    return relsXml.replace("</Relationships>", `${relationshipTag}</Relationships>`);
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationshipTag}</Relationships>`;
}

function ensureFooterNamespaces(ftrXml: string): string {
  let out = ftrXml;
  const nsList: Array<[string, string]> = [
    ["xmlns:r", "http://schemas.openxmlformats.org/officeDocument/2006/relationships"],
    ["xmlns:wp", "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"],
    ["xmlns:a", "http://schemas.openxmlformats.org/drawingml/2006/main"],
    ["xmlns:pic", "http://schemas.openxmlformats.org/drawingml/2006/picture"],
  ];
  for (const [attr, uri] of nsList) {
    if (!out.includes(`${attr}=`)) {
      out = out.replace("<w:ftr", `<w:ftr ${attr}="${uri}"`);
    }
  }
  return out;
}

function buildDocxQrDrawingXml(relId: string, sizeEmu = 522000): string {
  // Ukuran QR Code ~1.45 cm x 1.45 cm (522000 EMU), bersih tanpa teks tambahan
  return (
    `<w:drawing>` +
    `<wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${sizeEmu}" cy="${sizeEmu}"/>` +
    `<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="9012041" name="QR Verifikasi Surat"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic>` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic>` +
    `<pic:nvPicPr><pic:cNvPr id="9012041" name="qr_verifikasi_surat.png"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${sizeEmu}" cy="${sizeEmu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic>` +
    `</a:graphicData>` +
    `</a:graphic>` +
    `</wp:inline>` +
    `</w:drawing>`
  );
}

function buildDocxQrFooterXml(relId: string): string {
  const qrDrawingXml = buildDocxQrDrawingXml(relId, 576000);
  return `<w:p><w:pPr><w:jc w:val="left"/><w:spacing w:before="40" w:after="0"/></w:pPr><w:r>${qrDrawingXml}</w:r></w:p>`;
}

/**
 * Menempatkan QR Code sejajar di sisi kiri dan konten footer asli tetap tepat di tengah halaman
 * menggunakan tabel simetris 3 kolom tanpa garis (18% QR | 64% Footer Asli | 18% Penyeimbang)
 * sehingga tidak menambah tinggi vertikal footer maupun mendorong teks motto ke atas.
 */
function buildSideBySideQrFooterTableXml(relId: string, existingInnerXml: string): string {
  const qrDrawingXml = buildDocxQrDrawingXml(relId, 522000);
  const noBorders =
    `<w:tblBorders>` +
    `<w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `<w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `<w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `<w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `<w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `<w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `</w:tblBorders>`;
  const zeroMar =
    `<w:tblCellMar>` +
    `<w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/>` +
    `<w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/>` +
    `</w:tblCellMar>`;

  return (
    `<w:tbl>` +
    `<w:tblPr><w:tblW w:w="5000" w:type="pct"/>${noBorders}${zeroMar}<w:tblLayout w:type="fixed"/></w:tblPr>` +
    `<w:tr>` +
    `<w:tc><w:tcPr><w:tcW w:w="900" w:type="pct"/><w:vAlign w:val="center"/></w:tcPr>` +
    `<w:p><w:pPr><w:jc w:val="left"/><w:spacing w:before="0" w:after="0"/></w:pPr><w:r>${qrDrawingXml}</w:r></w:p>` +
    `</w:tc>` +
    `<w:tc><w:tcPr><w:tcW w:w="3200" w:type="pct"/><w:vAlign w:val="center"/></w:tcPr>` +
    `${existingInnerXml}` +
    `</w:tc>` +
    `<w:tc><w:tcPr><w:tcW w:w="900" w:type="pct"/><w:vAlign w:val="center"/></w:tcPr>` +
    `<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr></w:p>` +
    `</w:tc>` +
    `</w:tr>` +
    `</w:tbl>`
  );
}

/**
 * Menyematkan QR Code verifikasi ke bagian footer dokumen Word (.docx)
 * baik ke footer yang sudah ada maupun membuat footer baru jika template belum memilikinya.
 */
export function embedQrFooterInDocx(zip: PizZip, opts: DocxQrFooterOptions): PizZip {
  try {
    if (!opts?.qrDataUrl) return zip;

    const cleanBase64 = opts.qrDataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
    const qrBinary = base64ToArrayBuffer(cleanBase64);
    zip.file("word/media/qr_verifikasi_surat.png", qrBinary);

    // 1. Pastikan Content-Type untuk .png terdaftar di [Content_Types].xml
    const ctFile = zip.file("[Content_Types].xml");
    let ctXml = ctFile ? ctFile.asText() : "";
    if (ctXml && !/Extension="png"/i.test(ctXml)) {
      ctXml = ctXml.replace("</Types>", '<Default Extension="png" ContentType="image/png"/></Types>');
      zip.file("[Content_Types].xml", ctXml);
    }

    const qrRelId = "rIdQrVerifySurat";
    const qrRelTag = `<Relationship Id="${qrRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/qr_verifikasi_surat.png"/>`;
    const qrFooterXml = buildDocxQrFooterXml(qrRelId);

    const docFile = zip.file("word/document.xml");
    if (!docFile) return zip;
    let docXml = docFile.asText();

    const docRelsPath = "word/_rels/document.xml.rels";
    const docRelsFile = zip.file(docRelsPath);
    let docRelsXml = docRelsFile
      ? docRelsFile.asText()
      : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>';

    const attachQrToExistingFooter = (footerTarget: string): boolean => {
      const normalizedPath = footerTarget.startsWith("word/")
        ? footerTarget
        : `word/${footerTarget.replace(/^\/+/, "")}`;
      const ftrFile = zip.file(normalizedPath);
      if (!ftrFile) return false;

      let ftrXml = ensureFooterNamespaces(ftrFile.asText());
      if (ftrXml.includes('name="QR Verifikasi Surat"')) {
        return true;
      }
      if (ftrXml.includes("</w:ftr>")) {
        const ftrMatch = ftrXml.match(/(<w:ftr\b[^>]*>)([\s\S]*)(<\/w:ftr>)/);
        const existingInner = ftrMatch?.[2]?.trim() || "";
        const hasVisibleExistingContent =
          /<w:t\b[^>]*>[^<]*\S[^<]*<\/w:t>|<w:drawing\b|<w:pict\b|<w:tbl\b/.test(existingInner);

        if (ftrMatch && hasVisibleExistingContent && !/<w:tbl\b/.test(existingInner)) {
          const sideBySideTable = buildSideBySideQrFooterTableXml(qrRelId, existingInner);
          ftrXml = ftrXml.replace(ftrMatch[0], `${ftrMatch[1]}${sideBySideTable}${ftrMatch[3]}`);
        } else {
          ftrXml = ftrXml.replace("</w:ftr>", `${qrFooterXml}</w:ftr>`);
        }
        zip.file(normalizedPath, ftrXml);
      }

      const footerFileName = normalizedPath.split("/").pop() || "footer1.xml";
      const footerRelsPath = `word/_rels/${footerFileName}.rels`;
      const existingFtrRels = zip.file(footerRelsPath)?.asText() ||
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>';
      if (!existingFtrRels.includes(`Id="${qrRelId}"`)) {
        zip.file(footerRelsPath, appendRelationshipXml(existingFtrRels, qrRelTag));
      }
      return true;
    };

    // Cari referensi footer yang sudah ada di word/document.xml
    const footerRefMatches = Array.from(
      docXml.matchAll(/<w:footerReference\b[^>]*w:type="([^"]+)"[^>]*r:id="([^"]+)"[^>]*\/>/g)
    );
    const defaultFooterRef = footerRefMatches.find((m) => m[1] === "default");
    const firstFooterRef = footerRefMatches.find((m) => m[1] === "first");

    const resolveTargetByRelId = (relId: string): string | null => {
      const regex = new RegExp(`<Relationship\\b[^>]*Id="${relId}"[^>]*Target="([^"]+)"`, "i");
      const m = docRelsXml.match(regex);
      if (m?.[1]) return m[1];
      const regexRev = new RegExp(`<Relationship\\b[^>]*Target="([^"]+)"[^>]*Id="${relId}"`, "i");
      return docRelsXml.match(regexRev)?.[1] || null;
    };

    let attachedDefault = false;
    if (defaultFooterRef?.[2]) {
      const target = resolveTargetByRelId(defaultFooterRef[2]);
      if (target) {
        attachedDefault = attachQrToExistingFooter(target);
      }
    }
    if (firstFooterRef?.[2]) {
      const target = resolveTargetByRelId(firstFooterRef[2]);
      if (target) {
        attachQrToExistingFooter(target);
      }
    }

    // Jika template belum punya footer default, buat word/footer_qr_verify.xml baru
    if (!attachedDefault) {
      const footerName = "footer_qr_verify.xml";
      const footerRelId = "rIdFooterQrVerify";
      const newFooterXml =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ` +
        `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
        `xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ` +
        `xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
        `xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
        `${qrFooterXml}` +
        `</w:ftr>`;

      zip.file(`word/${footerName}`, newFooterXml);
      zip.file(
        `word/_rels/${footerName}.rels`,
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${qrRelTag}</Relationships>`
      );

      if (!docRelsXml.includes(`Id="${footerRelId}"`)) {
        const footerRelTag = `<Relationship Id="${footerRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="${footerName}"/>`;
        docRelsXml = appendRelationshipXml(docRelsXml, footerRelTag);
        zip.file(docRelsPath, docRelsXml);
      }

      if (ctXml && !ctXml.includes(`/word/${footerName}`)) {
        ctXml = ctXml.replace(
          "</Types>",
          `<Override PartName="/word/${footerName}" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`
        );
        zip.file("[Content_Types].xml", ctXml);
      }

      if (!docXml.includes("xmlns:r=")) {
        docXml = docXml.replace(
          "<w:document ",
          '<w:document xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        );
      }

      const needsFirstRef = docXml.includes("<w:titlePg") && !firstFooterRef;
      const footerRefsXml =
        `<w:footerReference w:type="default" r:id="${footerRelId}"/>` +
        (needsFirstRef ? `<w:footerReference w:type="first" r:id="${footerRelId}"/>` : "");

      const lastSectIdx = docXml.lastIndexOf("<w:sectPr");
      if (lastSectIdx !== -1) {
        const sectTagEnd = docXml.indexOf(">", lastSectIdx);
        if (sectTagEnd !== -1) {
          docXml =
            docXml.slice(0, sectTagEnd + 1) +
            footerRefsXml +
            docXml.slice(sectTagEnd + 1);
        }
        // Pastikan w:pgMar memiliki jarak footer agar footer tampil rapi di bawah
        const sectCloseIdx = docXml.indexOf("</w:sectPr>", lastSectIdx);
        if (sectCloseIdx !== -1) {
          const sectSlice = docXml.slice(lastSectIdx, sectCloseIdx);
          if (sectSlice.includes("<w:pgMar") && !sectSlice.includes("w:footer=")) {
            const updatedSect = sectSlice.replace(
              /<w:pgMar([^>]*)\/>/,
              '<w:pgMar$1 w:footer="450"/>'
            );
            docXml = docXml.slice(0, lastSectIdx) + updatedSect + docXml.slice(sectCloseIdx);
          }
        }
      } else if (docXml.includes("</w:body>")) {
        docXml = docXml.replace(
          "</w:body>",
          `<w:sectPr>${footerRefsXml}<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:footer="450"/></w:sectPr></w:body>`
        );
      }

      zip.file("word/document.xml", docXml);
    }
  } catch (err) {
    console.warn("Gagal menyematkan QR Code verifikasi ke footer DOCX:", err);
  }
  return zip;
}

/**
 * Menyematkan gambar tanda tangan & stempel organisasi ke dalam dokumen Word (.docx)
 * sebagai floating DrawingML anchor (`<wp:anchor relativeFrom="page">`) agar posisi
 * sesuai persis dengan kanvas tanpa mendorong paragraf / mengubah jarak baris surat.
 */
export function embedImageOverlaysInDocx(
  zip: PizZip,
  overlays: DocxImageOverlayInput[]
): PizZip {
  try {
    if (!Array.isArray(overlays) || overlays.length === 0) return zip;
    const docFile = zip.file("word/document.xml");
    if (!docFile) return zip;
    let docXml = docFile.asText();

    // Hitung ukuran halaman Word dalam EMU dari <w:pgSz> (1 twip = 635 EMU)
    const pgSzMatch = docXml.match(/<w:pgSz\b[^>]*>/i)?.[0] || "";
    const wTwips = parseInt(pgSzMatch.match(/\bw:w="(\d+)"/i)?.[1] || "11906", 10) || 11906;
    const hTwips = parseInt(pgSzMatch.match(/\bw:h="(\d+)"/i)?.[1] || "16838", 10) || 16838;
    const pageWidthEmu = wTwips * 635;
    const pageHeightEmu = hTwips * 635;

    const ctFile = zip.file("[Content_Types].xml");
    let ctXml = ctFile ? ctFile.asText() : "";
    const docRelsPath = "word/_rels/document.xml.rels";
    let docRelsXml =
      zip.file(docRelsPath)?.asText() ||
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>';

    const ensureDocNs: Array<[string, string]> = [
      ["xmlns:r", "http://schemas.openxmlformats.org/officeDocument/2006/relationships"],
      ["xmlns:wp", "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"],
      ["xmlns:a", "http://schemas.openxmlformats.org/drawingml/2006/main"],
      ["xmlns:pic", "http://schemas.openxmlformats.org/drawingml/2006/picture"],
    ];
    for (const [attr, uri] of ensureDocNs) {
      if (!docXml.includes(`${attr}=`)) {
        docXml = docXml.replace("<w:document", `<w:document ${attr}="${uri}"`);
      }
    }

    const anchorRuns: string[] = [];

    overlays.forEach((ov, idx) => {
      if (!ov?.dataUrl || !ov.dataUrl.startsWith("data:image/")) return;
      const mimeMatch = ov.dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!mimeMatch) return;
      const rawFmt = mimeMatch[1].toLowerCase();
      const ext = rawFmt === "jpeg" ? "jpg" : rawFmt;
      const contentType =
        ext === "jpg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";

      const binary = base64ToArrayBuffer(mimeMatch[2]);
      const mediaFileName = `letter_overlay_${idx + 1}.${ext}`;
      zip.file(`word/media/${mediaFileName}`, binary);

      if (ctXml && !new RegExp(`Extension="${ext}"`, "i").test(ctXml)) {
        ctXml = ctXml.replace(
          "</Types>",
          `<Default Extension="${ext}" ContentType="${contentType}"/></Types>`
        );
      }

      const relId = `rIdLetterOverlay${idx + 1}`;
      if (!docRelsXml.includes(`Id="${relId}"`)) {
        const relTag = `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${mediaFileName}"/>`;
        docRelsXml = appendRelationshipXml(docRelsXml, relTag);
      }

      const xPct = Math.min(95, Math.max(0, Number(ov.xPct) || 0));
      const yPct = Math.min(95, Math.max(0, Number(ov.yPct) || 0));
      const widthPct = Math.min(65, Math.max(5, Number(ov.widthPct) || 20));
      const ratio = Math.min(6, Math.max(0.2, Number(ov.aspectRatio) || 1.5));

      const posXEmu = Math.round((xPct / 100) * pageWidthEmu);
      const posYEmu = Math.round((yPct / 100) * pageHeightEmu);
      const cx = Math.round((widthPct / 100) * pageWidthEmu);
      const cy = Math.round(cx / ratio);
      const rotVal = Math.round((Number(ov.rotation) || 0) * 60000);
      const docPrId = 9020001 + idx;
      const safeName = String(ov.label || `TTD_Stempel_${idx + 1}`).replace(/["'<>&]/g, "");

      const drawingXml =
        `<w:drawing>` +
        `<wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${251660000 + idx}" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">` +
        `<wp:simplePos x="0" y="0"/>` +
        `<wp:positionH relativeFrom="page"><wp:posOffset>${posXEmu}</wp:posOffset></wp:positionH>` +
        `<wp:positionV relativeFrom="page"><wp:posOffset>${posYEmu}</wp:posOffset></wp:positionV>` +
        `<wp:extent cx="${cx}" cy="${cy}"/>` +
        `<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
        `<wp:wrapNone/>` +
        `<wp:docPr id="${docPrId}" name="${safeName}"/>` +
        `<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
        `<a:graphic>` +
        `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
        `<pic:pic>` +
        `<pic:nvPicPr><pic:cNvPr id="${docPrId}" name="${mediaFileName}"/><pic:cNvPicPr/></pic:nvPicPr>` +
        `<pic:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
        `<pic:spPr><a:xfrm${rotVal !== 0 ? ` rot="${rotVal}"` : ""}><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
        `</pic:pic>` +
        `</a:graphicData>` +
        `</a:graphic>` +
        `</wp:anchor>` +
        `</w:drawing>`;

      anchorRuns.push(`<w:r>${drawingXml}</w:r>`);
    });

    if (anchorRuns.length === 0) return zip;

    if (ctXml) zip.file("[Content_Types].xml", ctXml);
    zip.file(docRelsPath, docRelsXml);

    // Sematkan floating anchor ke dalam paragraf terakhir (sebelum </w:p> terakhir) agar tidak menambah baris baru
    const lastParagraphClose = docXml.lastIndexOf("</w:p>");
    if (lastParagraphClose !== -1) {
      docXml =
        docXml.slice(0, lastParagraphClose) +
        anchorRuns.join("") +
        docXml.slice(lastParagraphClose);
    } else if (docXml.includes("<w:sectPr")) {
      const sectIdx = docXml.lastIndexOf("<w:sectPr");
      docXml =
        docXml.slice(0, sectIdx) +
        `<w:p>${anchorRuns.join("")}</w:p>` +
        docXml.slice(sectIdx);
    }

    zip.file("word/document.xml", docXml);
  } catch (err) {
    console.warn("Gagal menyematkan overlay TTD/Stempel ke DOCX:", err);
  }
  return zip;
}

/**
 * Isi template DOCX dengan data placeholder menggunakan docxtemplater + PizZip
 * Format asli dokumen (font, margin, header, footer, tabel) tetap 100% utuh!
 */
export function fillDocxTemplate(
  arrayBuffer: ArrayBuffer,
  data: Record<string, any>,
  photoBase64?: string,
  qrFooter?: DocxQrFooterOptions,
  imageOverlays?: DocxImageOverlayInput[]
): {
  blob: Blob;
  arrayBuffer: ArrayBuffer;
  error?: string;
} {
  try {
    const rawZip = new PizZip(arrayBuffer);
    const zip = cleanDocxXml(rawZip);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: "{{", end: "}}" },
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => ""
    });

    // Render data ke dalam dokumen docx
    doc.render(data);

    const outZip = doc.getZip();

    // Jika ada foto kader, sematkan ke dalam shape foto dokumen Word (.docx)
    if (photoBase64) {
      try {
        const cleanBase64 = photoBase64.replace(/^data:image\/[a-z]+;base64,/, "");
        const photoBinary = base64ToArrayBuffer(cleanBase64);
        outZip.file("word/media/member_photo.jpg", photoBinary);

        // 1. Tambahkan relasi di word/_rels/document.xml.rels
        const relsFile = outZip.file("word/_rels/document.xml.rels");
        if (relsFile) {
          let relsXml = relsFile.asText();
          if (!relsXml.includes('Id="rIdMemberPhoto"')) {
            relsXml = relsXml.replace(
              "</Relationships>",
              '<Relationship Id="rIdMemberPhoto" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/member_photo.jpg"/></Relationships>'
            );
            outZip.file("word/_rels/document.xml.rels", relsXml);
          }
        }

        // 2. Tambahkan content type jpg di [Content_Types].xml jika belum ada
        const ctFile = outZip.file("[Content_Types].xml");
        if (ctFile) {
          let ctXml = ctFile.asText();
          if (!ctXml.includes('Extension="jpg"')) {
            ctXml = ctXml.replace(
              "</Types>",
              '<Default Extension="jpg" ContentType="image/jpeg"/></Types>'
            );
            outZip.file("[Content_Types].xml", ctXml);
          }
        }

        // 3. Modifikasi shape Foto 3x4 di word/document.xml
        const docFile = outZip.file("word/document.xml");
        if (docFile) {
          let docXml = docFile.asText();

          if (!docXml.includes("xmlns:r=")) {
            docXml = docXml.replace("<w:document ", '<w:document xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ');
          }
          if (!docXml.includes("xmlns:wp=")) {
            docXml = docXml.replace("<w:document ", '<w:document xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ');
          }
          if (!docXml.includes("xmlns:a=")) {
            docXml = docXml.replace("<w:document ", '<w:document xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ');
          }
          if (!docXml.includes("xmlns:pic=")) {
            docXml = docXml.replace("<w:document ", '<w:document xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" ');
          }

          const photoDrawing = `<w:drawing xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="1080000" cy="1440000"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1703607031" name="Pas Foto 3x4"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="1703607031" name="member_photo.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdMemberPhoto"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1080000" cy="1440000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:ln w="9525"><a:solidFill><a:srgbClr val="000000"/></a:solidFill></a:ln></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`;

          // 1. Cek apakah ada AlternateContent kotak teks Foto 3x4
          const alternateRegex = /<mc:AlternateContent>[\s\S]*?Foto 3x4[\s\S]*?<\/mc:AlternateContent>/g;
          if (alternateRegex.test(docXml)) {
            docXml = docXml.replace(alternateRegex, photoDrawing);
          }

          // 2. Cek apakah ada placeholder tag teks Foto 3x4 atau [Foto 3x4] atau {{foto}}
          const fotoTextRegex = /<w:r[^>]*>[\s\S]*?<w:t[^>]*>(?:Foto 3x4|\[Foto 3x4\]|\{\{foto\}\}|\{\{photo\}\})<\/w:t>[\s\S]*?<\/w:r>/g;
          if (fotoTextRegex.test(docXml)) {
            docXml = docXml.replace(fotoTextRegex, `<w:r>${photoDrawing}</w:r>`);
          }

          // 3. Fallback solidFill (jika ada shape drawingml lama)
          const solidFillRegex = /<a:solidFill><a:schemeClr val="lt1"\s*\/><\/a:solidFill>/g;
          const blipFill =
            '<a:blipFill><a:blip r:embed="rIdMemberPhoto"/><a:stretch><a:fillRect/></a:stretch></a:blipFill>';
          if (solidFillRegex.test(docXml)) {
            docXml = docXml.replace(solidFillRegex, blipFill);
          }

          // 4. Jika belum ada drawing pas foto sama sekali, sisipkan di bawah Motto Hidup di sebelah kiri
          if (!docXml.includes('r:embed="rIdMemberPhoto"')) {
            const mottoMatch = docXml.match(/(?:Motto\s*<\/w:t>[\s\S]*?Hidup|Motto\s*Hidup|\{\{motto\}\})/);
            if (mottoMatch && mottoMatch.index !== undefined) {
              const tblCloseIdx = docXml.indexOf("</w:tbl>", mottoMatch.index);
              if (tblCloseIdx !== -1) {
                const insertPos = tblCloseIdx + "</w:tbl>".length;
                const photoParagraph = `<w:p><w:pPr><w:jc w:val="left"/><w:spacing w:before="140" w:after="140"/></w:pPr><w:r>${photoDrawing}</w:r></w:p>`;
                docXml = docXml.slice(0, insertPos) + photoParagraph + docXml.slice(insertPos);
              }
            }
          }

          if (docXml.includes("<w:t>Foto 3x4</w:t>")) {
            docXml = docXml.replace("<w:t>Foto 3x4</w:t>", "<w:t></w:t>");
          }
          outZip.file("word/document.xml", docXml);
        }
      } catch (err) {
        console.warn("Gagal menyematkan foto ke Word template:", err);
      }
    }

    // Jika ada QR Code verifikasi surat keluar, sematkan ke footer dokumen Word (.docx)
    if (qrFooter?.qrDataUrl) {
      embedQrFooterInDocx(outZip, qrFooter);
    }

    // Jika ada gambar TTD / Stempel organisasi, sematkan sebagai floating anchor di dokumen Word (.docx)
    if (imageOverlays && imageOverlays.length > 0) {
      embedImageOverlaysInDocx(outZip, imageOverlays);
    }

    const outBuffer = outZip.generate({
      type: "arraybuffer",
      mimeType: DOCX_MIME_TYPE
    });

    const blob = new Blob([outBuffer], { type: DOCX_MIME_TYPE });
    return { blob, arrayBuffer: outBuffer };
  } catch (err: any) {
    console.error("Gagal mengisi template docx:", err);
    const properties = err?.properties?.errors;
    let msg = err?.message || "Gagal mengisi data template";
    if (properties && Array.isArray(properties) && properties.length > 0) {
      msg = properties.map((p: any) => p.properties?.explanation || p.message).join(" | ");
    }
    return {
      blob: new Blob([], { type: DOCX_MIME_TYPE }),
      arrayBuffer: new ArrayBuffer(0),
      error: msg
    };
  }
}

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { uploadPrivateDocument, resolveStorageUrl, PRIVATE_DOC_MAX_BYTES } from "@/lib/storage";

/**
 * Format ukuran berkas (bytes ke KB/MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Unggah dokumen persuratan (lampiran & master template) ke bucket privat 'private-docs'
 * dengan isolasi path tenant (<tenantId>/surat/...) tanpa fallback ke bucket publik.
 * Mengembalikan referensi storage kanonik (`private-docs/...`) untuk dibuka lewat Signed URL.
 */
export async function uploadFileToStorage(
  file: File | Blob,
  folder: "surat-templates" | "surat-attachments",
  originalName: string,
  tenantId?: string | null
): Promise<{ url: string; signedUrl?: string; path: string; sizeFormatted: string } | null> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("Supabase tidak terkonfigurasi, unggah storage dilewati.");
    return null;
  }

  try {
    const fileSize = file instanceof File ? file.size : (file as Blob).size;
    if (fileSize > PRIVATE_DOC_MAX_BYTES) {
      console.warn(`Ukuran dokumen persuratan (${formatBytes(fileSize)}) melebihi batas 10 MB.`);
      return null;
    }
    const uploadableFile =
      file instanceof File
        ? file
        : new File([file], originalName || "dokumen-surat.docx", {
            type: file.type || DOCX_MIME_TYPE
          });

    const uploaded = await uploadPrivateDocument(uploadableFile, {
      category: "surat",
      tenantId: tenantId || null,
      prefix: folder === "surat-templates" ? "template" : "lampiran",
      allowPublicFallback: false
    });

    if (!uploaded) {
      return null;
    }

    return {
      url: uploaded.storageRef,
      signedUrl: uploaded.signedUrl,
      path: uploaded.path,
      sizeFormatted: formatBytes(fileSize)
    };
  } catch (err) {
    console.error("Kesalahan saat mengunggah ke storage:", err);
    return null;
  }
}

/**
 * Mendapatkan ArrayBuffer dokumen .docx baik dari referensi private-docs (Signed URL),
 * URL Cloud Storage legacy, maupun Base64.
 */
export async function getDocxArrayBuffer(template: {
  fileUrl?: string;
  fileBase64?: string;
}): Promise<ArrayBuffer> {
  if (template.fileUrl) {
    try {
      const resolvedUrl = await resolveStorageUrl(template.fileUrl);
      if (resolvedUrl) {
        const res = await fetch(resolvedUrl);
        if (res.ok) {
          return await res.arrayBuffer();
        }
      }
    } catch (err) {
      console.warn("Gagal mengambil file DOCX dari fileUrl, mencoba fallback base64:", err);
    }
  }

  if (template.fileBase64) {
    return base64ToArrayBuffer(template.fileBase64);
  }

  throw new Error("Tidak ada sumber file DOCX (fileUrl atau fileBase64)");
}

/**
 * Serialisasi konten template: membungkus HTML preview, placeholders, dan fileUrl
 */
export function serializeTemplateContent(
  html: string,
  placeholders?: string[],
  fileUrl?: string
): string {
  if (fileUrl) {
    return JSON.stringify({
      isDocxTemplate: true,
      html,
      fileUrl,
      placeholders: placeholders || []
    });
  }
  return html;
}

/**
 * Deserialisasi konten template saat dimuat dari database
 */
export function parseTemplateContent(content: string): {
  html: string;
  fileBase64?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  placeholders?: string[];
  isDocxTemplate: boolean;
} {
  if (content && typeof content === "string" && content.trim().startsWith('{"isDocxTemplate":true')) {
    try {
      const parsed = JSON.parse(content);
      return {
        html: parsed.html || "",
        fileBase64: parsed.fileBase64,
        fileUrl: parsed.fileUrl,
        fileName: parsed.fileName,
        fileSize: parsed.fileSize,
        placeholders: Array.isArray(parsed.placeholders) ? parsed.placeholders : [],
        isDocxTemplate: true
      };
    } catch (e) {
      console.warn("Gagal parse template JSON, fallback ke raw HTML:", e);
    }
  }
  return {
    html: content || "",
    isDocxTemplate: false
  };
}

/**
 * Download file .docx langsung ke komputer pengguna
 */
export function downloadDocxBlob(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const cleanName = filename.toLowerCase().endsWith(".docx") ? filename : `${filename}.docx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = cleanName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

