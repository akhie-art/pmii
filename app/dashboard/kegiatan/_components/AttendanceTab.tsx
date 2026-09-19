"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { EventActivity, ParticipantRegistration } from "./types";
import { DEFAULT_EVENT_SESSIONS } from "./types";

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
  const availableSessions =
    event.sessions && event.sessions.length > 0 ? event.sessions : DEFAULT_EVENT_SESSIONS;

  const [selectedSession, setSelectedSession] = useState<string>(availableSessions[0] || "Sesi Registrasi Awal");
  const [isWebcamOn, setIsWebcamOn] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [manualScanCode, setManualScanCode] = useState("");
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
        setTimeout(() => setScanSuccessOverlay(null), 2000);
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

  const attendees = registrations.filter(
    (r) => r.status === "APPROVED" && r.attendance?.includes(selectedSession)
  );
  const totalApproved = registrations.filter((r) => r.status === "APPROVED").length;

  const handleCopyAttendanceList = () => {
    if (attendees.length === 0) return;
    const textLines = [
      `Presensi: ${event.name} - ${selectedSession}`,
      `Total: ${attendees.length}/${totalApproved}`,
      ...attendees.map((r, i) => `${i + 1}. ${r.cadreName} (${r.registrationNumber || "-"})`)
    ].join("\n");

    navigator.clipboard.writeText(textLines);
    setCopiedAttendance(true);
    setTimeout(() => setCopiedAttendance(false), 2500);
  };

  return (
    <div className="space-y-4 pt-1 text-left">
      <canvas ref={canvasRef} className="hidden" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scanner Feed */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-blue-600" /> Pemindai Kamera
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsSoundMuted(!isSoundMuted)}
                className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-800 cursor-pointer"
                title={isSoundMuted ? "Suara mati" : "Suara aktif"}
              >
                {isSoundMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>

              <Badge className={`text-[8.5px] font-medium px-1.5 py-0.2 rounded border-none ${
                isWebcamOn ? "bg-blue-600 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}>
                {isWebcamOn ? "Aktif" : "Mati"}
              </Badge>
            </div>
          </div>

          <div className="relative aspect-video rounded-lg bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
            {isWebcamOn ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 h-0.5 bg-blue-500 top-0 animate-scanline pointer-events-none" />
                <div className="absolute w-36 h-36 border border-white/60 rounded-md pointer-events-none" />
              </>
            ) : (
              <div className="text-center p-4 space-y-1">
                <CameraOff className="w-6 h-6 text-zinc-500 mx-auto" />
                <span className="text-[11px] text-zinc-400 block">Kamera belum aktif</span>
              </div>
            )}

            {scanSuccessOverlay && (
              <div className="absolute inset-0 bg-blue-600/95 flex flex-col items-center justify-center p-3 text-center z-10 text-white animate-fadeIn">
                <Check className="w-6 h-6 stroke-[3] mb-1" />
                <h4 className="text-xs font-bold uppercase">Presensi Berhasil</h4>
                <p className="text-xs font-semibold mt-0.5">{scanSuccessOverlay.name}</p>
                <span className="text-[9.5px] text-blue-100 font-mono mt-0.5">{scanSuccessOverlay.code}</span>
              </div>
            )}

            {scanErrorNotice && (
              <div className="absolute bottom-2 inset-x-2 bg-rose-600 text-white text-[10px] font-medium py-1.5 px-2.5 rounded shadow z-10 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{scanErrorNotice}</span>
              </div>
            )}
          </div>

          <Button
            onClick={() => setIsWebcamOn(!isWebcamOn)}
            className={`w-full text-xs font-medium h-8 rounded-lg border-none flex items-center justify-center gap-1.5 cursor-pointer ${
              isWebcamOn
                ? "bg-zinc-800 hover:bg-zinc-900 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isWebcamOn ? (
              <>
                <CameraOff className="w-3.5 h-3.5" /> Matikan Kamera
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" /> Nyalakan Kamera
              </>
            )}
          </Button>
        </div>

        {/* Session Selection & Manual Input */}
        <div className="space-y-3 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase text-zinc-500">
              Sesi Aktif
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full h-8 px-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600"
            >
              {availableSessions.map((sess, idx) => (
                <option key={idx} value={sess}>
                  {sess}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase text-zinc-500">
              Ketik Kode Registrasi Manual
            </label>
            <div className="flex gap-1.5">
              <Input
                type="text"
                value={manualScanCode}
                onChange={(e) => setManualScanCode(e.target.value)}
                placeholder="Misal: MAP-120392"
                className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg font-mono uppercase text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleProcessCode(manualScanCode);
                    setManualScanCode("");
                  }
                }}
              />
              <Button
                onClick={() => {
                  handleProcessCode(manualScanCode);
                  setManualScanCode("");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8 rounded-lg border-none cursor-pointer px-3.5 flex-shrink-0"
              >
                Absen
              </Button>
            </div>
          </div>

          {/* Quick Counter */}
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Total Hadir Sesi Ini:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {attendees.length} / {totalApproved} ({totalApproved > 0 ? Math.round((attendees.length / totalApproved) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            Daftar Hadir: {selectedSession}
          </span>

          {attendees.length > 0 && (
            <button
              type="button"
              onClick={handleCopyAttendanceList}
              className="text-[10.5px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedAttendance ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedAttendance ? "Tersalin" : "Salin Daftar"}</span>
            </button>
          )}
        </div>

        <div className="max-h-[200px] overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900/20">
          {attendees.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              Belum ada peserta yang hadir pada sesi ini.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
              {attendees.map((r, idx) => (
                <div key={r.id} className="p-2.5 flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-mono flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-200 truncate">
                      {r.cadreName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono text-zinc-400">{r.registrationNumber}</span>
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-none text-[8.5px] px-1.5 py-0.2 rounded">
                      HADIR
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
