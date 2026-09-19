"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Building,
  Settings,
  ChevronUp,
  ChevronDown,
  FileSignature,
  Printer,
  X,
  Image as ImageIcon,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Layers,
  Columns,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
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

interface LetterGeneratorDialogProps {
  onPublish: (newMailData: {
    nomor: string;
    recipient: string;
    subject: string;
    classification: "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi";
    content: string;
    senderTitle: string;
    senderLocation: string;
  }) => void;
}

interface BulkRow {
  nomorLengkapCustom: string;
  penerima: string;
  [key: string]: string;
}

const TEMPLATES: Record<string, {
  subject: string;
  classification: "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi";
  content: string;
  senderTitle: string;
  senderLocation: string;
}> = {
  undangan: {
    subject: "Undangan Rapat Pleno Pengurus Cabang",
    classification: "Undangan",
    content: `Assalamu'alaikum Warahmatullahi Wabarakatuh

Salam silaturrahim teriring doa kami sampaikan semoga Sahabat-sahabat senantiasa dalam lindungan Allah SWT, serta eksis dalam menjalankan aktivitas keseharian. Amin.

Sehubungan dengan akan dilaksanakannya agenda Rapat Pleno Pengurus Cabang PMII Kota Semarang guna membahas persiapan Konferensi Cabang (KONFERCAB), maka dengan ini kami mengundang seluruh jajaran Pengurus Cabang untuk dapat hadir pada:

Hari, Tanggal : Sabtu, 30 Mei 2026
Waktu         : 19.30 WIB - Selesai
Tempat        : Sekretariat PC PMII Kota Semarang
Agenda        : Rapat Pleno Persiapan KONFERCAB

Demikian surat undangan ini kami sampaikan, atas perhatian dan kehadiran Sahabat-sahabat kami ucapkan terima kasih.

Wallahul Muwaffieq Ilaa Aqwamith Tharieq
Wassalamu'alaikum Warahmatullahi Wabarakatuh`,
    senderTitle: "Sahabat Ketua Umum",
    senderLocation: "Semarang"
  },
  permohonan: {
    subject: "Permohonan Izin Peminjaman Aula Gedung NU",
    classification: "Permohonan",
    content: `Assalamu'alaikum Warahmatullahi Wabarakatuh

Salam silaturrahim teriring doa kami sampaikan semoga Sahabat-sahabat senantiasa dalam lindungan Allah SWT, serta eksis dalam menjalankan aktivitas keseharian. Amin.

Sehubungan dengan akan diselenggarakannya agenda Pelatihan Kader Lanjut (PKL) oleh Pengurus Cabang Pergerakan Mahasiswa Islam Indonesia (PC PMII) Kota Semarang, maka dengan ini kami mengajukan permohonan izin peminjaman Aula Gedung PCNU Kota Semarang yang rencananya akan dilaksanakan pada:

Hari, Tanggal : Jumat - Senin, 12 - 15 Juni 2026
Waktu         : 08.00 WIB - Selesai
Tempat        : Aula Lantai 2 Gedung NU Kota Semarang

Sebagai bahan pertimbangan, bersama ini kami lampirkan proposal kegiatan. Demikian surat permohonan ini kami sampaikan, atas perhatian, izin dan kerjasama Bapak/Ibu kami ucapkan terima kasih.

Wallahul Muwaffieq Ilaa Aqwamith Tharieq
Wassalamu'alaikum Warahmatullahi Wabarakatuh`,
    senderTitle: "Sahabat Ketua Umum",
    senderLocation: "Semarang"
  },
  mandat: {
    subject: "Surat Mandat Delegasi Peserta Musyawarah",
    classification: "Rekomendasi",
    content: `Assalamu'alaikum Warahmatullahi Wabarakatuh

Salam silaturrahim teriring doa kami sampaikan semoga Sahabat-sahabat senantiasa dalam lindungan Allah SWT, serta eksis dalam menjalankan aktivitas keseharian. Amin.

Pengurus Cabang Pergerakan Mahasiswa Islam Indonesia (PC PMII) Kota Semarang dengan ini memberikan mandat kepada:

Nama      : Sahabat Ahmad Fauzi
Jabatan   : Anggota Bidang Kaderisasi PC PMII Kota Semarang
NTA       : PMII.33.74.001.00245

Untuk menjadi utusan resmi/delegasi peserta dalam agenda Musyawarah Wilayah (MUSWIL) PKC PMII Jawa Tengah yang akan diselenggarakan pada tanggal 5 - 7 Juni 2026 di Surakarta.

Demikian surat mandat ini kami berikan untuk dapat dipergunakan sebagaimana mestinya dan dilaksanakan dengan penuh tanggung jawab.

Wallahul Muwaffieq Ilaa Aqwamith Tharieq
Wassalamu'alaikum Warahmatullahi Wabarakatuh`,
    senderTitle: "Sahabat Ketua Umum",
    senderLocation: "Semarang"
  },
  custom: {
    subject: "Surat Keterangan Pengurus Aktif",
    classification: "Keputusan",
    content: `Assalamu'alaikum Warahmatullahi Wabarakatuh

Salam silaturrahim teriring doa kami sampaikan semoga Sahabat-sahabat senantiasa dalam lindungan Allah SWT, serta eksis dalam menjalankan aktivitas keseharian. Amin.

Pengurus Cabang Pergerakan Mahasiswa Islam Indonesia (PC PMII) Kota Semarang menerangkan dengan sesungguhnya bahwa:

Nama      : Sahabati Siti Aminah
Jabatan   : Wakil Sekretaris Bidang Eksternal
Alamat    : Jl. Kaligawe Raya No. 4, Semarang

Adalah benar-benar merupakan pengurus aktif di Pengurus Cabang PMII Kota Semarang periode 2025-2026 dan yang bersangkutan memiliki dedikasi yang baik dalam berorganisasi.

Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.

Wallahul Muwaffieq Ilaa Aqwamith Tharieq
Wassalamu'alaikum Warahmatullahi Wabarakatuh`,
    senderTitle: "Sahabat Ketua Umum",
    senderLocation: "Semarang"
  }
};

