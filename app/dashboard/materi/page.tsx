"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Download,
  BookMarked,
  HelpCircle,
  Search,
  ChevronRight,
  FileText,
  Plus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { useFeedbackModal } from "@/components/ui/feedback-modal";
import { db, Kaderisasi } from "@/lib/db";
import { supabase, isSupabaseConfigured, deleteStorageFile } from "@/lib/supabase";
import type {
  KaderisasiLevel,
  SyllabusItem,
  MaterialFile,
  QuizQuestion,
  FileAttachment
} from "./_components/types";

import { AgendaCards } from "./_components/AgendaCards";
import { MaterialsTab } from "./_components/MaterialsTab";
import { SyllabusTab } from "./_components/SyllabusTab";
import { QuizTab } from "./_components/QuizTab";
import { SyllabusModal } from "./_components/SyllabusModal";
import { MaterialModal } from "./_components/MaterialModal";
import { QuizModal } from "./_components/QuizModal";
import { DeleteConfirmationModal } from "./_components/DeleteConfirmationModal";

export default function KaderisasiPage() {
  const { showSuccess, showError, FeedbackModalComponent } = useFeedbackModal();
  const toast = {
    success: (msg: string) => showSuccess("Berhasil Disimpan", msg),
    error: (msg: string) => showError("Perhatian", msg)
  };

  const [kaderisasiList, setKaderisasiList] = useState<Kaderisasi[]>([]);
  const [kurikulumData, setKurikulumData] = useState<Record<string, KaderisasiLevel>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAgendaId, setSelectedAgendaId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"MATERIALS" | "SYLLABUS" | "QUIZ">("MATERIALS");
  const [searchQuery, setSearchQuery] = useState("");

  const selectedAgenda = kaderisasiList.find(k => k.id === selectedAgendaId) || kaderisasiList[0];
  const selectedLevelId = selectedAgenda ? selectedAgenda.nama : "";
  const kaderisasiMateriList = selectedAgenda?.materi || [];

  const selectedLevel: KaderisasiLevel = (
    selectedAgenda
      ? kurikulumData[selectedAgenda.nama] ||
        kurikulumData[selectedAgenda.id] ||
        {
          id: selectedAgenda.id,
          name: selectedAgenda.nama,
          syllabus: [],
          materials: [],
          quiz: []
        }
      : {
          id: "",
          name: "",
          syllabus: [],
          materials: [],
          quiz: []
        }
  );

  // CRUD Dialog States
  const [syllabusModalOpen, setSyllabusModalOpen] = useState(false);
  const [editingSyllabus, setEditingSyllabus] = useState<SyllabusItem | null>(null);
  const [syllabusSubjectName, setSyllabusSubjectName] = useState("");
  const [syllabusDuration, setSyllabusDuration] = useState<number>(90);
  const [syllabusTujuan, setSyllabusTujuan] = useState<string[]>([""]);
  const [syllabusPokokPembahasan, setSyllabusPokokPembahasan] = useState<string[]>([""]);
  const [syllabusMetode, setSyllabusMetode] = useState<string[]>([""]);
  const [syllabusProsesKegiatan, setSyllabusProsesKegiatan] = useState<string[]>([""]);
  const [syllabusHarapan, setSyllabusHarapan] = useState<string[]>([""]);

  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialFile | null>(null);
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialFiles, setMaterialFiles] = useState<FileAttachment[]>([]);
  const [referensiFiles, setReferensiFiles] = useState<FileAttachment[]>([]);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [materialProgress, setMaterialProgress] = useState(0);
  const [materialCurrentFile, setMaterialCurrentFile] = useState("");
  const [uploadingRef, setUploadingRef] = useState(false);
  const [refProgress, setRefProgress] = useState(0);
  const [refCurrentFile, setRefCurrentFile] = useState("");

  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizQuestion | null>(null);
  const [editingQuizSubject, setEditingQuizSubject] = useState<string | null>(null);
  const [editingQuizList, setEditingQuizList] = useState<QuizQuestion[] | null>(null);

  // Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: "MATERIAL" | "SYLLABUS" | "QUIZ";
    id: string | number;
    title: string;
    description: string;
    itemName: string;
  }>({
    isOpen: false,
    type: "MATERIAL",
    id: "",
    title: "",
    description: "",
    itemName: ""
  });

  // Load from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [kadList, kurMap] = await Promise.all([
          db.getKaderisasi(),
          db.getKurikulum()
        ]);
        setKaderisasiList(kadList || []);
        setKurikulumData(kurMap || {});
        if (kadList && kadList.length > 0) {
          setSelectedAgendaId(kadList[0].id);
        }
      } catch (e) {
        console.error("Error loading kaderisasi & kurikulum data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const updateData = async (updatedLevel: KaderisasiLevel) => {
    if (!selectedAgenda) return;
    const newData = {
      ...kurikulumData,
      [selectedAgenda.nama]: updatedLevel
    };
    setKurikulumData(newData);
    try {
      await db.saveKurikulum(newData);
    } catch (e) {
      console.error("Error saving kurikulum data to Supabase", e);
    }
  };

  const handleLevelChange = (agendaId: string) => {
    setSelectedAgendaId(agendaId);
    setActiveTab("MATERIALS");
  };

  // Syllabus CRUD Handlers
  const openAddSyllabus = () => {
    setEditingSyllabus(null);
    const available = selectedAgenda?.materi || [];
    const firstMaterial = available[0]?.judul || "";
    setSyllabusSubjectName(firstMaterial);
    setSyllabusDuration(90);
    setSyllabusTujuan([""]);
    setSyllabusPokokPembahasan([""]);
    setSyllabusMetode([""]);
    setSyllabusProsesKegiatan([""]);
    setSyllabusHarapan([""]);
    setSyllabusModalOpen(true);
  };

  const openEditSyllabus = (item: SyllabusItem) => {
    setEditingSyllabus(item);
    setSyllabusSubjectName(item.subjectName || "");
    setSyllabusDuration(item.durationHours || 2);
    setSyllabusTujuan(item.tujuan && item.tujuan.length > 0 ? item.tujuan : (item.goal ? [item.goal] : [""]));
    setSyllabusPokokPembahasan(item.pokokPembahasan && item.pokokPembahasan.length > 0 ? item.pokokPembahasan : (item.description ? [item.description] : [""]));
    setSyllabusMetode(item.metode && item.metode.length > 0 ? item.metode : [""]);
    setSyllabusProsesKegiatan(item.prosesKegiatan && item.prosesKegiatan.length > 0 ? item.prosesKegiatan : [""]);
    setSyllabusHarapan(item.harapan && item.harapan.length > 0 ? item.harapan : [""]);
    setSyllabusModalOpen(true);
  };

  const handleDeleteSyllabus = (id: string) => {
    const syl = selectedLevel.syllabus.find(s => s.id === id);
    setDeleteModalState({
      isOpen: true,
      type: "SYLLABUS",
      id,
      title: "Hapus Pokok Bahasan?",
      description: "Pokok bahasan ini akan dihapus secara permanen dari silabus kurikulum.",
      itemName: syl?.subjectName || "Pokok Bahasan"
    });
  };

  const handleSaveSyllabus = () => {
    if (!syllabusSubjectName.trim()) {
      toast.error("Nama materi wajib diisi!");
      return;
    }

    const cleanTujuan = syllabusTujuan.map(t => t.trim()).filter(Boolean);
    const cleanPokok = syllabusPokokPembahasan.map(p => p.trim()).filter(Boolean);
    const cleanMetode = syllabusMetode.map(m => m.trim()).filter(Boolean);
    const cleanProses = syllabusProsesKegiatan.map(pr => pr.trim()).filter(Boolean);
    const cleanHarapan = syllabusHarapan.map(h => h.trim()).filter(Boolean);

    let updatedSyllabus = [...selectedLevel.syllabus];

    if (editingSyllabus) {
      updatedSyllabus = updatedSyllabus.map(item =>
        item.id === editingSyllabus.id
          ? {
              ...item,
              subjectName: syllabusSubjectName.trim(),
              durationHours: Number(syllabusDuration) || 90,
              tujuan: cleanTujuan,
              goal: cleanTujuan[0] || "",
              pokokPembahasan: cleanPokok,
              description: cleanPokok[0] || "",
              metode: cleanMetode,
              prosesKegiatan: cleanProses,
              harapan: cleanHarapan
            }
          : item
      );
    } else {
      const newItem: SyllabusItem = {
        id: `syl-${(selectedLevelId || "syl").toLowerCase()}-${Date.now()}`,
        subjectName: syllabusSubjectName.trim(),
        durationHours: Number(syllabusDuration) || 90,
        tujuan: cleanTujuan,
        goal: cleanTujuan[0] || "",
        pokokPembahasan: cleanPokok,
        description: cleanPokok[0] || "",
        metode: cleanMetode,
        prosesKegiatan: cleanProses,
        harapan: cleanHarapan
      };
      updatedSyllabus.push(newItem);
    }

    const updatedLevel = { ...selectedLevel, syllabus: updatedSyllabus };
    updateData(updatedLevel);
    setSyllabusModalOpen(false);
    toast.success(editingSyllabus ? "Kurikulum berhasil diperbarui!" : "Materi baru berhasil ditambahkan ke kurikulum!");
  };

  // Process uploaded files
  const processFiles = async (
    files: FileList,
    onProgress?: (percent: number, currentName: string) => void
  ): Promise<FileAttachment[]> => {
    const newlyUploaded: FileAttachment[] = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      const startPercent = Math.round((i / total) * 100);
      onProgress?.(startPercent, file.name);

      let formattedSize = "1.0 MB";
      if (file.size < 1024 * 1024) {
        formattedSize = `${(file.size / 1024).toFixed(1)} KB`;
      } else {
        formattedSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      let finalUrl = "";
      if (isSupabaseConfigured && supabase) {
        try {
          const fileExt = file.name.split(".").pop();
          const cleanName = file.name.replace(/[^a-zA-Z0-9_-]/g, "_");
          const fileName = `materi_${Date.now()}_${cleanName}.${fileExt}`;
          const filePath = `kaderisasi/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("materials")
            .upload(filePath, file, { cacheControl: "3600", upsert: true });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("materials")
              .getPublicUrl(filePath);
            finalUrl = publicUrl;
          } else {
            console.warn("Storage upload warning, fallback to local URL:", uploadError.message);
            finalUrl = URL.createObjectURL(file);
          }
        } catch (err) {
          console.warn("Exception during Supabase storage upload:", err);
          finalUrl = URL.createObjectURL(file);
        }
      } else {
        finalUrl = URL.createObjectURL(file);
      }

      newlyUploaded.push({
        name: file.name,
        size: formattedSize,
        url: finalUrl
      });

      const endPercent = Math.round(((i + 1) / total) * 100);
      onProgress?.(endPercent, file.name);
    }

    return newlyUploaded;
  };

  const handleMaterialFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingMaterial(true);
    setMaterialProgress(10);
    setMaterialCurrentFile(files[0]?.name || "");

    const added = await processFiles(files, (percent, fileName) => {
      setMaterialProgress(percent);
      setMaterialCurrentFile(fileName);
    });

    setMaterialProgress(100);
    setTimeout(() => {
      setMaterialFiles(prev => [...prev, ...added]);
      setUploadingMaterial(false);
      setMaterialProgress(0);
      setMaterialCurrentFile("");
      toast.success(`${added.length} berkas materi berhasil ditambahkan!`);
    }, 450);

    e.target.value = "";
  };

  const handleRefFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingRef(true);
    setRefProgress(10);
    setRefCurrentFile(files[0]?.name || "");

    const added = await processFiles(files, (percent, fileName) => {
      setRefProgress(percent);
      setRefCurrentFile(fileName);
    });

    setRefProgress(100);
    setTimeout(() => {
      setReferensiFiles(prev => [...prev, ...added]);
      setUploadingRef(false);
      setRefProgress(0);
      setRefCurrentFile("");
      toast.success(`${added.length} berkas referensi berhasil ditambahkan!`);
    }, 450);

    e.target.value = "";
  };

  const handleRemoveMaterialFile = (index: number) => {
    const fileToRemove = materialFiles[index];
    if (fileToRemove?.url) {
      deleteStorageFile(fileToRemove.url).catch(() => {});
    }
    setMaterialFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveRefFile = (index: number) => {
    const fileToRemove = referensiFiles[index];
    if (fileToRemove?.url) {
      deleteStorageFile(fileToRemove.url).catch(() => {});
    }
    setReferensiFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const openAddMaterial = () => {
    setEditingMaterial(null);
    const available = selectedAgenda?.materi || [];
    const firstMaterial = available[0]?.judul || "";
    setMaterialTitle(firstMaterial);
    setMaterialFiles([]);
    setReferensiFiles([]);
    setUploadingMaterial(false);
    setMaterialProgress(0);
    setMaterialCurrentFile("");
    setUploadingRef(false);
    setRefProgress(0);
    setRefCurrentFile("");
    setMaterialModalOpen(true);
  };

  const openEditMaterial = (item: MaterialFile) => {
    setEditingMaterial(item);
    setMaterialTitle(item.title || item.fileName || "");
    const initialMatFiles = item.materialFiles && item.materialFiles.length > 0
      ? item.materialFiles
      : (item.fileName ? [{ name: item.fileName, size: item.fileSize, url: item.fileUrl || "" }] : []);
    const initialRefFiles = item.referensiFiles || [];
    setMaterialFiles(initialMatFiles);
    setReferensiFiles(initialRefFiles);
    setUploadingMaterial(false);
    setMaterialProgress(0);
    setMaterialCurrentFile("");
    setUploadingRef(false);
    setRefProgress(0);
    setRefCurrentFile("");
    setMaterialModalOpen(true);
  };

  const handleDeleteMaterial = (id: string) => {
    const mat = selectedLevel.materials.find(m => m.id === id);
    setDeleteModalState({
      isOpen: true,
      type: "MATERIAL",
      id,
      title: "Hapus Modul & Berkas?",
      description: "Modul dan seluruh berkas lampirannya akan dihapus secara permanen dari kurikulum dan cloud storage.",
      itemName: mat?.title || mat?.fileName || "Modul Materi"
    });
  };

  const handleSaveMaterial = () => {
    if (!materialTitle.trim()) {
      toast.error("Nama materi wajib diisi!");
      return;
    }
    if (materialFiles.length === 0 && referensiFiles.length === 0) {
      toast.error("Pilih minimal satu berkas materi atau berkas referensi!");
      return;
    }

    const primaryFile = materialFiles[0] || referensiFiles[0] || { name: materialTitle.trim(), size: "1.0 MB", url: "" };
    let updatedMaterials = [...selectedLevel.materials];

    if (editingMaterial) {
      // Hapus file-file lama dari storage jika dihapus saat edit
      const oldUrls: string[] = [];
      if (editingMaterial.fileUrl) oldUrls.push(editingMaterial.fileUrl);
      editingMaterial.materialFiles?.forEach(f => { if (f.url) oldUrls.push(f.url); });
      editingMaterial.referensiFiles?.forEach(f => { if (f.url) oldUrls.push(f.url); });

      const newUrls = new Set<string>();
      if (primaryFile.url) newUrls.add(primaryFile.url);
      materialFiles.forEach(f => { if (f.url) newUrls.add(f.url); });
      referensiFiles.forEach(f => { if (f.url) newUrls.add(f.url); });

      oldUrls.forEach(url => {
        if (!newUrls.has(url)) {
          deleteStorageFile(url).catch(() => {});
        }
      });

      updatedMaterials = updatedMaterials.map(item =>
        item.id === editingMaterial.id
          ? {
              ...item,
              title: materialTitle.trim(),
              fileName: primaryFile.name,
              fileSize: primaryFile.size,
              fileUrl: primaryFile.url,
              materialFiles,
              referensiFiles
            }
          : item
      );
    } else {
      const newItem: MaterialFile = {
        id: `mat-${(selectedLevelId || "mat").toLowerCase()}-${Date.now()}`,
        title: materialTitle.trim(),
        fileName: primaryFile.name,
        fileSize: primaryFile.size,
        downloadCount: 0,
        fileUrl: primaryFile.url,
        materialFiles,
        referensiFiles
      };
      updatedMaterials.push(newItem);
    }

    const updatedLevel = { ...selectedLevel, materials: updatedMaterials };
    updateData(updatedLevel);
    setMaterialModalOpen(false);
    toast.success(editingMaterial ? "Materi berhasil diperbarui!" : "Materi baru berhasil ditambahkan!");
  };

  const handleDownloadFile = (url: string, fileName: string, matId: string) => {
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const updatedMaterials = selectedLevel.materials.map(m => 
        m.id === matId ? { ...m, downloadCount: (m.downloadCount || 0) + 1 } : m
      );
      const updatedLevel = { ...selectedLevel, materials: updatedMaterials };
      updateData(updatedLevel);
      toast.success(`Mengunduh ${fileName}`);
    } else {
      alert(`Mengunduh berkas ${fileName} dari server cloud PMII...`);
    }
  };

  // Quiz CRUD Handlers
  const openAddQuiz = () => {
    setEditingQuiz(null);
    setEditingQuizSubject(null);
    setEditingQuizList(null);
    setQuizModalOpen(true);
  };

  const openEditQuiz = (item: QuizQuestion) => {
    setEditingQuiz(item);
    setEditingQuizSubject(null);
    setEditingQuizList(null);
    setQuizModalOpen(true);
  };

  const openEditSubjectQuiz = (subject: string, questions: QuizQuestion[]) => {
    setEditingQuiz(null);
    setEditingQuizSubject(subject);
    setEditingQuizList(questions);
    setQuizModalOpen(true);
  };

  const handleDeleteSubjectQuiz = (subject: string) => {
    setDeleteModalState({
      isOpen: true,
      type: "QUIZ",
      id: subject,
      title: `Hapus Bank Soal ${subject}?`,
      description: `Seluruh butir soal evaluasi untuk materi "${subject}" akan dihapus secara permanen dari sistem.`,
      itemName: `Materi ${subject}`
    });
  };

  const handleDeleteQuiz = (id: number) => {
    const q = selectedLevel.quiz.find(item => item.id === id);
    setDeleteModalState({
      isOpen: true,
      type: "QUIZ",
      id,
      title: "Hapus Soal Evaluasi?",
      description: "Butir soal pilihan ganda ini akan dihapus secara permanen dari bank soal pre-test & post-test.",
      itemName: q?.question || `Soal #${id}`
    });
  };

  const handleConfirmDelete = () => {
    const { type, id } = deleteModalState;
    if (type === "MATERIAL") {
      const matToDelete = selectedLevel.materials.find(m => m.id === id);
      if (matToDelete) {
        const urlsToDelete: string[] = [];
        if (matToDelete.fileUrl) urlsToDelete.push(matToDelete.fileUrl);
        matToDelete.materialFiles?.forEach(f => {
          if (f.url) urlsToDelete.push(f.url);
        });
        matToDelete.referensiFiles?.forEach(f => {
          if (f.url) urlsToDelete.push(f.url);
        });

        // Hapus semua file lampiran materi dari Supabase Storage
        urlsToDelete.forEach(u => {
          deleteStorageFile(u).catch(err => {
            console.warn("Gagal menghapus berkas materi dari storage:", err);
          });
        });
      }

      const updatedMaterials = selectedLevel.materials.filter(m => m.id !== id);
      const updatedLevel = { ...selectedLevel, materials: updatedMaterials };
      updateData(updatedLevel);
      toast.success("Modul materi dan berkas lampirannya berhasil dihapus!");
    } else if (type === "SYLLABUS") {
      const updatedSyllabus = selectedLevel.syllabus.filter(s => s.id !== id);
      const updatedLevel = { ...selectedLevel, syllabus: updatedSyllabus };
      updateData(updatedLevel);
      toast.success("Pokok bahasan silabus berhasil dihapus!");
    } else if (type === "QUIZ") {
      let updatedQuiz: QuizQuestion[];
      if (typeof id === "string") {
        updatedQuiz = selectedLevel.quiz.filter(
          q => (q.subjectName || q.materialTitle || "Materi Umum") !== id
        );
        toast.success(`Bank soal ${id} berhasil dihapus!`);
      } else {
        updatedQuiz = selectedLevel.quiz.filter(q => q.id !== id);
        toast.success("Soal evaluasi berhasil dihapus!");
      }
      const updatedLevel = { ...selectedLevel, quiz: updatedQuiz };
      updateData(updatedLevel);
    }
    setDeleteModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleSaveBatchQuiz = (
    savedQuestions: Array<{
      id?: number;
      subjectName: string;
      question: string;
      options: string[];
      correctAnswer: number;
      testType?: "PRE" | "POST" | "BOTH";
    }>
  ) => {
    if (savedQuestions.length === 0) return;

    let updatedQuiz = [...selectedLevel.quiz];

    if (editingQuizSubject) {
      const otherQuizzes = selectedLevel.quiz.filter(
        q => (q.subjectName || q.materialTitle || "Materi Umum") !== editingQuizSubject
      );
      const now = Date.now();
      const updatedQuestions: QuizQuestion[] = savedQuestions.map((q, idx) => ({
        id: q.id || (now + idx),
        subjectName: q.subjectName || editingQuizSubject,
        materialTitle: q.subjectName || editingQuizSubject,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        testType: q.testType || "BOTH"
      }));
      updatedQuiz = [...otherQuizzes, ...updatedQuestions];
      toast.success(`Soal evaluasi ${editingQuizSubject} berhasil diperbarui!`);
    } else if (editingQuiz) {
      const single = savedQuestions[0];
      updatedQuiz = updatedQuiz.map((item) =>
        item.id === editingQuiz.id
          ? {
              ...item,
              subjectName: single.subjectName,
              materialTitle: single.subjectName,
              question: single.question,
              options: single.options,
              correctAnswer: single.correctAnswer,
              testType: single.testType || "BOTH"
            }
          : item
      );
      toast.success("Soal evaluasi berhasil diperbarui!");
    } else {
      const now = Date.now();
      const newItems: QuizQuestion[] = savedQuestions.map((q, idx) => ({
        id: now + idx,
        subjectName: q.subjectName,
        materialTitle: q.subjectName,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        testType: q.testType || "BOTH"
      }));
      updatedQuiz = [...updatedQuiz, ...newItems];
      toast.success(
        newItems.length > 1
          ? `Berhasil menambahkan ${newItems.length} butir soal evaluasi!`
          : "Soal evaluasi baru berhasil ditambahkan!"
      );
    }

    const updatedLevel = { ...selectedLevel, quiz: updatedQuiz };
    updateData(updatedLevel);
    setQuizModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500 font-sans">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mb-4" />
        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Memuat data kurikulum...</p>
      </div>
    );
  }

  if (kaderisasiList.length === 0) {
    return (
      <div className="space-y-4 pb-12 overflow-hidden h-full flex flex-col font-sans">
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
              Materi
            </span>
          </nav>
        </div>

        {/* EMPTY STATE CARD */}
        <Card className="flex flex-col items-center justify-center border-dashed border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 rounded-lg text-center min-h-[400px] shadow-none">
          <GraduationCap className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mb-3" />
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Belum Ada Agenda Kaderisasi</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mt-1 mb-5 font-normal">
            Belum ada agenda kaderisasi di tabel kaderisasi. Silakan buat agenda kaderisasi terlebih dahulu di menu Sistem Kaderisasi.
          </p>
          <Button
            onClick={() => window.location.href = "/dashboard/kaderisasi"}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg h-9 px-4 cursor-pointer shadow-none"
          >
            Buka Sistem Kaderisasi
          </Button>
        </Card>
      </div>
    );
  }

  // Search through current active syllabus
  const filteredSyllabus = selectedLevel.syllabus.filter(s =>
    s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.tujuan && s.tujuan.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
    (s.pokokPembahasan && s.pokokPembahasan.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))) ||
    (s.metode && s.metode.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()))) ||
    (s.prosesKegiatan && s.prosesKegiatan.some(pr => pr.toLowerCase().includes(searchQuery.toLowerCase()))) ||
    (s.harapan && s.harapan.some(h => h.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="space-y-4 pb-12 min-w-0 w-full flex flex-col font-sans">
      {/* BREADCRUMB & TOOLBAR */}
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
            Materi
          </span>
        </nav>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari materi kurikulum..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-blue-600 dark:focus:border-blue-500 h-8 placeholder-zinc-400 shadow-none"
            />
          </div>
        </div>
      </div>

      {/* AGENDA CARDS */}
      <AgendaCards
        kaderisasiList={kaderisasiList}
        selectedAgendaId={selectedAgenda?.id || ""}
        kurikulumData={kurikulumData}
        onSelectAgenda={handleLevelChange}
      />

      {/* TABS & WORKSPACE */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* SEAMLESS TAB SELECTOR */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl w-full sm:w-auto border border-zinc-200/60 dark:border-zinc-700/60">
            {([
              {
                id: "MATERIALS",
                label: "Modul & Bacaan",
                shortLabel: "Modul",
                count: selectedLevel.materials.length,
                icon: FileText
              },
              {
                id: "SYLLABUS",
                label: "Silabus Pembelajaran",
                shortLabel: "Silabus",
                count: selectedLevel.syllabus.length,
                icon: BookMarked
              },
              {
                id: "QUIZ",
                label: "Pre & Post Test",
                shortLabel: "Evaluasi",
                count: selectedLevel.quiz.length,
                icon: HelpCircle
              }
            ] as const).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    isActive
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isActive
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                        : "bg-zinc-200/60 dark:bg-zinc-700/50 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ACTION BUTTON FOR ACTIVE TAB */}
          <div className="flex items-center gap-2">
            {activeTab === "MATERIALS" && (
              <Button
                onClick={openAddMaterial}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg h-8 px-3.5 cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-xs w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Unggah Modul</span>
              </Button>
            )}
            {activeTab === "SYLLABUS" && (
              <Button
                onClick={openAddSyllabus}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg h-8 px-3.5 cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-xs w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pokok Bahasan</span>
              </Button>
            )}
            {activeTab === "QUIZ" && (
              <Button
                onClick={openAddQuiz}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg h-8 px-3.5 cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-xs w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Soal</span>
              </Button>
            )}
          </div>
        </div>

        {/* WORKSPACE CONTENT CONTAINER */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-5 shadow-none min-h-[420px]">
          {activeTab === "MATERIALS" && (
            <MaterialsTab
              selectedLevel={selectedLevel}
              onOpenAddMaterial={openAddMaterial}
              onOpenEditMaterial={openEditMaterial}
              onDeleteMaterial={handleDeleteMaterial}
              onDownloadFile={handleDownloadFile}
            />
          )}

          {activeTab === "SYLLABUS" && (
            <SyllabusTab
              selectedLevel={selectedLevel}
              filteredSyllabus={filteredSyllabus}
              onOpenAddSyllabus={openAddSyllabus}
              onOpenEditSyllabus={openEditSyllabus}
              onDeleteSyllabus={handleDeleteSyllabus}
            />
          )}

          {activeTab === "QUIZ" && (
            <QuizTab
              selectedLevel={selectedLevel}
              onOpenAddQuiz={openAddQuiz}
              onOpenEditSubject={openEditSubjectQuiz}
              onDeleteSubject={handleDeleteSubjectQuiz}
            />
          )}
        </div>
      </div>

      {/* SYLLABUS MODAL */}
      <SyllabusModal
        isOpen={syllabusModalOpen}
        onOpenChange={setSyllabusModalOpen}
        editingSyllabus={editingSyllabus}
        selectedLevel={selectedLevel}
        kaderisasiMateriList={kaderisasiMateriList}
        syllabusSubjectName={syllabusSubjectName}
        setSyllabusSubjectName={setSyllabusSubjectName}
        syllabusDuration={syllabusDuration}
        setSyllabusDuration={setSyllabusDuration}
        syllabusTujuan={syllabusTujuan}
        setSyllabusTujuan={setSyllabusTujuan}
        syllabusPokokPembahasan={syllabusPokokPembahasan}
        setSyllabusPokokPembahasan={setSyllabusPokokPembahasan}
        syllabusMetode={syllabusMetode}
        setSyllabusMetode={setSyllabusMetode}
        syllabusProsesKegiatan={syllabusProsesKegiatan}
        setSyllabusProsesKegiatan={setSyllabusProsesKegiatan}
        syllabusHarapan={syllabusHarapan}
        setSyllabusHarapan={setSyllabusHarapan}
        onSaveSyllabus={handleSaveSyllabus}
      />

      {/* MATERIAL MODAL */}
      <MaterialModal
        isOpen={materialModalOpen}
        onOpenChange={setMaterialModalOpen}
        editingMaterial={editingMaterial}
        selectedLevel={selectedLevel}
        kaderisasiMateriList={kaderisasiMateriList}
        materialTitle={materialTitle}
        setMaterialTitle={setMaterialTitle}
        materialFiles={materialFiles}
        referensiFiles={referensiFiles}
        uploadingMaterial={uploadingMaterial}
        materialProgress={materialProgress}
        materialCurrentFile={materialCurrentFile}
        uploadingRef={uploadingRef}
        refProgress={refProgress}
        refCurrentFile={refCurrentFile}
        onMaterialFilesChange={handleMaterialFilesChange}
        onRefFilesChange={handleRefFilesChange}
        onRemoveMaterialFile={handleRemoveMaterialFile}
        onRemoveRefFile={handleRemoveRefFile}
        onSaveMaterial={handleSaveMaterial}
      />

      {/* QUIZ MODAL */}
      <QuizModal
        isOpen={quizModalOpen}
        onOpenChange={setQuizModalOpen}
        editingQuiz={editingQuiz}
        editingSubject={editingQuizSubject}
        editingQuizzes={editingQuizList}
        selectedLevel={selectedLevel}
        kaderisasiMateriList={kaderisasiMateriList}
        onSaveQuizzes={handleSaveBatchQuiz}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isOpen={deleteModalState.isOpen}
        title={deleteModalState.title}
        description={deleteModalState.description}
        itemName={deleteModalState.itemName}
        onClose={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
      />

      {FeedbackModalComponent}
    </div>
  );
}
