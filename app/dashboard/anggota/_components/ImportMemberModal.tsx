"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileCheck,
  RefreshCw,
  Users,
  Info,
  KeyRound,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import type { Member } from "./types";

export interface ImportAccountSettings {
  createAccounts: boolean;
  passwordType: "custom" | "nik" | "birthdate";
  customPassword: string;
}

interface ImportMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    newMembers: Partial<Member>[],
    accountSettings: ImportAccountSettings
  ) => Promise<void>;
  defaultKomisariat?: string;
  currentMemberCount: number;
}

interface ParsedRow {
  rowNumber: number;
  data: Partial<Member>;
  isValid: boolean;
  error?: string;
}

const TEMPLATE_HEADERS = [
  "Nama Lengkap",
  "Gender",
  "Tingkat Kaderisasi",
  "Komisariat",
  "Angkatan",
  "Status",
  "Jabatan",
  "Email",
  "No HP",
  "NIK",
  "Tempat Lahir",
  "Tanggal Lahir",
  "Perguruan Tinggi",
  "Fakultas",
  "Jurusan",
  "Golongan Darah",
  "Alamat Rumah"
];

const SAMPLE_ROWS = [
  {
    "Nama Lengkap": "Ahmad Fauzi",
    Gender: "Laki-laki",
    "Tingkat Kaderisasi": "MAPABA",
    Komisariat: "PK PMII Ki Ageng Getas Pendawa",
    Angkatan: "2025",
    Status: "Aktif",
    Jabatan: "Anggota",
    Email: "fauzi@pmii.id",
    "No HP": "081234567890",
    NIK: "3324011234560001",
    "Tempat Lahir": "Kendal",
    "Tanggal Lahir": "2003-05-14",
    "Perguruan Tinggi": "Universitas Sains Al-Qur'an",
    Fakultas: "Tarbiyah",
    Jurusan: "Pendidikan Agama Islam",
    "Golongan Darah": "O",
    "Alamat Rumah": "Jl. Pemuda No. 12, Kendal"
  },
  {
    "Nama Lengkap": "Siti Nur Halimah",
    Gender: "Perempuan",
    "Tingkat Kaderisasi": "PKD",
    Komisariat: "PK PMII Ki Ageng Getas Pendawa",
    Angkatan: "2024",
    Status: "Aktif",
    Jabatan: "Kader",
    Email: "siti.nur@pmii.id",
    "No HP": "089876543210",
    NIK: "3324015678900002",
    "Tempat Lahir": "Semarang",
    "Tanggal Lahir": "2002-11-20",
    "Perguruan Tinggi": "Universitas Sains Al-Qur'an",
    Fakultas: "Ekonomi dan Bisnis",
    Jurusan: "Manajemen",
    "Golongan Darah": "A",
    "Alamat Rumah": "Desa Sukorejo RT 02/03"
  }
];

// Helper parsing tanggal Excel (baik angka serial maupun string)
function parseExcelDate(val: any): string {
  if (!val) return "";
  if (typeof val === "number") {
    try {
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }
    } catch {
      // fallback
    }
  }

  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  // format dd/mm/yyyy atau dd-mm-yyyy
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  return str;
}

