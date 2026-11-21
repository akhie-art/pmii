"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Download,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Upload,
  Move,
  AlertCircle,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { removeGreenScreenFromImage } from "@/lib/chromaKey";
import type { EventActivity } from "@/lib/services/types";

export const DEFAULT_CADRE_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#0A2A5C"/>
  <circle cx="200" cy="140" r="65" fill="#F7C738"/>
  <path d="M70 360 C70 250, 130 225, 200 225 C270 225, 330 250, 330 360 Z" fill="#F7C738"/>
  <text x="200" y="385" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">UNGGAH FOTO ANDA</text>
</svg>
`);

function TwibbonPublicInner() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event") || searchParams.get("id");

  const [selectedEvent, setSelectedEvent] = useState<EventActivity | null>(null);
  const [loading, setLoading] = useState(true);

  // Canvas editor state
  const [userPhoto, setUserPhoto] = useState<string>("");
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isDownloading, setIsDownloading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Muat data kegiatan
  useEffect(() => {
    async function loadData() {
      try {
        const evList = await db.getEvents();
        if (eventId) {
          const matched = evList.find(
            (e) => String(e.id) === String(eventId) || e.name.toLowerCase() === eventId.toLowerCase()
          );
          if (matched) {
            setSelectedEvent(matched);
          } else if (evList.length > 0) {
            setSelectedEvent(evList[0]);
          }
        } else if (evList.length > 0) {
          const withTwibbon = evList.find((e) => e.twibbon?.isActive && e.twibbon?.frameUrl);
          setSelectedEvent(withTwibbon || evList[0]);
        }
      } catch (err) {
        console.error("Gagal memuat kegiatan:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const frameUrl = selectedEvent?.twibbon?.frameUrl || "";

  // Helper async load image
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

  // Redraw canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    let isCancelled = false;

    async function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const frameImg = frameUrl ? await loadImage(frameUrl) : null;
      if (isCancelled) return;

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

      // Gambar foto
      const photoSrc = userPhoto || DEFAULT_CADRE_AVATAR;
      const photo = await loadImage(photoSrc);
      if (isCancelled) return;

      if (photo && photo.width > 0 && photo.height > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, targetW, targetH);
        ctx.clip();

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

      // Gambar frame twibbon (bersihkan green screen)
      if (frameImg) {
        const cleanFrame = removeGreenScreenFromImage(frameImg);
        ctx.drawImage(cleanFrame, 0, 0, targetW, targetH);
      }
    }

    draw();

    return () => {
      isCancelled = true;
    };
  }, [frameUrl, userPhoto, zoom, rotation, pan, loadImage]);

  // Pointer drag
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!userPhoto) {
      fileInputRef.current?.click();
      return;
    }
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

  // Wheel zoom on desktop
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoom((prev) => {
      const step = e.deltaY < 0 ? 0.05 : -0.05;
      return Math.min(3, Math.max(0.4, Number((prev + step).toFixed(2))));
    });
  };

  // Upload foto sendiri
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 12MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setUserPhoto(ev.target?.result as string);
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      toast.success("Foto berhasil dimuat. Silakan sesuaikan posisi.");
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Unduh Twibbon HD
  const handleDownload = async () => {
    if (!frameUrl) {
      toast.error("Bingkai twibbon belum tersedia.");
      return;
    }

    setIsDownloading(true);
    try {
      const frameImg = await loadImage(frameUrl);
      if (!frameImg) throw new Error("Gagal memuat bingkai twibbon");

      const exportW = frameImg.naturalWidth || 1080;
      const exportH = frameImg.naturalHeight || 1080;

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = exportW;
      exportCanvas.height = exportH;

      const ctx = exportCanvas.getContext("2d");
      if (!ctx) throw new Error("Gagal menginisialisasi canvas ekspor");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportW, exportH);

      const photoSrc = userPhoto || DEFAULT_CADRE_AVATAR;
      const photo = await loadImage(photoSrc);

      if (photo && photo.width > 0 && photo.height > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, exportW, exportH);
        ctx.clip();

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

      // Gambar Frame Twibbon (bersihkan green screen)
      const cleanFrame = removeGreenScreenFromImage(frameImg);
      ctx.drawImage(cleanFrame, 0, 0, exportW, exportH);

      const link = document.createElement("a");
      const sanitizedName = (selectedEvent?.name || "twibbon-pmii")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");

      link.download = `twibbon-${sanitizedName}.png`;
      link.href = exportCanvas.toDataURL("image/png", 1.0);
      link.click();

      toast.success("Twibbon kualitas HD berhasil diunduh!");
    } catch (err) {
      console.error("Gagal mengunduh twibbon:", err);
      toast.error("Gagal memproses berkas gambar twibbon.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 font-medium">Memuat Twibbon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Main Centered Workspace */}
      <main className="w-full max-w-md mx-auto space-y-4">
        {selectedEvent ? (
          <div className="space-y-3.5">
            {/* Canvas Card */}
            <div className="relative rounded-2xl bg-white dark:bg-zinc-900 p-2 sm:p-3 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              {/* Canvas Frame */}
              <div
                onClick={() => {
                  if (!userPhoto) fileInputRef.current?.click();
                }}
                className="relative w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center select-none group cursor-pointer"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)",
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px"
                }}
              >
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onWheel={handleWheel}
                  className="max-w-full max-h-[460px] object-contain cursor-grab active:cursor-grabbing touch-none block"
                />

                {/* Overlay klik unggah jika belum ada foto */}
                {!userPhoto && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 p-4 text-white text-center transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-bold tracking-tight">Klik untuk Unggah Foto Anda</span>
                    <span className="text-[10.5px] text-white/80 max-w-xs">Pilih foto kader dari galeri ponsel atau kamera</span>
                  </div>
                )}

                {/* Badge Geser Foto jika foto sudah diunggah */}
                {userPhoto && (
                  <div className="absolute top-2.5 left-2.5 pointer-events-none bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <Move className="w-3 h-3 text-amber-300" />
                    <span>Geser foto untuk memposisikan</span>
                  </div>
                )}
              </div>

              {/* Kontrol Minimalis: Zoom, Putar, Reset, Ganti Foto */}
              <div className="pt-3 px-1 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(2))))}
                    className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Perkecil"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="range"
                    min="0.4"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-blue-600 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                    title={`Skala: ${Math.round(zoom * 100)}%`}
                  />

                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.min(3, Number((prev + 0.1).toFixed(2))))}
                    className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Perbesar"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[42px] text-right font-mono text-[11px] font-bold text-zinc-500 shrink-0">
                    {Math.round(zoom * 100)}%
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRotation((prev) => (prev + 90) % 360)}
                      className="h-7 text-[11px] px-2.5 rounded-lg cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3 mr-1 text-blue-600" />
                      Putar 90°
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setZoom(1);
                        setRotation(0);
                        setPan({ x: 0, y: 0 });
                      }}
                      className="h-7 text-[11px] px-2.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Reset
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-[11px] px-2.5 rounded-lg text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3 mr-1" />
                    {userPhoto ? "Ganti Foto" : "Pilih Foto"}
                  </Button>
                </div>
              </div>

              {/* Tombol Unduh Utama di dalam Card */}
              <div className="pt-2 px-1">
                <Button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading || !frameUrl}
                  className="w-full h-11 sm:h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm tracking-tight shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloading ? "Memproses Twibbon HD..." : "Unduh Twibbon HD (PNG)"}</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold">Kegiatan Tidak Ditemukan</h3>
            <p className="text-xs text-zinc-500">Tautan twibbon tidak valid atau kegiatan belum terdaftar.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export function TwibbonPublicContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
          <div className="text-xs text-zinc-500 font-semibold">Memuat Kampanye Twibbon...</div>
        </div>
      }
    >
      <TwibbonPublicInner />
    </Suspense>
  );
}
