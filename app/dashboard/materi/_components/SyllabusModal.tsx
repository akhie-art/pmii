import React from "react";
import { X } from "lucide-react";
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
import type { SyllabusItem, KaderisasiLevel } from "./types";
import type { KaderisasiMateri } from "@/lib/db";

interface SyllabusModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingSyllabus: SyllabusItem | null;
  selectedLevel: KaderisasiLevel;
  kaderisasiMateriList: KaderisasiMateri[];
  syllabusSubjectName: string;
  setSyllabusSubjectName: (name: string) => void;
  syllabusDuration: number;
  setSyllabusDuration: (duration: number) => void;
  syllabusTujuan: string[];
  setSyllabusTujuan: React.Dispatch<React.SetStateAction<string[]>>;
  syllabusPokokPembahasan: string[];
  setSyllabusPokokPembahasan: React.Dispatch<React.SetStateAction<string[]>>;
  syllabusMetode: string[];
  setSyllabusMetode: React.Dispatch<React.SetStateAction<string[]>>;
  syllabusProsesKegiatan: string[];
  setSyllabusProsesKegiatan: React.Dispatch<React.SetStateAction<string[]>>;
  syllabusHarapan: string[];
  setSyllabusHarapan: React.Dispatch<React.SetStateAction<string[]>>;
  onSaveSyllabus: () => void;
}

