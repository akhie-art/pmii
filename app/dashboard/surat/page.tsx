"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db";
import type { UserAccount } from "@/lib/db";
import { isRecordInTenant, enforceTenantWrite } from "@/lib/tenancy";
import {
  Mail,
  Plus,
  Search,
  Filter,
  Eye,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Send,
  UploadCloud,
  Trash2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Layers,
  LayoutGrid,
  List,
  FileCheck
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

import LetterGeneratorDialog from "./component/letter-generator-dialog";

interface MailItem {
  id: string;
  nomor: string;
  type?: "MASUK" | "KELUAR";
  senderOrRecipient: string;
  subject: string;
  date: string;
  classification: "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi";
  status: "Selesai" | "Diproses" | "Menunggu Tindak Lanjut" | "Terkirim";
  content: string;
  senderTitle: string;
  senderLocation: string;
  dateIndo: string;
  commissariat?: string;
  rayon?: string;
}

export default function SuratPage() {
  const [mounted, setMounted] = useState(false);
  const [incoming, setIncoming] = useState<MailItem[]>([]);
  const [outgoing, setOutgoing] = useState<MailItem[]>([]);
  const [activeTab, setActiveTab] = useState<"masuk" | "keluar">("masuk");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [mailToDelete, setMailToDelete] = useState<MailItem | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [copiedNomor, setCopiedNomor] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Pagination states
  const [currentIncomingPage, setCurrentIncomingPage] = useState(1);
  const [currentOutgoingPage, setCurrentOutgoingPage] = useState(1);
  const itemsPerPage = 6;

  // States for Recording New Mail Form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newMailType, setNewMailType] = useState<"MASUK" | "KELUAR">("MASUK");
  const [newNomor, setNewNomor] = useState("");
  const [newSenderRecipient, setNewSenderRecipient] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newClassification, setNewClassification] = useState<
    "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi"
  >("Instruksi");
  const [newContent, setNewContent] = useState("");
  const [newSenderTitle, setNewSenderTitle] = useState("");
  const [newSenderLocation, setNewSenderLocation] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing user session:", e);
        }
      }
    }

    const fetchSurat = async () => {
      const data = await db.getSurat();
      if (data && Array.isArray(data)) {
        setIncoming(data.filter((item: any) => item.type === "MASUK"));
        setOutgoing(data.filter((item: any) => item.type === "KELUAR"));
      }
      setMounted(true);
    };
    fetchSurat();
  }, []);

  useEffect(() => {
    setCurrentIncomingPage(1);
    setCurrentOutgoingPage(1);
  }, [searchQuery, selectedClass]);

  const filterList = (list: MailItem[]) => {
    return list.filter((item) => {
      const matchesSearch =
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nomor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.senderOrRecipient.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = selectedClass === "ALL" || item.classification === selectedClass;

      const matchesTenant =
        !item.commissariat ||
        isRecordInTenant(currentUser, {
          commissariat: item.commissariat,
          rayon: item.rayon
        });

      return matchesSearch && matchesClass && matchesTenant;
    });
  };

  const filteredIncoming = filterList(incoming);
  const filteredOutgoing = filterList(outgoing);

  const pendingIncomingCount = incoming.filter(
    (m) => m.status === "Menunggu Tindak Lanjut" || m.status === "Diproses"
  ).length;

  const incomingTotalPages = Math.ceil(filteredIncoming.length / itemsPerPage);
  const currentIncoming = filteredIncoming.slice(
    (currentIncomingPage - 1) * itemsPerPage,
    currentIncomingPage * itemsPerPage
  );

  const outgoingTotalPages = Math.ceil(filteredOutgoing.length / itemsPerPage);
  const currentOutgoing = filteredOutgoing.slice(
    (currentOutgoingPage - 1) * itemsPerPage,
    currentOutgoingPage * itemsPerPage
  );

  const handleRegisterMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNomor.trim() || !newSubject.trim() || !newSenderRecipient.trim()) return;

    const today = new Date().toISOString().split("T")[0];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const dateStr = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

    const newMail: MailItem = enforceTenantWrite<MailItem>(currentUser, {
      id: `${newMailType === "MASUK" ? "in" : "out"}-${Date.now()}`,
      nomor: newNomor,
      type: newMailType,
      senderOrRecipient: newSenderRecipient,
      subject: newSubject,
      date: today,
      classification: newClassification,
      status: newMailType === "MASUK" ? "Menunggu Tindak Lanjut" : "Terkirim",
      content: newContent || "Isi surat terlampir.",
      senderTitle: newSenderTitle || (newMailType === "MASUK" ? "Pengirim" : "PC PMII"),
      senderLocation: newSenderLocation || "Semarang",
      dateIndo: dateStr
    });

    const updatedInc = newMailType === "MASUK" ? [newMail, ...incoming] : incoming;
    const updatedOut = newMailType === "KELUAR" ? [newMail, ...outgoing] : outgoing;

    if (newMailType === "MASUK") setIncoming(updatedInc);
    else setOutgoing(updatedOut);

    await db.saveSurat([...updatedInc, ...updatedOut]);

    setNewNomor("");
    setNewSenderRecipient("");
    setNewSubject("");
    setNewContent("");
    setNewSenderTitle("");
    setNewSenderLocation("");
    setIsAddOpen(false);
    showToast(`Surat ${newMailType === "MASUK" ? "Masuk" : "Keluar"} berhasil dicatat!`);
  };

  const handlePublishCustomLetter = async (data: any) => {
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const dateStr = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

    const newMail: MailItem = enforceTenantWrite<MailItem>(currentUser, {
      id: `out-gen-${Date.now()}`,
      nomor: data.nomor,
      type: "KELUAR",
      senderOrRecipient: data.recipient,
      subject: data.subject,
      date: new Date().toISOString().split("T")[0],
      classification: data.classification,
      status: "Terkirim",
      content: data.content,
      senderTitle: data.senderTitle,
      senderLocation: data.senderLocation,
      dateIndo: dateStr
    });

    const updatedOut = [newMail, ...outgoing];
    setOutgoing(updatedOut);
    await db.saveSurat([...incoming, ...updatedOut]);
    showToast(`Surat resmi "${data.subject}" berhasil diterbitkan!`);
  };

  const confirmDeleteMail = async () => {
    if (!mailToDelete) return;
    const nomor = mailToDelete.nomor;
    if (mailToDelete.type === "MASUK") {
      const res = incoming.filter((i) => i.id !== mailToDelete.id);
      setIncoming(res);
      await db.saveSurat([...res, ...outgoing]);
    } else {
      const res = outgoing.filter((i) => i.id !== mailToDelete.id);
      setOutgoing(res);
      await db.saveSurat([...incoming, ...res]);
    }
    setMailToDelete(null);
    showToast(`Surat nomor ${nomor} berhasil dihapus.`);
  };

  const handleCopyNomor = (nomor: string) => {
    navigator.clipboard.writeText(nomor);
    setCopiedNomor(true);
    setTimeout(() => setCopiedNomor(false), 2000);
  };

  const getClassificationBadge = (cls: MailItem["classification"]) => {
    const variants = {
      Instruksi: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900",
      Permohonan: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-900",
      Undangan: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900",
      Rekomendasi: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900",
      Keputusan: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
    };
    return (
      <Badge className={`${variants[cls] || variants.Keputusan} text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2 shadow-none`}>
        {cls}
      </Badge>
    );
  };

  const getStatusBadge = (status: MailItem["status"]) => {
    if (status === "Selesai") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-[10px] font-semibold uppercase py-0.5 px-2 shadow-none">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
        </Badge>
      );
    }
    if (status === "Diproses") {
      return (
        <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-[10px] font-semibold uppercase py-0.5 px-2 shadow-none">
          <Clock className="w-3 h-3 mr-1" /> Diproses
        </Badge>
      );
    }
    if (status === "Terkirim") {
      return (
        <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[10px] font-semibold uppercase py-0.5 px-2 shadow-none">
          <Send className="w-3 h-3 mr-1" /> Terkirim
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[10px] font-semibold uppercase py-0.5 px-2 shadow-none animate-pulse">
        <AlertCircle className="w-3 h-3 mr-1" /> Menunggu Tindak Lanjut
      </Badge>
    );
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse pb-12">
        <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/3" />
        <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
      </div>
    );
  }

  const activeData = activeTab === "masuk" ? currentIncoming : currentOutgoing;
  const activeTotalFiltered = activeTab === "masuk" ? filteredIncoming.length : filteredOutgoing.length;
  const activeCurrentPage = activeTab === "masuk" ? currentIncomingPage : currentOutgoingPage;
  const activeTotalPages = activeTab === "masuk" ? incomingTotalPages : outgoingTotalPages;
  const setActivePage = activeTab === "masuk" ? setCurrentIncomingPage : setCurrentOutgoingPage;

  return (
    <div className="space-y-6 relative z-10 font-sans text-zinc-900 dark:text-zinc-100 pb-12">
      {/* TOAST NOTIFICATION (Sama seperti Verifikasi) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 right-6 z-50 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-zinc-700 dark:border-zinc-300"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HERO HEADER (Sama persis dengan pola Verifikasi) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 rounded-xl shadow-none">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white shadow-sm shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Administrasi Persuratan
              </h1>
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2">
                Tata Kelola Surat
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-xl leading-relaxed">
              Arsipkan surat masuk, pantau tindak lanjut, dan terbitkan lembaran surat keluar resmi organisasi secara digital.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
          {pendingIncomingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>{pendingIncomingCount} surat perlu ditindaklanjuti</span>
            </div>
          )}

          {/* Form Pencatatan Manual */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <Button
              onClick={() => setIsAddOpen(true)}
              className="bg-white hover:bg-zinc-50 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 font-medium px-3 h-9 text-xs rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Catat Surat</span>
            </Button>
            <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-lg w-full p-0 overflow-hidden">
              <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Registrasi Surat Baru
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Lengkapi metadata arsip persuratan untuk database PMII
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleRegisterMail}>
                <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                  {/* Toggle Jenis Surat */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Jenis Persuratan <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewMailType("MASUK")}
                        className={`p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                          newMailType === "MASUK"
                            ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-400 shadow-xs"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        <Mail className="w-4 h-4" />
                        <span>Surat Masuk</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewMailType("KELUAR")}
                        className={`p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                          newMailType === "KELUAR"
                            ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-400 shadow-xs"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        <span>Surat Keluar</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Nomor Surat <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        required
                        placeholder="Contoh: 021.PC-XI.Z-03..."
                        value={newNomor}
                        onChange={(e) => setNewNomor(e.target.value)}
                        className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Klasifikasi <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={newClassification}
                        onChange={(e) => setNewClassification(e.target.value as any)}
                        className="h-9 w-full text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Instruksi">Instruksi</option>
                        <option value="Permohonan">Permohonan</option>
                        <option value="Undangan">Undangan</option>
                        <option value="Keputusan">Keputusan</option>
                        <option value="Rekomendasi">Rekomendasi</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {newMailType === "MASUK" ? "Instansi Pengirim *" : "Instansi Tujuan *"}
                    </label>
                    <Input
                      required
                      placeholder={newMailType === "MASUK" ? "Contoh: PKC PMII Jawa Tengah" : "Contoh: PK PMII Rayon Dakwah"}
                      value={newSenderRecipient}
                      onChange={(e) => setNewSenderRecipient(e.target.value)}
                      className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Perihal / Hal Surat <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="Contoh: Undangan Rapat Kerja Cabang..."
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Penandatangan</label>
                      <Input
                        placeholder="Ketua / Sekretaris"
                        value={newSenderTitle}
                        onChange={(e) => setNewSenderTitle(e.target.value)}
                        className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Kota / Lokasi</label>
                      <Input
                        placeholder="Semarang"
                        value={newSenderLocation}
                        onChange={(e) => setNewSenderLocation(e.target.value)}
                        className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Ringkasan / Isi Pokok Surat
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tuliskan pokok perihal atau catatan penting terkait surat..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full text-xs p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[85px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 font-medium resize-y"
                    />
                  </div>
                </div>

                <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddOpen(false)}
                    className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="h-9 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    Simpan &amp; Arsipkan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Generator Pembuat Surat Digital */}
          <LetterGeneratorDialog onPublish={handlePublishCustomLetter} />
        </div>
      </div>

      {/* 2. TABS SELECTOR (Persis seperti Tabs di Verifikasi) */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-xs font-medium">
        {[
          {
            id: "masuk" as const,
            label: "Surat Masuk",
            icon: Mail,
            count: filteredIncoming.length,
            badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          },
          {
            id: "keluar" as const,
            label: "Surat Keluar",
            icon: Send,
            count: filteredOutgoing.length,
            badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 cursor-pointer border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${tab.badgeColor}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR (Persis seperti Verifikasi) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari perihal, nomor surat, atau instansi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span>Klasifikasi:</span>
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">Semua Klasifikasi</option>
            <option value="Instruksi">Instruksi</option>
            <option value="Permohonan">Permohonan</option>
            <option value="Undangan">Undangan</option>
            <option value="Keputusan">Keputusan</option>
            <option value="Rekomendasi">Rekomendasi</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 bg-zinc-50 dark:bg-zinc-950">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                viewMode === "cards"
                  ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                viewMode === "table"
                  ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. CONTENT DISPLAY (Card View atau Table View) */}
      {activeData.length === 0 ? (
        /* Empty State Card (Persis seperti Verifikasi) */
        <Card className="p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-center flex flex-col items-center justify-center space-y-3 bg-white dark:bg-zinc-900 shadow-none">
          <div className="w-11 h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
            <Mail className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Tidak Ada Surat Ditemukan
            </span>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {searchQuery || selectedClass !== "ALL"
                ? "Tidak ada arsip surat yang sesuai dengan kriteria pencarian atau klasifikasi yang dipilih."
                : activeTab === "masuk"
                ? "Belum ada arsip surat masuk yang tercatat di sistem."
                : "Belum ada arsip surat keluar yang diterbitkan di sistem."}
            </p>
          </div>
        </Card>
      ) : viewMode === "cards" ? (
        /* Card View (Persis seperti Card Submissions di Verifikasi) */
        <div className="space-y-3.5">
          {activeData.map((mail) => (
            <Card
              key={mail.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-none space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Mail info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-200/60 dark:border-blue-900/60 shrink-0 mt-0.5">
                    {mail.type === "MASUK" ? <Mail className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {mail.senderOrRecipient}
                      </span>
                      {getClassificationBadge(mail.classification)}
                      <span className="text-[10px] text-zinc-400">•</span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {mail.dateIndo || mail.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/40">
                        {mail.nomor}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {mail.subject}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
                      {mail.content ? mail.content.replace(/<[^>]*>?/gm, "") : "Isi surat terlampir."}
                    </p>
                  </div>
                </div>

                {/* Direct Action Link */}
                <div className="flex items-center gap-2 shrink-0 md:self-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyNomor(mail.nomor)}
                    className="h-8 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-zinc-500" />
                    <span>Salin No. Surat</span>
                  </Button>
                </div>
              </div>

              {/* Sender note if available */}
              {(mail.senderTitle || mail.senderLocation) && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Penandatangan &amp; Wilayah</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 text-xs leading-relaxed pl-5 font-medium">
                    {mail.senderTitle || "-"} • {mail.senderLocation || "-"}
                  </p>
                </div>
              )}

              {/* Action Bar (Persis seperti Verifikasi) */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400">Status:</span>
                  {getStatusBadge(mail.status)}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMailToDelete(mail)}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium h-8 px-2.5 rounded-lg cursor-pointer"
                    title="Hapus Surat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSelectedMail(mail)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-8 px-3.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Detail Surat</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-none bg-white dark:bg-zinc-900">
          <Table>
            <TableHeader className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <TableRow>
                <TableHead className="font-bold text-[11px] pl-6 py-3.5 text-zinc-600 dark:text-zinc-300">
                  Nomor &amp; Tanggal
                </TableHead>
                <TableHead className="font-bold text-[11px] py-3.5 text-zinc-600 dark:text-zinc-300">
                  {activeTab === "masuk" ? "Instansi Pengirim" : "Instansi Tujuan"}
                </TableHead>
                <TableHead className="font-bold text-[11px] py-3.5 text-zinc-600 dark:text-zinc-300">
                  Perihal / Hal
                </TableHead>
                <TableHead className="font-bold text-[11px] py-3.5 text-zinc-600 dark:text-zinc-300">
                  Klasifikasi
                </TableHead>
                <TableHead className="font-bold text-[11px] py-3.5 text-zinc-600 dark:text-zinc-300">
                  Status
                </TableHead>
                <TableHead className="font-bold text-[11px] text-center pr-6 py-3.5 text-zinc-600 dark:text-zinc-300">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeData.map((mail) => (
                <TableRow
                  key={mail.id}
                  className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  <TableCell className="pl-6 py-3.5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">{mail.nomor}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3" /> {mail.dateIndo || mail.date}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {mail.senderOrRecipient}
                  </TableCell>
                  <TableCell className="py-3.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 max-w-xs truncate">
                    {mail.subject}
                  </TableCell>
                  <TableCell className="py-3.5">{getClassificationBadge(mail.classification)}</TableCell>
                  <TableCell className="py-3.5">{getStatusBadge(mail.status)}</TableCell>
                  <TableCell className="text-center pr-6 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setSelectedMail(mail)}
                        className="rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                        title="Lihat Detail Surat"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setMailToDelete(mail)}
                        className="rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Hapus Surat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* 5. PAGINATION (Sama seperti Verifikasi) */}
      {activeTotalFiltered > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 px-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Menampilkan{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {(activeCurrentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {Math.min(activeCurrentPage * itemsPerPage, activeTotalFiltered)}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {activeTotalFiltered}
            </span>{" "}
            surat
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivePage((p) => Math.max(p - 1, 1))}
              disabled={activeCurrentPage === 1}
              className="h-8 px-3 text-xs rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-40 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
            </Button>
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 px-2">
              {activeCurrentPage} / {Math.max(1, activeTotalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivePage((p) => Math.min(p + 1, activeTotalPages))}
              disabled={activeCurrentPage >= activeTotalPages}
              className="h-8 px-3 text-xs rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-40 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 6. DIALOG DETAIL SURAT (Persis pola Dialog Review di Verifikasi) */}
      <Dialog open={!!selectedMail} onOpenChange={(open) => !open && setSelectedMail(null)}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-lg w-full p-0 overflow-hidden">
          {selectedMail && (
            <>
              <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Detail Arsip Surat
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono font-medium">
                      {selectedMail.nomor}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                {/* Meta details card */}
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                      {selectedMail.subject}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getClassificationBadge(selectedMail.classification)}
                      {getStatusBadge(selectedMail.status)}
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Tanggal: {selectedMail.dateIndo || selectedMail.date}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {selectedMail.type === "MASUK" ? "Instansi Pengirim" : "Instansi Tujuan"}
                    </span>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                      {selectedMail.senderOrRecipient}
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Penandatangan &amp; Wilayah
                    </span>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                      {selectedMail.senderTitle || "-"} • {selectedMail.senderLocation || "-"}
                    </p>
                  </div>
                </div>

                {/* Content section */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Isi / Ringkasan Pokok Surat
                  </label>
                  <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 max-h-52 overflow-y-auto">
                    {selectedMail.content ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedMail.content.replace(/\n/g, "<br/>") }} />
                    ) : (
                      "Tidak ada konten teks terlampir."
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between sm:justify-between w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyNomor(selectedMail.nomor)}
                  className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedNomor ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNomor ? "Tersalin!" : "Salin No. Surat"}</span>
                </Button>
                <DialogClose render={
                  <Button
                    type="button"
                    className="h-9 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    Tutup
                  </Button>
                } />
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 7. DIALOG KONFIRMASI HAPUS (Persis pola Verifikasi) */}
      <Dialog open={!!mailToDelete} onOpenChange={(open) => !open && setMailToDelete(null)}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-md w-full p-0 overflow-hidden">
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Konfirmasi Hapus Surat
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Tindakan ini permanen dan menghapus catatan dari database
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 sm:p-6 text-xs text-zinc-600 dark:text-zinc-400">
            Apakah Anda yakin ingin menghapus arsip surat nomor{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
              {mailToDelete?.nomor}
            </span>
            ? Data yang telah dihapus tidak dapat dipulihkan.
          </div>

          <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMailToDelete(null)}
              className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteMail}
              className="h-9 text-xs font-medium rounded-lg text-white bg-rose-600 hover:bg-rose-700 cursor-pointer"
            >
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}