export default function LetterGeneratorDialog({ onPublish }: LetterGeneratorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const canvasTextareaRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  // Mode Pembuatan (SINGLE vs BULK)
  const [generationMode, setGenerationMode] = useState<"single" | "bulk">("single");

  // Form States
  const [createTemplate, setCreateTemplate] = useState<string>("undangan");
  const [createRecipient, setCreateRecipient] = useState("Pengurus Komisariat PMII se-Kota Semarang");
  const [createSubject, setCreateSubject] = useState(TEMPLATES.undangan.subject);
  const [createClassification, setCreateClassification] = useState<"Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi">(TEMPLATES.undangan.classification);
  const [createContent, setCreateContent] = useState(TEMPLATES.undangan.content.replace(/\n/g, '<br>'));
  const [createSenderLocation, setCreateSenderLocation] = useState(TEMPLATES.undangan.senderLocation);

  // Kop & Footer Settings
  const [showKopFooterSettings, setShowKopFooterSettings] = useState(false);
  const [createKopTitle, setCreateKopTitle] = useState("PERGERAKAN MAHASISWA ISLAM INDONESIA");
  const [createKopSubtitle, setCreateKopSubtitle] = useState("PENGURUS CABANG KOTA SEMARANG");
  const [createKopEnglish, setCreateKopEnglish] = useState("Branch Board of Indonesian Moslem Student Movement");
  const [createKopAddress, setCreateKopAddress] = useState("Sekretariat: Jl. Sunan Kalijaga No. 10 | Telp: +62 812-3456-7890 | Email: pc.semarang@pmii.or.id");
  const [createFooterLeft, setCreateFooterLeft] = useState("Dzikir, Fikir, Amal Sholeh");
  const [createLogoUrl, setCreateLogoUrl] = useState<string>("");

  const [isCanvasFocused, setIsCanvasFocused] = useState(false);

  // State koordinat Menu Klik Kanan (Context Menu)
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0
  });

  // STATE MODE 1: SINGLE SURAT (9 Kotak)
  const [numBox1, setNumBox1] = useState("021");
  const [numBox2, setNumBox2] = useState("PK");
  const [numBox3, setNumBox3] = useState("XI");
  const [numBox4, setNumBox4] = useState("Z-03");
  const [numBox5, setNumBox5] = useState("01");
  const [numBox6, setNumBox6] = useState("010");
  const [numBox7, setNumBox7] = useState("B-II");
  const [numBox8, setNumBox8] = useState("12");
  const [numBox9, setNumBox9] = useState("2026");

  const boxRefs = [
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)
  ];

  // STATE MODE 2: MASSAL/BULK DINAMIS
  const [bulkColumns, setBulkColumns] = useState<string[]>(["Nomor_Surat", "Penerima"]);
  const [bulkDataRows, setBulkDataRows] = useState<Record<string, string>[]>([
    { "Nomor_Surat": "021.PK-XI.Z-03.01.010.B-II.12.2026", "Penerima": "Pengurus Komisariat Sultan Agung" },
    { "Nomor_Surat": "022.PK-XI.Z-03.01.011.B-II.12.2026", "Penerima": "Pengurus Komisariat Walisongo" },
    { "Nomor_Surat": "023.PK-XI.Z-03.01.012.B-II.12.2026", "Penerima": "Pengurus Komisariat UIN Semarang" }
  ]);
  const [newColumnName, setNewColumnName] = useState("");
  const [previewIndex, setPreviewIndex] = useState<number>(0);

  const baseSingleNomor = `${numBox1}.${numBox2}-${numBox3}.${numBox4}.${numBox5}.${numBox6}.${numBox7}.${numBox8}.${numBox9}`;
  const activeSenderTitle = TEMPLATES[createTemplate]?.senderTitle || "Sahabat Ketua Umum";

  // Parser Text Dinamis untuk Variabel
  const getDynamicParsedText = (baseText: string, rowIndex: number) => {
    if (generationMode === "single" || !baseText) return baseText;
    let parsed = baseText;
    const activeRow = bulkDataRows[rowIndex];
    if (activeRow) {
      bulkColumns.forEach((col) => {
        const value = activeRow[col] || "";
        parsed = parsed.split(`{${col}}`).join(value);
      });
    }
    return parsed;
  };

  // Deklarasi Variabel Preview Utama
  const currentPreviewNomor = generationMode === "single" 
    ? getDynamicParsedText(baseSingleNomor, previewIndex) 
    : getDynamicParsedText(bulkDataRows[previewIndex]?.["Nomor_Surat"] || "{Nomor_Surat}", previewIndex);

  const currentPreviewRecipient = generationMode === "single" 
    ? getDynamicParsedText(createRecipient, previewIndex) 
    : getDynamicParsedText(bulkDataRows[previewIndex]?.["Penerima"] || "{Penerima}", previewIndex);

  const currentPreviewSubject = getDynamicParsedText(createSubject, previewIndex);
  const currentPreviewLocation = getDynamicParsedText(createSenderLocation, previewIndex);
  const currentPreviewBodyContent = getDynamicParsedText(createContent, previewIndex);
  const currentPreviewFooterLeft = getDynamicParsedText(createFooterLeft, previewIndex);

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    window.addEventListener("click", handleCloseMenu);
    return () => window.removeEventListener("click", handleCloseMenu);
  }, []);

  useEffect(() => {
    if (previewIndex >= bulkDataRows.length) {
      setPreviewIndex(Math.max(0, bulkDataRows.length - 1));
    }
  }, [bulkDataRows, previewIndex]);

  const handleTemplateChange = (val: string | null) => {
    if (!val) return;
    setCreateTemplate(val);
    const tmpl = TEMPLATES[val];
    if (tmpl) {
      setCreateSubject(tmpl.subject);
      setCreateClassification(tmpl.classification);
      setCreateContent(tmpl.content.replace(/\n/g, '<br>'));
      setCreateSenderLocation(tmpl.senderLocation);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCreateLogoUrl(url);
    }
  };

  const handleRemoveLogo = () => {
    setCreateLogoUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBoxChange = (index: number, value: string, setBoxState: (val: string) => void, maxLength: number) => {
    setBoxState(value);
    if (value.length >= maxLength && index < 8) {
      boxRefs[index + 1]?.current?.focus();
    }
  };

  const handleAddCustomColumn = () => {
    const safeName = newColumnName.trim().replace(/\s+/g, "_");
    if (!safeName) return;
    if (bulkColumns.includes(safeName)) {
      alert("Nama kolom tersebut sudah terdaftar.");
      return;
    }
    setBulkColumns([...bulkColumns, safeName]);
    setBulkDataRows(bulkDataRows.map(row => ({ ...row, [safeName]: "" })));
    setNewColumnName("");
  };

  const handleRemoveCustomColumn = (colName: string) => {
    setBulkColumns(bulkColumns.filter(c => c !== colName));
    setBulkDataRows(bulkDataRows.map(row => {
      const copy = { ...row };
      delete copy[colName];
      return copy;
    }));
  };

  const handleAddBulkRow = () => {
    const newRowObj: Record<string, string> = {};
    bulkColumns.forEach(col => {
      newRowObj[col] = "";
    });
    setBulkDataRows([...bulkDataRows, newRowObj]);
  };

  const handleRemoveBulkRow = (index: number) => {
    if (bulkDataRows.length <= 1) {
      alert("Minimal harus menyisakan satu baris data surat.");
      return;
    }
    setBulkDataRows(bulkDataRows.filter((_, idx) => idx !== index));
  };

  const handleUpdateBulkCell = (rowIndex: number, colName: string, value: string) => {
    const updated = [...bulkDataRows];
    updated[rowIndex][colName] = value;
    setBulkDataRows(updated);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length < 2) {
        alert("File CSV kosong.");
        return;
      }

      const parsedHeaders = lines[0].split(/[,;\t]/).map(h => h.replace(/^["']|["']$/g, "").trim().replace(/\s+/g, "_"));
      setBulkColumns(parsedHeaders);

      const parsedRows: Record<string, string>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(/[,;\t]/).map(col => col.replace(/^["']|["']$/g, "").trim());
        const rowObj: Record<string, string> = {};
        parsedHeaders.forEach((header, idx) => {
          rowObj[header] = columns[idx] || "";
        });
        parsedRows.push(rowObj);
      }

      setBulkDataRows(parsedRows);
      setPreviewIndex(0);
      alert(`Berhasil memuat data kustom massal.`);
    };
    reader.readAsText(file);
  };

  const insertVariableAtCaret = (colName: string) => {
    const el = canvasTextareaRef.current;
    if (!el) return;
    // Pulihkan selection sebelum context menu mengambil fokus dari canvas
    const sel = window.getSelection();
    if (savedSelectionRef.current && sel) {
      el.focus();
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    } else {
      el.focus();
    }
    document.execCommand('insertText', false, `{${colName}}`);
    savedSelectionRef.current = null;
  };

  const applyFormat = (command: 'bold' | 'italic' | 'underline') => {
    const el = canvasTextareaRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false);
    setTimeout(() => {
      if (canvasTextareaRef.current) {
        setCreateContent(canvasTextareaRef.current.innerHTML);
      }
    }, 0);
  };

  const applyFontSize = (sizeInPt: string) => {
    const el = canvasTextareaRef.current;
    if (!el || !sizeInPt) return;
    // Pulihkan selection yang tersimpan sebelum select dropdown membuat focus berpindah
    const sel = window.getSelection();
    if (savedSelectionRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
    // Gunakan '7' sebagai marker unik, lalu ganti <font> dengan <span style="font-size">
    document.execCommand('fontSize', false, '7');
    const fonts = el.querySelectorAll('font[size="7"]');
    fonts.forEach((font) => {
      const span = document.createElement('span');
      span.style.fontSize = sizeInPt;
      span.innerHTML = (font as HTMLElement).innerHTML;
      font.parentNode?.replaceChild(span, font);
    });
    savedSelectionRef.current = null;
    setCreateContent(el.innerHTML);
  };

  const applyTextTransform = (transform: 'uppercase' | 'lowercase' | 'none') => {
    const el = canvasTextareaRef.current;
    if (!el) return;
    // Pulihkan selection tersimpan
    const sel = window.getSelection();
    if (savedSelectionRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    } else {
      el.focus();
    }
    // Gunakan fontSize '7' sebagai marker lalu ganti dengan span text-transform
    document.execCommand('fontSize', false, '7');
    const fonts = el.querySelectorAll('font[size="7"]');
    fonts.forEach((font) => {
      const span = document.createElement('span');
      span.style.textTransform = transform;
      span.innerHTML = (font as HTMLElement).innerHTML;
      font.parentNode?.replaceChild(span, font);
    });
    savedSelectionRef.current = null;
    setCreateContent(el.innerHTML);
  };

  const applyFontFamily = (family: string) => {
    const el = canvasTextareaRef.current;
    if (!el || !family) return;
    const sel = window.getSelection();
    if (savedSelectionRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    } else {
      el.focus();
    }
    document.execCommand('fontSize', false, '7');
    const fonts = el.querySelectorAll('font[size="7"]');
    fonts.forEach((font) => {
      const span = document.createElement('span');
      span.style.fontFamily = family;
      span.innerHTML = (font as HTMLElement).innerHTML;
      font.parentNode?.replaceChild(span, font);
    });
    savedSelectionRef.current = null;
    setCreateContent(el.innerHTML);
  };

  // Bangun HTML canvas penuh dari state saat ini
  const buildCanvasHtml = () => {
    const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    const today = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;
    const logoHtml = createLogoUrl
      ? `<img src="${createLogoUrl}" alt="Logo" style="width:56px;height:56px;object-fit:contain;margin-right:12px;flex-shrink:0;" />`
      : `<div style="width:48px;height:48px;border-radius:50%;background:#0A2A5C;color:white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11pt;border:1px solid rgba(198,149,17,0.3);margin-right:12px;flex-shrink:0;">PMII</div>`;
    return `
<div data-section="kop" style="display:flex;align-items:center;padding-bottom:16px;border-bottom:3px double #0A2A5C;width:100%;margin-bottom:20px;">
  ${logoHtml}
  <div style="display:flex;flex-direction:column;text-align:center;flex:1;padding-right:24px;">
    <span data-field="kop-subtitle" style="font-family:'Arial Narrow', Arial, sans-serif;font-size:14pt;font-weight:bold;text-transform:uppercase;color:#0A2A5C;line-height:1.0;">${createKopSubtitle}</span>
    <span data-field="kop-title" style="font-family:'Arial Narrow', Arial, sans-serif;font-size:16pt;font-weight:bold;text-transform:uppercase;color:#0A2A5C;line-height:1.0;margin-top:2px;">${createKopTitle}</span>
    <span data-field="kop-english" style="font-family:'Monotype Corsiva', 'Apple Chancery', cursive;font-size:11pt;color:#0A2A5C;line-height:1.0;margin-top:2px;">${createKopEnglish}</span>
    <span data-field="kop-address" style="font-family:'Arial Narrow', Arial, sans-serif;font-size:11pt;color:#0A2A5C;line-height:1.0;margin-top:4px;white-space:pre-line;">${createKopAddress}</span>
  </div>
</div>
<div style="font-size:11pt;margin-bottom:20px;display:flex;justify-content:space-between;color:#27272a;">
  <div style="line-height:1.0;">
    <div><strong>Nomor:</strong> <span data-field="nomor-value">${currentPreviewNomor}</span></div>
    <div><strong>Lamp:</strong> -</div>
    <div><strong>Hal:</strong> <u data-field="perihal-value">${currentPreviewSubject || '...'}</u></div>
  </div>
  <div data-field="location-date">${currentPreviewLocation || 'Semarang'}, ${today}</div>
</div>
<div data-field="recipient" style="font-size:11pt;margin-bottom:16px;color:#27272a;line-height:1.0;border-bottom:2px dashed #bfdbfe;padding-bottom:16px;">
  Kepada Yang Terhormat,<br/>
  <strong data-field="recipient-name">${currentPreviewRecipient}</strong><br/>
  di Tempat
</div>
<div data-field="body" style="flex:1;border-bottom:2px dashed #ede9fe;padding:8px 0;min-height:220px;word-break:break-word;white-space:pre-wrap;font-size:11pt;text-align:justify;line-height:1.0;margin-bottom:8px;">${createContent || '<span style="color:#a1a1aa;">Ketik isi surat di sini...</span>'}</div>
<div style="padding-top:16px;margin-top:auto;">
  <div style="border-top:1px solid #f4f4f5;padding-top:12px;display:flex;justify-content:space-between;align-items:center;">
    <div data-field="footer-text" style="font-size:12pt;color:#2563eb;white-space:pre-line;line-height:1.0;text-align:center;flex:1;padding:8px 16px;font-family:'Monotype Corsiva','Apple Chancery',cursive;">${currentPreviewFooterLeft}</div>
  </div>
</div>`;
  };

  // Update field spesifik secara imperatif (tanpa rebuild penuh) saat state berubah
  const updateCanvasFields = () => {
    const canvas = canvasTextareaRef.current;
    if (!canvas) return;
    const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    const today = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;
    const set = (field: string, val: string, isHtml = false) => {
      const el = canvas.querySelector(`[data-field="${field}"]`) as HTMLElement | null;
      if (!el) return;
      if (isHtml) el.innerHTML = val; else el.textContent = val;
    };
    // Update logo jika berubah
    const kopSection = canvas.querySelector('[data-section="kop"]');
    if (kopSection && kopSection.firstElementChild) {
      const logoEl = kopSection.firstElementChild as HTMLElement;
      if (createLogoUrl && logoEl.tagName !== 'IMG') {
        logoEl.outerHTML = `<img src="${createLogoUrl}" alt="Logo" style="width:56px;height:56px;object-fit:contain;margin-right:12px;flex-shrink:0;" />`;
      } else if (!createLogoUrl && logoEl.tagName === 'IMG') {
        logoEl.outerHTML = `<div style="width:48px;height:48px;border-radius:50%;background:#0A2A5C;color:white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11pt;border:1px solid rgba(198,149,17,0.3);margin-right:12px;flex-shrink:0;">PMII</div>`;
      } else if (createLogoUrl && logoEl.tagName === 'IMG') {
        (logoEl as HTMLImageElement).src = createLogoUrl;
      }
    }
    set('kop-title', createKopTitle);
    set('kop-subtitle', createKopSubtitle);
    set('kop-english', createKopEnglish);
    set('kop-address', createKopAddress);
    set('nomor-value', currentPreviewNomor);
    set('perihal-value', currentPreviewSubject || '...');
    set('location-date', `${currentPreviewLocation || 'Semarang'}, ${today}`);
    set('recipient-name', currentPreviewRecipient);
    set('footer-text', currentPreviewFooterLeft);
  };

  // Rebuild penuh canvas saat dialog dibuka atau template berubah
  useEffect(() => {
    const el = canvasTextareaRef.current;
    if (!el) return;
    el.innerHTML = buildCanvasHtml();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, createTemplate, createLogoUrl]);

  // Update field spesifik tanpa rebuild (preserves direct canvas edits)
  useEffect(() => {
    updateCanvasFields();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createKopTitle, createKopSubtitle, createKopAddress, createKopEnglish,
      currentPreviewNomor, currentPreviewSubject, currentPreviewLocation,
      currentPreviewRecipient, currentPreviewFooterLeft, createContent]);

  // Event Klik Kanan — simpan selection agar bisa dipulihkan setelah context menu button diklik
  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    if (generationMode !== "bulk") return;
    e.preventDefault();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
    setContextMenu({
      visible: true,
      x: e.clientX + 5,
      y: e.clientY + 2
    });
  };

  const handlePrintLetter = () => {
    const printContent = document.getElementById("custom-letter-print-area");
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    if (generationMode === "single") {
      executePrintWindow(printWindow, printContent.innerHTML, currentPreviewNomor);
    } else {
      let masterHtml = "";
      bulkDataRows.forEach((row, idx) => {
        const loopNomor = getDynamicParsedText(row["Nomor_Surat"] || "{Nomor_Surat}", idx);
        const loopPenerima = getDynamicParsedText(row["Penerima"] || "{Penerima}", idx);
        const loopSubject = getDynamicParsedText(createSubject, idx);
        const loopLocation = getDynamicParsedText(createSenderLocation, idx);
        const loopBody = getDynamicParsedText(createContent, idx);
        const loopFooterLeft = getDynamicParsedText(createFooterLeft, idx);

        masterHtml += `
          <div class="f4-page-break" style="${idx > 0 ? 'page-break-before: always;' : ''}">
            <header class="letter-header" style="position: relative; padding-bottom: 20px; margin-bottom: 16px; border-bottom: 2px dashed #bfdbfe;">
              <div class="kop-surat" style="display: flex; align-items: center; border-bottom: 3px double #0A2A5C; padding-bottom: 15px; margin-bottom: 25px;">
                ${createLogoUrl ? `<img src="${createLogoUrl}" style="width: 55px; height: 55px; object-fit: contain; margin-right: 15px; flex-shrink: 0;" />` : `<div style="width: 55px; height: 55px; border-radius: 50%; background-color: #0A2A5C; color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11pt; margin-right: 15px; border: 1px solid #c69511; flex-shrink: 0;">PMII</div>`}
                <div style="text-align: center; flex: 1; pr: 24px; display: flex; flex-direction: column;">
                  <span style="font-family: 'Arial Narrow', Arial, sans-serif; font-size: 14pt; font-weight: bold; text-transform: uppercase; color: #0A2A5C; line-height: 1.0;">${createKopSubtitle}</span>
                  <span style="font-family: 'Arial Narrow', Arial, sans-serif; font-size: 16pt; font-weight: bold; text-transform: uppercase; color: #0A2A5C; line-height: 1.0; margin-top: 2px;">${createKopTitle}</span>
                  <span style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive; font-size: 11pt; color: #0A2A5C; line-height: 1.0; margin-top: 2px;">${createKopEnglish}</span>
                  <span style="font-family: 'Arial Narrow', Arial, sans-serif; font-size: 11pt; color: #0A2A5C; line-height: 1.0; margin-top: 4px; white-space: pre-line;">${createKopAddress}</span>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11pt;">
                <div>
                  <div><strong>Nomor:</strong> ${loopNomor}</div>
                  <div><strong>Lamp:</strong> -</div>
                  <div><strong>Hal:</strong> <u>${loopSubject}</u></div>
                </div>
                <div>${loopLocation}, ${new Date().getDate()} ${["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][new Date().getMonth()]} ${new Date().getFullYear()}</div>
              </div>
              <div style="margin-bottom: 20px; font-size: 11pt;">Kepada Yang Terhormat,<br/><strong>${loopPenerima}</strong><br/>di Tempat</div>
              <div style="font-style: italic; margin-bottom: 15px;">Assalamu'alaikum Warahmatullahi Wabarakatuh</div>
            </header>
            <main style="flex: 1; padding: 16px 0; border-bottom: 2px dashed #ddd;">
              <div style="text-align: justify; white-space: normal; margin-bottom: 20px; font-size: 11pt;">${loopBody}</div>
            </main>
            <footer style="padding-top: 20px; margin-top: auto;">
              <div style="display: flex; justify-content: space-between; align-items: center; pt: 12px;">
                <div style="font-size: 12pt; color: #2563eb; font-family: 'Monotype Corsiva', cursive; text-align: center; flex: 1; padding: 0 16px;">${loopFooterLeft}</div>
                <div style="text-align: center; width: 180px;">
                  <span style="font-size: 9pt; text-transform: uppercase; color: #666;">Hormat Kami,</span><br/>
                  <span style="font-size: 10pt; font-weight: bold; margin-top: 2px;">${activeSenderTitle}</span>
                  <div style="height: 48px;"></div>
                  <span style="font-size: 10pt; font-weight: black; border-top: 1px solid #333; padding: 2px 8px;">Sahabat Pengurus</span>
                </div>
              </div>
            </footer>
          </div>
        `;
      });
      executePrintWindow(printWindow, masterHtml, `Cetak Massal - ${bulkDataRows.length} Surat`);
    }
  };

  const executePrintWindow = (printWindow: Window, htmlContent: string, docTitle: string) => {
    printWindow.document.write(`
      <html>
        <head>
          <title>${docTitle}</title>
          <style>
            @page { size: 215mm 330mm; margin: 20mm; }
            body { font-family: "Arial Narrow", Arial, sans-serif; color: #111; background: white; margin: 0; padding: 0; line-height: 1.0; font-size: 11pt; }
            * { box-sizing: border-box; }
            .print-label { display: none !important; }
            .f4-page-break { display: flex; flex-direction: column; min-height: 290mm; box-sizing: border-box; }
          </style>
        </head>
        <body>
          <div style="padding: 10px;">${htmlContent}</div>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPublish({
      nomor: currentPreviewNomor,
      recipient: currentPreviewRecipient,
      subject: currentPreviewSubject,
      classification: createClassification,
      content: getDynamicParsedText(createContent, previewIndex),
      senderTitle: activeSenderTitle,
      senderLocation: currentPreviewLocation
    });
    handlePrintLetter();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <Button className="border border-pmii-blue/30 bg-pmii-blue/5 text-pmii-blue hover:bg-pmii-blue/10 dark:border-[#c69511]/30 dark:bg-[#c69511]/5 dark:text-[#c69511] dark:hover:bg-[#c69511]/10 hover:scale-[1.01] active:scale-[0.99] transition-all font-bold px-4 py-2 text-xs rounded-xl shadow-none flex items-center gap-2 cursor-pointer">
          <FileText className="w-4 h-4" /> Buat Surat Custom
        </Button>
      } />
      
      <DialogContent showCloseButton={false} className="w-[95vw] max-w-7xl h-[92vh] md:h-[88vh] bg-white dark:bg-[#080d16] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-0 gap-0 flex flex-col overflow-hidden">
        
        {/* Header Modul */}
        <div className="p-5 bg-gradient-to-r from-pmii-blue to-blue-900 dark:from-[#051125] dark:to-[#08152c] text-white border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pmii-gold/15 flex items-center justify-center text-pmii-gold border border-pmii-gold/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white">Pembuat Surat Custom (Letter Generator)</h2>
                <p className="text-[11px] text-zinc-300">Lakukan **Klik Kanan** langsung di area pengetikan kertas pratinjau untuk memunculkan menu variabel kustom di samping kursor.</p>
              </div>
            </div>
            <DialogClose render={
              <button className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer border-none">
                <X className="w-4.5 h-4.5" />
              </button>
            } />
          </div>
        </div>

        {/* Workspace Panel */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
          
          {/* Sisi Kiri: Form Input */}
          <form onSubmit={handleSubmit} className="lg:col-span-5 border-r border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-black/10 h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* TABS MODE PEMBUATAN */}
              <div className="bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-xl border flex items-center w-full">
                <button
                  type="button"
                  onClick={() => setGenerationMode("single")}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer border-none ${generationMode === "single" ? "bg-white dark:bg-zinc-800 text-pmii-blue dark:text-pmii-gold shadow-xs" : "text-zinc-500"}`}
                >
                  <FileText className="w-3.5 h-3.5 inline mr-1.5" /> Single Surat
                </button>
                <button
                  type="button"
                  onClick={() => setGenerationMode("bulk")}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer border-none ${generationMode === "bulk" ? "bg-white dark:bg-zinc-800 text-pmii-blue dark:text-pmii-gold shadow-xs" : "text-zinc-500"}`}
                >
                  <Layers className="w-3.5 h-3.5 inline mr-1.5" /> Buat Banyak (Dinamis Kolom)
                </button>
              </div>

              {/* GROUP 1: KOP SURAT & LOGO */}
              <div className="border border-zinc-200 dark:border-zinc-800 border-l-[3px] border-l-blue-400 rounded-xl bg-white dark:bg-[#090d16]/30 shadow-xs">
                <div className="bg-blue-50/60 dark:bg-blue-950/20 px-4 py-2.5 border-b border-blue-100 dark:border-blue-900/40 flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[9px] font-black flex items-center justify-center">1</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" /> Header &amp; Kop Surat
                  </span>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Logo Image Upload */}
                  <div className="space-y-1.5 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-pmii-blue" /> Logo Lembaga Kustom (Kop)
                    </label>
                    <div className="flex items-center gap-3 mt-1">
                      {createLogoUrl ? (
                        <div className="relative w-12 h-12 bg-white rounded-lg border border-zinc-200 p-1 flex items-center justify-center shrink-0">
                          <img src={createLogoUrl} alt="Preview" className="w-full h-full object-contain" />
                          <button type="button" onClick={handleRemoveLogo} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 shadow-sm cursor-pointer border-none">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-xl border-2 border-dashed border-zinc-300 flex items-center justify-center text-zinc-400 cursor-pointer bg-white dark:bg-zinc-900">
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleLogoChange} className="hidden" />
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-7 text-[10px] font-bold">
                          {createLogoUrl ? "Ganti Gambar" : "Pilih Logo Gambar"}
                        </Button>
                        <p className="text-[9px] text-zinc-400 mt-1">Format gambar transparan PNG/JPG maks 2MB.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Template</label>
                      <Select value={createTemplate} onValueChange={handleTemplateChange}>
                        <SelectTrigger className="w-full text-xs bg-white dark:bg-zinc-900 rounded-xl">
                          <SelectValue placeholder="Pilih Template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="undangan">✉️ Rapat Pleno (Undangan)</SelectItem>
                          <SelectItem value="permohonan">🏫 Peminjaman Aula (Permohonan)</SelectItem>
                          <SelectItem value="mandat">📜 Surat Mandat (Delegasi)</SelectItem>
                          <SelectItem value="custom">✍️ Surat Keterangan (Custom)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Klasifikasi</label>
                      <Select value={createClassification} onValueChange={(val) => setCreateClassification(val as any)}>
                        <SelectTrigger className="w-full text-xs bg-white dark:bg-zinc-900 rounded-xl">
                          <SelectValue placeholder="Pilih Klasifikasi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Instruksi">Instruksi</SelectItem>
                          <SelectItem value="Permohonan">Permohonan</SelectItem>
                          <SelectItem value="Undangan">Undangan</SelectItem>
                          <SelectItem value="Keputusan">Keputusan</SelectItem>
                          <SelectItem value="Rekomendasi">Rekomendasi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {generationMode === "single" ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Nomor Surat Resmi (Single)</label>
                        <div className="grid grid-cols-9 gap-1 bg-zinc-50 dark:bg-zinc-900/40 p-1.5 border rounded-xl">
                          <Input ref={boxRefs[0]} maxLength={3} placeholder="021" value={numBox1} onChange={(e) => handleBoxChange(0, e.target.value, setNumBox1, 3)} className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-950 border shadow-none" />
                          <Input ref={boxRefs[1]} maxLength={2} placeholder="PK" value={numBox2} onChange={(e) => handleBoxChange(1, e.target.value, setNumBox2, 2)} className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-950 border shadow-none" />
                          <Input ref={boxRefs[2]} maxLength={4} placeholder="XI" value={numBox3} onChange={(e) => handleBoxChange(2, e.target.value, setNumBox3, 4)} className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-950 border shadow-none" />
                          <Input ref={boxRefs[3]} maxLength={5} placeholder="Z-03" value={numBox4} onChange={(e) => handleBoxChange(3, e.target.value, setNumBox4, 5)} className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-950 border shadow-none" />
                          <Input ref={boxRefs[4]} maxLength={2} placeholder="01" value={numBox5} onChange={(e) => handleBoxChange(4, e.target.value, setNumBox5, 2)} className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-950 border shadow-none" />
                          <Input ref={boxRefs[5]} maxLength={3} placeholder="010" value={numBox6} onChange={(e) => handleBoxChange(5, e.target.value, setNumBox6, 3)} className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-950 border shadow-none" />
                          <Input ref={boxRefs[6]} maxLength={4} placeholder="B-II" value={numBox7} onChange={(e) => handleBoxChange(6, e.target.value, setNumBox7, 4)} className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-950 border shadow-none" />
                          <Input ref={boxRefs[7]} maxLength={2} placeholder="12" value={numBox8} onChange={(e) => handleBoxChange(7, e.target.value, setNumBox8, 2)} className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-950 border shadow-none" />
                          <Input ref={boxRefs[8]} maxLength={4} placeholder="2026" value={numBox9} onChange={(e) => handleBoxChange(8, e.target.value, setNumBox9, 4)} className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-950 border shadow-none" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Tujuan / Penerima</label>
                        <Input required value={createRecipient} onChange={(e) => setCreateRecipient(e.target.value)} className="text-xs rounded-xl" />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* LAYOUT EDIT DATA SURAT MASSAL */}
                      <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 border rounded-2xl">
                        <div className="space-y-1.5 bg-white dark:bg-zinc-900 p-2.5 border rounded-xl">
                          <label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1">
                            <Columns className="w-3.5 h-3.5 text-blue-500" /> Tambah Kolom Variabel
                          </label>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="Misal: Nomor_Surat, Penerima, Nama_Kader" 
                              value={newColumnName} 
                              onChange={(e) => setNewColumnName(e.target.value)}
                              className="h-8 text-xs"
                            />
                            <Button type="button" size="sm" onClick={handleAddCustomColumn} className="h-8 px-3 bg-blue-600 text-white font-bold text-xs shrink-0">
                              + Kolom
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-medium text-zinc-500">Lakukan klik kanan di area isi surat preview untuk menyisipkan variabel kustom.</span>
                          <input type="file" ref={excelInputRef} accept=".csv,.txt" onChange={handleExcelUpload} className="hidden" />
                          <Button type="button" size="sm" variant="outline" onClick={() => excelInputRef.current?.click()} className="h-7 text-[10px] font-bold bg-white border-zinc-200 text-pmii-blue shrink-0">
                            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> CSV Impor
                          </Button>
                        </div>

                        <div className="w-full overflow-x-auto border border-zinc-200 bg-white rounded-xl max-h-48 shadow-xs">
                          <table className="w-full text-left text-[11px] min-w-[400px]">
                            <thead className="bg-zinc-100 font-bold text-[10px] border-b">
                              <tr>
                                {bulkColumns.map((col) => (
                                  <th key={col} className="px-3 py-2">
                                    <div className="flex items-center justify-between group gap-2">
                                      <span className="font-mono text-zinc-700">{col}</span>
                                      <button type="button" onClick={() => handleRemoveCustomColumn(col)} className="text-rose-400 hover:text-rose-600 hidden group-hover:block bg-transparent border-none cursor-pointer">×</button>
                                    </div>
                                  </th>
                                ))}
                                <th className="w-10 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {bulkDataRows.map((row, rIdx) => (
                                <tr key={rIdx} className={previewIndex === rIdx ? "bg-blue-50/60" : ""}>
                                  {bulkColumns.map((col) => (
                                    <td key={col} className="p-1">
                                      <Input value={row[col] || ""} onChange={(e) => handleUpdateBulkCell(rIdx, col, e.target.value)} onFocus={() => setPreviewIndex(rIdx)} className="h-8 text-[11px] px-2 bg-transparent border-none shadow-none" />
                                    </td>
                                  ))}
                                  <td className="p-1 text-center">
                                    <button type="button" onClick={() => handleRemoveBulkRow(rIdx)} className="text-rose-500 hover:text-rose-600 border-none bg-transparent cursor-pointer p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <Button type="button" variant="ghost" size="sm" onClick={handleAddBulkRow} className="w-full text-xs font-bold text-zinc-600 h-8.5 bg-white border border-dashed rounded-xl">
                          <Plus className="w-3.5 h-3.5 mr-1 inline" /> Tambah Baris Baru
                        </Button>
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Perihal / Hal</label>
                    <Input required value={createSubject} onChange={(e) => setCreateSubject(e.target.value)} className="text-xs rounded-xl" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Kota Pengirim</label>
                    <Input value={createSenderLocation} onChange={(e) => setCreateSenderLocation(e.target.value)} className="text-xs rounded-xl" />
                  </div>

                  {/* KOP Collapse Settings */}
                  <div className="border border-zinc-150 rounded-xl overflow-hidden bg-zinc-50/50">
                    <button type="button" onClick={() => setShowKopFooterSettings(!showKopFooterSettings)} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-extrabold uppercase text-zinc-500 border-none text-left cursor-pointer">
                      <span className="flex items-center gap-1.5"><Settings className="w-3.5 h-3.5 text-pmii-gold" /> Sesuaikan Kop Teks</span>
                      {showKopFooterSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    
                    {showKopFooterSettings && (
                      <div className="p-3 border-t border-zinc-150 space-y-3 bg-white dark:bg-black/25">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Tingkat Kepengurusan (Kop Line 1)</label>
                          <Input value={createKopSubtitle} onChange={(e) => setCreateKopSubtitle(e.target.value)} className="text-xs h-8" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Nama Organisasi (Kop Line 2)</label>
                          <Input value={createKopTitle} onChange={(e) => setCreateKopTitle(e.target.value)} className="text-xs h-8" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Terjemahan Inggris (Kop Line 3)</label>
                          <Input value={createKopEnglish} onChange={(e) => setCreateKopEnglish(e.target.value)} className="text-xs h-8" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Alamat & Kontak (Kop Line 4)</label>
                          <textarea rows={2} value={createKopAddress} onChange={(e) => setCreateKopAddress(e.target.value)} className="w-full text-xs p-2 border rounded-lg" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TEKS FOOTER INPUT */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Teks Footer</label>
                    <textarea rows={2} value={createFooterLeft} onChange={(e) => setCreateFooterLeft(e.target.value)} className="w-full text-xs p-3 bg-white dark:bg-zinc-900 border rounded-xl outline-none" />
                  </div>

                </div>
              </div>

            </div>

            <div className="shrink-0 border-t flex justify-end gap-3 bg-white dark:bg-[#090d16] px-5 py-3.5">
              <DialogClose render={<Button type="button" variant="outline" className="text-xs rounded-xl" />}>Batal</DialogClose>
              <Button type="submit" className="bg-pmii-blue text-white dark:bg-pmii-gold dark:text-[#090d16] font-bold text-xs rounded-xl border-none flex items-center gap-1.5 cursor-pointer">
                <Printer className="w-4 h-4" /> {generationMode === "single" ? "Terbitkan & Cetak PDF" : `Cetak Massal (${bulkDataRows.length} Surat)`}
              </Button>
            </div>
          </form>

          {/* Sisi Kanan: Real-time Canvas F4 */}
          <div className="lg:col-span-7 p-5 md:p-8 flex flex-col gap-3 bg-zinc-100 dark:bg-zinc-900/60 overflow-y-auto h-full relative">
            <div className="w-full flex flex-col gap-3 relative">
              
              <div className="flex items-center justify-between">
                {generationMode === "single" ? (
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Pratinjau Kertas F4 (Live WYSIWYG)</h4>
                ) : (
                  <div className="flex items-center gap-2">
                    <h4 className="text-[10px] font-black uppercase text-blue-600 dark:text-pmii-gold tracking-wider">Preview Surat {previewIndex + 1} dari {bulkDataRows.length}</h4>
                    <div className="flex items-center gap-1 bg-white border p-0.5 rounded-lg shadow-xs">
                      <button type="button" disabled={previewIndex === 0} onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))} className="p-1 hover:bg-zinc-100 rounded disabled:opacity-30 cursor-pointer border-none bg-transparent"><ChevronLeft className="w-3.5 h-3.5" /></button>
                      <button type="button" disabled={previewIndex >= bulkDataRows.length - 1} onClick={() => setPreviewIndex(prev => Math.min(bulkDataRows.length - 1, prev + 1))} className="p-1 hover:bg-zinc-100 rounded disabled:opacity-30 cursor-pointer border-none bg-transparent"><ChevronRight className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}
                <Button type="button" variant="outline" size="sm" onClick={handlePrintLetter} className="h-7 text-[10px] bg-white dark:bg-zinc-900 cursor-pointer"><Printer className="w-3 h-3 mr-1" /> Uji Cetak</Button>
              </div>

              {/* Toolbar Rich Text — disembunyikan saat cetak */}
              <div className="print-label flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 shadow-xs">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider pr-2 border-r border-zinc-200 mr-0.5">Format</span>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }}
                  className="w-6 h-6 rounded font-black text-[13px] hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 border-none bg-transparent cursor-pointer transition-colors select-none"
                  title="Bold (Ctrl+B)"
                >B</button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }}
                  className="w-6 h-6 rounded italic text-[13px] hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-200 border-none bg-transparent cursor-pointer transition-colors select-none"
                  title="Italic (Ctrl+I)"
                >I</button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }}
                  className="w-6 h-6 rounded underline text-[13px] hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 border-none bg-transparent cursor-pointer transition-colors select-none"
                  title="Underline (Ctrl+U)"
                >U</button>

                <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-600 mx-0.5 shrink-0" />

                <select
                  onMouseDown={() => {
                    // Simpan selection sebelum dropdown membuat focus berpindah dari contenteditable
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) {
                      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
                    }
                  }}
                  onChange={(e) => {
                    applyFontSize(e.target.value);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="h-6 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded px-1 outline-none cursor-pointer"
                  title="Ukuran Font"
                >
                  <option value="" disabled>pt</option>
                  {[8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24].map((s) => (
                    <option key={s} value={`${s}pt`}>{s}</option>
                  ))}
                </select>

                <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-600 mx-0.5 shrink-0" />

                {/* Font Family */}
                <select
                  onMouseDown={() => {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) {
                      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
                    }
                  }}
                  onChange={(e) => {
                    applyFontFamily(e.target.value);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="h-6 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded px-1 outline-none cursor-pointer max-w-[110px]"
                  title="Jenis Font"
                >
                  <option value="" disabled>Font</option>
                  <option value='"Arial Narrow", Arial, sans-serif'>Arial Narrow</option>
                  <option value='"Monotype Corsiva", "Apple Chancery", cursive'>Monotype Corsiva</option>
                  <option value='Arial, sans-serif'>Arial</option>
                  <option value='"Times New Roman", Times, serif'>Times New Roman</option>
                </select>

                <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-600 mx-0.5 shrink-0" />

                {/* Uppercase / Lowercase */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
                    applyTextTransform('uppercase');
                  }}
                  className="h-6 px-1.5 rounded text-[10px] font-black hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 border-none bg-transparent cursor-pointer transition-colors select-none tracking-wide"
                  title="UPPERCASE"
                >AA</button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
                    applyTextTransform('lowercase');
                  }}
                  className="h-6 px-1.5 rounded text-[10px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 border-none bg-transparent cursor-pointer transition-colors select-none"
                  title="lowercase"
                >aa</button>
              </div>

              {/* CANVAS KERTAS F4 — contentEditable penuh, diisi imperatif via useEffect */}
              <div 
                id="custom-letter-print-area"
                ref={canvasTextareaRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => setIsCanvasFocused(true)}
                onBlur={() => setIsCanvasFocused(false)}
                onContextMenu={handleCanvasContextMenu}
                className="w-full aspect-[215/330] bg-white text-zinc-900 p-10 rounded-xl border-2 border-zinc-200 shadow-lg flex flex-col outline-none focus:border-pmii-blue/40 focus:ring-2 focus:ring-pmii-blue/10 transition-all duration-200 cursor-text overflow-auto"
                style={{ fontFamily: '"Arial Narrow", Arial, sans-serif', lineHeight: '1.0' }}
              />

              {/* Context Menu — dirender di luar canvas agar tidak konflik dengan contentEditable */}
              {contextMenu.visible && (
                <div 
                  className="fixed bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl py-1.5 w-44 z-50 font-sans border-l-[3px] border-l-blue-500"
                  style={{ top: contextMenu.y, left: contextMenu.x }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-1 text-[9px] font-black uppercase text-zinc-400 tracking-wider border-b pb-1 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Sisipkan Variabel
                  </div>
                  {bulkColumns.length === 0 ? (
                    <div className="px-3 py-1.5 text-[10px] text-zinc-400 italic">Kolom kustom kosong</div>
                  ) : (
                    bulkColumns.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => {
                          insertVariableAtCaret(col);
                          setContextMenu((prev) => ({ ...prev, visible: false }));
                        }}
                        className="w-full text-left px-3 py-1.5 text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 hover:text-blue-600 font-mono font-bold border-none bg-transparent cursor-pointer transition-colors"
                      >
                        {"{"}{ col }{"}"}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}