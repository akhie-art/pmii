"use client";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { uploadPrivateDocument } from "@/lib/storage";

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Mengunggah berkas sensitif pengajuan SK ke bucket privat `private-docs`
 * (dengan fallback aman ke `materials` / DataURL saat offline).
 */
export async function uploadDocFile(
  file: File,
  folder = "pengajuan-sk",
  tenantId?: string | null
): Promise<string> {
  if (isSupabaseConfigured && supabase) {
    try {
      const uploaded = await uploadPrivateDocument(file, {
        category: folder === "pengajuan-sk" ? "pengajuan-sk" : "dokumen",
        tenantId,
      });
      if (uploaded?.storageRef) {
        return uploaded.storageRef;
      }
    } catch (e) {
      console.warn("Gagal unggah ke storage privat, beralih ke local fallback:", e);
    }
  }

  if (file.size <= 2.5 * 1024 * 1024) {
    try {
      return await readFileAsDataUrl(file);
    } catch (e) {
      console.warn("Gagal membaca DataURL:", e);
    }
  }

  return URL.createObjectURL(file);
}

export function extractFileName(url?: string): string {
  if (!url) return "";
  try {
    const raw = url.split("?")[0].split("/").pop() || "";
    const clean = decodeURIComponent(raw).replace(/^\d+-/, "");
    return clean || "Berkas_Terlampir.pdf";
  } catch {
    return "Berkas_Terlampir.pdf";
  }
}

export function getFileExtension(url: string, name?: string): string {
  const cleanUrl = (url || "").split("?")[0].split("#")[0];
  const urlExt = cleanUrl.includes(".") ? cleanUrl.split(".").pop()?.toLowerCase() || "" : "";
  const cleanName = (name || "").split("?")[0].split("#")[0];
  const nameExt = cleanName.includes(".") ? cleanName.split(".").pop()?.toLowerCase() || "" : "";

  const known = ["docx", "doc", "pdf", "xlsx", "xls", "jpg", "jpeg", "png", "webp", "gif", "svg", "csv"];
  if (known.includes(nameExt)) return nameExt;
  if (known.includes(urlExt)) return urlExt;
  if (nameExt && nameExt.length <= 5) return nameExt;
  if (urlExt && urlExt.length <= 5) return urlExt;
  return "";
}
