"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  BookOpen,
  Sparkles,
  Search,
  ExternalLink,
  Layers,
  CheckCircle2,
  HardDrive
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MaterialFile } from "@/lib/db";
import { LevelId, getFileTypeBadge } from "./types";

interface MaterialDownloadsProps {
  levelId: LevelId;
  materialsList: MaterialFile[];
  onDownloadFile: (fileUrl: string, fileName: string, materialId: string) => void;
}

export const MaterialDownloads: React.FC<MaterialDownloadsProps> = ({
  levelId,
  materialsList,
  onDownloadFile,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMaterials = materialsList.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = m.title?.toLowerCase().includes(q);
    const matchName = m.fileName?.toLowerCase().includes(q);
    const matchDesc = m.description?.toLowerCase().includes(q);
    const matchRef = m.referensi?.toLowerCase().includes(q);
    const matchSubFiles = m.materialFiles?.some((f) => f.name?.toLowerCase().includes(q));
    const matchRefFiles = m.referensiFiles?.some((f) => f.name?.toLowerCase().includes(q));

    return Boolean(matchTitle || matchName || matchDesc || matchRef || matchSubFiles || matchRefFiles);
  });

  return (
    <div className="space-y-4">
      {/* Search Header for Downloads */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari modul, handout, buku referensi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 text-zinc-500 shrink-0 border-zinc-200 dark:border-zinc-800">
          {materialsList.length} Modul
        </Badge>
      </div>

      {filteredMaterials.length === 0 ? (
        <Card className="p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
          <FileText className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto" />
          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
            {searchQuery ? "Berkas tidak ditemukan" : "Belum Ada Modul Digital"}
          </h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
            {searchQuery
              ? `Tidak ada berkas dengan kata kunci "${searchQuery}".`
              : `Bahan ajar dan buku rujukan jenjang ${levelId} akan segera diunggah oleh pengurus.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {filteredMaterials.map((item) => {
            const allMatFiles =
              item.materialFiles && item.materialFiles.length > 0
                ? item.materialFiles
                : item.fileName
                ? [{ name: item.fileName, size: item.fileSize, url: item.fileUrl }]
                : [];
            const allRefFiles = item.referensiFiles && item.referensiFiles.length > 0 ? item.referensiFiles : [];
            const displayName = item.title || item.fileName || "Modul Kaderisasi";

            return (
              <Card
                key={item.id}
                className="overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition-all p-4 sm:p-5 space-y-3.5"
              >
                {/* Title & Download Count */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                      {displayName}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full">
                    {item.downloadCount || 0}x diunduh
                  </span>
                </div>

                {/* Core Material Files */}
                {allMatFiles.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Berkas Materi Pokok
                    </span>
                    <div className="space-y-1.5">
                      {allMatFiles.map((mFile, mIdx) => {
                        const typeBadge = getFileTypeBadge(mFile.name);
                        return (
                          <div
                            key={mIdx}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 gap-2.5 group hover:border-blue-400/40 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                              <Badge className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${typeBadge.color}`}>
                                {typeBadge.label}
                              </Badge>
                              <span
                                className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                                title={mFile.name}
                              >
                                {mFile.name}
                              </span>
                              {mFile.size && (
                                <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                                  ({mFile.size})
                                </span>
                              )}
                            </div>

                            <Button
                              onClick={() => onDownloadFile(mFile.url || "#", mFile.name, item.id)}
                              size="sm"
                              className="h-7 px-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer shrink-0 shadow-none flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh</span>
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Supplementary References */}
                {allRefFiles.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                      Literatur & Buku Referensi Tambahan
                    </span>
                    <div className="space-y-1.5">
                      {allRefFiles.map((rFile, rIdx) => {
                        const typeBadge = getFileTypeBadge(rFile.name);
                        return (
                          <div
                            key={rIdx}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50/20 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 gap-2.5 group"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                              <Badge className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${typeBadge.color}`}>
                                {typeBadge.label}
                              </Badge>
                              <span
                                className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate"
                                title={rFile.name}
                              >
                                {rFile.name}
                              </span>
                              {rFile.size && (
                                <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                                  ({rFile.size})
                                </span>
                              )}
                            </div>

                            <Button
                              onClick={() => onDownloadFile(rFile.url || "#", rFile.name, item.id)}
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md cursor-pointer shrink-0 shadow-none flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh</span>
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {item.referensi && allRefFiles.length === 0 && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60">
                    <span className="font-semibold not-italic text-zinc-700 dark:text-zinc-300">
                      Rujukan Pustaka:{" "}
                    </span>
                    {item.referensi}
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
