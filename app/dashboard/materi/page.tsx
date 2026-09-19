"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Award,
  BookMarked,
  Download,
  Search,
  CheckCircle,
  HelpCircle,
  FileText,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";

import { toast } from "sonner";
import { db, Kaderisasi, DEFAULT_KURIKULUM } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { KaderisasiLevel, SyllabusItem, MaterialFile, QuizQuestion, FileAttachment } from "@/lib/db";

export default function KaderisasiPage() {
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
  const [quizSubjectName, setQuizSubjectName] = useState("");
  const [quizQuestionText, setQuizQuestionText] = useState("");
  const [quizOptionA, setQuizOptionA] = useState("");
  const [quizOptionB, setQuizOptionB] = useState("");
  const [quizOptionC, setQuizOptionC] = useState("");
  const [quizOptionD, setQuizOptionD] = useState("");
  const [quizCorrectAnswer, setQuizCorrectAnswer] = useState<number>(0);

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

  // Reset states on changing level
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
    if (!confirm("Apakah Anda yakin ingin menghapus pokok pembelajaran ini?")) return;
    const updatedSyllabus = selectedLevel.syllabus.filter(item => item.id !== id);
    const updatedLevel = { ...selectedLevel, syllabus: updatedSyllabus };
    updateData(updatedLevel);
    toast.success("Pokok pembelajaran berhasil dihapus!");
  };

  const handleSaveSyllabus = () => {
    if (!syllabusSubjectName.trim()) {
      toast.error("Nama materi wajib dipilih atau diisi!");
      return;
    }

    const cleanTujuan = syllabusTujuan.map(s => s.trim()).filter(Boolean);
    const cleanPokok = syllabusPokokPembahasan.map(s => s.trim()).filter(Boolean);
    const cleanMetode = syllabusMetode.map(s => s.trim()).filter(Boolean);
    const cleanProses = syllabusProsesKegiatan.map(s => s.trim()).filter(Boolean);
    const cleanHarapan = syllabusHarapan.map(s => s.trim()).filter(Boolean);

    let updatedSyllabus = [...selectedLevel.syllabus];
    if (editingSyllabus) {
      updatedSyllabus = updatedSyllabus.map(item =>
        item.id === editingSyllabus.id
          ? {
              ...item,
              subjectName: syllabusSubjectName.trim(),
              durationHours: syllabusDuration,
              description: cleanPokok.join("\n") || item.description || "",
              goal: cleanTujuan.join("; ") || item.goal || "",
              tujuan: cleanTujuan,
              pokokPembahasan: cleanPokok,
              metode: cleanMetode,
              prosesKegiatan: cleanProses,
              harapan: cleanHarapan
            }
          : item
      );
    } else {
      const newItem: SyllabusItem = {
        id: `${(selectedLevelId || "syl").toLowerCase()}-${Date.now()}`,
        subjectName: syllabusSubjectName.trim(),
        durationHours: syllabusDuration,
        description: cleanPokok.join("\n"),
        goal: cleanTujuan.join("; "),
        tujuan: cleanTujuan,
        pokokPembahasan: cleanPokok,
        metode: cleanMetode,
        prosesKegiatan: cleanProses,
        harapan: cleanHarapan
      };
      updatedSyllabus.push(newItem);
    }
    const updatedLevel = { ...selectedLevel, syllabus: updatedSyllabus };
    updateData(updatedLevel);
    setSyllabusModalOpen(false);
    toast.success(editingSyllabus ? "Pokok pembelajaran berhasil diperbarui!" : "Pokok pembelajaran berhasil ditambahkan!");
  };

  // Process multiple file uploads helper with progress callback
  const processFiles = async (
    files: FileList,
    onProgress?: (percent: number, currentFileName: string) => void
  ): Promise<FileAttachment[]> => {
    const newlyUploaded: FileAttachment[] = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      const startPercent = Math.round((i / total) * 100);
      onProgress?.(startPercent, file.name);

      if (file.size > 20 * 1024 * 1024) {
        toast.error(`Berkas "${file.name}" melebihi batas 20MB!`);
        continue;
      }

      const sizeInMB = file.size / (1024 * 1024);
      const formattedSize = sizeInMB < 0.1 
        ? `${(file.size / 1024).toFixed(1)} KB` 
        : `${sizeInMB.toFixed(1)} MB`;

      let finalUrl = "";
      const midPercent = Math.round(((i + 0.5) / total) * 100);
      onProgress?.(midPercent, file.name);

      try {
        if (isSupabaseConfigured && supabase) {
          const fileExt = file.name.split('.').pop();
          const filePath = `${selectedLevelId.toLowerCase()}/${Date.now()}-${i}.${fileExt}`;
          
          const { data, error } = await supabase.storage
            .from("materials")
            .upload(filePath, file, { cacheControl: "3600", upsert: true });

          if (!error && data) {
            const { data: publicUrlData } = supabase.storage
              .from("materials")
              .getPublicUrl(filePath);
            finalUrl = publicUrlData.publicUrl;
          }
        }
      } catch (err) {
        console.error("Storage upload exception:", err);
      }

      if (!finalUrl) {
        if (file.size < 1.5 * 1024 * 1024) {
          finalUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        } else {
          finalUrl = URL.createObjectURL(file);
        }
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

  // Materials CRUD Handlers
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
    setMaterialFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveRefFile = (index: number) => {
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
    if (!confirm("Apakah Anda yakin ingin menghapus materi ini?")) return;
    const updatedMaterials = selectedLevel.materials.filter(item => item.id !== id);
    const updatedLevel = { ...selectedLevel, materials: updatedMaterials };
    updateData(updatedLevel);
    toast.success("Materi berhasil dihapus!");
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
    const available = selectedAgenda?.materi || [];
    const firstMaterial = available[0]?.judul || "";
    setQuizSubjectName(firstMaterial);
    setQuizQuestionText("");
    setQuizOptionA("");
    setQuizOptionB("");
    setQuizOptionC("");
    setQuizOptionD("");
    setQuizCorrectAnswer(0);
    setQuizModalOpen(true);
  };

  const openEditQuiz = (item: QuizQuestion) => {
    setEditingQuiz(item);
    setQuizSubjectName(item.subjectName || item.materialTitle || "");
    setQuizQuestionText(item.question);
    setQuizOptionA(item.options[0] ?? "");
    setQuizOptionB(item.options[1] ?? "");
    setQuizOptionC(item.options[2] ?? "");
    setQuizOptionD(item.options[3] ?? "");
    setQuizCorrectAnswer(item.correctAnswer);
    setQuizModalOpen(true);
  };

  const handleDeleteQuiz = (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus soal ini?")) return;
    const updatedQuiz = selectedLevel.quiz.filter(item => item.id !== id);
    const reindexedQuiz = updatedQuiz.map((item, idx) => ({ ...item, id: idx + 1 }));
    const updatedLevel = { ...selectedLevel, quiz: reindexedQuiz };
    updateData(updatedLevel);
    toast.success("Soal evaluasi berhasil dihapus!");
  };

  const handleSaveQuiz = () => {
    if (!quizQuestionText.trim() || !quizOptionA.trim() || !quizOptionB.trim()) {
      toast.error("Pertanyaan dan opsi A & B wajib diisi!");
      return;
    }
    let updatedQuiz = [...selectedLevel.quiz];
    const options = [quizOptionA.trim(), quizOptionB.trim(), quizOptionC.trim(), quizOptionD.trim()].filter(Boolean);
    
    if (editingQuiz) {
      updatedQuiz = updatedQuiz.map(item =>
        item.id === editingQuiz.id
          ? {
              ...item,
              subjectName: quizSubjectName.trim(),
              materialTitle: quizSubjectName.trim(),
              question: quizQuestionText.trim(),
              options,
              correctAnswer: quizCorrectAnswer
            }
          : item
      );
    } else {
      const newItem: QuizQuestion = {
        id: selectedLevel.quiz.length + 1,
        subjectName: quizSubjectName.trim(),
        materialTitle: quizSubjectName.trim(),
        question: quizQuestionText.trim(),
        options,
        correctAnswer: quizCorrectAnswer
      };
      updatedQuiz.push(newItem);
    }
    const updatedLevel = { ...selectedLevel, quiz: updatedQuiz };
    updateData(updatedLevel);
    setQuizModalOpen(false);
    toast.success(editingQuiz ? "Soal evaluasi berhasil diperbarui!" : "Soal evaluasi baru berhasil ditambahkan!");
  };

  const getCategoryBadgeColor = (_cat?: string) => {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50";
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
      <div className="space-y-6 pb-12 overflow-hidden h-full flex flex-col font-sans">
        {/* HEADER BANNER */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-lg shrink-0 shadow-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                  Kurikulum & Materi Kaderisasi
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold text-[9px] border-none shadow-none uppercase">
                    Nasional
                  </Badge>
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5">
                  Pusat referensi silabus wajib, modul instruktur, berkas pendukung, dan evaluasi kelayakan berjenjang PMII.
                </p>
              </div>
            </div>
          </div>
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
    <div className="space-y-4 sm:space-y-6 pb-12 min-w-0 w-full flex flex-col font-sans">
      
      {/* HEADER BANNER */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 sm:p-5 rounded-lg shrink-0 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white shrink-0 mt-0.5 sm:mt-0">
              <GraduationCap className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                  Kurikulum & Materi Kaderisasi
                </h1>
                <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold text-[9px] border-none shadow-none uppercase shrink-0">
                  Nasional
                </Badge>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 leading-relaxed line-clamp-2 sm:line-clamp-none">
                Pusat referensi silabus wajib, modul instruktur, berkas pendukung, dan evaluasi kelayakan berjenjang PMII.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative w-full md:w-64">
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
      </div>

      {/* CARDS SESUAI DATA DI TABEL KADERISASI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {kaderisasiList.map((agenda) => {
          const isSelected = selectedAgenda?.id === agenda.id;
          const kur = kurikulumData[agenda.nama] || kurikulumData[agenda.id];
          const matCount = kur?.materials?.length || 0;
          const sylCount = kur?.syllabus?.length || 0;
          const quizCount = kur?.quiz?.length || 0;
          const isFormal = agenda.tipe === "FORMAL";
          const isInformal = agenda.tipe === "INFORMAL";

          return (
            <button
              key={agenda.id}
              onClick={() => handleLevelChange(agenda.id)}
              className={`text-left rounded-lg border p-3 sm:p-4 cursor-pointer relative transition-all outline-hidden ${
                isSelected
                  ? "border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-blue-600/30 dark:ring-blue-500/30 shadow-none"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-none"
              }`}
            >
              <div className="space-y-2 sm:space-y-3 flex flex-col justify-between h-full min-h-[95px] sm:min-h-[115px]">
                <div className="flex justify-between items-start gap-1">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    isSelected 
                      ? "bg-blue-600 text-white shadow-xs" 
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}>
                    <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <Badge className={`text-[9px] font-semibold tracking-wider uppercase rounded-md px-1.5 py-0.5 border shrink-0 shadow-none ${
                    isFormal
                      ? "border-blue-200 dark:border-blue-800/80 bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : isInformal
                      ? "border-purple-200 dark:border-purple-800/80 bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      : "border-emerald-200 dark:border-emerald-800/80 bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                  }`}>
                    {agenda.tipe.replace("_", " ")}
                  </Badge>
                </div>

                <div className="space-y-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 truncate">
                    {agenda.nama}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                    <span>{matCount} Materi</span>
                    <span>•</span>
                    <span>{sylCount} Silabus</span>
                    <span>•</span>
                    <span>{quizCount} Soal</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* CORE SYLLABUS WORKSPACE */}
      <div className="space-y-5">
        
        {/* TAB SELECTION NAVIGATION BAR */}
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg p-1 sm:p-1.5 shadow-none shrink-0">
          <div className="grid grid-cols-3 gap-1 sm:gap-1.5 w-full">
            {([
              { id: "MATERIALS", label: "Materi", shortLabel: "Materi", icon: Download },
              { id: "SYLLABUS", label: "Silabus", shortLabel: "Silabus", icon: BookMarked },
              { id: "QUIZ", label: "Pre Test & Post Test", shortLabel: "Pre & Post Test", icon: HelpCircle }
            ] as const).map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab.id)}
                  className={`justify-center text-[11px] sm:text-xs font-semibold px-1.5 sm:px-3 py-2 rounded-md cursor-pointer border-none flex items-center gap-1 sm:gap-1.5 transition-colors h-8 sm:h-9 ${
                    isActive
                      ? "bg-blue-600 text-white dark:bg-blue-600 dark:text-white shadow-none"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate hidden sm:inline">{tab.label}</span>
                  <span className="truncate sm:hidden">{tab.shortLabel}</span>
                </Button>
              );
            })}
          </div>
        </Card>

        {/* ACTIVE TAB CONTENT DISPLAY */}
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg overflow-hidden p-3.5 sm:p-5 shadow-none min-h-[400px]">
          
          {/* 1. MATERIALS TAB */}
          {activeTab === "MATERIALS" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Modul Resmi & Diktat Bacaan
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5">
                    Kompilasi e-book dan paper pendukung kaderisasi untuk bahan pre-reading/post-reading.
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                  <Button
                    onClick={openAddMaterial}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg h-8 px-3 cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-none flex-1 sm:flex-none"
                  >
                    <Plus className="w-3.5 h-3.5" /> Unggah Modul
                  </Button>
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-none shadow-none text-xs font-semibold rounded-md px-2.5 py-1 shrink-0">
                    {selectedLevel.materials.length} File
                  </Badge>
                </div>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLevel.materials.map(mat => {
                    const title = mat.title || mat.fileName;
                    const matList = mat.materialFiles && mat.materialFiles.length > 0
                      ? mat.materialFiles
                      : (mat.fileName ? [{ name: mat.fileName, size: mat.fileSize, url: mat.fileUrl || "" }] : []);
                    const refList = mat.referensiFiles || [];

                    return (
                      <div
                        key={mat.id}
                        className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50/40 dark:bg-zinc-950/40 hover:border-blue-500/50 transition-colors flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-3">
                          {/* Title & Actions */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-snug truncate" title={title}>
                                {title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/50 dark:border-blue-900/40">
                                  {matList.length} Berkas Materi
                                </span>
                                {refList.length > 0 && (
                                  <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200/50 dark:border-blue-900/40">
                                    {refList.length} Referensi
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditMaterial(mat)}
                                className="w-7 h-7 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                                title="Edit Materi"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMaterial(mat.id)}
                                className="w-7 h-7 rounded-md hover:bg-rose-500/10 text-zinc-500 hover:text-rose-600 cursor-pointer"
                                title="Hapus Materi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* List of Material Files */}
                          {matList.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                                Berkas Materi
                              </span>
                              <div className="space-y-1">
                                {matList.map((f, fIdx) => (
                                  <div
                                    key={fIdx}
                                    className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                      <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate" title={f.name}>
                                        {f.name}
                                      </span>
                                      <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                                        ({f.size})
                                      </span>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => handleDownloadFile(f.url, f.name, mat.id)}
                                      className="h-6 px-2 text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800 shadow-none rounded cursor-pointer shrink-0 flex items-center gap-1"
                                    >
                                      <Download className="w-3 h-3" /> Unduh
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* List of Referensi Files */}
                          {refList.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                                Berkas Referensi / Sumber
                              </span>
                              <div className="space-y-1">
                                {refList.map((r, rIdx) => (
                                  <div
                                    key={rIdx}
                                    className="flex items-center justify-between p-2 rounded-md bg-blue-50/20 dark:bg-blue-950/10 border border-blue-200/40 dark:border-blue-900/30 text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                      <BookMarked className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate" title={r.name}>
                                        {r.name}
                                      </span>
                                      <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                                        ({r.size})
                                      </span>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => handleDownloadFile(r.url, r.name, mat.id)}
                                      className="h-6 px-2 text-[10px] font-semibold bg-white hover:bg-blue-50 text-blue-700 dark:bg-zinc-900 dark:hover:bg-blue-950 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 shadow-none rounded cursor-pointer shrink-0 flex items-center gap-1"
                                    >
                                      <Download className="w-3 h-3" /> Unduh
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                          <span>Total Unduhan: {mat.downloadCount || 0}x</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. SYLLABUS TAB */}
            {activeTab === "SYLLABUS" && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                      Rencana Pokok Pembelajaran {selectedLevel.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5">
                      Rincian materi wajib kurikulum instruktur nasional PB PMII.
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    <Button
                      onClick={openAddSyllabus}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg h-8 px-3 cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-none flex-1 sm:flex-none"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Pokok Bahasan
                    </Button>
                    <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-none shadow-none text-xs font-semibold rounded-md px-2.5 py-1 shrink-0">
                      {selectedLevel.syllabus.length} Mata Kuliah
                    </Badge>
                  </div>
                </div>

                {filteredSyllabus.length === 0 ? (
                  <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                    <BookMarked className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
                    <span className="text-xs font-semibold text-zinc-400">Tidak ada materi ditemukan</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSyllabus.map((item) => {
                      const tujuanList = item.tujuan && item.tujuan.length > 0
                        ? item.tujuan
                        : (item.goal ? [item.goal] : []);
                      const pokokList = item.pokokPembahasan && item.pokokPembahasan.length > 0
                        ? item.pokokPembahasan
                        : (item.description ? [item.description] : []);
                      const metodeList = item.metode && item.metode.length > 0 ? item.metode : [];
                      const prosesList = item.prosesKegiatan && item.prosesKegiatan.length > 0 ? item.prosesKegiatan : [];
                      const harapanList = item.harapan && item.harapan.length > 0 ? item.harapan : [];

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 sm:p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/40 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 border border-blue-200/50 dark:border-blue-900/50">
                                <BookMarked className="w-3.5 h-3.5" />
                              </div>
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                {item.subjectName}
                              </h4>
                            </div>
                            <div className="flex flex-wrap gap-1.5 items-center justify-between sm:justify-end w-full sm:w-auto">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800/80 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                  <Clock className="w-3 h-3 text-zinc-400" /> {item.durationHours} Menit
                                </span>
                                {item.category && (
                                  <Badge className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${getCategoryBadgeColor(item.category)}`}>
                                    {item.category}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditSyllabus(item)}
                                  className="w-7 h-7 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                                  title="Edit Pokok Pembelajaran"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteSyllabus(item.id)}
                                  className="w-7 h-7 rounded-md hover:bg-rose-500/10 text-zinc-500 hover:text-rose-600 cursor-pointer"
                                  title="Hapus Pokok Pembelajaran"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Tujuan List */}
                          {tujuanList.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                                Tujuan Pembelajaran:
                              </span>
                              <ul className="list-disc list-inside space-y-0.5 text-xs text-zinc-600 dark:text-zinc-300 pl-1">
                                {tujuanList.map((t, tIdx) => (
                                  <li key={tIdx} className="leading-relaxed">
                                    {t}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Pokok Pembahasan List */}
                          {pokokList.length > 0 && (
                            <div className="space-y-1 pt-0.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                                Pokok Pembahasan:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {pokokList.map((p, pIdx) => (
                                  <div key={pIdx} className="text-xs p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start gap-1.5 text-zinc-700 dark:text-zinc-300">
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                                    <span>{p}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Metode & Proses Kegiatan & Harapan */}
                          {(metodeList.length > 0 || prosesList.length > 0 || harapanList.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                              {/* Metode */}
                              {metodeList.length > 0 && (
                                <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                                    Metode Pembelajaran:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {metodeList.map((m, mIdx) => (
                                      <span key={mIdx} className="text-[10px] font-medium bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50 px-2 py-0.5 rounded">
                                        {m}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Proses Kegiatan */}
                              {prosesList.length > 0 && (
                                <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                                    Proses Kegiatan:
                                  </span>
                                  <ul className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                                    {prosesList.map((pr, prIdx) => (
                                      <li key={prIdx} className="flex items-start gap-1">
                                        <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold shrink-0">{prIdx + 1}.</span>
                                        <span>{pr}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Harapan */}
                              {harapanList.length > 0 && (
                                <div className="bg-blue-50/30 dark:bg-blue-950/20 p-2.5 rounded-lg border border-blue-200/50 dark:border-blue-900/40 space-y-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                                    Harapan Pembelajaran:
                                  </span>
                                  <ul className="space-y-1 text-[11px] text-zinc-700 dark:text-zinc-300">
                                    {harapanList.map((h, hIdx) => (
                                      <li key={hIdx} className="flex items-start gap-1">
                                        <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">✓</span>
                                        <span>{h}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. PRE TEST & POST TEST TAB */}
            {activeTab === "QUIZ" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                      Pre Test & Post Test {selectedLevel.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5">
                      Bank soal evaluasi kesiapan (Pre-Test) atau penguasaan materi (Post-Test) untuk jenjang {selectedLevel.name}.
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    <Button
                      onClick={openAddQuiz}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg h-8 px-3 cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-none flex-1 sm:flex-none"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Soal
                    </Button>
                    <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-none shadow-none text-xs font-semibold rounded-md px-2.5 py-1 shrink-0">
                      {selectedLevel.quiz.length} Soal
                    </Badge>
                  </div>
                </div>

                {selectedLevel.quiz.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <HelpCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Belum ada soal pre-test / post-test</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 mb-3">
                      Tambahkan bank soal evaluasi untuk jenjang {selectedLevel.name}.
                    </p>
                    <Button
                      onClick={openAddQuiz}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg h-8 px-3 cursor-pointer border-none inline-flex items-center gap-1.5 shadow-none"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Soal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedLevel.quiz.map((q, idx) => (
                      <div key={q.id} className="space-y-3 p-3.5 sm:p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/40 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider shrink-0">
                              Soal Ke {idx + 1}
                            </span>
                            {(q.subjectName || q.materialTitle) && (
                              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50 text-[10px] font-semibold rounded px-2 py-0.5 shadow-none truncate max-w-[200px] sm:max-w-none">
                                {q.subjectName || q.materialTitle}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditQuiz(q)}
                              className="w-6 h-6 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                              title="Edit Soal"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteQuiz(q.id)}
                              className="w-6 h-6 rounded-md hover:bg-rose-500/10 text-zinc-500 hover:text-rose-600 cursor-pointer"
                              title="Hapus Soal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-relaxed">
                          {q.question}
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = q.correctAnswer === optIdx;
                            return (
                              <div
                                key={optIdx}
                                className={`p-2.5 rounded-lg border text-xs font-medium leading-normal flex items-start sm:items-center justify-between gap-2.5 ${
                                  isCorrect
                                    ? "border-blue-600/40 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold"
                                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                                }`}
                              >
                                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold font-mono shrink-0 mt-0.5 sm:mt-0 ${
                                    isCorrect
                                      ? "bg-blue-600 text-white"
                                      : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                                  }`}>
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="leading-relaxed break-words">{opt}</span>
                                </div>
                                {isCorrect && (
                                  <Badge className="bg-blue-600 text-white text-[9px] sm:text-[10px] font-semibold rounded px-1.5 sm:px-2 py-0.5 border-none shadow-none shrink-0 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    <span className="hidden sm:inline">Kunci Jawaban</span>
                                    <span className="sm:hidden">Kunci</span>
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
      </div>

      {/* 1. SYLLABUS EDIT/ADD DIALOG */}
      <Dialog open={syllabusModalOpen} onOpenChange={setSyllabusModalOpen}>
        <DialogContent className="sm:max-w-lg w-full max-w-[calc(100vw-1.5rem)] min-w-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 sm:p-6 shadow-xl">
          <DialogHeader className="min-w-0">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white truncate">
              {editingSyllabus ? "Edit Pokok Pembelajaran" : "Tambah Pokok Pembelajaran"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
              Masukkan rincian kurikulum wajib untuk jenjang {selectedLevel.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 w-full min-w-0 max-w-full overflow-hidden max-h-[75vh] overflow-y-auto pr-1">
            {/* 1. NAMA MATERI (SELECT DARI KADERISASI) & DURASI */}
            <div className="space-y-3 min-w-0 w-full">
              <div className="space-y-1.5 min-w-0 w-full">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Nama Materi <span className="text-blue-600 dark:text-blue-400">*</span>
                  </label>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    Dari Kaderisasi ({kaderisasiMateriList.length} materi)
                  </span>
                </div>

                {kaderisasiMateriList.length > 0 ? (
                  <Select
                    value={syllabusSubjectName}
                    onValueChange={(val: string | null) => {
                      if (val) setSyllabusSubjectName(val);
                    }}
                  >
                    <SelectTrigger className="w-full min-w-0 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none">
                      <SelectValue placeholder="Pilih Nama Materi dari Kaderisasi">
                        {syllabusSubjectName || "Pilih Nama Materi dari Kaderisasi"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg">
                      {Array.from(
                        new Set([
                          ...kaderisasiMateriList.map(m => m.judul).filter(Boolean),
                          ...(syllabusSubjectName ? [syllabusSubjectName] : [])
                        ])
                      ).map((mName, idx) => (
                        <SelectItem key={idx} value={mName}>
                          {mName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-1.5">
                    <Input
                      value={syllabusSubjectName}
                      onChange={(e) => setSyllabusSubjectName(e.target.value)}
                      placeholder="Masukkan nama materi (atau tambahkan materi di menu Kaderisasi terlebih dahulu)"
                      className="w-full min-w-0 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none"
                    />
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">
                      Catatan: Belum ada materi pembelajaran untuk jenjang ini di menu Kaderisasi. Anda dapat mengetik manual atau menambahkannya terlebih dahulu di menu Kaderisasi.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 min-w-0 w-full sm:w-1/2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Durasi (Menit)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={syllabusDuration}
                  onChange={(e) => setSyllabusDuration(Number(e.target.value))}
                  placeholder="90"
                  className="w-full min-w-0 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none"
                />
              </div>
            </div>

            {/* 2. TUJUAN (BISA LEBIH DARI 1) */}
            <div className="space-y-2 min-w-0 w-full pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Tujuan {syllabusTujuan.length > 0 && `(${syllabusTujuan.length})`}
                </label>
                <button
                  type="button"
                  onClick={() => setSyllabusTujuan(prev => [...prev, ""])}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent"
                >
                  + Tambah Tujuan
                </button>
              </div>

              <div className="space-y-1.5">
                {syllabusTujuan.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-400 w-4 text-right shrink-0">
                      {idx + 1}.
                    </span>
                    <Input
                      value={val}
                      onChange={(e) => {
                        const next = [...syllabusTujuan];
                        next[idx] = e.target.value;
                        setSyllabusTujuan(next);
                      }}
                      placeholder={`Tujuan ke-${idx + 1}...`}
                      className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none flex-1 min-w-0"
                    />
                    {syllabusTujuan.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSyllabusTujuan(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                        title="Hapus tujuan ini"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. POKOK PEMBAHASAN (BISA LEBIH DARI 1) */}
            <div className="space-y-2 min-w-0 w-full pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Pokok Pembahasan {syllabusPokokPembahasan.length > 0 && `(${syllabusPokokPembahasan.length})`}
                </label>
                <button
                  type="button"
                  onClick={() => setSyllabusPokokPembahasan(prev => [...prev, ""])}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent"
                >
                  + Tambah Pokok Pembahasan
                </button>
              </div>

              <div className="space-y-1.5">
                {syllabusPokokPembahasan.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-400 w-4 text-right shrink-0">
                      {idx + 1}.
                    </span>
                    <Input
                      value={val}
                      onChange={(e) => {
                        const next = [...syllabusPokokPembahasan];
                        next[idx] = e.target.value;
                        setSyllabusPokokPembahasan(next);
                      }}
                      placeholder={`Pokok pembahasan ke-${idx + 1}...`}
                      className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none flex-1 min-w-0"
                    />
                    {syllabusPokokPembahasan.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSyllabusPokokPembahasan(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                        title="Hapus pokok pembahasan ini"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 4. METODE (BISA LEBIH DARI 1) */}
            <div className="space-y-2 min-w-0 w-full pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Metode {syllabusMetode.length > 0 && `(${syllabusMetode.length})`}
                </label>
                <button
                  type="button"
                  onClick={() => setSyllabusMetode(prev => [...prev, ""])}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent"
                >
                  + Tambah Metode
                </button>
              </div>

              <div className="space-y-1.5">
                {syllabusMetode.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-400 w-4 text-right shrink-0">
                      {idx + 1}.
                    </span>
                    <Input
                      value={val}
                      onChange={(e) => {
                        const next = [...syllabusMetode];
                        next[idx] = e.target.value;
                        setSyllabusMetode(next);
                      }}
                      placeholder={`Metode ke-${idx + 1} (Contoh: Ceramah, Dialog, FGD, Simulasi...)`}
                      className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none flex-1 min-w-0"
                    />
                    {syllabusMetode.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSyllabusMetode(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                        title="Hapus metode ini"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 5. PROSES KEGIATAN (BISA LEBIH DARI 1) */}
            <div className="space-y-2 min-w-0 w-full pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Proses Kegiatan {syllabusProsesKegiatan.length > 0 && `(${syllabusProsesKegiatan.length})`}
                </label>
                <button
                  type="button"
                  onClick={() => setSyllabusProsesKegiatan(prev => [...prev, ""])}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent"
                >
                  + Tambah Proses Kegiatan
                </button>
              </div>

              <div className="space-y-1.5">
                {syllabusProsesKegiatan.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-400 w-4 text-right shrink-0">
                      {idx + 1}.
                    </span>
                    <Input
                      value={val}
                      onChange={(e) => {
                        const next = [...syllabusProsesKegiatan];
                        next[idx] = e.target.value;
                        setSyllabusProsesKegiatan(next);
                      }}
                      placeholder={`Tahap/kegiatan ke-${idx + 1} (Contoh: Orientasi sesi, pemaparan narasumber...)`}
                      className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none flex-1 min-w-0"
                    />
                    {syllabusProsesKegiatan.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSyllabusProsesKegiatan(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                        title="Hapus proses kegiatan ini"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 6. HARAPAN (BISA LEBIH DARI 1) */}
            <div className="space-y-2 min-w-0 w-full pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Harapan {syllabusHarapan.length > 0 && `(${syllabusHarapan.length})`}
                </label>
                <button
                  type="button"
                  onClick={() => setSyllabusHarapan(prev => [...prev, ""])}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent"
                >
                  + Tambah Harapan
                </button>
              </div>

              <div className="space-y-1.5">
                {syllabusHarapan.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-400 w-4 text-right shrink-0">
                      {idx + 1}.
                    </span>
                    <Input
                      value={val}
                      onChange={(e) => {
                        const next = [...syllabusHarapan];
                        next[idx] = e.target.value;
                        setSyllabusHarapan(next);
                      }}
                      placeholder={`Harapan ke-${idx + 1} (Contoh: Kader memiliki kesadaran kritis & komitmen...)`}
                      className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none flex-1 min-w-0"
                    />
                    {syllabusHarapan.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSyllabusHarapan(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                        title="Hapus harapan ini"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose render={<Button variant="outline" className="text-xs font-semibold rounded-lg h-8 px-3 cursor-pointer shadow-none" />}>
              Batal
            </DialogClose>
            <Button
              onClick={handleSaveSyllabus}
              className="text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white h-8 px-4 cursor-pointer shadow-none"
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. MATERIAL EDIT/ADD DIALOG */}
      <Dialog open={materialModalOpen} onOpenChange={setMaterialModalOpen}>
        <DialogContent className="sm:max-w-lg w-full max-w-[calc(100vw-1.5rem)] min-w-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 sm:p-6 shadow-xl">
          <DialogHeader className="min-w-0">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white truncate">
              {editingMaterial ? "Edit Materi Kaderisasi" : "Tambah Materi Kaderisasi"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
              Kelola nama materi, berkas materi, dan berkas referensi/sumber untuk jenjang {selectedLevel.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 w-full min-w-0 max-w-full overflow-hidden max-h-[70vh] overflow-y-auto pr-1">
            {/* 1. NAMA MATERI (SELECT DARI KADERISASI) */}
            <div className="space-y-1.5 min-w-0 w-full">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Nama Materi <span className="text-blue-600 dark:text-blue-400">*</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-normal">
                  Dari Kaderisasi ({kaderisasiMateriList.length} materi)
                </span>
              </div>

              {kaderisasiMateriList.length > 0 ? (
                <Select
                  value={materialTitle}
                  onValueChange={(val: string | null) => {
                    if (val) setMaterialTitle(val);
                  }}
                >
                  <SelectTrigger className="w-full min-w-0 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none">
                    <SelectValue placeholder="Pilih Nama Materi dari Kaderisasi">
                      {materialTitle || "Pilih Nama Materi dari Kaderisasi"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg">
                    {Array.from(
                      new Set([
                        ...kaderisasiMateriList.map(m => m.judul).filter(Boolean),
                        ...(materialTitle ? [materialTitle] : [])
                      ])
                    ).map((judul, idx) => (
                      <SelectItem key={idx} value={judul}>
                        {judul}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-1.5">
                  <Input
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    placeholder="Masukkan nama materi (atau tambahkan materi di menu Kaderisasi)"
                    className="w-full min-w-0 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none"
                  />
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">
                    Catatan: Belum ada materi pembelajaran untuk jenjang ini di menu Kaderisasi. Anda dapat mengetik manual atau menambahkannya terlebih dahulu di menu Kaderisasi.
                  </p>
                </div>
              )}
            </div>

            {/* 2. PILIH BERKAS MATERI (MULTIPLE FILES) */}
            <div className="space-y-2 min-w-0 w-full pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Berkas Materi {materialFiles.length > 0 && `(${materialFiles.length} file)`}
                </label>
                {materialFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => document.getElementById("material-files-input")?.click()}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent"
                  >
                    + Tambah Berkas Materi
                  </button>
                )}
              </div>
              
              <input
                id="material-files-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleMaterialFilesChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xlsx,.xls"
              />

              {materialFiles.length === 0 ? (
                <div 
                  onClick={() => document.getElementById("material-files-input")?.click()}
                  className="w-full border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-5 text-center hover:border-blue-600 dark:hover:border-blue-500 cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col items-center justify-center space-y-1.5 group"
                >
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg group-hover:scale-105 transition-transform text-blue-600 dark:text-blue-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Pilih berkas materi (Bisa &gt;1 file)
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    PDF, DOC, PPT, TXT, XLS (Maks 20MB per file)
                  </span>
                </div>
              ) : (
                <div className="w-full space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {materialFiles.map((file, idx) => (
                    <div 
                      key={idx}
                      className="w-full border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between gap-2 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                        <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate block w-full" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                          ({file.size})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterialFile(idx)}
                        className="text-zinc-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                        title="Hapus berkas ini"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadingMaterial && (
                <div className="w-full bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg p-3 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {materialProgress === 100 ? (
                        <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 block truncate text-xs">
                          {materialProgress === 100 ? "Selesai memproses berkas" : "Sedang memproses berkas materi..."}
                        </span>
                        {materialCurrentFile && (
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate font-mono">
                            {materialCurrentFile}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 shrink-0">
                      {materialProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${materialProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. PILIH BERKAS REFERENSI / SUMBER (MULTIPLE FILES) */}
            <div className="space-y-2 min-w-0 w-full pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Berkas Referensi / Sumber {referensiFiles.length > 0 && `(${referensiFiles.length} file)`}
                </label>
                {referensiFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => document.getElementById("ref-files-input")?.click()}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent"
                  >
                    + Tambah Berkas Referensi
                  </button>
                )}
              </div>
              
              <input
                id="ref-files-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleRefFilesChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xlsx,.xls"
              />

              {referensiFiles.length === 0 ? (
                <div 
                  onClick={() => document.getElementById("ref-files-input")?.click()}
                  className="w-full border border-dashed border-blue-200 dark:border-blue-900/60 rounded-lg p-5 text-center hover:border-blue-500 cursor-pointer transition-colors bg-blue-50/20 dark:bg-blue-950/10 flex flex-col items-center justify-center space-y-1.5 group"
                >
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-lg group-hover:scale-105 transition-transform text-blue-600 dark:text-blue-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Pilih berkas referensi/buku sumber (Bisa &gt;1 file)
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    Jurnal, e-book acuan, modul pembanding (Maks 20MB per file)
                  </span>
                </div>
              ) : (
                <div className="w-full space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {referensiFiles.map((file, idx) => (
                    <div 
                      key={idx}
                      className="w-full border border-blue-200/50 dark:border-blue-900/40 rounded-lg p-2 bg-blue-50/20 dark:bg-blue-950/20 flex items-center justify-between gap-2 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                        <BookMarked className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate block w-full" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                          ({file.size})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRefFile(idx)}
                        className="text-zinc-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                        title="Hapus referensi ini"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadingRef && (
                <div className="w-full bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg p-3 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {refProgress === 100 ? (
                        <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 block truncate text-xs">
                          {refProgress === 100 ? "Selesai memproses referensi" : "Sedang memproses berkas referensi..."}
                        </span>
                        {refCurrentFile && (
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate font-mono">
                            {refCurrentFile}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 shrink-0">
                      {refProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${refProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <DialogClose render={<Button variant="outline" className="text-xs font-semibold rounded-lg h-8 px-3 cursor-pointer shadow-none" />}>
              Batal
            </DialogClose>
            <Button
              onClick={handleSaveMaterial}
              className="text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white h-8 px-4 cursor-pointer shadow-none"
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. QUIZ QUESTION EDIT/ADD DIALOG */}
      <Dialog open={quizModalOpen} onOpenChange={setQuizModalOpen}>
        <DialogContent className="sm:max-w-lg w-full max-w-[calc(100vw-1.5rem)] min-w-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 sm:p-6 shadow-xl">
          <DialogHeader className="min-w-0">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white truncate">
              {editingQuiz ? "Edit Soal Evaluasi" : "Tambah Soal Evaluasi"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
              Formulir pembuatan soal pilihan ganda untuk Pre-Test & Post-Test {selectedLevel.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 w-full min-w-0 max-w-full overflow-hidden">
            {/* 1. NAMA MATERI (SELECT DARI KADERISASI) */}
            <div className="space-y-1.5 min-w-0 w-full">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Nama Materi
                </label>
                <span className="text-[10px] text-zinc-400 font-normal">
                  Dari Kaderisasi ({kaderisasiMateriList.length} materi)
                </span>
              </div>

              {kaderisasiMateriList.length > 0 ? (
                <Select
                  value={quizSubjectName}
                  onValueChange={(val: string | null) => {
                    if (val) setQuizSubjectName(val);
                  }}
                >
                  <SelectTrigger className="w-full min-w-0 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none">
                    <SelectValue placeholder="Pilih Nama Materi dari Kaderisasi">
                      {quizSubjectName || "Pilih Nama Materi dari Kaderisasi"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg">
                    {Array.from(
                      new Set([
                        ...kaderisasiMateriList.map(m => m.judul).filter(Boolean),
                        ...(quizSubjectName ? [quizSubjectName] : [])
                      ])
                    ).map((mName, idx) => (
                      <SelectItem key={idx} value={mName}>
                        {mName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-1.5">
                  <Input
                    value={quizSubjectName}
                    onChange={(e) => setQuizSubjectName(e.target.value)}
                    placeholder="Masukkan nama materi terkait soal ini"
                    className="w-full min-w-0 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none"
                  />
                  <p className="text-[10px] text-zinc-400">
                    Tips: Belum ada materi pembelajaran untuk jenjang ini di menu Kaderisasi. Anda dapat mengetik manual atau menambahkannya terlebih dahulu di menu Kaderisasi.
                  </p>
                </div>
              )}
            </div>

            {/* 2. PERTANYAAN */}
            <div className="space-y-1.5 min-w-0 w-full">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pertanyaan</label>
              <textarea
                value={quizQuestionText}
                onChange={(e) => setQuizQuestionText(e.target.value)}
                placeholder="Tuliskan pertanyaan kuis..."
                rows={2}
                className="w-full min-w-0 max-w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 focus:outline-none placeholder-zinc-400 text-zinc-900 dark:text-zinc-100 resize-none"
              />
            </div>

            {/* 3. PILIHAN JAWABAN */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Pilihan Jawaban</label>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 text-xs font-bold text-zinc-400">A.</span>
                  <Input
                    value={quizOptionA}
                    onChange={(e) => setQuizOptionA(e.target.value)}
                    placeholder="Pilihan A"
                    className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 text-xs font-bold text-zinc-400">B.</span>
                  <Input
                    value={quizOptionB}
                    onChange={(e) => setQuizOptionB(e.target.value)}
                    placeholder="Pilihan B"
                    className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 text-xs font-bold text-zinc-400">C.</span>
                  <Input
                    value={quizOptionC}
                    onChange={(e) => setQuizOptionC(e.target.value)}
                    placeholder="Pilihan C (Opsional)"
                    className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 text-xs font-bold text-zinc-400">D.</span>
                  <Input
                    value={quizOptionD}
                    onChange={(e) => setQuizOptionD(e.target.value)}
                    placeholder="Pilihan D (Opsional)"
                    className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 shadow-none"
                  />
                </div>
              </div>
            </div>

            {/* 4. PILIHAN JAWABAN BENAR (KUNCI) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Pilihan Jawaban Benar
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { idx: 0, letter: "A", text: quizOptionA },
                  { idx: 1, letter: "B", text: quizOptionB },
                  { idx: 2, letter: "C", text: quizOptionC },
                  { idx: 3, letter: "D", text: quizOptionD }
                ].map((item) => {
                  const isSelected = quizCorrectAnswer === item.idx;
                  const isAvailable = item.idx < 2 || item.text.trim().length > 0;
                  return (
                    <button
                      key={item.idx}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setQuizCorrectAnswer(item.idx)}
                      className={`h-10 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center justify-between gap-1.5 outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {item.letter}
                        </span>
                        <span className="truncate whitespace-nowrap">
                          Pilihan {item.letter}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose render={<Button variant="outline" className="text-xs font-semibold rounded-lg h-8 px-3 cursor-pointer shadow-none" />}>
              Batal
            </DialogClose>
            <Button
              onClick={handleSaveQuiz}
              className="text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white h-8 px-4 cursor-pointer shadow-none"
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

