import React from "react";
import { Edit2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { type BoardMember, getInitials } from "./types";

interface PengurusFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingMember: BoardMember | null;
  formName: string;
  setFormName: (name: string) => void;
  formDept: string;
  setFormDept: (dept: string) => void;
  formPosition: string;
  setFormPosition: (pos: string) => void;
  formPeriod: string;
  cadres: any[];
  selectedCadreData: any;
  setSelectedCadreData: (data: any) => void;
  allDepartments: string[];
  activeCampus: string;
  onSubmit: (e: React.FormEvent) => void;
}

export const PengurusFormModal: React.FC<PengurusFormModalProps> = ({
  isOpen,
  onOpenChange,
  editingMember,
  formName,
  setFormName,
  formDept,
  setFormDept,
  formPosition,
  setFormPosition,
  formPeriod,
  cadres,
  selectedCadreData,
  setSelectedCadreData,
  allDepartments,
  activeCampus,
  onSubmit
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-lg w-full p-0 overflow-hidden">
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              {editingMember ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {editingMember ? "Edit Data Pengurus" : "Tambah Pengurus Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {editingMember
                  ? "Perbarui informasi fungsionaris kepengurusan terpilih."
                  : "Formulir pendaftaran fungsionaris baru komisariat."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Nama Pengurus (Select option dari Database Anggota) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>
                  Nama Lengkap Pengurus <span className="text-rose-500">*</span>
                </span>
                {cadres.length > 0 && (
                  <span className="text-[10px] text-zinc-400 font-normal">
                    {cadres.length} anggota terdaftar
                  </span>
                )}
              </label>

              {cadres.length > 0 ? (
                <select
                  required
                  value={formName}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    setFormName(selectedName);
                    const found = cadres.find((c) => c.name === selectedName);
                    setSelectedCadreData(found || null);
                  }}
                  className="w-full h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Pilih Anggota dari Database --</option>
                  {formName && !cadres.some((c) => c.name === formName) && (
                    <option value={formName}>{formName} (Pengurus Saat Ini)</option>
                  )}
                  {cadres.map((cadre) => (
                    <option key={cadre.id} value={cadre.name}>
                      {cadre.name} {cadre.commissariat ? `— ${cadre.commissariat}` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Muhammad Ali Ridho"
                  className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                />
              )}

              {selectedCadreData && (
                <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-3">
                  {selectedCadreData.avatar ? (
                    <img
                      src={selectedCadreData.avatar}
                      alt={selectedCadreData.name}
                      className="w-9 h-9 rounded-full object-cover border border-blue-300 dark:border-blue-700 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {getInitials(selectedCadreData.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {selectedCadreData.name}
                      </span>
                      {selectedCadreData.level && (
                        <Badge variant="outline" className="text-[9px] h-5 px-1.5 font-semibold">
                          {selectedCadreData.level}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate">
                      Komisariat: {selectedCadreData.commissariat || activeCampus}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Departemen & Jabatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Departemen / Divisi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formDept}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    setFormDept(newDept);
                    if (newDept === "BPH") {
                      setFormPosition("Ketua Komisariat");
                    } else {
                      setFormPosition("Kepala Bidang");
                    }
                  }}
                  className="w-full h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  {allDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Jabatan / Posisi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formPosition}
                  onChange={(e) => setFormPosition(e.target.value)}
                  className="w-full h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  {formDept === "BPH" ? (
                    <>
                      <option value="Ketua Komisariat">Ketua Komisariat</option>
                      <option value="Wakil Ketua">Wakil Ketua</option>
                      <option value="Sekretaris">Sekretaris</option>
                      <option value="Wakil Sekretaris">Wakil Sekretaris</option>
                      <option value="Bendahara">Bendahara</option>
                      <option value="Wakil Bendahara">Wakil Bendahara</option>
                      <option value="Pengurus BPH">Pengurus BPH</option>
                    </>
                  ) : (
                    <>
                      <option value="Kepala Bidang">Kepala Bidang (Kabid)</option>
                      <option value="Sekretaris Bidang">Sekretaris Bidang</option>
                      <option value="Bendahara Bidang">Bendahara Bidang</option>
                      <option value="Anggota Bidang">Anggota Bidang</option>
                    </>
                  )}
                  {formPosition &&
                    ![
                      "Ketua Komisariat",
                      "Wakil Ketua",
                      "Sekretaris",
                      "Wakil Sekretaris",
                      "Bendahara",
                      "Wakil Bendahara",
                      "Pengurus BPH",
                      "Kepala Bidang",
                      "Sekretaris Bidang",
                      "Bendahara Bidang",
                      "Anggota Bidang"
                    ].includes(formPosition) && (
                      <option value={formPosition}>{formPosition}</option>
                    )}
                </select>
              </div>
            </div>

            {/* Periode Kepengurusan */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Periode Kepengurusan</span>
              </label>
              <Input
                type="text"
                disabled
                value={formPeriod}
                className="h-9 text-xs bg-zinc-100 dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 cursor-not-allowed font-medium select-none"
              />
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
            >
              {editingMember ? "Simpan Perubahan" : "Tambahkan Pengurus"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
