import React from "react";
import { Users, Pencil, Brain } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ParticipantEvaluation, EventActivity } from "@/lib/db";

interface AssessmentListProps {
  filteredParticipants: ParticipantEvaluation[];
  selectedMateri: string;
  activitySessions: string[];
  currentActivity: EventActivity | null;
  getParticipantAvatar: (item: ParticipantEvaluation) => string | undefined;
  onOpenScoreModal: (evalItem: ParticipantEvaluation, materi: string) => void;
}

export const AssessmentList: React.FC<AssessmentListProps> = ({
  filteredParticipants,
  selectedMateri,
  activitySessions,
  currentActivity,
  getParticipantAvatar,
  onOpenScoreModal
}) => {
  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-xs">
      {/* Table Subheader */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            {selectedMateri === "ALL" ? "Daftar Penilaian Kumulatif" : `Sesi: ${selectedMateri}`}
          </h2>
          <span className="text-xs text-zinc-400">•</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {filteredParticipants.length} Peserta
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-zinc-400">
          <span className="font-semibold text-zinc-600 dark:text-zinc-300">Skala Nilai 1-100</span>
          <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">•</span>
          <span className="flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Bobot Kog: 30%
          </span>
          <span className="flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Bobot Afk: 35%
          </span>
          <span className="flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Bobot Mot: 35%
          </span>
        </div>
      </div>

      {filteredParticipants.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Tidak ada peserta yang cocok
            </p>
            <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
              {currentActivity?.name
                ? `Belum ada peserta terdaftar dalam kegiatan ${currentActivity.name}.`
                : "Silakan pilih kegiatan kaderisasi terlebih dahulu."}
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {filteredParticipants.map((item) => {
            const isSpecificMateri = selectedMateri !== "ALL";
            const currentSessionData =
              isSpecificMateri && item.sessionScores
                ? item.sessionScores[selectedMateri]
                : null;

            // Display values with NaN protection
            const getValidNumber = (val: any) => {
              if (val === null || val === undefined) return null;
              const num = Number(val);
              return !isNaN(num) ? num : null;
            };

            const displayKognitif = isSpecificMateri
              ? currentSessionData && getValidNumber(currentSessionData.kognitif) !== null
                ? currentSessionData.kognitif
                : "-"
              : item.status !== "BELUM_DINILAI" && getValidNumber(item.kognitif) !== null
              ? item.kognitif
              : "-";
            const displayAfektif = isSpecificMateri
              ? currentSessionData && getValidNumber(currentSessionData.afektif) !== null
                ? currentSessionData.afektif
                : "-"
              : item.status !== "BELUM_DINILAI" && getValidNumber(item.afektif) !== null
              ? item.afektif
              : "-";
            const displayMotorik = isSpecificMateri
              ? currentSessionData && getValidNumber(currentSessionData.psikomotorik) !== null
                ? currentSessionData.psikomotorik
                : "-"
              : item.status !== "BELUM_DINILAI" && getValidNumber(item.psikomotorik) !== null
              ? item.psikomotorik
              : "-";
            const displayScore = isSpecificMateri
              ? currentSessionData && getValidNumber(currentSessionData.score) !== null
                ? currentSessionData.score
                : "-"
              : item.status !== "BELUM_DINILAI" && getValidNumber(item.finalScore) !== null
              ? item.finalScore
              : "-";
            const isGradedInThisView = isSpecificMateri
              ? !!currentSessionData && getValidNumber(currentSessionData.score) !== null
              : item.status !== "BELUM_DINILAI";

            const gradedSessionsCount = item.sessionScores
              ? Object.entries(item.sessionScores).filter(
                  ([k, s]) => !k.startsWith("__") && typeof s?.kognitif === "number" && !isNaN(Number(s.kognitif))
                ).length
              : 0;
            const totalSessions = activitySessions.length;

            return (
              <div
                key={item.id}
                className="px-4 py-3.5 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3.5"
              >
                {/* Left: Participant Info */}
                <div className="flex items-center gap-3 min-w-0 md:w-64 lg:w-72 shrink-0">
                  <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center justify-center shrink-0 border border-zinc-200/80 dark:border-zinc-700/80 overflow-hidden relative shadow-2xs">
                    <span className="select-none font-bold text-xs">
                      {item.participantName.substring(0, 2).toUpperCase()}
                    </span>
                    {getParticipantAvatar(item) && (
                      <img
                        src={getParticipantAvatar(item)}
                        alt={item.participantName}
                        className="absolute inset-0 w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {item.participantName}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-normal shrink-0">
                        ({item.gender === "Perempuan" ? "P" : "L"})
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {item.university || ""}
                    </div>

                    {item.careerAssessment && (
                      <div className="pt-0.5">
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60"
                          title={`Bakat: ${item.careerAssessment.talent}. Minat: ${item.careerAssessment.interest}`}
                        >
                          <Brain className="w-2.5 h-2.5 shrink-0" />
                          {item.careerAssessment.mbtiCode} • {item.careerAssessment.talent}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle Column: Sessions Status (ALL) or Note (Specific) */}
                <div className="flex-1 min-w-0">
                  {!isSpecificMateri ? (
                    /* Sesi Chips in ALL View */
                    <div className="flex flex-wrap items-center gap-1.5">
                      {activitySessions.length === 0 ? (
                        <span className="text-[11px] text-zinc-400 italic">
                          Belum ada materi
                        </span>
                      ) : (
                        activitySessions.map((s) => {
                          const hasGraded =
                            item.sessionScores && !!item.sessionScores[s];
                          const sScore = hasGraded
                            ? item.sessionScores![s].score
                            : null;
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => onOpenScoreModal(item, s)}
                              className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                                hasGraded
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60 hover:bg-zinc-200"
                              }`}
                            >
                              <span>{s.replace(/^\d+\.\s*/, "")}</span>
                              {hasGraded ? (
                                <span className="font-mono font-bold text-[9px] text-emerald-600 dark:text-emerald-400">
                                  {sScore}
                                </span>
                              ) : (
                                <span className="text-zinc-400 text-[9px]">+</span>
                              )}
                            </button>
                          );
                        })
                      )}
                      <span className="text-[10px] text-zinc-400 font-mono ml-1">
                        ({gradedSessionsCount}/{totalSessions} dinilai)
                      </span>
                    </div>
                  ) : (
                    /* Session Note in Specific View */
                    <div>
                      {currentSessionData?.notes ? (
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-300 italic truncate max-w-md">
                          &ldquo;{currentSessionData.notes}&rdquo;
                        </p>
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic">
                          Belum ada catatan
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Aspect Scores: Compact Minimalist Typography */}
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <div className="text-center w-12">
                      <span className="text-[9px] text-zinc-400 block font-sans">
                        Kog
                      </span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {displayKognitif}
                      </span>
                    </div>
                    <div className="text-center w-12">
                      <span className="text-[9px] text-zinc-400 block font-sans">
                        Afk
                      </span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {displayAfektif}
                      </span>
                    </div>
                    <div className="text-center w-12">
                      <span className="text-[9px] text-zinc-400 block font-sans">
                        Mot
                      </span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {displayMotorik}
                      </span>
                    </div>
                    <div className="text-center w-14 border-l border-zinc-100 dark:border-zinc-800 pl-2">
                      <span className="text-[9px] text-zinc-400 block font-sans">
                        Total
                      </span>
                      <span
                        className={`font-bold ${
                          isGradedInThisView
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-zinc-400"
                        }`}
                      >
                        {displayScore}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="w-28 flex justify-end">
                    {isSpecificMateri ? (
                      <Button
                        size="sm"
                        variant={isGradedInThisView ? "outline" : "default"}
                        onClick={() => onOpenScoreModal(item, selectedMateri)}
                        className={`h-7.5 px-2.5 text-xs rounded-lg font-medium cursor-pointer flex items-center gap-1 ${
                          isGradedInThisView
                            ? "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        <Pencil className="w-3 h-3" />
                        <span>{isGradedInThisView ? "Edit" : "Beri Nilai"}</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const targetSesi = activitySessions[0] || "Materi 1";
                          onOpenScoreModal(item, targetSesi);
                        }}
                        className="h-7.5 px-2.5 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 font-medium cursor-pointer flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3 text-blue-600" />
                        <span>Nilai Sesi</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
