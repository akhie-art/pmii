"use client";

import React, { useState, useEffect, useRef } from "react";
import { exportToExcel, readSpreadsheetToObjects } from "@/lib/excel";
import {
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  X,
  Upload,
  Download,
  FileSpreadsheet
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import type { QuizQuestion, KaderisasiLevel } from "./types";
import type { KaderisasiMateri } from "@/lib/db";

interface QuestionDraft {
  tempId: string;
  subjectName: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: number;
  testType: "BOTH" | "PRE" | "POST";
}

interface QuizModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingQuiz?: QuizQuestion | null;
  editingSubject?: string | null;
  editingQuizzes?: QuizQuestion[] | null;
  selectedLevel: KaderisasiLevel;
  kaderisasiMateriList: KaderisasiMateri[];
  onSaveQuizzes: (
    quizzes: Array<{
      id?: number;
      subjectName: string;
      question: string;
      options: string[];
      correctAnswer: number;
      testType?: "PRE" | "POST" | "BOTH";
    }>
  ) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onOpenChange,
  editingQuiz,
  editingSubject,
  editingQuizzes,
  selectedLevel,
  kaderisasiMateriList,
  onSaveQuizzes
}) => {
  const defaultSubject =
    editingSubject ||
    kaderisasiMateriList[0]?.judul ||
    (selectedLevel.name ? `Materi ${selectedLevel.name}` : "Materi Umum");

  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [globalSubject, setGlobalSubject] = useState<string>(defaultSubject);
  const [globalTestType, setGlobalTestType] = useState<"BOTH" | "PRE" | "POST">("BOTH");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importInfo, setImportInfo] = useState<{
    imported: number;
    skipped: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setImportInfo(null);
      if (editingQuizzes && editingQuizzes.length > 0) {
        const sub =
          editingSubject ||
          editingQuizzes[0].subjectName ||
          editingQuizzes[0].materialTitle ||
          defaultSubject;
        setDrafts(
          editingQuizzes.map((q, idx) => ({
            tempId: `draft-${q.id || idx}`,
            subjectName: q.subjectName || q.materialTitle || sub,
            question: q.question || "",
            optionA: q.options?.[0] || "",
            optionB: q.options?.[1] || "",
            optionC: q.options?.[2] || "",
            optionD: q.options?.[3] || "",
            correctAnswer: q.correctAnswer ?? 0,
            testType: q.testType || "BOTH"
          }))
        );
        setGlobalSubject(sub);
      } else if (editingQuiz) {
        const sub =
          editingQuiz.subjectName || editingQuiz.materialTitle || defaultSubject;
        setDrafts([
          {
            tempId: `draft-${editingQuiz.id}`,
            subjectName: sub,
            question: editingQuiz.question || "",
            optionA: editingQuiz.options?.[0] || "",
            optionB: editingQuiz.options?.[1] || "",
            optionC: editingQuiz.options?.[2] || "",
            optionD: editingQuiz.options?.[3] || "",
            correctAnswer: editingQuiz.correctAnswer ?? 0,
            testType: editingQuiz.testType || "BOTH"
          }
        ]);
        setGlobalSubject(sub);
      } else {
        setDrafts([
          {
            tempId: `draft-${Date.now()}-0`,
            subjectName: defaultSubject,
            question: "",
            optionA: "",
            optionB: "",
            optionC: "",
            optionD: "",
            correctAnswer: 0,
            testType: globalTestType || "BOTH"
          }
        ]);
        setGlobalSubject(defaultSubject);
      }
    }
  }, [isOpen, editingQuiz, editingQuizzes, editingSubject, defaultSubject]);

  const updateDraft = (index: number, field: keyof QuestionDraft, value: any) => {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const handleApplyGlobalSubject = (subject: string) => {
    setGlobalSubject(subject);
    setDrafts((prev) => prev.map((d) => ({ ...d, subjectName: subject })));
  };

  const handleApplyGlobalTestType = (type: "BOTH" | "PRE" | "POST") => {
    setGlobalTestType(type);
    setDrafts((prev) => prev.map((d) => ({ ...d, testType: type })));
  };

  const handleAddQuestion = () => {
    setErrorMsg(null);
    const lastDraft = drafts[drafts.length - 1];
    const newDraft: QuestionDraft = {
      tempId: `draft-${Date.now()}-${drafts.length}`,
      subjectName: lastDraft?.subjectName || defaultSubject,
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: 0,
      testType: lastDraft?.testType || "BOTH"
    };
    setDrafts((prev) => [...prev, newDraft]);
  };

  const handleDuplicateQuestion = (index: number) => {
    setErrorMsg(null);
    const source = drafts[index];
    const duplicated: QuestionDraft = {
      ...source,
      tempId: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
    const updated = [...drafts];
    updated.splice(index + 1, 0, duplicated);
    setDrafts(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    if (drafts.length <= 1) return;
    setErrorMsg(null);
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  // ===== IMPORT EXCEL =====
  const normalizeHeader = (h: unknown) =>
    String(h ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const HEADER_ALIASES: Record<string, string[]> = {
    question: ["pertanyaan", "soal", "question", "butirsoal"],
    a: ["pilihana", "opsia", "jawabana", "a"],
    b: ["pilihanb", "opsib", "jawabanb", "b"],
    c: ["pilihanc", "opsic", "jawabanc", "c"],
    d: ["pilihand", "opsid", "jawaband", "d"],
    answer: ["jawaban", "kunci", "kuncijawaban", "jawabanbenar", "answer", "key"],
    type: ["jenistes", "jenis", "kategori", "tipe", "tipetes", "testtype", "pretestposttest"],
    subject: ["materi", "materipokok", "mapel", "subject", "subjek"]
  };

  const handleDownloadTemplate = async () => {
    const subject = globalSubject || defaultSubject;
    const rows = [
      {
        Pertanyaan: "Apa kepanjangan dari PMII?",
        "Pilihan A": "Pergerakan Mahasiswa Islam Indonesia",
        "Pilihan B": "Persatuan Mahasiswa Islam Indonesia",
        "Pilihan C": "Perhimpunan Mahasiswa Islam Indonesia",
        "Pilihan D": "Perkumpulan Mahasiswa Islam Indonesia",
        Jawaban: "A",
        "Jenis Tes": "Pre & Post",
        Materi: subject
      },
      {
        Pertanyaan: "Contoh soal khusus Pre-Test (hapus baris ini)",
        "Pilihan A": "Jawaban 1",
        "Pilihan B": "Jawaban 2",
        "Pilihan C": "",
        "Pilihan D": "",
        Jawaban: "B",
        "Jenis Tes": "Pre",
        Materi: subject
      }
    ];
    await exportToExcel(
      `Template_Soal_${(selectedLevel.name || "Evaluasi").replace(/\s+/g, "_")}.xlsx`,
      [
        {
          name: "Soal",
          rows,
          colWidths: [50, 30, 30, 30, 30, 10, 14, 28],
        },
        {
          name: "Panduan",
          aoa: [
            ["Panduan Pengisian"],
            ["Pertanyaan", "Wajib diisi."],
            ["Pilihan A & B", "Wajib diisi. Pilihan C & D opsional."],
            ["Jawaban", "Isi huruf pilihan benar: A, B, C, atau D (angka 1-4 juga bisa)."],
            ["Jenis Tes", "Opsional: Pre, Post, atau Pre & Post. Kosong = mengikuti pengaturan modal."],
            ["Materi", "Opsional. Kosong = mengikuti materi yang dipilih di modal."],
          ],
          colWidths: [18, 90],
        },
      ]
    );
  };

  const parseTestType = (raw: string): "BOTH" | "PRE" | "POST" | null => {
    const v = raw.toLowerCase().replace(/[^a-z]/g, "");
    if (!v) return null;
    if (v === "pre" || v === "pretest") return "PRE";
    if (v === "post" || v === "posttest") return "POST";
    if (v.includes("pre") && v.includes("post")) return "BOTH";
    if (v === "both" || v === "keduanya" || v === "semua") return "BOTH";
    return null;
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setErrorMsg(null);
    setImportInfo(null);

    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setErrorMsg("Format berkas tidak didukung. Gunakan .xlsx, .xls, atau .csv.");
      return;
    }

    setIsImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const { rows: rawRows } = await readSpreadsheetToObjects(buffer, {
        fileName: file.name,
        skipSheetNames: ["panduan"],
      });

      if (rawRows.length === 0) {
        setErrorMsg("Berkas kosong. Isi minimal satu baris soal di bawah header.");
        return;
      }

      // Peta header berkas -> kunci internal
      const headerMap: Record<string, string> = {};
      Object.keys(rawRows[0]).forEach((h) => {
        const norm = normalizeHeader(h);
        for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
          if (aliases.includes(norm) && !Object.values(headerMap).includes(key)) {
            headerMap[h] = key;
            break;
          }
        }
      });

      const mapped = Object.values(headerMap);
      const missing = ["question", "a", "b", "answer"].filter((k) => !mapped.includes(k));
      if (missing.length > 0) {
        const label: Record<string, string> = {
          question: "Pertanyaan",
          a: "Pilihan A",
          b: "Pilihan B",
          answer: "Jawaban"
        };
        setErrorMsg(
          `Kolom wajib tidak ditemukan: ${missing.map((k) => label[k]).join(", ")}. Unduh template untuk melihat format yang benar.`
        );
        return;
      }

      const imported: QuestionDraft[] = [];
      const skipped: string[] = [];
      const stamp = Date.now();

      rawRows.forEach((row, i) => {
        const rowNo = i + 2; // baris 1 = header
        const cell: Record<string, string> = {};
        Object.entries(row).forEach(([h, v]) => {
          const key = headerMap[h];
          if (key) cell[key] = String(v ?? "").trim();
        });

        const isEmptyRow = Object.values(cell).every((v) => !v);
        if (isEmptyRow) return;

        if (!cell.question) {
          skipped.push(`Baris ${rowNo}: pertanyaan kosong`);
          return;
        }
        if (!cell.a || !cell.b) {
          skipped.push(`Baris ${rowNo}: Pilihan A dan B wajib diisi`);
          return;
        }

        // Susun opsi tanpa celah, ingat posisi aslinya agar kunci tetap benar
        const original = [cell.a, cell.b, cell.c || "", cell.d || ""];
        const compact: string[] = [];
        const originalToCompact: Record<number, number> = {};
        original.forEach((txt, idx) => {
          if (txt) {
            originalToCompact[idx] = compact.length;
            compact.push(txt);
          }
        });

        // Tentukan indeks jawaban (huruf, angka, atau teks pilihan)
        const ans = (cell.answer || "").trim();
        let ansIdx = -1;
        if (/^[a-dA-D]$/.test(ans)) ansIdx = ans.toUpperCase().charCodeAt(0) - 65;
        else if (/^[1-4]$/.test(ans)) ansIdx = parseInt(ans, 10) - 1;
        else {
          const m = original.findIndex((t) => t && t.toLowerCase() === ans.toLowerCase());
          ansIdx = m;
        }

        if (!ans) {
          skipped.push(`Baris ${rowNo}: jawaban kosong`);
          return;
        }
        if (ansIdx < 0 || ansIdx > 3) {
          skipped.push(`Baris ${rowNo}: jawaban "${ans}" tidak valid (gunakan A, B, C, atau D)`);
          return;
        }
        if (originalToCompact[ansIdx] === undefined) {
          skipped.push(`Baris ${rowNo}: jawaban ${String.fromCharCode(65 + ansIdx)} menunjuk pilihan yang kosong`);
          return;
        }

        const rowType = parseTestType(cell.type || "");
        if (cell.type && !rowType) {
          skipped.push(`Baris ${rowNo}: Jenis Tes "${cell.type}" tidak dikenali (Pre / Post / Pre & Post)`);
          return;
        }

        imported.push({
          tempId: `draft-import-${stamp}-${i}`,
          subjectName: cell.subject || globalSubject || defaultSubject,
          question: cell.question,
          optionA: compact[0] || "",
          optionB: compact[1] || "",
          optionC: compact[2] || "",
          optionD: compact[3] || "",
          correctAnswer: originalToCompact[ansIdx],
          testType: rowType || globalTestType || "BOTH"
        });
      });

      if (imported.length === 0) {
        setErrorMsg(
          skipped.length > 0
            ? `Tidak ada soal yang valid untuk diimpor. ${skipped[0]}.`
            : "Tidak ada soal yang ditemukan di berkas."
        );
        setImportInfo({ imported: 0, skipped });
        return;
      }

      setDrafts((prev) => {
        // Buang draft kosong bawaan agar tidak tersisa soal kosong di awal
        const meaningful = prev.filter(
          (d) => d.question.trim() || d.optionA.trim() || d.optionB.trim()
        );
        return [...meaningful, ...imported];
      });
      setImportInfo({ imported: imported.length, skipped });
    } catch (err) {
      console.error("Import soal gagal:", err);
      setErrorMsg("Gagal membaca berkas Excel. Pastikan berkas tidak rusak dan sesuai template.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleSave = () => {
    setErrorMsg(null);
    if (drafts.length === 0) return;

    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      if (!d.question.trim()) {
        setErrorMsg(`Soal #${i + 1}: Pertanyaan belum diisi!`);
        return;
      }
      if (!d.optionA.trim() || !d.optionB.trim()) {
        setErrorMsg(`Soal #${i + 1}: Minimal Pilihan A dan B wajib diisi!`);
        return;
      }

      const opts = [
        d.optionA.trim(),
        d.optionB.trim(),
        d.optionC.trim(),
        d.optionD.trim()
      ];
      if (!opts[d.correctAnswer]) {
        const letters = ["A", "B", "C", "D"];
        setErrorMsg(
          `Soal #${i + 1}: Kunci jawaban terpilih (Pilihan ${letters[d.correctAnswer]}) masih kosong!`
        );
        return;
      }
    }

    const payload = drafts.map((d, idx) => {
      const rawOpts = [
        d.optionA.trim(),
        d.optionB.trim(),
        d.optionC.trim(),
        d.optionD.trim()
      ];
      const chosenText = rawOpts[d.correctAnswer] || "";
      const filteredOpts = rawOpts.filter(Boolean);
      const mappedCorrectIndex = Math.max(0, filteredOpts.indexOf(chosenText));

      return {
        id:
          editingQuizzes && editingQuizzes[idx]
            ? editingQuizzes[idx].id
            : editingQuiz
            ? editingQuiz.id
            : undefined,
        subjectName: d.subjectName.trim() || globalSubject || "Materi Umum",
        question: d.question.trim(),
        options: filteredOpts,
        correctAnswer: mappedCorrectIndex,
        testType: d.testType || "BOTH"
      };
    });

    onSaveQuizzes(payload);
  };

  const isSingleEdit = Boolean(editingQuiz && (!editingQuizzes || editingQuizzes.length === 0));
  const isEditMode = Boolean(editingQuiz || (editingQuizzes && editingQuizzes.length > 0));

  const availableSubjectOptions = Array.from(
    new Set([
      ...kaderisasiMateriList.map((m) => m.judul).filter(Boolean),
      ...(globalSubject ? [globalSubject] : []),
      ...drafts.map((d) => d.subjectName).filter(Boolean)
    ])
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !max-h-none !rounded-none !m-0 p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-none shadow-none flex flex-col z-50 focus:outline-none"
      >
        {/* HEADER BAR */}
        <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-6 py-3.5 shrink-0 shadow-xs">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white truncate">
                  {isEditMode
                    ? editingSubject
                      ? `Edit Soal Evaluasi - ${editingSubject}`
                      : "Edit Butir Soal Evaluasi"
                    : "Kelola Soal Evaluasi Pre-Test & Post-Test"}
                </DialogTitle>
                <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50 text-[10px] font-semibold shrink-0">
                  {selectedLevel.name}
                </Badge>
                {drafts.length > 0 && (
                  <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50 text-[10px] font-semibold shrink-0">
                    {drafts.length} Butir Soal
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 truncate">
                Formulir bank soal pilihan ganda untuk Pre-Test & Post-Test {selectedLevel.name}.
              </DialogDescription>
            </div>

            {/* Tombol Tutup Tunggal di Header (Aksi Simpan & Batal dipusatkan di Footer bawah) */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8.5 w-8.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Tutup</span>
              </Button>
            </div>
          </div>
        </div>

        {/* DIALOG BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
            {/* TOOLBAR ATAS: AKSI IMPORT EXCEL & TAMBAH SOAL (BERSIH TANPA KONTROL MATERI/KATEGORI DUPLIKAT) */}
            {!isSingleEdit && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleAddQuestion}
                    className="h-8 px-3 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer shadow-xs border-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Soal</span>
                  </Button>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                    (atau gunakan import berkas excel)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="h-8 text-xs gap-1.5 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer shadow-none"
                  >
                    <Download className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Template Excel</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isImporting}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium border-none cursor-pointer shadow-xs disabled:opacity-70"
                  >
                    {isImporting ? (
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    )}
                    <span>{isImporting ? "Membaca..." : "Import Excel"}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* IMPORT RESULT ALERT */}
            {importInfo && importInfo.imported > 0 && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Berhasil menambahkan {importInfo.imported} butir soal dari Excel. Silakan periksa draft di bawah sebelum menyimpan.
                  </span>
                </div>
                {importInfo.skipped.length > 0 && (
                  <div className="text-amber-700 dark:text-amber-300 pl-6 text-[11px]">
                    <p className="font-semibold">{importInfo.skipped.length} baris dilewati karena format tidak sesuai:</p>
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5 max-h-24 overflow-y-auto">
                      {importInfo.skipped.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {importInfo && importInfo.imported === 0 && importInfo.skipped.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs shadow-2xs">
                <p className="font-semibold">{importInfo.skipped.length} baris tidak dapat diimpor:</p>
                <ul className="list-disc pl-5 mt-1 space-y-0.5 max-h-24 overflow-y-auto text-[11px]">
                  {importInfo.skipped.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* ERROR ALERT BANNER */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-medium shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* DRAFTS LIST */}
            <div className="space-y-4">
              {drafts.map((d, index) => {
                const optionsList = [
                  { key: "optionA", letter: "A", val: d.optionA, idx: 0, required: true },
                  { key: "optionB", letter: "B", val: d.optionB, idx: 1, required: true },
                  { key: "optionC", letter: "C", val: d.optionC, idx: 2, required: false },
                  { key: "optionD", letter: "D", val: d.optionD, idx: 3, required: false }
                ] as const;

                return (
                  <div
                    key={d.tempId}
                    className="p-4 sm:p-5 border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 rounded-2xl space-y-4 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    {/* Card Header: Nomor Soal, Materi, Kategori Tes, & Tombol Aksi */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2.5 flex-wrap min-w-0 flex-1">
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 px-2.5 py-1 rounded-lg shrink-0">
                          Soal #{index + 1}
                        </span>

                        {/* Materi per soal */}
                        <div className="w-full sm:w-52 shrink-0">
                          <Select
                            value={d.subjectName}
                            onValueChange={(val: string | null) => {
                              if (val) updateDraft(index, "subjectName", val);
                            }}
                          >
                            <SelectTrigger className="w-full text-xs h-7.5 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 shadow-none">
                              <SelectValue placeholder="Pilih Materi">
                                {d.subjectName || "Pilih Materi"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                              {availableSubjectOptions.map((mName, sIdx) => (
                                <SelectItem key={sIdx} value={mName}>
                                  {mName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Kategori per soal */}
                        <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200/80 dark:border-zinc-800 text-[11px]">
                          <button
                            type="button"
                            onClick={() => updateDraft(index, "testType", "BOTH")}
                            className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                              (d.testType || "BOTH") === "BOTH"
                                ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                            }`}
                          >
                            Pre & Post
                          </button>
                          <button
                            type="button"
                            onClick={() => updateDraft(index, "testType", "PRE")}
                            className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                              d.testType === "PRE"
                                ? "bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-2xs font-bold"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                            }`}
                          >
                            Pre-Test
                          </button>
                          <button
                            type="button"
                            onClick={() => updateDraft(index, "testType", "POST")}
                            className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                              d.testType === "POST"
                                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                            }`}
                          >
                            Post-Test
                          </button>
                        </div>
                      </div>

                      {/* Tombol Aksi Kartu: Duplikasi & Hapus */}
                      {!isSingleEdit && (
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateQuestion(index)}
                            className="h-7.5 px-2.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg gap-1 cursor-pointer"
                            title="Duplikasi Butir Soal Ini"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplikasi</span>
                          </Button>

                          {drafts.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteQuestion(index)}
                              className="h-7.5 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg gap-1 cursor-pointer"
                              title="Hapus Butir Soal Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Form Pertanyaan */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                        <span>
                          Pertanyaan <span className="text-rose-500">*</span>
                        </span>
                        <span className="text-[11px] font-normal text-zinc-400">
                          Tuliskan kalimat pertanyaan secara jelas
                        </span>
                      </label>
                      <textarea
                        value={d.question}
                        onChange={(e) => updateDraft(index, "question", e.target.value)}
                        placeholder={`Tuliskan butir pertanyaan untuk Soal #${index + 1}...`}
                        rows={2}
                        className="w-full text-xs sm:text-sm p-3 bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-600/10 focus:outline-none placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 resize-none transition-all"
                      />
                    </div>

                    {/* Pilihan Jawaban Terpadu dengan Selector Kunci Jawaban */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Pilihan Jawaban &amp; Kunci Benar:
                        </label>
                        <span className="text-[11px] text-zinc-400">
                          Klik huruf untuk menandai kunci jawaban
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {optionsList.map((opt) => {
                          const isCorrect = d.correctAnswer === opt.idx;
                          const isFilled = opt.val.trim().length > 0;

                          return (
                            <div
                              key={opt.key}
                              className={`flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border transition-all ${
                                isCorrect
                                  ? "border-emerald-500/80 bg-emerald-50/30 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20"
                                  : "border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 hover:border-zinc-300 dark:hover:border-zinc-700"
                              }`}
                            >
                              {/* Tombol Radio Kunci Jawaban Langsung */}
                              <button
                                type="button"
                                title={isCorrect ? "Kunci Jawaban Aktif" : `Jadikan Pilihan ${opt.letter} sebagai Kunci`}
                                onClick={() => updateDraft(index, "correctAnswer", opt.idx)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all cursor-pointer ${
                                  isCorrect
                                    ? "bg-emerald-600 text-white shadow-2xs"
                                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-400 hover:text-emerald-600"
                                }`}
                              >
                                {isCorrect ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  opt.letter
                                )}
                              </button>

                              {/* Input Teks Pilihan */}
                              <Input
                                value={opt.val}
                                onChange={(e) => updateDraft(index, opt.key, e.target.value)}
                                placeholder={`Pilihan ${opt.letter}${opt.required ? " (wajib)" : " (opsional)"}...`}
                                className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-blue-600 text-zinc-900 dark:text-zinc-100 flex-1 shadow-none"
                              />

                              {/* Badge Penanda Kunci Jawaban */}
                              {isCorrect && (
                                <Badge className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-none text-[9.5px] font-bold px-1.5 py-0.5 rounded shrink-0">
                                  KUNCI
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BUTTON: TAMBAH BUTIR SOAL BERIKUTNYA */}
            {!isSingleEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddQuestion}
                className="w-full h-12 border-dashed border-2 border-zinc-300 dark:border-zinc-700 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-none transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Butir Soal Berikutnya (Soal #{drafts.length + 1})</span>
              </Button>
            )}
          </div>
        </div>

        {/* STICKY FOOTER */}
        <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-6 py-3.5 shrink-0 shadow-xs">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Total Soal: <strong className="text-zinc-900 dark:text-white font-bold">{drafts.length}</strong> butir
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                {selectedLevel.name}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 px-4 text-xs font-semibold border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="h-9 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer shadow-xs border-none transition-colors"
              >
                {isEditMode
                  ? drafts.length > 1
                    ? `Simpan Perubahan (${drafts.length} Soal)`
                    : "Simpan Perubahan"
                  : drafts.length > 1
                  ? `Simpan Semua (${drafts.length} Soal)`
                  : "Simpan Soal"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
