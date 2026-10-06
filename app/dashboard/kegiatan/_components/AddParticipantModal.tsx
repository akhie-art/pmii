"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Check, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import type { EventActivity, ParticipantRegistration } from "./types";

interface AddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventActivity | null;
  existingRegistrations: ParticipantRegistration[];
  onAddParticipant: (data: {
    cadreName: string;
    cadreEmail: string;
    answers?: Record<string, string>;
  }) => void;
}

export default function AddParticipantModal({
  isOpen,
  onClose,
  event,
  existingRegistrations,
  onAddParticipant
}: AddParticipantModalProps) {
  const [mode, setMode] = useState<"SELECT" | "MANUAL">("SELECT");
  const [cadres, setCadres] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Manual input state
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const loadCadres = async () => {
      setLoading(true);
      try {
        const list = await db.getCadres();
        setCadres(list || []);
      } catch (err) {
        console.error("Failed to load cadres", err);
      } finally {
        setLoading(false);
      }
    };

    loadCadres();
    setManualName("");
    setManualEmail("");
    setManualPhone("");
    setSearchQuery("");
    setMode("SELECT");
  }, [isOpen]);

  if (!isOpen || !event) return null;

  const existingEmails = new Set(
    existingRegistrations.map((r) => r.cadreEmail?.toLowerCase()).filter(Boolean)
  );
  const existingNames = new Set(
    existingRegistrations.map((r) => r.cadreName?.toLowerCase()).filter(Boolean)
  );

  const availableCadres = cadres.filter((c) => {
    const emailLower = (c.email || "").toLowerCase();
    const nameLower = (c.name || "").toLowerCase();
    const alreadyRegistered =
      (emailLower && existingEmails.has(emailLower)) || existingNames.has(nameLower);

    if (alreadyRegistered) return false;

    if (!searchQuery) return true;
    return (
      nameLower.includes(searchQuery.toLowerCase()) ||
      emailLower.includes(searchQuery.toLowerCase()) ||
      (c.commissariat && c.commissariat.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleSelectCadre = (cadre: any) => {
    onAddParticipant({
      cadreName: cadre.name,
      cadreEmail: cadre.email || `${cadre.name.toLowerCase().replace(/\s+/g, ".")}@pmii.org`,
      answers: {
        "f-hp": cadre.phone || "",
        "f-alamat": cadre.address || "",
        "f-ig": cadre.instagram || ""
      }
    });
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    onAddParticipant({
      cadreName: manualName.trim(),
      cadreEmail: manualEmail.trim() || `${manualName.trim().toLowerCase().replace(/\s+/g, ".")}@pmii.org`,
      answers: {
        "f-hp": manualPhone.trim()
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
      <Card className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Tambah & Setujui Peserta
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {event.name} • Status langsung otomatis diterima (APPROVED)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4 pt-2 gap-4">
          <button
            type="button"
            onClick={() => setMode("SELECT")}
            className={`pb-2 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
              mode === "SELECT"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Pilih dari Data Anggota ({availableCadres.length})
          </button>
          <button
            type="button"
            onClick={() => setMode("MANUAL")}
            className={`pb-2 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
              mode === "MANUAL"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Input Manual
          </button>
        </div>

        {/* Body */}
        {mode === "SELECT" ? (
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder="Cari nama atau komisariat anggota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-zinc-400">Memuat data kader...</div>
            ) : availableCadres.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                Tidak ada anggota baru yang dapat ditambahkan (semua sudah terdaftar atau tidak ditemukan).
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                {availableCadres.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex items-center justify-between gap-3 hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {c.name}
                        </span>
                        <Badge className="text-[9px] font-medium px-1.5 py-0 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-none">
                          {c.level || "MAPABA"}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-zinc-400 block truncate">
                        {c.email || "Tanpa email"} • {c.commissariat || "Ki Ageng Getas Pendawa"}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleSelectCadre(c)}
                      className="h-7 px-2.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Daftarkan</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="p-4 space-y-3.5 flex-1 overflow-y-auto">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Nama Lengkap Peserta *
              </label>
              <Input
                type="text"
                required
                placeholder="Contoh: Muhammad Ali"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Alamat Email (opsional)
              </label>
              <Input
                type="email"
                placeholder="Contoh: ali@gmail.com"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                No. WhatsApp / Telepon (opsional)
              </label>
              <Input
                type="text"
                placeholder="Contoh: 081234567890"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Daftarkan & Otomatis Setujui</span>
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
