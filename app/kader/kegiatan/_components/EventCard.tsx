"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
  EventActivity,
  ParticipantRegistration,
  Requirement
} from "./types";
import { formatEventDateIndo } from "./types";

interface EventCardProps {
  event: EventActivity;
  myReg: ParticipantRegistration | null;
  requirements: Requirement[];
  activeCadre: any | null;
  isHighlighted: boolean;
  onOpenStages: (stage?: 1 | 2 | 3 | 4) => void;
  onViewCard: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  myReg,
  requirements,
  activeCadre,
  isHighlighted,
  onOpenStages,
  onViewCard
}) => {
  const isOpen = event.status === "OPEN";

  // Compute 4 stages progress for this card
  const levelReqs = requirements.filter(
    (r) =>
      (r.eventId && r.eventId === event.id) ||
      (!r.eventId && r.level?.toUpperCase() === event.level?.toUpperCase())
  );
  const mySubmissions = activeCadre?.submissions || [];
  const approvedSubmissions = mySubmissions.filter(
    (s: any) =>
      levelReqs.some((r) => r.id === s.requirementId) && s.status === "APPROVED"
  );
  const isRtlFinished =
    levelReqs.length > 0 && approvedSubmissions.length >= levelReqs.length;
  const isGraduated =
    myReg?.isGraduated || isRtlFinished || activeCadre?.status === "SELESAI";

  const stage1Done = myReg && myReg.status === "APPROVED";
  const stage2Done =
    stage1Done &&
    (event.status === "CLOSED" ||
      approvedSubmissions.length > 0 ||
      isRtlFinished);
  const stage3Done = isRtlFinished;
  const stage4Done = isGraduated;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      <Card
        className={`group bg-white dark:bg-zinc-900 rounded-2xl p-5 h-full flex flex-col justify-between transition-all duration-200 border shadow-none hover:shadow-xs ${
          isHighlighted
            ? "border-amber-500/80 dark:border-amber-400/80 bg-amber-500/[0.01]"
            : "border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
        }`}
      >
        <div className="space-y-3">
          {/* Top: Status */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                isOpen
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOpen ? "bg-emerald-500" : "bg-zinc-400"
                }`}
              />
              {isOpen ? "Pendaftaran Buka" : "Ditutup"}
            </span>

            {myReg && (
              <span
                className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                  myReg.status === "APPROVED"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50"
                    : myReg.status === "REJECTED"
                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/50"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/50"
                }`}
              >
                {myReg.status === "APPROVED"
                  ? "✓ Terdaftar"
                  : myReg.status === "REJECTED"
                  ? "✕ Ditolak"
                  : "⏳ Menunggu"}
              </span>
            )}
          </div>

          {/* Event Info */}
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {event.name}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
              {event.description ||
                "Tidak ada deskripsi rinci untuk kegiatan ini."}
            </p>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 pt-0.5">
            <div className="flex items-center gap-1 text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>{formatEventDateIndo(event.date)}</span>
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <div className="flex items-center gap-1 text-[11px] truncate">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">
                {event.commissariat || "Ki Ageng Getas Pendawa"}
              </span>
            </div>
          </div>
        </div>

        {/* Minimalist 4-Stage Stepper & Action */}
        <div className="pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 mt-3.5 space-y-3">
          {/* 4 Segmented Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                Tahapan:
              </span>
              <span
                className={`font-semibold ${
                  stage4Done
                    ? "text-amber-600 dark:text-amber-400"
                    : stage3Done
                    ? "text-blue-600 dark:text-blue-400"
                    : stage2Done
                    ? "text-blue-600 dark:text-blue-400"
                    : stage1Done
                    ? "text-emerald-600 dark:text-emerald-400"
                    : myReg
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-zinc-500"
                }`}
              >
                {stage4Done
                  ? "Lulus / Bersertifikat"
                  : stage3Done
                  ? "Tahap 3: RTL Selesai"
                  : stage2Done
                  ? "Tahap 3: RTL"
                  : stage1Done
                  ? "Tahap 2: Kegiatan"
                  : myReg
                  ? "Tahap 1: Verifikasi"
                  : "Tahap 1: Pendaftaran"}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  stage1Done
                    ? "bg-emerald-500"
                    : myReg
                    ? "bg-amber-400"
                    : "bg-zinc-100 dark:bg-zinc-800"
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  stage2Done
                    ? "bg-emerald-500"
                    : stage1Done
                    ? "bg-blue-500"
                    : "bg-zinc-100 dark:bg-zinc-800"
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  stage3Done
                    ? "bg-emerald-500"
                    : approvedSubmissions.length > 0
                    ? "bg-amber-400"
                    : "bg-zinc-100 dark:bg-zinc-800"
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  stage4Done ? "bg-amber-500" : "bg-zinc-100 dark:bg-zinc-800"
                }`}
              />
            </div>

            <div className="flex justify-between text-[9.5px] text-zinc-400 dark:text-zinc-500 font-medium px-0.5">
              <span>1. Daftar</span>
              <span>2. Acara</span>
              <span>3. RTL</span>
              <span>4. Sertifikat</span>
            </div>
          </div>

          {/* Single Clean Action Row */}
          <div className="flex items-center gap-2 pt-0.5">
            <Button
              type="button"
              onClick={() => onOpenStages()}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-xs h-9 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-none transition-colors"
            >
              <span>Buka Alur & Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>

            {myReg && myReg.status === "APPROVED" && (
              event.waGroupLink ? (
                <a
                  href={event.waGroupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Masuk Grup WhatsApp"
                  className="h-9 w-9 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    toast.info(
                      "Link grup WhatsApp kegiatan belum dicantumkan oleh panitia."
                    )
                  }
                  title="Masuk Grup WhatsApp"
                  className="h-9 w-9 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </button>
              )
            )}

            {myReg && myReg.status === "APPROVED" && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onViewCard}
                className="h-9 w-9 rounded-xl border-zinc-200 dark:border-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 shrink-0 cursor-pointer shadow-none"
                title="Buka Kartu Peserta (QR)"
              >
                <QrCode className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
