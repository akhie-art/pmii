"use client";

import type { MailItem } from "./types";
import { sanitizeLetterHtml, escapeHtml } from "@/lib/sanitize";
import { resolveStorageUrl } from "@/lib/storage";
import {
  generateLetterQrDataUrl,
  buildHtmlQrFooter,
  hasHtmlQrFooter,
} from "./letter-qr-helper";
import { isFormattedHtmlContent } from "./letter-record-helper";
import {
  buildPrintFontContext,
  buildDocxPrintStyleBlock,
  extractDocxPrintMetrics,
} from "./docx-preview-helper";
import { stripLetterEditMetadata } from "./letter-generator-helpers";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * Perbaikan khusus bug terkenal `html2canvas` + Tailwind Preflight (`img { display: block }`):
 * `html2canvas` mengukur baseline font di `document.body` dengan menyisipkan
 * `<div><span>Hidden Text</span><img width="1" height="1" style="vertical-align:baseline"></div>`.
 * Saat Tailwind Preflight memaksa `img { display: block }`, `<img>` turun ke baris baru sehingga
 * `baseline` terhitung ~2x lipat dan seluruh teks PDF turun ~8–10px menabrak garis kop/underline.
 */
export const HTML2CANVAS_FONT_METRICS_FIX_CSS = `
body > div > img[width="1"][height="1"] {
  display: inline !important;
}
`.trim();

/**
 * Reset minimal bebas `oklch()` untuk iframe PDF agar kerapatan tabel & paragraf
 * identik 1:1 dengan tampilan Print Preview (tanpa membawa stylesheet Tailwind v4).
 */
export const PDF_IFRAME_BASE_RESET_CSS = `
*, *::before, *::after {
  box-sizing: border-box;
}
h1, h2, h3, h4, h5, h6, p, figure, blockquote, dl, dd {
  margin: 0;
}
table {
  border-collapse: collapse;
  border-spacing: 0;
}
td, th {
  padding: 0;
}
img {
  display: inline-block;
  vertical-align: baseline;
}
`.trim();

/**
 * Mengonversi nilai panjang CSS (`pt`, `px`, `mm`, `cm`, `in`) menjadi milimeter (mm).
 */
export function cssLengthToMm(lengthCss: string | null | undefined, fallbackMm: number): number {
  if (!lengthCss || typeof lengthCss !== "string") return fallbackMm;
  const match = lengthCss.trim().match(/^([0-9]+(?:\.[0-9]+)?)\s*(pt|px|mm|cm|in)$/i);
  if (!match) return fallbackMm;
  const val = parseFloat(match[1]);
  if (!Number.isFinite(val) || val <= 0) return fallbackMm;
  const unit = match[2].toLowerCase();
  let mm = fallbackMm;
  if (unit === "mm") mm = val;
  else if (unit === "cm") mm = val * 10;
  else if (unit === "in") mm = val * 25.4;
  else if (unit === "pt") mm = (val * 25.4) / 72;
  else if (unit === "px") mm = (val * 25.4) / 96;
  return Math.round(mm * 100) / 100;
}

/**
 * Menghitung dimensi kertas PDF (mm) dari HTML surat (A4, F4/Folio, Letter, atau ukuran asli Word).
 */
export function resolvePdfPageDimensionsMm(html: string): { widthMm: number; heightMm: number } {
  const metrics = extractDocxPrintMetrics(html);
  const widthMm = cssLengthToMm(metrics.pageWidthCss, A4_WIDTH_MM);
  const heightMm = cssLengthToMm(metrics.pageHeightCss, A4_HEIGHT_MM);
  return {
    widthMm: widthMm >= 80 && widthMm <= 600 ? widthMm : A4_WIDTH_MM,
    heightMm: heightMm >= 80 && heightMm <= 900 ? heightMm : A4_HEIGHT_MM,
  };
}

/**
 * Membentuk nama berkas `.pdf` yang rapi & aman lintas sistem operasi.
 */
