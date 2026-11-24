import React from "react";
import { Loader2 } from "lucide-react";

export default function AnggotaLoading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-2.5">
        <Loader2 className="w-6 h-6 text-zinc-600 dark:text-zinc-400 animate-spin" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Memuat portal anggota...</p>
      </div>
    </div>
  );
}
