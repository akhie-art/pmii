import React from "react";
import { ShieldCheck } from "lucide-react";
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
import type { UserAccount, UserRole } from "@/lib/db";
import { AVAILABLE_MENUS, isMasterAdmin } from "./types";

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
  onSubmit,
}) => {
  const isMaster = isEdit && isMasterAdmin(selectedUser);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{isEdit ? "Edit Pengguna" : "Tambah Pengguna Baru"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {isEdit ? "Perbarui informasi dan hak akses pengguna." : "Isi data akun baru untuk pengurus atau instruktur."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-3">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Nama <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                required
                placeholder="Nama lengkap"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="text-xs h-8 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Email <span className="text-rose-500">*</span>
              </label>
              <Input
                type="email"
                required
                placeholder="nama@email.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="text-xs h-8 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {isEdit ? "Password baru" : "Password"}{" "}
                {isEdit ? (
                  <span className="text-zinc-400 font-normal">(kosongkan jika tidak diubah)</span>
                ) : (
                  <span className="text-rose-500">*</span>
                )}
              </label>
              <Input
                type="password"
                required={!isEdit}
                placeholder={isEdit ? "Biarkan kosong jika tetap" : "Min. 6 karakter"}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="text-xs h-8 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>

            {/* Role + Status */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Peran</label>
                <Select
                  value={formRole.toLowerCase()}
                  disabled={isMaster}
                  onValueChange={(val: any) => {
                    if (!val) return;
                    setFormRole(val);
                    setFormAllowedMenus(
                      AVAILABLE_MENUS.filter((m) =>
                        m.defaultRoles.map((r) => r.toLowerCase()).includes(val.toLowerCase())
                      ).map((m) => m.href)
                    );
                  }}
                >
                  <SelectTrigger className="text-xs h-8 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectValue placeholder="Peran" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                    <SelectItem value="pengurus" className="text-xs">Pengurus</SelectItem>
                    <SelectItem value="instruktur" className="text-xs">Instruktur</SelectItem>
                    <SelectItem value="anggota" className="text-xs">Anggota</SelectItem>
                    <SelectItem value="peserta" className="text-xs">Peserta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Status</label>
                <Select
                  value={formStatus}
                  disabled={isMaster}
                  onValueChange={(val: any) => {
                    if (val) setFormStatus(val);
                  }}
                >
                  <SelectTrigger className="text-xs h-8 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectItem value="AKTIF" className="text-xs">Aktif</SelectItem>
                    <SelectItem value="NONAKTIF" className="text-xs">Non-Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Komisariat */}
            {formRole.toUpperCase() !== "ADMIN" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Komisariat</label>
                <Select value={formComm} onValueChange={(val) => { if (val) setFormComm(val); }}>
                  <SelectTrigger className="text-xs h-8 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectValue placeholder="Pilih komisariat" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    {availableKomisariats.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Menu Access Checkboxes */}
            <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Izin Akses Menu Khusus
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const all = AVAILABLE_MENUS.map((m) => m.href);
                    const allChecked = AVAILABLE_MENUS.every((m) => formAllowedMenus.includes(m.href));
                    setFormAllowedMenus(allChecked ? [] : all);
                  }}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {AVAILABLE_MENUS.every((m) => formAllowedMenus.includes(m.href)) ? "Hapus Semua" : "Pilih Semua"}
                </button>
              </div>
              <div className="max-h-44 overflow-y-auto border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-lg p-3 space-y-3">
                {Object.entries(
                  AVAILABLE_MENUS.reduce((acc, menu) => {
                    if (!acc[menu.group]) acc[menu.group] = [];
                    acc[menu.group].push(menu);
                    return acc;
                  }, {} as Record<string, typeof AVAILABLE_MENUS>)
                ).map(([groupName, menus]) => (
                  <div key={groupName} className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">{groupName}</span>
                    <div className="space-y-1.5 pl-1">
                      {menus.map((menu) => {
                        const isChecked = formAllowedMenus.includes(menu.href);
                        return (
                          <label key={menu.href} className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setFormAllowedMenus(
                                  isChecked ? formAllowedMenus.filter((h) => h !== menu.href) : [...formAllowedMenus, menu.href]
                                )
                              }
                              className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-xs">{menu.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-8 px-3 rounded-lg cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 px-4 rounded-lg cursor-pointer"
            >
              {isEdit ? "Simpan Perubahan" : "Buat Akun"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
