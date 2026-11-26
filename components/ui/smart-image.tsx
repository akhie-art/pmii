"use client";

import React, { useState } from "react";
import Image from "next/image";

const OPTIMIZABLE_HOSTS = new Set([
  "lh3.googleusercontent.com",
]);

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
}

/**
 * Unified image component for SIAKAD PMII:
 * - Uses `next/image` automatic optimization (AVIF/WebP + srcset) for local `/image/*`,
 *   public Supabase Storage assets, and configured OAuth avatar hosts.
 * - Safely falls back to native `<img>` with `loading="lazy"` and `decoding="async"`
 *   for signed private URLs, `data:`/`blob:` previews, unconfigured external URLs,
 *   or intrinsic-aspect layouts (`preserveAspect`).
 */
export function SmartImage({
  src,
  alt,
  width = 160,
  height = 160,
  fallbackSrc,
  preserveAspect = false,
  preload = false,
  className,
  onError,
  ...rest
}: SmartImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const primarySrc = typeof src === "string" ? src.trim() : "";
  const effectiveSrc =
    failedSrc && failedSrc === primarySrc && fallbackSrc ? fallbackSrc : primarySrc;

  if (!isSafeImageSrc(effectiveSrc)) {
    return null;
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && effectiveSrc !== fallbackSrc) {
      setFailedSrc(primarySrc);
    }
    onError?.(e);
  };

  if (!preserveAspect && canOptimizeWithNextImage(effectiveSrc)) {
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
