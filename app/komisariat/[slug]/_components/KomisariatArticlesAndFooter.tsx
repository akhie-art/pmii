"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, ShieldCheck } from "lucide-react";
import type { Article, CommissariatList } from "@/lib/db";

interface KomisariatArticlesSectionProps {
  komisariatName: string;
  articles: Article[];
  formatIndonesianDate: (date?: string, includeTime?: boolean) => string;
}

export function KomisariatArticlesSection({
  komisariatName,
  articles,
  formatIndonesianDate,
}: KomisariatArticlesSectionProps) {
  return (
    <section
      id="artikel"
      className="py-16 sm:py-24 bg-white dark:bg-zinc-900/40 border-t border-zinc-200/80 dark:border-zinc-800/80 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600 dark:text-blue-400">
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Warta & Opini Kader
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Artikel & Pemikiran Kader
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">
              Karya tulis ilmiah, gagasan wacana pergerakan, dan pemikiran intelektual kader{" "}
              {komisariatName}.
            </p>
          </div>

          <Link
            href="/artikel"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            <span>Portal Artikel Cabang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((art) => {
              const artRec = art as Article & { created_at?: string; date?: string };
              return (
                <Link
                  key={art.id}
                  href={`/artikel/${art.slug || art.id}`}
                  className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-blue-500/40 hover:shadow-lg dark:hover:shadow-zinc-950/50 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={art.image || "/image/landing_page.png"}
                        alt={art.title}
                        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-[10px] font-semibold text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-md border border-zinc-200/60 dark:border-zinc-800 shadow-xs">
                        {art.category}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-blue-500" />
                        {formatIndonesianDate(art.createdAt || artRec.created_at || artRec.date)}
                      </span>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                        {art.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {art.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                    <span className="text-[11px] font-medium truncate max-w-[140px] text-zinc-700 dark:text-zinc-300">
                      {art.authorName || "Kader PMII"}
                    </span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Baca Selengkapnya
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-none">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-900/60">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Belum Ada Publikasi Artikel dari {komisariatName}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
              Kader dan pengurus {komisariatName} belum menerbitkan artikel khusus di portal ini.
              Seluruh karya tulis yang diterbitkan oleh fungsionaris komisariat ini akan otomatis
              tampil di sini.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/artikel"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Kunjungi Portal Artikel Cabang</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

interface KomisariatFooterProps {
  komisariat: CommissariatList;
  campusName: string;
  logoBroken: boolean;
  onLogoError: () => void;
  navItems: ReadonlyArray<{ id: string; label: string; href: string }>;
}

export function KomisariatFooter({
  komisariat,
  campusName,
  logoBroken,
  onLogoError,
  navItems,
}: KomisariatFooterProps) {
  return (
    <footer className="w-full border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 flex items-center justify-center overflow-hidden">
                {komisariat.logo && !logoBroken ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={komisariat.logo}
                    alt={komisariat.name}
                    onError={onLogoError}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full rounded bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {komisariat.logoInitial || "PK"}
                  </div>
                )}
              </div>
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {komisariat.name}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
              Pangkalan resmi Pergerakan Mahasiswa Islam Indonesia di lingkungan {campusName},
              bernaung di bawah Pengurus Cabang PMII Grobogan.
            </p>
            <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              Dzikir, Fikir, dan Amal Shaleh
            </p>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Navigasi Halaman
            </h4>
            <ul className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              {navItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Layanan & Akses
            </h4>
            <ul className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              <li>
                <Link
                  href="/login"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Portal Pengurus & Anggota
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Portal PC PMII Grobogan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            © {new Date().getFullYear()} {komisariat.name}. Hak cipta dilindungi.
          </span>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Terdaftar Resmi PC PMII Grobogan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
