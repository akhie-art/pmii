"use client";

import React, { useState } from "react";
import {
  Mail,
  Send,
  Plus,
  Bookmark,
  FileText,
  Trash2,
  Paperclip,
  UploadCloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { generateUUID } from "@/lib/db";
import type { UserAccount } from "@/lib/db";
import { enforceTenantWrite } from "@/lib/tenancy";
import { uploadFileToStorage, formatBytes } from "./docx-template-helper";
import type { MailItem } from "./types";

interface LetterRecordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveMail: (newMail: MailItem) => Promise<void>;
  outgoing: MailItem[];
  currentUser: UserAccount | null;
}

export function LetterRecordDialog({
  isOpen,
  onOpenChange,
  onSaveMail,
  outgoing,
  currentUser
}: LetterRecordDialogProps) {
  const [newMailType, setNewMailType] = useState<"MASUK" | "KELUAR">("MASUK");
  const [newNomor, setNewNomor] = useState("");
  const [newSenderRecipient, setNewSenderRecipient] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newClassification, setNewClassification] = useState<
    "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi"
  >("Instruksi");
  const [newContent, setNewContent] = useState("");
  const [newSenderTitle, setNewSenderTitle] = useState("");
  const [newSenderLocation, setNewSenderLocation] = useState("");

  const [newAttachmentFile, setNewAttachmentFile] = useState<File | null>(null);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState<string>("");
  const [newAttachmentName, setNewAttachmentName] = useState<string>("");
  const [newAttachmentSize, setNewAttachmentSize] = useState<string>("");
  const [isUploadingAttachment, setIsUploadingAttachment] = useState<boolean>(false);

  const isNewNomorDuplicate =
    newMailType === "KELUAR" &&
    Boolean(
      newNomor.trim() &&
        outgoing.some(
          (m) => m.nomor.trim().toLowerCase() === newNomor.trim().toLowerCase()
        )
    );

  const resetForm = () => {
    setNewNomor("");
    setNewSenderRecipient("");
    setNewSubject("");
    setNewContent("");
    setNewSenderTitle("");
    setNewSenderLocation("");
    setNewAttachmentFile(null);
    setNewAttachmentUrl("");
    setNewAttachmentName("");
    setNewAttachmentSize("");
  };

  const handleRegisterMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNomor.trim() || !newSubject.trim() || !newSenderRecipient.trim()) return;

    if (isNewNomorDuplicate) {
      const confirmUse = window.confirm(
        `PERINGATAN: Nomor surat "${newNomor}" sudah terdaftar di Surat Keluar.\n\nTetap simpan surat ini?`
      );
      if (!confirmUse) return;
    }

    const today = new Date().toISOString().split("T")[0];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const dateStr = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

    let finalFileUrl = newAttachmentUrl;
    let finalFileName = newAttachmentName;
    let finalFileSize = newAttachmentSize;

    if (newAttachmentFile && !finalFileUrl) {
      setIsUploadingAttachment(true);
      const res = await uploadFileToStorage(newAttachmentFile, "surat-attachments", newAttachmentFile.name);
      if (res?.url) {
        finalFileUrl = res.url;
        finalFileName = newAttachmentFile.name;
        finalFileSize = res.sizeFormatted;
      }
      setIsUploadingAttachment(false);
    }

    const newMail: MailItem = enforceTenantWrite<MailItem>(currentUser, {
      id: generateUUID(),
      nomor: newNomor.trim(),
      type: newMailType,
      senderOrRecipient: newSenderRecipient.trim(),
      subject: newSubject.trim(),
      date: today,
      classification: newClassification,
      status: newMailType === "MASUK" ? "Menunggu Tindak Lanjut" : "Terkirim",
      content: newContent.trim() || "Isi surat terlampir.",
      senderTitle: newSenderTitle.trim() || (newMailType === "MASUK" ? "Pengirim" : "PC PMII"),
      senderLocation: newSenderLocation.trim() || "Semarang",
      dateIndo: dateStr,
      fileUrl: finalFileUrl || undefined,
      fileName: finalFileName || undefined,
      fileSize: finalFileSize || undefined
    });

    await onSaveMail(newMail);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-lg w-full p-0 overflow-hidden">
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Registrasi Surat Baru
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Lengkapi metadata arsip persuratan untuk database PMII
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleRegisterMail}>
          <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Toggle Jenis Surat */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Jenis Persuratan <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewMailType("MASUK")}
                  className={`p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                    newMailType === "MASUK"
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-400 shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Surat Masuk</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewMailType("KELUAR")}
                  className={`p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                    newMailType === "KELUAR"
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-400 shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Surat Keluar</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Nomor Surat <span className="text-rose-500">*</span>
                  </label>
                  {newMailType === "KELUAR" && (
                    <button
                      type="button"
                      onClick={() => {
                        let maxSeq = 0;
                        outgoing.forEach((m) => {
                          const match = m.nomor?.match(/^(\d{1,4})/);
                          if (match) {
                            const num = parseInt(match[1], 10);
                            if (!isNaN(num) && num > maxSeq) maxSeq = num;
                          }
                        });
                        const next = (maxSeq + 1).toString().padStart(3, "0");
                        const m = String(new Date().getMonth() + 1).padStart(2, "0");
                        const y = new Date().getFullYear();
                        setNewNomor(`${next}.PC-XI.Z-03.01.010.B-II.${m}.${y}`);
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                      title="Generate nomor urut berikutnya"
                    >
                      + No. Otomatis
                    </button>
                  )}
                </div>
                <Input
                  required
                  placeholder="Contoh: 021.PC-XI.Z-03..."
                  value={newNomor}
                  onChange={(e) => setNewNomor(e.target.value)}
                  className={`h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border rounded-lg ${
                    isNewNomorDuplicate
                      ? "border-rose-400 dark:border-rose-600 focus:ring-rose-500"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                />
                {isNewNomorDuplicate && (
                  <p className="text-[10px] text-rose-500 font-medium">
                    ⚠️ Nomor ini sudah terdaftar di Surat Keluar!
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Klasifikasi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newClassification}
                  onChange={(e) => setNewClassification(e.target.value as any)}
                  className="h-9 w-full text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Instruksi">Instruksi</option>
                  <option value="Permohonan">Permohonan</option>
                  <option value="Undangan">Undangan</option>
                  <option value="Keputusan">Keputusan</option>
                  <option value="Rekomendasi">Rekomendasi</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {newMailType === "MASUK" ? "Instansi Pengirim *" : "Instansi Tujuan *"}
              </label>
              <Input
                required
                placeholder={newMailType === "MASUK" ? "Contoh: PKC PMII Jawa Tengah" : "Contoh: PC PMII Kota Semarang"}
                value={newSenderRecipient}
                onChange={(e) => setNewSenderRecipient(e.target.value)}
                className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Perihal / Hal Surat <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="Contoh: Undangan Rapat Kerja Cabang..."
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Penandatangan</label>
                <Input
                  placeholder="Ketua / Sekretaris"
                  value={newSenderTitle}
                  onChange={(e) => setNewSenderTitle(e.target.value)}
                  className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Kota / Lokasi</label>
                <Input
                  placeholder="Semarang"
                  value={newSenderLocation}
                  onChange={(e) => setNewSenderLocation(e.target.value)}
                  className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Ringkasan / Isi Pokok Surat
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan pokok perihal atau catatan penting terkait surat..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full text-xs p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[85px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 font-medium resize-y"
              />
            </div>

            {/* Unggah Berkas Fisik / Scan PDF Surat */}
            <div className="space-y-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  <span>Lampiran Berkas Asli (PDF / Scan / Foto)</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-normal">Opsional</span>
              </label>

              {newAttachmentFile || newAttachmentUrl ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-xs">
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {newAttachmentName || newAttachmentFile?.name}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {newAttachmentSize || (newAttachmentFile ? formatBytes(newAttachmentFile.size) : "")}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewAttachmentFile(null);
                      setNewAttachmentUrl("");
                      setNewAttachmentName("");
                      setNewAttachmentSize("");
                    }}
                    className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-600 rounded-md cursor-pointer shrink-0"
                    title="Hapus berkas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="relative border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-center hover:border-blue-400 transition-colors bg-zinc-50/50 dark:bg-zinc-900/40">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.docx"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewAttachmentFile(file);
                        setNewAttachmentName(file.name);
                        setNewAttachmentSize(formatBytes(file.size));
                        uploadFileToStorage(file, "surat-attachments", file.name).then((res) => {
                          if (res?.url) {
                            setNewAttachmentUrl(res.url);
                          }
                        });
                      }
                      e.target.value = "";
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
                    <UploadCloud className="w-5 h-5 text-zinc-400" />
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                      Klik atau seret file PDF / scan surat ke sini
                    </p>
                    <p className="text-[9.5px] text-zinc-400">Maks. 15MB (PDF, PNG, JPG, DOCX)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isUploadingAttachment}
              className="h-9 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              {isUploadingAttachment ? "Mengunggah Lampiran..." : "Simpan & Arsipkan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
