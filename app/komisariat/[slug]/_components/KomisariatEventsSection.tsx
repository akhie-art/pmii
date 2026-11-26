"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Mail, MapPin, UserPlus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EventActivity } from "@/lib/db";

interface KomisariatEventsSectionProps {
  komisariatName: string;
  campusName: string;
  events: EventActivity[];
  formatIndonesianDate: (date?: string, includeTime?: boolean) => string;
}

export function KomisariatEventsSection({
  komisariatName,
  campusName,
  events,
  formatIndonesianDate,
}: KomisariatEventsSectionProps) {
  return (
    <section
      id="kaderisasi"
      className="py-16 sm:py-24 bg-white dark:bg-zinc-900/40 border-y border-zinc-200/80 dark:border-zinc-800/80 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10 sm:mb-12">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600 dark:text-blue-400">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Agenda & Kaderisasi
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Agenda Kegiatan Terbuka
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Pelatihan formal penerimaan anggota baru (MAPABA), kaderisasi lanjutan, dan agenda
            pengembangan kapasitas diri bersama {komisariatName}.
          </p>
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {events.map((ev) => {
              const isClosed = ev.status === "CLOSED";
              const evRecord = ev as EventActivity & {
                image?: string;
                imageUrl?: string;
                poster?: string;
              };
              const poster = evRecord.image || evRecord.imageUrl || evRecord.poster;
              const level = (ev.level || "Kaderisasi").toUpperCase();
              const levelBadgeClass = level.includes("MAPABA")
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60"
                : level.includes("PKD")
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/60"
                : level.includes("PKL")
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60";

              return (
                <Card
                  key={ev.id}
                  className="group bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-none hover:shadow-md hover:border-blue-500/40 transition-all duration-200 flex flex-col justify-between"
                >
                  {poster && (
                    <div className="relative aspect-[16/8] overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={poster}
                        alt={ev.title || ev.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge
                          className={`${levelBadgeClass} border text-[10px] font-semibold uppercase py-0.5 px-2.5`}
                        >
                          {ev.level || "Kaderisasi"}
                        </Badge>

                        {isClosed ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                            Pendaftaran Ditutup
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Pendaftaran Dibuka
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                        {ev.title || ev.name}
                      </h3>

                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                        {ev.description ||
                          "Mari berproses dan ikuti pelatihan kaderisasi resmi untuk mengasah kapasitas intelektual dan kepemimpinan transformatif."}
                      </p>

                      <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {ev.date && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>{formatIndonesianDate(ev.date)}</span>
                          </div>
                        )}

                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span className="truncate max-w-[180px]">
                            {ev.location || campusName}
                          </span>
                        </div>

                        {ev.quota ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{ev.quota} Kuota Peserta</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800">
                      {isClosed ? (
                        <div className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 font-semibold text-xs text-center cursor-not-allowed">
                          Pendaftaran Telah Berakhir
                        </div>
                      ) : (
                        <Link
                          href={`/register?event=${ev.id}&commissariat=${encodeURIComponent(komisariatName)}`}
                          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs hover:shadow transition-all"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Daftar Sekarang</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-none">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-900/60">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Belum Ada Agenda Terbuka yang Dijadwalkan
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
              Agenda Masa Penerimaan Anggota Baru (MAPABA) dan pelatihan terbuka di {campusName} akan
              segera diperbarui di sini.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <a
                href="#kontak"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>Hubungi Fungsionaris</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
