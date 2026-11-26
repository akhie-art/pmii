"use client";

import { SmartImage } from "@/components/ui/smart-image";

import React, { useState, useRef } from "react";
import {
  Upload,
  Copy,
  Trash2,
  Check,
  RefreshCw,
  ExternalLink,
  ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { cleanTwibbonFileGreenScreen } from "@/lib/chromaKey";
import { useMounted } from "@/hooks/use-mounted";
import type { EventActivity, TwibbonConfig } from "./types";

function getDefaultCaption(eventName: string): string {
  return `[KAMPANYE RESMI ${eventName.toUpperCase()}]\n\n"Tangan Terkepal dan Maju ke Muka!" 💙💛\n\nSaya siap hadir dan menyukseskan ${eventName}.\n\n#PMII #SalamPergerakan #${eventName.replace(/\s+/g, "")} #KaderPMII`;
}

interface TwibbonTabProps {
  event: EventActivity | null;
  onUpdateEvent: (updated: EventActivity) => Promise<boolean | void> | void;
}

export default function TwibbonTab({ event, onUpdateEvent }: TwibbonTabProps) {
  const currentTwibbon = event?.twibbon;
  const mounted = useMounted();

  const [frameUrl, setFrameUrl] = useState<string>(currentTwibbon?.frameUrl || "");
  const [caption, setCaption] = useState<string>(
    currentTwibbon?.caption || getDefaultCaption(event?.name || "Kegiatan PMII")
  );
  const [isActive, setIsActive] = useState<boolean>(
    currentTwibbon?.isActive !== undefined ? Boolean(currentTwibbon.isActive) : true
  );

  const eventSyncKey = `${event?.id || ""}:${event?.twibbon?.frameUrl || ""}:${event?.twibbon?.caption || ""}:${String(event?.twibbon?.isActive)}`;
  const [prevEventSyncKey, setPrevEventSyncKey] = useState(eventSyncKey);
  if (eventSyncKey !== prevEventSyncKey) {
    setPrevEventSyncKey(eventSyncKey);
    if (event) {
      setFrameUrl(event.twibbon?.frameUrl || "");
      setCaption(
        event.twibbon?.caption || getDefaultCaption(event.name || "Kegiatan PMII")
      );
      setIsActive(
        event.twibbon?.isActive !== undefined ? Boolean(event.twibbon.isActive) : true
      );
    }
  }

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isShareCopied, setIsShareCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // URL Publik Twibbon
  const origin = mounted && typeof window !== "undefined" ? window.location.origin : "";

  const shareUrl = event
    ? `${origin || ""}/twibbon?event=${encodeURIComponent(event.id)}`
    : "";

  // Handle upload frame PNG
  const handleUploadFrame = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran berkas maksimal 10MB.");
      return;
    }

    setIsUploading(true);
    try {
      const { processedBlob, hasGreenScreen } = await cleanTwibbonFileGreenScreen(file);
      if (hasGreenScreen) {
        toast.info("Latar hijau otomatis dibersihkan menjadi transparan.");
      }

      const uploadFile = new File(
        [processedBlob],
        `twibbon-${event?.id || "event"}-${Date.now()}.png`,
        { type: "image/png" }
      );

      if (isSupabaseConfigured && supabase) {
        const fileName = uploadFile.name;
        const filePath = `twibbons/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(filePath, uploadFile, {
            cacheControl: "3600",
            upsert: true
          });

        if (!uploadError) {
          const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
          if (data?.publicUrl) {
            setFrameUrl(data.publicUrl);
            toast.success("Bingkai twibbon berhasil disimpan.");
            return;
          }
        }
      }

      // Fallback base64
      const reader = new FileReader();
      reader.onload = (eventReader) => {
        const base64 = eventReader.target?.result as string;
        setFrameUrl(base64);
        toast.success("Bingkai twibbon berhasil dimuat.");
      };
      reader.readAsDataURL(uploadFile);
    } catch (err) {
      console.error("Gagal mengunggah twibbon:", err);
      toast.error("Gagal mengunggah berkas twibbon.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Simpan ke Database
  const handleSave = async () => {
    if (!event) return;

    setIsSaving(true);
    try {
      const updatedTwibbon: TwibbonConfig = {
        frameUrl: frameUrl || undefined,
        caption: caption.trim() || undefined,
        isActive: Boolean(isActive),
        updatedAt: new Date().toISOString()
      };

      const updatedEvent: EventActivity = {
        ...event,
        twibbon: updatedTwibbon
      };

      await onUpdateEvent(updatedEvent);
      toast.success("Pengaturan twibbon berhasil disimpan.");
    } catch (err) {
      console.error("Gagal menyimpan twibbon:", err);
      toast.error("Gagal menyimpan pengaturan twibbon.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyShareLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setIsShareCopied(true);
    toast.success("Tautan disalin ke papan klip.");
    setTimeout(() => setIsShareCopied(false), 2000);
  };

  if (!event) {
    return (
      <div className="p-8 text-center text-zinc-400 text-xs">
        Pilih kegiatan untuk mengelola twibbon.
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1 max-w-3xl">
      {/* Header bar: status & action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Twibbon Kampanye
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            Bingkai foto dan tautan publik untuk kader.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${
                isActive ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <div
                className={`bg-white w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform ${
                  isActive ? "translate-x-3.5" : "translate-x-0"
                }`}
              />
            </div>
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              {isActive ? "Aktif" : "Nonaktif"}
            </span>
          </label>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8 px-4 rounded-lg cursor-pointer transition-colors shadow-2xs"
          >
            {isSaving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/*"
        className="hidden"
        onChange={handleUploadFrame}
      />

      {/* Bingkai Twibbon */}
      <Card className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-none space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Bingkai Twibbon (.PNG)
          </label>
          {frameUrl && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setFrameUrl("")}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-7 text-xs px-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Hapus
            </Button>
          )}
        </div>

        {frameUrl ? (
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-md border border-zinc-200 dark:border-zinc-800 bg-[repeating-conic-gradient(#f4f4f5_0%_25%,#e4e4e7_0%_50%)_50%/8px_8px] overflow-hidden flex items-center justify-center p-0.5 shrink-0">
                <SmartImage
                  src={frameUrl}
                  alt="Bingkai"
                  preserveAspect
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  Bingkai terpasang
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Check className="w-3 h-3" /> Siap digunakan
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-7 text-xs border-zinc-200 dark:border-zinc-700 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Ganti
            </Button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 rounded-lg p-5 text-center cursor-pointer transition-colors bg-zinc-50/40 dark:bg-zinc-950/40 hover:bg-blue-50/20"
          >
            <Upload className="w-5 h-5 mx-auto text-zinc-400 mb-1.5" />
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {isUploading ? "Mengunggah..." : "Unggah bingkai PNG"}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              PNG transparan atau latar hijau (Maks. 10MB)
            </p>
          </div>
        )}
      </Card>

      {/* Tautan Publik */}
      <Card className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-none space-y-2">
        <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
          Tautan Publik
        </label>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={shareUrl}
            className="h-8.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 select-all"
          />
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleCopyShareLink}
            className="h-8.5 px-3 text-xs border-zinc-200 dark:border-zinc-800 shrink-0 cursor-pointer"
          >
            {isShareCopied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                Tersalin
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                Salin
              </>
            )}
          </Button>
          {shareUrl && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => window.open(shareUrl, "_blank")}
              className="h-8.5 px-2.5 text-xs border-zinc-200 dark:border-zinc-800 shrink-0 cursor-pointer"
              title="Buka Halaman Publik"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </Card>

      {/* Caption Media Sosial */}
      <Card className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-none space-y-2">
        <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
          Teks Caption Medsos (Opsional)
        </label>
        <Textarea
          rows={4}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Tulis draf caption yang dapat disalin peserta..."
          className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg resize-y"
        />
      </Card>
    </div>
  );
}
