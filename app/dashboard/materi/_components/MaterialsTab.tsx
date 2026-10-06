import React from "react";
import { Plus, Download, Pencil, Trash2, FileText, BookOpen, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MaterialFile, KaderisasiLevel } from "./types";

interface MaterialsTabProps {
  selectedLevel: KaderisasiLevel;
  onOpenAddMaterial: () => void;
  onOpenEditMaterial: (mat: MaterialFile) => void;
  onDeleteMaterial: (id: string) => void;
  onDownloadFile: (url: string, fileName: string, matId: string) => void;
}

export const MaterialsTab: React.FC<MaterialsTabProps> = ({
  selectedLevel,
  onOpenAddMaterial,
  onOpenEditMaterial,
  onDeleteMaterial,
  onDownloadFile
}) => {
  return (
    <div className="space-y-4">
      {/* CONTENT LIST */}

      {selectedLevel.materials.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
          <FolderOpen className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-2.5" />
          <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Belum ada modul untuk {selectedLevel.name}
          </h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 mb-4 max-w-sm mx-auto">
            Unggah modul utama dan berkas referensi bacaan untuk peserta dan instruktur.
          </p>
          <Button
            onClick={onOpenAddMaterial}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg h-8 px-3.5 cursor-pointer border-none inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Unggah Modul Pertama</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {selectedLevel.materials.map((mat) => {
            const title = mat.title || mat.fileName;
            const matList =
              mat.materialFiles && mat.materialFiles.length > 0
                ? mat.materialFiles
                : mat.fileName
                ? [{ name: mat.fileName, size: mat.fileSize, url: mat.fileUrl || "" }]
                : [];
            const refList = mat.referensiFiles || [];

            return (
              <div
                key={mat.id}
                className="border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-3.5 sm:p-4 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
              >
                <div className="space-y-3">
                  {/* Title & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4
                        className="text-xs font-bold text-zinc-900 dark:text-white leading-snug truncate"
                        title={title}
                      >
                        {title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                          {matList.length} berkas materi
                        </span>
                        {refList.length > 0 && (
                          <>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                              {refList.length} referensi
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenEditMaterial(mat)}
                        className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                        title="Edit Materi"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteMaterial(mat.id)}
                        className="w-7 h-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-400 hover:text-rose-600 cursor-pointer"
                        title="Hapus Materi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* List of Material Files */}
                  {matList.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                        Berkas Materi Pokok
                      </span>
                      <div className="space-y-1.5">
                        {matList.map((f, fIdx) => (
                          <div
                            key={fIdx}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70 text-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                              <FileText className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                              <span
                                className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate block"
                                title={f.name}
                              >
                                {f.name}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                                ({f.size})
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDownloadFile(f.url, f.name, mat.id)}
                              className="h-6.5 px-2.5 text-[11px] font-medium border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-none rounded-md cursor-pointer shrink-0 flex items-center gap-1.5"
                            >
                              <Download className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                              <span>Unduh</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* List of Referensi Files */}
                  {refList.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                        Berkas Referensi & Sumber
                      </span>
                      <div className="space-y-1.5">
                        {refList.map((r, rIdx) => (
                          <div
                            key={rIdx}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70 text-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                              <BookOpen className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                              <span
                                className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate block"
                                title={r.name}
                              >
                                {r.name}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                                ({r.size})
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDownloadFile(r.url, r.name, mat.id)}
                              className="h-6.5 px-2.5 text-[11px] font-medium border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-none rounded-md cursor-pointer shrink-0 flex items-center gap-1.5"
                            >
                              <Download className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                              <span>Unduh</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