export function buildLetterPdfFileName(mail: Pick<MailItem, "nomor" | "subject">): string {
  const sanitizeSegment = (raw: string | undefined | null) =>
    String(raw || "")
      .trim()
      .replace(/[/\\?%*:|"<>]+/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");

  const nomorPart = sanitizeSegment(mail.nomor);
  const subjectPart = sanitizeSegment(mail.subject);
  const combined = [nomorPart, subjectPart].filter(Boolean).join("_") || "Surat_Resmi_PMII";
  return `${combined.slice(0, 88)}.pdf`;
}

/**
 * Mengecek apakah arsip surat memiliki berkas lampiran berformat PDF.
 */
export function isPdfAttachment(mail: Pick<MailItem, "fileUrl" | "fileName">): boolean {
  if (!mail.fileUrl) return false;
  const name = String(mail.fileName || "").toLowerCase().trim();
  if (name.endsWith(".pdf")) return true;
  const cleanUrl = String(mail.fileUrl).split("?")[0].toLowerCase().trim();
  return cleanUrl.endsWith(".pdf");
}

function isImageAttachment(mail: Pick<MailItem, "fileUrl" | "fileName">): boolean {
  if (!mail.fileUrl) return false;
  const target = `${mail.fileName || ""} ${String(mail.fileUrl).split("?")[0]}`.toLowerCase();
  return /\.(?:png|jpe?g|webp|gif)\b/.test(target);
}

/**
 * Mengekstrak hanya aturan `@font-face` dari stylesheet halaman induk agar iframe PDF
 * mendapatkan webfont self-hosted (`Charm`, `Archivo Narrow`, `Carlito`) tanpa membawa
 * variabel warna Tailwind v4 (`oklch`/`lab`) yang tidak didukung html2canvas.
 */
function extractParentFontFaceCss(): string {
  if (typeof document === "undefined") return "";
  const rules: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const cssRules = sheet.cssRules;
      if (!cssRules) continue;
      for (const rule of Array.from(cssRules)) {
        if (rule.type === CSSRule.FONT_FACE_RULE) {
          rules.push(rule.cssText);
        }
      }
    } catch {
      // Abaikan stylesheet lintas origin yang tidak bisa dibaca
    }
  }
  return rules.join("\n");
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function waitForIframeImages(doc: Document): Promise<void> {
  const imgs = Array.from(doc.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src") || "";
      if (src && !src.startsWith("data:") && !src.startsWith("blob:")) {
        const absoluteUrl = img.src || src;
        const inlined = await fetchImageAsDataUrl(absoluteUrl);
        if (inlined) {
          img.src = inlined;
        } else {
          img.crossOrigin = "anonymous";
        }
      }
      if (img.complete && img.naturalWidth > 0) return;
      await new Promise<void>((resolve) => {
        const timer = window.setTimeout(resolve, 3000);
        const done = () => {
          window.clearTimeout(timer);
          resolve();
        };
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    })
  );
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Mengonversi konten surat berformat HTML / hasil render DOCX menjadi berkas `.pdf`
 * dengan ukuran halaman 1:1, dukungan multi-halaman & surat massal, font resmi, QR, dan TTD/Stempel.
 */
async function downloadFormattedHtmlMailAsPdf(
  mail: MailItem,
  fileName: string
): Promise<void> {
  let safeMailContent = stripLetterEditMetadata(
    sanitizeLetterHtml(mail.content || "", { preserveDocxLayout: true })
  );

  // Pastikan setiap surat keluar memiliki QR verifikasi di footer (termasuk arsip lama)
  if (mail.type === "KELUAR" && !hasHtmlQrFooter(safeMailContent)) {
    try {
      const meta = await generateLetterQrDataUrl(mail.id);
      const footerHtml = buildHtmlQrFooter({
        letterId: mail.id,
        nomor: mail.nomor,
        qrDataUrl: meta.qrDataUrl,
        verificationUrl: meta.verificationUrl,
        orgLabel: mail.commissariat || "PMII",
      });
      safeMailContent = `${safeMailContent}\n${footerHtml}`;
    } catch (err) {
      console.warn("Gagal menyisipkan QR verifikasi ke PDF:", err);
    }
  }

  const isBulk = safeMailContent.includes("bulk-letter-page");
  const { htmlClassAttr, fontVarsCss, baseHref } = buildPrintFontContext();
  const fontFaceCss = extractParentFontFaceCss();
  const printStyles = buildDocxPrintStyleBlock(safeMailContent, {
    fontVarsCss,
    isBulk,
    nonDocxContainerPadding: "15mm 20mm",
  });
  const defaultDims = resolvePdfPageDimensionsMm(safeMailContent);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.left = "-12000px";
  iframe.style.top = "0";
  iframe.style.width = "1200px";
  iframe.style.height = "1800px";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  // Pasang fix sementara di dokumen induk selama html2canvas mengukur FontMetrics
  const fontMetricsFixStyle = document.createElement("style");
  fontMetricsFixStyle.setAttribute("data-pmii-pdf-fontmetrics-fix", "true");
  fontMetricsFixStyle.textContent = HTML2CANVAS_FONT_METRICS_FIX_CSS;
  document.head.appendChild(fontMetricsFixStyle);

  try {
    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) {
      throw new Error("Gagal menyiapkan kanvas PDF di browser.");
    }

    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
<html lang="id" class="${escapeHtml(htmlClassAttr)}">
  <head>
    <meta charset="utf-8" />
    ${baseHref ? `<base href="${escapeHtml(baseHref)}" />` : ""}
    <style>
      ${PDF_IFRAME_BASE_RESET_CSS}
      ${fontFaceCss}
      ${printStyles}
      html, body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
      }
      .docx-wrapper {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .docx-wrapper > section.docx {
        margin: 0 !important;
        box-shadow: none !important;
        background: #ffffff !important;
      }
      .pdf-non-docx-sheet {
        width: 794px;
        min-height: 1123px;
        background: #ffffff;
        color: #111827;
        box-sizing: border-box;
      }
    </style>
  </head>
  <body>
    <div class="letter-print-container">${safeMailContent}</div>
  </body>
</html>`);
    iframeDoc.close();

    // Tunggu font di induk & iframe serta seluruh gambar (logo kop, QR, TTD, stempel) selesai dimuat
    await Promise.all([
      document.fonts?.ready?.catch(() => {}) ?? Promise.resolve(),
      iframeDoc.fonts?.ready?.catch(() => {}) ?? Promise.resolve(),
      waitForIframeImages(iframeDoc),
    ]);
    await new Promise((r) => window.setTimeout(r, 80));

    // Sesuaikan tinggi viewport iframe dengan total dokumen agar halaman ke-2..N tidak terpotong
    const fullDocHeight = Math.max(
      1800,
      iframeDoc.documentElement?.scrollHeight || 0,
      iframeDoc.body?.scrollHeight || 0
    );
    iframe.style.height = `${fullDocHeight + 240}px`;

    const [{ jsPDF }, html2canvasMod] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);
    const html2canvas = html2canvasMod.default;

    const docxSections = Array.from(
      iframeDoc.querySelectorAll<HTMLElement>("section.docx")
    );
    const bulkPages = Array.from(
      iframeDoc.querySelectorAll<HTMLElement>(".bulk-letter-page")
    );

    const targets: Array<{ el: HTMLElement; isDocxPage: boolean }> = [];
    if (docxSections.length > 0) {
      docxSections.forEach((el) => targets.push({ el, isDocxPage: true }));
    } else if (bulkPages.length > 0) {
      bulkPages.forEach((el) => {
        el.classList.add("pdf-non-docx-sheet");
        targets.push({ el, isDocxPage: false });
      });
    } else {
      const container = iframeDoc.querySelector<HTMLElement>(".letter-print-container");
      if (!container) {
        throw new Error("Konten surat tidak ditemukan untuk diunduh sebagai PDF.");
      }
      container.classList.add("pdf-non-docx-sheet");
      targets.push({ el: container, isDocxPage: false });
    }

    const renderScale = targets.length > 12 ? 1.5 : 2;
    let pdf: InstanceType<typeof jsPDF> | null = null;

    for (let i = 0; i < targets.length; i++) {
      const { el, isDocxPage } = targets[i];
      const rect = el.getBoundingClientRect();
      const targetWidthPx = Math.max(1, Math.round(rect.width || el.scrollWidth || 794));
      const targetHeightPx = Math.max(1, Math.round(rect.height || el.scrollHeight || 1123));

      const canvas = await html2canvas(el, {
        scale: renderScale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: targetWidthPx,
        height: targetHeightPx,
        windowWidth: Math.max(1200, targetWidthPx),
        windowHeight: Math.max(fullDocHeight + 240, targetHeightPx),
      });

      if (isDocxPage) {
        // Hitung ukuran kertas spesifik halaman ini (bila style inline berbeda antar halaman)
        const inlineStyle = el.getAttribute("style") || "";
        const wCss = inlineStyle.match(/(?:^|;)\s*width\s*:\s*([0-9.]+(?:pt|px|mm|cm|in))/i)?.[1];
        const hCss = inlineStyle.match(/(?:^|;)\s*(?:min-)?height\s*:\s*([0-9.]+(?:pt|px|mm|cm|in))/i)?.[1];
        const pageWidthMm = cssLengthToMm(wCss, defaultDims.widthMm);
        const aspectHeightMm = Math.round(((canvas.height / canvas.width) * pageWidthMm) * 100) / 100;
        const pageHeightMm = Math.max(cssLengthToMm(hCss, defaultDims.heightMm), aspectHeightMm);
        const orientation = pageWidthMm > pageHeightMm ? "landscape" : "portrait";

        if (!pdf) {
          pdf = new jsPDF({
            orientation,
            unit: "mm",
            format: [pageWidthMm, pageHeightMm],
            compress: true,
          });
        } else {
          pdf.addPage([pageWidthMm, pageHeightMm], orientation);
        }

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMm, aspectHeightMm, undefined, "FAST");
      } else {
        // Dokumen HTML non-DOCX: gunakan A4 dan potong rapi multi-halaman bila melebihi 1 lembar A4
        const pageWidthMm = A4_WIDTH_MM;
        const pageHeightMm = A4_HEIGHT_MM;
        const pxPerMm = canvas.width / pageWidthMm;
        const sliceHeightPx = Math.max(1, Math.floor(pageHeightMm * pxPerMm));
        const totalSlices = Math.max(1, Math.ceil(canvas.height / sliceHeightPx));

        for (let s = 0; s < totalSlices; s++) {
          const srcY = s * sliceHeightPx;
          const curSliceH = Math.min(sliceHeightPx, canvas.height - srcY);
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = curSliceH;
          const ctx = sliceCanvas.getContext("2d");
          if (!ctx) continue;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            srcY,
            canvas.width,
            curSliceH,
            0,
            0,
            canvas.width,
            curSliceH
          );

          if (!pdf) {
            pdf = new jsPDF({
              orientation: "portrait",
              unit: "mm",
              format: "a4",
              compress: true,
            });
          } else {
            pdf.addPage("a4", "portrait");
          }

          const renderedHeightMm = curSliceH / pxPerMm;
          const imgData = sliceCanvas.toDataURL("image/jpeg", 0.95);
          pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMm, renderedHeightMm, undefined, "FAST");
        }
      }
    }

    if (!pdf) {
      throw new Error("Gagal merender halaman surat ke PDF.");
    }

    pdf.save(fileName);
  } finally {
    fontMetricsFixStyle.remove();
    iframe.remove();
  }
}

/**
 * Membuat Lembar Arsip Surat PDF rapi dengan jsPDF untuk surat catatan manual / teks biasa
 * yang belum memiliki dokumen HTML terformat maupun lampiran berkas PDF.
 */
async function downloadPlainRecordMailAsPdf(
  mail: MailItem,
  fileName: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const marginX = 20;
  const maxWidth = A4_WIDTH_MM - marginX * 2;
  let cursorY = 20;

  // Header Arsip PMII
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(15, 23, 42);
  pdf.text(
    mail.type === "MASUK" ? "ARSIP SURAT MASUK RESMI" : "ARSIP SURAT KELUAR RESMI",
    marginX,
    cursorY
  );
  cursorY += 6;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    mail.commissariat || "Pergerakan Mahasiswa Islam Indonesia (PMII)",
    marginX,
    cursorY
  );
  cursorY += 4;

  pdf.setDrawColor(37, 99, 235);
  pdf.setLineWidth(0.7);
  pdf.line(marginX, cursorY, A4_WIDTH_MM - marginX, cursorY);
  cursorY += 8;

  // Metadata Surat
  const metaRows: Array<[string, string]> = [
    ["Nomor Surat", mail.nomor || "-"],
    ["Perihal", mail.subject || "-"],
    ["Tanggal Surat", mail.dateIndo || mail.date || "-"],
    [mail.type === "MASUK" ? "Instansi Pengirim" : "Instansi Tujuan", mail.senderOrRecipient || "-"],
    ["Klasifikasi", mail.classification || "-"],
    ["Status Arsip", mail.status || "-"],
  ];
  if (mail.senderTitle || mail.senderLocation) {
    metaRows.push([
      "Penandatangan",
      [mail.senderTitle, mail.senderLocation].filter(Boolean).join(" · "),
    ]);
  }

  for (const [label, value] of metaRows) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(51, 65, 85);
    pdf.text(label, marginX, cursorY);
    pdf.text(":", marginX + 38, cursorY);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(15, 23, 42);
    const wrapped = pdf.splitTextToSize(value, maxWidth - 42);
    pdf.text(wrapped, marginX + 42, cursorY);
    cursorY += Math.max(6, wrapped.length * 4.8 + 1.5);
  }

  cursorY += 3;
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(marginX, cursorY, A4_WIDTH_MM - marginX, cursorY);
  cursorY += 7;

  // Ringkasan / Isi Surat
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text("Ringkasan / Isi Surat", marginX, cursorY);
  cursorY += 6;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(30, 41, 59);
  const bodyText =
    stripLetterEditMetadata(mail.content || "").trim() ||
    "Tidak ada ringkasan teks yang tercatat pada arsip surat ini.";
  const bodyLines = pdf.splitTextToSize(bodyText, maxWidth);
  for (const line of bodyLines) {
    if (cursorY > A4_HEIGHT_MM - 34) {
      pdf.addPage("a4", "portrait");
      cursorY = 22;
    }
    pdf.text(line, marginX, cursorY);
    cursorY += 5.2;
  }

  // Jika ada lampiran gambar (scan foto surat masuk), sematkan ke halaman PDF
  if (mail.fileUrl && isImageAttachment(mail)) {
    try {
      const resolved = await resolveStorageUrl(mail.fileUrl);
      if (resolved) {
        const imgData = await fetchImageAsDataUrl(resolved);
        if (imgData) {
          const dims = await new Promise<{ w: number; h: number }>((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ w: img.naturalWidth || 800, h: img.naturalHeight || 1000 });
            img.onerror = () => resolve({ w: 800, h: 1000 });
            img.src = imgData;
          });
          pdf.addPage("a4", "portrait");
          const maxImgW = A4_WIDTH_MM - 24;
          const maxImgH = A4_HEIGHT_MM - 30;
          const ratio = Math.min(maxImgW / dims.w, maxImgH / dims.h);
          const drawW = dims.w * ratio;
          const drawH = dims.h * ratio;
          const drawX = (A4_WIDTH_MM - drawW) / 2;
          const fmt = imgData.startsWith("data:image/png") ? "PNG" : "JPEG";
          pdf.addImage(imgData, fmt, drawX, 15, drawW, drawH, undefined, "FAST");
        }
      }
    } catch {
      // Abaikan bila lampiran gambar gagal dimuat
    }
  }

  // QR Verifikasi di footer bawah untuk Surat Keluar
  if (mail.type === "KELUAR") {
    try {
      const meta = await generateLetterQrDataUrl(mail.id);
      const footerY = A4_HEIGHT_MM - 28;
      pdf.addImage(meta.qrDataUrl, "PNG", marginX, footerY, 18, 18);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Verifikasi Keaslian Dokumen Digital PMII", marginX + 21, footerY + 6);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(meta.verificationUrl, marginX + 21, footerY + 11);
    } catch {
      // Abaikan bila QR gagal dibuat
    }
  }

  pdf.save(fileName);
}

/**
 * Mengunduh arsip surat (Surat Keluar maupun Surat Masuk) langsung sebagai berkas `.pdf`.
 * - Surat resmi HTML/DOCX (tunggal, multi-halaman, maupun surat massal) -> dirender presisi 1:1 lengkap dengan TTD, stempel, & QR.
 * - Arsip dengan lampiran berkas `.pdf` -> mengunduh berkas PDF lampiran aslinya.
 * - Arsip catatan manual teks biasa / scan foto -> menyusun Lembar Arsip Surat PDF rapi.
 */
export async function downloadMailAsPdf(mail: MailItem): Promise<{ fileName: string }> {
  const fileName = buildLetterPdfFileName(mail);

  if (isFormattedHtmlContent(mail.content)) {
    await downloadFormattedHtmlMailAsPdf(mail, fileName);
    return { fileName };
  }

  if (isPdfAttachment(mail) && mail.fileUrl) {
    const resolvedUrl = await resolveStorageUrl(mail.fileUrl);
    if (resolvedUrl) {
      try {
        const res = await fetch(resolvedUrl);
        if (res.ok) {
          const blob = await res.blob();
          const pdfBlob =
            blob.type === "application/pdf"
              ? blob
              : new Blob([blob], { type: "application/pdf" });
          triggerBlobDownload(pdfBlob, fileName);
          return { fileName };
        }
      } catch {
        // Fallback jika CORS memblokir fetch langsung: buka berkas PDF di tab baru
        window.open(resolvedUrl, "_blank", "noopener,noreferrer");
        return { fileName };
      }
    }
  }

  await downloadPlainRecordMailAsPdf(mail, fileName);
  return { fileName };
}
