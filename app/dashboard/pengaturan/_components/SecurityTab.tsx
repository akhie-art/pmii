import React from "react";
import { Lock, KeyRound, Eye, EyeOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SecurityTabProps {
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  passwordError: string;
  passwordSuccess: string;
  isSavingPassword: boolean;
  onSavePassword: (e: React.FormEvent) => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  passwordError,
  passwordSuccess,
  isSavingPassword,
  onSavePassword
}) => {
  return (
    <div className="max-w-3xl">
      {/* Main Form: Password */}
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none">
        <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-bold tracking-wide flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Autentikasi & Akun Pengurus</span>
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Kelola keamanan kata sandi akun dan proteksi autentikasi login pengguna.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-6">
          <form onSubmit={onSavePassword} className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Ubah Kata Sandi Akun</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? "Sembunyikan" : "Tampilkan"}</span>
              </button>
            </div>

            {passwordError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Kata Sandi Saat Ini
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password saat ini..."
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Ulangi Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Ketik ulang password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={isSavingPassword || !newPassword || !confirmPassword}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-8.5 px-3.5 rounded-lg cursor-pointer"
              >
                {isSavingPassword ? "Menyimpan..." : "Perbarui Kata Sandi"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
