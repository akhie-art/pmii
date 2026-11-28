"use client";

import { escapeHtml } from "@/lib/sanitize";

export type LetterImageOverlayKind = "signature" | "stamp" | "image";

export interface LetterImageOverlay {
  id: string;
  kind: LetterImageOverlayKind;
  label: string;
  dataUrl: string;
  /** Rasio width / height gambar untuk menjaga proporsi saat resize & embed DOCX */
  aspectRatio: number;
  /** Indeks halaman target: -1 = halaman terakhir (ideal untuk TTD & stempel), >= 0 = indeks 0-based */
  pageIndex: number;
  /** Posisi horizontal kiri (%) terhadap lebar halaman surat (0..100) */
  xPct: number;
  /** Posisi vertikal atas (%) terhadap tinggi halaman surat (0..100) */
  yPct: number;
  /** Lebar gambar (%) terhadap lebar halaman surat (5..65) */
  widthPct: number;
  /** Rotasi derajat (-45..45) */
  rotation: number;
  /** Opasitas (0.3..1) */
  opacity: number;
  /** Apakah latar belakang putih sudah dihapus menjadi transparan */
  transparentBg?: boolean;
}

export interface SavedOverlayAsset {
  id: string;
  kind: LetterImageOverlayKind;
  label: string;
  dataUrl: string;
  aspectRatio: number;
  transparentBg?: boolean;
  createdAt: string;
}

export const ALLOWED_OVERLAY_IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export const MAX_OVERLAY_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_OVERLAY_DIMENSION_PX = 640;
export const MAX_SAVED_OVERLAY_ASSETS = 8;

/**
 * Validasi tipe dan ukuran berkas gambar TTD/Stempel sebelum diproses.
 */
export function validateOverlayImageFile(file: {
  name: string;
  size: number;
  type?: string;
}): string | null {
  if (!file || file.size <= 0) {
    return "Berkas gambar kosong atau tidak terbaca.";
  }
  if (file.size > MAX_OVERLAY_IMAGE_BYTES) {
    return "Ukuran gambar maksimal 5 MB. Pilih berkas PNG/JPG/WEBP yang lebih kecil.";
  }
  const ext = (file.name.split(".").pop() || "").toLowerCase().trim();
  const mime = (file.type || "").toLowerCase().trim();
  const validExt = ["png", "jpg", "jpeg", "webp"].includes(ext);
  const validMime = ALLOWED_OVERLAY_IMAGE_MIME.has(mime);
  if (!validExt && !validMime) {
    return "Format gambar tidak didukung. Gunakan PNG (disarankan transparan), JPG, atau WEBP.";
  }
  return null;
}

/**
 * Memastikan Data URL aman digunakan sebagai sumber gambar overlay (anti-XSS).
 */
export function isSafeOverlayDataUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  return /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/i.test(url.trim());
}

/**
 * Menormalkan angka koordinat/dimensi overlay agar selalu berada pada batas wajar.
 */
