"use client";

import React, { useState } from "react";
import Image from "next/image";

const OPTIMIZABLE_HOSTS = new Set([
  "lh3.googleusercontent.com",
]);

/** Cache in-memory URL gambar yang gagal dimuat agar tidak memicu request berulang lintas halaman. */
const FAILED_IMAGE_URLS = new Set<string>();

export function isSafeImageSrc(src: string | null | undefined): boolean {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/")) return !trimmed.startsWith("//");
  if (trimmed.startsWith("data:image/")) return true;
  if (trimmed.startsWith("blob:")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function canOptimizeWithNextImage(src: string): boolean {
  const trimmed = src.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;
    if (
      parsed.hostname.endsWith(".supabase.co") &&
      parsed.pathname.startsWith("/storage/v1/object/public/")
    ) {
      return true;
    }
    return OPTIMIZABLE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export interface SmartImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  /** Optional fallback URL if loading fails (avoids mutating DOM src directly). */
  fallbackSrc?: string;
  /**
   * Keep natural aspect ratio (e.g. lightboxes, masonry cards, dynamic templates)
   * where fixed intrinsic dimensions should not constrain height/width.
   */
  preserveAspect?: boolean;
  /** Preload above-the-fold LCP assets (Next.js 16 `preload` prop). */
  preload?: boolean;
  /** Lewati proxy `/_next/image` (cocok untuk avatar dinamis hasil unggahan pengguna). */
  unoptimized?: boolean;
}

/**
 * Unified image component for SIAKAD PMII:
 * - Uses `next/image` automatic optimization (AVIF/WebP + srcset) for local `/image/*`,
 *   public Supabase Storage assets, and configured OAuth avatar hosts.
 * - Safely falls back to native `<img>` with `loading="lazy"` and `decoding="async"`
 *   for signed private URLs, `data:`/`blob:` previews, unconfigured external URLs,
 *   `unoptimized` dynamic uploads, or intrinsic-aspect layouts (`preserveAspect`).
 */
export function SmartImage({
  src,
  alt,
  width = 160,
  height = 160,
  fallbackSrc,
  preserveAspect = false,
  preload = false,
  unoptimized = false,
  className,
  onError,
  ...rest
}: SmartImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const primarySrc = typeof src === "string" ? src.trim() : "";
  const isPrimaryFailed =
    Boolean(primarySrc) && (failedSrc === primarySrc || FAILED_IMAGE_URLS.has(primarySrc));

  const effectiveSrc = isPrimaryFailed ? (fallbackSrc || "") : primarySrc;

  if (!isSafeImageSrc(effectiveSrc) || FAILED_IMAGE_URLS.has(effectiveSrc)) {
    return null;
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (effectiveSrc) {
      FAILED_IMAGE_URLS.add(effectiveSrc);
      setFailedSrc(effectiveSrc);
    }
    onError?.(e);
  };

  if (!preserveAspect && !unoptimized && canOptimizeWithNextImage(effectiveSrc)) {
    return (
      <Image
        src={effectiveSrc}
        alt={alt}
        width={width}
        height={height}
        preload={preload}
        className={className}
        onError={handleError}
        {...(rest as Record<string, unknown>)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={effectiveSrc}
      alt={alt}
      loading={preload ? "eager" : "lazy"}
      decoding="async"
      className={className}
      onError={handleError}
      {...rest}
    />
  );
}
