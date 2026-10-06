"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  FileText
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EventActivity } from "./types";
import { DEFAULT_EVENT_SESSIONS } from "./types";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: EventActivity | null;
  onSubmit: (eventData: {
    name: string;
    level: string;
    date: string;
    description?: string;
    sessions?: string[];
    waGroupLink?: string;
  }) => void;
  kaderisasiList: any[];
}

export default function EventFormModal({
  isOpen,
  onClose,
  event,
  onSubmit,
  kaderisasiList
}: EventFormModalProps) {
  const isEdit = Boolean(event);

  const [activeTab, setActiveTab] = useState<"info" | "sessions" | "form">("info");
  const [formName, setFormName] = useState("");
  const [formLevel, setFormLevel] = useState("MAPABA");
  const [formDate, setFormDate] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formWaGroupLink, setFormWaGroupLink] = useState("");

  const [sessions, setSessions] = useState<string[]>(DEFAULT_EVENT_SESSIONS);

  useEffect(() => {
    if (!isOpen) return;

    if (event) {
      setFormName(event.name || "");
      setFormLevel(event.level || "MAPABA");
      setFormDate(event.date || "");
      setFormDescription(event.description || "");
      setFormWaGroupLink(event.waGroupLink || "");

      const matched = kaderisasiList?.find(
        (k: any) => k.nama === event.level || k.id === event.level
      );
      if (matched && matched.materi && matched.materi.length > 0) {
        setSessions(matched.materi.map((m: any) => m.judul));
      } else if (event.sessions && event.sessions.length > 0) {
        setSessions(event.sessions);
      } else {
        setSessions(DEFAULT_EVENT_SESSIONS);
      }
    } else {
      setFormName("");
      const defaultLvl =
        kaderisasiList && kaderisasiList.length > 0 ? kaderisasiList[0].nama : "MAPABA";
      setFormLevel(defaultLvl);
      setFormDate("");
      setFormDescription("");
      setFormWaGroupLink("");

      // Auto-fill sessions from matching kaderisasi agenda's materi
      const matched = kaderisasiList?.find(
        (k: any) => k.nama === defaultLvl || k.id === defaultLvl
      );
      if (matched && matched.materi && matched.materi.length > 0) {
        setSessions(matched.materi.map((m: any) => m.judul));
      } else {
        setSessions(DEFAULT_EVENT_SESSIONS);
      }
    }

    setActiveTab("info");
  }, [isOpen, event, kaderisasiList]);

  if (!isOpen) return null;

  const handleLevelChange = (newLvl: string) => {
    setFormLevel(newLvl);
    const matched = kaderisasiList?.find(
      (k: any) => k.nama === newLvl || k.id === newLvl
    );
    if (matched && matched.materi && matched.materi.length > 0) {
      setSessions(matched.materi.map((m: any) => m.judul));
    } else {
      setSessions(DEFAULT_EVENT_SESSIONS);
    }
  };

  const matchedKaderisasi = kaderisasiList?.find(
    (k: any) => k.nama === formLevel || k.id === formLevel
  );
  const currentFormFields = matchedKaderisasi?.formFields || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDate) {
      setActiveTab("info");
      return;
    }

    onSubmit({
      name: formName.trim(),
      level: formLevel,
      date: formDate,
      description: formDescription.trim(),
      sessions: sessions.length > 0 ? sessions : DEFAULT_EVENT_SESSIONS,
      waGroupLink: formWaGroupLink.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <Card className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden relative max-h-[90vh] flex flex-col text-zinc-900 dark:text-zinc-100">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              {isEdit ? "Edit Kegiatan" : "Buat Kegiatan Baru"}
            </h3>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Simple Tab Bar */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4 gap-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`py-2.5 cursor-pointer border-b-2 -mb-px transition-colors ${
                activeTab === "info"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              Informasi
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sessions")}
              className={`py-2.5 cursor-pointer border-b-2 -mb-px transition-colors ${
                activeTab === "sessions"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              Sesi Presensi ({sessions.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("form")}
              className={`py-2.5 cursor-pointer border-b-2 -mb-px transition-colors ${
                activeTab === "form"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              Formulir ({currentFormFields.length})
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3.5 overflow-y-auto flex-1 text-left">
            {/* TAB 1: INFORMASI */}
            {activeTab === "info" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Nama Kegiatan *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Misal: MAPABA RAYA 2026"
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Jenjang *
                    </label>
                    <select
                      value={formLevel}
                      onChange={(e) => handleLevelChange(e.target.value)}
                      className="w-full h-8.5 px-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600"
                    >
                      {kaderisasiList && kaderisasiList.length > 0 ? (
                        kaderisasiList.map((k: any) => (
                          <option key={k.id || k.nama} value={k.nama}>
                            {k.nama}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="MAPABA">MAPABA</option>
                          <option value="PKD">PKD</option>
                          <option value="PKL">PKL</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Tanggal Pelaksanaan *
                    </label>
                    <Input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Deskripsi
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Keterangan singkat..."
                    className="w-full p-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* WhatsApp Group Link */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-emerald-600 dark:fill-emerald-400 shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Link Grup WhatsApp
                    <span className="text-zinc-400 font-normal">(opsional — tampil saat pendaftaran disetujui)</span>
                  </label>
                  <Input
                    type="url"
                    value={formWaGroupLink}
                    onChange={(e) => setFormWaGroupLink(e.target.value)}
                    placeholder="https://chat.whatsapp.com/..."
                    className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: SESI PRESENSI */}
            {activeTab === "sessions" && (
              <div className="space-y-3">
                <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>
                    Sesi presensi otomatis disinkronkan dari Materi Pembelajaran agenda kaderisasi:{" "}
                    <strong className="font-semibold">{formLevel}</strong>. Penambahan atau perubahan materi dapat dilakukan di menu Kaderisasi.
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {sessions.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                      Belum ada materi pembelajaran untuk jenjang {formLevel} di menu Kaderisasi.
                    </div>
                  ) : (
                    sessions.map((sess, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 flex items-center gap-2.5 text-xs"
                      >
                        <span className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-[10px] flex items-center justify-center shrink-0 font-medium">
                          {idx + 1}
                        </span>
                        <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate">
                          {sess}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: FORMULIR */}
            {activeTab === "form" && (
              <div className="space-y-3">
                <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>
                    Formulir pendaftaran otomatis disinkronkan dari agenda kaderisasi:{" "}
                    <strong className="font-semibold">{formLevel}</strong>. Penambahan atau perubahan kolom formulir dapat dilakukan di menu Kaderisasi.
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {currentFormFields.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                      Belum ada kolom formulir tambahan untuk jenjang {formLevel} di menu Kaderisasi.
                    </div>
                  ) : (
                    currentFormFields.map((field: any, idx: number) => (
                      <div
                        key={field.id || idx}
                        className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {field.label}
                            </span>
                            {field.required && (
                              <span className="text-rose-500 font-bold" title="Wajib diisi">*</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                            <span className="uppercase px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300">
                              {field.type}
                            </span>
                            {field.options && field.options.length > 0 && (
                              <span className="truncate text-zinc-400">
                                Opsi: {field.options.join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2 bg-zinc-50/50 dark:bg-zinc-900/30">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-8 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="text-xs font-medium px-4 h-8 rounded-lg text-white bg-blue-600 hover:bg-blue-700 border-none cursor-pointer"
            >
              {isEdit ? "Simpan Perubahan" : "Simpan Kegiatan"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

