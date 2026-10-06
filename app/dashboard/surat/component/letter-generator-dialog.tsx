"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Printer,
  X,
  Plus,
  Trash2,
  Sparkles,
  Check,
  Info,
  Bookmark,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  Loader2,
  FileCode,
  MapPin,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Copy,
  RotateCcw,
  Upload,
  FileSpreadsheet,
  Tag,
  Eye,
  Edit3,
  Layers
} from "lucide-react";
import PizZip from "pizzip";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { db, SuratTemplate } from "@/lib/db";
import {
  base64ToArrayBuffer,
  fillDocxTemplate,
  parseTemplateContent,
  downloadDocxBlob
} from "./docx-template-helper";
import { LetterNumberingBoxes } from "./letter-numbering-boxes";
import { LetterExcelImporter } from "./letter-excel-importer";
import { LetterDocxPlaceholders } from "./letter-docx-placeholders";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";

const isCoreStandardKey = (key: string) => {
  const lk = key.toLowerCase();
  return (
    lk === "nomor" ||
    lk === "no" ||
    lk === "perihal" ||
    lk === "hal" ||
    lk === "penerima" ||
    lk === "kepada" ||
    lk === "lokasi" ||
    lk === "kota" ||
    lk === "tanggal" ||
    lk === "hari_tanggal"
  );
};

