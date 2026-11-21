"use client";

import React, { useState } from "react";
import {
  Search,
  Eye,
  CheckCircle2,
  Check,
  XCircle,
  Clock,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import type { EventActivity, ParticipantRegistration } from "./types";

interface ScreeningTabProps {
  event: EventActivity;
  registrations: ParticipantRegistration[];
  onOpenScreening: (reg: ParticipantRegistration) => void;
  onQuickApprove?: (reg: ParticipantRegistration) => void;
  onBatchApprove?: (regs: ParticipantRegistration[]) => void;
  onOpenAddParticipant?: () => void;
  onDeleteRegistration?: (regId: string, cadreName?: string) => Promise<void> | void;
}

export default function ScreeningTab({
  event,
  registrations,
  onOpenScreening,
  onQuickApprove,
  onBatchApprove,
  onOpenAddParticipant,
  onDeleteRegistration
}: ScreeningTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<ParticipantRegistration | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalFields = (event.formFields || []).length;

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.cadreName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.cadreEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Boolean(reg.registrationNumber && reg.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  const pendingCount = registrations.filter((r) => r.status === "PENDING").length;

  const handleApproveAllPending = () => {
    if (!onBatchApprove) return;
    const pendingList = registrations.filter((r) => r.status === "PENDING");
    if (pendingList.length > 0) {
      onBatchApprove(pendingList);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget || !onDeleteRegistration) return;
    setIsDeleting(true);
    try {
      await onDeleteRegistration(deleteConfirmTarget.id, deleteConfirmTarget.cadreName);
      setDeleteConfirmTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3.5 pt-1">
      {/* Top Action Bar: Search */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <Input
          type="text"
          placeholder="Cari nama atau nomor registrasi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-xs bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
        />
      </div>

      {/* Batch Approve Action Bar if there are pending registrations */}
      {pendingCount > 0 && onBatchApprove && (
        <div className="p-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs text-emerald-900 dark:text-emerald-200 font-medium">
              Terdapat <strong>{pendingCount} pendaftar</strong> yang menunggu verifikasi.
            </span>
          </div>
          <Button
            type="button"
            size="xs"
            onClick={handleApproveAllPending}
            className="h-7 px-3 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Setujui Semua Pendaftar</span>
          </Button>
        </div>
      )}

      {/* Registrations List */}
      {filteredRegistrations.length === 0 ? (
        <div className="py-12 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
          Tidak ada data pendaftar.
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-0.5">
          {filteredRegistrations.map((reg) => {
            const verifiedCount = Object.values(reg.verificationStatus || {}).filter(Boolean).length;
            const isPending = reg.status === "PENDING";

            return (
              <div
                key={reg.id}
                className="p-3 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {reg.cadreName ? reg.cadreName.substring(0, 2).toUpperCase() : "PM"}
                  </div>

                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                        {reg.cadreName}
                      </span>

                      <Badge
                        className={`text-[8.5px] font-medium px-1.5 py-0.2 rounded border-none inline-flex items-center gap-1 ${
                          reg.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : reg.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/50"
                        }`}
                      >
                        {reg.status === "APPROVED" ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Lolos (Disetujui)</span>
                          </>
                        ) : reg.status === "REJECTED" ? (
                          <>
                            <XCircle className="w-2.5 h-2.5" />
                            <span>Ditolak</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-2.5 h-2.5" />
                            <span>Menunggu</span>
                          </>
                        )}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                      <span>{reg.registrationNumber || "Belum ID"}</span>
                      <span>&bull;</span>
                      <span className="truncate">{reg.cadreEmail}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto">
                  <span className="text-[10px] text-zinc-500 font-medium mr-1">
                    Berkas: {verifiedCount}/{totalFields}
                  </span>

                  {/* Tombol Setujui Cepat jika berstatus PENDING */}
                  {isPending && onQuickApprove && (
                    <Button
                      size="xs"
                      onClick={() => onQuickApprove(reg)}
                      className="h-7.5 px-2.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer border-none flex items-center gap-1"
                      title="Setujui dan Terima Peserta Ini"
                    >
                      <Check className="w-3 h-3" />
                      <span>Setujui</span>
                    </Button>
                  )}

                  <Button
                    size="xs"
                    onClick={() => onOpenScreening(reg)}
                    variant="outline"
                    className="h-7.5 px-2.5 text-[11px] font-medium border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 rounded-md cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Tinjau</span>
                  </Button>

                  {/* Tombol Hapus Pendaftar */}
                  {onDeleteRegistration && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setDeleteConfirmTarget(reg)}
                      className="h-7.5 w-7.5 p-0 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-900/50 rounded-md cursor-pointer transition-colors"
                      title="Hapus data pendaftaran"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Konfirmasi Hapus Pendaftar */}
      {deleteConfirmTarget && (
        <Dialog open={Boolean(deleteConfirmTarget)} onOpenChange={(open) => !open && setDeleteConfirmTarget(null)}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Hapus Pendaftaran Peserta</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 pt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus data pendaftaran kader{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">{deleteConfirmTarget.cadreName}</strong>
                {deleteConfirmTarget.registrationNumber && ` (${deleteConfirmTarget.registrationNumber})`}?
                <br />
                Data berkas screening dan riwayat pendaftaran ini akan dihapus secara permanen.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={isDeleting}
                className="h-8 text-xs px-3 rounded-lg border-zinc-200 dark:border-zinc-800"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="h-8 text-xs px-3.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Menghapus..." : "Ya, Hapus"}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
