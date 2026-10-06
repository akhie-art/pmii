"use client";

import React from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SecurityTabProps } from "./types";

export function SecurityTab({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  isSavingPassword,
  onSavePassword,
}: SecurityTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 space-y-1">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs">
          <KeyRound className="w-4 h-4 shrink-0" />
          <span>Pengaturan Keamanan Sandi Akun</span>
        </div>
        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Gunakan kata sandi kombinasi unik dengan minimal 6 karakter untuk melindungi akses panel kepengurusan Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Kata Sandi Baru
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-8.5 text-xs pr-8 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Konfirmasi Kata Sandi Baru
          </label>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Ketik ulang kata sandi baru"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="button"
          onClick={onSavePassword}
          disabled={isSavingPassword || !newPassword}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8.5 rounded-lg border-none cursor-pointer flex items-center justify-center gap-1.5 px-4 shadow-xs"
        >
          {isSavingPassword ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <KeyRound className="w-3.5 h-3.5" />
          )}
          <span>Simpan Kata Sandi Baru</span>
        </Button>
      </div>
    </div>
  );
}
