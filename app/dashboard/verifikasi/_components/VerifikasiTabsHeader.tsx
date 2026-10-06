"use client";

import React from "react";
import { FileCheck, Users, BookOpen } from "lucide-react";

interface VerifikasiTabsHeaderProps {
  mainTab: "VERIFIKASI" | "PROGRES" | "TUGAS";
  onTabChange: (tab: "VERIFIKASI" | "PROGRES" | "TUGAS") => void;
  pendingCount: number;
  totalParticipantsInEvent: number;
  tasksCount: number;
}

export function VerifikasiTabsHeader({
  mainTab,
  onTabChange,
  pendingCount,
  totalParticipantsInEvent,
  tasksCount,
}: VerifikasiTabsHeaderProps) {
  const tabs = [
    {
      id: "VERIFIKASI" as const,
      label: "Verifikasi Berkas Masuk",
      icon: FileCheck,
      count: pendingCount,
      badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
    },
    {
      id: "PROGRES" as const,
      label: "Progres Peserta (Otomatis)",
      icon: Users,
      count: totalParticipantsInEvent,
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
    },
    {
      id: "TUGAS" as const,
      label: "Tugas",
      icon: BookOpen,
      count: tasksCount,
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
    }
  ];

  return (
    <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2 sm:gap-6 text-xs font-semibold overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = mainTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`pb-3 pt-1 inline-flex items-center gap-2 cursor-pointer transition-all border-b-2 whitespace-nowrap ${
              isActive
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tab.badgeColor}`}>
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
