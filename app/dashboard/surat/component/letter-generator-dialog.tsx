"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Building,
  Settings,
  ChevronUp,
  ChevronDown,
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
  Sparkles,
  Check,
  Info,
  Calendar,
  User,
  ArrowRight,
  Bookmark
} from "lucide-react";

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

const TEMPLATES: Record<
  string,
  {
    subject: string;
    classification: "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi";
    content: string;
    senderTitle: string;
    senderLocation: string;
  }
> = {
  undangan: {
    subject: "Undangan Rapat Pleno Pengurus Cabang",
    classification: "Undangan",
    content: `Assalamu'alaikum Warahmatullahi Wabarakatuh<br><br>Salam silaturrahim teriring doa kami sampaikan semoga Sahabat-sahabat senantiasa dalam lindungan Allah SWT, serta eksis dalam menjalankan aktivitas keseharian. Amin.<br><br>Sehubungan dengan akan dilaksanakannya agenda Rapat Pleno Pengurus Cabang PMII guna membahas evaluasi program kerja dan persiapan agenda kaderisasi, maka dengan ini kami mengundang seluruh jajaran Pengurus untuk dapat hadir pada:<br><br><table style="border-collapse: collapse; margin: 4px 0 10px 0; font-size: inherit; font-family: inherit; width: 100%; max-width: 480px;"><tbody><tr><td style="padding: 2px 0; width: 105px; vertical-align: top;">Hari, Tanggal</td><td style="padding: 2px 6px; width: 15px; vertical-align: top; text-align: center;">:</td><td style="padding: 2px 0; vertical-align: top;">Sabtu, 30 Mei 2026</td></tr><tr><td style="padding: 2px 0; vertical-align: top;">Waktu</td><td style="padding: 2px 6px; vertical-align: top; text-align: center;">:</td><td style="padding: 2px 0; vertical-align: top;">19.30 WIB - Selesai</td></tr><tr><td style="padding: 2px 0; vertical-align: top;">Tempat</td><td style="padding: 2px 6px; vertical-align: top; text-align: center;">:</td><td style="padding: 2px 0; vertical-align: top;">Sekretariat PC PMII</td></tr><tr><td style="padding: 2px 0; vertical-align: top;">Agenda</td><td style="padding: 2px 6px; vertical-align: top; text-align: center;">:</td><td style="padding: 2px 0; vertical-align: top;">Rapat Pleno Pengurus Cabang</td></tr></tbody></table>Demikian surat undangan ini kami sampaikan, atas perhatian dan kehadiran Sahabat-sahabat kami ucapkan terima kasih.<br><br>Wallahul Muwaffieq Ilaa Aqwamith Tharieq<br>Wassalamu'alaikum Warahmatullahi Wabarakatuh`,
    senderTitle: "Sahabat Ketua Umum",
    senderLocation: "Semarang"
  },
  permohonan: {
    subject: "Permohonan Izin Peminjaman Aula Gedung NU",
    classification: "Permohonan",
    content: `Assalamu'alaikum Warahmatullahi Wabarakatuh<br><br>Salam silaturrahim teriring doa kami sampaikan semoga Sahabat-sahabat senantiasa dalam lindungan Allah SWT, serta eksis dalam menjalankan aktivitas keseharian. Amin.<br><br>Sehubungan dengan akan diselenggarakannya agenda Pelatihan Kader Lanjut (PKL) oleh Pengurus Cabang Pergerakan Mahasiswa Islam Indonesia (PC PMII), maka dengan ini kami mengajukan permohonan izin peminjaman Aula Gedung PCNU yang rencananya akan dilaksanakan pada:<br><br><table style="border-collapse: collapse; margin: 4px 0 10px 0; font-size: inherit; font-family: inherit; width: 100%; max-width: 480px;"><tbody><tr><td style="padding: 2px 0; width: 105px; vertical-align: top;">Hari, Tanggal</td><td style="padding: 2px 6px; width: 15px; vertical-align: top; text-align: center;">:</td><td style="padding: 2px 0; vertical-align: top;">Jumat - Senin, 12 - 15 Juni 2026</td></tr><tr><td style="padding: 2px 0; vertical-align: top;">Waktu</td><td style="padding: 2px 6px; vertical-align: top; text-align: center;">:</td><td style="padding: 2px 0; vertical-align: top;">08.00 WIB - Selesai</td></tr><tr><td style="padding: 2px 0; vertical-align: top;">Tempat</td><td style="padding: 2px 6px; vertical-align: top; text-align: center;">:</td><td style="padding: 2px 0; vertical-align: top;">Aula Lantai 2 Gedung NU</td></tr></tbody></table>Sebagai bahan pertimbangan, bersama ini kami lampirkan proposal kegiatan. Demikian surat permohonan ini kami sampaikan, atas perhatian, izin dan kerjasama Bapak/Ibu kami ucapkan terima kasih.<br><br>Wallahul Muwaffieq Ilaa Aqwamith Tharieq<br>Wassalamu'alaikum Warahmatullahi Wabarakatuh`,
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
  const [createClassification, setCreateClassification] = useState<
    "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi"
  >(TEMPLATES.undangan.classification);
  const [createContent, setCreateContent] = useState(TEMPLATES.undangan.content.replace(/\n/g, "<br>"));
  const [createSenderLocation, setCreateSenderLocation] = useState(TEMPLATES.undangan.senderLocation);

  // Kop & Footer Settings
  const [showKopFooterSettings, setShowKopFooterSettings] = useState(false);
  const [createKopTitle, setCreateKopTitle] = useState("PERGERAKAN MAHASISWA ISLAM INDONESIA");
  const [createKopSubtitle, setCreateKopSubtitle] = useState("PENGURUS CABANG KOTA SEMARANG");
  const [createKopEnglish, setCreateKopEnglish] = useState("Branch Board of Indonesian Moslem Student Movement");
  const [createKopAddress, setCreateKopAddress] = useState(
    "Sekretariat: Jl. Sunan Kalijaga No. 10 | Telp: +62 812-3456-7890 | Email: pc.semarang@pmii.or.id"
  );
  const [createFooterLeft, setCreateFooterLeft] = useState("Dzikir, Fikir, Amal Sholeh");
  const [createLogoUrl, setCreateLogoUrl] = useState<string>("");

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0
  });

  // STATE MODE 1: SINGLE SURAT (9 Kotak PMII)
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

  // STATE MODE 2: MASSAL / BULK DINAMIS
  const [bulkColumns, setBulkColumns] = useState<string[]>(["Nomor_Surat", "Penerima"]);
  const [bulkDataRows, setBulkDataRows] = useState<Record<string, string>[]>([
    { Nomor_Surat: "021.PK-XI.Z-03.01.010.B-II.12.2026", Penerima: "Pengurus Komisariat Sultan Agung" },
    { Nomor_Surat: "022.PK-XI.Z-03.01.011.B-II.12.2026", Penerima: "Pengurus Komisariat Walisongo" },
    { Nomor_Surat: "023.PK-XI.Z-03.01.012.B-II.12.2026", Penerima: "Pengurus Komisariat UIN Semarang" }
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
  const currentPreviewNomor =
    generationMode === "single"
      ? getDynamicParsedText(baseSingleNomor, previewIndex)
      : getDynamicParsedText(bulkDataRows[previewIndex]?.["Nomor_Surat"] || "{Nomor_Surat}", previewIndex);

  const currentPreviewRecipient =
    generationMode === "single"
      ? getDynamicParsedText(createRecipient, previewIndex)
      : getDynamicParsedText(bulkDataRows[previewIndex]?.["Penerima"] || "{Penerima}", previewIndex);

  const currentPreviewSubject = getDynamicParsedText(createSubject, previewIndex);
  const currentPreviewLocation = getDynamicParsedText(createSenderLocation, previewIndex);
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

  const handleTemplateChange = (val: string | null) => {
    if (!val) return;
    setCreateTemplate(val);
    const tmpl = TEMPLATES[val];
    if (tmpl) {
      setCreateSubject(tmpl.subject);
      setCreateClassification(tmpl.classification);
      setCreateContent(tmpl.content.replace(/\n/g, "<br>"));
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
    setBulkDataRows(bulkDataRows.map((row) => ({ ...row, [safeName]: "" })));
    setNewColumnName("");
  };

  const handleRemoveCustomColumn = (colName: string) => {
    setBulkColumns(bulkColumns.filter((c) => c !== colName));
    setBulkDataRows(
      bulkDataRows.map((row) => {
        const copy = { ...row };
        delete copy[colName];
        return copy;
      })
    );
  };

  const handleAddBulkRow = () => {
    const newRowObj: Record<string, string> = {};
    bulkColumns.forEach((col) => {
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

      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      if (lines.length < 2) {
        alert("File CSV kosong.");
        return;
      }

      const parsedHeaders = lines[0]
        .split(/[,;\t]/)
        .map((h) => h.replace(/^["']|["']$/g, "").trim().replace(/\s+/g, "_"));
      setBulkColumns(parsedHeaders);

      const parsedRows: Record<string, string>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(/[,;\t]/).map((col) => col.replace(/^["']|["']$/g, "").trim());
        const rowObj: Record<string, string> = {};
        parsedHeaders.forEach((header, idx) => {
          rowObj[header] = columns[idx] || "";
        });
        parsedRows.push(rowObj);
      }

      setBulkDataRows(parsedRows);
      setPreviewIndex(0);
      alert("Berhasil memuat data kustom massal dari CSV.");
    };
    reader.readAsText(file);
  };

  const insertVariableAtCaret = (colName: string) => {
    const el = canvasTextareaRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (savedSelectionRef.current && sel) {
      el.focus();
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    } else {
      el.focus();
    }
    document.execCommand("insertText", false, `{${colName}}`);
    savedSelectionRef.current = null;
  };

  const applyFormat = (command: "bold" | "italic" | "underline") => {
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
    const sel = window.getSelection();
    if (savedSelectionRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
    document.execCommand("fontSize", false, "7");
    const fonts = el.querySelectorAll('font[size="7"]');
    fonts.forEach((font) => {
      const span = document.createElement("span");
      span.style.fontSize = sizeInPt;
      span.innerHTML = (font as HTMLElement).innerHTML;
      font.parentNode?.replaceChild(span, font);
    });
    savedSelectionRef.current = null;
    setCreateContent(el.innerHTML);
  };

  const applyTextTransform = (transform: "uppercase" | "lowercase" | "none") => {
    const el = canvasTextareaRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (savedSelectionRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    } else {
      el.focus();
    }
    document.execCommand("fontSize", false, "7");
    const fonts = el.querySelectorAll('font[size="7"]');
    fonts.forEach((font) => {
      const span = document.createElement("span");
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
    document.execCommand("fontSize", false, "7");
    const fonts = el.querySelectorAll('font[size="7"]');
    fonts.forEach((font) => {
      const span = document.createElement("span");
      span.style.fontFamily = family;
      span.innerHTML = (font as HTMLElement).innerHTML;
      font.parentNode?.replaceChild(span, font);
    });
    savedSelectionRef.current = null;
    setCreateContent(el.innerHTML);
  };

  // Bangun HTML canvas penuh dari state saat ini
  const buildCanvasHtml = () => {
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
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
<table style="width:100%;border-collapse:collapse;font-size:11pt;margin-bottom:20px;color:#27272a;">
  <tbody>
    <tr>
      <td style="vertical-align:top;width:50%;">
        <table style="border-collapse:collapse;">
          <tbody>
            <tr>
              <td style="padding:1px 0;vertical-align:top;white-space:nowrap;"><strong>Nomor</strong></td>
              <td style="padding:1px 6px;vertical-align:top;text-align:center;">:</td>
              <td style="padding:1px 0;vertical-align:top;"><span data-field="nomor-value">${currentPreviewNomor}</span></td>
            </tr>
            <tr>
              <td style="padding:1px 0;vertical-align:top;white-space:nowrap;"><strong>Lamp</strong></td>
              <td style="padding:1px 6px;vertical-align:top;text-align:center;">:</td>
              <td style="padding:1px 0;vertical-align:top;">-</td>
            </tr>
            <tr>
              <td style="padding:1px 0;vertical-align:top;white-space:nowrap;"><strong>Hal</strong></td>
              <td style="padding:1px 6px;vertical-align:top;text-align:center;">:</td>
              <td style="padding:1px 0;vertical-align:top;"><u data-field="perihal-value">${currentPreviewSubject || "..."}</u></td>
            </tr>
          </tbody>
        </table>
      </td>
      <td style="vertical-align:top;text-align:right;white-space:nowrap;"><span data-field="location-date">${currentPreviewLocation || "Semarang"}, ${today}</span></td>
    </tr>
  </tbody>
</table>
<div data-field="recipient" style="font-size:11pt;margin-bottom:16px;color:#27272a;line-height:1.0;border-bottom:2px dashed #bfdbfe;padding-bottom:16px;">
  Kepada Yang Terhormat,<br/>
  <strong data-field="recipient-name">${currentPreviewRecipient}</strong><br/>
  di Tempat
</div>
<div data-field="body" style="flex:1;border-bottom:2px dashed #ede9fe;padding:8px 0;min-height:220px;word-break:break-word;font-size:11pt;text-align:justify;line-height:1.0;margin-bottom:8px;">${
      createContent || '<span style="color:#a1a1aa;">Ketik isi surat di sini...</span>'
    }</div>
<div style="padding-top:12px;margin-top:auto;border-top:1px solid #e4e4e7;font-size:10pt;color:#27272a;">
  <div style="line-height:1.7;margin-bottom:12px;">
    <div>Mengetahui,</div>
    <div><span data-field="sender-title">${activeSenderTitle}</span></div>
    <div>${createKopTitle}</div>
    <div>${createKopSubtitle}</div>
  </div>
  <table style="width:100%;border-collapse:collapse;">
    <tbody>
      <tr>
        <td style="width:50%;vertical-align:top;">
          <div style="height:56px;"></div>
          <u><strong>( _________________________ )</strong></u>
          <div style="font-style:italic;font-size:9.5pt;margin-top:2px;">Ketua Umum</div>
        </td>
        <td style="width:50%;vertical-align:top;">
          <div style="height:56px;"></div>
          <u><strong>( _________________________ )</strong></u>
          <div style="font-style:italic;font-size:9.5pt;margin-top:2px;">Sekretaris Umum</div>
        </td>
      </tr>
    </tbody>
  </table>
  <div style="text-align:right;margin-top:10px;">
    <span data-field="footer-text" style="font-size:11pt;color:#2563eb;font-family:'Monotype Corsiva','Apple Chancery',cursive;font-style:italic;line-height:1.6;">${currentPreviewFooterLeft}</span>
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

    const kopSection = canvas.querySelector('[data-section="kop"]');
    if (kopSection && kopSection.firstElementChild) {
      const logoEl = kopSection.firstElementChild as HTMLElement;
      if (createLogoUrl && logoEl.tagName !== "IMG") {
        logoEl.outerHTML = `<img src="${createLogoUrl}" alt="Logo" style="width:56px;height:56px;object-fit:contain;margin-right:12px;flex-shrink:0;" />`;
      } else if (!createLogoUrl && logoEl.tagName === "IMG") {
        logoEl.outerHTML = `<div style="width:48px;height:48px;border-radius:50%;background:#0A2A5C;color:white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11pt;border:1px solid rgba(198,149,17,0.3);margin-right:12px;flex-shrink:0;">PMII</div>`;
      } else if (createLogoUrl && logoEl.tagName === "IMG") {
        (logoEl as HTMLImageElement).src = createLogoUrl;
      }
    }
    set("kop-title", createKopTitle);
    set("kop-subtitle", createKopSubtitle);
    set("kop-english", createKopEnglish);
    set("kop-address", createKopAddress);
    set("nomor-value", currentPreviewNomor);
    set("perihal-value", currentPreviewSubject || "...");
    set("location-date", `${currentPreviewLocation || "Semarang"}, ${today}`);
    set("recipient-name", currentPreviewRecipient);
    set("footer-text", currentPreviewFooterLeft);
    // Update body content preserving HTML (tables, formatting)
    // Only update if the canvas body doesn't already match (avoids overwriting manual edits)
    const bodyEl = canvas.querySelector('[data-field="body"]') as HTMLElement | null;
    if (bodyEl && bodyEl.innerHTML !== createContent) {
      bodyEl.innerHTML = createContent || '<span style="color:#a1a1aa;">Ketik isi surat di sini...</span>';
    }
  };

  useEffect(() => {
    const el = canvasTextareaRef.current;
    if (!el) return;
    el.innerHTML = buildCanvasHtml();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, createTemplate, createLogoUrl]);

  useEffect(() => {
    updateCanvasFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    createKopTitle,
    createKopSubtitle,
    createKopAddress,
    createKopEnglish,
    currentPreviewNomor,
    currentPreviewSubject,
    currentPreviewLocation,
    currentPreviewRecipient,
    currentPreviewFooterLeft,
    createContent
  ]);

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
          <div class="f4-page-break" style="${idx > 0 ? "page-break-before: always;" : ""}">
            <header class="letter-header" style="position: relative; padding-bottom: 20px; margin-bottom: 16px; border-bottom: 2px dashed #bfdbfe;">
              <div class="kop-surat" style="display: flex; align-items: center; border-bottom: 3px double #0A2A5C; padding-bottom: 15px; margin-bottom: 25px;">
                ${
                  createLogoUrl
                    ? `<img src="${createLogoUrl}" style="width: 55px; height: 55px; object-fit: contain; margin-right: 15px; flex-shrink: 0;" />`
                    : `<div style="width: 55px; height: 55px; border-radius: 50%; background-color: #0A2A5C; color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11pt; margin-right: 15px; border: 1px solid #c69511; flex-shrink: 0;">PMII</div>`
                }
                <div style="text-align: center; flex: 1; pr: 24px; display: flex; flex-direction: column;">
                  <span style="font-family: 'Arial Narrow', Arial, sans-serif; font-size: 14pt; font-weight: bold; text-transform: uppercase; color: #0A2A5C; line-height: 1.0;">${createKopSubtitle}</span>
                  <span style="font-family: 'Arial Narrow', Arial, sans-serif; font-size: 16pt; font-weight: bold; text-transform: uppercase; color: #0A2A5C; line-height: 1.0; margin-top: 2px;">${createKopTitle}</span>
                  <span style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive; font-size: 11pt; color: #0A2A5C; line-height: 1.0; margin-top: 2px;">${createKopEnglish}</span>
                  <span style="font-family: 'Arial Narrow', Arial, sans-serif; font-size: 11pt; color: #0A2A5C; line-height: 1.0; margin-top: 4px; white-space: pre-line;">${createKopAddress}</span>
                </div>
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 11pt; margin-bottom: 20px; color: #27272a;">
                <tbody>
                  <tr>
                    <td style="vertical-align: top; width: 50%;">
                      <table style="border-collapse: collapse;">
                        <tbody>
                          <tr>
                            <td style="padding: 1px 0; vertical-align: top; white-space: nowrap;"><strong>Nomor</strong></td>
                            <td style="padding: 1px 6px; vertical-align: top; text-align: center;">:</td>
                            <td style="padding: 1px 0; vertical-align: top;">${loopNomor}</td>
                          </tr>
                          <tr>
                            <td style="padding: 1px 0; vertical-align: top; white-space: nowrap;"><strong>Lamp</strong></td>
                            <td style="padding: 1px 6px; vertical-align: top; text-align: center;">:</td>
                            <td style="padding: 1px 0; vertical-align: top;">-</td>
                          </tr>
                          <tr>
                            <td style="padding: 1px 0; vertical-align: top; white-space: nowrap;"><strong>Hal</strong></td>
                            <td style="padding: 1px 6px; vertical-align: top; text-align: center;">:</td>
                            <td style="padding: 1px 0; vertical-align: top;"><u>${loopSubject}</u></td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td style="vertical-align: top; text-align: right; white-space: nowrap;">${loopLocation}, ${new Date().getDate()} ${
          [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
          ][new Date().getMonth()]
        } ${new Date().getFullYear()}</td>
                  </tr>
                </tbody>
              </table>
              <div style="margin-bottom: 20px; font-size: 11pt;">Kepada Yang Terhormat,<br/><strong>${loopPenerima}</strong><br/>di Tempat</div>
            </header>
            <main style="flex: 1; padding: 16px 0; border-bottom: 2px dashed #ddd;">
              <div style="text-align: justify; white-space: normal; margin-bottom: 20px; font-size: 11pt;">${loopBody}</div>
            </main>
            <footer style="padding-top: 12px; margin-top: auto; border-top: 1px solid #e4e4e7; font-size: 10pt; color: #27272a;">
              <div style="line-height: 1.7; margin-bottom: 12px;">
                <div>Mengetahui,</div>
                <div>${activeSenderTitle}</div>
                <div>${createKopTitle}</div>
                <div>${createKopSubtitle}</div>
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                  <tr>
                    <td style="width: 50%; vertical-align: top;">
                      <div style="height: 56px;"></div>
                      <u><strong>( _________________________ )</strong></u>
                      <div style="font-style: italic; font-size: 9.5pt; margin-top: 2px;">Ketua Umum</div>
                    </td>
                    <td style="width: 50%; vertical-align: top;">
                      <div style="height: 56px;"></div>
                      <u><strong>( _________________________ )</strong></u>
                      <div style="font-style: italic; font-size: 9.5pt; margin-top: 2px;">Sekretaris Umum</div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style="text-align: right; margin-top: 10px;">
                <span style="font-size: 11pt; color: #2563eb; font-family: 'Monotype Corsiva', cursive; font-style: italic; line-height: 1.6;">${loopFooterLeft}</span>
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
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg h-9 px-3.5 flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors border-none">
          <FileText className="w-3.5 h-3.5" />
          <span>Buat Surat Resmi</span>
        </Button>
      } />

      <DialogContent
        showCloseButton={false}
        className="w-[96vw] max-w-7xl h-[94vh] md:h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-0 gap-0 flex flex-col overflow-hidden"
      >
        {/* Header Modul (Mengikuti Standar Verifikasi) */}
        <DialogHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Pembuat Surat Resmi (Letter Generator)
                  </DialogTitle>
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2">
                    Format F4 / A4
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Generate lembaran surat resmi PMII dengan live WYSIWYG canvas, penomoran 9 segmen baku, dan dukungan cetak massal.
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
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-5 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 h-full flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* TABS MODE PEMBUATAN (Persis seperti Tabs di Verifikasi) */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setGenerationMode("single")}
                  className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    generationMode === "single"
                      ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Single Surat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGenerationMode("bulk")}
                  className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    generationMode === "bulk"
                      ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Cetak Massal (Mail Merge)</span>
                </button>
              </div>

              {/* CARD 1: TEMPLATE & KLASIFIKASI */}
              <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3 shadow-none">
                <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Template &amp; Klasifikasi
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Pilih Template</label>
                    <Select value={createTemplate} onValueChange={handleTemplateChange}>
                      <SelectTrigger className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <SelectValue placeholder="Pilih Template" />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-200 dark:border-zinc-800">
                        <SelectItem value="undangan">Undangan</SelectItem>
                        <SelectItem value="permohonan">Permohonan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Klasifikasi</label>
                    <select
                      value={createClassification}
                      onChange={(e) => setCreateClassification(e.target.value as any)}
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
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Perihal / Hal Surat *</label>
                  <Input
                    required
                    value={createSubject}
                    onChange={(e) => setCreateSubject(e.target.value)}
                    placeholder="Contoh: Undangan Rapat Pleno..."
                    className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Kota Pengirim</label>
                  <Input
                    value={createSenderLocation}
                    onChange={(e) => setCreateSenderLocation(e.target.value)}
                    placeholder="Semarang"
                    className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                  />
                </div>
              </div>

              {/* CARD 2: PENOMORAN & PENERIMA */}
              {generationMode === "single" ? (
                <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3 shadow-none">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Nomor Surat Baku PMII (9 Segmen)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="grid grid-cols-9 gap-1 bg-zinc-50 dark:bg-zinc-950 p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                      <Input
                        ref={boxRefs[0]}
                        maxLength={3}
                        placeholder="021"
                        value={numBox1}
                        onChange={(e) => handleBoxChange(0, e.target.value, setNumBox1, 3)}
                        className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
                        title="1. Nomor Urut Surat"
                      />
                      <Input
                        ref={boxRefs[1]}
                        maxLength={2}
                        placeholder="PK"
                        value={numBox2}
                        onChange={(e) => handleBoxChange(1, e.target.value, setNumBox2, 2)}
                        className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
                        title="2. Jenis & Tingkat Kepengurusan"
                      />
                      <Input
                        ref={boxRefs[2]}
                        maxLength={4}
                        placeholder="XI"
                        value={numBox3}
                        onChange={(e) => handleBoxChange(2, e.target.value, setNumBox3, 4)}
                        className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
                        title="3. Periode / Wilayah"
                      />
                      <Input
                        ref={boxRefs[3]}
                        maxLength={5}
                        placeholder="Z-03"
                        value={numBox4}
                        onChange={(e) => handleBoxChange(3, e.target.value, setNumBox4, 5)}
                        className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
                        title="4. Kode Klasifikasi"
                      />
                      <Input
                        ref={boxRefs[4]}
                        maxLength={2}
                        placeholder="01"
                        value={numBox5}
                        onChange={(e) => handleBoxChange(4, e.target.value, setNumBox5, 2)}
                        className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
                        title="5. Kode Wilayah"
                      />
                      <Input
                        ref={boxRefs[5]}
                        maxLength={3}
                        placeholder="010"
                        value={numBox6}
                        onChange={(e) => handleBoxChange(5, e.target.value, setNumBox6, 3)}
                        className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
                        title="6. Kode Cabang"
                      />
                      <Input
                        ref={boxRefs[6]}
                        maxLength={4}
                        placeholder="B-II"
                        value={numBox7}
                        onChange={(e) => handleBoxChange(6, e.target.value, setNumBox7, 4)}
                        className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
                        title="7. Kode Intern / Ekstern"
                      />
                      <Input
                        ref={boxRefs[7]}
                        maxLength={2}
                        placeholder="12"
                        value={numBox8}
                        onChange={(e) => handleBoxChange(7, e.target.value, setNumBox8, 2)}
                        className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
                        title="8. Bulan Hijri / Masehi"
                      />
                      <Input
                        ref={boxRefs[8]}
                        maxLength={4}
                        placeholder="2026"
                        value={numBox9}
                        onChange={(e) => handleBoxChange(8, e.target.value, setNumBox9, 4)}
                        className="text-center font-mono text-[11px] font-bold px-0 h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none"
                        title="9. Tahun"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1 pt-0.5">
                      <span>No.Urut • Tingkat • Wilayah • Klas • Prov • Cab • Int/Eks • Bulan • Tahun</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                      Tujuan / Nama Penerima *
                    </label>
                    <Input
                      required
                      value={createRecipient}
                      onChange={(e) => setCreateRecipient(e.target.value)}
                      placeholder="Contoh: Pengurus Rayon PMII..."
                      className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                /* CARD BULK / MAIL MERGE */
                <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3 shadow-none">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Data Surat Massal ({bulkDataRows.length} Data)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input type="file" ref={excelInputRef} accept=".csv,.txt" onChange={handleExcelUpload} className="hidden" />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => excelInputRef.current?.click()}
                        className="h-7 text-[10px] font-medium border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3 h-3 mr-1 text-emerald-600" /> Impor CSV
                      </Button>
                    </div>
                  </div>

                  {/* Tambah Kolom Variabel */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <Columns className="w-3 h-3 text-blue-600" /> Tambah Kolom Variabel
                    </span>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Misal: Nomor_Surat, Penerima, Nama_Kader"
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCustomColumn}
                        className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shrink-0 cursor-pointer"
                      >
                        + Kolom
                      </Button>
                    </div>
                  </div>

                  {/* Tabel Data Massal */}
                  <div className="w-full overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 max-h-48">
                    <table className="w-full text-left text-xs min-w-[360px]">
                      <thead className="bg-zinc-50 dark:bg-zinc-950 font-semibold text-[11px] border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300">
                        <tr>
                          {bulkColumns.map((col) => (
                            <th key={col} className="px-3 py-2">
                              <div className="flex items-center justify-between group gap-2">
                                <span className="font-mono text-zinc-700 dark:text-zinc-300">{col}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomColumn(col)}
                                  className="text-rose-400 hover:text-rose-600 hidden group-hover:block bg-transparent border-none cursor-pointer"
                                >
                                  ×
                                </button>
                              </div>
                            </th>
                          ))}
                          <th className="w-8 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {bulkDataRows.map((row, rIdx) => (
                          <tr key={rIdx} className={previewIndex === rIdx ? "bg-blue-50/50 dark:bg-blue-950/30" : ""}>
                            {bulkColumns.map((col) => (
                              <td key={col} className="p-1">
                                <Input
                                  value={row[col] || ""}
                                  onChange={(e) => handleUpdateBulkCell(rIdx, col, e.target.value)}
                                  onFocus={() => setPreviewIndex(rIdx)}
                                  className="h-7 text-xs px-2 bg-transparent border-none shadow-none focus-visible:ring-1"
                                />
                              </td>
                            ))}
                            <td className="p-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveBulkRow(rIdx)}
                                className="text-rose-500 hover:text-rose-600 border-none bg-transparent cursor-pointer p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddBulkRow}
                    className="w-full text-xs font-medium h-8 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Baris Baru
                  </Button>
                </div>
              )}

              {/* CARD 3: LOGO & KOP SURAT */}
              <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3 shadow-none">
                <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Kop Surat &amp; Logo Resmi
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowKopFooterSettings(!showKopFooterSettings)}
                    className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
                  >
                    <span>{showKopFooterSettings ? "Sembunyikan Teks" : "Sesuaikan Teks"}</span>
                    {showKopFooterSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Upload Logo */}
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  {createLogoUrl ? (
                    <div className="relative w-12 h-12 bg-white rounded-lg border border-zinc-200 p-1 flex items-center justify-center shrink-0">
                      <img src={createLogoUrl} alt="Logo PMII" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 shadow-sm cursor-pointer border-none"
                        title="Hapus Logo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-12 h-12 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400 cursor-pointer bg-white dark:bg-zinc-900 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleLogoChange} className="hidden" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 text-[11px] font-medium border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
                    >
                      {createLogoUrl ? "Ganti Gambar Logo" : "Pilih Logo Lembaga"}
                    </Button>
                    <p className="text-[10px] text-zinc-400 mt-1">Logo tersinkron otomatis dari Pengaturan Sistem.</p>
                  </div>
                </div>

                {/* Accordion Sesuaikan Kop */}
                {showKopFooterSettings && (
                  <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Tingkat Kepengurusan (Kop Baris 1)
                      </label>
                      <Input
                        value={createKopSubtitle}
                        onChange={(e) => setCreateKopSubtitle(e.target.value)}
                        className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Nama Organisasi (Kop Baris 2)
                      </label>
                      <Input
                        value={createKopTitle}
                        onChange={(e) => setCreateKopTitle(e.target.value)}
                        className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Terjemahan Bahasa Inggris (Kop Baris 3)
                      </label>
                      <Input
                        value={createKopEnglish}
                        onChange={(e) => setCreateKopEnglish(e.target.value)}
                        className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Alamat &amp; Kontak Sekretariat (Kop Baris 4)
                      </label>
                      <textarea
                        rows={2}
                        value={createKopAddress}
                        onChange={(e) => setCreateKopAddress(e.target.value)}
                        className="w-full text-xs p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none text-zinc-800 dark:text-zinc-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Teks Motto Footer
                      </label>
                      <textarea
                        rows={2}
                        value={createFooterLeft}
                        onChange={(e) => setCreateFooterLeft(e.target.value)}
                        className="w-full text-xs p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none text-zinc-800 dark:text-zinc-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Form Kiri */}
            <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50 px-5 py-3.5">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-zinc-400" /> Format F4 (215 x 330 mm)
              </span>
              <div className="flex items-center gap-2">
                <DialogClose render={
                  <Button type="button" variant="outline" className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer">
                    Batal
                  </Button>
                } />
                <Button
                  type="submit"
                  className="h-9 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>
                    {generationMode === "single"
                      ? "Terbitkan & Cetak PDF"
                      : `Cetak Massal (${bulkDataRows.length} Surat)`}
                  </span>
                </Button>
              </div>
            </div>
          </form>

          {/* Sisi Kanan: Real-time Live WYSIWYG Canvas */}
          <div className="lg:col-span-7 p-4 md:p-6 flex flex-col gap-3 bg-zinc-100 dark:bg-zinc-950 overflow-y-auto h-full relative">
            <div className="w-full flex flex-col gap-3 relative max-w-2xl mx-auto">
              {/* Header Preview & Controls */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                {generationMode === "single" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Pratinjau Kertas F4 (Live WYSIWYG)
                    </span>
                    <Badge variant="outline" className="text-[10px] font-semibold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      Siap Cetak
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      Surat ke-{previewIndex + 1} dari {bulkDataRows.length}
                    </span>
                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-lg shadow-xs">
                      <button
                        type="button"
                        disabled={previewIndex === 0}
                        onClick={() => setPreviewIndex((prev) => Math.max(0, prev - 1))}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-30 cursor-pointer border-none bg-transparent"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={previewIndex >= bulkDataRows.length - 1}
                        onClick={() => setPreviewIndex((prev) => Math.min(bulkDataRows.length - 1, prev + 1))}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-30 cursor-pointer border-none bg-transparent"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrintLetter}
                  className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Uji Cetak Lembaran</span>
                </Button>
              </div>

              {/* Toolbar Format Teks Canvas */}
              <div className="print-label flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 shadow-xs">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pr-2 border-r border-zinc-200 dark:border-zinc-800 mr-0.5">
                  Format
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFormat("bold");
                  }}
                  className="w-6 h-6 rounded font-bold text-[12px] hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200 border-none bg-transparent cursor-pointer transition-colors"
                  title="Tebal (Bold)"
                >
                  B
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFormat("italic");
                  }}
                  className="w-6 h-6 rounded italic text-[12px] hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200 border-none bg-transparent cursor-pointer transition-colors"
                  title="Miring (Italic)"
                >
                  I
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFormat("underline");
                  }}
                  className="w-6 h-6 rounded underline text-[12px] hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200 border-none bg-transparent cursor-pointer transition-colors"
                  title="Garis Bawah (Underline)"
                >
                  U
                </button>

                <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-0.5 shrink-0" />

                {/* Ukuran Font */}
                <select
                  onMouseDown={() => {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) {
                      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
                    }
                  }}
                  onChange={(e) => {
                    applyFontSize(e.target.value);
                    e.target.value = "";
                  }}
                  defaultValue=""
                  className="h-6 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded px-1 outline-none cursor-pointer"
                  title="Ukuran Font"
                >
                  <option value="" disabled>
                    Ukuran
                  </option>
                  {[9, 10, 11, 12, 13, 14, 16, 18].map((s) => (
                    <option key={s} value={`${s}pt`}>
                      {s}pt
                    </option>
                  ))}
                </select>

                <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-0.5 shrink-0" />

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
                    e.target.value = "";
                  }}
                  defaultValue=""
                  className="h-6 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded px-1 outline-none cursor-pointer max-w-[110px]"
                  title="Jenis Font"
                >
                  <option value="" disabled>
                    Jenis Huruf
                  </option>
                  <option value='"Arial Narrow", Arial, sans-serif'>Arial Narrow</option>
                  <option value='"Monotype Corsiva", "Apple Chancery", cursive'>Monotype Corsiva</option>
                  <option value='Arial, sans-serif'>Arial</option>
                  <option value='"Times New Roman", Times, serif'>Times New Roman</option>
                </select>

                <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-0.5 shrink-0" />

                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
                    applyTextTransform("uppercase");
                  }}
                  className="h-6 px-1.5 rounded text-[10px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200 border-none bg-transparent cursor-pointer transition-colors"
                  title="HURUF BESAR (UPPERCASE)"
                >
                  AA
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
                    applyTextTransform("lowercase");
                  }}
                  className="h-6 px-1.5 rounded text-[10px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 border-none bg-transparent cursor-pointer transition-colors"
                  title="huruf kecil (lowercase)"
                >
                  aa
                </button>
              </div>

              {/* CANVAS KERTAS F4 */}
              <div
                id="custom-letter-print-area"
                ref={canvasTextareaRef}
                contentEditable
                suppressContentEditableWarning
                onContextMenu={handleCanvasContextMenu}
                onInput={() => {
                  // Sync createContent from the body field when user types directly
                  const bodyEl = canvasTextareaRef.current?.querySelector('[data-field="body"]') as HTMLElement | null;
                  if (bodyEl) setCreateContent(bodyEl.innerHTML);
                }}
                className="w-full aspect-[215/330] bg-white text-zinc-900 p-8 sm:p-10 rounded-xl border border-zinc-300 shadow-xl flex flex-col outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 cursor-text overflow-auto"
                style={{ fontFamily: '"Arial Narrow", Arial, sans-serif', lineHeight: "1.0" }}
              />

              {/* Context Menu untuk Sisipkan Variabel Kustom */}
              {contextMenu.visible && (
                <div
                  className="fixed bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl py-1.5 w-48 z-50 font-sans border-l-[3px] border-l-blue-600"
                  style={{ top: contextMenu.y, left: contextMenu.x }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-1 text-[10px] font-bold uppercase text-zinc-400 tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-1 mb-1 flex items-center gap-1">
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
                        className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 font-mono font-bold border-none bg-transparent cursor-pointer transition-colors"
                      >
                        {"{"}{col}{"}"}
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