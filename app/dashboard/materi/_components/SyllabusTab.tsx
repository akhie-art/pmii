import React from "react";
import { Plus, BookMarked, Clock, Pencil, Trash2, Target, ListTree, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SyllabusItem, KaderisasiLevel } from "./types";

interface SyllabusTabProps {
  selectedLevel: KaderisasiLevel;
  filteredSyllabus: SyllabusItem[];
  onOpenAddSyllabus: () => void;
  onOpenEditSyllabus: (item: SyllabusItem) => void;
  onDeleteSyllabus: (id: string) => void;
}

export const SyllabusTab: React.FC<SyllabusTabProps> = ({
  selectedLevel,
  filteredSyllabus,
  onOpenAddSyllabus,
  onOpenEditSyllabus,
  onDeleteSyllabus
}) => {
  return (
    <div className="space-y-4">
      {/* CONTENT LIST */}
      {filteredSyllabus.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
          <BookMarked className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-2.5" />
          <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Tidak ada pokok bahasan ditemukan
          </h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 mb-4 max-w-sm mx-auto">
            {selectedLevel.syllabus.length === 0
              ? `Belum ada silabus pembelajaran untuk ${selectedLevel.name}. Tambahkan materi pokok bahasan sekarang.`
              : "Tidak ada silabus yang cocok dengan kata kunci pencarian Anda."}
          </p>
          <Button
            onClick={onOpenAddSyllabus}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg h-8 px-3.5 cursor-pointer border-none inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pokok Bahasan Pertama</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSyllabus.map((item) => {
            const tujuanList =
              item.tujuan && item.tujuan.length > 0
                ? item.tujuan
                : item.goal
                ? [item.goal]
                : [];
            const pokokList =
              item.pokokPembahasan && item.pokokPembahasan.length > 0
                ? item.pokokPembahasan
                : item.description
                ? [item.description]
                : [];
            const metodeList = item.metode && item.metode.length > 0 ? item.metode : [];
            const harapanList = item.harapan && item.harapan.length > 0 ? item.harapan : [];

            return (
              <div
                key={item.id}
                className="p-4 border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3 shadow-2xs"
              >
                {/* Header: Title, Duration, Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-900/50">
                      <BookMarked className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {item.subjectName}
                      </h4>
                      {item.category && (
                        <span className="text-[10px] text-zinc-400 font-medium">
                          Kategori: {item.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{item.durationHours || 90} Menit</span>
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenEditSyllabus(item)}
                        className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                        title="Edit Silabus"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteSyllabus(item.id)}
                        className="w-7 h-7 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-600 cursor-pointer"
                        title="Hapus Silabus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Structured Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-0.5">
                  {/* Left: Capaian & Metode */}
                  <div className="space-y-2.5">
                    {tujuanList.length > 0 && (
                      <div className="bg-zinc-50/70 dark:bg-zinc-950/60 p-3 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          <Target className="w-3.5 h-3.5" />
                          <span>Tujuan & Target Pembelajaran</span>
                        </div>
                        <ul className="space-y-1 text-zinc-700 dark:text-zinc-300 text-[11px] leading-relaxed">
                          {tujuanList.map((t, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {metodeList.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-1">
                          Metode:
                        </span>
                        {metodeList.map((m, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-[10px] font-medium border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                          >
                            {m}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Pokok Bahasan & Harapan */}
                  <div className="space-y-2.5">
                    {pokokList.length > 0 && (
                      <div className="bg-zinc-50/70 dark:bg-zinc-950/60 p-3 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          <ListTree className="w-3.5 h-3.5" />
                          <span>Pokok Pembahasan & Materi</span>
                        </div>
                        <ul className="space-y-1 text-zinc-700 dark:text-zinc-300 text-[11px] leading-relaxed">
                          {pokokList.map((p, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {harapanList.length > 0 && (
                      <div className="flex items-start gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 bg-amber-50/40 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">
                          <strong>Output:</strong> {harapanList.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
