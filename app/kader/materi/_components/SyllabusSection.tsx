"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  BookMarked,
  Clock,
  Target,
  Search,
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  ListChecks,
  Check,
  Download,
  FileDown,
  FileText
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SyllabusItem, MaterialFile } from "@/lib/db";
import { LevelId, getFileTypeBadge } from "./types";

interface SyllabusSectionProps {
  levelId: LevelId;
  syllabusList: SyllabusItem[];
  materialsList?: MaterialFile[];
  onDownloadFile?: (fileUrl: string, fileName: string, materialId: string) => void;
}

export const SyllabusSection: React.FC<SyllabusSectionProps> = ({
  levelId,
  syllabusList,
  materialsList = [],
  onDownloadFile,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const [completedSubjects, setCompletedSubjects] = useState<Record<string, boolean>>({});

  // Load completed subjects for this level from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`PMII_STUDIED_SUBJECTS_${levelId}`);
      if (stored) {
        setCompletedSubjects(JSON.parse(stored));
      } else {
        setCompletedSubjects({});
      }
    } catch (e) {
      setCompletedSubjects({});
    }
  }, [levelId]);

  const toggleSubjectComplete = (subjectKey: string) => {
    setCompletedSubjects((prev) => {
      const updated = { ...prev, [subjectKey]: !prev[subjectKey] };
      try {
        localStorage.setItem(`PMII_STUDIED_SUBJECTS_${levelId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    syllabusList.forEach((item) => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [syllabusList]);

  const filteredList = useMemo(() => {
    return syllabusList.filter((item) => {
      const matchCategory =
        selectedCategory === "ALL" || item.category?.trim() === selectedCategory;

      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchName = item.subjectName?.toLowerCase().includes(q);
      const matchCat = item.category?.toLowerCase().includes(q);
      const matchGoals = item.tujuan?.some((t) => t.toLowerCase().includes(q)) || item.goal?.toLowerCase().includes(q);
      const matchTopics = item.pokokPembahasan?.some((p) => p.toLowerCase().includes(q)) || item.description?.toLowerCase().includes(q);

      return Boolean(matchName || matchCat || matchGoals || matchTopics);
    });
  }, [syllabusList, selectedCategory, searchQuery]);

  const toggleExpand = (idx: number) => {
    setExpandedIds((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const completedCount = useMemo(() => {
    return syllabusList.filter((_, idx) => completedSubjects[`${levelId}_${idx}`]).length;
  }, [syllabusList, completedSubjects, levelId]);

  const progressPercent = syllabusList.length > 0 
    ? Math.round((completedCount / syllabusList.length) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      {/* Search & Category Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari materi silabus, tujuan, atau pokok bahasan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Progress Tracker Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 shrink-0">
            <ListChecks className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div className="text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Progres Belajar:{" "}
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {completedCount} / {syllabusList.length} Selesai ({progressPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
            <span className="text-[11px] font-semibold text-zinc-400 shrink-0 mr-1">
              Kategori:
            </span>
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              Semua ({syllabusList.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Syllabus Card List */}
      {filteredList.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
          <BookMarked className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              Tidak ada materi yang sesuai
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ditemukan materi dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                : `Belum ada materi silabus untuk jenjang ${levelId}.`}
            </p>
          </div>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
              }}
              className="text-xs font-medium cursor-pointer"
            >
              Reset Pencarian
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredList.map((item, index) => {
            const originalIndex = syllabusList.indexOf(item);
            const subjectKey = `${levelId}_${originalIndex}`;
            const isCompleted = Boolean(completedSubjects[subjectKey]);
            const isExpanded = expandedIds[originalIndex] ?? true;

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
            const prosesList =
              item.prosesKegiatan && item.prosesKegiatan.length > 0 ? item.prosesKegiatan : [];
            const harapanList =
              item.harapan && item.harapan.length > 0 ? item.harapan : [];

            return (
              <Card
                key={originalIndex}
                className={`overflow-hidden bg-white dark:bg-zinc-900 border transition-all rounded-xl shadow-xs ${
                  isCompleted
                    ? "border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/10"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-blue-400/50"
                }`}
              >
                {/* Header Row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleSubjectComplete(subjectKey)}
                      title={isCompleted ? "Tandai belum selesai" : "Tandai sudah dipelajari"}
                      className={`mt-0.5 p-1 rounded-full transition-colors cursor-pointer shrink-0 ${
                        isCompleted
                          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50"
                          : "text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          Materi #{originalIndex + 1}
                        </span>
                        {item.category && (
                          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-semibold px-2 py-0.5 rounded">
                            {item.category}
                          </Badge>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Sudah Dipelajari
                          </span>
                        )}
                      </div>

                      <h3 className={`text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 ${
                        isCompleted ? "line-through opacity-85" : ""
                      }`}>
                        {item.subjectName}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Badge
                      variant="outline"
                      className="border-zinc-200 dark:border-zinc-800 text-xs font-semibold py-1 px-2.5 text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{item.durationHours || 90} Menit</span>
                    </Badge>

                    <button
                      onClick={() => toggleExpand(originalIndex)}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"
                      title={isExpanded ? "Ciutkan" : "Perluas rincian"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-4 bg-zinc-50/40 dark:bg-zinc-950/40">
                    {/* Tujuan Pembelajaran */}
                    {tujuanList.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300 text-xs">
                          <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Tujuan & Sasaran Pembelajaran:</span>
                        </div>
                        <ul className="space-y-1.5 pl-5 list-disc text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                          {tujuanList.map((t, tIdx) => (
                            <li key={tIdx} className="leading-snug">
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Pokok Pembahasan */}
                    {pokokList.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                          Pokok Pembahasan Utama:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {pokokList.map((pokok, pIdx) => (
                            <div
                              key={pIdx}
                              className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-xs flex items-start gap-2 text-zinc-800 dark:text-zinc-200"
                            >
                              <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                {pIdx + 1}
                              </span>
                              <span className="leading-relaxed">{pokok}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metode & Proses Kegiatan */}
                    {(metodeList.length > 0 || prosesList.length > 0 || harapanList.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        {metodeList.length > 0 && (
                          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                              Metode Pembelajaran
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {metodeList.map((m, mIdx) => (
                                <span
                                  key={mIdx}
                                  className="text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-md"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {prosesList.length > 0 && (
                          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                              Tahapan Kegiatan
                            </span>
                            <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                              {prosesList.map((pr, prIdx) => (
                                <li key={prIdx} className="flex items-start gap-1.5">
                                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold shrink-0">
                                    {prIdx + 1}.
                                  </span>
                                  <span className="leading-tight">{pr}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {harapanList.length > 0 && (
                          <div className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                              Output & Capaian
                            </span>
                            <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                              {harapanList.map((h, hIdx) => (
                                <li key={hIdx} className="flex items-start gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                  <span className="leading-tight">{h}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Berkas Bahan Ajar & Modul Sesi Ini */}
                    {(() => {
                      const sName = (item.subjectName || "").toLowerCase();
                      const words = sName.split(/\s+/).filter((w) => w.length > 3);

                      const matchingMatFiles: { name: string; size?: string; url?: string; matId: string }[] = [];

                      materialsList.forEach((mat) => {
                        const mTitle = (mat.title || mat.fileName || "").toLowerCase();
                        const mDesc = (mat.description || "").toLowerCase();
                        const isMatch = mTitle.includes(sName) || sName.includes(mTitle) || words.some((w) => mTitle.includes(w) || mDesc.includes(w));

                        if (isMatch) {
                          if (mat.materialFiles && mat.materialFiles.length > 0) {
                            mat.materialFiles.forEach((f) => {
                              matchingMatFiles.push({ name: f.name, size: f.size, url: f.url, matId: mat.id });
                            });
                          } else if (mat.fileName) {
                            matchingMatFiles.push({ name: mat.fileName, size: mat.fileSize, url: mat.fileUrl, matId: mat.id });
                          }

                          if (mat.referensiFiles && mat.referensiFiles.length > 0) {
                            mat.referensiFiles.forEach((f) => {
                              matchingMatFiles.push({ name: f.name, size: f.size, url: f.url, matId: mat.id });
                            });
                          }
                        }
                      });

                      const primaryLevelModul = materialsList.length > 0 ? materialsList[0] : null;

                      return (
                        <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                              <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              Berkas Bahan Ajar & Modul Materi:
                            </span>
                            {matchingMatFiles.length > 0 && (
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                                {matchingMatFiles.length} Berkas Tersedia
                              </span>
                            )}
                          </div>

                          {matchingMatFiles.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {matchingMatFiles.map((f, fIdx) => {
                                const typeBadge = getFileTypeBadge(f.name);
                                return (
                                  <div
                                    key={fIdx}
                                    className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <Badge className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded ${typeBadge.color}`}>
                                        {typeBadge.label}
                                      </Badge>
                                      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate" title={f.name}>
                                        {f.name}
                                      </span>
                                      {f.size && (
                                        <span className="text-[9px] text-zinc-400 font-mono shrink-0">
                                          ({f.size})
                                        </span>
                                      )}
                                    </div>

                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        if (onDownloadFile) {
                                          onDownloadFile(f.url || "#", f.name, f.matId);
                                        } else {
                                          const link = document.createElement("a");
                                          link.href = f.url || "#";
                                          link.setAttribute("download", f.name);
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }
                                      }}
                                      className="h-6 px-2 text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer shrink-0 shadow-none flex items-center gap-1"
                                    >
                                      <Download className="w-3 h-3" /> Unduh
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                Pokok bahasan ini tercakup lengkap dalam Modul Utama Jenjang {levelId}.
                              </span>

                              {primaryLevelModul && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const file = primaryLevelModul.materialFiles?.[0] || { name: primaryLevelModul.fileName, url: primaryLevelModul.fileUrl };
                                    if (onDownloadFile) {
                                      onDownloadFile(file.url || "#", file.name, primaryLevelModul.id);
                                    } else {
                                      window.open(file.url || "#", "_blank");
                                    }
                                  }}
                                  className="h-6 px-2.5 text-[10px] font-semibold border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded cursor-pointer shrink-0 shadow-none flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" /> Unduh Modul {levelId}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
