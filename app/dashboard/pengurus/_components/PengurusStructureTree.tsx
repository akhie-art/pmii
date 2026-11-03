import React from "react";
import {
  GitFork,
  Plus,
  UserPlus,
  Edit2,
  Trash2,
  Printer,
  Network
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type BoardMember, getInitials } from "./types";

interface PengurusStructureTreeProps {
  boardMembers: BoardMember[];
  divisions: string[];
  biros?: Record<string, string[]>;
  getMemberAvatar: (member?: BoardMember | null) => string;
  onOpenAddModal: (
    defaultDept?: string,
    defaultPosition?: string,
    defaultBiro?: string
  ) => void;
  onOpenEditModal: (member: BoardMember) => void;
  onDeleteMember: (member: BoardMember) => void;
  onOpenAddDeptModal: () => void;
  onOpenEditDeptModal: (dept: string) => void;
  onDeleteDept: (dept: string) => void;
  onOpenAddBiroModal?: (dept: string) => void;
  onOpenEditBiroModal?: (dept: string, biroName: string) => void;
  onDeleteBiro?: (dept: string, biroName: string) => void;
  isCabangLevel?: boolean;
  canDelete?: boolean;
  tenantTitle?: string;
}

export const parseProgramKerja = (val?: string | string[]): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
    } catch {
      return trimmed
        .split("\n")
        .map((s) => s.replace(/^[0-9]+[.\-)]\s*/, "").trim())
        .filter(Boolean);
    }
    return [trimmed];
  }
  return [];
};

