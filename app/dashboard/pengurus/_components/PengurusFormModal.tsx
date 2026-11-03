import React, { useMemo, useState, useEffect } from "react";
import { Edit2, UserPlus, AlertTriangle, AlertCircle, Network, ClipboardList, Plus, Trash2 } from "lucide-react";
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
  formBiro?: string;
  setFormBiro?: (biro: string) => void;
  formPosition: string;
  setFormPosition: (pos: string) => void;
  formPeriod: string;
  formStatus: "AKTIF" | "DEMISIONER";
  setFormStatus: (status: "AKTIF" | "DEMISIONER") => void;
  formProgramKerja: string[];
  setFormProgramKerja: (val: string[]) => void;
  cadres: any[];
  selectedCadreData: any;
  setSelectedCadreData: (data: any) => void;
  allDepartments: string[];
  biros?: Record<string, string[]>;
  activeCampus: string;
  isCabangLevel?: boolean;
  boardMembers?: BoardMember[];
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
  formBiro = "",
  setFormBiro,
  formPosition,
  setFormPosition,
  formPeriod,
  formStatus,
  setFormStatus,
  formProgramKerja,
  setFormProgramKerja,
  cadres,
  selectedCadreData,
  setSelectedCadreData,
  allDepartments,
  biros = {},
  activeCampus,
  isCabangLevel = false,
  boardMembers = [],
  onSubmit
}) => {
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasAttemptedSubmit(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    if (!formName.trim()) {
      return;
    }
    onSubmit(e);
  };

  const isNameEmpty = hasAttemptedSubmit && !formName.trim();
  const existingPosition = useMemo(() => {
    if (!formName || !boardMembers.length) return null;
    return boardMembers.find(
      (m) =>
        m.name.toLowerCase().trim() === formName.toLowerCase().trim() &&
        m.id !== editingMember?.id
    );
  }, [formName, boardMembers, editingMember]);

  // Filter anggota yang belum memiliki jabatan aktif di kepengurusan
  // Anggota yang sedang aktif menjabat TIDAK akan muncul di opsi pilihan nama
  // sebelum jabatannya dicopot / berstatus demisioner.
  const selectableCadres = useMemo(() => {
    if (!cadres || cadres.length === 0) return [];

    const activeOccupiedNames = new Set(
      boardMembers
        .filter((m) => m.status === "AKTIF" && m.id !== editingMember?.id)
        .map((m) => m.name.toLowerCase().trim())
    );

    return cadres.filter(
      (c) => !activeOccupiedNames.has(c.name.toLowerCase().trim())
    );
  }, [cadres, boardMembers, editingMember]);

  // Cek apakah posisi Ketua sudah terisi di tenant / organisasi ini
  const hasActiveKetua = useMemo(() => {
    if (!boardMembers.length) return false;
    const tenantPool = boardMembers.filter((m) => {
      if (!activeCampus || activeCampus === "ALL") return true;
      return (
        m.commissariat?.toLowerCase() === activeCampus.toLowerCase() ||
        (m as any).campus?.toLowerCase() === activeCampus.toLowerCase()
      );
    });

    return tenantPool.some(
      (m) =>
        m.department === "BPH" &&
        (m.position.toLowerCase().includes("ketua") || m.position.toLowerCase().includes("ketum")) &&
        !m.position.toLowerCase().includes("wakil") &&
        m.status === "AKTIF" &&
        m.id !== editingMember?.id
    );
  }, [boardMembers, activeCampus, editingMember]);

  // Jika jabatan Ketua sudah ada, alihkan otomatis pilihan ke posisi lain (misal: Sekretaris)
  React.useEffect(() => {
    if (
      !editingMember &&
      formDept === "BPH" &&
      hasActiveKetua &&
      (formPosition === "Ketua Komisariat" || formPosition === "Ketua Cabang")
    ) {
      setFormPosition(isCabangLevel ? "Sekretaris Cabang" : "Sekretaris");
    }
  }, [editingMember, formDept, hasActiveKetua, formPosition, isCabangLevel, setFormPosition]);

  // Logika Otomatisasi Wakil Sekretaris & Wakil Bendahara:
  // Jika di tenant ini sudah ada Sekretaris/Bendahara Utama,
  // maka penambahan berikutnya otomatis dialokasikan menjadi Wakil Sekretaris / Wakil Bendahara N.
  const autoResolvedInfo = useMemo(() => {
    if (editingMember || formDept !== "BPH" || !boardMembers.length) return null;
    const posLower = (formPosition || "").toLowerCase();

    const isSekretaris = posLower.includes("sekretaris");
    const isBendahara = posLower.includes("bendahara");

    if (!isSekretaris && !isBendahara) return null;

    // Filter fungsionaris di tenant/kampus aktif
    const tenantPool = boardMembers.filter((m) => {
      if (!activeCampus || activeCampus === "ALL") return true;
      return (
        m.commissariat?.toLowerCase() === activeCampus.toLowerCase() ||
        (m as any).campus?.toLowerCase() === activeCampus.toLowerCase()
      );
    });

    if (isSekretaris) {
      const existingSekretaris = tenantPool.filter(
        (m) =>
          m.department === "BPH" &&
          m.position.toLowerCase().includes("sekretaris") &&
          !m.position.toLowerCase().includes("bidang")
      );
      const hasUtama = existingSekretaris.some(
        (m) => !m.position.toLowerCase().includes("wakil")
      );
      if (hasUtama) {
        const wakilCount = existingSekretaris.filter((m) =>
          m.position.toLowerCase().includes("wakil")
        ).length;
        const mainSekretaris = existingSekretaris.find(
          (m) => !m.position.toLowerCase().includes("wakil")
        );
        return {
          role: "Sekretaris",
          resolved: `Wakil Sekretaris ${wakilCount + 1}`,
          existingName: mainSekretaris?.name || "Utama"
        };
      }
    }

    if (isBendahara) {
      const existingBendahara = tenantPool.filter(
        (m) =>
          m.department === "BPH" &&
          m.position.toLowerCase().includes("bendahara") &&
          !m.position.toLowerCase().includes("bidang")
      );
      const hasUtama = existingBendahara.some(
        (m) => !m.position.toLowerCase().includes("wakil")
      );
      if (hasUtama) {
        const wakilCount = existingBendahara.filter((m) =>
          m.position.toLowerCase().includes("wakil")
        ).length;
        const mainBendahara = existingBendahara.find(
          (m) => !m.position.toLowerCase().includes("wakil")
        );
        return {
          role: "Bendahara",
          resolved: `Wakil Bendahara ${wakilCount + 1}`,
          existingName: mainBendahara?.name || "Utama"
        };
      }
    }

    return null;
  }, [editingMember, formDept, formPosition, boardMembers, activeCampus]);

  const handleAddProker = () => {
    setFormProgramKerja([...formProgramKerja, ""]);
  };

  const handleUpdateProker = (index: number, value: string) => {
    const updated = [...formProgramKerja];
    updated[index] = value;
    setFormProgramKerja(updated);
  };

  const handleRemoveProker = (index: number) => {
    const updated = formProgramKerja.filter((_, i) => i !== index);
    setFormProgramKerja(updated);
  };

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
                  : `Formulir penetapan fungsionaris baru ${isCabangLevel ? "Pengurus Cabang" : "Pengurus Komisariat"}.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Nama Pengurus (Select option dari Database Anggota) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>
                  Nama Lengkap Pengurus <span className="text-rose-500">*</span>
                </span>
                {cadres.length > 0 && (
                  <span className="text-[10px] text-zinc-400 font-normal">
                    {selectableCadres.length} kader tersedia
                    {cadres.length > selectableCadres.length && (
                      <span className="text-zinc-400">
                        {" "}• {cadres.length - selectableCadres.length} sudah menjabat
                      </span>
                    )}
                  </span>
                )}
              </label>

              {cadres.length > 0 ? (
                <div className="space-y-1.5">
                  <select
                    value={formName}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      setFormName(selectedName);
                      if (hasAttemptedSubmit && selectedName.trim()) {
                        setHasAttemptedSubmit(false);
                      }
                      const found =
                        cadres.find((c) => c.name === selectedName) ||
                        selectableCadres.find((c) => c.name === selectedName);
                      setSelectedCadreData(found || null);
                    }}
                    className={`w-full h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border rounded-lg px-3 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:outline-none transition-colors ${
                      isNameEmpty
                        ? "border-rose-400 dark:border-rose-600 focus:ring-rose-500"
                        : "border-zinc-200 dark:border-zinc-800 focus:ring-blue-500"
                    }`}
                  >
                    <option value="">-- Pilih Anggota dari Database --</option>
                    {formName &&
                      !selectableCadres.some(
                        (c) => c.name.toLowerCase().trim() === formName.toLowerCase().trim()
                      ) && (
                        <option value={formName}>
                          {formName} {editingMember ? "(Fungsionaris Saat Ini)" : "(Sudah Menjabat)"}
                        </option>
                      )}
                    {selectableCadres.map((cadre) => (
                      <option key={cadre.id} value={cadre.name}>
                        {cadre.name}
                      </option>
                    ))}
                  </select>

                  {isNameEmpty && (
                    <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 pt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Silakan pilih kader dari database</span>
                    </p>
                  )}

                  {selectableCadres.length === 0 && !editingMember && (
                    <p className="text-[10.5px] text-amber-600 dark:text-amber-400 leading-snug">
                      Seluruh anggota terdaftar saat ini sudah memegang jabatan kepengurusan aktif. Untuk menugaskan anggota yang sudah menjabat ke posisi lain, silakan copot atau demisionerkan jabatannya terlebih dahulu.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <Input
                    type="text"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (hasAttemptedSubmit && e.target.value.trim()) {
                        setHasAttemptedSubmit(false);
                      }
                    }}
                    placeholder="Contoh: Muhammad Ali Ridho"
                    className={`h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border rounded-lg text-zinc-900 dark:text-zinc-100 ${
                      isNameEmpty
                        ? "border-rose-400 dark:border-rose-600 focus-visible:ring-rose-500"
                        : "border-zinc-200 dark:border-zinc-800 focus-visible:ring-blue-500"
                    }`}
                  />
                  {isNameEmpty && (
                    <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 pt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Nama lengkap pengurus wajib diisi</span>
                    </p>
                  )}
                </div>
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
                    {(selectedCadreData.email || selectedCadreData.phone) && (
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate">
                        {selectedCadreData.email || selectedCadreData.phone}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Peringatan jika kader sudah menjabat di posisi lain */}
              {existingPosition && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-[11px]">Peringatan Posisi Aktif:</p>
                    <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                      Kader <strong>{existingPosition.name}</strong> saat ini sudah terdaftar sebagai{" "}
                      <span className="font-semibold underline">{existingPosition.position}</span> di bidang{" "}
                      <span className="font-semibold">{existingPosition.department}</span>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Departemen, Biro & Jabatan */}
            <div
              className={`grid grid-cols-1 ${
                formDept !== "BPH" ? "sm:grid-cols-3" : "sm:grid-cols-2"
              } gap-3.5`}
            >
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Departemen / Divisi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formDept}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    setFormDept(newDept);
                    if (setFormBiro) setFormBiro("");
                    if (newDept === "BPH") {
                      if (hasActiveKetua) {
                        setFormPosition(isCabangLevel ? "Sekretaris Cabang" : "Sekretaris");
                      } else {
                        setFormPosition(isCabangLevel ? "Ketua Cabang" : "Ketua Komisariat");
                      }
                    } else {
                      setFormPosition("Kepala Bidang");
                    }
                  }}
                  className="w-full h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  {allDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d === "BPH" ? "BPH" : `Bidang ${d}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Biro di bawah Bidang */}
              {formDept !== "BPH" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Biro Pelaksana (Opsional)</span>
                    </span>
                    <span className="text-[10.5px] text-zinc-400 font-normal">
                      Sub-divisi Bidang {formDept}
                    </span>
                  </label>
                  <select
                    value={formBiro || ""}
                    onChange={(e) => {
                      const newBiro = e.target.value;
                      if (setFormBiro) setFormBiro(newBiro);
                      if (newBiro) {
                        setFormPosition("Anggota Biro");
                      } else {
                        setFormPosition("Anggota Bidang");
                      }
                    }}
                    className="w-full h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="">-- Inti Bidang (Tanpa Biro) --</option>
                    {(biros?.[formDept] || []).map((b) => (
                      <option key={b} value={b}>
                        Biro {b}
                      </option>
                    ))}
                  </select>
                  {!(biros?.[formDept] && biros[formDept].length > 0) && (
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-snug">
                      Belum ada biro di Bidang {formDept}. Anda dapat membuat biro baru dari diagram struktur organisasi.
                    </p>
                  )}
                </div>
              )}

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
                    isCabangLevel ? (
                      <>
                        {!hasActiveKetua && (
                          <option value="Ketua Cabang">Ketua Cabang</option>
                        )}
                        <option value="Sekretaris Cabang">Sekretaris Cabang</option>
                        <option value="Bendahara Cabang">Bendahara Cabang</option>
                      </>
                    ) : (
                      <>
                        {!hasActiveKetua && (
                          <option value="Ketua Komisariat">Ketua Komisariat</option>
                        )}
                        <option value="Sekretaris">Sekretaris</option>
                        <option value="Bendahara">Bendahara</option>
                      </>
                    )
                  ) : formBiro ? (
                    <>
                      <option value="Kepala Biro">Kepala Biro (Kabiro)</option>
                      <option value="Sekretaris Biro">Sekretaris Biro</option>
                      <option value="Anggota Biro">Anggota Biro</option>
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
                    !(
                      hasActiveKetua &&
                      !editingMember &&
                      (formPosition.toLowerCase().includes("ketua") &&
                        !formPosition.toLowerCase().includes("wakil"))
                    ) &&
                    ![
                      "Ketua Cabang",
                      "Sekretaris Cabang",
                      "Bendahara Cabang",
                      "Ketua Komisariat",
                      "Sekretaris",
                      "Bendahara",
                      "Kepala Biro",
                      "Sekretaris Biro",
                      "Anggota Biro",
                      "Kepala Bidang",
                      "Sekretaris Bidang",
                      "Bendahara Bidang",
                      "Anggota Bidang"
                    ].includes(formPosition) && (
                      <option value={formPosition}>{formPosition}</option>
                    )}
                </select>

                {/* Notifikasi Otomatisasi Wakil Sekretaris / Bendahara */}
                {autoResolvedInfo && (
                  <div className="mt-1.5 p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1" />
                    <div className="space-y-0.5 leading-snug">
                      <span>
                        Karena {autoResolvedInfo.role} utama sudah terdaftar (<strong>{autoResolvedInfo.existingName}</strong>), posisi ini otomatis akan ditetapkan sebagai:
                      </span>
                      <div className="font-bold text-blue-600 dark:text-blue-400">
                        {autoResolvedInfo.resolved}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Program Kerja Fungsionaris (Repeater List) */}
            <div className="space-y-2.5 p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/70 dark:border-zinc-800/70">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Program Kerja & Agenda Kegiatan</span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddProker}
                  className="h-7 px-2.5 text-[11px] font-medium border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tambah Program</span>
                </Button>
              </div>

              {formProgramKerja.length === 0 ? (
                <div className="py-3.5 px-3 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-white/60 dark:bg-zinc-900/50">
                  <p className="text-[11px] text-zinc-400 mb-2">
                    Belum ada program kerja yang ditambahkan.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddProker}
                    className="h-7 text-xs text-zinc-600 dark:text-zinc-300 rounded-lg cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Program Kerja</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {formProgramKerja.map((proker, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 group/item"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-900/40">
                        {index + 1}
                      </div>
                      <Input
                        type="text"
                        value={proker}
                        onChange={(e) => handleUpdateProker(index, e.target.value)}
                        placeholder={`Program Kerja ${index + 1} (misal: Pelatihan Kader Dasar)`}
                        className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg flex-1 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-blue-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProker(index)}
                        className="h-8 w-8 p-0 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer shrink-0 transition-colors"
                        title="Hapus Program Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-zinc-400 leading-tight">
                Tambahkan satu atau beberapa program kerja yang menjadi tanggung jawab fungsionaris ini.
              </p>
            </div>

            {/* Periode & Status Kepengurusan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Status Kepengurusan</span>
                  <Badge
                    className={`text-[9px] px-1.5 py-0 font-semibold border ${
                      formStatus === "AKTIF"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-zinc-500/10 border-zinc-500/20 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {formStatus}
                  </Badge>
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "AKTIF" | "DEMISIONER")}
                  className="w-full h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="AKTIF">Aktif Bertugas</option>
                  <option value="DEMISIONER">Demisioner / Selesai Masa Bakti</option>
                </select>
              </div>
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
