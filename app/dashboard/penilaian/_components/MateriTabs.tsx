import React from "react";
import { Layers } from "lucide-react";
import type { ParticipantEvaluation } from "@/lib/db";

interface MateriTabsProps {
  selectedMateri: string;
  setSelectedMateri: (materi: string) => void;
  activitySessions: string[];
  evaluations: ParticipantEvaluation[];
  selectedActivityId: string;
  filteredParticipantsCount: number;
}

export const MateriTabs: React.FC<MateriTabsProps> = ({
  selectedMateri,
  setSelectedMateri,
  activitySessions,
  evaluations,
  selectedActivityId,
  filteredParticipantsCount
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
      {/* Tab: Akumulasi Semua Materi */}
      <button
        type="button"
        onClick={() => setSelectedMateri("ALL")}
        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
          selectedMateri === "ALL"
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-xs"
            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>Semua Materi</span>
        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
          {filteredParticipantsCount}
        </span>
      </button>

      {/* Tabs for each individual materi */}
      {activitySessions.length === 0 ? (
        <span className="text-xs text-zinc-400 italic py-1 pl-2">
          (Belum ada sesi materi pada kegiatan ini)
        </span>
      ) : (
        activitySessions.map((sessionName, index) => {
          const isCurrent = selectedMateri === sessionName;
          const gradedCount = evaluations.filter(
            (e) =>
              e.activityId === selectedActivityId &&
              e.sessionScores &&
              !!e.sessionScores[sessionName]
          ).length;

          return (
            <button
              key={sessionName}
              type="button"
              onClick={() => setSelectedMateri(sessionName)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                isCurrent
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  isCurrent
                    ? "bg-white/20 text-white"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {index + 1}
              </span>
              <span className="truncate max-w-[180px]">
                {sessionName.replace(/^\d+\.\s*/, "")}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isCurrent
                    ? "bg-white/20 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                }`}
              >
                {gradedCount}/{filteredParticipantsCount}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
};
