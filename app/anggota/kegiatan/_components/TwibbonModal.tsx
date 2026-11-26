"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Download,
  Copy,
  Check,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Upload,
  User,
  Sparkles,
  Move,
  Share2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle
} from "@/components/ui/dialog";
import { removeGreenScreenFromImage } from "@/lib/chromaKey";
import type { EventActivity } from "./types";

export const DEFAULT_CADRE_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#0A2A5C"/>
  <circle cx="200" cy="140" r="65" fill="#F7C738"/>
  <path d="M70 360 C70 250, 130 225, 200 225 C270 225, 330 250, 330 360 Z" fill="#F7C738"/>
  <text x="200" y="385" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">KADER PMII</text>
</svg>
`);

interface TwibbonModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventActivity | null;
  activeCadre?: any | null;
}

export const TwibbonModal: React.FC<TwibbonModalProps> = ({
  isOpen,
  onOpenChange,
  event,
  activeCadre
}) => {
  const frameUrl = event?.twibbon?.frameUrl || "";
  const rawCaption = event?.twibbon?.caption || "";

  // User photo state
  const [userPhoto, setUserPhoto] = useState<string>("");
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Ambil avatar kader sebagai default jika ada, atau default SVG avatar
  const twibbonSyncKey = isOpen ? `${activeCadre?.id || ""}:${activeCadre?.avatar || activeCadre?.pasFoto || ""}` : "";
  const [prevTwibbonSyncKey, setPrevTwibbonSyncKey] = useState("");
  if (twibbonSyncKey !== prevTwibbonSyncKey) {
    setPrevTwibbonSyncKey(twibbonSyncKey);
    if (isOpen) {
      const defaultAvatar = activeCadre?.avatar || activeCadre?.pasFoto || "";
      setUserPhoto(defaultAvatar || DEFAULT_CADRE_AVATAR);
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    }
  }

  // Format caption dengan nama kader jika ada
  const formattedCaption = React.useMemo(() => {
    if (!rawCaption) return "";
    const cadreName = activeCadre?.name || activeCadre?.namaLengkap || "Kader PMII";
    const eventName = event?.name || "Kegiatan PMII";
    return rawCaption
      .replace(/\[Nama Lengkap\]|\[Nama\]|\{nama\}|\{nama_peserta\}/gi, cadreName)
      .replace(/\[Nama Kegiatan\]|\{kegiatan\}|\{nama_kegiatan\}/gi, eventName);
  }, [rawCaption, activeCadre, event]);

  // Helper aman untuk memuat gambar
  const loadImage = useCallback((src: string): Promise<HTMLImageElement | null> => {
    if (!src) return Promise.resolve(null);
    return new Promise((resolve) => {
      const img = new Image();
      if (!src.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (img.crossOrigin) {
          const retry = new Image();
          retry.onload = () => resolve(retry);
          retry.onerror = () => resolve(null);
          retry.src = src;
        } else {
          resolve(null);
        }
      };
      img.src = src;
    });
  }, []);

  // Redraw preview canvas saat state berubah
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    let isCancelled = false;

    async function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Muat frame twibbon
      const frameImg = frameUrl ? await loadImage(frameUrl) : null;
      if (isCancelled) return;

      // Hitung aspect ratio canvas preview
      let targetW = 600;
      let targetH = 600;
      if (frameImg && frameImg.naturalWidth && frameImg.naturalHeight) {
        const ratio = frameImg.naturalHeight / frameImg.naturalWidth;
        targetW = 600;
        targetH = Math.round(600 * ratio);
      }

      canvas.width = targetW;
      canvas.height = targetH;

      ctx.clearRect(0, 0, targetW, targetH);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetW, targetH);

      // 2. Muat Foto Peserta (Layer Bawah)
      const photoSrc = userPhoto || DEFAULT_CADRE_AVATAR;
      const photo = await loadImage(photoSrc);
      if (isCancelled) return;

      if (photo && photo.width > 0 && photo.height > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, targetW, targetH);
        ctx.clip();

        // Transformasi rotasi & posisi
        const scaleFactor = targetW / 400;
        ctx.translate(targetW / 2 + pan.x * scaleFactor, targetH / 2 + pan.y * scaleFactor);
        ctx.rotate((rotation * Math.PI) / 180);

        const isRotated90 = rotation % 180 !== 0;
        const photoW = isRotated90 ? photo.height : photo.width;
        const photoH = isRotated90 ? photo.width : photo.height;

        const baseScale = Math.max(targetW / photoW, targetH / photoH);
        const currentScale = baseScale * zoom;

        const drawW = photo.width * currentScale;
        const drawH = photo.height * currentScale;

        ctx.drawImage(photo, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }

      // 3. Gambar Bingkai Twibbon (Layer Atas - otomatis bersihkan green screen jika ada)
      if (frameImg) {
        const cleanFrame = removeGreenScreenFromImage(frameImg);
        ctx.drawImage(cleanFrame, 0, 0, targetW, targetH);
      }
    }

    draw();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, frameUrl, userPhoto, zoom, rotation, pan, loadImage]);

  // Pointer drag event handlers untuk canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Upload foto sendiri
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setUserPhoto(ev.target?.result as string);
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      toast.success("Foto berhasil dimuat. Silakan atur posisi dan skala foto.");
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Unduh Twibbon HD dalam resolusi asli frame
  const handleDownload = async () => {
    if (!frameUrl) {
      toast.error("Bingkai twibbon belum tersedia.");
      return;
    }

    setIsDownloading(true);
    try {
      const frameImg = await loadImage(frameUrl);
      if (!frameImg) throw new Error("Gagal memuat berkas bingkai twibbon");

      const exportW = frameImg.naturalWidth || 1080;
      const exportH = frameImg.naturalHeight || 1080;

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = exportW;
      exportCanvas.height = exportH;

      const ctx = exportCanvas.getContext("2d");
      if (!ctx) throw new Error("Gagal menginisialisasi canvas ekspor");

      // Latar putih dasar
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportW, exportH);

      // 1. Gambar Foto Peserta
      const photoSrc = userPhoto || DEFAULT_CADRE_AVATAR;
      const photo = await loadImage(photoSrc);

      if (photo && photo.width > 0 && photo.height > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, exportW, exportH);
        ctx.clip();

        // Skala translate relatif terhadap canvas preview (400px base)
        const scaleFactor = exportW / 400;
        ctx.translate(exportW / 2 + pan.x * scaleFactor, exportH / 2 + pan.y * scaleFactor);
        ctx.rotate((rotation * Math.PI) / 180);

        const isRotated90 = rotation % 180 !== 0;
        const photoW = isRotated90 ? photo.height : photo.width;
        const photoH = isRotated90 ? photo.width : photo.height;

        const baseScale = Math.max(exportW / photoW, exportH / photoH);
        const currentScale = baseScale * zoom;

        const drawW = photo.width * currentScale;
        const drawH = photo.height * currentScale;

        ctx.drawImage(photo, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }

      // 2. Gambar Frame Twibbon (bersihkan green screen agar foto terlihat jernih)
      const cleanFrame = removeGreenScreenFromImage(frameImg);
      ctx.drawImage(cleanFrame, 0, 0, exportW, exportH);

      // Trigger download
      const link = document.createElement("a");
      const sanitizedName = (event?.name || "twibbon-pmii")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");
      const cadreName = (activeCadre?.name || activeCadre?.namaLengkap || "kader")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");

      link.download = `twibbon-${sanitizedName}-${cadreName}.png`;
      link.href = exportCanvas.toDataURL("image/png", 1.0);
      link.click();

      toast.success("Twibbon kualitas HD berhasil diunduh!");
    } catch (err) {
      console.error("Gagal mengunduh twibbon:", err);
      toast.error("Gagal memproses gambar twibbon.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyCaption = () => {
    if (!formattedCaption) return;
    navigator.clipboard.writeText(formattedCaption);
    setIsCopied(true);
    toast.success("Caption kampanye berhasil disalin!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 w-[calc(100%-2rem)] sm:max-w-xl md:max-w-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl p-0 overflow-hidden shadow-2xl"
      >
        {/* Header Modal */}
        <div className="px-5 sm:px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 rounded-xl bg-blue-600 text-white shadow-2xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                Twibbon Resmi Kegiatan
              </DialogTitle>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {event?.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 max-h-[75vh] custom-scrollbar">
          {!frameUrl ? (
            <div className="p-8 text-center space-y-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Bingkai Twibbon Belum Tersedia
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Panitia kegiatan belum mengunggah bingkai twibbon resmi untuk kegiatan ini. Silakan hubungi pengurus atau cek kembali nanti.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Sisi Kiri: Canvas Editor Interaktif */}
              <div className="md:col-span-6 space-y-3">
                <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xs bg-zinc-100 dark:bg-zinc-950 select-none group max-h-[460px] flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className="max-w-full max-h-[440px] object-contain cursor-grab active:cursor-grabbing touch-none"
                  />

                  {/* Petunjuk Geser di Layar */}
                  <div className="absolute top-2.5 left-2.5 pointer-events-none bg-black/50 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Move className="w-3 h-3" />
                    <span>Sentuh / Geser Foto</span>
                  </div>
                </div>

                {/* Kontrol Zoom & Rotasi */}
                <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs">
                  {/* Slider Zoom */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                      <span className="flex items-center gap-1">
                        <ZoomIn className="w-3 h-3 text-blue-600" />
                        Perbesar / Perkecil:
                      </span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">
                        {Math.round(zoom * 100)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setZoom((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(2))))}
                        className="w-6 h-6 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 cursor-pointer"
                        title="Perkecil"
                      >
                        <ZoomOut className="w-3 h-3" />
                      </button>

                      <input
                        type="range"
                        min="0.4"
                        max="3"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="flex-1 accent-blue-600 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                      />

                      <button
                        type="button"
                        onClick={() => setZoom((prev) => Math.min(3, Number((prev + 0.1).toFixed(2))))}
                        className="w-6 h-6 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 cursor-pointer"
                        title="Perbesar"
                      >
                        <ZoomIn className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Tombol Rotasi & Reset */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRotation((prev) => (prev + 90) % 360)}
                      className="flex-1 h-7 text-[11px] cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3 mr-1" />
                      Putar 90°
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setZoom(1);
                        setRotation(0);
                        setPan({ x: 0, y: 0 });
                      }}
                      className="flex-1 h-7 text-[11px] cursor-pointer"
                    >
                      Reset Posisi
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sisi Kanan: Pilihan Foto & Caption Kampanye */}
              <div className="md:col-span-6 space-y-4">
                {/* Pilihan Sumber Foto */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                    Pilih Foto Anda:
                  </span>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8.5 text-xs border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 text-zinc-700 dark:text-zinc-300 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Upload Baru</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const avatar = activeCadre?.avatar || activeCadre?.pasFoto || "";
                        if (avatar) {
                          setUserPhoto(avatar);
                          setZoom(1);
                          setRotation(0);
                          setPan({ x: 0, y: 0 });
                          toast.success("Foto profil akun diterapkan.");
                        } else {
                          toast.info("Anda belum memasang foto profil di akun PMII.");
                        }
                      }}
                      className="h-8.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Foto Profil Akun</span>
                    </Button>
                  </div>
                </div>

                {/* Caption Resmi Kegiatan */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5 text-blue-600" />
                      Teks Caption Media Sosial
                    </span>

                    {formattedCaption && (
                      <button
                        type="button"
                        onClick={handleCopyCaption}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin Teks</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 max-h-40 overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed select-text font-sans">
                    {formattedCaption || "Belum ada caption kampanye yang dicantumkan panitia."}
                  </div>
                </div>

                {/* Petunjuk Singkat */}
                <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-300 leading-relaxed">
                  💡 <strong>Cara Posting:</strong> Unduh gambar twibbon di bawah, lalu salin teks caption dan unggah ke WhatsApp Story / Instagram Feed Anda!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-5 sm:px-6 py-3.5 bg-zinc-50/80 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-400 hidden sm:block">
            Format: PNG Berkualitas Tinggi
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8.5 px-3.5 rounded-lg border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer font-medium"
            >
              Tutup
            </Button>

            {frameUrl && (
              <Button
                type="button"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="text-xs h-8.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer flex items-center gap-1.5 px-4 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloading ? "Memproses..." : "Unduh Twibbon HD"}</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