export default function ImportMemberModal({
  isOpen,
  onClose,
  onImport,
  defaultKomisariat = "PK PMII Ki Ageng Getas Pendawa",
  currentMemberCount
}: ImportMemberModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings Pembuatan Akun Login Otomatis
  const [createAccounts, setCreateAccounts] = useState<boolean>(true);
  const [passwordType, setPasswordType] = useState<"custom" | "nik" | "birthdate">("custom");
  const [customPassword, setCustomPassword] = useState<string>("pmii1960");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  if (!isOpen) return null;

  // Unduh Template Excel
  const handleDownloadTemplate = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(SAMPLE_ROWS, {
        header: TEMPLATE_HEADERS
      });

      const colWidths = TEMPLATE_HEADERS.map((h) => {
        let maxLen = h.length;
        SAMPLE_ROWS.forEach((r) => {
          const val = String((r as any)[h] || "");
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: maxLen + 4 };
      });
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Format Import Kader");
      XLSX.writeFile(workbook, "Template_Import_Kader_PMII.xlsx");
    } catch (err) {
      console.error("Gagal membuat template excel", err);
    }
  };

  // Parsing file excel dengan Smart Column Extraction & Auto-Header Detection
  const processExcelFile = async (uploadedFile: File) => {
    setIsLoading(true);
    setFile(uploadedFile);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Baca raw 2D array untuk mencari baris header yang sesungguhnya
      const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ""
      });

      if (!sheetData || sheetData.length === 0) {
        setParsedRows([]);
        setIsLoading(false);
        return;
      }

      // Cari baris header (baris yang memiliki kata 'nama', 'name', 'nik', atau 'gender')
      let headerRowIndex = 0;
      for (let r = 0; r < Math.min(sheetData.length, 6); r++) {
        const rowStr = sheetData[r].map((c) => String(c).toLowerCase()).join(" ");
        if (rowStr.includes("nama") || rowStr.includes("name") || rowStr.includes("nik")) {
          headerRowIndex = r;
          break;
        }
      }

      const headers = sheetData[headerRowIndex].map((h: any) => String(h || "").trim());
      const dataRows = sheetData.slice(headerRowIndex + 1);

      // Kamus sinonim kolom bahasa Indonesia & standar PMII
      const SYNONYMS = {
        name: [
          "nama lengkap",
          "nama",
          "nama kader",
          "nama peserta",
          "nama mahasiswa",
          "fullname",
          "nama_lengkap",
          "nama lengkap kader",
          "nama anggota",
          "name"
        ],
        gender: [
          "gender",
          "jenis kelamin",
          "jk",
          "sex",
          "l/p",
          "jenis_kelamin",
          "j_k",
          "jenis-kelamin"
        ],
        nik: [
          "nik",
          "no ktp",
          "nomor ktp",
          "no. ktp",
          "no_ktp",
          "nomor identitas",
          "no identitas",
          "ktp",
          "nik/ktp",
          "nik / no ktp",
          "no. identitas"
        ],
        nipa: [
          "nipa",
          "nta",
          "nipa/nta",
          "no anggota",
          "nomor anggota",
          "no. anggota",
          "nomor induk",
          "nipa_nta",
          "no_nipa",
          "nta/nipa"
        ],
        phone: [
          "no hp",
          "no wa",
          "whatsapp",
          "no whatsapp",
          "telepon",
          "no telepon",
          "no. hp",
          "no. wa",
          "nomor hp",
          "nomor whatsapp",
          "phone",
          "kontak",
          "telp",
          "handphone",
          "hp",
          "no_hp",
          "no_wa"
        ],
        email: [
          "email",
          "surel",
          "e-mail",
          "alamat email",
          "alamat surel",
          "pos-el",
          "email_address"
        ],
        ttl: [
          "ttl",
          "tempat tanggal lahir",
          "tempat & tanggal lahir",
          "tempat, tanggal lahir",
          "tempat/tgl lahir",
          "tempat tgl lahir",
          "tempat_tanggal_lahir"
        ],
        tempatLahir: [
          "tempat lahir",
          "kota kelahiran",
          "tempat",
          "kota lahir",
          "tempat_lahir"
        ],
        tanggalLahir: [
          "tanggal lahir",
          "tgl lahir",
          "tgl_lahir",
          "birth date",
          "tgl",
          "tanggal",
          "tanggal_lahir"
        ],
        perguruanTinggi: [
          "perguruan tinggi",
          "kampus",
          "asal kampus",
          "universitas",
          "univ",
          "institut",
          "instansi",
          "pt",
          "nama kampus",
          "perguruan_tinggi",
          "universitas/institut",
          "asal perguruan tinggi"
        ],
        fakultas: [
          "fakultas",
          "fak",
          "fakultas/jurusan"
        ],
        jurusan: [
          "jurusan",
          "prodi",
          "program studi",
          "prodi/jurusan",
          "jurusan/prodi",
          "departemen"
        ],
        alamatRumah: [
          "alamat rumah",
          "alamat",
          "domisili",
          "alamat asal",
          "alamat domisili",
          "tempat tinggal",
          "asal daerah",
          "alamat_rumah",
          "alamat_domisili"
        ],
        golonganDarah: [
          "golongan darah",
          "gol darah",
          "goldar",
          "gol_darah",
          "golongan_darah",
          "blood",
          "gol. darah"
        ],
        riwayatPenyakit: [
          "riwayat penyakit",
          "penyakit",
          "catatan kesehatan",
          "riwayat_penyakit"
        ],
        level: [
          "tingkat kaderisasi",
          "tingkat",
          "jenjang",
          "level",
          "kaderisasi",
          "tingkat_kaderisasi"
        ],
        angkatan: [
          "angkatan",
          "tahun angkatan",
          "tahun",
          "thn",
          "tahun_angkatan"
        ],
        komisariat: [
          "komisariat",
          "pk",
          "rayon",
          "pr",
          "pimpinan komisariat",
          "asal komisariat"
        ],
        jabatan: [
          "jabatan",
          "role",
          "status kepengurusan",
          "posisi"
        ]
      };

      // Buat pemetaan index kolom header ke field
      const headerIndexMap: Record<string, number> = {};
      headers.forEach((headerText, colIdx) => {
        if (!headerText) return;
        const cleanHeader = headerText
          .toLowerCase()
          .replace(/[_\-\.]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        for (const [field, synonymList] of Object.entries(SYNONYMS)) {
          if (headerIndexMap[field] === undefined) {
            for (const syn of synonymList) {
              if (cleanHeader === syn || cleanHeader.includes(syn)) {
                headerIndexMap[field] = colIdx;
                break;
              }
            }
          }
        }
      });

      const rows: ParsedRow[] = [];

      dataRows.forEach((rowArr, rowIdx) => {
        // Jika seluruh baris kosong, lewati
        const hasAnyValue = rowArr.some((c) => String(c || "").trim() !== "");
        if (!hasAnyValue) return;

        const getColVal = (field: string): any => {
          const colIdx = headerIndexMap[field];
          if (colIdx !== undefined && rowArr[colIdx] !== undefined) {
            return rowArr[colIdx];
          }
          return "";
        };

        const rawName = String(getColVal("name") || "").trim();
        let name = rawName;
        // Bersihkan gelar atau prefix nomor baris jika ada
        name = name.replace(/^\d+[\.\)]\s*/, "");

        // Gender
        let gender = String(getColVal("gender") || "").trim();
        if (gender) {
          const lower = gender.toLowerCase();
          if (lower.startsWith("l") || lower.includes("pria") || lower.includes("laki")) {
            gender = "Laki-laki";
          } else if (lower.startsWith("p") || lower.includes("wanita") || lower.includes("perempuan")) {
            gender = "Perempuan";
          } else {
            gender = "Laki-laki";
          }
        } else {
          gender = "Laki-laki";
        }

        // Tingkat Kaderisasi
        let level = String(getColVal("level") || "").trim().toUpperCase();
        if (!["MAPABA", "PKD", "PKL", "PKN"].includes(level)) {
          if (level.includes("MAPABA")) level = "MAPABA";
          else if (level.includes("PKD")) level = "PKD";
          else if (level.includes("PKL")) level = "PKL";
          else if (level.includes("PKN")) level = "PKN";
          else level = "MAPABA";
        }

        // Komisariat & Angkatan
        const komisariat = String(getColVal("komisariat") || "").trim() || defaultKomisariat;
        const angkatan = String(getColVal("angkatan") || "").trim() || String(new Date().getFullYear());

        // Status & Jabatan
        let status = String(getColVal("status") || "").trim();
        if (!["Aktif", "Alumni", "Pasif"].includes(status)) {
          status = "Aktif";
        }
        const jabatan = String(getColVal("jabatan") || "").trim() || "Anggota";

        // Kontak
        let email = String(getColVal("email") || "").trim();
        let phone = String(getColVal("phone") || "").trim().replace(/[^\d+]/g, "");
        if (phone.startsWith("62")) phone = "0" + phone.slice(2);

        // NIK & NIPA
        const nik = String(getColVal("nik") || "").trim().replace(/\D/g, "");
        const nipa = String(getColVal("nipa") || "").trim();

        // TTL Parsing
        let tempatLahir = String(getColVal("tempatLahir") || "").trim();
        let tanggalLahir = parseExcelDate(getColVal("tanggalLahir"));

        const ttlRaw = String(getColVal("ttl") || "").trim();
        if (ttlRaw && (!tempatLahir || !tanggalLahir)) {
          if (ttlRaw.includes(",")) {
            const parts = ttlRaw.split(",");
            if (!tempatLahir) tempatLahir = parts[0].trim();
            if (!tanggalLahir && parts[1]) tanggalLahir = parseExcelDate(parts[1].trim());
          } else if (ttlRaw.includes("-")) {
            const parts = ttlRaw.split("-");
            if (parts.length === 2) {
              if (!tempatLahir) tempatLahir = parts[0].trim();
              if (!tanggalLahir) tanggalLahir = parseExcelDate(parts[1].trim());
            }
          }
        }

        // Akademik & Profil
        const perguruanTinggi = String(getColVal("perguruanTinggi") || "").trim();
        const fakultas = String(getColVal("fakultas") || "").trim();
        const jurusan = String(getColVal("jurusan") || "").trim();
        const alamatRumah = String(getColVal("alamatRumah") || "").trim();
        let golonganDarah = String(getColVal("golonganDarah") || "").trim().toUpperCase();
        if (!["A", "B", "AB", "O"].includes(golonganDarah)) {
          golonganDarah = "O";
        }
        const riwayatPenyakit = String(getColVal("riwayatPenyakit") || "").trim();

        // Validasi Baris
        const isValid = Boolean(name && name.length >= 2);
        const error = !isValid ? "Nama lengkap kosong" : undefined;

        const memberData: Partial<Member> = {
          name,
          gender: gender as any,
          level: level as any,
          komisariat,
          angkatan,
          status: status as any,
          jabatan,
          email,
          phone,
          nik,
          nipa,
          tempatLahir,
          tanggalLahir,
          perguruanTinggi,
          fakultas,
          jurusan,
          alamatRumah,
          alamatDomisili: alamatRumah,
          golonganDarah,
          riwayatPenyakit
        };

        rows.push({
          rowNumber: headerRowIndex + 1 + rows.length + 1,
          data: memberData,
          isValid,
          error
        });
      });

      setParsedRows(rows);
    } catch (err) {
      console.error("Gagal memproses file Excel:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processExcelFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processExcelFile(droppedFile);
    }
  };

  const handleResetFile = () => {
    setFile(null);
    setParsedRows([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const handleSubmit = async () => {
    if (validRows.length === 0) return;
    setIsSubmitting(true);
    try {
      await onImport(validRows.map((r) => r.data), {
        createAccounts,
        passwordType,
        customPassword: customPassword.trim() || "pmii1960"
      });
      onClose();
      handleResetFile();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-zinc-900 dark:text-zinc-100">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Import Data Anggota via Excel
              </h2>
              <p className="text-[11px] text-zinc-500">
                Unggah spreadsheet (.xlsx, .xls) untuk mendaftarkan kader dan membuat akun login sekaligus
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4.5">
          {/* STEP 1: Belum Ada File */}
          {!file && (
            <div className="space-y-4">
              {/* Template Download Card */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-blue-950 dark:text-blue-200">
                      Gunakan Format Spreadsheet Resmi PMII
                    </p>
                    <p className="text-[11px] text-blue-700/80 dark:text-blue-400 leading-relaxed">
                      Unduh template resmi agar seluruh kolom (NIK, No HP, Kampus, TTL, Jurusan) langsung terbaca utuh oleh sistem.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleDownloadTemplate}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-medium border-blue-300 dark:border-blue-700 bg-white dark:bg-zinc-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template Excel</span>
                </Button>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                    : "border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                    Pilih atau seret berkas spreadsheet Anda ke sini
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Sistem otomatis mendeteksi kolom Nama, NIK, No WA, Kampus, TTL, dan lainnya secara cerdas.
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 shadow-2xs">
                  Pilih Berkas Komputer
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: File Telah Dipilih & Sedang/Selesai Diparsing */}
          {file && (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} baris data terbaca
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFile}
                  disabled={isLoading || isSubmitting}
                  className="h-7 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer px-2"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  <span>Ganti Berkas</span>
                </Button>
              </div>

              {/* Status Validasi */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                      Total Baris
                    </span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      {parsedRows.length}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                      Siap Diimpor
                    </span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      {validRows.length} Kader
                    </span>
                  </div>
                </div>

                {invalidRows.length > 0 && (
                  <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/20 flex items-center gap-2.5 col-span-2 sm:col-span-1">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider block">
                        Dilewati (Error)
                      </span>
                      <span className="text-sm font-bold text-rose-700 dark:text-rose-300">
                        {invalidRows.length} Baris
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* FITUR OTOMATIS BUATKAN AKUN LOGIN */}
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                        Otomatis Buatkan Akun Login Pengguna
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Aktifkan agar seluruh anggota yang diimpor dapat langsung masuk ke portal kader
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={createAccounts}
                      onChange={(e) => setCreateAccounts(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {createAccounts && (
                  <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/40 space-y-3">
                    <div>
                      <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                        Pilihan Kata Sandi (Password) Login Bawaan:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPasswordType("custom")}
                          className={`p-2.5 rounded-lg text-left border text-xs cursor-pointer transition-all ${
                            passwordType === "custom"
                              ? "bg-white dark:bg-zinc-900 border-blue-600 text-blue-700 dark:text-blue-300 shadow-2xs"
                              : "bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold mb-0.5">
                            <span className={`w-2 h-2 rounded-full ${passwordType === "custom" ? "bg-blue-600" : "bg-zinc-400"}`} />
                            <span>Password Seragam</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 block">
                            Kata sandi sama untuk semua
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPasswordType("nik")}
                          className={`p-2.5 rounded-lg text-left border text-xs cursor-pointer transition-all ${
                            passwordType === "nik"
                              ? "bg-white dark:bg-zinc-900 border-blue-600 text-blue-700 dark:text-blue-300 shadow-2xs"
                              : "bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold mb-0.5">
                            <span className={`w-2 h-2 rounded-full ${passwordType === "nik" ? "bg-blue-600" : "bg-zinc-400"}`} />
                            <span>Nomor NIK KTP</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 block">
                            Password = 16 digit NIK kader
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPasswordType("birthdate")}
                          className={`p-2.5 rounded-lg text-left border text-xs cursor-pointer transition-all ${
                            passwordType === "birthdate"
                              ? "bg-white dark:bg-zinc-900 border-blue-600 text-blue-700 dark:text-blue-300 shadow-2xs"
                              : "bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold mb-0.5">
                            <span className={`w-2 h-2 rounded-full ${passwordType === "birthdate" ? "bg-blue-600" : "bg-zinc-400"}`} />
                            <span>Tanggal Lahir</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 block">
                            Format angka DDMMYYYY
                          </span>
                        </button>
                      </div>
                    </div>

                    {passwordType === "custom" && (
                      <div className="space-y-1 max-w-xs">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Masukkan Password Bawaan:
                        </label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={customPassword}
                            onChange={(e) => setCustomPassword(e.target.value)}
                            placeholder="Contoh: pmii1960"
                            className="text-xs h-8 bg-white dark:bg-zinc-900 pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="p-2.5 rounded-lg bg-blue-100/50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        Kader dapat login melalui halaman <strong>/login</strong> menggunakan <strong>Email</strong>, <strong>NIPA</strong>, <strong>NIK</strong>, ataupun <strong>No HP/WA</strong>.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Preview Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                    Pratinjau Kolom Data Terbaca ({validRows.length} Valid)
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Menampilkan 5 baris pertama
                  </span>
                </div>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-zinc-50 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="px-3 py-2 text-center w-10">#</th>
                          <th className="px-3 py-2">Nama Lengkap</th>
                          <th className="px-3 py-2">Gender</th>
                          <th className="px-3 py-2">NIK</th>
                          <th className="px-3 py-2">No HP / WA</th>
                          <th className="px-3 py-2">Perguruan Tinggi</th>
                          <th className="px-3 py-2">Jurusan</th>
                          <th className="px-3 py-2">TTL</th>
                          <th className="px-3 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                        {parsedRows.slice(0, 5).map((r, i) => (
                          <tr
                            key={i}
                            className={
                              !r.isValid
                                ? "bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300"
                                : "hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40"
                            }
                          >
                            <td className="px-3 py-2 text-center font-mono text-[10px] text-zinc-400">
                              {r.rowNumber}
                            </td>
                            <td className="px-3 py-2 font-medium">
                              {r.data.name || (
                                <span className="text-rose-500 italic text-[11px]">
                                  Nama Kosong
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">
                              {r.data.gender}
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                              {r.data.nik || "-"}
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                              {r.data.phone || "-"}
                            </td>
                            <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300 truncate max-w-[140px]">
                              {r.data.perguruanTinggi || "-"}
                            </td>
                            <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300 truncate max-w-[120px]">
                              {r.data.jurusan || "-"}
                            </td>
                            <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300 truncate max-w-[130px]">
                              {r.data.tempatLahir ? `${r.data.tempatLahir}, ${r.data.tanggalLahir || ""}` : (r.data.tanggalLahir || "-")}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {r.isValid ? (
                                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-semibold text-rose-500">
                                  {r.error}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {parsedRows.length > 5 && (
                  <p className="text-[11px] text-center text-zinc-400 pt-1">
                    ... dan {parsedRows.length - 5} baris data kader lainnya siap diproses.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8.5 px-4 text-xs font-medium border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
          >
            Batal
          </Button>

          {file && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={validRows.length === 0 || isSubmitting}
              className="h-8.5 px-4 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 border-none cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? "Menyimpan & Membuat Akun..."
                  : `Impor Sekarang (${validRows.length} Kader)`}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
