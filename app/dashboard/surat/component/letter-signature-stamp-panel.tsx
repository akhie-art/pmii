"use client";

import React, { useRef, useState } from "react";
import {
  Stamp,
  PenTool,
  Trash2,
  Bookmark,
  Wand2,
  Loader2,
  RotateCw,
  Move,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  validateOverlayImageFile,
  processUploadedOverlayImage,
  removeWhiteBackgroundFromDataUrl,
  buildDefaultOverlayPlacement,
  type LetterImageOverlay,
  type LetterImageOverlayKind,
  type SavedOverlayAsset,
} from "./letter-overlay-helper";

let overlaySeqCounter = 0;

function createOverlayId(): string {
  overlaySeqCounter += 1;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `ov-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `ov-${Date.now()}-${overlaySeqCounter}`;
}

interface LetterSignatureStampPanelProps {
  overlays: LetterImageOverlay[];
  selectedOverlayId: string | null;
  onSelectOverlay: (id: string | null) => void;
  onAddOverlay: (overlay: LetterImageOverlay, rawDataUrl?: string) => void;
  onUpdateOverlay: (id: string, patch: Partial<LetterImageOverlay>) => void;
  onRemoveOverlay: (id: string) => void;
  rawImageMap: Record<string, string>;
  savedAssets: SavedOverlayAsset[];
  onSaveAssetToLibrary: (overlay: LetterImageOverlay) => void;
  onDeleteSavedAsset: (assetId: string) => void;
  pageCount: number;
  disabled?: boolean;
}

export function LetterSignatureStampPanel({
  overlays,
  selectedOverlayId,
  onSelectOverlay,
  onAddOverlay,
  onUpdateOverlay,
  onRemoveOverlay,
  rawImageMap,
  savedAssets,
  onSaveAssetToLibrary,
  onDeleteSavedAsset,
  pageCount,
  disabled = false,
}: LetterSignatureStampPanelProps) {
  const sigInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const [autoRemoveWhiteBg, setAutoRemoveWhiteBg] = useState(true);
  const [uploadingKind, setUploadingKind] = useState<LetterImageOverlayKind | null>(null);
  const [processingBgId, setProcessingBgId] = useState<string | null>(null);

  const handleFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: LetterImageOverlayKind
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationErr = validateOverlayImageFile(file);
    if (validationErr) {
      toast.error(validationErr);
      return;
    }

    setUploadingKind(kind);
    try {
      const { dataUrl, rawDataUrl, aspectRatio } = await processUploadedOverlayImage(file, {
        removeWhiteBg: autoRemoveWhiteBg,
      });

      const placement = buildDefaultOverlayPlacement(kind, overlays);
      const countOfKind =
        overlays.filter((o) => (kind === "stamp" ? o.kind === "stamp" : o.kind !== "stamp"))
          .length + 1;
      const defaultLabel =
        kind === "stamp"
          ? countOfKind === 1
            ? "Stempel Organisasi"
            : `Stempel ${countOfKind}`
          : countOfKind === 1
          ? "Tanda Tangan 1"
          : `Tanda Tangan ${countOfKind}`;

      const newOverlay: LetterImageOverlay = {
        id: createOverlayId(),
        kind,
        label: defaultLabel,
        dataUrl,
        aspectRatio,
        transparentBg: autoRemoveWhiteBg,
        ...placement,
      };

      onAddOverlay(newOverlay, rawDataUrl);
      toast.success(
        `${defaultLabel} ditambahkan! Geser & atur ukurannya langsung di atas lembar surat.`
      );
    } catch (err: any) {
      console.error("Gagal memproses gambar TTD/stempel:", err);
      toast.error(err?.message || "Gagal memproses berkas gambar.");
    } finally {
      setUploadingKind(null);
    }
  };

  const handleApplySavedAsset = (asset: SavedOverlayAsset) => {
    const placement = buildDefaultOverlayPlacement(asset.kind, overlays);
    const newOverlay: LetterImageOverlay = {
      id: createOverlayId(),
      kind: asset.kind,
      label: asset.label,
      dataUrl: asset.dataUrl,
      aspectRatio: asset.aspectRatio || (asset.kind === "stamp" ? 1 : 2.2),
      transparentBg: asset.transparentBg,
      ...placement,
    };
    onAddOverlay(newOverlay, asset.dataUrl);
    toast.success(`"${asset.label}" ditempelkan ke surat.`);
  };

  const handleToggleTransparentBg = async (ov: LetterImageOverlay) => {
    if (processingBgId === ov.id) return;
    setProcessingBgId(ov.id);
    try {
      if (ov.transparentBg && rawImageMap[ov.id]) {
        onUpdateOverlay(ov.id, {
          dataUrl: rawImageMap[ov.id],
          transparentBg: false,
        });
        toast.success("Latar asli gambar dipulihkan.");
      } else {
        const source = rawImageMap[ov.id] || ov.dataUrl;
        const { dataUrl, aspectRatio } = await removeWhiteBackgroundFromDataUrl(source);
        onUpdateOverlay(ov.id, {
          dataUrl,
          aspectRatio,
          transparentBg: true,
        });
        toast.success("Latar putih berhasil dihapus (transparan).");
      }
    } catch {
      toast.error("Gagal memproses transparansi latar gambar.");
    } finally {
      setProcessingBgId(null);
    }
  };

  const selectedOverlay = overlays.find((o) => o.id === selectedOverlayId) || null;

  return (
    <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3 shadow-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Stamp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            Tanda Tangan &amp; Stempel
          </span>
        </div>
        {overlays.length > 0 && (
          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60 text-[10px] font-bold px-1.5 py-0 shadow-none">
            {overlays.length} Terpasang
          </Badge>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={sigInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        onChange={(e) => void handleFileSelected(e, "signature")}
        className="hidden"
      />
      <input
        ref={stampInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        onChange={(e) => void handleFileSelected(e, "stamp")}
        className="hidden"
      />

      {/* Upload Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || uploadingKind !== null}
          onClick={() => sigInputRef.current?.click()}
          className="h-9 text-[11px] font-semibold rounded-lg border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-zinc-700 dark:text-zinc-200 cursor-pointer flex items-center justify-center gap-1.5 px-2"
        >
          {uploadingKind === "signature" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          ) : (
            <PenTool className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          )}
          <span className="truncate">Upload TTD</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={disabled || uploadingKind !== null}
          onClick={() => stampInputRef.current?.click()}
          className="h-9 text-[11px] font-semibold rounded-lg border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-zinc-700 dark:text-zinc-200 cursor-pointer flex items-center justify-center gap-1.5 px-2"
        >
          {uploadingKind === "stamp" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
          ) : (
            <Stamp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          )}
          <span className="truncate">Upload Stempel</span>
        </Button>
      </div>

      {/* Auto Remove White Background Checkbox */}
      <label className="flex items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={autoRemoveWhiteBg}
          onChange={(e) => setAutoRemoveWhiteBg(e.target.checked)}
          className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <span>Hapus latar belakang putih otomatis (PNG transparan)</span>
      </label>

      {/* Saved Tenant Library (Quick Reuse) */}
      {savedAssets.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Koleksi Tersimpan ({savedAssets.length})
            </span>
            <span className="text-[10px] text-zinc-400">Klik untuk tempel</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {savedAssets.map((asset) => (
              <div
                key={asset.id}
                className="group relative inline-flex items-center gap-1.5 pl-1.5 pr-6 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 hover:bg-blue-50/60 dark:bg-zinc-950 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-800 transition-colors max-w-[150px]"
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleApplySavedAsset(asset)}
                  className="inline-flex items-center gap-1.5 min-w-0 bg-transparent border-none p-0 cursor-pointer text-left"
                  title={`Tempelkan ${asset.label} ke surat`}
                >
                  <span
                    className="w-6 h-5 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0"
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, #e4e4e7 25%, transparent 25%), linear-gradient(-45deg, #e4e4e7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e4e4e7 75%), linear-gradient(-45deg, transparent 75%, #e4e4e7 75%)",
                      backgroundSize: "8px 8px",
                      backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.dataUrl}
                      alt={asset.label}
                      className="max-w-full max-h-full object-contain"
                    />
                  </span>
                  <span className="text-[10.5px] font-medium text-zinc-700 dark:text-zinc-200 truncate">
                    {asset.label}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSavedAsset(asset.id)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 cursor-pointer bg-transparent border-none p-0"
                  title="Hapus dari koleksi tersimpan"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Overlays on This Letter */}
      {overlays.length > 0 ? (
        <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span className="font-semibold uppercase tracking-wider">Terpasang di Surat</span>
            <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
              <Move className="w-3 h-3" />
              Geser langsung di kanvas
            </span>
          </div>

          <div className="space-y-1.5">
            {overlays.map((ov) => {
              const isSelected = ov.id === selectedOverlayId;
              const isAlreadySaved = savedAssets.some((a) => a.dataUrl === ov.dataUrl);

              return (
                <div
                  key={ov.id}
                  onClick={() => onSelectOverlay(ov.id)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "border-blue-400 dark:border-blue-600 bg-blue-50/40 dark:bg-blue-950/25"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/50 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {/* Transparent Checkerboard Thumbnail */}
                    <div
                      className="w-10 h-8 rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 bg-white"
                      style={{
                        backgroundImage:
                          "linear-gradient(45deg, #e4e4e7 25%, transparent 25%), linear-gradient(-45deg, #e4e4e7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e4e4e7 75%), linear-gradient(-45deg, transparent 75%, #e4e4e7 75%)",
                        backgroundSize: "8px 8px",
                        backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ov.dataUrl}
                        alt={ov.label}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>

                    {/* Editable Label */}
                    <div className="flex-1 min-w-0">
                      <Input
                        value={ov.label}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateOverlay(ov.id, { label: e.target.value })}
                        className="h-6.5 text-[11px] font-semibold px-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-md"
                      />
                      <div className="flex items-center gap-1.5 mt-0.5 text-[9.5px] text-zinc-400">
                        <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                          {ov.kind === "stamp" ? "Stempel" : "TTD"}
                        </span>
                        <span>•</span>
                        <span className="tabular-nums">Lebar {Math.round(ov.widthPct)}%</span>
                        {ov.transparentBg && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              Transparan
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Row Quick Actions */}
                    <div
                      className="flex items-center gap-0.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={processingBgId === ov.id}
                        onClick={() => void handleToggleTransparentBg(ov)}
                        className={`w-6.5 h-6.5 rounded-md flex items-center justify-center transition-colors cursor-pointer bg-transparent border-none ${
                          ov.transparentBg
                            ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                            : "text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                        }`}
                        title={
                          ov.transparentBg && rawImageMap[ov.id]
                            ? "Pulihkan latar belakang asli"
                            : "Hapus latar belakang putih (jadi transparan)"
                        }
                      >
                        {processingBgId === ov.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Wand2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onSaveAssetToLibrary(ov)}
                        className={`w-6.5 h-6.5 rounded-md flex items-center justify-center transition-colors cursor-pointer bg-transparent border-none ${
                          isAlreadySaved
                            ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                            : "text-zinc-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                        }`}
                        title={
                          isAlreadySaved
                            ? "Sudah tersimpan di koleksi"
                            : "Simpan ke koleksi agar bisa dipakai ulang di surat berikutnya"
                        }
                      >
                        {isAlreadySaved ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveOverlay(ov.id)}
                        className="w-6.5 h-6.5 rounded-md flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer bg-transparent border-none"
                        title="Hapus dari surat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fine Controls for Selected Overlay */}
          {selectedOverlay && (
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="font-bold text-zinc-700 dark:text-zinc-200 truncate">
                  Pengaturan: {selectedOverlay.label}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectOverlay(null)}
                  className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-transparent border-none p-0 cursor-pointer"
                >
                  Selesai
                </button>
              </div>

              {/* Width slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span>Ukuran</span>
                  <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                    {Math.round(selectedOverlay.widthPct)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={55}
                  step={1}
                  value={selectedOverlay.widthPct}
                  onChange={(e) =>
                    onUpdateOverlay(selectedOverlay.id, { widthPct: Number(e.target.value) })
                  }
                  className="w-full h-1.5 accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Rotation & Opacity */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <RotateCw className="w-2.5 h-2.5" />
                      Rotasi
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateOverlay(selectedOverlay.id, { rotation: 0 })}
                      className="font-mono font-semibold text-zinc-700 dark:text-zinc-300 hover:text-blue-600 bg-transparent border-none p-0 cursor-pointer"
                      title="Klik untuk reset ke 0°"
                    >
                      {Math.round(selectedOverlay.rotation)}°
                    </button>
                  </div>
                  <input
                    type="range"
                    min={-30}
                    max={30}
                    step={1}
                    value={selectedOverlay.rotation}
                    onChange={(e) =>
                      onUpdateOverlay(selectedOverlay.id, { rotation: Number(e.target.value) })
                    }
                    className="w-full h-1.5 accent-blue-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Opasitas</span>
                    <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                      {Math.round(selectedOverlay.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={35}
                    max={100}
                    step={5}
                    value={Math.round(selectedOverlay.opacity * 100)}
                    onChange={(e) =>
                      onUpdateOverlay(selectedOverlay.id, {
                        opacity: Number(e.target.value) / 100,
                      })
                    }
                    className="w-full h-1.5 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Target Page Selector (only if > 1 page) */}
              {pageCount > 1 && (
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-[10px] text-zinc-500">Halaman Target:</span>
                  <select
                    value={String(selectedOverlay.pageIndex)}
                    onChange={(e) =>
                      onUpdateOverlay(selectedOverlay.id, { pageIndex: Number(e.target.value) })
                    }
                    className="h-6.5 px-2 rounded-md text-[10.5px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    <option value="-1">Halaman Terakhir (Hal. {pageCount})</option>
                    {Array.from({ length: pageCount }, (_, i) => (
                      <option key={i} value={String(i)}>
                        Halaman {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-[10.5px] text-zinc-400 leading-relaxed">
          Unggah gambar tanda tangan pimpinan atau stempel organisasi (PNG/JPG, maks. 5 MB). Gambar
          dapat digeser &amp; diubah ukurannya langsung di atas surat dan otomatis ikut tercetak
          pada PDF maupun unduhan Word.
        </p>
      )}
    </div>
  );
}
