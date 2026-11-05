import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  User,
  Mail,
  KeyRound,
  Building,
  Info,
  CheckCircle2,
  AlertTriangle,
  FolderLock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { UserAccount, UserRole, Role } from "@/lib/db";
import { AVAILABLE_MENUS, isMasterAdmin, formatRoleName } from "./types";

interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit: boolean;
  selectedUser: UserAccount | null;
  formName: string;
  setFormName: (val: string) => void;
  formEmail: string;
  setFormEmail: (val: string) => void;
  formPassword: string;
  setFormPassword: (val: string) => void;
  formRole: UserRole;
  setFormRole: (val: UserRole) => void;
  formStatus: "AKTIF" | "NONAKTIF";
  setFormStatus: (val: "AKTIF" | "NONAKTIF") => void;
  formComm: string;
  setFormComm: (val: string) => void;
  formAllowedMenus: string[];
  setFormAllowedMenus: React.Dispatch<React.SetStateAction<string[]>>;
  availableKomisariats: string[];
  availableRoles?: Role[];
  onSubmit: (e: React.FormEvent) => void;
}

export const UserFormDialog: React.FC<UserFormDialogProps> = ({
  isOpen,
  onClose,
  isEdit,
  selectedUser,
  formName,
  setFormName,
  formEmail,
  setFormEmail,
  formPassword,
  setFormPassword,
  formRole,
  setFormRole,
  formStatus,
  setFormStatus,
  formComm,
  setFormComm,
  formAllowedMenus,
  setFormAllowedMenus,
  availableKomisariats,
  availableRoles,
  onSubmit,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isMaster = isEdit && isMasterAdmin(selectedUser);
  const roleLower = (formRole || "").toLowerCase().trim();
  const isCabangRole =
    roleLower === "admin" ||
    roleLower === "superadmin" ||
    roleLower === "super_admin" ||
    roleLower === "ketua_cabang" ||
    roleLower === "pengurus_cabang" ||
    roleLower.includes("cabang");

  const isPasswordTooShort =
    formPassword.trim().length > 0 && formPassword.trim().length < 6;

  // Pastikan peran standar kepengurusan komisariat (Ketua Komisariat & Pengurus Komisariat) selalu tersedia
  const normalizedAvailableRoles = useMemo(() => {
    const list = availableRoles && availableRoles.length > 0 ? [...availableRoles] : [];
    const ensureRoles: Array<{ id: string; code: string; allowed_menus?: string[] }> = [
      { id: "def-ketua-kom", code: "ketua_komisariat", allowed_menus: [] },
      { id: "def-pengurus-kom", code: "pengurus_komisariat", allowed_menus: [] },
      { id: "def-anggota", code: "anggota", allowed_menus: [] },
      { id: "def-peserta", code: "peserta", allowed_menus: [] },
    ];
    ensureRoles.forEach((er) => {
      if (!list.some((r) => r.code.toLowerCase() === er.code.toLowerCase())) {
        list.push(er as any);
      }
    });

    const seen = new Set<string>();
    const unique = list.filter((r) => {
      const c = r.code.toLowerCase().trim();
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    });

    const ROLE_PRIORITY: Record<string, number> = {
      superadmin: 1,
      ketua_cabang: 2,
      admin: 3,
      pengurus_cabang: 4,
      ketua_komisariat: 5,
      pengurus_komisariat: 6,
      pengurus: 7,
      instruktur: 8,
      anggota: 9,
      peserta: 10,
    };

    return unique.sort((a, b) => {
      const orderA = ROLE_PRIORITY[a.code.toLowerCase()] ?? 99;
      const orderB = ROLE_PRIORITY[b.code.toLowerCase()] ?? 99;
      return orderA - orderB;
    });
  }, [availableRoles]);

  // Grouped menus configuration
  const groupedMenus = useMemo(() => {
    return AVAILABLE_MENUS.reduce((acc, menu) => {
      if (!acc[menu.group]) acc[menu.group] = [];
      acc[menu.group].push(menu);
      return acc;
    }, {} as Record<string, typeof AVAILABLE_MENUS>);
  }, []);

  const allMenuHrefs = useMemo(() => AVAILABLE_MENUS.map((m) => m.href), []);
  const allChecked = AVAILABLE_MENUS.every((m) => formAllowedMenus.includes(m.href));

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPasswordTooShort) return;
    onSubmit(e);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>{isEdit ? "Edit Akun Pengguna" : "Tambah Pengguna Baru"}</span>
            </DialogTitle>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isEdit
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60"
              }`}
            >
              {isEdit ? "Mode Edit" : "Akun Baru"}
            </span>
          </div>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {isEdit
              ? "Perbarui kredensial login, peran akun, dan hak akses menu dashboard."
              : "Buat akun login baru untuk fungsionaris cabang, komisariat, atau instruktur."}
          </DialogDescription>
        </DialogHeader>

        {/* Profile Card Context (Edit Mode) */}
        {isEdit && selectedUser && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 mt-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {selectedUser.name ? selectedUser.name.slice(0, 2).toUpperCase() : "US"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {selectedUser.name}
                </h4>
                <span className="text-[9.5px] px-2 py-0.2 rounded-full font-semibold bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                  {formatRoleName(selectedUser.role)}
                </span>
              </div>
              <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                {selectedUser.email} • {selectedUser.commissariat || "Pengurus Cabang"}
              </p>
            </div>
            {isMaster && (
              <div className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 shrink-0">
                <Lock className="w-3 h-3" />
                <span>Master</span>
              </div>
            )}
          </div>
        )}

        {/* Informational Guidance Notice */}
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 text-[11px] text-zinc-600 dark:text-zinc-400 mt-2">
          <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Form ini mengatur <strong>akun kredensial login portal</strong>. Susunan kepengurusan struktural BPH/Biro dikelola pada menu <strong>Data Pengurus</strong>.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4 pt-1">
          <div className="space-y-3">
            {/* Row 1: Nama & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Nama Lengkap</span>
                  <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Nama lengkap"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-blue-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Alamat Email</span>
                  <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-blue-500/30"
                />
              </div>
            </div>

            {/* Row 2: Password with Eye Toggle & Validation */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{isEdit ? "Ganti Password Baru" : "Password Akun"}</span>
                  {!isEdit ? (
                    <span className="text-rose-500">*</span>
                  ) : (
                    <span className="text-[10px] text-zinc-400 font-normal">
                      (kosongkan bila tidak diubah)
                    </span>
                  )}
                </label>
                {formPassword && (
                  <span
                    className={`text-[10px] font-medium ${
                      formPassword.length >= 6
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {formPassword.length} karakter
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required={!isEdit}
                  placeholder={
                    isEdit
                      ? "Biarkan kosong jika password tetap"
                      : "Minimal 6 karakter"
                  }
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className={`text-xs h-9 pr-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-blue-500/30 ${
                    isPasswordTooShort
                      ? "border-amber-500/70 focus-visible:ring-amber-500/30"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {isPasswordTooShort && (
                <p className="text-[10.5px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Password baru minimal 6 karakter.</span>
                </p>
              )}
            </div>

            {/* Row 3: Role & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Peran Akun
                  </label>
                  {isMaster && (
                    <span className="text-[9.5px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Terkunci
                    </span>
                  )}
                </div>
                <Select
                  value={formRole.toLowerCase()}
                  disabled={isMaster}
                  onValueChange={(val: any) => {
                    if (!val) return;
                    setFormRole(val);
                    const matchedRole = normalizedAvailableRoles?.find(
                      (r) => r.code.toLowerCase() === val.toLowerCase()
                    );
                    if (
                      matchedRole?.allowed_menus &&
                      matchedRole.allowed_menus.length > 0
                    ) {
                      setFormAllowedMenus(matchedRole.allowed_menus);
                    } else {
                      setFormAllowedMenus(
                        AVAILABLE_MENUS.filter((m) =>
                          m.defaultRoles
                            .map((r) => r.toLowerCase())
                            .includes(val.toLowerCase())
                        ).map((m) => m.href)
                      );
                    }
                  }}
                >
                  <SelectTrigger className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectValue placeholder="Pilih Peran" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg max-h-60">
                    {normalizedAvailableRoles.map((r) => (
                      <SelectItem
                        key={r.id || r.code}
                        value={r.code.toLowerCase()}
                        className="text-xs font-medium cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <span>{formatRoleName(r.code)}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            ({r.code})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Status Akun
                </label>
                <Select
                  value={formStatus}
                  disabled={isMaster}
                  onValueChange={(val: any) => {
                    if (val) setFormStatus(val);
                  }}
                >
                  <SelectTrigger className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectItem value="AKTIF" className="text-xs font-medium">
                      Aktif (Dapat Login)
                    </SelectItem>
                    <SelectItem value="NONAKTIF" className="text-xs font-medium text-zinc-500">
                      Non-Aktif (Dibekukan)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 4: Cakupan Wilayah / Komisariat */}
            {!isCabangRole ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Komisariat Kampus</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-zinc-400">
                    Terkunci ke data kampus ini
                  </span>
                </div>
                <Select
                  value={formComm}
                  onValueChange={(val) => {
                    if (val) setFormComm(val);
                  }}
                >
                  <SelectTrigger className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectValue placeholder="Pilih komisariat kampus" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    {availableKomisariats.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="leading-snug">
                  <strong>Cakupan Teritorial:</strong> Pengurus Cabang Grobogan (Memiliki hak akses lintas seluruh komisariat).
                </span>
              </div>
            )}

            {/* Row 5: Menu Access Permissions (Grid Checkbox) */}
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                    Izin Akses Menu Dashboard
                  </label>
                  <span className="text-[10.5px] text-zinc-400">
                    {formAllowedMenus.length} dari {AVAILABLE_MENUS.length} menu aktif
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormAllowedMenus(allChecked ? [] : allMenuHrefs);
                  }}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {allChecked ? "Hapus Semua" : "Pilih Semua"}
                </button>
              </div>

              {/* 2-Column Responsive Chips Group */}
              <div className="max-h-56 overflow-y-auto border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-xl p-3 space-y-3.5">
                {Object.entries(groupedMenus).map(([groupName, menus]) => {
                  const activeInGroup = menus.filter((m) =>
                    formAllowedMenus.includes(m.href)
                  ).length;
                  return (
                    <div key={groupName} className="space-y-1.5">
                      <div className="flex items-center justify-between pb-1 border-b border-zinc-200/50 dark:border-zinc-800/60">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                          {groupName}
                        </span>
                        <span className="text-[9.5px] text-zinc-400 font-mono">
                          {activeInGroup}/{menus.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {menus.map((menu) => {
                          const isChecked = formAllowedMenus.includes(menu.href);
                          return (
                            <label
                              key={menu.href}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all select-none ${
                                isChecked
                                  ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200 font-medium"
                                  : "bg-white dark:bg-zinc-900/80 border-zinc-200/70 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  setFormAllowedMenus(
                                    isChecked
                                      ? formAllowedMenus.filter((h) => h !== menu.href)
                                      : [...formAllowedMenus, menu.href]
                                  )
                                }
                                className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer shrink-0"
                              />
                              <span className="truncate text-[11px]">
                                {menu.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-9 px-4 rounded-xl cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPasswordTooShort}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold h-9 px-5 rounded-xl cursor-pointer shadow-xs transition-all"
            >
              {isEdit ? "Simpan Perubahan" : "Buat Akun"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
