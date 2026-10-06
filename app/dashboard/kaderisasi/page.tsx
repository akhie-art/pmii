"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit,
  Search,
  Calendar,
  X,
  Link2,
  Check,
  GraduationCap,
  BookOpen,
  Award,
  Layers,
  BadgeCheck,
  ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  db,
  Kaderisasi,
  FormField,
  KaderisasiMateri,
  CertificateLayoutConfig,
  DEFAULT_CERT_CONFIG
} from "@/lib/db";
import { generateUUID } from "@/lib/utils";
import { useFeedbackModal } from "@/components/ui/feedback-modal";
import { CERT_FIELDS, DEFAULT_FORM_FIELDS, FONT_OPTIONS } from "./_components/types";
import { AgendaFormModal } from "./_components/AgendaFormModal";
import { DeleteAgendaModal } from "./_components/DeleteAgendaModal";
import { deleteStorageFile } from "@/lib/supabase";

export { DEFAULT_CERT_CONFIG, CERT_FIELDS, DEFAULT_FORM_FIELDS, FONT_OPTIONS };

/* -------------------------------------------------------------------------- */
/*  Konstanta & Helper Tampilan                                               */
/* -------------------------------------------------------------------------- */

type TipeFilter = "SEMUA" | "FORMAL" | "INFORMAL" | "NON_FORMAL";

const TIPE_OPTIONS: { value: TipeFilter; label: string }[] = [
  { value: "SEMUA", label: "Semua Tipe" },
  { value: "FORMAL", label: "Formal" },
  { value: "INFORMAL", label: "Informal" },
  { value: "NON_FORMAL", label: "Non formal" }
];

const TIPE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  FORMAL: {
    label: "Formal",
    badgeClass:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900/60",
    dotClass: "bg-blue-500"
  },
  INFORMAL: {
    label: "Informal",
    badgeClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60",
    dotClass: "bg-emerald-500"
  },
  NON_FORMAL: {
    label: "Non formal",
    badgeClass:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
    dotClass: "bg-amber-500"
  }
};

