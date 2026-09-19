"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  ExternalLink,
  AlertCircle,
  Type,
  AlignLeft,
  List,
  UploadCloud,
  FileText
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { EventActivity, ParticipantRegistration } from "./types";

interface ScreeningDetailModalProps {
  isOpen: boolean;
  registration: ParticipantRegistration | null;
  event: EventActivity | null;
  onClose: () => void;
  onSave: (
    regId: string,
    status: "APPROVED" | "REJECTED",
    notes: string,
    verificationStatus: Record<string, boolean>
  ) => void;
}

export default function ScreeningDetailModal({
  isOpen,
  registration,
  event,
  onClose,
  onSave
}: ScreeningDetailModalProps) {
  const [status, setStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [notes, setNotes] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (registration) {
      setStatus(registration.status === "REJECTED" ? "REJECTED" : "APPROVED");
      setNotes(registration.notes || "");
      setVerificationStatus(registration.verificationStatus || {});
    }
  }, [registration]);

  if (!isOpen || !registration || !event) return null;

  const formFields = event.formFields || [];

  const handleToggleCheck = (fieldId: string) => {
    setVerificationStatus((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  const handleVerifyAll = () => {
    const allTrue: Record<string, boolean> = {};
    formFields.forEach((f) => {
      allTrue[f.id] = true;
    });
    setVerificationStatus(allTrue);
    setStatus("APPROVED");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(registration.id, status, notes, verificationStatus);
  };

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case "text":
        return <Type className="w-3 h-3" />;
      case "textarea":
        return <AlignLeft className="w-3 h-3" />;
      case "select":
        return <List className="w-3 h-3" />;
      case "file":
        return <UploadCloud className="w-3 h-3" />;
      default:
        return <Type className="w-3 h-3" />;
    }
  };

  const verifiedCount = Object.values(verificationStatus).filter(Boolean).length;
  const isAllVerified = formFields.length > 0 && verifiedCount === formFields.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <Card className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden relative max-h-[90vh] flex flex-col text-zinc-900 dark:text-zinc-100">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Screening: {registration.cadreName}
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                {registration.registrationNumber || "-"} &bull; {registration.cadreEmail}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Pemeriksaan Berkas ({verifiedCount}/{formFields.length})
              </span>

              {!isAllVerified && formFields.length > 0 && (
                <button
                  type="button"
                  onClick={handleVerifyAll}
                  className="text-[11px] font-medium text-blue-600 hover:underline cursor-pointer"
                >
                  Centang Semua
                </button>
              )}
            </div>

            {/* Fields List */}
            <div className="space-y-2">
              {formFields.map((field) => {
                const isVerified = verificationStatus[field.id] || false;
                const answerValue = registration.answers[field.id] || "";

                return (
                  <div
                    key={field.id}
                    className={`p-2.5 rounded-lg border transition-colors ${
                      isVerified
                        ? "border-blue-600/40 bg-blue-50/20 dark:bg-blue-950/20"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-zinc-400">{getFieldTypeIcon(field.type)}</span>
                        <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {field.label}
                          {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleCheck(field.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                          isVerified
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-transparent"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>

                    <div className="pl-5 pt-1.5 text-xs">
                      {field.type === "file" ? (
                        answerValue ? (
                          <a
                            href={answerValue}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Buka Dokumen</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-rose-500">Berkas kosong</span>
                        )
                      ) : field.type === "textarea" ? (
                        answerValue ? (
                          <div className="text-[11px] bg-zinc-50 dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {answerValue}
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-400 italic">Kosong</span>
                        )
                      ) : (
                        <span className="text-[11px] text-zinc-800 dark:text-zinc-200">
                          {answerValue || <span className="text-zinc-400 italic">Kosong</span>}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Decision Status */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] font-semibold uppercase text-zinc-500">
                Keputusan
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("APPROVED")}
                  className={`p-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                    status === "APPROVED"
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lolos Berkas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus("REJECTED")}
                  className={`p-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                    status === "REJECTED"
                      ? "bg-rose-50 dark:bg-rose-950/40 border-rose-600 text-rose-600 dark:text-rose-400 font-semibold"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Tolak</span>
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase text-zinc-500">
                Catatan (Opsional)
              </span>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Keterangan..."
                className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2 bg-zinc-50/50 dark:bg-zinc-900/30">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-8 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer"
            >
              Batal
            </Button>

            <Button
              type="submit"
              className="text-xs font-medium px-4 h-8 rounded-lg text-white bg-blue-600 hover:bg-blue-700 border-none cursor-pointer"
            >
              Simpan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
