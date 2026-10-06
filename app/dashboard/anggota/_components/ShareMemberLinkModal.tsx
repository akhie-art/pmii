"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ExternalLink, MessageCircle, UserCheck, AlertCircle, Share2 } from "lucide-react";
import type { Member } from "./types";

interface ShareMemberLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onShowToast: (message: string) => void;
}

export default function ShareMemberLinkModal({
  isOpen,
  onClose,
  member,
  onShowToast
}: ShareMemberLinkModalProps) {
  const [copied, setCopied] = useState(false);

  if (!member) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const updateUrl = `${origin}/lengkapi-data/${member.id}`;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(updateUrl);
      setCopied(true);
      onShowToast("Tautan berhasil disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isDataIncomplete = !member.nik || !member.email || !member.phone || !member.perguruanTinggi || (!member.avatar && !member.pasFotoName);

  const missingFields: string[] = [];
  if (!member.nik) missingFields.push("NIK");
  if (!member.email) missingFields.push("Email");
  if (!member.phone) missingFields.push("No. WhatsApp");
  if (!member.tempatLahir || !member.tanggalLahir) missingFields.push("TTL");
  if (!member.perguruanTinggi) missingFields.push("Kampus");
  if (!member.avatar && !member.pasFotoName) missingFields.push("Pas Foto");

  const waMessage = `Assalamu'alaikum Wr. Wb. Sahabat ${member.name},

Mohon bantu lengkapi data keanggotaan PMII Anda melalui tautan resmi berikut:
${updateUrl}

Data ini diperlukan untuk pendataan kader nasional dan pencetakan KTA Digital PMII.

Tangan Terkepal dan Maju Ke Muka!
Salam Pergerakan!`;

  const waUrl = member.phone
    ? `https://wa.me/${member.phone.replace(/^0/, "62").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(waMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white">
                Bagikan Tautan Lengkapi Data
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Kirimkan tautan khusus ini ke pemilik data untuk melengkapi biodatanya secara mandiri.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Member Card Summary */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-3">
            <div>
              <span className="text-xs text-zinc-500 block">Nama Anggota:</span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">{member.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{member.komisariat}</p>
            </div>
            <div>
              {isDataIncomplete ? (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[10px] gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Belum Lengkap ({missingFields.length} kolom)
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] gap-1">
                  <UserCheck className="w-3 h-3" />
                  Data Lengkap
                </Badge>
              )}
            </div>
          </div>

          {missingFields.length > 0 && (
            <div className="text-[11px] text-zinc-500 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
              <span className="font-medium text-amber-800 dark:text-amber-300">Data yang belum diisi: </span>
              {missingFields.join(", ")}.
            </div>
          )}

          {/* Link Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Tautan Formulir Pemutakhiran Data
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={updateUrl}
                className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCopy}
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-9 text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Tersalin" : "Salin"}
              </Button>
            </div>
          </div>

          {/* WhatsApp Direct Button */}
          <div className="pt-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              Kirim Tautan ke WhatsApp Anggota
            </a>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <a
            href={updateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Buka Formulir di Tab Baru
          </a>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