function formatDate(iso?: string) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function TipeBadge({ tipe }: { tipe: string }) {
  const conf = TIPE_CONFIG[tipe] || {
    label: tipe,
    badgeClass:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
    dotClass: "bg-zinc-400"
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${conf.badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dotClass}`} />
      {conf.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Halaman Utama Sistem Kaderisasi                                           */
/* -------------------------------------------------------------------------- */

export default function SistemKaderisasiPage() {
  const [mounted, setMounted] = useState(false);
  const [kaderisasiList, setKaderisasiList] = useState<Kaderisasi[]>([]);

  // Search & Filter
  const [agendaSearch, setAgendaSearch] = useState("");
  const [selectedTipe, setSelectedTipe] = useState<TipeFilter>("SEMUA");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAgendaId, setEditAgendaId] = useState("");

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteAgendaId, setDeleteAgendaId] = useState("");
  const [deleteAgendaName, setDeleteAgendaName] = useState("");
  const [copiedId, setCopiedId] = useState<string>("");

  const { showToast, FeedbackModalComponent } = useFeedbackModal();

  useEffect(() => {
    const loadData = async () => {
      try {
        const list = await db.getKaderisasi();
        const normalized = (list || []).map((item) => ({
          ...item,
          formFields:
            item.formFields && item.formFields.length > 0
              ? item.formFields
              : [...DEFAULT_FORM_FIELDS]
        }));
        setKaderisasiList(normalized);
      } catch (err) {
        console.error("Gagal memuat agenda kaderisasi:", err);
      } finally {
        setMounted(true);
      }
    };

    loadData();
  }, []);

  // Filtered agenda list
  const filteredAgendas = useMemo(() => {
    return kaderisasiList.filter((item) => {
      const matchesSearch = item.nama
        .toLowerCase()
        .includes(agendaSearch.toLowerCase());
      const matchesTipe =
        selectedTipe === "SEMUA" || item.tipe === selectedTipe;
      return matchesSearch && matchesTipe;
    });
  }, [kaderisasiList, agendaSearch, selectedTipe]);

  const hasActiveFilter =
    agendaSearch.trim() !== "" || selectedTipe !== "SEMUA";

  const handleCopyLink = (agenda: Kaderisasi, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof window === "undefined") return;
    const link = `${window.location.origin}/kader/kegiatan?level=${encodeURIComponent(agenda.nama)}`;
    navigator.clipboard.writeText(link);
    setCopiedId(agenda.id);
    showToast(`Tautan pendaftaran agenda ${agenda.nama} berhasil disalin!`);
    setTimeout(() => setCopiedId(""), 2500);
  };

  const handleOpenEdit = (agendaId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditAgendaId(agendaId);
    setShowEditModal(true);
  };

  const handleOpenDelete = (
    agendaId: string,
    agendaName: string,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    setDeleteAgendaId(agendaId);
    setDeleteAgendaName(agendaName);
    setShowDeleteConfirmModal(true);
  };

  // CRUD Handlers
  const handleCreateAgenda = async (data: {
    nama: string;
    tipe: "FORMAL" | "INFORMAL" | "NON_FORMAL";
    materi: KaderisasiMateri[];
    formFields: FormField[];
    certificateTemplate?: string;
    certificateConfig?: CertificateLayoutConfig;
  }) => {
    const newAgenda: Kaderisasi = {
      id: generateUUID(),
      nama: data.nama,
      tipe: data.tipe,
      materi: data.materi,
      formFields: data.formFields,
      certificateTemplate: data.certificateTemplate,
      certificateConfig: data.certificateConfig,
      createdAt: new Date().toISOString()
    };

    const updated = [newAgenda, ...kaderisasiList];
    setKaderisasiList(updated);
    await db.saveKaderisasi(updated);

    setShowCreateModal(false);
    showToast("Agenda kaderisasi berhasil ditambahkan.");
  };

  const handleUpdateAgenda = async (data: {
    nama: string;
    tipe: "FORMAL" | "INFORMAL" | "NON_FORMAL";
    materi: KaderisasiMateri[];
    formFields: FormField[];
    certificateTemplate?: string;
    certificateConfig?: CertificateLayoutConfig;
  }) => {
    const updated = kaderisasiList.map((item) => {
      if (item.id === editAgendaId) {
        return {
          ...item,
          nama: data.nama,
          tipe: data.tipe,
          materi: data.materi,
          formFields: data.formFields,
          certificateTemplate: data.certificateTemplate,
          certificateConfig: data.certificateConfig
        };
      }
      return item;
    });

    setKaderisasiList(updated);
    await db.saveKaderisasi(updated);

    setShowEditModal(false);
    setEditAgendaId("");
    showToast("Perubahan agenda disimpan.");
  };

  const confirmDeleteAgenda = async () => {
    if (!deleteAgendaId) return;

    const agendaToDelete = kaderisasiList.find((item) => item.id === deleteAgendaId);
    if (agendaToDelete) {
      if (agendaToDelete.certificateTemplate) {
        deleteStorageFile(agendaToDelete.certificateTemplate).catch(() => {});
      }
      if (agendaToDelete.syllabus?.fileUrl) {
        deleteStorageFile(agendaToDelete.syllabus.fileUrl).catch(() => {});
      }
      if (agendaToDelete.modul?.fileUrl) {
        deleteStorageFile(agendaToDelete.modul.fileUrl).catch(() => {});
      }
    }

    const remaining = kaderisasiList.filter(
      (item) => item.id !== deleteAgendaId
    );
    setKaderisasiList(remaining);
    await db.saveKaderisasi(remaining);

    setShowDeleteConfirmModal(false);
    setDeleteAgendaId("");
    setDeleteAgendaName("");
    showToast("Agenda kaderisasi berhasil dihapus.");
  };

  if (!mounted) {
    return (
      <div className="space-y-5 animate-pulse pb-16">
        <div className="h-14 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="h-64 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-64 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-64 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16 font-sans text-zinc-900 dark:text-zinc-100">
      {/* BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Link
            href="/dashboard"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Kaderisasi
          </span>
        </nav>
      </div>

      {/* FILTER, SEARCH & ACTION TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Cari nama agenda kaderisasi (misal: MAPABA, PKD)..."
            value={agendaSearch}
            onChange={(e) => setAgendaSearch(e.target.value)}
            className="h-9.5 pl-9 pr-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
          />
          {agendaSearch && (
            <button
              type="button"
              onClick={() => setAgendaSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills & Add Button */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TIPE_OPTIONS.map(({ value, label }) => {
            const isActive = selectedTipe === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedTipe(value)}
                className={`h-8 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs shadow-blue-500/20"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {label}
              </button>
            );
          })}

          <Button
            onClick={() => setShowCreateModal(true)}
            className="h-8 px-3.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-xs ml-auto sm:ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Agenda Baru</span>
          </Button>
        </div>
      </div>

      {/* 4. GRID AGENDA CARDS */}
      {filteredAgendas.length === 0 ? (
        <Card className="p-16 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Tidak Ada Agenda yang Ditemukan
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            {hasActiveFilter
              ? "Coba ubah kata kunci pencarian atau ganti filter tipe agenda."
              : "Belum ada agenda kaderisasi yang terdaftar di sistem."}
          </p>
          {hasActiveFilter ? (
            <Button
              variant="outline"
              onClick={() => {
                setAgendaSearch("");
                setSelectedTipe("SEMUA");
              }}
              className="mt-2 h-8.5 px-4 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Reset Filter
            </Button>
          ) : (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 h-8.5 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Tambah Agenda Pertama</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgendas.map((agenda) => {
            const materiCount = (agenda.materi || []).length;
            const formFields = agenda.formFields || [];
            const hasCert = !!agenda.certificateTemplate;
            const isJustCopied = copiedId === agenda.id;

            return (
              <Card
                key={agenda.id}
                className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Card Top: Type Badge & Header Actions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <TipeBadge tipe={agenda.tipe} />

                    <div className="flex items-center gap-1">
                      {hasCert && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-900/40 mr-1">
                          <BadgeCheck className="w-3.5 h-3.5" />
                          <span>Sertifikat</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(agenda, e)}
                        className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          isJustCopied
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950"
                            : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        }`}
                        title="Salin tautan formulir"
                      >
                        {isJustCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Link2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(agenda.id, e)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                        title="Edit agenda"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) =>
                          handleOpenDelete(agenda.id, agenda.nama, e)
                        }
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Hapus agenda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {agenda.nama}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Terdaftar sejak {formatDate(agenda.createdAt)}
                    </p>
                  </div>

                  {/* Clean Inline Metrics */}
                  <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 pt-0.5">
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {materiCount}
                      </span>{" "}
                      Materi
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">
                      &bull;
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formFields.length}
                      </span>{" "}
                      Persyaratan
                    </span>
                  </div>

                  {/* Form fields chips preview (minimal) */}
                  {formFields.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {formFields.slice(0, 3).map((f) => (
                        <span
                          key={f.id}
                          className="text-[10.5px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium truncate max-w-[130px]"
                        >
                          {f.label}
                          {f.required && (
                            <span className="text-rose-500 ml-0.5">*</span>
                          )}
                        </span>
                      ))}
                      {formFields.length > 3 && (
                        <span className="text-[10px] text-zinc-400 font-medium">
                          +{formFields.length - 3} lainnya
                        </span>
                      )}
                    </div>
                  )}
                </div>

              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE AGENDA MODAL */}
      {showCreateModal && (
        <AgendaFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAgenda}
        />
      )}

      {/* EDIT AGENDA MODAL */}
      {showEditModal && (
        <AgendaFormModal
          isOpen={showEditModal}
          agenda={kaderisasiList.find((item) => item.id === editAgendaId)}
          onClose={() => {
            setShowEditModal(false);
            setEditAgendaId("");
          }}
          onSubmit={handleUpdateAgenda}
        />
      )}

      {/* DELETE AGENDA CONFIRMATION MODAL */}
      {showDeleteConfirmModal && (
        <DeleteAgendaModal
          isOpen={showDeleteConfirmModal}
          agendaName={deleteAgendaName}
          onClose={() => {
            setShowDeleteConfirmModal(false);
            setDeleteAgendaId("");
            setDeleteAgendaName("");
          }}
          onConfirm={confirmDeleteAgenda}
        />
      )}

      {FeedbackModalComponent}
    </div>
  );
}