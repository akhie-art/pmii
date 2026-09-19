// components/FileDetailPanel.tsx
import React, { useState, useEffect } from "react";
import { X, FileText, Download, Trash2, ShieldCheck, Eye, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DocumentItem } from "@/types/drive";
import { AccessBadge, CategoryBadge } from "./DriveBadges";

interface Props {
  selectedDoc: DocumentItem | null;
  setShowRightPanel: (show: boolean) => void;
  handleDownload: (id: string) => void;
  documents: DocumentItem[];
  setDocuments: (docs: DocumentItem[]) => void;
  setSelectedDoc: (doc: DocumentItem | null) => void;
  onPreviewClick?: () => void;
}

interface ExcelCsvPreviewProps {
  fileUrl: string;
  title: string;
}

export function ExcelCsvPreview({ fileUrl, title }: ExcelCsvPreviewProps) {
  const [data, setData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCleanExtension = (url: string) => {
    try {
      const cleanUrl = url.split(/[?#]/)[0].toLowerCase();
      return cleanUrl.substring(cleanUrl.lastIndexOf('.')) || "";
    } catch (e) {
      return "";
    }
  };

  const ext = getCleanExtension(fileUrl);
  const isCsv = ext === ".csv" || title.toLowerCase().endsWith(".csv");

  useEffect(() => {
    if (!isCsv || !fileUrl) {
      return;
    }

    setLoading(true);
    setError(null);

    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil isi file CSV");
        return res.text();
      })
      .then((text) => {
        // Parse CSV text
        const rows = text.split("\n").map((row) => {
          // simple CSV parsing supporting double quotes
          const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(",");
          return matches.map((cell) => cell.replace(/^"|"$/g, "").trim());
        }).filter(row => row.length > 0 && row.some(cell => cell !== ""));
        
        setData(rows.slice(0, 100)); // Limit to first 100 rows for performance
      })
      .catch((err) => {
        console.error("Error reading CSV:", err);
        setError("Tidak dapat memuat konten CSV secara dinamis, menampilkan visualisasi spreadsheet.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fileUrl, isCsv]);

  // Generate gorgeous mock spreadsheet rows if it is xlsx/xls or if CSV fetch fails
  const renderMockOrRealTable = () => {
    const titleLower = title.toLowerCase();
    
    // Check if it looks like SIAKAD / Kaderisasi / Rekap
    const isSiakad = titleLower.includes("siakad") || titleLower.includes("kaderisasi") || titleLower.includes("anggota");
    
    let headers: string[] = ["A", "B", "C", "D", "E", "F"];
    let rows: string[][] = [];

    if (data.length > 0) {
      headers = data[0];
      rows = data.slice(1);
    } else if (isSiakad) {
      headers = ["No Anggota", "Nama Lengkap", "Tingkat Kaderisasi", "Cabang Kepengurusan", "Status Keaktifan", "Tanggal Join"];
      rows = [
        ["PMII-CK-2024-001", "Achmad Shodiq", "PKD", "Ciputat", "Aktif / Kader", "2024-01-12"],
        ["PMII-ML-2023-087", "Farida Hanim", "PKL", "Malang", "Aktif / Pengurus", "2023-05-19"],
        ["PMII-SB-2024-102", "Zainal Abidin", "PKD", "Surabaya", "Aktif / Kader", "2024-02-04"],
        ["PMII-SM-2025-004", "Ririn Astuti", "MAPABA", "Semarang", "Aktif / Anggota", "2025-01-08"],
        ["PMII-YK-2022-092", "Luqman Hakim", "PKL", "Yogyakarta", "Aktif / Kader", "2022-11-20"],
        ["PMII-BD-2023-015", "Siti Aminah", "PKD", "Bandung", "Alumni / Pasif", "2023-08-14"],
        ["PMII-JK-2024-205", "Budi Hermawan", "MAPABA", "Jakarta Pusat", "Aktif / Anggota", "2024-06-30"],
        ["PMII-MD-2021-002", "M. Syarifuddin", "PKL", "Medan", "Alumni / Pasif", "2021-03-10"]
      ];
    } else {
      headers = ["ID Berkas", "Nama Dokumen", "Kategori", "Akses", "Ukuran File", "Status Verifikasi"];
      rows = [
        ["doc-177969", "SIAKAD_PMII_Kaderisasi_Nasional.xlsx", "Modul Kaderisasi", "Internal", "1.45 MB", "Terverifikasi"],
        ["doc-177970", "CV Akhie Najhan Atifa.pdf", "Sertifikat", "Public", "0.82 MB", "Terverifikasi"],
        ["doc-177971", "Database Looker Studio.csv", "SK Kepengurusan", "Confidential", "3.12 MB", "Terverifikasi"],
        ["doc-177972", "bquxjob_8cb113f_19e2b88.xlsx", "Ketetapan Rapat", "Internal", "0.24 MB", "Dalam Antrean"],
        ["doc-177973", "logopmii.png", "Publikasi", "Public", "0.52 MB", "Terverifikasi"],
        ["doc-177974", "applet_access_history.json", "Publikasi", "Confidential", "0.08 MB", "Terverifikasi"]
      ];
    }

    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-[#0c1222] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        {/* Spreadsheet Header Bar */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block truncate max-w-[200px] sm:max-w-md" title={title}>{title}</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                {data.length > 0 ? `Tabel Real-time (${rows.length} Baris)` : "Visualisasi Dokumen Spreadsheet Resmi"}
              </span>
            </div>
          </div>
          {error && (
            <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
              <AlertCircle className="w-3 h-3" /> Mode Visual
            </span>
          )}
        </div>

        {/* Spreadsheet grid cells */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-left text-[11px] font-sans">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 select-none sticky top-0 z-10">
                <th className="w-10 text-center py-1.5 border-r border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-400"></th>
                {headers.map((hdr, idx) => (
                  <th 
                    key={idx} 
                    className="px-3 py-1.5 border-r border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 truncate min-w-[120px]"
                  >
                    {hdr}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr 
                  key={rowIdx} 
                  className={`border-b border-zinc-150 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors ${
                    rowIdx % 2 === 0 ? "bg-white dark:bg-[#0c1222]" : "bg-zinc-50/30 dark:bg-zinc-950/20"
                  }`}
                >
                  <td className="text-center font-mono py-2 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 font-bold select-none">{rowIdx + 1}</td>
                  {headers.map((_, colIdx) => (
                    <td 
                      key={colIdx} 
                      className={`px-3 py-2 border-r border-zinc-150 dark:border-zinc-800/60 font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[200px] ${
                        rowIdx === 0 ? "font-bold text-zinc-900 dark:text-white" : ""
                      }`}
                    >
                      {row[colIdx] || ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-[#090d16] p-8 space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-zinc-500">Membaca file data...</span>
      </div>
    );
  }

  // Load actual spreadsheet using Office Online Viewer for xlsx/xls with public URLs
  if (!isCsv && fileUrl && (fileUrl.startsWith("http://") || fileUrl.startsWith("https://"))) {
    return (
      <iframe
        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
        className="w-full h-full border-none rounded-xl bg-white"
        title={title}
      />
    );
  }

  return renderMockOrRealTable();
}

export default function FileDetailPanel({ selectedDoc, setShowRightPanel, handleDownload, documents, setDocuments, setSelectedDoc, onPreviewClick }: Props) {
  if (!selectedDoc) {
    return (
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg p-5 shadow-none overflow-hidden h-full flex flex-col items-center justify-center">
        <FileText className="w-10 h-10 text-zinc-300 dark:text-zinc-800 animate-pulse mb-2" />
        <span className="text-xs font-extrabold text-zinc-400 dark:text-zinc-600">Pilih berkas</span>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 max-w-[150px] leading-relaxed text-center">
          Pilih salah satu berkas di samping untuk melihat rincian metadata lengkap.
        </span>
      </Card>
    );
  }

  const handleDelete = () => {
    if (confirm("Apakah Sahabat yakin ingin menghapus berkas ini dari arsip digital?")) {
      const updated = documents.filter(d => d.id !== selectedDoc.id);
      setDocuments(updated);
      setSelectedDoc(updated[0] || null);
    }
  };

  // Parse JSON description if applicable to get fileUrl
  let fileUrl = "";
  let textDescription = selectedDoc.description || "";
  
  if (textDescription.startsWith("{")) {
    try {
      const parsed = JSON.parse(textDescription);
      fileUrl = parsed.fileUrl || "";
      textDescription = parsed.text || "";
    } catch (e) {
      // fallback
    }
  } else if (textDescription.startsWith("http://") || textDescription.startsWith("https://")) {
    fileUrl = textDescription;
    textDescription = "Dokumen eksternal yang diarsip secara digital.";
  }

  const getCleanExtension = (url: string) => {
    try {
      const cleanUrl = url.split(/[?#]/)[0].toLowerCase();
      return cleanUrl.substring(cleanUrl.lastIndexOf('.')) || "";
    } catch (e) {
      return "";
    }
  };

  const ext = getCleanExtension(fileUrl);
  const titleLower = selectedDoc.title.toLowerCase();
  
  const isImage = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext) || fileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || titleLower.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || titleLower.includes("logo") || titleLower.includes("gambar") || titleLower.includes("foto") || titleLower.includes("logopmii");
  const isPdf = ext === ".pdf" || titleLower.endsWith(".pdf") || titleLower.includes("kuesioner") || titleLower.includes("dokumen") || titleLower.includes("sdgs") || titleLower.includes("kaderisasi") || titleLower.includes("aktif") || titleLower.includes("cv");
  const isExcel = ext === ".xlsx" || ext === ".xls" || ext === ".csv" || titleLower.endsWith(".xlsx") || titleLower.endsWith(".xls") || titleLower.endsWith(".csv") || titleLower.includes("bayar") || titleLower.includes("data") || titleLower.includes("rekap") || titleLower.includes("nilai") || titleLower.includes("siakad") || titleLower.includes("database") || titleLower.includes("bquxjob") || titleLower.includes("looker");
  const isWord = ext === ".docx" || ext === ".doc" || titleLower.endsWith(".docx") || titleLower.endsWith(".doc") || titleLower.includes("surat") || titleLower.includes("project") || titleLower.includes("berjudul");
  const isJson = titleLower.endsWith(".json") || titleLower.includes("json") || titleLower.includes("history") || titleLower.includes("config");
  const isForm = titleLower.includes("kogniti") || titleLower.includes("kuesioner") || titleLower.includes("analisis") || titleLower.includes("form");

  let fileType = "OTHER";
  if (isImage) fileType = "IMAGE";
  else if (isForm) fileType = "FORM";
  else if (isPdf) fileType = "PDF";
  else if (isExcel) fileType = "EXCEL";
  else if (isWord) fileType = "WORD";
  else if (isJson) fileType = "JSON";

  const renderDetailPreview = () => {
    // 1. If a real URL is present, render actual live content viewport
    if (fileUrl && (fileUrl.startsWith("http://") || fileUrl.startsWith("https://"))) {
      if (isImage) {
        return (
          <img 
            src={fileUrl} 
            alt={selectedDoc.title} 
            className="max-w-full max-h-full object-contain p-2" 
          />
        );
      }
      if (isPdf) {
        return (
          <iframe 
            src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full border-none pointer-events-none scale-90 origin-top bg-white select-none"
            title={selectedDoc.title}
            scrolling="no"
          />
        );
      }
      if (isExcel || isWord) {
        return (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
            className="w-full h-full border-none pointer-events-none scale-75 origin-top bg-white select-none"
            title={selectedDoc.title}
            scrolling="no"
          />
        );
      }
    }

    // 2. Fallbacks for sample/dummy local files
    if (fileType === "IMAGE") {
      const isPmiiLogo = titleLower.includes("logopmii") || titleLower.includes("logo");
      return isPmiiLogo ? (
        <svg width="60" height="70" viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md select-none">
          <path d="M5 20C15 20 20 5 30 5C40 5 45 20 55 20C55 20 55 28 50 32C45 36 30 38 30 38C30 38 15 36 10 32C5 28 5 20 5 20Z" fill="#FBBF24" />
          <circle cx="15" cy="18" r="1.5" fill="white" />
          <circle cx="22.5" cy="15" r="1.5" fill="white" />
          <circle cx="30" cy="13" r="1.8" fill="white" />
          <circle cx="37.5" cy="15" r="1.5" fill="white" />
          <circle cx="45" cy="18" r="1.5" fill="white" />
          <path d="M10 32C30 32 30 38 30 38C30 38 30 32 50 32C50 32 52 50 30 65C8 50 10 32 10 32Z" fill="#1E3A8A" />
          <text x="30" y="50" fill="#FBBF24" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.5">PMII</text>
        </svg>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-1 text-amber-500">
          <FileText className="w-8 h-8 opacity-80" />
        </div>
      );
    }

    if (fileType === "FORM" || titleLower.includes("kogniti") || titleLower.includes("kuesioner")) {
      return (
        <div className="w-full h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 p-2 select-none text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#7248b9]" />
          <div className="w-full h-full bg-white dark:bg-[#0c1222] border border-zinc-200 dark:border-zinc-800 rounded-md p-2 mt-1 shadow-2xs flex flex-col space-y-2.5 overflow-hidden">
            <div className="border-b border-purple-100 dark:border-purple-950 pb-1.5 space-y-0.5">
              <div className="text-[6.5px] font-black text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                Analisis Preferensi Kognitif & Arah Karier Mahasiswa
              </div>
              <div className="text-[4px] text-red-500 font-bold">* Menunjukkan pertanyaan wajib</div>
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="space-y-0.5">
                <div className="text-[5px] font-bold text-zinc-700 dark:text-zinc-300">Nama Lengkap *</div>
                <div className="h-0.5 border-b border-dotted border-zinc-300 dark:border-zinc-700 w-11/12" />
              </div>
              <div className="space-y-0.5">
                <div className="text-[5px] font-bold text-zinc-700 dark:text-zinc-300">Kampus *</div>
                <div className="h-0.5 border-b border-dotted border-zinc-300 dark:border-zinc-700 w-11/12" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (fileType === "EXCEL") {
      const isSiakad = titleLower.includes("siakad") || titleLower.includes("kaderisasi") || titleLower.includes("anggota");
      return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-[#0c1222] select-none border-b border-zinc-100 dark:border-zinc-900 rounded-md p-1.5 overflow-hidden">
          {isSiakad ? (
            <div className="flex-1 flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-sm overflow-hidden bg-white dark:bg-[#0b1329]">
              <div className="bg-[#0a2a5c] h-3 px-1 text-[4px] font-bold text-white flex items-center justify-between border-b border-zinc-300 dark:border-zinc-800 select-none">
                <div className="w-[12%] text-center border-r border-white/20">No</div>
                <div className="w-[28%] pl-0.5 border-r border-white/20 truncate">Nama Lengkap</div>
                <div className="w-[20%] text-center border-r border-white/20 truncate">PKD/PKL</div>
                <div className="w-[20%] text-center border-r border-white/20 truncate">Cabang</div>
                <div className="w-[20%] text-center truncate">Status</div>
              </div>
              <div className="flex-1 flex flex-col justify-between py-0.5">
                {[
                  { no: "1", nama: "Achmad Shodiq", level: "PKD", cabang: "Ciputat", status: "Kader" },
                  { no: "2", nama: "Farida Hanim", level: "PKL", cabang: "Malang", status: "Pengurus" },
                  { no: "3", nama: "Zainal Abidin", level: "PKD", cabang: "Surabaya", status: "Kader" }
                ].map((row, idx) => (
                  <div 
                    key={idx} 
                    className="h-2.5 px-1 text-[3.8px] font-medium flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900/60 bg-white dark:bg-zinc-950"
                  >
                    <div className="w-[12%] text-center text-zinc-500 font-mono border-r border-zinc-100 dark:border-zinc-900">{row.no}</div>
                    <div className="w-[28%] pl-0.5 font-bold text-zinc-800 dark:text-zinc-200 border-r border-zinc-100 dark:border-zinc-900 truncate">{row.nama}</div>
                    <div className="w-[20%] text-center text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-900">{row.level}</div>
                    <div className="w-[20%] text-center text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-900 truncate">{row.cabang}</div>
                    <div className="w-[20%] text-center text-emerald-600 font-bold">{row.status}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-sm overflow-hidden bg-white dark:bg-[#0b1329]">
              <div className="grid grid-cols-5 gap-0.5 border-b border-zinc-200 dark:border-zinc-800 text-[4px] font-bold text-zinc-400 dark:text-zinc-500 text-center pb-0.5 bg-zinc-50 dark:bg-zinc-900">
                <div className="py-0.5 border-r border-zinc-200 dark:border-zinc-800">A</div>
                <div className="py-0.5 border-r border-zinc-200 dark:border-zinc-800">B</div>
                <div className="py-0.5 border-r border-zinc-200 dark:border-zinc-800">C</div>
                <div className="py-0.5 border-r border-zinc-200 dark:border-zinc-800">D</div>
                <div className="py-0.5">E</div>
              </div>
              <div className="flex-1 grid grid-cols-5 gap-px bg-zinc-100 dark:bg-zinc-800/80 p-0.5">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white dark:bg-zinc-950 flex items-center justify-center text-[4px] font-semibold text-zinc-700 dark:text-zinc-300 truncate px-0.5 h-2.5 border border-zinc-50"
                  >
                    {idx === 0 ? "id" : idx === 1 ? "username" : idx === 2 ? "amount" : idx === 3 ? "date" : idx === 4 ? "status" : ""}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (fileType === "PDF") {
      const isCv = titleLower.includes("cv") || titleLower.includes("akhir") || titleLower.includes("najhan") || titleLower.includes("atifa");
      return (
        <div className="w-full h-full flex bg-zinc-50 dark:bg-zinc-950 p-1.5 select-none overflow-hidden">
          {isCv ? (
            <div className="flex-1 bg-white dark:bg-[#0b1329] border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-2xs p-2 flex flex-col justify-between text-left overflow-hidden">
              <div className="border-b border-zinc-150 dark:border-zinc-800 pb-1 flex justify-between items-start">
                <div className="text-[6.5px] font-black text-zinc-900 dark:text-white truncate max-w-[80px]">CV Akhie Najhan.pdf</div>
                <div className="text-[4.5px] bg-red-100 text-red-700 px-1 py-0.2 rounded-xs font-black">PDF</div>
              </div>
              <div className="space-y-0.5 mt-1 border-b border-zinc-100 dark:border-zinc-900 pb-1">
                <div className="text-[4px] font-black text-pmii-blue dark:text-pmii-gold">PROFIL</div>
                <p className="text-[3px] text-zinc-500 leading-normal line-clamp-2">
                  Saya adalah seorang mahasiswa semester 7 Program Studi Ilmu Komputer...
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white dark:bg-[#0b1329] border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-2xs p-2 flex flex-col justify-between text-left overflow-hidden">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-1 text-center font-bold text-[5px] text-rose-500 tracking-wider">
                SURAT RESMI CABANG PMII
              </div>
              <div className="space-y-1 pt-1.5 flex-1">
                <div className="h-0.5 bg-zinc-300 dark:bg-zinc-800 rounded-full w-2/3" />
                <div className="h-0.5 bg-zinc-200 dark:bg-zinc-900 rounded-full w-full" />
              </div>
            </div>
          )}
        </div>
      );
    }

    if (fileType === "WORD") {
      return (
        <div className="w-full h-full flex bg-zinc-50 dark:bg-zinc-950 p-1.5 select-none overflow-hidden">
          <div className="flex-1 bg-white dark:bg-[#0b1329] border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-2xs p-2 flex flex-col justify-between text-left overflow-hidden">
            <div className="border-b border-zinc-150 dark:border-zinc-800 pb-1 text-left font-bold text-[6px] text-blue-500 tracking-wide truncate">
              {selectedDoc.title}
            </div>
            <div className="space-y-1 pt-1 flex-1">
              <div className="h-0.5 bg-zinc-300 dark:bg-zinc-800 rounded-full w-1/3" />
              <div className="h-0.5 bg-zinc-200 dark:bg-zinc-900 rounded-full w-full" />
            </div>
          </div>
        </div>
      );
    }

    if (fileType === "JSON") {
      return (
        <div className="w-full h-full flex bg-zinc-50 dark:bg-zinc-950 p-1.5 select-none overflow-hidden">
          <div className="flex-1 bg-white dark:bg-[#0b1329] border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-2xs p-1.5 flex flex-col justify-between text-left overflow-hidden">
            <div className="font-mono text-[3.8px] leading-normal text-zinc-500 flex-1 overflow-hidden space-y-0.5">
              <div><span className="text-purple-600 font-bold">{"{"}</span></div>
              <div className="pl-1.5"><span className="text-blue-600">"applet_id"</span>: <span className="text-green-600">"8cb113f"</span></div>
              <div><span className="text-purple-600 font-bold">{"}"}</span></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-4">
        <FileText className="w-8 h-8 text-zinc-400" />
        <span className="text-[9px] text-zinc-400 font-mono mt-1">{selectedDoc.code}</span>
      </div>
    );
  };

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg p-5 shadow-none overflow-hidden relative">
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block font-mono">Detail File</span>
          <button onClick={() => setShowRightPanel(false)} className="w-6 h-6 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors border-none cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-40 w-full bg-white dark:bg-[#0c1222] rounded-xl flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-800 relative shadow-inner group/preview">
          {renderDetailPreview()}
        </div>

        <div className="space-y-3.5">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-zinc-800 dark:text-white leading-relaxed">{selectedDoc.title}</h3>
            <CategoryBadge category={selectedDoc.category} />
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 text-justify border-t border-zinc-100 dark:border-zinc-800 pt-3">{textDescription}</p>
          
          <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-3.5 text-[10px] font-sans">
            <div className="flex justify-between"><span className="text-zinc-400 font-bold uppercase tracking-wider">Akses</span><span><AccessBadge access={selectedDoc.access} /></span></div>
            <div className="flex justify-between"><span className="text-zinc-400 font-bold uppercase tracking-wider">Tahun</span><span className="font-bold font-mono text-zinc-700 dark:text-zinc-300">{selectedDoc.year}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400 font-bold uppercase tracking-wider">Ukuran</span><span className="font-semibold font-mono text-zinc-700 dark:text-zinc-300">{selectedDoc.size}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400 font-bold uppercase tracking-wider">Arsipir</span><span className="font-semibold text-zinc-700 dark:text-zinc-300">{selectedDoc.uploader}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400 font-bold uppercase tracking-wider">Tanggal</span><span className="font-semibold text-zinc-700 dark:text-zinc-300">{selectedDoc.uploadedDate}</span></div>
          </div>
        </div>

        <div className="space-y-2.5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800">
          <Button 
            onClick={onPreviewClick}
            className="w-full bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-white font-bold text-xs py-2 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Eye className="w-4 h-4" /> Pratinjau Berkas
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => handleDownload(selectedDoc.id)} className="bg-pmii-blue text-white dark:bg-pmii-gold dark:text-[#090d16] font-bold text-xs rounded-xl border-none">
              <Download className="w-4 h-4 mr-1.5" /> Unduh
            </Button>
            <Button variant="outline" onClick={handleDelete} className="rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 text-xs font-bold">
              <Trash2 className="w-4 h-4 mr-1.5" /> Hapus
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}