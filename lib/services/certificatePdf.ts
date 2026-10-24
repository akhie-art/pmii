import { jsPDF } from "jspdf";
import { CertificateLayoutConfig, CertificateFieldConfig } from "./types";

export interface RenderCertFieldItem {
  key: string;
  text: string;
  fallbackX: number;
  fallbackY: number;
  fallbackSize: number;
  fallbackAlign?: "left" | "center" | "right";
  bold?: boolean;
}

export interface GenerateCertPdfOptions {
  templateUrl: string;
  config: CertificateLayoutConfig;
  fields: RenderCertFieldItem[];
  outputType?: "bloburl" | "save" | "jsPDF";
  fileName?: string;
}

/**
 * Loads image safely as blob to guarantee canvas is never tainted by CORS
 */
async function loadSafeImage(url: string): Promise<HTMLImageElement> {
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = blobUrl;
    });
  } catch {
    // Direct crossOrigin fallback
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
}

/**
 * Normalizes font size to prevent obsolete 24pt+ database values from blowing up layout
 */
export function sanitizeCertFontSize(
  key: string,
  configuredSize?: number,
  fallbackSize = 12
): number {
  const size = configuredSize ?? fallbackSize;
  // Standard certificate body text should never exceed 18pt
  if (size > 18) {
    return key === "nama" || key === "nomor" ? 13 : 12;
  }
  return Math.max(8, size);
}

/**
 * Resolves CSS font-family strings containing variables (like var(--font-poppins))
 * into standard font names compatible with HTML5 Canvas 2D ctx.font parser.
 */
export function resolveCanvasFont(fontFamilyStr?: string): string {
  if (!fontFamilyStr) return 'Poppins, sans-serif';

  let resolved = fontFamilyStr;

  // Resolve CSS variables like var(--font-poppins) using computed style in browser
  if (typeof document !== "undefined" && resolved.includes("var(")) {
    try {
      const rootStyle = getComputedStyle(document.documentElement);
      resolved = resolved.replace(/var\((--[^)]+)\)/g, (_, varName) => {
        const val = rootStyle.getPropertyValue(varName)?.trim();
        return val || "";
      });
    } catch {
      // Fallback
    }
  }

  // Strip any remaining unresolvable var(...) fragments
  resolved = resolved.replace(/var\([^)]+\)/g, "");

  // Clean up comma formatting and spaces
  const parts = resolved
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  // Ensure standard fallbacks are included
  if (!parts.some((p) => p.toLowerCase().includes("sans-serif") || p.toLowerCase().includes("serif"))) {
    parts.push("sans-serif");
  }

  return parts.join(", ");
}

/**
 * Generates an ultra high-resolution 300 DPI A4 PDF matching browser CSS canvas 1:1
 */
export async function generateCertificatePdf(
  options: GenerateCertPdfOptions
): Promise<jsPDF | string> {
  const { templateUrl, config, fields, outputType = "save", fileName = "Sertifikat_Resmi.pdf" } = options;

  // Wait for web fonts (such as Google Fonts / Poppins) to finish loading
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  const img = await loadSafeImage(templateUrl);
  const isLandscape = img.naturalWidth > img.naturalHeight;
  const rawFontFamily = config.fontFamily || 'Poppins, var(--font-poppins), sans-serif';
  const cleanFontFamily = resolveCanvasFont(rawFontFamily);

  // 1. High-Resolution 300 DPI Canvas (Standard print-ready A4)
  const canvas = document.createElement("canvas");
  const canvasW = isLandscape ? 3508 : 2480;
  const canvasH = isLandscape ? 2480 : 3508;
  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Gagal menginisialisasi 2D Canvas");

  // 2. Base A4 dimension in PostScript points (72 pt / inch)
  const baseDocW = isLandscape ? 841.89 : 595.28;
  const ptToPx = canvasW / baseDocW; // ~4.166

  // 3. Render background template (fill full A4)
  ctx.drawImage(img, 0, 0, canvasW, canvasH);

  // 4. Render text fields with browser font engine
  fields.forEach((item) => {
    const conf = (config as any)[item.key] as CertificateFieldConfig | undefined;
    if (conf && conf.enabled === false) return;

    const rawX = conf?.x ?? item.fallbackX;
    const rawY = conf?.y ?? item.fallbackY;
    const posX = (rawX / 100) * canvasW;
    const posY = (rawY / 100) * canvasH;

    const ptSize = sanitizeCertFontSize(item.key, conf?.fontSize, item.fallbackSize);
    const fontSizePx = Math.round(ptSize * ptToPx);
    const isBold = conf?.bold ?? (item.bold || item.key === "nama");
    const align = (conf?.align || item.fallbackAlign || "left") as CanvasTextAlign;
    const textColor = conf?.color || "#0f172a";

    ctx.save();
    // Try setting font with clean resolved font family
    const desiredFont = `${isBold ? "bold " : "normal "}${fontSizePx}px ${cleanFontFamily}`;
    ctx.font = desiredFont;

    // Safety verification: if canvas parser failed and reverted to default 10px, use safe standard font
    if (!ctx.font.includes(`${fontSizePx}px`)) {
      const isSerif =
        cleanFontFamily.toLowerCase().includes("times") ||
        (cleanFontFamily.toLowerCase().includes("serif") && !cleanFontFamily.toLowerCase().includes("sans"));
      ctx.font = `${isBold ? "bold " : "normal "}${fontSizePx}px ${isSerif ? "serif" : "sans-serif"}`;
    }

    ctx.fillStyle = textColor;
    ctx.textAlign = align;
    ctx.textBaseline = "top";
    ctx.fillText(item.text, posX, posY);
    ctx.restore();
  });

  // 5. Construct jsPDF instance with exact A4 dimensions
  const pdfWidth = isLandscape ? 297 : 210;
  const pdfHeight = isLandscape ? 210 : 297;

  const pdf = new jsPDF({
    orientation: isLandscape ? "l" : "p",
    unit: "mm",
    format: [pdfWidth, pdfHeight],
    compress: true
  });

  try {
    const imgData = canvas.toDataURL("image/jpeg", 0.96);
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
  } catch (canvasExportErr) {
    console.warn("Canvas export fallback to direct vector:", canvasExportErr);
    pdf.addImage(img, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

    const baseFont = cleanFontFamily.toLowerCase().includes("times")
      ? "times"
      : cleanFontFamily.toLowerCase().includes("courier")
      ? "courier"
      : "helvetica";

    fields.forEach((item) => {
      const conf = (config as any)[item.key] as CertificateFieldConfig | undefined;
      if (conf && conf.enabled === false) return;

      const rawX = conf?.x ?? item.fallbackX;
      const rawY = conf?.y ?? item.fallbackY;
      const posX = (rawX / 100) * pdfWidth;
      const posY = (rawY / 100) * pdfHeight;

      const ptSize = sanitizeCertFontSize(item.key, conf?.fontSize, item.fallbackSize);
      const isBold = conf?.bold ?? (item.bold || item.key === "nama");
      const align = (conf?.align || item.fallbackAlign || "left") as "left" | "center" | "right";

      pdf.setFont(baseFont, isBold ? "bold" : "normal");
      pdf.setFontSize(ptSize);
      pdf.setTextColor(conf?.color || "#0f172a");
      pdf.text(item.text, posX, posY, { align, baseline: "top" });
    });
  }

  if (outputType === "bloburl") {
    const blobUrl = pdf.output("bloburl");
    return typeof blobUrl === "string" ? blobUrl : blobUrl.toString();
  } else if (outputType === "save") {
    pdf.save(fileName);
    return pdf;
  }
  return pdf;
}