export const SyllabusModal: React.FC<SyllabusModalProps> = ({
  isOpen,
  onOpenChange,
  editingSyllabus,
  selectedLevel,
  kaderisasiMateriList,
  syllabusSubjectName,
  setSyllabusSubjectName,
  syllabusDuration,
  setSyllabusDuration,
  syllabusTujuan,
  setSyllabusTujuan,
  syllabusPokokPembahasan,
  setSyllabusPokokPembahasan,
  syllabusMetode,
  setSyllabusMetode,
  syllabusProsesKegiatan,
  setSyllabusProsesKegiatan,
  syllabusHarapan,
  setSyllabusHarapan,
  onSaveSyllabus
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-full max-w-[calc(100vw-1.5rem)] min-w-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 sm:p-6 shadow-xl">
        <DialogHeader className="min-w-0">
          <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white truncate">
            {editingSyllabus ? "Edit Pokok Pembelajaran" : "Tambah Pokok Pembelajaran"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
            Masukkan rincian kurikulum wajib untuk jenjang {selectedLevel.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 w-full min-w-0 max-w-full overflow-hidden max-h-[75vh] overflow-y-auto pr-1">
          {/* 1. NAMA MATERI (SELECT DARI KADERISASI) & DURASI */}
          <div className="space-y-3 min-w-0 w-full">
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
                  value={syllabusSubjectName}
                  onValueChange={(val: string | null) => {
                    if (val) setSyllabusSubjectName(val);
                  }}
                >
                  <SelectTrigger className="w-full min-w-0 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none">
                    <SelectValue placeholder="Pilih Nama Materi dari Kaderisasi">
                      {syllabusSubjectName || "Pilih Nama Materi dari Kaderisasi"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg">
                    {Array.from(
                      new Set([
                        ...kaderisasiMateriList.map((m) => m.judul).filter(Boolean),
                        ...(syllabusSubjectName ? [syllabusSubjectName] : [])
                      ])
                    ).map((mName, idx) => (
                      <SelectItem key={idx} value={mName}>
                        {mName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-1.5">
                  <Input
                    value={syllabusSubjectName}
                    onChange={(e) => setSyllabusSubjectName(e.target.value)}
                    placeholder="Masukkan nama materi (atau tambahkan materi di menu Kaderisasi terlebih dahulu)"
                    className="w-full min-w-0 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none"
                  />
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">
                    Catatan: Belum ada materi pembelajaran untuk jenjang ini di menu Kaderisasi. Anda
                    dapat mengetik manual atau menambahkannya terlebih dahulu di menu Kaderisasi.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5 min-w-0 w-full sm:w-1/2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Durasi (Menit)
              </label>
              <Input
                type="number"
                min={1}
                value={syllabusDuration}
                onChange={(e) => setSyllabusDuration(Number(e.target.value))}
                placeholder="90"
                className="w-full min-w-0 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none"
              />
            </div>
          </div>

          {/* 2. TUJUAN */}
          <div className="space-y-2 min-w-0 w-full pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Tujuan {syllabusTujuan.length > 0 && `(${syllabusTujuan.length})`}
              </label>
              <button
                type="button"
                onClick={() => setSyllabusTujuan((prev) => [...prev, ""])}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent"
              >
                + Tambah Tujuan
              </button>
            </div>

            <div className="space-y-1.5">
              {syllabusTujuan.map((val, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-400 w-4 text-right shrink-0">
                    {idx + 1}.
                  </span>
                  <Input
                    value={val}
                    onChange={(e) => {
                      const next = [...syllabusTujuan];
                      next[idx] = e.target.value;
                      setSyllabusTujuan(next);
                    }}
                    placeholder={`Tujuan ke-${idx + 1}...`}
                    className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none flex-1 min-w-0"
                  />
                  {syllabusTujuan.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSyllabusTujuan((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                      title="Hapus tujuan ini"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. POKOK PEMBAHASAN */}
          <div className="space-y-2 min-w-0 w-full pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Pokok Pembahasan{" "}
                {syllabusPokokPembahasan.length > 0 && `(${syllabusPokokPembahasan.length})`}
              </label>
              <button
                type="button"
                onClick={() => setSyllabusPokokPembahasan((prev) => [...prev, ""])}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent"
              >
                + Tambah Pokok Pembahasan
              </button>
            </div>

            <div className="space-y-1.5">
              {syllabusPokokPembahasan.map((val, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-400 w-4 text-right shrink-0">
                    {idx + 1}.
                  </span>
                  <Input
                    value={val}
                    onChange={(e) => {
                      const next = [...syllabusPokokPembahasan];
                      next[idx] = e.target.value;
                      setSyllabusPokokPembahasan(next);
                    }}
                    placeholder={`Pokok pembahasan ke-${idx + 1}...`}
                    className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none flex-1 min-w-0"
                  />
                  {syllabusPokokPembahasan.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSyllabusPokokPembahasan((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                      title="Hapus pokok pembahasan ini"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 4. METODE */}
          <div className="space-y-2 min-w-0 w-full pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Metode {syllabusMetode.length > 0 && `(${syllabusMetode.length})`}
              </label>
              <button
                type="button"
                onClick={() => setSyllabusMetode((prev) => [...prev, ""])}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent"
              >
                + Tambah Metode
              </button>
            </div>

            <div className="space-y-1.5">
              {syllabusMetode.map((val, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-400 w-4 text-right shrink-0">
                    {idx + 1}.
                  </span>
                  <Input
                    value={val}
                    onChange={(e) => {
                      const next = [...syllabusMetode];
                      next[idx] = e.target.value;
                      setSyllabusMetode(next);
                    }}
                    placeholder={`Metode ke-${idx + 1} (Contoh: Ceramah, Dialog, FGD, Simulasi...)`}
                    className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none flex-1 min-w-0"
                  />
                  {syllabusMetode.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSyllabusMetode((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                      title="Hapus metode ini"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 5. PROSES KEGIATAN */}
          <div className="space-y-2 min-w-0 w-full pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Proses Kegiatan{" "}
                {syllabusProsesKegiatan.length > 0 && `(${syllabusProsesKegiatan.length})`}
              </label>
              <button
                type="button"
                onClick={() => setSyllabusProsesKegiatan((prev) => [...prev, ""])}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent"
              >
                + Tambah Proses Kegiatan
              </button>
            </div>

            <div className="space-y-1.5">
              {syllabusProsesKegiatan.map((val, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-400 w-4 text-right shrink-0">
                    {idx + 1}.
                  </span>
                  <Input
                    value={val}
                    onChange={(e) => {
                      const next = [...syllabusProsesKegiatan];
                      next[idx] = e.target.value;
                      setSyllabusProsesKegiatan(next);
                    }}
                    placeholder={`Tahap/kegiatan ke-${idx + 1} (Contoh: Orientasi sesi, pemaparan narasumber...)`}
                    className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none flex-1 min-w-0"
                  />
                  {syllabusProsesKegiatan.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSyllabusProsesKegiatan((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                      title="Hapus proses kegiatan ini"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 6. HARAPAN */}
          <div className="space-y-2 min-w-0 w-full pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Harapan {syllabusHarapan.length > 0 && `(${syllabusHarapan.length})`}
              </label>
              <button
                type="button"
                onClick={() => setSyllabusHarapan((prev) => [...prev, ""])}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent"
              >
                + Tambah Harapan
              </button>
            </div>

            <div className="space-y-1.5">
              {syllabusHarapan.map((val, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-400 w-4 text-right shrink-0">
                    {idx + 1}.
                  </span>
                  <Input
                    value={val}
                    onChange={(e) => {
                      const next = [...syllabusHarapan];
                      next[idx] = e.target.value;
                      setSyllabusHarapan(next);
                    }}
                    placeholder={`Harapan ke-${idx + 1} (Contoh: Kader memiliki kesadaran kritis & komitmen...)`}
                    className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none flex-1 min-w-0"
                  />
                  {syllabusHarapan.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSyllabusHarapan((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                      title="Hapus harapan ini"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
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
            onClick={onSaveSyllabus}
            className="text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white h-8 px-4 cursor-pointer shadow-none"
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
