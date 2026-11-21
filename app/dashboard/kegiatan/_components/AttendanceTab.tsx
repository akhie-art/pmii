"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import jsQR from "jsqr";
import {
  Camera,
  CameraOff,
  Check,
  QrCode,
  AlertCircle,
  Volume2,
  VolumeX,
  Copy,
  CheckCheck,
  Search,
  Users,
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { EventActivity, ParticipantRegistration } from "./types";

interface AttendanceTabProps {
  event: EventActivity;
  registrations: ParticipantRegistration[];
  onScanCode: (code: string, sessionName: string) => { success: boolean; message: string; participantName?: string };
}

export default function AttendanceTab({
  event,
  registrations,
  onScanCode
}: AttendanceTabProps) {
  const availableSessions = useMemo(() => {
    return event.sessions && event.sessions.length > 0
      ? event.sessions
      : ["Sesi Registrasi Awal", "Sesi Pembukaan", "Materi 1", "Sesi Penutupan"];
  }, [event.sessions]);

  const [selectedSession, setSelectedSession] = useState<string>(availableSessions[0] || "Sesi Registrasi Awal");
  const [isWebcamOn, setIsWebcamOn] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [manualScanCode, setManualScanCode] = useState("");
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [scanSuccessOverlay, setScanSuccessOverlay] = useState<{ name: string; code: string } | null>(null);
  const [scanErrorNotice, setScanErrorNotice] = useState<string | null>(null);
  const [copiedAttendance, setCopiedAttendance] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>("");

  useEffect(() => {
    if (!availableSessions.includes(selectedSession)) {
      setSelectedSession(availableSessions[0] || "Sesi Registrasi Awal");
    }
  }, [availableSessions, selectedSession]);

  const playBeep = useCallback(() => {
    if (isSoundMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1050, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }, [isSoundMuted]);

  const handleProcessCode = useCallback(
    (rawCode: string) => {
      if (!rawCode) return;

      let code = rawCode.trim();
      if (code.includes("code=")) {
        const match = code.match(/code=([^&]+)/);
        if (match && match[1]) {
          code = decodeURIComponent(match[1]);
        }
      }

      const result = onScanCode(code, selectedSession);
      if (result.success) {
        playBeep();
        setScanSuccessOverlay({
          name: result.participantName || "Peserta",
          code: code
        });
        setScanErrorNotice(null);
        setTimeout(() => setScanSuccessOverlay(null), 2500);
      } else {
        setScanErrorNotice(result.message);
        setTimeout(() => setScanErrorNotice(null), 3000);
      }
    },
    [onScanCode, playBeep, selectedSession]
  );

  // Webcam Lifecycle
  useEffect(() => {
    let active = true;

    const tick = () => {
      if (!active) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert"
            });

            if (code && code.data) {
              const now = Date.now();
              if (
                code.data !== lastScannedCodeRef.current ||
                now - lastScannedTimeRef.current > 3000
              ) {
                lastScannedCodeRef.current = code.data;
                lastScannedTimeRef.current = now;
                handleProcessCode(code.data);
              }
            }
          } catch (err) {}
        }
      }

      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    if (isWebcamOn) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        })
        .then((stream) => {
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          mediaStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          animFrameIdRef.current = requestAnimationFrame(tick);
        })
        .catch((err) => {
          console.error("Camera access failed", err);
          setScanErrorNotice("Kamera tidak dapat diakses.");
          setIsWebcamOn(false);
        });
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    }

    return () => {
      active = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isWebcamOn, handleProcessCode]);

  const attendees = useMemo(() => {
    return registrations.filter(
      (r) => r.status === "APPROVED" && r.attendance?.includes(selectedSession)
    );
  }, [registrations, selectedSession]);

  const totalApproved = useMemo(() => {
    return registrations.filter((r) => r.status === "APPROVED").length;
  }, [registrations]);

  const attendancePercent = totalApproved > 0 ? Math.round((attendees.length / totalApproved) * 100) : 0;

  const filteredAttendees = useMemo(() => {
    if (!attendeeSearch.trim()) return attendees;
    const query = attendeeSearch.toLowerCase();
    return attendees.filter(
      (r) =>
        r.cadreName.toLowerCase().includes(query) ||
        (r.registrationNumber || "").toLowerCase().includes(query)
    );
  }, [attendees, attendeeSearch]);

  const handleCopyAttendanceList = () => {
    if (attendees.length === 0) return;
    const textLines = [
      `Presensi Kegiatan: ${event.name}`,
      `Sesi: ${selectedSession}`,
      `Kehadiran: ${attendees.length} / ${totalApproved} (${attendancePercent}%)`,
      "----------------------------------------",
      ...attendees.map((r, i) => `${i + 1}. ${r.cadreName} - ${r.registrationNumber || "-"}`)
    ].join("\n");

    navigator.clipboard.writeText(textLines);
    setCopiedAttendance(true);
    setTimeout(() => setCopiedAttendance(false), 2500);
  };

  return (
    <div className="space-y-4 pt-1 text-left">
      <canvas ref={canvasRef} className="hidden" />

      {/* Sesi Switcher & Progres Ringkas */}
      <div className="p-3 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 w-full sm:max-w-md">
            <label className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Sesi Kegiatan:
            </label>
            <Select value={selectedSession} onValueChange={(val) => val && setSelectedSession(val)}>
              <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg w-full">
                <SelectValue placeholder="Pilih Sesi">{selectedSession}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg max-h-60">
                {availableSessions.map((sess) => (
                  <SelectItem key={sess} value={sess} className="text-xs">
                    {sess}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stat Pill */}
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60 dark:border-zinc-800/60 shrink-0">
            <div className="space-y-0.5 sm:text-right">
              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {attendees.length} <span className="text-zinc-400 font-normal">/ {totalApproved} Kader Hadir</span>
              </div>
              <div className="text-[10.5px] text-zinc-500 font-normal">
                Kehadiran Sesi: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{attendancePercent}%</span>
              </div>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${attendancePercent}%` }}
          />
        </div>
      </div>

      {/* Main Grid: Scanner (Kiri) & Daftar Hadir (Kanan) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Kolom Kiri: Kamera Scanner & Input Manual */}
        <div className="md:col-span-5 space-y-3.5">
          {/* Card Pemindai Kamera */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                Pemindai QR Kamera
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsSoundMuted(!isSoundMuted)}
                  className="w-6 h-6 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                  title={isSoundMuted ? "Aktifkan suara bip" : "Matikan suara bip"}
                >
                  {isSoundMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 text-blue-600" />}
                </button>

                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    isWebcamOn
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {isWebcamOn && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                  <span>{isWebcamOn ? "Kamera Aktif" : "Kamera Mati"}</span>
                </span>
              </div>
            </div>

            {/* Viewfinder Area */}
            <div className="relative aspect-video rounded-lg bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
              {isWebcamOn ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 h-0.5 bg-blue-500 top-0 animate-scanline pointer-events-none" />
                  <div className="absolute w-36 h-36 border-2 border-white/70 border-dashed rounded-lg pointer-events-none" />
                </>
              ) : (
                <div className="text-center p-5 space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                    <CameraOff className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-zinc-300 font-medium block">Kamera Sedang Nonaktif</span>
                  <p className="text-[10.5px] text-zinc-500 max-w-[200px] mx-auto font-normal">
                    Klik tombol di bawah untuk memindai QR code ID Card kader secara instan.
                  </p>
                </div>
              )}

              {/* Feedback Berhasil Scan */}
              {scanSuccessOverlay && (
                <div className="absolute inset-0 bg-emerald-600/95 flex flex-col items-center justify-center p-3 text-center z-10 text-white animate-fadeIn">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mb-1">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Presensi Berhasil</h4>
                  <p className="text-xs font-semibold mt-0.5">{scanSuccessOverlay.name}</p>
                  <span className="text-[10px] text-emerald-100 font-mono mt-0.5">{scanSuccessOverlay.code}</span>
                </div>
              )}

              {/* Feedback Gagal Scan */}
              {scanErrorNotice && (
                <div className="absolute bottom-2 inset-x-2 bg-rose-600 text-white text-[10.5px] font-medium py-1.5 px-2.5 rounded-lg shadow z-10 flex items-center gap-1.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{scanErrorNotice}</span>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={() => setIsWebcamOn(!isWebcamOn)}
              className={`w-full text-xs font-medium h-8 rounded-lg border-none flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                isWebcamOn
                  ? "bg-zinc-800 hover:bg-zinc-900 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isWebcamOn ? (
                <>
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Matikan Kamera</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Nyalakan Kamera Scanner</span>
                </>
              )}
            </Button>
          </div>

          {/* Card Input Manual */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-2">
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
              Ketik Kode / Nomor Pendaftaran Manual:
            </label>
            <div className="flex gap-1.5">
              <Input
                type="text"
                value={manualScanCode}
                onChange={(e) => setManualScanCode(e.target.value)}
                placeholder="Contoh: MAP-120392..."
                className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 uppercase"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleProcessCode(manualScanCode);
                    setManualScanCode("");
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => {
                  handleProcessCode(manualScanCode);
                  setManualScanCode("");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8.5 px-3.5 rounded-lg border-none cursor-pointer shrink-0"
              >
                Absenkan
              </Button>
            </div>
            <p className="text-[10px] text-zinc-400 font-normal">
              Mendukung barcode scanner USB eksternal atau input manual via keyboard.
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Log Kehadiran Sesi Realtime */}
        <div className="md:col-span-7 space-y-2.5">
          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
            {/* Header List */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                  Daftar Hadir ({attendees.length})
                </span>
                <span className="text-[11px] text-zinc-400 font-normal truncate max-w-[180px]">
                  • {selectedSession}
                </span>
              </div>

              {attendees.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAttendanceList}
                  className="h-7 text-[11px] px-2.5 rounded-lg border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer self-start sm:self-auto font-medium"
                >
                  {copiedAttendance ? (
                    <>
                      <CheckCheck className="w-3 h-3 mr-1 text-emerald-600" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1 text-zinc-400" />
                      <span>Salin Daftar</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Pencarian Kader dalam Daftar Hadir */}
            {attendees.length > 0 && (
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Cari nama atau nomor kader yang sudah hadir..."
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                  className="pl-7.5 h-7.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
                />
              </div>
            )}

            {/* List Attendees */}
            <div className="max-h-[340px] overflow-y-auto rounded-lg border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
              {attendees.length === 0 ? (
                <div className="py-12 text-center p-4 space-y-1.5">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Belum ada presensi pada sesi ini
                  </p>
                  <p className="text-[11px] text-zinc-400 font-normal max-w-xs mx-auto">
                    Arahkan kamera ke QR code kader atau ketik kode pendaftaran di kolom sebelah kiri.
                  </p>
                </div>
              ) : filteredAttendees.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  Tidak ada kader hadir yang cocok dengan &ldquo;{attendeeSearch}&rdquo;.
                </div>
              ) : (
                filteredAttendees.map((r, idx) => (
                  <div
                    key={r.id}
                    className="p-2.5 px-3 flex items-center justify-between gap-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-mono flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100 truncate block">
                          {r.cadreName}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 truncate block">
                          {r.registrationNumber || "-"}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Hadir</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
