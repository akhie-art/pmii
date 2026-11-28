"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Copy, Trash2, RotateCcw, RotateCw } from "lucide-react";
import type { LetterImageOverlay } from "./letter-overlay-helper";

interface PageBox {
  index: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

interface LetterOverlayCanvasProps {
  stageRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  overlays: LetterImageOverlay[];
  selectedOverlayId: string | null;
  onSelectOverlay: (id: string | null) => void;
  onUpdateOverlay: (id: string, patch: Partial<LetterImageOverlay>) => void;
  onDuplicateOverlay: (id: string) => void;
  onRemoveOverlay: (id: string) => void;
  onPageCountChange?: (count: number) => void;
  /** Increment setiap kali konten DOCX selesai di-render ulang untuk mengukur ulang bounding box halaman */
  renderVersion: number;
}

export function LetterOverlayCanvas({
  stageRef,
  canvasRef,
  overlays,
  selectedOverlayId,
  onSelectOverlay,
  onUpdateOverlay,
  onDuplicateOverlay,
  onRemoveOverlay,
  onPageCountChange,
  renderVersion,
}: LetterOverlayCanvasProps) {
  const [pageBoxes, setPageBoxes] = useState<PageBox[]>([]);
  const interactionRef = useRef<{
    type: "drag" | "resize";
    id: string;
    pageWidth: number;
    pageHeight: number;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    origWidthPct: number;
  } | null>(null);

  const measurePages = useCallback(() => {
    const stageEl = stageRef.current;
    const canvasEl = canvasRef.current;
    if (!stageEl || !canvasEl) return;

    const stageRect = stageEl.getBoundingClientRect();
    const sections = Array.from(canvasEl.querySelectorAll<HTMLElement>("section.docx"));

    let targets: HTMLElement[] = sections;
    if (targets.length === 0) {
      const style = window.getComputedStyle(canvasEl);
      if (style.display !== "none" && canvasEl.offsetWidth > 0 && canvasEl.offsetHeight > 0) {
        targets = [canvasEl];
      }
    }

    const boxes: PageBox[] = targets
      .map((el, index) => {
        const rect = el.getBoundingClientRect();
        return {
          index,
          left: rect.left - stageRect.left,
          top: rect.top - stageRect.top,
          width: rect.width,
          height: rect.height,
        };
      })
      .filter((b) => b.width > 40 && b.height > 40);

    setPageBoxes(boxes);
    onPageCountChange?.(boxes.length || 1);
  }, [stageRef, canvasRef, onPageCountChange]);

  useEffect(() => {
    const frameId = requestAnimationFrame(measurePages);
    const timer = setTimeout(measurePages, 180);

    const stageEl = stageRef.current;
    const canvasEl = canvasRef.current;

    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => measurePages()) : null;
    if (ro && stageEl) ro.observe(stageEl);
    if (ro && canvasEl) ro.observe(canvasEl);

    const mo =
      typeof MutationObserver !== "undefined" && canvasEl
        ? new MutationObserver(() => {
            requestAnimationFrame(measurePages);
          })
        : null;
    if (mo && canvasEl) {
      mo.observe(canvasEl, { childList: true, subtree: false });
    }

    const handleScrollOrResize = () => measurePages();
    window.addEventListener("resize", handleScrollOrResize);
    canvasEl?.addEventListener("scroll", handleScrollOrResize, { passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timer);
      ro?.disconnect();
      mo?.disconnect();
      window.removeEventListener("resize", handleScrollOrResize);
      canvasEl?.removeEventListener("scroll", handleScrollOrResize);
    };
  }, [measurePages, stageRef, canvasRef, renderVersion, overlays.length]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const active = interactionRef.current;
      if (!active || active.pageWidth <= 0 || active.pageHeight <= 0) return;

      const dx = e.clientX - active.startClientX;
      const dy = e.clientY - active.startClientY;

      if (active.type === "drag") {
        const nextX = Math.min(95, Math.max(0, active.origX + (dx / active.pageWidth) * 100));
        const nextY = Math.min(95, Math.max(0, active.origY + (dy / active.pageHeight) * 100));
        onUpdateOverlay(active.id, {
          xPct: Math.round(nextX * 100) / 100,
          yPct: Math.round(nextY * 100) / 100,
        });
      } else {
        const nextWidth = Math.min(
          65,
          Math.max(5, active.origWidthPct + (dx / active.pageWidth) * 100)
        );
        onUpdateOverlay(active.id, {
          widthPct: Math.round(nextWidth * 100) / 100,
        });
      }
    };

    const handlePointerUp = () => {
      interactionRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [onUpdateOverlay]);

  if (overlays.length === 0 || pageBoxes.length === 0) return null;