export const PengurusStructureTree: React.FC<PengurusStructureTreeProps> = ({
  boardMembers,
  divisions,
  biros = {},
  getMemberAvatar,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteMember,
  onOpenAddDeptModal,
  onOpenEditDeptModal,
  onDeleteDept,
  onOpenAddBiroModal,
  onOpenEditBiroModal,
  onDeleteBiro,
  isCabangLevel = false,
  canDelete = true,
  tenantTitle
}) => {
  const ketuaTitle = isCabangLevel ? "Ketua Cabang" : "Ketua Komisariat";
  const ketua = boardMembers.find(
    (m) =>
      m.department === "BPH" &&
      (m.position.toLowerCase().includes("ketua") || m.position.toLowerCase().includes("ketum")) &&
      !m.position.toLowerCase().includes("wakil")
  );
  const sekretarisList = boardMembers.filter(
    (m) => m.department === "BPH" && m.position.toLowerCase().includes("sekretaris")
  );
  sekretarisList.sort((a, b) => {
    const isWakilA = a.position.toLowerCase().includes("wakil");
    const isWakilB = b.position.toLowerCase().includes("wakil");
    if (!isWakilA && isWakilB) return -1;
    if (isWakilA && !isWakilB) return 1;
    return a.position.localeCompare(b.position);
  });

  const bendaharaList = boardMembers.filter(
    (m) => m.department === "BPH" && m.position.toLowerCase().includes("bendahara")
  );
  bendaharaList.sort((a, b) => {
    const isWakilA = a.position.toLowerCase().includes("wakil");
    const isWakilB = b.position.toLowerCase().includes("wakil");
    if (!isWakilA && isWakilB) return -1;
    if (isWakilA && !isWakilB) return 1;
    return a.position.localeCompare(b.position);
  });

  return (
    <div id="pmii-structure-diagram" className="space-y-4">
      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block text-center pb-4 mb-4 border-b border-zinc-300">
        <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide">
          Bagan Struktur Organisasi {tenantTitle ? tenantTitle : (isCabangLevel ? "Pengurus Cabang Grobogan" : "Komisariat")}
        </h2>
        <p className="text-xs text-zinc-600 mt-1">
          Masa Khidmat {boardMembers[0]?.period || "2026 - 2027"} • Total {boardMembers.length} Fungsionaris Terdaftar
        </p>
      </div>

      {/* ACTION TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3.5 sm:p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl print:hidden">
        <div className="flex items-start justify-between gap-2.5">
          <div className="space-y-0.5 min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <GitFork className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate">{tenantTitle ? `Struktur Organisasi ${tenantTitle}` : "Diagram Struktur Organisasi"}</span>
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Kelola struktur dan bidang secara langsung: tambah bidang baru, sesuaikan nama, atau tetapkan fungsionaris.
            </p>
          </div>
          {/* Mobile-only compact Cetak icon button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="sm:hidden h-8 w-8 p-0 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 rounded-lg shrink-0 flex items-center justify-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Cetak atau Simpan Bagan ke PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Buttons: 2 equal-width columns on mobile, flex row on desktop */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
          {/* Desktop Cetak / PDF */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="hidden sm:flex h-8 px-3 text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg cursor-pointer items-center gap-1.5"
            title="Cetak atau Simpan Bagan ke PDF"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-500" />
            <span>Cetak / PDF</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenAddDeptModal}
            className="h-8.5 sm:h-8 px-3 text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Bidang</span>
          </Button>

          <Button
            size="sm"
            onClick={() => onOpenAddModal()}
            className="h-8.5 sm:h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-xs font-medium"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Pengurus</span>
          </Button>
        </div>
      </div>

      {/* MOBILE VIEW: HIERARCHICAL CARD LIST (< md) */}
      <div className="block md:hidden space-y-4">
        {/* BPH SECTION */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Badan Pengurus Harian (BPH)
          </span>

          {/* Ketua Mobile */}
          <Card className="p-3.5 bg-white dark:bg-zinc-900 border-l-4 border-l-amber-500 border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {ketua && getMemberAvatar(ketua) ? (
                  <img
                    src={getMemberAvatar(ketua)}
                    alt={ketua.name}
                    className="w-11 h-11 rounded-full object-cover border border-amber-500/30 shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/20 shrink-0">
                    {ketua ? getInitials(ketua.name) : "KT"}
                  </div>
                )}
                <div className="min-w-0">
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none text-[10px] font-semibold px-2 py-0.5">
                    {ketua?.position || ketuaTitle}
                  </Badge>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1 truncate">
                    {ketua?.name || `${ketuaTitle} Belum Ditetapkan`}
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    {ketua?.period || "2026 - 2027"}
                  </p>
                </div>
              </div>
              {ketua ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenEditModal(ketua)}
                    className="h-7 px-2 text-xs shrink-0 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteMember(ketua)}
                      className="h-7 px-2 text-xs shrink-0 text-rose-500 hover:text-rose-600 border-rose-200 dark:border-rose-900/50 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onOpenAddModal("BPH", ketuaTitle)}
                  className="h-7 px-2.5 text-[11px] bg-amber-600 hover:bg-amber-700 text-white shrink-0 cursor-pointer"
                >
                  <Plus className="w-3 h-3 mr-1" /> Tetapkan
                </Button>
              )}
            </div>
          </Card>

          {/* Sekretaris & Bendahara Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Sekretaris Column */}
            <div className="space-y-2">
              {sekretarisList.length > 0 ? (
                <>
                  {sekretarisList.map((s) => (
                    <Card
                      key={s.id}
                      className="p-3 bg-white dark:bg-zinc-900 border-l-4 border-l-blue-500 border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none"
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {getMemberAvatar(s) ? (
                            <img
                              src={getMemberAvatar(s)}
                              alt={s.name}
                              className="w-9 h-9 rounded-full object-cover border border-blue-500/30 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center justify-center border border-blue-500/20 shrink-0">
                              {getInitials(s.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                              {s.position}
                            </span>
                            <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {s.name}
                            </h5>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenEditModal(s)}
                            className="h-7 px-1.5 text-xs shrink-0 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDeleteMember(s)}
                              className="h-7 px-1.5 text-xs shrink-0 text-rose-500 hover:text-rose-600 border-rose-200 dark:border-rose-900/50 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onOpenAddModal(
                        "BPH",
                        isCabangLevel ? "Sekretaris Cabang" : "Sekretaris"
                      )
                    }
                    className="w-full h-7 text-[11px] text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Tambah Sekretaris Lainnya
                  </Button>
                </>
              ) : (
                <Card className="p-3 bg-white dark:bg-zinc-900 border-l-4 border-l-blue-500 border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none">
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                        Sekretaris
                      </span>
                      <h5 className="text-xs font-medium text-zinc-400">
                        Belum Ditetapkan
                      </h5>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        onOpenAddModal(
                          "BPH",
                          isCabangLevel ? "Sekretaris Cabang" : "Sekretaris"
                        )
                      }
                      className="h-7 px-2 text-[10px] bg-blue-600 hover:bg-blue-700 text-white shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 mr-0.5" /> Tetapkan
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Bendahara Column */}
            <div className="space-y-2">
              {bendaharaList.length > 0 ? (
                <>
                  {bendaharaList.map((b) => (
                    <Card
                      key={b.id}
                      className="p-3 bg-white dark:bg-zinc-900 border-l-4 border-l-emerald-500 border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none"
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {getMemberAvatar(b) ? (
                            <img
                              src={getMemberAvatar(b)}
                              alt={b.name}
                              className="w-9 h-9 rounded-full object-cover border border-emerald-500/30 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center border border-emerald-500/20 shrink-0">
                              {getInitials(b.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              {b.position}
                            </span>
                            <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {b.name}
                            </h5>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenEditModal(b)}
                            className="h-7 px-1.5 text-xs shrink-0 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDeleteMember(b)}
                              className="h-7 px-1.5 text-xs shrink-0 text-rose-500 hover:text-rose-600 border-rose-200 dark:border-rose-900/50 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onOpenAddModal(
                        "BPH",
                        isCabangLevel ? "Bendahara Cabang" : "Bendahara"
                      )
                    }
                    className="w-full h-7 text-[11px] text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Tambah Bendahara Lainnya
                  </Button>
                </>
              ) : (
                <Card className="p-3 bg-white dark:bg-zinc-900 border-l-4 border-l-emerald-500 border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none">
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Bendahara
                      </span>
                      <h5 className="text-xs font-medium text-zinc-400">
                        Belum Ditetapkan
                      </h5>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        onOpenAddModal(
                          "BPH",
                          isCabangLevel ? "Bendahara Cabang" : "Bendahara"
                        )
                      }
                      className="h-7 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 mr-0.5" /> Tetapkan
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* DIVISIONS SECTION MOBILE */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Bidang-Bidang Pelaksana ({divisions.length})
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenAddDeptModal}
              className="h-6 px-2 text-[10px] text-blue-600 border-blue-200 dark:border-blue-900/60 cursor-pointer"
            >
              <Plus className="w-3 h-3 mr-1" /> Tambah Bidang
            </Button>
          </div>

          {divisions.map((dept) => {
            const divMembers = boardMembers.filter((m) => m.department === dept);
            const headOfDiv = divMembers.find(
              (m) =>
                (m.position.toLowerCase().includes("kepala") ||
                  m.position.toLowerCase().includes("kabid")) &&
                !m.position.toLowerCase().includes("biro")
            );
            // Anggota langsung bidang tanpa biro
            const directStaffOfDiv = divMembers.filter(
              (m) => !m.biro && m.id !== headOfDiv?.id
            );
            const deptBiros = biros?.[dept] || [];

            return (
              <Card
                key={dept}
                className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      Bidang {dept}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenEditDeptModal(dept)}
                      className="w-6 h-6 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-blue-600 cursor-pointer transition-colors"
                      title={`Ubah nama bidang ${dept}`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDeleteDept(dept)}
                        className="w-6 h-6 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/60 flex items-center justify-center text-zinc-400 hover:text-rose-600 cursor-pointer transition-colors"
                        title={`Hapus bidang ${dept}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-medium">
                      {divMembers.length} Fungsionaris
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenAddModal(dept, "Anggota Bidang")}
                      className="h-6 px-2 text-[10px] text-blue-600 hover:text-blue-700 border-blue-200 dark:border-blue-900/60 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 mr-0.5" /> Tambah
                    </Button>
                  </div>
                </div>

                {/* Kabid Mobile */}
                <div className="text-xs">
                  <span className="text-[10px] text-zinc-400 block mb-1">
                    Kepala Bidang:
                  </span>
                  <div className="flex items-center justify-between font-semibold text-zinc-800 dark:text-zinc-200">
                    <div className="flex items-center gap-2 min-w-0">
                      {headOfDiv && getMemberAvatar(headOfDiv) ? (
                        <img
                          src={getMemberAvatar(headOfDiv)}
                          alt={headOfDiv.name}
                          className="w-7 h-7 rounded-full object-cover border border-zinc-300 dark:border-zinc-700 shrink-0"
                        />
                      ) : headOfDiv ? (
                        <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {getInitials(headOfDiv.name)}
                        </div>
                      ) : null}
                      <span className="truncate">
                        {headOfDiv?.name || "Belum Ditetapkan"}
                      </span>
                    </div>
                    {headOfDiv ? (
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <button
                          onClick={() => onOpenEditModal(headOfDiv)}
                          className="text-blue-600 text-[11px] hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <span className="text-zinc-300 dark:text-zinc-700 text-xs">
                          •
                        </span>
                        <button
                          onClick={() => onDeleteMember(headOfDiv)}
                          className="text-rose-500 text-[11px] hover:underline cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onOpenAddModal(dept, "Kepala Bidang")}
                        className="text-blue-600 text-[11px] font-medium hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Tetapkan
                      </button>
                    )}
                  </div>
                </div>

                {/* Direct Staff Mobile (Anggota Inti Bidang) */}
                {directStaffOfDiv.length > 0 && (
                  <div className="pt-1 text-[11px]">
                    <span className="text-zinc-400 block mb-1.5 font-medium">
                      Anggota Inti Bidang ({directStaffOfDiv.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {directStaffOfDiv.map((staff) => {
                        const staffAvatar = getMemberAvatar(staff);
                        return (
                          <span
                            key={staff.id}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] group/item"
                          >
                            {staffAvatar ? (
                              <img
                                src={staffAvatar}
                                alt={staff.name}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full bg-zinc-300 dark:bg-zinc-700 text-[8px] flex items-center justify-center font-bold">
                                {getInitials(staff.name)[0]}
                              </span>
                            )}
                            <span>
                              {staff.name.replace(/Sahabat|Sahabati/g, "").trim()}
                            </span>
                            <button
                              onClick={() => onOpenEditModal(staff)}
                              className="text-zinc-400 hover:text-blue-600 cursor-pointer ml-0.5"
                              title="Edit"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => onDeleteMember(staff)}
                                className="text-zinc-400 hover:text-rose-600 cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-Biro Hierarchy (Mobile) */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Biro Pelaksana ({deptBiros.length})
                    </span>
                    {onOpenAddBiroModal && (
                      <button
                        type="button"
                        onClick={() => onOpenAddBiroModal(dept)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Tambah Biro
                      </button>
                    )}
                  </div>

                  {deptBiros.length > 0 ? (
                    <div className="space-y-2">
                      {deptBiros.map((bName) => {
                        const biroMembers = divMembers.filter((m) => m.biro === bName);
                        const kabiro = biroMembers.find(
                          (m) =>
                            m.position.toLowerCase().includes("kabiro") ||
                            m.position.toLowerCase().includes("kepala biro")
                        );
                        const staffBiro = biroMembers.filter((m) => m.id !== kabiro?.id);

                        return (
                          <div
                            key={bName}
                            className="p-2.5 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 min-w-0">
                                <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 truncate">
                                  Biro {bName}
                                </span>
                                {onOpenEditBiroModal && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenEditBiroModal(dept, bName)}
                                    className="text-zinc-400 hover:text-indigo-600 p-0.5"
                                    title="Edit nama biro"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                                {onDeleteBiro && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteBiro(dept, bName)}
                                    className="text-zinc-400 hover:text-rose-600 p-0.5"
                                    title="Hapus biro"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => onOpenAddModal(dept, "Anggota Biro", bName)}
                                className="text-[9.5px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                              >
                                <Plus className="w-2.5 h-2.5" /> Anggota
                              </button>
                            </div>

                            {/* Kabiro */}
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-[9.5px] text-zinc-400">Kepala Biro:</span>
                              {kabiro ? (
                                <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                                  <span className="truncate">{kabiro.name}</span>
                                  <button
                                    onClick={() => onOpenEditModal(kabiro)}
                                    className="text-indigo-600 text-[10px] hover:underline"
                                  >
                                    Edit
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenAddModal(dept, "Kepala Biro (Kabiro)", bName)
                                  }
                                  className="text-indigo-600 dark:text-indigo-400 text-[10px] font-medium hover:underline flex items-center gap-0.5"
                                >
                                  <Plus className="w-2.5 h-2.5" /> Tetapkan
                                </button>
                              )}
                            </div>

                            {/* Staff Biro */}
                            {staffBiro.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1 border-t border-indigo-100/60 dark:border-indigo-900/30">
                                {staffBiro.map((sb) => (
                                  <span
                                    key={sb.id}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900/40 text-[9.5px] text-zinc-700 dark:text-zinc-300"
                                  >
                                    <span className="truncate max-w-[100px]">{sb.name}</span>
                                    <span className="text-[8px] text-indigo-500 uppercase">
                                      ({sb.position.replace(/Biro/gi, "").trim() || "Anggota"})
                                    </span>
                                    <button
                                      onClick={() => onOpenEditModal(sb)}
                                      className="text-zinc-400 hover:text-indigo-600"
                                    >
                                      <Edit2 className="w-2 h-2" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-2 bg-zinc-50 dark:bg-zinc-950/40 rounded border border-dashed border-zinc-200 dark:border-zinc-800">
                      <p className="text-[10px] text-zinc-400">Belum ada biro di bidang ini</p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* DESKTOP VIEW: INTERACTIVE TREE DIAGRAM (>= md) */}
      <div className="hidden md:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 overflow-x-auto shadow-none">
        {/* Helper bar above canvas */}
        <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 print:hidden">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-semibold bg-zinc-50 dark:bg-zinc-950">
              {boardMembers.length} Fungsionaris
            </Badge>
            <span>•</span>
            <span>{divisions.length} Bidang Pelaksana</span>
          </div>
          {divisions.length >= 3 && (
            <span className="text-[10.5px] text-zinc-400 flex items-center gap-1">
              ↔ Geser horizontal untuk melihat bidang lainnya
            </span>
          )}
        </div>

        <div className="min-w-[850px] flex flex-col items-center py-6">
          {/* TOP LEVEL: KETUA */}
          <div className="flex flex-col items-center">
            {ketua ? (
              <div className="p-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-md transition-transform hover:-translate-y-0.5 duration-200">
                <div className="bg-white dark:bg-zinc-900 px-6 py-4 rounded-[10px] text-center w-64 space-y-2 flex flex-col items-center">
                  <div className="relative">
                    {getMemberAvatar(ketua) ? (
                      <img
                        src={getMemberAvatar(ketua)}
                        alt={ketua.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-amber-500 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-sm flex items-center justify-center border-2 border-amber-500/30 shadow-xs">
                        {getInitials(ketua.name)}
                      </div>
                    )}
                  </div>

                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold uppercase py-0.5 px-2 mx-auto w-fit">
                    {ketua.position}
                  </Badge>
                  <div className="w-full">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {ketua.name}
                    </h4>
                    <p className="text-[10px] text-zinc-400">
                      {ketua.period} • BPH
                    </p>
                    {(() => {
                      const prokers = parseProgramKerja(ketua.program_kerja || ketua.programKerja);
                      if (prokers.length === 0) return null;
                      return (
                        <div className="mt-1.5 w-full text-left space-y-1">
                          <span className="text-[9px] font-semibold text-zinc-400 block uppercase tracking-wider">
                            Proker ({prokers.length}):
                          </span>
                          <div className="space-y-0.5 max-h-24 overflow-y-auto pr-0.5">
                            {prokers.map((p, idx) => (
                              <div
                                key={idx}
                                className="text-[9px] text-zinc-700 dark:text-zinc-300 bg-amber-500/5 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 truncate flex items-center gap-1"
                                title={`Program Kerja: ${p}`}
                              >
                                <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                                <span className="truncate">{p}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 w-full flex items-center justify-center gap-3">
                    <button
                      onClick={() => onOpenEditModal(ketua)}
                      className="text-[10px] font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400 cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    {canDelete && (
                      <>
                        <span className="text-zinc-300 dark:text-zinc-700 text-[10px]">
                          •
                        </span>
                        <button
                          onClick={() => onDeleteMember(ketua)}
                          className="text-[10px] font-medium text-rose-500 hover:text-rose-600 dark:text-rose-400 cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Hapus
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onOpenAddModal("BPH", ketuaTitle)}
                className="group bg-zinc-50 hover:bg-amber-50/50 dark:bg-zinc-950 dark:hover:bg-amber-950/20 border border-dashed border-zinc-300 hover:border-amber-400 dark:border-zinc-800 dark:hover:border-amber-700 rounded-xl px-6 py-5 text-center w-64 transition-all cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 block">
                    + Tetapkan {ketuaTitle}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Pilih dari database anggota
                  </span>
                </div>
              </button>
            )}

            {/* Connector Line down from Ketua */}
            <div className="w-0.5 h-8 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* LEVEL 2: SEKRETARIS & BENDAHARA */}
          <div className="relative w-full max-w-2xl flex items-center justify-between before:absolute before:top-0 before:left-1/4 before:right-1/4 before:h-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
            <div className="absolute top-0 left-1/4 w-0.5 h-6 bg-zinc-200 dark:bg-zinc-800" />
            <div className="absolute top-0 right-1/4 w-0.5 h-6 bg-zinc-200 dark:bg-zinc-800" />

            {/* Sekretaris Cards (Left Wing) */}
            <div className="flex flex-col items-center w-1/2 pt-6 space-y-3">
              {sekretarisList.length > 0 ? (
                <>
                  {sekretarisList.map((s) => (
                    <div
                      key={s.id}
                      className="p-0.5 bg-blue-500/30 rounded-xl shadow-xs transition-transform hover:-translate-y-0.5 duration-200"
                    >
                      <div className="bg-white dark:bg-zinc-900 px-5 py-3.5 rounded-[10px] text-center w-56 space-y-1.5 flex flex-col items-center">
                        {getMemberAvatar(s) ? (
                          <img
                            src={getMemberAvatar(s)}
                            alt={s.name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-blue-500/40 shadow-xs"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center border-2 border-blue-500/20 shadow-xs">
                            {getInitials(s.name)}
                          </div>
                        )}

                        <Badge className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60 text-[9px] font-semibold uppercase py-0.5 px-2 mx-auto w-fit">
                          {s.position}
                        </Badge>
                        <div className="w-full">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {s.name}
                          </h4>
                          <p className="text-[10px] text-zinc-400">
                            {s.period}
                          </p>
                          {(() => {
                            const prokers = parseProgramKerja(s.program_kerja || s.programKerja);
                            if (prokers.length === 0) return null;
                            return (
                              <div className="mt-1.5 w-full text-left space-y-1">
                                <span className="text-[9px] font-semibold text-zinc-400 block uppercase tracking-wider">
                                  Proker ({prokers.length}):
                                </span>
                                <div className="space-y-0.5 max-h-24 overflow-y-auto pr-0.5">
                                  {prokers.map((p, idx) => (
                                    <div
                                      key={idx}
                                      className="text-[9px] text-zinc-700 dark:text-zinc-300 bg-blue-500/5 dark:bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 truncate flex items-center gap-1"
                                      title={`Program Kerja: ${p}`}
                                    >
                                      <span className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                                      <span className="truncate">{p}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 w-full flex items-center justify-center gap-3">
                          <button
                            onClick={() => onOpenEditModal(s)}
                            className="text-[10px] font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          {canDelete && (
                            <>
                              <span className="text-zinc-300 dark:text-zinc-700 text-[10px]">
                                •
                              </span>
                              <button
                                onClick={() => onDeleteMember(s)}
                                className="text-[10px] font-medium text-rose-500 hover:text-rose-600 dark:text-rose-400 cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Hapus
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Button to add another secretary */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onOpenAddModal(
                        "BPH",
                        isCabangLevel ? "Sekretaris Cabang" : "Sekretaris"
                      )
                    }
                    className="w-56 h-7 text-[10px] border-dashed border-blue-300 hover:border-blue-500 dark:border-blue-900/60 dark:hover:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Tambah Sekretaris Lainnya
                  </Button>
                </>
              ) : (
                <button
                  onClick={() => onOpenAddModal("BPH", "Sekretaris")}
                  className="group bg-zinc-50 hover:bg-blue-50/50 dark:bg-zinc-950 dark:hover:bg-blue-950/20 border border-dashed border-zinc-300 hover:border-blue-400 dark:border-zinc-800 dark:hover:border-blue-700 rounded-xl px-5 py-4 text-center w-56 transition-all cursor-pointer flex flex-col items-center gap-1.5"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    + Tetapkan Sekretaris
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Pilih dari database
                  </span>
                </button>
              )}
            </div>

            {/* Bendahara Cards (Right Wing) */}
            <div className="flex flex-col items-center w-1/2 pt-6 space-y-3">
              {bendaharaList.length > 0 ? (
                <>
                  {bendaharaList.map((b) => (
                    <div
                      key={b.id}
                      className="p-0.5 bg-emerald-500/30 rounded-xl shadow-xs transition-transform hover:-translate-y-0.5 duration-200"
                    >
                      <div className="bg-white dark:bg-zinc-900 px-5 py-3.5 rounded-[10px] text-center w-56 space-y-1.5 flex flex-col items-center">
                        {getMemberAvatar(b) ? (
                          <img
                            src={getMemberAvatar(b)}
                            alt={b.name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500/40 shadow-xs"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center border-2 border-emerald-500/20 shadow-xs">
                            {getInitials(b.name)}
                          </div>
                        )}

                        <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60 text-[9px] font-semibold uppercase py-0.5 px-2 mx-auto w-fit">
                          {b.position}
                        </Badge>
                        <div className="w-full">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {b.name}
                          </h4>
                          <p className="text-[10px] text-zinc-400">
                            {b.period}
                          </p>
                          {(() => {
                            const prokers = parseProgramKerja(b.program_kerja || b.programKerja);
                            if (prokers.length === 0) return null;
                            return (
                              <div className="mt-1.5 w-full text-left space-y-1">
                                <span className="text-[9px] font-semibold text-zinc-400 block uppercase tracking-wider">
                                  Proker ({prokers.length}):
                                </span>
                                <div className="space-y-0.5 max-h-24 overflow-y-auto pr-0.5">
                                  {prokers.map((p, idx) => (
                                    <div
                                      key={idx}
                                      className="text-[9px] text-zinc-700 dark:text-zinc-300 bg-emerald-500/5 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 truncate flex items-center gap-1"
                                      title={`Program Kerja: ${p}`}
                                    >
                                      <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                      <span className="truncate">{p}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 w-full flex items-center justify-center gap-3">
                          <button
                            onClick={() => onOpenEditModal(b)}
                            className="text-[10px] font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          {canDelete && (
                            <>
                              <span className="text-zinc-300 dark:text-zinc-700 text-[10px]">
                                •
                              </span>
                              <button
                                onClick={() => onDeleteMember(b)}
                                className="text-[10px] font-medium text-rose-500 hover:text-rose-600 dark:text-rose-400 cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Hapus
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Button to add another treasurer */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onOpenAddModal(
                        "BPH",
                        isCabangLevel ? "Bendahara Cabang" : "Bendahara"
                      )
                    }
                    className="w-56 h-7 text-[10px] border-dashed border-emerald-300 hover:border-emerald-500 dark:border-emerald-900/60 dark:hover:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Tambah Bendahara Lainnya
                  </Button>
                </>
              ) : (
                <button
                  onClick={() => onOpenAddModal("BPH", "Bendahara")}
                  className="group bg-zinc-50 hover:bg-emerald-50/50 dark:bg-zinc-950 dark:hover:bg-emerald-950/20 border border-dashed border-zinc-300 hover:border-emerald-400 dark:border-zinc-800 dark:hover:border-emerald-700 rounded-xl px-5 py-4 text-center w-56 transition-all cursor-pointer flex flex-col items-center gap-1.5"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    + Tetapkan Bendahara
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Pilih dari database
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Main vertical connector to divisions line */}
          <div className="w-0.5 h-10 bg-zinc-200 dark:bg-zinc-800 mt-6" />

          {/* LEVEL 3: DEPARTMENTS / BIDANG */}
          <div className="relative w-full border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <div className="absolute top-0 left-[10%] right-[10%] h-0.5 bg-zinc-200 dark:bg-zinc-800" />

            <div className="flex flex-wrap justify-center gap-5 w-full px-2">
              {divisions.map((dept) => {
                const divisionMembers = boardMembers.filter(
                  (m) => m.department === dept
                );
                const headOfDiv = divisionMembers.find(
                  (m) =>
                    (m.position.toLowerCase().includes("kepala") ||
                      m.position.toLowerCase().includes("kabid")) &&
                    !m.position.toLowerCase().includes("biro")
                );
                // Anggota langsung bidang tanpa biro
                const directStaffOfDiv = divisionMembers.filter(
                  (m) => !m.biro && m.id !== headOfDiv?.id
                );
                const deptBiros = biros?.[dept] || [];

                return (
                  <div
                    key={dept}
                    className="w-72 min-w-[270px] max-w-[320px] flex flex-col items-center relative"
                  >
                    <div className="absolute -top-6 w-0.5 h-6 bg-zinc-200 dark:bg-zinc-800" />

                    <div className="text-center space-y-3 w-full">
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <span
                            className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 block uppercase tracking-wider truncate"
                            title={`Bidang ${dept}`}
                          >
                            Bidang {dept}
                          </span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => onOpenEditDeptModal(dept)}
                              className="w-6 h-6 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                              title={`Ubah nama bidang ${dept}`}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => onDeleteDept(dept)}
                                className="w-6 h-6 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/60 flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                                title={`Hapus bidang ${dept}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => onOpenAddModal(dept, "Anggota Bidang")}
                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5 cursor-pointer shrink-0 pl-1 border-l border-zinc-200 dark:border-zinc-800"
                          title={`Tambah ke bidang ${dept}`}
                        >
                          <Plus className="w-3 h-3" /> Tambah
                        </button>
                      </div>

                      {/* Kabid Card */}
                      <div>
                        {headOfDiv ? (
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg text-center space-y-1.5 shadow-none transition-colors hover:border-blue-500/40 flex flex-col items-center">
                            {getMemberAvatar(headOfDiv) ? (
                              <img
                                src={getMemberAvatar(headOfDiv)}
                                alt={headOfDiv.name}
                                className="w-10 h-10 rounded-full object-cover border border-zinc-300 dark:border-zinc-700 shadow-2xs"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center justify-center border border-blue-500/20">
                                {getInitials(headOfDiv.name)}
                              </div>
                            )}

                            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[8.5px] font-semibold uppercase py-0.5 px-2 mx-auto w-fit block truncate">
                              Kabid
                            </Badge>
                            <div className="w-full">
                              <h5 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {headOfDiv.name}
                              </h5>
                              {(() => {
                                const prokers = parseProgramKerja(headOfDiv.program_kerja || headOfDiv.programKerja);
                                if (prokers.length === 0) return null;
                                return (
                                  <div className="mt-1 w-full text-left space-y-0.5">
                                    {prokers.map((p, idx) => (
                                      <div
                                        key={idx}
                                        className="text-[8.5px] text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 px-1 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-700/50 truncate flex items-center gap-1"
                                        title={`Program Kerja: ${p}`}
                                      >
                                        <span className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                                        <span className="truncate">{p}</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800 w-full flex items-center justify-center gap-2">
                              <button
                                onClick={() => onOpenEditModal(headOfDiv)}
                                className="text-[9px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-0.5"
                              >
                                <Edit2 className="w-2.5 h-2.5" /> Edit
                              </button>
                              {canDelete && (
                                <>
                                  <span className="text-zinc-300 dark:text-zinc-700 text-[8px]">
                                    •
                                  </span>
                                  <button
                                    onClick={() => onDeleteMember(headOfDiv)}
                                    className="text-[9px] font-medium text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-0.5"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" /> Hapus
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              onOpenAddModal(dept, "Kepala Bidang")
                            }
                            className="w-full bg-zinc-50 hover:bg-blue-50/50 dark:bg-zinc-950 dark:hover:bg-blue-950/20 border border-dashed border-zinc-300 hover:border-blue-400 dark:border-zinc-800 dark:hover:border-blue-700 rounded-lg p-3 text-center text-xs font-semibold text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tetapkan Kabid</span>
                          </button>
                        )}
                      </div>

                      {/* Direct Staff Members List (Anggota Inti Bidang) */}
                      {directStaffOfDiv.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block text-left">
                              Anggota Inti ({directStaffOfDiv.length})
                            </span>
                            <button
                              onClick={() =>
                                onOpenAddModal(dept, "Anggota Bidang")
                              }
                              className="text-[9px] font-medium text-blue-600 hover:underline cursor-pointer"
                            >
                              + Tambah
                            </button>
                          </div>
                          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                            {directStaffOfDiv.map((staff) => {
                              const staffAvatar = getMemberAvatar(staff);
                              return (
                                <div
                                  key={staff.id}
                                  className="bg-zinc-50/70 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/60 p-2 rounded-md flex items-center justify-between text-left group/staff gap-2"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {staffAvatar ? (
                                      <img
                                        src={staffAvatar}
                                        alt={staff.name}
                                        className="w-6 h-6 rounded-full object-cover border border-zinc-300 dark:border-zinc-700 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[9px] font-bold flex items-center justify-center shrink-0">
                                        {getInitials(staff.name)[0]}
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <h6 className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                        {staff.name
                                          .replace(/Sahabat|Sahabati/g, "")
                                          .trim()}
                                      </h6>
                                      <p className="text-[9px] text-zinc-400 truncate uppercase">
                                        {staff.position}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover/staff:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => onOpenEditModal(staff)}
                                      className="w-5 h-5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                                      title="Edit data"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                    {canDelete && (
                                      <button
                                        onClick={() => onDeleteMember(staff)}
                                        className="w-5 h-5 rounded hover:bg-rose-100 dark:hover:bg-rose-950/50 flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                                        title="Hapus fungsionaris"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* BIRO SECTION: Sub-divisi di bawah Bidang */}
                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-left">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <span>Biro Pelaksana</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
                              {deptBiros.length}
                            </span>
                          </span>
                          {onOpenAddBiroModal && (
                            <button
                              type="button"
                              onClick={() => onOpenAddBiroModal(dept)}
                              className="text-[9.5px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                              title={`Tambah Biro di Bidang ${dept}`}
                            >
                              <Plus className="w-3 h-3" /> Tambah Biro
                            </button>
                          )}
                        </div>

                        {deptBiros.length > 0 ? (
                          <div className="space-y-2.5">
                            {deptBiros.map((bName) => {
                              const biroMembers = divisionMembers.filter((m) => m.biro === bName);
                              const kabiro = biroMembers.find(
                                (m) =>
                                  m.position.toLowerCase().includes("kabiro") ||
                                  m.position.toLowerCase().includes("kepala biro")
                              );
                              const staffBiro = biroMembers.filter((m) => m.id !== kabiro?.id);

                              return (
                                <div
                                  key={bName}
                                  className="bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 rounded-lg p-2.5 space-y-2"
                                >
                                  {/* Biro Header */}
                                  <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-indigo-100 dark:border-indigo-900/40">
                                    <div className="flex items-center gap-1 min-w-0">
                                      <span
                                        className="text-[10.5px] font-bold text-indigo-900 dark:text-indigo-200 truncate"
                                        title={`Biro ${bName}`}
                                      >
                                        Biro {bName}
                                      </span>
                                      {onOpenEditBiroModal && (
                                        <button
                                          type="button"
                                          onClick={() => onOpenEditBiroModal(dept, bName)}
                                          className="text-zinc-400 hover:text-indigo-600 p-0.5"
                                          title="Edit nama biro"
                                        >
                                          <Edit2 className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                      {onDeleteBiro && (
                                        <button
                                          type="button"
                                          onClick={() => onDeleteBiro(dept, bName)}
                                          className="text-zinc-400 hover:text-rose-600 p-0.5"
                                          title="Hapus biro"
                                        >
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => onOpenAddModal(dept, "Anggota Biro", bName)}
                                      className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 shrink-0"
                                    >
                                      <Plus className="w-2.5 h-2.5" /> Anggota
                                    </button>
                                  </div>

                                  {/* Kabiro Card */}
                                  <div>
                                    {kabiro ? (
                                      <div className="bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900/40 rounded p-1.5 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                          {getMemberAvatar(kabiro) ? (
                                            <img
                                              src={getMemberAvatar(kabiro)}
                                              alt={kabiro.name}
                                              className="w-5 h-5 rounded-full object-cover shrink-0"
                                            />
                                          ) : (
                                            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[8px] font-bold flex items-center justify-center shrink-0">
                                              {getInitials(kabiro.name)[0]}
                                            </div>
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                              {kabiro.name.replace(/Sahabat|Sahabati/g, "").trim()}
                                            </p>
                                            <span className="text-[8px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase block">
                                              Kabiro
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => onOpenEditModal(kabiro)}
                                            className="text-zinc-400 hover:text-indigo-600"
                                            title="Edit Kabiro"
                                          >
                                            <Edit2 className="w-2.5 h-2.5" />
                                          </button>
                                          {canDelete && (
                                            <button
                                              onClick={() => onDeleteMember(kabiro)}
                                              className="text-zinc-400 hover:text-rose-600"
                                              title="Hapus Kabiro"
                                            >
                                              <Trash2 className="w-2.5 h-2.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onOpenAddModal(dept, "Kepala Biro (Kabiro)", bName)
                                        }
                                        className="w-full bg-white/80 dark:bg-zinc-900/80 hover:bg-indigo-50/80 border border-dashed border-indigo-200 dark:border-indigo-900/60 rounded p-1.5 text-center text-[9.5px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                      >
                                        <Plus className="w-2.5 h-2.5" /> Tetapkan Kabiro
                                      </button>
                                    )}
                                  </div>

                                  {/* Staff Biro list */}
                                  {staffBiro.length > 0 && (
                                    <div className="space-y-1 pt-1 max-h-36 overflow-y-auto">
                                      {staffBiro.map((sb) => (
                                        <div
                                          key={sb.id}
                                          className="bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/50 dark:border-zinc-800/50 rounded px-1.5 py-1 flex items-center justify-between text-left group/sb gap-1"
                                        >
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[9.5px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                              {sb.name.replace(/Sahabat|Sahabati/g, "").trim()}
                                            </p>
                                            <p className="text-[8px] text-zinc-400 uppercase truncate">
                                              {sb.position}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-1 opacity-0 group-hover/sb:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => onOpenEditModal(sb)}
                                              className="text-zinc-400 hover:text-indigo-600"
                                              title="Edit"
                                            >
                                              <Edit2 className="w-2.5 h-2.5" />
                                            </button>
                                            {canDelete && (
                                              <button
                                                onClick={() => onDeleteMember(sb)}
                                                className="text-zinc-400 hover:text-rose-600"
                                                title="Hapus"
                                              >
                                                <Trash2 className="w-2.5 h-2.5" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-2.5 bg-zinc-50 dark:bg-zinc-950/30 rounded border border-dashed border-zinc-200 dark:border-zinc-800">
                            <p className="text-[9.5px] text-zinc-400">Belum ada biro di bidang ini</p>
                            {onOpenAddBiroModal && (
                              <button
                                type="button"
                                onClick={() => onOpenAddBiroModal(dept)}
                                className="mt-1 text-[9.5px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                              >
                                + Buat Biro Baru
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add New Division Card */}
              <div className="w-60 min-w-[240px] max-w-[280px] flex flex-col items-center relative pt-0">
                <div className="absolute -top-6 w-0.5 h-6 bg-zinc-200 dark:bg-zinc-800" />
                <button
                  onClick={onOpenAddDeptModal}
                  className="group w-full min-h-[220px] bg-zinc-50/50 hover:bg-blue-50/50 dark:bg-zinc-950/40 dark:hover:bg-blue-950/20 border-2 border-dashed border-zinc-200 hover:border-blue-400 dark:border-zinc-800 dark:hover:border-blue-700 rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 block">
                      + Tambah Bidang
                    </span>
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">
                      Buat divisi kepengurusan baru
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
