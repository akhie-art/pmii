import React from "react";
import { Trophy, Medal } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ParticipantEvaluation } from "@/lib/db";

interface LeaderboardPodiumProps {
  topThree: ParticipantEvaluation[];
}

export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({ topThree }) => {
  if (topThree.length < 3) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-900/10 via-indigo-900/5 to-transparent border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
      <div className="text-center space-y-1 mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
          <Trophy className="w-3.5 h-3.5" />
          <span>Bintang Peserta Terbaik Forum</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Peringkat 3 Besar Peserta Teraktif & Berprestasi
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Rank 2 */}
        <div className="order-2 md:order-1 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-2 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-black text-sm flex items-center justify-center mx-auto">
            2
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {topThree[1].participantName}
          </h4>
          <p className="text-[11px] text-zinc-400 truncate">
            {topThree[1].university}
          </p>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-lg font-black text-blue-600 dark:text-blue-400">
              {topThree[1].finalScore}
            </span>
            <span className="text-[10px] text-zinc-400 block font-semibold">
              Predikat {topThree[1].grade}
            </span>
          </div>
        </div>

        {/* Rank 1 (Tallest Center) */}
        <div className="order-1 md:order-2 p-5 rounded-xl bg-white dark:bg-zinc-900 border-2 border-amber-500/40 text-center space-y-2.5 shadow-md relative -mt-2">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <Trophy className="w-3 h-3" /> Peringkat 1
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-base flex items-center justify-center mx-auto mt-1">
            <Medal className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {topThree[0].participantName}
          </h4>
          <p className="text-xs text-zinc-400 truncate">
            {topThree[0].university}
          </p>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-2xl font-black text-amber-500">
              {topThree[0].finalScore}
            </span>
            <span className="text-[10px] text-zinc-400 block font-semibold">
              Predikat Istimewa ({topThree[0].grade})
            </span>
          </div>
        </div>

        {/* Rank 3 */}
        <div className="order-3 md:order-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-2 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-amber-800/10 text-amber-800 dark:text-amber-600 font-black text-sm flex items-center justify-center mx-auto">
            3
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {topThree[2].participantName}
          </h4>
          <p className="text-[11px] text-zinc-400 truncate">
            {topThree[2].university}
          </p>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-lg font-black text-blue-600 dark:text-blue-400">
              {topThree[2].finalScore}
            </span>
            <span className="text-[10px] text-zinc-400 block font-semibold">
              Predikat {topThree[2].grade}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
