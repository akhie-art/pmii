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
 * Ekstrak seluruh placeholder {{...}} dari dokumen Word (.docx)
 * Menggunakan pendekatan yang sama persis seperti file Pengisi Template DOCX (1).html
 */
export function extractDocxPlaceholders(arrayBuffer: ArrayBuffer): {
  keys: string[];
  fullText: string;
  error?: string;
} {
  try {
    const zip = new PizZip(arrayBuffer);
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

/**
 * Isi template DOCX dengan data placeholder menggunakan docxtemplater + PizZip
 * Format asli dokumen (font, margin, header, footer, tabel) tetap 100% utuh!
 */
export function fillDocxTemplate(
  arrayBuffer: ArrayBuffer,
  data: Record<string, any>
): {
  blob: Blob;
  arrayBuffer: ArrayBuffer;
  error?: string;
} {
  try {
    const zip = new PizZip(arrayBuffer);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: "{{", end: "}}" },
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => ""
    });

    // Render data ke dalam dokumen docx
    doc.render(data);

    const outZip = doc.getZip();
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
 * Unggah file dokumen ke Supabase Storage bucket 'materials'
 */
export async function uploadFileToStorage(
  file: File | Blob,
  folder: "surat-templates" | "surat-attachments",
  originalName: string
): Promise<{ url: string; path: string; sizeFormatted: string } | null> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("Supabase tidak terkonfigurasi, unggah storage dilewati.");
    return null;
  }

  try {
    const cleanExt = originalName.includes(".") ? originalName.split(".").pop() : "";
    const baseClean = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_");
    const filePath = `${folder}/${Date.now()}-${baseClean}${cleanExt ? `.${cleanExt}` : ""}`;

    const { error: uploadError } = await supabase.storage
      .from("materials")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true
      });

    if (uploadError) {
      console.error("Gagal unggah ke Supabase Storage:", uploadError);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from("materials")
      .getPublicUrl(filePath);

    const fileSize = file instanceof File ? file.size : (file as Blob).size;
    return {
      url: publicData.publicUrl,
      path: filePath,
      sizeFormatted: formatBytes(fileSize)
    };
  } catch (err) {
    console.error("Kesalahan saat mengunggah ke storage:", err);
    return null;
  }
}

/**
 * Mendapatkan ArrayBuffer dokumen .docx baik dari URL Cloud Storage maupun Base64
 */
export async function getDocxArrayBuffer(template: {
  fileUrl?: string;
  fileBase64?: string;
}): Promise<ArrayBuffer> {
  if (template.fileUrl) {
    try {
      const res = await fetch(template.fileUrl);
      if (res.ok) {
        return await res.arrayBuffer();
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
 * Serialisasi konten template: membungkus HTML preview, master fileBase64, dan fileUrl
 * secara aman agar tersimpan di Supabase maupun LocalStorage tanpa kehilangan data
 */
export function serializeTemplateContent(
  html: string,
  fileBase64?: string,
  placeholders?: string[],
  fileUrl?: string,
  fileName?: string,
  fileSize?: string
): string {
  if (fileBase64 || fileUrl) {
    return JSON.stringify({
      isDocxTemplate: true,
      html,
      fileBase64,
      fileUrl,
      fileName,
      fileSize,
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