  const startDrag = (
    e: React.PointerEvent,
    ov: LetterImageOverlay,
    box: PageBox
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectOverlay(ov.id);
    interactionRef.current = {
      type: "drag",
      id: ov.id,
      pageWidth: box.width,
      pageHeight: box.height,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: ov.xPct,
      origY: ov.yPct,
      origWidthPct: ov.widthPct,
    };
  };

  const startResize = (
    e: React.PointerEvent,
    ov: LetterImageOverlay,
    box: PageBox
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectOverlay(ov.id);
    interactionRef.current = {
      type: "resize",
      id: ov.id,
      pageWidth: box.width,
      pageHeight: box.height,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: ov.xPct,
      origY: ov.yPct,
      origWidthPct: ov.widthPct,
    };
  };

  return (
    <>
      {pageBoxes.map((box) => {
        const pageOverlays = overlays.filter((ov) => {
          const targetIdx =
            ov.pageIndex < 0
              ? pageBoxes.length - 1
              : Math.min(pageBoxes.length - 1, Math.max(0, ov.pageIndex));
          return targetIdx === box.index;
        });

        if (pageOverlays.length === 0) return null;

        return (
          <div
            key={`overlay-page-${box.index}`}
            className="pointer-events-none absolute overflow-visible z-30"
            style={{
              left: `${box.left}px`,
              top: `${box.top}px`,
              width: `${box.width}px`,
              height: `${box.height}px`,
            }}
          >
            {pageOverlays.map((ov) => {
              const isSelected = ov.id === selectedOverlayId;
              const zIndex = isSelected ? 50 : ov.kind === "stamp" ? 25 : 20;
              const toolbarNearTop = ov.yPct < 7;

              return (
                <div
                  key={ov.id}
                  onPointerDown={(e) => startDrag(e, ov, box)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`pointer-events-auto absolute select-none touch-none cursor-move group transition-shadow ${
                    isSelected
                      ? "ring-1.5 ring-blue-500 border border-dashed border-blue-500 rounded-xs shadow-sm"
                      : "hover:ring-1 hover:ring-blue-400/80 hover:border hover:border-dashed hover:border-blue-400/80 rounded-xs"
                  }`}
                  style={{
                    left: `${ov.xPct}%`,
                    top: `${ov.yPct}%`,
                    width: `${ov.widthPct}%`,
                    transform: ov.rotation !== 0 ? `rotate(${ov.rotation}deg)` : undefined,
                    transformOrigin: "center center",
                    zIndex,
                  }}
                  title="Geser untuk memindahkan posisi • Tarik sudut kanan bawah untuk mengubah ukuran"
                >
                  {/* Floating Mini Toolbar saat terpilih */}
                  {isSelected && (
                    <div
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        transform:
                          ov.rotation !== 0
                            ? `translateX(-50%) rotate(${-ov.rotation}deg)`
                            : "translateX(-50%)",
                      }}
                      className={`absolute ${
                        toolbarNearTop ? "-bottom-9" : "-top-9"
                      } left-1/2 flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-zinc-900 text-white shadow-xl border border-zinc-700 whitespace-nowrap z-50 cursor-default`}
                    >
                      <span className="text-[10px] font-semibold px-1 max-w-[100px] truncate select-none">
                        {ov.label}
                      </span>
                      <span className="w-px h-3.5 bg-zinc-700 mx-0.5" />
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateOverlay(ov.id, {
                            rotation: Math.max(-45, (ov.rotation || 0) - 5),
                          });
                        }}
                        className="w-6 h-6 rounded hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center cursor-pointer bg-transparent border-none text-zinc-200"
                        title="Putar kiri 5°"
                        aria-label="Putar kiri 5 derajat"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateOverlay(ov.id, {
                            rotation: Math.min(45, (ov.rotation || 0) + 5),
                          });
                        }}
                        className="w-6 h-6 rounded hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center cursor-pointer bg-transparent border-none text-zinc-200"
                        title="Putar kanan 5°"
                        aria-label="Putar kanan 5 derajat"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateOverlay(ov.id);
                        }}
                        className="w-6 h-6 rounded hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center cursor-pointer bg-transparent border-none text-zinc-200"
                        title="Duplikat"
                        aria-label="Duplikat gambar"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveOverlay(ov.id);
                        }}
                        className="w-6 h-6 rounded hover:bg-rose-600 active:bg-rose-700 flex items-center justify-center cursor-pointer bg-transparent border-none text-rose-300 hover:text-white"
                        title="Hapus"
                        aria-label="Hapus gambar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ov.dataUrl}
                    alt={ov.label}
                    draggable={false}
                    className="block w-full h-auto pointer-events-none select-none"
                    style={{ opacity: ov.opacity }}
                  />

                  {/* Bottom-Right Resize Handle */}
                  {isSelected && (
                    <div
                      onPointerDown={(e) => startResize(e, ov, box)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 rounded-xs bg-blue-600 border-2 border-white shadow-md cursor-nwse-resize z-50"
                      title="Tarik untuk memperbesar/memperkecil"
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