export function normalizeOverlayItem(raw: Partial<LetterImageOverlay>): LetterImageOverlay | null {
  if (!raw || !isSafeOverlayDataUrl(raw.dataUrl)) return null;
  const kind: LetterImageOverlayKind =
    raw.kind === "signature" || raw.kind === "stamp" || raw.kind === "image"
      ? raw.kind
      : "signature";
  const clamp = (val: unknown, min: number, max: number, fallback: number): number => {
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, Math.round(n * 100) / 100));
  };

  return {
    id:
      typeof raw.id === "string" && raw.id.trim()
        ? raw.id.trim()
        : `ov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    label:
      typeof raw.label === "string" && raw.label.trim()
        ? raw.label.trim().slice(0, 60)
        : kind === "stamp"
        ? "Stempel Organisasi"
        : "Tanda Tangan",
    dataUrl: raw.dataUrl!.trim(),
    aspectRatio: clamp(raw.aspectRatio, 0.2, 6, kind === "stamp" ? 1 : 2.2),
    pageIndex:
      typeof raw.pageIndex === "number" && Number.isInteger(raw.pageIndex) && raw.pageIndex >= -1
        ? raw.pageIndex
        : -1,
    xPct: clamp(raw.xPct, 0, 95, kind === "stamp" ? 36 : 14),
    yPct: clamp(raw.yPct, 0, 95, kind === "stamp" ? 68 : 72),
    widthPct: clamp(raw.widthPct, 5, 65, kind === "stamp" ? 21 : 22),
    rotation: clamp(raw.rotation, -45, 45, 0),
    opacity: clamp(raw.opacity, 0.3, 1, kind === "stamp" ? 0.88 : 1),
    transparentBg: Boolean(raw.transparentBg),
  };
}

/**
 * Menghitung posisi awal cerdas agar beberapa tanda tangan & stempel tidak langsung bertumpuk di titik yang sama.
 */
export function buildDefaultOverlayPlacement(
  kind: LetterImageOverlayKind,
  existingOverlays: LetterImageOverlay[]
): Pick<LetterImageOverlay, "xPct" | "yPct" | "widthPct" | "rotation" | "opacity" | "pageIndex"> {
  if (kind === "stamp") {
    const stampCount = existingOverlays.filter((o) => o.kind === "stamp").length;
    return {
      xPct: Math.min(70, 35 + stampCount * 8),
      yPct: Math.min(82, 69 + stampCount * 4),
      widthPct: 21,
      rotation: -4,
      opacity: 0.88,
      pageIndex: -1,
    };
  }

  const sigCount = existingOverlays.filter((o) => o.kind !== "stamp").length;
  const presets = [
    { xPct: 14, yPct: 71 },
    { xPct: 54, yPct: 71 },
    { xPct: 34, yPct: 81 },
    { xPct: 14, yPct: 81 },
  ];
  const slot = presets[sigCount % presets.length];
  return {
    xPct: slot.xPct,
    yPct: slot.yPct,
    widthPct: 22,
    rotation: 0,
    opacity: 1,
    pageIndex: -1,
  };
}

/**
 * Menghapus piksel latar belakang putih/abu sangat terang pada Data URL menjadi alpha transparan
 * dengan feathering halus agar goresan tinta tanda tangan & stempel tetap tajam.
 */
export async function removeWhiteBackgroundFromDataUrl(
  sourceDataUrl: string,
  threshold = 228
): Promise<{ dataUrl: string; aspectRatio: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(
          1,
          MAX_OVERLAY_DIMENSION_PX / Math.max(img.naturalWidth || 1, img.naturalHeight || 1)
        );
        const w = Math.max(1, Math.round((img.naturalWidth || 200) * scale));
        const h = Math.max(1, Math.round((img.naturalHeight || 100) * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ dataUrl: sourceDataUrl, aspectRatio: w / h });
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const pixels = imageData.data;
        const softFloor = Math.max(170, threshold - 42);

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];
          if (a === 0) continue;

          const minCh = Math.min(r, g, b);
          const maxCh = Math.max(r, g, b);
          const saturation = maxCh - minCh;
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

          // Hanya piksel netral terang (putih/abu kertas) yang dijadikan transparan; tinta biru/ungu/hitam utuh
          if (saturation < 34 && luminance >= threshold) {
            pixels[i + 3] = 0;
          } else if (saturation < 34 && luminance > softFloor) {
            const factor = (threshold - luminance) / (threshold - softFloor);
            pixels[i + 3] = Math.round(a * Math.max(0, Math.min(1, factor)));
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          aspectRatio: w / h,
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Gagal memuat gambar untuk penghapusan latar."));
    img.src = sourceDataUrl;
  });
}

/**
 * Memproses berkas gambar unggahan (resize ke max 640px & opsional hapus latar putih)
 * menjadi PNG Data URL ringan siap tempel ke surat.
 */
export async function processUploadedOverlayImage(
  file: File,
  options: { removeWhiteBg?: boolean } = {}
): Promise<{ dataUrl: string; rawDataUrl: string; aspectRatio: number }> {
  const rawFileDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Gagal membaca berkas gambar."));
    reader.readAsDataURL(file);
  });

  const resized = await new Promise<{ dataUrl: string; aspectRatio: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const natW = img.naturalWidth || 240;
        const natH = img.naturalHeight || 120;
        const scale = Math.min(1, MAX_OVERLAY_DIMENSION_PX / Math.max(natW, natH));
        const w = Math.max(1, Math.round(natW * scale));
        const h = Math.max(1, Math.round(natH * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ dataUrl: rawFileDataUrl, aspectRatio: w / h });
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          aspectRatio: w / h,
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Berkas gambar rusak atau tidak valid."));
    img.src = rawFileDataUrl;
  });

  if (options.removeWhiteBg) {
    const transparent = await removeWhiteBackgroundFromDataUrl(resized.dataUrl);
    return {
      dataUrl: transparent.dataUrl,
      rawDataUrl: resized.dataUrl,
      aspectRatio: transparent.aspectRatio,
    };
  }

  return {
    dataUrl: resized.dataUrl,
    rawDataUrl: resized.dataUrl,
    aspectRatio: resized.aspectRatio,
  };
}

/**
 * Membangun markup HTML aman untuk 1 elemen overlay tanda tangan/stempel.
 */
export function buildOverlayItemHtml(ov: LetterImageOverlay): string {
  const safe = normalizeOverlayItem(ov);
  if (!safe) return "";
  const zIdx = safe.kind === "stamp" ? 25 : 20;
  const rotStyle = safe.rotation !== 0 ? `transform:rotate(${safe.rotation}deg);transform-origin:center center;` : "";
  return (
    `<div class="pmii-letter-overlay-item" data-letter-overlay="${escapeHtml(safe.id)}" ` +
    `style="position:absolute;left:${safe.xPct}%;top:${safe.yPct}%;width:${safe.widthPct}%;${rotStyle}` +
    `opacity:${safe.opacity};pointer-events:none;z-index:${zIdx};margin:0;padding:0;line-height:0;">` +
    `<img src="${safe.dataUrl}" alt="${escapeHtml(safe.label)}" ` +
    `style="display:block;width:100%;height:auto;max-width:100%;pointer-events:none;" />` +
    `</div>`
  );
}

