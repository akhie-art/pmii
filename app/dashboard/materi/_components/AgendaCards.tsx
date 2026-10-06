import React from "react";
import { GraduationCap } from "lucide-react";
import type { Kaderisasi } from "@/lib/db";
import type { KaderisasiLevel } from "./types";

interface AgendaCardsProps {
  kaderisasiList: Kaderisasi[];
  selectedAgendaId: string;
  kurikulumData: Record<string, KaderisasiLevel>;
  onSelectAgenda: (agendaId: string) => void;
}

export const AgendaCards: React.FC<AgendaCardsProps> = ({
  kaderisasiList,
  selectedAgendaId,
  kurikulumData,
  onSelectAgenda
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {kaderisasiList.map((agenda) => {
        const isSelected = selectedAgendaId === agenda.id;
        const kur = kurikulumData[agenda.nama] || kurikulumData[agenda.id];
        const matCount = kur?.materials?.length || 0;
        const sylCount = kur?.syllabus?.length || 0;
        const quizCount = kur?.quiz?.length || 0;
        const totalItems = matCount + sylCount + quizCount;

        return (
          <button
            key={agenda.id}
            onClick={() => onSelectAgenda(agenda.id)}
            className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border ${
              isSelected
                ? "bg-blue-600 text-white border-blue-600 shadow-xs shadow-blue-500/20"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                isSelected
                  ? "bg-white/20 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
            </div>

            <div className="text-left">
              <span className="font-bold block leading-tight">{agenda.nama}</span>
              <span
                className={`text-[10px] block mt-0.5 ${
                  isSelected ? "text-blue-100" : "text-zinc-400"
                }`}
              >
                {totalItems > 0 ? `${matCount} Modul • ${sylCount} Silabus` : "Belum ada materi"}
              </span>
            </div>

            <span
              className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ml-1 shrink-0 ${
                isSelected
                  ? "bg-white/25 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {agenda.tipe === "FORMAL" ? "Formal" : agenda.tipe === "INFORMAL" ? "Informal" : "Non Formal"}
            </span>
          </button>
        );
      })}
    </div>
  );
};

