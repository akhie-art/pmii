import React from "react";
import { Card } from "@/components/ui/card";
import type { YudisiumStatsType } from "./types";

interface YudisiumStatsProps {
  stats: YudisiumStatsType;
}

export const YudisiumStats: React.FC<YudisiumStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
      <Card className="p-3.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl text-center">
        <span className="text-[11px] text-zinc-400 block font-medium">Total Peserta</span>
        <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 block">
          {stats.total}
        </span>
      </Card>

      <Card className="p-3.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl text-center">
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">Lulus Penuh</span>
        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
          {stats.lulus}
        </span>
      </Card>

      <Card className="p-3.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl text-center">
        <span className="text-[11px] text-amber-600 dark:text-amber-400 block font-medium">Lulus Bersyarat</span>
        <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">
          {stats.bersyarat}
        </span>
      </Card>

      <Card className="p-3.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl text-center">
        <span className="text-[11px] text-rose-600 dark:text-rose-400 block font-medium">Tidak Lulus</span>
        <span className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 block">
          {stats.tidakLulus}
        </span>
      </Card>

      <Card className="p-3.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl text-center col-span-2 md:col-span-1">
        <span className="text-[11px] text-blue-600 dark:text-blue-400 block font-medium">Rata-Rata Angkatan</span>
        <span className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1 block">
          {stats.avgScore}
        </span>
      </Card>
    </div>
  );
};
