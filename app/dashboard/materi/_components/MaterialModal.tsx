import React from "react";
import { Plus, X, FileText, BookMarked, CheckCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import type { MaterialFile, FileAttachment, KaderisasiLevel } from "./types";
import type { KaderisasiMateri } from "@/lib/db";

interface MaterialModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingMaterial: MaterialFile | null;
  selectedLevel: KaderisasiLevel;
  kaderisasiMateriList: KaderisasiMateri[];
  materialTitle: string;
  setMaterialTitle: (title: string) => void;
  materialFiles: FileAttachment[];
  referensiFiles: FileAttachment[];
  uploadingMaterial: boolean;
  materialProgress: number;
  materialCurrentFile: string;
  uploadingRef: boolean;
  refProgress: number;
  refCurrentFile: string;
  onMaterialFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRefFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveMaterialFile: (idx: number) => void;
  onRemoveRefFile: (idx: number) => void;
  onSaveMaterial: () => void;
}

export const MaterialModal: React.FC<MaterialModalProps> = ({
  isOpen,
  onOpenChange,
  editingMaterial,
  selectedLevel,
  kaderisasiMateriList,
  materialTitle,
  setMaterialTitle,
  materialFiles,
  referensiFiles,
  uploadingMaterial,
  materialProgress,
  materialCurrentFile,
  uploadingRef,
  refProgress,
  refCurrentFile,
  onMaterialFilesChange,
  onRefFilesChange,
  onRemoveMaterialFile,
  onRemoveRefFile,
  onSaveMaterial
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-full max-w-[calc(100vw-1.5rem)] min-w-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 sm:p-6 shadow-xl">
        <DialogHeader className="min-w-0">
          <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white truncate">
            {editingMaterial ? "Edit Materi Kaderisasi" : "Tambah Materi Kaderisasi"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
            Kelola nama materi, berkas materi, dan berkas referensi/sumber untuk jenjang{" "}
            {selectedLevel.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 w-full min-w-0 max-w-full overflow-hidden max-h-[70vh] overflow-y-auto pr-1">
          {/* 1. NAMA MATERI (SELECT DARI KADERISASI) */}
          <div className="space-y-1.5 min-w-0 w-full">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Nama Materi <span className="text-blue-600 dark:text-blue-400">*</span>
              </label>
              <span className="text-[10px] text-zinc-400 font-normal">
                Dari Kaderisasi ({kaderisasiMateriList.length} materi)
              </span>
            </div>

            {kaderisasiMateriList.length > 0 ? (
              <Select
                value={materialTitle}
                onValueChange={(val: string | null) => {
                  if (val) setMaterialTitle(val);
                }}
              >
                <SelectTrigger className="w-full min-w-0 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none">
                  <SelectValue placeholder="Pilih Nama Materi dari Kaderisasi">
                    {materialTitle || "Pilih Nama Materi dari Kaderisasi"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg">
                  {Array.from(
                    new Set([
                      ...kaderisasiMateriList.map((m) => m.judul).filter(Boolean),
                      ...(materialTitle ? [materialTitle] : [])
                    ])
                  ).map((judul, idx) => (
                    <SelectItem key={idx} value={judul}>
                      {judul}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-1.5">
                <Input
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  placeholder="Masukkan nama materi (atau tambahkan materi di menu Kaderisasi)"
                  className="w-full min-w-0 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none"
                />
                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                  Catatan: Belum ada materi pembelajaran untuk jenjang ini di menu Kaderisasi. Anda
                  dapat mengetik manual atau menambahkannya terlebih dahulu di menu Kaderisasi.
                </p>
              </div>
            )}
          </div>

          {/* 2. PILIH BERKAS MATERI (MULTIPLE FILES) */}
          <div className="space-y-2 min-w-0 w-full pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Berkas Materi {materialFiles.length > 0 && `(${materialFiles.length} file)`}
              </label>
              {materialFiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => document.getElementById("material-files-input")?.click()}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent"
                >
                  + Tambah Berkas Materi
                </button>
              )}
            </div>

            <input
              id="material-files-input"
              type="file"
              multiple
              className="hidden"
              onChange={onMaterialFilesChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xlsx,.xls"
            />

            {materialFiles.length === 0 ? (
              <div
                onClick={() => document.getElementById("material-files-input")?.click()}
                className="w-full border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-5 text-center hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col items-center justify-center space-y-1.5 group"
              >
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover:scale-105 transition-transform text-zinc-600 dark:text-zinc-300">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Pilih berkas materi (Bisa &gt;1 file)
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">
                  PDF, DOC, PPT, TXT, XLS (Maks 20MB per file)
                </span>
              </div>
            ) : (
              <div className="w-full space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {materialFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between gap-2 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                      <FileText className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                      <span
                        className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate block w-full"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                        ({file.size})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveMaterialFile(idx)}
                      className="text-zinc-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                      title="Hapus berkas ini"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadingMaterial && (
              <div className="w-full bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg p-3 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {materialProgress === 100 ? (
                      <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 block truncate text-xs">
                        {materialProgress === 100
                          ? "Selesai memproses berkas"
                          : "Sedang memproses berkas materi..."}
                      </span>
                      {materialCurrentFile && (
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate font-mono">
                          {materialCurrentFile}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 shrink-0">
                    {materialProgress}%
                  </span>
                </div>
                <div className="w-full bg-blue-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${materialProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. PILIH BERKAS REFERENSI / SUMBER (MULTIPLE FILES) */}
          <div className="space-y-2 min-w-0 w-full pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Berkas Referensi / Sumber {referensiFiles.length > 0 && `(${referensiFiles.length} file)`}
              </label>
              {referensiFiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => document.getElementById("ref-files-input")?.click()}
                  className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:underline cursor-pointer border-none bg-transparent"
                >
                  + Tambah Berkas Referensi
                </button>
              )}
            </div>

            <input
              id="ref-files-input"
              type="file"
              multiple
              className="hidden"
              onChange={onRefFilesChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xlsx,.xls"
            />

            {referensiFiles.length === 0 ? (
              <div
                onClick={() => document.getElementById("ref-files-input")?.click()}
                className="w-full border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-5 text-center hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col items-center justify-center space-y-1.5 group"
              >
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover:scale-105 transition-transform text-zinc-600 dark:text-zinc-300">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Pilih berkas referensi/buku sumber (Bisa &gt;1 file)
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">
                  Jurnal, e-book acuan, modul pembanding (Maks 20MB per file)
                </span>
              </div>
            ) : (
              <div className="w-full space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {referensiFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="w-full border border-zinc-200/80 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between gap-2 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                      <BookMarked className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                      <span
                        className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate block w-full"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                        ({file.size})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveRefFile(idx)}
                      className="text-zinc-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                      title="Hapus referensi ini"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadingRef && (
              <div className="w-full bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg p-3 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {refProgress === 100 ? (
                      <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 block truncate text-xs">
                        {refProgress === 100
                          ? "Selesai memproses referensi"
                          : "Sedang memproses berkas referensi..."}
                      </span>
                      {refCurrentFile && (
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate font-mono">
                          {refCurrentFile}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 shrink-0">
                    {refProgress}%
                  </span>
                </div>
                <div className="w-full bg-blue-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${refProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <DialogClose
            render={
              <Button
                variant="outline"
                className="text-xs font-semibold rounded-lg h-8 px-3 cursor-pointer shadow-none"
              />
            }
          >
            Batal
          </DialogClose>
          <Button
            onClick={onSaveMaterial}
            className="text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white h-8 px-4 cursor-pointer shadow-none"
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
