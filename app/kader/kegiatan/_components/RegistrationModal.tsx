"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  ExternalLink,
  Eye,
  RefreshCw,
  Trash2
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { readFileAsDataURL } from "./types";
import type { EventActivity } from "./types";

interface RegistrationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventActivity | null;
  activeCadre: any | null;
  formFields: any[];
  onSubmit: (answers: Record<string, any>) => Promise<void>;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onOpenChange,
  event,
  activeCadre,
  formFields,
  onSubmit
}) => {
  const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset and prefill form when modal closes/opens with new event
  React.useEffect(() => {
    if (isOpen) {
      const initialAnswers: Record<string, any> = {};
      if (activeCadre && formFields) {
        formFields.forEach((f: any) => {
          const l = (f.label || "").toLowerCase();
          if (l.includes("nama lengkap") && activeCadre.name) {
            initialAnswers[f.id] = activeCadre.name;
          } else if (l.includes("nik") && f.type === "text" && activeCadre.nik) {
            initialAnswers[f.id] = activeCadre.nik;
          } else if (l.includes("kelamin")) {
            const g = activeCadre.gender || activeCadre.jenisKelamin;
            if (g === "L" || g === "Laki-laki") initialAnswers[f.id] = "Laki-laki";
            else if (g === "P" || g === "Perempuan") initialAnswers[f.id] = "Perempuan";
            else if (g) initialAnswers[f.id] = g;
          } else if (l.includes("tempat") && (activeCadre.ttl || activeCadre.tempatLahir)) {
            initialAnswers[f.id] = activeCadre.ttl || `${activeCadre.tempatLahir || ""}, ${activeCadre.tanggalLahir || ""}`.trim();
          } else if ((l.includes("whatsapp") || l.includes("hp") || l.includes("telepon")) && activeCadre.phone) {
            initialAnswers[f.id] = activeCadre.phone;
          } else if (l.includes("instagram") && activeCadre.instagram) {
            initialAnswers[f.id] = activeCadre.instagram;
          } else if (l.includes("alamat rumah") && activeCadre.address) {
            initialAnswers[f.id] = activeCadre.address;
          } else if (l.includes("perguruan tinggi") && f.type === "text" && activeCadre.perguruanTinggi) {
            initialAnswers[f.id] = activeCadre.perguruanTinggi;
          } else if (l.includes("jurusan") && f.type === "text" && activeCadre.jurusan) {
            initialAnswers[f.id] = activeCadre.jurusan;
          } else if (l.includes("fakultas") && f.type === "text" && activeCadre.fakultas) {
            initialAnswers[f.id] = activeCadre.fakultas;
          }
        });
      }
      setFormAnswers(initialAnswers);
      setUploadingFields({});
      setFileNames({});
      setIsSubmitting(false);
    }
  }, [isOpen, event, activeCadre, formFields]);

  const handleFileUpload = async (fieldId: string, file: File) => {
    setUploadingFields((prev) => ({ ...prev, [fieldId]: true }));
    try {
      let finalUrl = "";
      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `form_answers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (uploadError) {
          finalUrl = await readFileAsDataURL(file);
        } else {
          const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
          finalUrl = data.publicUrl;
        }
      } else {
        finalUrl = await readFileAsDataURL(file);
      }

      setFormAnswers((prev) => ({ ...prev, [fieldId]: finalUrl }));
      setFileNames((prev) => ({ ...prev, [fieldId]: file.name }));
    } catch (error) {
      console.error("Gagal mengunggah berkas:", error);
      alert("Gagal mengunggah berkas formulir.");
    } finally {
      setUploadingFields((prev) => ({ ...prev, [fieldId]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !activeCadre) return;

    for (const f of formFields) {
      if (f.required && !formAnswers[f.id]) {
        alert(`Kolom ${f.label} wajib diisi!`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formAnswers);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl">
        <DialogHeader className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-blue-600 text-white border-none text-[10px] font-bold">
              {event?.level}
            </Badge>
          </div>
          <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Formulir Pendaftaran {event?.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Lengkapi informasi formulir kepesertaan di bawah ini.
          </DialogDescription>
        </DialogHeader>

        {event && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-5 sm:p-6 space-y-3.5 max-h-[65vh] overflow-y-auto">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
                <span className="text-[10px] text-zinc-400 block font-semibold uppercase tracking-wider">
                  Data Akun Anda
                </span>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                  {activeCadre?.name}
                </p>
                <p className="text-zinc-500">{activeCadre?.email || "-"}</p>
              </div>

              {formFields.map((f: any) => (
                <div key={f.id} className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>
                      {f.label} {f.required && <span className="text-rose-500">*</span>}
                    </span>
                    {f.type && (
                      <span className="text-[10px] text-zinc-400 uppercase">{f.type}</span>
                    )}
                  </label>

                  {f.type === "textarea" ? (
                    <textarea
                      rows={3}
                      required={f.required}
                      value={formAnswers[f.id] || ""}
                      onChange={(e) =>
                        setFormAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))
                      }
                      placeholder={f.placeholder || `Tuliskan ${f.label.toLowerCase()}...`}
                      className="w-full text-xs p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[75px] text-zinc-900 dark:text-zinc-100"
                    />
                  ) : f.type === "select" ? (
                    (() => {
                      let rawOptions = f.options;
                      if (typeof rawOptions === "string") {
                        rawOptions = rawOptions.split(",").map((s: string) => s.trim()).filter(Boolean);
                      }
                      const options: string[] =
                        Array.isArray(rawOptions) && rawOptions.length > 0
                          ? rawOptions
                          : (f.label || "").toLowerCase().includes("kelamin")
                          ? ["Laki-laki", "Perempuan"]
                          : [];

                      return (
                        <Select
                          value={formAnswers[f.id] || ""}
                          onValueChange={(val) =>
                            setFormAnswers((prev) => ({ ...prev, [f.id]: val }))
                          }
                        >
                          <SelectTrigger className="w-full h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500">
                            <SelectValue placeholder={f.placeholder || `Pilih ${f.label.toLowerCase()}...`} />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xl rounded-xl z-50">
                            {options.map((opt: string) => (
                              <SelectItem key={opt} value={opt} className="text-xs cursor-pointer">
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    })()
                  ) : f.type === "file" ? (
                    (() => {
                      const fileUrl = formAnswers[f.id] || "";
                      const fileName = fileNames[f.id] || "";
                      const isUploading = !!uploadingFields[f.id];
                      const isDraggingOver = !!isDragging[f.id];

                      const isImg = (() => {
                        if (!fileUrl) return false;
                        if (fileUrl.startsWith("data:image/")) return true;
                        const n = (fileName || fileUrl).toLowerCase();
                        if (
                          n.endsWith(".jpg") ||
                          n.endsWith(".jpeg") ||
                          n.endsWith(".png") ||
                          n.endsWith(".webp") ||
                          n.endsWith(".gif") ||
                          fileUrl.includes(".jpg") ||
                          fileUrl.includes(".jpeg") ||
                          fileUrl.includes(".png") ||
                          fileUrl.includes(".webp")
                        ) {
                          return true;
                        }
                        if (f.id === "f-pas-foto" && !n.endsWith(".pdf")) return true;
                        return false;
                      })();

                      if (fileUrl) {
                        return (
                          <div className="relative w-full min-w-0 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 p-3 sm:p-3.5 transition-all overflow-hidden group shadow-2xs">
                            <div className="flex items-center gap-3 w-full min-w-0">
                              {/* Preview Thumbnail */}
                              {isImg ? (
                                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 shrink-0 group/thumb">
                                  <img
                                    src={fileUrl}
                                    alt={fileName || f.label}
                                    className="w-full h-full object-cover"
                                  />
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                                    title="Perbesar / Lihat Foto"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </a>
                                </div>
                              ) : (
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/50 flex flex-col items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                                  <FileText className="w-6 h-6" />
                                  <span className="text-[9px] font-bold uppercase mt-0.5 tracking-wider">DOC</span>
                                </div>
                              )}

                              {/* File Details */}
                              <div className="min-w-0 flex-1 overflow-hidden space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    Terunggah
                                  </span>
                                  {isImg && (
                                    <span className="text-[10px] text-zinc-400">Gambar</span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate block w-full" title={fileName}>
                                  {fileName || "Berkas Terunggah"}
                                </p>
                                <div className="flex items-center gap-2 pt-0.5">
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Buka Berkas</span>
                                  </a>
                                </div>
                              </div>

                              {/* Action buttons (Ganti & Hapus) */}
                              <div className="flex items-center gap-1.5 shrink-0 ml-auto pl-1">
                                <label
                                  className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-colors shadow-2xs"
                                  title="Ganti berkas ini"
                                >
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleFileUpload(f.id, file);
                                    }}
                                  />
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormAnswers((prev) => {
                                      const next = { ...prev };
                                      delete next[f.id];
                                      return next;
                                    });
                                    setFileNames((prev) => {
                                      const next = { ...prev };
                                      delete next[f.id];
                                      return next;
                                    });
                                  }}
                                  className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-rose-600 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/60 cursor-pointer transition-colors shadow-2xs"
                                  title="Hapus berkas"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <label
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging((prev) => ({ ...prev, [f.id]: true }));
                          }}
                          onDragLeave={() => {
                            setIsDragging((prev) => ({ ...prev, [f.id]: false }));
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging((prev) => ({ ...prev, [f.id]: false }));
                            const file = e.dataTransfer.files?.[0];
                            if (file) handleFileUpload(f.id, file);
                          }}
                          className={`flex flex-col items-center justify-center w-full min-h-[105px] border-2 border-dashed rounded-2xl cursor-pointer transition-all p-4 text-center ${
                            isUploading
                              ? "border-blue-400 bg-blue-50/40 dark:bg-blue-950/20"
                              : isDraggingOver
                              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
                              : "border-zinc-300 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 bg-zinc-50/50 dark:bg-zinc-950/30 hover:bg-blue-50/20 dark:hover:bg-blue-950/10"
                          }`}
                        >
                          <input
                            type="file"
                            required={f.required && !formAnswers[f.id]}
                            disabled={isUploading}
                            accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(f.id, file);
                            }}
                            className="hidden"
                          />

                          {isUploading ? (
                            <div className="flex flex-col items-center justify-center space-y-2 py-2">
                              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                Mengunggah berkas...
                              </p>
                              <span className="text-[10px] text-zinc-400">Mohon tunggu sebentar</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-900/40">
                                <UploadCloud className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                  Klik untuk unggah atau seret berkas ke sini
                                </p>
                                <p className="text-[10.5px] text-zinc-400 mt-0.5">
                                  Mendukung JPG, PNG, WEBP, atau PDF (Maks. 5MB)
                                </p>
                              </div>
                            </div>
                          )}
                        </label>
                      );
                    })()
                  ) : (
                    <Input
                      type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
                      required={f.required}
                      value={formAnswers[f.id] || ""}
                      onChange={(e) =>
                        setFormAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))
                      }
                      placeholder={f.placeholder || `Masukkan ${f.label.toLowerCase()}...`}
                      className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 text-xs rounded-xl cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Pendaftaran"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
