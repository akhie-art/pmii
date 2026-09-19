"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
  BookOpen,
  ClipboardList,
  Info,
  X,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { db, Kaderisasi, FormField, KaderisasiMateri } from "@/lib/db";
import { generateUUID } from "@/lib/utils";

const DEFAULT_FORM_FIELDS: FormField[] = [
  { id: "f-ktm", label: "Scan KTM", type: "file", required: true },
  { id: "f-foto", label: "Pas Foto 3x4", type: "file", required: true },
  { id: "f-alasan", label: "Alasan Bergabung", type: "textarea", required: true }
];

export default function SistemKaderisasiPage() {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [kaderisasiList, setKaderisasiList] = useState<Kaderisasi[]>([]);
  const [selectedAgendaId, setSelectedAgendaId] = useState<string>("");

  // Search & Filter
  const [agendaSearch, setAgendaSearch] = useState("");
  const [selectedTipe, setSelectedTipe] = useState<"SEMUA" | "FORMAL" | "INFORMAL" | "NON_FORMAL">("SEMUA");

  // Workspace active tab (Materi, Formulir, Informasi)
  const [selectedTab, setSelectedTab] = useState<"materi" | "formulir" | "info">("materi");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAgendaId, setEditAgendaId] = useState("");

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteAgendaId, setDeleteAgendaId] = useState("");
  const [deleteAgendaName, setDeleteAgendaName] = useState("");

  // Quick inline add state for workspace
  const [quickMateriInput, setQuickMateriInput] = useState("");
  const [quickFieldLabel, setQuickFieldLabel] = useState("");
  const [quickFieldType, setQuickFieldType] = useState<"file" | "text" | "textarea" | "select">("file");
  const [quickFieldRequired, setQuickFieldRequired] = useState(true);
  const [quickFieldOptions, setQuickFieldOptions] = useState("");

  // Toast notification
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg: string, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), duration);
  };

  useEffect(() => {
    const loadData = async () => {
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("PMII_LOGGED_IN_USER");
        if (storedUser) {
          try {
            setCurrentUser(JSON.parse(storedUser));
          } catch (e) {
            console.error("Error parsing user session:", e);
          }
        }
      }

      const list = await db.getKaderisasi();
      setKaderisasiList(list);
      if (list.length > 0) {
        setSelectedAgendaId(list[0].id);
      }
      setMounted(true);
    };

    loadData();
  }, []);

  // Filtered agenda list
  const filteredAgendas = kaderisasiList.filter((item) => {
    const matchesSearch = item.nama.toLowerCase().includes(agendaSearch.toLowerCase());
    const matchesTipe = selectedTipe === "SEMUA" || item.tipe === selectedTipe;
    return matchesSearch && matchesTipe;
  });

  const selectedAgenda =
    kaderisasiList.find((item) => item.id === selectedAgendaId) ||
    filteredAgendas[0] ||
    null;

  // CRUD Handlers
  const handleCreateAgenda = async (data: {
    nama: string;
    tipe: "FORMAL" | "INFORMAL" | "NON_FORMAL";
    materi: KaderisasiMateri[];
    formFields: FormField[];
  }) => {
    const newAgenda: Kaderisasi = {
      id: generateUUID(),
      nama: data.nama,
      tipe: data.tipe,
      materi: data.materi,
      formFields: data.formFields,
      createdAt: new Date().toISOString()
    };

    const updated = [newAgenda, ...kaderisasiList];
    setKaderisasiList(updated);
    await db.saveKaderisasi(updated);

    setSelectedAgendaId(newAgenda.id);
    setShowCreateModal(false);
    showToast("Agenda kaderisasi berhasil ditambahkan.");
  };

  const handleUpdateAgenda = async (data: {
    nama: string;
    tipe: "FORMAL" | "INFORMAL" | "NON_FORMAL";
    materi: KaderisasiMateri[];
    formFields: FormField[];
  }) => {
    const updated = kaderisasiList.map((item) => {
      if (item.id === editAgendaId) {
        return {
          ...item,
          nama: data.nama,
          tipe: data.tipe,
          materi: data.materi,
          formFields: data.formFields
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

    const remaining = kaderisasiList.filter((item) => item.id !== deleteAgendaId);
    setKaderisasiList(remaining);
    await db.saveKaderisasi(remaining);

    if (selectedAgendaId === deleteAgendaId) {
      setSelectedAgendaId(remaining.length > 0 ? remaining[0].id : "");
    }

    setShowDeleteConfirmModal(false);
    setDeleteAgendaId("");
    setDeleteAgendaName("");
    showToast("Agenda kaderisasi berhasil dihapus.");
  };

  // Workspace Inline Handlers: Quick Add/Remove Materi
  const handleQuickAddMateri = async () => {
    if (!quickMateriInput.trim() || !selectedAgenda) return;
    const newMateri: KaderisasiMateri = {
      id: generateUUID(),
      judul: quickMateriInput.trim()
    };
    const updatedMateri = [...(selectedAgenda.materi || []), newMateri];
    const updatedList = kaderisasiList.map((item) =>
      item.id === selectedAgenda.id ? { ...item, materi: updatedMateri } : item
    );
    setKaderisasiList(updatedList);
    await db.saveKaderisasi(updatedList);
    setQuickMateriInput("");
    showToast("Materi berhasil ditambahkan.");
  };

  const handleQuickRemoveMateri = async (materiId: string) => {
    if (!selectedAgenda) return;
    const updatedMateri = (selectedAgenda.materi || []).filter((m) => m.id !== materiId);
    const updatedList = kaderisasiList.map((item) =>
      item.id === selectedAgenda.id ? { ...item, materi: updatedMateri } : item
    );
    setKaderisasiList(updatedList);
    await db.saveKaderisasi(updatedList);
    showToast("Materi berhasil dihapus.");
  };

  // Workspace Inline Handlers: Quick Add/Remove Form Field
  const handleQuickAddField = async () => {
    if (!quickFieldLabel.trim() || !selectedAgenda) return;
    let parsedOptions: string[] | undefined = undefined;
    if (quickFieldType === "select" && quickFieldOptions.trim()) {
      parsedOptions = quickFieldOptions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const newField: FormField = {
      id: generateUUID(),
      label: quickFieldLabel.trim(),
      type: quickFieldType,
      required: quickFieldRequired,
      options: parsedOptions
    };
    const updatedFields = [...(selectedAgenda.formFields || []), newField];
    const updatedList = kaderisasiList.map((item) =>
      item.id === selectedAgenda.id ? { ...item, formFields: updatedFields } : item
    );
    setKaderisasiList(updatedList);
    await db.saveKaderisasi(updatedList);
    setQuickFieldLabel("");
    setQuickFieldOptions("");
    setQuickFieldRequired(true);
    showToast("Kolom formulir ditambahkan.");
  };

  const handleQuickRemoveField = async (fieldId: string) => {
    if (!selectedAgenda) return;
    const updatedFields = (selectedAgenda.formFields || []).filter((f) => f.id !== fieldId);
    const updatedList = kaderisasiList.map((item) =>
      item.id === selectedAgenda.id ? { ...item, formFields: updatedFields } : item
    );
    setKaderisasiList(updatedList);
    await db.saveKaderisasi(updatedList);
    showToast("Kolom formulir dihapus.");
  };

  const handleMoveField = async (index: number, direction: "up" | "down") => {
    if (!selectedAgenda || !selectedAgenda.formFields) return;
    const fields = [...selectedAgenda.formFields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const temp = fields[index];
    fields[index] = fields[targetIndex];
    fields[targetIndex] = temp;

    const updatedList = kaderisasiList.map((item) =>
      item.id === selectedAgenda.id ? { ...item, formFields: fields } : item
    );
    setKaderisasiList(updatedList);
    await db.saveKaderisasi(updatedList);
    showToast("Urutan kolom formulir diperbarui.");
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="lg:col-span-2 h-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. HEADER SECTION (Consistent with dashboard/kegiatan) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            Sistem Kaderisasi
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manajemen agenda kaderisasi, materi pembelajaran, dan formulir pendaftaran
          </p>
        </div>

        <div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 h-8.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors border-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Agenda</span>
          </Button>
        </div>
      </div>

      {/* TOAST NOTIFICATION (Consistent with dashboard/kegiatan) */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 px-3.5 py-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-blue-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN MASTER-DETAIL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* LEFT COLUMN: AGENDA LIST */}
        <div className="lg:col-span-1 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Daftar Agenda ({kaderisasiList.length})
            </span>
          </div>

          {/* Minimal Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder="Cari agenda..."
              value={agendaSearch}
              onChange={(e) => setAgendaSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 rounded-lg placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {(["SEMUA", "FORMAL", "INFORMAL", "NON_FORMAL"] as const).map((type) => {
              const isActive = selectedTipe === type;
              const label = type === "SEMUA" ? "Semua" : type.replace("_", " ");
              return (
                <button
                  key={type}
                  onClick={() => setSelectedTipe(type)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer whitespace-nowrap border ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Agenda Cards Scrollable List */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto">
            {filteredAgendas.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                Tidak ada agenda ditemukan.
              </div>
            ) : (
              filteredAgendas.map((item) => {
                const isActive = selectedAgenda?.id === item.id;
                const materiCount = (item.materi || []).length;
                const formFieldsCount = (item.formFields || []).length;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedAgendaId(item.id)}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer text-left ${
                      isActive
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-[9px] font-semibold uppercase px-2 py-0.5 rounded-md">
                        {item.tipe.replace("_", " ")}
                      </Badge>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {item.createdAt ? item.createdAt.slice(0, 10) : "-"}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-white mt-1.5 truncate">
                      {item.nama}
                    </h4>

                    <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{materiCount} Materi</span>
                      <span>{formFieldsCount} Formulir</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: AGENDA WORKSPACE */}
        <div className="lg:col-span-2 space-y-4">
          {selectedAgenda ? (
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 sm:p-5 shadow-none space-y-4 text-zinc-900 dark:text-zinc-100">
              {/* Agenda Header (Consistent with dashboard/kegiatan) */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-[9px] font-semibold uppercase px-2 py-0.5 rounded-md">
                      {selectedAgenda.tipe.replace("_", " ")}
                    </Badge>
                    <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {selectedAgenda.createdAt ? selectedAgenda.createdAt.slice(0, 10) : "-"}
                    </span>
                  </div>

                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {selectedAgenda.nama}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto">
                  <Button
                    onClick={() => {
                      setEditAgendaId(selectedAgenda.id);
                      setShowEditModal(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-lg cursor-pointer border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300"
                    title="Edit Agenda"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    onClick={() => {
                      setDeleteAgendaId(selectedAgenda.id);
                      setDeleteAgendaName(selectedAgenda.nama);
                      setShowDeleteConfirmModal(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-lg cursor-pointer border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-rose-600"
                    title="Hapus Agenda"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Form Schema Preview Pills */}
              <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-zinc-500">
                <span className="font-semibold">Kolom Formulir:</span>
                {(selectedAgenda.formFields || []).length === 0 ? (
                  <span className="italic text-zinc-400">Belum ada kolom</span>
                ) : (
                  (selectedAgenda.formFields || []).map((field) => (
                    <span
                      key={field.id}
                      className="py-0.5 px-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                    >
                      {field.label}
                      {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                    </span>
                  ))
                )}
              </div>

              {/* CLEAN MINIMAL TABS (Consistent with dashboard/kegiatan) */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedTab("materi")}
                  className={`pb-2 text-xs font-semibold transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 ${
                    selectedTab === "materi"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  Materi Pembelajaran ({(selectedAgenda.materi || []).length})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTab("formulir")}
                  className={`pb-2 text-xs font-semibold transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 ${
                    selectedTab === "formulir"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  Formulir Pendaftaran ({(selectedAgenda.formFields || []).length})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTab("info")}
                  className={`pb-2 text-xs font-semibold transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 ${
                    selectedTab === "info"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  Informasi Agenda
                </button>
              </div>

              {/* TAB 1: MATERI PEMBELAJARAN */}
              {selectedTab === "materi" && (
                <div className="space-y-3.5">
                  {/* Quick Add Materi */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Ketik judul materi (contoh: Nilai Dasar Pergerakan)..."
                        value={quickMateriInput}
                        onChange={(e) => setQuickMateriInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleQuickAddMateri();
                          }
                        }}
                        className="h-8.5 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleQuickAddMateri}
                        disabled={!quickMateriInput.trim()}
                        className="h-8.5 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg border-none cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah</span>
                      </Button>
                    </div>
                  </div>

                  {/* Materi List */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {(selectedAgenda.materi || []).length === 0 ? (
                      <div className="py-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                        Belum ada materi pembelajaran. Masukkan judul materi di atas.
                      </div>
                    ) : (
                      (selectedAgenda.materi || []).map((materi, idx) => (
                        <div
                          key={materi.id}
                          className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 flex items-center justify-between gap-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {materi.judul}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleQuickRemoveMateri(materi.id)}
                            className="text-zinc-400 hover:text-rose-600 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0 transition-colors"
                            title="Hapus materi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: FORMULIR PENDAFTARAN */}
              {selectedTab === "formulir" && (
                <div className="space-y-3.5">
                  {/* Quick Add Form Field */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        type="text"
                        placeholder="Label Kolom (contoh: Scan Sertifikat)"
                        value={quickFieldLabel}
                        onChange={(e) => setQuickFieldLabel(e.target.value)}
                        className="h-8.5 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />

                      <select
                        value={quickFieldType}
                        onChange={(e) => setQuickFieldType(e.target.value as any)}
                        className="h-8.5 px-2.5 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:border-blue-600"
                      >
                        <option value="file">Unggah Berkas (PDF/Gambar)</option>
                        <option value="text">Teks Pendek</option>
                        <option value="textarea">Teks Panjang (Alasan/Esai)</option>
                        <option value="select">Dropdown (Pilihan)</option>
                      </select>
                    </div>

                    {quickFieldType === "select" && (
                      <Input
                        type="text"
                        placeholder="Opsi (pisahkan dengan koma, misal: S, M, L, XL)"
                        value={quickFieldOptions}
                        onChange={(e) => setQuickFieldOptions(e.target.value)}
                        className="h-8.5 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    )}

                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={quickFieldRequired}
                          onChange={(e) => setQuickFieldRequired(e.target.checked)}
                          className="rounded text-blue-600 h-3.5 w-3.5"
                        />
                        <span>Wajib diisi</span>
                      </label>

                      <Button
                        type="button"
                        onClick={handleQuickAddField}
                        disabled={!quickFieldLabel.trim()}
                        className="h-7.5 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg border-none cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Kolom</span>
                      </Button>
                    </div>
                  </div>

                  {/* Form Field List */}
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {(selectedAgenda.formFields || []).length === 0 ? (
                      <div className="py-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                        Belum ada kolom formulir. Tambahkan kolom di atas.
                      </div>
                    ) : (
                      (selectedAgenda.formFields || []).map((field, idx, arr) => (
                        <div
                          key={field.id}
                          className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                  {field.label}
                                </span>
                                {field.required && (
                                  <span className="text-rose-500 font-bold" title="Wajib diisi">*</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                                <span className="uppercase px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300">
                                  {field.type}
                                </span>
                                {field.options && field.options.length > 0 && (
                                  <span className="truncate text-zinc-400">
                                    Opsi: {field.options.join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveField(idx, "up")}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-25 disabled:cursor-not-allowed p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                              title="Pindahkan ke atas"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={idx === arr.length - 1}
                              onClick={() => handleMoveField(idx, "down")}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-25 disabled:cursor-not-allowed p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                              title="Pindahkan ke bawah"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickRemoveField(field.id)}
                              className="text-zinc-400 hover:text-rose-600 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0 transition-colors ml-1"
                              title="Hapus kolom"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: INFORMASI AGENDA */}
              {selectedTab === "info" && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-1">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                        Nama Agenda
                      </span>
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {selectedAgenda.nama}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-1">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                        Tipe Kaderisasi
                      </span>
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {selectedAgenda.tipe.replace("_", " ")}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-1">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                        Tanggal Dibuat
                      </span>
                      <p className="font-mono text-zinc-900 dark:text-white">
                        {selectedAgenda.createdAt ? selectedAgenda.createdAt.slice(0, 10) : "-"}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-1">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                        ID Sistem
                      </span>
                      <p className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                        {selectedAgenda.id}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 text-[11px] leading-relaxed">
                    Agenda kaderisasi ini menjadi rujukan otomatis saat membuat <strong>Kegiatan</strong> baru di halaman kegiatan. Kolom formulir pendaftaran dan materi yang dikonfigurasi di sini akan langsung diwariskan ke kegiatan terkait.
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <div className="py-20 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              Pilih agenda kaderisasi untuk melihat data.
            </div>
          )}
        </div>
      </div>

      {/* CREATE AGENDA MODAL (Styled consistently with EventFormModal) */}
      {showCreateModal && (
        <AgendaFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAgenda}
        />
      )}

      {/* EDIT AGENDA MODAL (Styled consistently with EventFormModal) */}
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

      {/* DELETE AGENDA CONFIRMATION MODAL (Styled consistently with DeleteEventModal) */}
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
    </div>
  );
}

// -------------------------------------------------------------
// MODAL: AGENDA FORM MODAL (Create & Edit)
// Consistent with EventFormModal.tsx
// -------------------------------------------------------------
interface AgendaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  agenda?: Kaderisasi | null;
  onSubmit: (data: {
    nama: string;
    tipe: "FORMAL" | "INFORMAL" | "NON_FORMAL";
    materi: KaderisasiMateri[];
    formFields: FormField[];
  }) => void;
}

function AgendaFormModal({
  isOpen,
  onClose,
  agenda,
  onSubmit
}: AgendaFormModalProps) {
  const isEdit = Boolean(agenda);

  const [activeTab, setActiveTab] = useState<"info" | "materi" | "form">("info");
  const [nama, setNama] = useState("");
  const [tipe, setTipe] = useState<"FORMAL" | "INFORMAL" | "NON_FORMAL">("FORMAL");

  // Materi
  const [materiList, setMateriList] = useState<KaderisasiMateri[]>([]);
  const [newMateriJudul, setNewMateriJudul] = useState("");

  // Form Fields
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<"file" | "text" | "textarea" | "select">("file");
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  const [newFieldOptions, setNewFieldOptions] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (agenda) {
      setNama(agenda.nama || "");
      setTipe(agenda.tipe || "FORMAL");
      setMateriList(agenda.materi && agenda.materi.length > 0 ? [...agenda.materi] : []);
      setFormFields(
        agenda.formFields && agenda.formFields.length > 0
          ? [...agenda.formFields]
          : [...DEFAULT_FORM_FIELDS]
      );
    } else {
      setNama("");
      setTipe("FORMAL");
      setMateriList([]);
      setFormFields([...DEFAULT_FORM_FIELDS]);
    }

    setActiveTab("info");
    setNewMateriJudul("");
    setNewFieldLabel("");
    setNewFieldType("file");
    setNewFieldRequired(true);
    setNewFieldOptions("");
  }, [isOpen, agenda]);

  if (!isOpen) return null;

  const handleAddMateri = () => {
    if (!newMateriJudul.trim()) return;
    setMateriList([
      ...materiList,
      { id: generateUUID(), judul: newMateriJudul.trim() }
    ]);
    setNewMateriJudul("");
  };

  const handleRemoveMateri = (id: string) => {
    setMateriList(materiList.filter((m) => m.id !== id));
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    let parsedOptions: string[] | undefined = undefined;
    if (newFieldType === "select" && newFieldOptions.trim()) {
      parsedOptions = newFieldOptions
        .split(",")
        .map((opt) => opt.trim())
        .filter(Boolean);
    }

    const field: FormField = {
      id: generateUUID(),
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      options: parsedOptions
    };

    setFormFields([...formFields, field]);
    setNewFieldLabel("");
    setNewFieldRequired(true);
    setNewFieldOptions("");
  };

  const handleRemoveField = (id: string) => {
    setFormFields(formFields.filter((f) => f.id !== id));
  };

  const handleMoveModalField = (index: number, direction: "up" | "down") => {
    const fields = [...formFields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const temp = fields[index];
    fields[index] = fields[targetIndex];
    fields[targetIndex] = temp;

    setFormFields(fields);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setActiveTab("info");
      return;
    }

    onSubmit({
      nama: nama.trim(),
      tipe,
      materi: materiList,
      formFields
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <Card className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden relative max-h-[90vh] flex flex-col text-zinc-900 dark:text-zinc-100">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              {isEdit ? "Edit Agenda Kaderisasi" : "Tambah Agenda Baru"}
            </h3>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab Bar (Consistent with EventFormModal) */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4 gap-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`py-2.5 cursor-pointer border-b-2 -mb-px transition-colors ${
                activeTab === "info"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Informasi
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("materi")}
              className={`py-2.5 cursor-pointer border-b-2 -mb-px transition-colors ${
                activeTab === "materi"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Materi ({materiList.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("form")}
              className={`py-2.5 cursor-pointer border-b-2 -mb-px transition-colors ${
                activeTab === "form"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Formulir ({formFields.length})
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3.5 overflow-y-auto flex-1 text-left">
            {/* TAB 1: INFORMASI */}
            {activeTab === "info" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Nama Agenda *
                  </label>
                  <Input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Misal: Masa Penerimaan Anggota Baru (MAPABA)"
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Tipe Kaderisasi *
                  </label>
                  <select
                    value={tipe}
                    onChange={(e) => setTipe(e.target.value as any)}
                    className="w-full h-8.5 px-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600"
                  >
                    <option value="FORMAL">FORMAL (MAPABA, PKD, PKL)</option>
                    <option value="INFORMAL">INFORMAL (Kajian, Diskusi, Halaqah)</option>
                    <option value="NON_FORMAL">NON FORMAL (Pelatihan, Workshop)</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 2: MATERI */}
            {activeTab === "materi" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newMateriJudul}
                    onChange={(e) => setNewMateriJudul(e.target.value)}
                    placeholder="Nama / Judul materi..."
                    className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddMateri();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddMateri}
                    disabled={!newMateriJudul.trim()}
                    className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg border-none cursor-pointer flex-shrink-0"
                  >
                    Tambah
                  </Button>
                </div>

                <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                  {materiList.length === 0 ? (
                    <div className="py-6 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                      Belum ada materi pembelajaran.
                    </div>
                  ) : (
                    materiList.map((m, idx) => (
                      <div
                        key={m.id}
                        className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 flex items-center justify-between text-xs"
                      >
                        <span className="text-zinc-800 dark:text-zinc-200 truncate">
                          {idx + 1}. {m.judul}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMateri(m.id)}
                          className="text-zinc-400 hover:text-rose-600 cursor-pointer p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: FORMULIR */}
            {activeTab === "form" && (
              <div className="space-y-3">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="text"
                      placeholder="Label Kolom (contoh: Scan KTM)"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg"
                    />

                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as any)}
                      className="h-8 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                    >
                      <option value="file">Unggah Berkas</option>
                      <option value="text">Teks Pendek</option>
                      <option value="textarea">Teks Panjang</option>
                      <option value="select">Dropdown</option>
                    </select>
                  </div>

                  {newFieldType === "select" && (
                    <Input
                      type="text"
                      placeholder="Opsi (pisahkan dengan koma, misal: S, M, L, XL)"
                      value={newFieldOptions}
                      onChange={(e) => setNewFieldOptions(e.target.value)}
                      className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg"
                    />
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="rounded text-blue-600 h-3.5 w-3.5"
                      />
                      <span>Wajib diisi</span>
                    </label>

                    <Button
                      type="button"
                      onClick={handleAddField}
                      disabled={!newFieldLabel.trim()}
                      className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md border-none cursor-pointer"
                    >
                      Tambah Kolom
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                  {formFields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-medium text-zinc-900 dark:text-white">
                            {field.label}
                            {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                          </span>
                          <span className="text-[10px] text-zinc-400 block font-mono">
                            {field.type}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveModalField(idx, "up")}
                          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-25 disabled:cursor-not-allowed p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                          title="Pindahkan ke atas"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={idx === formFields.length - 1}
                          onClick={() => handleMoveModalField(idx, "down")}
                          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-25 disabled:cursor-not-allowed p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                          title="Pindahkan ke bawah"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.id)}
                          className="text-zinc-400 hover:text-rose-600 cursor-pointer p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-1"
                          title="Hapus kolom"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              {isEdit ? "Simpan Perubahan" : "Simpan Agenda"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// -------------------------------------------------------------
// MODAL: DELETE AGENDA CONFIRMATION MODAL
// Consistent with DeleteEventModal.tsx
// -------------------------------------------------------------
interface DeleteAgendaModalProps {
  isOpen: boolean;
  agendaName: string;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteAgendaModal({
  isOpen,
  agendaName,
  onClose,
  onConfirm
}: DeleteAgendaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <Card className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden text-zinc-900 dark:text-zinc-100 text-left">
        <div className="p-4 space-y-2">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            Hapus Agenda?
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Hapus agenda <strong>&quot;{agendaName}&quot;</strong> beserta data materi dan formulirnya? Tindakan ini permanen.
          </p>
        </div>

        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-8 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer"
          >
            Batal
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            className="text-xs font-medium h-8 px-3.5 rounded-lg text-white bg-rose-600 hover:bg-rose-700 border-none cursor-pointer"
          >
            Hapus
          </Button>
        </div>
      </Card>
    </div>
  );
}
