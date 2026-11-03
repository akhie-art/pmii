"use client";

import React, { useState } from "react";
import { KeyRound, Eye, EyeOff, ShieldCheck, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from "@/components/ui/input-group";
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
  const [showConfirm, setShowConfirm] = useState(false);

  const isMinLength = newPassword.length >= 6;
  const isMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const isMismatch = confirmPassword && newPassword !== confirmPassword;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Informational Banner */}
      <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 flex items-start gap-3">
        <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5 text-blue-950 dark:text-blue-200">
          <p className="font-semibold">Kelola Kata Sandi Akun Mandiri</p>
          <p className="text-[11px] text-blue-700/80 dark:text-blue-400 leading-relaxed">
            Kata sandi baru akan digunakan saat masuk melalui halaman login sistem PMII bersama email, NIM, atau nomor HP Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
        {/* Kata Sandi Baru */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide flex items-center justify-between">
            <span>Kata Sandi Baru</span>
            <span className="text-rose-500 font-bold">*</span>
          </label>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Lock className="size-4 text-zinc-400" />
            </InputGroupAddon>
            <InputGroupInput
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-xs"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {newPassword && (
            <p className={`text-[10px] flex items-center gap-1 ${isMinLength ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {isMinLength ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              <span>{isMinLength ? "Panjang kata sandi memenuhi syarat" : "Minimal 6 karakter"}</span>
            </p>
          )}
        </div>

        {/* Konfirmasi Kata Sandi Baru */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide flex items-center justify-between">
            <span>Konfirmasi Kata Sandi Baru</span>
            <span className="text-rose-500 font-bold">*</span>
          </label>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <KeyRound className="size-4 text-zinc-400" />
            </InputGroupAddon>
            <InputGroupInput
              type={showConfirm ? "text" : "password"}
              placeholder="Ketik ulang kata sandi baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-xs"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                {showConfirm ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {confirmPassword && (
            <p className={`text-[10px] flex items-center gap-1 ${isMatch ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {isMatch ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              <span>{isMatch ? "Kata sandi cocok" : "Kata sandi tidak sama"}</span>
            </p>
          )}
        </div>
      </div>

      <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Tersinkronisasi otomatis dengan otentikasi login</span>
        </div>

        <Button
          type="button"
          disabled={!newPassword || !confirmPassword || !isMatch || !isMinLength || isSavingPassword}
          onClick={onSavePassword}
          className="h-8.5 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSavingPassword ? (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Menyimpan Sandi...</span>
            </div>
          ) : (
            <span>Perbarui Sandi</span>
          )}
        </Button>
      </div>
    </div>
  );
}
