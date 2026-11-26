"use client";

import React from "react";
import Link from "next/link";
import { Calendar, Camera, LogIn, X, ZoomIn } from "lucide-react";
import type { KomisariatGalleryItem } from "@/lib/db";

interface KomisariatGallerySectionProps {
  komisariatName: string;
  galleryCategories: string[];
  selectedGalleryCategory: string;
  onSelectCategory: (category: string) => void;
  filteredGallery: KomisariatGalleryItem[];
  activeLightboxPhoto: KomisariatGalleryItem | null;
  onSelectPhoto: (photo: KomisariatGalleryItem | null) => void;
  formatIndonesianDate: (date?: string, includeTime?: boolean) => string;
}

export function KomisariatGallerySection({
  komisariatName,
  galleryCategories,
  selectedGalleryCategory,
  onSelectCategory,
  filteredGallery,
  activeLightboxPhoto,
  onSelectPhoto,
  formatIndonesianDate,
}: KomisariatGallerySectionProps) {
  return (
    <>
      <section
        id="galeri"
        className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600 dark:text-blue-400">
              <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Dokumentasi & Galeri
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Galeri Jejak Pergerakan
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">
              Dokumentasi aktivitas, kaderisasi, aksi sosial, dan dinamika kebersamaan
              sahabat-sahabati di {komisariatName}.
            </p>
          </div>

          {galleryCategories.length > 2 && (
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              {galleryCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedGalleryCategory === cat
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredGallery.length > 0 ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectPhoto(item)}
                className="break-inside-avoid inline-block w-full mb-4 group cursor-pointer"
              >
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-2xs hover:shadow-xl transition-all duration-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.title || "Dokumentasi Kegiatan"}
                    className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  {item.category && (
                    <span className="absolute top-2.5 left-2.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-zinc-200/60 dark:border-zinc-800 shadow-xs">
                      {item.category}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <span className="p-3 rounded-full bg-white/90 text-zinc-900 shadow-md transform group-hover:scale-105 transition-transform">
                      <ZoomIn className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                {(item.title || item.caption || item.date) ? (
                  <div className="p-2 space-y-1">
                    {item.date && (
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-emerald-500" />
                        {formatIndonesianDate(item.date)}
                      </span>
                    )}
                    {item.title && (
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h3>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-none">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-900/60">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Galeri Dokumentasi Belum Diunggah
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
              Pengurus komisariat dapat mengunggah foto kegiatan, MAPABA, dan momentum pergerakan
              melalui menu Manajemen Komisariat di Dashboard Portal Pengurus.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Portal Pengurus Komisariat</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {activeLightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => onSelectPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onSelectPhoto(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
              aria-label="Tutup foto"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeLightboxPhoto.imageUrl}
                alt={activeLightboxPhoto.title || "Foto Galeri"}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            {(activeLightboxPhoto.title ||
              activeLightboxPhoto.caption ||
              activeLightboxPhoto.category ||
              activeLightboxPhoto.date) && (
              <div className="p-5 sm:p-6 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  {activeLightboxPhoto.category && (
                    <span className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-medium">
                      {activeLightboxPhoto.category}
                    </span>
                  )}
                  {activeLightboxPhoto.date && (
                    <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      {formatIndonesianDate(activeLightboxPhoto.date, true)}
                    </span>
                  )}
                </div>
                {activeLightboxPhoto.title && (
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {activeLightboxPhoto.title}
                  </h3>
                )}
                {activeLightboxPhoto.caption && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {activeLightboxPhoto.caption}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
