import React from "react";
import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-7 h-7 text-zinc-700 dark:text-zinc-300 animate-spin" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Memuat halaman...</p>
      </div>
    </div>
  );
}