const OVERLAY_DIV_REGEX =
  /<div\b[^>]*class=["'][^"']*\bpmii-letter-overlay-item\b[^"']*["'][^>]*>[\s\S]*?<\/div>/gi;

const OVERLAY_HOST_WRAPPER_REGEX =
  /^\s*<div\b[^>]*class=["'][^"']*\bpmii-letter-overlay-host\b[^"']*["'][^>]*>([\s\S]*)<\/div>\s*$/i;

/**
 * Menghapus seluruh elemen overlay statis yang tertanam di HTML surat
 * (digunakan saat masuk Mode Edit agar tidak terjadi gambar ganda dengan layer interaktif).
 */
export function stripLetterOverlaysFromHtml(html: string | null | undefined): string {
  if (!html || typeof html !== "string") return "";
  let cleaned = html.replace(OVERLAY_DIV_REGEX, "");
  while (OVERLAY_HOST_WRAPPER_REGEX.test(cleaned)) {
    cleaned = cleaned.replace(OVERLAY_HOST_WRAPPER_REGEX, "$1");
  }
  return cleaned;
}

/**
 * Menyematkan elemen overlay gambar (tanda tangan & stempel) ke dalam HTML surat
 * tepat di dalam `<section class="docx">` target (atau wadah root untuk surat HTML biasa)
 * dengan posisi persentase 1:1 agar hasil Cetak PDF, Detail Surat, dan Surat Massal identik.
 */
export function injectOverlaysIntoLetterHtml(
  html: string,
  overlays: LetterImageOverlay[]
): string {
  const cleanHtml = stripLetterOverlaysFromHtml(html);
  const validOverlays = (overlays || [])
    .map((o) => normalizeOverlayItem(o))
    .filter((o): o is LetterImageOverlay => Boolean(o));

  if (!cleanHtml || validOverlays.length === 0) return cleanHtml;

  // 1. Jika dokumen hasil docx-preview (<section class="docx ...">...</section>)
  const sectionRegex = /(<section\b[^>]*class=["'][^"']*\bdocx\b[^"']*["'][^>]*>)([\s\S]*?)(<\/section>)/gi;
  const matches = Array.from(cleanHtml.matchAll(sectionRegex));

  if (matches.length > 0) {
    const overlaysByPage = new Map<number, string[]>();
    for (const ov of validOverlays) {
      const targetIdx =
        ov.pageIndex < 0
          ? matches.length - 1
          : Math.min(matches.length - 1, Math.max(0, ov.pageIndex));
      const list = overlaysByPage.get(targetIdx) || [];
      list.push(buildOverlayItemHtml(ov));
      overlaysByPage.set(targetIdx, list);
    }

    let currentIdx = 0;
    return cleanHtml.replace(
      sectionRegex,
      (_full, openTag: string, inner: string, closeTag: string) => {
        const idx = currentIdx++;
        const items = overlaysByPage.get(idx);
        if (!items || items.length === 0) {
          return `${openTag}${inner}${closeTag}`;
        }

        // Pastikan <section class="docx"> memiliki position:relative
        let positionedOpenTag = openTag;
        if (/\bstyle="/i.test(positionedOpenTag)) {
          if (!/position\s*:\s*relative/i.test(positionedOpenTag)) {
            positionedOpenTag = positionedOpenTag.replace(
              /\bstyle="/i,
              'style="position:relative;'
            );
          }
        } else if (/\bstyle='/i.test(positionedOpenTag)) {
          if (!/position\s*:\s*relative/i.test(positionedOpenTag)) {
            positionedOpenTag = positionedOpenTag.replace(
              /\bstyle='/i,
              "style='position:relative;"
            );
          }
        } else {
          positionedOpenTag = positionedOpenTag.replace(/>$/, ' style="position:relative;">');
        }

        return `${positionedOpenTag}${inner}${items.join("")}${closeTag}`;
      }
    );
  }

  // 2. Fallback dokumen HTML non-DOCX: bungkus dengan wadah position:relative
  const overlayMarkup = validOverlays.map((ov) => buildOverlayItemHtml(ov)).join("");
  return `<div class="pmii-letter-overlay-host" style="position:relative;width:100%;">${cleanHtml}${overlayMarkup}</div>`;
}

function getAssetsStorageKey(tenantKey?: string | null): string {
  const clean = String(tenantKey || "default")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .slice(0, 60);
  return `PMII_LETTER_OVERLAY_ASSETS_${clean || "default"}`;
}

export function loadSavedOverlayAssets(tenantKey?: string | null): SavedOverlayAsset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getAssetsStorageKey(tenantKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedOverlayAsset =>
        Boolean(item) &&
        typeof item.id === "string" &&
        typeof item.label === "string" &&
        isSafeOverlayDataUrl(item.dataUrl)
    );
  } catch {
    return [];
  }
}

export function saveOverlayAssetToLibrary(
  asset: SavedOverlayAsset,
  tenantKey?: string | null
): SavedOverlayAsset[] {
  if (typeof window === "undefined" || !isSafeOverlayDataUrl(asset.dataUrl)) return [];
  const existing = loadSavedOverlayAssets(tenantKey).filter(
    (a) => a.id !== asset.id && a.dataUrl !== asset.dataUrl
  );
  const next = [asset, ...existing].slice(0, MAX_SAVED_OVERLAY_ASSETS);
  try {
    localStorage.setItem(getAssetsStorageKey(tenantKey), JSON.stringify(next));
  } catch (err) {
    console.warn("Gagal menyimpan koleksi TTD/Stempel ke localStorage:", err);
  }
  return next;
}

export function deleteOverlayAssetFromLibrary(
  assetId: string,
  tenantKey?: string | null
): SavedOverlayAsset[] {
  if (typeof window === "undefined") return [];
  const next = loadSavedOverlayAssets(tenantKey).filter((a) => a.id !== assetId);
  try {
    localStorage.setItem(getAssetsStorageKey(tenantKey), JSON.stringify(next));
  } catch {}
  return next;
}