const humanizePlaceholderKey = (key: string): string => {
  const lk = key.toLowerCase();
  if (lk === "isi") return "Isi Surat / Redaksi Pokok";
  if (lk === "kegiatan" || lk === "acara") return "Nama Kegiatan / Acara";
  if (lk === "tema") return "Tema Kegiatan";
  if (lk === "tempat") return "Tempat / Lokasi Kegiatan";
  if (lk === "waktu" || lk === "pukul") return "Waktu / Pukul Pelaksanaan";
  if (lk === "hari") return "Hari Pelaksanaan";
  if (lk === "lampiran" || lk === "lamp") return "Lampiran Surat";
  if (lk === "narasumber" || lk === "pemateri") return "Nama Narasumber / Pemateri";
  if (lk === "nama") return "Nama Lengkap";
  if (lk === "ketua") return "Nama Ketua / Pimpinan";
  if (lk === "sekretaris") return "Nama Sekretaris";
  if (lk === "peserta") return "Target Peserta";
  if (lk === "keterangan" || lk === "catatan") return "Keterangan / Catatan Tambahan";

  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const isMultilineField = (key: string): boolean => {
  const lk = key.toLowerCase();
  return (
    lk === "isi" ||
    lk === "deskripsi" ||
    lk === "agenda" ||
    lk === "catatan" ||
    lk === "keterangan" ||
    lk.includes("konten") ||
    lk.includes("materi")
  );
};

interface LetterGeneratorDialogProps {
  onPublish: (
    newMailData:
      | {
          nomor: string;
          recipient: string;
          subject: string;
          classification: "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi";
          content: string;
          senderTitle: string;
          senderLocation: string;
        }
      | Array<{
          nomor: string;
          recipient: string;
          subject: string;
          classification: "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi";
          content: string;
          senderTitle: string;
          senderLocation: string;
        }>
  ) => void;
  existingMails?: any[];
  onOpenTemplateManager?: () => void;
  defaultMode?: "single" | "bulk";
}

export default function LetterGeneratorDialog({
  onPublish,
  existingMails,
  onOpenTemplateManager,
  defaultMode = "single"
}: LetterGeneratorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [letterMode, setLetterMode] = useState<"single" | "bulk">(defaultMode);
  const [mailHistory, setMailHistory] = useState<any[]>(existingMails || []);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const canvasTextareaRef = useRef<HTMLDivElement>(null);

  // States khusus Surat Massal
  const [bulkRecipientsText, setBulkRecipientsText] = useState<string>("");
  const [isSequentialNumbering, setIsSequentialNumbering] = useState<boolean>(true);
  const [previewBulkIndex, setPreviewBulkIndex] = useState<number>(0);
  const [isBatchPrinting, setIsBatchPrinting] = useState<boolean>(false);

  // Kolom & Data Baris Excel / Mail-Merge Kustom
  const [excelColumns, setExcelColumns] = useState<{
    key: string;
    originalHeader: string;
    sampleValue: string;
  }[]>([]);
  const [excelRowsData, setExcelRowsData] = useState<{
    recipient: string;
    data: Record<string, string>;
  }[]>([]);

  // Dialog Tambah Placeholder Kustom / Manual
  const [isAddPlaceholderOpen, setIsAddPlaceholderOpen] = useState(false);
  const [manualKeyInput, setManualKeyInput] = useState("");
  const [manualValInput, setManualValInput] = useState("");

  // Mode Tampilan Canvas HTML (Edit Template vs Pratinjau Terisi)
  const [htmlCanvasMode, setHtmlCanvasMode] = useState<"edit" | "preview">("edit");

  // Selection range tracker untuk penempatan placeholder di posisi kursor
  const lastSelectionRangeRef = useRef<Range | null>(null);

  // Sync Mail History
  useEffect(() => {
    if (existingMails && existingMails.length > 0) {
      setMailHistory(existingMails);
    } else {
      db.getSurat().then((res) => {
        if (res && Array.isArray(res)) {
          const outOnly = res.filter((m: any) => m.type === "KELUAR" || !m.type);
          setMailHistory(outOnly);
        }
      });
    }
  }, [existingMails, isOpen]);

  const getHighestSeqNumber = (mails: any[]): number => {
    let maxSeq = 0;
    mails.forEach((m) => {
      if (!m.nomor) return;
      const match = m.nomor.trim().match(/^(\d{1,4})/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq && num < 10000) {
          maxSeq = num;
        }
      }
    });
    return maxSeq;
  };

  const getNextSeqNumber = (mails: any[]): string => {
    const highest = getHighestSeqNumber(mails);
    return (highest + 1).toString().padStart(3, "0");
  };

  // Form States (Google Docs editable mode)
  const [createTemplate, setCreateTemplate] = useState<string>("custom_blank");
  const [customTemplates, setCustomTemplates] = useState<SuratTemplate[]>([]);

  // Konsep Pengisi Template DOCX (docxtemplater + PizZip + docx-preview)
  const [activeFileBase64, setActiveFileBase64] = useState<string>("");
  const [activePlaceholders, setActivePlaceholders] = useState<string[]>([]);
  const [docxValues, setDocxValues] = useState<Record<string, string>>({});
  const [isRenderingDocx, setIsRenderingDocx] = useState(false);

  const [createRecipient, setCreateRecipient] = useState("");
  const [createSubject, setCreateSubject] = useState("");
  const [createClassification, setCreateClassification] = useState<
    "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi"
  >("Permohonan");
  const [createContent, setCreateContent] = useState("");
  const [createSenderLocation, setCreateSenderLocation] = useState("Purwodadi");
  const [letterDate, setLetterDate] = useState(() => {
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const now = new Date();
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  });

  // Kop & Footer Settings (Default PK PMII Ki Ageng Getas Pendawa)
  const [createKopTitle, setCreateKopTitle] = useState("PERGERAKAN MAHASISWA ISLAM INDONESIA");
  const [createKopSubtitle, setCreateKopSubtitle] = useState("PENGURUS KOMISARIAT");
  const [createKopEnglish, setCreateKopEnglish] = useState("(Commissariat Board Indonesian Islamic Student Movement)");
  const [createKopAddress, setCreateKopAddress] = useState(
    "Jl. Getas Pendawa RT 01/RW 12 Kec. Purwodadi Kab. Grobogan\nEmail : pb.pmii@gmail.com Website : https://pmii.or.id"
  );
  const [createFooterLeft, setCreateFooterLeft] = useState("Dzikir, Fikir, Amal Sholeh");
  const [createLogoUrl, setCreateLogoUrl] = useState<string>("/image/logo_komsat.png");

  // STATE MODE 1: SINGLE SURAT (9 Kotak PMII)
  const [numBox1, setNumBox1] = useState("001");
  const [numBox2, setNumBox2] = useState("PK");
  const [numBox3, setNumBox3] = useState("XI");
  const [numBox4, setNumBox4] = useState("Z-03");
  const [numBox5, setNumBox5] = useState("01");
  const [numBox6, setNumBox6] = useState("010");
  const [numBox7, setNumBox7] = useState("B-II");
  const [numBox8, setNumBox8] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [numBox9, setNumBox9] = useState(String(new Date().getFullYear()));

  // Auto assign next number when modal opens
  useEffect(() => {
    if (isOpen && mailHistory.length > 0 && !hasAutoFilled) {
      const next = getNextSeqNumber(mailHistory);
      setNumBox1(next);
      setNumBox8(String(new Date().getMonth() + 1).padStart(2, "0"));
      setNumBox9(String(new Date().getFullYear()));
      setHasAutoFilled(true);
    }
  }, [isOpen, mailHistory, hasAutoFilled]);

  const handleAutoAssignNextNumber = () => {
    const next = getNextSeqNumber(mailHistory);
    setNumBox1(next);
    setNumBox8(String(new Date().getMonth() + 1).padStart(2, "0"));
    setNumBox9(String(new Date().getFullYear()));
  };

  const boxRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const baseSingleNomor = `${numBox1}.${numBox2}-${numBox3}.${numBox4}.${numBox5}.${numBox6}.${numBox7}.${numBox8}.${numBox9}`;
  const activeSenderTitle =
    customTemplates.find((t) => t.id === createTemplate)?.senderTitle ||
    "Sahabat Ketua Umum";

  // Parsing Daftar Penerima Surat Massal
  const parsedBulkRecipients = React.useMemo(() => {
    return bulkRecipientsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [bulkRecipientsText]);

  // Jaga indeks preview agar tetap dalam rentang
  useEffect(() => {
    if (previewBulkIndex >= parsedBulkRecipients.length && parsedBulkRecipients.length > 0) {
      setPreviewBulkIndex(parsedBulkRecipients.length - 1);
    }
  }, [parsedBulkRecipients.length, previewBulkIndex]);

  // Kalkulasi nomor surat per indeks penerima massal
  const getNomorForIndex = (index: number) => {
    if (!isSequentialNumbering) {
      return baseSingleNomor;
    }
    const startNum = parseInt(numBox1, 10);
    const currentNum = isNaN(startNum) ? 1 : startNum + index;
    const padLength = Math.max(numBox1.length, 3);
    const paddedNum = currentNum.toString().padStart(padLength, "0");
    return `${paddedNum}.${numBox2}-${numBox3}.${numBox4}.${numBox5}.${numBox6}.${numBox7}.${numBox8}.${numBox9}`;
  };

  // Ref & Handler Upload Excel untuk Surat Massal
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  // Simpan posisi kursor saat pengguna mengetik/mengklik lembar surat
  const saveCanvasSelection = () => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && canvasTextareaRef.current) {
      const range = sel.getRangeAt(0);
      if (canvasTextareaRef.current.contains(range.commonAncestorContainer)) {
        lastSelectionRangeRef.current = range.cloneRange();
      }
    }
  };

  // Sisipkan tag placeholder ke lembar surat di posisi kursor aktif
  const insertPlaceholderAtCursor = (placeholderKey: string, explicitVal?: string) => {
    const clean = placeholderKey.replace(/^\{+/, "").replace(/\}+$/, "").trim();
    const cleanKey = clean.toLowerCase();

    // Pastikan terdaftar di activePlaceholders agar muncul di form variabel
    if (!activePlaceholders.includes(cleanKey)) {
      setActivePlaceholders((prev) => [...prev, cleanKey]);
    }

    // Pastikan mode edit aktif agar kursor dapat menulis
    if (htmlCanvasMode !== "edit") {
      setHtmlCanvasMode("edit");
    }

    const canvas = canvasTextareaRef.current;
    if (!canvas) {
      navigator.clipboard.writeText(`{{${cleanKey}}}`);
      toast.success(`Placeholder {{${cleanKey}}} disalin ke clipboard! Tempelkan (Ctrl+V) di surat.`);
      return;
    }

    const rowData = getRowDataForIndex(previewBulkIndex);
    const colDef = excelColumns.find((c) => c.key === cleanKey || c.originalHeader?.toLowerCase() === cleanKey);
    const liveVal =
      explicitVal ||
      rowData[cleanKey] ||
      rowData[clean] ||
      docxValues[cleanKey] ||
      docxValues[clean] ||
      colDef?.sampleValue ||
      (excelRowsData[previewBulkIndex]?.data?.[cleanKey]) ||
      "";

    // Buat elemen span penampung variabel live dengan aksen biru dan garis bawah titik-titik
    const span = document.createElement("span");
    span.setAttribute("data-placeholder", cleanKey);
    span.style.color = "#1d4ed8";
    span.style.fontWeight = "600";
    span.style.textDecoration = "underline decoration-dotted";
    span.style.textUnderlineOffset = "3px";
    span.title = `Variabel: {{${cleanKey}}}`;
    span.textContent = liveVal || `{{${cleanKey}}}`;

    canvas.focus();
    let inserted = false;

    // Coba gunakan saved selection range jika ada
    const savedRange = lastSelectionRangeRef.current;
    const sel = typeof window !== "undefined" ? window.getSelection() : null;

    if (savedRange && canvas.contains(savedRange.commonAncestorContainer)) {
      try {
        savedRange.deleteContents();
        savedRange.insertNode(span);

        // Tambah spasi setelah span agar mengetik berikutnya lancar
        const spaceNode = document.createTextNode(" ");
        if (span.parentNode) {
          span.parentNode.insertBefore(spaceNode, span.nextSibling);
        }

        const newRange = document.createRange();
        newRange.setStartAfter(spaceNode);
        newRange.setEndAfter(spaceNode);
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
        lastSelectionRangeRef.current = newRange.cloneRange();
        inserted = true;
      } catch (err) {
        console.warn("Gagal menyisipkan ke range tersimpan:", err);
      }
    }

    if (!inserted) {
      if (sel && sel.rangeCount > 0 && canvas.contains(sel.anchorNode)) {
        try {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(span);

          const spaceNode = document.createTextNode(" ");
          if (span.parentNode) {
            span.parentNode.insertBefore(spaceNode, span.nextSibling);
          }

          range.setStartAfter(spaceNode);
          range.setEndAfter(spaceNode);
          sel.removeAllRanges();
          sel.addRange(range);
          lastSelectionRangeRef.current = range.cloneRange();
          inserted = true;
        } catch (err) {
          console.warn("Gagal menyisipkan kursor langsung:", err);
        }
      }
    }

    if (!inserted) {
      // Coba sisipkan di blok penerima jika ditemukan
      const recipientEl = canvas.querySelector('[data-field="recipient-name"]');
      if (recipientEl && recipientEl.parentElement) {
        const div = document.createElement("div");
        div.appendChild(span);
        recipientEl.parentElement.appendChild(div);
        inserted = true;
      } else {
        canvas.appendChild(span);
        const spaceNode = document.createTextNode(" ");
        canvas.appendChild(spaceNode);
        inserted = true;
      }
    }

    setCreateContent(canvas.innerHTML);
    toast.success(
      liveVal
        ? `Variabel {{${cleanKey}}} ("${liveVal}") berhasil ditempatkan!`
        : `Variabel {{${cleanKey}}} ditempatkan! Anda dapat mengisi nilainya di formulir Isian Variabel.`
    );
  };

  // Simpan placeholder kustom yang ditambahkan manual oleh pengguna
  const handleSaveManualPlaceholder = () => {
    let raw = manualKeyInput.trim();
    if (!raw) {
      toast.error("Nama placeholder tidak boleh kosong.");
      return;
    }
    raw = raw.replace(/^\{+/, "").replace(/\}+$/, "");
    const cleanKey = raw
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!cleanKey) {
      toast.error("Nama placeholder tidak valid.");
      return;
    }

    const defaultVal = manualValInput.trim();

    // Daftarkan ke excelColumns jika belum ada
    setExcelColumns((prev) => {
      if (prev.some((c) => c.key === cleanKey)) return prev;
      return [
        ...prev,
        {
          key: cleanKey,
          originalHeader: raw,
          sampleValue: defaultVal || cleanKey
        }
      ];
    });

    // Perbarui data setiap baris penerima
    setExcelRowsData((prev) =>
      prev.map((r) => ({
        ...r,
        data: {
          ...r.data,
          [cleanKey]: defaultVal || r.data[cleanKey] || ""
        }
      }))
    );

    // Daftarkan ke activePlaceholders
    setActivePlaceholders((prev) => {
      if (prev.includes(cleanKey)) return prev;
      return [...prev, cleanKey];
    });

    setDocxValues((prev) => ({
      ...prev,
      [cleanKey]: defaultVal || prev[cleanKey] || ""
    }));

    setIsAddPlaceholderOpen(false);
    setManualKeyInput("");
    setManualValInput("");

    // Sisipkan langsung ke kursor dengan nilai yang baru saja ditentukan
    insertPlaceholderAtCursor(cleanKey, defaultVal);
  };

  // Ambil data variabel baris untuk indeks penerima tertentu
  const getRowDataForIndex = (index: number): Record<string, string> => {
    const recName = parsedBulkRecipients[index] || createRecipient || "";
    const matched =
      excelRowsData[index] ||
      excelRowsData.find(
        (r) => r.recipient.trim().toLowerCase() === recName.trim().toLowerCase()
      );

    // Fallback awal dari docxValues dan nilai contoh excelColumns
    const defaultData: Record<string, string> = { ...docxValues };
    excelColumns.forEach((c) => {
      if (c.sampleValue && !defaultData[c.key]) {
        defaultData[c.key] = c.sampleValue;
      }
    });

    const baseData: Record<string, string> = {
      ...defaultData,
      ...(matched ? matched.data : {})
    };

    // Nilai manual docxValues diprioritaskan jika diisi pengguna
    Object.entries(docxValues).forEach(([k, v]) => {
      if (v !== undefined && v !== "") {
        baseData[k] = v;
      }
    });

    // Gandakan dalam huruf kecil agar pencarian case-insensitive selalu cocok
    Object.entries({ ...baseData }).forEach(([k, v]) => {
      baseData[k.toLowerCase()] = v;
    });

    baseData["penerima"] = recName || baseData["penerima"] || "";
    baseData["nama_penerima"] = recName || baseData["nama_penerima"] || "";
    baseData["kepada"] = recName || baseData["kepada"] || "";
    baseData["nomor"] = getNomorForIndex(index);
    baseData["no"] = baseData["nomor"];
    baseData["perihal"] = currentPreviewSubject;
    baseData["hal"] = currentPreviewSubject;
    baseData["lokasi"] = currentPreviewLocation;
    baseData["kota"] = currentPreviewLocation;
    baseData["tanggal"] = letterDate;
    baseData["hari_tanggal"] = letterDate;

    return baseData;
  };

  // Helper interpolasi variabel {{...}} ke dalam HTML surat
  const replacePlaceholdersInHtml = (
    html: string,
    data: Record<string, string>
  ): string => {
    if (!html) return "";
    let result = html;

    // 1. Data attributes: [data-field="..."] dan [data-placeholder="..."]
    if (typeof DOMParser !== "undefined") {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(result, "text/html");

        const setField = (selector: string, val: string) => {
          doc.querySelectorAll(selector).forEach((el) => {
            el.textContent = val;
          });
        };

        if (data["nomor"]) setField('[data-field="nomor-value"]', data["nomor"]);
        if (data["perihal"]) setField('[data-field="perihal-value"]', data["perihal"]);
        if (data["penerima"]) setField('[data-field="recipient-name"]', data["penerima"]);
        if (data["tanggal"] && data["lokasi"]) {
          setField('[data-field="location-date"]', `${data["lokasi"]}, ${data["tanggal"]}`);
        }

        Object.entries(data).forEach(([key, val]) => {
          if (!key) return;
          setField(`[data-field="${key}"]`, val);
        });

        // Ganti elemen [data-placeholder] menjadi teks biasa bersih untuk cetak/pratinjau
        doc.querySelectorAll("[data-placeholder]").forEach((el) => {
          const key = el.getAttribute("data-placeholder") || "";
          const cleanKey = key.toLowerCase();
          const val =
            data[cleanKey] ??
            data[key] ??
            docxValues[cleanKey] ??
            docxValues[key] ??
            "";
          if (val) {
            el.replaceWith(doc.createTextNode(val));
          }
        });

        result = doc.body.innerHTML;
      } catch (e) {
        console.warn("replacePlaceholdersInHtml DOMParser error:", e);
      }
    }

    // 2. Double curly braces {{key}}
    Object.entries(data).forEach(([key, val]) => {
      if (!key) return;
      const safe = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\{\\{\\s*${safe}\\s*\\}\\}`, "gi");
      result = result.replace(regex, val ?? "");
    });

    return result;
  };

  const handleDownloadExcelTemplate = () => {
    try {
      const headers = [
        "Nama Penerima",
        "Jabatan",
        "Instansi / Lembaga",
        "Alamat / Kota",
        "Catatan Khusus"
      ];
      const sampleData = [
        ["Sahabat Ahmad Fauzi", "Ketua Rayon", "PR PMII Rayon Tarbiyah", "Grobogan", "Konfirmasi kehadiran"],
        ["Sahabati Siti Nurhaliza", "Ketua Rayon", "PR PMII Rayon Syariah", "Purwodadi", "Konfirmasi kehadiran"],
        ["Sahabat Ridwan Kamil", "Ketua Rayon", "PR PMII Rayon Dakwah", "Grobogan", "Konfirmasi kehadiran"],
        ["Sahabat Budi Santoso", "Ketua Rayon", "PR PMII Rayon Ushuluddin", "Purwodadi", "Konfirmasi kehadiran"],
        ["Sahabati Dewi Lestari", "Ketua Rayon", "PR PMII Rayon Ekonomi & Bisnis", "Grobogan", "Konfirmasi kehadiran"]
      ];

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
      worksheet["!cols"] = [{ wch: 32 }, { wch: 18 }, { wch: 30 }, { wch: 20 }, { wch: 24 }];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Penerima Surat PMII");
      XLSX.writeFile(workbook, "Format_Penerima_Surat_Massal_PMII.xlsx");
      toast.success("Format template Excel berhasil diunduh!");
    } catch (e: any) {
      console.error("Gagal mengunduh format Excel:", e);
      toast.error("Gagal mengunduh format Excel: " + e.message);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        toast.error("File Excel kosong atau tidak memiliki lembar kerja.");
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ""
      });

      if (!sheetData || sheetData.length === 0) {
        toast.error("Lembar kerja Excel kosong.");
        return;
      }

      // Deteksi baris header & kolom penerima
      let headerRowIndex = 0;
      let recipientColIndex = 0;
      let foundHeader = false;

      for (let r = 0; r < Math.min(sheetData.length, 5); r++) {
        const row = sheetData[r] || [];
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || "").trim().toLowerCase();
          if (
            val.includes("penerima") ||
            val.includes("nama") ||
            val.includes("tujuan") ||
            val.includes("kepada") ||
            val.includes("organisasi") ||
            val.includes("instansi")
          ) {
            headerRowIndex = r;
            recipientColIndex = c;
            foundHeader = true;
            break;
          }
        }
        if (foundHeader) break;
      }

      // Ekstrak seluruh kolom dari header row
      const headerRow = sheetData[headerRowIndex] || [];
      const detectedCols: { key: string; originalHeader: string; sampleValue: string }[] = [];
      const colMapping: { colIdx: number; key: string; originalHeader: string }[] = [];

      headerRow.forEach((rawH: any, colIdx: number) => {
        const headerStr = String(rawH || "").trim();
        if (!headerStr) return;

        let cleanKey = headerStr
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .replace(/\s+/g, "_")
          .replace(/^_+|_+$/g, "");

        if (!cleanKey) cleanKey = `kolom_${colIdx + 1}`;

        let sampleVal = "";
        for (let r = headerRowIndex + 1; r < sheetData.length; r++) {
          const val = String(sheetData[r]?.[colIdx] || "").trim();
          if (val && !val.toLowerCase().startsWith("contoh:")) {
            sampleVal = val;
            break;
          }
        }

        colMapping.push({ colIdx, key: cleanKey, originalHeader: headerStr });
        detectedCols.push({
          key: cleanKey,
          originalHeader: headerStr,
          sampleValue: sampleVal
        });
      });

      const startDataIndex = foundHeader ? headerRowIndex + 1 : 0;
      const extractedNames: string[] = [];
      const parsedRowsData: { recipient: string; data: Record<string, string> }[] = [];

      for (let i = startDataIndex; i < sheetData.length; i++) {
        const row = sheetData[i] || [];
        const rawVal = row[recipientColIndex];
        const name = String(rawVal || "").trim();
        if (
          name &&
          !name.toLowerCase().startsWith("contoh:") &&
          !name.toLowerCase().startsWith("nama penerima") &&
          !name.toLowerCase().startsWith("penerima")
        ) {
          extractedNames.push(name);

          const rowData: Record<string, string> = {};
          colMapping.forEach(({ colIdx, key, originalHeader }) => {
            const cellVal = String(row[colIdx] ?? "").trim();
            rowData[key] = cellVal;
            rowData[originalHeader] = cellVal;
            rowData[originalHeader.toLowerCase()] = cellVal;
          });
          rowData["penerima"] = name;
          rowData["nama_penerima"] = name;
          rowData["kepada"] = name;

          parsedRowsData.push({
            recipient: name,
            data: rowData
          });
        }
      }

      if (extractedNames.length === 0) {
        toast.error("Tidak ditemukan nama penerima yang valid di file Excel.");
        return;
      }

      setExcelColumns(detectedCols);
      setExcelRowsData(parsedRowsData);
      setBulkRecipientsText(extractedNames.join("\n"));
      setPreviewBulkIndex(0);

      // Daftarkan kolom kustom ke activePlaceholders
      const extraKeys = detectedCols
        .map((c) => c.key)
        .filter((k) => !["no", "nomor", "penerima", "nama_penerima", "nama"].includes(k));

      setActivePlaceholders((prev) => {
        const set = new Set([...prev, ...extraKeys]);
        return Array.from(set);
      });

      // Update docxValues dengan data baris pertama
      if (parsedRowsData[0]) {
        setDocxValues((prev) => ({
          ...prev,
          ...parsedRowsData[0].data
        }));
      }

      toast.success(
        `Berhasil mengimpor ${extractedNames.length} nama penerima & ${detectedCols.length} kolom data dari Excel!`
      );
    } catch (e: any) {
      console.error("Gagal membaca file Excel:", e);
      toast.error("Gagal membaca file Excel: " + e.message);
    } finally {
      if (excelFileInputRef.current) {
        excelFileInputRef.current.value = "";
      }
    }
  };

  // Bersihkan Penerima Surat Massal
  const loadPresetRecipients = (_type?: string) => {
    setBulkRecipientsText("");
    setExcelColumns([]);
    setExcelRowsData([]);
    setPreviewBulkIndex(0);
  };

  // Deteksi Duplikat Nomor Surat Keluar (Single Mode)
  const currentNormalizedNomor = baseSingleNomor.trim().toLowerCase();
  const duplicateEntry = mailHistory.find((m) => {
    if (!m.nomor) return false;
    return m.nomor.trim().toLowerCase() === currentNormalizedNomor;
  });

  const duplicateSeqEntry = !duplicateEntry
    ? mailHistory.find((m) => {
        if (!m.nomor) return false;
        const seq = m.nomor.trim().match(/^(\d{1,4})/)?.[1];
        return seq && parseInt(seq, 10) === parseInt(numBox1, 10);
      })
    : null;

  // Deteksi Duplikat Nomor Surat Keluar (Bulk Mode)
  const bulkDuplicateEntries = React.useMemo(() => {
    if (letterMode !== "bulk" || parsedBulkRecipients.length === 0) return [];
    const duplicates: { index: number; nomor: string; recipient: string; matchedMail: any }[] = [];
    parsedBulkRecipients.forEach((rec, idx) => {
      const nom = getNomorForIndex(idx).trim().toLowerCase();
      const match = mailHistory.find((m) => m.nomor && m.nomor.trim().toLowerCase() === nom);
      if (match) {
        duplicates.push({ index: idx, nomor: getNomorForIndex(idx), recipient: rec, matchedMail: match });
      }
    });
    return duplicates;
  }, [letterMode, parsedBulkRecipients, isSequentialNumbering, numBox1, numBox2, numBox3, numBox4, numBox5, numBox6, numBox7, numBox8, numBox9, mailHistory]);

  // Deklarasi Variabel Preview Utama (Mendukung Single & Bulk)
  const currentPreviewNomor =
    letterMode === "bulk"
      ? getNomorForIndex(previewBulkIndex)
      : baseSingleNomor;

  const currentPreviewRecipient =
    letterMode === "bulk"
      ? (parsedBulkRecipients[previewBulkIndex] || "Nama Penerima Surat")
      : createRecipient;

  const currentPreviewSubject = createSubject;
  const currentPreviewLocation = createSenderLocation;
  const currentPreviewFooterLeft = createFooterLeft;

  // Sinkronisasi Kop Surat & Logo Otomatis dari Pengaturan Sistem
  useEffect(() => {
    if (typeof window !== "undefined" && isOpen) {
      try {
        const savedSettings = localStorage.getItem("PMII_SYSTEM_SETTINGS");
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          const org = parsed?.organization;
          if (org) {
            if (org.cabangName) {
              setCreateKopSubtitle(org.cabangName.toUpperCase());
            }
            const addressParts: string[] = [];
            if (org.address) addressParts.push(`Sekretariat: ${org.address}`);
            if (org.phone) addressParts.push(`Telp: ${org.phone}`);
            if (org.email) addressParts.push(`Email: ${org.email}`);
            if (addressParts.length > 0) {
              setCreateKopAddress(addressParts.join(" | "));
            }
            if (org.logo) {
              setCreateLogoUrl(org.logo);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load system settings for letter kop:", e);
      }
    }
  }, [isOpen]);

  // Render Preview Menggunakan docxtemplater + PizZip + docx-preview (100% Persis Word Asli)
  const renderFilledDocxPreview = async (b64: string, data: Record<string, string>) => {
    const canvasEl = canvasTextareaRef.current;
    if (!b64 || !canvasEl) return;
    setIsRenderingDocx(true);
    try {
      const arrayBuffer = base64ToArrayBuffer(b64);
      const { arrayBuffer: filledBuffer, error } = fillDocxTemplate(arrayBuffer, data);
      if (error) {
        console.warn("Docxtemplater warning:", error);
      }
      const docx = await import("docx-preview");
      canvasEl.innerHTML = "";
      await docx.renderAsync(filledBuffer, canvasEl, undefined, {
        className: "docx",
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        useBase64URL: true,
        renderHeaders: true,
        renderFooters: true,
        renderAltChunks: true
      });
      setCreateContent(canvasEl.innerHTML);
    } catch (e) {
      console.error("Gagal render docx preview:", e);
    } finally {
      setIsRenderingDocx(false);
    }
  };

  const handleDownloadDocxResult = () => {
    if (!activeFileBase64) return;
    try {
      const arrayBuffer = base64ToArrayBuffer(activeFileBase64);
      const { blob, error } = fillDocxTemplate(arrayBuffer, docxValues);
      if (error) {
        toast.error("Gagal mengisi data ke docx: " + error);
        return;
      }
      const safeNomor = currentPreviewNomor.replace(/[/\\?%*:|"<>]/g, "_");
      const safeRecipient = currentPreviewRecipient.replace(/[/\\?%*:|"<>]/g, "_");
      const fileName = `${safeNomor}_${safeRecipient}`;
      downloadDocxBlob(blob, fileName);
      toast.success("Dokumen Word (.docx) berhasil diunduh!");
    } catch (e: any) {
      toast.error("Gagal mengunduh file: " + e.message);
    }
  };

  const handleDownloadBulkZip = () => {
    if (!activeFileBase64 || parsedBulkRecipients.length === 0) return;
    try {
      const zip = new PizZip();
      const arrayBuffer = base64ToArrayBuffer(activeFileBase64);

      parsedBulkRecipients.forEach((rec, idx) => {
        const nomor = getNomorForIndex(idx);
        const rowData = getRowDataForIndex(idx);
        const data: Record<string, string> = { ...docxValues, ...rowData };

        activePlaceholders.forEach((k) => {
          const lk = k.toLowerCase();
          if (lk === "nomor" || lk === "no") data[k] = nomor;
          else if (lk === "penerima" || lk === "kepada") data[k] = rec;
          else if (lk === "perihal" || lk === "hal") data[k] = currentPreviewSubject;
          else if (lk === "lokasi" || lk === "kota") data[k] = currentPreviewLocation;
          else if (lk === "tanggal" || lk === "hari_tanggal") data[k] = letterDate;
          else if (rowData[k] !== undefined) data[k] = rowData[k];
          else if (rowData[lk] !== undefined) data[k] = rowData[lk];
        });
        Object.entries(rowData).forEach(([k, v]) => {
          data[k] = v;
        });

        const { arrayBuffer: filledBuffer } = fillDocxTemplate(arrayBuffer, data);
        const safeNomor = nomor.replace(/[/\\?%*:|"<>]/g, "_");
        const safeRec = rec.replace(/[/\\?%*:|"<>]/g, "_");
        zip.file(`${safeNomor}_${safeRec}.docx`, filledBuffer);
      });

      const zipBlob = zip.generate({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Surat_Massal_PMII_${parsedBulkRecipients.length}_Berkas.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2500);
      toast.success(`Berhasil mengunduh paket ZIP (${parsedBulkRecipients.length} file .docx)!`);
    } catch (e: any) {
      console.error("Gagal buat ZIP docx:", e);
      toast.error("Gagal mengunduh ZIP: " + e.message);
    }
  };

  const applyTemplateSelection = (tmpl: SuratTemplate) => {
    const parsed = parseTemplateContent(tmpl.content);
    const b64 = tmpl.fileBase64 || parsed.fileBase64 || "";
    const ph = tmpl.placeholders || parsed.placeholders || [];

    setActiveFileBase64(b64);
    setActivePlaceholders(ph);

    setCreateSubject(tmpl.subject);
    setCreateClassification(
      (tmpl.classification as "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi") || "Undangan"
    );
    setCreateSenderLocation(tmpl.senderLocation || "Purwodadi");

    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const today = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

    const initVals: Record<string, string> = {};
    ph.forEach((k) => {
      const lk = k.toLowerCase();
      if (lk === "nomor" || lk === "no") initVals[k] = currentPreviewNomor;
      else if (lk === "perihal" || lk === "hal") initVals[k] = tmpl.subject || "";
      else if (lk === "penerima" || lk === "kepada") initVals[k] = createRecipient || "";
      else if (lk === "lokasi" || lk === "kota") initVals[k] = tmpl.senderLocation || "Purwodadi";
      else if (lk === "tanggal" || lk === "hari_tanggal") initVals[k] = letterDate || today;
      else initVals[k] = "";
    });
    setDocxValues(initVals);

    if (b64) {
      renderFilledDocxPreview(b64, initVals);
    } else {
      setCreateContent(parsed.html || tmpl.content);
      if (canvasTextareaRef.current) {
        canvasTextareaRef.current.innerHTML = parsed.html || tmpl.content;
      }
    }
  };

  // Sinkronisasi Template Custom dari Database
  useEffect(() => {
    if (isOpen) {
      db.getSuratTemplates()
        .then((res) => {
          if (res && Array.isArray(res)) {
            setCustomTemplates(res);
            // Hanya auto-select template pertama jika bukan mode surat massal
            if (letterMode !== "bulk" && (!createTemplate || createTemplate === "custom_blank") && res.length > 0) {
              const first = res[0];
              setCreateTemplate(first.id);
              applyTemplateSelection(first);
            }
          }
        })
        .catch((e) => {
          console.error("Gagal memuat template dari database:", e);
        });
    }
  }, [isOpen, letterMode]);

  const handleTemplateChange = (val: string | null) => {
    if (!val) return;
    setCreateTemplate(val);
    if (val === "custom_blank") {
      setActiveFileBase64("");
      setActivePlaceholders([]);
      setDocxValues({});
      setCreateSubject("");
      setCreateClassification("Permohonan");
      setCreateRecipient("");
      const initialHtml = buildCanvasHtml();
      setCreateContent(initialHtml);
      if (canvasTextareaRef.current) {
        canvasTextareaRef.current.innerHTML = initialHtml;
      }
      return;
    }
    const customTmpl = customTemplates.find((t) => t.id === val);
    if (customTmpl) {
      applyTemplateSelection(customTmpl);
    }
  };

  // Sinkronisasi nilai field standar PMII & data baris Excel ke placeholder DOCX
  useEffect(() => {
    if (!activeFileBase64 || activePlaceholders.length === 0) return;
    setDocxValues((prev) => {
      const next = { ...prev };
      let changed = false;

      // Sinkronisasi field pokok
      activePlaceholders.forEach((k) => {
        const lk = k.toLowerCase();
        if ((lk === "nomor" || lk === "no") && next[k] !== currentPreviewNomor) {
          next[k] = currentPreviewNomor;
          changed = true;
        } else if ((lk === "perihal" || lk === "hal") && next[k] !== currentPreviewSubject) {
          next[k] = currentPreviewSubject;
          changed = true;
        } else if ((lk === "penerima" || lk === "kepada") && next[k] !== currentPreviewRecipient) {
          next[k] = currentPreviewRecipient;
          changed = true;
        } else if ((lk === "lokasi" || lk === "kota") && next[k] !== currentPreviewLocation) {
          next[k] = currentPreviewLocation;
          changed = true;
        } else if ((lk === "tanggal" || lk === "hari_tanggal") && next[k] !== letterDate) {
          next[k] = letterDate;
          changed = true;
        }
      });

      // Jika dalam mode surat massal, timpa dengan data baris Excel penerima aktif
      if (letterMode === "bulk") {
        const rowData = getRowDataForIndex(previewBulkIndex);
        Object.entries(rowData).forEach(([rk, rv]) => {
          if (rv !== undefined && next[rk] !== rv) {
            next[rk] = rv;
            changed = true;
          }
        });
      }

      return changed ? next : prev;
    });
  }, [
    currentPreviewNomor,
    currentPreviewSubject,
    currentPreviewRecipient,
    currentPreviewLocation,
    letterDate,
    activeFileBase64,
    activePlaceholders,
    letterMode,
    previewBulkIndex,
    excelRowsData
  ]);

  // Debounced auto-render saat data placeholder diubah pengguna
  useEffect(() => {
    if (activeFileBase64) {
      const timer = setTimeout(() => {
        renderFilledDocxPreview(activeFileBase64, docxValues);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [docxValues, activeFileBase64]);


  const handleBoxChange = (index: number, value: string, setBoxState: (val: string) => void, maxLength: number) => {
    setBoxState(value);
    if (value.length >= maxLength && index < 8) {
      boxRefs[index + 1]?.current?.focus();
    }
  };

  // Bangun HTML canvas default surat resmi PMII dengan placeholder lengkap
  const buildCanvasHtml = () => {
    if (createContent && createContent.trim().length > 0) {
      return createContent;
    }

    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const today = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

    return `<div style="font-family:'Arial Narrow', Arial, sans-serif; line-height:1.45; color:#0f172a; max-width:100%;">
  <!-- KOP SURAT PMII -->
  <div style="display:flex; align-items:center; justify-content:center; gap:16px; border-bottom:3px double #1e3a8a; padding-bottom:10px; margin-bottom:16px;">
    <img src="${createLogoUrl || '/image/logo_komsat.png'}" alt="Logo PMII" style="width:64px; height:64px; object-fit:contain;" />
    <div style="text-align:center;">
      <div style="font-size:11px; font-weight:bold; letter-spacing:1px; color:#1e3a8a; text-transform:uppercase;">${createKopSubtitle}</div>
      <div style="font-size:16px; font-weight:900; color:#1e3a8a; letter-spacing:0.5px; text-transform:uppercase;">${createKopTitle}</div>
      <div style="font-size:11px; font-style:italic; color:#475569;">${createKopEnglish}</div>
      <div style="font-size:9.5px; color:#334155; margin-top:3px; white-space:pre-line;">${createKopAddress}</div>
    </div>
  </div>

  <!-- NOMOR & TANGGAL -->
  <table style="width:100%; margin-bottom:14px; font-size:13px; border-collapse:collapse;">
    <tbody>
      <tr>
        <td style="width:75px; padding:2px 0;">Nomor</td>
        <td style="width:10px; padding:2px 0;">:</td>
        <td style="padding:2px 0; font-weight:bold;" data-field="nomor-value">{{nomor}}</td>
        <td style="text-align:right; padding:2px 0;" data-field="location-date">${createSenderLocation || "Purwodadi"}, ${today}</td>
      </tr>
      <tr>
        <td style="padding:2px 0;">Lampiran</td>
        <td style="padding:2px 0;">:</td>
        <td style="padding:2px 0;">- (Satu Berkas)</td>
        <td></td>
      </tr>
      <tr>
        <td style="padding:2px 0;">Perihal</td>
        <td style="padding:2px 0;">:</td>
        <td style="padding:2px 0; font-weight:bold; color:#1e3a8a;" data-field="perihal-value">{{perihal}}</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <!-- KEPADA YTH / PENERIMA -->
  <div style="margin-bottom:16px; font-size:13px; line-height:1.5;">
    Kepada Yang Terhormat:<br/>
    <b style="font-size:13.5px;" data-field="recipient-name">{{penerima}}</b><br/>
    <span style="color:#1e3a8a; font-weight:600;">{{jabatan}}</span> <span>{{instansi}}</span><br/>
    di - Tempat
  </div>

  <!-- SALAM & REDAKSI ISI SURAT -->
  <div style="font-size:13px; line-height:1.65; text-align:justify; margin-bottom:20px;">
    <p style="margin:0 0 8px 0;"><i><b>Assalamu'alaikum Warahmatullahi Wabarakatuh</b></i></p>
    <p style="margin:0 0 8px 0;">Salam silaturrahim teriring do'a kami sampaikan kepada Sahabat/i, semoga senantiasa dalam lindungan Allah SWT serta eksis dalam menjalankan aktifitas keseharian. Amin.</p>
    <p style="margin:0 0 8px 0;">Sehubungan dengan akan dilaksanakannya agenda kegiatan organisasi Pengurus Komisariat PMII, maka dengan ini kami memohon/mengundang Sahabat/i untuk dapat hadir pada:</p>

    <div style="margin:10px 0 10px 24px; font-size:13px;">
      <table style="border-collapse:collapse; font-size:13px;">
        <tr><td style="width:110px; padding:3px 0;">Hari / Tanggal</td><td style="width:10px;">:</td><td style="font-weight:bold;">{{tanggal}}</td></tr>
        <tr><td style="padding:3px 0;">Waktu</td><td>:</td><td>09.00 WIB s.d Selesai</td></tr>
        <tr><td style="padding:3px 0;">Tempat</td><td>:</td><td>Gedung PCNU Lt. 2 Purwodadi</td></tr>
        <tr><td style="padding:3px 0;">Agenda Acara</td><td>:</td><td style="font-weight:bold; color:#1e3a8a;">{{perihal}}</td></tr>
      </table>
    </div>

    <p style="margin:0 0 8px 0;">Demikian surat permohonan ini kami sampaikan, atas perhatian dan kehadirannya kami haturkan terima kasih.</p>
    <p style="margin:0 0 4px 0;"><i><b>Wallahul Muwaffiq Ila Aqwamith Thariq</b></i></p>
    <p style="margin:0 0 16px 0;"><i><b>Wassalamu'alaikum Warahmatullahi Wabarakatuh</b></i></p>
  </div>

  <!-- TANDA TANGAN PIMPINAN -->
  <div style="margin-top:24px; font-size:13px;">
    <div style="text-align:center; font-weight:bold; margin-bottom:50px;">
      PENGURUS KOMISARIAT<br/>
      PERGERAKAN MAHASISWA ISLAM INDONESIA<br/>
      KI AGENG GETAS PENDAWA GROBOGAN
    </div>
    <table style="width:100%; text-align:center; font-size:13px;">
      <tr>
        <td style="width:50%;">
          <b>Ketua Komisariat</b><br/><br/><br/><br/>
          <u><b>Sahabat Ahmad Fauzi</b></u><br/>
          NIA. 010.01.001
        </td>
        <td style="width:50%;">
          <b>Sekretaris</b><br/><br/><br/><br/>
          <u><b>Sahabat Ridwan Kamil</b></u><br/>
          NIA. 010.01.002
        </td>
      </tr>
    </table>
  </div>
</div>`;
  };

  const updateCanvasFields = () => {
    const canvas = canvasTextareaRef.current;
    if (!canvas) return;
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const today = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;
    const set = (field: string, val: string, isHtml = false) => {
      const el = canvas.querySelector(`[data-field="${field}"]`) as HTMLElement | null;
      if (!el) return;
      if (isHtml) el.innerHTML = val;
      else el.textContent = val;
    };

    set("nomor-value", currentPreviewNomor);
    if (currentPreviewSubject) set("perihal-value", currentPreviewSubject);
    set("location-date", `${currentPreviewLocation || "Purwodadi"}, ${today}`);
    if (currentPreviewRecipient) set("recipient-name", currentPreviewRecipient);
    if (currentPreviewFooterLeft) set("footer-text", currentPreviewFooterLeft);

    // Ambil data baris saat ini (dari Excel atau form isian variabel)
    const currentRowData = getRowDataForIndex(previewBulkIndex);

    // Update semua elemen [data-placeholder] yang sudah terpasang di canvas
    const placeholderEls = canvas.querySelectorAll<HTMLElement>("[data-placeholder]");
    placeholderEls.forEach((el) => {
      const key = el.getAttribute("data-placeholder") || "";
      const cleanKey = key.toLowerCase();
      const val =
        currentRowData[cleanKey] ||
        currentRowData[key] ||
        docxValues[cleanKey] ||
        docxValues[key] ||
        excelColumns.find((c) => c.key === cleanKey)?.sampleValue ||
        "";

      if (val) {
        el.textContent = val;
      }
    });

    // Pindai teks mentah {{key}} yang mungkin baru diketik pengguna dan konversikan ke live span
    scanAndConvertRawPlaceholders(canvas, currentRowData);
  };

  // Pindai dan ubah {{placeholder}} yang diketik manual menjadi span variabel aktif
  const scanAndConvertRawPlaceholders = (
    canvas: HTMLElement,
    rowData: Record<string, string>
  ) => {
    const inner = canvas.innerHTML;
    if (!inner.includes("{{")) return;

    let hasChange = false;
    const updatedHtml = inner.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (match, rawKey) => {
      const cleanKey = rawKey.toLowerCase();
      const val =
        rowData[cleanKey] ||
        rowData[rawKey] ||
        docxValues[cleanKey] ||
        docxValues[rawKey] ||
        excelColumns.find((c) => c.key === cleanKey)?.sampleValue ||
        "";

      hasChange = true;
      setActivePlaceholders((prev) => (prev.includes(cleanKey) ? prev : [...prev, cleanKey]));

      const displayContent = val || `{{${rawKey}}}`;
      return `<span data-placeholder="${cleanKey}" style="color:#1d4ed8; font-weight:600; text-decoration:underline decoration-dotted; text-underline-offset:3px;" title="Variabel: {{${cleanKey}}}">${displayContent}</span>`;
    });

    if (hasChange) {
      canvas.innerHTML = updatedHtml;
      setCreateContent(updatedHtml);
    }
  };

  // Canvas initialization: Untuk custom/blank (non-DOCX)
  useEffect(() => {
    if (!activeFileBase64 && isOpen) {
      const el = canvasTextareaRef.current;
      if (!el) return;

      if (letterMode === "bulk" && htmlCanvasMode === "preview") {
        const rowData = getRowDataForIndex(previewBulkIndex);
        const fullData: Record<string, string> = {
          ...docxValues,
          ...rowData,
          nomor: currentPreviewNomor,
          no: currentPreviewNomor,
          penerima: currentPreviewRecipient,
          kepada: currentPreviewRecipient,
          perihal: currentPreviewSubject,
          hal: currentPreviewSubject,
          lokasi: currentPreviewLocation,
          kota: currentPreviewLocation,
          tanggal: letterDate,
          hari_tanggal: letterDate
        };
        el.innerHTML = replacePlaceholdersInHtml(createContent || buildCanvasHtml(), fullData);
      } else {
        if (createContent) {
          el.innerHTML = createContent;
        } else {
          el.innerHTML = buildCanvasHtml();
        }
        updateCanvasFields();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    createTemplate,
    activeFileBase64,
    letterMode,
    htmlCanvasMode,
    previewBulkIndex,
    currentPreviewNomor,
    currentPreviewRecipient,
    currentPreviewSubject,
    currentPreviewLocation,
    letterDate,
    excelRowsData,
    docxValues,
    activePlaceholders,
    bulkRecipientsText
  ]);

  // Jika template DOCX aktif dan dialog dibuka, render preview Word asli
  useEffect(() => {
    if (isOpen && activeFileBase64) {
      const timer = setTimeout(() => {
        renderFilledDocxPreview(activeFileBase64, docxValues);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeFileBase64]);

  useEffect(() => {
    if (!activeFileBase64 && (letterMode !== "bulk" || htmlCanvasMode === "edit")) {
      updateCanvasFields();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPreviewNomor,
    currentPreviewSubject,
    currentPreviewLocation,
    currentPreviewRecipient,
    currentPreviewFooterLeft,
    activeFileBase64,
    htmlCanvasMode,
    letterMode
  ]);

  const handlePrintLetter = () => {
    const printContent = document.getElementById("custom-letter-print-area");
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Pastikan izin pop-up browser aktif.");
      return;
    }

    // Ambil seluruh style asli (termasuk CSS yang digenerate oleh docx-preview)
    const allStyles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((el) => el.outerHTML)
      .join("\n");

    const printTitle = (currentPreviewNomor || "Surat_PMII").replace(/\s+/g, "_");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>${printTitle}</title>
          ${allStyles}
          <style>
            @page {
              size: auto;
              margin: 0mm;
            }
            *, *::before, *::after {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              width: 100% !important;
              min-height: auto !important;
              visibility: visible !important;
            }
            body, body * {
              visibility: visible !important;
            }
            #custom-letter-print-area,
            #custom-letter-print-area * {
              visibility: visible !important;
            }
            .print-label {
              display: none !important;
            }
            .docx-wrapper {
              padding: 0 !important;
              margin: 0 auto !important;
              background: transparent !important;
              box-shadow: none !important;
              display: block !important;
              width: 100% !important;
            }
            .docx-wrapper > section.docx {
              margin: 0 auto !important;
              margin-bottom: 0 !important;
              box-shadow: none !important;
              border: none !important;
              box-sizing: border-box !important;
            }
            .docx-wrapper > section.docx:not(:last-child) {
              page-break-after: always !important;
              break-after: page !important;
            }
            @media print {
              html, body {
                background: #ffffff !important;
              }
              body, body * {
                visibility: visible !important;
              }
              #custom-letter-print-area,
              #custom-letter-print-area * {
                visibility: visible !important;
              }
              .docx-wrapper {
                padding: 0 !important;
                margin: 0 !important;
                background: transparent !important;
              }
              .docx-wrapper > section.docx {
                box-shadow: none !important;
                margin: 0 auto !important;
                margin-bottom: 0 !important;
              }
              .print-label {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div id="custom-letter-print-area">${printContent.innerHTML}</div>
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 250);
            });
            window.addEventListener('afterprint', function() {
              window.close();
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintBulkLetters = async () => {
    if (parsedBulkRecipients.length === 0) return;
    setIsBatchPrinting(true);
    try {
      const allStyles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
        .map((el) => el.outerHTML)
        .join("\n");

      const printTitle = `Surat_Massal_PMII_${parsedBulkRecipients.length}_Penerima`;
      const batchContainer = document.createElement("div");

      if (activeFileBase64) {
        const docx = await import("docx-preview");
        const arrayBuffer = base64ToArrayBuffer(activeFileBase64);

        for (let i = 0; i < parsedBulkRecipients.length; i++) {
          const rec = parsedBulkRecipients[i];
          const nomor = getNomorForIndex(i);
          const rowData = getRowDataForIndex(i);

          const data: Record<string, string> = { ...docxValues, ...rowData };
          activePlaceholders.forEach((k) => {
            const lk = k.toLowerCase();
            if (lk === "nomor" || lk === "no") data[k] = nomor;
            else if (lk === "penerima" || lk === "kepada") data[k] = rec;
            else if (lk === "perihal" || lk === "hal") data[k] = currentPreviewSubject;
            else if (lk === "lokasi" || lk === "kota") data[k] = currentPreviewLocation;
            else if (lk === "tanggal" || lk === "hari_tanggal") data[k] = letterDate;
            else if (rowData[k] !== undefined) data[k] = rowData[k];
            else if (rowData[lk] !== undefined) data[k] = rowData[lk];
          });
          Object.entries(rowData).forEach(([k, v]) => {
            data[k] = v;
          });

          const { arrayBuffer: filledBuffer } = fillDocxTemplate(arrayBuffer, data);
          const pageEl = document.createElement("div");
          pageEl.className = "bulk-letter-page";

          await docx.renderAsync(filledBuffer, pageEl, undefined, {
            className: "docx",
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            useBase64URL: true,
            renderHeaders: true,
            renderFooters: true,
            renderAltChunks: true
          });

          batchContainer.appendChild(pageEl);
        }
      } else {
        const baseHtml = createContent || (canvasTextareaRef.current?.innerHTML ?? "");
        for (let i = 0; i < parsedBulkRecipients.length; i++) {
          const rec = parsedBulkRecipients[i];
          const nomor = getNomorForIndex(i);
          const rowData = getRowDataForIndex(i);

          const pageEl = document.createElement("div");
          pageEl.className = "bulk-letter-page";

          const fullData: Record<string, string> = {
            ...docxValues,
            ...rowData,
            nomor,
            no: nomor,
            penerima: rec,
            kepada: rec,
            perihal: currentPreviewSubject,
            hal: currentPreviewSubject,
            lokasi: currentPreviewLocation,
            kota: currentPreviewLocation,
            tanggal: letterDate,
            hari_tanggal: letterDate
          };

          const renderedHtml = replacePlaceholdersInHtml(baseHtml, fullData);
          pageEl.innerHTML = renderedHtml;
          batchContainer.appendChild(pageEl);
        }
      }

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Gagal membuka jendela cetak. Pastikan izin pop-up browser aktif.");
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
          <head>
            <meta charset="utf-8">
            <title>${printTitle}</title>
            ${allStyles}
            <style>
              @page {
                size: auto;
                margin: 0mm;
              }
              *, *::before, *::after {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                width: 100% !important;
                min-height: auto !important;
                visibility: visible !important;
              }
              body, body * {
                visibility: visible !important;
              }
              #custom-letter-print-area,
              #custom-letter-print-area * {
                visibility: visible !important;
              }
              .bulk-letter-page {
                page-break-after: always !important;
                break-after: page !important;
                width: 100% !important;
                margin: 0 auto !important;
                padding: 0 !important;
                box-shadow: none !important;
                display: block !important;
              }
              .bulk-letter-page:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
              }
              .docx-wrapper {
                padding: 0 !important;
                margin: 0 auto !important;
                background: transparent !important;
                box-shadow: none !important;
                display: block !important;
                width: 100% !important;
              }
              .docx-wrapper > section.docx {
                margin: 0 auto !important;
                margin-bottom: 0 !important;
                box-shadow: none !important;
                border: none !important;
                box-sizing: border-box !important;
              }
              .docx-wrapper > section.docx:not(:last-child) {
                page-break-after: always !important;
                break-after: page !important;
              }
              @media print {
                html, body {
                  background: #ffffff !important;
                }
                body, body * {
                  visibility: visible !important;
                }
                #custom-letter-print-area,
                #custom-letter-print-area * {
                  visibility: visible !important;
                }
                .bulk-letter-page {
                  page-break-after: always !important;
                  break-after: page !important;
                }
                .bulk-letter-page:last-child {
                  page-break-after: auto !important;
                  break-after: auto !important;
                }
                .docx-wrapper {
                  padding: 0 !important;
                  margin: 0 !important;
                  background: transparent !important;
                }
                .docx-wrapper > section.docx {
                  box-shadow: none !important;
                  margin: 0 auto !important;
                  margin-bottom: 0 !important;
                }
              }
            </style>
          </head>
          <body>
            <div id="custom-letter-print-area">
              ${batchContainer.innerHTML}
            </div>
            <script>
              window.addEventListener('load', function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 350);
              });
              window.addEventListener('afterprint', function() {
                window.close();
              });
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (e: any) {
      console.error("Gagal cetak surat massal:", e);
      toast.error("Gagal mencetak surat massal: " + e.message);
    } finally {
      setIsBatchPrinting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (letterMode === "bulk") {
      if (parsedBulkRecipients.length === 0) {
        toast.error("Silakan masukkan minimal 1 nama penerima surat massal.");
        return;
      }
      if (bulkDuplicateEntries.length > 0) {
        const confirmUse = window.confirm(
          `PERINGATAN: Terdapat ${bulkDuplicateEntries.length} nomor surat yang sudah pernah digunakan:\n${bulkDuplicateEntries.slice(0, 3).map(d => `• ${d.nomor} (${d.recipient})`).join("\n")}${bulkDuplicateEntries.length > 3 ? "\n...dan lainnya" : ""}\n\nTetap lanjutkan menerbitkan dengan nomor duplikat ini?`
        );
        if (!confirmUse) return;
      }

      const massMails = parsedBulkRecipients.map((rec, idx) => {
        const rowData = getRowDataForIndex(idx);
        const fullData: Record<string, string> = {
          ...docxValues,
          ...rowData,
          nomor: getNomorForIndex(idx),
          penerima: rec,
          perihal: currentPreviewSubject,
          lokasi: currentPreviewLocation,
          tanggal: letterDate
        };
        const mailContent = !activeFileBase64
          ? replacePlaceholdersInHtml(createContent, fullData)
          : createContent;

        return {
          nomor: getNomorForIndex(idx),
          recipient: rec,
          subject: currentPreviewSubject,
          classification: createClassification,
          content: mailContent,
          senderTitle: activeSenderTitle,
          senderLocation: currentPreviewLocation,
          customData: rowData
        };
      });

      onPublish(massMails);
      await handlePrintBulkLetters();
      setIsOpen(false);
    } else {
      if (duplicateEntry) {
        const confirmUse = window.confirm(
          `PERINGATAN: Nomor surat "${currentPreviewNomor}" sudah pernah digunakan pada surat "${duplicateEntry.subject || 'Surat Keluar'}".\n\nTetap lanjutkan menerbitkan dengan nomor duplikat ini?`
        );
        if (!confirmUse) return;
      }
      onPublish({
        nomor: currentPreviewNomor,
        recipient: currentPreviewRecipient,
        subject: currentPreviewSubject,
        classification: createClassification,
        content: createContent,
        senderTitle: activeSenderTitle,
        senderLocation: currentPreviewLocation
      });
      handlePrintLetter();
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setLetterMode("single");
          setIsOpen(true);
        }}
        className="h-9 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer border-none shrink-0"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>Buat Surat Resmi</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-screen max-w-none h-screen max-h-none bg-white dark:bg-zinc-900 border-none rounded-none ring-0 shadow-none p-0 gap-0 flex flex-col overflow-hidden z-50"
        style={{ transform: "none", translate: "none" }}
      >
        {/* Header Modul (Mengikuti Standar Verifikasi) */}
        <DialogHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Pembuat Surat Resmi
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Formulir pembuatan surat resmi PMII
                </DialogDescription>
              </div>
            </div>

            <DialogClose render={
              <button className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer border-none">
                <X className="w-4 h-4" />
              </button>
            } />
          </div>
        </DialogHeader>

        {/* Workspace Panel */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
          {/* Sisi Kiri: Form Input & Konfigurasi */}
          {(() => {
            const selectedTemplateObj = customTemplates.find((t) => t.id === createTemplate);
            const detailPlaceholders = activePlaceholders.filter((k) => !isCoreStandardKey(k));

            return (
              <form
                onSubmit={handleSubmit}
                className="lg:col-span-4 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 h-full flex flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  {/* CARD 1: PILIHAN TEMPLATE SURAT */}
                  <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5 shadow-none">
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Template Surat
                        </span>
                      </div>

                      {onOpenTemplateManager && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            onOpenTemplateManager();
                          }}
                          className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1 cursor-pointer border-none bg-transparent hover:underline"
                          title="Buka panel pengelolaan template surat"
                        >
                          <Bookmark className="w-3 h-3" />
                          <span>Kelola Template</span>
                        </button>
                      )}
                    </div>

                    <Select value={createTemplate} onValueChange={handleTemplateChange}>
                      <SelectTrigger className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <SelectValue placeholder="Pilih Template Surat">
                          {createTemplate === "custom_blank"
                            ? "Lembar Kosong (Mulai dari Nol)"
                            : selectedTemplateObj?.name || "Pilih Template Surat"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="border-zinc-200 dark:border-zinc-800 max-h-64">
                        <SelectItem value="custom_blank">Lembar Kosong (Mulai dari Nol)</SelectItem>
                        {customTemplates.length > 0 && (
                          <>
                            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1">
                              Template Tersimpan ({customTemplates.length})
                            </div>
                            {customTemplates.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                <div className="flex items-center justify-between w-full gap-2">
                                  <span className="truncate">{t.name}</span>
                                  {t.classification && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 shrink-0">
                                      {t.classification}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CARD 2: INFORMASI SURAT */}
                  <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3 shadow-none">
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Informasi Surat
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAutoAssignNextNumber}
                        className="h-6 px-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded flex items-center gap-1 border border-blue-200/60 dark:border-blue-800/60 cursor-pointer shadow-none"
                        title="Ambil nomor urut berikutnya"
                      >
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        <span>No. Otomatis (#{getNextSeqNumber(mailHistory)})</span>
                      </Button>
                    </div>

                    {/* 9 Segmen Nomor Surat */}
                    <LetterNumberingBoxes
                      boxes={[numBox1, numBox2, numBox3, numBox4, numBox5, numBox6, numBox7, numBox8, numBox9]}
                      onBoxChange={(index, val) => {
                        const setters = [
                          setNumBox1, setNumBox2, setNumBox3, setNumBox4, setNumBox5,
                          setNumBox6, setNumBox7, setNumBox8, setNumBox9
                        ];
                        setters[index](val);
                      }}
                      letterMode={letterMode}
                      isSequentialNumbering={isSequentialNumbering}
                      onToggleSequential={setIsSequentialNumbering}
                      bulkDuplicateEntries={bulkDuplicateEntries}
                      duplicateEntry={duplicateEntry}
                      duplicateSeqEntry={duplicateSeqEntry}
                      onAutoAssignNextNumber={handleAutoAssignNextNumber}
                      nextSeqNumber={getNextSeqNumber(mailHistory)}
                      parsedBulkRecipientsLength={parsedBulkRecipients.length}
                      firstNomor={getNomorForIndex(0)}
                      lastNomor={getNomorForIndex(Math.max(0, parsedBulkRecipients.length - 1))}
                    />

                    {/* Perihal Surat */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        Perihal Surat *
                      </label>
                      <Input
                        required
                        value={createSubject}
                        onChange={(e) => setCreateSubject(e.target.value)}
                        placeholder="Perihal / agenda surat..."
                        className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>

                    {/* Tujuan / Penerima */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Tujuan / Penerima *</span>
                        </label>
                        {/* Selector Mode Penerima (Tunggal vs Massal) */}
                        <div className="inline-flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setLetterMode("single")}
                            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer border-none ${
                              letterMode === "single"
                                ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 bg-transparent font-medium"
                            }`}
                          >
                            1 Penerima
                          </button>
                          <button
                            type="button"
                            onClick={() => setLetterMode("bulk")}
                            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer border-none flex items-center gap-1 ${
                              letterMode === "bulk"
                                ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 bg-transparent font-medium"
                            }`}
                          >
                            <span>Banyak (Excel)</span>
                            {parsedBulkRecipients.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[9px] font-bold">
                                {parsedBulkRecipients.length}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

                      {letterMode === "bulk" ? (
                        <>
                          <input
                            type="file"
                            ref={excelFileInputRef}
                            onChange={handleExcelUpload}
                            accept=".xlsx, .xls, .csv"
                            className="hidden"
                          />
                          <LetterExcelImporter
                            parsedBulkRecipients={parsedBulkRecipients}
                            bulkRecipientsText={bulkRecipientsText}
                            onBulkRecipientsChange={setBulkRecipientsText}
                            excelColumns={excelColumns}
                            excelRowsData={excelRowsData}
                            activePlaceholders={activePlaceholders}
                            docxValues={docxValues}
                            onUploadExcelClick={() => excelFileInputRef.current?.click()}
                            onDownloadExcelTemplate={handleDownloadExcelTemplate}
                            onLoadPreset={loadPresetRecipients}
                            onOpenAddPlaceholder={() => setIsAddPlaceholderOpen(true)}
                            onInsertPlaceholder={insertPlaceholderAtCursor}
                            previewBulkIndex={previewBulkIndex}
                            onSelectPreviewIndex={setPreviewBulkIndex}
                            getNomorForIndex={getNomorForIndex}
                            getRowDataForIndex={getRowDataForIndex}
                          />
                        </>
                      ) : (
                        <Input
                          required
                          value={createRecipient}
                          onChange={(e) => setCreateRecipient(e.target.value)}
                          placeholder="Nama tujuan / instansi penerima..."
                          className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      )}
                    </div>

                    {/* Kota & Tanggal */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                          Kota
                        </label>
                        <Input
                          value={createSenderLocation}
                          onChange={(e) => setCreateSenderLocation(e.target.value)}
                          placeholder="Purwodadi"
                          className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                          Tanggal
                        </label>
                        <Input
                          value={letterDate}
                          onChange={(e) => setLetterDate(e.target.value)}
                          placeholder="12 Oktober 2026"
                          className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: ISIAN VARIABEL TEMPLATE & PLACEHOLDER KUSTOM */}
                  <LetterDocxPlaceholders
                    detailPlaceholders={detailPlaceholders}
                    docxValues={docxValues}
                    onDocxValueChange={(key, val) =>
                      setDocxValues((prev) => ({
                        ...prev,
                        [key]: val,
                      }))
                    }
                    excelColumns={excelColumns}
                    currentRowData={excelRowsData[previewBulkIndex]?.data || {}}
                    humanizePlaceholderKey={humanizePlaceholderKey}
                    isMultilineField={isMultilineField}
                  />
                </div>

                {/* Footer Form Kiri */}
                <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end bg-zinc-50/50 dark:bg-zinc-950/50 px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <DialogClose render={
                      <Button type="button" variant="outline" className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer">
                        Batal
                      </Button>
                    } />
                    <Button
                      type="submit"
                      disabled={isBatchPrinting || (letterMode === "bulk" && parsedBulkRecipients.length === 0)}
                      className="h-9 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 cursor-pointer flex items-center gap-1.5"
                    >
                      {isBatchPrinting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyiapkan {parsedBulkRecipients.length} Dokumen...</span>
                        </>
                      ) : (
                        <>
                          <Printer className="w-3.5 h-3.5" />
                          <span>
                            {letterMode === "bulk"
                              ? `Terbitkan & Cetak ${parsedBulkRecipients.length} Surat Massal`
                              : "Terbitkan & Cetak PDF"}
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            );
          })()}

          {/* Sisi Kanan: Real-time Live WYSIWYG Canvas */}
          <div className="lg:col-span-8 p-4 md:p-6 flex flex-col gap-3 bg-zinc-100 dark:bg-zinc-950 overflow-y-auto h-full relative">
            <div className="w-full flex flex-col gap-3 relative max-w-3xl mx-auto">
              {/* Carousel / Navigation Bar saat mode Surat Massal */}
              {letterMode === "bulk" && parsedBulkRecipients.length > 0 && (
                <div className="w-full flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl shadow-xs shrink-0">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
                      Pratinjau Surat:
                    </span>
                    <Badge className="bg-blue-600 text-white text-[10px] px-2 py-0.5 h-5 shrink-0">
                      #{previewBulkIndex + 1} dari {parsedBulkRecipients.length}
                    </Badge>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {parsedBulkRecipients[previewBulkIndex]}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0 hidden sm:inline">
                      ({currentPreviewNomor})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!activeFileBase64 && (
                      <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 mr-1">
                        <button
                          type="button"
                          onClick={() => setHtmlCanvasMode("edit")}
                          className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                            htmlCanvasMode === "edit"
                              ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                          }`}
                          title="Mode Edit: Ketik isi surat dan tempatkan placeholder {{...}}"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Template</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHtmlCanvasMode("preview")}
                          className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                            htmlCanvasMode === "preview"
                              ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                          }`}
                          title="Mode Pratinjau: Lihat tampilan surat dengan data terisi per penerima"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Pratinjau Terisi</span>
                        </button>
                      </div>
                    )}
                    {activeFileBase64 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadBulkZip}
                        className="h-7 text-[10px] font-medium text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 mr-1 flex items-center gap-1 cursor-pointer"
                        title="Unduh semua berkas Word sebagai arsip ZIP"
                      >
                        <Download className="w-3 h-3 text-blue-600" />
                        <span className="hidden sm:inline">Unduh ZIP</span>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={previewBulkIndex <= 0}
                      onClick={() => setPreviewBulkIndex((prev) => Math.max(0, prev - 1))}
                      className="h-7 w-7 p-0 cursor-pointer disabled:opacity-30 border-zinc-200 dark:border-zinc-700"
                      title="Penerima Sebelumnya"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-xs font-mono font-semibold px-1 text-zinc-600 dark:text-zinc-300">
                      {previewBulkIndex + 1}/{parsedBulkRecipients.length}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={previewBulkIndex >= parsedBulkRecipients.length - 1}
                      onClick={() => setPreviewBulkIndex((prev) => Math.min(parsedBulkRecipients.length - 1, prev + 1))}
                      className="h-7 w-7 p-0 cursor-pointer disabled:opacity-30 border-zinc-200 dark:border-zinc-700"
                      title="Penerima Berikutnya"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}


              {/* CANVAS KERTAS SURAT (Word Asli / Plain Paper) */}
              <div className="w-full relative min-h-[600px] flex flex-col items-center justify-start">
                {isRenderingDocx && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-xl shadow-lg">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Merender Dokumen Word Asli...
                      </span>
                    </div>
                  </div>
                )}

                <div
                  id="custom-letter-print-area"
                  ref={canvasTextareaRef}
                  contentEditable={htmlCanvasMode === "edit"}
                  suppressContentEditableWarning
                  onInput={() => {
                    if (canvasTextareaRef.current && htmlCanvasMode === "edit") {
                      setCreateContent(canvasTextareaRef.current.innerHTML);
                    }
                  }}
                  onKeyUp={(e) => {
                    saveCanvasSelection();
                    if (e.key === "}" && canvasTextareaRef.current) {
                      updateCanvasFields();
                    }
                  }}
                  onMouseUp={saveCanvasSelection}
                  onSelect={saveCanvasSelection}
                  onBlur={() => {
                    saveCanvasSelection();
                    if (canvasTextareaRef.current) {
                      updateCanvasFields();
                    }
                  }}
                  className={
                    activeFileBase64
                      ? "w-full min-h-[600px] flex flex-col items-center justify-start p-2 sm:p-4 overflow-auto outline-none"
                      : "w-full aspect-[215/330] bg-white text-zinc-900 p-8 sm:p-10 rounded-xl border border-zinc-300 shadow-xl flex flex-col outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 cursor-text overflow-auto"
                  }
                  style={activeFileBase64 ? undefined : { fontFamily: '"Arial Narrow", Arial, sans-serif', lineHeight: "1.35" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* DIALOG MODAL: TAMBAH PLACEHOLDER MANUAL */}
        <Dialog open={isAddPlaceholderOpen} onOpenChange={setIsAddPlaceholderOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Tambah Placeholder Sendiri</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Buat tag variabel baru (misal: <code>&#123;&#123;ruangan&#125;&#125;</code> atau <code>&#123;&#123;keperluan&#125;&#125;</code>) yang dapat Anda tempatkan ke dalam teks surat.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Nama Tag Placeholder *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400">
                    &#123;&#123;
                  </span>
                  <Input
                    value={manualKeyInput}
                    onChange={(e) => setManualKeyInput(e.target.value)}
                    placeholder="contoh: ruangan, keperluan, alamat"
                    className="pl-7 pr-7 h-9 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400">
                    &#125;&#125;
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Gunakan huruf kecil atau garis bawah tanpa spasi (misal: <code>alamat_tujuan</code>).
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Nilai Default / Contoh
                </label>
                <Input
                  value={manualValInput}
                  onChange={(e) => setManualValInput(e.target.value)}
                  placeholder="contoh: Gedung PCNU Lt. 2"
                  className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddPlaceholderOpen(false)}
                className="text-xs h-8"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveManualPlaceholder}
                className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Simpan &amp; Sisipkan ke Surat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
    </>
  );
}