"use client";

import React from "react";
import {
  Clock,
  Upload,
  RefreshCw,
  FileText,
  ExternalLink,
  Trash2,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { EventActivity } from "@/lib/db";
import {
  ALLOWED_REQUIREMENT_ACCEPT,
  isSafeDocumentUrl,
  openSafeDocumentUrl,
} from "./verifikasi-helper";

interface TaskModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingReqId: string | null;
  selectedEventId: string;
  selectedEvent: EventActivity | null;
  tenantEvents: EventActivity[];
  reqFormEventId: string;
  onReqFormEventIdChange: (id: string) => void;
  reqFormTitle: string;
  onReqFormTitleChange: (title: string) => void;
  reqFormDeadline: string;
  onReqFormDeadlineChange: (dl: string) => void;
  reqFormMinSubmissions: number;
  onReqFormMinSubmissionsChange: (val: number) => void;
  reqFormFileUrl: string;
  reqFormFileName: string;
  reqFormFileSize: string;
  isUploadingReqFile: boolean;
  isSavingReq: boolean;
  onReqFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveReqFile: () => void;
  reqFormDescription: string;
  onReqFormDescriptionChange: (desc: string) => void;
  onSaveRequirement: (e: React.FormEvent) => void;
}

export function TaskModal({
  isOpen,
  onOpenChange,
  editingReqId,
  selectedEventId,
  selectedEvent,
  tenantEvents,
  reqFormEventId,
  onReqFormEventIdChange,
  reqFormTitle,
  onReqFormTitleChange,
  reqFormDeadline,
  onReqFormDeadlineChange,
  reqFormMinSubmissions,
  onReqFormMinSubmissionsChange,
  reqFormFileUrl,
  reqFormFileName,
  reqFormFileSize,
  isUploadingReqFile,
  isSavingReq,
  onReqFileChange,
  onRemoveReqFile,
  reqFormDescription,
  onReqFormDescriptionChange,
  onSaveRequirement,
}: TaskModalProps) {
  const canOpenFile = isSafeDocumentUrl(reqFormFileUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
        <DialogHeader className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30">
          <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {editingReqId ? "Edit Tugas RTL" : "Tambah Tugas RTL"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Tetapkan tugas yang wajib dikerjakan dan diunggah oleh peserta kegiatan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSaveRequirement} className="flex flex-col">
          <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* 1. Cakupan Penugasan Otomatis Kegiatan yang Dipilih */}
            {selectedEventId !== "ALL" && selectedEvent ? (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                    Kegiatan Penugasan
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate block">
                    {selectedEvent.name || selectedEvent.title}
                  </span>
                </div>
                <span className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 tracking-wide">
                  {selectedEvent.level}
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Pilih Kegiatan Penugasan <span className="text-rose-500">*</span>
                </label>
                {tenantEvents.length > 0 ? (
                  <select
                    value={reqFormEventId}
                    onChange={(e) => onReqFormEventIdChange(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  >
                    {tenantEvents.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        [{evt.level}] {evt.name || evt.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-700 dark:text-amber-300">
                    Belum ada agenda kegiatan pada lingkup komisariat ini. Buat kegiatan terlebih dahulu untuk mengikat tugas RTL ke agenda spesifik.
                  </div>
                )}
              </div>
            )}

            {/* 2. Judul Tugas */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Judul Tugas <span className="text-rose-500">*</span>
              </label>
              <Input
                value={reqFormTitle}
                onChange={(e) => onReqFormTitleChange(e.target.value)}
                placeholder="Contoh: Resume Buku Sejarah PMII & Ke-Aswaja-an"
                className="h-9 text-xs rounded-xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 shadow-none px-3"
                required
              />
            </div>

            {/* 3. Deadline Tugas & Minimal Laporan Disetujui */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Deadline Tugas</span>
                </label>
                <Input
                  type="datetime-local"
                  value={reqFormDeadline}
                  onChange={(e) => onReqFormDeadlineChange(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 shadow-none px-3 cursor-pointer"
                />
                <p className="text-[10.5px] text-zinc-400">
                  Batas akhir pengumpulan tugas (opsional).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Minimal Laporan Disetujui</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={reqFormMinSubmissions}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    onReqFormMinSubmissionsChange(
                      Number.isFinite(parsed)
                        ? Math.max(1, Math.min(20, parsed))
                        : 1
                    );
                  }}
                  className="h-9 text-xs rounded-xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 shadow-none px-3"
                />
                <p className="text-[10.5px] text-zinc-400">
                  Jumlah laporan terverifikasi untuk menuntaskan tugas ini (default 1).
                </p>
              </div>
            </div>

            {/* 4. Upload Berkas Panduan / Soal Tugas */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-zinc-400" />
                <span>Upload Berkas Panduan / Soal (Opsional)</span>
              </label>

              {reqFormFileUrl ? (
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                        {reqFormFileName || "Berkas Panduan"}
                      </span>
                      <span className="text-[10px] text-zinc-400 block">
                        {reqFormFileSize || "Tersimpan"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {canOpenFile && (
                      <button
                        type="button"
                        onClick={() => void openSafeDocumentUrl(reqFormFileUrl)}
                        className="h-8 w-8 inline-flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Lihat Berkas"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onRemoveReqFile}
                      disabled={isSavingReq}
                      className="h-8 w-8 inline-flex items-center justify-center text-rose-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      title="Hapus Berkas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    id="req-file-upload"
                    onChange={onReqFileChange}
                    disabled={isUploadingReqFile || isSavingReq}
                    accept={ALLOWED_REQUIREMENT_ACCEPT}
                    className="hidden"
                  />
                  <label
                    htmlFor="req-file-upload"
                    className={`w-full p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                      isUploadingReqFile || isSavingReq
                        ? "opacity-50 pointer-events-none"
                        : ""
                    }`}
                  >
                    {isUploadingReqFile ? (
                      <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 py-1.5">
                        <RefreshCw className="w-4 h-4 animate-spin text-zinc-900 dark:text-zinc-100" />
                        <span>Mengunggah berkas...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center mb-0.5">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          Pilih berkas panduan / modul / soal
                        </span>
                        <span className="text-[10.5px] text-zinc-400 text-center">
                          PDF, Word, Excel, PPT, CSV, atau Gambar (Maks. 10 MB)
                        </span>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>

            {/* 5. Deskripsi / Petunjuk Pengerjaan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Deskripsi & Petunjuk Teknis Tugas
              </label>
              <textarea
                rows={3}
                value={reqFormDescription}
                onChange={(e) => onReqFormDescriptionChange(e.target.value)}
                placeholder="Jelaskan petunjuk teknis tugas, format laporan (PDF/Doc), link rujukan, atau kriteria penilaian..."
                className="w-full text-xs p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 min-h-[90px] text-zinc-900 dark:text-zinc-100 font-normal resize-none shadow-none leading-relaxed placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isSavingReq}
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs font-medium rounded-xl border-zinc-200 dark:border-zinc-800 shadow-none cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isUploadingReqFile || isSavingReq}
              className="h-9 px-5 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 shadow-none cursor-pointer transition-colors inline-flex items-center gap-1.5"
            >
              {isSavingReq ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : editingReqId ? (
                "Simpan Perubahan"
              ) : (
                "Tambahkan Tugas"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
